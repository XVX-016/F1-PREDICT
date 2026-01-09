import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'podium' | 'list' | 'grid' | 'stats';
  className?: string;
}

export default function LoadingSkeleton({ type = 'card', className = '' }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'podium':
        return (
          <div className="space-y-8 animate-pulse">
            <div className="text-center">
              <div className="h-16 bg-black/80 backdrop-blur-sm rounded-2xl w-96 mx-auto mb-8"></div>
              <div className="flex justify-center space-x-8">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="text-center">
                    <div className={`w-32 bg-black/80 backdrop-blur-sm rounded-2xl mx-auto mb-4 ${pos === 1 ? 'h-48' : pos === 2 ? 'h-44' : 'h-40'}`}></div>
                    <div className="h-6 bg-black/80 backdrop-blur-sm rounded-xl w-28 mx-auto mb-3"></div>
                    <div className="h-5 bg-black/60 rounded-lg w-24 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black/60 rounded-lg"></div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black/60 rounded-full"></div>
                    <div>
                      <div className="h-5 bg-black/60 rounded-lg w-32 mb-2"></div>
                      <div className="h-4 bg-black/40 rounded-lg w-24"></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-black/60 rounded-lg w-16 mb-2"></div>
                  <div className="h-4 bg-black/40 rounded-lg w-20"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="h-8 bg-black/60 rounded-lg w-3/4 mb-4"></div>
                <div className="h-6 bg-black/60 rounded-lg w-1/2 mb-3"></div>
                <div className="h-4 bg-black/40 rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        );

      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <div className="h-12 bg-black/60 rounded-lg w-24 mx-auto mb-2"></div>
                <div className="h-5 bg-black/60 rounded-lg w-32 mx-auto"></div>
              </div>
            ))}
          </div>
        );

      default: // card
        return (
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-black/60 rounded-lg w-3/4 mb-4"></div>
            <div className="h-4 bg-black/60 rounded-lg w-1/2 mb-3"></div>
            <div className="h-4 bg-black/40 rounded-lg w-2/3 mb-3"></div>
            <div className="h-4 bg-black/40 rounded-lg w-1/2"></div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
}


