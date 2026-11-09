const {test}=require('node:test'),assert=require('node:assert/strict');
async function modules(){return { ...await import('../server/engine.mjs'), ...await import('../server/index.mjs')}}
const time=Date.parse('2026-11-09T12:00:00+02:00');
const event=(id,start='2026-11-09T19:00:00+02:00')=>({id,calendarId:'primary',name:'Sesión · Cliente de Prueba',start,end:'2026-11-09T20:30:00+02:00',updated:'1',attendees:[{email:'test@example.com'}]});
async function engine(options={}){const {ResearchEngine}=await modules();let saved={};const e=await new ResearchEngine({config:{ownerEmail:'owner@example.com',slackChannel:'test',slackUserToken:'mock',dayStart:'06:30',dayEnd:'21:00'},store:{async load(){return {}},async save(s){saved=structuredClone(s)}},clock:()=>time,...options}).init();return e}
test('backend only alerts for new, future events of the same Kyiv day',async()=>{
 const {newTodayEvents,daytime}=await modules();const list=[event('old'),event('new'),event('tomorrow','2026-11-10T19:00:00+02:00'),event('past','2026-11-09T08:00:00+02:00')];
 assert.deepEqual(newTodayEvents([event('old')],list,time).map(e=>e.id),['new']);
 assert.equal(daytime(Date.parse('2026-11-09T22:30:00+02:00')),false);
 assert.equal(daytime(time),true);
});
test('Slack lookup uses bounded exact identity, channel scope and verified Instagram URLs',async()=>{
 const {instagramFrom,leadIdentity}=await modules();assert.equal(instagramFrom('Instagram: @demo.coach'),'https://www.instagram.com/demo.coach/');assert.equal(instagramFrom('https://instagram.com/reel/fake'),'');
 assert.equal(leadIdentity(event('x'),'owner@example.com').kind,'email');
 const e=await engine({fetcher:async url=>{const q=new URL(url).searchParams.get('query');assert.equal(q,'in:test "test@example.com"');return {ok:true,json:async()=>({ok:true,messages:{matches:[{text:'test@example.com\nInstagram: @demo.coach\nObjetivo: consulta de prueba.',permalink:'https://example.slack.com/archives/C1/p123'}]}})}}});
 const card=await e.research(event('x'));assert.equal(card.matched,true);assert.equal(card.instagram,'https://www.instagram.com/demo.coach/');assert.match(card.summary,/Objetivo/);
});
test('no baseline alert, transient push failures retry without duplicate successful deliveries',async()=>{
 let attempts=0;const e=await engine({push:async()=>{if(++attempts===1)throw Error('temporary')}});let events=[event('old')];e.calendar=async()=>structuredClone(events);e.research=async x=>({eventKey:'primary|'+x.id,matched:false});e.state.subscriptions=[{endpoint:'https://web.push.apple.com/test'}];
 await e.sync();assert.equal(attempts,0);events.push(event('new'));await e.sync();assert.equal(attempts,1);assert.equal(e.state.outbox.length,1);await e.sync();assert.equal(attempts,2);assert.equal(e.state.outbox.length,0);await e.sync();assert.equal(attempts,2);
});
test('provider failure preserves last successful snapshot and does not report success',async()=>{
 const e=await engine();e.calendar=async()=>[event('old')];e.research=async()=>({matched:false});await e.sync();e.calendar=async()=>{throw Error('Google unavailable')};await assert.rejects(e.sync(),/Google unavailable/);assert.equal(e.today().events.length,1);assert.match(e.today().status,/unavailable/);
});
test('quiet hours suppress all provider calls and notifications',async()=>{
 const e=await engine({clock:()=>Date.parse('2026-11-09T23:00:00+02:00')});e.calendar=async()=>{throw Error('must not run')};await e.sync();assert.match(e.status,/Fuera/);
});
test('push subscription rejects SSRF and invalid key material',async()=>{
 const {validateSubscription}=await modules();const sub={endpoint:'https://web.push.apple.com/test',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}};assert.equal(validateSubscription(sub),true);assert.equal(validateSubscription({...sub,endpoint:'https://127.0.0.1/'}),false);assert.equal(validateSubscription({...sub,endpoint:'https://web.push.apple.com.evil.example/'}),false);assert.equal(validateSubscription({...sub,keys:{}}),false);
});
test('API requires a strong bearer token and denies foreign origins',async()=>{
 const {createApi,authorized}=await modules();assert.equal(authorized('Bearer short','short'),false);const key='test-only-'+ 'a'.repeat(40);const api=createApi({engine:{today:()=>({events:[],cards:[]})},accessKey:key,origin:'https://allowed.example'});await new Promise(r=>api.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+api.address().port+'/api/today';try{assert.equal((await fetch(url)).status,401);assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+key,Origin:'https://evil.example'}})).status,403);const r=await fetch(url,{headers:{Authorization:'Bearer '+key,Origin:'https://allowed.example'}});assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('access-control-allow-origin'),'https://allowed.example')}finally{await new Promise(r=>api.close(r))}
});
test('calendar primary aliases are canonicalized to prevent frontend duplicates',async()=>{
 const e=await engine({config:{ownerEmail:'owner@example.com',calendarIds:['primary'],googleClientId:'test',googleClientSecret:'test',googleRefreshToken:'test'},fetcher:async url=>({ok:true,json:async()=>url.includes('oauth2')?{access_token:'mock',expires_in:3600}:url.endsWith('/primary')?{id:'owner@example.com'}:{items:[{id:'event',summary:'Test',start:{dateTime:'2026-11-09T19:00:00+02:00'},end:{dateTime:'2026-11-09T20:30:00+02:00'}}]}})});const events=await e.calendar();assert.equal(events[0].calendarId,'owner@example.com');
});
test('research falls back from absent email to the full attendee name, never a first name alone',async()=>{
 let calls=0;const e=await engine({fetcher:async url=>({ok:true,json:async()=>{calls++;return {ok:true,messages:{matches:new URL(url).searchParams.get('query').includes('test@example.com')?[]:[{text:'Cliente de Prueba · Objetivo: ejemplo',permalink:'https://example.slack.com/archives/C/p1'}]}}}})});const item=event('x');item.attendees[0].displayName='Cliente de Prueba';assert.equal((await e.research(item)).matchType,'name');assert.equal(calls,2);
});
test('private snapshots serialize concurrent writes with owner-only file permissions',async()=>{
 const {FileStore}=await modules();const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sebas-test-'));const file=path.join(dir,'private','state.json');try{const store=new FileStore(file);await Promise.all([store.save({sequence:1}),store.save({sequence:2}),store.save({sequence:3})]);assert.equal((await store.load()).sequence,3);assert.equal((await fs.stat(file)).mode&0o777,0o600);assert.equal((await fs.stat(path.dirname(file))).mode&0o777,0o700)}finally{await fs.rm(dir,{recursive:true,force:true})}
});
