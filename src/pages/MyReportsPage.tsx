import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item, ItemStatus, CATEGORIES, CAMPUS_LOCATIONS } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  PlusCircle,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle,
  Trash2,
  AlertCircle,
  ArrowRight,
  Edit3,
  X,
  Upload,
  Loader2,
  Clock
} from 'lucide-react';

interface MyReportsPageProps {
  highlightId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({ highlightId, onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editStatus, setEditStatus] = useState<ItemStatus>('open');
  const [editRewardInfo, setEditRewardInfo] = useState('');
  const [editStorageLocation, setEditStorageLocation] = useState('');
  const [editSecurityQuestion, setEditSecurityQuestion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMyItems = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getItems({
        user: user.id,
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      setItems(res.items);
    } catch (err: any) {
      console.error('Failed to load my reports:', err);
      setErrorMessage(err.message || 'Failed to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, [user, filterType, filterStatus]);

  // Open Edit Modal
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditLocation(item.location);
    const datePart = (item as any).date || item.dateTime?.slice(0, 10) || '';
    const timePart = (item as any).time || item.dateTime?.slice(11, 16) || '12:00';
    setEditDate(datePart);
    setEditTime(timePart);
    setEditImageUrl(item.imageUrl || '');
    setEditStatus(item.status);
    setEditRewardInfo(item.rewardInfo || '');
    setEditStorageLocation(item.storageLocation || '');
    setEditSecurityQuestion(item.securityQuestion || '');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Please provide title and description.');
      return;
    }

    setSavingEdit(true);
    try {
      await api.updateItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory,
        description: editDescription.trim(),
        location: editLocation.trim(),
        date: editDate,
        time: editTime,
        dateTime: `${editDate}T${editTime}`,
        imageUrl: editImageUrl,
        status: editStatus,
        rewardInfo: editRewardInfo.trim() || undefined,
        storageLocation: editStorageLocation.trim() || undefined,
        securityQuestion: editSecurityQuestion.trim() || undefined,
      });

      setMessage(`Report "${editTitle}" updated successfully!`);
      setEditingItem(null);
      fetchMyItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update report.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateItemStatus(id, newStatus);
      setMessage(`Item marked as ${newStatus}!`);
      fetchMyItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Delete Report
  const handleDelete = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete your report for "${item.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteItem(item.id);
      setMessage(`Report "${item.title}" has been deleted.`);
      fetchMyItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Student Session Required</h2>
        <p className="text-sm text-zinc-600 mb-4">Please log in to manage your submitted reports.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">My Submitted Reports</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            View, edit, track potential matches, and manage the status of your campus reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('report-lost')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => onNavigate('report-found')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold text-base ml-2">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-base ml-2">×</button>
        </div>
      )}

      {/* Filter Tabs and Status Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'lost' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'found' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Found
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="matched">Matched</option>
            <option value="claimed">Claimed</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Item List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 text-base mb-1">No Reports Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            You don't have any reported items matching this filter.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('report-lost')}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
            >
              Report Lost Item
            </button>
            <button
              onClick={() => onNavigate('report-found')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
            >
              Report Found Item
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const isHighlighted = highlightId === item.id;
            return (
              <div
                key={item.id}
                id={`report-${item.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isHighlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/20'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover border border-zinc-200 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-zinc-100 text-zinc-500 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-zinc-200">
                      <span>{item.category.slice(0, 4)}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-medium">{item.type}</span>
                    </div>
                  )}

                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge type={item.type} />
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-zinc-500">• {item.category}</span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider animate-pulse">
                          Just Created!
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onNavigate('item-details', { id: item.id })}
                      className="font-bold text-zinc-900 text-base hover:text-indigo-600 cursor-pointer truncate"
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-zinc-600 line-clamp-2">{item.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{(item as any).date || item.dateTime?.slice(0, 10)}</span>
                      </span>
                      {(item as any).time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{(item as any).time}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Status Dropdown */}
                  <select
                    value={item.status}
                    onChange={e => handleQuickStatusChange(item.id, e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 bg-white text-zinc-800"
                    title="Change report status"
                  >
                    <option value="open">Status: Open</option>
                    <option value="matched">Status: Matched</option>
                    <option value="claimed">Status: Claimed</option>
                    <option value="returned">Status: Returned</option>
                    <option value="closed">Status: Closed</option>
                  </select>

                  <button
                    onClick={() => onNavigate('matches', { itemId: item.id })}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                    title="View potential matches for this item"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Matches</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1"
                    title="Edit report details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onNavigate('item-details', { id: item.id })}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 text-xs font-semibold"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Report Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-zinc-900">
                  Edit {editingItem.type === 'lost' ? 'Lost Item Report' : 'Found Item Report'}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900 bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as ItemStatus)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900 bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="matched">Matched</option>
                    <option value="claimed">Claimed</option>
                    <option value="returned">Returned</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              {/* Optional details */}
              {editingItem.type === 'lost' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Reward Information
                  </label>
                  <input
                    type="text"
                    value={editRewardInfo}
                    onChange={e => setEditRewardInfo(e.target.value)}
                    placeholder="e.g. Rs. 500 reward"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Current Storage Location
                    </label>
                    <input
                      type="text"
                      value={editStorageLocation}
                      onChange={e => setEditStorageLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Security Verification Question
                    </label>
                    <input
                      type="text"
                      value={editSecurityQuestion}
                      onChange={e => setEditSecurityQuestion(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-xl text-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* Image preview / URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Item Photo
                </label>
                {editImageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={editImageUrl}
                      alt="Item preview"
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-200"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="text-xs text-rose-600 font-semibold hover:underline"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium border border-zinc-300">
                    <Upload className="w-4 h-4 text-zinc-600" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setEditImageUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 shadow-xs flex items-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
