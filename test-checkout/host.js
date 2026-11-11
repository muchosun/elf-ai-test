let attemptStorage;try{attemptStorage=window.sessionStorage}catch{}
import {createAttempt,finishAttempt} from './attempt.js';
import {checkoutPlans} from '../services/mavs-checkout/lib/offers.js';
const inbound=new URL(location.href),raw=inbound.searchParams.get('plan');
const code=Object.hasOwn(checkoutPlans,raw)?raw:'annual';
// Never forward arbitrary query strings to the input document or analytics.
history.replaceState(null,'',location.pathname+'?plan='+encodeURIComponent(code));
await import('../tracking-config.js');await import('../tracking.js');
window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
window.gtag('js',new Date());window.gtag('config',window.ELF_TRACKING_CONFIG.ga4Id,{
 send_page_view:false,ignore_referrer:true,page_location:location.origin+location.pathname,
 ...(location.hostname==='127.0.0.1'||location.hostname==='localhost'?{debug_mode:true}:{})
});
const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(window.ELF_TRACKING_CONFIG.ga4Id);document.head.append(tag);
const attempt=createAttempt(attemptStorage,code);
const frame=document.querySelector('#checkout-frame'),seen=new Set();let invalidCount=0;
const events={opened:'qa_checkout_opened',started:'qa_form_started',filled:'qa_form_filled',invalid:'qa_validation_failed'};
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!=='null'||!event.data||typeof event.data!=='object')return;
 const data=event.data;
 if(data.type==='elf-qa-size'&&Object.keys(data).length===2&&Number.isFinite(data.height)){
  frame.style.height=Math.min(4000,Math.max(400,data.height))+'px';return;
 }
 if(data.type!=='elf-qa-checkout'||Object.keys(data).length!==2||!['opened','started','filled','invalid','completed','back'].includes(data.stage))return;
 const stage=data.stage;
 if(stage==='back'){location.replace('./index.html#paywall');return;}
 if(stage==='completed'){
  if(seen.has(stage))return;seen.add(stage);finishAttempt(attemptStorage,attempt.id);
  location.replace('./test-checkout-result.html?plan='+encodeURIComponent(code)+'#completed');return;
 }
 if(stage==='invalid'){if(++invalidCount>10)return}else{if(seen.has(stage))return;seen.add(stage)}
 window.ElfTracking.event(events[stage],{attempt_id:attempt.id,plan:code,value:checkoutPlans[code].amount,currency:'USD',outcome:'test_only'});
});
frame.src='./test-checkout/frame.html?plan='+encodeURIComponent(code);
