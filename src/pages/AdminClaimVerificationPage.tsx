import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Claim, ClaimStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Package,
  User,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface AdminClaimVerificationPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminClaimVerificationPage: React.FC<AdminClaimVerificationPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'verified' | 'returned' | 'rejected'>('all');
  const [actionClaim, setActionClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<'verified' | 'rejected' | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.getAllClaims();
      setClaims(res.claims);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleOpenActionModal = (claim: Claim, type: 'verified' | 'rejected') => {
    setActionClaim(claim);
    setActionType(type);
    setAdminRemarks(
      type === 'verified'
        ? 'Proof verified against physical device. Owner may collect item from Gate 1 Security Counter between 9am-5pm with Student ID card.'
        : 'Proof submitted lacks specific distinguishing marks or serial number match.'
    );
  };

  const handleConfirmVerification = async () => {
    if (!actionClaim || !actionType) return;
    setProcessing(true);
    try {
      await api.verifyClaim(actionClaim.id, actionType, adminRemarks);
      setFeedback(
        actionType === 'verified'
          ? `Claim approved! Item "${actionClaim.itemTitle}" has been marked as Returned and notifications dispatched to all relevant users.`
          : `Claim for "${actionClaim.itemTitle}" has been marked as Rejected.`
      );
      setActionClaim(null);
      setActionType(null);
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkReturned = async (claimId: string) => {
    if (!confirm('Confirm physical handover to the verified claimant? This marks item and claim as Returned.')) {
      return;
    }
    try {
      await api.markClaimReturned(claimId);
      setFeedback('Item and claim successfully marked as Returned!');
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Failed to update return state');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
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

  const filteredClaims = claims.filter(c =>
    selectedFilter === 'all' ? true : c.status === selectedFilter
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
              Claim Verification Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Carefully verify claimant's described proof of ownership against the item before releasing it.
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-dashboard')}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
        >
          ← Return to Dashboard
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-base">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 text-xs">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          All Claims ({claims.length})
        </button>
        <button
          onClick={() => setSelectedFilter('pending')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          Pending Review ({claims.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setSelectedFilter('verified')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'verified'
              ? 'bg-indigo-600 text-white'
              : 'text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          Approved & Awaiting Pickup ({claims.filter(c => c.status === 'verified').length})
        </button>
        <button
          onClick={() => setSelectedFilter('returned')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            selectedFilter === 'returned'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          Handed Over ({claims.filter(c => c.status === 'returned').length})
        </button>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-sm text-zinc-500">
          No claims in this category.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredClaims.map(claim => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4"
            >
              {/* Claim Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Claim #{claim.id}</span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(claim.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 mt-0.5 flex items-center gap-2">
                    <span>{claim.itemTitle}</span>
                    <button
                      onClick={() => onNavigate('item-details', { id: claim.itemId })}
                      className="text-xs font-normal text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>(View Item Report)</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </h3>
                </div>
                <StatusBadge status={claim.status} size="md" />
              </div>

              {/* Claimant Details & Submitted Proof */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left: Claimant Info */}
                <div className="md:col-span-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Claimant Profile
                  </span>
                  <div className="flex items-center gap-2 font-bold text-zinc-900">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{claim.claimantName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{claim.claimantEmail}</span>
                  </div>
                  {claim.claimantPhone && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{claim.claimantPhone}</span>
                    </div>
                  )}
                </div>

                {/* Right: Ownership Proof Statement */}
                <div className="md:col-span-8 p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Claimant's Proof of Ownership Statement
                  </span>
                  <p className="text-xs text-zinc-800 whitespace-pre-line leading-relaxed">
                    {claim.proofDetails}
                  </p>
                  {claim.proofImageUrl && (
                    <div className="pt-2">
                      <span className="text-[10px] font-semibold text-zinc-500 block mb-1">
                        Attached Supporting Proof:
                      </span>
                      <img
                        src={claim.proofImageUrl}
                        alt="Proof"
                        className="w-24 h-24 object-cover rounded-lg border border-zinc-200 shadow-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Current Remarks & Audit trail */}
              {claim.adminRemarks && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  <span className="font-bold">Officer Remarks:</span> {claim.adminRemarks}
                  {claim.verifiedBy && (
                    <span className="block text-[10px] text-indigo-700/80 mt-0.5">
                      Reviewed by: {claim.verifiedBy}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                {claim.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleOpenActionModal(claim, 'rejected')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Claim</span>
                    </button>
                    <button
                      onClick={() => handleOpenActionModal(claim, 'verified')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Claim & Notify Student</span>
                    </button>
                  </>
                )}

                {claim.status === 'verified' && (
                  <button
                    onClick={() => handleMarkReturned(claim.id)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Complete Handover & Mark Returned</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Verification Modal */}
      {actionClaim && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-lg text-zinc-900">
              {actionType === 'verified' ? 'Approve Ownership Claim' : 'Reject Ownership Claim'}
            </h3>
            <p className="text-xs text-zinc-500">
              Target item: <strong>{actionClaim.itemTitle}</strong> for claimant{' '}
              <strong>{actionClaim.claimantName}</strong>
            </p>

            {actionType === 'verified' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Workflow Notice:</strong> Approving this claim will update the item status to <strong>Returned</strong> and send real-time notifications to both the claimant and the original reporter.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Official Remarks & Instructions for Claimant
              </label>
              <textarea
                rows={3}
                value={adminRemarks}
                onChange={e => setAdminRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionClaim(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmVerification}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs disabled:opacity-50 ${
                  actionType === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processing
                  ? 'Processing...'
                  : actionType === 'verified'
                  ? 'Confirm Approval (Mark Item as Returned)'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
