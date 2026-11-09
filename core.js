/* Shared pure logic: browser and Node tests. No credentials or network state. */
(function(root) {
  const ZONE = 'Europe/Kyiv';
  function day(ts = Date.now()) {
    const parts = new Intl.DateTimeFormat('en', {timeZone: ZONE, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ts));
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function shiftDay(key, delta) { return new Date(Date.parse(key+'T12:00:00Z')+delta*86400000).toISOString().slice(0,10); }
  function weekday(ts = Date.now()) { return new Date(day(ts)+'T12:00:00Z').getUTCDay(); }
  function boundary(ts) {
    let lo = ts, hi = ts + 27*3600000, key = day(ts);
    while (hi-lo > 1) { const mid = Math.floor((hi+lo)/2); if(day(mid) === key) lo=mid; else hi=mid; }
    return hi;
  }
  function elapsed(active, now = Date.now()) { return active ? Math.max(0, Math.min(now, boundary(active.start))-active.start)/1000 : 0; }
  function seconds(records, active, id, now=Date.now()) { return (records[day(now)]?.[id]?.seconds || 0) + (active?.id===id && day(active.start)===day(now) ? elapsed(active,now):0); }
  function settle(records, active, now=Date.now()) {
    if(!active) return;
    const key=day(active.start); records[key] ??= {};
    const rec=records[key][active.id] ??= {seconds:0,done:false};
    rec.seconds += elapsed(active, now);
  }
  function recentKeys(now=Date.now(), count=7) { return Array.from({length:count},(_,i)=>shiftDay(day(now),-i)); }
  function selected(calendar, ids) {
    if(Array.isArray(ids)) return ids.includes(calendar.id);
    const label=calendar.id+' '+calendar.summary;
    return !/b360\s*agencia|just[.\s]*sales/i.test(label) && (calendar.primary === true || /impulso/i.test(label));
  }
  function eventKey(e) { return e.calendarId+'|'+e.id; }
  function changes(before, after) {
    const old=new Map(before.map(e=>[eventKey(e),e])), next=new Map(after.map(e=>[eventKey(e),e]));
    return {added:after.filter(e=>!old.has(eventKey(e))).length, removed:before.filter(e=>!next.has(eventKey(e))).length, changed:after.filter(e=>old.has(eventKey(e)) && ['start','end','name','updated'].some(k=>old.get(eventKey(e))[k]!==e[k])).length};
  }
  const api={day,shiftDay,weekday,boundary,elapsed,seconds,settle,recentKeys,selected,eventKey,changes};
  if(typeof module!=='undefined') module.exports=api;
  root.SebasCore=api;
})(globalThis);
