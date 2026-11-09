import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../core.js');
const normalize=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
export function sessionExcerpt(text,identity){const raw=String(text||''),index=normalize(raw).indexOf(normalize(identity));if(index<0)return raw.slice(0,4500);const times=[...raw.matchAll(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)];const before=times.filter(m=>m.index<=index).at(-1),after=times.find(m=>m.index>index);return raw.slice(Math.max(0,(before?.index??index)-140),after?.index??Math.min(raw.length,index+4000))}
export function confirmationEvidence(event,message,identity,timeZone='Europe/Madrid'){
 const context=sessionExcerpt(message.text,identity),text=normalize(context),full=normalize(message.text),sessionDay=C.day(Date.parse(event.start)),postedAt=Number(message.ts)*1000;
 const previous=new Date(Date.parse(sessionDay+'T12:00:00Z')-86400000).toISOString().slice(0,10);const nextDayExplicit=/ma[nñ]ana/i.test(message.text||'')||String(message.text).includes(sessionDay)||String(message.text).includes(sessionDay.slice(8,10)+'/'+sessionDay.slice(5,7));const sourceToday=Number.isFinite(postedAt)&&(C.day(postedAt)===sessionDay||(C.day(postedAt)===previous&&nextDayExplicit));
 let expected='';try{expected=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(event.start))}catch{return {confirmed:false,reason:'Zona horaria del recap no válida.'}}
 const times=[...context.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].map(m=>m[1].padStart(2,'0')+':'+m[2]);
 const identityIndex=normalize(context).indexOf(normalize(identity)),preceding=[...context.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].filter(m=>m.index<=identityIndex).at(-1),actual=preceding?preceding[1].padStart(2,'0')+':'+preceding[2]:'';
 const timeMatch=actual===expected,negative=/sin confirmar|pendiente de confirmar|no (?:esta )?confirmad|cancelad[oa]|no asist/.test(text);
 const verbal=/\bconfirmad[oa]\b/.test(text),check=/✅|:white_check_mark:|:heavy_check_mark:/.test(context),groupConfirmed=/contamos con|sesiones confirmadas|citas confirmadas/.test(full);
 const marked=verbal||(check&&groupConfirmed),confirmed=sourceToday&&timeMatch&&marked&&!negative;
 return {confirmed,reason:negative?'El recap indica cancelación o falta de confirmación.':!sourceToday?'El recap no corresponde al día de la sesión.':!timeMatch?'La hora del recap no coincide con Google Calendar.':!marked?'No hay una confirmación explícita en el recap.':'Coinciden identidad, fecha, hora y confirmación del recap.',expectedSlackTime:expected,sourceDay:sourceToday?sessionDay:null,sourceTimestamp:message.ts||null};
}
export function qualifyLead(raw){const text=normalize(raw);const reasons=[];
 if(/sin presupuesto|no (?:puede|puedo|dispone de dinero para) invertir|no (?:tiene|tengo) oferta|todavia no tiene (?:producto|servicio)/.test(text))return {stars:1,reasons:['El mensaje declara una limitación de presupuesto u oferta.'],basis:'Slack · valoración comercial orientativa'};
 const active=/\b(vendo|vendemos|vende|ya tiene clientes|tengo clientes|clientes de pago|facturando|negocio en marcha)\b/.test(text);
 const need=/objetivo\s*:|necesita (?:captar|vender|automatizar|escalar)|quiere (?:captar|vender|automatizar|escalar)|busca (?:captar|vender|automatizar|escalar)|le cuesta (?:captar|vender)/.test(text);
 const budget=/presupuesto (?:disponible|para invertir)|presupuesto\s*:\s*[\d€$]|pued[eo] invertir|inversion disponible|capacidad de inversion/.test(text);
 if(active)reasons.push('Oferta o clientes activos mencionados.');if(need)reasons.push('Objetivo o necesidad comercial explícita.');if(budget)reasons.push('Capacidad o presupuesto para invertir mencionado.');
 return {stars:reasons.length===3?3:reasons.length?2:null,reasons:reasons.length?reasons:['No hay información suficiente para valorar el encaje.'],basis:'Slack · valoración comercial orientativa'};
}
