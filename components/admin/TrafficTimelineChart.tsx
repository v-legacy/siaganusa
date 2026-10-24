'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrafficTimelineChartProps {
  data: {
    date: string;
    label: string;
    visits: number;
    uniques: number;
  }[];
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs text-white">
        <p className="font-bold text-slate-300 mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-slate-400">Total Kunjungan:</span>
            <span className="font-bold text-white">{payload[0]?.value || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-slate-400">Pengunjung Unik:</span>
            <span className="font-bold text-white">{payload[1]?.value || 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function TrafficTimelineChart({ data }: TrafficTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 sm:h-72 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
        Belum ada data grafik trafik
      </div>
    );
  }

  return (
    <div className="h-56 sm:h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            interval="preserveStartEnd"
            dy={4}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="visits"
            name="Total Kunjungan"
            stroke="#ef4444"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorVisits)"
          />
          <Area
            type="monotone"
            dataKey="uniques"
            name="Pengunjung Unik"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUniques)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
