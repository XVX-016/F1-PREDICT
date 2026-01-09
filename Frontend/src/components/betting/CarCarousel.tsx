import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const F1Cars = [
  {
    id: 1,
    name: 'Red Bull RB21',
    team: 'Red Bull Racing',
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-yellow-400',
    driver: 'Max Verstappen'
  },
  {
    id: 2,
    name: 'Mercedes W16',
    team: 'Mercedes',
    color: 'from-silver-400 to-silver-600',
    accent: 'bg-teal-400',
    driver: 'George Russell'
  },
  {
    id: 3,
    name: 'Ferrari SF-25',
    team: 'Ferrari',
    color: 'from-red-600 to-red-800',
    accent: 'bg-yellow-400',
    driver: 'Charles Leclerc'
  },
  {
    id: 4,
    name: 'McLaren MCL60',
    team: 'McLaren',
    color: 'from-orange-500 to-orange-700',
    accent: 'bg-blue-400',
    driver: 'Lando Norris'
  },
  {
    id: 5,
    name: 'Aston Martin AMR25',
    team: 'Aston Martin',
    color: 'from-green-600 to-green-800',
    accent: 'bg-yellow-400',
    driver: 'Fernando Alonso'
  },
  {
    id: 6,
    name: 'Alpine A525',
    team: 'Alpine',
    color: 'from-blue-500 to-blue-700',
    accent: 'bg-red-400',
    driver: 'Esteban Ocon'
  }
];

export default function CarCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let animationId: number;
    let position = 0;

    const animate = () => {
      position += 0.5;
      carousel.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Car carousel */}
      <div 
        ref={carouselRef}
        className="absolute top-1/2 transform -translate-y-1/2 flex space-x-32 opacity-10"
        style={{ width: 'max-content' }}
      >
        {F1Cars.map((car, index) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 0.1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 1 }}
            className="relative"
          >
            {/* Car body */}
            <div className={`w-64 h-16 bg-gradient-to-r ${car.color} rounded-full relative shadow-2xl`}>
              {/* Car front */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full border-2 border-gray-600"></div>
              
              {/* Car rear */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full border-2 border-gray-600"></div>
              
              {/* Team accent */}
              <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 ${car.accent} rounded-full`}></div>
              
              {/* Car details */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/80">
                  <div className="text-xs font-bold">{car.team}</div>
                  <div className="text-xs">{car.driver}</div>
                </div>
              </div>
            </div>
            
            {/* Exhaust effect */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-2 bg-gradient-to-r from-transparent to-orange-500/50 rounded-full animate-pulse"></div>
          </motion.div>
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/50"></div>
    </div>
  );
}
