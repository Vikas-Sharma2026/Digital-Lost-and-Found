import { DbItem } from '../db.js';

export function computeTimeSimilarity(lostItem: DbItem, foundItem: DbItem): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const lostDateTimeStr = `${lostItem.date}T${lostItem.time || '12:00'}`;
  const foundDateTimeStr = `${foundItem.date}T${foundItem.time || '12:00'}`;

  const lostTime = new Date(lostDateTimeStr).getTime();
  const foundTime = new Date(foundDateTimeStr).getTime();

  if (isNaN(lostTime) || isNaN(foundTime)) {
    return { score: 50, reasons: ['Reported during recent academic semester'] };
  }

  // Difference in hours
  const diffHours = (foundTime - lostTime) / (1000 * 60 * 60);

  // If found after lost time (plausible):
  if (diffHours >= -6 && diffHours <= 24) {
    reasons.push('Discovered within 24 hours of lost timestamp');
    return { score: 100, reasons };
  } else if (diffHours > 24 && diffHours <= 72) {
    reasons.push('Discovered within 3 days of lost timestamp');
    return { score: 85, reasons };
  } else if (diffHours > 72 && diffHours <= 168) {
    reasons.push('Discovered within the same calendar week');
    return { score: 70, reasons };
  } else if (diffHours > 168 && diffHours <= 720) {
    reasons.push('Discovered within 30 days');
    return { score: 50, reasons };
  } else if (diffHours < -24) {
    // Found well before it was reported lost
    reasons.push('Found date precedes reported lost date by more than 24 hours');
    return { score: 15, reasons };
  }

  return {
    score: 40,
    reasons: ['Recorded in active lost-found window'],
  };
}
