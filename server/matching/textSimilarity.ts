import { DbItem } from '../db.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'is', 'was', 'are', 'were', 'it', 'its', 'my', 'i', 'has', 'have',
  'had', 'some', 'any', 'near', 'inside', 'outside', 'around', 'table', 'floor',
  'room', 'item', 'found', 'lost'
]);

export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

export function computeCategorySimilarity(lostItem: DbItem, foundItem: DbItem): { score: number; reason?: string } {
  const lostCat = (lostItem.category || '').trim().toLowerCase();
  const foundCat = (foundItem.category || '').trim().toLowerCase();

  if (lostCat && foundCat && lostCat === foundCat) {
    return {
      score: 100,
      reason: `Exact category match: ${lostItem.category}`,
    };
  }

  // Cross-category affinities (e.g. Wallets & Bags with Accessories)
  const relatedGroups = [
    ['wallets & bags', 'accessories'],
    ['electronics', 'accessories'],
    ['documents & id', 'books & stationery'],
  ];

  for (const group of relatedGroups) {
    if (group.includes(lostCat) && group.includes(foundCat)) {
      return {
        score: 60,
        reason: `Related categories: ${lostItem.category} & ${foundItem.category}`,
      };
    }
  }

  return { score: 10, reason: undefined };
}

export function computeDescriptionSimilarity(lostItem: DbItem, foundItem: DbItem): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const lostTitleTokens = new Set(tokenizeText(lostItem.title));
  const foundTitleTokens = new Set(tokenizeText(foundItem.title));

  const lostDescTokens = new Set(tokenizeText(lostItem.description));
  const foundDescTokens = new Set(tokenizeText(foundItem.description));

  // 1. Title keyword overlap (high signal)
  const titleMatches: string[] = [];
  for (const t of lostTitleTokens) {
    if (foundTitleTokens.has(t)) {
      titleMatches.push(t);
    }
  }

  // 2. Full tokens overlap
  const allLostTokens = new Set([...lostTitleTokens, ...lostDescTokens]);
  const allFoundTokens = new Set([...foundTitleTokens, ...foundDescTokens]);

  const allMatches: string[] = [];
  for (const t of allLostTokens) {
    if (allFoundTokens.has(t)) {
      allMatches.push(t);
    }
  }

  if (titleMatches.length > 0) {
    reasons.push(`Title keywords matched: "${titleMatches.slice(0, 4).join(', ')}"`);
  }

  if (allMatches.length > 0) {
    reasons.push(`Description keywords matched: "${allMatches.slice(0, 5).join(', ')}"`);
  }

  if (allLostTokens.size === 0 || allFoundTokens.size === 0) {
    return { score: 0, reasons };
  }

  const unionSize = new Set([...allLostTokens, ...allFoundTokens]).size;
  const jaccard = unionSize > 0 ? allMatches.length / unionSize : 0;

  // Title match bonus + Jaccard similarity
  let score = Math.round(jaccard * 100) + (titleMatches.length * 20);
  score = Math.min(100, Math.max(0, score));

  return { score, reasons };
}
