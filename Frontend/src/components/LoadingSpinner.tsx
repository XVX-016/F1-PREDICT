import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-[40vh] flex items-center justify-center relative z-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-[#E10600] mx-auto mb-3"></div>
        <div className="text-white/80 text-sm font-mono uppercase tracking-widest">Loading</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
