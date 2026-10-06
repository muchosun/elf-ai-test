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
document.querySelectorAll('[data-cta]').forEach(link => {
  link.href = './index.html' + location.search + '#' + link.dataset.cta;
  link.addEventListener('click', () => {
    record('preland_cta', {destination: link.dataset.cta, period});
    try {
      const preferences = JSON.parse(localStorage.getItem('elf.preferences') || '{}');
      preferences.plan = period === 'yearly' ? 'annual' : 'monthly';
      localStorage.setItem('elf.preferences', JSON.stringify(preferences));
    } catch {}
  });
});
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
  if (event.target.closest('[data-preview-info]')) {
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
// Autoplay only media on screen; keep the lower-page videos from downloading on entry.
const observer = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
  target.muted = true;
  if (isIntersecting && !matchMedia('(prefers-reduced-motion: reduce)').matches) target.play().catch(() => {});
  else target.pause();
}), {rootMargin: '100px'});
document.querySelectorAll('[data-local-video]').forEach(video => observer.observe(video));
document.querySelector('#sticky-cta').style.visibility = 'hidden';
const heroObserver = new IntersectionObserver(([entry]) => {
  document.querySelector('#sticky-cta').style.visibility = entry.isIntersecting ? 'hidden' : 'visible';
}, {threshold: 0.1});
heroObserver.observe(document.querySelector('#hero'));
record('preland_view');
