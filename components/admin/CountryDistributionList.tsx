'use client';

interface CountryItem {
  country: string;
  code: string;
  flag: string;
  count: number;
  percentage: number;
}

interface CountryDistributionListProps {
  countries: CountryItem[];
}

export default function CountryDistributionList({ countries }: CountryDistributionListProps) {
  if (!countries || countries.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Belum ada data negara
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
      {countries.map((item, idx) => (
        <div key={item.country} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.flag}</span>
              <span className="font-semibold text-slate-200">{item.country}</span>
              {idx === 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9.5px] font-bold">
                  Top
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-medium text-white">{item.count}</span>
              <span className="text-[11px] text-slate-500">({item.percentage}%)</span>
            </div>
          </div>

          <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                idx === 0
                  ? 'bg-gradient-to-r from-red-500 to-amber-500'
                  : idx === 1
                  ? 'bg-blue-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${Math.max(item.percentage, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
