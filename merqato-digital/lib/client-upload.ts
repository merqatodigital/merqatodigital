'use client';
import type { MediaItem } from './default-site';

const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',');

/** Longest edge kept for uploaded photography — plenty for full-screen viewing. */
const MAX_EDGE = 2400;
const TARGET_BYTES = 3 * MB;

export type UploadProgress = { file: string; done: number; total: number; note?: string };

function isHeic(file: File) {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

/**
 * Phone cameras produce 8–15 MB images that the server rejects. Re-encode in
 * the browser: downscale the longest edge and step quality down until the file
 * comfortably fits, converting to JPEG (or keeping PNG transparency).
 */
export async function prepareImage(file: File): Promise<File> {
  if (!IMAGE_TYPES.includes(file.type)) return file;
  if (file.type === 'image/gif') return file; // never re-encode animations
  if (file.size <= TARGET_BYTES) {
    // Small enough already — but still cap absurd pixel dimensions.
    if (file.size < 1.2 * MB) return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // browser cannot decode it; let the server decide
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  if (scale === 1 && file.size <= TARGET_BYTES) { bitmap.close(); return file; }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); return file; }
  ctx.imageSmoothingQuality = 'high';

  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
  if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outType = keepAlpha ? 'image/webp' : 'image/jpeg';
  for (const quality of [0.86, 0.78, 0.7, 0.6, 0.5]) {
    const blob = await canvasBlob(canvas, outType, quality);
    if (blob && blob.size <= TARGET_BYTES) {
      const ext = outType === 'image/webp' ? 'webp' : 'jpg';
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: outType });
    }
  }
  const fallback = await canvasBlob(canvas, 'image/jpeg', 0.45);
  return fallback
    ? new File([fallback], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
    : file;
}

/**
 * HTTP headers are ByteStrings — anything above char code 255 (em dashes,
 * accents, emoji, curly quotes in a filename) throws before the request is even
 * sent. Percent-encode the name and let the server decode it.
 */
const encodeFilename = (name: string) => encodeURIComponent(name);

/** Upload one already-prepared file. Throws with the server's message on failure. */
export async function uploadOne(file: File, usage: 'logo' | 'media' = 'media'): Promise<MediaItem> {
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      'X-File-Name': encodeFilename(file.name),
      ...(usage === 'logo' ? { 'X-Media-Usage': 'logo' } : {}),
    },
    body: file,
  });
  let data: { item?: MediaItem; error?: string } = {};
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok || !data.item) throw new Error(data.error || `Upload failed (HTTP ${res.status})`);
  return data.item;
}

export type UploadOutcome = { uploaded: MediaItem[]; errors: string[] };

/**
 * Upload a batch sequentially so a slow island connection does not open ten
 * parallel sockets. One bad file never aborts the rest.
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (p: UploadProgress) => void,
  usage: 'logo' | 'media' = 'media',
): Promise<UploadOutcome> {
  const uploaded: MediaItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const original = files[i];
    const report = (note?: string) => onProgress?.({ file: original.name, done: i, total: files.length, note });
    try {
      if (isHeic(original)) {
        throw new Error('HEIC photos from iPhone are not supported. Set Settings › Camera › Formats to "Most Compatible", or export the photo as JPEG.');
      }
      if (VIDEO_TYPES.includes(original.type) && original.size > 50 * MB) {
        throw new Error(`is ${(original.size / MB).toFixed(1)} MB — videos must be under 50 MB.`);
      }
      if (!IMAGE_TYPES.includes(original.type) && !VIDEO_TYPES.includes(original.type)) {
        throw new Error(`is a ${original.type || 'unknown'} file. Use JPG, PNG, WebP, GIF, MP4 or WebM.`);
      }

      report('Preparing…');
      const file = await prepareImage(original);
      report(file.size < original.size ? `Optimised to ${(file.size / MB).toFixed(1)} MB · uploading…` : 'Uploading…');
      uploaded.push(await uploadOne(file, usage));
    } catch (e) {
      const message = (e as Error).message;
      errors.push(message.startsWith(original.name) || message.startsWith('HEIC') ? message : `${original.name} ${message}`);
    }
  }

  onProgress?.({ file: '', done: files.length, total: files.length });
  return { uploaded, errors };
}
