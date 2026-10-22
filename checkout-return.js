export function checkoutReturnURL(href) {
  const url = new URL(href);
  const outcome = url.searchParams.get('mavs_return');
  if (!['success', 'failure'].includes(outcome)) return null;
  for (const key of ['mavs_return', 'merchant_payment_id', 'merchant_customer_id']) url.searchParams.delete(key);
  url.hash = outcome === 'success' ? 'explore' : 'paywall';
  return url.href;
}
