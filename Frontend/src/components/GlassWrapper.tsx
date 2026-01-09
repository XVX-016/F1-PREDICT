import React from 'react';
// Local glass wrapper to avoid external dependency issues

interface GlassWrapperProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export default function GlassWrapper({ children, accent = false, className = '' }: GlassWrapperProps) {
  return (
    <div
      className={`rounded-2xl border p-5 md:p-6 lg:p-8 
        ${accent ? 'bg-red-900/90 border-red-500/50' : 'bg-black/90 border-white/10'} 
        text-white shadow-xl ${className}`}
      style={{ minHeight: '100%' }}
    >
      {children}
    </div>
  );
}


