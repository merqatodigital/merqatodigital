import { config, json, originOk, requireAdmin, saveConfig } from '@/lib/server';
import { database } from '@/lib/neon-db';
import { mediaKey, putMediaResilient, deleteMediaEverywhere, StorageError } from '@/lib/media-storage';
import type { MediaItem } from '@/lib/default-site';

export const dynamic = 'force-dynamic';
// Uploads can be a few MB; give the handler room on platforms that honour this.
export const maxDuration = 60;

const MB = 1024 * 1024;
const types: Record<string, { kind: 'image' | 'video'; limit: number }> = {
  'image/png': { kind: 'image', limit: 12 * MB },
  'image/jpeg': { kind: 'image', limit: 12 * MB },
  'image/webp': { kind: 'image', limit: 12 * MB },
  'image/gif': { kind: 'image', limit: 12 * MB },
  'image/avif': { kind: 'image', limit: 12 * MB },
  'video/mp4': { kind: 'video', limit: 50 * MB },
  'video/webm': { kind: 'video', limit: 50 * MB },
};

function valid(bytes: Uint8Array, type: string) {
  const starts = (a: number[]) => a.every((v, i) => bytes[i] === v);
  const str = (i: number, n: number) => String.fromCharCode(...bytes.slice(i, i + n));
  switch (type) {
    case 'image/png': return starts([137, 80, 78, 71, 13, 10, 26, 10]);
    case 'image/jpeg': return starts([255, 216, 255]);
    case 'image/webp': return str(0, 4) === 'RIFF' && str(8, 4) === 'WEBP';
    case 'image/gif': return str(0, 3) === 'GIF';
    case 'image/avif': return str(4, 4) === 'ftyp';
    case 'video/mp4': return str(4, 4) === 'ftyp';
    case 'video/webm': return starts([26, 69, 223, 163]);
    default: return false;
  }
}

const toItem = (row: Record<string, unknown>): MediaItem => ({
  id: String(row.id),
  url: `/api/media/${row.id}`,
  kind: row.kind as 'image' | 'video',
  filename: String(row.filename),
  size: Number(row.size),
  contentType: String(row.content_type),
});

/**
 * The media table is the source of truth for the library. The site config JSON
 * is only a convenience mirror, so a stale/oversized config can never hide an
 * image that was uploaded successfully.
 */
export async function GET(req: Request) {
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  try {
    const rows = await database()`SELECT id,filename,content_type,size,kind FROM media ORDER BY created_at DESC`;
    return json({ media: rows.map(r => toItem(r as Record<string, unknown>)) });
  } catch (e) {
    console.error('Media list failed', e);
    return json({ error: 'Could not read the media library' }, 503);
  }
}

export async function POST(req: Request) {
  if (!originOk(req)) return json({ error: 'Invalid request origin' }, 403);
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);

  const type = (req.headers.get('content-type') || '').split(';')[0].toLowerCase();
  const def = types[type];
  const name = (req.headers.get('x-file-name') || 'upload').slice(0, 160);
  const usage = req.headers.get('x-media-usage') === 'logo' && def?.kind === 'image' ? 'logo' : 'media';

  if (!def) {
    const hint = /hei[cf]/i.test(type) || /\.hei[cf]$/i.test(name)
      ? 'iPhone HEIC photos are not supported. In Settings › Camera › Formats choose "Most Compatible", or share the photo as JPEG.'
      : `Unsupported file type "${type || 'unknown'}". Allowed: JPG, PNG, WebP, GIF, AVIF (12 MB) or MP4, WebM (50 MB).`;
    return json({ error: hint }, 400);
  }

  let id = '';
  let bucket = '';
  try {
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length) return json({ error: 'The file arrived empty. Try again.' }, 400);
    if (bytes.length > def.limit) {
      return json({ error: `${name} is ${(bytes.length / MB).toFixed(1)} MB — the maximum is ${def.limit / MB} MB for a ${def.kind}.` }, 413);
    }
    if (!valid(bytes, type)) return json({ error: `${name} does not look like a real ${type.split('/')[1].toUpperCase()} file.` }, 400);

    id = crypto.randomUUID();
    bucket = await putMediaResilient(usage, mediaKey(id), bytes, type);

    await database()`INSERT INTO media(id,filename,content_type,size,kind,storage_bucket) VALUES(${id},${name},${type},${bytes.length},${def.kind},${bucket})`;

    const item: MediaItem = { id, url: `/api/media/${id}`, kind: def.kind, filename: name, size: bytes.length, contentType: type };

    // Mirror into the site config. If this fails the upload still stands —
    // the media table and object storage already hold the file.
    let mirrored = true;
    let logoId: string | undefined;
    try {
      const site = await config();
      site.media = [...site.media.filter(m => m.id !== id), item];
      await saveConfig(site);
      logoId = site.logoId;
    } catch (e) {
      mirrored = false;
      console.error('Media saved but site config mirror failed', e);
    }

    return json({ item, logoId, bucket, mirrored });
  } catch (e) {
    const err = e as Partial<StorageError> & { message?: string };
    console.error('Upload failed', { name, type, bucket, status: err?.status, detail: err?.detail, message: err?.message });
    // Roll back so we never leave an orphan row or object behind.
    if (id) {
      await deleteMediaEverywhere(bucket, mediaKey(id));
      try { await database()`DELETE FROM media WHERE id=${id}`; } catch { /* ignore */ }
    }
    const message = err instanceof StorageError
      ? `${name}: ${err.message}${err.detail ? ` — ${err.detail}` : ''}`
      : `${name}: upload failed on the server. ${(err?.message || '').slice(0, 200)}`;
    return json({ error: message }, 500);
  }
}
