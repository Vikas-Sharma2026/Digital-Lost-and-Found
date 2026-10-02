import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Claim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, AlertCircle, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface MyClaimsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyClaimsPage: React.FC<MyClaimsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getMyClaims();
      setClaims(res.claims);
    } catch (err) {
      console.error('Failed to load my claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Student Session Required</h2>
        <p className="text-sm text-zinc-600 mb-4">Please log in to track your ownership claims.</p>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">My Ownership Claims</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Monitor verification status for claims you submitted on discovered campus property.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
          <ShieldCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 text-base mb-1">No Claims Submitted Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            If you see an item in the Found Items Directory that belongs to you, click "Claim This" to initiate verification.
          </p>
          <button
            onClick={() => onNavigate('found-items')}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl"
          >
            Browse Found Items
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {claims.map(claim => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4"
            >
              {/* Claim Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Claim ID: {claim.id} • Submitted {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                  <h3
                    onClick={() => onNavigate('item-details', { id: claim.itemId })}
                    className="font-bold text-base sm:text-lg text-zinc-900 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 mt-0.5"
                  >
                    <span>{claim.itemTitle}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </h3>
                </div>
                <StatusBadge status={claim.status} size="md" />
              </div>

              {/* Proof Details Preview */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-xs font-semibold text-zinc-700 block">
                  Your Submitted Ownership Proof:
                </span>
                <p className="text-xs text-zinc-600 whitespace-pre-line leading-relaxed">
                  {claim.proofDetails}
                </p>
                {claim.proofImageUrl && (
                  <div className="pt-2">
                    <img
                      src={claim.proofImageUrl}
                      alt="Proof document"
                      className="w-20 h-20 object-cover rounded-lg border border-zinc-200"
                    />
                  </div>
                )}
              </div>

              {/* Status Feedback from Admin */}
              {claim.status === 'verified' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-950">Claim Approved by Campus Admin!</p>
                    <p className="mt-1">
                      {claim.adminRemarks ||
                        'Please visit Gate 1 Main Security Office with your physical college ID card to collect your item.'}
                    </p>
                    {claim.verifiedBy && (
                      <p className="text-[10px] text-emerald-700 mt-1">
                        Verified by: {claim.verifiedBy} on{' '}
                        {claim.verifiedAt ? new Date(claim.verifiedAt).toLocaleDateString() : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {claim.status === 'pending' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your claim is currently in queue for review by the campus lost & found administrator.
                  </span>
                </div>
              )}

              {claim.status === 'rejected' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-rose-950">Claim Verification Inconclusive</p>
                    <p className="mt-1">
                      {claim.adminRemarks ||
                        'The proof details provided did not sufficiently match the physical item. Please contact Security Desk Gate 1 for manual review.'}
                    </p>
                  </div>
                </div>
              )}

              {claim.status === 'returned' && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Item officially returned and handed over to you. Case closed.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
