import React from 'react';

interface ChartSkeletonProps {
  type?: 'bar' | 'pie' | 'wordcloud';
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ type = 'bar' }) => {
  if (type === 'bar') {
    return (
      <div className="h-64 sm:h-80 animate-pulse">
        <div className="flex items-end justify-center space-x-2 h-full p-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-600 rounded-t"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                width: '12%'
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center animate-pulse">
        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-600 rounded-full"></div>
      </div>
    );
  }

  if (type === 'wordcloud') {
    return (
      <div className="h-64 sm:h-80 p-2 sm:p-4 animate-pulse">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-600 rounded-md"
              style={{
                width: `${Math.random() * 60 + 40}px`,
                height: `${Math.random() * 10 + 20}px`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ChartSkeleton;