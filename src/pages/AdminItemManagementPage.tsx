import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item, CATEGORIES, CAMPUS_LOCATIONS } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Layers,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Eye,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Flag,
  Copy,
  XCircle,
  CheckCircle2
} from 'lucide-react';

interface AdminItemManagementPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminItemManagementPage: React.FC<AdminItemManagementPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Moderation Modal state
  const [moderatingItem, setModeratingItem] = useState<Item | null>(null);
  const [modAction, setModAction] = useState<'duplicate' | 'inappropriate'>('duplicate');
  const [modReason, setModReason] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getItems({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        q: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load admin items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await api.updateItemStatus(itemId, newStatus);
      setActionMessage(`Item status updated to ${newStatus}`);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleMarkReturned = async (itemId: string, title: string) => {
    if (!confirm(`Confirm physical return of "${title}" to verified student owner?`)) return;
    try {
      await api.adminMarkItemReturned(itemId);
      setActionMessage(`Item "${title}" successfully marked as Returned!`);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to mark item returned');
    }
  };

  const handleOpenModeration = (item: Item, action: 'duplicate' | 'inappropriate') => {
    setModeratingItem(item);
    setModAction(action);
    setModReason(
      action === 'duplicate'
        ? 'Duplicate submission already posted in campus directory.'
        : 'Inappropriate details or suspected non-genuine campus listing.'
    );
  };

  const handleConfirmModeration = async () => {
    if (!moderatingItem) return;
    setModSubmitting(true);
    try {
      await api.adminModerateItem(moderatingItem.id, modAction, modReason);
      setActionMessage(
        modAction === 'duplicate'
          ? `Report "${moderatingItem.title}" marked as duplicate and closed.`
          : `Report "${moderatingItem.title}" flagged as inappropriate and closed.`
      );
      setModeratingItem(null);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Moderation action failed');
    } finally {
      setModSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently remove the report "${title}" from the campus directory?`)) {
      return;
    }
    try {
      await api.adminDeleteItem(itemId);
      setActionMessage(`Item "${title}" successfully deleted.`);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Admin Clearance Required</h2>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          Switch to Admin Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
            Admin Item Management & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Supervise all reports, mark items returned, or handle duplicate / inappropriate submissions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
        >
          ← Return to Dashboard
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold text-base">×</button>
        </div>
      )}

      {/* Filter and Search Box */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by title, reporter name, contact info, or location..."
              className="w-full pl-10 pr-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <div className="flex bg-zinc-100 p-0.5 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-medium ${
                typeFilter === 'all' ? 'bg-white shadow-xs font-bold text-zinc-900' : 'text-zinc-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('lost')}
              className={`px-3 py-1 rounded-md font-medium ${
                typeFilter === 'lost' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-rose-700'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setTypeFilter('found')}
              className={`px-3 py-1 rounded-md font-medium ${
                typeFilter === 'found' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-700'
              }`}
            >
              Found
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-zinc-300 rounded-lg bg-white text-zinc-800"
          >
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="claimed">Claimed</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed / Moderated</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-zinc-300 rounded-lg bg-white text-zinc-800"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <span className="text-zinc-400 ml-auto">Showing: {items.length} items</span>
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-sm text-zinc-500">
          No reports match the current criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-4">Item Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Campus Location</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-400 shrink-0 border border-zinc-200">
                            {item.category.slice(0, 3)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <StatusBadge type={item.type} />
                          </div>
                          <span
                            onClick={() => onNavigate('item-details', { id: item.id })}
                            className="font-bold text-zinc-900 hover:text-indigo-600 cursor-pointer block truncate max-w-xs"
                          >
                            {item.title}
                          </span>
                          <span className="text-[10px] text-zinc-400">ID: {item.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-zinc-100 rounded text-zinc-700 font-medium">
                        {item.category}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs truncate">{item.location}</td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 block">{item.reporterName}</span>
                      <span className="text-[10px] text-zinc-400 block">{item.contactEmail}</span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="active">Active</option>
                        <option value="claimed">Claimed</option>
                        <option value="returned">Returned</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                      {/* Mark Returned Button */}
                      {item.status !== 'returned' && (
                        <button
                          onClick={() => handleMarkReturned(item.id, item.title)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                          title="Mark Returned directly"
                        >
                          Mark Returned
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        onClick={() => onNavigate('item-details', { id: item.id })}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        title="View item details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Duplicate Moderation */}
                      <button
                        onClick={() => handleOpenModeration(item, 'duplicate')}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                        title="Handle Duplicate Report"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Inappropriate Moderation */}
                      <button
                        onClick={() => handleOpenModeration(item, 'inappropriate')}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                        title="Flag Inappropriate Content"
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-500"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {moderatingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
              {modAction === 'duplicate' ? (
                <>
                  <Copy className="w-5 h-5 text-amber-600" />
                  <span>Handle Duplicate Report</span>
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5 text-rose-600" />
                  <span>Moderate Inappropriate Content</span>
                </>
              )}
            </h3>

            <p className="text-xs text-zinc-600">
              Report Title: <strong>{moderatingItem.title}</strong> reported by{' '}
              <strong>{moderatingItem.reporterName}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Moderation Action Reason & Notification to Student
              </label>
              <textarea
                rows={3}
                value={modReason}
                onChange={e => setModReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {modAction === 'duplicate'
                  ? 'This report will be tagged [Duplicate], closed, and the student will be notified.'
                  : 'This report will be hidden from public search, marked closed, and the student will receive a campus guideline notification.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModeratingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modSubmitting}
                onClick={handleConfirmModeration}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs disabled:opacity-50 ${
                  modAction === 'duplicate'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {modSubmitting ? 'Moderating...' : `Confirm ${modAction === 'duplicate' ? 'Duplicate Action' : 'Content Moderation'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
