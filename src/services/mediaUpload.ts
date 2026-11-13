import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import type { MediaType } from '../types/game';
import { getFirebaseHandles } from './firebase';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_DIM = 1600;

export async function compressImage(
  file: File,
  maxDim = MAX_IMAGE_DIM,
  quality = 0.82,
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

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read media file.'));
    reader.readAsDataURL(blob);
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

  if (useDemoMode) {
    if (isVideo && file.size > 4 * 1024 * 1024) {
      throw new Error(
        'Local Demo mode stores media in browser storage (max 4 MB per video). Connect Firebase for up to 50 MB videos!',
      );
    }
    onProgress?.(45);
    const dataUrl = await fileToDataUrl(payload);
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

  const ext = isVideo
    ? file.name.split('.').pop()?.toLowerCase() || 'mp4'
    : 'jpg';
  const mediaPath = `${storageFolder}/${Date.now()}.${ext}`;
  const storageRef = ref(handles.storage, mediaPath);

  const mediaUrl = await new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, payload, {
      contentType: isVideo ? file.type || 'video/mp4' : 'image/jpeg',
    });

    task.on(
      'state_changed',
      (snap) => {
        if (snap.totalBytes > 0) {
          const pct = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100,
          );
          onProgress?.(pct);
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

  if (previousPath && previousPath !== mediaPath && !previousPath.startsWith('demo/')) {
    deleteObject(ref(handles.storage, previousPath)).catch(() => {
      // ignore cleanup failures
    });
  }

  return { mediaUrl, mediaPath, mediaType };
}
