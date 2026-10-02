export type UserRole = 'student' | 'admin';
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'active' | 'matched' | 'claimed' | 'returned' | 'closed';
export type ClaimStatus = 'pending' | 'verified' | 'rejected' | 'returned';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId: string;
  phone: string;
  department: string;
  createdAt: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  category: string;
  description: string;
  location: string;
  dateTime: string;
  date?: string;
  time?: string;
  imageUrl?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  rewardInfo?: string;
  securityQuestion?: string;
  storageLocation?: string;
  status: ItemStatus;
  reportedBy: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  proofDetails: string;
  proofImageUrl?: string;
  status: ClaimStatus;
  adminRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: 'claim_update' | 'potential_match' | 'item_update' | 'admin_alert';
  read: boolean;
  createdAt: string;
}

export interface MatchScoreBreakdown {
  imageSimilarity?: number;
  locationSimilarity?: number;
  timeSimilarity?: number;
  descriptionSimilarity?: number;
  categoryPoints?: number;
  keywordPoints?: number;
  locationPoints?: number;
  datePoints?: number;
  final_match_score?: number;
  totalScore: number;
  reasons: string[];
  weights?: {
    image?: string;
    location?: string;
    dateTime?: string;
    description?: string;
  };
}

export interface MatchResult {
  id?: string;
  label?: string;
  imageSimilarityLabel?: string;
  disclaimer?: string;
  item: Item;
  lostItem?: Item;
  foundItem?: Item;
  score: number;
  reasons: string[];
  breakdown: MatchScoreBreakdown;
}

export interface AiStatus {
  status: string;
  isGeminiAvailable: boolean;
  activeModel: string;
  providerName: string;
  dimensions: number;
  vectorDatabase: string;
  storedEmbeddingsCount: number;
  metric: string;
  apiKeyConfigured: boolean;
  weights: {
    imageSimilarity: string;
    locationSimilarity: string;
    timeSimilarity: string;
    descriptionSimilarity: string;
  };
  ownershipDisclaimer: string;
}

export interface UserMatchGroup {
  item: Item;
  matches: MatchResult[];
}

export interface AdminStats {
  // Exactly the 8 KPIs requested:
  totalUsers: number;
  totalLostReports: number;
  totalFoundReports: number;
  potentialMatches: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  returnedItems: number;

  // Additional context
  totalItems: number;
  lostItems?: number;
  foundItems?: number;
  activeItems?: number;
  totalClaims?: number;
  verifiedClaims?: number;
  returnedClaims?: number;
  recoveryRate: number;
  studentUsers: number;
  recentItems: Item[];
  recentClaims: any[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  department: string;
  studentId?: string;
  phone?: string;
  createdAt: string;
  totalLostReports: number;
  totalFoundReports: number;
  totalClaims: number;
  approvedClaims: number;
}

export const CATEGORIES = [
  'Electronics',
  'Documents & ID',
  'Wallets & Bags',
  'Keys',
  'Accessories',
  'Books & Stationery',
  'Clothing',
  'Other',
] as const;

export const CAMPUS_LOCATIONS = [
  'Central Library',
  'Tech Block A (CSE / IT)',
  'Tech Block B (ECE / EE)',
  'Mechanical Workshop',
  'Auditorium & Main Stage',
  'Campus Cafeteria & Food Court',
  'Sports Complex & Gym',
  'Hostel 1 & 2 Area',
  'Hostel 3 & Mess',
  'Girls Hostel Complex',
  'Main Administrative Building',
  'Security Gate 1 (Main Entrance)',
  'Security Gate 2 (Rear Entrance)',
  'Student Activity Center (SAC)',
  'Campus Parking Ground',
  'Medical Centre',
] as const;
