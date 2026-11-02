-- SafetyTraining v46.10 — limit database catalog RPCs to the actual user scope.
-- Existing functions remain SECURITY INVOKER; preserve original signatures/returns.
-- No course, enrollment or historical training records are mutated.
do $scope$
declare
  summary_sql text;
  bundle_sql text;
  predicate_sql text:=$authorized$(
    auth.uid() is not null and (
      private.is_platform_admin()
      or (
        c.owner_organization_id is not null
        and private.has_org_role(c.owner_organization_id,
          array['organization_admin','training_manager','teacher','tutor'])
      )
      or exists(
        select 1 from public.course_editions ed
        join public.course_versions owned_cv on owned_cv.id=ed.course_version_id
        join public.organization_memberships staff on staff.organization_id=ed.organization_id
        where owned_cv.course_id=c.id and staff.user_id=auth.uid()
          and staff.active and staff.role in ('organization_admin','training_manager','teacher','tutor')
      )
      or exists(
        select 1 from public.enrollments learner_e
        join public.learners learner_l on learner_l.id=learner_e.learner_id
        join public.course_editions learner_ed on learner_ed.id=learner_e.edition_id
        join public.course_versions learner_cv on learner_cv.id=learner_ed.course_version_id
        where learner_l.auth_user_id=auth.uid() and learner_l.active
          and learner_cv.course_id=c.id and learner_e.status<>'revoked'
          and (learner_ed.available_from is null or learner_ed.available_from<=now())
          and (learner_ed.available_until is null or learner_ed.available_until>=now())
      )
    )
  )$authorized$;
begin
  summary_sql:=pg_catalog.pg_get_functiondef('public.training_catalog_summary()'::regprocedure);
  bundle_sql:=pg_catalog.pg_get_functiondef('public.training_course_bundle(text)'::regprocedure);
  if pg_catalog.strpos(summary_sql,'where c.active=true')=0
    or pg_catalog.strpos(bundle_sql,'where c.active=true and c.stable_key=p_stable_key')=0 then
    raise exception 'unexpected_catalog_rpc_version' using errcode='22023';
  end if;
  summary_sql:=pg_catalog.replace(summary_sql,'where c.active=true','where c.active=true and '||predicate_sql);
  bundle_sql:=pg_catalog.replace(bundle_sql,'where c.active=true and c.stable_key=p_stable_key',
    'where c.active=true and c.stable_key=p_stable_key and '||predicate_sql);
  execute summary_sql;
  execute bundle_sql;
end;
$scope$;

-- Fail closed if an unrelated grant has exposed private catalog RPCs to anon.
revoke all on function public.training_catalog_summary() from public,anon;
revoke all on function public.training_course_bundle(text) from public,anon;
grant execute on function public.training_catalog_summary(),public.training_course_bundle(text) to authenticated;
