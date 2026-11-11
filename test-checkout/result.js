let attemptStorage;try{attemptStorage=window.sessionStorage}catch{}
import {consumeAttempt} from './attempt.js';
import {checkoutPlans} from '../services/mavs-checkout/lib/offers.js';
const url=new URL(location.href),completed=url.hash==='#completed';
const code=Object.hasOwn(checkoutPlans,url.searchParams.get('plan'))?url.searchParams.get('plan'):'annual';
// Strip all inbound data before any analytics code is loaded. No form fields exist here.
history.replaceState(null,'',location.pathname+'?plan='+encodeURIComponent(code));
const attempt=completed?consumeAttempt(attemptStorage,code):null;
if(attempt){
 try{await import('../tag-manager.js')}catch{}
 await import('../tracking-config.js');
 try{await import('../trackwill-client.js')}catch{}
 await import('../tracking.js');
 try{await import('../meta-pixel.js')}catch{}
 window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',window.ELF_TRACKING_CONFIG.ga4Id,{send_page_view:false,ignore_referrer:true,page_location:location.origin+location.pathname,...(location.hostname==='127.0.0.1'||location.hostname==='localhost'?{debug_mode:true}:{})});
 window.ElfTracking.event('checkout_form_completed',{attempt_id:attempt.id,plan:code,value:checkoutPlans[code].amount,currency:'USD',outcome:'test_only'});
 window.ElfTracking.event('qa_payment_simulated',{attempt_id:attempt.id,plan:code,value:checkoutPlans[code].amount,order_amount:checkoutPlans[code].amount,currency:'USD',outcome:'test_only'});
 window.ElfPixel?.testPaymentCompleted({plan:code,value:checkoutPlans[code].amount,attemptId:attempt.id});
 const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(window.ELF_TRACKING_CONFIG.ga4Id);document.head.append(tag);
}
