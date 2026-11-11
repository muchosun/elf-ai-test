// Safe UI-attempt metadata only. Never accepts an account ID, email or field value.
const key='elf.qa.attempt.v1',ttl=30*60*1000;
export function createAttempt(storage,plan,id=crypto.randomUUID(),now=Date.now()){
 const attempt={id,plan,createdAt:now,completed:false};
 try{storage.setItem(key,JSON.stringify(attempt))}catch{}
 return attempt;
}
export function finishAttempt(storage,id){
 try{const attempt=JSON.parse(storage.getItem(key)||'null');if(attempt?.id===id){attempt.completed=true;storage.setItem(key,JSON.stringify(attempt))}}catch{}
}
export function consumeAttempt(storage,plan,now=Date.now()){
 try{
  const attempt=JSON.parse(storage.getItem(key)||'null');
  if(!attempt||attempt.plan!==plan||!attempt.completed||attempt.consumed||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attempt.id)||!Number.isFinite(attempt.createdAt)||now<attempt.createdAt||now-attempt.createdAt>ttl)return null;
  attempt.consumed=true;storage.setItem(key,JSON.stringify(attempt));return attempt;
 }catch{return null}
}
