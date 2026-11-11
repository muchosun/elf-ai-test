/* Browser Pixel only. Never put a Conversions API token in this file. */
(function (w, d) {
  if (w.ElfPixel) return;
  const id = '1003891172735447';
  const pendingKey = 'elf.meta.checkout';
  let started = false;
  const sentTestStages = new Set();
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
  function send(method, event, data, options) {
    try { init(); if(options)w.fbq(method,id,event,data,options);else w.fbq(method,id,event,data); return true; } catch { return false; }
  }
  function sendTestStage(event, {plan,value,attemptId}={}) {
    if(typeof plan!=='string'||!/^(monthly|annual|(?:creator|pro)_\d+_(?:monthly|annual))$/.test(plan)||!Number.isFinite(value)||value<=0||typeof attemptId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId))return false;
    const key=event+':'+attemptId;if(sentTestStages.has(key))return false;
    const data={content_ids:[plan],content_type:'product',value,currency:'USD',num_items:1,sandbox:true,test_payment:true,payment_verified:false,qa_attempt_id:attemptId};
    const ok=send(event==='InitiateCheckout'?'trackSingle':'trackSingleCustom',event,data,{eventID:'elf_qa_'+event+'_'+attemptId});
    if(ok){sentTestStages.add(key);if(sentTestStages.size>100)sentTestStages.delete(sentTestStages.values().next().value)}return ok;
  }
  w.ElfPixel = Object.freeze({
    init: () => { try { init(); } catch {} },
    registration: (method='email') => send('trackSingle', 'CompleteRegistration', {status: true, content_name: method==='google'?'Elf Google registration':'Elf device registration', registration_method: method==='google'?'google':'email'}),
    testCheckoutOpened: details => sendTestStage('InitiateCheckout',details),
    testPaymentCompleted: details => sendTestStage('TestPaymentSimulated',details),
    checkoutOpened: ({plan, value, requestId}) => {
      if (typeof plan !== 'string' || !Number.isFinite(value) || value <= 0) return;
      try { w.sessionStorage.setItem(pendingKey, JSON.stringify({paymentId: 'elf_' + requestId})); } catch {}
      send('trackSingle', 'InitiateCheckout', {content_ids: [plan], content_type: 'product', value, currency: 'USD', num_items: 1, sandbox: true});
    },
    checkoutReturn: href => {
      const url = new URL(href);
      const outcome = url.searchParams.get('mavs_return');
      if (!['success', 'failure'].includes(outcome)) return;
      try {
        const pending = JSON.parse(w.sessionStorage.getItem(pendingKey) || 'null');
        if (!pending || pending.paymentId !== url.searchParams.get('merchant_payment_id')) return;
        w.sessionStorage.removeItem(pendingKey);
      } catch { return; }
      // A callback URL is not proof of payment. Never emit Purchase here.
      send('trackSingleCustom', outcome === 'success' ? 'SandboxCheckoutReturn' : 'CheckoutFailedReturn', {sandbox: true, payment_verified: false, checkout_outcome: outcome});
      return outcome;
    }
  });
})(window, document);
