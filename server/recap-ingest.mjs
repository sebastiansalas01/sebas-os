// Accept a normalized snapshot on stdin. Emits a bounded, injection-safe SQL upsert.
// Native DB writes remain subject to owner consent for the destination.
import '../recap-core.js';
import {pathToFileURL} from 'node:url';
export function ingestSql(raw){const snapshot=globalThis.SebasRecap.snapshot(raw),encoded=Buffer.from(JSON.stringify(snapshot)).toString('base64');return `insert into public.sebas_os_snapshots(day,payload,updated_at) values ('${snapshot.day}',convert_from(decode('${encoded}','base64'),'UTF8')::jsonb,'${snapshot.generatedAt}') on conflict(day) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=sebas_os_snapshots.updated_at returning day,jsonb_array_length(payload->'sessions') as calls;`}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){let body='';for await(const chunk of process.stdin){body+=chunk;if(Buffer.byteLength(body)>250000)throw Error('Snapshot demasiado grande.')}console.log(ingestSql(JSON.parse(body)))}
