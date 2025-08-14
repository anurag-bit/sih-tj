import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

interface OrganizationData {
  name: string;
  value: number;
  percentage: number;
}

interface OrganizationChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

const COLORS = [
  '#2563EB', // Electric Blue
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#059669', // Green
  '#D97706', // Orange
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#65A30D', // Lime
];

const OrganizationChart: React.FC<OrganizationChartProps> = ({ data, loading = false }) => {
  // Transform data for recharts
  const totalProblems = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  const chartData: OrganizationData[] = Object.entries(data)
    .map(([name, value]) => ({
      name: name.length > 20 ? `${name.substring(0, 20)}...` : name,
      fullName: name,
      value,
      percentage: Math.round((value / totalProblems) * 100)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Show top 8 organizations

  if (loading) {
    return <ChartSkeleton type="pie" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-400">
        No organization data available
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
              fontSize: '14px'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} problems (${props.payload.percentage}%)`,
              props.payload.fullName || name
            ]}
          />
          <Legend 
            wrapperStyle={{ 
              color: '#9CA3AF',
              fontSize: '12px'
            }}
            formatter={(value: string, entry: any) => entry.payload.fullName || value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrganizationChart;