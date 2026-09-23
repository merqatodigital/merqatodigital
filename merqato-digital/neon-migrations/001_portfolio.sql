CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('current','completed','in_progress')),
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  project_url TEXT NOT NULL DEFAULT '',
  cover_media_id TEXT NOT NULL DEFAULT '',
  gallery_media_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_published_order ON portfolio_projects (published, sort_order);
