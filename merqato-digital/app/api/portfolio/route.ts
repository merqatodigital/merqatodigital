import { listProjects, saveProject, deleteProject, reorderProjects, type PortfolioProject, type ProjectLink } from '@/lib/portfolio';
import { json, originOk, requireAdmin } from '@/lib/server';
import { starterProjects } from '@/lib/seed-projects';

export const dynamic = 'force-dynamic';

const clean = (x: unknown, n: number) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
const isHttp = (u: string) => /^https?:\/\//i.test(u);

/** Media refs are either a UUID or a site-relative/absolute image URL. */
const cleanRef = (x: unknown) => {
  const v = clean(x, 500);
  if (!v) return '';
  if (/^[0-9a-f-]{36}$/i.test(v)) return v;
  if (v.startsWith('/') || isHttp(v)) return v;
  return '';
};

function cleanLinks(raw: unknown): ProjectLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map(x => ({ label: clean((x as ProjectLink)?.label, 60) || 'Visit', url: clean((x as ProjectLink)?.url, 500) }))
    .filter(l => isHttp(l.url));
}

export async function GET(req: Request) {
  const edit = new URL(req.url).searchParams.get('edit') === '1';
  if (edit && !await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  try {
    return json({ projects: await listProjects(edit) });
  } catch (e) {
    console.error('Portfolio load failed', e);
    // Local preview without a database: PORTFOLIO_DEMO=1 serves the bundled starter data.
    if (process.env.PORTFOLIO_DEMO === '1') return json({ projects: starterProjects });
    return json({ error: `Portfolio is temporarily unavailable: ${(e as Error).message}` }, 503);
  }
}

export async function POST(req: Request) {
  if (!originOk(req)) return json({ error: 'Invalid request origin' }, 403);
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  try {
    const raw = await req.json() as Partial<PortfolioProject> & { reorder?: string[] };

    // Bulk reorder: { reorder: [id, id, ...] }
    if (Array.isArray(raw.reorder)) {
      await reorderProjects(raw.reorder.filter(id => /^[0-9a-f-]{36}$/i.test(id)));
      return json({ projects: await listProjects(true) });
    }

    const id = clean(raw.id, 36) || crypto.randomUUID();
    const title = clean(raw.title, 140);
    const slug = clean(raw.slug, 90).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const projectUrl = clean(raw.projectUrl, 500);

    if (!title) return json({ error: 'Give the project a name.' }, 400);
    if (!slug) return json({ error: 'Give the project a URL slug (letters, numbers and dashes).' }, 400);
    if (projectUrl && !isHttp(projectUrl)) return json({ error: 'The main project link must start with https:// or http://' }, 400);

    const status = (['current', 'completed', 'in_progress'] as const).includes(raw.status as never)
      ? raw.status as PortfolioProject['status']
      : 'in_progress';

    const input: PortfolioProject = {
      id,
      title,
      slug,
      client: clean(raw.client, 140),
      year: clean(raw.year, 20),
      category: clean(raw.category, 120),
      status,
      summary: clean(raw.summary, 500),
      body: clean(raw.body, 8000),
      projectUrl,
      links: cleanLinks(raw.links),
      coverMediaId: cleanRef(raw.coverMediaId),
      galleryMediaIds: Array.isArray(raw.galleryMediaIds)
        ? raw.galleryMediaIds.map(cleanRef).filter(Boolean).slice(0, 60)
        : [],
      published: raw.published !== false,
      sortOrder: Number.isSafeInteger(raw.sortOrder) ? raw.sortOrder! : 0,
    };

    return json({ project: await saveProject(input) });
  } catch (e) {
    const message = (e as Error).message || '';
    console.error('Portfolio save failed', e);
    if (/unique|duplicate/i.test(message)) return json({ error: 'That URL slug is already used by another project. Pick a different one.' }, 409);
    return json({ error: `Could not save this project: ${message.slice(0, 200)}` }, 500);
  }
}

export async function DELETE(req: Request) {
  if (!originOk(req)) return json({ error: 'Invalid request origin' }, 403);
  if (!await requireAdmin(req)) return json({ error: 'Sign in required' }, 401);
  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid project' }, 400);
    await deleteProject(id);
    return json({ ok: true });
  } catch (e) {
    console.error('Portfolio delete failed', e);
    return json({ error: 'Could not delete this project' }, 500);
  }
}
