import React from 'react';
import { Item } from '../types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Calendar, Sparkles, ArrowRight, User } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onViewDetails: (id: string) => void;
  onViewMatches?: (id: string) => void;
  onClaim?: (item: Item) => void;
  currentUserId?: string;
  showMatchButton?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onViewDetails,
  onViewMatches,
  onClaim,
  currentUserId,
  showMatchButton = true,
}) => {
  const isReporter = currentUserId === item.reportedBy;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-zinc-50 to-zinc-200 text-zinc-400 p-4">
            <span className="text-3xl mb-1">
              {item.category === 'Electronics' && '📱'}
              {item.category === 'Documents & ID' && '🪪'}
              {item.category === 'Wallets & Bags' && '🎒'}
              {item.category === 'Keys' && '🔑'}
              {item.category === 'Accessories' && '👓'}
              {item.category === 'Books & Stationery' && '📚'}
              {item.category === 'Clothing' && '👕'}
              {item.category === 'Other' && '📦'}
            </span>
            <span className="text-xs font-medium text-zinc-500">{item.category}</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge type={item.type} />
          {item.status !== 'active' && <StatusBadge status={item.status} />}
        </div>

        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-xs text-zinc-700 shadow-xs border border-zinc-200/60">
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <h3
          onClick={() => onViewDetails(item.id)}
          className="font-bold text-zinc-900 text-base sm:text-lg mb-1.5 hover:text-indigo-600 cursor-pointer line-clamp-1 transition-colors"
        >
          {item.title}
        </h3>

        <p className="text-zinc-600 text-xs sm:text-sm line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        {/* Metadata info */}
        <div className="space-y-1.5 text-xs text-zinc-500 mb-4 pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{formatDate(item.dateTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              Reported by {isReporter ? 'You' : item.reporterName}
            </span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {showMatchButton && onViewMatches && (
            <button
              onClick={() => onViewMatches(item.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              title="View algorithmic potential matches"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Matches</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onClaim && !isReporter && item.status === 'active' && (
              <button
                onClick={() => onClaim(item)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Claim This
              </button>
            )}

            <button
              onClick={() => onViewDetails(item.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
