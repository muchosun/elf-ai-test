import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../tracking.js',import.meta.url),'utf8');
const values=new Map(),events=[];
function boot(href,funnel='',ready=true){
 const handlers={};const window={location:{href,origin:new URL(href).origin},document:{documentElement:{dataset:{funnel}}},sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},history:{replaceState(a,b,u){window.location.href=u}},addEventListener:(n,f)=>handlers[n]=f,setTimeout:f=>f(),gtag:ready?((...a)=>{events.push(a);a[2]?.event_callback?.()}):undefined};
 vm.runInNewContext(source,{window,URL});return {window,handlers};
}
let a=boot('https://elf.pink/f/campaign/creators-101?utm_source=meta&clickid=test-click&email=private%40example.com','creators-101');
assert.equal(a.window.ElfTracking.attribution().clickid,'test-click');assert.ok(!a.window.ElfTracking.pageLocation().includes('email='));
let b=boot('https://elf.pink/creators.html#signup','creators-101');assert.ok(b.window.location.href.includes('utm_source=meta'));assert.ok(b.window.location.href.includes('clickid=test-click'));
b.window.ElfTracking.event('sign_up',{method:'google',email:'private@example.com',description:'private'});assert.equal(events.at(-1)[1],'sign_up');assert.ok(!JSON.stringify(events.at(-1)).includes('private'));
let c=boot('https://elf.pink/index.html?mavs_return=success&merchant_payment_id=private-order#paywall');assert.ok(!c.window.ElfTracking.pageLocation().includes('private-order'));assert.equal(c.window.ElfTracking.attribution().funnel,'creators-101');
let d=boot('https://elf.pink/?utm_source=google');assert.equal(d.window.ElfTracking.attribution().clickid,undefined);assert.equal(d.window.ElfTracking.trackwillReady(),false);
d.handlers['elf:analytics']({detail:{name:'registration_complete',properties:{email:'private'}}});assert.equal(events.at(-1)[1],'sign_up');assert.equal(events.at(-1)[2].method,'email');
console.log('PASS: attribution survives OAuth/payment return, new click replaces attribution, analytics excludes PII/payment IDs, TrackWill remains unconfigured');

const pending=JSON.parse(values.get('elf.ga.pending.v1')||'[]');assert.equal(pending.length,0);

const late=boot('https://elf.pink/f/campaign/creators-101','creators-101',false);
late.window.ElfTracking.event('funnel_step_view',{step:'signup'});
assert.equal(JSON.parse(values.get('elf.ga.pending.v1')).length,1);
const oldCount=events.filter(e=>e[1]==='funnel_step_view').length;
boot('https://elf.pink/index.html#paywall');
assert.equal(events.filter(e=>e[1]==='funnel_step_view').length,oldCount+1);
assert.equal(JSON.parse(values.get('elf.ga.pending.v1')).length,0);
console.log('PASS: queued GA event survives page handoff before tag loads and clears after callback');
