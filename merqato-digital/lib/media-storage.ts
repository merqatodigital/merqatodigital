import { AwsClient } from 'aws4fetch';

export class StorageError extends Error {
  status: number;
  bucket: string;
  detail: string;
  constructor(message: string, status: number, bucket: string, detail = '') {
    super(message);
    this.name = 'StorageError';
    this.status = status;
    this.bucket = bucket;
    this.detail = detail;
  }
}

/**
 * Bucket names are configurable so a deployment that only provisioned a single
 * Neon/S3 bucket still works. `mediaBuckets()` returns every bucket we are
 * allowed to write to, in priority order, so an upload can fall back instead of
 * hard-failing when one of them does not exist.
 */
export function imageBucket() {
  return process.env.MEDIA_BUCKET || process.env.AWS_BUCKET || 'site-images';
}
export function logoBucket() {
  return process.env.LOGO_BUCKET || 'logos';
}

/** Candidate buckets, most preferred first, de-duplicated. */
export function bucketCandidates(usage: 'logo' | 'media') {
  const primary = usage === 'logo' ? logoBucket() : imageBucket();
  const secondary = usage === 'logo' ? imageBucket() : logoBucket();
  return [...new Set([primary, secondary].filter(Boolean))];
}

function storage() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new StorageError('Object storage is not configured on the server', 500, '', 'Missing AWS_ENDPOINT_URL_S3 / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY');
  }
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    client: new AwsClient({ accessKeyId, secretAccessKey, region, service: 's3' }),
  };
}

function url(endpoint: string, bucket: string, key: string) {
  return `${endpoint}/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function body(res: Response) {
  try {
    return (await res.text()).slice(0, 400).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

export async function putMedia(bucket: string, key: string, bytes: Uint8Array, type: string) {
  const { endpoint, client } = storage();
  let res: Response;
  try {
    res = await client.fetch(url(endpoint, bucket, key), {
      method: 'PUT',
      body: bytes as BodyInit,
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (e) {
    throw new StorageError(`Could not reach object storage`, 502, bucket, (e as Error).message);
  }
  if (!res.ok) throw new StorageError(`Storage rejected the upload (HTTP ${res.status})`, res.status, bucket, await body(res));
}

/**
 * Upload to the first bucket that accepts the object. Returns the bucket that
 * actually stored it so it can be recorded alongside the media row.
 */
export async function putMediaResilient(usage: 'logo' | 'media', key: string, bytes: Uint8Array, type: string) {
  const buckets = bucketCandidates(usage);
  const failures: StorageError[] = [];
  for (const bucket of buckets) {
    try {
      await putMedia(bucket, key, bytes, type);
      return bucket;
    } catch (e) {
      const err = e instanceof StorageError ? e : new StorageError((e as Error).message, 500, bucket);
      failures.push(err);
      // 404 = bucket missing, 403 = no permission on that bucket -> try the next one.
      // Anything else (413, 5xx, network) is not going to be fixed by another bucket.
      if (![403, 404].includes(err.status)) throw err;
    }
  }
  const first = failures[0];
  throw new StorageError(
    `No writable storage bucket. Tried: ${buckets.join(', ')}. ${first ? first.message : ''}`.trim(),
    first?.status ?? 500,
    buckets.join(','),
    failures.map(f => `${f.bucket}: ${f.status} ${f.detail}`).join(' | '),
  );
}

export async function getMedia(bucket: string, key: string) {
  const { endpoint, client } = storage();
  const res = await client.fetch(url(endpoint, bucket, key));
  if (res.status === 404) return null;
  if (!res.ok) throw new StorageError(`Storage download failed (HTTP ${res.status})`, res.status, bucket, await body(res));
  return new Uint8Array(await res.arrayBuffer());
}

/** Read an object, trying every known bucket (handles rows saved before the bucket column existed). */
export async function getMediaAnywhere(preferred: string, key: string) {
  const buckets = [...new Set([preferred, imageBucket(), logoBucket()].filter(Boolean))];
  for (const bucket of buckets) {
    try {
      const bytes = await getMedia(bucket, key);
      if (bytes) return { bytes, bucket };
    } catch (e) {
      if (!(e instanceof StorageError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  return null;
}

export async function deleteMedia(bucket: string, key: string) {
  const { endpoint, client } = storage();
  const res = await client.fetch(url(endpoint, bucket, key), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new StorageError(`Storage delete failed (HTTP ${res.status})`, res.status, bucket, await body(res));
}

/** Best-effort cleanup across every candidate bucket. Never throws. */
export async function deleteMediaEverywhere(preferred: string, key: string) {
  for (const bucket of [...new Set([preferred, imageBucket(), logoBucket()].filter(Boolean))]) {
    try { await deleteMedia(bucket, key); } catch { /* ignore */ }
  }
}

/** Round-trip check used by the admin storage diagnostics. */
export async function checkStorage(usage: 'logo' | 'media') {
  const key = `healthcheck/${crypto.randomUUID()}`;
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const bucket = await putMediaResilient(usage, key, bytes, 'application/octet-stream');
  const read = await getMedia(bucket, key);
  await deleteMedia(bucket, key).catch(() => {});
  return { bucket, readable: !!read && read.length === bytes.length };
}

export const mediaKey = (id: string) => `media/${id}`;
