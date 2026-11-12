const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js'),P=require('../planner-core.js');
const at=time=>Date.parse('2026-11-09T'+time+':00+02:00');
test('command centre follows local time rather than returning a missed morning habit',()=>{
 assert.equal(P.command([],{},null,at('07:15')).current.id,'gym');
 assert.equal(P.command([],{},null,at('07:50')).current.id,'lectura');
 // Since the Nov 14 founder schedule there is no generic 'trabajo' block: free evening time points to the next KLIMB step, never to Closing follow-ups.
 {const evening=P.command([],{},null,Date.parse('2026-11-16T19:00:00+02:00')).current;assert.equal(evening.kind,'free');assert.match(evening.name,/^KLIMB/);assert.ok(!/Seguimientos|Closing/.test(evening.name))}
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
test('workout length adapts exercise count and rounds without inventing video provenance',()=>{
 assert.deepEqual([30,45,60].map(n=>P.workout(n).exercises.length),[5,7,10]);
 for(const n of [30,40,45,60]){const p=P.workout(n);assert.equal(p.warmup+p.cooldown+p.exercises.length*p.rounds*(p.work+p.rest),n*60)}
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
 const result=P.command([],{},null,at('23:45'));assert.equal(result.next.id,'despertar');assert.equal(result.next.dayOffset,1);assert.equal(P.time(result.next.start),'06:30');
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


test('bedtime begins at exactly 23:30 even with a running timer or a late call',()=>{assert.notEqual(P.command([],{},null,at('23:29')).current.id,'dormir');assert.equal(P.command([],{},null,at('23:30')).current.id,'dormir');const event={calendarId:'c',id:'late',name:'Call',start:'2026-11-09T23:00:00+02:00',end:'2026-11-10T00:00:00+02:00'};assert.equal(P.command([event],{}, {id:'klimb',start:at('23:00')},at('23:30')).current.id,'dormir');});

test('requested week has three hour-long English classes, Saturday practice and no morning sales practice',()=>{
 // Nov 9–13 keep the legacy Impulso week; from Sat Nov 14 the founder schedule applies (see founder tests below).
 const week=Array.from({length:5},(_,n)=>P.routine(at('12:00')+n*86400000));
 assert.deepEqual(week.map((rows,n)=>rows.some(x=>x.id==='ingles')?n:null).filter(x=>x!==null),[2]);
 for(const rows of week){assert.equal(rows.find(x=>x.id==='gym').duration,40);assert.equal(rows.find(x=>x.id==='desayuno').duration,25);assert.ok(!rows.some(x=>x.id==='ventas'&&x.start<720));for(const x of rows.filter(x=>x.id==='ingles'))assert.equal(x.duration,60)}
 const wed=week[2],shower=wed.find(x=>x.id==='ducha'),english=wed.find(x=>x.id==='ingles'),prep=wed.find(x=>x.id==='preparacion');assert.equal(shower.end,english.start);assert.ok(english.end<=prep.start);assert.equal(wed.find(x=>x.id==='daily').start-english.end,30);
});
test('Tuesday calendar mentorship replaces practice without moving it to another slot',()=>{
 const now=Date.parse('2026-11-10T12:00:00+02:00'),event={id:'mentor',calendarId:'personal',name:'Mentoría especial',start:'2026-11-10T20:00:00+02:00',end:'2026-11-10T21:00:00+02:00'};
 const rows=P.agenda([event],now);assert.ok(rows.some(x=>x.kind==='event'&&x.event.id==='mentor'));assert.ok(!rows.some(x=>x.id==='ventas'));// From Nov 14 mentorships come only from the connected calendar; none is invented on the following Tuesday.
 assert.ok(!P.routine(now+7*86400000).some(x=>x.id==='ventas'));
});
test('KLIMB has only one scheduled block per day and uses one project name',()=>{for(let n=0;n<5;n++){const rows=P.routine(at('12:00')+n*86400000).filter(x=>x.id==='klimb');assert.equal(rows.length,n===2?0:1);if(!rows.length)continue;assert.equal(rows[0].name,'KLIMB');if([1,4].includes(n))assert.equal(rows[0].start,1110)}});

// Founder schedule from Saturday Nov 14 (Europe/Kyiv): habits fixed, KLIMB deep work every day, nothing overlaps.
global.SebasCore=C;global.SebasLife=require('../life-core.js');
const founderDays=['2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20'].map(d=>Date.parse(d+'T12:00:00+02:00'));
const overlaps=rows=>{const out=[];for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)if(rows[i].start<rows[j].end&&rows[j].start<rows[i].end)out.push(rows[i].id+'×'+rows[j].id);return out};
test('founder days keep 07:00 wake-up, 45-min exercise, 40-min breakfast, daily English and the same KLIMB intensity on weekends',()=>{
 for(const now of founderDays){const rows=P.routine(now);const get=id=>rows.find(x=>x.id===id);
  assert.equal(get('despertar').start,420);assert.equal(get('oracion').duration,10);assert.equal(get('gym').duration,45);assert.equal(get('lectura').duration,30);assert.equal(get('desayuno').duration,40);assert.equal(get('desayuno').name,'Desayuno');assert.equal(get('ingles').duration,60);
  const klimb=rows.filter(x=>/^klimb/.test(x.id)).reduce((n,x)=>n+x.duration,0);assert.ok(klimb>=300,'KLIMB minutes '+klimb);assert.ok(!rows.some(x=>x.tab==='impulso'))}
});
test('founder meals, snacks, habits, English and KLIMB never overlap and every meal is scheduled',()=>{
 for(const now of founderDays){const rows=P.routine(now);assert.deepEqual(overlaps(rows),[]);for(const id of ['almuerzo','cena','snackam','snackpm'])assert.ok(rows.some(x=>x.id===id),id)}
});
test('a confirmed calendar event splits a flexible KLIMB block instead of hiding it, and is not filed under Impulso',()=>{
 const now=Date.parse('2026-11-16T09:00:00+02:00'),event={id:'mentor',calendarId:'personal',name:'Mentoría Richard',start:'2026-11-16T14:00:00+02:00',end:'2026-11-16T15:00:00+02:00'};
 const rows=P.agenda([event],now);const ev=rows.find(x=>x.kind==='event');assert.equal(ev.tab,'calendario');assert.deepEqual(overlaps(rows),[]);assert.ok(rows.some(x=>x.id==='klimb-build'&&x.end<=840));assert.ok(rows.some(x=>x.id==='almuerzo'));
});
test('Preply is a three-times-a-week goal, never a fictitious booking',()=>{
 const preply=founderDays.map(now=>P.routine(now).find(x=>x.id==='ingles')).filter(x=>/Preply/.test(x.name));assert.equal(preply.length,3);for(const x of preply)assert.match(x.name,/confirmar/);
});
