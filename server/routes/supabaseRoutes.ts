import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { supabaseService, SUPABASE_PROJECT_REF, SUPABASE_DASHBOARD_URL, SUPABASE_URL } from '../supabase.js';
import { sqliteDb } from '../db.js';

const router = Router();

// Route: GET /api/supabase/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const health = await supabaseService.checkHealth();
    const stats = {
      usersCount: sqliteDb.getAllUsers().length,
      itemsCount: sqliteDb.getItems({}).length,
      claimsCount: sqliteDb.getAllClaims().length,
      matchesCount: sqliteDb.getAllMatches().length,
    };

    let schemaSql = '';
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    }

    res.json({
      success: true,
      supabase: {
        ...health,
        projectRef: SUPABASE_PROJECT_REF,
        dashboardUrl: SUPABASE_DASHBOARD_URL,
        sqlEditorUrl: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`,
        stats,
      },
      schemaSql,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to check Supabase status',
    });
  }
});

// Route: POST /api/supabase/sync
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    const result = await sqliteDb.syncAllToSupabase();
    res.json({
      success: true,
      message: 'Synced local records with Supabase',
      synced: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to sync with Supabase',
    });
  }
});

// Route: GET /api/supabase/schema
router.get('/schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).send('-- Schema file not found');
    }
  } catch (err: any) {
    res.status(500).send(`-- Error loading schema: ${err.message}`);
  }
});

export default router;
