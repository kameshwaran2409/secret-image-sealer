// Video Steganography Implementation using Frame-Based LSB
// Cross-Environment Compatible

import { encodeText, decodeText, calculateCapacity } from './steganography';

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  frameCount: number;
  fps: number;
}

/**
 * Creates a raw canvas for consistent pixel handling
 */
function createRawCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
    colorSpace: 'srgb',
  });
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.imageSmoothingEnabled = false;
  
  return { canvas, ctx };
}

/**
 * Extracts frames from a video file with consistent pixel handling
 */
export async function extractFrames(
  file: File,
  maxFrames: number = 30,
  onProgress?: (progress: number) => void
): Promise<{ frames: VideoFrame[]; metadata: VideoMetadata }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      const { canvas, ctx } = createRawCanvas(video.videoWidth, video.videoHeight);

      const duration = video.duration;
      const estimatedFps = 30;
      const totalFrames = Math.min(Math.floor(duration * estimatedFps), maxFrames);
      const frameInterval = duration / totalFrames;

      const frames: VideoFrame[] = [];
      let currentTime = 0;

      const captureFrame = (time: number): Promise<VideoFrame> => {
        return new Promise((res, rej) => {
          video.currentTime = time;
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            res({ imageData, timestamp: time });
          };
          video.onerror = () => rej(new Error('Failed to seek video'));
        });
      };

      try {
        for (let i = 0; i < totalFrames; i++) {
          const frame = await captureFrame(currentTime);
          frames.push(frame);
          currentTime += frameInterval;
          onProgress?.(((i + 1) / totalFrames) * 50);
        }

        URL.revokeObjectURL(url);

        resolve({
          frames,
          metadata: {
            width: video.videoWidth,
            height: video.videoHeight,
            duration,
            frameCount: frames.length,
            fps: totalFrames / duration,
          },
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

/**
 * Calculates total capacity across all frames
 */
export function calculateVideoCapacity(frames: VideoFrame[]): number {
  if (frames.length === 0) return 0;
  const frameCapacity = calculateCapacity(
    frames[0].imageData.width,
    frames[0].imageData.height
  );
  return frameCapacity;
}

/**
 * Encodes text into video frames (uses first frame only for reliability)
 */
export function encodeTextInFrames(
  frames: VideoFrame[],
  secretText: string,
  onProgress?: (progress: number) => void
): VideoFrame[] {
  if (frames.length === 0) {
    throw new Error('No frames to encode');
  }

  const capacity = calculateVideoCapacity(frames);
  if (secretText.length > capacity) {
    throw new Error(`Text too long. Maximum capacity: ${capacity} characters`);
  }

  const encodedFrames = frames.map((frame, index) => {
    if (index === 0) {
      const encodedImageData = encodeText(frame.imageData, secretText);
      onProgress?.(50 + (50 / frames.length));
      return { ...frame, imageData: encodedImageData };
    }
    onProgress?.(50 + ((index + 1) / frames.length) * 50);
    return frame;
  });

  return encodedFrames;
}

/**
 * Decodes text from video frames (checks first frame)
 */
export function decodeTextFromFrames(frames: VideoFrame[]): string {
  if (frames.length === 0) {
    throw new Error('No frames to decode');
  }

  try {
    return decodeText(frames[0].imageData);
  } catch {
    throw new Error('No hidden message found in this video');
  }
}

/**
 * Creates a PNG blob from encoded frame for lossless export
 */
export async function framesToVideoBlob(
  frames: VideoFrame[],
  fps: number = 30,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { canvas, ctx } = createRawCanvas(frames[0].imageData.width, frames[0].imageData.height);

  // Output as lossless PNG to preserve hidden data
  ctx.putImageData(frames[0].imageData, 0, 0);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onProgress?.(100);
          resolve(blob);
        } else {
          reject(new Error('Failed to create output'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Downloads video/frame blob
 */
export function downloadVideoBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Gets a thumbnail from a video file
 */
export function getVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const { canvas, ctx } = createRawCanvas(video.videoWidth, video.videoHeight);
      ctx.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}
