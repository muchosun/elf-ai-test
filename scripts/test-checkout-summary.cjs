async page=>{
 const base='http://127.0.0.1:4186',ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://www.googletagmanager.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* visual QA */'}));
 const assert=(v,m)=>{if(!v)throw Error(m)},f=p.frameLocator('#checkout-frame');
 const cases=[['annual','$72.00','$6','80 credits / month',true],['monthly','$9.00','$9','80 credits / month',false],['creator_350_annual','$312.00','$26','350 credits / month',true],['creator_350_monthly','$39.00','$39','350 credits / month',false],['pro_10000_annual','$8,028.00','$669','10,000 credits / month',true]];
 for(const [code,total,rate,credits,annual]of cases){
  await p.goto(base+'/test-checkout.html?plan='+code);await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_checkout_opened'));await f.locator('#payment-fields:not([disabled])').waitFor({state:'visible'});
  assert(await f.locator('#price').innerText()===total,'Total '+code);assert(await f.locator('#monthly-price').innerText()===rate,'Rate '+code);assert(await f.locator('#credit-allowance').innerText()===credits,'Credits '+code);
  assert(await f.locator('#discount-badge').isVisible()===annual,'Discount visibility '+code);assert(await f.locator('#savings-row').isVisible()===annual,'Savings visibility '+code);
  assert(await f.locator('.notice').isVisible(),'Notice hidden');assert(await p.frames().find(x=>x.url().includes('/frame.html')).evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+code);
  if(code==='annual'){assert(await f.locator('#regular-total').innerText()==='$108.00','Reference total');assert(await f.locator('#savings').innerText()==='−$36.00 (33%)','Savings arithmetic');}
  checks.push({code,total,rate,credits,annual});await p.waitForTimeout(250);await p.screenshot({path:'output/playwright/elf-order-summary/'+code+'-mobile.png',fullPage:true});
 }
 await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/test-checkout.html?plan=annual');await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_checkout_opened'));await f.locator('#payment-fields:not([disabled])').waitFor({state:'visible'});await p.waitForTimeout(500);await p.screenshot({path:'output/playwright/elf-order-summary/annual-desktop.png',fullPage:true});
 // Verify the richer catalog payload did not break the original form-to-result path.
 await f.getByLabel('Name on card').fill('Alex Example');await f.getByLabel('Card number',{exact:true}).fill('4242420000001230');await f.getByLabel('Expiry date').fill('0933');await f.getByLabel('Security code').fill('456');await f.getByRole('button',{name:'Submit',exact:true}).click();await p.getByRole('heading',{name:'Test payment complete',exact:true}).waitFor();await p.waitForFunction(()=>window.dataLayer?.some(x=>x[1]==='qa_payment_simulated'));
 assert(!errors.length,errors.join(','));await ctx.close();return {base,checks,desktop:1440,mobile:390,simulatedPaymentPassed:true,errors};
}
