// KLIMB validation engine: pure, deterministic and testable. No network, no invented metrics.
// Source of truth for rules: KLIMB_MISSION_CONTROL.md, docs/klimb-validation.md, docs/klimb-fulfillment.md.
(function(root){
  const TARGET_DAY='2026-12-31',START_DAY='2026-11-13',TARGET_EUR=15000,PAYMENT_LEAD_DAYS=42;
  const STATUSES=['idea','research','supplier_screened','landing_ready','organic_signal','paid_test_approved','validated','inconclusive','rejected'];
  const EVIDENCE_TYPES=['search_intent','competitor_listing','ad_library','supplier_listing','category_reference','retail_example','customer_feedback'];
  // Research backlog v0.1 from docs/klimb-candidates.md (ChatGPT, 2026-11-13). Hypotheses only: no scores, supplier or economics.
  const CANDIDATES=[
    ['K01','Rodillo reutilizable quitapelos','Mascotas/hogar',[24,39],1],['K02','Alfombra olfativa para perros','Mascotas',[25,45],4],
    ['K03','Comedero lento para perros','Mascotas',[24,39]],['K04','Botella de agua portátil para perros','Mascotas/viajes',[24,39]],
    ['K05','Bolsas higiénicas para mascotas (packs)','Mascotas',[19,29]],['K06','Juguete de olfato interactivo','Mascotas',[25,49]],
    ['K07','Arnés ajustable para perro','Mascotas',[29,49]],['K08','Luz LED con sensor para armarios','Organización hogar',[24,44],2],
    ['K09','Organizador de zapatos modular','Organización hogar',[29,59]],['K10','Cepillo de taladro para limpieza','Limpieza hogar',[24,39],3],
    ['K11','Protector de desagüe de silicona','Limpieza hogar',[19,29]],['K12','Mosquitera magnética para puerta','Hogar',[29,49]],
    ['K13','Filtro de agua de línea','Hogar',[39,79]],['K14','Baldosas decorativas autoadhesivas','Decoración',[29,59],5],
    ['K15','Flores artificiales decorativas','Decoración',[24,49]],['K16','Juego de ropa de cama','Hogar',[49,89]],
    ['K17','Bandas de resistencia (set)','Fitness',[24,44]],['K18','Accesorios reflectantes de ciclismo','Ciclismo',[24,44]],
    ['K19','Bolso satchel compacto','Moda/accesorios',[39,79]],['K20','Kit de manualidades con tela imprimible','DIY/manualidades',[29,59]]
  ].map(([id,name,niche,range,focus])=>({id,name,niche,status:'idea',focus:focus||null,hypotheticalRetailRangeEUR:range,supplierVerified:false,scores:null,economics:null,evidence:[],suppliers:[],offer:null,landing:null,notes:''}));
  const SEARCH_TERMS={K01:['quitapelos mascotas','rodillo quitapelos reutilizable'],K02:['alfombra olfativa perro'],K08:['luz sensor armario','luz led movimiento armario'],K10:['cepillo taladro limpieza','kit cepillos limpieza taladro'],K14:['azulejos adhesivos cocina']};
  function seed(){return {version:1,market:{country:'ES',confirmed:false},merchant:{paymentRoute:null,entity:null},products:CANDIDATES.map(p=>JSON.parse(JSON.stringify(p))),experiments:[]}}
  function normalize(state){const base=seed();if(!state||typeof state!=='object'||state.version!==1)return base;
    const known=new Map((Array.isArray(state.products)?state.products:[]).filter(p=>p&&typeof p.id==='string').map(p=>[p.id,p]));
    const products=base.products.map(p=>known.has(p.id)?{...p,...known.get(p.id)}:p);for(const [id,p] of known)if(!products.some(x=>x.id===id))products.push({...p,evidence:p.evidence||[],suppliers:p.suppliers||[]});
    for(const p of products){if(!STATUSES.includes(p.status))p.status='idea';p.evidence=Array.isArray(p.evidence)?p.evidence:[];p.suppliers=Array.isArray(p.suppliers)?p.suppliers:[]}
    return {version:1,market:{...base.market,...(state.market||{})},merchant:{...base.merchant,...(state.merchant||{})},products,experiments:Array.isArray(state.experiments)?state.experiments:[]}}
  function dayNumber(day){return Math.max(1,Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(START_DAY+'T12:00:00Z'))/86400000)+1)}
  function daysLeft(day){return Math.max(0,Math.round((Date.parse(TARGET_DAY+'T12:00:00Z')-Date.parse(day+'T12:00:00Z'))/86400000))}
  function validUrl(u){try{const x=new URL(u);return x.protocol==='https:'||x.protocol==='http:'}catch{return false}}
  // Independent evidence: distinct type+host+claim, with a real URL. Category references never count as product demand.
  function evidenceOf(p,type){const seen=new Set();return (p.evidence||[]).filter(e=>e&&e.type===type&&validUrl(e.url)).filter(e=>{let host='';try{host=new URL(e.url).host}catch{}const k=type+'|'+host+'|'+(e.url||'');if(seen.has(k))return false;seen.add(k);return true})}
  function addEvidence(state,productId,item,today){const s=normalize(state),p=s.products.find(x=>x.id===productId);if(!p)throw Error('Producto no encontrado.');
    if(!EVIDENCE_TYPES.includes(item?.type))throw Error('Tipo de evidencia no válido.');if(!validUrl(item.url))throw Error('La evidencia necesita un enlace https verificable.');
    p.evidence.push({type:item.type,url:String(item.url).slice(0,500),note:String(item.note||'').slice(0,300),price:Number.isFinite(Number(item.price))&&item.price!==''&&item.price!=null?Number(item.price):null,country:item.country||s.market.country,observedAt:item.observedAt||today,claimScope:item.claimScope||'product'});
    if(p.status==='idea')p.status='research';return s}
  // Unit economics. Returns nulls (with reasons) instead of guessing whenever a cost is unknown.
  function economics(e){const out={grossMarginEUR:null,grossMarginPct:null,breakEvenCPA:null,ordersPerDayForTarget:null,missing:[]};if(!e||typeof e!=='object'){out.missing.push('sin datos económicos');return out}
    const n=k=>Number.isFinite(Number(e[k]))&&e[k]!==''&&e[k]!=null?Number(e[k]):null;const price=n('price'),cogs=n('cogs'),ship=n('shipping'),fees=n('feesPct'),refund=n('refundPct'),vat=n('vatPct');
    for(const [k,v] of [['precio de venta',price],['coste del producto',cogs],['envío',ship],['comisiones de pago %',fees],['devoluciones %',refund],['IVA %',vat]])if(v===null)out.missing.push(k);
    if(price&&price>0)out.ordersPerDayForTarget=Math.ceil(TARGET_EUR/30/price*10)/10;
    if(out.missing.length)return out;const net=price/(1+vat/100),gm=net-cogs-ship-price*fees/100-net*refund/100;
    out.grossMarginEUR=Math.round(gm*100)/100;out.grossMarginPct=Math.round(gm/net*1000)/10;out.breakEvenCPA=gm>0?out.grossMarginEUR:0;return out}
  // Ordered research gaps for one product, following docs/klimb-validation.md §1 and §5.
  function gaps(p){const g=[];const terms=(SEARCH_TERMS[p.id]||[p.name.toLowerCase()]).map(t=>'«'+t+'»').join(', ');
    if(evidenceOf(p,'search_intent').length<1)g.push({id:'search_intent',title:'Busca señales de demanda en España de '+p.name,how:'Google Trends (España, 12 meses) y búsquedas '+terms+'. Guarda el enlace y una nota con la fecha.',minutes:20,done:'1 evidencia de demanda con enlace'});
    const comp=evidenceOf(p,'competitor_listing');if(comp.length<3)g.push({id:'competitor_listing',title:'Registra '+(3-comp.length)+' competidor'+(3-comp.length>1?'es':'')+' con precio real de '+p.name,how:'Amazon.es y tiendas españolas: enlace, precio observado y qué ofrecen distinto.',minutes:25,done:'3 competidores con precio y enlace'});
    if(evidenceOf(p,'ad_library').length<3&&!p.noAdsFound)g.push({id:'ad_library',title:'Revisa anuncios activos de '+p.name+' en Meta Ad Library (España)',how:'facebook.com/ads/library · España · todos los anuncios · '+terms+'. Guarda anunciante, gancho, oferta y fecha de inicio. Que haya anuncios indica competencia, no rentabilidad.',minutes:30,done:'3 anuncios registrados o «no hay anuncios» marcado'});
    const sup=(p.suppliers||[]).filter(s=>validUrl(s.url));if(sup.length<2)g.push({id:'supplier_listing',title:'Encuentra '+(2-sup.length)+' proveedor'+(2-sup.length>1?'es':'')+' con almacén en la UE para '+p.name,how:'CJdropshipping (filtra almacén UE) o BigBuy. Anota URL del SKU, almacén de salida, coste, plazo y devoluciones. Sin stock y sin pagar nada.',minutes:30,done:'2 proveedores con SKU y almacén de salida'});
    else if(!sup.some(s=>s.euWarehouse))g.push({id:'eu_warehouse',title:'Confirma que '+p.name+' sale de un almacén de la UE',how:'Comprueba el almacén de salida del SKU exacto; si solo sale de China, márcalo como riesgo.',minutes:15,done:'Almacén UE confirmado o riesgo anotado'});
    const eco=economics(p.economics);if(eco.missing.length)g.push({id:'economics',title:'Completa la economía unitaria de '+p.name,how:'Faltan: '+eco.missing.join(', ')+'. Usa precios reales de proveedor y competencia.',minutes:20,done:'Margen calculado sin datos inventados'});
    if(!p.offer)g.push({id:'offer',title:'Escribe la hipótesis de oferta de '+p.name,how:'Cliente, problema, diferencia frente a la competencia, precio y 3 ganchos de anuncio honestos.',minutes:30,done:'Hipótesis de oferta guardada'});
    if(!p.landing)g.push({id:'landing',title:'Prepara la landing de lista de espera de '+p.name,how:'Landing transparente «Próximamente · Únete a la lista de espera», sin fingir stock ni checkout, con aviso de privacidad y medición probada.',minutes:90,done:'Landing lista con eventos de medición probados'});
    return g}
  const STAGE_RANK={rejected:-1,idea:0,research:1,inconclusive:1,supplier_screened:2,landing_ready:3,organic_signal:4,paid_test_approved:5,validated:6};
  function activeProducts(s){return s.products.filter(p=>p.status!=='rejected')}
  function focusProducts(s){const active=activeProducts(s);const focus=active.filter(p=>p.focus).sort((a,b)=>(STAGE_RANK[b.status]-STAGE_RANK[a.status])||a.focus-b.focus);return focus.length?focus:active.slice(0,5)}
  // One precise next action. Business blockers decide, the date never forces skipping a gate.
  function nextAction(state,today){const s=normalize(state),left=daysLeft(today),day=dayNumber(today);const base={phase:'validación',route:'proyectos',day,daysLeft:left};
    if(!s.merchant.paymentRoute&&left-PAYMENT_LEAD_DAYS<=7)return {...base,id:'payment_route',actionType:'decision',priority:0,title:'Decide cómo vas a cobrar las ventas',why:'Shopify Payments, Stripe y PayPal no cobran ventas a residentes en Ucrania y algunas vías tardan 4–6 semanas. Quedan '+left+' días hasta el 31-dic.',estimateMinutes:20,blockingEvidence:['vía de cobro'],doneCriteria:'Vía elegida (intermediario, sociedad UE/EE. UU. u otra) y registrada en la app',how:'Lee docs/klimb-fulfillment.md §1 y díctale tu decisión a ChatGPT. No abras cuentas ni pagues nada sin decidirlo antes.'};
    const ready=s.products.filter(p=>p.status==='landing_ready'||p.status==='organic_signal');
    if(ready.length&&!s.experiments.some(e=>ready.some(p=>p.id===e.productId)))return {...base,id:'smoke_test',actionType:'experiment',priority:1,title:'Lanza la prueba orgánica de '+ready[0].name,why:'La landing está lista; ahora toca medir interés real sin gastar.',estimateMinutes:60,blockingEvidence:[],doneCriteria:'Experimento registrado con fuente de tráfico, fecha y visitantes',how:'Comparte la landing en canales propios sin spam. Los anuncios de pago necesitan tu aprobación explícita con presupuesto y fecha de corte.'};
    for(const p of focusProducts(s)){const g=gaps(p)[0];if(g)return {...base,id:p.id+':'+g.id,productId:p.id,actionType:'research',priority:2,title:g.title,why:p.name+' es uno de los 5 candidatos prioritarios y le falta este dato para decidir con evidencia.',estimateMinutes:g.minutes,blockingEvidence:[g.id],doneCriteria:g.done,how:g.how}}
    return {...base,id:'review',actionType:'decision',priority:3,title:'Compara los finalistas y elige 1–2 para la prueba',why:'Los candidatos prioritarios tienen la investigación mínima completa.',estimateMinutes:30,blockingEvidence:[],doneCriteria:'1–2 productos en landing_ready y el resto descartado o en espera',how:'Compara margen, evidencia de demanda, competencia y almacén UE.'}}
  function summary(state,today){const s=normalize(state),count=k=>s.products.filter(p=>p.status===k).length;
    return {day:dayNumber(today),daysLeft:daysLeft(today),target:TARGET_EUR,market:s.market,researched:s.products.filter(p=>p.evidence.length).length,total:s.products.length,rejected:count('rejected'),validated:count('validated'),evidence:s.products.reduce((n,p)=>n+p.evidence.length,0),paymentRoute:s.merchant.paymentRoute}}
  function setStatus(state,productId,status,reason){const s=normalize(state),p=s.products.find(x=>x.id===productId);if(!p)throw Error('Producto no encontrado.');if(!STATUSES.includes(status))throw Error('Estado no válido.');
    if(status==='rejected'&&!String(reason||'').trim())throw Error('Indica el motivo del descarte.');p.status=status;if(reason)p.notes=String(reason).slice(0,300);return s}
  const api={TARGET_DAY,TARGET_EUR,STATUSES,EVIDENCE_TYPES,seed,normalize,dayNumber,daysLeft,evidenceOf,addEvidence,economics,gaps,focusProducts,nextAction,summary,setStatus};
  root.SebasKlimb=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
