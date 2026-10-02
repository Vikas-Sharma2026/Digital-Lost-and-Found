import { DbItem } from '../db.js';
import { tokenizeText } from './textSimilarity.js';

// Campus primary zones
const CAMPUS_ZONES: Record<string, string[]> = {
  library: ['central library', 'library', 'reading room', 'reference section', 'helpdesk', 'reading hall'],
  cafeteria: ['cafeteria', 'food court', 'canteen', 'mess', 'dining'],
  tech_block_a: ['tech block a', 'block a', 'cse', 'it lab', 'computer lab', 'room 204'],
  tech_block_b: ['tech block b', 'block b', 'ece', 'ee lab', 'electronics'],
  sports: ['sports complex', 'basketball court', 'badminton court', 'gym', 'ground'],
  hostel_boys: ['hostel 1', 'hostel 2', 'hostel 3', 'boys hostel'],
  hostel_girls: ['girls hostel', 'girls complex'],
  gate_1: ['gate 1', 'main entrance', 'security booth', 'guard room'],
  gate_2: ['gate 2', 'rear gate'],
  sac: ['student activity center', 'sac', 'auditorium', 'amphitheatre'],
};

export function computeLocationSimilarity(lostItem: DbItem, foundItem: DbItem): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const loc1 = (lostItem.location || '').trim().toLowerCase();
  const loc2 = (foundItem.location || '').trim().toLowerCase();

  if (!loc1 || !loc2) {
    return { score: 20, reasons: ['Both items within college campus perimeter'] };
  }

  // 1. Exact string match
  if (loc1 === loc2) {
    reasons.push(`Exact location match: ${lostItem.location}`);
    return { score: 100, reasons };
  }

  // 2. Zone check
  for (const [zoneName, keywords] of Object.entries(CAMPUS_ZONES)) {
    const loc1HasZone = keywords.some(k => loc1.includes(k));
    const loc2HasZone = keywords.some(k => loc2.includes(k));

    if (loc1HasZone && loc2HasZone) {
      reasons.push(`Same campus zone: ${zoneName.replace('_', ' ').toUpperCase()}`);
      return { score: 90, reasons };
    }
  }

  // 3. Token overlap (e.g. "Library 2nd Floor" and "Central Library Table 4")
  const tokens1 = tokenizeText(loc1);
  const tokens2 = tokenizeText(loc2);
  const common = tokens1.filter(t => tokens2.includes(t));

  if (common.length >= 2) {
    reasons.push(`Common campus landmarks: ${common.join(', ')}`);
    return { score: 75, reasons };
  } else if (common.length === 1) {
    reasons.push(`Proximity indicator: "${common[0]}"`);
    return { score: 55, reasons };
  }

  // Baseline on same campus
  return {
    score: 25,
    reasons: ['Different campus zones reported'],
  };
}
