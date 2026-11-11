import '../meta-pixel.js';
import {initializeSocialAuth,currentAccount,signedIn} from '../auth.js';
import {socialSignIn} from '../social-auth-client.js';
const root=document.querySelector('#campaign-root'),track=(name,props={})=>window.ElfTracking?.event(name,props);
const [definition,templates,custom]=await Promise.all(['/campaign/definition.json','/campaign/steps.json','/campaign/custom.json'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error('Could not load campaign');return r.json()})));
let state={position:0,type:null,gender:null,answers:{}};
try{state={...state,...JSON.parse(localStorage.getItem('elf.creators.v1')||'{}')}}catch{}
let photo=null,frame=null,port=null;
window.ElfPixel?.init();
const user=await initializeSocialAuth();
// The shared paywall app consumes the verified signup intent after the handoff.
const notice=t=>{document.querySelector('.campaign-notice')?.remove();const n=document.createElement('p');n.className='campaign-notice';n.setAttribute('role','alert');n.textContent=t;document.body.append(n);setTimeout(()=>n.remove(),6000)};
function branch(){return definition.branches.find(b=>b.characterType===state.type&&b.selectors.gender===state.gender)}
function sequence(){return [{key:'welcome',custom:'welcome'},{key:'character-type',step:definition.entrySteps[1]},{key:state.type==='real'?'real-gender':'virtual-gender',step:definition.entrySteps[state.type==='real'?2:3]},...(branch()?.steps||[]).map(s=>({key:s.kind==='custom'?'story':`${state.gender}-${s.kind==='photos'?'photo':s.field.key}`,custom:s.kind==='custom'?'story':null,step:s})),{key:'signup',step:definition.signup}]}
function save(){try{localStorage.setItem('elf.creators.v1',JSON.stringify(state))}catch{}}
function paywall(){save();track('quiz_complete',{branch:state.type});const p=new URL('/index.html',location.origin);p.hash='paywall';p.searchParams.set('funnel','creators-101');location.assign(window.ElfTracking?.withAttribution(p.href)||p.href)}
function setPosition(n){state.position=Math.max(0,Math.min(n,sequence().length-1));save();history.replaceState(null,'',location.pathname+location.search+'#'+(sequence()[state.position].key==='signup'?'signup':state.position));render()}
function advance(){setPosition(state.position+1)}
function goBack(){setPosition(state.position-1)}
function mountCustom(key){frame=document.createElement('iframe');frame.className='campaign-frame';frame.title=key==='welcome'?'Welcome to Elf':'Photo introduction';frame.sandbox='allow-scripts';frame.src='/campaign/'+key+'.html';root.replaceChildren(frame)}
window.addEventListener('message',e=>{if(!frame||e.source!==frame.contentWindow||e.data?.type!=='funnel-step:loaded')return;port?.close();const channel=new MessageChannel();port=channel.port1;port.onmessage=m=>{if(m.data?.type==='complete')advance();if(m.data?.type==='back')goBack();if(m.data?.type==='track')track('quiz_animation',{step:sequence()[state.position].key})};port.start();frame.contentWindow.postMessage({type:'funnel-step:init',init:{context:custom[sequence()[state.position].custom],saved:null,theme:'dark',preview:false}},'*',[channel.port2])});
function render(){
 port?.close();port=null;frame=null;
 const list=sequence();if(state.position>=list.length)state.position=list.length-1;
 const current=list[state.position];
 track('funnel_step_view',{step:current.key,branch:state.type||'entry'});
 if(current.custom){mountCustom(current.custom);return}
 let html=templates[current.key];
 if(!html&&current.key==='male-photo')html=templates['female-photo'];
 if(!html){notice('This step is unavailable. Please go back.');return}
 root.innerHTML=html;
 root.querySelector('h1')?.focus({preventScroll:true});window.scrollTo(0,0);
 for(const video of root.querySelectorAll('video')){
  const option=current.step?.field?.options?.find(o=>o.label===video.getAttribute('aria-label'));
  if(option?.media?.url)video.poster=option.media.url;
  video.muted=true;video.playsInline=true;video.preload='metadata';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=true;video.play().catch(()=>{});video.addEventListener('playing',()=>{const image=video.parentElement.querySelector('img');if(image)image.style.opacity='0'},{once:true})}
 }

 root.querySelector('button[aria-label="Back"]')?.addEventListener('click',goBack);
 const f=current.step?.field;
 if(f?.options){
  const chosen=f.key==='character_type'?state.type:f.key==='gender'?state.gender:state.answers[f.key];
  for(const button of root.querySelectorAll('[data-foxy-step-choices] button[aria-label]')){
   const option=f.options.find(o=>o.label===button.getAttribute('aria-label'));
   button.setAttribute('aria-pressed',String(option?.value===chosen));
   button.addEventListener('click',()=>{let opt=option;if(!opt&&/random/i.test(button.getAttribute('aria-label')||''))opt=f.options[Math.floor(Math.random()*f.options.length)];if(!opt)return;if(f.key==='character_type'){state.type=opt.value;state.gender=null;state.answers={}}else if(f.key==='gender'){state.gender=opt.value;state.answers={}}else state.answers[f.key]=opt.value;advance()});
  }
 }
 if(current.key.endsWith('-description')){
  const text=root.querySelector('textarea,input');if(text)text.value=state.answers.description||'';
  [...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='Continue')?.addEventListener('click',()=>{state.answers.description=text?.value.slice(0,2000)||'';advance()});
 }
 if(current.step?.kind==='photos')photoStep(current.step);
 if(current.key==='signup')signupStep();
}
function photoStep(step){
 const input=root.querySelector('input[type=file]'),button=[...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='Upload photo');
 const example=root.querySelector('img[alt="Photo example"]');if(state.gender==='male'&&example)example.src=definition.branches[1].steps[1].field.props.exampleUrl;
 for(const b of [...root.querySelectorAll('button')].filter(b=>b.getAttribute('aria-label')==='Face and chest photo'||b.textContent.trim()==='Upload photo'))b.addEventListener('click',()=>photo?advance():input.click());
 input.addEventListener('change',async()=>{const f=input.files[0];if(!f)return;if(!['image/jpeg','image/png','image/webp','image/avif'].includes(f.type)||f.size>10*1024*1024){notice('Choose a JPG, PNG, WebP or AVIF photo under 10 MB.');return}try{const bitmap=await createImageBitmap(f);const valid=bitmap.width>=256&&bitmap.height>=256;bitmap.close();if(!valid){notice('The photo must be at least 256 × 256 pixels.');return}}catch{notice('Could not read this image.');return}if(photo)URL.revokeObjectURL(photo);photo=URL.createObjectURL(f);if(example){example.src=photo;example.alt='Selected photo — stored on this device only'}if(button)button.textContent='Continue';notice('Photo selected. It stays on this device.');track('photo_selected',{step:'photo'})});
 [...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='Example')?.addEventListener('click',()=>{const overlay=document.createElement('div');overlay.className='campaign-example';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Photo example');const image=new Image();image.src=step.field.props.exampleUrl;image.alt='Photo example';const close=document.createElement('button');close.textContent='Close';close.onclick=()=>overlay.remove();overlay.append(image,close);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});overlay.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.remove()});document.body.append(overlay);close.focus()});
}
function signupStep(){
 history.replaceState(null,'',location.pathname+location.search+'#signup');
 const buttons=[...root.querySelectorAll('button')];
 buttons.find(b=>b.textContent.trim()==='Continue with Apple')?.remove();
 buttons.find(b=>b.textContent.trim()==='Continue with Google')?.addEventListener('click',async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{if(signedIn()){paywall();return}const target=new URL('/creators.html#signup',location.origin);location.assign(await socialSignIn('Google',fetch,target.href))}catch{b.disabled=false;notice('Could not open Google sign-in. Please try again or continue with email.')}
 });
 buttons.find(b=>b.textContent.trim()==='Continue with email')?.addEventListener('click',()=>{const u=new URL('/index.html',location.origin);u.hash='signup';u.searchParams.set('funnel','creators-101');location.assign(window.ElfTracking?.withAttribution(u.href)||u.href)});
 buttons.find(b=>/Already have an account/.test(b.textContent))?.addEventListener('click',()=>{const u=new URL('/index.html',location.origin);u.hash='login';u.searchParams.set('funnel','creators-101');location.assign(window.ElfTracking?.withAttribution(u.href)||u.href)});
 if(signedIn())paywall();
}
if(location.hash==='#signup'&&signedIn())paywall();else render();
