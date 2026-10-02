import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sqliteDb, DbItem, DbNotification } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { syncMatchesForItem } from '../matchEngine.js';

const router = Router();

// Helper to format DB item to frontend Item interface
export function formatItemResponse(item: DbItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    category: item.category,
    description: item.description,
    location: item.location,
    date: item.date,
    time: item.time,
    dateTime: `${item.date}T${item.time || '12:00'}`,
    imageUrl: item.image_url,
    contactName: item.contact_name,
    contactPhone: item.contact_phone,
    contactEmail: item.contact_email,
    rewardInfo: item.reward_info,
    securityQuestion: item.security_question,
    storageLocation: item.storage_location,
    status: item.status,
    reportedBy: item.user_id,
    reporterName: item.contact_name,
    createdAt: item.created_at,
    updatedAt: item.created_at,
  };
}

// 1. List Items with Search & Filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, category, location, status, q, user, fromDate, toDate } = req.query;

    const dbItems = sqliteDb.getItems({
      type: typeof type === 'string' ? type : undefined,
      category: typeof category === 'string' ? category : undefined,
      location: typeof location === 'string' ? location : undefined,
      status: typeof status === 'string' ? status : undefined,
      user_id: typeof user === 'string' ? user : undefined,
      q: typeof q === 'string' ? q : undefined,
      fromDate: typeof fromDate === 'string' ? fromDate : undefined,
      toDate: typeof toDate === 'string' ? toDate : undefined,
    });

    const items = dbItems.map(formatItemResponse);
    res.json({ items });
  } catch (err: any) {
    console.error('Error fetching items from SQLite:', err);
    res.status(500).json({ error: 'Failed to fetch items from database.' });
  }
});

// 2. Get Single Item by ID
router.get('/:id', (req: Request, res: Response) => {
  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ item: formatItemResponse(item) });
});

// 3. Create Item Report (Lost or Found)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      type,
      title,
      category,
      description,
      location,
      dateTime,
      date,
      time,
      imageUrl,
      contactName,
      contactPhone,
      contactEmail,
      rewardInfo,
      securityQuestion,
      storageLocation,
    } = req.body;

    if (!type || !title || !category || !description || !location) {
      res.status(400).json({
        error: 'Please fill in all required fields: title, category, description, and campus location.',
      });
      return;
    }

    if (type !== 'lost' && type !== 'found') {
      res.status(400).json({ error: 'Type must be either "lost" or "found".' });
      return;
    }

    // Parse date & time
    let itemDate = date;
    let itemTime = time;
    if (!itemDate && dateTime) {
      const parts = dateTime.split('T');
      itemDate = parts[0] || new Date().toISOString().slice(0, 10);
      itemTime = parts[1] ? parts[1].slice(0, 5) : '12:00';
    } else if (!itemDate) {
      itemDate = new Date().toISOString().slice(0, 10);
      itemTime = '12:00';
    }

    const newItem: DbItem = {
      id: `item_${type}_${crypto.randomUUID().slice(0, 8)}`,
      user_id: user.id,
      type,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      image_url: imageUrl || '',
      location: location.trim(),
      date: itemDate,
      time: itemTime || '12:00',
      status: 'active',
      contact_name: (contactName || user.name).trim(),
      contact_phone: (contactPhone || user.phone || '').trim(),
      contact_email: (contactEmail || user.email).trim(),
      reward_info: rewardInfo ? rewardInfo.trim() : undefined,
      security_question: securityQuestion ? securityQuestion.trim() : undefined,
      storage_location: storageLocation ? storageLocation.trim() : undefined,
      created_at: new Date().toISOString(),
    };

    const saved = sqliteDb.createItem(newItem);

    // Compute & persist AI-based matches into SQLite `matches` table
    const matches = await syncMatchesForItem(saved);

    // Notify user if high confidence matches detected
    if (matches.length > 0 && matches[0].final_match_score >= 60) {
      const topMatch = matches[0];
      const matchNotif: DbNotification = {
        id: 'notif_' + crypto.randomUUID().slice(0, 8),
        user_id: user.id,
        title: `Possible Match Found (${topMatch.final_match_score}% confidence)`,
        message: `Your reported ${saved.type} item "${saved.title}" matches another report on campus with ${topMatch.final_match_score}% confidence.`,
        link: `/matches?itemId=${saved.id}`,
        type: 'potential_match',
        is_read: 0,
        created_at: new Date().toISOString(),
      };
      sqliteDb.createNotification(matchNotif);
    }

    res.status(201).json({
      message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
      item: formatItemResponse(saved),
      potentialMatchesCount: matches.length,
    });
  } catch (err: any) {
    console.error('Error creating item report:', err);
    res.status(500).json({ error: 'Failed to create item report.' });
  }
});

// 4. Update Item Report (Security check: only creator or admin)
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = sqliteDb.getItemById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Security: Student cannot modify another student's report
    if (item.user_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden: You do not have permission to modify another student’s report.',
        code: 'ACCESS_DENIED',
      });
      return;
    }

    const {
      title,
      category,
      description,
      location,
      imageUrl,
      date,
      time,
      dateTime,
      contactName,
      contactPhone,
      contactEmail,
      rewardInfo,
      securityQuestion,
      storageLocation,
      status,
    } = req.body;

    let itemDate = date !== undefined ? date : item.date;
    let itemTime = time !== undefined ? time : item.time;
    if (dateTime) {
      const parts = dateTime.split('T');
      itemDate = parts[0];
      itemTime = parts[1] ? parts[1].slice(0, 5) : '12:00';
    }

    const updated = sqliteDb.updateItem(req.params.id, {
      title: title ? title.trim() : item.title,
      category: category ? category.trim() : item.category,
      description: description ? description.trim() : item.description,
      location: location ? location.trim() : item.location,
      image_url: imageUrl !== undefined ? imageUrl : item.image_url,
      date: itemDate,
      time: itemTime,
      status: status || item.status,
      contact_name: contactName !== undefined ? contactName.trim() : item.contact_name,
      contact_phone: contactPhone !== undefined ? contactPhone.trim() : item.contact_phone,
      contact_email: contactEmail !== undefined ? contactEmail.trim() : item.contact_email,
      reward_info: rewardInfo !== undefined ? rewardInfo.trim() : item.reward_info,
      security_question: securityQuestion !== undefined ? securityQuestion.trim() : item.security_question,
      storage_location: storageLocation !== undefined ? storageLocation.trim() : item.storage_location,
    });

    res.json({
      message: 'Item updated successfully',
      item: formatItemResponse(updated!),
    });
  } catch (err: any) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// 5. Delete Item Report (Security check: only creator or admin)
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  // Security: Student cannot delete another student's report
  if (item.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: You do not have permission to delete another student’s report.',
      code: 'ACCESS_DENIED',
    });
    return;
  }

  sqliteDb.deleteItem(req.params.id);
  res.json({ message: 'Item report deleted successfully' });
});

// 6. Update Item Status (Security check: only creator or admin)
router.patch('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!['open', 'active', 'matched', 'claimed', 'returned', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Invalid status value. Must be open, matched, claimed, returned, or closed.' });
    return;
  }

  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  if (item.user_id !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: You do not have permission to update status on this report.',
      code: 'ACCESS_DENIED',
    });
    return;
  }

  const updated = sqliteDb.updateItem(req.params.id, { status });
  res.json({
    message: `Item status marked as ${status}`,
    item: formatItemResponse(updated!),
  });
});

export default router;
