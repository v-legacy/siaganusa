/**
 * @file components/tsunami/TsunamiComingSoonClient.tsx
 * @description Halaman antarmuka interaktif Simulator Tsunami Nusantara.
 * Didesain dengan standar Expert UI/UX (dark-mode first, glassmorphism, 4 pilar kartu horizontal,
 * ilustrasi vektor SVG ilmiah, dan interaksi responsif).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Waves,
  Activity,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Bell,
  CheckCircle2,
  Compass,
  Layers,
  Radio,
  Gauge,
} from 'lucide-react';
import TsunamiHeroIllustration from './TsunamiHeroIllustration';

export default function TsunamiComingSoonClient() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    try {
      localStorage.setItem('siaganusa_tsunami_notify', email);
    } catch {
      // ignore
    }

    setIsSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 3000);
  };

  // Data 4 Pilar Utama Fitur Simulator Tsunami
  const featureCards = [
    {
      id: '01',
      title: 'Kalkulasi Skala Gempa & Patahan Megathrust',
      subtitle: 'Seismic Rupture & Elastic Deformation',
      engine: 'Model Sesar Okada (1985)',
      icon: Activity,
      gradient: 'from-rose-500/20 via-orange-500/10 to-transparent',
      accentColor: '#f43f5e',
      badgeClass: 'border-rose-500/30 text-rose-300 bg-rose-500/10',
      description:
        'Menghitung momen seismik (Mw), kedalaman hiposenter gempa dangkal, orientasi strike-dip-rake, serta pergeseran vertikal dasar laut secara instan untuk menentukan apakah gempa berpotensi memicu gelombang tsunami.',
      features: [
        'Kalkulasi energi dislokasi kerak bumi Mw 6.0 – 9.5',
        'Analisis zona subduksi megathrust lempeng aktif',
        'Estimasi volume air laut yang terangkat vertikal',
      ],
      metric: 'Rentang Mw: 6.0 – 9.5 · Kedalaman: 0–70 km',
    },
    {
      id: '02',
      title: 'Simulasi Hidrodinamika & Estimasi Tiba (ETA)',
      subtitle: 'Wave Propagation & Shallow Water Physics',
      engine: 'Nonlinear Shallow Water (NLSW)',
      icon: Waves,
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      accentColor: '#06b6d4',
      badgeClass: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
      description:
        'Memodelkan penjalaran gelombang di laut dalam berkecepatan jet (~800 km/jam), efek pendangkalan (shoaling) saat mendekati pulau, amplifikasi run-up, hingga estimasi waktu tiba (ETA) menit-ke-menit di setiap teluk.',
      features: [
        'Kecepatan rambat dinamis: v = √(g · h) sesuai batimetri GEBCO',
        'Perhitungan waktu tempuh tiba di garis pantai (ETA Akurat)',
        'Pemodelan puncak gelombang run-up (tinggi limpasan 1–20m)',
      ],
      metric: 'Kecepatan Gelombang: Hingga 800 km/jam',
    },
    {
      id: '03',
      title: 'Mapping Area Terdampak & Zona Rendaman',
      subtitle: 'Coastal Inundation & DEM Topography',
      engine: 'High-Res DEM Coastal Model',
      icon: Layers,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      accentColor: '#10b981',
      badgeClass: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      description:
        'Memproyeksikan batas banjir genangan tsunami secara spasial pada peta kontur ketinggian pantai, pelabuhan, jalan arteri, hingga permukiman padat untuk mengidentifikasi area yang terisolasi atau berisiko tinggi.',
      features: [
        'Polygon zona rendaman merah, oranye, dan kuning',
        'Deteksi infrastruktur vital pesisir yang terancam terendam',
        'Simulasi kedalaman air genangan (inundation depth) per blok',
      ],
      metric: 'Resolusi Topografi DEM Pantai: 30 Meter',
    },
    {
      id: '04',
      title: 'Rute Evakuasi & Sirene Peringatan Dini',
      subtitle: 'Golden Time Life-Safety Router',
      engine: 'Algoritma Golden Time Evakuasi',
      icon: ShieldAlert,
      gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      accentColor: '#818cf8',
      badgeClass: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
      description:
        'Menentukan jalur evakuasi mandiri tercepat menuju Tempat Evakuasi Sementara (TES), perbukitan aman berketinggian >20 mdpl, serta simulasi radius jangkauan sirene peringatan dini tsunami BMKG/BNPB.',
      features: [
        'Navigasi jalur tercepat menjauhi bibir pantai',
        'Penetapan zona aman vertikal kontur >20 meter di atas laut',
        'Hitung mundur waktu evakuasi kritis (Golden Time < 15 menit)',
      ],
      metric: 'Golden Time: 10 – 30 Menit Tanggap Darurat',
    },
  ];

  // Zona Megathrust Utama Indonesia
  const megathrustZones = [
    { name: 'Sunda Strait & Mentawai', risk: 'Mw 8.7 – 8.9', status: 'Seismic Gap' },
    { name: 'Selatan Jawa - Bali - Lombok', risk: 'Mw 8.8 – 9.0', status: 'High Threat' },
    { name: 'Sesar Palu-Koro & Teluk Tomini', risk: 'Strike-Slip Tsunami', status: 'Submarine Landslide' },
    { name: 'Utara Papua & Laut Maluku', risk: 'Mw 8.5+', status: 'Active Trench' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* ─── Oceanic Ambient Mesh Radial Glows ─── */}
      <div
        className="fixed top-0 left-1/4 -translate-x-1/2 w-[700px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-emerald-600/5 rounded-full blur-[200px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
            title="Kembali ke Peta Utama SiagaNusa"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-500/20 group-hover:scale-105 transition-transform">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  SiagaNusa
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  Tsunami Sim
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Pemodelan Bencana Kebaharian Indonesia
              </p>
            </div>
          </Link>

          {/* Back to Map Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all hover:text-white group"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Peta Karhutla</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20">
        {/* ─── HERO SECTION ─── */}
        <section className="text-center max-w-4xl mx-auto space-y-6 mb-12 sm:mb-16">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-sm shadow-cyan-500/10">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Litbang Mitigasi Bencana Bahari · Dalam Pengembangan</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-[11px] text-slate-400 font-mono">Q1 2027</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Simulator Penjalaran{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Gelombang Tsunami
            </span>{' '}
            Nusantara
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Platform simulasi hidrodinamika numerik interaktif pertama untuk memetakan penjalaran gelombang tsunami dari
            episentrum megathrust laut dalam, menghitung perkiraan waktu tiba di pantai (ETA), hingga proyeksi zona rendaman
            pesisir Indonesia secara presisi tinggi.
          </p>

          {/* Notify / Subscribe Pill Form */}
          <div className="pt-2 max-w-md mx-auto">
            {isSubscribed ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Terima kasih! Kami akan memberi tahu Anda saat versi Alpha dirilis.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda untuk akses awal..."
                    className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-800 bg-slate-900/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  <span>Ingatkan Saya</span>
                </button>
              </form>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              🔒 Notifikasi rilis gratis · Akses awal eksklusif untuk periset, relawan & instansi kebencanaan
            </p>
          </div>
        </section>

        {/* ─── BESPOKE VECTOR SVG ILLUSTRATION ─── */}
        <section className="mb-16 sm:mb-24">
          <TsunamiHeroIllustration />
        </section>

        {/* ─── 4 HORIZONTAL PILLAR CARDS (EXPERT UI/UX) ─── */}
        <section className="space-y-6 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                <Compass className="h-4 w-4" />
                <span>Pilar Arsitektur &amp; Algoritma</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                4 Kemampuan Inti Simulator Tsunami
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Dirancang memadukan model fisika gempa bawah laut dan data geospasial DEM pesisir resolusi tinggi.
            </p>
          </div>

          {/* 4 Cards Grid - 4 Kolom Horizontal di Layar Besar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {featureCards.map((card, idx) => {
              const IconComp = card.icon;
              const isHovered = activeCardIndex === idx;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setActiveCardIndex(idx)}
                  onMouseLeave={() => setActiveCardIndex(null)}
                  className={`group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1.5 backdrop-blur-sm overflow-hidden ${
                    isHovered ? 'bg-slate-900/90 ring-1 ring-cyan-500/30' : ''
                  }`}
                >
                  {/* Subtle Card Glow Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${card.gradient} opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none`}
                    aria-hidden="true"
                  />

                  {/* Top: Number & Engine Tag */}
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      {/* Step Number */}
                      <span className="text-2xl font-black font-mono tracking-tighter text-slate-500 group-hover:text-cyan-400 transition-colors">
                        {card.id}
                      </span>

                      {/* Engine Tag */}
                      <span
                        className={`text-[9.5px] font-bold font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border ${card.badgeClass}`}
                      >
                        {card.engine}
                      </span>
                    </div>

                    {/* Icon Halo */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 shadow-md group-hover:scale-110 transition-transform"
                        style={{ color: card.accentColor }}
                      >
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-mono text-slate-400 block uppercase">
                          {card.subtitle}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                          {card.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {card.description}
                    </p>

                    {/* Feature Bullets */}
                    <ul className="space-y-2 pt-2 border-t border-slate-800/60">
                      {card.features.map((item, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[11.5px] text-slate-300">
                          <span
                            className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: card.accentColor }}
                          />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom: Spec Metric Pill */}
                  <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/60">
                    <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-[10.5px] font-mono font-medium text-slate-300 truncate">
                        {card.metric}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── PRIORITAS ZONA SEISMIK NUSANTARA ─── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-md space-y-6 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
                <span>Zona Uji Coba Awal Simulasi Tsunami</span>
              </h3>
              <p className="text-xs text-slate-400">
                Patahan aktif dengan akumulasi regangan elastis (seismic gap) tertinggi di perairan Indonesia.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
              Data Geofisika BMKG &amp; PUSGEN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {megathrustZones.map((zone, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Cluster {idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-400">
                      {zone.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{zone.name}</h4>
                </div>
                <div className="text-xs font-mono text-cyan-400 mt-2 pt-2 border-t border-slate-800/60">
                  Potensi: {zone.risk}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CALL TO ACTION BANNER ─── */}
        <section className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-blue-950/60 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Siap Menghubungkan Pemantauan Kebakaran &amp; Bahari?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Platform SiagaNusa dibangun sebagai sentra observasi bencana alam Nusantara secara terpadu.
              Sembari menantikan Simulator Tsunami, pantau titik api kebakaran hutan secara real-time di peta interaktif kami.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Buka Peta Live Karhutla</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-[1400px] mx-auto px-4">
          <p>
            SiagaNusa Tsunami Simulator &copy; 2026 · Litbang Pemodelan Mitigasi Bencana Bahari Indonesia
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Didedikasikan untuk keselamatan jutaan warga pesisir Indonesia di sepanjang cincin api Pasifik &amp; zona
            megathrust.
          </p>
        </div>
      </footer>
    </div>
  );
}
