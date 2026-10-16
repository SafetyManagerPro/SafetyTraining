update public.learning_unit_versions
set content=replace(replace(content::text,
  'https://www.napofilm.net/it/napos-films/napo-best-signs-story',
  'https://www.napofilm.net/it/napos-films/best-signs-story'),
  'https://www.napofilm.net/it/napos-films/napo-working-height',
  'https://www.napofilm.net/it/napos-films/napo-work-height')::jsonb,
  content_hash=md5(replace(replace(content::text,
  'https://www.napofilm.net/it/napos-films/napo-best-signs-story',
  'https://www.napofilm.net/it/napos-films/best-signs-story'),
  'https://www.napofilm.net/it/napos-films/napo-working-height',
  'https://www.napofilm.net/it/napos-films/napo-work-height'))
where content->>'didactic_version' in ('general-authored-v4','worker-authored-v3','role-authored-v3','datore-authored-v3','dl-rspp-authored-v3','rls-authored-v3','first-aid-authored-v3','fire-authored-v3','equipment-authored-v3','height-authored-v3','emergency-authored-v3','datore-cantieri-authored-v3','dirigente-cantieri-authored-v3')
  and (content::text like '%https://www.napofilm.net/it/napos-films/napo-best-signs-story%' or content::text like '%https://www.napofilm.net/it/napos-films/napo-working-height%');

do $$ declare old_a int; old_b int; new_a int; new_b int; begin
 select count(*) into old_a from public.learning_unit_versions where content->>'didactic_version' in ('general-authored-v4','worker-authored-v3','role-authored-v3','datore-authored-v3','dl-rspp-authored-v3','rls-authored-v3','first-aid-authored-v3','fire-authored-v3','equipment-authored-v3','height-authored-v3','emergency-authored-v3','datore-cantieri-authored-v3','dirigente-cantieri-authored-v3') and content::text like '%https://www.napofilm.net/it/napos-films/napo-best-signs-story%';
 select count(*) into old_b from public.learning_unit_versions where content->>'didactic_version' in ('general-authored-v4','worker-authored-v3','role-authored-v3','datore-authored-v3','dl-rspp-authored-v3','rls-authored-v3','first-aid-authored-v3','fire-authored-v3','equipment-authored-v3','height-authored-v3','emergency-authored-v3','datore-cantieri-authored-v3','dirigente-cantieri-authored-v3') and content::text like '%https://www.napofilm.net/it/napos-films/napo-working-height%';
 select count(*) into new_a from public.learning_unit_versions where content->>'didactic_version' in ('general-authored-v4','worker-authored-v3','role-authored-v3','datore-authored-v3','dl-rspp-authored-v3','rls-authored-v3','first-aid-authored-v3','fire-authored-v3','equipment-authored-v3','height-authored-v3','emergency-authored-v3','datore-cantieri-authored-v3','dirigente-cantieri-authored-v3') and content::text like '%https://www.napofilm.net/it/napos-films/best-signs-story%';
 select count(*) into new_b from public.learning_unit_versions where content->>'didactic_version' in ('general-authored-v4','worker-authored-v3','role-authored-v3','datore-authored-v3','dl-rspp-authored-v3','rls-authored-v3','first-aid-authored-v3','fire-authored-v3','equipment-authored-v3','height-authored-v3','emergency-authored-v3','datore-cantieri-authored-v3','dirigente-cantieri-authored-v3') and content::text like '%https://www.napofilm.net/it/napos-films/napo-work-height%';
 if old_a<>0 or old_b<>0 or new_a<9 or new_b<13 then raise exception 'Napo URL normalization failed old %/% new %/%',old_a,old_b,new_a,new_b; end if;
end $$;