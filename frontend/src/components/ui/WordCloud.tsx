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

const COLORS = ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'];

const WordCloud: React.FC<WordCloudProps> = ({ data, loading = false }) => {
  if (loading) {
    return <ChartSkeleton type="wordcloud" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No keyword data available
      </div>
    );
  }

  const keywords: KeywordData[] = data.map(([keyword, count]) => ({
    keyword,
    count
  }));

  const maxCount = Math.max(...keywords.map(k => k.count));
  const minCount = Math.min(...keywords.map(k => k.count));
  const countRange = maxCount - minCount || 1;

  const getWordStyle = (keyword: KeywordData) => {
    const normalizedCount = (keyword.count - minCount) / countRange;
    const fontSize = 12 + (normalizedCount * 24); // Scale from 12px to 36px
    const color = COLORS[Math.floor(normalizedCount * (COLORS.length - 1))];
    const fontWeight = normalizedCount > 0.6 ? 700 : 500;

    return {
      fontSize: `${fontSize}px`,
      color,
      fontWeight,
      lineHeight: 1.2,
    };
  };

  return (
    <div className="h-96 p-4">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 h-full">
        {keywords.slice(0, 40).map((keyword) => (
          <span
            key={keyword.keyword}
            className="transition-all duration-300 hover:scale-110 cursor-default"
            style={getWordStyle(keyword)}
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
