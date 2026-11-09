const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js'),P=require('../planner-core.js');
const at=time=>Date.parse('2026-11-09T'+time+':00+02:00');
test('command centre follows local time rather than returning a missed morning habit',()=>{
 assert.equal(P.command([],{},null,at('07:15')).current.id,'gym');
 assert.equal(P.command([],{},null,at('07:50')).current.id,'lectura');
 assert.equal(P.command([],{},null,at('19:00')).current.id,'trabajo');
 assert.equal(P.command([],{},null,at('23:30')).current.id,'descanso');
});
test('next activity has its exact planned time, duration and destination',()=>{
 const model=P.command([],{},null,at('06:50'));
 assert.equal(model.next.id,'oracion');assert.equal(P.time(model.next.start),'07:00');
 assert.equal(model.next.duration,10);
});
test('real meetings override suggested work and other routines',()=>{
 const event={calendarId:'c',id:'one',name:'Call',start:'2026-11-09T07:10:00+02:00',end:'2026-11-09T08:40:00+02:00'};
 const model=P.command([event],{},null,at('07:30'));
 assert.equal(model.current.kind,'event');assert.equal(model.current.event.id,'one');assert.ok(!model.items.some(i=>i.id==='gym'));
});
test('completed habits are not suggested and an active timer takes priority',()=>{
 assert.notEqual(P.command([],{gym:true},null,at('07:15')).current.id,'gym');
 assert.equal(P.command([],{}, {id:'lectura',start:at('07:00')},at('07:15')).current.id,'lectura');
});
test('workout length adapts exercise count and rounds without inventing video provenance',()=>{
 assert.deepEqual([30,45,60].map(n=>P.workout(n).exercises.length),[5,7,10]);
 for(const n of [30,45,60]){const p=P.workout(n);assert.equal(p.warmup+p.cooldown+p.exercises.length*p.rounds*(p.work+p.rest),n*60)}
});
test('guided workout moves through warmup, work, rest, rounds and cooldown',()=>{
 const p=P.workout(30);
 assert.equal(P.phase(p,0).kind,'warmup');assert.equal(P.phase(p,300).kind,'work');assert.equal(P.phase(p,340).kind,'rest');assert.equal(P.phase(p,360).index,1);assert.equal(P.phase(p,600).round,2);assert.equal(P.phase(p,1500).kind,'cooldown');assert.equal(P.phase(p,1800).kind,'done');
});
test('weekends reserve KLIMB and schedules use Kyiv across daylight saving time',()=>{
 assert.ok(P.routine(Date.parse('2026-11-06T23:00:00Z')).some(i=>i.id==='klimb'));
 assert.equal(P.minute(Date.parse('2026-03-29T01:30:00Z')),270);
 assert.equal(P.minute(Date.parse('2026-10-25T01:30:00Z')),210);
});
test('after the last slot the next activity belongs to tomorrow',()=>{
 const result=P.command([],{},null,at('23:45'));assert.equal(result.next.id,'despertar');assert.equal(result.next.dayOffset,1);assert.equal(P.time(result.next.start),'06:40');
});
test('gym has a weekly split and selectable muscle groups',()=>{
 assert.equal(P.gymGroup(at('07:00')),'empuje');
 assert.equal(P.gymGroup(Date.parse('2026-11-10T07:00:00+02:00')),'pierna');
 const plan=P.workout(45,{mode:'gym',group:'core'});assert.equal(plan.name,'Core / abs');assert.ok(plan.exercises.every(e=>e.reps&&e.hint));
});
test('gym duration changes exercise count and supplies sets, repetitions and rest',()=>{
 assert.deepEqual([30,45,60].map(minutes=>P.workout(minutes,{mode:'gym',group:'pierna'}).exercises.length),[4,5,6]);
 const plan=P.workout(60,{mode:'gym',group:'tiron'});assert.equal(plan.sets,3);assert.equal(plan.restSeconds,75);assert.ok(plan.exercises[0].name.includes('Jalón'));
});

