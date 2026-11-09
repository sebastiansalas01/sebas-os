import {createServer} from 'node:http';
import {timingSafeEqual,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {FileStore,ResearchEngine,daytime} from './engine.mjs';
export function authorized(header,key){const digest=x=>createHash('sha256').update(String(x)).digest();return key?.length>=32&&timingSafeEqual(digest(header||''),digest('Bearer '+key))}
export function createApi({engine,accessKey,origin,pushPublicKey=''}){
 return createServer(async(req,res)=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(req.headers.origin===origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS'});
  const send=(status,value)=>{res.writeHead(status,headers);res.end(JSON.stringify(value))};
  if(req.headers.origin&&req.headers.origin!==origin)return send(403,{error:'Origen no autorizado.'});
  if(req.method==='OPTIONS'){res.writeHead(204,headers);return res.end()}
  if(!authorized(req.headers.authorization,accessKey))return send(401,{error:'Autorización requerida.'});
  try{
   if(req.url==='/api/today'&&req.method==='GET')return send(200,engine.today());
   if(req.url==='/api/push/key'&&req.method==='GET')return send(200,{publicKey:pushPublicKey||null});
   if(req.url==='/api/sync'&&req.method==='POST'){if(Date.now()<engine.nextPoll)return send(200,engine.today());return send(200,await engine.sync())}
   if(req.url==='/api/push/subscriptions'&&['POST','DELETE'].includes(req.method)){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)return send(413,{error:'Solicitud demasiado grande.'})}let value;try{value=JSON.parse(raw)}catch{return send(400,{error:'JSON no válido.'})}try{if(req.method==='DELETE'){if(typeof value.endpoint!=='string')return send(400,{error:'Falta identificar la suscripción.'});await engine.unsubscribe(value.endpoint)}else await engine.subscribe(value)}catch{return send(400,{error:'Suscripción no válida.'})}return send(201,{ok:true})}
   return send(404,{error:'Ruta no disponible.'});
  }catch{return send(503,{error:'No se pudo sincronizar el servicio privado. Revisa su configuración.'})}
 });
}
async function main(){const env=process.env;const key=env.SEBAS_ACCESS_KEY||'';if(key.length<32||key.startsWith('replace-with-'))throw Error('SEBAS_ACCESS_KEY debe tener al menos 32 caracteres aleatorios.');const origin=env.APP_ORIGIN||'https://sebastiansalas01.github.io';if(new URL(origin).origin!==origin)throw Error('APP_ORIGIN debe ser un origen válido sin ruta.');let push=null;const publicKey=env.VAPID_PUBLIC_KEY||'';if(publicKey&&env.VAPID_PRIVATE_KEY&&env.VAPID_SUBJECT){const {default:webpush}=await import('web-push');webpush.setVapidDetails(env.VAPID_SUBJECT,publicKey,env.VAPID_PRIVATE_KEY);push=(subscription,message)=>webpush.sendNotification(subscription,JSON.stringify(message),{TTL:1800})}
 const config={googleClientId:env.GOOGLE_CLIENT_ID,googleClientSecret:env.GOOGLE_CLIENT_SECRET,googleRefreshToken:env.GOOGLE_REFRESH_TOKEN,calendarIds:(env.GOOGLE_CALENDAR_IDS||'').split(',').map(s=>s.trim()).filter(Boolean),ownerEmail:env.OWNER_EMAIL||'',ownerName:env.OWNER_NAME||'',slackUserToken:env.SLACK_USER_TOKEN,slackChannel:env.SLACK_CHANNEL,slackTimeZone:env.SLACK_TIME_ZONE||'Europe/Madrid',dayStart:env.DAY_START||'06:00',dayEnd:env.DAY_END||'21:00'};
 const engine=await new ResearchEngine({config,store:new FileStore(env.STATE_PATH||'/var/lib/sebas-os/state.json'),push}).init();const server=createApi({engine,accessKey:key,origin,pushPublicKey:push?publicKey:''});server.listen(Number(env.PORT)||8787,'0.0.0.0',()=>console.log('SEBAS OS private service listening.'));
 const poll=()=>{if(daytime(Date.now(),config.dayStart,config.dayEnd)&&Date.now()>=engine.nextPoll)engine.sync().catch(()=>console.error('Private synchronization failed; last data retained.'))};poll();const interval=setInterval(poll,60000);for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(interval);server.close()});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Unable to start SEBAS OS private service. Verify environment variables, storage and dependencies.');process.exitCode=1});
