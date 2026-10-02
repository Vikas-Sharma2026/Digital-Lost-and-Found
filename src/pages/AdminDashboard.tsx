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
  CheckSquare
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDashboardData();
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

      {/* Tabs navigation: Overview vs Campus Users Directory */}
      <div className="border-b border-zinc-200 flex items-center gap-4 text-sm font-semibold">
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
    </div>
  );
};
