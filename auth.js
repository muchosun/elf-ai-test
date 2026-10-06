// Device-only preview accounts. This is not server authentication.
const ACCOUNT_KEY='elf.account', SESSION_KEY='elf.session';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let account=null, session=null;
try { account=JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'null'); session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); } catch {}
if(!account||typeof account.email!=='string'||typeof account.id!=='string'||typeof account.verifier!=='string'||typeof account.salt!=='string')account=null;
export const currentAccount=()=>account;
export const signedIn=()=>Boolean(account&&session?.accountId===account.id);
export function signOut(){localStorage.removeItem(SESSION_KEY);session=null;}
export function completeOnboarding(){if(!account)return;account={...account,onboardingComplete:true};localStorage.setItem(ACCOUNT_KEY,JSON.stringify(account));}
function bytesToHex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function derive(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/.{2}/g),s=>parseInt(s,16)),iterations:120000,hash:'SHA-256'},key,256);return bytesToHex(new Uint8Array(bits));}
export function authScreen(mode='signup'){
 const signup=mode==='signup';
 return `<section class="auth-page"><div class="auth-background"></div><header class="auth-header"><button data-action="auth-back" aria-label="Back"><img src="./assets/auth-back.svg" alt=""></button><button data-action="help" aria-label="Help"><img src="./assets/auth-help.svg" alt=""></button></header><div class="auth-mobile-logo logo">elf</div><div class="auth-card"><div class="auth-title"><span class="logo">elf</span><h1>${signup?'Start creating':'Welcome back'}</h1></div><div class="auth-social">${[['google','Google'],['facebook','Facebook'],['apple','Apple'],['x','X.com']].map(([id,label])=>`<button type="button" data-action="auth-provider" data-provider="${label}" aria-label="${signup?'Sign up':'Log in'} with ${label}">${label}<img src="./assets/auth-${id}.svg" alt=""></button>`).join('')}</div><p class="auth-divider">Or continue with</p><form id="auth-form" class="auth-form" data-mode="${mode}"><input type="email" id="auth-email" name="email" placeholder="Your email" aria-label="Your email" autocomplete="email" required maxlength="254"><div id="auth-password-area" hidden><input type="password" id="auth-password" name="password" placeholder="Enter password" aria-label="Enter password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" required><button class="auth-submit" type="submit" disabled>Continue</button></div><p id="auth-error" role="alert" hidden></p></form><p class="auth-switch">${signup?'Already have an account?':'Don‘t have an account?'} <a href="#${signup?'login':'signup'}">${signup?'Log in':'Sign up'}</a></p><button class="auth-forgot" data-action="auth-forgot">Forgot password</button><p class="auth-legal">By continuing, you agree to Elf’s <button data-action="local-terms">Terms of Service</button> and <button data-action="privacy">Privacy Policy</button></p><p class="auth-preview">Local preview · Account stays on this device</p></div></section>`;
}
export function updateAuthFields(){const email=document.querySelector('#auth-email');if(!email)return;const area=document.querySelector('#auth-password-area'),pw=document.querySelector('#auth-password');area.hidden=!email.value.trim();area.querySelector('button').disabled=!email.validity.valid||pw.value.length<8;}
export async function submitAuth(form){const email=form.querySelector('[name=email]').value.trim().toLowerCase(),password=form.querySelector('[name=password]').value;const error=form.querySelector('#auth-error');const button=form.querySelector('.auth-submit');error.hidden=true;
 if(!form.reportValidity())return null;
 button.disabled=true;button.textContent='Please wait…';
 try{
  if(form.dataset.mode==='signup'){
   if(account){error.textContent=account.email===email?'This account already exists on this device. Log in to continue.':'An account already exists on this device. Log out does not delete it.';error.hidden=false;return null;}
   const salt=bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
   const verifier=await derive(password,salt);
   const next={id:crypto.randomUUID(),email,salt,verifier,createdAt:new Date().toISOString(),onboardingComplete:false};
   localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));account=next;
  }else{
   if(!account||account.email!==email||await derive(password,account.salt)!==account.verifier){error.textContent='Email or password doesn’t match the account saved on this device.';error.hidden=false;return null;}
  }
  const nextSession={accountId:account.id,createdAt:new Date().toISOString()};localStorage.setItem(SESSION_KEY,JSON.stringify(nextSession));session=nextSession;form.reset();return account;
 }catch{error.textContent='Could not save your local account. Allow browser storage and try again.';error.hidden=false;return null;}
 finally{button.textContent='Continue';updateAuthFields();}
}
export function accountLabel(){return account?escape(account.email):'';}
