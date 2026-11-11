import {offers,checkoutCode,checkoutPlans} from '../services/mavs-checkout/lib/offers.js';
// Display-only projection of the same allowlisted catalog used by checkout.
export const orderSummaries=Object.freeze(Object.fromEntries(offers.flatMap(offer=>['monthly','annual'].map(period=>{
 const code=checkoutCode(offer,period),annual=period==='annual',regularTotal=offer.monthly*(annual?12:1),amount=checkoutPlans[code].amount;
 return [code,Object.freeze({label:checkoutPlans[code].label,amount,tier:offer.label,credits:offer.credits,period,months:annual?12:1,monthlyPrice:annual?offer.yearly:offer.monthly,regularMonthlyPrice:offer.monthly,regularTotal,savings:regularTotal-amount,discountPercent:Math.round((regularTotal-amount)/regularTotal*100)})];
}))));
