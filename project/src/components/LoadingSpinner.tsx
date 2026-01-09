import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 lg:h-32 lg:w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
        <div className="text-white text-lg sm:text-xl">Loading...</div>
        <div className="text-gray-400 text-sm mt-2">Please wait while we load the page</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;