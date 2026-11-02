import { createClient } from '@supabase/supabase-js';

// Default Supabase project URL & publishable key provided for this project
const DEFAULT_SUPABASE_URL = 'https://dwysaxscyrtfxgekwnpl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_V4Ci_xIXyIjHpMwIStjAcA_AvgaboAG';

export const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

export const SUPABASE_PROJECT_REF = 'dwysaxscyrtfxgekwnpl';
export const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`;
export const SUPABASE_SQL_EDITOR_URL = `${SUPABASE_DASHBOARD_URL}/sql/new`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealth {
  connected: boolean;
  projectUrl: string;
  apiUrl: string;
  tableStatus: {
    items: boolean;
    users: boolean;
    claims: boolean;
    matches: boolean;
    notifications: boolean;
  };
  errorMessage?: string;
}

/**
 * Checks connectivity to the Supabase backend and reports which tables are ready.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const health: SupabaseHealth = {
    connected: false,
    projectUrl: SUPABASE_DASHBOARD_URL,
    apiUrl: SUPABASE_URL,
    tableStatus: {
      items: false,
      users: false,
      claims: false,
      matches: false,
      notifications: false,
    },
  };

  try {
    const [itemsRes, usersRes, claimsRes, matchesRes, notifsRes] = await Promise.all([
      supabase.from('items').select('id').limit(1),
      supabase.from('users').select('id').limit(1),
      supabase.from('claims').select('id').limit(1),
      supabase.from('matches').select('id').limit(1),
      supabase.from('notifications').select('id').limit(1),
    ]);

    health.connected = true;
    health.tableStatus.items = !itemsRes.error;
    health.tableStatus.users = !usersRes.error;
    health.tableStatus.claims = !claimsRes.error;
    health.tableStatus.matches = !matchesRes.error;
    health.tableStatus.notifications = !notifsRes.error;

    if (itemsRes.error && itemsRes.error.code !== 'PGRST205') {
      health.errorMessage = itemsRes.error.message;
    }
  } catch (err: any) {
    health.errorMessage = err?.message || 'Failed to reach Supabase API';
  }

  return health;
}
