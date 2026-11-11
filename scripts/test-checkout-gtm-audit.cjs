async page=>{
 const origin='http://127.0.0.1:4186',ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[],events=[],gtm=[],pages=[];let leak=false;
 p.on('pageerror',e=>errors.push(e.message));
 p.on('response',r=>{const u=new URL(r.url());if(u.hostname==='www.googletagmanager.com'&&u.pathname==='/gtm.js')gtm.push({id:u.searchParams.get('id'),status:r.status()});if(!u.hostname.endsWith('google-analytics.com')||!u.pathname.endsWith('/collect'))return;for(const line of (r.request().postData()||'').split('\n')){const q=new URLSearchParams(line),get=k=>q.get(k)||u.searchParams.get(k);if(get('en'))events.push({name:get('en'),tid:get('tid'),status:r.status()})}});
 p.on('request',r=>{if(/google-analytics.com|facebook.com/.test(r.url())&&/4242420000001230|Alex Example/.test(decodeURIComponent(r.url()+' '+(r.postData()||''))))leak=true});
 for(const path of ['/of-creators.html','/f/campaign/creators-101','/index.html#signup','/test-checkout.html?plan=annual']){
 await p.goto(origin+path);await p.waitForFunction(()=>Boolean(window.google_tag_manager?.['GTM-W492TPB5']));const count=await p.locator('script[src*="/gtm.js?id=GTM-W492TPB5"]').count();if(count!==1)throw Error('Duplicate GTM');pages.push({path,containerLoaded:true,count});
 }
 const f=p.frameLocator('#checkout-frame');await f.locator('#payment-fields:not([disabled])').waitFor();
 if(!await p.evaluate(()=>document.querySelector('#checkout-frame').contentDocument===null))throw Error('Frame isolation broken');
 await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4242420000001230');await f.getByLabel('Expiry date').fill('0933');await f.getByLabel('Security code').fill('456');await f.getByRole('button',{name:'Submit',exact:true}).click();await p.getByRole('heading',{name:'Payment complete',exact:true}).waitFor();await p.waitForFunction(()=>Boolean(window.google_tag_manager?.['GTM-W492TPB5']));
 for(let i=0;i<80&&!events.some(e=>e.name==='qa_payment_simulated'&&e.tid==='G-3K8JP3QX9T'&&e.status===204);i++)await p.waitForTimeout(250);
 const newEvent=events.some(e=>e.name==='qa_payment_simulated'&&e.tid==='G-3K8JP3QX9T'&&e.status===204);if(leak||errors.length)throw Error(JSON.stringify({newEvent,leak,errors}));
 await ctx.close();return {passed:newEvent,origin,pages,gtm,events,noFieldValuesInAnalytics:!leak,errors};
}
