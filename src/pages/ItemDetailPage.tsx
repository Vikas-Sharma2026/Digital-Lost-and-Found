import React, { useEffect, useState } from 'react';
import { Item, MatchResult, ItemStatus, CATEGORIES } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ClaimModal } from '../components/ClaimModal';
import { MatchCard } from '../components/MatchCard';
import {
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Trash2,
  AlertCircle,
  HelpCircle,
  Gift,
  Edit3,
  X,
  Upload,
  Loader2,
  Clock
} from 'lucide-react';

interface ItemDetailPageProps {
  itemId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({ itemId, onNavigate }) => {
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
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

  const loadItemData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemRes, matchRes] = await Promise.all([
        api.getItemById(itemId),
        api.getItemMatches(itemId).catch(() => ({ matches: [] })),
      ]);
      setItem(itemRes.item);
      setMatches(matchRes.matches || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      loadItemData();
    }
  }, [itemId]);

  const handleOpenEdit = () => {
    if (!item) return;
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
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setSavingEdit(true);
    try {
      await api.updateItem(item.id, {
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

      setActionSuccess('Item details updated successfully!');
      setIsEditing(false);
      loadItemData();
    } catch (err: any) {
      alert(err.message || 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!item) return;
    try {
      await api.updateItemStatus(item.id, newStatus);
      setActionSuccess(`Status updated to ${newStatus}`);
      loadItemData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Are you sure you want to permanently delete the report for "${item.title}"?`)) {
      return;
    }
    try {
      await api.deleteItem(item.id);
      onNavigate(user?.role === 'admin' ? 'admin-items' : 'my-reports');
    } catch (err: any) {
      setError(err.message || 'Failed to delete item report');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="h-96 bg-zinc-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto py-16 text-center px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Item Not Found</h2>
        <p className="text-sm text-zinc-600 mb-4">{error || 'The requested item report does not exist in the database.'}</p>
        <button
          onClick={() => onNavigate('lost-items')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const isReporter = user?.id === item.reportedBy;
  const isAdmin = user?.role === 'admin';
  const canManage = isReporter || isAdmin;
  const isAvailableForClaim = (item.status === 'open' || item.status === 'active') && !isReporter;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate(item.type === 'lost' ? 'lost-items' : 'found-items')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {item.type === 'lost' ? 'Lost Items' : 'Found Items'}</span>
      </button>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-sm text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold text-base">×</button>
        </div>
      )}

      {/* Main Item Detail Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left: Image / Visual */}
        <div className="md:col-span-5 bg-zinc-100 relative min-h-[320px] flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover max-h-[480px]"
            />
          ) : (
            <div className="p-8 text-center text-zinc-400">
              <span className="text-6xl block mb-2">
                {item.category === 'Electronics' && '📱'}
                {item.category === 'Documents & ID' && '🪪'}
                {item.category === 'Wallets & Bags' && '🎒'}
                {item.category === 'Keys' && '🔑'}
                {item.category === 'Accessories' && '👓'}
                {item.category === 'Books & Stationery' && '📚'}
                {item.category === 'Clothing' && '👕'}
                {item.category === 'Other' && '📦'}
              </span>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {item.category}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">No reference image uploaded</p>
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <StatusBadge type={item.type} size="md" />
            <StatusBadge status={item.status} size="md" />
          </div>
        </div>

        {/* Right: Item info & actions */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-semibold border border-zinc-200">
                {item.category}
              </span>
              <span className="text-xs text-zinc-400">
                Reported {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-tight">
              {item.title}
            </h1>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </div>

            {/* Reward banner if lost */}
            {item.rewardInfo && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Finder Reward Offered: </span>
                  <span>{item.rewardInfo}</span>
                </div>
              </div>
            )}

            {/* Storage location if found */}
            {item.storageLocation && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] block text-emerald-700">
                  Current Storage Location:
                </span>
                <p className="font-medium text-sm">{item.storageLocation}</p>
              </div>
            )}

            {/* Security Question info if present */}
            {item.securityQuestion && (
              <div className="p-3.5 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs text-zinc-800">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-1">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Verification Question for Claimant:</span>
                </div>
                <p className="italic">"{item.securityQuestion}"</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Claimants answer this question to verify ownership.
                </p>
              </div>
            )}

            {/* Metadata list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-600">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Campus Area</span>
                  <span className="font-medium text-zinc-900 truncate block">{item.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Date & Time</span>
                  <span className="font-medium text-zinc-900 block">
                    {(item as any).date || item.dateTime?.slice(0, 10)} {((item as any).time || item.dateTime?.slice(11, 16)) ? `at ${(item as any).time || item.dateTime?.slice(11, 16)}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                Reporter Information
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span>{item.reporterName}</span>
                </div>
                {item.contactPhone && (
                  <div className="flex items-center gap-1.5 text-zinc-700">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{item.contactPhone}</span>
                  </div>
                )}
                {item.contactEmail && (
                  <div className="flex items-center gap-1.5 text-zinc-700">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{item.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            {isAvailableForClaim && (
              <button
                onClick={() => {
                  if (!user) {
                    onNavigate('login');
                  } else {
                    setClaimModalOpen(true);
                  }
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Claim Item</span>
              </button>
            )}

            {isAdmin && item.status !== 'returned' && (
              <button
                onClick={async () => {
                  if (!confirm(`Mark "${item.title}" as officially Returned?`)) return;
                  try {
                    await api.adminMarkItemReturned(item.id);
                    setActionSuccess('Item successfully marked as Returned.');
                    loadItemData();
                  } catch (e: any) {
                    setError(e.message || 'Failed to update return status');
                  }
                }}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark as Returned</span>
              </button>
            )}

            {canManage && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-300 bg-white text-zinc-800"
                >
                  <option value="open">Status: Open</option>
                  <option value="matched">Status: Matched</option>
                  <option value="claimed">Status: Claimed</option>
                  <option value="returned">Status: Returned</option>
                  <option value="closed">Status: Closed</option>
                </select>

                <button
                  onClick={handleOpenEdit}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Potential Matches for this item */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Potential Matches for this Item ({matches.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Computed by multimodal AI vector embeddings (40% image), campus location (25%), date delta (20%), and description (15%).
            </p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200 text-zinc-500 text-xs sm:text-sm">
            No high-confidence matches found in the system right now. When a candidate {item.type === 'lost' ? 'found' : 'lost'} item is submitted, it will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(m => (
              <MatchCard
                key={m.item.id}
                match={m}
                sourceItem={item}
                onViewDetails={id => onNavigate('item-details', { id })}
                onClaim={() => {
                  setItem(m.item);
                  setClaimModalOpen(true);
                }}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimModalOpen && (
        <ClaimModal
          item={item}
          isOpen={true}
          onClose={() => setClaimModalOpen(false)}
          onClaimSuccess={() => {
            loadItemData();
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-zinc-900">Edit Item Report</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
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
              {item.type === 'lost' ? (
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

              {/* Image preview / upload */}
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
                  onClick={() => setIsEditing(false)}
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
