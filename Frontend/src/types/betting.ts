// Simplified Betting Types matching Backend Schema

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalBets: number;
  // Optional legacy fields for component compatibility (can be phasing out)
  tier?: string;
}

export interface MarketOption {
  id: string;
  label: string;
  odds: number;
  probability: number;
}

export interface BettingMarket {
  id: string;
  race_id: string;
  market_type: string;
  status: 'open' | 'locked' | 'settled';
  closing_time: string;
  market_options: MarketOption[];

  // Computed helpers for UI convenience (optional, can be done in component)
  title?: string;
  description?: string;
  isActive?: boolean;
  isSettled?: boolean;
}

export interface UserBet {
  id: string;
  market_id: string;
  option_id: string;
  stake: number;
  payout: number;
  status: 'open' | 'won' | 'lost' | 'settled';
  created_at: string;
}

export enum TransactionType {
  BET_PLACED = 'bet_placed',
  BET_WON = 'bet_won',
  BET_LOST = 'bet_lost',
  DAILY_REWARD = 'daily_reward',
  SIGNUP_BONUS = 'signup_bonus'
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: string;
  created_at?: string; // Optional for backward compatibility
}

// Keep legacy enums if UI components import them, but might be unused.
export enum MarketCategory {
  RACE_WINNER = 'race_winner',
  PODIUM_FINISH = 'podium_finish',
  DRIVER_HEAD_TO_HEAD = 'driver_h2h'
}

export interface MarketFilters {
  category?: string;
  activeOnly?: boolean;
}
