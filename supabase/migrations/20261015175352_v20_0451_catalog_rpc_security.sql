alter function public.training_catalog_summary() security invoker;
alter function public.training_course_bundle(text) security invoker;
revoke execute on function public.training_catalog_summary() from anon;
revoke execute on function public.training_course_bundle(text) from anon;
grant execute on function public.training_catalog_summary() to authenticated;
grant execute on function public.training_course_bundle(text) to authenticated;