const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../core.js');
test('Kyiv dates are independent of device timezone',()=>{
 assert.equal(C.day(Date.parse('2026-11-09T22:30:00Z')),'2026-11-10');
 assert.equal(C.weekday(Date.parse('2026-11-06T23:30:00Z')),6);
});
test('seven days are exactly seven civil dates across DST',()=>{
 assert.deepEqual(C.recentKeys(Date.parse('2026-10-28T10:00:00Z')),['2026-10-28','2026-10-27','2026-10-26','2026-10-25','2026-10-24','2026-10-23','2026-10-22']);
});
test('timer survives serialization and never includes paused time',()=>{
 const records={},start=Date.parse('2026-11-09T10:00:00Z');
 const active=JSON.parse(JSON.stringify({id:'ingles',start}));
 assert.equal(C.seconds(records,active,'ingles',start+60000),60);
 C.settle(records,active,start+60000);
 assert.equal(C.seconds(records,null,'ingles',start+3600000),60);
 C.settle(records,{id:'ingles',start:start+3600000},start+3660000);
 assert.equal(records['2026-11-09'].ingles.seconds,120);
});
test('timer closes at midnight instead of counting overnight',()=>{
 const records={},start=Date.parse('2026-11-09T21:59:00Z');
 C.settle(records,{id:'lectura',start},start+3600000);
 assert.equal(records['2026-11-09'].lectura.seconds,60);
 assert.equal(C.seconds(records,{id:'lectura',start},'lectura',start+3600000),0);
});
test('midnight boundary observes spring and autumn DST',()=>{
 assert.equal((C.boundary(Date.parse('2026-03-28T22:00:00Z'))-Date.parse('2026-03-28T22:00:00Z'))/3600000,23);
 assert.equal((C.boundary(Date.parse('2026-10-24T21:00:00Z'))-Date.parse('2026-10-24T21:00:00Z'))/3600000,25);
});
test('default selection is restricted and explicit IDs override defaults',()=>{
 assert.equal(C.selected({id:'p',primary:true},null),true);
 assert.equal(C.selected({id:'a',summary:'B360 Agencia',primary:true},null),false);
 assert.equal(C.selected({id:'b',summary:'JustSales'},null),false);
 assert.equal(C.selected({id:'c',summary:'Unrelated'},null),false);
 assert.equal(C.selected({id:'i',summary:'Impulso'},null),true);
 assert.equal(C.selected({id:'p',primary:true},[]),false);
 assert.equal(C.selected({id:'c'},['c']),true);
});
test('moved event is one change, not removal plus addition',()=>{
 const before=[{calendarId:'c',id:'one',start:'a',updated:'1'}];
 assert.deepEqual(C.changes(before,[{...before[0],start:'b',updated:'2'}]),{added:0,removed:0,changed:1});
 assert.deepEqual(C.changes(before,[{...before[0],id:'two'}]),{added:1,removed:1,changed:0});
});
test('events crossing midnight and all-day ranges appear on every covered day',()=>{
 assert.equal(C.onDay({allDay:true,start:'2026-11-08',end:'2026-11-11'},'2026-11-09'),true);
 assert.equal(C.onDay({allDay:true,start:'2026-11-08',end:'2026-11-11'},'2026-11-11'),false);
 assert.equal(C.onDay({start:'2026-11-08T23:30:00+02:00',end:'2026-11-09T01:00:00+02:00'},'2026-11-09'),true);
 assert.equal(C.onDay({start:'2026-11-08T23:30:00+02:00',end:'2026-11-09T00:00:00+02:00'},'2026-11-09'),false);
});
