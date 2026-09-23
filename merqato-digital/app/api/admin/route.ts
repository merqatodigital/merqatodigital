import { config, saveConfig, cookie, digest, hashPassword, json, originOk, ownerEmail, randomToken, requireAdmin, secretEqual, session } from '@/lib/server';
import { database } from '@/lib/neon-db';
import { fonts, type SiteConfig } from '@/lib/default-site';
export const dynamic='force-dynamic';
const emailOk=(s:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<255;
const safe=(s:unknown,max:number)=>typeof s==='string'?s.trim().slice(0,max):'';
export async function GET(req:Request){try{const user=await session(req);const rows=await database()`SELECT COUNT(*)::int AS n FROM users`;return json({user,setup:rows[0]?.n===0});}catch(e){console.error('Admin load failed',e);return json({error:'Admin is temporarily unavailable'},503);}}
export async function POST(req:Request){
 if(!originOk(req))return json({error:'Invalid request origin'},403);
 let data:Record<string,unknown>;try{data=await req.json() as Record<string,unknown>;}catch{return json({error:'Invalid request'},400);}
 try{
 const sql=database(),action=String(data.action||'');
 if(action==='setup'){
   const rows=await sql`SELECT COUNT(*)::int AS n FROM users`;if(rows[0]?.n)return json({error:'Setup has already been completed'},409);
   const passkey=String(data.passkey||''),expectedPasskey=process.env.ADMIN_PASSKEY||'';
   if(!expectedPasskey)return json({error:'Owner bootstrap is disabled on this deployment: set the ADMIN_PASSKEY environment variable first'},503);
   const authEmail=req.headers.get('oai-authenticated-user-email')?.toLowerCase();
   if((authEmail&&authEmail!==ownerEmail)||String(data.email).toLowerCase()!==ownerEmail||!await secretEqual(passkey,expectedPasskey))return json({error:'Owner email or passkey is incorrect'},403);
   const salt=randomToken(),id=crypto.randomUUID(),token=randomToken();
   await sql`INSERT INTO users(id,email,role,salt,password_hash) VALUES(${id},${ownerEmail},'owner',${salt},${await hashPassword(passkey,salt)})`;
   await sql`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(${await digest(token)},${id},${Date.now()+604800000})`;
   return new Response(JSON.stringify({ok:true,user:{id,email:ownerEmail,role:'owner'}}),{headers:{'Content-Type':'application/json','Set-Cookie':cookie(token),'Cache-Control':'no-store'}});
 }
 if(action==='login'){
   const email=safe(data.email,254).toLowerCase(),pass=String(data.password||'');
   const attempts=await sql`SELECT failures,window_start FROM login_attempts WHERE email=${email}`;const attempt=attempts[0] as {failures:number;window_start:number}|undefined;
   if(attempt&&Date.now()-attempt.window_start<900000&&attempt.failures>=5)return json({error:'Too many attempts. Try again in 15 minutes.'},429);
   const users=await sql`SELECT id,email,role,salt,password_hash FROM users WHERE email=${email}`;const user=users[0] as {id:string;email:string;role:string;salt:string;password_hash:string}|undefined;
   const actual=await hashPassword(pass,user?.salt||'invalid-salt');
   if(!user||actual!==user.password_hash){const n=attempt&&Date.now()-attempt.window_start<900000?attempt.failures+1:1;await sql`INSERT INTO login_attempts(email,failures,window_start) VALUES(${email},${n},${n===1?Date.now():attempt!.window_start}) ON CONFLICT(email) DO UPDATE SET failures=excluded.failures,window_start=excluded.window_start`;return json({error:'Email or password is incorrect'},401);}
   await sql`DELETE FROM login_attempts WHERE email=${email}`;const token=randomToken();await sql`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(${await digest(token)},${user.id},${Date.now()+604800000})`;
   return new Response(JSON.stringify({ok:true,user:{id:user.id,email:user.email,role:user.role}}),{headers:{'Content-Type':'application/json','Set-Cookie':cookie(token),'Cache-Control':'no-store'}});
 }
 const user=await requireAdmin(req);if(!user)return json({error:'Sign in required'},401);
 if(action==='logout'){const token=req.headers.get('cookie')?.match(/merqato_admin=([^;]+)/)?.[1];if(token)await sql`DELETE FROM sessions WHERE token_hash=${await digest(token)}`;return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Set-Cookie':cookie('',0)}});}
 if(action==='change-password'){
   const current=String(data.current||''),next=String(data.next||'');if(next.length<10||next.length>128)return json({error:'New password must be 10–128 characters'},400);
   const rows=await sql`SELECT salt,password_hash FROM users WHERE id=${user.id}`;const row=rows[0] as {salt:string;password_hash:string}|undefined;if(!row||await hashPassword(current,row.salt)!==row.password_hash)return json({error:'Current password is incorrect'},403);
   const salt=randomToken();await sql`UPDATE users SET salt=${salt},password_hash=${await hashPassword(next,salt)} WHERE id=${user.id}`;await sql`DELETE FROM sessions WHERE user_id=${user.id} AND token_hash<>${await digest(req.headers.get('cookie')?.match(/merqato_admin=([^;]+)/)?.[1]||'')}`;return json({ok:true});
 }
 if(action==='list-users'){if(user.role!=='owner')return json({error:'Owner only'},403);const rows=await sql`SELECT id,email,role,created_at FROM users ORDER BY created_at`;return json({users:rows});}
 if(action==='add-user'){
   if(user.role!=='owner')return json({error:'Owner only'},403);const email=safe(data.email,254).toLowerCase(),password=String(data.password||'');if(!emailOk(email)||password.length<10||password.length>128)return json({error:'Enter a valid email and a password of at least 10 characters'},400);
   const salt=randomToken();await sql`INSERT INTO users(id,email,role,salt,password_hash) VALUES(${crypto.randomUUID()},${email},'editor',${salt},${await hashPassword(password,salt)})`;return json({ok:true});
 }
 if(action==='delete-user'){if(user.role!=='owner')return json({error:'Owner only'},403);const id=String(data.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Invalid user'},400);const rows=await sql`SELECT role FROM users WHERE id=${id}`;if(!rows[0]||rows[0].role==='owner')return json({error:'Owner account cannot be removed'},400);await sql`DELETE FROM users WHERE id=${id}`;return json({ok:true});}
 if(action==='save'){
   const next=data.site as SiteConfig;if(!next||!Array.isArray(next.sections)||next.sections.length>30||!Array.isArray(next.nav)||next.nav.length>15||!next.palette||!next.fonts||!next.footer)return json({error:'Invalid site content'},400);
   if(!fonts.includes(next.fonts.heading)||!fonts.includes(next.fonts.body))return json({error:'Choose a font from the list'},400);
   const color=/^#[0-9a-fA-F]{6}$/;if(Object.values(next.palette).some(x=>typeof x!=='string'||!color.test(x)))return json({error:'Colors must be 6-digit hex values'},400);
   const old=await config(),saved:SiteConfig={...old,name:safe(next.name,100),descriptor:safe(next.descriptor,100),email:safe(next.email,254),location:safe(next.location,100),eyebrow:safe(next.eyebrow,100),headline:safe(next.headline,180),intro:safe(next.intro,500),heroButton:safe(next.heroButton,80),logoId:safe(next.logoId,100),heroMediaId:safe(next.heroMediaId,100),palette:next.palette,fonts:next.fonts,nav:next.nav.map(x=>({label:safe(x.label,40),sectionId:safe(x.sectionId,60)})),sections:next.sections.map(x=>({id:safe(x.id,60),type:['services','text','media','gallery'].includes(x.type)?x.type:'text',label:safe(x.label,100),title:safe(x.title,220),body:safe(x.body,2000),items:(Array.isArray(x.items)?x.items:[]).slice(0,20).map(i=>({title:safe(i.title,100),body:safe(i.body,500)})),mediaIds:(Array.isArray(x.mediaIds)?x.mediaIds:[]).slice(0,20).map(i=>safe(i,100)),visible:x.visible!==false})),footer:{headline:safe(next.footer.headline,140),description:safe(next.footer.description,400),copyright:safe(next.footer.copyright,100),links:(next.footer.links||[]).slice(0,10).map(x=>({label:safe(x.label,50),url:safe(x.url,300)}))}};
   if(!emailOk(saved.email))return json({error:'Enter a valid contact email'},400);
   if(saved.footer.links.some(x=>!(/^(https?:\/\/|mailto:|#)/i.test(x.url))))return json({error:'Footer links must start with https://, http://, mailto:, or #'},400);
   if(new Set(saved.sections.map(x=>x.id)).size!==saved.sections.length)return json({error:'Each section needs a unique ID'},400);
   const mediaIds=new Set(saved.media.map(x=>x.id));if(saved.logoId&&!mediaIds.has(saved.logoId)||saved.heroMediaId&&!mediaIds.has(saved.heroMediaId)||saved.sections.some(x=>x.mediaIds.some(id=>!mediaIds.has(id))))return json({error:'A selected image or video is missing'},400);
   await saveConfig(saved);return json({ok:true});
 }
 return json({error:'Unknown action'},400);
 }catch(e){console.error('Admin operation failed',e);return json({error:'Could not complete that action'},500);}
}
