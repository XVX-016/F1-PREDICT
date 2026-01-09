import { ENV_CONFIG } from '../config/environment';

interface LiveRaceData {
  positions: LivePosition[];
  lap_number: number;
  total_laps: number;
  race_time: string;
  lap_times: LiveLapTime[];
  live_odds: Record<string, number>;
  weather?: any;
  last_update: string;
}

interface LivePosition {
  position: number;
  driverId: string;
  driverName: string;
  team: string;
  lastLapTime: string;
  status: string;
}

interface LiveLapTime {
  lapNumber: number;
  driverId: string;
  lapTime: string;
  sector1Time?: string;
  sector2Time?: string;
  sector3Time?: string;
}

interface LiveStatus {
  status: 'pre_race' | 'race' | 'post_race' | 'qualifying' | 'practice';
  current_session?: {
    round: number;
    name: string;
    circuit: string;
    date: string;
    status: 'live' | 'starting_soon';
  };
  last_update: string;
  connected_clients: number;
}

type LiveDataCallback = (data: LiveRaceData) => void;
type StatusCallback = (status: LiveStatus) => void;

class LiveDataService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private callbacks: LiveDataCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private currentYear = 2024;
  private currentRound = 1;
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private liveDataInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) {
      return;
    }
    // Check for current live session
    await this.checkLiveStatus();
    
    // Start periodic status checks
    this.statusCheckInterval = setInterval(() => {
      this.checkLiveStatus();
    }, 30000); // Check every 30 seconds
  }

  private async checkLiveStatus() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return;
    try {
      const response = await fetch(`${this.getApiBase()}/live/status`);
      if (response.ok) {
        const status: LiveStatus = await response.json();
        this.notifyStatusCallbacks(status);
        
        // If there's a live session, start live data updates
        if (status.current_session && status.current_session.status === 'live') {
          this.currentRound = status.current_session.round;
          this.startLiveDataUpdates();
        } else {
          this.stopLiveDataUpdates();
        }
      }
    } catch (error) {
      console.warn('Failed to check live status:', error);
    }
  }

  private startLiveDataUpdates() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return;
    if (this.liveDataInterval) return;
    
    this.liveDataInterval = setInterval(() => {
      this.fetchLiveRaceData();
    }, 5000); // Update every 5 seconds during live race
  }

  private stopLiveDataUpdates() {
    if (this.liveDataInterval) {
      clearInterval(this.liveDataInterval);
      this.liveDataInterval = null;
    }
  }

  private async fetchLiveRaceData() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return;
    try {
      const response = await fetch(`${this.getApiBase()}/live/race/${this.currentYear}/${this.currentRound}`);
      if (response.ok) {
        const data: LiveRaceData = await response.json();
        this.notifyCallbacks(data);
      }
    } catch (error) {
      console.warn('Failed to fetch live race data:', error);
    }
  }

  public connectWebSocket() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (this.isConnecting) {
      return; // Already trying to connect
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected for live updates');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'live_race_update':
        this.notifyCallbacks(message.data);
        break;
      case 'status_update':
        this.notifyStatusCallbacks(message.data);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private handleReconnect() {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  public disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  public onLiveDataUpdate(callback: LiveDataCallback) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public onStatusUpdate(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks(data: LiveRaceData) {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in live data callback:', error);
      }
    });
  }

  private notifyStatusCallbacks(status: LiveStatus) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  public async getLiveOdds(year: number, round: number) {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return null;
    try {
      const response = await fetch(`${this.getApiBase()}/live/odds/${year}/${round}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch live odds:', error);
    }
    return null;
  }

  public async getLiveStatus(): Promise<LiveStatus | null> {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return null;
    try {
      const response = await fetch(`${this.getApiBase()}/live/status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch live status:', error);
    }
    return null;
  }

  public async getLiveRaceData(year: number, round: number): Promise<LiveRaceData | null> {
    if (!ENV_CONFIG.LIVE_DATA_ENABLED) return null;
    try {
      const response = await fetch(`${this.getApiBase()}/live/race/${year}/${round}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch live race data:', error);
    }
    return null;
  }

  private getApiBase(): string {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  private getWebSocketUrl(): string {
    const base = this.getApiBase().replace('http', 'ws');
    return `${base}/ws/live`;
  }

  public destroy() {
    this.disconnectWebSocket();
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    if (this.liveDataInterval) {
      clearInterval(this.liveDataInterval);
    }
    this.callbacks = [];
    this.statusCallbacks = [];
  }

  // Utility methods for race progress
  public getRaceProgress(lapNumber: number, totalLaps: number): number {
    return totalLaps > 0 ? (lapNumber / totalLaps) * 100 : 0;
  }

  public getTimeRemaining(lapNumber: number, totalLaps: number, averageLapTime: number): string {
    const remainingLaps = totalLaps - lapNumber;
    const remainingSeconds = remainingLaps * averageLapTime;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  public isLiveSession(status: string): boolean {
    return status === 'race' || status === 'qualifying';
  }

  public shouldShowLiveUpdates(status: string): boolean {
    return this.isLiveSession(status);
  }
}

export default new LiveDataService();
