import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../trackwill-client.js',import.meta.url),'utf8'),values=new Map(),sent=[];let sequence=0;
const locks={request:async(name,job)=>job()};
function boot(fetcher=async(url,init)=>{sent.push({url,...init,body:JSON.parse(init.body)});return {ok:true,status:200,json:async()=>({providerCode:200,delivery:'accepted'})}}){
 const w={ELF_TRACKING_CONFIG:{trackwillPostbacks:true},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},navigator:{locks},crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`},fetch:fetcher,setTimeout:()=>1,clearTimeout:()=>{}};
 vm.runInNewContext(source,{window:w,AbortController});return w;
}
const attr={sub5:'dbq75h9371ks9ev7vt20',sub4:'1003891172735447',fbclid:''},w=boot();
assert.equal(w.ElfTrackwill.enqueue('sign_up',attr,{email:'private@example.com',card:'4111111111111111'}),true);await new Promise(setImmediate);assert.equal(sent.length,1);assert.equal(sent[0].body.event,'registration');assert.equal(sent[0].keepalive,true);assert.ok(!JSON.stringify(sent).includes('private@example.com'));assert.ok(!JSON.stringify(sent).includes('4111111111111111'));assert.ok(!Object.hasOwn(sent[0].body,'fbclid'));
assert.equal(w.ElfTrackwill.enqueue('sign_up',attr),false);boot();await new Promise(setImmediate);assert.equal(sent.length,1);
const order={plan:'annual',attempt_id:'c2ab1630-82bd-4267-9786-9618b32d3d85',value:999999,card:'4111111111111111'};assert.equal(w.ElfTrackwill.enqueue('qa_payment_simulated',attr,order),true);await new Promise(setImmediate);assert.equal(sent.length,2);assert.equal(sent[1].body.event,'test_order');assert.equal(sent[1].body.plan,'annual');assert.ok(!Object.hasOwn(sent[1].body,'value'));assert.ok(!Object.hasOwn(sent[1].body,'pixelId'));assert.ok(!JSON.stringify(sent).includes('4111111111111111'));assert.equal(w.ElfTrackwill.enqueue('qa_payment_simulated',attr,order),false);
assert.equal(w.ElfTrackwill.enqueue('screen_view',attr),false);assert.equal(w.ElfTrackwill.enqueue('sign_up',{...attr,sub4:'another-pixel'}),false);assert.equal(w.ElfTrackwill.enqueue('sign_up',{sub5:'private@example.com'}),false);
let failedCalls=0;const fail=boot(async()=>{failedCalls++;throw Error('uncertain network')});assert.equal(fail.ElfTrackwill.enqueue('sign_up',{sub5:'anotherclick123'}),true);await new Promise(setImmediate);fail.ElfTrackwill.flush();boot();await new Promise(setImmediate);assert.equal(failedCalls,1);assert.equal(JSON.parse(values.get('elf.tw.delivery.v1')).find(r=>r.payload.clickId==='anotherclick123').state,'unknown');
const protectedQueue=JSON.parse(values.get('elf.tw.delivery.v1'));protectedQueue.push({key:'badclick123:registration',payload:{clickId:'badclick123',event:'registration',eventId:order.attempt_id,email:'private@example.com'},state:'pending',createdAt:Date.now()});values.set('elf.tw.delivery.v1',JSON.stringify(protectedQueue));const before=sent.length;boot();await new Promise(setImmediate);assert.equal(sent.length,before);
console.log('PASS: registration/test-order-only metadata payloads, no payment values, reload dedupe, explicit unknown-delivery state with no automatic retry, tampered queue fields rejected');
