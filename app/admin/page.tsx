'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Users,
  Eye,
  Share2,
  Smartphone,
  Globe,
  LogOut,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

import CountryDistributionList from '@/components/admin/CountryDistributionList';
import type { AnalyticsSummary } from '@/lib/analytics';

// ─── Code-splitting ──────────────────────────────────────────────────────────
// Recharts (+ d3) adalah dependensi terberat di dashboard. Chart dimuat sebagai
// chunk terpisah khusus klien (ResponsiveContainer butuh ukuran DOM), dengan
// skeleton yang tingginya sama persis dengan chart agar tidak terjadi CLS.
const TrafficTimelineChart = dynamic(() => import('@/components/admin/TrafficTimelineChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-56 sm:h-72 w-full" />,
});
const SocialReferralChart = dynamic(() => import('@/components/admin/SocialReferralChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-56 sm:h-64 w-full" />,
});
const DeviceDistributionChart = dynamic(() => import('@/components/admin/DeviceDistributionChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});
// Tabel log berada di bawah fold: tetap di-SSR, JS-nya dipisah ke chunk sendiri.
const RecentVisitsTable = dynamic(() => import('@/components/admin/RecentVisitsTable'));

const AUTO_REFRESH_MS = 60_000;

const RANGE_OPTIONS = [
  { value: 1, label: 'Hari Ini' },
  { value: 7, label: '7 Hari' },
  { value: 30, label: '30 Hari' },
] as const;

const CONTAINER = 'mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8';
const CARD = 'rounded-2xl border-slate-800 bg-slate-900/70 shadow-sm';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

/* ─── Skeleton primitives ─────────────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-800/70 motion-reduce:animate-none ${className}`}
    />
  );
}

/* ─── KPI Card ────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint: ReactNode;
  icon: ReactNode;
  tone: 'red' | 'amber' | 'pink' | 'blue';
  loading: boolean;
}

const TONES = {
  red: 'bg-red-500/10 text-red-400',
  amber: 'bg-amber-500/10 text-amber-400',
  pink: 'bg-pink-500/10 text-pink-400',
  blue: 'bg-blue-500/10 text-blue-400',
} as const;

function KpiCard({ label, value, hint, icon, tone, loading }: KpiCardProps) {
  return (
    <Card
      className={`${CARD} p-4 sm:p-5 lg:p-6 flex flex-col gap-3 transition-colors hover:border-slate-700`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">
          {label}
        </h3>
        <span className={`shrink-0 p-2 rounded-xl ${TONES[tone]}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight tabular-nums truncate">
            {value}
          </p>
          <div className="mt-1.5 text-[11px] sm:text-xs text-slate-400">{hint}</div>
        </div>
      )}
    </Card>
  );
}

/* ─── Trend helper: bandingkan paruh akhir vs paruh awal timeline ─────── */
function computeTrend(timeline: AnalyticsSummary['timeline'] | undefined): number | null {
  if (!timeline || timeline.length < 2) return null;
  const mid = Math.floor(timeline.length / 2);
  const prev = timeline.slice(0, mid).reduce((s, t) => s + t.visits, 0);
  const curr = timeline.slice(mid).reduce((s, t) => s + t.visits, 0);
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-slate-500">Belum cukup data tren</span>;
  }
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = flat ? 'text-slate-400' : up ? 'text-emerald-400' : 'text-red-400';
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {up ? '+' : ''}
      {value}% <span className="font-normal text-slate-500">vs periode sebelumnya</span>
    </span>
  );
}

type AnalyticsResult =
  | { status: 'ok'; data: AnalyticsSummary }
  | { status: 'unauthorized' }
  | { status: 'error'; message: string };

async function requestAnalytics(days: number): Promise<AnalyticsResult> {
  try {
    const res = await fetch(`/api/admin/analytics?days=${days}`);
    if (res.status === 401) return { status: 'unauthorized' };
    const json = await res.json();
    if (res.ok && json.success) return { status: 'ok', data: json.data };
    return { status: 'error', message: json.message || 'Gagal memuat data analitik.' };
  } catch {
    return { status: 'error', message: 'Terjadi kesalahan koneksi ke server.' };
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<number>(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const applyResult = useCallback(
    (result: AnalyticsResult) => {
      if (result.status === 'unauthorized') {
        router.push('/admin/login');
        return;
      }
      if (result.status === 'ok') {
        setData(result.data);
        setLastUpdated(new Date());
        setErrorMsg('');
      } else {
        setErrorMsg(result.message);
      }
      setIsFetching(false);
      setIsRefreshing(false);
    },
    [router]
  );

  const handleChangeRange = (days: number) => {
    if (days === timeRange) return;
    setIsFetching(true);
    setTimeRange(days);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setIsFetching(true);
    setErrorMsg('');
    requestAnalytics(timeRange).then(applyResult);
  };

  // Muat data saat pertama kali & saat rentang waktu berubah (respons usang diabaikan)
  useEffect(() => {
    let cancelled = false;
    requestAnalytics(timeRange).then((r) => {
      if (!cancelled) applyResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResult, timeRange]);

  // Auto-refresh tiap 60 detik, hanya saat tab terlihat
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        requestAnalytics(timeRange).then(applyResult);
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [applyResult, timeRange]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const trend = useMemo(() => computeTrend(data?.timeline), [data?.timeline]);
  const topSource =
    data?.sources?.find((s) => s.source === data.topSocialSource) ?? data?.sources?.[0];
  const topCountry = data?.countries?.[0];
  const showSkeleton = data === null && isFetching;
  const isStale = data !== null && isFetching; // ganti range: data lama diredupkan

  const rangeLabel =
    RANGE_OPTIONS.find((r) => r.value === timeRange)?.label.toLowerCase() ?? `${timeRange} hari`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
      {/* Skip link (aksesibilitas keyboard) */}
      <a
        href="#konten-utama"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-red-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white ${FOCUS}`}
      >
        Lewati ke konten utama
      </a>

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className={`${CONTAINER} h-16 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-amber-600 shadow-md shadow-red-500/20"
              aria-hidden="true"
            >
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  SiagaNusa
                </span>
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-400 text-[10px] uppercase font-bold py-0.5 px-2"
                >
                  Admin
                </Badge>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 truncate">
                Dashboard Trafik &amp; Analitik Pengunjung
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {data && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                title="Perkiraan pengunjung aktif dalam beberapa menit terakhir"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  {data.liveVisitors}
                  <span className="hidden sm:inline"> aktif</span>
                  <span className="sr-only"> pengunjung aktif</span>
                </span>
              </div>
            )}

            <Link href="/" target="_blank" rel="noopener" aria-label="Buka peta (tab baru)">
              <Button
                variant="outline"
                size="sm"
                className={`border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 h-10 sm:h-9 min-w-10 px-3 rounded-xl ${FOCUS}`}
                tabIndex={-1}
              >
                <MapPin className="h-4 w-4 text-red-400 sm:mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline font-medium">Buka Peta</span>
                <ExternalLink className="hidden sm:inline ml-1.5 h-3 w-3 text-slate-500" aria-hidden="true" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Keluar dari sesi admin"
              className={`text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-10 sm:h-9 min-w-10 px-3 rounded-xl ${FOCUS}`}
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main ───────────────────────────────────────────────────── */}
      <main
        id="konten-utama"
        className={`${CONTAINER} flex-1 py-6 sm:py-8 space-y-6 sm:space-y-8`}
      >
        {/* Page title + controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Statistik Kunjungan
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Pantau trafik, sumber referral, perangkat, dan lokasi pengunjung SiagaNusa.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
            <p
              className="text-[11px] sm:text-xs text-slate-500 sm:text-right"
              role="status"
              aria-live="polite"
            >
              {lastUpdated
                ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })} · otomatis tiap 1 menit`
                : 'Memuat data…'}
            </p>

            <div className="flex items-center gap-2.5">
              <div
                role="group"
                aria-label="Rentang waktu"
                className="flex-1 sm:flex-initial inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs text-slate-400"
              >
                {RANGE_OPTIONS.map((opt) => {
                  const active = timeRange === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleChangeRange(opt.value)}
                      className={`flex-1 sm:flex-initial min-h-9 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${FOCUS} ${
                        active
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                aria-label="Perbarui data sekarang"
                title="Perbarui data"
                className={`border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 h-11 w-11 sm:h-10 sm:w-10 p-0 rounded-xl shrink-0 ${FOCUS}`}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Error banner dengan aksi pemulihan */}
        {errorMsg && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className={`border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10 h-9 ${FOCUS}`}
            >
              Coba lagi
            </Button>
          </div>
        )}

        {/* Konten utama: redup saat ganti periode */}
        <div
          className={`space-y-6 sm:space-y-8 transition-opacity duration-200 ${
            isStale ? 'opacity-60' : 'opacity-100'
          }`}
          aria-busy={isFetching}
        >
          {/* KPI */}
          <section aria-label="Ringkasan metrik" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            <KpiCard
              label="Total Kunjungan"
              tone="red"
              icon={<Eye className="h-4 w-4" />}
              loading={showSkeleton}
              value={(data?.totalVisits ?? 0).toLocaleString('id-ID')}
              hint={<TrendBadge value={trend} />}
            />
            <KpiCard
              label="Pengunjung Unik"
              tone="amber"
              icon={<Users className="h-4 w-4" />}
              loading={showSkeleton}
              value={(data?.uniqueVisitors ?? 0).toLocaleString('id-ID')}
              hint={
                data && data.totalVisits > 0
                  ? `${Math.round((data.uniqueVisitors / data.totalVisits) * 100)}% dari total kunjungan`
                  : 'Berdasarkan IP unik'
              }
            />
            <KpiCard
              label="Sumber Teratas"
              tone="pink"
              icon={<Share2 className="h-4 w-4" />}
              loading={showSkeleton}
              value={data?.topSocialSource ?? '-'}
              hint={topSource ? `${topSource.percentage}% dari seluruh trafik` : 'Belum ada data'}
            />
            <KpiCard
              label="Perangkat Dominan"
              tone="blue"
              icon={<Smartphone className="h-4 w-4" />}
              loading={showSkeleton}
              value={
                data
                  ? data.mobilePercentage >= data.desktopPercentage
                    ? `${data.mobilePercentage}% HP`
                    : `${data.desktopPercentage}% Desktop`
                  : '-'
              }
              hint={
                data
                  ? data.mobilePercentage >= data.desktopPercentage
                    ? `${data.desktopPercentage}% Desktop / Laptop`
                    : `${data.mobilePercentage}% HP`
                  : ''
              }
            />
          </section>

          {/* Insight ringkas satu kalimat — membantu admin langsung paham */}
          {data && data.totalVisits > 0 && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed rounded-xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
              <span className="font-semibold text-slate-200">Ringkasan {rangeLabel}:</span>{' '}
              {data.totalVisits.toLocaleString('id-ID')} kunjungan
              {topCountry ? `, terbanyak dari ${topCountry.country} (${topCountry.percentage}%)` : ''}
              {topSource ? `, dengan sumber utama ${topSource.source}` : ''}.
            </p>
          )}

          {/* Tren + perangkat */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className={`lg:col-span-2 ${CARD}`}>
              <CardHeader className="p-5 sm:p-6 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg font-bold text-white">
                      Tren Kunjungan
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {timeRange === 1 ? 'Per jam hari ini' : `${timeRange} hari terakhir`} · total vs pengunjung unik
                    </CardDescription>
                  </div>
                  <ul className="flex items-center gap-4 text-xs text-slate-300" aria-label="Legenda grafik">
                    <li className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                      Total
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                      Unik
                    </li>
                  </ul>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-3">
                {showSkeleton ? (
                  <Skeleton className="h-56 sm:h-72 w-full" />
                ) : (
                  <TrafficTimelineChart data={data?.timeline || []} />
                )}
              </CardContent>
            </Card>

            <Card className={CARD}>
              <CardHeader className="p-5 sm:p-6 pb-2 space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold text-white">
                  Distribusi Perangkat
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  HP, Desktop/Laptop, dan Tablet
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-3">
                {showSkeleton ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <DeviceDistributionChart data={data?.devices || []} />
                )}
              </CardContent>
            </Card>
          </section>

          {/* Sosmed + negara */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className={CARD}>
              <CardHeader className="p-5 sm:p-6 pb-2 space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-pink-400 shrink-0" aria-hidden="true" />
                  Sumber Trafik
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Dari platform mana pengunjung mengklik link SiagaNusa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-3">
                {showSkeleton ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <SocialReferralChart data={data?.sources || []} />
                )}
              </CardContent>
            </Card>

            <Card className={CARD}>
              <CardHeader className="p-5 sm:p-6 pb-2 space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  Asal Negara
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Peringkat negara pengunjung terbanyak
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-3">
                {showSkeleton ? (
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <CountryDistributionList countries={data?.countries || []} />
                )}
              </CardContent>
            </Card>
          </section>

          {/* Log pengunjung */}
          <section>
            <Card className={CARD}>
              <CardHeader className="p-5 sm:p-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
                      Log Pengunjung
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Riwayat kunjungan terbaru beserta perangkat, sumber, dan lokasi
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit text-xs border-slate-700 bg-slate-800/50 text-slate-300 px-2.5 py-1 rounded-lg tabular-nums"
                  >
                    {data?.recentVisits?.length ?? 0} kunjungan
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-0">
                {showSkeleton ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <RecentVisitsTable visits={data?.recentVisits || []} />
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-8 w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className={CONTAINER}>
          <p>SiagaNusa Admin Console &copy; 2026 · Akses terbatas</p>
        </div>
      </footer>
    </div>
  );
}
