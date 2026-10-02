import { Router, Response } from 'express';
import { sqliteDb } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// 1. Get Notifications for Authenticated User
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const dbNotifs = sqliteDb.getNotificationsByUserId(userId);

  const notifications = dbNotifs.map(n => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    link: n.link,
    type: n.type,
    read: n.is_read === 1,
    is_read: n.is_read,
    createdAt: n.created_at,
  }));

  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ notifications, unreadCount });
});

// 2. Mark Single Notification as Read (Security: verifies user ownership)
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const success = sqliteDb.markNotificationRead(req.params.id, userId);
  if (!success) {
    res.status(404).json({ error: 'Notification not found or access denied.' });
    return;
  }
  res.json({ message: 'Marked as read' });
});

// 3. Mark All Notifications as Read
router.post('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  sqliteDb.markAllNotificationsRead(userId);
  res.json({ message: 'All notifications marked as read' });
});

export default router;
