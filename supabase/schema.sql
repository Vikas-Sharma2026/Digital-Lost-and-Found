-- =========================================================================
-- Campus Digital Lost & Found - Supabase Database Schema
-- Project: dwysaxscyrtfxgekwnpl
-- Dashboard: https://supabase.com/dashboard/project/dwysaxscyrtfxgekwnpl
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
    college_id TEXT NOT NULL,
    department TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITEMS TABLE (Lost & Found)
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'active', 'matched', 'claimed', 'returned', 'closed')) DEFAULT 'active',
    contact_name TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    reward_info TEXT,
    security_question TEXT,
    storage_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- 3. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY,
    lost_item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    found_item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    image_similarity REAL NOT NULL DEFAULT 0,
    location_similarity REAL NOT NULL DEFAULT 0,
    time_similarity REAL NOT NULL DEFAULT 0,
    description_similarity REAL NOT NULL DEFAULT 0,
    final_match_score REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('potential', 'verified', 'dismissed')) DEFAULT 'potential',
    reasons TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_lost ON public.matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found ON public.matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(final_match_score DESC);

-- 4. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    claimant_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    proof_details TEXT NOT NULL,
    proof_image_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'returned')) DEFAULT 'pending',
    admin_comment TEXT,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_item ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON public.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims(status);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    type TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- 6. ITEM EMBEDDINGS (AI Vector Embeddings)
CREATE TABLE IF NOT EXISTS public.item_embeddings (
    item_id TEXT PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
    vector TEXT NOT NULL,
    model TEXT NOT NULL,
    dimensions INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and allow read/write for seamless app operations
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public/anon key (application layer handles auth & token verification)
DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for items" ON public.items;
CREATE POLICY "Allow all for items" ON public.items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for matches" ON public.matches;
CREATE POLICY "Allow all for matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for claims" ON public.claims;
CREATE POLICY "Allow all for claims" ON public.claims FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for notifications" ON public.notifications;
CREATE POLICY "Allow all for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for item_embeddings" ON public.item_embeddings;
CREATE POLICY "Allow all for item_embeddings" ON public.item_embeddings FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- SEED INITIAL DATA
-- Default campus users, items, matches, and claims
-- Default passwords:
--   Admin:   admin@campus.edu       / Admin@123
--   Student: rahul.student@campus.edu / Student@123
--   Student: priya.patel@campus.edu   / Student@123
-- =========================================================================

INSERT INTO public.users (id, name, email, password_hash, phone, role, college_id, department, created_at)
VALUES 
    ('usr_admin_001', 'Prof. Ramesh Sharma (Lost & Found Incharge)', 'admin@campus.edu', '$2a$10$w0045/n.YpS3fJ7wVj8jfe/0p01w4v8f0iV5fRz6gWj.4x6H8G6tq', '+91 98765 43210', 'admin', 'FAC-2024-88', 'Campus Security & Welfare Office', NOW() - INTERVAL '30 days'),
    ('usr_student_001', 'Rahul Verma', 'rahul.student@campus.edu', '$2a$10$9B6TfT7t3fEwQyQ2sOqJLeO2V7f8j5k8v8f0iV5fRz6gWj4x6H8Gu', '+91 98123 45678', 'student', '22CS1045', 'Computer Science & Engineering', NOW() - INTERVAL '20 days'),
    ('usr_student_002', 'Priya Patel', 'priya.patel@campus.edu', '$2a$10$9B6TfT7t3fEwQyQ2sOqJLeO2V7f8j5k8v8f0iV5fRz6gWj4x6H8Gu', '+91 97234 56789', 'student', '23EC2019', 'Electronics & Communication', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.items (id, user_id, type, title, category, description, image_url, location, date, time, status, contact_name, contact_phone, contact_email, reward_info, security_question, storage_location, created_at)
VALUES
    ('item_lost_001', 'usr_student_001', 'lost', 'Apple AirPods Pro 2 in White Case', 'Electronics', 'Lost my AirPods Pro (2nd Generation) with a matte black silicone sleeve. Has a small Mario keychain attached. Might have fallen while studying.', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80', 'Central Library - 2nd Floor Reading Hall', '2026-09-23', '14:30', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', 'Canteen treat & gratitude for kind finder!', NULL, NULL, NOW() - INTERVAL '3 days'),
    ('item_found_001', 'usr_student_002', 'found', 'White AirPods Charging Case with Black Protective Cover', 'Electronics', 'Found on table #14 in Central Library near computer terminal. Has a silicone case and a small keychain clip.', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80', 'Central Library - 2nd Floor', '2026-09-24', '11:15', 'active', 'Priya Patel', '+91 97234 56789', 'priya.patel@campus.edu', NULL, 'What keychain figure is attached to the clip?', 'Deposited at Central Library Helpdesk counter', NOW() - INTERVAL '2 days'),
    ('item_lost_002', 'usr_student_001', 'lost', 'Casio fx-991EX Scientific Calculator', 'Books & Stationery', 'Black Casio scientific calculator with silver slide-on cover. My roll number (22CS1045) is written in marker inside the cover.', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', 'Tech Block A - Room 204 (Maths Exam Hall)', '2026-09-21', '09:45', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', NULL, NULL, NULL, NOW() - INTERVAL '5 days'),
    ('item_found_002', 'usr_admin_001', 'found', 'Campus Student ID Card & Metro Pass', 'Documents & ID', 'Found a blue university lanyard with an engineering student ID badge and green metro card inside.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', 'Campus Cafeteria - Food Court Table', '2026-09-25', '13:00', 'active', 'Security Desk Gate 1', '+91 98765 43210', 'security@campus.edu', NULL, 'State the name and branch printed on the card', 'Main Security Office - Gate 1 Lost Box', NOW() - INTERVAL '1 day'),
    ('item_found_003', 'usr_student_002', 'found', 'Stainless Steel Milton Water Bottle (Matte Blue, 1 Litre)', 'Accessories', 'Found near the outdoor basketball court bleachers after sports practice. Has several anime/coding stickers on the side.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80', 'Sports Complex - Basketball Court', '2026-09-22', '17:30', 'active', 'Priya Patel', '+91 97234 56789', 'priya.patel@campus.edu', NULL, NULL, 'With reporter (can be picked up near EC Dept)', NOW() - INTERVAL '4 days'),
    ('item_lost_003', 'usr_student_001', 'lost', 'Black Titan Leather Wallet with Driving License', 'Wallets & Bags', 'Lost brown/black leather bi-fold wallet containing college ID, SBI debit card, and cash. Lost between Hostels and Main Mess.', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', 'Hostel 3 Pathway / Mess Area', '2026-09-20', '20:10', 'active', 'Rahul Verma', '+91 98123 45678', 'rahul.student@campus.edu', 'Rs. 500 reward for returning the documents', NULL, NULL, NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, lost_item_id, found_item_id, image_similarity, location_similarity, time_similarity, description_similarity, final_match_score, status, reasons, created_at)
VALUES (
    'match_001', 'item_lost_001', 'item_found_001', 85, 95, 90, 88, 89.5, 'potential',
    '["Exact category match: Electronics","Matching keywords: airpods, white, case, black, silicone","Common campus area: Central Library","Reported within 24 hours of each other"]',
    NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.claims (id, item_id, claimant_id, proof_details, proof_image_url, status, admin_comment, verified_by, verified_at, created_at)
VALUES (
    'claim_001', 'item_found_001', 'usr_student_001',
    'The keychain attached is a mini red Super Mario figurine with a slight scratch on his hat. The serial number in my Apple ID settings ends with 8J92.',
    NULL, 'pending', NULL, NULL, NULL, NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notifications (id, user_id, message, title, link, type, is_read, created_at)
VALUES 
    ('notif_001', 'usr_student_001', 'A found item "White AirPods Charging Case with Black Protective Cover" reported in Central Library matches your lost report with 89.5% confidence.', 'Potential Match Found! (89.5% Match)', '/matches', 'potential_match', 0, NOW() - INTERVAL '2 days'),
    ('notif_002', 'usr_student_001', 'Your claim for the AirPods in Central Library is under review by Campus Admin.', 'Claim Submitted Successfully', '/my-claims', 'claim_update', 1, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
