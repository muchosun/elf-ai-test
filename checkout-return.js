export function checkoutReturnURL(href) {
  const url = new URL(href);
  if (url.searchParams.get('mavs_return') !== 'success') return null;
  for (const key of ['mavs_return', 'merchant_payment_id', 'merchant_customer_id']) url.searchParams.delete(key);
  url.hash = 'explore';
  return url.href;
}
