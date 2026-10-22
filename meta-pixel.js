/* Browser Pixel only. Never put a Conversions API token in this file. */
(function (w, d) {
  if (w.ElfPixel) return;
  const id = '1003891172735447';
  const pendingKey = 'elf.meta.checkout';
  let started = false;
  function init() {
    if (started) return;
    started = true;
    if (!w.fbq) {
      const n = w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!w._fbq) w._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      const script = d.createElement('script');
      script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      d.head.appendChild(script);
    }
    // Explicit events only; do not auto-detect form fields or button actions.
    w.fbq('set', 'autoConfig', false, id);
    w.fbq('init', id);
    w.fbq('trackSingle', id, 'PageView');
  }
  function send(method, event, data) {
    try { init(); w.fbq(method, id, event, data); } catch { /* Analytics must not break the funnel. */ }
  }
  w.ElfPixel = Object.freeze({
    init: () => { try { init(); } catch {} },
    registration: () => send('trackSingle', 'CompleteRegistration', {status: true, content_name: 'Elf device registration'}),
    checkoutOpened: ({plan, value, requestId}) => {
      if (typeof plan !== 'string' || !Number.isFinite(value) || value <= 0) return;
      try { w.sessionStorage.setItem(pendingKey, JSON.stringify({paymentId: 'elf_' + requestId})); } catch {}
      send('trackSingle', 'InitiateCheckout', {content_ids: [plan], content_type: 'product', value, currency: 'USD', num_items: 1, sandbox: true});
    },
    checkoutReturn: href => {
      const url = new URL(href);
      if (url.searchParams.get('mavs_return') !== 'success') return;
      try {
        const pending = JSON.parse(w.sessionStorage.getItem(pendingKey) || 'null');
        if (!pending || pending.paymentId !== url.searchParams.get('merchant_payment_id')) return;
        w.sessionStorage.removeItem(pendingKey);
      } catch { return; }
      // A callback URL is not proof of payment. Never emit Purchase here.
      send('trackSingleCustom', 'SandboxCheckoutReturn', {sandbox: true, payment_verified: false});
    }
  });
})(window, document);
