import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadMediaFile } from '../mediaUpload';

class MockXHR {
  static lastInstance: MockXHR | null = null;
  url = '';
  method = '';
  timeout = 0;
  status = 200;
  responseText = '';
  upload: { onprogress: ((e: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  sentBody: FormData | null = null;

  constructor() {
    MockXHR.lastInstance = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: FormData) {
    this.sentBody = body;
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as ProgressEvent);
    this.status = 200;
    this.responseText = JSON.stringify({
      secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4',
      public_id: 'clip',
    });
    this.onload?.();
  }
}

describe('uploadMediaFile', () => {
  const OriginalXHR = globalThis.XMLHttpRequest;

  afterEach(() => {
    globalThis.XMLHttpRequest = OriginalXHR;
    vi.restoreAllMocks();
  });

  it('uploads video files directly to Cloudinary when cloudName and uploadPreset are provided', async () => {
    globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;

    const progressValues: number[] = [];
    const videoFile = new File(['fake-video-bytes'], 'clip.MOV', {
      type: '',
    });

    const result = await uploadMediaFile(
      videoFile,
      'submissions/t1/task1',
      false,
      (pct) => progressValues.push(pct),
      undefined,
      { cloudName: ' mycloud ', uploadPreset: ' crazy44 ' },
    );

    expect(MockXHR.lastInstance?.url).toBe(
      'https://api.cloudinary.com/v1_1/mycloud/auto/upload',
    );
    expect(MockXHR.lastInstance?.sentBody?.get('upload_preset')).toBe('crazy44');
    expect(result).toEqual({
      mediaUrl: 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4',
      mediaPath: 'cloudinary/clip',
      mediaType: 'video',
    });
    expect(progressValues).toContain(100);
  });

  it('rejects oversized videos above 50 MB', async () => {
    const bigFile = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(bigFile, 'size', { value: 55 * 1024 * 1024 });

    await expect(
      uploadMediaFile(bigFile, 'submissions/t1/task1', false, undefined, undefined, {
        cloudName: 'mycloud',
        uploadPreset: 'crazy44',
      }),
    ).rejects.toThrow(/50 MB/);
  });
});
