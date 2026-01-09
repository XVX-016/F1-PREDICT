import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';

interface CountdownTimerProps {
  targetDate?: Date;
  title?: string;
  subtitle?: string;
}

export default function CountdownTimer({ targetDate, title = 'Next Race Countdown', subtitle }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Default date if nothing passed
  const defaultTargetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const target = targetDate || defaultTargetDate;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', color: 'from-red-500 to-red-600' },
    { value: timeLeft.hours, label: 'Hours', color: 'from-orange-500 to-orange-600' },
    { value: timeLeft.minutes, label: 'Minutes', color: 'from-yellow-500 to-yellow-600' },
    { value: timeLeft.seconds, label: 'Seconds', color: 'from-green-500 to-green-600' }
  ];

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {subtitle && (
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{subtitle}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className={`bg-gradient-to-br ${unit.color} rounded-xl p-4 shadow-lg`}>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-white/80 font-medium">
                {unit.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-6">
        <div className="text-sm text-gray-400">{`Race starts in`}</div>
      </div>
    </div>
  );
}
