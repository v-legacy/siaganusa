/**
 * @file components/tsunami/TsunamiHeroIllustration.tsx
 * @description Ilustrasi SVG interaktif dan presisi tinggi tentang hidrodinamika rambatan gelombang tsunami:
 * Dari patahan lempeng megathrust bawah laut, penjalaran di palung laut dalam, fenomena pendangkalan (shoaling),
 * hingga inundasi pesisir dan rute evakuasi ketinggian.
 */

'use client';

export default function TsunamiHeroIllustration() {
  return (
    <div className="relative w-full max-w-[960px] mx-auto select-none group">
      {/* Ambient background glow behind SVG */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-blue-600/15 to-emerald-500/10 rounded-3xl blur-3xl -z-10 pointer-events-none transform -translate-y-2 scale-95"
        aria-hidden="true"
      />

      {/* SVG Container with subtle glass border */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-cyan-500/25 bg-slate-950/80 p-2 sm:p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl overflow-hidden">
        <svg
          viewBox="0 0 920 480"
          className="w-full h-auto rounded-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Ilustrasi Diagram Fisika Simulasi Gelombang Tsunami Megathrust"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#040b17" />
              <stop offset="55%" stopColor="#0a1931" />
              <stop offset="100%" stopColor="#0e294b" />
            </linearGradient>

            <linearGradient id="deepOceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#0369a1" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#082f49" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#020e1f" />
            </linearGradient>

            <linearGradient id="seabedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            <linearGradient id="coastGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="40%" stopColor="#15803d" />
              <stop offset="85%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>

            <linearGradient id="waveCrestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.85" />
              <stop offset="92%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <linearGradient id="shoalGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
            </linearGradient>

            <radialGradient id="epicenterPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Glowing filter */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ─── 1. SKY / ATMOSPHERE ─── */}
          <rect width="920" height="280" fill="url(#skyGrad)" />

          {/* Grid lines (High-tech coordinate aesthetic) */}
          <g opacity="0.12" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 6">
            <line x1="80" y1="20" x2="80" y2="280" />
            <line x1="200" y1="20" x2="200" y2="280" />
            <line x1="340" y1="20" x2="340" y2="280" />
            <line x1="500" y1="20" x2="500" y2="280" />
            <line x1="660" y1="20" x2="660" y2="280" />
            <line x1="800" y1="20" x2="800" y2="280" />
            <line x1="0" y1="80" x2="920" y2="80" />
            <line x1="0" y1="160" x2="920" y2="160" />
            <line x1="0" y1="240" x2="920" y2="240" />
          </g>

          {/* ─── 2. SEABED & CONTINENTAL SHELF BATIMETRI ─── */}
          {/* Dasar laut palung dalam (-5000m) di kiri, lereng benua naik ke kanan (+35m daratan) */}
          <path
            d="M 0,390
               C 120,390 180,380 260,370
               C 340,360 410,330 490,290
               C 560,255 610,230 670,225
               C 720,220 740,215 780,205
               C 810,195 840,165 920,150
               L 920,480 L 0,480 Z"
            fill="url(#seabedGrad)"
          />

          {/* Geological strata layers on seabed */}
          <path
            d="M 0,425 C 160,425 280,410 420,370 C 530,340 640,300 760,280 L 920,270 L 920,480 L 0,480 Z"
            fill="#0f172a"
            opacity="0.65"
          />
          <path
            d="M 0,455 C 200,455 380,440 550,395 C 680,360 810,330 920,320 L 920,480 L 0,480 Z"
            fill="#020617"
            opacity="0.8"
          />

          {/* Fault line (Sesar Patahan Megathrust) */}
          <g>
            <path
              d="M 120,480 L 155,385 L 175,340"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              filter="url(#redGlow)"
            />
            {/* Tectonic plate slip displacement arrows */}
            <path d="M 145,430 L 140,405 L 132,412" stroke="#f87171" strokeWidth="2.5" fill="none" />
            <path d="M 172,390 L 180,415 L 188,408" stroke="#f87171" strokeWidth="2.5" fill="none" />
          </g>

          {/* ─── 3. WATER COLUMN & TSUNAMI SHOALING WAVE ─── */}
          {/* Permukaan laut normal di kiri (kedalaman 5000m), lalu meninggi tajam membentuk dinding tsunami mendekati pantai */}
          <path
            d="M 0,260
               C 80,260 130,250 160,240
               C 190,230 220,260 260,260
               C 320,260 370,248 420,235
               C 470,222 520,205 570,185
               C 620,165 670,135 710,105
               C 725,95 738,90 748,96
               C 758,102 764,130 770,160
               C 776,190 790,205 810,205
               C 830,205 860,195 880,185
               L 920,185
               L 920,480
               L 0,480 Z"
            fill="url(#deepOceanGrad)"
          />

          {/* Wave shoaling crest highlights & foam (Dinding Puncak Gelombang Run-Up) */}
          <path
            d="M 0,260
               C 80,260 130,250 160,240
               C 190,230 220,260 260,260
               C 320,260 370,248 420,235
               C 470,222 520,205 570,185
               C 620,165 670,135 710,105
               C 725,95 738,90 748,96
               C 758,102 764,130 770,160
               C 776,190 790,205 810,205
               L 830,205"
            stroke="url(#waveCrestGrad)"
            strokeWidth="4"
            fill="none"
            filter="url(#cyanGlow)"
          />

          {/* Internal hydrodynamic wave kinetic velocity lines */}
          <g opacity="0.35" stroke="#38bdf8" strokeWidth="1.2">
            <path d="M 120,310 C 220,310 320,295 440,260 C 540,230 630,190 700,140" strokeDasharray="4 6" />
            <path d="M 80,345 C 200,345 320,330 460,290 C 560,255 640,220 720,175" strokeDasharray="5 7" />
          </g>

          {/* ─── 4. COASTAL LAND & TOPOGRAPHY (Dike / Daratan Pesisir) ─── */}
          <path
            d="M 780,205
               C 810,195 830,175 850,165
               C 870,155 890,145 920,135
               L 920,220
               L 780,220 Z"
            fill="url(#coastGrad)"
          />

          {/* Coastal Trees / Palms & Vegetation Silhouettes */}
          <g fill="#14532d" opacity="0.9">
            {/* Tree 1 */}
            <circle cx="835" cy="162" r="7" />
            <rect x="834" y="166" width="2" height="8" fill="#78350f" />
            {/* Tree 2 */}
            <circle cx="850" cy="155" r="8" />
            <rect x="849" y="160" width="2.5" height="10" fill="#78350f" />
            {/* Tree 3 */}
            <circle cx="865" cy="148" r="6.5" />
            <rect x="864" y="152" width="2" height="8" fill="#78350f" />
          </g>

          {/* Vertical Evacuation Tower (TES - Tempat Evakuasi Sementara) */}
          <g>
            <rect x="888" y="105" width="16" height="30" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="888" y1="115" x2="904" y2="115" stroke="#38bdf8" strokeWidth="1" />
            <line x1="888" y1="125" x2="904" y2="125" stroke="#38bdf8" strokeWidth="1" />
            {/* Siren Beacon on Tower Top */}
            <circle cx="896" cy="100" r="4.5" fill="#22c55e" filter="url(#cyanGlow)" />
            <circle cx="896" cy="100" r="1.5" fill="#ffffff" />
          </g>

          {/* Inundation hazard water wash on shore (Air merendam pantai) */}
          <path
            d="M 780,205 C 800,200 820,185 845,180 L 845,190 C 820,195 800,210 780,210 Z"
            fill="#06b6d4"
            opacity="0.75"
          />

          {/* ─── 5. SUB-SEA EPICENTER RUPTURE GRAPHICS (Pusat Gempa) ─── */}
          <g transform="translate(160, 360)">
            {/* Radiating shockwaves */}
            <circle cx="0" cy="0" r="45" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.3" strokeDasharray="3 3">
              <animate attributeName="r" values="20;55;75" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="30" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.6">
              <animate attributeName="r" values="10;35;50" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.4;0" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Core Epicenter Dot */}
            <circle cx="0" cy="0" r="14" fill="url(#epicenterPulse)" />
            <circle cx="0" cy="0" r="7" fill="#ef4444" filter="url(#redGlow)" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </g>

          {/* ─── 6. DART BUOY TSUNAMI TELEMETRY (Pelampung Sensor Laut Dalam) ─── */}
          <g transform="translate(320, 255)">
            {/* Buoy cable to seabed */}
            <line x1="0" y1="5" x2="0" y2="100" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
            {/* Buoy body */}
            <path d="M -8,5 L 8,5 L 5,0 L -5,0 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <circle cx="0" cy="-3" r="3.5" fill="#ef4444" />
            <line x1="0" y1="-3" x2="0" y2="-9" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Radio transmission waves */}
            <path d="M -5,-12 A 6 6 0 0 1 5,-12" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.8" />
            <path d="M -9,-15 A 10 10 0 0 1 9,-15" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.5" />
          </g>

          {/* ─── 7. HUD CALLOUT BADGES & PARAMETERS (Aesthetic Info Tags) ─── */}
          {/* Badge 1: Epicenter Subduction */}
          <g transform="translate(45, 145)">
            <rect x="0" y="0" width="175" height="52" rx="10" fill="#090d16" fillOpacity="0.88" stroke="#ef4444" strokeWidth="1.2" />
            <circle cx="16" cy="18" r="4.5" fill="#ef4444" />
            <text x="27" y="21" fill="#fca5a5" fontSize="10" fontWeight="700" letterSpacing="0.6">EPISENTRUM MEGATHRUST</text>
            <text x="14" y="38" fill="#ffffff" fontSize="11" fontWeight="800">Skala Mw 8.8 · Patahan 18 km</text>
            {/* Pointer line */}
            <path d="M 115,52 L 150,90 L 155,200" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" fill="none" />
          </g>

          {/* Badge 2: Open Ocean Wave Velocity */}
          <g transform="translate(340, 50)">
            <rect x="0" y="0" width="195" height="52" rx="10" fill="#090d16" fillOpacity="0.88" stroke="#38bdf8" strokeWidth="1.2" />
            <circle cx="16" cy="18" r="4.5" fill="#38bdf8" />
            <text x="27" y="21" fill="#7dd3fc" fontSize="10" fontWeight="700" letterSpacing="0.6">RAMBATAN LAUT DALAM</text>
            <text x="14" y="38" fill="#ffffff" fontSize="11" fontWeight="800">v = √(g·h) ≈ 790 km/jam</text>
            {/* Pointer line */}
            <path d="M 97,52 L 97,90 L 320,240" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" fill="none" />
          </g>

          {/* Badge 3: Coastal Shoaling Crest & Inundation */}
          <g transform="translate(620, 28)">
            <rect x="0" y="0" width="200" height="52" rx="10" fill="#090d16" fillOpacity="0.88" stroke="#06b6d4" strokeWidth="1.2" />
            <circle cx="16" cy="18" r="4.5" fill="#06b6d4" />
            <text x="27" y="21" fill="#67e8f9" fontSize="10" fontWeight="700" letterSpacing="0.6">PENDANGKALAN (SHOALING)</text>
            <text x="14" y="38" fill="#ffffff" fontSize="11" fontWeight="800">Tinggi Run-Up Pantai: 11.2 m</text>
            {/* Pointer line */}
            <path d="M 100,52 L 100,80 L 730,95" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" fill="none" />
          </g>

          {/* Badge 4: Evacuation Safe Zone Elevation */}
          <g transform="translate(735, 390)">
            <rect x="0" y="0" width="170" height="48" rx="8" fill="#090d16" fillOpacity="0.92" stroke="#22c55e" strokeWidth="1.2" />
            <circle cx="14" cy="16" r="4" fill="#22c55e" />
            <text x="24" y="19" fill="#86efac" fontSize="9.5" fontWeight="700" letterSpacing="0.5">ZONA AMAN EVAKUASI</text>
            <text x="12" y="36" fill="#ffffff" fontSize="10.5" fontWeight="800">Ketinggian &gt; 20 mdpl (TES)</text>
          </g>

          {/* Directional flow wave arrows */}
          <g stroke="#67e8f9" strokeWidth="2" opacity="0.85" fill="none">
            <path d="M 270,225 L 310,225 M 302,219 L 310,225 L 302,231" />
            <path d="M 460,205 L 500,205 M 492,199 L 500,205 L 492,211" />
            <path d="M 640,165 L 680,165 M 672,159 L 680,165 L 672,171" />
          </g>
        </svg>

        {/* Live Status Watermark Pill */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
            3D Wave Hydrodynamics Model
          </span>
        </div>
      </div>
    </div>
  );
}
