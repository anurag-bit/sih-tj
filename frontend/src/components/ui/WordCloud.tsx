import React from 'react';
import ChartSkeleton from './ChartSkeleton';

interface KeywordData {
  keyword: string;
  count: number;
}

interface WordCloudProps {
  data: [string, number][];
  loading?: boolean;
}

const WordCloud: React.FC<WordCloudProps> = ({ data, loading = false }) => {
  if (loading) {
    return <ChartSkeleton type="wordcloud" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        No keyword data available
      </div>
    );
  }

  // Transform data and calculate sizes
  const keywords: KeywordData[] = data.map(([keyword, count]) => ({
    keyword,
    count
  }));

  // Find min and max counts for scaling
  const maxCount = Math.max(...keywords.map(k => k.count));
  const minCount = Math.min(...keywords.map(k => k.count));
  const countRange = maxCount - minCount || 1;

  // Generate colors
  const colors = [
    '#2563EB', // Electric Blue
    '#7C3AED', // Purple
    '#DC2626', // Red
    '#059669', // Green
    '#D97706', // Orange
    '#DB2777', // Pink
    '#0891B2', // Cyan
    '#65A30D', // Lime
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
  ];

  const getWordStyle = (keyword: KeywordData, index: number) => {
    // Scale font size between 14px and 32px
    const normalizedCount = (keyword.count - minCount) / countRange;
    const fontSize = 14 + (normalizedCount * 18);
    
    // Get color
    const color = colors[index % colors.length];
    
    return {
      fontSize: `${fontSize}px`,
      color,
      fontWeight: normalizedCount > 0.7 ? 'bold' : normalizedCount > 0.4 ? '600' : '400',
    };
  };

  return (
    <div className="h-64 sm:h-80 p-2 sm:p-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 h-full">
        {keywords.slice(0, 30).map((keyword, index) => (
          <span
            key={keyword.keyword}
            className="inline-block px-2 py-1 rounded-md hover:bg-gray-700 transition-colors duration-150 cursor-default"
            style={getWordStyle(keyword, index)}
            title={`${keyword.keyword}: ${keyword.count} occurrences`}
          >
            {keyword.keyword}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WordCloud;