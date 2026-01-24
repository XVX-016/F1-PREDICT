import React, { useRef, useEffect, useState } from 'react';

interface AnimatedSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  step?: number;
}

export default function AnimatedSlider({
  min,
  max,
  value,
  onChange,
  className = "",
  step = 1
}: AnimatedSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);

  // Calculate the percentage position
  const percentage = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    if (sliderRef.current) {
      // Set initial value
      setStartValue(value);
    }
  }, [value]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setStartX(event.clientX);
    setStartValue(value);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const deltaX = event.clientX - startX;
    const deltaPercentage = (deltaX / rect.width) * 100;
    const newPercentage = Math.max(0, Math.min(100, ((startValue - min) / (max - min)) * 100 + deltaPercentage));

    const newValue = Math.round(((newPercentage / 100) * (max - min) + min) / step) * step;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

    const newValue = Math.round(((newX / 100) * (max - min) + min) / step) * step;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  // Touch event handlers for mobile
  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setStartX(event.touches[0].clientX);
    setStartValue(value);
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const deltaX = event.touches[0].clientX - startX;
    const deltaPercentage = (deltaX / rect.width) * 100;
    const newPercentage = Math.max(0, Math.min(100, ((startValue - min) / (max - min)) * 100 + deltaPercentage));

    const newValue = Math.round(((newPercentage / 100) * (max - min) + min) / step) * step;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, startValue, startX]);

  return (
    <div
      className={`relative h-1.5 ${className}`}
      ref={sliderRef}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background track - strict console style */}
      <div
        className="absolute inset-0 bg-[#1f1f26] border border-[#2a2a35] rounded-full cursor-pointer"
        onClick={handleClick}
      />

      {/* Filled track - solid red for action */}
      <div
        className="absolute left-0 top-0 bg-red-600 rounded-full border border-red-500/20"
        style={{
          height: '100%',
          width: `${percentage}%`,
          transition: isDragging ? 'none' : 'width 150ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={handleClick}
      />
    </div>
  );
}
