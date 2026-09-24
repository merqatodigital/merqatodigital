-- First client: GUNI GUNI Hostel & Bistro, Puerto Princesa, Palawan.
-- Images are served from /public/portfolio/guni-guni so the project renders
-- even before anything is uploaded through the admin media library.

INSERT INTO portfolio_projects
  (id, title, slug, client, year, category, status, summary, body, project_url, links,
   cover_media_id, gallery_media_ids, published, sort_order)
VALUES (
  '7d3f2a10-8c41-4f6e-9a2b-1e5c7d9f0b33',
  'GUNI GUNI — The Digital Footprint',
  'guni-guni-digital-footprint',
  'GUNI GUNI Hostel & Bistro',
  '2026',
  'Hospitality platform · Web, ordering & back-office',
  'current',
  'A complete digital footprint for a much-loved Puerto Princesa bistro and hostel: editorial website, order-from-your-table flow, staff dashboard, back-office CMS, private costing and an AI host — delivered as a running repository instead of a slide deck.',
  E'GUNI GUNI already had the hardest thing to buy: a name people repeat. 8.8/10 across hundreds of Booking.com reviews, "Very good" on Tripadvisor, and guests who call the restaurant the biggest surprise of their trip. But that reputation lived on platforms someone else owns — the menu was a photo on social media, orders travelled by memory and paper, and margins were invisible until the end of the month.\n\nWe proposed one integrated platform in three layers. A guest experience: an editorial website with the full 75-dish menu across pasta, pizza, burgers, starters and the bar, plus an order-from-your-table flow with a live order-status page. An operations layer: a protected staff dashboard moving tickets from accept to prepare to ready to complete, with the 86-list and availability toggles. And a back-office CMS where the owner controls theme, fonts, pages, the menu editor, the media library, private recipe costing with margin analytics, and a one-click publish.\n\nOn top of it sits an AI virtual host guests can chat with, and an AI operations assistant for staff — briefings and low-stock calls grounded in the venue''s own menu and numbers.\n\nThe proposal itself is the product. Rather than a PDF, we shipped a running repository the client can read, run and evolve: React 19, TypeScript, Vite, Tailwind 4, Supabase-ready Postgres with row-level security, Deno edge functions, and a zero-dependency Node fallback so the whole thing can run on the bistro''s own PC with no monthly bill.',
  'https://github.com/merqatodigital/guniguni',
  '[{"label":"GitHub repository","url":"https://github.com/merqatodigital/guniguni"},
    {"label":"Full proposal","url":"https://github.com/merqatodigital/guniguni/blob/main/docs/PROPOSAL.md"},
    {"label":"Why GitHub is the proposal","url":"https://github.com/merqatodigital/guniguni/blob/main/docs/GITHUB-AS-PROPOSAL.md"},
    {"label":"Technical reference","url":"https://github.com/merqatodigital/guniguni/blob/main/docs/DEVELOPMENT.md"}]'::jsonb,
  '/portfolio/guni-guni/cover.png',
  '["/portfolio/guni-guni/cover.png","/portfolio/guni-guni/island-studio.png"]'::jsonb,
  true,
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = excluded.title,
  client = excluded.client,
  year = excluded.year,
  category = excluded.category,
  status = excluded.status,
  summary = excluded.summary,
  body = excluded.body,
  project_url = excluded.project_url,
  links = excluded.links,
  cover_media_id = CASE WHEN portfolio_projects.cover_media_id = '' THEN excluded.cover_media_id ELSE portfolio_projects.cover_media_id END,
  gallery_media_ids = CASE WHEN portfolio_projects.gallery_media_ids = '[]'::jsonb THEN excluded.gallery_media_ids ELSE portfolio_projects.gallery_media_ids END,
  updated_at = now();
