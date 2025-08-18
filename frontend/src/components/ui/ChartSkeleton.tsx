import React from 'react';

interface ChartSkeletonProps {
  type?: 'bar' | 'pie' | 'wordcloud';
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ type = 'bar' }) => {
  if (type === 'bar') {
    return (
      <div className="h-96 animate-pulse">
        <div className="flex items-end justify-center space-x-2 h-full p-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t"
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
      <div className="h-96 flex items-center justify-center animate-pulse">
        <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (type === 'wordcloud') {
    return (
      <div className="h-96 p-4 animate-pulse">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-md"
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
