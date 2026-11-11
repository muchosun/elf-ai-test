(()=>{
 'use strict';
 const plans=__PLANS__;
 const plan=new URLSearchParams(location.search).get('plan');
 const code=Object.hasOwn(plans,plan)?plan:'annual',offer=plans[code];
 document.querySelector('#plan').textContent=offer.label;
 const annual=offer.period==='annual';
 const money=(value,decimals=2)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:decimals,maximumFractionDigits:2}).format(value);
 document.querySelector('#price').textContent=money(offer.amount);
 document.querySelector('#monthly-price').textContent=money(offer.monthlyPrice,0);
 document.querySelector('#credit-allowance').textContent=offer.credits.toLocaleString('en-US')+' credits / month';
 document.querySelector('#billing-period').textContent=annual?'Annual · 12 months':'Monthly · 1 month';
 document.querySelector('#price-basis').textContent=annual?'Monthly equivalent with annual plan':'Monthly plan';
 document.querySelector('#total-label').textContent=annual?'Annual total':'Monthly total';
 document.querySelector('#billing-detail').textContent=annual?'Total for 12 months. The monthly rate shown is an equivalent.':'Total for a 1-month period.';
 for(const id of ['discount-badge','regular-monthly-price','regular-total-row','savings-row'])document.getElementById(id).hidden=!annual||offer.savings<=0;
 document.querySelector('#discount-badge').textContent=offer.discountPercent+'% OFF';
 document.querySelector('#regular-monthly-price').textContent=money(offer.regularMonthlyPrice,0);
 document.querySelector('#regular-total').textContent=money(offer.regularTotal);
 document.querySelector('#savings').textContent='−'+money(offer.savings)+' ('+offer.discountPercent+'%)';
 const form=document.querySelector('form'),error=document.querySelector('#error');
 const inputs=[...form.querySelectorAll('input')];
 const send=stage=>parent.postMessage({type:'elf-qa-checkout',stage},'*');
 const holder=document.querySelector('#cardholder');
 const number=document.querySelector('#number'),expiry=document.querySelector('#expiry'),cvc=document.querySelector('#cvc');
 const brandSlot=document.querySelector('#detected-brand'),brandStatus=document.querySelector('#brand-status');
 function updateBrand(){
  const brand=detectCardBrand(number.value);brandSlot.replaceChildren();number.closest('.number-field').dataset.brand=brand;
  if(brand){const logo=document.querySelector('.payment-brands .'+brand+' svg').cloneNode(true);brandSlot.append(logo)}
  const label=brand==='visa'?'Visa':brand==='mastercard'?'Mastercard':'';brandStatus.textContent=label;
  document.querySelectorAll('.payment-brands .brand').forEach(icon=>icon.classList.toggle('brand-inactive',Boolean(brand)&&!icon.classList.contains(brand)));
 }
 function fieldError(input,message){input.setAttribute('aria-invalid',String(Boolean(message)));const target=document.getElementById(input.id+'-error');target.textContent=message;target.hidden=!message}
 for(const [input,format,limit]of [[number,formatCardNumber,19],[expiry,formatExpiry,4],[cvc,value=>digitsOnly(value).slice(0,3),3]]){
  input.addEventListener('beforeinput',event=>{if(!event.isComposing&&event.inputType.startsWith('insert')&&event.data&&/\D/.test(event.data)){event.preventDefault();insertDigits(input,event.data,limit)}else removeAcrossSeparator(input,event)});
  input.addEventListener('paste',event=>{if(event.clipboardData){event.preventDefault();insertDigits(input,event.clipboardData.getData('text/plain'),limit)}});
  input.addEventListener('input',event=>{if(event.isComposing)return;maskInput(input,format);fieldError(input,'');if(input===number)updateBrand()});
  input.addEventListener('compositionend',()=>{maskInput(input,format);if(input===number)updateBrand()});
 }
 number.addEventListener('blur',()=>fieldError(number,number.value&&(!detectCardBrand(number.value)||!passesLuhn(number.value))?'Check the test card number.':''));
 expiry.addEventListener('blur',()=>{const now=new Date();fieldError(expiry,expiry.value&&!expiryIsCurrent(expiry.value,now.getFullYear(),now.getMonth()+1)?'Enter a valid future date.':'')});
 cvc.addEventListener('blur',()=>fieldError(cvc,cvc.value&&cvc.value.length!==3?'Enter 3 digits.':''));
 form.addEventListener('reset',()=>queueMicrotask(()=>{updateBrand();for(const input of [number,expiry,cvc])fieldError(input,'')}));
 let started=false,filled=false,completed=false;
 const reportFilled=()=>{if(!started&&inputs.some(input=>input.value.trim())){started=true;send('started')}if(!filled&&inputs.every(input=>input.value.trim())){filled=true;send('filled')}};
 form.addEventListener('input',()=>{if(!started){started=true;send('started')}reportFilled();error.textContent=''});
 form.addEventListener('submit',event=>{
  event.preventDefault();if(completed)return;reportFilled();
  const now=new Date();
  const valid=canSimulatePayment(holder.value,number.value,expiry.value,cvc.value,now.getFullYear(),now.getMonth()+1);
  if(!valid){send('invalid');error.textContent='Check the entered test details and try again.';form.reset();inputs[0].focus();return;}
  completed=true;form.reset();inputs.forEach(input=>input.value='');send('completed');
 });
 const dialog=document.querySelector('#legal-dialog');
 const info={terms:['Test Terms of Service','This is an interface test for adults aged 18 or over. Use only synthetic card details and a fictional name. Submit completes a simulated test payment; no payment, subscription or recurring charge is created.'],privacy:['Privacy Notice','The isolated form does not send or save field values. Its host receives only fixed test-stage signals, selected plan and illustrative price for Google Analytics and Meta Pixel. These analytics services may receive standard device and network information and use cookies. Field values are cleared on completion.']};
 document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{const [title,text]=info[button.dataset.info];document.querySelector('#legal-title').textContent=title;document.querySelector('#legal-text').textContent=text;dialog.showModal()}));
 document.querySelector('#legal-close').addEventListener('click',()=>dialog.close());
 document.querySelector('#back').addEventListener('click',()=>{form.reset();send('back')});
 window.addEventListener('pagehide',()=>form.reset());
 window.addEventListener('pageshow',event=>{if(event.persisted)form.reset()});
 const resize=()=>parent.postMessage({type:'elf-qa-size',height:Math.ceil(document.querySelector('main').getBoundingClientRect().bottom+32)},'*');
 new ResizeObserver(resize).observe(document.body);window.addEventListener('resize',resize);
 document.querySelector('#payment-fields').disabled=false;form.removeAttribute('aria-busy');
 send('opened');resize();
})();
