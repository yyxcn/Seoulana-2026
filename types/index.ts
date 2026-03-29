export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  headquarters: string;
  employeeCount: string;
  overview: string;
  glassdoorRating: number;
  interviewDifficulty: string;
  emailDomain: string;
  freeContent: {
    salaryTable: SalaryRow[];
    hiringSpecs: string[];
  };
}

export interface SalaryRow {
  level: string;
  base: string;
  bonus: string;
  stock: string;
  total: string;
}

export interface InsiderProfile {
  id: string;
  walletAddress: string;
  alias: string;
  companyId: string;
  role: string;
  tenure: string;
  avatarColor: string;
}

export interface InsiderPost {
  id: string;
  companyId: string;
  author: InsiderProfile;
  price: number;
  priceLabel: string;
  createdAt: string;
  teaser: string;
  likes: number;
  dislikes: number;
  verified?: boolean;
  paidContent: {
    salaryRange: { min: string; max: string; median: string };
    detailedReview: string;
    interviewExperience: string;
    workLifeBalance: string;
    teamCulture: string;
    pros: string[];
    cons: string[];
    advice: string;
  };
}

export interface UnlockRecord {
  postId: string;
  companyId: string;
  company: string;
  price: number;
  timestamp: number;
  txSignature: string;
  walletAddress: string;
}

export interface UsageStats {
  totalUnlocks: number;
  totalSpent: number;
  todayUnlocks: number;
  todaySpent: number;
}
