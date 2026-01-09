import React from 'react';
import { TrendingUp, Thermometer, Gauge, User, MapPin, Zap } from 'lucide-react';

interface ModelStats {
  overallAccuracy: number;
  polePositionAccuracy: number;
  podiumAccuracy: number;
  trackTypePerformance: {
    street: number;
    highSpeed: number;
    technical: number;
    hybrid: number;
  };
}

interface ModelStatisticsProps {
  stats: ModelStats;
  className?: string;
}

export default function ModelStatistics({ stats, className = '' }: ModelStatisticsProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side */}
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
          {/* Model Statistics */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Model Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: `${stats.overallAccuracy.toFixed(2)}%`,
                  label: 'Overall Prediction Accuracy',
                },
                {
                  value: `${stats.polePositionAccuracy.toFixed(2)}%`,
                  label: 'Pole Position Accuracy',
                },
                {
                  value: `${stats.podiumAccuracy.toFixed(2)}%`,
                  label: 'Podium Finish Accuracy',
                },
                {
                  value: `${(
                    (stats.overallAccuracy +
                      stats.polePositionAccuracy +
                      stats.podiumAccuracy) /
                    3
                  ).toFixed(2)}%`,
                  label: 'Average Accuracy',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center flex flex-col justify-center"
                >
                  <div className="text-2xl font-bold text-red-500 mb-1">{card.value}</div>
                  <div className="text-gray-200 text-xs font-semibold">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Predictions */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '1,247', label: 'Races Predicted' },
                { value: '89.2%', label: 'Success Rate' },
                { value: '24.7K', label: 'Data Points' },
                { value: '156', label: 'Drivers Tracked' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center flex flex-col justify-center"
                >
                  <div className="text-2xl font-bold text-blue-500 mb-1">{card.value}</div>
                  <div className="text-gray-200 text-xs font-semibold">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Models */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '12', label: 'ML Models' },
                { value: '8', label: 'Neural Networks' },
                { value: '4', label: 'Ensemble Models' },
                { value: '99.8%', label: 'Uptime' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center flex flex-col justify-center"
                >
                  <div className="text-2xl font-bold text-green-500 mb-1">{card.value}</div>
                  <div className="text-gray-200 text-xs font-semibold">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Key Model Features</h2>
          <div className="space-y-4">
            {[
              {
                icon: TrendingUp,
                title: 'Historical Performance',
                desc: '5 years of race data analyzed per driver/team',
              },
              {
                icon: Thermometer,
                title: 'Weather Patterns',
                desc: 'Temperature, humidity, wind effects',
              },
              {
                icon: Gauge,
                title: 'Tire Behavior',
                desc: 'Degradation rates by compound',
              },
              {
                icon: MapPin,
                title: 'Track Characteristics',
                desc: 'Corner types, straights, elevation changes',
              },
              {
                icon: Zap,
                title: 'Car Performance',
                desc: 'Power unit efficiency, downforce levels',
              },
              {
                icon: User,
                title: 'Driver Skill',
                desc: 'Qualifying pace, race craft, consistency',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex items-start space-x-3"
              >
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center border border-red-400/30 flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{feature.title}</div>
                  <div className="text-xs text-gray-300">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
