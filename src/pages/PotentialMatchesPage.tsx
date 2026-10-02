import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item, MatchResult, UserMatchGroup, AiStatus } from '../types';
import { MatchCard } from '../components/MatchCard';
import { ClaimModal } from '../components/ClaimModal';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Layers,
  ShieldAlert,
  Sliders,
  Filter,
  Cpu,
  Database,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface PotentialMatchesPageProps {
  initialItemId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PotentialMatchesPage: React.FC<PotentialMatchesPageProps> = ({
  initialItemId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(initialItemId);
  const [singleItemMatches, setSingleItemMatches] = useState<MatchResult[]>([]);
  const [targetItem, setTargetItem] = useState<Item | null>(null);
  const [userGroups, setUserGroups] = useState<UserMatchGroup[]>([]);
  const [globalMatches, setGlobalMatches] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'my' | 'global' | 'compare'>('my');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [claimItem, setClaimItem] = useState<Item | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);

  // Interactive Live Compare State
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [compareLostId, setCompareLostId] = useState<string>('');
  const [compareFoundId, setCompareFoundId] = useState<string>('');
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [comparing, setComparing] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // 1. Fetch AI engine status
      try {
        const statusRes = await api.getAiStatus();
        setAiStatus(statusRes);
      } catch (err) {
        console.warn('Could not fetch AI status:', err);
      }

      // 2. Fetch matches based on view
      if (selectedItemId) {
        const res = await api.getItemMatches(selectedItemId);
        setSingleItemMatches(res.matches);
        setTargetItem(res.targetItem);
      } else {
        if (user) {
          const res = await api.getUserMatches();
          setUserGroups(res.groups);
        }
        // Also fetch global campus matches for explorer
        const globalRes = await fetch('/api/matches');
        const globalData = await globalRes.json();
        setGlobalMatches(globalData.matches || []);
      }

      // 3. Fetch items for interactive comparator
      const itemsRes = await api.getItems({});
      setAllItems(itemsRes.items || []);
      const losts = itemsRes.items.filter(i => i.type === 'lost');
      const founds = itemsRes.items.filter(i => i.type === 'found');
      if (losts.length > 0 && !compareLostId) setCompareLostId(losts[0].id);
      if (founds.length > 0 && !compareFoundId) setCompareFoundId(founds[0].id);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedItemId, user]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcMessage(null);
    try {
      const res = await api.recalculateMatches();
      setRecalcMessage(`Recalculated with AI vector embeddings: ${res.matchesFound} potential matches updated!`);
      await fetchMatches();
      setTimeout(() => setRecalcMessage(null), 6000);
    } catch (err: any) {
      setRecalcMessage('Failed to recalculate matches. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleRunInteractiveCompare = async () => {
    if (!compareLostId || !compareFoundId) return;
    setComparing(true);
    try {
      const result = await api.compareItems(compareLostId, compareFoundId);
      setCompareResult(result);
    } catch (err: any) {
      console.error('Compare failed:', err);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">
              AI-Powered Potential Item Matches
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Multimodal AI vector embeddings (<code className="font-mono text-xs text-indigo-700 font-bold">gemini-embedding-2-preview</code>) comparing images, locations, timestamps, and descriptive details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Vectorizing...' : 'Recalculate AI Matches'}</span>
          </button>
        </div>
      </div>

      {recalcMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recalcMessage}</span>
        </div>
      )}

      {/* AI Embedding Engine Architecture & Formula Banner */}
      <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  AI Image Similarity Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Model: <strong className="text-white font-mono">{aiStatus?.activeModel || 'gemini-embedding-2-preview'}</strong> ({aiStatus?.dimensions || 3072}-D vector embeddings via Cosine Metric)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>SQLite Vector Store: <strong>{aiStatus?.storedEmbeddingsCount ?? globalMatches.length}</strong> items indexed</span>
          </div>
        </div>

        {/* 4 Factor Weights Grid */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              Weighted Match Scoring Architecture:
            </span>
            <span className="text-[10px] text-amber-300 font-semibold">
              ⚠️ Potential Match — Does NOT prove ownership
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-extrabold text-indigo-300 block">40% Image Similarity</span>
              <span className="text-[10px] text-zinc-300 mt-0.5 block">
                Multimodal 3072-D vector cosine calculation
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-extrabold text-indigo-300 block">25% Location Similarity</span>
              <span className="text-[10px] text-zinc-300 mt-0.5 block">
                Campus zones & reading hall proximity
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-extrabold text-indigo-300 block">20% Time Similarity</span>
              <span className="text-[10px] text-zinc-300 mt-0.5 block">
                Incident timestamp delta (highest within 24h)
              </span>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-extrabold text-indigo-300 block">15% Description Similarity</span>
              <span className="text-[10px] text-zinc-300 mt-0.5 block">
                Keyword overlap & tokenized Jaccard similarity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Mode Toggle if not viewing single item */}
      {!selectedItemId && (
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setViewMode('my')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'my'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            My Reports Matches ({userGroups.reduce((a, b) => a + b.matches.length, 0)})
          </button>
          <button
            onClick={() => setViewMode('global')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'global'
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            All Campus Potential Matches Explorer ({globalMatches.length})
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              viewMode === 'compare'
                ? 'bg-purple-600 text-white'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            Interactive AI Pair Comparator
          </button>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-zinc-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : selectedItemId && targetItem ? (
        <div className="space-y-6">
          {/* Target Item Anchor */}
          <div className="p-5 bg-zinc-900 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300">
                Evaluating Potential Matches For Your Item:
              </span>
              <h3 className="text-xl font-bold mt-0.5">{targetItem.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {targetItem.category} • {targetItem.location} • {targetItem.dateTime?.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={() => setSelectedItemId(undefined)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Browse All Matches
            </button>
          </div>

          {singleItemMatches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 space-y-2">
              <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto" />
              <h3 className="font-bold text-zinc-900 text-base">No Matches Above Threshold</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No active candidate reports meet the match criteria for this item right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {singleItemMatches.map(m => (
                <MatchCard
                  key={m.item?.id || m.id}
                  match={m}
                  sourceItem={targetItem}
                  onViewDetails={id => onNavigate('item-details', { id })}
                  onClaim={it => setClaimItem(it)}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'compare' ? (
        /* Interactive Live AI Comparator */
        <div className="p-6 bg-white rounded-3xl border border-zinc-200 space-y-6">
          <div>
            <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              <span>Interactive AI Image & Multimodal Comparator</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Select any Lost item and any Found item to test real-time AI vector cosine similarity and view the full 4-factor breakdown.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select Lost Item */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-700 block">Select Lost Item:</label>
              <select
                value={compareLostId}
                onChange={e => setCompareLostId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {allItems.filter(i => i.type === 'lost').map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.category} - {item.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Found Item */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-700 block">Select Found Item:</label>
              <select
                value={compareFoundId}
                onChange={e => setCompareFoundId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {allItems.filter(i => i.type === 'found').map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.category} - {item.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunInteractiveCompare}
            disabled={comparing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{comparing ? 'Computing AI Multimodal Vectors...' : 'Run Real-Time AI Vector Comparison'}</span>
          </button>

          {compareResult && (
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white">
                  {compareResult.displayLabel}
                </span>
                <span className="text-xs font-extrabold text-zinc-900">
                  Final Match Score: {compareResult.breakdown?.finalScore}%
                </span>
              </div>

              {/* 4 factors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 font-bold block">Image Similarity (40%)</span>
                  <span className="text-lg font-black text-indigo-950 mt-0.5 block">
                    {compareResult.breakdown?.imageSimilarity}%
                  </span>
                  <span className="text-[9px] text-zinc-500">Gemini Vector Cosine</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-bold block">Location Sim (25%)</span>
                  <span className="text-lg font-black text-zinc-900 mt-0.5 block">
                    {compareResult.breakdown?.locationSimilarity}%
                  </span>
                  <span className="text-[9px] text-zinc-400">Campus Proximity</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-bold block">Time Sim (20%)</span>
                  <span className="text-lg font-black text-zinc-900 mt-0.5 block">
                    {compareResult.breakdown?.timeSimilarity}%
                  </span>
                  <span className="text-[9px] text-zinc-400">Timestamp Interval</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-bold block">Description Sim (15%)</span>
                  <span className="text-lg font-black text-zinc-900 mt-0.5 block">
                    {compareResult.breakdown?.descriptionSimilarity}%
                  </span>
                  <span className="text-[9px] text-zinc-400">Keyword Overlap</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Disclaimer:</strong> {compareResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'my' ? (
        userGroups.length > 0 ? (
          <div className="space-y-8">
            {userGroups.map(group => (
              <div key={group.item.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div>
                    <span className="text-xs uppercase font-bold text-indigo-600">
                      Potential Matches For Your Report:
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">{group.item.title}</h3>
                    <span className="text-xs text-zinc-500">
                      Location: {group.item.location} • {group.matches.length} candidates detected
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('item-details', { id: group.item.id })}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {group.matches.map(m => (
                    <MatchCard
                      key={m.item?.id || m.id}
                      match={m}
                      sourceItem={group.item}
                      onViewDetails={id => onNavigate('item-details', { id })}
                      onClaim={it => setClaimItem(it)}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 space-y-3">
            <Sparkles className="w-12 h-12 text-zinc-300 mx-auto" />
            <h3 className="font-bold text-zinc-900 text-base">No Matches For Your Reports Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              When someone reports a found item corresponding to your lost property, our AI image embedding algorithm will automatically flag it here!
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setViewMode('global')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
              >
                Browse All Campus Matches
              </button>
              <button
                onClick={() => onNavigate('report-lost')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold"
              >
                Submit Lost Report
              </button>
            </div>
          </div>
        )
      ) : (
        /* Global Campus Matches Explorer */
        globalMatches.length > 0 ? (
          <div className="space-y-4">
            {globalMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                onViewDetails={id => onNavigate('item-details', { id })}
                onClaim={it => setClaimItem(it)}
                currentUserId={user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
            <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <h3 className="font-bold text-zinc-900 text-base">No Campus Matches Found</h3>
            <p className="text-xs text-zinc-500">
              No matching candidate reports currently meet the threshold.
            </p>
          </div>
        )
      )}

      {/* Claim Modal */}
      {claimItem && (
        <ClaimModal
          item={claimItem}
          isOpen={true}
          onClose={() => setClaimItem(null)}
          onClaimSuccess={() => fetchMatches()}
        />
      )}
    </div>
  );
};
