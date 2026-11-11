async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await ctx.newPage();
 const received=[],errors=[],fieldRequests=[],qaMessages=[];let leaked=false,providerCalls=0;
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const syntheticEmail='qa.release.elf@example.com';
 p.on('pageerror',e=>errors.push(e.message));
 p.on('request',r=>{const u=new URL(r.url());if(u.pathname==='/api/checkout')providerCalls++;if(r.frame().url().includes('/test-checkout/frame.html')&&!u.pathname.endsWith('frame.html')&&!u.pathname.endsWith('test-checkout.css'))fieldRequests.push(u.origin+u.pathname);if(u.hostname.endsWith('google-analytics.com')){const data=decodeURIComponent(r.url()+' '+(r.postData()||''));if([syntheticEmail,'Alex Example','4111111111111111','5555555555554444','12/30'].some(x=>data.includes(x)))leaked=true;}});
 p.on('response',r=>{const u=new URL(r.url());if(!u.hostname.endsWith('google-analytics.com')||!u.pathname.endsWith('/collect'))return;for(const line of ['',...(r.request().postData()||'').split('\n')]){const q=new URLSearchParams(line),get=k=>q.get(k)||u.searchParams.get(k),name=get('en');if(name&&!received.some(x=>x.name===name&&x.attempt===get('ep.attempt_id')))received.push({name,status:r.status(),attempt:get('ep.attempt_id'),client:get('cid')})}});
 await p.addInitScript(()=>{window.__safeQAMessages=[];addEventListener('message',e=>{if(e.data?.type==='elf-qa-checkout')__safeQAMessages.push(e.data)})});
 const waitFor=async name=>{for(let i=0;i<60;i++){if(received.some(x=>x.name===name))return;await p.waitForTimeout(250)}throw Error('GA did not acknowledge '+name)};
 await p.goto('https://elf.pink/f/campaign/creators-101?utm_source=qa&utm_campaign=checkout-release');
 await p.frameLocator('iframe').getByRole('button',{name:'Start now',exact:true}).click();
 await p.getByRole('button',{name:'Design new character',exact:true}).click();await p.getByRole('button',{name:'Female',exact:true}).click();
 const definition=await(await p.request.get('https://elf.pink/campaign/definition.json')).json();
 for(const s of definition.branches[2].steps){if(s.field.options)await p.getByRole('button',{name:s.field.options[0].label,exact:true}).click();else await p.getByRole('button',{name:'Continue',exact:true}).click()}
 await p.getByRole('button',{name:'Continue with email',exact:true}).click();await p.locator('#auth-email').fill(syntheticEmail);await p.locator('#auth-password').fill('Synthetic-QA-2026-Preview');await p.locator('.auth-submit').click();await p.getByRole('heading',{name:'START CREATING'}).waitFor();await waitFor('sign_up');
 await p.locator('[data-action=checkout]').click();await p.waitForURL('**/test-checkout.html?**');const f=p.frameLocator('#checkout-frame');await f.getByLabel('Name on card').waitFor();await waitFor('qa_checkout_opened');
 assert(await f.locator('#email').count()===0,'Email remains in checkout');assert(await f.locator('.notice').count()===0,'Disclosure missing');
 await p.screenshot({path:'output/playwright/test-checkout-release/01-public-checkout-mobile.png',fullPage:true});
 await f.getByLabel('Name on card').fill('Alex Example');await waitFor('qa_form_started');await f.getByRole('button',{name:'Submit',exact:true}).click();await waitFor('qa_validation_failed');
 await f.getByRole('button',{name:'Terms of Service',exact:true}).click();assert(await f.getByRole('dialog').isVisible(),'Terms broken');await f.getByRole('button',{name:'Close',exact:true}).click();
 await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4111111111111111');await f.getByLabel('Expiry date').fill('12/30');await f.getByLabel('Security code').fill('123');await waitFor('qa_form_filled');
 qaMessages.push(...await p.evaluate(()=>__safeQAMessages));
 await f.getByRole('button',{name:'Submit',exact:true}).click();await p.waitForURL('**/test-checkout-result.html?**');await waitFor('checkout_form_completed');await p.screenshot({path:'output/playwright/test-checkout-release/02-public-result.png',fullPage:true});
 const qa=received.filter(x=>x.name.startsWith('qa_')||x.name==='checkout_form_completed');assert(qa.length===5,'Missing/extra stage');assert(qa.every(x=>x.status===204),'GA error');assert(new Set(qa.map(x=>x.attempt)).size===1&&qa[0].attempt,'Attempt mismatch');
 const signup=received.find(x=>x.name==='sign_up');assert(qa.every(x=>x.client===signup.client),'Browser ID changed');assert(!leaked,'Fields in GA');assert(!fieldRequests.length,'Unexpected input-document traffic');assert(!providerCalls,'MAVS was called');
 const saved=await p.evaluate(()=>JSON.stringify({...sessionStorage}));assert(!saved.includes('Alex Example')&&!saved.includes('4111111111111111'),'Fields in storage');
 await p.reload();await p.waitForTimeout(300);assert(await p.evaluate(()=>typeof dataLayer==='undefined'),'Completion replayed');
 await p.setViewportSize({width:1440,height:1000});await p.goto('https://elf.pink/test-checkout.html?plan=monthly');await f.getByLabel('Name on card').waitFor();assert(await f.locator('#price').innerText()==='$9.00','Wrong monthly price');await p.screenshot({path:'output/playwright/test-checkout-release/03-public-checkout-desktop.png',fullPage:true});
 assert(!errors.length,errors.join(','));await ctx.close();return {passed:true,flow:'campaign quiz → email signup → paywall → QA checkout → validation error → completion',events:qa.map(({name,status,attempt})=>({name,status,attempt})),signupStatus:signup.status,sameBrowserId:true,noEmailField:true,noFieldDataInAnalytics:true,noFieldDataInStorage:true,noInputNetwork:true,providerCalls,errors,screenshots:'output/playwright/test-checkout-release'};
}
