import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sqliteDb, DbUser } from '../db.js';
import { generateToken, requireAuth, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// 1. Student / User Signup
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, collegeId, phone, department, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a valid full name.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid campus email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (!collegeId || typeof collegeId !== 'string' || collegeId.trim().length < 2) {
      res.status(400).json({ error: 'Please provide your College Roll / ID number.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = sqliteDb.getUserByEmail(trimmedEmail);
    if (existing) {
      res.status(409).json({
        error: 'An account with this email address already exists. Please log in instead.',
      });
      return;
    }

    // Hash password with bcrypt salt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser: DbUser = {
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      name: name.trim(),
      email: trimmedEmail,
      password_hash: passwordHash,
      phone: phone ? String(phone).trim() : '',
      role: role === 'admin' ? 'admin' : 'student',
      college_id: collegeId.trim(),
      department: department ? String(department).trim() : 'General',
      created_at: new Date().toISOString(),
    };

    sqliteDb.createUser(newUser);

    const token = generateToken(newUser);

    // Return sanitized profile (omitting password hash)
    const { password_hash: _, ...safeUser } = newUser;
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        phone: safeUser.phone,
        role: safeUser.role,
        collegeId: safeUser.college_id,
        department: safeUser.department,
        createdAt: safeUser.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error during student registration:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. Student / User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = sqliteDb.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        collegeId: user.college_id,
        department: user.department,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error during user login:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. Current User Profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      collegeId: user.college_id,
      department: user.department,
      createdAt: user.created_at,
    },
  });
});

// 4. Update Profile (security: users can only update their own profile)
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, phone, department } = req.body;

    const updated = sqliteDb.updateUserProfile(user.id, {
      name: name ? String(name).trim() : undefined,
      phone: phone !== undefined ? String(phone).trim() : undefined,
      department: department !== undefined ? String(department).trim() : undefined,
    });

    if (!updated) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        collegeId: updated.college_id,
        department: updated.department,
        createdAt: updated.created_at,
      },
    });
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 5. Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// 6. Admin Only: Get all registered campus users
router.get('/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = sqliteDb.getAllUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    collegeId: u.college_id,
    department: u.department,
    createdAt: u.created_at,
  }));
  res.json({ users });
});

export default router;
