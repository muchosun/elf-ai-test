import { CheckoutError, createCheckout } from '../lib/checkout.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  const origin = process.env.ELF_SITE_ORIGIN || 'https://muchosun.github.io';
  if (req.headers.origin !== origin) return res.status(403).json({ error: 'origin_not_allowed' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'json_required' });
  if (Number(req.headers['content-length']) > 4096) return res.status(413).json({ error: 'request_too_large' });
  try {
    let input = req.body;
    if (typeof input === 'string' || Buffer.isBuffer(input)) { if (Buffer.byteLength(input) > 4096) throw new CheckoutError(413, 'request_too_large'); input = JSON.parse(input.toString()); }
    const result = await createCheckout(input, process.env);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'invalid_json' });
    return res.status(error instanceof CheckoutError ? error.status : 500).json({ error: error instanceof CheckoutError ? error.code : 'checkout_failed' });
  }
}
