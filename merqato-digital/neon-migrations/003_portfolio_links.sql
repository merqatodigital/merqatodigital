-- Portfolio: multiple labelled links (GitHub / Vercel / live site / case study…),
-- client + year metadata, and image refs that may be media UUIDs or static paths.

ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS links  JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS client TEXT  NOT NULL DEFAULT '';
ALTER TABLE portfolio_projects ADD COLUMN IF NOT EXISTS year   TEXT  NOT NULL DEFAULT '';

-- cover_media_id / gallery_media_ids now also accept '/portfolio/...' paths,
-- so widen the column in case it was ever constrained to a UUID length.
ALTER TABLE portfolio_projects ALTER COLUMN cover_media_id TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_portfolio_slug ON portfolio_projects (slug);
