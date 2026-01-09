import React, { useState } from 'react';
import { CloudRain, Wind, Thermometer, Sun, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassWrapper from './GlassWrapper';
import FadeIn from './FadeIn';
import AnimatedSlider from './AnimatedSlider';

interface WeatherPanelProps {
  customWeather: { tempC: number; windKmh: number; rainChancePct: number; condition: string };
  onWeatherChange: (w: WeatherPanelProps['customWeather']) => void;
  isUpdating?: boolean;
}

export default function WeatherPanel({ customWeather, onWeatherChange, isUpdating = false }: WeatherPanelProps) {
  const [showControls, setShowControls] = useState(false);
  return (
    <GlassWrapper accent className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-3 bg-gray-800/20 rounded-xl border border-gray-600/30">
            <CloudRain className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>RACE WEATHER CONDITIONS</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowControls(!showControls)}
          className="flex items-center space-x-2 bg-black/60 hover:bg-black/70 px-3 sm:px-4 py-2 rounded-xl border border-white/20 transition-colors min-h-[44px]"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{isUpdating ? 'Updating...' : (showControls ? 'Done' : 'Customize')}</span>
          {isUpdating && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <FadeIn delay={0.1} className="text-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm rounded-3xl border border-white/10 transition-all">
          <div className="flex justify-center mb-2 sm:mb-3">
            <Thermometer className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">{customWeather.tempC}°C</div>
          <div className="text-gray-300 mb-2 sm:mb-3 text-sm sm:text-base">Temperature</div>
          {showControls && (
            <AnimatedSlider
              min={0}
              max={50}
              value={customWeather.tempC}
              onChange={(value) => onWeatherChange({ ...customWeather, tempC: value })}
              className="w-full mt-2"
            />
          )}
        </FadeIn>

        <FadeIn delay={0.2} className="text-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm rounded-3xl border border-white/10 transition-all">
          <div className="flex justify-center mb-2 sm:mb-3">
            <Wind className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-300 mb-2">{customWeather.windKmh} km/h</div>
          <div className="text-gray-300 mb-2 sm:mb-3 text-sm sm:text-base">Wind Speed</div>
          {showControls && (
            <AnimatedSlider
              min={0}
              max={100}
              value={customWeather.windKmh}
              onChange={(value) => onWeatherChange({ ...customWeather, windKmh: value })}
              className="w-full mt-2"
            />
          )}
        </FadeIn>

        <FadeIn delay={0.3} className="text-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm rounded-3xl border border-white/10 transition-all">
          <div className="flex justify-center mb-2 sm:mb-3">
            <CloudRain className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-300 mb-2">{customWeather.rainChancePct}%</div>
          <div className="text-gray-300 mb-2 sm:mb-3 text-sm sm:text-base">Rain Chance</div>
          {showControls && (
            <AnimatedSlider
              min={0}
              max={100}
              value={customWeather.rainChancePct}
              onChange={(value) => onWeatherChange({ ...customWeather, rainChancePct: value })}
              className="w-full mt-2"
            />
          )}
        </FadeIn>

        <FadeIn delay={0.4} className="text-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm rounded-3xl border border-white/10 transition-all">
          <div className="flex justify-center mb-2 sm:mb-3">
            <Sun className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-300 mb-2">{customWeather.condition}</div>
          <div className="text-gray-300 mb-2 sm:mb-3 text-sm sm:text-base">Condition</div>
          {showControls && (
            <select value={customWeather.condition} onChange={(e) => onWeatherChange({ ...customWeather, condition: e.target.value })} className="mt-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white hover:bg-black/60 transition-colors w-full min-h-[44px]">
              <option value="Sunny" className="bg-black text-white">Sunny</option>
              <option value="Cloudy" className="bg-black text-white">Cloudy</option>
              <option value="Rainy" className="bg-black text-white">Rainy</option>
              <option value="Overcast" className="bg-black text-white">Overcast</option>
              <option value="Clear" className="bg-black text-white">Clear</option>
            </select>
          )}
        </FadeIn>
      </div>
    </GlassWrapper>
  );
}


