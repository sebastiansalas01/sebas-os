const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js'),P=require('../planner-core.js'),L=require('../life-core.js');
const now=Date.parse('2026-11-09T08:00:00+02:00');
const call=(id,start,end)=>({calendarId:'c',id,name:'Sesión Impulso',start:'2026-11-09T'+start+':00+02:00',end:'2026-11-09T'+end+':00+02:00',updated:'v1'});
test('food options include the three usual breakfasts, snacks and simple preparation',()=>{
 for(const id of ['eggs-veg','boiled-eggs','yogurt-oats','banana','greek-granola'])assert.ok(L.MEALS.some(m=>m.id===id));
 assert.ok(L.MEALS.filter(m=>m.type==='lunch').length>=6);assert.ok(L.MEALS.filter(m=>m.type==='dinner').length>=6);assert.ok(L.MEALS.every(m=>m.steps.length&&m.ingredients.length));
});
test('menu choices persist by type without changing another meal',()=>{
 const meals=L.dailyMeals('2026-11-09',{breakfast:'yogurt-oats',dinner:'tuna-toast'});assert.equal(meals[0].id,'yogurt-oats');assert.equal(meals.at(-1).id,'tuna-toast');assert.equal(meals.length,5);
});
test('lunch leaves 30 minutes after a call and fits the next calendar gap',()=>{
 const plan=L.mealSchedule([call('a','12:30','14:00'),call('b','15:00','16:30')],now);assert.equal(plan.lunch.start,870);assert.equal(plan.lunch.end,900);
});
test('manual lunch changes are accepted only when free and otherwise an alternative is proposed',()=>{
 const events=[call('a','12:30','14:00')];assert.equal(L.mealSchedule(events,now,{lunch:'13:00'}).lunchConflict,true);assert.equal(L.mealSchedule(events,now,{lunch:'14:30'}).lunch.manual,true);
});
test('a fully reserved afternoon never invents a free lunch slot',()=>{
 assert.equal(L.mealSchedule([call('a','12:00','18:00')],now).lunch,null);
});
test('snacks appear in the routine and outrank the general work block',()=>{
 const model=P.command([],{},null,Date.parse('2026-11-09T11:05:00+02:00'));assert.equal(model.current.id,'snackam');assert.ok(model.items.some(x=>x.id==='almuerzo'));
});
test('commercial sessions need explicit matching recap evidence; calendar updates invalidate it',()=>{
 const event=call('a','14:00','15:30');const card={eventKey:C.eventKey(event),confirmed:true,eventUpdated:'v1',sessionStart:event.start};assert.equal(L.scheduledEvents([event],[]).length,0);assert.equal(L.scheduledEvents([event],[card]).length,1);assert.equal(L.scheduledEvents([{...event,updated:'v2'}],[card]).length,0);assert.equal(L.scheduledEvents([{...event,start:'2026-11-09T16:00:00+02:00'}],[card]).length,0);
 const personal={...event,name:'Dentista',calendar:'Personal'};assert.equal(L.scheduledEvents([personal],[]).length,1);
});
test('reported minutes retain the actual timer measurement and reject invalid values',()=>{
 const rec=L.reportedRecord({seconds:120,done:false},20,30,now);assert.equal(rec.seconds,1200);assert.equal(rec.measuredSeconds,120);assert.equal(rec.source,'reported');assert.throws(()=>L.reportedRecord({},0,30));assert.throws(()=>L.reportedRecord({},Infinity,30));
});
