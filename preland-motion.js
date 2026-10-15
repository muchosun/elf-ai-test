import {t as initMotion, B as scroll, S as animate, U as transform} from './assets/vendor/foxy-motion/motion.CmnkTh_d.mjs';
import {n as initReactDOM, r as createRoot, f as createElement} from './assets/vendor/foxy-motion/react.DdAQygU4.mjs';
import {n as initTopBar, t as TopBar} from './assets/vendor/foxy-motion/IW488RXnU.Bc0ulOAo.mjs';
import {n as initFAQ, ElfFAQItem} from './assets/vendor/foxy-motion/cLrcTBdd9.BEtB0ioM.mjs';
import {n as initVideo, t as OriginalVideo} from './assets/vendor/foxy-motion/Video.BHv-R2-E.mjs';
import {n as initPricing, t as OriginalPricing} from './assets/vendor/foxy-motion/VKnxAh5Hr.Bha0_yUn.mjs';

// Source: Foxy /of-creators, published Framer bundle captured 2026-10-12.
// Use its original Motion runtime and exact transform targets, not new easing.
initMotion();
initReactDOM();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const cleanup = [];
const pricing = document.querySelector('#pricing');
if(pricing){
  initPricing();
  const root=createRoot(pricing);
  root.render(createElement(OriginalPricing,{variant:'Yearly',width:'100%',style:{width:'100%'},w47Apfxko:{current:pricing}}));
  cleanup.push(()=>root.unmount());
}
// Inherit the original player's viewport loading/autoplay behavior as well.
initVideo();
for (const video of document.querySelectorAll('[data-local-video]')) {
  // The first screen must start from HTML parsing, before the React player loads.
  // Keep its existing video node so hydration does not restart the media request.
  if (video.hasAttribute('data-native-hero')) {
    video.autoplay = !reduced.matches;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || reduced.matches) video.pause();
      else video.play().catch(() => {});
    });
    observer.observe(video);
    cleanup.push(() => observer.disconnect());
    if (reduced.matches) video.pause();
    continue;
  }
  const srcUrl = video.getAttribute('src'), poster = video.getAttribute('poster');
  const root = createRoot(video.parentElement);
  root.render(createElement(OriginalVideo, {
    srcType: 'URL', srcUrl, playing: !reduced.matches, muted: true,
    loop: true, playsinline: true, controls: false, objectFit: 'cover',
    posterEnabled: !!poster, poster, startTime: 0, volume: 0,
    width: '100%', height: '100%', style: {width: '100%', height: '100%'},
  }));
  cleanup.push(() => root.unmount());
}
// Keep the original FAQ component, including its .5s [.7,0,.3,1] transition.
// Product answers are passed as props, not rewritten layout or motion.
initFAQ();
const phone = matchMedia('(max-width:699.98px)');
for (const item of document.querySelectorAll('[data-elf-faq-question]')) {
  const question = item.dataset.elfFaqQuestion, answer = item.dataset.elfFaqAnswer;
  const root = createRoot(item.parentElement);
  const render = () => root.render(createElement(ElfFAQItem, {
    H4UdLwf22: question, Jd7HH3hWj: answer,
    width: '100%', style: {width: '100%'},
    variant: phone.matches ? 'oXMwS_y1L' : 'aL2qPyRN9',
  }));
  render(); phone.addEventListener('change', render);
  cleanup.push(() => {phone.removeEventListener('change', render);root.unmount();});
}
for (const [selector, from, to] of [
  ['.framer-qympdk', 100, 0],
  ['.framer-hia8pw', 0, 100],
  ['.framer-1yot3rm', 100, 0],
]) {
  const target = document.querySelector(selector);
  if (!target) continue;
  if (reduced.matches) { target.style.transform = 'none'; continue; }
  cleanup.push(scroll(progress => {
    target.style.transform = `translateY(${transform(progress, [0, 1], [from, to])}px)`;
  }, {target, offset: ['start end', 'end end']}));
}

const footer = document.querySelector('#footer');
const footerContent = document.querySelector('.framer-1pvrbrt-container');
if (footer && footerContent && !reduced.matches) {
  cleanup.push(scroll((_, {y}) => {
    let top = 0;
    for (let node = footer; node; node = node.offsetParent) top += node.offsetTop;
    // Framer's onScrollTarget threshold=1 and layout offset LT=1.
    const start = Math.max(top - 1 - y.containerLength, 0);
    const end = Math.max(top + footer.clientHeight - 1 - y.containerLength, 0);
    footerContent.style.transform = `translateY(${transform(y.current, [start, end], [-100, 0])}px)`;
  }));
}

// Mount the original self-cycling component (2500ms variants; original springs).
// Only the three product statements were changed to Elf preview statements.
const topBar = document.querySelector('.framer-qjfe9x-container');
if (topBar && !reduced.matches) {
  initTopBar();
  const root = createRoot(topBar);
  root.render(createElement(TopBar, {
    height: '100%', width: '100%', style: {width: '100%'}, variant: 'tlqHE68jx',
  }));
  cleanup.push(() => root.unmount());
}

const sticky = document.querySelector('#sticky-cta');
const hero = document.querySelector('#hero');
if (sticky && hero) {
  let last, animation;
  const observer = new IntersectionObserver(([entry]) => {
    const shown = entry.boundingClientRect.bottom <= innerHeight / 2;
    if (shown === last) return;
    last = shown;
    animation?.stop();
    sticky.style.visibility = 'visible';
    if (reduced.matches) sticky.style.transform = `translateY(${shown ? 0 : 130}px)`;
    else animation = animate(sticky, {y: shown ? 0 : 130}, {
      type: 'spring', bounce: 0, duration: .8, delay: 0,
    });
    sticky.style.pointerEvents = shown ? 'auto' : 'none';
  }, {rootMargin: '0px 0px -50% 0px', threshold: 0});
  sticky.style.transform = 'translateY(130px)';
  observer.observe(hero);
  cleanup.push(() => { observer.disconnect(); animation?.stop(); });
}
addEventListener('pagehide', () => cleanup.forEach(stop => stop()), {once: true});
