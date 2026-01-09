import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { MarketFilters } from '../../types/betting';

interface MarketFiltersComponentProps {
  filters: MarketFilters;
  onFiltersChange: (filters: MarketFilters) => void;
}

export default function MarketFiltersComponent({ filters, onFiltersChange }: MarketFiltersComponentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mt-6">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Advanced Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Volume Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Volume
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minVolume || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  minVolume: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Price (cents)
              </label>
              <input
                type="number"
                placeholder="100"
                min="0"
                max="100"
                value={filters.maxPrice || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  maxPrice: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Price (cents)
              </label>
              <input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={filters.minPrice || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  minPrice: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onFiltersChange({
                ...filters,
                isActive: filters.isActive === true ? undefined : true,
                isSettled: undefined
              })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.isActive === true
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Active Only
            </button>

            <button
              onClick={() => onFiltersChange({
                ...filters,
                isSettled: filters.isSettled === true ? undefined : true,
                isActive: undefined
              })}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.isSettled === true
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Settled Only
            </button>
          </div>
        </motion.div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.minVolume && (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
              Min Volume: ${filters.minVolume}
            </span>
          )}
          {filters.maxPrice && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
              Max Price: {filters.maxPrice}¢
            </span>
          )}
          {filters.minPrice && (
            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
              Min Price: {filters.minPrice}¢
            </span>
          )}
          {filters.isActive === true && (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
              Active Only
            </span>
          )}
          {filters.isSettled === true && (
            <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">
              Settled Only
            </span>
          )}
        </div>
      )}
    </div>
  );
}
