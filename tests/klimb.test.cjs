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
 const none=K.economics(null);assert.equal(none.contributionBeforeAdsEUR,null);assert.ok(none.missing.length);
 const part=K.economics({price:30});assert.equal(part.contributionBeforeAdsEUR,null);assert.ok(part.missing.includes('coste del producto'));assert.equal(part.ordersPerDayForTarget,16.7);
 assert.equal(K.economics({price:36.3,vatPct:21,cogs:8,shipping:4,feesPct:3,refundPct:5}).contributionBeforeAdsEUR,null);// other costs must be stated, even as 0
 const full=K.economics({price:36.3,vatPct:21,cogs:8,shipping:4,feesPct:3,refundPct:5,otherCosts:0.5});assert.equal(full.missing.length,0);assert.equal(full.contributionBeforeAdsEUR,14.91);assert.equal(full.breakEvenCPA,14.91);assert.equal(full.estimate,true);
});
test('rejecting a product requires a reason and moves focus to the next candidate',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';assert.throws(()=>K.setStatus(s,'K01','rejected',''),/motivo/);
 s=K.setStatus(s,'K01','rejected','Saturado, sin diferenciación');assert.equal(K.nextAction(s,'2026-11-13').productId,'K08');
});
test('a landing marked ready without privacy, consent, tracking or approval asks to verify, not to publish',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';s=K.setStatus(s,'K10','landing_ready');const a=K.nextAction(s,'2026-11-25');assert.equal(a.id,'K10:landing_check');assert.equal(a.actionType,'verify');assert.match(a.how,/aviso de privacidad/);assert.match(a.how,/aprobación para publicarla/);
});
test('only a fully checked landing leads to an organic test, never automatic paid traffic',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';s=K.setLanding(s,'K10',{url:'https://klimb.example/kit',honestCopy:true,privacyNotice:true,consent:true,analyticsTested:true});
 assert.notEqual(s.products.find(p=>p.id==='K10').status,'landing_ready');s=K.setLanding(s,'K10',{publishApproved:true});assert.equal(s.products.find(p=>p.id==='K10').status,'landing_ready');
 const a=K.nextAction(s,'2026-11-25');assert.equal(a.id,'smoke_test');assert.match(a.how,/aprobación explícita/);assert.match(a.how,/nunca es un permiso general/);
 assert.throws(()=>K.setLanding(s,'K10',{url:'javascript:alert(1)'}),/https/);
});
test('choosing a payment route never means checkout is enabled',()=>{
 let s=K.setMerchant(K.seed(),{paymentRoute:'intermediario'});const ck=K.checkoutReady(s.merchant);assert.equal(ck.ready,false);assert.equal(ck.missing.length,4);
 s=K.setMerchant(s,{eligibilityVerified:true,onboardingDone:true,gatewayActive:true,testChargeRefunded:true});assert.equal(K.checkoutReady(s.merchant).ready,true);
 s=K.setMerchant(s,{paymentRoute:''});assert.equal(K.checkoutReady(s.merchant).ready,false);assert.equal(s.merchant.gatewayActive,false);
 assert.match(K.nextAction(K.seed(),'2026-11-13').why,/entidad, el país, el banco y la documentación/);
});
test('three URLs from one seller count as one competitor; distinct sellers on one marketplace count separately',()=>{
 let s=K.seed();for(const n of [1,2,3])s=K.addEvidence(s,'K10',{type:'competitor_listing',url:'https://www.manomano.es/p/kit-'+n,seller:'KZQ',price:20},'2026-11-13');
 let p=s.products.find(x=>x.id==='K10');assert.equal(K.competitors(p).length,1);
 s=K.addEvidence(s,'K10',{type:'competitor_listing',url:'https://www.manomano.es/p/otro',seller:'ULISEM'},'2026-11-13');s=K.addEvidence(s,'K10',{type:'competitor_listing',url:'https://www.amazon.es/dp/Z'},'2026-11-13');
 p=s.products.find(x=>x.id==='K10');assert.equal(K.competitors(p).length,3);
});
test('demand evidence needs a dated note; a bare link does not count',()=>{
 let s=K.seed();s.merchant.paymentRoute='x';s=K.addEvidence(s,'K01',{type:'search_intent',url:'https://trends.google.com/trends/explore?geo=ES&q=quitapelos'},'2026-11-13');
 assert.equal(K.nextAction(s,'2026-11-13').blockingEvidence[0],'search_intent');
 s=K.addEvidence(s,'K01',{type:'search_intent',url:'https://trends.google.com/trends/explore?geo=ES&q=quitapelos,rodillo',note:'Interés estable 12 meses frente a «rodillo»'},'2026-11-13');
 assert.notEqual(K.nextAction(s,'2026-11-13').blockingEvidence[0],'search_intent');
});
test('"no ads found" needs terms, country and date; ads presence never proves profitability',()=>{
 let s=K.seed();assert.throws(()=>K.setNoAds(s,'K02',{terms:'alfombra olfativa'}),/fecha/);s=K.setNoAds(s,'K02',{terms:'alfombra olfativa',country:'ES',date:'2026-11-13'});
 assert.ok(!K.gaps(s.products.find(p=>p.id==='K02')).some(g=>g.id==='ad_library'));assert.match(K.gaps(K.seed().products[0]).find(g=>g.id==='ad_library').how,/no rentabilidad/);
});
test('two supplier URLs with unknown warehouse are leads, not verified EU suppliers',()=>{
 let s=K.seed();s=K.addEvidence(s,'K08',{type:'supplier_listing',url:'https://www.cjdropshipping.com/product/a',sku:'CJYD203051401AZ',price:8.13},'2026-11-13');s=K.addEvidence(s,'K08',{type:'supplier_listing',url:'https://www.bigbuy.eu/x',sku:'BB1'},'2026-11-13');
 let g=K.gaps(s.products.find(p=>p.id==='K08'));assert.ok(!g.some(x=>x.id==='supplier_listing'));assert.ok(g.some(x=>x.id==='eu_warehouse'));
 s=K.addEvidence(s,'K08',{type:'supplier_listing',url:'https://www.cjdropshipping.com/product/a?v=eu',sku:'CJYD203051401AZ',warehouse:'EU'},'2026-11-13');assert.ok(K.gaps(s.products.find(p=>p.id==='K08')).some(x=>x.id==='eu_warehouse'),'EU without verification is not enough');
 s=K.addEvidence(s,'K08',{type:'supplier_listing',url:'https://www.bigbuy.eu/y',sku:'BB2',warehouse:'EU',warehouseVerified:true},'2026-11-13');assert.ok(!K.gaps(s.products.find(p=>p.id==='K08')).some(x=>x.id==='eu_warehouse'));
});
test('focus follows the agreed priority, not whoever looks more advanced',()=>{
 let s=K.seed();s=K.setStatus(s,'K14','supplier_screened');assert.equal(K.focusProducts(s)[0].id,'K01');
});
test('KLIMB minutes expose real reductions instead of hiding them',()=>{
 const rows=[{id:'klimb',kind:'routine',start:630,end:750},{id:'klimb-build',kind:'routine',start:810,end:840},{id:'m',kind:'event',start:840,end:900}];
 assert.deepEqual(K.klimbMinutes(rows),{planned:150,target:300,reducedBy:150});
});
test('summary counts real evidence only and reports days to Dec 31',()=>{
 const sm=K.summary(K.seed(),'2026-11-13');assert.equal(sm.day,1);assert.equal(sm.daysLeft,48);assert.equal(sm.evidence,0);assert.equal(sm.total,20);
});
