import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, loading = false }) => {
  // Transform data for recharts
  const chartData: CategoryData[] = Object.entries(data).map(([category, count]) => ({
    category: category.length > 15 ? `${category.substring(0, 15)}...` : category,
    count,
    fullCategory: category
  }));

  // Sort by count descending
  chartData.sort((a, b) => b.count - a.count);

  if (loading) {
    return <ChartSkeleton type="bar" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        No category data available
      </div>
    );
  }

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 80,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="category" 
            stroke="#9CA3AF"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={10}
            interval={0}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={10}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
              fontSize: '14px'
            }}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item?.fullCategory || label;
            }}
          />
          <Bar 
            dataKey="count" 
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;