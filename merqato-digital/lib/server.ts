import { timingSafeEqual } from 'node:crypto';
import { database } from './neon-db';
import { defaultSite, normalizeSite, type SiteConfig } from './default-site';
const enc = new TextEncoder();
export const ownerEmail='merqato.digital@gmail.com';
export async function secretEqual(a:string,b:string){const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(a)),crypto.subtle.digest('SHA-256',enc.encode(b))]);return timingSafeEqual(Buffer.from(x),Buffer.from(y));}
export async function config():Promise<SiteConfig>{const rows=await database()`SELECT payload FROM site_settings WHERE id=1`;return rows[0]?normalizeSite(rows[0].payload):defaultSite;}
export async function saveConfig(site:SiteConfig){await database()`INSERT INTO site_settings(id,payload,updated_at) VALUES(1,${JSON.stringify(normalizeSite(site))}::jsonb,now()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at`;}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
export function originOk(req:Request){const origin=req.headers.get('origin');return !!origin && new URL(origin).host===new URL(req.url).host;}
export function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}
export async function digest(s:string){return b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));}
export async function hashPassword(p:string,salt:string){const key=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']);return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)));}
export function randomToken(){return b64(crypto.getRandomValues(new Uint8Array(32)));}
export async function session(req:Request){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)merqato_admin=([^;]+)/)?.[1];if(!token)return null;const rows=await database()`SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=${await digest(token)} AND s.expires_at>${Date.now()}`;return rows[0] as {id:string;email:string;role:string}|undefined||null;}
export function cookie(token:string,maxAge=604800){return `merqato_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export async function requireAdmin(req:Request){const u=await session(req);return u&&['owner','editor'].includes(u.role)?u:null;}
