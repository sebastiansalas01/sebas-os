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
 const ctx=vm.createContext({URL,URLSearchParams,AbortSignal,Intl,Date:FixedDate,Math,JSON,Number,String,Map,Set,Error,Promise,structuredClone,console,setTimeout(fn){fn()},setInterval(){},clearInterval(){},alert(){},navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{visibilityState:'visible',getElementById:element,querySelector:()=>element('header'),querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('new')},window:{}});
 for(const f of ['core.js','planner-core.js','life-core.js','ops-core.js','ops-ui.js','life-ui.js','recap-core.js','recap-ui.js','planner-ui.js','closing-core.js','closing-ui.js','results-core.js','results-ui.js','klimb-core.js','klimb-ui.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 return {ctx,storage,element,run:s=>vm.runInContext(s,ctx)};
}
test('all views render without runtime errors',()=>{
 const app=boot();for(const view of ['hoy','calendario','comidas','gym','habitos','lectura','estadisticas','ajustes','impulso','actividad','learning','proyectos','mas']){app.run(`view('${view}')`);assert.ok(app.element('app').innerHTML.length>100,view)}
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
test('habit completion preserves its editable confirmation without a redundant Home counter',()=>{
 const app=boot();app.run("setSectionOpen('habits',true);beginTrack('lectura');finishTrack('lectura')");assert.equal(app.run('pendingCompletion.goal'),30);assert.equal(app.run("trackData('lectura').done"),false);assert.ok(!app.element('app').innerHTML.includes('Mis hábitos ·'));app.run('editCompletion();confirmTrackTime(22)');assert.equal(app.run("trackData('lectura').seconds"),1320);assert.ok(!app.element('app').innerHTML.includes('Mis hábitos ·'));
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
test('active timer has its own rail while the schedule warning stays visible',()=>{const app=boot();app.run("activeTrack={id:'gym',start:Date.parse('2026-11-09T07:11:00+02:00'),day:kyivDay()};view('hoy')");const html=app.element('app').innerHTML;assert.match(html,/command-main-timer/);assert.match(html,/data-transition-state="overdue"/);assert.match(html,/Ya toca/);app.run('pauseTrack()');assert.ok(!app.element('app').innerHTML.includes('active-timer-rail'));});
test('More and settings render with progressively disclosed controls',()=>{const app=boot();app.run("view('mas')");assert.match(app.element('app').innerHTML,/Ajustes y conexiones/);app.run("view('ajustes')");assert.match(app.element('app').innerHTML,/Conexiones y notificaciones/);assert.match(app.element('app').innerHTML,/settings-goals/);});

test('a running activity marks its matching scheduled card instead of duplicating it',()=>{const app=boot();const items=app.run("commandItems({minute:470,items:[{id:'lectura',start:460,end:490,name:'Lectura'}],current:{id:'lectura',start:470,kind:'active',name:'Lectura'}})");assert.equal(items.length,1);assert.equal(items[0].current,true)});
test('next activity watermark appears near a real schedule change and stays hidden when far away',()=>{const app=boot();assert.match(app.run('nextWatermark()'),/hidden/);app.run("googleEvents=[{id:'next',calendarId:'personal',name:'Reunión personal',start:'2026-11-09T12:05:00+02:00',end:'2026-11-09T12:35:00+02:00'}]");const html=app.run('nextWatermark()');assert.ok(!html.includes(' hidden'));assert.match(html,/Siguiente/);assert.match(html,/Reunión personal/);app.run("activeTrack={id:'lectura',start:Date.parse('2026-11-09T11:50:00+02:00'),day:kyivDay()};googleEvents[0].start='2026-11-09T12:00:00+02:00'");assert.match(app.run('nextWatermark()'),/Ahora toca/)});
test('goal question keeps timer running until Yes, No continues, and time is editable before completion',()=>{const app=boot(),dialogs=new Map(),get=app.ctx.document.getElementById;app.ctx.document.getElementById=id=>id==='goal-finished-dialog'?dialogs.get(id)||null:get(id);app.ctx.document.querySelector=()=>null;app.ctx.document.createElement=()=>({dataset:{},setAttribute(){},addEventListener(){},showModal(){this.open=true},remove(){dialogs.delete(this.id)}});app.ctx.document.body={append:d=>dialogs.set(d.id,d)};app.run("activeTrack={id:'lectura',day:kyivDay(),start:Date.now()-1800000};let elapsedForTest=1800;currentSeconds=()=>elapsedForTest;tickGoalPrompt()");assert.equal(dialogs.size,1);assert.equal(app.run('!!activeTrack'),true);assert.equal(app.run("trackData('lectura').done"),false);app.run('answerGoalPrompt(false);tickGoalPrompt()');assert.equal(dialogs.size,0);assert.equal(app.run('!!activeTrack'),true);app.run('elapsedForTest=2101;tickGoalPrompt();answerGoalPrompt(true)');assert.equal(app.run('activeTrack'),null);assert.equal(app.run("trackData('lectura').done"),false);assert.equal(app.run('pendingCompletion.goal'),30);app.run('editCompletion();confirmTrackTime(25)');assert.equal(app.run("trackData('lectura').seconds"),1500);assert.equal(app.run("trackData('lectura').done"),true);});
test('Home shows outcome priorities and compact actions with the next activity only in the footer',()=>{const app=boot();const html=app.element('app').innerHTML;for(const text of ['INGLÉS DE NEGOCIOS','VENTAS E INGRESOS','KLIMB · PROYECTO PERSONAL'])assert.ok(html.includes(text));assert.match(html,/command-footer/);assert.ok(!html.includes('class="hero-cta"'));assert.ok(!html.includes('Tu día, a un toque'));assert.equal((html.match(/data-transition-state/g)||[]).length,1);});
test('breakfast and shower are separate and the early English class retains its half-hour before daily',()=>{const app=boot();const rows=app.run("SebasPlanner.routine(Date.parse('2026-11-11T12:00:00+02:00'))");const breakfast=rows.find(x=>x.id==='desayuno'),shower=rows.find(x=>x.id==='ducha'),english=rows.find(x=>x.id==='ingles');assert.equal(breakfast.name,'Desayuno');assert.equal(breakfast.duration,25);assert.equal(breakfast.preparationMinutes,10);assert.equal(breakfast.eatingMinutes,15);assert.equal(shower.duration,20);assert.equal(shower.start,breakfast.end);assert.ok(shower.end<=english.start);assert.equal(english.end,570);});

test('routine update applies forty minutes once while preserving recorded activity time',()=>{const app=boot({sebasos:JSON.stringify({gymMinutes:30,goals:{lectura:25},englishWeekday:1})});assert.equal(app.run('data.gymMinutes'),40);assert.equal(app.run('data.englishWeekday'),5);// Preply proposal moved to Friday (92e8e1f)
assert.equal(app.run('data.goals.lectura'),25);app.run('chooseWorkout(45)');const next=boot(Object.fromEntries(app.storage));assert.equal(next.run('data.gymMinutes'),45)});
test('every command activity has a background including quiet moments',()=>{const app=boot();const html=app.run('commandDay(dashboardCommand())');const cards=html.match(/<article class="command-slide[^>]+>/g);assert.ok(cards.length>5);assert.ok(cards.every(x=>x.includes('background-image:')));for(const id of ['despertar','oracion','gym','lectura','ducha','dormir'])assert.match(app.run(`activityBackground({id:'${id}'})`),/^assets\/scene-.*\.webp$/)});

test('Closing follow-ups stay in the work agenda and never in habits, goal settings or habit counts',()=>{const app=boot();assert.ok(!app.run('orderedHabitTracks().map(t=>t.id)').includes('seguimientos'));assert.ok(!app.run('habitCards()').includes('Seguimientos Closing'));assert.ok(!app.run('goalSettings()').includes('Seguimientos Closing'));assert.ok(app.run('dashboardCommand().items.some(x=>x.id==="seguimientos")'));app.run("view('ajustes')");assert.match(app.element('app').innerHTML,/Conectar con Slack/);assert.match(app.element('app').innerHTML,/Pendiente de activar/)});

test('Home removes completion counting while keeping a discreet routine shortcut',()=>{const app=boot();const html=app.element('app').innerHTML;assert.ok(!html.includes('Mis hábitos ·'));assert.match(html,/Rutina y registros/);app.run("view('habitos')");assert.match(app.element('app').innerHTML,/Lectura/)});
test('recap calls enter the schedule for 90 minutes with reports and no lead website action',()=>{const app=boot();app.run(`applyRecapSnapshots([{version:1,day:'2026-11-09',generatedAt:'2026-11-09T07:00:00Z',sessions:[{id:'demo',name:'Cliente Prueba',start:'2026-11-09T13:00:00Z',status:'confirmed',report:'Objetivo: crecer. https://example.com',sourceText:'Instagram https://instagram.com/demo/',instagram:'https://instagram.com/demo/'}]}]);view('impulso')`);const html=app.element('app').innerHTML;assert.match(html,/Cliente Prueba/);assert.match(html,/90 MIN/);assert.match(html,/Ver informe/);assert.match(html,/Instagram/);assert.ok(!html.includes('example.com'));assert.equal(app.run('SebasLife.scheduledEvents(effectiveEvents(),allLeadCards()).length'),1);assert.match(app.run('callReportHtml(effectiveEvents()[0])'),/Objetivo: crecer/);assert.ok(!app.run('callReportHtml(effectiveEvents()[0])').includes('example.com'))});
test('new Closing, Learning and Project destinations preserve real metrics and show no invented progress',()=>{const app=boot();for(const v of ['impulso','learning','proyectos']){app.run(`view('${v}')`);assert.match(app.element('app').innerHTML,/destination-hero/)}assert.equal(app.run('learningWeek().classes'),0);assert.equal(app.run('(data.klimbTasks||[]).filter(t=>t.done).length'),0);// sprint goals are seeded, but none is marked done
app.run("data.klimbTasks=[{id:'safe',title:'<img src=x onerror=alert(1)>',done:false}];view('proyectos')");assert.ok(!app.element('app').innerHTML.includes('<img src=x'));assert.match(app.element('app').innerHTML,/Enfocar/)});

test('Closing offers one sale action and one connection action per screen',()=>{const app=boot();app.run("view('impulso')");const html=app.element('app').innerHTML;assert.equal((html.match(/onclick="openSaleDialog\(\)"/g)||[]).length,1);assert.equal((html.match(/>Conectar agenda<\/button>/g)||[]).length,1)});

test('manual refresh opens an explicit ChatGPT request and cannot claim a new Slack review from an old snapshot',()=>{const app=boot();const url=new URL(app.run('recapReviewUrl()'));assert.equal(url.origin,'https://chatgpt.com');assert.match(url.searchParams.get('q'),/Ejecuta ahora mi automatización/);assert.match(url.searchParams.get('q'),/menciones/);assert.match(url.searchParams.get('q'),/90 minutos/);app.run("applyRecapSnapshots([{version:1,day:kyivDay(),generatedAt:'2026-11-09T07:00:00Z',sessions:[]}]);recapReviewStarted()");assert.match(app.run('recapState.status'),/Abre ChatGPT/);assert.match(app.run('recapReviewStatus()'),/Sin resultado nuevo/);app.run("recapState.snapshots[0].generatedAt='2026-11-09T12:01:00+02:00'");assert.match(app.run('recapReviewStatus()'),/Recap revisado/);assert.equal(app.run('recapState.reviewRequestedAt'),null)});

test('return-to-app refresh is installed before a new device is paired',()=>{const app=boot({sebasExternalRecapEnabled:'true'}),events=[];// legacy recaps are opt-in since 8c2bc71
app.ctx.document.addEventListener=(name,handler)=>events.push({name,handler});app.run('initRecapSync()');assert.equal(app.run('recapDevice'),null);assert.ok(events.some(x=>x.name==='visibilitychange'&&x.handler.toString().includes('syncRecaps')))});

test('KLIMB command centre shows one next action, the payment decision and escapes stored evidence',()=>{
 const app=boot();app.run("view('proyectos')");let html=app.element('app').innerHTML;
 assert.match(html,/KLIMB · CENTRO DE MANDO/);assert.match(html,/¿Cómo vas a cobrar\?/);assert.match(html,/MERCADO PROVISIONAL: ESPAÑA/);assert.match(html,/Estudio de vídeo y sprint anterior/);
 app.run("klimbSetPayment('intermediario')");html=app.element('app').innerHTML;assert.match(html,/Vía elegida: <strong>intermediario/);assert.match(html,/K10 · Kit de limpieza/);
 const evil={version:1,products:[{id:'K01',status:'research',evidence:[{type:'competitor_listing',url:'https://x.es/"><script>alert(1)</script>',note:'<img src=x onerror=alert(1)>',observedAt:'2026-11-13'}]}],merchant:{paymentRoute:'x'}};
 const next=boot({sebasKlimb:JSON.stringify(evil)});next.run("klimbOpenProduct='K01';view('proyectos')");html=next.element('app').innerHTML;assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('<img src=x'));
});
test('home shows the KLIMB next step card linked to Projects',()=>{const app=boot();app.run("view('hoy')");assert.match(app.element('app').innerHTML,/klimb-next/)});
