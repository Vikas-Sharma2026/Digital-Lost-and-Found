import { Router, Response } from 'express';
import crypto from 'crypto';
import { sqliteDb } from '../db.js';
import { requireAdmin, AuthenticatedRequest } from '../auth.js';
import { formatItemResponse } from './itemRoutes.js';

const router = Router();

// 1. Admin Dashboard Statistics - Exactly the 8 KPIs requested:
// - Total users
// - Total lost reports
// - Total found reports
// - Potential matches
// - Pending claims
// - Approved claims
// - Rejected claims
// - Returned items
router.get('/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const allItems = sqliteDb.getItems({});
  const allClaims = sqliteDb.getAllClaims();
  const allUsers = sqliteDb.getAllUsers();
  const allMatches = sqliteDb.getAllMatches();

  const totalUsers = allUsers.length;
  const totalLostReports = allItems.filter(i => i.type === 'lost').length;
  const totalFoundReports = allItems.filter(i => i.type === 'found').length;
  const potentialMatches = allMatches.length;

  const pendingClaims = allClaims.filter(c => c.status === 'pending').length;
  const approvedClaims = allClaims.filter(c => c.status === 'verified').length;
  const rejectedClaims = allClaims.filter(c => c.status === 'rejected').length;
  const returnedItems = allItems.filter(i => i.status === 'returned').length;

  const totalItems = allItems.length;
  const recoveryRate = totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0;

  const recentItems = allItems.slice(0, 6).map(formatItemResponse);
  const recentClaims = allClaims.slice(0, 6).map(c => {
    const item = sqliteDb.getItemById(c.item_id);
    const claimant = sqliteDb.getUserById(c.claimant_id);
    return {
      id: c.id,
      itemId: c.item_id,
      itemTitle: item ? item.title : 'Item',
      claimantId: c.claimant_id,
      claimantName: claimant ? claimant.name : 'Student',
      claimantEmail: claimant ? claimant.email : '',
      proofDetails: c.proof_details,
      status: c.status,
      adminRemarks: c.admin_comment,
      createdAt: c.created_at,
    };
  });

  res.json({
    // The 8 explicit KPIs
    totalUsers,
    totalLostReports,
    totalFoundReports,
    potentialMatches,
    pendingClaims,
    approvedClaims,
    rejectedClaims,
    returnedItems,

    // Additional helper stats
    totalItems,
    lostItems: totalLostReports,
    foundItems: totalFoundReports,
    recoveryRate,
    studentUsers: allUsers.filter(u => u.role === 'student').length,
    recentItems,
    recentClaims,
  });
});

// 2. Admin: View Users Directory
router.get('/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const allUsers = sqliteDb.getAllUsers();
  const allItems = sqliteDb.getItems({});
  const allClaims = sqliteDb.getAllClaims();

  const formattedUsers = allUsers.map(u => {
    const userItems = allItems.filter(i => i.user_id === u.id);
    const userClaims = allClaims.filter(c => c.claimant_id === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      studentId: u.college_id,
      phone: u.phone,
      createdAt: u.created_at,
      totalLostReports: userItems.filter(i => i.type === 'lost').length,
      totalFoundReports: userItems.filter(i => i.type === 'found').length,
      totalClaims: userClaims.length,
      approvedClaims: userClaims.filter(c => c.status === 'verified').length,
    };
  });

  res.json({ users: formattedUsers });
});

// 3. Admin: Mark Item Directly as Returned
router.patch('/items/:id/return', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found in database.' });
    return;
  }

  const updated = sqliteDb.updateItem(req.params.id, { status: 'returned' });

  // Update associated matches to verified
  const itemMatches = sqliteDb.getMatchesForItem(req.params.id);
  for (const m of itemMatches) {
    sqliteDb.updateMatchStatus(m.id, 'verified');
  }

  // Notify the reporter
  sqliteDb.createNotification({
    id: 'notif_' + crypto.randomUUID().slice(0, 8),
    user_id: item.user_id,
    title: 'Item Marked as Returned! 📦',
    message: `Your reported item "${item.title}" has been marked as officially Returned by campus administrator ${req.user!.name}.`,
    link: '/my-reports',
    type: 'item_update',
    is_read: 0,
    created_at: new Date().toISOString(),
  });

  res.json({
    message: `Item "${item.title}" marked as returned.`,
    item: formatItemResponse(updated!),
  });
});

// 4. Admin: Handle Duplicate / Inappropriate Reports Moderation
router.patch('/items/:id/moderate', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { action, reason } = req.body;
  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found in database.' });
    return;
  }

  if (action === 'duplicate') {
    const updated = sqliteDb.updateItem(req.params.id, {
      status: 'closed',
      title: item.title.startsWith('[Duplicate]') ? item.title : `[Duplicate] ${item.title}`,
    });

    sqliteDb.createNotification({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: item.user_id,
      title: 'Report Moderation: Marked as Duplicate',
      message: `Your report "${item.title}" was marked as a duplicate submission by administrators and has been closed. ${reason ? `Reason: ${reason}` : ''}`,
      link: '/my-reports',
      type: 'admin_alert',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    res.json({
      message: 'Item flagged as duplicate and closed.',
      item: formatItemResponse(updated!),
    });
    return;
  }

  if (action === 'inappropriate') {
    const updated = sqliteDb.updateItem(req.params.id, {
      status: 'closed',
      title: `[Flagged - Inappropriate] ${item.title}`,
      description: `[This report was moderated for violating campus guidelines: ${reason || 'Inappropriate content'}]`,
    });

    sqliteDb.createNotification({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: item.user_id,
      title: 'Report Moderation: Content Violation',
      message: `Your report "${item.title}" was removed from the public directory due to campus policy guidelines. ${reason ? `Details: ${reason}` : ''}`,
      link: '/my-reports',
      type: 'admin_alert',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    res.json({
      message: 'Item moderated as inappropriate and hidden from public listing.',
      item: formatItemResponse(updated!),
    });
    return;
  }

  res.status(400).json({ error: 'Invalid moderation action. Must be duplicate or inappropriate.' });
});

// 5. Admin: Delete Item
router.delete('/items/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const item = sqliteDb.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Item not found in database.' });
    return;
  }

  sqliteDb.deleteItem(req.params.id);
  res.json({ message: 'Item report removed by administrator.' });
});

export default router;
