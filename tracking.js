(function(w){
 if(w.ElfTracking)return;
 const cfg=w.ELF_TRACKING_CONFIG||{}, key='elf.attribution.v1';
 const allowed=k=>/^utm_[a-z0-9_]{1,32}$/.test(k)||['fbclid','gclid','ttclid','msclkid','funnel',...(cfg.clickIdParams||['clickid','click_id','subid','sub_id','twclid'])].includes(k);
 const clean=v=>typeof v==='string'&&v.length<=256&&!v.includes('@')&&!/[\r\n]/.test(v);
 let saved={};try{saved=JSON.parse(w.sessionStorage.getItem(key)||'{}')}catch{}
 const url=new URL(w.location.href),fresh={};
 for(const [k,v]of url.searchParams)if(allowed(k)&&clean(v))fresh[k]=v;
 // A new advertising click starts a fresh attribution set; OAuth returns restore it.
 if(Object.keys(fresh).some(k=>k.startsWith('utm_')||['fbclid','gclid','clickid','click_id','twclid'].includes(k)))saved=fresh;
 else saved={...saved,...fresh};
 if(w.document.documentElement.dataset.funnel)saved.funnel=w.document.documentElement.dataset.funnel;
 for(const[k,v]of Object.entries(saved))if(allowed(k)&&clean(v)&&!url.searchParams.has(k))url.searchParams.set(k,v);
 try{w.sessionStorage.setItem(key,JSON.stringify(saved));if(url.href!==w.location.href)w.history.replaceState(null,'',url.href)}catch{}
 const locationForAnalytics=()=>{const u=new URL(w.location.href);for(const k of [...u.searchParams.keys()])if(!allowed(k))u.searchParams.delete(k);return u.href};
 function event(name,props={}){
  if(!/^[a-z][a-z0-9_]{0,39}$/.test(name))return;
  const data={funnel_id:saved.funnel||'legacy'};
  for(const k of ['step','branch','plan','tier','value','currency','outcome','method','screen'])if(['string','number','boolean'].includes(typeof props[k]))data[k]=typeof props[k]==='string'?props[k].slice(0,100):props[k];
  try{w.gtag?.('event',name,{...data,page_location:locationForAnalytics()})}catch{}
 }
 w.ElfTracking=Object.freeze({event,pageLocation:locationForAnalytics,attribution:()=>({...saved}),withAttribution:href=>{const u=new URL(href,w.location.origin);for(const[k,v]of Object.entries(saved))if(allowed(k)&&clean(v))u.searchParams.set(k,v);return u.href},trackwillReady:()=>Boolean(cfg.trackwillUrl)});
 w.addEventListener('elf:analytics',e=>{const d=e.detail||{};if(d.name==='registration_complete')event('sign_up',{method:'email'});else if(d.name!=='checkout_redirect')event(d.name,d.properties)});
})(window);
