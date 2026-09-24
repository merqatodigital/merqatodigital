import { config, json, originOk, requireAdmin, saveConfig } from '@/lib/server';
import { database } from '@/lib/neon-db';
import { deleteMediaEverywhere, getMediaAnywhere, mediaKey } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return new Response('Not found', { status: 404 });
  try {
    const rows = await database()`SELECT content_type,storage_bucket FROM media WHERE id=${id}`;
    const media = rows[0] as { content_type: string; storage_bucket: string } | undefined;
    if (!media) return new Response('Not found', { status: 404 });

    const found = await getMediaAnywhere(media.storage_bucket, mediaKey(id));
    if (!found) return new Response('Not found', { status: 404 });

    // Heal the row if the object actually lives in a different bucket.
    if (found.bucket !== media.storage_bucket) {
      try { await database()`UPDATE media SET storage_bucket=${found.bucket} WHERE id=${id}`; } catch { /* ignore */ }
    }

    return new Response(found.bytes as BodyInit, {
      headers: {
        'Content-Type': media.content_type,
        'Content-Length': String(found.bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Media read failed', e);
    return new Response('Unavailable', { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!originOk(req)) return json({ error: 'Invalid request origin' }, 403);
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  const { id } = await params;
  if (!isId(id)) return json({ error: 'Invalid media' }, 400);

  try {
    const sql = database();
    const rows = await sql`SELECT storage_bucket FROM media WHERE id=${id}`;
    if (!rows[0]) return json({ error: 'Media not found' }, 404);

    // Detach from the site config.
    try {
      const site = await config();
      site.media = site.media.filter(x => x.id !== id);
      if (site.logoId === id) site.logoId = '';
      if (site.heroMediaId === id) site.heroMediaId = '';
      site.sections.forEach(s => { s.mediaIds = s.mediaIds.filter(x => x !== id); });
      await saveConfig(site);
    } catch (e) {
      console.error('Could not detach media from site config', e);
    }

    // Detach from every portfolio project that referenced it.
    try {
      await sql`UPDATE portfolio_projects SET cover_media_id='' WHERE cover_media_id=${id}`;
      await sql`UPDATE portfolio_projects
                SET gallery_media_ids = COALESCE((
                  SELECT jsonb_agg(value) FROM jsonb_array_elements(gallery_media_ids) AS value
                  WHERE value <> to_jsonb(${id}::text)
                ), '[]'::jsonb)
                WHERE gallery_media_ids @> to_jsonb(${id}::text)`;
    } catch (e) {
      console.error('Could not detach media from portfolio', e);
    }

    await sql`DELETE FROM media WHERE id=${id}`;
    await deleteMediaEverywhere((rows[0] as { storage_bucket: string }).storage_bucket, mediaKey(id));
    return json({ ok: true });
  } catch (e) {
    console.error('Media delete failed', e);
    return json({ error: 'Could not delete media' }, 500);
  }
}
