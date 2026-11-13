import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import type { MediaType } from '../types/game';
import { getFirebaseHandles } from './firebase';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_DIM = 1400;
const MAX_FIRESTORE_IMAGE_BYTES = 450 * 1024; // keeps Firestore docs well under 1 MB

export interface CloudinaryConfig {
  cloudName?: string;
  uploadPreset?: string;
}

export async function compressImage(
  file: File,
  maxDim = MAX_IMAGE_DIM,
  quality = 0.78,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read selected image file.'));
    };

    img.src = objectUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read media file.'));
    reader.readAsDataURL(blob);
  });
}

async function uploadToCloudinary(
  payload: Blob,
  fileName: string,
  cloudName: string,
  uploadPreset: string,
  mediaType: MediaType,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName.trim())}/auto/upload`;
  const formData = new FormData();
  formData.append('file', payload, fileName);
  formData.append('upload_preset', uploadPreset.trim());

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          public_id?: string;
          error?: { message?: string };
        };
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          onProgress?.(100);
          resolve({
            mediaUrl: data.secure_url,
            mediaPath: `cloudinary/${data.public_id || Date.now()}`,
            mediaType,
          });
        } else {
          reject(
            new Error(
              data.error?.message ||
                'Cloudinary upload failed. Check your Cloud Name and Unsigned Preset.',
            ),
          );
        }
      } catch {
        reject(new Error('Invalid response from Cloudinary upload.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary.'));
    xhr.send(formData);
  });
}

export interface UploadResult {
  mediaUrl: string;
  mediaPath: string;
  mediaType: MediaType;
}

export async function uploadMediaFile(
  file: File,
  storageFolder: string,
  useDemoMode: boolean,
  onProgress?: (percent: number) => void,
  previousPath?: string,
  cloudinary?: CloudinaryConfig,
): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isVideo && !isImage) {
    throw new Error('Please choose a valid photo or video file.');
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error(
      'Video is larger than 50 MB. Please trim it or shoot a shorter clip.',
    );
  }

  const mediaType: MediaType = isVideo ? 'video' : 'image';
  const payload: Blob = isImage ? await compressImage(file) : file;

  // 1. Free Cloudinary unsigned upload (supports both photos and videos with zero credit card)
  if (cloudinary?.cloudName?.trim() && cloudinary?.uploadPreset?.trim()) {
    return uploadToCloudinary(
      payload,
      isImage ? 'upload.jpg' : file.name || 'video.mp4',
      cloudinary.cloudName,
      cloudinary.uploadPreset,
      mediaType,
      onProgress,
    );
  }

  // 2. Local Demo mode
  if (useDemoMode) {
    if (isVideo && file.size > 4 * 1024 * 1024) {
      throw new Error(
        'Local Demo mode stores media in browser storage (max 4 MB per video).',
      );
    }
    onProgress?.(45);
    const dataUrl = await blobToDataUrl(payload);
    onProgress?.(100);
    return {
      mediaUrl: dataUrl,
      mediaPath: `demo/${Date.now()}`,
      mediaType,
    };
  }

  const handles = getFirebaseHandles();
  if (!handles) {
    throw new Error('Firebase is not configured yet.');
  }

  // 3. Free Spark fallback for photos: store compressed JPEG directly in Firestore (no Storage bucket needed)
  if (isImage) {
    let compactBlob = await compressImage(file, 1080, 0.72);
    if (compactBlob.size > MAX_FIRESTORE_IMAGE_BYTES) {
      compactBlob = await compressImage(file, 880, 0.56);
    }
    onProgress?.(60);
    const dataUrl = await blobToDataUrl(compactBlob);
    onProgress?.(100);
    return {
      mediaUrl: dataUrl,
      mediaPath: `inline/${Date.now()}`,
      mediaType: 'image',
    };
  }

  // 4. Video without Cloudinary: attempt Firebase Storage if enabled, otherwise guide user to free Cloudinary
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const mediaPath = `${storageFolder}/${Date.now()}.${ext}`;
    const storageRef = ref(handles.storage, mediaPath);

    const mediaUrl = await new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, payload, {
        contentType: file.type || 'video/mp4',
      });

      task.on(
        'state_changed',
        (snap) => {
          if (snap.totalBytes > 0) {
            onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
          }
        },
        (err) => reject(err),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        },
      );
    });

    if (
      previousPath &&
      previousPath !== mediaPath &&
      !previousPath.startsWith('demo/') &&
      !previousPath.startsWith('inline/') &&
      !previousPath.startsWith('cloudinary/')
    ) {
      deleteObject(ref(handles.storage, previousPath)).catch(() => {
        // ignore cleanup failures
      });
    }

    return { mediaUrl, mediaPath, mediaType: 'video' };
  } catch {
    throw new Error(
      'Video uploads need a free Cloudinary preset in Admin -> Settings (Cloud Name + Unsigned Preset) since Firebase Storage is not enabled on this free project.',
    );
  }
}
