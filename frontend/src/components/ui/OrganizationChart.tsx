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

const COLORS = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0']; // Green shades

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
    .slice(0, 5);

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
          <Tooltip
            cursor={{ fill: 'rgba(22, 163, 74, 0.1)' }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              color: '#1F2937',
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
            wrapperStyle={{ fontSize: '12px', color: '#4B5563' }}
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