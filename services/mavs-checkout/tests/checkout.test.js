import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configured, createCheckout } from '../lib/checkout.js';
import handler from '../api/checkout.js';
const input = { plan: 'monthly', customerId: '11111111-1111-4111-8111-111111111111', requestId: '22222222-2222-4222-8222-222222222222' };
const env = { MAVS_SANDBOX_CONFIRMED: 'true', MAVS_API_BASE: 'https://api.example.test', MAVS_API_KEY: 'synthetic-test-key', MAVS_MERCHANT_ID: '33333333-3333-4333-8333-333333333333', MAVS_PROJECT_ID: '44444444-4444-4444-8444-444444444444', ELF_SITE_ORIGIN: 'https://muchosun.github.io', ELF_SUCCESS_URL: 'https://muchosun.github.io/elf-ai-test/index.html?mavs_return=success#paywall', ELF_FAILURE_URL: 'https://muchosun.github.io/elf-ai-test/index.html?mavs_return=failure#paywall', MAVS_CHECKOUT_ORIGINS: 'https://pay.example.test' };
const ok = () => Response.json({ url: 'https://pay.example.test/checkout?token=synthetic' }, { status: 201 });
test('unconfirmed sandbox and missing settings never call provider', async () => {
  let calls = 0;
  for (const settings of [{}, { ...env, MAVS_SANDBOX_CONFIRMED: 'false' }, { ...env, MAVS_API_KEY: '' }]) {
    assert.equal(configured(settings), false);
    await assert.rejects(createCheckout(input, settings, () => { calls++; }), e => e.status === 503);
  }
  assert.equal(calls, 0);
});
test('server fixes amount/currency and rejects card data, price overrides, invalid ids', async () => {
  for (const bad of [{ ...input, card: { pan: '4111111111111111' } }, { ...input, amount: 1 }, { ...input, plan: 'toString' }, { ...input, customerId: 'bad' }]) {
    await assert.rejects(createCheckout(bad, env, () => assert.fail('must not call provider')), e => e.status === 400);
  }
  for (const [plan, amount] of [['monthly', 9], ['annual', 72]]) {
    const result = await createCheckout({ ...input, plan }, env, async (url, options) => {
      assert.equal(url.href, 'https://api.example.test/v1/checkout');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers['X-Api-Key'], env.MAVS_API_KEY);
      const body = JSON.parse(options.body);
      assert.equal(body.payment_data.amount, amount);
      assert.equal(body.payment_data.currency_code, 'usd');
      assert.equal(body.payment_data.type, 'sale');
      assert.equal(body.payment_data.merchant_payment_id, `elf_${input.requestId}`);
      assert.equal(body.customer.merchant_customer_id, input.customerId);
      assert.equal(body.callback.success_url, env.ELF_SUCCESS_URL);
      return ok();
    });
    assert.equal(result.sandbox, true);
    assert.equal(JSON.stringify(result).includes(env.MAVS_API_KEY), false);
  }
});
test('rejects untrusted checkout URL and sanitizes provider errors', async () => {
  for (const url of ['http://pay.example.test', 'https://evil.example.test', 'https://user:password@pay.example.test']) {
    await assert.rejects(createCheckout(input, env, async () => Response.json({ url })), e => e.status === 502);
  }
  for (const [status, code] of [[401, 'provider_rejected_checkout'], [409, 'checkout_already_requested'], [429, 'provider_busy']]) {
    await assert.rejects(createCheckout(input, env, async () => new Response('provider-private-details', { status })), e => e.code === code && !e.message.includes('private'));
  }
  await assert.rejects(createCheckout(input, env, async () => { throw new Error('secret'); }), e => e.code === 'provider_unavailable');
});
function response() { return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(v) { this.statusCode = v; return this; }, json(v) { this.body = v; return this; }, end() { return this; } }; }
test('HTTP handler enforces origin, content type, method and CORS preflight', async () => {
  for (const [req, status] of [
    [{ method: 'POST', headers: { origin: 'https://evil.example.test' } }, 403],
    [{ method: 'GET', headers: { origin: 'https://muchosun.github.io' } }, 405],
    [{ method: 'POST', headers: { origin: 'https://muchosun.github.io', 'content-type': 'text/plain' } }, 415],
    [{ method: 'POST', headers: { origin: 'https://muchosun.github.io', 'content-type': 'application/json', 'content-length': '5000' } }, 413],
    [{ method: 'POST', headers: { origin: 'https://muchosun.github.io', 'content-type': 'application/json' }, body: '{' }, 400],
    [{ method: 'OPTIONS', headers: { origin: 'https://muchosun.github.io' } }, 204]
  ]) {
    const res = response(); await handler(req, res); assert.equal(res.statusCode, status);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    if (status !== 403) assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://muchosun.github.io');
  }
});
