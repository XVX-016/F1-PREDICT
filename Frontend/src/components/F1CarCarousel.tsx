import { useState, useEffect } from 'react';

// This component is intended to be used as a fixed background for all pages.
const CAR_IMAGES = [
  '/models/redbull.png',
  '/models/ferrari.png',
  '/models/mclaren.png',
  '/models/mercedes.png',
  '/models.astonmartin.png',
  '/models/racingbulls.png',
  '/models.haas.png',
  '/models.williams.png',
  '/models.alpine.png',
  '/models.kicksauber.png',
];

export default function F1CarCarousel() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    // Change transition interval to 15s
    const interval = setInterval(() => setCurrent((c) => (c + 1) % CAR_IMAGES.length), 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="fixed inset-0 w-full h-full top-0 left-0 z-[-1]"
      style={{ pointerEvents: 'none', cursor: 'default', userSelect: 'none' as any }}
      aria-hidden="true"
    >
      <div
        className="w-full h-full bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url('${CAR_IMAGES[current]}')`,
          backgroundSize: 'contain',
          backgroundColor: 'transparent', // Changed from black to transparent
        }}
      />
      {/* Removed global dark overlay to avoid tinting/glass between background and content */}
    </div>
  );
}