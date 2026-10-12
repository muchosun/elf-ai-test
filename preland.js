import './preland-motion.js?v=20261012-2';
import {selectedOffer} from './services/mavs-checkout/lib/offers.js?v=20261012-2';
const query = new URLSearchParams(location.search);
const record = (name, properties = {}) => {
  try {
    const events = JSON.parse(localStorage.getItem('elf.events') || '[]');
    events.push({name, properties, path: 'preland', timestamp: new Date().toISOString(), utm: Object.fromEntries([...query].filter(([key]) => key.startsWith('utm_')))});
    localStorage.setItem('elf.events', JSON.stringify(events.slice(-300)));
  } catch {}
};
let period = 'yearly';
const pricing = document.querySelector('#pricing');
function setPeriod(next) {
  period = next;
  pricing?.querySelectorAll('[data-period]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.period === period));
    button.classList.toggle('elf-period-active', button.dataset.period === period);
  });
  pricing?.querySelectorAll('[data-preview-price]').forEach(e => e.textContent = period === 'yearly' ? '$6' : '$9');
  pricing?.querySelectorAll('[data-preview-billing]').forEach(e => e.textContent = period === 'yearly' ? '$72 billed yearly · test offer' : '$9 billed monthly · test offer');
}
setPeriod(period);
let choice={tier:'starter',level:0};
addEventListener('elf:offer', event=>{
  const offer=selectedOffer(event.detail?.tier,event.detail?.level);
  period=event.detail?.period==='yearly'?'yearly':'monthly';
  choice={tier:offer.tier,level:offer.level};
  record('preland_offer',{...choice,period,credits:offer.credits});
});
document.querySelectorAll('[data-cta]').forEach(link=>link.href='./index.html'+location.search+'#'+link.dataset.cta);
// Capture before the original Framer router: route to our registration, with
// the exact selected offer and attribution, never to Foxy's account service.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link)return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!url.pathname.endsWith('/index.html')||!['#signup','#login'].includes(url.hash))return;
  event.preventDefault();event.stopImmediatePropagation();
  const destination=url.hash.slice(1);
  record('preland_cta',{destination,period,...choice});
  try{
    const preferences=JSON.parse(localStorage.getItem('elf.preferences')||'{}');
    Object.assign(preferences,{plan:period==='yearly'?'annual':'monthly',tier:choice.tier,creditLevel:choice.level});
    localStorage.setItem('elf.preferences',JSON.stringify(preferences));
  }catch{}
  location.assign('./index.html'+location.search+url.hash);
},true);
function toggleFAQ(button) {
  const answer = document.getElementById(button.getAttribute('aria-controls'));
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  if (answer) answer.hidden = !open;
  button.closest('.framer-QTN76')?.classList.toggle('elf-faq-open', open);
  record('preland_faq', {question: button.textContent.trim(), open});
}
document.addEventListener('click', event => {
  const periodButton = event.target.closest('[data-period]');
  if (periodButton) { setPeriod(periodButton.dataset.period); record('preland_period', {period}); }
  const faqButton = event.target.closest('[data-faq-toggle]');
  if (faqButton) toggleFAQ(faqButton);
  if (event.target.closest('[data-preview-info]:not([data-cta])')) {
    event.preventDefault();
    document.querySelector('#preview-info').showModal();
  }
  if (event.target.closest('[data-close-info]')) document.querySelector('#preview-info').close();
});
document.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  const control = event.target.closest('[data-period],[data-faq-toggle]');
  if (control) {event.preventDefault();control.click();}
});
record('preland_view');
