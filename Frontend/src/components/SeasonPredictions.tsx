import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, Eye, Trophy, Flag } from 'lucide-react';
import { Race } from '../types/predictions';

interface SeasonPredictionsProps {
  races: Race[];
  predictions: Record<string, any>;
  onRaceSelect: (raceId: string) => void;
  className?: string;
}

export default function SeasonPredictions({ 
  races, 
  predictions, 
  onRaceSelect, 
  className = '' 
}: SeasonPredictionsProps) {
  const [showAllRaces, setShowAllRaces] = useState(false);

  const getRaceStatus = (race: Race) => {
    const now = new Date();
    const raceDate = new Date(race.startDate);
    
    if (raceDate < now) {
      return { status: 'completed', label: 'Completed', color: 'bg-black/60 text-gray-200 border border-white/10' };
    } else if (raceDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-black/60 text-gray-200 border border-white/10' };
    } else {
      return { status: 'future', label: 'Future', color: 'bg-black/60 text-gray-200 border border-white/10' };
    }
  };

  const getRaceHeaderColor = (raceName: string) => {
    const colorMap: Record<string, string> = {
      'Bahrain': 'bg-red-700',
      'Saudi Arabia': 'bg-red-700',
      'Australia': 'bg-black/80',
      'Japan': 'bg-red-700',
      'China': 'bg-red-700',
      'Miami': 'bg-black/80',
      'Emilia-Romagna': 'bg-red-700',
      'Monaco': 'bg-red-700',
      'Canada': 'bg-red-700',
      'Spain': 'bg-red-700',
      'Austria': 'bg-red-700',
      'Great Britain': 'bg-black/80',
      'Hungary': 'bg-red-700',
      'Belgium': 'bg-red-700',
      'Netherlands': 'bg-black/80',
      'Italy': 'bg-black/80',
      'Azerbaijan': 'bg-black/80',
      'Singapore': 'bg-red-700',
      'United States': 'bg-black/80',
      'Mexico': 'bg-black/80',
      'Brazil': 'bg-black/80',
      'Las Vegas': 'bg-black/80',
      'Qatar': 'bg-red-700',
      'Abu Dhabi': 'bg-black/80'
    };
    
    const key = raceName.replace(' Grand Prix', '');
    return colorMap[key] || 'bg-red-600';
  };

  const displayedRaces = showAllRaces ? races : races.slice(0, 4);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">2025 Season Predictions</h2>
        <p className="text-gray-300">AI-powered predictions for all F1 Grand Prix events</p>
      </div>

      {/* Race Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedRaces.map((race) => {
          const status = getRaceStatus(race);
          const headerColor = getRaceHeaderColor(race.name);
          const prediction = predictions[race.id];
          
          return (
            <div key={race.id} className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-red-400/40 transition-colors cursor-pointer" onClick={() => onRaceSelect(race.id)}>
              {/* Header */}
              <div className={`${headerColor} text-white p-4 text-center`}>
                <h3 className="text-lg font-bold uppercase tracking-wider">{race.name.replace(' Grand Prix', '').toUpperCase()}</h3>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {new Date(race.startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-3">{race.name}</h4>
                
                {status.status === 'completed' && prediction ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Trophy className="w-4 h-4 text-red-500" />
                      <span className="text-gray-300">
                        Prediction Correct: {prediction.winner || 'N/A'} 1st
                      </span>
                      <CheckCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Flag className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-300">
                        Pole Position: {prediction.pole || 'N/A'} ✓
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-300">
                        Fastest Lap: {prediction.fastestLap || 'N/A'} ✓
                      </span>
                    </div>
                  </div>
                ) : status.status === 'upcoming' && prediction ? (
                  <div className="space-y-3">
                    <div className="bg-black/60 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-red-500 font-medium mb-1">Predicted Winner:</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center border border-red-400/30">
                          <Trophy className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="font-bold text-white">{prediction.predictedWinner || 'TBD'}</span>
                        <span className="text-red-500 font-bold">{prediction.winProbability || '0'}%</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      Pole Probability: {prediction.poleProbability || 'TBD'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-black/60 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-gray-300 font-medium mb-1">Early Prediction:</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center border border-white/10">
                          <Clock className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="font-bold text-white">{prediction?.earlyPrediction || 'TBD'}</span>
                        <span className="text-red-500 font-bold">{prediction?.earlyProbability || '0'}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Model will update after previous race
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Full Season Button */}
      <div className="text-center">
        <button
          onClick={() => setShowAllRaces(!showAllRaces)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center space-x-2 mx-auto"
        >
          <Eye className="w-5 h-5" />
          <span>{showAllRaces ? 'Show Less' : 'View Full Season Calendar'}</span>
        </button>
      </div>
    </div>
  );
}

