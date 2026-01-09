import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount, BettingMarket, UserBet, Transaction, MarketFilters } from '../types/betting';
import BettingService from '../services/BettingService';
import { useAuth } from './AuthContext';

interface BettingContextType {
  // User state
  currentUser: UserAccount | null;
  userBets: UserBet[];
  userTransactions: Transaction[];
  
  // Market state
  markets: BettingMarket[];
  activeMarkets: BettingMarket[];
  settledMarkets: BettingMarket[];
  
  // Loading states
  loading: boolean;
  marketsLoading: boolean;
  userLoading: boolean;
  
  // Actions
  createUser: (username: string, email: string) => Promise<UserAccount>;
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => void;
  placeBet: (marketId: string, optionId: string, amount: number) => Promise<UserBet>;
  getMarkets: (filters?: MarketFilters) => Promise<BettingMarket[]>;
  refreshUserData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export const useBetting = () => {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return context;
};

interface BettingProviderProps {
  children: ReactNode;
}

export const BettingProvider: React.FC<BettingProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [markets, setMarkets] = useState<BettingMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bettingService = BettingService.getInstance();
  const { user: authUser } = useAuth();

  // Load markets on mount and poll every 6 hours
  useEffect(() => {
    loadMarkets();
    const id = setInterval(loadMarkets, 6 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Load user data if user is logged in
  useEffect(() => {
    const savedUserId = localStorage.getItem('betting_user_id');
    if (savedUserId) {
      loginUser(savedUserId);
    }
  }, []);

  // Sync with AuthContext - ensure a betting user exists for the Firebase user
  useEffect(() => {
    const ensureBettingUserForFirebaseUser = async () => {
      try {
        // If there is a saved betting user id, try to load it first
        const savedUserId = localStorage.getItem('betting_user_id');
        if (savedUserId) {
          const existingLocalUser = await bettingService.getUser(savedUserId);
          if (existingLocalUser) {
            setCurrentUser(existingLocalUser);
            await refreshUserData();
            return;
          } else {
            // Stale id from a previous session – remove and continue
            localStorage.removeItem('betting_user_id');
          }
        }

        // If we have a Firebase auth user, map/create a betting user for them
        if (authUser) {
          const username = authUser.username || authUser.email?.split('@')[0] || 'User';
          const email = authUser.email || '';

          let bettingUser = await bettingService.getUserByFirebaseId(authUser.id);
          if (!bettingUser) {
            bettingUser = await bettingService.createUserFromFirebase(authUser.id, username, email);
          }

          if (bettingUser) {
            // Apply any pending offline rewards before showing balance
            await bettingService.applyPendingRewardsForUser(bettingUser.id);
            setCurrentUser(bettingUser);
            localStorage.setItem('betting_user_id', bettingUser.id);
            await refreshUserData();
          }
        } else {
          // No auth user; clear any stale state
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to ensure betting user:', err);
      }
    };

    ensureBettingUserForFirebaseUser();
  }, [authUser]);

  const loadMarkets = async () => {
    try {
      setMarketsLoading(true);
      const allMarkets = await bettingService.getMarkets({ isActive: true });
      // Extra client-side guard: drop any Italian GP remnants from API caches
      const filtered = allMarkets.filter(m => {
        const n = (m.raceName || '').toLowerCase();
        return !(n.includes('italian grand prix') || n.includes('monza'));
      });
      setMarkets(filtered);
    } catch (err) {
      setError('Failed to load markets');
      console.error('Error loading markets:', err);
    } finally {
      setMarketsLoading(false);
    }
  };

  const createUser = async (username: string, email: string): Promise<UserAccount> => {
    try {
      setUserLoading(true);
      setError(null);
      
      const user = await bettingService.createUser(username, email);
      setCurrentUser(user);
      localStorage.setItem('betting_user_id', user.id);
      
      // Load user data
      await refreshUserData();
      
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw err;
    } finally {
      setUserLoading(false);
    }
  };

  const loginUser = async (userId: string): Promise<void> => {
    try {
      setUserLoading(true);
      setError(null);
      
      const user = await bettingService.getUser(userId);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('betting_user_id', user.id);
        await refreshUserData();
      } else {
        // Clear invalid user ID from localStorage and silently ignore
        localStorage.removeItem('betting_user_id');
        setCurrentUser(null);
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      // Clear invalid user ID from localStorage
      localStorage.removeItem('betting_user_id');
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setUserBets([]);
    setUserTransactions([]);
    localStorage.removeItem('betting_user_id');
  };

  const placeBet = async (marketId: string, optionId: string, amount: number): Promise<UserBet> => {
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      setLoading(true);
      setError(null);
      
      const bet = await bettingService.placeBet(currentUser.id, marketId, optionId, amount);
      
      // Refresh user data and markets
      await Promise.all([
        refreshUserData(),
        loadMarkets()
      ]);
      
      return bet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bet';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMarkets = async (filters?: MarketFilters): Promise<BettingMarket[]> => {
    try {
      setMarketsLoading(true);
      const filteredMarkets = await bettingService.getMarkets(filters);
      return filteredMarkets;
    } catch (err) {
      setError('Failed to load markets');
      throw err;
    } finally {
      setMarketsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!currentUser) return;

    try {
      const [bets, transactions] = await Promise.all([
        bettingService.getUserBets(currentUser.id),
        bettingService.getUserTransactions(currentUser.id)
      ]);
      
      setUserBets(bets);
      setUserTransactions(transactions);
      
      // Update current user data
      const updatedUser = await bettingService.getUser(currentUser.id);
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Computed values
  const activeMarkets = markets.filter(market => market.isActive);
  const settledMarkets = markets.filter(market => market.isSettled);

  const value: BettingContextType = {
    currentUser,
    userBets,
    userTransactions,
    markets,
    activeMarkets,
    settledMarkets,
    loading,
    marketsLoading,
    userLoading,
    createUser,
    loginUser,
    logoutUser,
    placeBet,
    getMarkets,
    refreshUserData,
    error,
    clearError
  };

  return (
    <BettingContext.Provider value={value}>
      {children}
    </BettingContext.Provider>
  );
};
