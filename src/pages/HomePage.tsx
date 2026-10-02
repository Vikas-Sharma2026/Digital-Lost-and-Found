import React, { useEffect, useState } from 'react';
import { Item } from '../types';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { ClaimModal } from '../components/ClaimModal';
import {
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
  currentUserId?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, currentUserId }) => {
  const [recentLost, setRecentLost] = useState<Item[]>([]);
  const [recentFound, setRecentFound] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClaimItem, setSelectedClaimItem] = useState<Item | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lostRes, foundRes] = await Promise.all([
          api.getItems({ type: 'lost', status: 'active' }),
          api.getItems({ type: 'found', status: 'active' }),
        ]);
        setRecentLost(lostRes.items.slice(0, 3));
        setRecentFound(foundRes.items.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', { q: searchQuery.trim() });
    } else {
      onNavigate('search');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-zinc-900 to-zinc-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 rounded-3xl mt-4 max-w-7xl mx-auto shadow-2xl">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Smart College Campus Lost & Found System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-none">
            Lost Something on Campus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-emerald-300 to-sky-300">
              We Help You Find It.
            </span>
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report lost possessions, log discovered items, view automated match predictions, and submit verified ownership claims with campus security verification.
          </p>

          {/* Quick Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 max-w-xl mx-auto bg-white/95 p-2 rounded-2xl shadow-xl border border-white/20 text-zinc-900"
          >
            <Search className="w-5 h-5 text-zinc-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by item title, ID card, location (e.g. AirPods, Library)..."
              className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none text-zinc-900 placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('report-lost')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-900/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Lost Item</span>
            </button>
            <button
              onClick={() => onNavigate('report-found')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-900/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Found Item</span>
            </button>
            <button
              onClick={() => onNavigate('matches')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>Explore Matches</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Campus Reports</p>
            <h3 className="text-2xl font-black text-zinc-900 mt-1">100% Real</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Live database synchronized</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Item Recovery</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Verified</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Security claim review</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Match Engine</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">Algorithmic</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Location & keyword match</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Campus Desks</p>
            <h3 className="text-2xl font-black text-zinc-900 mt-1">Gate 1 & Library</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Official pickup counters</p>
          </div>
        </div>
      </section>

      {/* How it Works workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-zinc-900">How Campus Recovery Works</h2>
          <p className="text-sm text-zinc-500 mt-1">A transparent 4-step process to recover lost belongings quickly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center mb-4 text-base border border-rose-100">
              1
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Submit Report</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Fill in item details, campus location, upload photo, and select date & time when lost or found.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center mb-4 text-base border border-indigo-100">
              2
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Automated Matching</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              The matching engine compares titles, categories, campus areas, and timelines to find matches.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-bold flex items-center justify-center mb-4 text-base border border-amber-100">
              3
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Submit Proof Claim</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Provide unique identifying marks, serial numbers, wallpapers, or answer the finder's security question.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center mb-4 text-base border border-emerald-100">
              4
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Admin Verification</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Security officers verify ownership credentials before safely handing over the item at Gate 1.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Found Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Recently Found Items</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Found something that looks like yours? Submit an ownership claim.</p>
          </div>
          <button
            onClick={() => onNavigate('found-items')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>View All Found Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : recentFound.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-500 text-sm">
            No active found items reported yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentFound.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={id => onNavigate('item-details', { id })}
                onViewMatches={id => onNavigate('matches', { itemId: id })}
                onClaim={itemToClaim => setSelectedClaimItem(itemToClaim)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Lost Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Active Lost Reports</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Keep an eye out for these items reported lost by classmates.</p>
          </div>
          <button
            onClick={() => onNavigate('lost-items')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            <span>View All Lost Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : recentLost.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-500 text-sm">
            No active lost items reported.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentLost.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={id => onNavigate('item-details', { id })}
                onViewMatches={id => onNavigate('matches', { itemId: id })}
                onClaim={itemToClaim => setSelectedClaimItem(itemToClaim)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Claim Modal if active */}
      {selectedClaimItem && (
        <ClaimModal
          item={selectedClaimItem}
          isOpen={true}
          onClose={() => setSelectedClaimItem(null)}
          onClaimSuccess={() => {
            // refresh
          }}
        />
      )}
    </div>
  );
};
