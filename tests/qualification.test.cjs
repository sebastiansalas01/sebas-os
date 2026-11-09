const {test}=require('node:test'),assert=require('node:assert/strict');
const event={start:'2026-11-09T20:30:00+02:00'};
const message=text=>({text,ts:String(Date.parse('2026-11-09T09:00:00+02:00')/1000)});
async function q(){return import('../server/qualification.mjs')}
test('confirmation cross-checks recap identity, day, Spain time and explicit marker',async()=>{
 const {confirmationEvidence}=await q();assert.equal(confirmationEvidence(event,message('Contamos con ✅ 19:30 Cliente Ejemplo: vendo talleres.'),'Cliente Ejemplo').confirmed,true);
});
test('finding the lead name alone is never a confirmation',async()=>{
 const {confirmationEvidence}=await q();assert.equal(confirmationEvidence(event,message('19:30 Cliente Ejemplo: objetivo: vender más.'),'Cliente Ejemplo').confirmed,false);
});
test('cancellation, wrong time and wrong date are excluded',async()=>{
 const {confirmationEvidence}=await q();for(const text of ['Contamos con ✅ 19:30 Cliente Ejemplo cancelada','Contamos con ✅ 18:30 Cliente Ejemplo'])assert.equal(confirmationEvidence(event,message(text),'Cliente Ejemplo').confirmed,false);
 assert.equal(confirmationEvidence(event,{...message('Contamos con ✅ 19:30 Cliente Ejemplo'),ts:String(Date.parse('2026-11-08T10:00:00+02:00')/1000)},'Cliente Ejemplo').confirmed,false);
});
test('another lead time in the same recap cannot confirm the wrong session',async()=>{
 const {confirmationEvidence}=await q();const text='Contamos con ✅ 18:30 Otro Cliente\n✅ 19:30 Cliente Ejemplo';assert.equal(confirmationEvidence({...event,start:'2026-11-09T19:30:00+02:00'},message(text),'Cliente Ejemplo').confirmed,false);
});
test('stars have explainable business evidence and unknown is not a low rating',async()=>{
 const {qualifyLead}=await q();assert.equal(qualifyLead('Vendo talleres. Objetivo: vender más. Presupuesto disponible: 6000 euros.').stars,3);assert.equal(qualifyLead('Vendo talleres. Objetivo: vender más.').stars,2);assert.equal(qualifyLead('No puedo invertir y todavía no tengo oferta.').stars,1);assert.equal(qualifyLead('Cliente Ejemplo, sesión a las 19:30').stars,null);
});
