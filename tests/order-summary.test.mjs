import assert from 'node:assert/strict';
import {orderSummaries} from '../test-checkout/order-summary.js';
import {checkoutPlans,offers,checkoutCode} from '../services/mavs-checkout/lib/offers.js';
assert.deepEqual(Object.keys(orderSummaries).sort(),Object.keys(checkoutPlans).sort());
const annual=orderSummaries.annual,monthly=orderSummaries.monthly;
assert.deepEqual([annual.monthlyPrice,annual.amount,annual.regularTotal,annual.savings,annual.discountPercent,annual.credits],[6,72,108,36,33,80]);
assert.deepEqual([monthly.monthlyPrice,monthly.amount,monthly.savings,monthly.discountPercent],[9,9,0,0]);
for(const offer of offers)for(const period of ['monthly','annual']){
 const code=checkoutCode(offer,period),s=orderSummaries[code];assert.equal(s.amount,checkoutPlans[code].amount);assert.equal(s.monthlyPrice*s.months,s.amount);assert.equal(s.regularTotal-s.savings,s.amount);assert.equal(s.credits,offer.credits);assert.ok(s.savings>=0);assert.ok(s.discountPercent>=0&&s.discountPercent<100);if(period==='monthly')assert.equal(s.savings,0);
}
console.log('PASS: all14 summaries match checkout totals, monthly equivalent, credits and discount arithmetic; monthly plans have no annual savings');
