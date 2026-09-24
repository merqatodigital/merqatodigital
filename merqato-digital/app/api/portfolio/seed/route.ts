import { json, originOk, requireAdmin } from '@/lib/server';
import { ensureSchema, listProjects, saveProject } from '@/lib/portfolio';
import { starterProjects } from '@/lib/seed-projects';

export const dynamic = 'force-dynamic';

/**
 * One-click import of the bundled starter project(s). Existing projects with
 * the same id keep their gallery — only empty fields are filled in.
 */
export async function POST(req: Request) {
  if (!originOk(req)) return json({ error: 'Invalid request origin' }, 403);
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  try {
    await ensureSchema();
    const existing = await listProjects(true);
    for (const seed of starterProjects) {
      const prior = existing.find(p => p.id === seed.id);
      await saveProject(prior
        ? {
            ...seed,
            coverMediaId: prior.coverMediaId || seed.coverMediaId,
            galleryMediaIds: prior.galleryMediaIds.length ? prior.galleryMediaIds : seed.galleryMediaIds,
            sortOrder: prior.sortOrder,
            published: prior.published,
          }
        : seed);
    }
    return json({ projects: await listProjects(true) });
  } catch (e) {
    console.error('Portfolio seed failed', e);
    return json({ error: `Could not import the starter project: ${(e as Error).message.slice(0, 200)}` }, 500);
  }
}
