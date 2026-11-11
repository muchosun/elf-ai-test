async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),received=[];
 p.on('response',r=>{const u=new URL(r.url());if(!u.hostname.endsWith('google-analytics.com')||!u.pathname.endsWith('/collect'))return;const body=r.request().postData()||'';for(const line of ['',...body.split('\n')]){const q=new URLSearchParams(line),name=q.get('en')||u.searchParams.get('en');if(name&&!received.some(x=>x.name===name))received.push({name,status:r.status()})}});
 const waitFor=async name=>{for(let i=0;i<40;i++){if(received.some(x=>x.name===name))return;await p.waitForTimeout(250)}throw Error('No GA response for '+name+': '+JSON.stringify(received))};
 await p.goto('http://127.0.0.1:4186/test-checkout.html?plan=annual');const f=p.frameLocator('#checkout-frame');await f.getByRole('heading',{name:'Checkout',exact:true}).waitFor();await waitFor('qa_checkout_opened');
 await f.getByLabel('Card number',{exact:true}).fill('4111111111111111');await waitFor('qa_form_started');
 await f.getByRole('button',{name:'Submit',exact:true}).click();await waitFor('qa_validation_failed');
 await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4111111111111111');await f.getByLabel('Expiry date').fill('12/30');await f.getByLabel('Security code',{exact:true}).fill('123');await waitFor('qa_form_filled');await f.getByRole('button',{name:'Submit',exact:true}).click();await p.waitForURL('**/test-checkout-result.html?plan=annual');await waitFor('checkout_form_completed');await waitFor('qa_payment_simulated');
 await ctx.close();return {received,debugMode:true,scope:'GA collect HTTP acknowledgement, not GA reporting UI'};
}
