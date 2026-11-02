import {
  User,
  Item,
  Claim,
  Notification,
  MatchResult,
  UserMatchGroup,
  AdminStats,
  AdminUser,
  AiStatus,
} from '../types';

const TOKEN_KEY = 'campus_lostfound_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: {
    name: string;
    email: string;
    password: string;
    collegeId: string;
    phone?: string;
    department?: string;
    role?: 'student' | 'admin';
  }) => apiRequest<{ message: string; token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => apiRequest<{ user: User }>('/api/auth/me'),

  updateProfile: (payload: { name?: string; phone?: string; department?: string }) =>
    apiRequest<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      authStorage.clearToken();
    }
  },

  getAllUsers: () => apiRequest<{ users: User[] }>('/api/auth/users'),

  // Items
  getItems: (params: {
    type?: 'lost' | 'found';
    category?: string;
    location?: string;
    status?: string;
    q?: string;
    user?: string;
    fromDate?: string;
    toDate?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ items: Item[] }>(`/api/items${qs}`);
  },

  getItemById: (id: string) => apiRequest<{ item: Item }>(`/api/items/${id}`),

  createItem: (payload: Partial<Item>) =>
    apiRequest<{ message: string; item: Item; potentialMatchesCount: number }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (id: string, payload: Partial<Item>) =>
    apiRequest<{ message: string; item: Item }>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteItem: (id: string) =>
    apiRequest<{ message: string }>(`/api/items/${id}`, {
      method: 'DELETE',
    }),

  updateItemStatus: (id: string, status: string) =>
    apiRequest<{ message: string; item: Item }>(`/api/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Claims
  submitClaim: (payload: {
    itemId: string;
    proofDetails: string;
    proofImageUrl?: string;
    contactPhone?: string;
  }) =>
    apiRequest<{ message: string; claim: Claim }>('/api/claims', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyClaims: () => apiRequest<{ claims: Claim[] }>('/api/claims/my'),

  getAllClaims: () => apiRequest<{ claims: Claim[] }>('/api/claims'),

  verifyClaim: (id: string, status: 'verified' | 'rejected', adminRemarks?: string) =>
    apiRequest<{ message: string; claim: Claim }>(`/api/claims/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminRemarks }),
    }),

  markClaimReturned: (id: string) =>
    apiRequest<{ message: string; claim: Claim }>(`/api/claims/${id}/return`, {
      method: 'PATCH',
    }),

  // Matches
  getItemMatches: (itemId: string) =>
    apiRequest<{ targetItem: Item; matchesCount: number; matches: MatchResult[] }>(
      `/api/matches/${itemId}`
    ),

  getUserMatches: () =>
    apiRequest<{ groups: UserMatchGroup[] }>('/api/matches/user/all'),

  getAiStatus: () =>
    apiRequest<AiStatus>('/api/matches/ai-status'),

  recalculateMatches: () =>
    apiRequest<{ message: string; matchesFound: number }>('/api/matches/recalculate', {
      method: 'POST',
    }),

  compareItems: (lostItemId: string, foundItemId: string) =>
    apiRequest<any>('/api/matches/compare', {
      method: 'POST',
      body: JSON.stringify({ lostItemId, foundItemId }),
    }),

  // Notifications
  getNotifications: () =>
    apiRequest<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    apiRequest<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    apiRequest<{ message: string }>('/api/notifications/read-all', {
      method: 'POST',
    }),

  // Admin
  getAdminStats: () => apiRequest<AdminStats>('/api/admin/stats'),

  getAdminUsers: () => apiRequest<{ users: AdminUser[] }>('/api/admin/users'),

  adminMarkItemReturned: (id: string) =>
    apiRequest<{ message: string; item: Item }>(`/api/admin/items/${id}/return`, {
      method: 'PATCH',
    }),

  adminModerateItem: (id: string, action: 'duplicate' | 'inappropriate', reason?: string) =>
    apiRequest<{ message: string; item: Item }>(`/api/admin/items/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    }),

  adminDeleteItem: (id: string) =>
    apiRequest<{ message: string }>(`/api/admin/items/${id}`, {
      method: 'DELETE',
    }),

  // Supabase Integration
  getSupabaseStatus: () =>
    apiRequest<{
      success: boolean;
      supabase: {
        connected: boolean;
        projectUrl: string;
        apiUrl: string;
        tables: {
          users: boolean;
          items: boolean;
          claims: boolean;
          matches: boolean;
          notifications: boolean;
          item_embeddings: boolean;
        };
        allTablesReady: boolean;
        projectRef: string;
        dashboardUrl: string;
        sqlEditorUrl: string;
        stats: {
          usersCount: number;
          itemsCount: number;
          claimsCount: number;
          matchesCount: number;
        };
        error?: string;
      };
      schemaSql: string;
    }>('/api/supabase/status'),

  syncSupabase: () =>
    apiRequest<{
      success: boolean;
      message: string;
      synced: {
        users: number;
        items: number;
        claims: number;
        matches: number;
        notifications: number;
      };
    }>('/api/supabase/sync', {
      method: 'POST',
    }),
};
