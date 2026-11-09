const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function boot(seed={}) {
 const storage=new Map(Object.entries(seed));
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',append(){},setAttribute(){}});return elements.get(id)};
 const ctx=vm.createContext({URL,URLSearchParams,AbortSignal,Intl,Date,Math,JSON,Number,String,Map,Set,Error,Promise,structuredClone,console,setInterval(){},clearInterval(){},alert(){},navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{visibilityState:'visible',getElementById:element,querySelector:()=>element('header'),querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('new')},window:{}});
 for(const f of ['core.js','planner-core.js','planner-ui.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 return {ctx,storage,element,run:s=>vm.runInContext(s,ctx)};
}
test('all views render without runtime errors',()=>{
 const app=boot();for(const view of ['hoy','calendario','comidas','gym','habitos','lectura','estadisticas','ajustes','impulso','actividad']){app.run(`view('${view}')`);assert.ok(app.element('app').innerHTML.length>100,view)}
});
test('corrupted storage does not prevent launch',()=>{const app=boot({sebasos:'invalid',sebasTrackedV1:'invalid',sebasActiveTrack:'invalid',sebasAllowedCalendars:'invalid'});assert.match(app.element('app').innerHTML,/TU CENTRO DE MANDO/)});
test('pause and reload preserve elapsed time and completion never invents minutes',()=>{
 const app=boot();app.run("beginTrack('lectura');activeTrack.start-=60000;pauseTrack()");
 const next=boot(Object.fromEntries(app.storage));assert.ok(next.run("currentSeconds('lectura')")>=60);
 next.run("finishTrack('ingles')");assert.equal(next.run("trackData('ingles').seconds"),0);
 assert.equal(next.run("trackData('ingles').done"),true);
});
test('stored reading text is escaped',()=>{
 const app=boot({sebasos:JSON.stringify({routine:'</textarea><script>alert(1)</script>',reading:[{title:'<img onerror=evil()>',page:1,notes:'<script>evil()</script>',day:'2026-11-09'}]})});
 app.run("view('lectura')");assert.ok(!app.element('app').innerHTML.includes('<img onerror='));
});
test('English goals cannot drop below 60 minutes',()=>{const app=boot();app.run("setGoal('ingles',25)");assert.equal(app.run("TRACKS.find(t=>t.id==='ingles').goal"),60)});
test('calendar sync handles IDs, reschedules and expired authorization',async()=>{
 const app=boot();let moved=false;const calls=[];
 app.ctx.fetch=async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('calendarList')?{items:[{id:'personal',primary:true,summary:'Personal'},{id:'old',summary:'JustSales'}]}:{items:[{id:'event-1',summary:'Test event',updated:moved?'2':'1',start:{dateTime:moved?'2026-11-09T12:00:00+02:00':'2026-11-09T11:00:00+02:00'},end:{dateTime:'2026-11-09T13:00:00+02:00'}}]}}};
 await app.run("googleToken='mock';syncGoogle()");assert.equal(app.run('googleEvents.length'),1);assert.ok(!calls.some(u=>u.includes('/old/')));
 moved=true;await app.run('syncGoogle()');assert.equal(app.run('googleEvents.length'),1);assert.match(app.run('calendarNotice'),/1 actualizados/);
 app.ctx.fetch=async()=>({ok:false,status:401});await app.run('syncGoogle()');assert.equal(app.run('googleEvents.length'),1);assert.match(app.run('googleStatus'),/401/);
});
test('calendar selector safely escapes arbitrary calendar IDs',()=>{
 const app=boot();app.run(`calendarChoices=[{id:"a'b<test>",summary:'Personal',primary:true}];view('calendario')`);
 assert.ok(app.element('app').innerHTML.includes('&#39;'));
 assert.ok(!app.element('app').innerHTML.includes("a'b<test>"));
});
test('lead summaries are read in Spanish and unsafe social links are excluded',()=>{
 const app=boot();let spoken=null,cancelled=0;
 app.ctx.window.SpeechSynthesisUtterance=function(text){this.text=text};app.ctx.window.speechSynthesis={speak:value=>{spoken=value},cancel:()=>{cancelled++}};
 app.run("researchState.cards=[{eventKey:'c|e',summary:'Resumen de prueba'}];readLead('c|e')");assert.equal(spoken.text,'Resumen de prueba');assert.equal(spoken.lang,'es-ES');assert.equal(cancelled,1);
 assert.equal(app.run("safeLink('javascript:alert(1)','instagram')"),'');assert.equal(app.run("safeLink('https://instagram.com.evil.example/a','instagram')"),'');assert.equal(app.run("safeLink('https://www.instagram.com/example/','instagram')"),'https://www.instagram.com/example/');
});
test('all reading goals stay fixed at 30 minutes',()=>{const app=boot();app.run("setGoal('lectura',15)");assert.equal(app.run("TRACKS.find(t=>t.id==='lectura').goal"),30)});
