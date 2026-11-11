async page=>{
 const results=[];
 for(const blocked of [false,true]){
  const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()+' '+(r.postData()||'')));
  await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* local QA */'}));
  if(blocked)await p.route('**/meta-pixel.js',r=>r.abort());else await p.route('https://connect.facebook.net/**',r=>r.fulfill({contentType:'text/javascript',body:'/* capture queued fbq calls without sending local test traffic */'}));
  await p.goto('http://127.0.0.1:4186/test-checkout.html');await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_checkout_opened'));
  const f=p.frameLocator('#checkout-frame');await f.locator('#payment-fields:not([disabled])').waitFor();
  const before=await p.evaluate(()=>window.fbq?.queue?Array.from(fbq.queue).map(x=>Array.from(x)):[]);
  const isolated=await p.evaluate(()=>document.querySelector('iframe').contentDocument===null);
  await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4242420000001230');await f.getByLabel('Expiry date').fill('0933');await f.getByLabel('Security code').fill('456');await f.getByRole('button',{name:'Submit',exact:true}).click();await p.getByRole('heading',{name:'Payment complete',exact:true}).waitFor();await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_payment_simulated'));
  const after=await p.evaluate(()=>window.fbq?.queue?Array.from(fbq.queue).map(x=>Array.from(x)):[]),all=[...before,...after];
  if(!blocked){if(before.filter(x=>x[2]==='InitiateCheckout').length!==1||after.filter(x=>x[2]==='TestPaymentSimulated').length!==1)throw Error('Missing Meta stage');const a=before.find(x=>x[2]==='InitiateCheckout')[3].qa_attempt_id,b=after.find(x=>x[2]==='TestPaymentSimulated')[3].qa_attempt_id;if(a!==b)throw Error('Attempt mismatch')}
  if(all.some(x=>x[2]==='Purchase'))throw Error('Unexpected standard Purchase');
  if(/4242420000001230|Alex Example/.test(JSON.stringify({requests,all})))throw Error('Field leak');if(!isolated||errors.length)throw Error('Isolation/JS error');
  await p.reload();await p.waitForTimeout(250);if(await p.evaluate(()=>Boolean(window.ElfPixel)))throw Error('Completion replayed on refresh');
  results.push({metaModuleBlocked:blocked,formCompleted:true,iframeIsolated:isolated,metaEvents:all.filter(x=>String(x[0]).startsWith('track')).map(x=>({name:x[2],pixel:x[1],value:x[3]?.value})),noFieldValues:true,noDefaultPurchase:true,errors});await ctx.close();
 }
 return results;
}
