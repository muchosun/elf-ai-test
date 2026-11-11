(()=>{
 'use strict';
 const plans=__PLANS__;
 const plan=new URLSearchParams(location.search).get('plan');
 const code=Object.hasOwn(plans,plan)?plan:'annual',offer=plans[code];
 document.querySelector('#plan').textContent=offer.label;
 document.querySelector('#price').textContent='$'+offer.amount.toFixed(2);
 const form=document.querySelector('form'),error=document.querySelector('#error');
 const inputs=[...form.querySelectorAll('input')];
 const send=stage=>parent.postMessage({type:'elf-qa-checkout',stage},'*');
 const fixtures=[['4111111111111111','5555555555554444'],['12/30'],['123']];
 const holder=document.querySelector('#cardholder');
 let started=false,filled=false,completed=false;
 const reportFilled=()=>{if(!started&&inputs.some(input=>input.value.trim())){started=true;send('started')}if(!filled&&inputs.every(input=>input.value.trim())){filled=true;send('filled')}};
 form.addEventListener('input',()=>{if(!started){started=true;send('started')}reportFilled();error.textContent=''});
 form.addEventListener('submit',event=>{
  event.preventDefault();if(completed)return;reportFilled();
  const valid=/^[a-z][a-z '-]{0,38}\s[a-z][a-z '-]{0,38}$/i.test(holder.value.trim()) && ['number','expiry','cvc'].every((id,i)=>fixtures[i].includes(document.getElementById(id).value.replace(/\s/g,'')));
  if(!valid){send('invalid');error.textContent='This test accepts only designated QA card details and a fictional name.';form.reset();inputs[0].focus();return;}
  completed=true;form.reset();inputs.forEach(input=>input.value='');send('completed');
 });
 const dialog=document.querySelector('#legal-dialog');
 const info={terms:['Test Terms of Service','This is an interface test for adults aged 18 or over. Use only the supplied synthetic card details and a fictional name. Submit completes the test; no payment, subscription or recurring charge is created.'],privacy:['Privacy Notice','The isolated form does not send or save field values. Its host receives only fixed test-stage signals, selected plan and illustrative price for Google Analytics. Google Analytics may also receive standard device and network information and use cookies. Field values are cleared on completion.']};
 document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{const [title,text]=info[button.dataset.info];document.querySelector('#legal-title').textContent=title;document.querySelector('#legal-text').textContent=text;dialog.showModal()}));
 document.querySelector('#legal-close').addEventListener('click',()=>dialog.close());
 document.querySelector('#back').addEventListener('click',()=>{form.reset();send('back')});
 window.addEventListener('pagehide',()=>form.reset());
 window.addEventListener('pageshow',()=>form.reset());
 const resize=()=>parent.postMessage({type:'elf-qa-size',height:Math.ceil(document.querySelector('main').getBoundingClientRect().bottom+32)},'*');
 new ResizeObserver(resize).observe(document.body);window.addEventListener('resize',resize);
 send('opened');resize();
})();
