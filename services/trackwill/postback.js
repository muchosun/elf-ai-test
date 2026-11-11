import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {checkoutPlans} from '../mavs-checkout/lib/offers.js';
const endpoint='https://s2s.trwl1.com/api/v1/conversion',pixel='1003891172735447';
const allowed=['event','clickId','pixelId','fbclid','plan','eventId'];
export class PostbackError extends Error {constructor(status,code){super(code);this.status=status;this.code=code}}
export function buildPostback(input,env){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))throw new PostbackError(400,'invalid_request');
 if(!['registration','test_order'].includes(input.event)||typeof input.clickId!=='string'||!/^[a-z][a-z0-9_-]{7,79}$/i.test(input.clickId))throw new PostbackError(400,'invalid_event_or_click');
 if(input.pixelId!==undefined&&input.pixelId!==pixel)throw new PostbackError(400,'invalid_pixel');
 if(input.fbclid!==undefined&&(typeof input.fbclid!=='string'||(input.fbclid!==''&&!/^[a-z0-9_-]{20,512}$/i.test(input.fbclid))))throw new PostbackError(400,'invalid_fbclid');
 if(input.event==='registration'&&input.plan!==undefined)throw new PostbackError(400,'unexpected_plan');
 if(input.event==='test_order'&&!Object.hasOwn(checkoutPlans,input.plan))throw new PostbackError(400,'invalid_plan');
 if(typeof input.eventId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.eventId))throw new PostbackError(400,'invalid_event_id');
 if(env.TRACKWILL_ENABLED!=='true')throw new PostbackError(503,'trackwill_disabled');
 const type=env[input.event==='registration'?'TRACKWILL_REGISTRATION_TYPE':'TRACKWILL_TEST_ORDER_TYPE'];
 if(typeof type!=='string'||!/^[a-z][a-z0-9_-]{2,29}$/i.test(type))throw new PostbackError(503,'trackwill_goal_not_configured');
 // No simulated checkout is silently mapped to an actual paid sale.
 if(input.event==='test_order'&&(env.TRACKWILL_TEST_GOAL_CONFIRMED!=='true'||['sale','dep','rebill','purchase'].includes(type.toLowerCase())))throw new PostbackError(503,'test_order_goal_not_confirmed');
 const url=new URL(endpoint);url.searchParams.set('clickid',input.clickId);url.searchParams.set('type',type);url.searchParams.set('id',input.eventId);
 if(input.event==='registration'){url.searchParams.set('pixel_id',pixel);if(input.fbclid)url.searchParams.set('fbclid',input.fbclid)}
 const amount=input.event==='test_order'?checkoutPlans[input.plan].amount:null;
 if(amount!==null){url.searchParams.set('currency','USD');url.searchParams.set('payout','0');url.searchParams.set('need-payout','false');url.searchParams.set('ccv1',String(amount))}
 const key=createHash('sha256').update(input.clickId+'|'+type).digest('hex');
 return {url,key,eventId:input.eventId,event:input.event,type,amount,currency:amount===null?null:'USD'};
}
const ttl=86400000;
export function readReceipt(cookie,secret,now=Date.now()){
 try{const [body,sig]=String(cookie||'').split('.'),expected=createHmac('sha256',secret).update(body).digest(),actual=Buffer.from(sig,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return [];const d=JSON.parse(Buffer.from(body,'base64url'));return d.until>now&&Array.isArray(d.keys)?d.keys.filter(k=>/^[a-f0-9]{64}$/.test(k)).slice(-8):[]}catch{return []}
}
export function makeReceipt(keys,secret,now=Date.now()){
 const body=Buffer.from(JSON.stringify({until:now+ttl,keys:[...new Set(keys)].slice(-8)})).toString('base64url');return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');
}
export function createSender(fetcher=fetch){
 const inFlight=new Map();
 return async function send(input,env,cookie,now=Date.now()){
  const item=buildPostback(input,env);
  if(!env.AUTH_SECRET)throw new PostbackError(503,'receipt_signing_not_configured');
  const done=readReceipt(cookie,env.AUTH_SECRET,now);
  if(done.includes(item.key))return {duplicate:true,delivery:'already_acknowledged',providerCode:200,receipt:cookie};
  if(!inFlight.has(item.key)){
   const work=(async()=>{
    let response;try{response=await fetcher(item.url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000)})}catch{throw new PostbackError(502,'delivery_unknown_do_not_automatically_retry')}
    const body=(await response.text()).slice(0,2000);
    if(!response.ok)throw new PostbackError(502,'tracker_http_rejected');
    let reply;try{reply=JSON.parse(body)}catch{}
    if(reply?.error||reply?.errors||reply?.success===false||(typeof reply?.code==='number'&&reply.code!==200)||['error','failed','rejected'].includes(reply?.status))throw new PostbackError(502,'tracker_business_rejected');
    const acknowledged=reply?.code===200;
    if(!acknowledged)throw new PostbackError(502,'tracker_reply_unknown_do_not_automatically_retry');
    console.info(JSON.stringify({service:'trackwill',event:item.event,type:item.type,event_id:item.eventId,click_hash:item.key,provider_code:200,at:new Date().toISOString()}));
    // Provider acknowledgement is still not dashboard confirmation.
    return {duplicate:false,delivery:'accepted',providerStatus:response.status,providerCode:200,event:item.event,type:item.type,amount:item.amount,currency:item.currency};
   })();inFlight.set(item.key,work);
  }
  try{const result=await inFlight.get(item.key);return {...result,receipt:makeReceipt([...done,item.key],env.AUTH_SECRET,now)}}finally{inFlight.delete(item.key)}
 };
}
