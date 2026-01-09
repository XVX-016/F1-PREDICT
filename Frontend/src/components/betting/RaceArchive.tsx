import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface RaceResult {
  id: string;
  raceName: string;
  date: Date;
  winner: string;
  podium: string[];
  fastestLap: string;
  safetyCar: boolean;
  totalBets: number;
  totalVolume: number;
  userBets: UserBet[];
}

interface UserBet {
  id: string;
  market: string;
  selection: string;
  amount: number;
  result: 'won' | 'lost' | 'pending';
  payout?: number;
}

export default function RaceArchive() {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);

  const raceResults: RaceResult[] = [
    {
      id: '1',
      raceName: 'British Grand Prix',
      date: new Date('2025-07-06'),
      winner: 'Max Verstappen',
      podium: ['Max Verstappen', 'Lewis Hamilton', 'Lando Norris'],
      fastestLap: 'Max Verstappen',
      safetyCar: false,
      totalBets: 1250,
      totalVolume: 45000,
      userBets: [
        {
          id: '1',
          market: 'Race Winner',
          selection: 'Max Verstappen',
          amount: 1000,
          result: 'won',
          payout: 1800
        },
        {
          id: '2',
          market: 'Podium Finish',
          selection: 'Lewis Hamilton',
          amount: 500,
          result: 'won',
          payout: 750
        }
      ]
    },
    {
      id: '2',
      raceName: 'Austrian Grand Prix',
      date: new Date('2025-06-29'),
      winner: 'Charles Leclerc',
      podium: ['Charles Leclerc', 'Max Verstappen', 'Carlos Sainz'],
      fastestLap: 'Max Verstappen',
      safetyCar: true,
      totalBets: 980,
      totalVolume: 38000,
      userBets: [
        {
          id: '3',
          market: 'Race Winner',
          selection: 'Max Verstappen',
          amount: 800,
          result: 'lost'
        },
        {
          id: '4',
          market: 'Safety Car',
          selection: 'Yes',
          amount: 300,
          result: 'won',
          payout: 450
        }
      ]
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won':
        return 'text-green-400';
      case 'lost':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'won':
        return <CheckCircle className="w-4 h-4" />;
      case 'lost':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/20 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Race Archive</h2>
        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-500/30">
          {raceResults.length} races
        </span>
      </div>

      <div className="space-y-4">
        {raceResults.map((race, index) => (
          <motion.div
            key={race.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedRace(selectedRace === race.id ? null : race.id)}
          >
            {/* Race Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{race.raceName}</h3>
                <p className="text-gray-400 text-sm">{formatDate(race.date)}</p>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">{race.winner}</div>
                <div className="text-gray-400 text-sm">Winner</div>
              </div>
            </div>

            {/* Race Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-white font-semibold">{race.totalBets}</div>
                <div className="text-gray-400 text-sm">Total Bets</div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">{formatCurrency(race.totalVolume)} PC</div>
                <div className="text-gray-400 text-sm">Volume</div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">{race.userBets.length}</div>
                <div className="text-gray-400 text-sm">Your Bets</div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedRace === race.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 pt-4"
              >
                {/* Race Results */}
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Race Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Podium</div>
                      <div className="space-y-1">
                        {race.podium.map((driver, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm">{idx + 1}.</span>
                            <span className="text-white">{driver}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Other Results</div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Fastest Lap:</span>
                          <span className="text-white">{race.fastestLap}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm">Safety Car:</span>
                          <span className={`${race.safetyCar ? 'text-green-400' : 'text-red-400'}`}>
                            {race.safetyCar ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Bets */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Your Bets</h4>
                  <div className="space-y-2">
                    {race.userBets.map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div>
                          <div className="text-white font-medium">{bet.market}</div>
                          <div className="text-gray-400 text-sm">{bet.selection}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{formatCurrency(bet.amount)} PC</div>
                          <div className={`flex items-center space-x-1 text-sm ${getResultColor(bet.result)}`}>
                            {getResultIcon(bet.result)}
                            <span className="capitalize">{bet.result}</span>
                            {bet.payout && <span>(+{formatCurrency(bet.payout)} PC)</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
