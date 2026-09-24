'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import { ArrowUp,Calendar,Clock,CreditCard,Mail,MapPin,MessageCircle,ShieldCheck,Timer } from 'lucide-react';
import type { PortfolioProject } from '@/lib/portfolio';
import { defaultSite,normalizeSite, type Section, type SiteConfig } from '@/lib/default-site';
import { SocialIcon } from '@/components/social-icon';
function image(site:SiteConfig,id:string){return site.media.find(m=>m.id===id)}
function Text({value}:{value:string}){return <>{value.split('\n').map((s,i)=><span key={i}>{i>0&&<br/>}{s}</span>)}</>}
function Content({section,site,index}:{section:Section;site:SiteConfig;index:number}){
 const media=section.mediaIds.map(id=>image(site,id)).filter(Boolean);
 if(section.type==='services')return <section className="services-panel wrap" id={section.id}><div className="service-tabs"><span className="tab-active">{section.title}</span><span>Strategy</span><span>Design</span><span>Development</span><span>Automation</span></div><div className="services-grid">{section.items.map((x,i)=><article className="service-card" key={i}><span>{String(i+1).padStart(2,'0')} / {x.title.toUpperCase()}</span><h3>{x.title}</h3><p>{x.body}</p><span className="service-arrow" aria-hidden="true">↗</span></article>)}</div></section>;
 if(section.type==='media'||section.type==='gallery')return <section id={section.id} className="media-section wrap"><div className="section-meta"><span>{section.label}</span></div><div className="media-heading"><h2><Text value={section.title}/></h2><p>{section.body}</p></div><div className={'media-grid '+(section.type==='gallery'?'gallery-grid':'')}>{media.map(m=><figure key={m!.id}>{m!.kind==='video'?<video controls playsInline preload="metadata" src={m!.url}/>:<img src={m!.url} alt={m!.filename} loading="lazy"/>}</figure>)}</div></section>;
 return <section className={index%2===0?'about-band':'editorial wrap'} id={section.id}>{index%2===0?<div className="wrap about-grid"><div><span className="section-label">{section.label}</span><h2><Text value={section.title}/></h2></div><div><p>{section.body}</p><div className="about-rule"><span>ROOTED IN PALAWAN</span><span>WORKING EVERYWHERE</span></div></div></div>:<><div className="section-meta"><span>{section.label}</span><span>MADE FOR REAL BUSINESS</span></div><div className="editorial-grid"><h2><Text value={section.title}/></h2><div><p>{section.body}</p><a href="#contact" className="text-link">LET'S BUILD SOMETHING <span aria-hidden="true">↗</span></a></div></div></>}</section>;
}
function Footer({site}:{site:SiteConfig}){
 const f=site.footer,[now,setNow]=useState(()=>new Date());
 useEffect(()=>{const t=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(t);},[]);
 const tz=f.network.timezone;
 let time='—',date='—';
 try{time=new Intl.DateTimeFormat('en-GB',tz?{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}:{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);date=new Intl.DateTimeFormat('en-US',tz?{timeZone:tz,day:'2-digit',month:'short',year:'numeric'}:{day:'2-digit',month:'short',year:'numeric'}).format(now);}catch{/* keep fallback */}
 const payments=f.contact.payments.split('•').map(s=>s.trim()).filter(Boolean);
 return <footer className="footer-pro" id="footer">
 <div className="wrap">
 <div className="fp-top">
 <div className="fp-brand">
  <a className="fp-wordmark" href="#top">{site.name}</a>
  {f.tagline&&<p className="fp-tagline">{f.tagline}</p>}
  {f.badges.length>0&&<ul className="fp-badges" aria-label="Studio commitments">{f.badges.map((b,i)=><li key={i}>{b}</li>)}</ul>}
  {f.social.length>0&&<div className="fp-social" aria-label="Social media">{f.social.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.icon} title={s.icon}><SocialIcon icon={s.icon}/></a>)}</div>}
 </div>
 <aside className="fp-network" aria-label="Studio network status">
  <span className="fp-net-label">STUDIO NETWORK</span>
  <div className="fp-net-row"><Clock/><b>{f.network.label}</b><span className="fp-net-sep" aria-hidden="true">/</span><span>{f.network.tzLabel}</span><time className="fp-net-time">{time}</time></div>
  <div className="fp-net-row"><Calendar/><time>{date}</time></div>
  <div className="fp-net-row fp-net-status"><span className="fp-status-dot" aria-hidden="true"/><b>{f.network.statusLabel}</b><span>{f.network.statusValue}</span></div>
  <div className="fp-net-row"><MapPin/><span>{f.network.headquarters}</span></div>
 </aside>
 </div>
 <nav className="fp-cols" aria-label="Footer">
 {f.columns.map((c,ci)=><div className="fp-col" key={ci}><h4>{c.heading}</h4><ul>{c.links.map((l,li)=><li key={li}><a href={l.url||'#'}>{l.label}</a></li>)}</ul></div>)}
 <div className="fp-col fp-contact">
  <h4>{f.contact.heading}</h4>
  <ul>
   <li><a href={`mailto:${f.contact.email}`}><Mail/>{f.contact.email}</a></li>
   <li><a href={f.contact.whatsapp||`tel:${f.contact.phone.replace(/[^+\d]/g,'')}`} target={f.contact.whatsapp?'_blank':undefined} rel={f.contact.whatsapp?'noopener noreferrer':undefined}><MessageCircle/>{f.contact.phone}</a></li>
   {f.contact.hours&&<li><Clock/><span>{f.contact.hours}</span></li>}
   {f.contact.response&&<li><Timer/><span>{f.contact.response}</span></li>}
  </ul>
  {payments.length>0&&<div className="fp-pay"><span className="fp-pay-label"><CreditCard/>PAYMENTS</span><span className="fp-pay-row">{payments.map((p,i)=><em key={i}>{p}</em>)}</span></div>}
 </div>
 </nav>
 <div className="fp-bottom">
  <span>{f.copyright}</span>
  <div className="fp-bottom-actions">
   {f.showAdminLink&&<a href="/admin"><ShieldCheck/>ADMIN PASSKEY TERMINAL</a>}
   <a href="#top">BACK TO TOP <ArrowUp/></a>
  </div>
 </div>
 </div>
 </footer>;
}
export default function Home(){const [site,setSite]=useState<SiteConfig>(defaultSite),[projects,setProjects]=useState<PortfolioProject[]>([]),[menu,setMenu]=useState(false),clicks=useRef<number[]>([]);useEffect(()=>{fetch('/api/site').then(r=>r.ok?r.json() as Promise<SiteConfig>:null).then(s=>s&&setSite(normalizeSite(s))).catch(()=>{});fetch('/api/portfolio').then(r=>r.ok?r.json() as Promise<{projects:PortfolioProject[]}>:null).then(d=>d?.projects&&setProjects(d.projects)).catch(()=>{});},[]);const hero=image(site,site.heroMediaId),logo=image(site,site.logoId);const style=useMemo(()=>({ '--navy':site.palette.navy,'--blue':site.palette.blue,'--ink':site.palette.ink,'--paper':site.palette.paper,'--white':site.palette.white,'--muted':site.palette.muted,'--heading-font':`'${site.fonts.heading}'`,'--body-font':`'${site.fonts.body}'` } as React.CSSProperties),[site]);function logoClick(e:React.MouseEvent){clicks.current=[...clicks.current.filter(t=>Date.now()-t<1200),Date.now()];if(clicks.current.length>=3){e.preventDefault();window.location.href='/admin';}}
return <div className="page-shell" style={style}>
<header className="header wrap" id="top"><a className={"brand"+(logo?" has-logo":"")+(logo&&["71a68b76-0b86-439c-9617-c711fbfc85f5","b4dacb8f-1bda-469a-84a9-c683b4d048d5"].includes(logo.id)?" uncropped-logo":"")} href="#top" onClick={logoClick} aria-label={`${site.name} home`}><span className="brand-mark">{logo?<img src={logo.url} alt=""/>:<>m<span>.</span></>}</span><span className="brand-text"><strong>{site.name}</strong><small>{site.descriptor}</small></span></a><nav className="desktop-nav" aria-label="Main navigation">{site.nav.map((n,i)=><a href={'#'+n.sectionId} key={i}>{n.label}</a>)}{!site.nav.some(n=>n.sectionId==='projects')&&<a href="#projects">Projects</a>}</nav><div className="header-end"><span className="location">{site.location}</span><a className="header-cta" href="#contact">LET'S TALK <span aria-hidden="true">↗</span></a><button className="menu-button" onClick={()=>setMenu(!menu)} aria-label={menu?'Close menu':'Open menu'} aria-expanded={menu} aria-controls="mobile-nav"><span/><span/></button></div></header>
{menu&&<nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{site.nav.map((n,i)=><a href={'#'+n.sectionId} key={i} onClick={()=>setMenu(false)}>{n.label}</a>)}{!site.nav.some(n=>n.sectionId==='projects')&&<a href="#projects" onClick={()=>setMenu(false)}>Projects</a>}</nav>}
<main><section className="hero" aria-labelledby="hero-title"><div className="hero-photo" style={{backgroundImage:hero?.kind==='image'?`url('${hero.url}')`:!hero?`url('${site.heroImage}')`:undefined}}/>{hero?.kind==='video'&&<video className="hero-video" src={hero.url} autoPlay muted playsInline loop/>}<div className="hero-tint"/><div className="hero-inner wrap"><div className="hero-copy"><p className="eyebrow">{site.eyebrow}</p><h1 id="hero-title"><Text value={site.headline}/></h1><p className="hero-intro">{site.intro}</p><div className="hero-actions"><a className="button-primary" href={'#'+(site.sections.find(s=>s.visible)?.id||'contact')}>{site.heroButton} <span aria-hidden="true">↗</span></a><a className="button-line" href="#contact">START A CONVERSATION <span aria-hidden="true">↗</span></a></div></div><div className="hero-side"><span className="side-line"/><span>IDEAS, DESIGN<br/>& TECHNOLOGY<br/>IN MOTION</span></div><div className="hero-index"><span className="index-big">01<span>/03</span></span><p>Independent thinking.<br/>Built for what’s next.</p><div className="index-dots"><span className="active"/><span/><span/></div></div></div><div className="hero-bottom wrap"><span>SCROLL TO EXPLORE</span><span className="scroll-line"/><span>01 — 04</span></div></section>
{site.sections.filter(s=>s.visible).map((s,i)=><Content section={s} site={site} index={i} key={s.id}/>)}
<section className="portfolio-section" id="projects"><div className="wrap"><div className="section-meta"><span>SELECTED WORK / MERQATO.DIGITAL</span><span>{String(projects.length).padStart(2,'0')} PROJECTS</span></div><div className="portfolio-heading"><h2>Different businesses.<br/><em>Distinct digital worlds.</em></h2><p>A look at what we’re building, and what we’ve made.</p></div><div className="portfolio-grid">{projects.map((p,i)=>{const cover=image(site,p.coverMediaId);const gallery=p.galleryMediaIds.map(id=>image(site,id)).filter(Boolean);return <article className="portfolio-card" key={p.id}><div className="portfolio-cover">{cover?<img src={cover.url} alt={`${p.title} project`} loading="lazy"/>:<div className="portfolio-letter">{p.title}</div>}<span className="portfolio-index">{String(i+1).padStart(2,'0')}</span></div><div className="portfolio-card-body"><div className="portfolio-badges"><span>{p.category}</span><span>{p.status==='in_progress'?'IN PROGRESS':p.status.toUpperCase()}</span></div><h3>{p.title}</h3><p>{p.summary}</p><details><summary>Project details <span>↗</span></summary><div className="portfolio-detail"><p>{p.body}</p>{gallery.length>0&&<div className="portfolio-gallery">{gallery.map(m=>m?.kind==='video'?<video key={m.id} src={m.url} controls playsInline/>:<img key={m!.id} src={m!.url} alt={`${p.title} gallery`} loading="lazy"/>)}</div>}{p.projectUrl&&<a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="text-link">VIEW PROJECT ↗</a>}</div></details></div></article>})}</div></div></section>
<section className="contact wrap" id="contact"><p className="section-label">LET'S TALK</p><div className="contact-grid"><h2>Have something<br/><em>in mind?</em></h2><div><p>Tell us what you're building. We’ll start with a conversation.</p><a className="contact-button" href={`mailto:${site.email}`}>GET IN TOUCH <span aria-hidden="true">↗</span></a></div></div></section></main>
<Footer site={site}/>
</div>}
