alter table public.training_integral_pdf_deleted_v24 alter column deleted_by drop not null;
alter table public.training_integral_pdf_deleted_v24 add column if not exists deletion_origin text not null default 'platform_admin_ui';
comment on column public.training_integral_pdf_deleted_v24.deleted_by is 'Authenticated platform administrator UUID when deletion is initiated via application; NULL for explicitly user-authorized connected maintenance';
comment on column public.training_integral_pdf_deleted_v24.deletion_origin is 'platform_admin_ui or chatgpt_user_authorized_maintenance; audit of how deletion was initiated';
