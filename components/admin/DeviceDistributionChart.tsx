'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Smartphone, Laptop, Tablet } from 'lucide-react';

interface DeviceDistributionChartProps {
  data: {
    device: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

interface TooltipPayloadItem {
  value: number;
  payload: {
    device: string;
    count: number;
    percentage: number;
    color: string;
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
        <p className="font-bold text-slate-200">{item.device}</p>
        <p className="text-slate-400 mt-1">
          Total: <span className="font-bold text-white">{item.count}</span> ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export default function DeviceDistributionChart({ data }: DeviceDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
        Belum ada data perangkat
      </div>
    );
  }

  const getDeviceIcon = (name: string) => {
    if (name.toLowerCase().includes('mobile') || name.toLowerCase().includes('hp')) {
      return <Smartphone className="h-3.5 w-3.5 text-blue-400" />;
    }
    if (name.toLowerCase().includes('tablet')) {
      return <Tablet className="h-3.5 w-3.5 text-amber-400" />;
    }
    return <Laptop className="h-3.5 w-3.5 text-emerald-400" />;
  };

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-3">
      <div className="h-44 sm:h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={46}
              outerRadius={70}
              paddingAngle={4}
              dataKey="count"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl sm:text-2xl font-black text-white leading-none">
            {data[0]?.percentage || 0}%
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
            {data[0]?.device.split(' ')[0] || 'Mobile'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80">
        {data.map((item) => (
          <div
            key={item.device}
            className="flex flex-col items-center text-center p-1.5 sm:p-2 rounded-lg bg-slate-950/40 border border-slate-800/50"
          >
            <div className="flex items-center gap-1 mb-0.5">
              {getDeviceIcon(item.device)}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 truncate max-w-[55px] sm:max-w-none">
                {item.device.replace(' (HP)', '')}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-white">{item.percentage}%</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500">{item.count} kunjungan</span>
          </div>
        ))}
      </div>
    </div>
  );
}
