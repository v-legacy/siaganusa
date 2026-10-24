# Dokumentasi Arsitektur & Panduan Kode SiagaNusa (Karhutla Watch)

Dokumen ini disusun khusus untuk **Insinyur & Arsitek Sistem** sebagai panduan menyeluruh mengenai arsitektur, alur data (*data flow*), penjelasan fungsi dan baris kode krusial, hingga panduan modifikasi mandiri untuk pengembangan fitur di masa mendatang.

---

## 1. Peta Arsitektur Sistem (High-Level Architecture)

SiagaNusa dibangun menggunakan **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4 (Design Tokens Vanilla)** dengan integrasi peta spasial **Leaflet & OpenStreetMap**.

```mermaid
graph TD
    subgraph BrowserClient [Client Browser (Mobile & Desktop)]
        UI[KarhutlaWatchClient]
        Header[Header & Status Counter]
        Map[LeafletMapInner - Peta Spasial]
        Controls[MapFloatingControls - Action Pills]
        Table[DisasterTable & Selected Telemetry Panel]
        HookData[useDisasterData Hook]
        HookTheme[useTheme Hook]
    end

    subgraph ServerLayer [Next.js Route Handlers (Server-Side Proxy)]
        ApiHotspots["/api/hotspots (Cache In-Memory 5m)"]
        ApiWeather["/api/weather (Cache 10m)"]
        ApiRegional["/api/weather/regional (Cache 10m)"]
    end

    subgraph ExternalSources [Penyedia Data Eksternal]
        Kanari["API KANARI (kanari.io/api/events)<br/>Satelit VIIRS, GOES, MTG"]
        OpenMeteo["Open-Meteo Weather API<br/>Wind Speed, Direction & Temp"]
        OSM["Tile OpenStreetMap Resmi<br/>(Light Mode & CSS Inverted Dark Mode)"]
    end

    UI --> Header
    UI --> Controls
    UI --> Map
    UI --> Table
    UI --> HookData
    UI --> HookTheme

    HookData -->|Fetch Titik Api| ApiHotspots
    UI -->|Fetch Cuaca Titik Terpilih| ApiWeather
    UI -->|Fetch 14 Pola Angin Nasional| ApiRegional

    ApiHotspots -->|Filter Bounding Box Indonesia| Kanari
    ApiWeather -->|Real-Time Vector Angin| OpenMeteo
    ApiRegional -->|Batch Query 14 Titik| OpenMeteo
    Map -->|Render Raster Tiles| OSM
```

---

## 2. Struktur Direktori Proyek

```
siaganusa/
├── app/
│   ├── api/
│   │   ├── hotspots/route.ts        # Proxy & cache data hotspot satelit KANARI
│   │   └── weather/
│   │       ├── route.ts             # Proxy cuaca titik spesifik Open-Meteo
│   │       └── regional/route.ts    # Batch query cuaca 14 zona kepulauan Indonesia
│   ├── globals.css                  # Design system token, animasi angin, dark mode OSM
│   ├── layout.tsx                   # Root HTML, font Inter, preconnect OSM
│   └── page.tsx                     # Server Component utama & konfigurasi SEO / OpenGraph
├── components/
│   ├── KarhutlaWatchClient.tsx      # Orchestrator & state management sentral
│   ├── layout/
│   │   └── Header.tsx               # Brand, live badge status & toggle tema
│   ├── map/
│   │   ├── DisasterMap.tsx          # Dynamic import (ssr: false) pencegah error window
│   │   ├── LeafletMapInner.tsx      # Engine spasial Leaflet, marker cluster, animasi angin & bbox
│   │   └── MapFloatingControls.tsx  # Floating pills kontrol peta ala Google Maps
│   └── disaster/
│       └── DisasterTable.tsx        # Tabel interaktif, filter multi-kriteria, panel telemetri
├── constants/
│   └── seaWindTracks.ts             # Pola koridor lintasan angin laut maritim Indonesia
├── hooks/
│   ├── useDisasterData.ts           # Custom hook polling data titik api & pencegah race condition
│   └── useTheme.ts                  # Custom hook sinkronisasi tema (OS preference & localStorage)
├── types/
│   ├── disaster.ts                  # Tipe data TypeScript titik api & respons API
│   └── weather.ts                   # Tipe data TypeScript cuaca & arah angin
└── docs/
    ├── PRD-SRS-SIAGANUSA.md         # Dokumen PRD & SRS resmi
    ├── TROUBLESHOOTING.md           # Riwayat kendala teknis & solusinya
    └── DOKUMENTASI-KODE-DAN-ARSITEKTUR.md # (Dokumen ini)
```

---

## 3. End-to-End Data Flow

### A. Alur Pemuatan Titik Api (Hotspots Pipeline)
1. **Pemicu:** Pengguna membuka website atau interval 10 menit terlewati.
2. **Hook:** `useDisasterData()` di `hooks/useDisasterData.ts` memanggil `fetch('/api/hotspots')`.
3. **Route Handler:** `app/api/hotspots/route.ts`:
   - Memeriksa *in-memory cache* (`cachedData`). Jika usia data < 5 menit, langsung mengembalikan data cache (efisiensi jaringan & kepatuhan *fair-use*).
   - Jika cache kadaluarsa, server mengambil data dari `https://kanari.io/api/events?hours=24&full=1`.
   - Melakukan filter spasial teritori kepulauan Indonesia (`lat: -11 s/d 6.1`, `lng: 95 s/d 141`).
   - Melakukan penamaan wilayah cerdas via `resolveIndonesiaRegion()`.
   - Jika koneksi eksternal gagal, otomatis beralih ke `FALLBACK_MOCK` agar antarmuka tidak rusak.
   - Mengembalikan array `DisasterHotspot[]` beserta metadata statistik `HotspotSummary`.
4. **Distribusi State:** `KarhutlaWatchClient` menerima data dan menyebarkannya ke `Header` (ringkasan angka), `DisasterMap` (sebaran titik di peta), dan `DisasterTable` (daftar tabel terurut).

### B. Alur Integrasi Arah Angin & Cuaca (Weather & Wind Vector)
1. **Angin Regional (14 Zona Nasional):**
   - Saat aplikasi pertama kali dimuat, `KarhutlaWatchClient` memanggil `/api/weather/regional`.
   - `app/api/weather/regional/route.ts` melakukan *single batch request* ke Open-Meteo untuk 14 titik representatif Indonesia (Sumatera, Kalimantan, Jawa, Sulawesi, Maluku, Papua, Nusa Tenggara).
   - Data ini digunakan oleh peta untuk menampilkan indikator panah tiupan angin di setiap titik api tanpa harus melakukan ratusan request individual.
2. **Angin Spesifik Saat Titik Api Dipilih:**
   - Ketika pengguna mengklik salah satu titik api (di peta atau tabel), `selectedHotspot` diperbarui.
   - `useEffect` di `KarhutlaWatchClient` langsung memanggil `/api/weather?lat={lat}&lng={lng}`.
   - Peta merender garis vektor aliran angin animasi (`wind-flow-line-animated`) sepanjang 2.5 - 8.5 km (proporsional terhadap kecepatan angin).
   - Sudut tiup angin dihitung dengan rumus pembalikan arah tiup:
     $$\theta_{\text{rambatan}} = (\theta_{\text{asal}} + 180^\circ) \bmod 360^\circ$$

---

## 4. Bedah File & Baris Kode Krusial

### 1. `app/api/hotspots/route.ts`
* **Baris 17–20 (Cache In-Memory):**
  ```typescript
  let cachedData: HotspotsApiResponse | null = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 menit
  ```
  *Alasan Arsitektur:* Menghemat *bandwidth* dan mematuhi ketentuan *fair-use* Kanari.io. Server Next.js menyimpan hasil fetch terakhir di RAM sehingga ribuan pengguna simultan tidak membebani API eksternal.
* **Baris 22–27 (Filter Bounding Box Indonesia):**
  ```typescript
  const ID_BOUNDS = { minLng: 95.0, maxLng: 141.0, minLat: -11.0, maxLat: 6.1 };
  ```
  *Alasan:* Endpoint Kanari mengembalikan event global/regional. Filter ini memastikan data yang dikirim ke klien hanya titik api di dalam kedaulatan Indonesia.
* **Baris 131 (Sort By Intensity):**
  ```typescript
  indonesiaEvents.sort((a, b) => (b.maxFrp || 0) - (a.maxFrp || 0));
  ```
  *Alasan:* Titik api dengan daya pancar radiasi termal (*Fire Radiative Power*) tertinggi diprioritaskan di baris teratas tabel dan penyorotan peta.

---

### 2. `components/map/DisasterMap.tsx`
* **Baris 13–16 (Next.js Dynamic Import ssr: false):**
  ```typescript
  const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
    ssr: false,
    loading: () => <MapSkeleton />,
  });
  ```
  *Alasan Arsitektur:* **Sangat Krusial!** Leaflet secara internal mengakses objek browser `window` dan `document`. Jika diimpor secara biasa pada Next.js (yang me-render di Node.js server), aplikasi akan langsung mengalami *crash fatal* (`ReferenceError: window is not defined`). Opsi `ssr: false` menunda eksekusi hingga kode berada di browser klien.

---

### 3. `components/map/LeafletMapInner.tsx`
* **Baris 137–138 & 455 (Rumus Proyeksi Arah Tiup Angin):**
  ```typescript
  const blowTowardsDeg = (windDegree + 180) % 360;
  ```
  *Alasan Fisika & Geografis:* Standar meteorologi menyatakan arah angin berdasarkan **dari mana angin datang** (contoh: angin Timur Laut $45^\circ$ datang dari timur laut). Namun untuk kebakaran hutan, yang dibutuhkan oleh petugas dan masyarakat adalah **ke mana arah api dan asap tertiup**. Oleh karena itu, sudut harus diputar $180^\circ$ ($45^\circ + 180^\circ = 225^\circ$ / Barat Daya).
* **Baris 231–237 (Leaflet Invalidate Size Fix):**
  ```typescript
  setTimeout(() => { if (mounted && map) map.invalidateSize(); }, 150);
  setTimeout(() => { if (mounted && map) map.invalidateSize(); }, 600);
  ```
  *Alasan:* Pada peramban ponsel atau saat layout flexbox baru dihitung, Leaflet sering membaca tinggi kontainer `0px` sehingga peta abu-abu sebagian. Panggilan `invalidateSize()` memaksa Leaflet menghitung ulang ukuran kontainer yang sebenarnya.
* **Baris 304–320 (Marker Clustering):**
  ```typescript
  const clusterLayer = MCG({
    maxClusterRadius: 45,
    iconCreateFunction: (c) => { ... }
  });
  ```
  *Alasan:* Menampilkan ribuan titik api individual di layar ponsel akan menyebabkan *lag* rendering DOM. Clustering mengelompokkan titik berdekatan menjadi satu lingkaran angka saat zoom out, dan terurai otomatis saat pengguna melakukan zoom in.
* **Baris 414–431 (Visualisasi Bounding Box Kluster):**
  ```typescript
  if (hotspot.bbox && Array.isArray(hotspot.bbox) && hotspot.bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = hotspot.bbox;
    const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
    const bboxRect = L.rectangle(bounds, { ... });
    areaLayerRef.current.addLayer(bboxRect);
  }
  ```
  *Alasan:* Karhutla bukan sekadar 1 titik koordinat tunggal, melainkan hamparan lahan yang terbakar. Data `bbox` dari satelit digambar sebagai persegi merah putus-putus untuk menunjukkan dimensi luasan area kebakaran.
* **Baris 434–438 (Kalkulasi Radius Buffer Dampak Termal):**
  ```typescript
  const radiusMeters = Math.max(
    600,
    Math.min(4500, (hotspot.count || 1) * 400 + (hotspot.maxFrp ? Math.sqrt(hotspot.maxFrp) * 25 : 0))
  );
  ```
  *Alasan:* Rumus empiris dinamis yang memperbesar lingkaran dampak radiasi panas berdasarkan akumulasi titik sensor dan intensitas MegaWatt (FRP).

---

### 4. `components/KarhutlaWatchClient.tsx`
* **Baris 90–105 (Sinkronisasi Dua Arah & Mobile Scroll):**
  ```typescript
  const handleHotspotClick = useCallback((hotspot: DisasterHotspot) => {
    setSelectedHotspot(hotspot);
    if (window.innerWidth < 768) {
      document.getElementById('disaster-table-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);
  ```
  *Alasan UX Mobile:* Pada layar smartphone yang terbatas, setelah pengguna menyentuh titik api di peta, antarmuka otomatis menggulir (*smooth scroll*) ke panel rincian telemetri lengkap di bawah peta.

---

### 5. `hooks/useTheme.ts` & `app/globals.css`
* **Penerapan Dark Mode Peta Tanpa Tile Berbayar:**
  Di `hooks/useTheme.ts`, tema mengubah atribut `data-theme` di tag `<html>`.
  Di `app/globals.css`:
  ```css
  [data-theme="dark"] .leaflet-tile-pane {
    filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%);
  }
  ```
  *Alasan Arsitektur:* Penyedia tile dark mode pihak ketiga (seperti Mapbox atau CARTO) membutuhkan biaya langganan dan API key. Dengan filter CSS inversi warna pada layer tile OSM, kita mendapatkan peta mode gelap gratis selamanya tanpa merusak warna marker api merah/oranye/kuning karena marker berada di pane terpisah (`.leaflet-marker-pane`).

---

## 5. Panduan Modifikasi & Kustomisasi Mandiri

Berikut panduan langkah demi langkah jika Anda ingin mengubah atau menambahkan sesuatu sendiri:

### 1. Ingin Mengubah Interval Auto-Refresh Data Titik Api
* **Lokasi File:** [`hooks/useDisasterData.ts`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/hooks/useDisasterData.ts#L17)
* **Baris Kode:**
  ```typescript
  const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // Ubah nilai milidetik ini (misal 5 * 60 * 1000 untuk 5 menit)
  ```
* **Catatan:** Jangan lupa sesuaikan juga nilai `CACHE_DURATION_MS` di [`app/api/hotspots/route.ts`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/app/api/hotspots/route.ts#L19).

---

### 2. Ingin Mengubah Warna atau Ambang Batas Titik Api (Confidence Level)
* **Lokasi File:** [`components/map/LeafletMapInner.tsx`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/components/map/LeafletMapInner.tsx#L43-L47)
* **Baris Kode:**
  ```typescript
  const CONFIDENCE_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
    HIGH:   { fill: '#EF4444', stroke: '#B91C1C', label: 'Tinggi' },
    MEDIUM: { fill: '#F97316', stroke: '#C2410C', label: 'Sedang' },
    LOW:    { fill: '#EAB308', stroke: '#A16207', label: 'Rendah' },
  };
  ```
  Anda bisa mengubah kode warna HEX atau label teks sesuai kebutuhan.

---

### 3. Ingin Mengubah Titik Fokus & Batas Default Peta Indonesia
* **Lokasi File:** [`components/map/LeafletMapInner.tsx`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/components/map/LeafletMapInner.tsx#L22-L26)
* **Baris Kode:**
  ```typescript
  const INDONESIA_CENTER: [number, number] = [-2.5, 118.0]; // [Latitude, Longitude] pusat peta
  const INDONESIA_DEFAULT_ZOOM = 5; // Zoom awal (5 mencakup seluruh Nusantara)
  const INDONESIA_MIN_ZOOM = 4;     // Batas zoom out maksimum
  const INDONESIA_MAX_ZOOM = 18;    // Batas zoom in maksimum (tingkat jalan/desa)
  ```

---

### 4. Ingin Menambahkan Titik Jalur Angin Laut Maritim Baru
* **Lokasi File:** [`constants/seaWindTracks.ts`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/constants/seaWindTracks.ts)
* Cukup tambahkan objek baru ke array `INDONESIA_SEA_WIND_TRACKS`:
  ```typescript
  {
    id: 'sea-selat-sunda',
    name: 'Selat Sunda',
    seaRegion: 'Banten - Lampung',
    coordinates: [
      [-5.8, 105.8],
      [-6.0, 105.9],
      [-6.2, 106.0]
    ],
    defaultSpeedKmh: 18.0,
    defaultDegree: 135,
    defaultCardinal: 'SE',
  }
  ```

---

### 5. Ingin Mengembangkan Modul Bencana Baru (Misal: Gempa Bumi BMKG)
Arsitektur SiagaNusa didesain sangat modular (*open-closed principle*). Untuk menambahkan modul baru:
1. **Buat Type Definition:** Tambahkan antarmuka data di `types/earthquake.ts` (misal `magnitude`, `depth`, `potentialTsunami`).
2. **Buat API Route Handler:** Tambahkan `app/api/earthquake/route.ts` yang mengambil data dari endpoint BMKG (`https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json`).
3. **Buat Custom Hook:** Buat `hooks/useEarthquakeData.ts` meniru pola `useDisasterData.ts`.
4. **Buat Layer Peta:** Di dalam `LeafletMapInner.tsx`, tambahkan layer group baru `earthquakeLayerRef` dengan ikon gelombang seismik.
5. **Navigasi Tab:** Di `Header.tsx`, tambahkan tab navigasi antara `Karhutla Watch` dan `Gempa Watch`.

---

## 6. Ringkasan Checklist Maintenance

| Komponen | Hal yang Harus Diperhatikan | Rekomendasi Solusi |
| :--- | :--- | :--- |
| **Peta Spasial (Leaflet)** | Jangan pernah mengimpor `leaflet` secara langsung di komponen Server SSR. | Selalu gunakan pembungkus `dynamic(() => import(...), { ssr: false })`. |
| **API Eksternal** | Perubahan format API Kanari atau Open-Meteo. | Selalu sediakan fallback mock di route handler agar UI tidak blank jika API eksternal down. |
| **Styling & Theme** | Mengubah warna atau tema gelap. | Modifikasi variabel CSS di `:root` dan `[data-theme="dark"]` pada `app/globals.css`. |
| **Performa Klien** | Beban rendering titik api di ponsel spek rendah. | Pertahankan penggunaan `leaflet.markercluster` dan batasi rendering sampling panah angin via grid density. |

---

## 7. Tuning UX Mobile & Proteksi Anti-Double Action (Floating Map Controls)

Tombol aksi mengambang pada peta ([`components/map/MapFloatingControls.tsx`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/components/map/MapFloatingControls.tsx)) dioptimalkan khusus untuk kenyamanan pengguna perangkat bergerak (*mobile-first*):

1. **Ukuran Target Sentuh Standar Apple/Google (46px Mobile / 44px Desktop):**
   - Menghindari kesalahan tekan (*fat-finger error*) dengan `touch-action: manipulation;` untuk menghapus *delay* 300ms ketukan layar pada peramban mobile.
2. **Proteksi Anti-Double Action (Debounce Guard 400ms):**
   - Menggunakan `lastActionRef` untuk memblokir ketukan cepat berturut-turut yang tidak disengaja sehingga tidak terjadi pergantian status (*toggle flickering*) atau permintaan ganda.
3. **Umpan Balik Taktil & Fisik (Physical Press + Haptic Vibration):**
   - Efek tekan spring-scale `transform: scale(0.88)` pada status `:active` dan gelombang denyut riak konsentris (`.floating-btn-ripple`).
   - Memicu getaran haptik lembut pada ponsel via `navigator.vibrate(15)` jika didukung perangkat.
4. **Indikator Status Jelas (Micro-Badge ON / OFF):**
   - Setiap tombol toggle memiliki lencana status visual eksplisit: `ON` (warna biru/cyan bercahaya) dan `OFF` (warna abu-abu netral) di sudut tombol.
5. **Animasi Ikon Mikro (*Micro-Motion Animation*):**
   - Tombol Angin Darat: Animasi hembusan angin dinamis (`icon-gusting-wind`).
   - Tombol Angin Laut: Animasi gelombang laut mengalun (`icon-swelling-wave`).
   - Tombol Reset: Jarum kompas berputar 360 derajat (`icon-spinning-compass`).
6. **Toast Pill Konfirmasi Seketika (*Instant Floating Toast*):**
   - Pil notifikasi melayang yang muncul seketika selama 1.8 detik memberikan konfirmasi teks jelas (contoh: `💨 Angin Darat: AKTIF`, `🌊 Angin Laut: AKTIF`, `🧭 Posisi Peta Direset`), menyingkirkan keraguan pengguna apakah tombol berhasil ditekan atau tidak.

---

## 8. Logika Strategi Pemadaman: Kluster Satelit vs Garis Sekat Basah (Soil Wetting Boundary)

Modul ini dikembangkan khusus agar **masyarakat awam** maupun **petugas lapangan (Manggala Agni / BPBD / Relawan)** dapat dengan cepat membedakan area yang sedang terbakar dengan area di mana intervensi pencegahan harus dilakukan:

```
[ Pusat Titik Api 🔥 ] ─── (Radius Panas ~1.2 km) ───► [ Sektor Hembusan Angin 💨 ] ───► [ 🛡️ Pita Sekat Basah ~2.8 km 💧 ]
      (Lahan Terbakar)                                (Jalur Rambatan Asap)                 (Zona Pembasahan Tanah)
```

### 1. Perbedaan Mendasar Ketiga Lapisan Spasial

| Lapisan Spasial | Representasi Visual | Makna Fisik & Kebencanaan | Fungsi Bagi Pengguna |
| :--- | :--- | :--- | :--- |
| **Jejak Lahan Terbakar (Satelit)** (`hotspot.bbox`) | Kotak merah putus-putus (`#B91C1C`, isi jingga arang) | Jejak fisik anomali termal sensor satelit NASA/VIIRS yang merekam batas hamparan lahan yang **sudah & sedang terbakar**. | Mengetahui luas cakupan kobaran api saat ini. **Bukan batas pemadaman!** |
| **Radius Bahaya Panas & Asap** (`bufferCircle`) | Lingkaran halo oranye/merah transparan | Zona bahaya langsung akibat radiasi panas tinggi (*Fire Radiative Power*) dan gas beracun/asap pekat di sekitar api. | Batas **larangan mendekat** bagi warga sipil dan zona bahaya kru pemadam. |
| **Batas Sekat Basah Taktis** (`wettingPolygon` & `wettingLine`) | Busur pita hijau zamrud (`#059669`) dengan garis pendar & lencana meter | Rekomendasi area pemotongan bahan bakar dan **pelembapan tanah (*soil wetting / fuel break*)** sebelum lidah api tiba. | **Panduan aksi intervensi** petugas lapangan & helikopter *water bombing*. |

---

### 2. Formulasi Matematis Jarak Taktis Pembasahan Lahan

Perhitungan posisi garis sekat basah dibuat adaptif mengikuti kondisi cuaca riil (*Open-Meteo*) dan intensitas daya api (*FRP*):

1. **Radius Bahaya Termal ($R_{\text{termal}}$):**
   $$R_{\text{termal}} = \max\left(0.6, \, \min\left(4.5, \, \frac{\text{count} \times 400 + \sqrt{\text{FRP}} \times 25}{1000}\right)\right) \quad (\text{km})$$

2. **Offset Kecepatan Angin Taktis ($\Delta_{\text{angin}}$):**
   Semakin kencang tiupan angin, semakin jauh tim pemadam harus membuat batas pembasahan agar memiliki waktu reaksi yang cukup:
   $$\Delta_{\text{angin}} = \max\left(0.8, \, \min\left(3.5, \, \frac{V_{\text{angin}}}{10} \times 1.5\right)\right) \quad (\text{km})$$

3. **Jarak Rekomendasi Sekat Basah ($D_{\text{sekat}}$):**
   $$D_{\text{sekat}} = \max\left(1.5, \, \min\left(6.5, \, R_{\text{termal}} + \Delta_{\text{angin}}\right)\right) \quad (\text{km})$$

4. **Busur Sudut Pertahanan ($\Theta_{\text{sekat}}$):**
   Dihitung membentuk busur $100^\circ$ di depan kepala api menghadap arah rambatan:
   $$\Theta_{\text{sekat}} = [\theta_{\text{rambatan}} - 50^\circ, \; \theta_{\text{rambatan}} + 50^\circ]$$
   dengan lebar koridor pembasahan tanah sedalam **$350\text{ meter}$**.

---

### 3. Panduan Tindakan Lapangan

#### 🚒 Bagi Petugas Lapangan (Manggala Agni / BPBD / Satgas Karhutla):
* **Fokuskan Pembasahan di Garis Hijau:** Jangan hanya menyemprot api di ekor (yang sudah jadi abu). Semprotkan air di garis sekat basah pada jarak $\sim D_{\text{sekat}}\text{ km}$ di depan kepala api untuk melembapkan vegetasi kering sebelum bara api tertiup.
* **Injeksi Gambut (*Peat Soaking*):** Gunakan *nozzle* tancap untuk membasahi lapisan pirit dan pori gambut bawah permukaan agar api gambut (*ground fire*) tidak menjalar di bawah tanah.
* **Prioritas Sasaran Heli *Water Bombing*:** Arahkan sortie helikopter untuk menjatuhkan bom air tepat di koridor pita hijau peta.

#### 👥 Bagi Masyarakat Awam & Warga Sekitar:
* **Pahami Zona Bahaya:** Jangan memasuki area dalam radius panas $\sim R_{\text{termal}}\text{ km}$.
* **Kesiapsiagaan Sektor Tiupan:** Warga yang berada di sektor searah hembusan angin disarankan mengenakan masker standar N95 karena paparan asap partikulat PM2.5.
* **Proteksi Lingkungan Rumah:** Basahi pekarangan, tumpukan semak kering, dan talang atap rumah secara mandiri menggunakan pompa air sebelum jarak api mendekat.

---

## 9. Fitur SitRep Lapangan (Situation Report WhatsApp Generator)

Modul generator laporan situasi lapangan ([`components/disaster/DisasterTable.tsx`](file:///Users/rezkypahlepy/project/nextjs/siaganusa/components/disaster/DisasterTable.tsx)) berfungsi mengonversi seluruh data spasial, telemetri cuaca, dan rekomendasi sekat basah menjadi pesan teks terstruktur siap kirim:

1. **Aksi Sekali Tekan (*One-Click Action*):**
   - **Salin Laporan WA:** Menyalin pesan teks markdown WhatsApp ke clipboard dan memicu getaran haptik (`navigator.vibrate(25)`).
   - **Kirim ke WA:** Membuka *deep-link* `https://api.whatsapp.com/send?text=...` sehingga pengguna langsung diarahkan memilih grup WhatsApp target di ponsel atau desktop.
   - **Pratinjau (*Preview Drawer*):** Membuka kotak *monospace* yang menampilkan persis format laporan yang akan terkirim.
2. **Kandungan Informasi SitRep Baku:**
   - Header darurat resmi SiagaNusa.
   - Lokasi geografis, nama wilayah, dan koordinat GPS presisi 5 desimal.
   - Waktu deteksi WIB dan rincian sensor satelit.
   - Daya radiasi termal (*FRP* MegaWatt) dan kategori keparahan.
   - Radius bahaya paparan termal & asap pekat.
   - Kondisi angin dan prakiraan cuaca lokal terkini (*Open-Meteo*).
   - Jarak taktis sekat basah & sektor target pemotongan bahan bakar.
   - Tautan langsung ke Google Maps untuk navigasi armada lapangan.


