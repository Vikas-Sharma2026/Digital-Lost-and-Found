import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item, Claim, UserMatchGroup } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  PlusCircle,
  Sparkles,
  FileText,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [matchGroups, setMatchGroups] = useState<UserMatchGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const [itemsRes, claimsRes, matchesRes] = await Promise.all([
          api.getItems({ user: user.id }),
          api.getMyClaims(),
          api.getUserMatches(),
        ]);
        setMyItems(itemsRes.items);
        setMyClaims(claimsRes.claims);
        setMatchGroups(matchesRes.groups);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Student Session Required</h2>
        <p className="text-sm text-zinc-600 mb-4">Please log in to access your student dashboard.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const lostCount = myItems.filter(i => i.type === 'lost' && i.status === 'active').length;
  const foundCount = myItems.filter(i => i.type === 'found' && i.status === 'active').length;
  const pendingClaims = myClaims.filter(c => c.status === 'pending').length;
  const verifiedClaims = myClaims.filter(c => c.status === 'verified').length;
  const totalMatches = matchGroups.reduce((acc, curr) => acc + curr.matches.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">
            Student Recovery Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Hello, {user.name}!</h1>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Roll / ID: <span className="font-semibold text-white">{user.collegeId}</span> • Dept:{' '}
            <span className="text-zinc-200">{user.department}</span>
          </p>
        </div>

        {/* Quick Report CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('report-lost')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost Item</span>
          </button>
          <button
            onClick={() => onNavigate('report-found')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('my-reports')}
          className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Lost Items</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          </div>
          <p className="text-3xl font-black text-zinc-900 group-hover:text-rose-600 transition-colors">
            {lostCount}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Currently listed as active</p>
        </div>

        <div
          onClick={() => onNavigate('my-reports')}
          className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Found Reports</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-3xl font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">
            {foundCount}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Found items you submitted</p>
        </div>

        <div
          onClick={() => onNavigate('my-claims')}
          className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Claims</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-zinc-900 group-hover:text-amber-600 transition-colors">
            {myClaims.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {pendingClaims} pending • {verifiedClaims} verified
          </p>
        </div>

        <div
          onClick={() => onNavigate('matches')}
          className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Smart Matches</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-indigo-900 group-hover:text-indigo-600 transition-colors">
            {totalMatches}
          </p>
          <p className="text-xs text-indigo-700/80 mt-1">Algorithmic suggestions</p>
        </div>
      </div>

      {/* Potential Match Alert Card if exists */}
      {totalMatches > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {totalMatches} Potential Item {totalMatches === 1 ? 'Match' : 'Matches'} Found!
              </h3>
              <p className="text-xs text-indigo-100">
                Our algorithm detected found items that match your reported lost property.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('matches')}
            className="px-4 py-2 bg-white text-indigo-900 rounded-xl text-xs font-bold shrink-0 hover:bg-indigo-50 transition-colors shadow-xs"
          >
            Review Matches
          </button>
        </div>
      )}

      {/* Two columns: Recent Reports & Active Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent reports */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-700" />
              <h2 className="text-lg font-bold text-zinc-900">My Reports</h2>
            </div>
            <button
              onClick={() => onNavigate('my-reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : myItems.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              You haven't reported any lost or found items yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myItems.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('item-details', { id: item.id })}
                  className="p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-500 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200">
                        {item.category.slice(0, 3)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge type={item.type} />
                        <StatusBadge status={item.status} />
                      </div>
                      <h4 className="font-semibold text-zinc-900 text-sm truncate mt-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: My Claims Tracker */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-zinc-700" />
              <h2 className="text-lg font-bold text-zinc-900">My Ownership Claims</h2>
            </div>
            <button
              onClick={() => onNavigate('my-claims')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : myClaims.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              You haven't submitted any ownership claims yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.slice(0, 4).map(claim => (
                <div
                  key={claim.id}
                  onClick={() => onNavigate('my-claims')}
                  className="p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-zinc-900 text-sm truncate">
                      {claim.itemTitle}
                    </h4>
                    <StatusBadge status={claim.status} />
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-1">
                    Proof: {claim.proofDetails}
                  </p>
                  {claim.adminRemarks && (
                    <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                      <span className="font-bold">Admin note:</span> {claim.adminRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
