async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),events=[],errors=[];let leak=false;
 p.on('pageerror',e=>errors.push(e.message));
 p.on('request',r=>{if(/facebook\.com|google-analytics\.com/.test(r.url())&&/4242420000001230|Alex Example/.test(decodeURIComponent(r.url()+' '+(r.postData()||''))))leak=true});
 p.on('response',r=>{const u=new URL(r.url());if(u.hostname.endsWith('facebook.com')&&u.pathname.startsWith('/tr'))events.push({name:u.searchParams.get('ev'),pixel:u.searchParams.get('id'),status:r.status(),eventId:u.searchParams.get('eid')})});
 await p.goto('https://elf.pink/test-checkout.html?plan=annual');const f=p.frameLocator('#checkout-frame');await f.locator('#payment-fields:not([disabled])').waitFor();
 const wait=async name=>{for(let i=0;i<60;i++){if(events.some(x=>x.name===name&&x.status===200))return;await p.waitForTimeout(250)}throw Error('No Meta response for '+name)};
 await wait('InitiateCheckout');await p.screenshot({path:'output/playwright/elf-meta-funnel-20261111/public-checkout.png',fullPage:true});
 await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4242420000001230');await f.getByLabel('Expiry date').fill('0933');await f.getByLabel('Security code').fill('456');await f.getByRole('button',{name:'Submit',exact:true}).click();
 await p.getByRole('heading',{name:'Payment complete',exact:true}).waitFor();await wait('TestPaymentSimulated');await p.screenshot({path:'output/playwright/elf-meta-funnel-20261111/public-result.png',fullPage:true});
 if(leak||errors.length||events.some(e=>e.name==='Purchase')||events.some(e=>e.pixel!=='1003891172735447'))throw Error('Privacy/pixel/JS failure');
 const count=events.filter(e=>e.name==='TestPaymentSimulated').length;await p.reload();await p.waitForTimeout(1000);if(events.filter(e=>e.name==='TestPaymentSimulated').length!==count)throw Error('Replay');
 await p.setViewportSize({width:1440,height:1000});await p.goto('https://elf.pink/test-checkout.html?plan=annual');await p.frameLocator('#checkout-frame').locator('#payment-fields:not([disabled])').waitFor();await p.screenshot({path:'output/playwright/elf-meta-funnel-20261111/public-desktop.png',fullPage:true});
 await ctx.close();return {passed:true,scope:'direct public checkout; not TrackWill journey',events,errors,noFieldValuesInAnalytics:!leak,noDefaultPurchase:true,noResultReplay:true,eventsManagerVerified:false};
}
