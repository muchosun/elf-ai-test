export async function loadSocialSession(fetcher = fetch) {
  try {
    const response = await fetcher('/api/auth/session', {credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(5000)});
    if (!response.ok) return null;
    const session = await response.json();
    return session?.user?.id ? session.user : null;
  } catch { return null; }
}
export async function socialSignIn(label, fetcher = fetch) {
  const id = {Google:'google',Facebook:'facebook',Apple:'apple','X.com':'twitter'}[label];
  if (!id) throw new Error('provider_not_configured');
  const status = await fetcher('/api/auth/status',{credentials:'same-origin',cache:'no-store'});
  const settings = await status.json();
  if (!status.ok || !settings.providers?.some(p => p.id === id && p.enabled)) throw new Error('provider_not_configured');
  return authPost(`signin/${id}`, fetcher);
}
async function authPost(action, fetcher) {
  const csrf = await fetcher('/api/auth/csrf',{credentials:'same-origin',cache:'no-store'});
  const {csrfToken} = await csrf.json();
  if (!csrf.ok || !csrfToken) throw new Error('auth_unavailable');
  const response = await fetcher(`/api/auth/${action}`, {method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},
    body:new URLSearchParams({csrfToken,callbackUrl:new URL('./index.html#signup',location.href).href}).toString()});
  const result = await response.json();
  if (!response.ok || !result.url) throw new Error('auth_unavailable');
  return result.url;
}
export async function socialSignOut(fetcher = fetch) { await authPost('signout', fetcher); }
