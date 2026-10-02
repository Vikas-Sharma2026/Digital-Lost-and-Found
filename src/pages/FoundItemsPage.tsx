import React, { useEffect, useState } from 'react';
import { Item, CATEGORIES, CAMPUS_LOCATIONS } from '../types';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { ClaimModal } from '../components/ClaimModal';
import { Search, Filter, PlusCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface FoundItemsPageProps {
  onNavigate: (page: string, params?: any) => void;
  currentUserId?: string;
}

export const FoundItemsPage: React.FC<FoundItemsPageProps> = ({ onNavigate, currentUserId }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedClaimItem, setSelectedClaimItem] = useState<Item | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getItems({
        type: 'found',
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        location: selectedLocation !== 'All' ? selectedLocation : undefined,
        q: search.trim() || undefined,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Failed to fetch found items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Found Items Directory</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Browse discovered items deposited at campus security counters or held safely by fellow students.
          </p>
        </div>

        <button
          onClick={() => onNavigate('report-found')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report a Found Item</span>
        </button>
      </div>

      {/* Security Tip Box */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4 text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Found your item here?</strong> Click "Claim This" to provide unique proof of ownership (serial number, lockscreen, or answer the security question). Admin will verify before release.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by keywords: 'Water bottle', 'Library', 'Calculator'..."
              className="w-full pl-10 pr-3.5 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Category:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="ml-auto w-full sm:w-auto">
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full sm:w-48 px-3 py-1 text-xs border border-zinc-300 rounded-lg text-zinc-700 bg-white"
            >
              <option value="All">All Campus Locations</option>
              {CAMPUS_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Item Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-72 bg-zinc-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
          <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 text-base mb-1">No Found Items Match</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            No active found items match your filter. Check back soon or submit a lost item report so you get notified when it is turned in.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedLocation('All');
              setSearch('');
            }}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
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

      {/* Claim modal if opened */}
      {selectedClaimItem && (
        <ClaimModal
          item={selectedClaimItem}
          isOpen={true}
          onClose={() => setSelectedClaimItem(null)}
          onClaimSuccess={() => fetchItems()}
        />
      )}
    </div>
  );
};
