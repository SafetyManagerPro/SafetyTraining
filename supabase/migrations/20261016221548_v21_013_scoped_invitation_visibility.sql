alter policy learner_account_invitations_admin_read
on public.learner_account_invitations
using (
  private.is_platform_admin()
  or exists (
    select 1
    from public.learners l
    where l.id=learner_account_invitations.learner_id
      and private.can_manage_training_org(l.organization_id)
  )
);
