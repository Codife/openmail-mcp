begin;

create table public.send_operations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email_account_id uuid not null references public.email_accounts(id) on delete cascade,
  mcp_client_id uuid references public.mcp_clients(id) on delete set null,
  idempotency_key text not null,
  status text not null check(status in ('pending','succeeded','failed')),
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(email_account_id,idempotency_key)
);
create index send_operations_limit_idx on public.send_operations(workspace_id,email_account_id,created_at desc) where status in ('pending','succeeded');
alter table public.send_operations enable row level security;
create policy send_operations_read on public.send_operations for select to authenticated using((select private.is_workspace_member(workspace_id)));
grant select on public.send_operations to authenticated;

create function public.begin_send(target_workspace uuid,target_account uuid,target_client uuid,target_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.send_operations; account_limit int; workspace_limit int; account_count int; workspace_count int; disabled boolean;
begin
  if char_length(target_key) < 16 or char_length(target_key) > 200 then raise exception 'Invalid idempotency key'; end if;
  select * into existing from public.send_operations where email_account_id=target_account and idempotency_key=target_key for update;
  if found then
    if existing.status='succeeded' then return jsonb_build_object('state','completed','operationId',existing.id,'result',existing.result); end if;
    return jsonb_build_object('state','in_progress','operationId',existing.id);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace::text,0));
  select coalesce(s.hourly_send_limit,50) into account_limit from public.email_accounts a left join public.email_account_settings s on s.email_account_id=a.id where a.id=target_account and a.workspace_id=target_workspace and a.status='active' for update of a;
  if account_limit is null then raise exception 'Active mailbox not found'; end if;
  select coalesce(ws.hourly_send_limit,200),coalesce(ws.emergency_send_disabled,false) into workspace_limit,disabled from public.workspace_settings ws where ws.workspace_id=target_workspace for update;
  if disabled then raise exception 'Sending is disabled for this workspace'; end if;
  select count(*) into account_count from public.send_operations where email_account_id=target_account and status in ('pending','succeeded') and created_at>=now()-interval '1 hour';
  select count(*) into workspace_count from public.send_operations where workspace_id=target_workspace and status in ('pending','succeeded') and created_at>=now()-interval '1 hour';
  if account_count>=account_limit then raise exception 'Mailbox hourly send limit exceeded'; end if;
  if workspace_count>=workspace_limit then raise exception 'Workspace hourly send limit exceeded'; end if;
  insert into public.send_operations(workspace_id,email_account_id,mcp_client_id,idempotency_key,status) values(target_workspace,target_account,target_client,target_key,'pending') returning * into existing;
  return jsonb_build_object('state','new','operationId',existing.id);
end $$;
create function public.finish_send(operation_id uuid,operation_result jsonb,operation_error text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.send_operations set status=case when operation_error is null then 'succeeded' else 'failed' end,result=operation_result,error_code=operation_error,completed_at=now() where id=operation_id and status='pending';
end $$;
revoke all on function public.begin_send(uuid,uuid,uuid,text),public.finish_send(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.begin_send(uuid,uuid,uuid,text),public.finish_send(uuid,jsonb,text) to service_role;
commit;
