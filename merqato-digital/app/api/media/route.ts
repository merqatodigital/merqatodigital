import { config, json, originOk, requireAdmin, saveConfig } from '@/lib/server';
import { database } from '@/lib/neon-db';
import { mediaKey, signedUrl, putMedia, deleteMedia, getMedia } from '@/lib/media-storage';
import type { MediaItem } from '@/lib/default-site';
export const dynamic='force-dynamic';
const types:Record<string,{kind:'image'|'video';limit:number}>={'image/png':{kind:'image',limit:8*1024*1024},'image/jpeg':{kind:'image',limit:8*1024*1024},'image/webp':{kind:'image',limit:8*1024*1024},'image/gif':{kind:'image',limit:8*1024*1024},'video/mp4':{kind:'video',limit:50*1024*1024},'video/webm':{kind:'video',limit:50*1024*1024}};
function valid(bytes:Uint8Array,type:string){const starts=(a:number[])=>a.every((v,i)=>bytes[i]===v);const str=(i:number,n:number)=>String.fromCharCode(...bytes.slice(i,i+n));return type==='image/png'?starts([137,80,78,71,13,10,26,10]):type==='image/jpeg'?starts([255,216,255]):type==='image/webp'?str(0,4)==='RIFF'&&str(8,4)==='WEBP':type==='image/gif'?str(0,3)==='GIF':type==='video/mp4'?str(4,4)==='ftyp':type==='video/webm'?starts([26,69,223,163]):false;}
export async function POST(req:Request){
 if(!originOk(req))return json({error:'Invalid request origin'},403);if(!await requireAdmin(req))return json({error:'Sign in required'},401);
 const body=await req.json().catch(()=>({})) as any;
 const upload=body.uploading&&body.file;
 if(!upload&&!body.id){
  // Legacy: direct upload endpoint
  const type=(req.headers.get('content-type')||'').split(';')[0],def=types[type],name=(req.headers.get('x-file-name')||'upload').slice(0,160);
  if(!def)return json({error:'Allowed: JPG, PNG, WebP or GIF up to 8 MB; MP4 or WebM up to 50 MB.'},400);
  let id='',bucket='';
  try{const bytes=new Uint8Array(await req.arrayBuffer());if(!bytes.length||bytes.length>def.limit)return json({error:`Maximum ${def.kind==='image'?8:50} MB per file`},413);if(!valid(bytes,type))return json({error:'File contents do not match the selected format'},400);
   id=crypto.randomUUID();bucket=req.headers.get('x-media-usage')==='logo'&&def.kind==='image'?'logos':'site-images';await putMedia(bucket,mediaKey(id),bytes,type);
   const sql=database();await sql`INSERT INTO media(id,filename,content_type,size,kind,storage_bucket) VALUES(${id},${name},${type},${bytes.length},${def.kind},${bucket})`;
   const item:MediaItem={id,url:`/api/media/${id}`,kind:def.kind,filename:name,size:bytes.length,contentType:type};const site=await config();site.media.push(item);if(bucket==='logos')site.logoId=id;await saveConfig(site);return json({item,logoId:site.logoId});
  }catch(e){console.error('Upload failed',e);if(id&&bucket)try{await deleteMedia(bucket,mediaKey(id));}catch{}return json({error:'Upload failed. Try a smaller file.'},500);}
 }
 if(upload){
  const type=upload.type,def=types[type],name=upload.name.slice(0,160);
  if(!def)return json({error:'Allowed: JPG, PNG, WebP or GIF up to 8 MB; MP4 or WebM up to 50 MB.'},400);
  if(!upload.size||upload.size>def.limit)return json({error:`Maximum ${def.kind==='image'?8:50} MB per file`},413);
  let id='',bucket='';
  try{
   id=crypto.randomUUID();bucket=upload.asLogo&&def.kind==='image'?'logos':'site-images';
   const sig=signedUrl(bucket,mediaKey(id),type);
   const sql=database();await sql`INSERT INTO media(id,filename,content_type,size,kind,storage_bucket,storage_key) VALUES(${id},${name},${type},${upload.size},${def.kind},${bucket},${mediaKey(id)})`;
   const item:MediaItem={id,url:`/api/media/${id}`,kind:def.kind,filename:name,size:upload.size,contentType:type};const site=await config();site.media.push(item);if(bucket==='logos')site.logoId=id;await saveConfig(site);
   return json({item,logoId:site.logoId,signed:sig});
  }catch(e){console.error('Presign/upload failed',e);if(id&&bucket)try{await deleteMedia(bucket,mediaKey(id));}catch{}return json({error:'Upload failed. Try a smaller file.'},500);}
 }
 return json({error:'Invalid request'},400);
}
export async function DELETE(req:Request){
 if(!originOk(req))return json({error:'Invalid request origin'},403);if(!await requireAdmin(req))return json({error:'Sign in required'},401);
 const url=new URL(req.url);
 const id=(url.pathname.match(/\/api\/media\/([a-f0-9-]{36})$/)||[])[1];
 if(!id)return json({error:'Media ID required'},400);
 try{
  const sql=database();const existing=await sql`SELECT storage_bucket,storage_key FROM media WHERE id=${id}`;
  if(!existing[0])return json({error:'Not found'},404);
  await deleteMedia(existing[0].storage_bucket,existing[0].storage_key);
  await sql`DELETE FROM media WHERE id=${id}`;
  const site=await config();site.media=site.media.filter(m=>m.id!==id);if(site.logoId===id)site.logoId='';await saveConfig(site);
  return json({ok:true});
 }catch(e){console.error('Delete failed',e);return json({error:'Delete failed'},500);}
}
