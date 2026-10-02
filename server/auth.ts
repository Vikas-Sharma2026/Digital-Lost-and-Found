import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sqliteDb, DbUser } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_lost_found_jwt_secret_key_2026_super_secure';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

// Generate signed JWT token
export function generateToken(user: DbUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify token and return user
export function verifyToken(token: string): DbUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (!decoded || !decoded.userId) return null;
    return sqliteDb.getUserById(decoded.userId);
  } catch (err) {
    return null;
  }
}

// Middleware: Require valid authenticated user
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please sign in or provide a valid session token.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({
      error: 'Session expired or token is invalid. Please log in again.',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Require Admin role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Access denied: Administrator privileges are required to perform this action.',
        code: 'ADMIN_ACCESS_REQUIRED',
      });
      return;
    }
    next();
  });
}
