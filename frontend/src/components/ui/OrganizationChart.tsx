import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

interface OrganizationData {
  name: string;
  value: number;
  percentage: number;
  fullName: string;
}

interface OrganizationChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const OrganizationChart: React.FC<OrganizationChartProps> = ({ data, loading = false }) => {
  const totalProblems = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  const chartData: OrganizationData[] = Object.entries(data)
    .map(([name, value]) => ({
      name: name.length > 20 ? `${name.substring(0, 20)}...` : name,
      fullName: name,
      value,
      percentage: Math.round((value / totalProblems) * 100)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Show top 5 organizations

  if (loading) {
    return <ChartSkeleton type="pie" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No organization data available
      </div>
    );
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={1} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F9FAFB',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} problems (${props.payload.percentage}%)`,
              props.payload.fullName || name,
            ]}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={10}
            wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            cornerRadius={8}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrganizationChart;
