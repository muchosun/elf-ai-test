// Browser-scoped deduplication; this is not a global account registry.
const intentKey='elf.google.registration.intent';
export function beginGoogleRegistration(storage, now=Date.now()) {
  try { storage.setItem(intentKey,String(now)); } catch {}
}
export function completeGoogleRegistration(user, pixel, pending, remembered, now=Date.now()) {
  if (!user?.id) return false;
  try {
    const raw=pending.getItem(intentKey);
    if (!raw) return false;
    pending.removeItem(intentKey);
    const age=now-Number(raw);
    if (!Number.isFinite(age)||age<0||age>15*60*1000) return false;
    const key=`elf.meta.google.registration.${user.id}`;
    if (remembered.getItem(key)||typeof pixel?.registration!=='function') return false;
    remembered.setItem(key,'true');
    pixel.registration('google');
    return true;
  } catch { return false; }
}
