import { json, requireAdmin } from '@/lib/server';
import { database } from '@/lib/neon-db';
import { checkStorage, imageBucket, logoBucket, StorageError } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

/**
 * Admin diagnostics: proves whether the database and each storage bucket are
 * actually writable, so a failing upload can be traced in seconds.
 */
export async function GET(req: Request) {
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AWS_ENDPOINT_URL_S3: !!process.env.AWS_ENDPOINT_URL_S3,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
    imageBucket: imageBucket(),
    logoBucket: logoBucket(),
  };

  const result = async (usage: 'media' | 'logo') => {
    try {
      const { bucket, readable } = await checkStorage(usage);
      return { ok: true, bucket, readable };
    } catch (e) {
      const err = e as StorageError;
      return { ok: false, bucket: err?.bucket || '', status: err?.status || 0, error: err?.message || String(e), detail: err?.detail || '' };
    }
  };

  let db: { ok: boolean; mediaRows?: number; projects?: number; error?: string };
  try {
    const rows = await database()`SELECT
      (SELECT count(*) FROM media) AS media_rows,
      (SELECT count(*) FROM portfolio_projects) AS projects`;
    const r = rows[0] as { media_rows: string; projects: string };
    db = { ok: true, mediaRows: Number(r.media_rows), projects: Number(r.projects) };
  } catch (e) {
    db = { ok: false, error: (e as Error).message };
  }

  return json({ env, db, media: await result('media'), logo: await result('logo') });
}
