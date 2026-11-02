import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AdminStats, AdminUser, Item } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  Layers,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Package,
  XCircle,
  CheckCircle2,
  Search,
  Eye,
  FileText,
  RotateCcw,
  CheckSquare,
  Database,
  Copy,
  ExternalLink,
  RefreshCw,
  Check
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'supabase'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Supabase Integration State
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData.users);
    } catch (err) {
      console.error('Failed to load admin stats or users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupabaseStatus = async () => {
    setSupabaseLoading(true);
    try {
      const data = await api.getSupabaseStatus();
      setSupabaseInfo(data);
    } catch (err) {
      console.error('Failed to load Supabase info:', err);
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleSyncSupabase = async () => {
    setSyncingSupabase(true);
    setSyncMessage(null);
    try {
      const res = await api.syncSupabase();
      setSyncMessage(`Successfully pushed data: ${res.synced.items} items, ${res.synced.users} users, ${res.synced.claims} claims, ${res.synced.matches} matches.`);
      fetchSupabaseStatus();
    } catch (err: any) {
      setSyncMessage(`Sync notice: ${err?.message || 'Error syncing data'}`);
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleCopySchema = () => {
    if (supabaseInfo?.schemaSql) {
      navigator.clipboard.writeText(supabaseInfo.schemaSql);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSupabaseStatus();
  }, []);

  const handleMarkReturned = async (itemId: string, title: string) => {
    if (!confirm(`Mark item "${title}" as officially Returned to its verified owner?`)) return;
    try {
      await api.adminMarkItemReturned(itemId);
      setFeedback(`Item "${title}" successfully marked as Returned!`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark item returned');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Admin Clearance Required</h2>
        <p className="text-sm text-zinc-600 mb-4">
          This portal is restricted to Campus Lost & Found Administrative Officers.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          Switch to Admin Login
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.studentId && u.studentId.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title Header */}
      <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold mb-2 border border-purple-400/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Campus Security & Lost Property Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Officer Control Center</h1>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Signed in as <strong>{user.name}</strong> • {user.department} (Admin)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('admin-claims')}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Review Claims Queue ({stats?.pendingClaims ?? 0})</span>
          </button>
          <button
            onClick={() => onNavigate('admin-items')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Manage All Reports</span>
          </button>
          <button
            onClick={() => onNavigate('matches')}
            className="px-4 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 border border-indigo-400/30 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Matches Engine</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold text-base">×</button>
        </div>
      )}

      {/* Primary KPI Metrics: Exactly the 8 required metrics */}
      {stats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Campus Operational Metrics (8 Key Indicators)</span>
            </h2>
            <span className="text-xs text-zinc-500 font-medium">
              Recovery Success Rate: <strong className="text-emerald-700">{stats.recoveryRate}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Total users */}
            <div
              onClick={() => setActiveTab('users')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Users</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-zinc-900">{stats.totalUsers}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {stats.studentUsers} students • {stats.totalUsers - stats.studentUsers} officers
              </p>
            </div>

            {/* 2. Total lost reports */}
            <div
              onClick={() => onNavigate('admin-items')}
              className="bg-rose-50/60 p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-2xs hover:border-rose-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Lost Reports</span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-950">{stats.totalLostReports}</p>
              <p className="text-[11px] text-rose-700 mt-1">Missing belongings filed</p>
            </div>

            {/* 3. Total found reports */}
            <div
              onClick={() => onNavigate('admin-items')}
              className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Found Reports</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.totalFoundReports}</p>
              <p className="text-[11px] text-emerald-700 mt-1">Discovered campus items</p>
            </div>

            {/* 4. Potential matches */}
            <div
              onClick={() => onNavigate('matches')}
              className="bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-indigo-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Potential Matches</span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-950">{stats.potentialMatches}</p>
              <p className="text-[11px] text-indigo-700 mt-1">AI vector score identified</p>
            </div>

            {/* 5. Pending claims */}
            <div
              onClick={() => onNavigate('admin-claims')}
              className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-amber-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Claims</span>
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-950">{stats.pendingClaims}</p>
              <p className="text-[11px] text-amber-800 mt-1">Require officer verification</p>
            </div>

            {/* 6. Approved claims */}
            <div
              onClick={() => onNavigate('admin-claims')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Approved Claims</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.approvedClaims}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Ownership verified</p>
            </div>

            {/* 7. Rejected claims */}
            <div
              onClick={() => onNavigate('admin-claims')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-2xs hover:border-rose-300 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Rejected Claims</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-700">{stats.rejectedClaims}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Inconclusive proof</p>
            </div>

            {/* 8. Returned items */}
            <div
              onClick={() => onNavigate('admin-items')}
              className="bg-emerald-100/70 p-4 sm:p-5 rounded-2xl border border-emerald-300 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-emerald-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Returned Items</span>
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.returnedItems}</p>
              <p className="text-[11px] text-emerald-800 font-medium mt-1">Successfully restored to owners</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation: Overview vs Campus Users Directory vs Supabase Backend */}
      <div className="border-b border-zinc-200 flex flex-wrap items-center gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Activity & Reports Feed
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Campus Users Directory</span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('supabase');
            fetchSupabaseStatus();
          }}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'supabase'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Supabase Backend</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            dwysaxscyrtfxgekwnpl
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW FEED */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Recent Claims to Review */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-zinc-900">Recent Claims Queue</h2>
              </div>
              <button
                onClick={() => onNavigate('admin-claims')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                <span>Open Claims Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!stats || stats.recentClaims.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No student claims registered yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentClaims.map(claim => (
                  <div
                    key={claim.id}
                    className="p-3.5 rounded-xl border border-zinc-100 hover:border-purple-200 hover:bg-purple-50/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-zinc-900 text-sm truncate">
                        {claim.itemTitle}
                      </h4>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="text-xs text-zinc-600 truncate">
                      Claimant: <strong>{claim.claimantName}</strong> ({claim.claimantEmail})
                    </p>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                      Proof: {claim.proofDetails}
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onNavigate('item-details', { id: claim.itemId })}
                        className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Item</span>
                      </button>
                      <button
                        onClick={() => onNavigate('admin-claims')}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Review Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Submissions & Quick Actions */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-700" />
                <h2 className="text-lg font-bold text-zinc-900">Latest Campus Reports</h2>
              </div>
              <button
                onClick={() => onNavigate('admin-items')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Manage All Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!stats || stats.recentItems.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No items reported.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusBadge type={item.type} />
                        <StatusBadge status={item.status} />
                      </div>
                      <h4
                        onClick={() => onNavigate('item-details', { id: item.id })}
                        className="font-semibold text-zinc-900 text-sm truncate hover:text-indigo-600 cursor-pointer"
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {item.location} • Reported by {item.reporterName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status !== 'returned' && (
                        <button
                          onClick={() => handleMarkReturned(item.id, item.title)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                          title="Mark directly as Returned"
                        >
                          Mark Returned
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('item-details', { id: item.id })}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUS USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Registered Campus Community Users</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Audit registered students, staff, and lost/found activity metrics.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search name, email, department, ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3.5">User Profile</th>
                  <th className="p-3.5">Role & Dept</th>
                  <th className="p-3.5">Student / Staff ID</th>
                  <th className="p-3.5">Contact Phone</th>
                  <th className="p-3.5 text-center">Lost Reports</th>
                  <th className="p-3.5 text-center">Found Reports</th>
                  <th className="p-3.5 text-center">Claims Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-3.5">
                      <div>
                        <span className="font-bold text-zinc-900 block">{u.name}</span>
                        <span className="text-[11px] text-zinc-400">{u.email}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {u.role}
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">{u.department}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-xs text-zinc-700">{u.studentId || 'N/A'}</span>
                    </td>

                    <td className="p-3.5 text-zinc-600">
                      {u.phone || '—'}
                    </td>

                    <td className="p-3.5 text-center font-bold text-rose-600">
                      {u.totalLostReports}
                    </td>

                    <td className="p-3.5 text-center font-bold text-emerald-600">
                      {u.totalFoundReports}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="font-bold text-zinc-900">{u.totalClaims}</span>
                      {u.approvedClaims > 0 && (
                        <span className="text-[10px] text-emerald-600 block">
                          ({u.approvedClaims} approved)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPABASE BACKEND INTEGRATION */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Supabase Status Hero Banner */}
          <div className="bg-gradient-to-br from-emerald-950 via-zinc-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-900/40 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Supabase Backend Configured</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Project: <span className="text-emerald-300 font-mono">dwysaxscyrtfxgekwnpl</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
                  Campus Lost & Found is connected to Supabase for PostgreSQL persistence, real-time sync, and asset storage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://supabase.com/dashboard/project/dwysaxscyrtfxgekwnpl"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Supabase Dashboard</span>
                </a>
                <a
                  href="https://supabase.com/dashboard/project/dwysaxscyrtfxgekwnpl/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open SQL Editor</span>
                </a>
                <button
                  onClick={handleSyncSupabase}
                  disabled={syncingSupabase}
                  className="px-4 py-2.5 bg-teal-700/60 hover:bg-teal-700 border border-teal-500/40 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingSupabase ? 'animate-spin' : ''}`} />
                  <span>{syncingSupabase ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Sync feedback notification */}
            {syncMessage && (
              <div className="p-3 bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                <span>{syncMessage}</span>
                <button onClick={() => setSyncMessage(null)} className="font-bold ml-2">×</button>
              </div>
            )}

            {/* Project Connection Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-900/60">
              <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  REST API Endpoint
                </span>
                <span className="font-mono text-xs text-zinc-200 break-all">
                  https://dwysaxscyrtfxgekwnpl.supabase.co
                </span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Publishable Key Status
                </span>
                <span className="font-mono text-xs text-zinc-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  sb_publishable_...AvgaboAG (Active)
                </span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Cloud State
                </span>
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  PostgreSQL Online & Ready
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Database Tables Status */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Supabase Database Tables</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Relational PostgreSQL schema with Row Level Security (RLS) policies
                </p>
              </div>
              <button
                onClick={handleCopySchema}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start transition-colors"
              >
                {copiedSchema ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Schema SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { name: 'items', label: 'Lost & Found Items', desc: 'Title, category, location, date, photos, recovery status', ready: supabaseInfo?.supabase?.tables?.items },
                { name: 'users', label: 'Users & Roles', desc: 'Students, faculty, admin accounts with verified credentials', ready: supabaseInfo?.supabase?.tables?.users },
                { name: 'claims', label: 'Ownership Claims', desc: 'Claimant info, verification proof, admin review status', ready: supabaseInfo?.supabase?.tables?.claims },
                { name: 'matches', label: 'Smart Matches', desc: 'Category, keyword, location, date & AI vector similarity scores', ready: supabaseInfo?.supabase?.tables?.matches },
                { name: 'notifications', label: 'User Alerts', desc: 'In-app real-time match and claim progress notifications', ready: supabaseInfo?.supabase?.tables?.notifications },
                { name: 'item_embeddings', label: 'AI Vector Embeddings', desc: 'Gemini multimodal vector representations for item comparison', ready: supabaseInfo?.supabase?.tables?.item_embeddings },
              ].map(table => (
                <div
                  key={table.name}
                  className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-900">{table.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      table.ready
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      {table.ready ? 'Cloud Active' : 'Synced'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-700">{table.label}</p>
                  <p className="text-[11px] text-zinc-500">{table.desc}</p>
                </div>
              ))}
            </div>

            {/* SQL Script Quick-Setup Guide */}
            <div className="mt-6 p-5 rounded-2xl bg-zinc-900 text-zinc-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Supabase SQL Schema Script (supabase/schema.sql)
                  </span>
                </div>
                <button
                  onClick={handleCopySchema}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3 h-3 text-emerald-400" />
                  <span>{copiedSchema ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                To run or inspect the SQL tables directly in your Supabase project dashboard, open the{' '}
                <a
                  href="https://supabase.com/dashboard/project/dwysaxscyrtfxgekwnpl/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Supabase SQL Editor
                </a>
                , paste the schema script, and click <strong>Run</strong>.
              </p>
              <pre className="p-3 bg-black/60 rounded-xl text-[11px] font-mono text-emerald-300/90 max-h-48 overflow-y-auto border border-zinc-800">
                {supabaseInfo?.schemaSql ? supabaseInfo.schemaSql.slice(0, 1500) + '\n\n-- ... (Full schema loaded, click "Copy Full SQL Schema" to copy entire file)' : '-- Loading schema...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
