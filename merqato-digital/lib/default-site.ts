export type MediaItem = { id:string; url:string; kind:'image'|'video'; filename:string; size:number; contentType:string };
export type Section = { id:string; type:'services'|'text'|'media'|'gallery'; label:string; title:string; body:string; items:{ title:string; body:string }[]; mediaIds:string[]; visible:boolean };
export type SiteConfig = { name:string; descriptor:string; email:string; location:string; logoId:string; heroMediaId:string; heroImage:string; eyebrow:string; headline:string; intro:string; heroButton:string; nav:{label:string; sectionId:string}[]; sections:Section[]; palette:{navy:string;blue:string;ink:string;paper:string;white:string;muted:string}; fonts:{heading:string;body:string}; footer:{headline:string;description:string;copyright:string;links:{label:string;url:string}[]}; media:MediaItem[] };
export const defaultSite:SiteConfig={
 name:'Merqato.Digital',descriptor:'DIGITAL STUDIO · PALAWAN',email:'growpalawan@gmail.com',location:'PALAWAN, PHILIPPINES',logoId:'',heroMediaId:'',heroImage:'/assets/hero-palawan.png',eyebrow:'DESIGN · DEVELOPMENT · AUTOMATION',headline:'Local businesses.\nDistinct digital\nworlds.',intro:'We build thoughtful websites and digital systems for ambitious businesses. Rooted in Palawan. Made to work anywhere.',heroButton:'EXPLORE WHAT WE DO',
 nav:[{label:'Home',sectionId:'top'},{label:'Services',sectionId:'services'},{label:'Approach',sectionId:'approach'},{label:'Projects',sectionId:'projects'},{label:'About us',sectionId:'about'},{label:'Contact',sectionId:'contact'}],
 sections:[
 {id:'services',type:'services',label:'01 / WHAT WE DO',title:'What we do',body:'',items:[{title:'Websites',body:'Distinct, responsive sites built around the way your business actually works.'},{title:'Digital systems',body:'Simple tools that bring your content, customers, and daily work together.'},{title:'Automation',body:'Useful workflows that save time and keep people in control.'}],mediaIds:[],visible:true},
 {id:'approach',type:'text',label:'02 / OUR APPROACH',title:'Good digital work should feel like it belongs to you.',body:'Every business has its own rhythm. We start there, then make something clear, useful, and unmistakably yours.',items:[],mediaIds:[],visible:true},
 {id:'about',type:'text',label:'03 / THE STUDIO',title:'Small studio.\nBig picture.',body:'Merqato.Digital is a creative technology studio based in Palawan. We pair a strong visual point of view with practical tools that help local businesses grow on their own terms.',items:[],mediaIds:[],visible:true}
 ],
 palette:{navy:'#101c31',blue:'#113a70',ink:'#182336',paper:'#f7f8f8',white:'#ffffff',muted:'#a5b3c5'},fonts:{heading:'DM Sans',body:'DM Sans'},
 footer:{headline:'Let’s make something good.',description:'A small studio for ambitious ideas. Based in Palawan, building for everywhere.',copyright:'© Merqato.Digital',links:[{label:'Email',url:'mailto:growpalawan@gmail.com'},{label:'Back to top',url:'#top'}]},media:[]
};
export const fonts=['DM Sans','Inter','Manrope','Space Grotesk','Outfit','Playfair Display','Cormorant Garamond'];

/**
 * Site config saved by older versions of the studio can be missing whole
 * branches (footer.links, nav, palette…). Anything that reads the config runs
 * it through here first so a partial payload degrades to defaults instead of
 * crashing the page on `.map` of undefined.
 */
export function normalizeSite(raw:unknown):SiteConfig{
 const s=(raw&&typeof raw==='object'?raw:{}) as Partial<SiteConfig>;
 const str=(v:unknown,f:string)=>typeof v==='string'?v:f;
 const arr=<T,>(v:unknown,f:T[]):T[]=>Array.isArray(v)?v as T[]:f;
 const obj=(v:unknown)=>(v&&typeof v==='object'?v as Record<string,unknown>:{});
 const f=obj(s.footer),p=obj(s.palette),fo=obj(s.fonts);
 return {
  name:str(s.name,defaultSite.name),
  descriptor:str(s.descriptor,defaultSite.descriptor),
  email:str(s.email,defaultSite.email),
  location:str(s.location,defaultSite.location),
  logoId:str(s.logoId,''),
  heroMediaId:str(s.heroMediaId,''),
  heroImage:str(s.heroImage,defaultSite.heroImage),
  eyebrow:str(s.eyebrow,defaultSite.eyebrow),
  headline:str(s.headline,defaultSite.headline),
  intro:str(s.intro,defaultSite.intro),
  heroButton:str(s.heroButton,defaultSite.heroButton),
  nav:arr(s.nav,defaultSite.nav).filter(n=>n&&typeof n==='object').map(n=>({label:str(n.label,''),sectionId:str(n.sectionId,'top')})),
  sections:arr(s.sections,defaultSite.sections).filter(x=>x&&typeof x==='object').map(x=>({
   id:str(x.id,'section'),
   type:(['services','text','media','gallery'] as const).includes(x.type)?x.type:'text',
   label:str(x.label,''),title:str(x.title,''),body:str(x.body,''),
   items:arr<{title?:string;body?:string}>(x.items,[]).filter(i=>i&&typeof i==='object').map(i=>({title:str(i.title,''),body:str(i.body,'')})),
   mediaIds:arr<string>(x.mediaIds,[]).filter(i=>typeof i==='string'),
   visible:x.visible!==false,
  })),
  palette:{
   navy:str(p.navy,defaultSite.palette.navy),blue:str(p.blue,defaultSite.palette.blue),
   ink:str(p.ink,defaultSite.palette.ink),paper:str(p.paper,defaultSite.palette.paper),
   white:str(p.white,defaultSite.palette.white),muted:str(p.muted,defaultSite.palette.muted),
  },
  fonts:{heading:str(fo.heading,defaultSite.fonts.heading),body:str(fo.body,defaultSite.fonts.body)},
  footer:{
   headline:str(f.headline,defaultSite.footer.headline),
   description:str(f.description,defaultSite.footer.description),
   copyright:str(f.copyright,defaultSite.footer.copyright),
   links:arr(f.links,defaultSite.footer.links).filter(l=>l&&typeof l==='object').map(l=>({label:str((l as {label?:string}).label,'Link'),url:str((l as {url?:string}).url,'#top')})),
  },
  media:arr<Partial<MediaItem>>(s.media,[]).filter(m=>m&&typeof m==='object'&&typeof (m as {id?:string}).id==='string').map(m=>({
   id:str(m.id,''),url:str(m.url,`/api/media/${str(m.id,'')}`),
   kind:m.kind==='video'?'video':'image',
   filename:str(m.filename,'file'),size:typeof m.size==='number'?m.size:0,
   contentType:str(m.contentType,'image/jpeg'),
  })),
 };
}
