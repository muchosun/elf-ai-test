const endpoint = 'https://elf-mavs-checkout.vercel.app/api/checkout';
export async function requestCheckout(plan, customerId, requestId, fetcher = fetch) {
  const response = await fetcher(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, customerId, requestId }), signal: AbortSignal.timeout(25000), credentials: 'omit', cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'checkout_failed');
  const url = new URL(result.url);
  if (url.origin !== 'https://pagator.app' || result.sandbox !== true) throw new Error('untrusted_checkout');
  return url.href;
}
