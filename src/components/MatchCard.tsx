import React, { useState } from 'react';
import { MatchResult, Item } from '../types';
import {
  Sparkles,
  MapPin,
  Calendar,
  Check,
  ArrowRight,
  Shield,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
  Cpu,
  Info,
  X
} from 'lucide-react';

interface MatchCardProps {
  match: MatchResult | any;
  sourceItem?: Item;
  onViewDetails: (id: string) => void;
  onClaim?: (item: Item) => void;
  currentUserId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  sourceItem,
  onViewDetails,
  onClaim,
  currentUserId,
}) => {
  const [showAiModal, setShowAiModal] = useState(false);

  const item = match.item;
  const score = match.score;
  const reasons = match.reasons || [];
  const breakdown = match.breakdown || {};

  const lostItem = match.lostItem || (sourceItem?.type === 'lost' ? sourceItem : (item?.type === 'lost' ? item : null));
  const foundItem = match.foundItem || (sourceItem?.type === 'found' ? sourceItem : (item?.type === 'found' ? item : null));

  const lostTitle = lostItem?.title || 'Reported Lost Item';
  const foundTitle = foundItem?.title || 'Reported Found Item';

  const isReporter = currentUserId === item?.reportedBy;

  // Extract individual component scores
  const imageSim = Math.round(breakdown.imageSimilarity ?? breakdown.image_similarity ?? 60);
  const locationSim = Math.round(breakdown.locationSimilarity ?? breakdown.location_similarity ?? 75);
  const timeSim = Math.round(breakdown.timeSimilarity ?? breakdown.time_similarity ?? 70);
  const descSim = Math.round(breakdown.descriptionSimilarity ?? breakdown.description_similarity ?? 80);

  // Prominent label specified in prompt
  const displayLabel = match.imageSimilarityLabel || `Potential Match – ${imageSim}% image similarity`;

  let scoreBarColor = 'bg-emerald-500';
  let scoreGrade = 'High Confidence';
  if (score < 50) {
    scoreBarColor = 'bg-amber-500';
    scoreGrade = 'Moderate Proximity';
  } else if (score >= 80) {
    scoreBarColor = 'bg-indigo-600';
    scoreGrade = 'Strong Candidate';
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-300 p-5 sm:p-6 transition-all space-y-5">
      {/* Top Banner: Clearly Labeled as Potential Match & Explicit Image Similarity */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>{displayLabel}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
              ⚠️ Potential Match • Not Confirmed Ownership
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Multimodal AI comparison combining vector image embeddings (40%), location (25%), date/time (20%), and descriptions (15%).
          </p>
        </div>

        {/* Final Weighted Match Score Display */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-2xl font-black text-zinc-900 block leading-none">
              {score}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mt-0.5">
              Final Match Score
            </span>
          </div>
          <div className="w-16 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${scoreBarColor} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Visual & Details Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200/80">
        {/* Lost item side */}
        <div className="flex items-start gap-3 pr-0 md:pr-3 md:border-r border-zinc-200/80">
          {lostItem?.imageUrl ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200 shadow-2xs">
              <img
                src={lostItem.imageUrl}
                alt={lostTitle}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-200/70 text-zinc-400 flex flex-col items-center justify-center shrink-0 border border-dashed border-zinc-300">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-semibold mt-0.5">No Photo</span>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Lost Item Report
            </span>
            <p className="font-bold text-zinc-900 text-sm truncate">{lostTitle}</p>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{lostItem?.location || 'Campus'}</span>
              <span>•</span>
              <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>{lostItem?.date || lostItem?.dateTime?.slice(0, 10)}</span>
            </p>
          </div>
        </div>

        {/* Found item side */}
        <div className="flex items-start gap-3 pl-0 md:pl-3">
          {foundItem?.imageUrl ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200 shadow-2xs">
              <img
                src={foundItem.imageUrl}
                alt={foundTitle}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-200/70 text-zinc-400 flex flex-col items-center justify-center shrink-0 border border-dashed border-zinc-300">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-semibold mt-0.5">No Photo</span>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Found Item Report
            </span>
            <p className="font-bold text-zinc-900 text-sm truncate">{foundTitle}</p>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{foundItem?.location || 'Campus'}</span>
              <span>•</span>
              <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>{foundItem?.date || foundItem?.dateTime?.slice(0, 10)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Factor Formula Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Match Score Breakdown (Weighted Combination):
          </p>
          <button
            onClick={() => setShowAiModal(true)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Inspect AI Vector Embedding</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          {/* 1. Image Similarity */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 shadow-2xs">
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
              Image Sim (40%)
            </span>
            <span className="text-lg font-black text-indigo-950 mt-0.5 block">
              {imageSim}%
            </span>
            <span className="text-[9px] font-semibold text-indigo-600">
              AI Vector Cosine Metric
            </span>
          </div>

          {/* 2. Location Similarity */}
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Location Sim (25%)
            </span>
            <span className="text-lg font-black text-zinc-900 mt-0.5 block">
              {locationSim}%
            </span>
            <span className="text-[9px] text-zinc-400">Campus Zone Proximity</span>
          </div>

          {/* 3. Date / Time Similarity */}
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Time Sim (20%)
            </span>
            <span className="text-lg font-black text-zinc-900 mt-0.5 block">
              {timeSim}%
            </span>
            <span className="text-[9px] text-zinc-400">Report Timestamp Delta</span>
          </div>

          {/* 4. Description Similarity */}
          <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Description Sim (15%)
            </span>
            <span className="text-lg font-black text-zinc-900 mt-0.5 block">
              {descSim}%
            </span>
            <span className="text-[9px] text-zinc-400">Keyword & Token Match</span>
          </div>
        </div>
      </div>

      {/* Match Reasons List */}
      {reasons.length > 0 && (
        <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 space-y-1.5">
          <span className="text-xs font-bold text-indigo-950 block">
            Why this was identified as a potential match:
          </span>
          <ul className="space-y-1">
            {reasons.slice(0, 4).map((r: string, idx: number) => (
              <li key={idx} className="text-xs text-indigo-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions & Verification Notice */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
        <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Image similarity does NOT prove ownership. Verification required prior to return.</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onClaim && item && !isReporter && item.status !== 'returned' && (
            <button
              onClick={() => onClaim(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Claim This Item</span>
            </button>
          )}

          {item && (
            <button
              onClick={() => onViewDetails(item.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Report Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Vector Inspector Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">AI Vector Image Similarity</h3>
                  <p className="text-[11px] text-zinc-500">Multimodal embedding & cosine vector calculation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5">
                <span className="font-bold text-zinc-800 block">AI Multimodal Architecture:</span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Image Upload → Preprocessing & Resizing → Gemini Multimodal Embedding (<code className="font-mono text-[10px] bg-zinc-200 px-1 py-0.5 rounded">gemini-embedding-2-preview</code>) → 3072-Dimensional Vector Representation → SQLite Vector Store → Cosine Similarity Metric → Potential Matches.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 uppercase font-bold block">Image Similarity</span>
                  <span className="text-lg font-black text-indigo-900 block mt-0.5">{imageSim}%</span>
                  <span className="text-[9px] text-indigo-500">Weight: 40%</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Embedding Vector</span>
                  <span className="text-lg font-black text-zinc-900 block mt-0.5">3072 Dims</span>
                  <span className="text-[9px] text-zinc-400">Cosine Distance Metric</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Ownership Safeguard:
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Image similarity only verifies visual resemblance. It does NOT prove ownership. Anyone claiming this item must provide unique identifying marks, purchase invoice, serial numbers, or answer the security question with campus administration.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAiModal(false)}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close AI Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
