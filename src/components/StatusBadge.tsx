import React from 'react';
import { ItemStatus, ClaimStatus, ItemType } from '../types';

interface StatusBadgeProps {
  status?: ItemStatus | ClaimStatus;
  type?: ItemType;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  if (type) {
    if (type === 'lost') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          Lost Item
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Found Item
      </span>
    );
  }

  switch (status) {
    case 'open':
    case 'active':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Open
        </span>
      );
    case 'matched':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Matched
        </span>
      );
    case 'claimed':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Claim Under Review
        </span>
      );
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Claim Verified
        </span>
      );
    case 'returned':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Returned to Owner
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending Verification
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          Rejected
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 ${sizeClasses}`}>
          Closed
        </span>
      );
    default:
      return null;
  }
};
