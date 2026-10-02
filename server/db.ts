import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lostandfound.sqlite');

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: 'student' | 'admin';
  college_id: string;
  department: string;
  created_at: string;
}

export interface DbItem {
  id: string;
  user_id: string;
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  image_url: string;
  location: string;
  date: string;
  time: string;
  status: 'active' | 'claimed' | 'returned' | 'closed';
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  reward_info?: string;
  security_question?: string;
  storage_location?: string;
  created_at: string;
}

export interface DbMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  image_similarity: number;
  location_similarity: number;
  time_similarity: number;
  description_similarity: number;
  final_match_score: number;
  status: 'potential' | 'verified' | 'dismissed';
  reasons: string;
  created_at: string;
}

export interface DbClaim {
  id: string;
  item_id: string;
  claimant_id: string;
  proof_details: string;
  proof_image_url?: string;
  status: 'pending' | 'verified' | 'rejected' | 'returned';
  admin_comment?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  message: string;
  title: string;
  link?: string;
  type: string;
  is_read: number; // 0 or 1
  created_at: string;
}

class SqliteDatabase {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }

    this.createTables();
    this.seedDefaultData();
    this.persist();
    this.isInitialized = true;
    console.log('✅ SQLite Database initialized and persistent at:', DB_FILE);
  }

  private persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist SQLite database to disk:', err);
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not ready');

    // 1. Users/Profiles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
        college_id TEXT NOT NULL,
        department TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Items Migration Check
    try {
      const itemSchema = this.db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='items';");
      if (itemSchema[0]?.values[0]?.[0]) {
        const sql = itemSchema[0].values[0][0] as string;
        if (!sql.includes("'open'")) {
          this.db.run(`ALTER TABLE items RENAME TO items_old;`);
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Items Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lost', 'found')),
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('open', 'active', 'matched', 'claimed', 'returned', 'closed')),
        contact_name TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        reward_info TEXT,
        security_question TEXT,
        storage_location TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // If migrated from items_old, copy rows over
    try {
      const oldCheck = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='items_old';");
      if (oldCheck[0]?.values?.length > 0) {
        this.db.run(`
          INSERT INTO items SELECT * FROM items_old;
          DROP TABLE items_old;
        `);
      }
    } catch (e) {
      // ignore
    }

    // 3. Matches
    this.db.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        lost_item_id TEXT NOT NULL,
        found_item_id TEXT NOT NULL,
        image_similarity REAL NOT NULL DEFAULT 0,
        location_similarity REAL NOT NULL DEFAULT 0,
        time_similarity REAL NOT NULL DEFAULT 0,
        description_similarity REAL NOT NULL DEFAULT 0,
        final_match_score REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('potential', 'verified', 'dismissed')),
        reasons TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE
      );
    `);

    // 4. Claims
    this.db.run(`
      CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        claimant_id TEXT NOT NULL,
        proof_details TEXT NOT NULL,
        proof_image_url TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending', 'verified', 'rejected', 'returned')),
        admin_comment TEXT,
        verified_by TEXT,
        verified_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 5. Notifications
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT,
        type TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 6. Vector Embeddings for AI-based Image & Item Similarity
    this.db.run(`
      CREATE TABLE IF NOT EXISTS item_embeddings (
        item_id TEXT PRIMARY KEY,
        vector TEXT NOT NULL,
        model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      );
    `);
  }

  private seedDefaultData(): void {
    if (!this.db) return;

    // Check if users table already has data
    const userCountResult = this.db.exec('SELECT COUNT(*) AS count FROM users;');
    const userCount = (userCountResult[0]?.values[0]?.[0] as number) || 0;

    if (userCount > 0) {
      return; // Already seeded
    }

    const saltRounds = 10;
    const adminPassHash = bcrypt.hashSync('Admin@123', saltRounds);
    const student1PassHash = bcrypt.hashSync('Student@123', saltRounds);
    const student2PassHash = bcrypt.hashSync('Student@123', saltRounds);

    const adminId = 'usr_admin_001';
    const student1Id = 'usr_student_001';
    const student2Id = 'usr_student_002';

    // Seed users
    this.db.run(`
      INSERT INTO users (id, name, email, password_hash, phone, role, college_id, department, created_at)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      adminId, 'Prof. Ramesh Sharma (Lost & Found Incharge)', 'admin@campus.edu', adminPassHash, '+91 98765 43210', 'admin', 'FAC-2024-88', 'Campus Security & Welfare Office', new Date(Date.now() - 30 * 86400000).toISOString(),
      student1Id, 'Rahul Verma', 'rahul.student@campus.edu', student1PassHash, '+91 98123 45678', 'student', '22CS1045', 'Computer Science & Engineering', new Date(Date.now() - 20 * 86400000).toISOString(),
      student2Id, 'Priya Patel', 'priya.patel@campus.edu', student2PassHash, '+91 97234 56789', 'student', '23EC2019', 'Electronics & Communication', new Date(Date.now() - 15 * 86400000).toISOString()
    ]);

    // Seed items
    this.db.run(`
      INSERT INTO items (id, user_id, type, title, category, description, image_url, location, date, time, status, contact_name, contact_phone, contact_email, reward_info, security_question, storage_location, created_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      'item_lost_001', student1Id, 'lost', 'Apple AirPods Pro 2 in White Case', 'Electronics', 'Lost my AirPods Pro (2nd Generation) with a matte black silicone sleeve. Has a small Mario keychain attached. Might have fallen while studying.', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80', 'Central Library - 2nd Floor Reading Hall', '2026-09-23', '14:30', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', 'Canteen treat & gratitude for kind finder!', null, null, new Date(Date.now() - 3 * 86400000).toISOString(),
      'item_found_001', student2Id, 'found', 'White AirPods Charging Case with Black Protective Cover', 'Electronics', 'Found on table #14 in Central Library near computer terminal. Has a silicone case and a small keychain clip.', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80', 'Central Library - 2nd Floor', '2026-09-24', '11:15', 'active', 'Priya Patel', '+91 97234 56789', 'priya.patel@campus.edu', null, 'What keychain figure is attached to the clip?', 'Deposited at Central Library Helpdesk counter', new Date(Date.now() - 2 * 86400000).toISOString(),
      'item_lost_002', student1Id, 'lost', 'Casio fx-991EX Scientific Calculator', 'Books & Stationery', 'Black Casio scientific calculator with silver slide-on cover. My roll number (22CS1045) is written in marker inside the cover.', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', 'Tech Block A - Room 204 (Maths Exam Hall)', '2026-09-21', '09:45', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', null, null, null, new Date(Date.now() - 5 * 86400000).toISOString(),
      'item_found_002', adminId, 'found', 'Campus Student ID Card & Metro Pass', 'Documents & ID', 'Found a blue university lanyard with an engineering student ID badge and green metro card inside.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', 'Campus Cafeteria - Food Court Table', '2026-09-25', '13:00', 'active', 'Security Desk Gate 1', '+91 98765 43210', 'security@campus.edu', null, 'State the name and branch printed on the card', 'Main Security Office - Gate 1 Lost Box', new Date(Date.now() - 1 * 86400000).toISOString(),
      'item_found_003', student2Id, 'found', 'Stainless Steel Milton Water Bottle (Matte Blue, 1 Litre)', 'Accessories', 'Found near the outdoor basketball court bleachers after sports practice. Has several anime/coding stickers on the side.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80', 'Sports Complex - Basketball Court', '2026-09-22', '17:30', 'active', 'Priya Patel', '+91 97234 56789', 'priya.patel@campus.edu', null, null, 'With reporter (can be picked up near EC Dept)', new Date(Date.now() - 4 * 86400000).toISOString(),
      'item_lost_003', student1Id, 'lost', 'Black Titan Leather Wallet with Driving License', 'Wallets & Bags', 'Lost brown/black leather bi-fold wallet containing college ID, SBI debit card, and cash. Lost between Hostels and Main Mess.', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', 'Hostel 3 Pathway / Mess Area', '2026-09-20', '20:10', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', 'Rs. 500 reward for returning the documents', null, null, new Date(Date.now() - 6 * 86400000).toISOString()
    ]);

    // Seed match between item_lost_001 and item_found_001
    const matchReasons = JSON.stringify([
      'Exact category match: Electronics',
      'Matching keywords: airpods, white, case, black, silicone',
      'Common campus area: Central Library',
      'Reported within 24 hours of each other'
    ]);

    this.db.run(`
      INSERT INTO matches (id, lost_item_id, found_item_id, image_similarity, location_similarity, time_similarity, description_similarity, final_match_score, status, reasons, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      'match_001', 'item_lost_001', 'item_found_001', 85, 95, 90, 88, 89.5, 'potential', matchReasons, new Date(Date.now() - 2 * 86400000).toISOString()
    ]);

    // Seed claims
    this.db.run(`
      INSERT INTO claims (id, item_id, claimant_id, proof_details, proof_image_url, status, admin_comment, verified_by, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      'claim_001', 'item_found_001', student1Id, 'The keychain attached is a mini red Super Mario figurine with a slight scratch on his hat. The serial number in my Apple ID settings ends with 8J92.', null, 'pending', null, null, null, new Date(Date.now() - 1 * 86400000).toISOString()
    ]);

    // Seed notifications
    this.db.run(`
      INSERT INTO notifications (id, user_id, message, title, link, type, is_read, created_at)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      'notif_001', student1Id, 'A found item "White AirPods Charging Case with Black Protective Cover" reported in Central Library matches your lost report with 89.5% confidence.', 'Potential Match Found! (89.5% Match)', '/matches', 'potential_match', 0, new Date(Date.now() - 2 * 86400000).toISOString(),
      'notif_002', student1Id, 'Your claim for the AirPods in Central Library is under review by Campus Admin.', 'Claim Submitted Successfully', '/my-claims', 'claim_update', 1, new Date(Date.now() - 1 * 86400000).toISOString()
    ]);
  }

  // --- SQL Query Helpers ---

  // USERS
  getUserById(id: string): DbUser | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as DbUser;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  getUserByEmail(email: string): DbUser | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(:email)');
    stmt.bind({ ':email': email.trim() });
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as DbUser;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  getAllUsers(): DbUser[] {
    if (!this.db) return [];
    const results: DbUser[] = [];
    const stmt = this.db.prepare('SELECT id, name, email, phone, role, college_id, department, created_at FROM users ORDER BY created_at DESC');
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbUser);
    }
    stmt.free();
    return results;
  }

  createUser(user: DbUser): DbUser {
    if (!this.db) throw new Error('Database not ready');
    this.db.run(`
      INSERT INTO users (id, name, email, password_hash, phone, role, college_id, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      user.id, user.name, user.email.toLowerCase(), user.password_hash,
      user.phone || '', user.role, user.college_id, user.department || '', user.created_at
    ]);
    this.persist();
    return user;
  }

  updateUserProfile(userId: string, updates: { name?: string; phone?: string; department?: string }): DbUser | null {
    if (!this.db) return null;
    const user = this.getUserById(userId);
    if (!user) return null;

    const newName = updates.name !== undefined ? updates.name : user.name;
    const newPhone = updates.phone !== undefined ? updates.phone : user.phone;
    const newDept = updates.department !== undefined ? updates.department : user.department;

    this.db.run(`
      UPDATE users SET name = ?, phone = ?, department = ? WHERE id = ?;
    `, [newName, newPhone, newDept, userId]);
    this.persist();
    return this.getUserById(userId);
  }

  // ITEMS
  getItemById(id: string): DbItem | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM items WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as DbItem;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  getItems(filters: {
    type?: string;
    category?: string;
    location?: string;
    status?: string;
    user_id?: string;
    q?: string;
    fromDate?: string;
    toDate?: string;
  }): DbItem[] {
    if (!this.db) return [];
    let query = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];

    if (filters.type && filters.type !== 'all') {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.category && filters.category !== 'All') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(filters.category);
    }

    if (filters.location && filters.location !== 'All') {
      query += ' AND LOWER(location) LIKE LOWER(?)';
      params.push(`%${filters.location}%`);
    }

    if (filters.status && filters.status !== 'All') {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.fromDate) {
      query += ' AND date >= ?';
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ' AND date <= ?';
      params.push(filters.toDate);
    }

    if (filters.q) {
      query += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?))';
      const term = `%${filters.q}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY created_at DESC;';

    const results: DbItem[] = [];
    const stmt = this.db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbItem);
    }
    stmt.free();
    return results;
  }

  createItem(item: DbItem): DbItem {
    if (!this.db) throw new Error('Database not ready');
    this.db.run(`
      INSERT INTO items (
        id, user_id, type, title, category, description, image_url,
        location, date, time, status, contact_name, contact_phone,
        contact_email, reward_info, security_question, storage_location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      item.id, item.user_id, item.type, item.title, item.category, item.description,
      item.image_url || '', item.location, item.date, item.time, item.status,
      item.contact_name || '', item.contact_phone || '', item.contact_email || '',
      item.reward_info || null, item.security_question || null,
      item.storage_location || null, item.created_at
    ]);
    this.persist();
    return item;
  }

  updateItem(id: string, updates: Partial<DbItem>): DbItem | null {
    if (!this.db) return null;
    const current = this.getItemById(id);
    if (!current) return null;

    const merged = { ...current, ...updates };

    this.db.run(`
      UPDATE items SET
        title = ?, category = ?, description = ?, image_url = ?,
        location = ?, date = ?, time = ?, status = ?, contact_name = ?,
        contact_phone = ?, contact_email = ?, reward_info = ?,
        security_question = ?, storage_location = ?
      WHERE id = ?;
    `, [
      merged.title, merged.category, merged.description, merged.image_url,
      merged.location, merged.date, merged.time, merged.status, merged.contact_name,
      merged.contact_phone, merged.contact_email, merged.reward_info || null,
      merged.security_question || null, merged.storage_location || null,
      id
    ]);
    this.persist();
    return this.getItemById(id);
  }

  deleteItem(id: string): boolean {
    if (!this.db) return false;
    this.db.run('DELETE FROM items WHERE id = ?;', [id]);
    this.persist();
    return true;
  }

  // MATCHES
  saveMatch(match: DbMatch): DbMatch {
    if (!this.db) throw new Error('Database not ready');
    // Upsert or replace
    this.db.run(`
      INSERT OR REPLACE INTO matches (
        id, lost_item_id, found_item_id, image_similarity, location_similarity,
        time_similarity, description_similarity, final_match_score, status, reasons, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      match.id, match.lost_item_id, match.found_item_id, match.image_similarity,
      match.location_similarity, match.time_similarity, match.description_similarity,
      match.final_match_score, match.status, match.reasons, match.created_at
    ]);
    this.persist();
    return match;
  }

  getMatchesForItem(itemId: string): DbMatch[] {
    if (!this.db) return [];
    const results: DbMatch[] = [];
    const stmt = this.db.prepare(`
      SELECT * FROM matches 
      WHERE (lost_item_id = :id OR found_item_id = :id) AND status != 'dismissed'
      ORDER BY final_match_score DESC;
    `);
    stmt.bind({ ':id': itemId });
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbMatch);
    }
    stmt.free();
    return results;
  }

  getAllMatches(): DbMatch[] {
    if (!this.db) return [];
    const results: DbMatch[] = [];
    const stmt = this.db.prepare('SELECT * FROM matches WHERE status != \'dismissed\' ORDER BY final_match_score DESC');
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbMatch);
    }
    stmt.free();
    return results;
  }

  updateMatchStatus(id: string, status: 'potential' | 'verified' | 'dismissed'): boolean {
    if (!this.db) return false;
    this.db.run('UPDATE matches SET status = ? WHERE id = ?;', [status, id]);
    this.persist();
    return true;
  }

  // CLAIMS
  getClaimById(id: string): DbClaim | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM claims WHERE id = :id');
    stmt.bind({ ':id': id });
    if (stmt.step()) {
      const row = stmt.getAsObject() as unknown as DbClaim;
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  getAllClaims(): DbClaim[] {
    if (!this.db) return [];
    const results: DbClaim[] = [];
    const stmt = this.db.prepare('SELECT * FROM claims ORDER BY created_at DESC');
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbClaim);
    }
    stmt.free();
    return results;
  }

  getClaimsByClaimant(claimantId: string): DbClaim[] {
    if (!this.db) return [];
    const results: DbClaim[] = [];
    const stmt = this.db.prepare('SELECT * FROM claims WHERE claimant_id = :claimant_id ORDER BY created_at DESC');
    stmt.bind({ ':claimant_id': claimantId });
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbClaim);
    }
    stmt.free();
    return results;
  }

  getClaimsByItem(itemId: string): DbClaim[] {
    if (!this.db) return [];
    const results: DbClaim[] = [];
    const stmt = this.db.prepare('SELECT * FROM claims WHERE item_id = :item_id ORDER BY created_at DESC');
    stmt.bind({ ':item_id': itemId });
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbClaim);
    }
    stmt.free();
    return results;
  }

  createClaim(claim: DbClaim): DbClaim {
    if (!this.db) throw new Error('Database not ready');
    this.db.run(`
      INSERT INTO claims (id, item_id, claimant_id, proof_details, proof_image_url, status, admin_comment, verified_by, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      claim.id, claim.item_id, claim.claimant_id, claim.proof_details,
      claim.proof_image_url || null, claim.status, claim.admin_comment || null,
      claim.verified_by || null, claim.verified_at || null, claim.created_at
    ]);
    this.persist();
    return claim;
  }

  updateClaim(id: string, updates: Partial<DbClaim>): DbClaim | null {
    if (!this.db) return null;
    const current = this.getClaimById(id);
    if (!current) return null;

    const merged = { ...current, ...updates };
    this.db.run(`
      UPDATE claims SET
        status = ?, admin_comment = ?, verified_by = ?, verified_at = ?
      WHERE id = ?;
    `, [
      merged.status, merged.admin_comment || null, merged.verified_by || null,
      merged.verified_at || null, id
    ]);
    this.persist();
    return this.getClaimById(id);
  }

  // NOTIFICATIONS
  getNotificationsByUserId(userId: string): DbNotification[] {
    if (!this.db) return [];
    const results: DbNotification[] = [];
    const stmt = this.db.prepare('SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC');
    stmt.bind({ ':user_id': userId });
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as DbNotification);
    }
    stmt.free();
    return results;
  }

  createNotification(notif: DbNotification): DbNotification {
    if (!this.db) throw new Error('Database not ready');
    this.db.run(`
      INSERT INTO notifications (id, user_id, message, title, link, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      notif.id, notif.user_id, notif.message, notif.title, notif.link || null,
      notif.type, notif.is_read, notif.created_at
    ]);
    this.persist();
    return notif;
  }

  markNotificationRead(id: string, userId: string): boolean {
    if (!this.db) return false;
    this.db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?;', [id, userId]);
    this.persist();
    return true;
  }

  markAllNotificationsRead(userId: string): void {
    if (!this.db) return;
    this.db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?;', [userId]);
    this.persist();
  }

  // ITEM EMBEDDINGS (AI Vector Representation)
  saveItemEmbedding(itemId: string, vector: number[], model: string): void {
    if (!this.db) throw new Error('Database not ready');
    const jsonVector = JSON.stringify(vector);
    const createdAt = new Date().toISOString();
    this.db.run(`
      INSERT OR REPLACE INTO item_embeddings (item_id, vector, model, dimensions, created_at)
      VALUES (?, ?, ?, ?, ?);
    `, [itemId, jsonVector, model, vector.length, createdAt]);
    this.persist();
  }

  getItemEmbedding(itemId: string): { itemId: string; vector: number[]; model: string; dimensions: number } | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT item_id, vector, model, dimensions FROM item_embeddings WHERE item_id = :id');
    stmt.bind({ ':id': itemId });
    if (stmt.step()) {
      const row = stmt.getAsObject() as any;
      stmt.free();
      try {
        const parsed = JSON.parse(row.vector);
        return {
          itemId: row.item_id,
          vector: parsed,
          model: row.model,
          dimensions: row.dimensions,
        };
      } catch {
        return null;
      }
    }
    stmt.free();
    return null;
  }

  getAllItemEmbeddings(): Array<{ itemId: string; vector: number[]; model: string; dimensions: number }> {
    if (!this.db) return [];
    const results: Array<{ itemId: string; vector: number[]; model: string; dimensions: number }> = [];
    const stmt = this.db.prepare('SELECT item_id, vector, model, dimensions FROM item_embeddings');
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      try {
        results.push({
          itemId: row.item_id,
          vector: JSON.parse(row.vector),
          model: row.model,
          dimensions: row.dimensions,
        });
      } catch {
        // ignore parse error
      }
    }
    stmt.free();
    return results;
  }

  deleteItemEmbedding(itemId: string): boolean {
    if (!this.db) return false;
    this.db.run('DELETE FROM item_embeddings WHERE item_id = ?;', [itemId]);
    this.persist();
    return true;
  }
}

export const sqliteDb = new SqliteDatabase();
