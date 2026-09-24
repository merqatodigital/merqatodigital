export type MediaItem = { id:string; url:string; kind:'image'|'video'; filename:string; size:number; contentType:string };
export type Section = { id:string; type:'services'|'text'|'media'|'gallery'; label:string; title:string; body:string; items:{ title:string; body:string }[]; mediaIds:string[]; visible:boolean };
export type FooterLink = { label:string; url:string };
export type FooterSocial = { icon:string; url:string };
export type FooterColumn = { heading:string; links:FooterLink[] };
export type FooterContact = { heading:string; email:string; phone:string; whatsapp:string; hours:string; response:string; payments:string };
export type FooterNetwork = { label:string; timezone:string; tzLabel:string; statusLabel:string; statusValue:string; headquarters:string };
export type FooterConfig = { tagline:string; badges:string[]; social:FooterSocial[]; network:FooterNetwork; columns:FooterColumn[]; contact:FooterContact; copyright:string; showAdminLink:boolean };
export type SiteConfig = { name:string; descriptor:string; email:string; location:string; logoId:string; heroMediaId:string; heroImage:string; eyebrow:string; headline:string; intro:string; heroButton:string; nav:{label:string; sectionId:string}[]; sections:Section[]; palette:{navy:string;blue:string;ink:string;paper:string;white:string;muted:string}; fonts:{heading:string;body:string}; footer:FooterConfig; media:MediaItem[] };
export const defaultFooter:FooterConfig={
 tagline:'Building Operational Systems from Paradise. We design resilient Web, AI Agent, and social operations for enterprises working across islands and international markets.',
 badges:['LOCAL-FIRST','WHATSAPP-READY','STARLINK & SOLAR RESILIENT'],
 social:[],
 network:{label:'Palawan Station',timezone:'Asia/Manila',tzLabel:'PHT',statusLabel:'Systems',statusValue:'100% Operational',headquarters:'Puerto Princesa • El Nido • Coron'},
 columns:[
  {heading:'Capabilities & Solutions',links:[
   {label:'Island Resort & Tour Websites',url:'#services'},
   {label:'24/7 WhatsApp Booking Bots',url:'#services'},
   {label:'Offline & Low-Bandwidth Sync',url:'#services'},
   {label:'Automated Calendars & Sheets',url:'#services'},
   {label:'GCash / Maya / Stripe Checkout',url:'#services'}]},
  {heading:'Studio Directory',links:[
   {label:'Home',url:'#top'},
   {label:'Services',url:'#services'},
   {label:'Approach',url:'#approach'},
   {label:'Projects',url:'#projects'},
   {label:'About',url:'#about'},
   {label:'Contact',url:'#contact'}]},
  {heading:'Governance & Legal Desk',links:[
   {label:'Privacy Policy (RA 10173)',url:'#'},
   {label:'Terms of Engagement & IP',url:'#'},
   {label:'Island SLA & Brownout Uptime',url:'#'}]}
 ],
 contact:{heading:'Island Desk & Inquiries',email:'hello@merqato.digital',phone:'+63 917 530 9000',whatsapp:'https://wa.me/639175309000',hours:'Monday to Saturday · 08:00 – 18:00 PHT',response:'< 2 Hours Daytime Response',payments:'GCASH • MAYA • STRIPE'},
 copyright:'© Merqato.Digital — Rooted in Palawan. Working everywhere.',
 showAdminLink:true
};
const str=(v:unknown):v is string=>typeof v==='string';
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object';
function pickString(o:Record<string,unknown>|null, key:string, fb:string){return o&&str(o[key])?o[key]:fb;}
function subObj(o:Record<string,unknown>, key:string){return o&&obj(o[key])?o[key]:null;}
function linksOf(v:unknown):FooterLink[]{if(!Array.isArray(v))return[];return v.filter(x=>obj(x)&&str(x.label)).map(x=>({label:x.label as string,url:str(x.url)?x.url as string:'#'}));}
export function normalizeFooter(raw:unknown):FooterConfig{
 const r=obj(raw)?raw:{};
 const net=subObj(r,'network');
 const con=subObj(r,'contact');
 const columns=Array.isArray(r.columns)&&r.columns.length?r.columns.filter(c=>obj(c)).map(c=>({heading:str(c.heading)?c.heading:'Links',links:linksOf(c.links)})).filter(c=>c.heading.trim()||c.links.length):defaultFooter.columns;
 return {
  tagline:pickString(r,'tagline',pickString(r,'description',defaultFooter.tagline)),
  badges:Array.isArray(r.badges)?r.badges.filter(str).map((b:string)=>b.trim()).filter(Boolean):defaultFooter.badges,
  social:Array.isArray(r.social)?r.social.filter(s=>obj(s)&&str(s.url)&&s.url.trim()).map(s=>({icon:str(s.icon)?s.icon:'globe',url:s.url as string})):defaultFooter.social,
  network:{
   label:pickString(net,'label',defaultFooter.network.label),
   timezone:pickString(net,'timezone',defaultFooter.network.timezone),
   tzLabel:pickString(net,'tzLabel',defaultFooter.network.tzLabel),
   statusLabel:pickString(net,'statusLabel',defaultFooter.network.statusLabel),
   statusValue:pickString(net,'statusValue',defaultFooter.network.statusValue),
   headquarters:pickString(net,'headquarters',defaultFooter.network.headquarters)
  },
  columns,
  contact:{
   heading:pickString(con,'heading',defaultFooter.contact.heading),
   email:pickString(con,'email',defaultFooter.contact.email),
   phone:pickString(con,'phone',defaultFooter.contact.phone),
   whatsapp:pickString(con,'whatsapp',defaultFooter.contact.whatsapp),
   hours:pickString(con,'hours',defaultFooter.contact.hours),
   response:pickString(con,'response',defaultFooter.contact.response),
   payments:pickString(con,'payments',defaultFooter.contact.payments)
  },
  copyright:pickString(r,'copyright',defaultFooter.copyright),
  showAdminLink:typeof r.showAdminLink==='boolean'?r.showAdminLink:true
 };
}
export function normalizeSite(raw:unknown):SiteConfig{
 const r=obj(raw)?raw:{};
 const base=defaultSite;
 return {
  ...base,
  name:pickString(r,'name',base.name),
  descriptor:pickString(r,'descriptor',base.descriptor),
  email:pickString(r,'email',base.email),
  location:pickString(r,'location',base.location),
  logoId:pickString(r,'logoId',base.logoId),
  heroMediaId:pickString(r,'heroMediaId',base.heroMediaId),
  heroImage:pickString(r,'heroImage',base.heroImage),
  eyebrow:pickString(r,'eyebrow',base.eyebrow),
  headline:pickString(r,'headline',base.headline),
  intro:pickString(r,'intro',base.intro),
  heroButton:pickString(r,'heroButton',base.heroButton),
  nav:Array.isArray(r.nav)&&r.nav.length?(r.nav as {label:string;sectionId:string}[]):base.nav,
  sections:Array.isArray(r.sections)&&r.sections.length?(r.sections as Section[]):base.sections,
  palette:{...base.palette,...(subObj(r,'palette')||{})},
  fonts:{...base.fonts,...(subObj(r,'fonts')||{})},
  media:Array.isArray(r.media)?r.media as MediaItem[]:base.media,
  footer:normalizeFooter(r.footer)
 };
}
export const defaultSite:SiteConfig={
 name:'Merqato.Digital',descriptor:'DIGITAL STUDIO · PALAWAN',email:'growpalawan@gmail.com',location:'PALAWAN, PHILIPPINES',logoId:'',heroMediaId:'',heroImage:'/assets/hero-palawan.png',eyebrow:'DESIGN · DEVELOPMENT · AUTOMATION',headline:'Local businesses.\nDistinct digital\nworlds.',intro:'We build thoughtful websites and digital systems for ambitious businesses. Rooted in Palawan. Made to work anywhere.',heroButton:'EXPLORE WHAT WE DO',
 nav:[{label:'Home',sectionId:'top'},{label:'Services',sectionId:'services'},{label:'Approach',sectionId:'approach'},{label:'Projects',sectionId:'projects'},{label:'About us',sectionId:'about'},{label:'Contact',sectionId:'contact'}],
 sections:[
 {id:'services',type:'services',label:'01 / WHAT WE DO',title:'What we do',body:'',items:[{title:'Websites',body:'Distinct, responsive sites built around the way your business actually works.'},{title:'Digital systems',body:'Simple tools that bring your content, customers, and daily work together.'},{title:'Automation',body:'Useful workflows that save time and keep people in control.'}],mediaIds:[],visible:true},
 {id:'approach',type:'text',label:'02 / OUR APPROACH',title:'Good digital work should feel like it belongs to you.',body:'Every business has its own rhythm. We start there, then make something clear, useful, and unmistakably yours.',items:[],mediaIds:[],visible:true},
 {id:'about',type:'text',label:'03 / THE STUDIO',title:'Small studio.\nBig picture.',body:'Merqato.Digital is a creative technology studio based in Palawan. We pair a strong visual point of view with practical tools that help local businesses grow on their own terms.',items:[],mediaIds:[],visible:true}
 ],
 palette:{navy:'#101c31',blue:'#113a70',ink:'#182336',paper:'#f7f8f8',white:'#ffffff',muted:'#a5b3c5'},fonts:{heading:'DM Sans',body:'DM Sans'},
 footer:defaultFooter,media:[]
};
export const fonts=['DM Sans','Inter','Manrope','Space Grotesk','Outfit','Playfair Display','Cormorant Garamond'];
