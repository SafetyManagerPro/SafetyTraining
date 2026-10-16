create table if not exists public.learner_account_invitations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null unique references public.learners(id) on delete cascade,
  email text not null,
  status text not null default 'not_sent' check (status in ('not_sent','sent','accepted','failed','revoked')),
  sent_count integer not null default 0 check (sent_count >= 0),
  last_sent_at timestamptz,
  accepted_at timestamptz,
  auth_user_id uuid,
  last_error text,
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learner_account_invitations enable row level security;

drop policy if exists learner_account_invitations_admin_read on public.learner_account_invitations;
create policy learner_account_invitations_admin_read on public.learner_account_invitations
for select to authenticated using (private.is_platform_admin());

drop policy if exists learner_account_invitations_admin_manage on public.learner_account_invitations;
create policy learner_account_invitations_admin_manage on public.learner_account_invitations
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

create or replace function private.sync_learner_invitation_acceptance()
returns trigger
language plpgsql
security definer
set search_path=public,private,auth
as $$
begin
  if new.auth_user_id is not null and (old.auth_user_id is distinct from new.auth_user_id) then
    insert into public.learner_account_invitations(
      learner_id,email,status,sent_count,accepted_at,auth_user_id,last_error,metadata
    ) values (
      new.id,coalesce(nullif(btrim(new.email),''),'unknown@example.invalid'),'accepted',0,now(),new.auth_user_id,null,
      jsonb_build_object('accepted_via','learner_auth_link','accepted_on',now())
    )
    on conflict (learner_id) do update set
      email=case when excluded.email='unknown@example.invalid' then public.learner_account_invitations.email else excluded.email end,
      status='accepted',accepted_at=coalesce(public.learner_account_invitations.accepted_at,now()),
      auth_user_id=new.auth_user_id,last_error=null,
      metadata=coalesce(public.learner_account_invitations.metadata,'{}'::jsonb)||jsonb_build_object('accepted_via','learner_auth_link','accepted_on',now()),
      updated_at=now();
  end if;
  return new;
end;
$$;

drop trigger if exists learners_sync_invitation_acceptance on public.learners;
create trigger learners_sync_invitation_acceptance
after update of auth_user_id on public.learners
for each row execute function private.sync_learner_invitation_acceptance();

insert into public.learner_account_invitations(learner_id,email,status,sent_count,accepted_at,auth_user_id,metadata)
select l.id,l.email,'accepted',0,now(),l.auth_user_id,jsonb_build_object('backfilled',true,'accepted_via','existing_auth_link')
from public.learners l
where l.auth_user_id is not null and l.email is not null
on conflict (learner_id) do nothing;

do $$ declare bad int; begin
  select count(*) into bad from public.learner_account_invitations i join public.learners l on l.id=i.learner_id where i.status='accepted' and l.auth_user_id is null;
  if bad<>0 then raise exception 'accepted invitation without learner auth link: %',bad; end if;
end $$;