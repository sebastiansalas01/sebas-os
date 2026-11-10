const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function boot(seed={}) {
 const storage=new Map(Object.entries(seed));
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',append(){},setAttribute(){}});return elements.get(id)};
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-09T12:00:00+02:00']))}static now(){return new Date('2026-11-09T12:00:00+02:00').getTime()}}
 const ctx=vm.createContext({URL,URLSearchParams,AbortSignal,Intl,Date:FixedDate,Math,JSON,Number,String,Map,Set,Error,Promise,structuredClone,console,setInterval(){},clearInterval(){},alert(){},navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{visibilityState:'visible',getElementById:element,querySelector:()=>element('header'),querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('new')},window:{}});
 for(const f of ['core.js','planner-core.js','life-core.js','ops-core.js','ops-ui.js','life-ui.js','planner-ui.js','closing-core.js','closing-ui.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 return {ctx,storage,element,run:s=>vm.runInContext(s,ctx)};
}
test('all views render without runtime errors',()=>{
 const app=boot();for(const view of ['hoy','calendario','comidas','gym','habitos','lectura','estadisticas','ajustes','impulso','actividad']){app.run(`view('${view}')`);assert.ok(app.element('app').innerHTML.length>100,view)}
});
test('corrupted storage does not prevent launch',()=>{const app=boot({sebasos:'invalid',sebasTrackedV1:'invalid',sebasActiveTrack:'invalid',sebasAllowedCalendars:'invalid'});assert.match(app.element('app').innerHTML,/KPI · CENTRO DE MANDO/)});
test('pause and reload preserve elapsed time and completion never invents minutes',()=>{
 const app=boot();app.run("beginTrack('lectura');activeTrack.start-=60000;pauseTrack()");
 const next=boot(Object.fromEntries(app.storage));assert.ok(next.run("currentSeconds('lectura')")>=60);
 next.run("finishTrack('ingles')");assert.equal(next.run("trackData('ingles').seconds"),0);assert.equal(next.run("trackData('ingles').done"),false);next.run('confirmTrackTime(20)');assert.equal(next.run("trackData('ingles').seconds"),1200);assert.equal(next.run("trackData('ingles').measuredSeconds"),0);assert.equal(next.run("trackData('ingles').source"),'reported');
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
 const app=boot();app.run(`calendarSettingsOpen=true;calendarChoices=[{id:"a'b<test>",summary:'Personal',primary:true}];view('ajustes')`);
 assert.ok(app.element('app').innerHTML.includes('&#39;'));
 assert.ok(!app.element('app').innerHTML.includes("a'b<test>"));
});
test('lead summaries are read in Spanish and unsafe social links are excluded',()=>{
 const app=boot();let spoken=null,cancelled=0;
 app.ctx.window.SpeechSynthesisUtterance=function(text){this.text=text};app.ctx.window.speechSynthesis={speak:value=>{spoken=value},cancel:()=>{cancelled++}};
 app.run("researchState.cards=[{eventKey:'c|e',summary:'Resumen de prueba'}];readLead('c|e')");assert.equal(spoken.text,'Resumen de prueba');assert.equal(spoken.lang,'es-ES');assert.equal(cancelled,1);
 assert.equal(app.run("safeLink('javascript:alert(1)','instagram')"),'');assert.equal(app.run("safeLink('https://instagram.com.evil.example/a','instagram')"),'');assert.equal(app.run("safeLink('https://www.instagram.com/example/','instagram')"),'https://www.instagram.com/example/');
});
test('reading goals are editable',()=>{const app=boot();app.run("setGoal('lectura',15)");assert.equal(app.run("TRACKS.find(t=>t.id==='lectura').goal"),15)});
test('home shows channel videos while gym shows the selected daily muscle group',()=>{
 const app=boot();app.run("chooseTrainingPlace('gym');chooseGymRoutine('pierna')");assert.match(app.element('app').innerHTML,/Pierna/);assert.match(app.element('app').innerHTML,/Prensa de piernas/);assert.ok(!app.element('app').innerHTML.includes('Entrena con Jaeho'));
 app.run("chooseTrainingPlace('home')");assert.match(app.element('app').innerHTML,/Entrena con Jaeho/);
});
test('muscle group override applies to today only',()=>{
 const app=boot({sebasos:JSON.stringify({trainingPlace:'gym',gymRoutineOverride:{day:'2000-01-01',group:'core'}})});assert.equal(app.run('gymGroupToday()'),app.run('SebasPlanner.gymGroup()'));
 app.run("chooseGymRoutine('pierna')");assert.equal(app.run('gymGroupToday()'),'pierna');
});
test('real gym sets persist without inventing workout time or repetitions',()=>{
 const app=boot({sebasos:JSON.stringify({trainingPlace:'gym',gymMinutes:30})});app.run("startWorkout();gymWarmupDone();markGymSet()");
 assert.equal(app.run('data.gymSession.completedSets[trainingPlan().exercises[0].id]'),1);assert.ok(app.run("currentSeconds('gym')")<10);assert.equal(app.run('currentGymPhase(trainingPlan()).kind'),'rest');app.run('pauseTrack();markGymSet()');assert.equal(app.run('data.gymSession.completedSets[trainingPlan().exercises[0].id]'),1);
 const next=boot(Object.fromEntries(app.storage));next.run('startWorkout()');assert.equal(next.run('data.gymSession.completedSets[trainingPlan().exercises[0].id]'),1);
});
test('place and muscle group cannot change during an active workout',()=>{
 const app=boot();app.run("startWorkout();chooseTrainingPlace('gym');chooseGymRoutine('pierna')");assert.equal(app.run('trainingPlace()'),'home');
});
test('rest is removed from habits and the list follows planned times',()=>{
 const app=boot();const ids=app.run('orderedHabitTracks().map(t=>t.id)');assert.ok(!ids.includes('descanso'));assert.ok(ids.indexOf('oracion')<ids.indexOf('gym'));assert.ok(ids.indexOf('gym')<ids.indexOf('lectura'));assert.ok(ids.indexOf('lectura')<ids.indexOf('ingles'));
});
test('the habits accordion stays open through start, finish confirmation and edited minutes',()=>{
 const app=boot();app.run("setSectionOpen('habits',true);beginTrack('lectura');finishTrack('lectura')");assert.equal(app.run('pendingCompletion.goal'),30);assert.equal(app.run("trackData('lectura').done"),false);assert.match(app.element('app').innerHTML,/data-section="habits" open/);app.run('editCompletion();confirmTrackTime(22)');assert.equal(app.run("trackData('lectura').seconds"),1320);assert.match(app.element('app').innerHTML,/data-section="habits" open/);
});
test('cancelling completion does not mark an activity complete or fill its goal',()=>{
 const app=boot();app.run("finishTrack('lectura');cancelCompletion()");assert.equal(app.run("trackData('lectura').done"),false);assert.equal(app.run("trackData('lectura').seconds"),0);
});
test('reading only asks for the current page and keeps it after reload',()=>{
 const app=boot();app.run("view('lectura')");assert.match(app.element('app').innerHTML,/Hábitos atómicos/);assert.ok(!app.element('app').innerHTML.includes('book-notes'));app.element('book-page').value='123';app.run('saveReading()');const next=boot(Object.fromEntries(app.storage));assert.equal(next.run('currentBook().page'),123);
});
test('chosen breakfast and snacks are saved for today',()=>{
 const app=boot();app.run("selectFood('yogurt-oats');selectFood('peanut-toast')");const next=boot(Object.fromEntries(app.storage));assert.equal(next.run("chosenFood('breakfast').id"),'yogurt-oats');assert.equal(next.run("chosenFood('snackpm').id"),'peanut-toast');
});


test('meals show all five background assets without meal checklists or repeated scheduling rules',()=>{const app=boot();app.run("view('comidas')");const html=app.element('app').innerHTML;for(const type of ['breakfast','snackam','lunch','snackpm','dinner'])assert.ok(html.includes('assets/'+type+'.webp'));for(const text of ['meal-checks','Tu almuerzo','Cena de hoy','Guardar hora'])assert.ok(!html.includes(text));});
test('command centre contains the day in one scroll region and rest has no action button',()=>{const app=boot();const html=app.run('commandDay(dashboardCommand())');assert.match(html,/command-scroll/);for(const type of ['breakfast','snackam','lunch','snackpm','dinner'])assert.ok(html.includes('assets/'+type+'.webp'));assert.ok(!html.includes('Tomar un descanso'));const rest=app.run("commandDay({minute:1380,current:{id:'descanso',name:'Descanso',start:1380,end:1440},items:[]})");assert.ok(!rest.includes('hero-cta'));});
test('active timer has its own rail while the schedule warning stays visible',()=>{const app=boot();app.run("activeTrack={id:'gym',start:Date.parse('2026-11-09T07:11:00+02:00'),day:kyivDay()};view('hoy')");const html=app.element('app').innerHTML;assert.match(html,/active-timer-rail/);assert.match(html,/data-transition-state="overdue"/);assert.match(html,/Ya toca/);app.run('pauseTrack()');assert.ok(!app.element('app').innerHTML.includes('active-timer-rail'));});
test('More and settings render with progressively disclosed controls',()=>{const app=boot();app.run("view('mas')");assert.match(app.element('app').innerHTML,/Ajustes y conexiones/);app.run("view('ajustes')");assert.match(app.element('app').innerHTML,/Conexiones y notificaciones/);assert.match(app.element('app').innerHTML,/settings-goals/);});

test('a running activity marks its matching scheduled card instead of duplicating it',()=>{const app=boot();const items=app.run("commandItems({minute:470,items:[{id:'lectura',start:460,end:490,name:'Lectura'}],current:{id:'lectura',start:470,kind:'active',name:'Lectura'}})");assert.equal(items.length,1);assert.equal(items[0].current,true)});
