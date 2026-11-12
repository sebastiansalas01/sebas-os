const {test}=require('node:test'),assert=require('node:assert/strict');
const K=require('../klimb-core.js');

test('seed imports K01–K20 as unscored ideas with no supplier, economics or invented evidence',()=>{
 const s=K.seed();assert.equal(s.products.length,20);assert.deepEqual(s.products.map(p=>p.id).slice(0,3),['K01','K02','K03']);
 for(const p of s.products){assert.equal(p.status,'idea');assert.equal(p.scores,null);assert.equal(p.economics,null);assert.equal(p.supplierVerified,false);assert.equal(p.evidence.length,0)}
 assert.equal(s.market.country,'ES');assert.equal(s.market.confirmed,false);
});
test('normalize keeps user data, repairs bad statuses and survives garbage',()=>{
 assert.equal(K.normalize(null).products.length,20);assert.equal(K.normalize({version:9}).products.length,20);
 const s=K.normalize({version:1,products:[{id:'K01',status:'nonsense',notes:'mine'}]});assert.equal(s.products[0].status,'idea');assert.equal(s.products[0].notes,'mine');
});
test('payment route is the first action while it is on the critical path, with an honest reason',()=>{
 const a=K.nextAction(K.seed(),'2026-11-13');assert.equal(a.id,'payment_route');assert.match(a.why,/Ucrania/);assert.equal(a.daysLeft,48);
 for(const k of ['id','title','why','phase','priority','estimateMinutes','blockingEvidence','doneCriteria','actionType','route'])assert.ok(k in a,k);
});
test('after payment decision the action is the first concrete research gap of the top focus product',()=>{
 const s=K.seed();s.merchant.paymentRoute='intermediario';const a=K.nextAction(s,'2026-11-13');
 assert.equal(a.productId,'K01');assert.equal(a.blockingEvidence[0],'search_intent');assert.match(a.how,/quitapelos/);assert.ok(!/avanzar/i.test(a.title));
});
test('day 10 without a validated product keeps researching instead of jumping to ads',()=>{
 const s=K.seed();s.merchant.paymentRoute='intermediario';const a=K.nextAction(s,'2026-11-22');assert.equal(a.actionType,'research');assert.ok(!/anuncio de pago|escala/i.test(a.title));
});
test('evidence needs a real URL, deduplicates repeated sources and moves idea to research',()=>{
 let s=K.seed();assert.throws(()=>K.addEvidence(s,'K01',{type:'competitor_listing',url:'no-url'},'2026-11-13'),/enlace/);assert.throws(()=>K.addEvidence(s,'K01',{type:'made_up',url:'https://a.es'},'2026-11-13'));
 s=K.addEvidence(s,'K01',{type:'competitor_listing',url:'https://www.amazon.es/dp/X',price:'19.99'},'2026-11-13');s=K.addEvidence(s,'K01',{type:'competitor_listing',url:'https://www.amazon.es/dp/X'},'2026-11-13');
 const p=s.products.find(x=>x.id==='K01');assert.equal(p.status,'research');assert.equal(K.evidenceOf(p,'competitor_listing').length,1);assert.equal(p.evidence[0].price,19.99);assert.equal(p.evidence[0].observedAt,'2026-11-13');
});
test('category references never satisfy product demand gaps',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';s=K.addEvidence(s,'K01',{type:'category_reference',url:'https://www.shopify.com/blog/best-dropshipping-products'},'2026-11-13');
 assert.equal(K.nextAction(s,'2026-11-13').blockingEvidence[0],'search_intent');
});
test('economics returns null with missing reasons instead of guessing, and computes margin when complete',()=>{
 const none=K.economics(null);assert.equal(none.grossMarginEUR,null);assert.ok(none.missing.length);
 const part=K.economics({price:30});assert.equal(part.grossMarginEUR,null);assert.ok(part.missing.includes('coste del producto'));assert.equal(part.ordersPerDayForTarget,16.7);
 const full=K.economics({price:36.3,vatPct:21,cogs:8,shipping:4,feesPct:3,refundPct:5});assert.equal(full.missing.length,0);assert.equal(full.grossMarginEUR,15.41);assert.equal(full.breakEvenCPA,15.41);
});
test('rejecting a product requires a reason and moves focus to the next candidate',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';assert.throws(()=>K.setStatus(s,'K01','rejected',''),/motivo/);
 s=K.setStatus(s,'K01','rejected','Saturado, sin diferenciación');assert.equal(K.nextAction(s,'2026-11-13').productId,'K08');
});
test('a ready landing triggers an organic test, never automatic paid traffic',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';s=K.setStatus(s,'K10','landing_ready');const a=K.nextAction(s,'2026-11-25');assert.equal(a.id,'smoke_test');assert.match(a.how,/aprobación explícita/);
});
test('summary counts real evidence only and reports days to Dec 31',()=>{
 const sm=K.summary(K.seed(),'2026-11-13');assert.equal(sm.day,1);assert.equal(sm.daysLeft,48);assert.equal(sm.evidence,0);assert.equal(sm.total,20);
});
