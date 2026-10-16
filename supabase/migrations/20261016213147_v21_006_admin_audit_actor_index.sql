create index if not exists admin_audit_log_actor_user_idx
on private.admin_audit_log(actor_user_id, created_at desc);
