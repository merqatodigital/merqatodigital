import { database } from './neon-db';

export type ProjectLink = { label: string; url: string };

export type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  client: string;
  year: string;
  category: string;
  status: 'current' | 'completed' | 'in_progress';
  summary: string;
  body: string;
  /** Primary link, kept for backwards compatibility. Shown first in the UI. */
  projectUrl: string;
  /** Any number of extra labelled links: GitHub, Vercel, live site, case study… */
  links: ProjectLink[];
  /**
   * Image references. Each entry is either a media UUID (uploaded through the
   * admin) or a direct path/URL such as `/portfolio/guni-guni/cover.png`.
   */
  coverMediaId: string;
  galleryMediaIds: string[];
  published: boolean;
  sortOrder: number;
};

/** True when a reference is a static path or absolute URL rather than a media row id. */
export const isDirectRef = (ref: string) => /^(https?:)?\/\//i.test(ref) || ref.startsWith('/');

/** Resolve any image reference to something an <img src> can use. */
export const refToUrl = (ref: string) => (isDirectRef(ref) ? ref : `/api/media/${ref}`);

function parseLinks(value: unknown): ProjectLink[] {
  const raw = typeof value === 'string' ? safeJson(value) : value;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is ProjectLink => !!x && typeof x === 'object' && typeof (x as ProjectLink).url === 'string')
    .map(x => ({ label: String(x.label || 'Visit').slice(0, 60), url: String(x.url).slice(0, 500) }));
}

function safeJson(value: string) {
  try { return JSON.parse(value); } catch { return null; }
}

function parseIds(value: unknown): string[] {
  const raw = typeof value === 'string' ? safeJson(value) : value;
  return Array.isArray(raw) ? raw.filter(x => typeof x === 'string' && x) : [];
}

type Row = Record<string, unknown>;

function map(row: Row): PortfolioProject {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    client: String(row.client ?? ''),
    year: String(row.year ?? ''),
    category: String(row.category ?? ''),
    status: (row.status as PortfolioProject['status']) ?? 'in_progress',
    summary: String(row.summary ?? ''),
    body: String(row.body ?? ''),
    projectUrl: String(row.project_url ?? ''),
    links: parseLinks(row.links),
    coverMediaId: String(row.cover_media_id ?? ''),
    galleryMediaIds: parseIds(row.gallery_media_ids),
    published: row.published !== false,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

let schemaReady: Promise<void> | null = null;

/**
 * Self-healing schema. The hosted database is migrated by hand, so new columns
 * are applied lazily (and idempotently) on first use rather than leaving the
 * portfolio broken until someone remembers to run the SQL file.
 */
export function ensureSchema() {
  if (!schemaReady) {
    const sql = database();
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS portfolio_projects (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'in_progress',
        summary TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        project_url TEXT NOT NULL DEFAULT '',
        cover_media_id TEXT NOT NULL DEFAULT '',
        gallery_media_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        published BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS client TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS year TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE portfolio_projects ALTER COLUMN cover_media_id TYPE TEXT`;
    })().catch(e => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export async function listProjects(includeDrafts = false): Promise<PortfolioProject[]> {
  await ensureSchema();
  const sql = database();
  const rows = includeDrafts
    ? await sql`SELECT * FROM portfolio_projects ORDER BY sort_order, created_at`
    : await sql`SELECT * FROM portfolio_projects WHERE published = true ORDER BY sort_order, created_at`;
  return (rows as Row[]).map(map);
}

export async function getProject(slug: string): Promise<PortfolioProject | null> {
  const rows = await database()`SELECT * FROM portfolio_projects WHERE slug=${slug}`;
  return rows[0] ? map(rows[0] as Row) : null;
}

export async function saveProject(input: PortfolioProject): Promise<PortfolioProject> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`
    INSERT INTO portfolio_projects
      (id,title,slug,client,year,category,status,summary,body,project_url,links,cover_media_id,gallery_media_ids,published,sort_order,updated_at)
    VALUES
      (${input.id},${input.title},${input.slug},${input.client},${input.year},${input.category},${input.status},
       ${input.summary},${input.body},${input.projectUrl},${JSON.stringify(input.links)}::jsonb,
       ${input.coverMediaId},${JSON.stringify(input.galleryMediaIds)}::jsonb,${input.published},${input.sortOrder},now())
    ON CONFLICT (id) DO UPDATE SET
      title=excluded.title, slug=excluded.slug, client=excluded.client, year=excluded.year,
      category=excluded.category, status=excluded.status, summary=excluded.summary, body=excluded.body,
      project_url=excluded.project_url, links=excluded.links, cover_media_id=excluded.cover_media_id,
      gallery_media_ids=excluded.gallery_media_ids, published=excluded.published,
      sort_order=excluded.sort_order, updated_at=now()
    RETURNING *`;
  return map(rows[0] as Row);
}

export async function reorderProjects(order: string[]) {
  const sql = database();
  await Promise.all(order.map((id, i) => sql`UPDATE portfolio_projects SET sort_order=${i}, updated_at=now() WHERE id=${id}`));
}

export async function deleteProject(id: string) {
  await database()`DELETE FROM portfolio_projects WHERE id=${id}`;
}
