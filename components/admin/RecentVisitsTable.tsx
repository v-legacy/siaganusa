'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Laptop,
  Tablet,
  Search,
  Clock,
} from 'lucide-react';
import type { TrafficVisit } from '@/lib/analytics';

interface RecentVisitsTableProps {
  visits: TrafficVisit[];
}

export default function RecentVisitsTable({ visits }: RecentVisitsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(15);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchesSearch =
        searchTerm === '' ||
        v.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.source.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        selectedSource === 'all' || v.source.toLowerCase() === selectedSource.toLowerCase();

      const matchesDevice =
        selectedDevice === 'all' || v.device.toLowerCase().includes(selectedDevice.toLowerCase());

      return matchesSearch && matchesSource && matchesDevice;
    });
  }, [visits, searchTerm, selectedSource, selectedDevice]);

  const displayedVisits = useMemo(() => {
    return filteredVisits.slice(0, pageSize);
  }, [filteredVisits, pageSize]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getSourceBadge = (source: TrafficVisit['source']) => {
    switch (source) {
      case 'Instagram':
        return (
          <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/40 font-semibold text-[10px]">
            📸 Instagram
          </Badge>
        );
      case 'Twitter / X':
        return (
          <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold text-[10px]">
            🐦 X / Twitter
          </Badge>
        );
      case 'TikTok':
        return (
          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold text-[10px]">
            🎵 TikTok
          </Badge>
        );
      case 'WhatsApp':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold text-[10px]">
            💬 WhatsApp
          </Badge>
        );
      case 'Facebook':
        return (
          <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold text-[10px]">
            👍 Facebook
          </Badge>
        );
      case 'Google Search':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold text-[10px]">
            🔍 Google
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px]">
            🔗 Langsung
          </Badge>
        );
    }
  };

  const getDeviceIcon = (device: TrafficVisit['device']) => {
    if (device === 'Mobile') {
      return <Smartphone className="h-4 w-4 text-blue-400 shrink-0" />;
    }
    if (device === 'Tablet') {
      return <Tablet className="h-4 w-4 text-amber-400 shrink-0" />;
    }
    return <Laptop className="h-4 w-4 text-emerald-400 shrink-0" />;
  };

  const getFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      ID: '🇮🇩',
      MY: '🇲🇾',
      SG: '🇸🇬',
      US: '🇺🇸',
      AU: '🇦🇺',
      JP: '🇯🇵',
      TH: '🇹🇭',
    };
    return flags[countryCode] || '🌐';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters (Mobile-First Layout) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <Input
            placeholder="Cari IP, kota, device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9.5 bg-slate-950/60 border-slate-800 text-xs text-white placeholder:text-slate-500 h-9.5 rounded-xl"
          />
        </div>

        {/* Filters Dropdown (Grid 2 cols on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 h-9.5 cursor-pointer shadow-sm"
          >
            <option value="all">Semua Sumber</option>
            <option value="instagram">Instagram</option>
            <option value="twitter / x">Twitter / X</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="google search">Google</option>
            <option value="direct">Direct</option>
          </select>

          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 h-9.5 cursor-pointer shadow-sm"
          >
            <option value="all">Semua Perangkat</option>
            <option value="mobile">Mobile (HP)</option>
            <option value="desktop">Desktop / Laptop</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
      </div>

      {/* ─── 1. Desktop View: Full Data Table (Hidden on Mobile) ─────────── */}
      <div className="hidden md:block rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-[120px] text-slate-400 text-xs font-semibold">
                Waktu
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold">
                Perangkat & Browser
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold">
                Sumber / Sosmed
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold">
                Lokasi / Negara
              </TableHead>
              <TableHead className="text-slate-400 text-xs font-semibold">
                IP Masked
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedVisits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-28 text-center text-slate-500 text-xs"
                >
                  Tidak ada data kunjungan yang cocok dengan pencarian Anda.
                </TableCell>
              </TableRow>
            ) : (
              displayedVisits.map((visit) => (
                <TableRow
                  key={visit.id}
                  className="border-slate-800/60 hover:bg-slate-900/40 transition-colors text-xs"
                >
                  <TableCell className="font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-600 shrink-0" />
                      {formatTime(visit.timestamp)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(visit.device)}
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-xs">
                          {visit.deviceModel}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {visit.os} · {visit.browser}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{getSourceBadge(visit.source)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm shrink-0">
                        {getFlag(visit.countryCode)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-300 text-xs">
                          {visit.city}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {visit.country}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>{visit.ip}</span>
                      {visit.hits && visit.hits > 1 ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[9.5px] font-sans text-slate-300">
                          {visit.hits}x
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── 2. Mobile View: Responsive Visitor Cards Feed (Block on Mobile) ─── */}
      <div className="md:hidden space-y-2.5">
        {displayedVisits.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-slate-800 rounded-xl bg-slate-950/40">
            Tidak ada data kunjungan yang cocok.
          </div>
        ) : (
          displayedVisits.map((visit) => (
            <div
              key={visit.id}
              className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2.5 hover:border-slate-700 transition-colors shadow-sm"
            >
              {/* Header: Location & Time */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <span className="text-base">{getFlag(visit.countryCode)}</span>
                  <span className="truncate max-w-[180px]">{visit.city}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {visit.hits && visit.hits > 1 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-850 border border-slate-800 text-[9.5px] text-slate-300">
                      {visit.hits}x tayang
                    </span>
                  ) : null}
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {formatTime(visit.timestamp)}
                  </span>
                </div>
              </div>

              {/* Body: Device & Referral */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {getDeviceIcon(visit.device)}
                  <div className="flex flex-col">
                    <span className="text-slate-200 font-medium text-xs">
                      {visit.deviceModel}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {visit.os} · {visit.browser}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {getSourceBadge(visit.source)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination & Count footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-3 border-t border-slate-800/50 mt-1">
        <span className="text-xs">
          Menampilkan {displayedVisits.length} dari {filteredVisits.length}
        </span>
        {filteredVisits.length > pageSize && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageSize((prev) => prev + 15)}
            className="text-xs h-8 px-3 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Muat Lebih Banyak
          </Button>
        )}
      </div>
    </div>
  );
}
