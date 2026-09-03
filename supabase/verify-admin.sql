-- Run after admin.sql to verify the admin foundation.
select username, role from public.profiles where lower(username) = 'parham';
select public.is_admin();
select count(*) as admin_logs from public.admin_logs;
