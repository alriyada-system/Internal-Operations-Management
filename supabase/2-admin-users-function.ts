// Supabase Edge Function: admin-users
// Deploy:  supabase functions deploy admin-users
// Uses the auto-injected SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const toEmail = (username: string) => {
  const hex = Array.from(new TextEncoder().encode(username.trim().toLowerCase()))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return `u${hex}@riyada-internal.app`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await caller.auth.getUser();
    if (!u?.user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from('app_users').select('*').eq('auth_id', u.user.id).eq('is_active', true).maybeSingle();
    if (!me) return json({ error: 'forbidden' }, 403);
    const isAdmin = me.role === 'admin';

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      if (!isAdmin && !me.data?.permissions?.manageUsers) return json({ error: 'forbidden' }, 403);
      const { profile, password } = body; // profile: full User object WITHOUT password
      if (!profile?.id || !profile?.username || !password || String(password).length < 6)
        return json({ error: 'invalid input (password min 6 chars)' }, 400);
      if (profile.role === 'admin' && !isAdmin) return json({ error: 'forbidden' }, 403);
      const username = String(profile.username).trim().toLowerCase();
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: toEmail(username), password, email_confirm: true,
      });
      if (cErr) return json({ error: cErr.message }, 400);
      const { password: _drop, ...clean } = profile;
      const { error: iErr } = await admin.from('app_users').upsert({
        id: clean.id, auth_id: created.user.id, username, role: clean.role,
        is_active: clean.isActive !== false, branch_id: clean.branchId ?? null, data: { ...clean, username },
      });
      if (iErr) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: iErr.message }, 400); }
      return json({ ok: true, authId: created.user.id });
    }

    if (action === 'setPassword') { // admin / manageUsers resets someone's password
      if (!isAdmin && !me.data?.permissions?.manageUsers) return json({ error: 'forbidden' }, 403);
      const { userId, password } = body;
      if (!password || String(password).length < 6) return json({ error: 'password min 6 chars' }, 400);
      const { data: target } = await admin.from('app_users').select('auth_id,role').eq('id', userId).maybeSingle();
      if (!target?.auth_id) return json({ error: 'user has no login' }, 404);
      if (target.role === 'admin' && !isAdmin) return json({ error: 'forbidden' }, 403);
      const { error } = await admin.auth.admin.updateUserById(target.auth_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'changeOwnPassword') {
      const { currentPassword, newPassword } = body;
      if (!newPassword || String(newPassword).length < 6) return json({ error: 'password min 6 chars' }, 400);
      const check = createClient(url, anon);
      const { error: vErr } = await check.auth.signInWithPassword({ email: u.user.email!, password: currentPassword });
      if (vErr) return json({ error: 'wrong current password' }, 400);
      const { error } = await admin.auth.admin.updateUserById(u.user.id, { password: newPassword });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'delete') {
      if (!isAdmin) return json({ error: 'forbidden' }, 403);
      const { userId } = body;
      const { data: target } = await admin.from('app_users').select('auth_id').eq('id', userId).maybeSingle();
      if (target?.auth_id) await admin.auth.admin.deleteUser(target.auth_id);
      await admin.from('app_users').delete().eq('id', userId);
      return json({ ok: true });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
