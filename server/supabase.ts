import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://dwysaxscyrtfxgekwnpl.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_V4Ci_xIXyIjHpMwIStjAcA_AvgaboAG';

export const SUPABASE_PROJECT_REF = 'dwysaxscyrtfxgekwnpl';
export const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`;

export const supabaseServer: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

interface TableStatusMap {
  users: boolean;
  items: boolean;
  claims: boolean;
  matches: boolean;
  notifications: boolean;
  item_embeddings: boolean;
}

class SupabaseService {
  private client: SupabaseClient = supabaseServer;
  private tableStatus: TableStatusMap = {
    users: false,
    items: false,
    claims: false,
    matches: false,
    notifications: false,
    item_embeddings: false,
  };
  private isChecking = false;
  private lastChecked = 0;

  async checkHealth(): Promise<{
    connected: boolean;
    projectUrl: string;
    apiUrl: string;
    tables: TableStatusMap;
    allTablesReady: boolean;
    error?: string;
  }> {
    const now = Date.now();
    // Cache check for 10 seconds unless forced
    if (now - this.lastChecked < 10000 && this.lastChecked > 0) {
      const allReady = Object.values(this.tableStatus).every(Boolean);
      return {
        connected: true,
        projectUrl: SUPABASE_DASHBOARD_URL,
        apiUrl: SUPABASE_URL,
        tables: { ...this.tableStatus },
        allTablesReady: allReady,
      };
    }

    try {
      this.isChecking = true;
      const [u, i, c, m, n, e] = await Promise.all([
        this.client.from('users').select('id').limit(1),
        this.client.from('items').select('id').limit(1),
        this.client.from('claims').select('id').limit(1),
        this.client.from('matches').select('id').limit(1),
        this.client.from('notifications').select('id').limit(1),
        this.client.from('item_embeddings').select('item_id').limit(1),
      ]);

      this.tableStatus.users = !u.error;
      this.tableStatus.items = !i.error;
      this.tableStatus.claims = !c.error;
      this.tableStatus.matches = !m.error;
      this.tableStatus.notifications = !n.error;
      this.tableStatus.item_embeddings = !e.error;
      this.lastChecked = Date.now();

      const allReady =
        this.tableStatus.users &&
        this.tableStatus.items &&
        this.tableStatus.claims;

      return {
        connected: true,
        projectUrl: SUPABASE_DASHBOARD_URL,
        apiUrl: SUPABASE_URL,
        tables: { ...this.tableStatus },
        allTablesReady: allReady,
        error: i.error?.code === 'PGRST205' ? 'Tables pending in Supabase schema' : i.error?.message,
      };
    } catch (err: any) {
      return {
        connected: false,
        projectUrl: SUPABASE_DASHBOARD_URL,
        apiUrl: SUPABASE_URL,
        tables: { ...this.tableStatus },
        allTablesReady: false,
        error: err?.message || 'Connection failed',
      };
    } finally {
      this.isChecking = false;
    }
  }

  isTableReady(table: keyof TableStatusMap): boolean {
    return this.tableStatus[table];
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

export const supabaseService = new SupabaseService();
