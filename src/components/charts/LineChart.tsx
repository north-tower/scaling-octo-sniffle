'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from './ChartCard';

interface LineChartData {
  name: string;
  data: Array<{
    x: string;
    y: number;
  }>;
  color?: string;
}

interface LineChartProps {
  data: LineChartData[];
  title: string;
  description?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
}

export function LineChartComponent({
  data,
  title,
  description,
  showLegend = true,
  showTooltip = true,
  height = 300,
  className,
}: LineChartProps) {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    if (!data.length) return [];
    
    const allXValues = new Set<string>();
    data.forEach(series => {
      series.data.forEach(point => allXValues.add(point.x));
    });
    
    const sortedXValues = Array.from(allXValues).sort();
    
    return sortedXValues.map(x => {
      const point: any = { x };
      data.forEach((series, index) => {
        const pointData = series.data.find(p => p.x === x);
        point[`series${index}`] = pointData?.y || 0;
      });
      return point;
    });
  }, [data]);

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
  ];

  return (
    <ChartCard title={title} description={description} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="x"
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          {showTooltip && (
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
          )}
          {showLegend && <Legend />}
          {data.map((series, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={`series${index}`}
              stroke={series.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={series.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default LineChartComponent;

