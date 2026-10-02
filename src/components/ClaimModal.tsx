import React, { useState } from 'react';
import { Item } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Upload, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface ClaimModalProps {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  isOpen,
  onClose,
  onClaimSuccess,
}) => {
  const { user } = useAuth();
  const [proofDetails, setProofDetails] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [proofImage, setProofImage] = useState<string>('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Proof image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit an ownership claim.');
      return;
    }

    if (proofDetails.trim().length < 10) {
      setError('Please describe specific proof of ownership in detail (at least 10 characters).');
      return;
    }

    let finalProof = proofDetails.trim();
    if (item.securityQuestion && securityAnswer) {
      finalProof += `\n[Security Answer]: ${securityAnswer.trim()}`;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.submitClaim({
        itemId: item.id,
        proofDetails: finalProof,
        proofImageUrl: proofImage,
        contactPhone: phone,
      });

      setSuccess(true);
      setTimeout(() => {
        onClaimSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base sm:text-lg">Submit Ownership Claim</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Target Item summary banner */}
          <div className="mb-5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-zinc-200"
              />
            ) : (
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs text-center shrink-0 border border-indigo-100">
                {item.category.slice(0, 4)}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                Claiming {item.type === 'found' ? 'Found Item' : 'Lost Item Report'}
              </span>
              <h4 className="font-medium text-zinc-900 truncate text-sm sm:text-base">{item.title}</h4>
              <p className="text-xs text-zinc-500 truncate">Location: {item.location}</p>
            </div>
          </div>

          {success ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mb-1">Claim Submitted!</h4>
              <p className="text-sm text-zinc-600">
                Your claim has been recorded and submitted to Campus Admin for verification. You can track progress in "My Claims".
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-sm text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {item.securityQuestion && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                    Security Verification Question from Finder:
                  </label>
                  <p className="text-sm font-medium text-amber-950 mb-2">{item.securityQuestion}</p>
                  <input
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    placeholder="Enter your specific answer..."
                    className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Detailed Ownership Proof <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={proofDetails}
                  onChange={e => setProofDetails(e.target.value)}
                  placeholder="Describe unique identifying features, serial number, scratch marks, phone lockscreen image, internal contents, purchase bill info, or ID proof..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Admins verify these details against the physical item before handing it over.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Contact Phone Number for Verification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Attach Supporting Photo / Bill / ID (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium transition-colors border border-zinc-300">
                    <Upload className="w-4 h-4 text-zinc-600" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {proofImage && (
                    <div className="flex items-center gap-2">
                      <img
                        src={proofImage}
                        alt="Proof preview"
                        className="w-9 h-9 object-cover rounded-md border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => setProofImage('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim for Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
