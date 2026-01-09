import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';
import F1CalibrationService from '../services/calibration';

interface CalibrationDashboardProps {
  raceName: string;
  className?: string;
}

export default function CalibrationDashboard({ raceName, className = '' }: CalibrationDashboardProps) {
  const [calibrationSummary, setCalibrationSummary] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const calibrationService = F1CalibrationService.getInstance();
    const summary = calibrationService.getCalibrationSummary();
    
    // Add some dynamic data based on race name
    const enhancedSummary = {
      ...summary,
      raceSpecific: {
        trackType: getTrackType(raceName),
        expectedBias: getExpectedBias(raceName),
        confidenceLevel: getConfidenceLevel(raceName)
      }
    };
    
    setCalibrationSummary(enhancedSummary);
  }, [raceName]);

  // Helper functions for race-specific calibration info
  const getTrackType = (raceName: string): string => {
    if (raceName.includes('Monaco') || raceName.includes('Singapore')) return 'Street Circuit';
    if (raceName.includes('Monza') || raceName.includes('Spa')) return 'High Speed';
    return 'Permanent Circuit';
  };

  const getExpectedBias = (raceName: string): string => {
    if (raceName.includes('Monaco')) return 'Low (Precision)';
    if (raceName.includes('Monza')) return 'Medium (Power)';
    return 'Standard';
  };

  const getConfidenceLevel = (raceName: string): string => {
    if (raceName.includes('Monaco') || raceName.includes('Singapore')) return 'High';
    if (raceName.includes('Monza') || raceName.includes('Spa')) return 'Medium';
    return 'Standard';
  };

  if (!calibrationSummary) {
    return (
      <div className={`bg-gray-900 rounded-2xl shadow-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-2xl shadow-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="text-purple-400" />
          AI Calibration Quality
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-800 rounded-xl">
          <TrendingUp className="mx-auto mb-2 text-green-400" size={24} />
          <p className="text-2xl font-bold text-green-400">{calibrationSummary.biasImprovement}</p>
          <p className="text-sm text-gray-400">Bias Improvement</p>
        </div>
        
        <div className="text-center p-4 bg-gray-800 rounded-xl">
          <Target className="mx-auto mb-2 text-blue-400" size={24} />
          <p className="text-2xl font-bold text-blue-400">{calibrationSummary.reliabilityImprovement}</p>
          <p className="text-sm text-gray-400">Reliability Score</p>
        </div>
        
        <div className="text-center p-4 bg-gray-800 rounded-xl">
          <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
          <p className="text-2xl font-bold text-yellow-400">{calibrationSummary.overallScore}</p>
          <p className="text-sm text-gray-400">Overall Quality</p>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-lg font-semibold mb-4">Calibration Methods Applied</h4>
          
          {/* Race-specific calibration info */}
          {calibrationSummary.raceSpecific && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h5 className="text-md font-semibold mb-3 text-gray-300">Race-Specific Calibration</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Track Type:</span>
                  <div className="text-white font-medium">{calibrationSummary.raceSpecific.trackType}</div>
                </div>
                <div>
                  <span className="text-gray-400">Expected Bias:</span>
                  <div className="text-white font-medium">{calibrationSummary.raceSpecific.expectedBias}</div>
                </div>
                <div>
                  <span className="text-gray-400">Confidence:</span>
                  <div className="text-white font-medium">{calibrationSummary.raceSpecific.confidenceLevel}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Temperature Scaling</span>
              <span className="ml-auto text-xs text-gray-400">Smooths extreme probabilities</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm">Logistic Regression</span>
              <span className="ml-auto text-xs text-gray-400">Learns optimal probability mapping</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-sm">Driver Bias Correction</span>
              <span className="ml-auto text-xs text-gray-400">Per-driver systematic adjustments</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Track Type Adjustment</span>
              <span className="ml-auto text-xs text-gray-400">Circuit-specific optimizations</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>What this means:</strong> Your AI predictions are calibrated using multiple 
              statistical methods to ensure they're both accurate and reliable. The bias improvement 
              shows how much we've reduced systematic over/under-prediction, while the reliability 
              score indicates how well predicted probabilities match actual outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
