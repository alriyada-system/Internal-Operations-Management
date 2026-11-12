# نظام الريادة — دليل الإطلاق المختصر

1) Supabase: أنشئ مشروعاً، وأنشئ المستخدم admin (Authentication → Users → Add user):
   البريد `u61646d696e@riyada-internal.app` + كلمة مرور قوية + Auto Confirm.
2) SQL Editor: الصق محتوى `supabase/1-setup.sql` ← Run.
3) Edge Functions → Deploy a new function → Via Editor → الاسم `admin-users` ← الصق `supabase/2-admin-users-function.ts` ← Deploy.
4) GitHub: ارفع هذا المجلد، أضف السرّين VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY (Settings → Secrets → Actions)،
   ثم Settings → Pages → Source: GitHub Actions.
