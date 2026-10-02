-- BTD dataset snapshots. Does not read/migrate existing user data.
create table if not exists public.btd_dataset_snapshots (
 user_id uuid not null references auth.users(id) on delete cascade,
 dataset text not null check (dataset in ('sergeant','medic','notes','echo','chat')),
 payload jsonb not null check (octet_length(payload::text) <= 2000000),
 revision bigint not null default 1 check(revision > 0),
 updated_at timestamptz not null default now(),
 primary key(user_id,dataset)
);
alter table public.btd_dataset_snapshots enable row level security;
create policy btd_snapshot_select on public.btd_dataset_snapshots for select to authenticated using (auth.uid()=user_id);
create policy btd_snapshot_insert on public.btd_dataset_snapshots for insert to authenticated with check (auth.uid()=user_id);
create policy btd_snapshot_update on public.btd_dataset_snapshots for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy btd_snapshot_delete on public.btd_dataset_snapshots for delete to authenticated using (auth.uid()=user_id);
revoke all on public.btd_dataset_snapshots from anon;
grant select,insert,update,delete on public.btd_dataset_snapshots to authenticated;
create or replace function public.btd_save_snapshot(p_dataset text,p_payload jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare uid uuid:=auth.uid(); n bigint;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_dataset is null or p_payload is null or p_expected_revision is null or p_dataset not in ('sergeant','medic','notes','echo','chat') or p_expected_revision<0 or octet_length(p_payload::text)>2000000 then raise exception 'Invalid snapshot'; end if;
 -- Serializes per account/dataset, including first insert. Optimistic revision
 -- rejects stale writers without silently replacing another device's data.
 perform pg_advisory_xact_lock(hashtextextended(uid::text||':'||p_dataset,0));
 select revision into n from public.btd_dataset_snapshots where user_id=uid and dataset=p_dataset for update;
 if coalesce(n,0)<>p_expected_revision then return jsonb_build_object('ok',false,'revision',coalesce(n,0)); end if;
 n:=coalesce(n,0)+1;
 insert into public.btd_dataset_snapshots(user_id,dataset,payload,revision,updated_at) values(uid,p_dataset,p_payload,n,now())
 on conflict(user_id,dataset) do update set payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at;
 return jsonb_build_object('ok',true,'revision',n);
end $$;
revoke all on function public.btd_save_snapshot(text,jsonb,bigint) from public,anon;
grant execute on function public.btd_save_snapshot(text,jsonb,bigint) to authenticated;
