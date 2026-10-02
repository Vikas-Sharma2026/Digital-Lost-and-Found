import { Router, Request, Response } from 'express';
import { sqliteDb } from '../db.js';
import { matchCalculator } from '../matching/matchCalculator.js';
import { embeddingService } from '../matching/embeddings/embeddingService.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { formatItemResponse } from './itemRoutes.js';

const router = Router();

// Helper to format match result
function formatMatchResult(m: any, currentItemId?: string) {
  const lostItem = sqliteDb.getItemById(m.lost_item_id);
  const foundItem = sqliteDb.getItemById(m.found_item_id);

  const otherItem = currentItemId
    ? (m.lost_item_id === currentItemId ? foundItem : lostItem)
    : foundItem;

  let parsedReasons: string[] = [];
  try {
    parsedReasons = typeof m.reasons === 'string' ? JSON.parse(m.reasons) : m.reasons;
  } catch {
    parsedReasons = [m.reasons];
  }

  const imageSim = m.image_similarity;
  const locationSim = m.location_similarity;
  const timeSim = m.time_similarity;
  const descSim = m.description_similarity;
  const finalScore = m.final_match_score;

  return {
    id: m.id,
    label: 'Potential Match',
    imageSimilarityLabel: `Potential Match – ${Math.round(imageSim)}% image similarity`,
    disclaimer: 'Algorithmic Potential Match — Does NOT prove ownership. Verification required before item return.',
    lostItem: lostItem ? formatItemResponse(lostItem) : null,
    foundItem: foundItem ? formatItemResponse(foundItem) : null,
    item: otherItem ? formatItemResponse(otherItem) : (foundItem ? formatItemResponse(foundItem) : null),
    score: finalScore,
    reasons: parsedReasons,
    breakdown: {
      imageSimilarity: imageSim,
      locationSimilarity: locationSim,
      timeSimilarity: timeSim,
      descriptionSimilarity: descSim,
      final_match_score: finalScore,
      totalScore: finalScore,
      reasons: parsedReasons,
      weights: {
        image: '40%',
        location: '25%',
        dateTime: '20%',
        description: '15%',
      },
    },
  };
}

// 0. AI Status and Model Configuration Endpoint
router.get('/ai-status', (_req: Request, res: Response) => {
  try {
    const status = embeddingService.getStatus();
    res.json({
      status: 'active',
      ...status,
      apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      weights: {
        imageSimilarity: '40%',
        locationSimilarity: '25%',
        timeSimilarity: '20%',
        descriptionSimilarity: '15%',
      },
      ownershipDisclaimer: 'Visual similarity is an algorithmic aid and does not prove ownership.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve AI status' });
  }
});

// 1. Recalculate all campus matches using AI vector embeddings
router.post('/recalculate', async (_req: Request, res: Response) => {
  try {
    const activeItems = sqliteDb.getItems({ status: 'active' });
    const lostItems = activeItems.filter(i => i.type === 'lost');

    let totalComputed = 0;
    for (const lost of lostItems) {
      const created = await matchCalculator.findAndSaveMatches(lost);
      totalComputed += created.length;
    }

    res.json({
      message: 'Campus matches recalculated successfully using AI visual & metadata vectors',
      matchesFound: totalComputed,
    });
  } catch (err: any) {
    console.error('Recalculation error:', err);
    res.status(500).json({ error: 'Failed to recalculate matches' });
  }
});

// 2. Interactive Compare Endpoint between any two items
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { lostItemId, foundItemId } = req.body;
    if (!lostItemId || !foundItemId) {
      res.status(400).json({ error: 'Please provide both lostItemId and foundItemId' });
      return;
    }

    const lostItem = sqliteDb.getItemById(lostItemId);
    const foundItem = sqliteDb.getItemById(foundItemId);

    if (!lostItem || !foundItem) {
      res.status(404).json({ error: 'One or both items could not be found' });
      return;
    }

    const breakdown = await matchCalculator.computeScore(lostItem, foundItem);
    const imageComparison = await embeddingService.computeImageSimilarity(lostItem, foundItem);

    res.json({
      lostItem: formatItemResponse(lostItem),
      foundItem: formatItemResponse(foundItem),
      breakdown: {
        imageSimilarity: breakdown.image_similarity,
        locationSimilarity: breakdown.location_similarity,
        timeSimilarity: breakdown.time_similarity,
        descriptionSimilarity: breakdown.description_similarity,
        finalScore: breakdown.final_match_score,
      },
      imageDetails: imageComparison,
      displayLabel: `Potential Match – ${Math.round(breakdown.image_similarity)}% image similarity`,
      reasons: breakdown.reasons,
      disclaimer: 'Algorithmic Potential Match — Does NOT prove ownership.',
    });
  } catch (err: any) {
    console.error('Interactive compare error:', err);
    res.status(500).json({ error: 'Failed to compare items' });
  }
});

// 3. Get Potential Matches for a Specific Item
router.get('/:itemId', async (req: Request, res: Response) => {
  try {
    const item = sqliteDb.getItemById(req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Retrieve matches from SQLite or synchronize using modular AI calculator
    let dbMatches = sqliteDb.getMatchesForItem(item.id);
    if (dbMatches.length === 0) {
      dbMatches = await matchCalculator.findAndSaveMatches(item);
    }

    const formattedMatches = dbMatches
      .map(m => formatMatchResult(m, item.id))
      .filter(m => m.item !== null);

    res.json({
      targetItem: formatItemResponse(item),
      matchesCount: formattedMatches.length,
      matches: formattedMatches,
    });
  } catch (err: any) {
    console.error('Error fetching item matches from SQLite:', err);
    res.status(500).json({ error: 'Failed to compute matches' });
  }
});

// 4. Get Potential Matches for All Reports Submitted by Authenticated Student
router.get('/user/all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userItems = sqliteDb.getItems({ user_id: userId, status: 'active' });

    const groupedMatches: any[] = [];
    for (const item of userItems) {
      let dbMatches = sqliteDb.getMatchesForItem(item.id);
      if (dbMatches.length === 0) {
        dbMatches = await matchCalculator.findAndSaveMatches(item);
      }

      const formattedMatches = dbMatches
        .map(m => formatMatchResult(m, item.id))
        .filter(m => m.item !== null);

      if (formattedMatches.length > 0) {
        groupedMatches.push({
          item: formatItemResponse(item),
          matches: formattedMatches,
        });
      }
    }

    res.json({ groups: groupedMatches });
  } catch (err: any) {
    console.error('Error computing user matches:', err);
    res.status(500).json({ error: 'Failed to compute user matches' });
  }
});

// 5. Global Campus Explorer: All potential matches
router.get('/', async (_req: Request, res: Response) => {
  try {
    const activeItems = sqliteDb.getItems({ status: 'active' });
    const lostItems = activeItems.filter(i => i.type === 'lost');

    const allMatches: any[] = [];
    for (const lost of lostItems) {
      let matches = sqliteDb.getMatchesForItem(lost.id);
      if (matches.length === 0) {
        matches = await matchCalculator.findAndSaveMatches(lost);
      }
      for (const m of matches) {
        if (!allMatches.some(existing => existing.id === m.id)) {
          allMatches.push(formatMatchResult(m, lost.id));
        }
      }
    }

    res.json({
      totalMatches: allMatches.length,
      matches: allMatches.sort((a, b) => b.score - a.score),
    });
  } catch (err: any) {
    console.error('Error fetching all campus matches:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

export default router;
