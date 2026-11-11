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
 const queueKey='elf.ga.pending.v1';let queue=[];const sending=new Set(),completionCallbacks=new Map();
 try{const q=JSON.parse(w.sessionStorage.getItem(queueKey)||'[]');if(Array.isArray(q))queue=q.filter(x=>x&&typeof x.id==='string'&&/^[a-z][a-z0-9_]{0,39}$/.test(x.name)&&x.data&&typeof x.data==='object').slice(-80)}catch{}
 const saveQueue=()=>{try{w.sessionStorage.setItem(queueKey,JSON.stringify(queue))}catch{}};
 function flush(){
  if(typeof w.gtag!=='function')return;
  for(const record of [...queue]){
   if(sending.has(record.id))continue;sending.add(record.id);
   try{w.gtag('event',record.name,{...record.data,event_id:record.id,event_callback:()=>{queue=queue.filter(x=>x.id!==record.id);saveQueue();const done=completionCallbacks.get(record.id);completionCallbacks.delete(record.id);try{done?.()}catch{}},event_timeout:2000})}catch{sending.delete(record.id)}
  }
 }
 function event(name,props={},onComplete){
  if(!/^[a-z][a-z0-9_]{0,39}$/.test(name))return;
  const data={funnel_id:saved.funnel||'legacy'};
  if((name.startsWith('qa_')||name==='checkout_form_completed')&&typeof props.attempt_id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(props.attempt_id))data.attempt_id=props.attempt_id;
  for(const k of ['step','branch','plan','tier','value','currency','outcome','method','screen'])if(['string','number','boolean'].includes(typeof props[k]))data[k]=typeof props[k]==='string'?props[k].slice(0,100):props[k];
  // Dedicated intent amount belongs to the final test event only; never sum stage values.
  if(name==='qa_payment_simulated'&&Number.isFinite(props.order_amount)&&props.order_amount>0)data.order_amount=props.order_amount;
  const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  if(typeof onComplete==='function')completionCallbacks.set(id,onComplete);
  queue.push({id,name,data:{...data,page_location:locationForAnalytics()}});queue=queue.slice(-80);saveQueue();flush();
 }
 w.ElfTracking=Object.freeze({event,pageLocation:locationForAnalytics,attribution:()=>({...saved}),withAttribution:href=>{const u=new URL(href,w.location.origin);for(const[k,v]of Object.entries(saved))if(allowed(k)&&clean(v))u.searchParams.set(k,v);return u.href},trackwillReady:()=>Boolean(cfg.trackwillUrl)});
 w.setTimeout?.(flush,0);
 w.addEventListener('elf:analytics',e=>{const d=e.detail||{};if(d.name==='registration_complete')event('sign_up',{method:'email'});else if(d.name!=='checkout_redirect'){event(d.name,d.properties);if(d.name==='screen_view'&&d.properties?.screen==='paywall')event('paywall_view')}});
})(window);
