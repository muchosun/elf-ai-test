// Prices and credit levels captured from Foxy /of-creators on 2026-10-12.
// Shared with the frontend; all provider amounts are fixed by this server catalog.
export const offers = Object.freeze([
  {tier:'starter', level:0, label:'Starter', credits:80, monthly:9, yearly:6},
  {tier:'creator', level:0, label:'Creator', credits:350, monthly:39, yearly:26},
  ...[[750,79,53],[1500,149,99],[2500,249,167],[5000,499,333],[10000,999,669]].map(([credits,monthly,yearly],level)=>({tier:'pro',level,label:'Pro',credits,monthly,yearly})),
].map(Object.freeze));
export function selectedOffer(tier='starter', level=0) {
  if(tier!=='pro')level=0;
  return offers.find(offer=>offer.tier===tier && offer.level===level) || offers[0];
}
export function checkoutCode(offer, period) {
  const billing=period==='annual'?'annual':'monthly';
  return offer.tier==='starter' ? billing : `${offer.tier}_${offer.credits}_${billing}`;
}
export const checkoutPlans=Object.freeze(Object.fromEntries(offers.flatMap(offer=>['monthly','annual'].map(period=>[
  checkoutCode(offer,period), Object.freeze({
    amount:period==='annual'?offer.yearly*12:offer.monthly,
    label:`${offer.label} ${period==='annual'?'Annual':'Monthly'}${offer.tier==='pro'?` ${offer.credits} credits`:''}`,
  }),
]))));
