import assert from 'node:assert/strict';
import {requestCheckout} from '../checkout-client.js';
const url=await requestCheckout('annual','customer-uuid','request-uuid',async(endpoint,options)=>{
 assert.equal(endpoint,'https://elf-mavs-checkout.vercel.app/api/checkout');
 assert.deepEqual(JSON.parse(options.body),{plan:'annual',customerId:'customer-uuid',requestId:'request-uuid'});
 assert.equal(options.credentials,'omit');
 return Response.json({url:'https://pagator.app/?token=synthetic',sandbox:true});
});
assert.equal(new URL(url).origin,'https://pagator.app');
for(const result of [{url:'https://evil.example/',sandbox:true},{url:'https://pagator.app/',sandbox:false}])await assert.rejects(requestCheckout('monthly','id','id',async()=>Response.json(result)));
await assert.rejects(requestCheckout('monthly','id','id',async()=>Response.json({error:'sandbox_not_confirmed'},{status:503})),/sandbox_not_confirmed/);
console.log('PASS: checkout request scope, no credentials, trusted sandbox redirect, provider error');
