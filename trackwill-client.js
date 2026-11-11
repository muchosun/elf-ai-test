/* First-party metadata only. Never include this file in the opaque input frame. */
(function(w){
 if(w.ElfTrackwill)return;
 const storeKey='elf.tw.delivery.v1',ttl=86400000,active=new Set();
 const validId=v=>typeof v==='string'&&/^[a-z][a-z0-9_-]{7,79}$/i.test(v);
 const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
 function read(){try{const a=JSON.parse(w.localStorage.getItem(storeKey)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.createdAt>Date.now()-ttl&&x.createdAt<=Date.now()&&x.payload&&Object.keys(x.payload).every(k=>['event','clickId','eventId','pixelId','fbclid','plan'].includes(k))&&validId(x.payload.clickId)&&['registration','test_order'].includes(x.payload.event)&&uuid(x.payload.eventId)&&x.key===x.payload.clickId+':'+x.payload.event).slice(-40):[]}catch{return null}}
 function save(a){try{w.localStorage.setItem(storeKey,JSON.stringify(a));return true}catch{return false}}
 function update(key,patch){const a=read();if(!a)return;const r=a.find(x=>x.key===key);if(r){Object.assign(r,patch);save(a)}}
 async function deliver(key){
  if(active.has(key))return;active.add(key);
  const job=async()=>{
   const a=read(),r=a?.find(x=>x.key===key);if(!r||r.state!=='pending'||!save(a.map(x=>x.key===key?{...x,state:'sending'}:x)))return;
   const controller=new AbortController(),timeout=w.setTimeout(()=>controller.abort(),12000);
   try{
    const response=await w.fetch('/api/trackwill',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify(r.payload),signal:controller.signal});
    let data;try{data=await response.json()}catch{update(key,{state:'unknown',error:'invalid_reply'});return}
    if(response.ok&&data.providerCode===200&&['accepted','already_acknowledged'].includes(data.delivery))update(key,{state:'accepted',acceptedAt:Date.now(),providerCode:200});
    else update(key,{state:response.status===503?'configuration_blocked':response.status===502?'unknown':'rejected',error:typeof data.error==='string'?data.error.slice(0,80):'rejected',httpStatus:response.status});
   }catch{update(key,{state:'unknown',error:'network_delivery_unknown'})}finally{w.clearTimeout(timeout)}
  };
  try{if(w.navigator?.locks)await w.navigator.locks.request('elf-trackwill:'+key,job);else await job()}catch{}finally{active.delete(key)}
 }
 function flush(){if(!w.ELF_TRACKING_CONFIG?.trackwillPostbacks)return;const a=read();if(a)for(const r of a)if(r.state==='pending')void deliver(r.key)}
 function enqueue(name,attribution={},props={}){
  if(!w.ELF_TRACKING_CONFIG?.trackwillPostbacks||!['sign_up','qa_payment_simulated'].includes(name)||!validId(attribution.sub5)||(attribution.sub4&&attribution.sub4!=='1003891172735447'))return false;
  const event=name==='sign_up'?'registration':'test_order';
  if(event==='test_order'&&(!uuid(props.attempt_id)||typeof props.plan!=='string'||!/^(monthly|annual|(?:creator|pro)_\d+_(?:monthly|annual))$/.test(props.plan)))return false;
  const a=read();if(!a)return false;const key=attribution.sub5+':'+event;if(a.some(x=>x.key===key))return false;
  const payload={event,clickId:attribution.sub5,eventId:event==='test_order'?props.attempt_id:w.crypto.randomUUID()};
  if(event==='registration'){payload.pixelId='1003891172735447';if(typeof attribution.fbclid==='string'&&/^[a-z0-9_-]{20,512}$/i.test(attribution.fbclid))payload.fbclid=attribution.fbclid}else payload.plan=props.plan;
  if(!save([...a,{key,payload,state:'pending',createdAt:Date.now()}].slice(-40)))return false;
  void deliver(key);return true;
 }
 w.ElfTrackwill=Object.freeze({enqueue,flush});flush();
})(window);
