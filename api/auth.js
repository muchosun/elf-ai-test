import { authResponse } from '../lib/social-auth.js';

export default async function handler(req, res) {
  const origin = `https://${req.headers.host}`;
  const url = new URL(req.url, origin);
  const path = req.query?.authpath || url.searchParams.get('authpath') || '';
  url.pathname = `/api/auth/${Array.isArray(path) ? path.join('/') : path}`;
  url.searchParams.delete('authpath');
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  const options = {method: req.method, headers};
  if (req.method === 'POST') {
    options.body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body
      : headers.get('content-type')?.includes('application/x-www-form-urlencoded') ? new URLSearchParams(req.body).toString() : JSON.stringify(req.body || {});
  }
  try {
    const response = await authResponse(new Request(url, options));
    res.status(response.status);
    for (const [key, value] of response.headers) if (key !== 'set-cookie') res.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    res.end(await response.text());
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({error:'auth_unavailable'});
  }
}
