'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from './ChartCard';

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
}

export function BarChartComponent({
  data,
  title,
  description,
  xAxisKey = 'name',
  yAxisKey = 'value',
  showLegend = true,
  showTooltip = true,
  height = 300,
  className,
}: BarChartProps) {
  const chartData = data.map((item, index) => ({
    [xAxisKey]: item.name,
    [yAxisKey]: item.value,
    fill: item.color || `hsl(${index * 40}, 70%, 50%)`,
  }));

  return (
    <ChartCard title={title} description={description} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
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
          <Bar dataKey={yAxisKey} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default BarChartComponent;

