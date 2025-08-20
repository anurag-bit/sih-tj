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

const COLORS = ['#FB923C', '#FDBA74', '#FED7AA']; // Orange shades

const CategoryChart: React.FC<CategoryChartProps> = ({ data, loading = false }) => {
  const chartData: CategoryData[] = Object.entries(data)
    .map(([category, count]) => ({
      category: category.length > 15 ? `${category.substring(0, 15)}...` : category,
      count,
      fullCategory: category,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

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
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#4B5563"
            fontSize={12}
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              color: '#1F2937',
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;