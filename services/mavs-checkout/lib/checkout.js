const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const plans = Object.freeze({ monthly: { amount: 9, label: 'Monthly' }, annual: { amount: 72, label: 'Annual' } });
export class CheckoutError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
function httpsURL(value) {
  try { const u = new URL(value); if (u.protocol === 'https:' && !u.username && !u.password) return u; } catch {}
  throw new CheckoutError(503, 'checkout_not_configured');
}
export function configured(env) {
  if (env.MAVS_SANDBOX_CONFIRMED !== 'true') return false;
  try { config(env); return true; } catch { return false; }
}
function config(env) {
  if (env.MAVS_SANDBOX_CONFIRMED !== 'true') throw new CheckoutError(503, 'sandbox_not_confirmed');
  if (!env.MAVS_API_KEY || !uuid.test(env.MAVS_MERCHANT_ID || '') || !uuid.test(env.MAVS_PROJECT_ID || '')) throw new CheckoutError(503, 'checkout_not_configured');
  const base = httpsURL(env.MAVS_API_BASE);
  const site = httpsURL(env.ELF_SITE_ORIGIN || 'https://muchosun.github.io');
  const success = httpsURL(env.ELF_SUCCESS_URL), failure = httpsURL(env.ELF_FAILURE_URL);
  if (success.origin !== site.origin || failure.origin !== site.origin) throw new CheckoutError(503, 'checkout_not_configured');
  const allowed = (env.MAVS_CHECKOUT_ORIGINS || '').split(',').filter(Boolean).map(v => httpsURL(v.trim()).origin);
  if (!allowed.length) throw new CheckoutError(503, 'checkout_not_configured');
  return { base, success, failure, allowed };
}
export async function createCheckout(input, env, fetcher = fetch) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['plan', 'customerId', 'requestId'].includes(k))) throw new CheckoutError(400, 'invalid_request');
  if (!Object.hasOwn(plans, input.plan) || !uuid.test(input.customerId || '') || !uuid.test(input.requestId || '')) throw new CheckoutError(400, 'invalid_request');
  const c = config(env), plan = plans[input.plan];
  const paymentId = `elf_${input.requestId}`;
  const payload = {
    merchant_id: env.MAVS_MERCHANT_ID,
    project_id: env.MAVS_PROJECT_ID,
    payment_data: { merchant_payment_id: paymentId, methods: ['card'], type: 'sale', amount: plan.amount, currency_code: 'usd', name: `Elf ${plan.label} sandbox test`, description: 'Test checkout. No live subscription or recurring charge.' },
    customer: { merchant_customer_id: input.customerId },
    callback: { success_url: c.success.href, failure_url: c.failure.href },
    upsales: []
  };
  let response;
  try { response = await fetcher(new URL('/v1/checkout', c.base), { method: 'POST', headers: { 'X-Api-Key': env.MAVS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000), redirect: 'error' }); }
  catch { throw new CheckoutError(502, 'provider_unavailable'); }
  if (!response.ok) {
    if (response.status === 409) throw new CheckoutError(409, 'checkout_already_requested');
    if (response.status === 429) throw new CheckoutError(429, 'provider_busy');
    throw new CheckoutError(502, 'provider_rejected_checkout');
  }
  let data; try { data = await response.json(); } catch { throw new CheckoutError(502, 'invalid_provider_response'); }
  let url; try { url = httpsURL(data.url); } catch { throw new CheckoutError(502, 'invalid_provider_response'); }
  if (!c.allowed.includes(url.origin)) throw new CheckoutError(502, 'untrusted_checkout_origin');
  return { url: url.href, merchantPaymentId: paymentId, sandbox: true };
}
