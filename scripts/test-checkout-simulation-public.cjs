async page=>{
 const base='https://elf.pink',live=base.startsWith('https://elf.pink');
 const assert=(v,m)=>{if(!v)throw Error(m)};
 function luhn(s){let sum=0;for(let i=s.length-1,dbl=false;i>=0;i--,dbl=!dbl){let n=+s[i];if(dbl){n*=2;if(n>9)n-=9}sum+=n}return sum%10===0}
 const stem='424242000000123',candidate=Array.from({length:10},(_,i)=>stem+i).find(luhn),bad=candidate.slice(0,-1)+(Number(candidate.at(-1))+1)%10;
 const results=[];
 for(const [label,number,valid]of [['generated-valid',candidate,true],['invalid-checksum',bad,false]]){
  const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),responses=[],errors=[];let leaked=false,providerCalls=0;
  p.on('pageerror',e=>errors.push(e.message));
  p.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/api/checkout'||u.hostname==='api.pagator.app')providerCalls++;const data=decodeURIComponent(r.url()+' '+(r.postData()||''));if(data.includes(number)||data.includes(number.replace(/(.{4})(?=.)/g,'$1 '))||data.includes('Alex Example'))leaked=true});
  p.on('response',r=>{const u=new URL(r.url());if(!u.hostname.endsWith('google-analytics.com')||!u.pathname.endsWith('/collect'))return;for(const line of ['',...(r.request().postData()||'').split('\n')]){const q=new URLSearchParams(line),name=q.get('en')||u.searchParams.get('en');if(name&&!responses.some(x=>x.name===name))responses.push({name,status:r.status(),attempt:q.get('ep.attempt_id')||u.searchParams.get('ep.attempt_id')})}});
  if(!live)await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* local privacy QA */'}));
  await p.goto(base+'/test-checkout.html');await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_checkout_opened'));
  const f=p.frameLocator('#checkout-frame');assert(await f.locator('.notice').count()===0,'Test label missing');
  await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill(number);await f.getByLabel('Expiry date').fill('0933');await f.getByLabel('Security code').fill('456');
  const inputEvents=await p.evaluate(()=>dataLayer.filter(x=>x[0]==='event').map(x=>({name:x[1],props:JSON.parse(JSON.stringify(x[2]))})));
  await f.getByRole('button',{name:'Submit',exact:true}).click();
  if(valid){
   await p.waitForURL('**/test-checkout-result.html?**');await p.getByRole('heading',{name:'Payment complete',exact:true}).waitFor();
   await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_payment_simulated'));
  }else{
   await f.locator('#error').waitFor({state:'visible'});assert((await f.locator('input').evaluateAll(inputs=>inputs.every(i=>!i.value))),'Invalid input not cleared');
  }
  const expected=valid?'qa_payment_simulated':'qa_validation_failed';
  if(live){for(let i=0;i<60&&!responses.some(x=>x.name===expected&&x.status===204);i++)await p.waitForTimeout(250);assert(responses.some(x=>x.name===expected&&x.status===204),'GA did not acknowledge '+expected)}
  const events=await p.evaluate(()=>dataLayer.filter(x=>x[0]==='event').map(x=>({name:x[1],props:JSON.parse(JSON.stringify(x[2]))})));
  const all=[...inputEvents,...events];assert(!all.some(x=>x.name==='purchase'),'Real Purchase emitted');
  assert(!all.some(x=>x.name===(valid?'qa_validation_failed':'qa_payment_simulated')),'Wrong path emitted');assert(all.some(x=>x.name===expected),'Missing expected event');
  const saved=await p.evaluate(()=>JSON.stringify({...sessionStorage}));assert(!saved.includes(number)&&!saved.includes('Alex Example')&&!JSON.stringify(all).includes(number),'Input persisted');assert(!leaked&&!providerCalls&&!errors.length,'Leak/provider/script error');
  await p.screenshot({path:'output/playwright/test-checkout-simulation/'+(live?'public-':'local-')+label+'.png',fullPage:true});
  if(valid){await p.reload();await p.waitForTimeout(200);assert(await p.evaluate(()=>typeof dataLayer==='undefined'),'Simulation replayed on refresh')}
  results.push({scenario:label,acceptedAsSimulation:valid,expectedEvent:expected,events:[...new Set(all.map(x=>x.name))],ga:responses.filter(x=>x.name.startsWith('qa_')||x.name==='checkout_form_completed'),noPurchase:true,noFieldValuesInNetworkOrStorage:true,providerCalls,errors});
  await ctx.close();
 }
 return {live,results};
}
