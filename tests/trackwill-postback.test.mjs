import assert from 'node:assert/strict';
import {buildPostback,createSender,readReceipt,makeReceipt} from '../services/trackwill/postback.js';
const env={AUTH_SECRET:'unit-test-only-secret',TRACKWILL_ENABLED:'true',TRACKWILL_REGISTRATION_TYPE:'unit_registration',TRACKWILL_TEST_ORDER_TYPE:'unit_test_order',TRACKWILL_TEST_GOAL_CONFIRMED:'true'},reg={event:'registration',clickId:'dbq75h9371ks9ev7vt20',pixelId:'1003891172735447',eventId:'c2ab1630-82bd-4267-9786-9618b32d3d85'};
assert.throws(()=>buildPostback(reg,{}),/trackwill_disabled/);
for(const extra of ['email','card_number','cvc','value','url'])assert.throws(()=>buildPostback({...reg,[extra]:'private'},env),/invalid_request/);
const r=buildPostback({...reg,fbclid:''},env);assert.equal(r.url.protocol,'https:');assert.equal(r.url.host,'s2s.trwl1.com');assert.equal(r.url.searchParams.get('type'),'unit_registration');assert.equal(r.url.searchParams.has('payout'),false);assert.equal(r.url.searchParams.has('fbclid'),false);
const qa={...reg,event:'test_order',plan:'annual'};assert.equal(buildPostback(qa,env).url.searchParams.get('payout'),'0');assert.equal(buildPostback({...qa,plan:'creator_350_annual'},env).amount,312);assert.throws(()=>buildPostback(qa,{...env,TRACKWILL_TEST_ORDER_TYPE:'sale'}),/test_order_goal/);assert.throws(()=>buildPostback(qa,{...env,TRACKWILL_TEST_GOAL_CONFIRMED:''}),/test_order_goal/);
let calls=0;const sender=createSender(async()=>{calls++;return {ok:true,status:200,text:async()=>'{"code":200}'}});
const first=await sender(reg,env,undefined,1000);assert.equal(calls,1);assert.equal(first.delivery,'accepted');const coldSender=createSender(async()=>{throw Error('Duplicate outbound request')});assert.equal((await coldSender(reg,env,first.receipt,1001)).duplicate,true);assert.equal(readReceipt(first.receipt,'wrong-key',1001).length,0);assert.equal(readReceipt(first.receipt,env.AUTH_SECRET,1000+86400001).length,0);
let release;const blocked=new Promise(r=>release=r);let concurrentCalls=0;const single=createSender(async()=>{concurrentCalls++;await blocked;return {ok:true,status:200,text:async()=>'{"code":200}'}});const a=single(reg,env),b=single(reg,env);release();await Promise.all([a,b]);assert.equal(concurrentCalls,1);
const unknown=createSender(async()=>{throw Error('network')});await assert.rejects(()=>unknown(reg,env),/delivery_unknown/);const rejected=createSender(async()=>({ok:false,status:400,text:async()=>'unknown click'}));await assert.rejects(()=>rejected(reg,env),/tracker_http_rejected/);
console.log('PASS: explicit goal config, fixed HTTPS destination, no card/email payloads, catalog amount, test-sale separation, signed receipt across cold starts, same-instance concurrent dedupe, uncertain delivery is not retried');

const businessError=createSender(async()=>({ok:true,status:200,text:async()=>'{"error":"unknown conversion"}'}));await assert.rejects(()=>businessError(reg,env),/business_rejected/);
const unknownReply=createSender(async()=>({ok:true,status:200,text:async()=>'<html>unexpected</html>'}));await assert.rejects(()=>unknownReply(reg,env),/reply_unknown/);

const {default:handler}=await import('../api/trackwill.js');
const invoke=async req=>{const r={headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}};await handler(req,r);return r};
assert.equal((await invoke({method:'GET',headers:{}})).code,405);assert.equal((await invoke({method:'POST',headers:{origin:'https://other.example'}})).code,403);assert.equal((await invoke({method:'POST',headers:{origin:'https://elf.pink','content-type':'text/plain'}})).code,415);assert.equal((await invoke({method:'POST',headers:{origin:'https://elf.pink','content-type':'application/json'},body:{...reg,email:'synthetic@example.com'}})).code,400);
console.log('PASS: public handler rejects wrong method, origin, format and personal input fields before delivery');

const order=buildPostback(qa,env);assert.equal(order.url.searchParams.get('ccv1'),'72');assert.equal(order.url.searchParams.get('need-payout'),'false');assert.equal(order.url.searchParams.has('pixel_id'),false);assert.equal(order.url.searchParams.has('fbclid'),false);assert.equal(order.url.searchParams.get('id'),qa.eventId);
for(const type of ['ab','a'.repeat(31),'my.type'])assert.throws(()=>buildPostback(reg,{...env,TRACKWILL_REGISTRATION_TYPE:type}),/goal_not_configured/);
const codedError=createSender(async()=>({ok:true,status:200,text:async()=>'{"code":400,"message":"clickid is not valid"}'}));await assert.rejects(()=>codedError(reg,env),/business_rejected/);
console.log('PASS: documented code=200 acceptance, 3–30 char goal format, stable event id, test amount in ccv1 with zero payout and no Meta forwarding');
