import React from 'react';

interface SkeletonCardProps {
  variant?: 'problem' | 'dashboard' | 'chat';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'problem',
  className = '' 
}) => {
  if (variant === 'problem') {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 animate-pulse ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded-lg mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded-lg w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-700 rounded-full ml-4"></div>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-700 rounded-lg w-full"></div>
          <div className="h-4 bg-gray-700 rounded-lg w-5/6"></div>
          <div className="h-4 bg-gray-700 rounded-lg w-4/6"></div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-16 bg-gray-700 rounded-full"></div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700 rounded-lg w-24"></div>
          <div className="h-8 w-20 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 animate-pulse ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-700 rounded-lg w-48"></div>
        </div>
        <div className="h-64 bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div className={`flex justify-start ${className}`}>
        <div className="flex max-w-[80%]">
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
          </div>
          <div className="bg-gray-700 rounded-lg px-4 py-3 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-600 rounded w-48"></div>
              <div className="h-4 bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonCard;