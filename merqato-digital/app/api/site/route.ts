import { config, json } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{return json(await config());}catch{return json({error:'Site content is temporarily unavailable'},503);}}
