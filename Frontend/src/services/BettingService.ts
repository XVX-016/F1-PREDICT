import {
  UserAccount,
  BettingMarket,
  MarketOption,
  UserBet,
  Transaction,
  MarketCategory,
  BetStatus,
  TransactionType,
  BettingStats,
  MarketFilters
} from '../types/betting';
import { F1_2025_CALENDAR } from '../data/f1-2025-calendar';
import PredictionMarketService, { DynamicMarketConfig } from './PredictionMarketService';

class BettingService {
  private static instance: BettingService;
  private users: Map<string, UserAccount> = new Map();
  private markets: Map<string, BettingMarket> = new Map();
  private bets: Map<string, UserBet> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private predictionMarketService: PredictionMarketService;
  private readonly STORAGE_KEY = 'f1predict_betting_state_v1';

  private constructor() {
    this.predictionMarketService = PredictionMarketService.getInstance();
    // Attempt to load persisted state; if missing, seed with sample data
    const loaded = this.loadState();
    // Purge any lingering Japanese GP dummy/sample markets from previous versions
    this.purgeDummyJapaneseMarkets();
    // Ensure only the next calendar race remains active in fallback/local mode
    this.alignMarketsToNextCalendarRace();
    // Ensure any markets for past races are locked immediately
    this.enforcePastRaceLocks();
    // Settle and purge concluded Italian GP markets
    this.purgeConcludedItalianMarkets();
    // Ensure Baku City (Azerbaijan GP) markets exist when upcoming
    this.ensureBakuMarkets();
    // Remove fully past markets so UI only shows upcoming
    this.removePastMarkets();
    if (!loaded) {
      // Initialize async data in background
      this.initializeSampleData().catch(error => {
        console.error('Failed to initialize sample data:', error);
      });
    }
    this.saveState();
    this.startCurrencyRewardTimer();
    this.startMarketLockTimer();
  }

  static getInstance(): BettingService {
    if (!BettingService.instance) {
      BettingService.instance = new BettingService();
    }
    return BettingService.instance;
  }

  private async initializeSampleData() {
    // Initialize dynamic markets for upcoming races
    await this.createDynamicMarkets(); // Enable dynamic markets with fallback
  }

  // Persistence helpers
  private saveState() {
    try {
      const data = {
        users: Array.from(this.users.values()).map(u => ({
          ...u,
          joinDate: u.joinDate instanceof Date ? u.joinDate.toISOString() : u.joinDate,
          lastCurrencyReward: u.lastCurrencyReward instanceof Date ? u.lastCurrencyReward.toISOString() : u.lastCurrencyReward
        })),
        markets: Array.from(this.markets.values()).map(m => ({
          ...m,
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
          expiresAt: m.expiresAt instanceof Date ? m.expiresAt.toISOString() : m.expiresAt,
          settlementDate: m.settlementDate instanceof Date ? m.settlementDate.toISOString() : m.settlementDate,
          options: m.options
        })),
        bets: Array.from(this.bets.values()).map(b => ({
          ...b,
          placedAt: b.placedAt instanceof Date ? b.placedAt.toISOString() : b.placedAt,
          settledAt: b.settledAt instanceof Date ? b.settledAt.toISOString() : b.settledAt
        })),
        transactions: Array.from(this.transactions.values()).map(t => ({
          ...t,
          timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp
        }))
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save betting state:', err);
    }
  }

  private loadState(): boolean {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data) return false;

      this.users = new Map((data.users || []).map((u: any) => [u.id, {
        ...u,
        joinDate: u.joinDate ? new Date(u.joinDate) : new Date(),
        lastCurrencyReward: u.lastCurrencyReward ? new Date(u.lastCurrencyReward) : new Date()
      }]));

      this.markets = new Map((data.markets || []).map((m: any) => [m.id, {
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        expiresAt: m.expiresAt ? new Date(m.expiresAt) : new Date(),
        settlementDate: m.settlementDate ? new Date(m.settlementDate) : undefined,
        options: m.options || []
      }]));

      this.bets = new Map((data.bets || []).map((b: any) => [b.id, {
        ...b,
        placedAt: b.placedAt ? new Date(b.placedAt) : new Date(),
        settledAt: b.settledAt ? new Date(b.settledAt) : undefined
      }]));

      this.transactions = new Map((data.transactions || []).map((t: any) => [t.id, {
        ...t,
        timestamp: t.timestamp ? new Date(t.timestamp) : new Date()
      }]));
      // Lock any expired active markets so no new bets can be placed during/after race
      const now = new Date();
      for (const [id, market] of this.markets.entries()) {
        if (market.isActive && market.expiresAt && new Date(market.expiresAt).getTime() < now.getTime()) {
          market.isActive = false; // lock
          market.isSettled = false; // settle later via results
          market.settlementDate = undefined;
          this.markets.set(id, market);
        }
      }
      return true;
    } catch (err) {
      console.warn('Failed to load betting state, starting fresh:', err);
      return false;
    }
  }

  private async createDynamicMarkets() {
    // Only seed the NEXT upcoming race from the shared calendar
    const next = this.getNextCalendarRace();
    if (!next) return;

    // Clear any markets not for the next race
    this.purgeMarketsNotForRace(next.id);

    try {
      console.log(`🎯 Creating dynamic markets for ${next.name}`);

      // Generate dynamic markets using ML predictions
      const dynamicMarkets = await this.predictionMarketService.generateDynamicMarkets(
        next.name,
        next.date.toISOString()
      );

      // Convert dynamic market configs to internal markets
      dynamicMarkets.forEach(marketConfig => {
        this.createMarketInternal({
          id: marketConfig.id,
          title: marketConfig.title,
          description: marketConfig.description,
          category: marketConfig.category,
          raceId: marketConfig.raceId,
          raceName: marketConfig.raceName,
          raceDate: marketConfig.raceDate,
          options: marketConfig.options,
          expiresAt: marketConfig.expiresAt
        });
      });

      console.log(`✅ Created ${dynamicMarkets.length} dynamic markets for ${next.name}`);
      this.saveState();

    } catch (error) {
      console.error(`❌ Error creating dynamic markets for ${next.name}:`, error);
      // Fallback to sample markets if dynamic generation fails
      this.createSampleMarketsFallback(next);
    }
  }

  private createSampleMarketsFallback(race: any) {
    console.log(`🔄 Using fallback sample markets for ${race.name}`);

    // Race Winner Markets
    this.createMarketInternal({
      id: `winner-${race.id}`,
      title: `Race Winner - ${race.name}`,
      description: `Who will win the ${race.name}?`,
      category: MarketCategory.RACE_WINNER,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'max-verstappen', title: 'Max Verstappen', currentPrice: 35 },
        { id: 'lando-norris', title: 'Lando Norris', currentPrice: 28 },
        { id: 'oscar-piastri', title: 'Oscar Piastri', currentPrice: 25 },
        { id: 'charles-leclerc', title: 'Charles Leclerc', currentPrice: 12 },
        { id: 'george-russell', title: 'George Russell', currentPrice: 8 },
        { id: 'field', title: 'Any Other Driver', currentPrice: 2 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // Podium Finish Markets
    this.createMarketInternal({
      id: `podium-${race.id}`,
      title: `Podium Finish - ${race.name}`,
      description: `Which drivers will finish on the podium?`,
      category: MarketCategory.PODIUM_FINISH,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'mclaren-1-2', title: 'McLaren 1-2', currentPrice: 45 },
        { id: 'mclaren-1-3', title: 'McLaren 1-3', currentPrice: 35 },
        { id: 'red-bull-win', title: 'Red Bull Win', currentPrice: 30 },
        { id: 'ferrari-podium', title: 'Ferrari on Podium', currentPrice: 25 },
        { id: 'mercedes-podium', title: 'Mercedes on Podium', currentPrice: 20 },
        { id: 'mixed-podium', title: 'Mixed Teams Podium', currentPrice: 15 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // Safety Car Markets
    this.createMarketInternal({
      id: `safety-car-${race.id}`,
      title: `Safety Car - ${race.name}`,
      description: `Will there be a safety car during the race?`,
      category: MarketCategory.SAFETY_CAR,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'yes', title: 'Yes', currentPrice: 40 },
        { id: 'no', title: 'No', currentPrice: 60 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // DNF Count Markets
    this.createMarketInternal({
      id: `dnf-count-${race.id}`,
      title: `DNF Count - ${race.name}`,
      description: `How many drivers will not finish the race?`,
      category: MarketCategory.DNF_COUNT,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: '0-1', title: '0-1 DNFs', currentPrice: 15 },
        { id: '2-3', title: '2-3 DNFs', currentPrice: 45 },
        { id: '4-5', title: '4-5 DNFs', currentPrice: 30 },
        { id: '6+', title: '6+ DNFs', currentPrice: 10 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // Pole Position Markets
    this.createMarketInternal({
      id: `pole-${race.id}`,
      title: `Pole Position - ${race.name}`,
      description: `Who will take pole for the ${race.name}?`,
      category: MarketCategory.POLE_POSITION,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'max-verstappen', title: 'Max Verstappen', currentPrice: 34 },
        { id: 'lando-norris', title: 'Lando Norris', currentPrice: 26 },
        { id: 'charles-leclerc', title: 'Charles Leclerc', currentPrice: 18 },
        { id: 'george-russell', title: 'George Russell', currentPrice: 12 },
        { id: 'field', title: 'Any Other Driver', currentPrice: 10 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // Fastest Lap Markets
    this.createMarketInternal({
      id: `fastest-lap-${race.id}`,
      title: `Fastest Lap - ${race.name}`,
      description: `Who will set the fastest lap?`,
      category: MarketCategory.FASTEST_LAP,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'max-verstappen', title: 'Max Verstappen', currentPrice: 30 },
        { id: 'lando-norris', title: 'Lando Norris', currentPrice: 24 },
        { id: 'charles-leclerc', title: 'Charles Leclerc', currentPrice: 18 },
        { id: 'oscar-piastri', title: 'Oscar Piastri', currentPrice: 16 },
        { id: 'field', title: 'Any Other Driver', currentPrice: 12 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    // Team Podium Markets
    this.createMarketInternal({
      id: `team-podium-${race.id}`,
      title: `Team Podium - ${race.name}`,
      description: `Will a team place two cars on the podium?`,
      category: MarketCategory.TEAM_PODIUM,
      raceId: race.id,
      raceName: race.name,
      raceDate: race.date,
      options: [
        { id: 'mclaren-double', title: 'McLaren double podium', currentPrice: 22 },
        { id: 'redbull-double', title: 'Red Bull double podium', currentPrice: 20 },
        { id: 'ferrari-double', title: 'Ferrari double podium', currentPrice: 18 },
        { id: 'any-double', title: 'Any team double podium', currentPrice: 25 },
        { id: 'no-double', title: 'No team double podium', currentPrice: 15 }
      ] as any[],
      expiresAt: new Date(race.date.getTime())
    });

    this.saveState();
  }

  // Remove any lingering Japanese GP dummy/sample markets from local storage
  private purgeDummyJapaneseMarkets() {
    let changed = false;
    for (const [id, m] of this.markets.entries()) {
      const name = (m.raceName || '').toLowerCase();
      const rid = (m.raceId || '').toLowerCase();
      if (
        name.includes('japanese grand prix') ||
        name.includes('japanese gp') ||
        name.includes('suzuka') ||
        rid.includes('japan-') ||
        rid.includes('japanese') ||
        rid.includes('suzuka')
      ) {
        this.markets.delete(id);
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  // Keep only markets for the next calendar race (remove USA if Azerbaijan is next)
  private alignMarketsToNextCalendarRace() {
    const next = this.getNextCalendarRace();
    if (!next) return;
    this.purgeMarketsNotForRace(next.id);
  }

  private purgeMarketsNotForRace(nextRaceId: string) {
    let changed = false;
    for (const [id, m] of this.markets.entries()) {
      if (m.raceId !== nextRaceId) {
        this.markets.delete(id);
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  // Seed Baku City Circuit markets if Azerbaijan GP is the next or upcoming race
  private ensureBakuMarkets() {
    try {
      const race = F1_2025_CALENDAR.find((r: any) => (r.raceName || '').toLowerCase().includes('azerbaijan grand prix'));
      if (!race) return;
      const raceStart = new Date(`${race.date}T${race.time}:00Z`);
      if (Date.now() >= raceStart.getTime()) return; // don't seed if already started/past

      const idBase = `${(race.raceName || '').toLowerCase()
        .replace(/ grand prix/i, ' gp')
        .replace(/\s+gp/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}-2025`;

      const hasBaku = Array.from(this.markets.values()).some(m => {
        const n = (m.raceName || '').toLowerCase();
        return n.includes('azerbaijan grand prix') || n.includes('baku');
      });
      if (hasBaku) return;

      // Winner market
      this.createMarketInternal({
        id: `winner-${idBase}`,
        title: `Race Winner - ${race.raceName}`,
        description: `Who will win the ${race.raceName}?`,
        category: MarketCategory.RACE_WINNER,
        raceId: idBase,
        raceName: race.raceName,
        raceDate: raceStart,
        options: [
          { id: 'max-verstappen', title: 'Max Verstappen', currentPrice: 35 },
          { id: 'lando-norris', title: 'Lando Norris', currentPrice: 28 },
          { id: 'charles-leclerc', title: 'Charles Leclerc', currentPrice: 18 },
          { id: 'oscar-piastri', title: 'Oscar Piastri', currentPrice: 16 },
          { id: 'george-russell', title: 'George Russell', currentPrice: 12 },
          { id: 'field', title: 'Any Other Driver', currentPrice: 8 }
        ] as any[],
        expiresAt: new Date(raceStart.getTime())
      });

      // Safety Car market
      this.createMarketInternal({
        id: `safety-car-${idBase}`,
        title: `Safety Car - ${race.raceName}`,
        description: `Will there be a safety car during the race?`,
        category: MarketCategory.SAFETY_CAR,
        raceId: idBase,
        raceName: race.raceName,
        raceDate: raceStart,
        options: [
          { id: 'yes', title: 'Yes', currentPrice: 55 },
          { id: 'no', title: 'No', currentPrice: 45 }
        ] as any[],
        expiresAt: new Date(raceStart.getTime())
      });

      // Podium market
      this.createMarketInternal({
        id: `podium-${idBase}`,
        title: `Podium Finish - ${race.raceName}`,
        description: `Which drivers will finish on the podium?`,
        category: MarketCategory.PODIUM_FINISH,
        raceId: idBase,
        raceName: race.raceName,
        raceDate: raceStart,
        options: [
          { id: 'mclaren-1-2', title: 'McLaren 1-2', currentPrice: 35 },
          { id: 'red-bull-win', title: 'Red Bull Win', currentPrice: 32 },
          { id: 'ferrari-podium', title: 'Ferrari on Podium', currentPrice: 26 },
          { id: 'mixed-podium', title: 'Mixed Teams Podium', currentPrice: 20 }
        ] as any[],
        expiresAt: new Date(raceStart.getTime())
      });

      this.saveState();
    } catch { }
  }

  // Lock any market whose race date or expiration is in the past
  private enforcePastRaceLocks() {
    const now = Date.now();
    let changed = false;
    for (const [id, market] of this.markets.entries()) {
      const raceTime = market.raceDate ? new Date(market.raceDate).getTime() : 0;
      const expireTime = market.expiresAt ? new Date(market.expiresAt).getTime() : 0;
      if (market.isActive && ((expireTime && expireTime <= now) || (raceTime && raceTime <= now))) {
        market.isActive = false;
        market.isSettled = false;
        market.settlementDate = undefined;
        this.markets.set(id, market);
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  // Hard delete markets for races that are already finished (1h past race start)
  private removePastMarkets() {
    const now = Date.now();
    const cutoff = now - 60 * 60 * 1000; // one hour ago
    let changed = false;
    for (const [id, market] of this.markets.entries()) {
      const raceTs = market.raceDate ? new Date(market.raceDate).getTime() : 0;
      if (raceTs && raceTs <= cutoff) {
        this.markets.delete(id);
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  // Settle and remove concluded Italian GP markets so UI moves to next race (e.g., Baku)
  private async purgeConcludedItalianMarkets() {
    const now = Date.now();
    const targets: BettingMarket[] = [];
    for (const m of this.markets.values()) {
      const name = (m.raceName || '').toLowerCase();
      const rid = (m.raceId || '').toLowerCase();
      const raceTs = m.raceDate ? new Date(m.raceDate).getTime() : 0;
      const isItalian = name.includes('italian grand prix') || name.includes('monza') || rid.includes('italy') || rid.includes('monza') || rid.includes('italian');
      if (isItalian && raceTs && raceTs < now) {
        targets.push(m);
      }
    }
    if (targets.length === 0) return;

    for (const m of targets) {
      try {
        // Choose winner by highest volume as heuristic if not already settled
        let winningOptionId: string | undefined = m.winningOptionId;
        if (!winningOptionId && m.options && m.options.length > 0) {
          winningOptionId = m.options.slice().sort((a, b) => b.totalVolume - a.totalVolume)[0].id;
        }
        if (winningOptionId) {
          await this.settleMarket(m.id, winningOptionId);
        }
        // Remove from active markets map to ensure it no longer shows up
        this.markets.delete(m.id);
      } catch { }
    }
    this.saveState();
  }

  public getNextCalendarRace(): { id: string; name: string; date: Date; circuit: string } | null {
    const now = new Date();
    const upcoming = F1_2025_CALENDAR
      .map(r => ({
        idBase: r.raceName.toLowerCase()
          .replace(/ grand prix/i, ' gp')
          .replace(/\s+gp/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        name: r.raceName.replace(/\bGP\b/, 'Grand Prix'),
        startISO: `${r.date}T${r.time}:00Z`,
        circuit: r.circuitName
      }))
      .filter(r => new Date(r.startISO) >= now)
      .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());

    if (upcoming.length === 0) return null;
    const first = upcoming[0];
    return {
      id: `${first.idBase}-2025`,
      name: first.name,
      date: new Date(first.startISO),
      circuit: first.circuit
    };
  }

  // Convert simple option seeds into full MarketOption objects
  private buildMarketOptions(marketId: string, rawOptions: any[]): MarketOption[] {
    return (rawOptions || []).map((opt: any) => ({
      id: String(opt.id),
      marketId: marketId,
      title: String(opt.title || opt.name || 'Option'),
      description: String(opt.description || opt.title || opt.name || 'Option'),
      currentPrice: typeof opt.currentPrice === 'number'
        ? Math.max(0, Math.min(100, Math.round(opt.currentPrice)))
        : Math.max(0, Math.min(100, Math.round(Number(opt.price ?? 10)))),
      totalVolume: 0,
      totalBets: 0,
      isWinning: Boolean(opt.isWinning) || false
    }));
  }

  // Internal helper to create a market from partial seed data (sample/fallback)
  private createMarketInternal(marketData: any) {
    const market: BettingMarket = {
      id: marketData.id!,
      title: marketData.title!,
      description: marketData.description!,
      category: marketData.category!,
      raceId: marketData.raceId!,
      raceName: marketData.raceName!,
      raceDate: marketData.raceDate!,
      options: this.buildMarketOptions(marketData.id!, marketData.options as any[]),
      totalVolume: 0,
      totalBets: 0,
      isActive: true,
      isSettled: false,
      createdAt: new Date(),
      expiresAt: marketData.expiresAt!
    };

    this.markets.set(market.id, market);
  }

  // Market maintenance utilities
  clearMarkets(predicate?: (m: BettingMarket) => boolean): void {
    if (!predicate) {
      this.markets.clear();
      this.saveState();
      return;
    }
    for (const [id, m] of this.markets.entries()) {
      if (predicate(m)) {
        this.markets.delete(id);
      }
    }
    this.saveState();
  }

  // User Management
  async createUser(username: string, email: string): Promise<UserAccount> {
    const user: UserAccount = {
      id: `user-${Date.now()}`,
      username,
      email,
      balance: 10000, // 10k starting balance
      totalWinnings: 0,
      totalBets: 0,
      winRate: 0,
      joinDate: new Date(),
      lastCurrencyReward: new Date(),
      firebaseUserId: null, // Legacy users don't have Firebase ID
      isActive: true
    };

    this.users.set(user.id, user);

    // Add signup bonus transaction
    this.addTransaction(user.id, TransactionType.SIGNUP_BONUS, 10000, 'Welcome bonus');

    this.saveState();
    return user;
  }

  // Create user from Firebase authentication
  async createUserFromFirebase(firebaseUserId: string, username: string, email: string): Promise<UserAccount> {
    const user: UserAccount = {
      id: `user-${Date.now()}`,
      username,
      email,
      balance: 10000, // 10k starting balance
      totalWinnings: 0,
      totalBets: 0,
      winRate: 0,
      joinDate: new Date(),
      lastCurrencyReward: new Date(),
      firebaseUserId: firebaseUserId,
      isActive: true
    };

    this.users.set(user.id, user);

    // Add welcome bonus transaction
    this.addTransaction(user.id, TransactionType.SIGNUP_BONUS, 10000, 'Welcome bonus - 10,000 PC');

    this.saveState();
    return user;
  }

  // Get user by Firebase ID
  async getUserByFirebaseId(firebaseUserId: string): Promise<UserAccount | null> {
    for (const user of this.users.values()) {
      if (user.firebaseUserId === firebaseUserId) {
        return user;
      }
    }
    return null;
  }

  async getUser(userId: string): Promise<UserAccount | null> {
    return this.users.get(userId) || null;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance += amount;
      this.users.set(userId, user);
    }
    this.saveState();
  }

  // Market Management
  async getMarkets(filters?: MarketFilters): Promise<BettingMarket[]> {
    try {
      // Fetch from real API with enhanced error handling
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const queryParams = new URLSearchParams();

      if (filters) {
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.raceId) queryParams.append('race_id', filters.raceId);
        if (filters.isActive !== undefined) queryParams.append('status', filters.isActive ? 'open' : 'closed');
        if (filters.minVolume) queryParams.append('min_volume', filters.minVolume.toString());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${baseUrl}/api/v1/markets?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Markets API endpoint not found, using sample data');
          return await this.getSampleMarkets();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Determine next race from shared calendar (UTC)
      const now = new Date();
      const upcoming = F1_2025_CALENDAR
        .map(r => ({ name: r.raceName, startISO: `${r.date}T${r.time}:00Z` }))
        .filter(r => new Date(r.startISO) > now)
        .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
      const nextRaceName = upcoming[0]?.name;

      // Transform API data to our format and align to next race
      if (data.data && Array.isArray(data.data)) {
        const transformed: BettingMarket[] = data.data.map((market: any) => ({
          id: market.id,
          title: market.title,
          description: market.description,
          category: this.mapMarketTypeToCategory(market.market_type),
          raceId: market.race_id,
          raceName: market.race_name || 'Unknown Race',
          raceDate: new Date(market.race_date || market.created_at),
          options: market.selections?.map((selection: any) => ({
            id: selection.id,
            marketId: market.id,
            title: selection.title,
            description: selection.title,
            currentPrice: Math.round(selection.odds * 100), // Convert to percentage
            totalVolume: 0,
            totalBets: 0,
            isWinning: selection.is_winner || false
          })) || [],
          totalVolume: 0,
          totalBets: 0,
          isActive: market.status === 'open',
          isSettled: market.status === 'settled',
          createdAt: new Date(market.created_at),
          expiresAt: new Date(market.closing_time)
        }));

        // Post-process: lock any markets for past races regardless of API status
        const nowTs = Date.now();
        const normalize = (name: string) => (name || '').toLowerCase().replace(/ gp\b/g, ' grand prix');
        const calendarDateFor = (raceName: string): number | null => {
          const rn = normalize(raceName);
          const entry = F1_2025_CALENDAR.find((r: any) => normalize(r.raceName) === rn);
          if (!entry) return null;
          const iso = `${entry.date}T${entry.time}:00Z`;
          return new Date(iso).getTime();
        };
        transformed.forEach(m => {
          const expTs = m.expiresAt ? m.expiresAt.getTime() : 0;
          const raceTs = m.raceDate ? m.raceDate.getTime() : 0;
          const calTs = calendarDateFor(m.raceName) || 0;
          if (m.isActive && ((expTs && expTs <= nowTs) || (raceTs && raceTs <= nowTs) || (calTs && calTs <= nowTs))) {
            m.isActive = false;
            m.isSettled = false;
            m.settlementDate = undefined;
          }
        });

        // If API returns markets for a different race than next calendar race, prefer calendar
        if (nextRaceName) {
          const nr = nextRaceName.toLowerCase().replace(' gp', '');
          const upcomingOnly = transformed.filter(m => m.isActive && m.raceDate.getTime() > Date.now());
          const apiForNext = upcomingOnly.filter(m => (m.raceName || '').toLowerCase().includes(nr));
          if (apiForNext.length > 0) {
            return apiForNext;
          }
          // Prefer local calendar next race markets if present
          const nextObj = this.getNextCalendarRace();
          if (nextObj) {
            const localForNext = Array.from(this.markets.values()).filter(m => m.raceId === nextObj.id && m.isActive);
            if (localForNext.length === 0) {
              this.ensureUpcomingRaceMarkets();
            }
            const localNow = Array.from(this.markets.values()).filter(m => m.raceId === nextObj.id && m.isActive);
            if (localNow.length > 0) {
              return localNow;
            }
          }
          if (upcomingOnly.length > 0) {
            return upcomingOnly;
          }
          // Otherwise, fall back to local calendar seeding to avoid wrong/past race
          return await this.getSampleMarkets();
        }
        return transformed.filter(m => m.isActive && m.raceDate.getTime() > Date.now());
      } else {
        console.warn('Invalid API response format, using sample data');
        return await this.getSampleMarkets();
      }
    } catch (error: any) {
      console.error('Error fetching markets from API:', error);

      // Handle specific error types
      if (error && error.name === 'AbortError') {
        console.warn('Request timeout, using sample data');
      } else if (typeof error?.message === 'string' && error.message.includes('Failed to fetch')) {
        console.warn('Network error, using sample data');
      }

      // Fallback to sample data if API fails
      const markets = await this.getSampleMarkets();
      this.enforcePastRaceLocks();
      return markets;
    }
  }

  private mapMarketTypeToCategory(marketType: string): MarketCategory {
    const mapping: { [key: string]: MarketCategory } = {
      'race_winner': MarketCategory.RACE_WINNER,
      'podium': MarketCategory.PODIUM_FINISH,
      'pole_position': MarketCategory.POLE_POSITION,
      'fastest_lap': MarketCategory.FASTEST_LAP,
      'safety_car': MarketCategory.SAFETY_CAR,
      'dnf_count': MarketCategory.DNF_COUNT,
      'team_podium': MarketCategory.TEAM_PODIUM
    };
    return mapping[marketType] || MarketCategory.RACE_WINNER;
  }

  private async getSampleMarkets(): Promise<BettingMarket[]> {
    // Align to next race and lock past markets
    this.alignMarketsToNextCalendarRace();
    this.enforcePastRaceLocks();
    this.ensureBakuMarkets();
    // Ensure there are sensible upcoming markets
    if (this.markets.size === 0) {
      await this.createDynamicMarkets();
    } else {
      this.ensureUpcomingRaceMarkets();
    }
    const now = Date.now();
    const upcomingOnly = Array.from(this.markets.values())
      .filter(m => m.isActive && m.raceDate && new Date(m.raceDate).getTime() > now)
      .sort((a, b) => a.raceDate.getTime() - b.raceDate.getTime());
    if (upcomingOnly.length > 0) return upcomingOnly;
    // Fallback: return any active markets if upcoming not found
    const anyActive = Array.from(this.markets.values()).filter(m => m.isActive);
    if (anyActive.length > 0) return anyActive.sort((a, b) => a.raceDate.getTime() - b.raceDate.getTime());
    // Last resort: seed fresh and return whatever was added
    await this.createDynamicMarkets();
    return Array.from(this.markets.values()).filter(m => m.isActive);
  }

  // Ensure key upcoming races are present (e.g., Italian GP) and stale ones are settled
  private ensureUpcomingRaceMarkets() {
    const now = new Date();
    const upcoming = F1_2025_CALENDAR
      .map(r => ({
        idBase: r.raceName.toLowerCase()
          .replace(/ grand prix/i, ' gp')
          .replace(/\s+gp/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        name: r.raceName.replace(/\bGP\b/, 'Grand Prix'),
        startISO: `${r.date}T${r.time}:00Z`,
        circuit: r.circuitName
      }))
      .filter(r => new Date(r.startISO) > now)
      .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());

    if (upcoming.length === 0) return;
    const next = upcoming[0];
    const raceId = `${next.idBase}-2025`;

    const hasNext = Array.from(this.markets.values()).some(m => m.raceId === raceId);
    if (hasNext) return;

    const raceDate = new Date(next.startISO);

    // Winner
    this.createMarketInternal({
      id: `winner-${raceId}`,
      title: `Race Winner - ${next.name}`,
      description: `Who will win the ${next.name}?`,
      category: MarketCategory.RACE_WINNER,
      raceId: raceId,
      raceName: next.name,
      raceDate: raceDate,
      options: [
        { id: 'max-verstappen', title: 'Max Verstappen', price: 35 },
        { id: 'lando-norris', title: 'Lando Norris', price: 28 },
        { id: 'oscar-piastri', title: 'Oscar Piastri', price: 25 },
        { id: 'charles-leclerc', title: 'Charles Leclerc', price: 12 },
        { id: 'george-russell', title: 'George Russell', price: 8 },
        { id: 'field', title: 'Any Other Driver', price: 2 }
      ],
      expiresAt: new Date(raceDate.getTime())
    });

    // Podium
    this.createMarketInternal({
      id: `podium-${raceId}`,
      title: `Podium Finish - ${next.name}`,
      description: `Which drivers will finish on the podium?`,
      category: MarketCategory.PODIUM_FINISH,
      raceId: raceId,
      raceName: next.name,
      raceDate: raceDate,
      options: [
        { id: 'mclaren-1-2', title: 'McLaren 1-2', price: 45 },
        { id: 'mclaren-1-3', title: 'McLaren 1-3', price: 35 },
        { id: 'red-bull-win', title: 'Red Bull Win', price: 30 },
        { id: 'ferrari-podium', title: 'Ferrari on Podium', price: 25 },
        { id: 'mercedes-podium', title: 'Mercedes on Podium', price: 20 },
        { id: 'mixed-podium', title: 'Mixed Teams Podium', price: 15 }
      ],
      expiresAt: new Date(raceDate.getTime())
    });

    // Safety Car
    this.createMarketInternal({
      id: `safety-car-${raceId}`,
      title: `Safety Car - ${next.name}`,
      description: `Will there be a safety car during the race?`,
      category: MarketCategory.SAFETY_CAR,
      raceId: raceId,
      raceName: next.name,
      raceDate: raceDate,
      options: [
        { id: 'yes', title: 'Yes', price: 40 },
        { id: 'no', title: 'No', price: 60 }
      ],
      expiresAt: new Date(raceDate.getTime())
    });

    // DNF Count
    this.createMarketInternal({
      id: `dnf-count-${raceId}`,
      title: `DNF Count - ${next.name}`,
      description: `How many drivers will not finish the race?`,
      category: MarketCategory.DNF_COUNT,
      raceId: raceId,
      raceName: next.name,
      raceDate: raceDate,
      options: [
        { id: '0-1', title: '0-1 DNFs', price: 15 },
        { id: '2-3', title: '2-3 DNFs', price: 45 },
        { id: '4-5', title: '4-5 DNFs', price: 30 },
        { id: '6+', title: '6+ DNFs', price: 10 }
      ],
      expiresAt: new Date(raceDate.getTime())
    });
    this.saveState();
  }

  async getMarket(marketId: string): Promise<BettingMarket | null> {
    return this.markets.get(marketId) || null;
  }

  // Betting Operations
  async placeBet(userId: string, marketId: string, optionId: string, amount: number): Promise<UserBet> {
    const user = this.users.get(userId);
    const market = this.markets.get(marketId);
    const option = market?.options.find(o => o.id === optionId);

    if (!user || !market || !option) {
      throw new Error('Invalid user, market, or option');
    }

    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    if (!market.isActive) {
      throw new Error('Market is not active');
    }

    if (new Date() > market.expiresAt) {
      throw new Error('Market has expired');
    }

    // Calculate potential payout
    const potentialPayout = (amount / option.currentPrice) * 100;

    // Create bet
    const bet: UserBet = {
      id: `bet-${Date.now()}`,
      userId,
      marketId,
      optionId,
      amount,
      price: option.currentPrice,
      potentialPayout,
      status: BetStatus.ACTIVE,
      placedAt: new Date()
    };

    // Update user balance and persist immediately
    user.balance -= amount;
    user.totalBets += 1;
    this.users.set(userId, user);

    // Update market and option volumes
    option.totalVolume += amount;
    option.totalBets += 1;
    market.totalVolume += amount;
    market.totalBets += 1;

    // Recalculate option prices based on volume
    this.recalculatePrices(market);

    this.markets.set(marketId, market);
    this.bets.set(bet.id, bet);

    // Add transaction
    this.addTransaction(userId, TransactionType.BET_PLACED, -amount, `Bet placed on ${option.title}`);
    this.saveState();

    this.saveState();

    return bet;
  }

  private recalculatePrices(market: BettingMarket) {
    const totalVolume = market.options.reduce((sum, opt) => sum + opt.totalVolume, 0);

    market.options.forEach(option => {
      if (totalVolume > 0) {
        option.currentPrice = Math.round((option.totalVolume / totalVolume) * 100);
      } else {
        option.currentPrice = Math.round(100 / market.options.length);
      }
    });
  }

  async getUserBets(userId: string): Promise<UserBet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  async getBet(betId: string): Promise<UserBet | null> {
    return this.bets.get(betId) || null;
  }

  // Settlement
  async settleMarket(marketId: string, winningOptionId: string): Promise<void> {
    const market = this.markets.get(marketId);
    if (!market) return;

    market.isActive = false;
    market.isSettled = true;
    market.settlementDate = new Date();
    market.winningOptionId = winningOptionId;

    // Mark winning option
    market.options.forEach(option => {
      option.isWinning = option.id === winningOptionId;
    });

    // Settle all bets for this market
    const marketBets = Array.from(this.bets.values()).filter(bet => bet.marketId === marketId);

    for (const bet of marketBets) {
      await this.settleBet(bet.id, bet.optionId === winningOptionId);
    }

    this.markets.set(marketId, market);
    this.saveState();
  }

  private async settleBet(betId: string, isWinning: boolean): Promise<void> {
    const bet = this.bets.get(betId);
    if (!bet) return;

    bet.status = BetStatus.SETTLED;
    bet.settledAt = new Date();

    const user = this.users.get(bet.userId);
    if (!user) return;

    if (isWinning) {
      bet.payoutAmount = bet.potentialPayout;
      user.balance += bet.payoutAmount;
      user.totalWinnings += bet.payoutAmount;
      this.addTransaction(bet.userId, TransactionType.BET_WON, bet.payoutAmount, 'Bet won');
    } else {
      this.addTransaction(bet.userId, TransactionType.BET_LOST, 0, 'Bet lost');
    }

    // Update win rate
    const userBets = Array.from(this.bets.values()).filter(b => b.userId === bet.userId && b.status === BetStatus.SETTLED);
    const wonBets = userBets.filter(b => b.payoutAmount && b.payoutAmount > 0);
    user.winRate = userBets.length > 0 ? (wonBets.length / userBets.length) * 100 : 0;

    this.users.set(bet.userId, user);
    this.bets.set(betId, bet);
    this.saveState();
  }

  // Transactions
  private addTransaction(userId: string, type: TransactionType, amount: number, description: string): void {
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      type,
      amount,
      description,
      timestamp: new Date()
    };

    this.transactions.set(transaction.id, transaction);
    this.saveState();
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Currency Rewards
  private startCurrencyRewardTimer() {
    setInterval(() => {
      this.distributeCurrencyRewards();
    }, 4 * 60 * 60 * 1000); // Every 4 hours
  }

  // Background task: lock markets at/after race start so no new bets can be placed
  private startMarketLockTimer() {
    const lockExpiredMarkets = async () => {
      const now = Date.now();
      let changed = false;
      for (const [id, market] of this.markets.entries()) {
        const raceTime = market.raceDate ? new Date(market.raceDate).getTime() : 0;
        const expireTime = market.expiresAt ? new Date(market.expiresAt).getTime() : 0;
        if (market.isActive && ((expireTime && expireTime <= now) || (raceTime && raceTime <= now))) {
          market.isActive = false;
          market.isSettled = false;
          market.settlementDate = undefined;
          this.markets.set(id, market);
          changed = true;
        }
      }
      if (changed) this.saveState();

      // After 1 hour past race start, attempt settlement using results
      try {
        const oneHourMs = 60 * 60 * 1000;
        const toSettle = Array.from(this.markets.values()).filter(m =>
          !m.isSettled && m.raceDate && new Date(m.raceDate).getTime() + oneHourMs <= now
        );
        if (toSettle.length > 0) {
          const { default: ResultsService } = await import('../services/ResultsService');
          const last = await ResultsService.getLastRaceResult();
          for (const m of toSettle) {
            // Close market if somehow still open
            m.isActive = false;
            this.markets.set(m.id, m);

            // Only attempt auto settlement for race winner markets
            if (m.category) {
              let winningOptionId: string | undefined;
              // Try to use last race if names match; else fallback by date
              const sameRace = last && (m.raceName || '').toLowerCase().includes((last.raceName || '').toLowerCase().replace(' grand prix', ''));
              if (last && sameRace && last.podiumDriverIds && m.options && m.options.length > 0) {
                // Match by normalized driver id from option title
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                const podiumFirst = last.podiumDriverIds[0];
                const match = m.options.find(o => normalize(o.title).includes(podiumFirst));
                if (match) winningOptionId = match.id;
              }
              // If we didn't find a winner, pick the option with highest totalVolume as heuristic
              if (!winningOptionId && m.options && m.options.length > 0) {
                winningOptionId = m.options.slice().sort((a, b) => b.totalVolume - a.totalVolume)[0].id;
              }
              if (winningOptionId) {
                await this.settleMarket(m.id, winningOptionId);
              }
            }
          }
        }
      } catch (e) {
        // Non-fatal
      }
    };
    // Check frequently around race start
    setInterval(lockExpiredMarkets, 30 * 1000);
    lockExpiredMarkets();
  }

  private async distributeCurrencyRewards() {
    const now = new Date();

    for (const user of this.users.values()) {
      if (!user.isActive) continue;

      const timeSinceLastReward = now.getTime() - user.lastCurrencyReward.getTime();
      if (timeSinceLastReward >= 4 * 60 * 60 * 1000) { // 4 hours
        // Credit all missed 4h intervals while user was offline
        const intervalsMissed = Math.floor(timeSinceLastReward / (4 * 60 * 60 * 1000));
        const creditAmount = 1000 * intervalsMissed;
        user.balance += creditAmount;
        user.lastCurrencyReward = new Date(user.lastCurrencyReward.getTime() + intervalsMissed * 4 * 60 * 60 * 1000);
        this.users.set(user.id, user);

        this.addTransaction(user.id, TransactionType.DAILY_REWARD, creditAmount, `4-hour currency reward x${intervalsMissed}`);
      }
    }
  }

  // Public method to apply pending rewards on demand (e.g., after login)
  async applyPendingRewardsForUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user || !user.isActive) return;
    const now = new Date();
    const timeSinceLastReward = now.getTime() - user.lastCurrencyReward.getTime();
    if (timeSinceLastReward >= 4 * 60 * 60 * 1000) {
      const intervalsMissed = Math.floor(timeSinceLastReward / (4 * 60 * 60 * 1000));
      const creditAmount = 1000 * intervalsMissed;
      user.balance += creditAmount;
      user.lastCurrencyReward = new Date(user.lastCurrencyReward.getTime() + intervalsMissed * 4 * 60 * 60 * 1000);
      this.users.set(user.id, user);
      this.addTransaction(user.id, TransactionType.DAILY_REWARD, creditAmount, `4-hour currency reward x${intervalsMissed}`);
    }
  }

  // Statistics
  async getBettingStats(): Promise<BettingStats> {
    const totalMarkets = this.markets.size;
    const activeMarkets = Array.from(this.markets.values()).filter(m => m.isActive).length;
    const totalVolume = Array.from(this.markets.values()).reduce((sum, m) => sum + m.totalVolume, 0);
    const totalUsers = this.users.size;

    const topMarkets = Array.from(this.markets.values())
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    const recentTransactions = Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalMarkets,
      activeMarkets,
      totalVolume,
      totalUsers,
      topMarkets,
      recentTransactions
    };
  }

  // Market Creation (Admin function)
  async createMarket(marketData: Omit<BettingMarket, 'id' | 'createdAt' | 'totalVolume' | 'totalBets' | 'isActive' | 'isSettled'>): Promise<BettingMarket> {
    const market: BettingMarket = {
      ...marketData,
      id: `market-${Date.now()}`,
      totalVolume: 0,
      totalBets: 0,
      isActive: true,
      isSettled: false,
      createdAt: new Date()
    };

    this.markets.set(market.id, market);
    return market;
  }
}

export default BettingService;

// Optional helper to kick the scheduler from the service (mock/demo)
export async function settleCurrentAndAdvanceMock() {
  const { BettingScheduler } = await import('./BettingScheduler');
  new BettingScheduler().start();
}
