import { configured } from '../lib/checkout.js';
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }
  return res.status(200).json({ service: 'elf-mavs-checkout', status: 'ok', checkoutEnabled: configured(process.env) });
}
