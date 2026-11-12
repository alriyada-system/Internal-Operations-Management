import { supabase, usernameToEmail } from './supabase';

/** App collections (React state arrays) ↔ Supabase tables. */
export type CollectionKey =
  | 'customers' | 'invoices' | 'users' | 'logs' | 'services'
  | 'deletedInvoices' | 'tickets' | 'warnings' | 'mails' | 'privateMessages';

const TABLE: Record<CollectionKey, string> = {
  customers: 'customers',
  invoices: 'invoices',
  users: 'app_users',
  logs: 'logs',
  services: 'services',
  deletedInvoices: 'deleted_invoices',
  tickets: 'tickets',
  warnings: 'warnings',
  mails: 'mails',
  privateMessages: 'private_messages',
};
export const COLLECTIONS = Object.keys(TABLE) as CollectionKey[];

/** Collections whose array position is meaningful (stored in `ord`). Others are newest-first by sort_ts. */
const ORDERED: CollectionKey[] = ['users', 'services'];

export type AppData = Record<CollectionKey, any[]>;
export type Snapshot = Record<CollectionKey, Map<string, string>>;
export const newSnapshot = (): Snapshot =>
  Object.fromEntries(COLLECTIONS.map((k) => [k, new Map<string, string>()])) as Snapshot;
export const emptyData = (): AppData =>
  Object.fromEntries(COLLECTIONS.map((k) => [k, [] as any[]])) as AppData;

const PAGE = 1000; // Supabase returns max 1000 rows per request

async function fetchAll(table: string, order: { col: string; asc: boolean }) {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order.col, { ascending: order.asc })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function rowToItem(key: CollectionKey, row: any) {
  const item = { ...(row.data || {}) };
  if (!item.id) item.id = row.id;
  if (key === 'users') {
    item.username = row.username ?? item.username;
    item.role = row.role ?? item.role;
    item.isActive = row.is_active;
    if (row.branch_id) item.branchId = row.branch_id;
  }
  return item;
}

const sig = (key: CollectionKey, item: any, index: number) =>
  JSON.stringify(item) + (ORDERED.includes(key) ? `|${index}` : '');

/** Load everything the signed-in user is allowed to see (RLS filters server-side). */
export async function loadAll(snapshot: Snapshot): Promise<AppData> {
  const out = emptyData();
  await Promise.all(
    COLLECTIONS.map(async (key) => {
      const ordered = ORDERED.includes(key);
      const rows = await fetchAll(TABLE[key], ordered ? { col: 'ord', asc: true } : { col: 'sort_ts', asc: false });
      const items = rows.map((r) => rowToItem(key, r));
      out[key] = items;
      snapshot[key] = new Map(items.map((it, i) => [String(it.id), sig(key, it, i)]));
    }),
  );
  return out;
}

const validTs = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};
const sortTs = (item: any) =>
  validTs(item.createdAt) || validTs(item.timestamp) || validTs(item.sentAt) || validTs(item.date) ||
  validTs(item.updatedAt) || new Date().toISOString();

function itemToRow(key: CollectionKey, item: any, index: number, branchOf?: (inv: any) => string) {
  const now = new Date().toISOString();
  if (key === 'users') {
    const { password: _pw, ...clean } = item; // never persist passwords
    return {
      id: String(item.id),
      username: item.username ?? null,
      role: item.role ?? null,
      is_active: item.isActive !== false,
      branch_id: item.branchId ?? null,
      ord: index,
      data: clean,
      updated_at: now,
    };
  }
  const row: any = {
    id: String(item.id),
    branch_id: key === 'invoices' && branchOf ? branchOf(item) : item.branchId ?? null,
    ord: ORDERED.includes(key) ? index : 0,
    sort_ts: sortTs(item),
    data: item,
    updated_at: now,
  };
  if (key === 'mails' || key === 'privateMessages') {
    row.sender_id = item.senderId ?? null;
    row.receiver_id = item.receiverId ?? null;
  }
  return row;
}

const chunk = <T,>(arr: T[], n: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export interface SyncResult { ok: boolean; errors: string[]; networkError: boolean }

/**
 * Row-level diff sync: only changed/new rows are written, only removed rows are deleted.
 * A row is marked as synced in `snapshot` only after the server accepted it, so failures retry next time.
 */
export async function syncAll(
  current: AppData,
  snapshot: Snapshot,
  opts: { branchOf?: (inv: any) => string; isAdmin: boolean },
): Promise<SyncResult> {
  const errors: string[] = [];
  let networkError = false;

  for (const key of COLLECTIONS) {
    const table = TABLE[key];
    const snap = snapshot[key];
    const items = current[key] || [];
    const seen = new Set<string>();
    const toInsert: { row: any; s: string }[] = [];
    const toUpdate: { row: any; s: string }[] = [];

    items.forEach((item, i) => {
      if (!item || item.id === undefined || item.id === null) return;
      const id = String(item.id);
      seen.add(id);
      const s = sig(key, item, i);
      if (snap.get(id) === s) return;
      const row = itemToRow(key, item, i, opts.branchOf);
      (snap.has(id) ? toUpdate : toInsert).push({ row, s });
    });

    // Inserts
    for (const part of chunk(toInsert, 100)) {
      const { error } = await supabase.from(table).insert(part.map((p) => p.row));
      if (error) {
        if (/fetch|network/i.test(error.message)) networkError = true;
        // Fall back to row by row so one bad row doesn't block the others
        for (const p of part) {
          const r = await supabase.from(table).insert(p.row);
          if (r.error && r.error.code === '23505') {
            // Row already exists server-side (e.g. created by the admin-users function) → update it instead
            const { id, ...rest } = p.row;
            const u = await supabase.from(table).update(rest).eq('id', id);
            if (u.error) errors.push(`${table}/${id}: ${u.error.message}`);
            else snap.set(id, p.s);
          } else if (r.error) errors.push(`${table}/${p.row.id}: ${r.error.message}`);
          else snap.set(p.row.id, p.s);
        }
      } else part.forEach((p) => snap.set(p.row.id, p.s));
    }

    // Updates (one request per changed row — avoids INSERT-policy checks that upsert would trigger)
    for (const part of chunk(toUpdate, 10)) {
      await Promise.all(
        part.map(async (p) => {
          const { id, ...rest } = p.row;
          const { error } = await supabase.from(table).update(rest).eq('id', id);
          if (error) {
            if (/fetch|network/i.test(error.message)) networkError = true;
            errors.push(`${table}/${id}: ${error.message}`);
          } else snap.set(id, p.s);
        }),
      );
    }

    // Deletes
    const removed = [...snap.keys()].filter((id) => !seen.has(id));
    for (const part of chunk(removed, 100)) {
      const { error } = await supabase.from(table).delete().in('id', part);
      if (error) errors.push(`${table} delete: ${error.message}`);
      else part.forEach((id) => snap.delete(id));
    }
  }
  return { ok: errors.length === 0, errors, networkError };
}

// ----------------------------- Auth -----------------------------

export async function signIn(username: string, password: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  return error ? { error: error.message } : {};
}
export const signOut = () => supabase.auth.signOut();

/** App-level id (app_users.id) of the signed-in auth user, or null (no session / inactive account). */
export async function fetchMyAppUserId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return null;
  const { data } = await supabase.from('app_users').select('id').eq('auth_id', uid).maybeSingle();
  return data?.id ?? null;
}

type AdminAction =
  | { action: 'create'; profile: any; password: string }
  | { action: 'setPassword'; userId: string; password: string }
  | { action: 'changeOwnPassword'; currentPassword: string; newPassword: string }
  | { action: 'delete'; userId: string };

export async function adminUsers(payload: AdminAction): Promise<{ error?: string }> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: payload });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    return { error: msg };
  }
  return data?.error ? { error: data.error } : {};
}
