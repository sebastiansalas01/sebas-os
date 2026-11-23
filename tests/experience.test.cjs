const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function boot(seed={},now='2026-11-09T12:00:00+02:00') {
 const storage=new Map(Object.entries(seed));
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',append(){},setAttribute(){},remove(){},querySelector(){return null},scrollIntoView(){}});return elements.get(id)};
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return new Date(now).getTime()}}
 const ctx=vm.createContext({URL,URLSearchParams,AbortSignal,Intl,Date:FixedDate,Math,JSON,Number,String,Map,Set,Error,Promise,structuredClone,console,setTimeout(fn){fn()},setInterval(){},clearInterval(){},alert(){},navigator:{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{body:{dataset:{}},head:{appendChild(){}},visibilityState:'visible',getElementById:element,querySelector:()=>element('header'),querySelectorAll:()=>[],addEventListener(){},createElement:()=>element('new')},window:{}});
 for(const f of ['core.js','planner-core.js','life-core.js','ops-core.js','ops-ui.js','life-ui.js','recap-core.js','recap-ui.js','planner-ui.js','closing-core.js','closing-ui.js','results-core.js','results-ui.js','app.js','habit-focus.js','habit-swipe.js','habit-polish.js','routine-live.js','calendar-priority.js','agenda-swipe.js','experience.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 return {ctx,storage,element,run:s=>vm.runInContext(s,ctx)};
}
test('new experience renders all main screens and preserves the selected habit',()=>{const a=boot({},'2026-11-23T12:00:00+02:00');for(const tab of ['hoy','proyectos','gym','calendario','mas']){a.run(`view('${tab}',true)`);assert.ok(a.element('app').innerHTML.length>100,tab)}a.run("HabitSwipe.choose('milaperla-2')");assert.match(a.element('app').innerHTML,/Mila Perla · bloque 2/);assert.equal(a.run("HabitSwipe.done('milaperla-2')"),false)});
test('completion only records explicit action and does not fabricate time',()=>{const a=boot({},'2026-11-23T12:00:00+02:00');a.run("HabitSwipe.choose('milaperla-1')");assert.equal(a.run("trackData('milaperla-1').seconds"),0);a.run("HabitSwipe.complete('milaperla-1')");assert.equal(a.run("HabitSwipe.done('milaperla-1')"),true);assert.equal(a.run("HabitSwipe.done('milaperla-2')"),false);assert.equal(a.run("trackData('milaperla-1').seconds"),0);a.run('HabitSwipe.restore()');assert.equal(a.run("HabitSwipe.done('milaperla-1')"),false)});
