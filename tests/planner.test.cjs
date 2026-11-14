const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js'),P=require('../planner-core.js');
const at=time=>Date.parse('2026-11-09T'+time+':00+02:00');
test('command centre follows local time rather than returning a missed morning habit',()=>{
 assert.equal(P.command([],{},null,at('07:15')).current.id,'gym');
 assert.equal(P.command([],{},null,at('07:50')).current.id,'lectura');
 assert.equal(P.command([],{},null,at('19:00')).current.id,'trabajo');
 assert.equal(P.command([],{},null,at('23:30')).current.id,'dormir');
});
test('next activity has its exact planned time, duration and destination',()=>{
 const model=P.command([],{},null,at('06:40'));
 assert.equal(model.next.id,'oracion');assert.equal(P.time(model.next.start),'06:50');
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
test('home workout is always sixty minutes without inventing video provenance',()=>{
 assert.deepEqual([30,45,60].map(n=>P.workout(n).exercises.length),[10,10,10]);
 for(const n of [30,40,45,60]){const p=P.workout(n);assert.equal(p.warmup+p.cooldown+p.exercises.length*p.rounds*(p.work+p.rest),3600)}
});
test('guided workout moves through warmup, work, rest, rounds and cooldown',()=>{
 const p=P.workout(30);
 assert.equal(P.phase(p,0).kind,'warmup');assert.equal(P.phase(p,300).kind,'work');assert.equal(P.phase(p,340).kind,'rest');assert.equal(P.phase(p,360).index,1);assert.equal(P.phase(p,900).round,2);assert.equal(P.phase(p,3300).kind,'cooldown');assert.equal(P.phase(p,3600).kind,'done');
});
test('weekends reserve KLIMB and schedules use Kyiv across daylight saving time',()=>{
 assert.ok(P.routine(Date.parse('2026-11-06T23:00:00Z')).some(i=>i.id==='klimb'));
 assert.equal(P.minute(Date.parse('2026-03-29T01:30:00Z')),270);
 assert.equal(P.minute(Date.parse('2026-10-25T01:30:00Z')),210);
});
test('after the last slot the next activity belongs to tomorrow',()=>{
 const result=P.command([],{},null,at('23:45'));assert.equal(result.next.id,'despertar');assert.equal(result.next.dayOffset,1);assert.equal(P.time(result.next.start),'06:30');
});
test('gym has a weekly split and selectable muscle groups',()=>{
 assert.equal(P.gymGroup(at('07:00')),'torso');
 assert.equal(P.gymGroup(Date.parse('2026-11-10T07:00:00+02:00')),'pierna');
 const plan=P.workout(45,{mode:'gym',group:'core'});assert.equal(plan.name,'Opcional · brazos y abdomen');assert.ok(plan.exercises.every(e=>e.reps&&e.hint));
});
test('gym uses 60 minutes for every old duration preference and supplies series and rests',()=>{for(const minutes of [30,40,45,60]){const plan=P.workout(minutes,{mode:'gym',group:'pierna'});assert.equal(plan.minutes,60);assert.equal(plan.total,3600);assert.equal(plan.exercises.length,5);assert.equal(plan.sets,2);assert.equal(plan.restSeconds,75)}assert.equal(P.workout(30,{mode:'home'}).minutes,60)});


test('bedtime begins at exactly 23:30 even with a running timer or a late call',()=>{assert.notEqual(P.command([],{},null,at('23:29')).current.id,'dormir');assert.equal(P.command([],{},null,at('23:30')).current.id,'dormir');const event={calendarId:'c',id:'late',name:'Call',start:'2026-11-09T23:00:00+02:00',end:'2026-11-10T00:00:00+02:00'};assert.equal(P.command([event],{}, {id:'klimb',start:at('23:00')},at('23:30')).current.id,'dormir');});

test('requested week has three hour-long English classes, Saturday practice and no morning sales practice',()=>{
 const week=Array.from({length:7},(_,n)=>P.routine(at('12:00')+n*86400000));
 assert.deepEqual(week.map((rows,n)=>rows.some(x=>x.id==='ingles')?n:null).filter(x=>x!==null),[2,5,6]);
 for(const rows of week){assert.equal(rows.find(x=>x.id==='gym').duration,40);assert.equal(rows.find(x=>x.id==='desayuno').duration,25);assert.ok(!rows.some(x=>x.id==='ventas'&&x.start<720));for(const x of rows.filter(x=>x.id==='ingles'))assert.equal(x.duration,60)}
 assert.equal(week[5].find(x=>x.id==='ventas').duration,60);
 const wed=week[2],shower=wed.find(x=>x.id==='ducha'),english=wed.find(x=>x.id==='ingles'),prep=wed.find(x=>x.id==='preparacion');assert.equal(shower.end,english.start);assert.ok(english.end<=prep.start);assert.equal(wed.find(x=>x.id==='daily').start-english.end,30);
});
test('Tuesday calendar mentorship replaces practice without moving it to another slot',()=>{
 const now=Date.parse('2026-11-10T12:00:00+02:00'),event={id:'mentor',calendarId:'personal',name:'Mentoría especial',start:'2026-11-10T20:00:00+02:00',end:'2026-11-10T21:00:00+02:00'};
 const rows=P.agenda([event],now);assert.ok(rows.some(x=>x.kind==='event'&&x.event.id==='mentor'));assert.ok(!rows.some(x=>x.id==='ventas'));assert.equal(P.routine(now+7*86400000).find(x=>x.id==='ventas').start,1200);
});
test('KLIMB has only one scheduled block per day and uses one project name',()=>{for(let n=0;n<7;n++){const rows=P.routine(at('12:00')+n*86400000).filter(x=>x.id==='klimb');assert.equal(rows.length,n===2?0:1);if(!rows.length)continue;assert.equal(rows[0].name,'KLIMB');if([1,4].includes(n))assert.equal(rows[0].start,1110)}});

test('post-gym two-hour focus moves around real events without overlap',()=>{const now=Date.parse('2026-11-14T11:40:00+02:00');const event={calendarId:'personal',id:'mentor',name:'Mentoría',start:'2026-11-14T13:00:00+02:00',end:'2026-11-14T14:00:00+02:00'};const options={postGym:{day:'2026-11-14',anchor:700}};const rows=P.agenda([event],now,options);const focus=rows.find(x=>x.id==='klimb');assert.equal(focus.start,840);assert.equal(focus.duration,120);assert.equal(focus.end-focus.start,120);assert.ok(rows.some(x=>x.kind==='event'));for(const row of rows.filter(x=>x.kind!=='event'))assert.ok(!(row.start<840&&row.end>780));assert.ok(!P.routine(now+86400000,options).some(x=>x.name==='KLIMB · dos horas de enfoque'))});
test('four strength days separate upper and lower groups, Saturday is optional',()=>{const monday=Date.parse('2026-11-16T10:00:00+02:00');assert.deepEqual(Array.from({length:7},(_,n)=>P.gymGroup(monday+n*86400000)),['torso','pierna','recuperacion','torso','pierna','core','recuperacion'])});

test('future morning reserves sixty minutes for gym without overlapping reading or breakfast',()=>{const rows=P.routine(Date.parse('2026-11-16T10:00:00+02:00'));assert.equal(rows.find(x=>x.id==='gym').duration,60);for(const [a,b] of [['gym','lectura'],['lectura','desayuno'],['desayuno','ducha']])assert.ok(rows.find(x=>x.id===a).end<=rows.find(x=>x.id===b).start)});
