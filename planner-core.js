(function(root){
  const C=root.SebasCore || require('./core.js');
  function minute(ts=Date.now()){const p=new Intl.DateTimeFormat('en',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(ts));return Number(p.find(x=>x.type==='hour').value)*60+Number(p.find(x=>x.type==='minute').value)}
  function time(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(((n%60)+60)%60)).padStart(2,'0')}
  function parseTime(v,fallback){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(v||''))return fallback;const [h,m]=v.split(':').map(Number);return h*60+m}
  function founderRoutine(now,options){
    const weekday=C.weekday(now),weekend=[0,6].includes(weekday),gym=45;
    // Fixed 07:00 wake-up in Europe/Kyiv. Mentorship events are taken from the connected calendar, never invented.
    const list=[
      {id:'despertar',name:'Despertar y prepararte',start:420,duration:20},
      {id:'oracion',name:'Oración',start:440,duration:10},
      {id:'gym',name:'Entrenamiento · 45 min',start:455,duration:gym},
      {id:'lectura',name:'Lectura · 30 min',start:510,duration:30},
      {id:'desayuno',name:'Desayuno sin prisas',start:550,duration:40,tab:'comidas'},
      {id:'ducha',name:'Ducha y preparación',start:600,duration:25},
      {id:'klimb',name:'KLIMB · investigar productos y mercado',start:640,duration:120,tab:'proyectos'},
      {id:'klimb-build',name:'KLIMB · tienda, oferta y validación',start:780,duration:120,tab:'proyectos'},
      {id:'klimb-creative',name:'KLIMB · anuncios y vídeos IA',start:960,duration:90,tab:'proyectos'},
      {id:'descanso',name:'Desconexión',start:1320,duration:90},
      {id:'dormir',name:'Dormir',start:1410,duration:30,priority:20}
    ];
    if([1,3,5].includes(weekday))list.push({id:'ingles',name:'Preply · sesión objetivo (confirmar reserva)',start:900,duration:60,tab:'learning'});
    else list.push({id:'ingles',name:'Inglés · práctica y conversación',start:900,duration:60,tab:'learning'});
    if(weekend){const build=list.find(x=>x.id==='klimb-build');build.duration=90;list.find(x=>x.id==='klimb-creative').duration=60}
    const life=root.SebasLife;
    if(life){const meals=life.mealSchedule(options.busyEvents||[],now,options.mealDate===C.day(now)?options.mealTimes||{}:{});
      for(const [id,type,label] of [['almuerzo','lunch','Almuerzo'],['snackam','snackam','Snack de mañana'],['snackpm','snackpm','Snack de tarde'],['cena','dinner','Cena']]){
        const slot=meals[type];if(slot)list.push({id,name:label,start:slot.start,duration:slot.end-slot.start,tab:'comidas',priority:2});
      }
    }
    return list.map(x=>({...x,end:x.start+x.duration,kind:'routine'})).sort((a,b)=>a.start-b.start);
  }
  function routine(now=Date.now(),options={}){
    if(C.day(now)>='2026-11-14')return founderRoutine(now,options);
    const weekend=[0,6].includes(C.weekday(now));const gym=[30,40,45,60].includes(options.gym)?options.gym:40;

    const starts=options.starts||{},weekday=C.weekday(now),early=weekday===(options.englishWeekday??3);
    const readingMinutes=options.goals?.lectura||30,prayerMinutes=options.goals?.oracion||10;
    const breakfastStart=early&&!weekend?465:490,breakfastEnd=breakfastStart+25,reading=breakfastStart-readingMinutes,exercise=reading-gym,prayer=exercise-prayerMinutes;
    const list=[{id:'despertar',name:'Despertar y prepararte',start:prayer-20,duration:20},{id:'oracion',name:'Oración',start:prayer,duration:prayerMinutes},{id:'gym',name:'Entrenamiento',start:exercise,duration:gym},{id:'lectura',name:'Lectura',start:reading,duration:readingMinutes},{id:'desayuno',name:'Desayuno',start:breakfastStart,duration:25,preparationMinutes:10,eatingMinutes:15,tab:'comidas'},{id:'ducha',name:'Ducha y preparación',start:breakfastEnd,duration:20}];
    const cutoff=[2,5].includes(weekday)?1110:1260;
    if(weekend)list.push({id:'ingles',name:'Preply · clase de inglés (propuesta)',start:540,duration:60},{id:'klimb',name:'KLIMB',start:parseTime(starts.klimb,630),duration:180});
    else {
      list.push({id:'preparacion',name:'Preparación de llamadas',start:580,duration:20,tab:'impulso'},{id:'daily',name:'Daily Closing',start:600,duration:30,tab:'impulso'});
      if(early)list.push({id:'ingles',name:'Preply · clase de inglés (propuesta)',start:510,duration:60});
      else if(![2,5].includes(weekday))list.push({id:'klimb',name:'KLIMB',start:breakfastEnd+20,duration:580-(breakfastEnd+20)});
      if([2,5].includes(weekday))list.push({id:'klimb',name:'KLIMB',start:1110,duration:90});
    }
    if(weekday===6)list.push({id:'ventas',name:'Práctica comercial',start:900,duration:60,priority:3});
    if(weekday===2&&!((options.busyEvents||[]).some(e=>{const a=Date.parse(e.start),b=Date.parse(e.end);return Number.isFinite(a)&&Number.isFinite(b)&&minute(a)<1260&&minute(b)>1200&&C.onDay(e,C.day(now))})))list.push({id:'ventas',name:'Mentoría de ventas',start:1200,duration:60,priority:3});
    const life=root.SebasLife;
    if(life){const events=options.busyEvents||[],meals=life.mealSchedule([...events,...list.filter(x=>x.id==='ventas').map(x=>{const stamp=Date.parse(C.day(now)+'T12:00:00Z'),start=stamp+(x.start-minute(stamp))*60000;return {name:x.name,start:new Date(start).toISOString(),end:new Date(start+x.duration*60000).toISOString()}})],now,options.mealDate===C.day(now)?options.mealTimes||{}:{});for(const [id,type,label] of [['almuerzo','lunch','Almuerzo'],['snackam','snackam','Snack de mañana'],['snackpm','snackpm','Snack de tarde'],['postcall','postcall','Pausa'],['cena','dinner','Cena']]){const slot=meals[type];if(slot)list.push({id,name:label+(options.mealNames?.[type]?' · '+options.mealNames[type]:''),start:slot.start,duration:slot.end-slot.start,tab:'comidas',priority:2,adjusted:slot.adjusted||false})}
      const dinner=meals.dinner,english=list.find(x=>x.id==='ingles');if(dinner&&english&&dinner.start<english.start+english.duration&&dinner.end>english.start)english.start=dinner.end;
      const reserved=[...list.filter(x=>x.id!=='trabajo').map(x=>({start:x.start,end:x.start+x.duration})),...life.intervals(events,now),...Object.values(meals).filter(x=>x&&typeof x==='object'&&Number.isFinite(x.start))];
      const follow=life.slot(reserved,630,30,cutoff,0);if(follow&&!weekend)list.push({id:'seguimientos',name:'Seguimientos Closing · 30 min',start:follow.start,duration:30,priority:1});
    }
    list.push({id:'descanso',name:'Desconexión',start:1320,duration:90},{id:'dormir',name:'Dormir',start:1410,duration:30,priority:20});
    return list.map(x=>({...x,end:x.start+x.duration,kind:'routine'})).sort((a,b)=>a.start-b.start);
  }
  function agenda(events,now=Date.now(),options={}){
    const currentDay=C.day(now);const calendar=events.filter(e=>!e.allDay&&Number.isFinite(Date.parse(e.end))&&C.onDay(e,currentDay)).map(e=>({id:C.eventKey(e),event:e,name:e.name,start:C.day(Date.parse(e.start))<currentDay?0:minute(Date.parse(e.start)),end:C.day(Date.parse(e.end))>currentDay?1440:minute(Date.parse(e.end)),kind:'event',tab:'impulso'})).filter(e=>e.end>e.start);
    // A real event replaces overlapping suggested routine slots, but remains visible in the agenda.
    const plan=routine(now,{...options,busyEvents:options.busyEvents||events}).filter(s=>!calendar.some(e=>e.start<s.end&&e.end>s.start&&true));
    return [...plan,...calendar].sort((a,b)=>a.start-b.start||Number(b.kind==='event')-Number(a.kind==='event'));
  }
  function command(events,done={},active=null,now=Date.now(),options={}){
    const m=minute(now);const items=agenda(events,now,options);if(m>=1410){const next=agenda(events,C.boundary(now),options)[0]||null;return {current:{id:'dormir',name:'Dormir',kind:'routine',start:1410,end:1440,duration:30},next:next?{...next,dayOffset:1}:null,items,minute:m}}const eligible=items.filter(x=>!done[x.id]&&!(x.id==='seguimientos'&&done.seguimientos));
    let current=eligible.filter(x=>x.start<=m&&x.end>m).sort((a,b)=>((b.kind==='event'?10:b.priority||0)-(a.kind==='event'?10:a.priority||0)))[0]||null;
    if(active)current={id:active.id,name:options.names?.[active.id]||active.id,kind:'active',start:minute(active.start),duration:options.goals?.[active.id]||30};
    let next=eligible.find(x=>x.start>m&&x.id!==current?.id)||null;if(!next){const tomorrow=C.boundary(now);next=agenda(events,tomorrow,options)[0]||null;if(next)next={...next,dayOffset:1}}
    if(!current){const gap=next?Math.max(0,next.start-m):30;const rest=m<420||m>=1380;const completedCalls=items.filter(x=>x.kind==='event'&&x.end<=m&&/venta|llamada|sesión|sesion|closing/i.test(x.name)).length;const followDone=!!done.seguimientos;const recommendation=rest?'Descanso':completedCalls>=2&&gap>=25?'Descansa 20 minutos':!followDone&&gap>=30?'Seguimientos prioritarios · 30 min':gap>=60?'KLIMB · avanzar proyecto':gap>=20?'Preparar siguiente compromiso':'Tiempo disponible';current={id:rest?'descanso':'libre',name:recommendation,kind:'free',start:m,end:m+gap,duration:gap};}
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
  const GYM_GROUPS={
    empuje:{name:'Empuje',detail:'Pecho · hombros · tríceps',exercises:[['Press de pecho en máquina','8–12','Ajusta el asiento y empuja sin bloquear los codos.'],['Press inclinado con mancuernas','8–12','Usa un peso que permita controlar la bajada.'],['Press de hombros en máquina','8–12','Mantén el tronco estable y evita forzar el recorrido.'],['Elevaciones laterales','12–15','Sube con control y sin balancear el cuerpo.'],['Tríceps en polea','10–15','Mantén los codos cerca del cuerpo.'],['Flexiones inclinadas','8–12','Elige una altura cómoda y mantén el cuerpo alineado.']]},
    pierna:{name:'Pierna',detail:'Cuádriceps · glúteos · femorales',exercises:[['Prensa de piernas','10–12','Baja hasta un rango cómodo y mantén la espalda apoyada.'],['Peso muerto rumano con mancuernas','8–10','Lleva la cadera atrás y conserva una espalda estable.'],['Hip thrust','10–12','Eleva la cadera sin arquear la zona lumbar.'],['Curl femoral en máquina','10–15','Ajusta la máquina y mueve el peso con control.'],['Extensión de cuádriceps','10–15','Evita golpear al subir o bajar la carga.'],['Sentadilla goblet','8–12','Sujeta una mancuerna cerca del pecho y baja con control.']]},
    tiron:{name:'Tirón',detail:'Espalda · bíceps',exercises:[['Jalón al pecho','8–12','Lleva la barra hacia el pecho sin balancearte.'],['Remo sentado en polea','8–12','Lleva los codos hacia atrás con el tronco estable.'],['Remo con apoyo en banco','10–12','Apoya el pecho y controla cada repetición.'],['Face pull en polea','12–15','Usa poca carga y un recorrido cómodo.'],['Curl de bíceps','10–12','Evita impulsarte con la espalda.'],['Curl martillo','10–12','Mantén las muñecas alineadas.']]},
    torso:{name:'Torso',detail:'Pecho · espalda · hombros',exercises:[['Press de pecho en máquina','8–12','Ajusta el asiento y controla la carga.'],['Jalón al pecho','8–12','Mueve los codos hacia abajo sin tirones.'],['Remo sentado en polea','8–12','Mantén el tronco estable.'],['Press de hombros en máquina','8–12','No fuerces el recorrido.'],['Elevaciones laterales','12–15','Utiliza un peso ligero y controlado.'],['Curl de bíceps','10–12','Evita el balanceo.']]},
    core:{name:'Core / abs',detail:'Estabilidad · abdomen',exercises:[['Dead bug','8–10 por lado','Mueve brazos y piernas manteniendo la zona lumbar estable.'],['Pallof press en polea','10–12 por lado','Evita que el tronco gire al extender los brazos.'],['Plancha adaptada','20–40 s','Apoya las rodillas si necesitas reducir la dificultad.'],['Bird dog','8–10 por lado','Extiende brazo y pierna contrarios sin girar la cadera.'],['Plancha lateral adaptada','20–30 s por lado','Puedes apoyar la rodilla inferior.'],['Crunch controlado','10–15','Evita tirar del cuello.']]},
    full:{name:'Cuerpo completo',detail:'Piernas · torso · core',exercises:[['Sentadilla goblet','8–12','Mantén la carga cerca del pecho.'],['Press de pecho en máquina','8–12','Ajusta el asiento y controla la carga.'],['Remo sentado en polea','8–12','Lleva los codos atrás sin balancearte.'],['Peso muerto rumano con mancuernas','8–10','Lleva la cadera atrás con control.'],['Jalón al pecho','8–12','Evita los tirones.'],['Pallof press en polea','10–12 por lado','Mantén el tronco estable.']]},
    recuperacion:{name:'Recuperación y movilidad',detail:'Ritmo suave · sin buscar fatiga',exercises:[['Bicicleta estática suave','3–5 min','Mantén un ritmo cómodo.'],['Movilidad de hombros','8–10','Utiliza un recorrido sin dolor.'],['Bird dog','6–8 por lado','Trabaja despacio y con control.'],['Caminata suave','3–5 min','Elige un ritmo que te permita conversar.'],['Movilidad de cadera','8–10 por lado','Usa apoyo si lo necesitas.'],['Respiración tranquila','1–2 min','Baja el ritmo antes de terminar.']]}
  };
  function gymGroup(now=Date.now()){return ['recuperacion','empuje','pierna','tiron','recuperacion','torso','core'][C.weekday(now)]}
  function workout(minutes=40,options={}){minutes=[30,40,45,60].includes(minutes)?minutes:40;if(options.mode==='gym'){const group=GYM_GROUPS[options.group]?options.group:gymGroup(options.now);const definition=GYM_GROUPS[group],count=minutes===30?4:minutes<=45?5:6,sets=minutes===30?2:3;return {mode:'gym',group,name:definition.name,detail:definition.detail,minutes,sets,rounds:sets,restSeconds:75,total:minutes*60,exercises:definition.exercises.slice(0,count).map(([name,reps,hint],i)=>({id:group+'-'+i,name,reps,hint}))}}const count=minutes===30?5:minutes===40?6:minutes===45?7:10;const rounds=minutes===30?4:5;return {minutes,rounds,work:40,rest:20,warmup:300,cooldown:300,exercises:EXERCISES.slice(0,count),total:minutes*60}}
  function phase(plan,elapsed){elapsed=Math.max(0,Math.floor(elapsed));if(elapsed>=plan.total)return {kind:'done',name:'Sesión terminada',left:0,index:plan.exercises.length-1};if(elapsed<plan.warmup)return {kind:'warmup',name:'Calentamiento suave',left:plan.warmup-elapsed,index:0};const training=plan.exercises.length*plan.rounds*60;const workElapsed=elapsed-plan.warmup;if(workElapsed>=training)return {kind:'cooldown',name:'Vuelta a la calma',left:plan.total-elapsed,index:plan.exercises.length-1};const unit=Math.floor(workElapsed/60),index=unit%plan.exercises.length,round=Math.floor(unit/plan.exercises.length)+1,part=workElapsed%60;return {kind:part<plan.work?'work':'rest',name:part<plan.work?plan.exercises[index].name:'Pausa · siguiente ejercicio',left:part<plan.work?plan.work-part:60-part,index,round}}
  const api={minute,time,parseTime,routine,agenda,command,workout,phase,gymGroup,GYM_GROUPS};root.SebasPlanner=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

