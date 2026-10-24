'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Lock,
  User,
  ArrowRight,
  ShieldAlert,
  Loader2,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMsg(data.message || 'Username atau password salah!');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      {/* Background Decorative Ambient Radial Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Main Card */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden transition-all">
          {/* Top Flame Gradient Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500" />

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header: Logo, Title & Subtitle */}
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Flame Logo with Ring Halo */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 shadow-lg shadow-red-500/25 ring-4 ring-red-500/10">
                <Flame className="h-7 w-7 text-white" />
              </div>

              {/* Title & Tag */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold tracking-wider uppercase mb-1">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Admin Console</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Masuk ke Dashboard
                </h1>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Pantau analitik trafik, referral sosial media, dan lokasi pengunjung SiagaNusa
                </p>
              </div>
            </div>

            {/* Error Notification Alert */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 block">
                  Username
                </label>
                <div className="group flex items-center h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 gap-3 transition-all hover:border-slate-700 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:bg-slate-950">
                  <User className="h-4 w-4 text-slate-400 shrink-0 transition-colors group-focus-within:text-red-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
                <div className="group flex items-center h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 gap-3 transition-all hover:border-slate-700 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:bg-slate-950">
                  <Lock className="h-4 w-4 text-slate-400 shrink-0 transition-colors group-focus-within:text-red-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1 shrink-0 rounded-md hover:bg-slate-800/60 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:via-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-red-600/40 active:scale-[0.99] cursor-pointer mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Map Link */}
            <div className="pt-2 text-center border-t border-slate-800/60">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors group"
              >
                <MapPin className="h-3.5 w-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                <span>Kembali ke Peta Karhutla SiagaNusa</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
