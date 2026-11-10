create table public.sebas_os_snapshots (
 day date primary key,
 payload jsonb not null check (jsonb_typeof(payload)='object' and payload->>'version'='1' and jsonb_typeof(payload->'sessions')='array' and jsonb_array_length(payload->'sessions')<=30 and octet_length(payload::text)<=250000),
 updated_at timestamptz not null default now(),
 check ((payload->>'day')::date=day)
);
create table public.sebas_os_devices (
 id uuid primary key,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table public.sebas_os_pairings (
 code_hash text primary key check(code_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
alter table public.sebas_os_snapshots enable row level security;
alter table public.sebas_os_devices enable row level security;
alter table public.sebas_os_pairings enable row level security;
revoke all on public.sebas_os_snapshots,public.sebas_os_devices,public.sebas_os_pairings from public,anon,authenticated;
grant select,insert,update,delete on public.sebas_os_snapshots,public.sebas_os_devices,public.sebas_os_pairings to service_role;
create function public.sebas_os_claim(p_code_hash text,p_token_hash text,p_device_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 delete from public.sebas_os_pairings where code_hash=p_code_hash and expires_at>now();
 if not found then return false; end if;
 insert into public.sebas_os_devices(id,token_hash,expires_at) values(p_device_id,p_token_hash,now()+interval '90 days');
 return true;
end;
$$;
revoke all on function public.sebas_os_claim(text,text,uuid) from public,anon,authenticated;
grant execute on function public.sebas_os_claim(text,text,uuid) to service_role;
