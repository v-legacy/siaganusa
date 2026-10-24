'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SocialReferralChartProps {
  data: {
    source: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

interface TooltipPayloadItem {
  value: number;
  payload: {
    source: string;
    count: number;
    percentage: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-md text-xs text-white">
        <p className="font-bold text-slate-200">{item.source}</p>
        <p className="text-slate-400 mt-1">
          Kunjungan:{' '}
          <span className="font-bold text-white">{item.count}</span> ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export default function SocialReferralChart({ data }: SocialReferralChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 sm:h-64 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
        Belum ada data sumber trafik
      </div>
    );
  }

  return (
    <div className="h-56 sm:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
        >
          <XAxis type="number" stroke="#64748b" fontSize={10} hide />
          <YAxis
            type="category"
            dataKey="source"
            stroke="#94a3b8"
            fontSize={10.5}
            tickLine={false}
            axisLine={false}
            width={78}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
