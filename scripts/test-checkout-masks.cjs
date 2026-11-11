async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),errors=[],messages=[],network=[];
 const assert=(v,m)=>{if(!v)throw Error(m)};
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>network.push(r.url()+' '+(r.postData()||'')));
 await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* privacy QA: transport disabled */'}));
 await p.addInitScript(()=>{window.__messages=[];addEventListener('message',e=>{if(e.data?.type?.startsWith('elf-qa'))__messages.push(e.data)})});
 await p.goto('http://127.0.0.1:4186/test-checkout.html');const f=p.frameLocator('#checkout-frame'),n=f.getByLabel('Card number',{exact:true}),expiry=f.getByLabel('Expiry date'),cvc=f.getByLabel('Security code');await n.waitFor();await p.waitForFunction(()=>{const frame=document.querySelector('iframe');return frame?.contentWindow!==null&&window.dataLayer?.some(x=>x[1]==='qa_checkout_opened')});
 await n.pressSequentially('4111111111111111');assert(await n.inputValue()==='4111 1111 1111 1111','Typing not grouped');assert(await f.locator('#brand-status').innerText()==='Visa','Visa missing');assert(await f.locator('#detected-brand .visa-mark').count()===1,'Visa logo missing');
 await n.evaluate(el=>el.setSelectionRange(5,5));await n.press('Backspace');assert(await n.inputValue()==='4111 1111 1111 111','Backspace across space failed');
 await n.fill('4111111111111111');await n.evaluate(el=>el.setSelectionRange(4,4));await n.press('Delete');assert((await n.inputValue()).replace(/\D/g,'').length===15,'Forward Delete across space failed');
 await n.fill('4111111111111111');await n.evaluate(el=>el.setSelectionRange(5,9));await n.pressSequentially('5555');assert(await n.inputValue()==='4111 5555 1111 1111','Selection replacement failed');assert(await n.evaluate(el=>el.selectionStart)<19,'Caret jumped to end');
 // A browser input event with paste semantics, no OS clipboard reading.
 await n.evaluate(el=>{el.setSelectionRange(0,el.value.length);const data=new DataTransfer();data.setData('text/plain','5555-5555-5555-4444');el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}))});
 assert(await n.inputValue()==='5555 5555 5555 4444','Paste not normalized');assert(await f.locator('#brand-status').innerText()==='Mastercard','Mastercard missing');
 await n.fill('2221000000000009');assert(await f.locator('#brand-status').innerText()==='Mastercard','2-series Mastercard missing');
 await n.fill('abc');assert(await n.inputValue()==='','Letters not removed');assert(await f.locator('#detected-brand').innerText()==='','Stale brand');
 await n.fill('4111111111111112');await expiry.focus();assert(await n.getAttribute('aria-invalid')==='true','Checksum hint missing');
 await n.fill('4111111111111111');await expiry.focus();assert(await n.getAttribute('aria-invalid')==='false','Correction not clearing hint');
 await expiry.pressSequentially('1230');assert(await expiry.inputValue()==='12 / 30','Expiry typing format');
 await expiry.evaluate(el=>el.setSelectionRange(5,5));await expiry.press('Backspace');assert((await expiry.inputValue()).replace(/\D/g,'')==='130','Expiry separator delete');
 await expiry.fill('1330');await cvc.focus();assert(await expiry.getAttribute('aria-invalid')==='true','Invalid month hint');
 await expiry.fill('1230');await cvc.fill('a1b2c3');assert(await cvc.inputValue()==='123','CVC filtering');
 await f.getByLabel('Name on card').fill('Alex Example');await p.screenshot({path:'output/playwright/test-checkout-masks/desktop-visa.png',fullPage:true});
 await p.setViewportSize({width:390,height:844});await n.fill('5555555555554444');await cvc.focus();await p.waitForTimeout(250);await p.screenshot({path:'output/playwright/test-checkout-masks/mobile-mastercard.png',fullPage:true});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Host overflow');assert(await p.frames().find(x=>x.url().includes('/frame.html')).evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Input overflow');
 messages.push(...await p.evaluate(()=>__messages));const stored=await p.evaluate(()=>JSON.stringify({...sessionStorage}));
 assert(!/4111111111111111|5555555555554444|Alex Example|12 \/ 30/.test(JSON.stringify({network,messages,stored})),'Field value leaked');
 assert(!messages.some(x=>'brand'in x||'number'in x||'value'in x),'Brand/input sent to host');
 await f.getByRole('button',{name:'Submit',exact:true}).click();await p.waitForURL('**/test-checkout-result.html?**');await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='checkout_form_completed'));
 assert(!errors.length,errors.join(','));await ctx.close();return {passed:true,typing:true,pasteEvent:true,boundaryBackspace:true,boundaryDelete:true,selectionReplacement:true,caretPreserved:true,visa:true,mastercard:true,mastercard2Series:true,expiryMask:true,cvcNumeric:true,localValidationHints:true,noFieldValuesOrBrandSent:true,qaCompletion:true,desktop:1440,mobile:390};
}
