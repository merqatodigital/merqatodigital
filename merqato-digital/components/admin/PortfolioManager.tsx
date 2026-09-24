'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { refToUrl, type PortfolioProject, type ProjectLink } from '@/lib/portfolio';
import type { MediaItem } from '@/lib/default-site';
import { ACCEPT, uploadFiles } from '@/lib/client-upload';

type Health = {
  env: Record<string, unknown>;
  db: { ok: boolean; mediaRows?: number; projects?: number; error?: string };
  media: { ok: boolean; bucket?: string; error?: string; detail?: string };
  logo: { ok: boolean; bucket?: string; error?: string; detail?: string };
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);

const blank = (sortOrder: number): PortfolioProject => ({
  id: crypto.randomUUID(),
  title: '',
  slug: '',
  client: '',
  year: String(new Date().getFullYear()),
  category: '',
  status: 'in_progress',
  summary: '',
  body: '',
  projectUrl: '',
  links: [],
  coverMediaId: '',
  galleryMediaIds: [],
  published: false,
  sortOrder,
});

const LINK_PRESETS = ['GitHub repository', 'Live website', 'Vercel deployment', 'Case study', 'Figma design', 'Documentation'];

export default function PortfolioManager({ notify }: { notify: (message: string) => void }) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [saved, setSaved] = useState<Record<string, string>>({});   // id -> JSON snapshot
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);

  const snapshot = (list: PortfolioProject[]) =>
    Object.fromEntries(list.map(p => [p.id, JSON.stringify(p)]));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio?edit=1', { cache: 'no-store' });
      const data = await res.json() as { projects?: PortfolioProject[]; error?: string };
      if (!res.ok) throw new Error(data.error);
      const list = data.projects || [];
      setProjects(list);
      setSaved(snapshot(list));
    } catch (e) {
      notify((e as Error).message || 'Could not load the portfolio.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch('/api/media', { cache: 'no-store' });
      const data = await res.json() as { media?: MediaItem[] };
      if (res.ok && data.media) setLibrary(data.media);
    } catch { /* non-fatal */ }
  }, []);

  // Deferred so the initial fetch never sets state during the effect body.
  useEffect(() => {
    queueMicrotask(() => { load(); loadLibrary(); });
  }, [load, loadLibrary]);

  const patch = (id: string, changes: Partial<PortfolioProject>) =>
    setProjects(list => list.map(p => (p.id === id ? { ...p, ...changes } : p)));

  const isDirty = (p: PortfolioProject) => saved[p.id] !== JSON.stringify(p);
  const dirtyCount = projects.filter(isDirty).length;

  async function save(project: PortfolioProject) {
    if (!project.title.trim()) { notify('Give the project a name before saving.'); return; }
    const payload = { ...project, slug: project.slug || slugify(project.title) };
    setBusy(project.id);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { project?: PortfolioProject; error?: string };
      if (!res.ok || !data.project) throw new Error(data.error || 'Save failed');
      setProjects(list => list.map(p => (p.id === project.id ? data.project! : p)));
      setSaved(s => ({ ...s, [data.project!.id]: JSON.stringify(data.project) }));
      notify(`“${data.project.title}” saved${data.project.published ? ' and published' : ' as a draft'}.`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function saveAll() {
    for (const p of projects.filter(isDirty)) await save(p);
  }

  async function remove(project: PortfolioProject) {
    if (!confirm(`Delete “${project.title || 'Untitled'}” permanently? This cannot be undone.`)) return;
    const known = saved[project.id];
    if (!known) { setProjects(list => list.filter(p => p.id !== project.id)); return; }
    setBusy(project.id);
    try {
      const res = await fetch('/api/portfolio?id=' + encodeURIComponent(project.id), { method: 'DELETE' });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setProjects(list => list.filter(p => p.id !== project.id));
      notify('Project deleted.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  function add() {
    const p = blank(projects.length);
    setProjects(list => [...list, p]);
    setOpenId(p.id);
  }

  function duplicate(source: PortfolioProject) {
    const copy: PortfolioProject = {
      ...source,
      id: crypto.randomUUID(),
      title: source.title + ' (copy)',
      slug: slugify(source.slug + '-copy'),
      published: false,
      sortOrder: projects.length,
    };
    setProjects(list => [...list, copy]);
    setOpenId(copy.id);
  }

  async function move(index: number, delta: number) {
    const next = [...projects];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next.map((p, i) => ({ ...p, sortOrder: i }));
    setProjects(ordered);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: ordered.filter(p => saved[p.id]).map(p => p.id) }),
      });
      if (res.ok) setSaved(s => ({ ...s, ...snapshot(ordered.filter(p => saved[p.id])) }));
    } catch { /* order is still correct locally */ }
  }

  async function importStarter() {
    setBusy('seed');
    try {
      const res = await fetch('/api/portfolio/seed', { method: 'POST' });
      const data = await res.json() as { projects?: PortfolioProject[]; error?: string };
      if (!res.ok || !data.projects) throw new Error(data.error || 'Import failed');
      setProjects(data.projects);
      setSaved(snapshot(data.projects));
      notify('GUNI GUNI starter project imported with its images.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function runCheck() {
    setChecking(true);
    try {
      const res = await fetch('/api/media/health', { cache: 'no-store' });
      const data = await res.json() as Health & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setHealth(data);
      notify(data.media.ok && data.db.ok
        ? `Storage is healthy — images write to the “${data.media.bucket}” bucket.`
        : 'Storage check found a problem. See the details below.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p =>
      [p.title, p.client, p.category, p.summary, p.slug].join(' ').toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div className="studio-stack">
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Project portfolio</h2>
            <p>
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              {dirtyCount > 0 && <> · <strong>{dirtyCount} with unsaved changes</strong></>}
              . Upload images straight into a project, add as many links as you need, and publish when it&rsquo;s ready.
            </p>
          </div>
          <div className="head-actions">
            {dirtyCount > 1 && <button className="secondary" onClick={saveAll}>Save all ({dirtyCount})</button>}
            <button className="primary" onClick={add}>+ Add project</button>
          </div>
        </div>

        <div className="portfolio-toolbar">
          <input
            className="search"
            value={query}
            placeholder="Search projects by name, client or type…"
            onChange={e => setQuery(e.target.value)}
          />
          <button className="inline-button" onClick={() => { load(); loadLibrary(); }}>Refresh</button>
          <button className="inline-button" onClick={importStarter} disabled={busy === 'seed'}>
            {busy === 'seed' ? 'Importing…' : 'Import GUNI GUNI starter'}
          </button>
          <button className="inline-button" onClick={runCheck} disabled={checking}>
            {checking ? 'Checking…' : 'Test image storage'}
          </button>
        </div>

        {health && (
          <div className={'health-report ' + (health.media.ok && health.db.ok ? 'ok' : 'bad')}>
            <p><strong>Database:</strong> {health.db.ok
              ? `connected · ${health.db.mediaRows} media files · ${health.db.projects} projects`
              : `FAILED — ${health.db.error}`}</p>
            <p><strong>Image uploads:</strong> {health.media.ok
              ? `working · bucket “${health.media.bucket}”`
              : `FAILED — ${health.media.error} ${health.media.detail || ''}`}</p>
            <p><strong>Logo uploads:</strong> {health.logo.ok
              ? `working · bucket “${health.logo.bucket}”`
              : `FAILED — ${health.logo.error} ${health.logo.detail || ''}`}</p>
            {!health.media.ok && (
              <p className="health-hint">
                Fix: create the bucket shown above in your Neon/S3 storage, or set <code>MEDIA_BUCKET</code> to an
                existing bucket name in the environment variables, then run this test again.
              </p>
            )}
          </div>
        )}
      </section>

      {loading && <section className="panel"><p>Loading projects…</p></section>}

      {!loading && filtered.length === 0 && (
        <section className="panel empty-panel">
          <h3>{projects.length ? 'No project matches that search.' : 'No projects yet.'}</h3>
          <p>{projects.length
            ? 'Clear the search box to see everything.'
            : 'Add your first project, or import the GUNI GUNI case study to see how a finished entry looks.'}</p>
          {!projects.length && <button className="primary" onClick={importStarter}>Import GUNI GUNI starter</button>}
        </section>
      )}

      {filtered.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          index={projects.indexOf(project)}
          total={projects.length}
          open={openId === project.id}
          dirty={isDirty(project)}
          busy={busy === project.id}
          library={library}
          notify={notify}
          onToggle={() => setOpenId(openId === project.id ? null : project.id)}
          onPatch={changes => patch(project.id, changes)}
          onSave={() => save(project)}
          onDelete={() => remove(project)}
          onDuplicate={() => duplicate(project)}
          onMove={delta => move(projects.indexOf(project), delta)}
          onUploaded={items => { setLibrary(l => [...items, ...l]); }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProjectCard({
  project, index, total, open, dirty, busy, library, notify,
  onToggle, onPatch, onSave, onDelete, onDuplicate, onMove, onUploaded,
}: {
  project: PortfolioProject;
  index: number;
  total: number;
  open: boolean;
  dirty: boolean;
  busy: boolean;
  library: MediaItem[];
  notify: (m: string) => void;
  onToggle: () => void;
  onPatch: (changes: Partial<PortfolioProject>) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (delta: number) => void;
  onUploaded: (items: MediaItem[]) => void;
}) {
  const [uploading, setUploading] = useState('');
  const [dropping, setDropping] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const gallery = project.galleryMediaIds;
  const cover = project.coverMediaId || gallery[0] || '';

  async function handleFiles(list: FileList | File[] | null) {
    const files = Array.from(list || []);
    if (!files.length) return;
    setUploading(`Uploading 0 / ${files.length}…`);
    const { uploaded, errors } = await uploadFiles(files, p => {
      setUploading(`${p.note || 'Uploading'} ${Math.min(p.done + 1, p.total)} / ${p.total}${p.file ? ` · ${p.file}` : ''}`);
    });
    setUploading('');

    if (uploaded.length) {
      const ids = uploaded.map(m => m.id);
      onUploaded(uploaded);
      onPatch({
        galleryMediaIds: [...gallery, ...ids],
        coverMediaId: project.coverMediaId || ids[0],
      });
      notify(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded. Click “Save project” to publish the change.`);
    }
    if (errors.length) notify(errors.join(' · '));
  }

  function addByUrl() {
    const url = prompt('Paste an image URL, or a path to a file in /public (for example /portfolio/guni-guni/cover.png)');
    if (!url) return;
    const value = url.trim();
    if (!/^(https?:\/\/|\/)/i.test(value)) { notify('The address must start with https:// or /'); return; }
    onPatch({ galleryMediaIds: [...gallery, value], coverMediaId: project.coverMediaId || value });
  }

  const moveImage = (i: number, delta: number) => {
    const next = [...gallery];
    const target = i + delta;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    onPatch({ galleryMediaIds: next });
  };

  const removeImage = (ref: string) =>
    onPatch({
      galleryMediaIds: gallery.filter(x => x !== ref),
      coverMediaId: project.coverMediaId === ref ? '' : project.coverMediaId,
    });

  const setLink = (i: number, changes: Partial<ProjectLink>) =>
    onPatch({ links: project.links.map((l, j) => (j === i ? { ...l, ...changes } : l)) });

  return (
    <section className={'panel project-panel' + (open ? ' is-open' : '')}>
      <div className="project-head">
        <button className="project-title" onClick={onToggle} aria-expanded={open}>
          <span className="project-thumb">
            {cover ? <img src={refToUrl(cover)} alt="" /> : <span>{index + 1}</span>}
          </span>
          <span className="project-title-text">
            <strong>{project.title || 'Untitled project'}</strong>
            <small>
              {[project.client, project.category].filter(Boolean).join(' · ') || 'No client set'}
              {' · '}{gallery.length} image{gallery.length === 1 ? '' : 's'}
            </small>
          </span>
        </button>
        <div className="project-flags">
          {dirty && <span className="status-badge warn">Unsaved</span>}
          <span className={'status-badge ' + (project.published ? 'ok' : '')}>{project.published ? 'Live' : 'Draft'}</span>
          <button onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up" title="Move up">↑</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down" title="Move down">↓</button>
          <button onClick={onToggle}>{open ? 'Close' : 'Edit'}</button>
        </div>
      </div>

      {open && (
        <div className="project-body">
          <div className="fields two">
            <label className="field">
              <span>Project name</span>
              <input
                value={project.title}
                placeholder="GUNI GUNI — The Digital Footprint"
                onChange={e => {
                  const title = e.target.value;
                  const autoSlug = !project.slug || project.slug === slugify(project.title);
                  onPatch({ title, ...(autoSlug ? { slug: slugify(title) } : {}) });
                }}
              />
            </label>
            <label className="field">
              <span>URL slug</span>
              <input value={project.slug} placeholder="guni-guni-digital-footprint" onChange={e => onPatch({ slug: slugify(e.target.value) })} />
            </label>
            <label className="field">
              <span>Client</span>
              <input value={project.client} placeholder="GUNI GUNI Hostel & Bistro" onChange={e => onPatch({ client: e.target.value })} />
            </label>
            <label className="field">
              <span>Year</span>
              <input value={project.year} placeholder="2026" onChange={e => onPatch({ year: e.target.value })} />
            </label>
            <label className="field">
              <span>Type of work</span>
              <input value={project.category} placeholder="Hospitality platform · Web & back-office" onChange={e => onPatch({ category: e.target.value })} />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={project.status} onChange={e => onPatch({ status: e.target.value as PortfolioProject['status'] })}>
                <option value="current">Current</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Short summary — shown on the card</span>
            <textarea rows={3} value={project.summary} onChange={e => onPatch({ summary: e.target.value })} />
          </label>
          <label className="field">
            <span>Full story — leave a blank line between paragraphs</span>
            <textarea rows={8} value={project.body} onChange={e => onPatch({ body: e.target.value })} />
          </label>

          {/* -------- Images -------- */}
          <h3>Project images</h3>
          <div
            className={'drop-zone' + (dropping ? ' is-dropping' : '')}
            onDragOver={e => { e.preventDefault(); setDropping(true); }}
            onDragLeave={() => setDropping(false)}
            onDrop={e => { e.preventDefault(); setDropping(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPT}
              hidden
              onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            />
            <strong>{uploading || 'Drop photos here, or click to choose from your device'}</strong>
            <span>
              Select as many as you like · JPG, PNG, WebP, GIF, MP4, WebM ·
              large phone photos are automatically resized before upload
            </span>
          </div>

          <div className="image-actions">
            <button className="inline-button" onClick={addByUrl}>+ Add image by URL</button>
            <button className="inline-button" onClick={() => setShowLibrary(!showLibrary)}>
              {showLibrary ? 'Hide media library' : `Pick from media library (${library.length})`}
            </button>
          </div>

          {showLibrary && (
            <div className="media-picker">
              {library.map(m => (
                <label key={m.id} className="picker-item">
                  <input
                    type="checkbox"
                    checked={gallery.includes(m.id)}
                    onChange={e => onPatch({
                      galleryMediaIds: e.target.checked
                        ? [...gallery, m.id]
                        : gallery.filter(x => x !== m.id),
                    })}
                  />
                  {m.kind === 'image' ? <img src={m.url} alt="" /> : <span className="video-icon">VIDEO</span>}
                  <span>{m.filename}</span>
                </label>
              ))}
              {!library.length && <p>The library is empty. Upload something above.</p>}
            </div>
          )}

          {gallery.length > 0 && (
            <ol className="gallery-editor">
              {gallery.map((ref, i) => (
                <li key={ref + i} className={cover === ref ? 'is-cover' : ''}>
                  <img src={refToUrl(ref)} alt="" loading="lazy" />
                  <div className="gallery-tools">
                    <button onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move earlier">←</button>
                    <button onClick={() => moveImage(i, 1)} disabled={i === gallery.length - 1} title="Move later">→</button>
                    <button
                      onClick={() => onPatch({ coverMediaId: ref })}
                      disabled={cover === ref}
                      title="Use as the cover image"
                    >{cover === ref ? '★ Cover' : '☆ Cover'}</button>
                    <button className="danger" onClick={() => removeImage(ref)} title="Remove from this project">✕</button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* -------- Links -------- */}
          <h3>Project links</h3>
          <p className="field-hint">
            Add one row per destination — GitHub, Vercel, the live website, a case study. They appear as buttons on the card.
          </p>
          <label className="field">
            <span>Main link (optional)</span>
            <input value={project.projectUrl} placeholder="https://github.com/merqatodigital/guniguni" onChange={e => onPatch({ projectUrl: e.target.value })} />
          </label>

          {project.links.map((link, i) => (
            <div className="repeat-row" key={i}>
              <label className="field">
                <span>Label</span>
                <input value={link.label} list="link-presets" placeholder="GitHub repository" onChange={e => setLink(i, { label: e.target.value })} />
              </label>
              <label className="field">
                <span>URL</span>
                <input value={link.url} placeholder="https://…" onChange={e => setLink(i, { url: e.target.value })} />
              </label>
              <button className="danger" onClick={() => onPatch({ links: project.links.filter((_, j) => j !== i) })}>Delete</button>
            </div>
          ))}
          <datalist id="link-presets">{LINK_PRESETS.map(p => <option key={p} value={p} />)}</datalist>
          <button className="inline-button" onClick={() => onPatch({ links: [...project.links, { label: '', url: '' }] })}>
            + Add another link
          </button>

          {/* -------- Actions -------- */}
          <div className="portfolio-actions">
            <label className="toggle">
              <input type="checkbox" checked={project.published} onChange={e => onPatch({ published: e.target.checked })} />
              Show this project on the public site
            </label>
            <div className="action-buttons">
              <button className="inline-button" onClick={onDuplicate}>Duplicate</button>
              <button className="danger" onClick={onDelete} disabled={busy}>Delete project</button>
              <button className="primary" onClick={onSave} disabled={busy || !!uploading}>
                {busy ? 'Saving…' : dirty ? 'Save project' : 'Saved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
