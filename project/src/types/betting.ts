export interface UserAccount {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalWinnings: number;
  totalBets: number;
  winRate: number;
  joinDate: Date;
  lastCurrencyReward: Date;
  firebaseUserId?: string | null;
  isActive: boolean;
}

export interface BettingMarket {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  raceId: string;
  raceName: string;
  raceDate: Date;
  options: MarketOption[];
  totalVolume: number;
  totalBets: number;
  isActive: boolean;
  isSettled: boolean;
  settlementDate?: Date;
  winningOptionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface MarketOption {
  id: string;
  marketId: string;
  title: string;
  description: string;
  currentPrice: number; // Price in cents (0-100)
  totalVolume: number;
  totalBets: number;
  isWinning: boolean;
}

export interface UserBet {
  id: string;
  userId: string;
  marketId: string;
  optionId: string;
  amount: number;
  price: number; // Price when bet was placed (in cents)
  potentialPayout: number;
  status: BetStatus;
  placedAt: Date;
  settledAt?: Date;
  payoutAmount?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: Date;
  relatedBetId?: string;
  relatedMarketId?: string;
}

export enum MarketCategory {
  PODIUM_FINISH = 'PODIUM_FINISH',
  RACE_WINNER = 'RACE_WINNER',
  POLE_POSITION = 'POLE_POSITION',
  SAFETY_CAR = 'SAFETY_CAR',
  FASTEST_LAP = 'FASTEST_LAP',
  DNF_COUNT = 'DNF_COUNT',
  TEAM_PODIUM = 'TEAM_PODIUM',
  QUALIFYING_OUTCOME = 'QUALIFYING_OUTCOME',
  RACE_INCIDENTS = 'RACE_INCIDENTS'
}

export enum BetStatus {
  ACTIVE = 'ACTIVE',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BET_PLACED = 'BET_PLACED',
  BET_WON = 'BET_WON',
  BET_LOST = 'BET_LOST',
  REFUND = 'REFUND',
  DAILY_REWARD = 'DAILY_REWARD',
  SIGNUP_BONUS = 'SIGNUP_BONUS'
}

export interface BettingStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalUsers: number;
  topMarkets: BettingMarket[];
  recentTransactions: Transaction[];
}

export interface MarketFilters {
  category?: MarketCategory;
  raceId?: string;
  isActive?: boolean;
  isSettled?: boolean;
  minVolume?: number;
  maxPrice?: number;
  minPrice?: number;
}

export interface BettingFormData {
  amount: number;
  optionId: string;
  marketId: string;
  confirmBet: boolean;
}
