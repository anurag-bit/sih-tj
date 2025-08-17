import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

interface CategoryData {
  category: string;
  count: number;
  fullCategory: string;
}

interface CategoryChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA'];

const CategoryChart: React.FC<CategoryChartProps> = ({ data, loading = false }) => {
  const chartData: CategoryData[] = Object.entries(data)
    .map(([category, count]) => ({
      category: category.length > 15 ? `${category.substring(0, 15)}...` : category,
      count,
      fullCategory: category,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Show top 15 categories

  if (loading) {
    return <ChartSkeleton type="bar" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No category data available
      </div>
    );
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid stroke="#374151" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis
            type="category"
            dataKey="fullCategory"
            stroke="#9CA3AF"
            fontSize={12}
            width={120}
            tick={{
              width: 110,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F9FAFB',
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
