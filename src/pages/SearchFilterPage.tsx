import React, { useEffect, useState } from 'react';
import { Item, CATEGORIES, CAMPUS_LOCATIONS } from '../types';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { ClaimModal } from '../components/ClaimModal';
import {
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  X,
  Layers,
  Sparkles
} from 'lucide-react';

interface SearchFilterPageProps {
  initialQuery?: string;
  onNavigate: (page: string, params?: any) => void;
  currentUserId?: string;
}

export const SearchFilterPage: React.FC<SearchFilterPageProps> = ({
  initialQuery = '',
  onNavigate,
  currentUserId,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<'all' | 'lost' | 'found'>('all');
  const [category, setCategory] = useState<string>('All');
  const [location, setLocation] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [date, setDate] = useState<string>('');

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimItem, setSelectedClaimItem] = useState<Item | null>(null);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await api.getItems({
        type: type !== 'all' ? type : undefined,
        category: category !== 'All' ? category : undefined,
        location: location !== 'All' ? location : undefined,
        status: status !== 'All' ? status : undefined,
        q: query.trim() || undefined,
        fromDate: date || undefined,
        toDate: date || undefined,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [type, category, location, status, date]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleReset = () => {
    setQuery('');
    setType('all');
    setCategory('All');
    setLocation('All');
    setStatus('All');
    setDate('');
  };

  const hasActiveFilters = Boolean(
    query || type !== 'all' || category !== 'All' || location !== 'All' || status !== 'All' || date
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
              Campus Search & Filter
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Search items across campus by name, description keywords, category, building, and date.
          </p>
        </div>

        <button
          onClick={() => onNavigate('matches')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>View Potential Matches Engine</span>
        </button>
      </div>

      {/* Main Search & Control Panel */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-6 space-y-5">
        {/* Search input bar */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by item name, description keywords, category, location (e.g. 'AirPods', 'Calculator', 'Library')..."
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
              />
            </div>

            {/* Lost / Found Toggle */}
            <div className="flex bg-zinc-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setType('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  type === 'all'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All Reports
              </button>
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  type === 'lost'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                Lost Only
              </button>
              <button
                type="button"
                onClick={() => setType('found')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  type === 'found'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                Found Only
              </button>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Detailed Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white text-zinc-900"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Campus Location</span>
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white text-zinc-900"
            >
              <option value="All">All Campus Areas</option>
              {CAMPUS_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Status</span>
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white text-zinc-900"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="matched">Matched</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Specific Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white text-zinc-900"
            />
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
            <span className="text-xs text-zinc-400 font-medium">Active Filters:</span>
            {query && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Keyword: "{query}"</span>
                <button onClick={() => setQuery('')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}
            {type !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Type: {type}</span>
                <button onClick={() => setType('all')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}
            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Category: {category}</span>
                <button onClick={() => setCategory('All')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}
            {location !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Location: {location}</span>
                <button onClick={() => setLocation('All')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}
            {status !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Status: {status}</span>
                <button onClick={() => setStatus('All')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}
            {date && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-800">
                <span>Date: {date}</span>
                <button onClick={() => setDate('')}><X className="w-3 h-3 text-zinc-400 hover:text-zinc-700" /></button>
              </span>
            )}

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
          <span>Found <strong>{items.length}</strong> campus records matching criteria</span>
          <span className="text-[11px] text-zinc-400">Database Live Query</span>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-72 bg-zinc-100 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto" />
          <h3 className="font-bold text-zinc-900 text-base">No Matching Items Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            No active reports match the selected keywords and filters. Try searching with fewer filters or by broader words like "bag", "keys", or "calculator".
          </p>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Reset Filters
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

      {selectedClaimItem && (
        <ClaimModal
          item={selectedClaimItem}
          isOpen={true}
          onClose={() => setSelectedClaimItem(null)}
          onClaimSuccess={() => performSearch()}
        />
      )}
    </div>
  );
};
