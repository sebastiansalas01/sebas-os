(function(root){
  const C=root.SebasCore || require('./core.js');
  function minute(ts=Date.now()){const p=new Intl.DateTimeFormat('en',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ts));return Number(p.find(x=>x.type==='hour').value)*60+Number(p.find(x=>x.type==='minute').value)}
  function time(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
  function parseTime(v,fallback){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(v||''))return fallback;const [h,m]=v.split(':').map(Number);return h*60+m}
  function routine(now=Date.now(),options={}){
    const weekend=[0,6].includes(C.weekday(now));const gym=[30,45,60].includes(options.gym)?options.gym:30;
    const starts=options.starts||{};const prayer=parseTime(starts.oracion,420),exercise=parseTime(starts.gym,prayer+10),reading=parseTime(starts.lectura,exercise+gym+40);
    const list=[{id:'oracion',name:'Oración',start:prayer,duration:10},{id:'gym',name:'Entrenamiento',start:exercise,duration:gym},{id:'desayuno',name:'Desayuno y preparación',start:exercise+gym+10,duration:30,tab:'comidas'},{id:'lectura',name:'Lectura',start:reading,duration:30}];
    if(weekend)list.push({id:'klimb',name:'KLIMB',start:parseTime(starts.klimb,600),duration:180},{id:'ingles',name:'Inglés de negocios',start:parseTime(starts.ingles,960),duration:60});
    else list.push({id:'preparacion',name:'Preparación de llamadas',start:580,duration:20,tab:'impulso'},{id:'daily',name:'Daily Impulso',start:600,duration:30,tab:'impulso'},{id:'trabajo',name:'Impulso · llamadas y seguimiento',start:630,duration:630,tab:'impulso'},{id:'ingles',name:'Inglés de negocios',start:parseTime(starts.ingles,1260),duration:60});
    list.push({id:'descanso',name:'Desconexión y descanso',start:weekend?1320:1320,duration:60});
    return list.map(x=>({...x,end:x.start+x.duration,kind:'routine'})).sort((a,b)=>a.start-b.start);
  }
  function agenda(events,now=Date.now(),options={}){
    const currentDay=C.day(now);const calendar=events.filter(e=>!e.allDay&&C.onDay(e,currentDay)).map(e=>({id:C.eventKey(e),event:e,name:e.name,start:C.day(Date.parse(e.start))<currentDay?0:minute(Date.parse(e.start)),end:C.day(Date.parse(e.end))>currentDay?1440:minute(Date.parse(e.end)),kind:'event',tab:'impulso'})).filter(e=>e.end>e.start);
    // A real event replaces overlapping suggested routine slots, but remains visible in the agenda.
    const plan=routine(now,options).filter(s=>!calendar.some(e=>e.start<s.end&&e.end>s.start&&s.id!=='trabajo'));
    return [...plan,...calendar].sort((a,b)=>a.start-b.start||Number(b.kind==='event')-Number(a.kind==='event'));
  }
  function command(events,done={},active=null,now=Date.now(),options={}){
    const m=minute(now);const items=agenda(events,now,options);const eligible=items.filter(x=>!done[x.id]);
    let current=eligible.filter(x=>x.start<=m&&x.end>m).sort((a,b)=>Number(b.kind==='event')-Number(a.kind==='event'))[0]||null;
    if(active)current={id:active.id,name:options.names?.[active.id]||active.id,kind:'active',start:minute(active.start),duration:options.goals?.[active.id]||30};
    let next=eligible.find(x=>x.start>m&&x.id!==current?.id)||null;if(!next){const tomorrow=C.boundary(now);next=agenda(events,tomorrow,options)[0]||null;if(next)next={...next,dayOffset:1}}
    if(!current)current={id:m<420||m>=1380?'descanso':'libre',name:m<420||m>=1380?'Descanso':'Tiempo disponible',kind:'free',start:m,duration:next?Math.max(0,next.start-m):30};
    return {current,next,items,minute:m};
  }
  const EXERCISES=[
    {id:'squat',name:'Sentadilla',hint:'Baja de forma controlada; usa una silla si lo necesitas.',group:'Piernas'},
    {id:'pushup',name:'Flexiones',hint:'Apoya las rodillas o usa una superficie elevada para adaptar la dificultad.',group:'Pecho y brazos'},
    {id:'bridge',name:'Puente de glúteos',hint:'Aprieta los glúteos sin arquear la espalda.',group:'Glúteos'},
    {id:'bird',name:'Bird dog',hint:'Extiende brazo y pierna contrarios manteniendo el tronco estable.',group:'Espalda y control'},
    {id:'plank',name:'Plancha',hint:'Mantén una posición cómoda; puedes apoyar las rodillas.',group:'Core'},
    {id:'lunge',name:'Zancada atrás',hint:'Alterna piernas con apoyo cercano si necesitas equilibrio.',group:'Piernas'},
    {id:'deadbug',name:'Dead bug',hint:'Mueve brazos y piernas sin despegar la zona lumbar.',group:'Core'},
    {id:'calf',name:'Elevación de talones',hint:'Sube y baja despacio; usa apoyo para mantener el equilibrio.',group:'Piernas'},
    {id:'side',name:'Plancha lateral adaptada',hint:'Apoya la rodilla inferior y alterna lado en cada ronda.',group:'Core'},
    {id:'wall',name:'Ángeles en la pared',hint:'Desliza los brazos sin forzar los hombros.',group:'Movilidad'}
  ];
  function workout(minutes=30){minutes=[30,45,60].includes(minutes)?minutes:30;const count=minutes===30?5:minutes===45?7:10;const rounds=minutes===30?4:5;return {minutes,rounds,work:40,rest:20,warmup:300,cooldown:300,exercises:EXERCISES.slice(0,count),total:minutes*60}}
  function phase(plan,elapsed){elapsed=Math.max(0,Math.floor(elapsed));if(elapsed>=plan.total)return {kind:'done',name:'Sesión terminada',left:0,index:plan.exercises.length-1};if(elapsed<plan.warmup)return {kind:'warmup',name:'Calentamiento suave',left:plan.warmup-elapsed,index:0};const training=plan.exercises.length*plan.rounds*60;const workElapsed=elapsed-plan.warmup;if(workElapsed>=training)return {kind:'cooldown',name:'Vuelta a la calma',left:plan.total-elapsed,index:plan.exercises.length-1};const unit=Math.floor(workElapsed/60),index=unit%plan.exercises.length,round=Math.floor(unit/plan.exercises.length)+1,part=workElapsed%60;return {kind:part<plan.work?'work':'rest',name:part<plan.work?plan.exercises[index].name:'Pausa · siguiente ejercicio',left:part<plan.work?plan.work-part:60-part,index,round}}
  const api={minute,time,parseTime,routine,agenda,command,workout,phase};root.SebasPlanner=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
