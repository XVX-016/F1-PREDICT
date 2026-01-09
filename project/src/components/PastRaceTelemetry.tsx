import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, TrendingUp, Target, Award, BarChart3, X } from 'lucide-react';
import { sampleRaces } from '../data/sampleRaces';

type TelemetryData = {
  driverId: string;
  driverName: string;
  team: string;
  position: number;
  lapTimes: Array<{
    lap: number;
    time: string;
    sector1: string;
    sector2: string;
    sector3: string;
  }>;
  fastestLap: {
    lap: number;
    time: string;
  };
  averageLapTime: string;
  totalLaps: number;
  status: string;
  points: number;
};

type RaceInfo = {
  round: number;
  name: string;
  circuit: string;
  date: string;
  totalLaps: number;
  weather: {
    temperature: number;
    humidity: number;
    conditions: string;
  };
};

interface PastRaceTelemetryProps {
  raceId: string;
  onClose: () => void;
}

export default function PastRaceTelemetry({ raceId, onClose }: PastRaceTelemetryProps) {
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRaceTelemetry();
  }, [raceId]);

  const fetchRaceTelemetry = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use sample data instead of backend calls
      const sampleRace = sampleRaces.find((r: any) => r.round === parseInt(raceId));
      if (sampleRace) {
        setRaceInfo({
          round: sampleRace.round,
          name: sampleRace.name,
          circuit: sampleRace.circuit,
          date: sampleRace.startDate,
          totalLaps: 50, // Default, could be fetched from actual data
          weather: {
            temperature: 22,
            humidity: 65,
            conditions: 'Partly Cloudy'
          }
        });
      }

      // Generate sample telemetry data
      const sampleDrivers = [
        { driverId: 'verstappen', driverName: 'Max Verstappen', team: 'Red Bull Racing' },
        { driverId: 'norris', driverName: 'Lando Norris', team: 'McLaren' },
        { driverId: 'piastri', driverName: 'Oscar Piastri', team: 'McLaren' },
        { driverId: 'hamilton', driverName: 'Lewis Hamilton', team: 'Ferrari' },
        { driverId: 'leclerc', driverName: 'Charles Leclerc', team: 'Ferrari' },
        { driverId: 'russell', driverName: 'George Russell', team: 'Mercedes' },
        { driverId: 'sainz', driverName: 'Carlos Sainz', team: 'Williams' },
        { driverId: 'alonso', driverName: 'Fernando Alonso', team: 'Aston Martin' },
        { driverId: 'stroll', driverName: 'Lance Stroll', team: 'Aston Martin' },
        { driverId: 'gasly', driverName: 'Pierre Gasly', team: 'Alpine' }
      ];

      const telemetry: TelemetryData[] = sampleDrivers.map((driver, index) => ({
        driverId: driver.driverId,
        driverName: driver.driverName,
        team: driver.team,
        position: index + 1,
        lapTimes: generateSampleLapTimes(50, index + 1),
        fastestLap: {
          lap: Math.floor(Math.random() * 50) + 1,
          time: generateRandomLapTime()
        },
        averageLapTime: generateRandomLapTime(),
        totalLaps: 50,
        status: 'Finished',
        points: Math.max(0, 25 - index * 2)
      }));
      setTelemetryData(telemetry);
      
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      setError('Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLapTimes = (totalLaps: number, position: number) => {
    const lapTimes = [];
    const baseTime = 85 + (position - 1) * 0.5; // Slower cars have higher base times
    
    for (let lap = 1; lap <= totalLaps; lap++) {
      const variation = (Math.random() - 0.5) * 2; // ±1 second variation
      const lapTime = baseTime + variation;
      
      lapTimes.push({
        lap,
        time: formatLapTime(lapTime),
        sector1: formatLapTime(lapTime * 0.33),
        sector2: formatLapTime(lapTime * 0.33),
        sector3: formatLapTime(lapTime * 0.34)
      });
    }
    
    return lapTimes;
  };

  const generateRandomLapTime = () => {
    const time = 80 + Math.random() * 10; // Between 80-90 seconds
    return formatLapTime(time);
  };

  const formatLapTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const getSelectedDriverData = () => {
    return telemetryData.find(driver => driver.driverId === selectedDriver);
  };

  const getFastestLap = () => {
    if (telemetryData.length === 0) return null;
    return telemetryData.reduce((fastest, driver) => {
      const fastestTime = parseFloat(driver.fastestLap.time.replace(':', ''));
      const currentTime = parseFloat(fastest.fastestLap.time.replace(':', ''));
      return fastestTime < currentTime ? driver : fastest;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading telemetry data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Race Telemetry Analysis</h2>
              {raceInfo && (
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{raceInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{raceInfo.circuit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(raceInfo.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Race Overview */}
          {raceInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Race Winner
                </h3>
                {telemetryData.length > 0 && (
                  <div>
                    <div className="text-2xl font-bold">{telemetryData[0].driverName}</div>
                    <div className="text-gray-400">{telemetryData[0].team}</div>
                    <div className="text-sm text-gray-500 mt-1">Position: P{telemetryData[0].position}</div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  Fastest Lap
                </h3>
                {getFastestLap() && (
                  <div>
                    <div className="text-2xl font-bold">{getFastestLap()?.driverName}</div>
                    <div className="text-gray-400">{getFastestLap()?.fastestLap.time}</div>
                    <div className="text-sm text-gray-500 mt-1">Lap {getFastestLap()?.fastestLap.lap}</div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Weather Conditions
                </h3>
                <div>
                  <div className="text-2xl font-bold">{raceInfo.weather.temperature}°C</div>
                  <div className="text-gray-400">{raceInfo.weather.conditions}</div>
                  <div className="text-sm text-gray-500 mt-1">Humidity: {raceInfo.weather.humidity}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Selection */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Select Driver for Detailed Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {telemetryData.map((driver) => (
                <button
                  key={driver.driverId}
                  onClick={() => setSelectedDriver(driver.driverId)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedDriver === driver.driverId
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-semibold">P{driver.position}</div>
                  <div className="text-xs text-gray-400 truncate">{driver.driverName}</div>
                  <div className="text-xs text-gray-500 truncate">{driver.team}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Telemetry */}
          {selectedDriver && getSelectedDriverData() && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {getSelectedDriverData()?.driverName} - Telemetry Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">P{getSelectedDriverData()?.position}</div>
                    <div className="text-sm text-gray-400">Final Position</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{getSelectedDriverData()?.fastestLap.time}</div>
                    <div className="text-sm text-gray-400">Fastest Lap</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{getSelectedDriverData()?.averageLapTime}</div>
                    <div className="text-sm text-gray-400">Average Lap</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{getSelectedDriverData()?.points}</div>
                    <div className="text-sm text-gray-400">Points Scored</div>
                  </div>
                </div>

                {/* Lap Times Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4">Lap Times Progression</h4>
                  <div className="h-64 bg-gray-800 rounded p-4 flex items-end justify-between gap-1">
                    {getSelectedDriverData()?.lapTimes.slice(0, 20).map((lap, index) => {
                      const timeInSeconds = parseFloat(lap.time.replace(':', ''));
                      const height = Math.max(10, 100 - (timeInSeconds - 80) * 5); // Normalize height
                      return (
                        <div
                          key={lap.lap}
                          className="bg-blue-500 hover:bg-blue-400 transition-colors cursor-pointer relative group"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`Lap ${lap.lap}: ${lap.time}`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Lap {lap.lap}: {lap.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Lap 1</span>
                    <span>Lap 20</span>
                  </div>
                </div>

                {/* Sector Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-blue-400">Sector 1 Performance</h4>
                    <div className="space-y-2">
                      {getSelectedDriverData()?.lapTimes.slice(0, 5).map((lap) => (
                        <div key={lap.lap} className="flex justify-between text-sm">
                          <span>Lap {lap.lap}:</span>
                          <span className="font-mono">{lap.sector1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-green-400">Sector 2 Performance</h4>
                    <div className="space-y-2">
                      {getSelectedDriverData()?.lapTimes.slice(0, 5).map((lap) => (
                        <div key={lap.lap} className="flex justify-between text-sm">
                          <span>Lap {lap.lap}:</span>
                          <span className="font-mono">{lap.sector2}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-red-400">Sector 3 Performance</h4>
                    <div className="space-y-2">
                      {getSelectedDriverData()?.lapTimes.slice(0, 5).map((lap) => (
                        <div key={lap.lap} className="flex justify-between text-sm">
                          <span>Lap {lap.lap}:</span>
                          <span className="font-mono">{lap.sector3}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
