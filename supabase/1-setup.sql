-- =====================================================================
-- Al-Riyada: ملف الإعداد الوحيد — الصقه كاملاً في Supabase → SQL Editor ثم Run
-- شرط: أنشئ مستخدم admin من Authentication → Users قبل التشغيل (انظر الدليل)
-- =====================================================================
-- ---------- Users / profiles (NO passwords here: Supabase Auth owns them) ----------
create table if not exists public.app_users (
  id          text primary key,
  auth_id     uuid unique references auth.users(id) on delete set null,
  username    text,
  role        text,
  is_active   boolean not null default true,
  branch_id   text,
  ord         integer not null default 0,
  data        jsonb  not null default '{}'::jsonb,   -- everything else (permissions, profile, config blobs)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists app_users_auth_idx on public.app_users(auth_id);

-- ---------- Generic document tables ----------
do $$
declare t text;
begin
  foreach t in array array['customers','invoices','deleted_invoices','tickets','warnings','logs','services','mails','private_messages','chat_messages']
  loop
    execute format($f$
      create table if not exists public.%I (
        id         text primary key,
        branch_id  text,
        sender_id  text,
        receiver_id text,
        ord        integer not null default 0,
        sort_ts    timestamptz not null default now(),
        data       jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('create index if not exists %I on public.%I(sort_ts desc)', t||'_sort_idx', t);
  end loop;
end $$;
create index if not exists invoices_branch_idx on public.invoices(branch_id);
create index if not exists chat_channel_idx on public.chat_messages((data->>'channelId'), sort_ts);

-- ---------- Helper functions (SECURITY DEFINER so RLS does not recurse) ----------
create or replace function public.me() returns public.app_users
language sql stable security definer set search_path = public as $$
  select * from public.app_users where auth_id = auth.uid() and is_active limit 1
$$;
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.app_users where auth_id = auth.uid() and is_active)
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.app_users where auth_id = auth.uid() and is_active and role = 'admin')
$$;
create or replace function public.my_id() returns text
language sql stable security definer set search_path = public as $$
  select id from public.app_users where auth_id = auth.uid() and is_active limit 1
$$;
create or replace function public.my_branch() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(branch_id,'branch-1') from public.app_users where auth_id = auth.uid() and is_active limit 1
$$;
create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (data->'permissions'->>p)::boolean from public.app_users
                   where auth_id = auth.uid() and is_active limit 1), false)
$$;

-- ---------- Enable RLS everywhere ----------
alter table public.app_users enable row level security;
do $$ declare t text; begin
  foreach t in array array['customers','invoices','deleted_invoices','tickets','warnings','logs','services','mails','private_messages','chat_messages']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

-- ---------- app_users ----------
drop policy if exists users_select on public.app_users;
drop policy if exists users_insert on public.app_users;
drop policy if exists users_update on public.app_users;
drop policy if exists users_delete on public.app_users;
create policy users_select on public.app_users for select to authenticated using (public.is_active_user());
create policy users_insert on public.app_users for insert to authenticated with check (public.is_admin());
create policy users_update on public.app_users for update to authenticated
  using (public.is_admin() or auth_id = auth.uid())
  with check (public.is_admin() or auth_id = auth.uid());
create policy users_delete on public.app_users for delete to authenticated using (public.is_admin());

-- A non-admin may edit their own profile, but never role / status / branch / permissions / link to auth.
create or replace function public.guard_user_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.auth_id   is distinct from old.auth_id
  or new.role      is distinct from old.role
  or new.is_active is distinct from old.is_active
  or new.branch_id is distinct from old.branch_id
  or new.username  is distinct from old.username
  or (new.data->'permissions') is distinct from (old.data->'permissions') then
    raise exception 'not allowed to change protected profile fields';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_user_update on public.app_users;
create trigger trg_guard_user_update before update on public.app_users
  for each row execute function public.guard_user_update();

-- ---------- Generic policies ----------
-- Read: any active user.  Insert/update: any active user.  Delete: admin or the matching permission.
do $$ declare t text; begin
  foreach t in array array['customers','deleted_invoices','tickets','warnings','logs']
  loop
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_active_user())', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_active_user())', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_active_user()) with check (public.is_active_user())', t||'_upd', t);
  end loop;
end $$;
create policy customers_del on public.customers for delete to authenticated
  using (public.is_admin() or public.has_perm('manageCustomers'));
create policy deleted_invoices_del on public.deleted_invoices for delete to authenticated using (public.is_admin());
create policy tickets_del on public.tickets for delete to authenticated
  using (public.is_admin() or public.has_perm('manageTickets'));
create policy warnings_del on public.warnings for delete to authenticated
  using (public.is_admin() or public.has_perm('manageWarnings'));
create policy logs_del on public.logs for delete to authenticated using (public.is_admin());

-- logs: non-admins only see their own entries (mirrors the UI)
drop policy if exists logs_sel on public.logs;
create policy logs_sel on public.logs for select to authenticated using (
  public.is_admin()
  or (public.is_active_user() and (data->>'username') in (
        select data->>'name' from public.app_users where auth_id = auth.uid()
        union select username from public.app_users where auth_id = auth.uid()))
);

-- services: everyone reads; only editors write
drop policy if exists services_sel on public.services;
drop policy if exists services_ins on public.services;
drop policy if exists services_upd on public.services;
drop policy if exists services_del on public.services;
create policy services_sel on public.services for select to authenticated using (public.is_active_user());
create policy services_ins on public.services for insert to authenticated with check (public.is_admin() or public.has_perm('editServices'));
create policy services_upd on public.services for update to authenticated using (public.is_admin() or public.has_perm('editServices')) with check (public.is_admin() or public.has_perm('editServices'));
create policy services_del on public.services for delete to authenticated using (public.is_admin() or public.has_perm('deleteServices'));

-- invoices: branch isolation (admin sees every branch)
drop policy if exists invoices_sel on public.invoices;
drop policy if exists invoices_ins on public.invoices;
drop policy if exists invoices_upd on public.invoices;
drop policy if exists invoices_del on public.invoices;
create policy invoices_sel on public.invoices for select to authenticated
  using (public.is_admin() or (public.is_active_user() and coalesce(branch_id,'branch-1') = public.my_branch()));
create policy invoices_ins on public.invoices for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and coalesce(branch_id,'branch-1') = public.my_branch()));
create policy invoices_upd on public.invoices for update to authenticated
  using (public.is_admin() or (public.is_active_user() and coalesce(branch_id,'branch-1') = public.my_branch()))
  with check (public.is_admin() or (public.is_active_user() and coalesce(branch_id,'branch-1') = public.my_branch()));
create policy invoices_del on public.invoices for delete to authenticated
  using (public.is_admin() or (public.has_perm('deleteInvoice') and coalesce(branch_id,'branch-1') = public.my_branch()));

-- mails & private messages: only sender / receiver (admin can read all for the Database Center)
do $$ declare t text; begin
  foreach t in array array['mails','private_messages']
  loop
    execute format('drop policy if exists %I on public.%I', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin() or sender_id = public.my_id() or receiver_id = public.my_id())', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin() or sender_id = public.my_id())', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin() or sender_id = public.my_id() or receiver_id = public.my_id()) with check (public.is_admin() or sender_id = public.my_id() or receiver_id = public.my_id())', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin() or sender_id = public.my_id() or receiver_id = public.my_id())', t||'_del', t);
  end loop;
end $$;

-- general chat: any active user reads/writes; delete own message or admin
drop policy if exists chat_sel on public.chat_messages;
drop policy if exists chat_ins on public.chat_messages;
drop policy if exists chat_del on public.chat_messages;
create policy chat_sel on public.chat_messages for select to authenticated using (public.is_active_user());
create policy chat_ins on public.chat_messages for insert to authenticated with check (public.is_active_user() and sender_id = public.my_id());
create policy chat_del on public.chat_messages for delete to authenticated using (public.is_admin() or sender_id = public.my_id());

-- ---------- Realtime for chat ----------
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;

-- ---------- Lock down anonymous access completely ----------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------- أول مدير (يربط مستخدم admin الذي أنشأته من لوحة Authentication) ----------
insert into public.app_users (id, auth_id, username, role, is_active, branch_id, data)
select 'user-1', id, 'admin', 'admin', true, 'branch-1',
  jsonb_build_object(
    'id','user-1','name','مدير النظام','username','admin','role','admin','isActive',true,'branchId','branch-1',
    'permissions', jsonb_build_object(
      'createInvoice',true,'editInvoice',true,'deleteInvoice',true,'manageCustomers',true,'closeAccounts',true,
      'viewReports',true,'manageUsers',true,'editServices',true,'deleteServices',true,'viewActivityLogs',true,
      'inputTicketAmount',true,'viewTicketAmount',true,'manageTicketAmount',true,'manageTickets',true,'manageWarnings',true))
from auth.users
where email = 'u' || encode(convert_to('admin','UTF8'),'hex') || '@riyada-internal.app'
on conflict (id) do update set auth_id = excluded.auth_id;
