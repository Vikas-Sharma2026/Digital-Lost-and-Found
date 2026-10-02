import { Router, Response } from 'express';
import crypto from 'crypto';
import { sqliteDb, DbClaim, DbNotification } from '../db.js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Helper to format DB Claim for response
function formatClaimResponse(claim: DbClaim) {
  const item = sqliteDb.getItemById(claim.item_id);
  const claimant = sqliteDb.getUserById(claim.claimant_id);

  return {
    id: claim.id,
    itemId: claim.item_id,
    itemTitle: item ? item.title : 'Item #' + claim.item_id,
    itemType: item ? item.type : 'found',
    claimantId: claim.claimant_id,
    claimantName: claimant ? claimant.name : 'Student',
    claimantEmail: claimant ? claimant.email : '',
    claimantPhone: claimant ? claimant.phone : '',
    proofDetails: claim.proof_details,
    proofImageUrl: claim.proof_image_url,
    status: claim.status,
    adminRemarks: claim.admin_comment,
    adminComment: claim.admin_comment,
    verifiedBy: claim.verified_by,
    verifiedAt: claim.verified_at,
    createdAt: claim.created_at,
    updatedAt: claim.created_at,
  };
}

// 1. Submit a New Claim (Protected)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { itemId, proofDetails, proofImageUrl } = req.body;

    if (!itemId || !proofDetails || String(proofDetails).trim().length < 10) {
      res.status(400).json({
        error: 'Please provide detailed ownership proof (at least 10 characters describing distinguishing features).',
      });
      return;
    }

    const item = sqliteDb.getItemById(itemId);
    if (!item) {
      res.status(404).json({ error: 'The item you are claiming does not exist.' });
      return;
    }

    // Security: Student cannot claim their own reported item
    if (item.user_id === user.id) {
      res.status(400).json({
        error: 'You cannot submit an ownership claim for an item you reported yourself.',
      });
      return;
    }

    // Security: Check if user already submitted a pending or verified claim for this item
    const existingClaims = sqliteDb.getClaimsByClaimant(user.id);
    const duplicate = existingClaims.find(
      c => c.item_id === itemId && (c.status === 'pending' || c.status === 'verified')
    );
    if (duplicate) {
      res.status(400).json({
        error: 'You already have an active claim submitted for this item in review.',
      });
      return;
    }

    const newClaim: DbClaim = {
      id: 'clm_' + crypto.randomUUID().slice(0, 8),
      item_id: itemId,
      claimant_id: user.id,
      proof_details: proofDetails.trim(),
      proof_image_url: proofImageUrl || undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const saved = sqliteDb.createClaim(newClaim);

    // Notify the item reporter
    const reporterNotif: DbNotification = {
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: item.user_id,
      title: 'New Ownership Claim Submitted',
      message: `${user.name} submitted an ownership claim for your reported item "${item.title}". Campus Admin will verify details.`,
      link: '/my-reports',
      type: 'claim_update',
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    sqliteDb.createNotification(reporterNotif);

    // Notify claimant
    const claimantNotif: DbNotification = {
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: user.id,
      title: 'Claim Successfully Submitted',
      message: `Your ownership claim for "${item.title}" has been registered. Campus administrators will review your proof.`,
      link: '/my-claims',
      type: 'claim_update',
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    sqliteDb.createNotification(claimantNotif);

    res.status(201).json({
      message: 'Claim submitted successfully for administrator verification.',
      claim: formatClaimResponse(saved),
    });
  } catch (err: any) {
    console.error('Error submitting claim to SQLite:', err);
    res.status(500).json({ error: 'Failed to submit claim.' });
  }
});

// 2. Get My Claims (Security: strictly scoped to req.user.id)
router.get('/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const claims = sqliteDb.getClaimsByClaimant(req.user!.id);
    res.json({ claims: claims.map(formatClaimResponse) });
  } catch (err: any) {
    console.error('Error fetching my claims:', err);
    res.status(500).json({ error: 'Failed to fetch your claims.' });
  }
});

// 3. Admin: View All Claims
router.get('/', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const claims = sqliteDb.getAllClaims();
    res.json({ claims: claims.map(formatClaimResponse) });
  } catch (err: any) {
    console.error('Error fetching all claims:', err);
    res.status(500).json({ error: 'Failed to fetch claims list.' });
  }
});

// 4. Admin: Verify or Reject Claim
router.patch('/:id/verify', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, adminRemarks, adminComment } = req.body;
    const finalComment = (adminRemarks || adminComment || '').trim();

    // Map 'approved' to 'verified'
    const normalizedStatus = status === 'approved' ? 'verified' : status;

    if (!['verified', 'rejected'].includes(normalizedStatus)) {
      res.status(400).json({ error: 'Status must be approved/verified or rejected.' });
      return;
    }

    const claim = sqliteDb.getClaimById(req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    const updated = sqliteDb.updateClaim(req.params.id, {
      status: normalizedStatus,
      admin_comment: finalComment || undefined,
      verified_by: req.user!.name,
      verified_at: new Date().toISOString(),
    });

    const targetItem = sqliteDb.getItemById(claim.item_id);
    const itemTitle = targetItem ? targetItem.title : 'Item';

    // Requirement 8: If approved, item status becomes Returned
    if (normalizedStatus === 'verified') {
      sqliteDb.updateItem(claim.item_id, { status: 'returned' });

      // If there are matches associated with this item, mark them verified
      const itemMatches = sqliteDb.getMatchesForItem(claim.item_id);
      for (const m of itemMatches) {
        sqliteDb.updateMatchStatus(m.id, 'verified');
        // If the other item is open/active, we can also mark it returned if it belonged to the claimant
        const otherItemId = m.lost_item_id === claim.item_id ? m.found_item_id : m.lost_item_id;
        const otherItem = sqliteDb.getItemById(otherItemId);
        if (otherItem && otherItem.user_id === claim.claimant_id && otherItem.status === 'active') {
          sqliteDb.updateItem(otherItemId, { status: 'returned' });
        }
      }
    }

    // Requirement 9: Notify the relevant users

    // 1. Notify claimant
    sqliteDb.createNotification({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: claim.claimant_id,
      title: normalizedStatus === 'verified' ? 'Claim Approved! Item Returned 🎉' : 'Claim Verification Result',
      message: normalizedStatus === 'verified'
        ? `Your ownership claim for "${itemTitle}" was approved by ${req.user!.name}! The item has been officially marked as Returned. ${finalComment ? `Note: ${finalComment}` : 'Visit Gate 1 Security Counter with your Student ID for handover.'}`
        : `Your claim for "${itemTitle}" could not be verified. ${finalComment ? `Reason: ${finalComment}` : ''}`,
      link: '/my-claims',
      type: 'claim_update',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    // 2. Notify the reporter of the item
    if (targetItem && targetItem.user_id !== claim.claimant_id) {
      sqliteDb.createNotification({
        id: 'notif_' + crypto.randomUUID().slice(0, 8),
        user_id: targetItem.user_id,
        title: normalizedStatus === 'verified' ? 'Reported Item Returned! 📦' : 'Claim Review Update',
        message: normalizedStatus === 'verified'
          ? `The ownership claim for your reported item "${itemTitle}" was approved by Campus Admin. The item has been marked as Returned.`
          : `A submitted claim for your reported item "${itemTitle}" was reviewed and rejected by admin. Your report remains active.`,
        link: '/my-reports',
        type: 'item_update',
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      message: normalizedStatus === 'verified' ? 'Claim approved and item marked as Returned.' : 'Claim rejected.',
      claim: formatClaimResponse(updated!),
    });
  } catch (err: any) {
    console.error('Error verifying claim in SQLite:', err);
    res.status(500).json({ error: 'Failed to process claim verification.' });
  }
});

// 5. Admin: Complete Return / Handover
router.patch('/:id/return', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const claim = sqliteDb.getClaimById(req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    const updated = sqliteDb.updateClaim(req.params.id, {
      status: 'returned',
    });

    sqliteDb.updateItem(claim.item_id, { status: 'returned' });

    const targetItem = sqliteDb.getItemById(claim.item_id);
    const itemTitle = targetItem ? targetItem.title : 'Item';

    sqliteDb.createNotification({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: claim.claimant_id,
      title: 'Item Handover Complete! 📦',
      message: `"${itemTitle}" has been officially handed over and marked as returned.`,
      link: '/my-claims',
      type: 'item_update',
      is_read: 0,
      created_at: new Date().toISOString(),
    });

    res.json({
      message: 'Item and claim successfully marked as returned.',
      claim: formatClaimResponse(updated!),
    });
  } catch (err: any) {
    console.error('Error returning item in SQLite:', err);
    res.status(500).json({ error: 'Failed to update return status.' });
  }
});

export default router;
