begin;
create function public.bootstrap_administrator(owner_id uuid,owner_name text,workspace_name text,workspace_slug text) returns uuid language plpgsql security definer set search_path='' as $$
declare workspace_id uuid;
begin
  perform pg_advisory_xact_lock(718204619);
  if exists(select 1 from public.system_settings where key='bootstrap') then raise exception 'Bootstrap is already complete'; end if;
  insert into public.profiles(id,display_name) values(owner_id,left(owner_name,200)) on conflict(id) do update set display_name=excluded.display_name;
  insert into public.workspaces(name,slug,created_by) values(workspace_name,workspace_slug,owner_id) returning id into workspace_id;
  insert into public.workspace_members(workspace_id,user_id,role) values(workspace_id,owner_id,'owner');
  insert into public.workspace_settings(workspace_id,registration_enabled) values(workspace_id,false);
  insert into public.system_settings(key,value) values('bootstrap',jsonb_build_object('completedAt',now(),'ownerId',owner_id,'workspaceId',workspace_id));
  return workspace_id;
end $$;
revoke all on function public.bootstrap_administrator(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.bootstrap_administrator(uuid,text,text,text) to service_role;
create table public.mcp_rate_windows(mcp_client_id uuid not null references public.mcp_clients(id) on delete cascade,window_started_at timestamptz not null,request_count int not null default 0,primary key(mcp_client_id,window_started_at));
alter table public.mcp_rate_windows enable row level security;
create function public.consume_mcp_rate_limit(target_client uuid,request_limit int) returns boolean language plpgsql security definer set search_path='' as $$
declare bucket timestamptz:=date_trunc('minute',now());consumed int;
begin
  insert into public.mcp_rate_windows(mcp_client_id,window_started_at,request_count) values(target_client,bucket,1) on conflict(mcp_client_id,window_started_at) do update set request_count=public.mcp_rate_windows.request_count+1 returning request_count into consumed;
  return consumed<=least(greatest(request_limit,1),10000);
end $$;
revoke all on function public.consume_mcp_rate_limit(uuid,int) from public,anon,authenticated;
grant execute on function public.consume_mcp_rate_limit(uuid,int) to service_role;
commit;
