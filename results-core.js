(function(root){
function dayOffset(d,n){return new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)}
function weekStart(d){const w=new Date(d+'T12:00:00Z').getUTCDay();return dayOffset(d,-((w+6)%7))}
function weekly(sessions,day){const start=weekStart(day),end=dayOffset(start,7),rows=sessions.filter(s=>s.date>=start&&s.date<end);return {start,end,classes:rows.filter(s=>s.type==='english-class').length,roleplays:rows.filter(s=>s.type==='roleplay').length,videos:rows.filter(s=>s.type==='sales-video').length,rows}}
function session(v,today){const minutes=Number(v.minutes);if(!['english-class','roleplay','sales-video'].includes(v.type)||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!Number.isFinite(Date.parse(v.date+'T12:00Z'))||dayOffset(v.date,0)!==v.date||v.date>today||!Number.isFinite(minutes)||minutes<1||minutes>360)throw Error('Revisa fecha y minutos realizados.');return {id:v.id,type:v.type,date:v.date,minutes,note:String(v.note||'').trim().slice(0,500)}}
function goalPrompt(active,seconds,goal,ack){if(!active||seconds<goal*60)return false;return seconds>=(ack?.nextAt??goal*60)}
root.SebasResults={weekStart,weekly,session,goalPrompt};if(typeof module!=='undefined')module.exports=root.SebasResults;
})(globalThis);
