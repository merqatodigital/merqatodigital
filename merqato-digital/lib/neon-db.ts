import { env } from 'cloudflare:workers';
import { neon } from '@neondatabase/serverless';

export function database() {
  const url = (env as unknown as { DATABASE_URL?: string }).DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Neon DATABASE_URL is missing');
  return neon(url);
}
