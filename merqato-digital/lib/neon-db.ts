import { neon } from '@neondatabase/serverless';

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Neon DATABASE_URL is missing');
  return neon(url);
}
