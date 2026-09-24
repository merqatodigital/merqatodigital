'use client';
import { useMemo, useState } from 'react';
import Lightbox, { type LightboxItem } from './Lightbox';
import { refToUrl, type PortfolioProject } from '@/lib/portfolio';
import type { SiteConfig } from '@/lib/default-site';

const STATUS_LABEL: Record<PortfolioProject['status'], string> = {
  current: 'Current',
  in_progress: 'In progress',
  completed: 'Completed',
};

const FILTERS = [
  { key: 'all', label: 'All work' },
  { key: 'current', label: 'Current' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
] as const;

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/** GitHub / Vercel / live-site links get a recognisable mark. */
function linkMark(url: string) {
  const h = hostOf(url);
  if (h.includes('github')) return 'GH';
  if (h.includes('vercel')) return '▲';
  if (h.includes('figma')) return 'Fi';
  if (h.includes('notion')) return 'N';
  return '↗';
}

export default function PortfolioSection({ site, projects }: { site: SiteConfig; projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ items: LightboxItem[]; index: number; title: string } | null>(null);

  /** A ref is either an uploaded media id or a static path; both resolve to a URL. */
  const resolve = useMemo(() => (ref: string): LightboxItem | null => {
    if (!ref) return null;
    const known = site.media.find(m => m.id === ref);
    return { url: refToUrl(ref), kind: known?.kind ?? 'image', caption: known?.filename };
  }, [site.media]);

  const visible = useMemo(
    () => projects.filter(p => filter === 'all' || p.status === filter),
    [projects, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    projects.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [projects]);

  if (!projects.length) return null;

  return (
    <section className="portfolio-section" id="projects">
      <div className="wrap">
        <div className="section-meta">
          <span>SELECTED WORK / MERQATO.DIGITAL</span>
          <span>{String(projects.length).padStart(2, '0')} {projects.length === 1 ? 'PROJECT' : 'PROJECTS'}</span>
        </div>

        <div className="portfolio-heading">
          <h2>Different businesses.<br /><em>Distinct digital worlds.</em></h2>
          <p>A look at what we&rsquo;re building, and what we&rsquo;ve made.</p>
        </div>

        {projects.length > 1 && (
          <div className="portfolio-filters" role="tablist" aria-label="Filter projects">
            {FILTERS.filter(f => counts[f.key]).map(f => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                className={filter === f.key ? 'is-active' : ''}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span>{counts[f.key] || 0}</span>
              </button>
            ))}
          </div>
        )}

        <div className="portfolio-grid">
          {visible.map((p, i) => {
            const gallery = [p.coverMediaId, ...p.galleryMediaIds]
              .filter((ref, idx, arr) => ref && arr.indexOf(ref) === idx)
              .map(resolve)
              .filter((x): x is LightboxItem => !!x);
            const cover = gallery[0];
            const expanded = open === p.id;
            const allLinks = [
              ...(p.projectUrl && !p.links.some(l => l.url === p.projectUrl)
                ? [{ label: 'View project', url: p.projectUrl }]
                : []),
              ...p.links,
            ];

            return (
              <article className={'portfolio-card' + (expanded ? ' is-open' : '')} key={p.id}>
                <button
                  type="button"
                  className="portfolio-cover"
                  onClick={() => cover && setViewer({ items: gallery, index: 0, title: p.title })}
                  aria-label={cover ? `Open ${p.title} gallery` : p.title}
                  disabled={!cover}
                >
                  {cover
                    ? <img src={cover.url} alt={`${p.title} cover`} loading="lazy" />
                    : <span className="portfolio-letter">{p.title}</span>}
                  <span className="portfolio-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className={'portfolio-status s-' + p.status}>{STATUS_LABEL[p.status]}</span>
                  {gallery.length > 1 && <span className="portfolio-shots">⤢ {gallery.length} images</span>}
                </button>

                <div className="portfolio-card-body">
                  <div className="portfolio-badges">
                    <span>{p.category || 'Digital'}</span>
                    <span>{[p.client, p.year].filter(Boolean).join(' · ')}</span>
                  </div>

                  <h3>{p.title}</h3>
                  <p className="portfolio-summary">{p.summary}</p>

                  {gallery.length > 1 && (
                    <div className="portfolio-strip">
                      {gallery.slice(0, 5).map((m, j) => (
                        <button key={m.url + j} onClick={() => setViewer({ items: gallery, index: j, title: p.title })} aria-label={`Open image ${j + 1}`}>
                          {m.kind === 'video' ? <span className="portfolio-strip-video">▶</span> : <img src={m.url} alt="" loading="lazy" />}
                        </button>
                      ))}
                      {gallery.length > 5 && (
                        <button className="portfolio-strip-more" onClick={() => setViewer({ items: gallery, index: 5, title: p.title })}>
                          +{gallery.length - 5}
                        </button>
                      )}
                    </div>
                  )}

                  {allLinks.length > 0 && (
                    <div className="portfolio-links">
                      {allLinks.map((l, j) => (
                        <a key={j} href={l.url} target="_blank" rel="noopener noreferrer" title={hostOf(l.url)}>
                          <span aria-hidden="true">{linkMark(l.url)}</span>{l.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {p.body && (
                    <>
                      <button
                        type="button"
                        className="portfolio-toggle"
                        onClick={() => setOpen(expanded ? null : p.id)}
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Hide project story' : 'Read the project story'}
                        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                      </button>
                      {expanded && (
                        <div className="portfolio-detail">
                          {p.body.split(/\n{2,}/).map((para, k) => <p key={k}>{para}</p>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {viewer && (
        <Lightbox
          items={viewer.items}
          index={viewer.index}
          title={viewer.title}
          onClose={() => setViewer(null)}
          onIndex={i => setViewer(v => (v ? { ...v, index: i } : v))}
        />
      )}
    </section>
  );
}
