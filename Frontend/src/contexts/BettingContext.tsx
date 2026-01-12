import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';

import {
  UserAccount,
  BettingMarket,
  UserBet,
  Transaction
} from '../types/betting';

import { bettingApi } from '../services/bettingApi';
import { useAuth } from './AuthContext';

interface BettingContextType {
  // User
  user: UserAccount | null;
  bets: UserBet[];
  transactions: Transaction[];

  // Markets
  markets: BettingMarket[];
  activeMarkets: BettingMarket[];
  settledMarkets: BettingMarket[];

  // State
  loading: boolean;
  error: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  placeBet: (
    marketId: string,
    optionId: string,
    amount: number
  ) => Promise<void>;
  clearError: () => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export const useBetting = () => {
  const ctx = useContext(BettingContext);
  if (!ctx) throw new Error('useBetting must be used within BettingProvider');
  return ctx;
};

export const BettingProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, session } = useAuth(); // Adapted to existing AuthContext structure
  const [user, setUser] = useState<UserAccount | null>(null);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch Everything Needed for Betting UI ----
  const refreshAll = async () => {
    // Rely on session/authUser presence
    if (!session || !authUser) {
      setUser(null);
      setBets([]);
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        userRes,
        marketsRes,
        betsRes,
        txRes
      ] = await Promise.all([
        bettingApi.getMe(),
        bettingApi.getMarkets(),
        bettingApi.getMyBets(),
        bettingApi.getMyTransactions()
      ]);

      // Map backend user response to UserAccount type if needed
      // Assuming userRes matches or we map it:
      const userAccount: UserAccount = {
        id: userRes.id,
        username: userRes.username || authUser.username || 'User',
        email: authUser.email || '',
        balance: userRes.balance || 0, // Ensure balance is present in API response
        totalBets: userRes.total_bets || 0,
        tier: 'bronze' // Placeholder from backend or calc
      };

      setUser(userAccount);
      setMarkets(marketsRes);
      setBets(betsRes);
      setTransactions(txRes);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load betting data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Place Bet (Backend Validates Everything) ----
  const placeBet = async (
    marketId: string,
    optionId: string,
    amount: number
  ) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      await bettingApi.placeBet(marketId, optionId, amount);

      // Always refresh from backend after mutation
      await refreshAll();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Failed to place bet';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  // ---- Auto Refresh On Login / Logout ----
  useEffect(() => {
    refreshAll();
  }, [session]);

  // ---- Poll Markets (Optional) ----
  useEffect(() => {
    const id = setInterval(() => {
      if (session) {
        bettingApi.getMarkets().then(setMarkets).catch(() => { });
      }
    }, 5 * 60 * 1000); // 5 min
    return () => clearInterval(id);
  }, [session]);

  const activeMarkets = markets.filter(m => m.status === 'open' || m.status === 'locked');
  const settledMarkets = markets.filter(m => m.status === 'settled');

  return (
    <BettingContext.Provider
      value={{
        user,
        bets,
        transactions,
        markets,
        activeMarkets,
        settledMarkets,
        loading,
        error,
        refreshAll,
        placeBet,
        clearError
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};
