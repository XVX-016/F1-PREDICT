import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Gauge, Flag, MapPin, Gauge as GaugeIcon } from 'lucide-react';

interface ZoneFeaturesProps {
  className?: string;
}

export default function ZoneFeatures({ className = '' }: ZoneFeaturesProps) {
  const zones = [
    {
      icon: Zap,
      title: 'DRS Zones',
      description: 'Drag Reduction System activation points',
      details: ['Detection Zone 1: Turn 1-2', 'Detection Zone 2: Turn 3-4', 'Activation: 1 second gap to car ahead'],
      color: 'from-red-700 to-red-600'
    },
    {
      icon: Target,
      title: 'Sector Analysis',
      description: 'Track performance breakdown',
      details: ['Sector 1: High-speed straights', 'Sector 2: Technical corners', 'Sector 3: Mixed complexity'],
      color: 'from-red-700 to-red-600'
    },
    {
      icon: Gauge,
      title: 'Speed Traps',
      description: 'Maximum velocity measurement points',
      details: ['Main Straight: 350+ km/h', 'Back Straight: 320+ km/h', 'Data used for performance analysis'],
      color: 'from-red-700 to-red-600'
    },
    {
      icon: Flag,
      title: 'Overtaking Zones',
      description: 'Prime passing opportunities',
      details: ['Turn 1: Heavy braking zone', 'Turn 3: Late apex corner', 'Turn 5: DRS-assisted straight'],
      color: 'from-red-700 to-red-600'
    },
    {
      icon: MapPin,
      title: 'Track Characteristics',
      description: 'Circuit-specific features',
      details: ['Elevation changes: 15m', 'Surface grip: High', 'Weather sensitivity: Medium'],
      color: 'from-red-700 to-red-600'
    },
    {
      icon: GaugeIcon,
      title: 'Tire Strategy',
      description: 'Compound selection guidance',
      details: ['Soft: 15-20 laps', 'Medium: 25-30 laps', 'Hard: 35-40 laps'],
      color: 'from-red-700 to-red-600'
    }
  ];

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-black to-gray-900 ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
            TRACK ZONE FEATURES
          </h2>
          <div className="w-32 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced F1 circuit analysis with AI-powered zone detection and strategic insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {zones.map((zone, index) => (
            <motion.div
              key={zone.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-red-400/50 transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-r ${zone.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <zone.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
                  {zone.title}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {zone.description}
                </p>
                
                <div className="space-y-3">
                  {zone.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-400 leading-relaxed">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
              READY TO ANALYZE?
            </h3>
            <p className="text-red-100 mb-6">
              Explore detailed zone analysis for any F1 circuit with our AI-powered prediction engine
            </p>
            <button className="bg-white text-red-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors">
              EXPLORE ZONES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
