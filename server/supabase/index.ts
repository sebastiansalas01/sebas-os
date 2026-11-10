import './recap-core.js';
const R=(globalThis as any).SebasRecap;
const origin='https://sebastiansalas01.github.io';
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const secret=()=>{try{return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}catch{return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}};
async function db(path:string,options:RequestInit={}){const key=secret();if(!key)throw Error('Service unavailable');const headers:Record<string,string>={apikey:key,'Content-Type':'application/json',...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{})};const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Service unavailable');return r.status===204?null:r.json()}
Deno.serve(async(req:Request)=>{
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 const requestOrigin=req.headers.get('Origin');if(requestOrigin===origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS'});
 const send=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(requestOrigin&&requestOrigin!==origin)return send(403,{error:'Origen no autorizado.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const url=new URL(req.url);
 try{
  if(url.pathname.endsWith('/pair')&&req.method==='POST'){
   if(Number(req.headers.get('content-length'))>2048)return send(413,{error:'Solicitud demasiado grande.'});
   const raw=await req.text();if(raw.length>2048)return send(413,{error:'Solicitud demasiado grande.'});let body;try{body=JSON.parse(raw)}catch{return send(400,{error:'Código no válido.'})}
   const code=String(body.code||'').replace(/[-\s]/g,'').toUpperCase();if(!/^[A-F0-9]{24}$/.test(code))return send(400,{error:'Revisa el código de conexión.'});
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
   const ok=await db('rpc/sebas_os_claim',{method:'POST',body:JSON.stringify({p_code_hash:await hash(code),p_token_hash:await hash(token),p_device_id:crypto.randomUUID()})});
   if(ok!==true)return send(401,{error:'El código ha caducado o ya se ha utilizado.'});
   return send(200,{token,expiresInDays:90});
  }
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))return send(401,{error:'Conecta este dispositivo a tu agenda privada.'});
  const rows=await db('sebas_os_devices?token_hash=eq.'+await hash(token)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=id&limit=1');if(!rows?.length)return send(401,{error:'La conexión ha caducado. Vuelve a vincular el dispositivo.'});
  if(req.method==='DELETE'){await db('sebas_os_devices?id=eq.'+rows[0].id,{method:'DELETE'});return send(200,{ok:true})}
  if(req.method!=='GET')return send(405,{error:'Método no disponible.'});
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),end=new Date(Date.parse(day+'T12:00:00Z')+7*86400000).toISOString().slice(0,10);
  const snapshots=await db('sebas_os_snapshots?and='+encodeURIComponent('(day.gte.'+day+',day.lte.'+end+')')+'&select=payload,updated_at&order=day.asc');
  return send(200,{snapshots:snapshots.map((x:any)=>R.snapshot(x.payload)),checkedAt:new Date().toISOString()});
 }catch{return send(503,{error:'No se pudo consultar la agenda privada. Inténtalo más tarde.'})}
});
