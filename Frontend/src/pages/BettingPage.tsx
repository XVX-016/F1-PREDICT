import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Trophy,
  AlertCircle,
  XCircle,
  Search,
  Shield
} from 'lucide-react';
import { useBetting } from '../contexts/BettingContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { BettingMarket, MarketCategory, MarketFilters } from '../types/betting';
import MarketCard from '../components/betting/MarketCard';
import BettingStats from '../components/betting/BettingStats';
import MarketFiltersComponent from '../components/betting/MarketFilters';
import SignInModal from '../components/auth/SignInModal';
import BetModal from '../components/betting/BetModal';
// Countdown removed from header per design update
// Countdown removed from header per design update
// import { F1_2025_CALENDAR } from '../data/f1-2025-calendar';
import WalletDisplay from '../components/betting/WalletDisplay';
import BetslipSidebar from '../components/betting/BetslipSidebar';
// Removed dummy sections: Leaderboard, AchievementSystem, RaceArchive
// RaceService not required after switching to shared calendar

interface BettingPageProps {
  onPageChange?: (page: string) => void;
}

export default function BettingPage({ onPageChange }: BettingPageProps) {
  const {
    user,
    markets,
    activeMarkets,
    settledMarkets,
    loading,
    error,
    clearError
  } = useBetting();

  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  const [filteredMarkets, setFilteredMarkets] = useState<BettingMarket[]>([]);
  const [filters, setFilters] = useState<MarketFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'ALL'>('ALL');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<BettingMarket | null>(null);
  const [showBetslip, setShowBetslip] = useState(false);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  // Next race data no longer used in UI
  // const [nextRaceName, setNextRaceName] = useState<string>('');
  // const [nextRaceDateISO, setNextRaceDateISO] = useState<string>('');

  useEffect(() => {
    filterMarkets();
  }, [markets, filters, searchTerm, selectedCategory]);

  // Previously used next race countdown; no longer needed

  const filterMarkets = () => {
    let filtered = markets;

    // Apply category filter
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(market => market.market_type === selectedCategory.toLowerCase());
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(market =>
        (market.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (market.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.race_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.activeOnly) {
      filtered = filtered.filter(market => market.status === 'open');
    }

    if (filters.category && filters.category !== 'ALL') {
      filtered = filtered.filter(market => market.market_type === filters.category!.toLowerCase());
    }

    setFilteredMarkets(filtered);
  };

  const handleMarketClick = (market: BettingMarket) => {
    if (!isAuthenticated) {
      // Navigate to sign up page instead of showing modal
      if (onPageChange) {
        onPageChange('signup');
      }
      return;
    }

    setSelectedMarket(market);
    setShowBetModal(true);
  };

  const handlePlaceBet = () => {
    setShowBetModal(false);
    setSelectedMarket(null);
    addNotification({
      type: 'success',
      title: 'Bet Placed Successfully!',
      message: 'Your bet has been placed and is now active.'
    });
  };

  const handleSwitchToSignUp = () => {
    setShowSignInModal(false);
    if (onPageChange) {
      onPageChange('signup');
    }
  };

  const handleSwitchToForgotPassword = () => {
    setShowSignInModal(false);
    // Note: ForgotPasswordModal would need to be imported and handled
  };


  const handleAddToBetslip = (bet: any) => {
    setSelectedBets(prev => [...prev, bet]);
    setShowBetslip(true);
  };

  const categories = [
    { value: 'ALL', label: 'All Markets', icon: Target },
    { value: MarketCategory.RACE_WINNER, label: 'Race Winners', icon: Trophy },
    { value: MarketCategory.PODIUM_FINISH, label: 'Podium Finishes', icon: TrendingUp },
    { value: MarketCategory.DRIVER_HEAD_TO_HEAD, label: 'Driver H2H', icon: Shield }
  ];

  const MarketSkeleton = () => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[400px] animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-white/10 rounded w-full mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/10 rounded" />)}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/10 rounded" />)}
      </div>
    </div>
  );

  if (loading && markets.length === 0) {
    return (
      <div className="relative z-10 pt-24">
        <div className="text-center mb-8 px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 opacity-50" style={{ fontFamily: '"Orbitron", sans-serif' }}>
            Pole to Podium
          </h1>
          <div className="h-1 bg-red-500/20 w-32 mx-auto rounded-full mt-4" />
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <MarketSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Hero Background is handled globally in App.tsx */}

      {/* Content */}
      <div className="relative z-10 pt-24">
        {/* Hero Section - simplified (no large card) */}
        <div className="mx-4 mb-6">
          <div className="px-2 py-4">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-2" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
                Pole to Podium – Place Your Bets
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Bet with 1Predic Coins. Settle after the chequered flag.
              </p>

              {/* Removed countdown banner per request */}

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isAuthenticated) {
                    // If user is authenticated, scroll to markets section
                    const marketsSection = document.querySelector('.container.mx-auto.px-4.py-8');
                    if (marketsSection) {
                      marketsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    // If user is not authenticated, navigate to signup
                    if (onPageChange) {
                      onPageChange('signup');
                    }
                  }
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-12 py-4 rounded-xl font-semibold text-xl transition-all duration-200 shadow-lg hover:shadow-red-500/25 backdrop-blur-sm border border-red-500/30"
              >
                <Trophy className="inline-block w-6 h-6 mr-3" />
                {isAuthenticated ? 'Browse Markets' : 'Place Bets Now'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Betting Dashboard - Simplified */}
        {isAuthenticated && (
          <div className="container mx-auto px-2 sm:px-4 mb-6 sm:mb-8">
            <div className="bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl">
              <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col space-y-3 sm:space-y-4">
                {/* Dashboard Title */}
                <div className="text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Your Betting Dashboard</h2>
                  <p className="text-sm sm:text-base text-gray-300">Track your bets and wallet balance</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 w-full">
                  {/* Wallet Display */}
                  <div className="flex-1">
                    <WalletDisplay />
                  </div>

                  {/* Betslip Card */}
                  <div className="flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowBetslip(true)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 sm:px-4 lg:px-6 text-center text-white font-medium transition-all duration-200 backdrop-blur-md hover:bg-white/10 h-16 sm:h-20 flex items-center justify-center shadow-lg"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-400" />
                          <span className="text-sm sm:text-base text-gray-300">Betslip</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-extrabold">({selectedBets.length})</span>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        <div className="container mx-auto px-4 py-8">
          {/* Error Display */}
          {error && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-200">{error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-200 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats Section */}
          <BettingStats />

          {/* Removed dummy sections: Leaderboard, AchievementSystem, RaceArchive */}

          {/* Filters and Search */}
          <div className="bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(category.value as MarketCategory | 'ALL')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-md ${selectedCategory === category.value
                        ? 'bg-white/10 text-white shadow-lg shadow-red-500/25 border border-white/20'
                        : 'bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Filters */}
            <MarketFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Markets Grid */}
          <div className="space-y-6">
            {/* Featured Markets (Top 3 Active) */}
            {activeMarkets.length > 0 && selectedCategory === 'ALL' && !searchTerm && (
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-yellow-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white italic" style={{ fontFamily: '"Orbitron", sans-serif' }}>FEATURED MARKETS</h2>
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-yellow-500/30">
                    🔥 Trending
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredMarkets
                    .filter(market => market.isActive)
                    .slice(0, 3)
                    .map((market) => (
                      <div key={`featured-${market.id}`} className="min-w-0 h-full flex transform hover:scale-[1.02] transition-transform duration-300">
                        <MarketCard
                          market={market}
                          onClick={() => handleMarketClick(market)}
                          onAddToBetslip={handleAddToBetslip}
                          userBets={user ? [] : []}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Active Markets */}
            {activeMarkets.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white">Active Markets</h2>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-green-500/30">
                    {activeMarkets.length} markets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch content-stretch">
                  {filteredMarkets
                    .filter(market => market.isActive)
                    .map((market) => (
                      <div key={market.id} className="min-w-0 h-full flex">
                        <MarketCard
                          market={market}
                          onClick={() => handleMarketClick(market)}
                          onAddToBetslip={handleAddToBetslip}
                          userBets={user ? [] : []} // TODO: Add user bets
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Settled Markets */}
            {settledMarkets.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gray-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white">Settled Markets</h2>
                  <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-gray-500/30">
                    {settledMarkets.length} markets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch content-stretch">
                  {filteredMarkets
                    .filter(market => market.isSettled)
                    .map((market) => (
                      <div key={market.id} className="min-w-0 h-full flex">
                        <MarketCard
                          market={market}
                          onClick={() => handleMarketClick(market)}
                          onAddToBetslip={handleAddToBetslip}
                          userBets={user ? [] : []} // TODO: Add user bets
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No Markets */}
            {filteredMarkets.length === 0 && !loading && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No markets found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSignInModal && (
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSwitchToSignUp={handleSwitchToSignUp}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      )}


      {showBetModal && selectedMarket && (
        <BetModal
          isOpen={showBetModal}
          market={selectedMarket}
          onClose={() => setShowBetModal(false)}
          onPlaceBet={handlePlaceBet}
        />
      )}

      {/* Betslip Sidebar */}
      {showBetslip && (
        <BetslipSidebar
          isOpen={showBetslip}
          bets={selectedBets}
          onClose={() => setShowBetslip(false)}
          onConfirmBets={() => {
            setShowBetslip(false);
            setSelectedBets([]);
          }}
        />
      )}
    </div>
  );
}
