# Product Requirement Document (PRD) & Software Requirements Specification (SRS)
## Proyek: SiagaNusa (Platform Pemantauan Bencana Real-Time Indonesia)
**Fokus Rilis Perdana (Phase 1 / MVP): Modul Pemantauan Kebakaran Hutan & Lahan (Karhutla Watch)**

---

### Metadata Dokumen
- **Nama Proyek:** SiagaNusa (Siaga Bencana Nusantara)
- **Versi Dokumen:** v1.0.0
- **Status:** Proposed / Draft Initial
- **Target Platform:** Web (Mobile-First Web Application / PWA-Ready)
- **Teknologi Utama:** Next.js (App Router), TypeScript, Tailwind CSS v4, Leaflet.js / OpenStreetMap, Open-Meteo API, Kanari API

---

## 1. Executive Summary & Visi Produk

### 1.1 Latar Belakang & Masalah
Indonesia merupakan negara kepulauan yang rentan terhadap bencana geologis dan hidrometeorologis (gempa bumi, banjir, letusan gunung berapi, dan kebakaran hutan/lahan). Saat ini, ancaman kebakaran hutan dan lahan (Karhutla) serta sebaran kabut asap menjadi isu krusial yang berdampak langsung pada kesehatan publik, transportasi udara, dan kelestarian ekosistem.

Mayoritas masyarakat mengakses informasi bencana melalui tautan di media sosial atau grup chat via ponsel cerdas (smartphone). Namun, aplikasi atau portal informasi bencana yang ada saat ini seringkali:
1. Kurang ramah pengguna ponsel (*desktop-oriented*, tombol kecil, navigasi rumit).
2. Menampilkan data peta yang berat dan lambat dimuat.
3. Memisahkan data titik api dengan data pendukung penting (arah angin dan cuaca yang menentukan arah sebaran asap).
4. Tidak memiliki antarmuka yang modern, elegan, dan minim opsi mode gelap (*dark mode*) yang nyaman di mata.

### 1.2 Visi & Solusi Produk
**SiagaNusa** hadir sebagai portal informasi bencana terpadu Indonesia yang dibangun dengan filosofi **Mobile-First**, performa tinggi, dan antarmuka elegan (*clean & modern*). 

Pada **Fase 1 (MVP)**, SiagaNusa berfokus penuh pada **Pemantauan Titik Kebakaran (Karhutla Watch)** secara *real-time* di seluruh Indonesia, dilengkapi:
- Pemetaan titik panas (*hotspot*) interaktif berbasis OpenStreetMap & Leaflet.
- Floating controls ala Google Maps untuk melihat arah angin dan prakiraan cuaca dari Open-Meteo.
- Interaksi cerdas: *Hover tooltip* (pada desktop) dan *Tap preview* (pada mobile), serta *Detail Table View* di bawah peta.
- Dukungan otomatis Light Mode / Dark Mode sesuai preferensi perangkat sistem.
- Integrasi donasi sukarela pengembang (*Saweria Barcode & Link*).
- Arsitektur kode modular, *maintainable*, dan teruji untuk memudahkan ekspansi bencana berikutnya (gempa BMKG, banjir, gunung berapi).

---

## 2. Arsitektur Sistem & Integrasi Data

```mermaid
graph TD
    UserMobile[Pengguna Mobile / Desktop Browser] -->|Akses Web App| NextClient[Next.js Client Components (React 19)]
    
    subgraph UI & State Layer
        NextClient --> ThemeProvider[Theme Provider (Auto Dark/Light)]
        NextClient --> MapModule[Leaflet Interactive Map (OSM)]
        NextClient --> FloatingControls[Floating Weather/Wind Controls]
        NextClient --> DetailTable[Collapsible Bottom Table Card]
        NextClient --> SaweriaModal[Saweria Donation Modal]
    end

    subgraph Server & Proxy API Layer (Next.js Route Handlers)
        MapModule -->|Fetch Hotspots| ApiHotspots[/api/hotspots/]
        FloatingControls -->|Fetch Wind/Weather| ApiWeather[/api/weather/]
    end

    subgraph External Services & Data Sources
        ApiHotspots -->|Real-time Hotspot GeoJSON/REST| KanariAPI[API KANARI / SIPONGI BMKG]
        ApiWeather -->|Wind Vector, Speed, Temp| OpenMeteoAPI[Open-Meteo Weather API]
        SaweriaModal -->|QRIS / Direct Link| SaweriaPlatform[Saweria Payment Gateway]
    end
```

---

## 3. Spesifikasi Kebutuhan Fungsional (SRS - Functional Requirements)

### Modul 1: Peta Interaktif Nusantara (Leaflet & OpenStreetMap)
| ID | Kebutuhan Fungsional | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-MAP-01** | Bounding Box Indonesia | Peta secara otomatis di-center pada wilayah kepulauan Indonesia (Lat: `-0.7893`, Lng: `113.9213`, Zoom Level 5). Batas pan dibatasi agar pengguna tidak tersesat ke luar wilayah Indonesia. | P0 (Must Have) |
| **FR-MAP-02** | Tile Layer Adaptif | Menggunakan tile OpenStreetMap dengan skema visual yang berganti otomatis saat beralih antara Mode Terang (Carto Positron / OSM Standar) dan Mode Gelap (Carto Dark Matter). | P0 (Must Have) |
| **FR-MAP-03** | Marker Clustering & Heatmap Ready | Titik api dikelompokkan (*cluster*) menggunakan Leaflet.markercluster saat zoom out agar antarmuka tidak *lag* di ponsel, dan terurai menjadi pin individual saat zoom in. | P0 (Must Have) |
| **FR-MAP-04** | Responsive Map Height | Pada layar mobile, peta menempati viewport yang optimal (sekitar 55-60vh) dengan panel detail di bagian bawah yang dapat di-scroll atau diperluas (*pull-up sheet*). Pada layar desktop, peta menyesuaikan grid layout yang proporsional. | P0 (Must Have) |

### Modul 2: Data Titik Api & Interaksi (API KANARI)
| ID | Kebutuhan Fungsional | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-FIRE-01** | Pengambilan Data Real-Time | Aplikasi memanggil endpoint API internal `/api/hotspots` yang melakukan sinkronisasi dengan API KANARI. Dilengkapi sistem *caching/revalidation* (misal: 10-15 menit) untuk efisiensi beban server. | P0 (Must Have) |
| **FR-FIRE-02** | Tingkat Keparahan / Confidence | Marker titik api memiliki kode warna indikator tingkat keyakinan/suhu (Merah: Tinggi/High Confidence, Oranye: Sedang/Medium, Kuning: Rendah/Low). | P0 (Must Have) |
| **FR-FIRE-03** | Interaksi Hover (Desktop) / Quick Tap (Mobile) | Mengarahkan kursor (*hover*) ke marker akan menampilkan popup *tooltip* melayang yang berisi: Nama lokasi/kecamatan/kabupaten, tingkat keyakinan (*confidence*), satelit pendeteksi, dan estimasi waktu deteksi. | P0 (Must Have) |
| **FR-FIRE-04** | Interaksi Klik / Pilihan Aktif | Mengklik marker titik bencana akan: 1) Melakukan animasi *panTo* ke titik tersebut, 2) Menyorot baris terkait di tabel detail bawah peta, 3) Membuka informasi komprehensif di panel bawah. | P0 (Must Have) |

### Modul 3: Overlay Arah Angin & Perkiraan Cuaca (Open-Meteo API)
| ID | Kebutuhan Fungsional | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-WIND-01** | Floating Control Bar | Terdapat tombol toggle mengambang (*floating pills/action button*) di pojok kanan/kiri atas peta (meniru ergonomi Google Maps) untuk mengaktifkan/menonaktifkan layer cuaca & angin. | P0 (Must Have) |
| **FR-WIND-02** | Visualisasi Arah & Kecepatan Angin | Menampilkan indikator kompas angin (*wind direction arrow*) beserta kecepatan angin (km/jam) pada titik lokasi yang dipilih/dipantau. Ini krusial agar user memahami kemana arah asap karhutla berhembus. | P0 (Must Have) |
| **FR-WIND-03** | Ringkasan Cuaca Lokal | Menampilkan parameter cuaca esensial: Suhu (°C), Kelembapan udara (%), Indeks Curah Hujan/Prakiraan Hujan (membantu analisis apakah api berpotensi padam secara alami). | P1 (Should Have) |

### Modul 4: Data Detail Table Bawah Peta (Tabular View)
| ID | Kebutuhan Fungsional | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-TBL-01** | Penyajian Data Terstruktur | Tabel di bawah peta menyajikan daftar titik bencana aktif dengan kolom: Waktu Deteksi, Wilayah (Provinsi/Kabupaten), Koordinat (Lat, Long), Tingkat Kepercayaan (*Confidence*), Satelit (MODIS/VIIRS), dan Status. | P0 (Must Have) |
| **FR-TBL-02** | Pencarian & Filter Cepat | Input pencarian untuk memfilter data berdasarkan nama provinsi/kabupaten, serta filter *dropdown* untuk tingkat keparahan (*High*, *Medium*, *All*). | P1 (Should Have) |
| **FR-TBL-03** | Sinkronisasi Dua Arah (Table -> Map) | Menekan salah satu baris di tabel akan otomatis menggeser fokus peta (*zoom & center*) ke koordinat titik bencana tersebut dan membuka *popup*-nya. | P0 (Must Have) |
| **FR-TBL-04** | Aksi Berbagi / Koordinat | Tombol cepat untuk menyalin titik koordinat atau membagikan ringkasan info bencana ke WhatsApp/Media Sosial. | P2 (Nice to Have) |

### Modul 5: Donasi Pengembang (Saweria Integration)
| ID | Kebutuhan Fungsional | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-DON-01** | Tombol Apresiasi Pengembang | Tombol "Dukung Pengembang" / "Traktir Kopi" di navigasi atas atau floating banner bawah yang tidak mengganggu navigasi utama peta. | P1 (Should Have) |
| **FR-DON-02** | Modal Donasi & QR Barcode | Saat diklik, muncul modal pop-up elegan yang menampilkan barcode QRIS Saweria untuk dipindai langsung, disertai tautan aktif menuju URL Saweria pengembang. | P1 (Should Have) |

---

## 4. Spesifikasi Kebutuhan Non-Fungsional (SRS - Non-Functional Requirements)

### 4.1 Mobile-First UI/UX & Responsive Design
- **Filosofi Tampilan:** Mobile-First. Antarmuka dirancang khusus untuk kenyamanan satu tangan (area jangkauan jempol / *thumb zone*).
- **Target Sentuh:** Setiap tombol dan elemen interaktif memiliki area sentuh minimum 44 x 44 piksel.
- **Transisi Halus:** Modal, bottom sheet, dan tooltip menggunakan animasi mikro (*smooth easing transition*) tanpa membebani GPU perangkat *entry-level*.

### 4.2 Desain Sistem & Tema (Simple, Elegan, Light/Dark Auto-Detect)
- **Auto-Detection:** Mendeteksi otomatis preferensi OS pengguna melalui media query `prefers-color-scheme`.
- **Manual Override:** Pengguna tetap dapat mengganti tema secara manual via toggle ikon di header; preferensi disimpan di `localStorage`.
- **Palet Warna:**
  - *Light Mode:* Latar belakang bersih (`#F8FAFC` Slate-50), permukaan kartu (`#FFFFFF`), teks utama (`#0F172A` Slate-900), aksen bahaya/api (`#EF4444` Red-500, `#F97316` Orange-500).
  - *Dark Mode:* Latar belakang gelap elegan (`#0B0F17` / `#0F172A`), kartu *surface* (`#1E293B` Slate-800), border halus (`rgba(255,255,255,0.08)`), kontras teks tinggi (`#F1F5F9`).
- **Glassmorphism:** Elemen kontrol melayang (*floating controls*) memanfaatkan efek `backdrop-blur-md` dengan transparansi halus untuk kesan modern dan premium.

### 4.3 Kinerja & SSR Leaflet Handling
- **Dynamic Import (No-SSR):** Mengingat Leaflet mengandalkan objek `window` browser, seluruh modul peta diimpor secara dinamis (`next/dynamic` dengan `{ ssr: false }`) disertai *loading skeleton* yang elegan.
- **Data Caching:** Next.js Route Handler melakukan *in-memory caching* atau HTTP *stale-while-revalidate* terhadap API eksternal untuk menghindari *rate limit* dan mempercepat respon data di bawah 300ms.

### 4.4 Kemudahan Pemeliharaan (*Maintainability & Component Reusability*)
- Struktur kode modular berbasis komponen atomik.
- Type Safety penuh dengan TypeScript: seluruh tipe data bencana, cuaca, dan konfigurasi peta terdefinisi secara baku dalam direktori `types/`.
- Dokumentasi kode yang komprehensif pada setiap modul utama.

---

## 5. Blueprint Antarmuka & Tata Letak (Wireframe Concept)

### 5.1 Tampilan Ponsel (Mobile View - First Priority)
```
+-------------------------------------------------------+
|  [Logo SiagaNusa]   [Status: 142 Hotspots]  [🌙/☀️] [☕] | <- Header Ringkas (Sticky)
+-------------------------------------------------------+
|                                                       |
|   [Peta Interaktif Leaflet - Height ~55vh]            |
|   +-----------------------------------------------+   |
|   | [🔍 Cari Daerah]                              |   | <- Floating Search Bar
|   +-----------------------------------------------+   |
|   |                                               |   |
|   |          🔴 (Titik Api Riau)                  |   |
|   |                                               |   |
|   |               🟠 (Titik Api Kalteng)          |   |
|   |                                               |   |
|   |                               [💨 Angin: ON]  |   | <- Floating Toggle Cuaca/Angin
|   |                               [🗺️ Layer OSM]  |   | <- Floating Layer Switch
|   |                               [📍 Lokasi Saya]|   | <- Floating Geo-locate
|   +-----------------------------------------------+   |
+-------------------------------------------------------+
|  === Tarik ke Atas / Geser untuk Detail === (Sheet)   | <- Bottom Sheet / Card Header
|  📊 Rangkuman Cepat:                                   |
|  [ Tinggi: 68 ]   [ Sedang: 54 ]   [ Rendah: 20 ]      |
+-------------------------------------------------------+
|  📋 Tabel Rincian Titik Bencana (Scrollable):         |
|  +--------------------------------------------------+ |
|  | Waktu | Lokasi         | Satelit | Status  | Aksi| |
|  |-------+----------------+---------+---------+-----| |
|  | 09:20 | Dumai, Riau    | VIIRS   | 🔴 High | 👁️ | |
|  | 09:15 | Ketapang, Kalbar| MODIS  | 🟠 Med  | 👁️ | |
|  | 08:40 | Ogan Ilir, Sumsel| VIIRS | 🔴 High | 👁️ | |
|  +--------------------------------------------------+ |
+-------------------------------------------------------+
|  [Dukung Kami via Saweria] | Dibuat untuk Indonesia ❤️| <- Footer Ringkas
+-------------------------------------------------------+
```

### 5.2 Tampilan Desktop (Expanded Layout)
- **Top:** Header elegan dengan status pemantauan waktu nyata, filter cepat provinsi, toggle tema, dan tombol Saweria.
- **Main Area (Split Grid):**
  - **Kiri (Peta Utama ~65% lebar):** Peta Leaflet besar dengan kontrol mengambang di sudut atas dan kanan.
  - **Kanan (Sidebar Analisis ~35% lebar):** Panel info titik bencana yang sedang dipilih, visualisasi arah & kecepatan angin Open-Meteo, grafik kelembapan dan indeks suhu.
- **Bottom:** Tabel data titik api komprehensif dengan fitur ekspor data, pencarian multi-kolom, dan paginasi.

---

## 6. Spesifikasi Data & Kontrak API (Data Models)

### 6.1 Model Data Titik Bencana (Hotspot Karhutla)
```typescript
export interface DisasterHotspot {
  id: string;
  source: 'KANARI' | 'SIPONGI' | 'BMKG';
  disasterType: 'FIRE_HOTSPOT' | 'EARTHQUAKE' | 'FLOOD' | 'VOLCANO';
  latitude: number;
  longitude: number;
  locationName: string;
  district?: string; // Kecamatan
  regency?: string;  // Kabupaten/Kota
  province: string;  // Provinsi
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceValue?: number; // Nilai persentase jika ada (misal: 85%)
  brightnessTempKelvin?: number;
  satellite: string; // misal: "SNPP (VIIRS)", "NOAA-20", "TERRA/AQUA (MODIS)"
  detectedAt: string; // ISO 8601 Timestamp
  status: 'ACTIVE' | 'CONTAINED' | 'VERIFIED';
}
```

### 6.2 Model Data Cuaca & Angin (Open-Meteo Data Contract)
```typescript
export interface LocationWeather {
  latitude: number;
  longitude: number;
  temperatureCelsius: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionDegree: number; // 0 - 360 derajat
  windDirectionCardinal: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  weatherDescription: string;
  weatherCode: number;
  precipitationProbability: number;
  lastUpdated: string;
}
```

---

## 7. Struktur Komponen & Arsitektur Direktori Proyek

```
siaganusa/
├── app/
│   ├── api/
│   │   ├── hotspots/
│   │   │   └── route.ts          # Proxy & Cache API KANARI Titik Api
│   │   └── weather/
│   │       └── route.ts          # Proxy API Open-Meteo Cuaca & Arah Angin
│   ├── globals.css               # Design Tokens, Tailwind v4, Leaflet custom styling
│   ├── layout.tsx                # Root layout, Metadata SEO, Theme Provider injection
│   └── page.tsx                  # Home Page (Assembly Komponen Mobile-First)
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Navbar ringkas, badge live status, theme toggle
│   │   └── Footer.tsx            # Informasi sumber data & link donasi Saweria
│   ├── map/
│   │   ├── DisasterMap.tsx       # Dynamic wrapper (ssr: false)
│   │   ├── LeafletMapInner.tsx   # Core Leaflet map implementation
│   │   ├── MapMarkers.tsx        # Cluster marker titik api dengan warna dinamis
│   │   ├── MapFloatingControls.tsx # Floating toggles (Cuaca, Wind Layer, Reset Zoom)
│   │   └── MapLegend.tsx         # Keterangan simbol tingkat keparahan
│   ├── disaster/
│   │   ├── DisasterTable.tsx     # Tabel detail di bawah peta (filter, search, click-to-focus)
│   │   ├── DisasterDetailCard.tsx# Detail kartu cepat saat titik api dipilih
│   │   └── WeatherWidget.tsx     # Visualisasi arah angin (kompas) & cuaca
│   ├── donation/
│   │   └── SaweriaModal.tsx      # Modal popup QRIS barcode & link donasi Saweria
│   └── ui/                       # Komponen atomik (Button, Badge, Modal, Input, Spinner)
├── hooks/
│   ├── useDisasterData.ts        # Hook reaktif untuk data titik api
│   ├── useWeather.ts             # Hook untuk data Open-Meteo
│   └── useTheme.ts               # Hook pendeteksi & pengubah tema (Dark/Light)
├── types/
│   ├── disaster.ts               # Type definitions untuk titik api & bencana
│   └── weather.ts                # Type definitions untuk data Open-Meteo
└── docs/
    └── PRD-SRS-SIAGANUSA.md      # Dokumen PRD & SRS ini
```

---

## 8. Rencana Implementasi & Roadmap Pengembangan

| Fase | Milestone | Deskripsi Pekerjaan | Estimasi Output |
| :---: | :--- | :--- | :--- |
| **01** | **PRD & SRS Review** *(Tahap Ini)* | Perumusan dan konfirmasi seluruh kebutuhan fungsional & non-fungsional dengan pengguna. | Dokumen PRD disetujui |
| **02** | **Arsitektur Dasar & Theme Engine** | Setup dependensi (Leaflet, Lucide, Tailwind v4 theme tokens, Auto-detect dark/light mode provider). | Fondasi tema & layout responsif |
| **03** | **Leaflet Map Engine Indonesia** | Konfigurasi peta Leaflet dengan batas wilayah Indonesia, layer tile adaptif dark/light, serta custom marker icons. | Peta interaktif berjalan stabil |
| **04** | **Integrasi API KANARI & Interaksi Map** | Implementasi API route proxy, parser data titik api, marker cluster, hover tooltip, dan sinkronisasi ke tabel bawah peta. | Data titik api muncul real-time |
| **05** | **Integrasi Open-Meteo & Floating Controls** | Pembuatan floating toggle ala Google Maps, penarikan data arah angin & cuaca, serta indikator kompas hembusan angin. | Informasi arah angin & cuaca aktif |
| **06** | **Tabel Detail Responsif & Modal Saweria** | Penyempurnaan tabel di bawah peta (mobile drawer/scrollable card), pencarian daerah, serta integrasi modal barcode Saweria. | Fitur MVP lengkap |
| **07** | **Quality Assurance & Skalabilitas Bencana** | Uji coba di berbagai ukuran layar mobile, performa loading, sanitasi aksesibilitas (A11y), dan persiapan skema untuk modul gempa/banjir. | Siap rilis ke pengguna publik |

---

## 9. Pertimbangan Khusus & Langkah Mitigasi

1. **Next.js SSR dengan Leaflet.js:**
   - *Tantangan:* Leaflet langsung mengakses objek global `window` yang menyebabkan kegagalan saat Server-Side Rendering di Next.js.
   - *Mitigasi:* Menggunakan pola `next/dynamic` dengan opsi `{ ssr: false }` dan komponen *Skeleton Loader* beranimasi halus saat peta sedang dimuat.
2. **Ketersediaan & Format API KANARI:**
   - *Tantangan:* Format respon API pihak ketiga dapat mengalami fluktuasi atau *rate limit*.
   - *Mitigasi:* Mengimplementasikan *Adapter Pattern* pada Route Handler `/api/hotspots` dengan fallback dataset terstruktur (termasuk mock data Karhutla Indonesia terbaru) agar antarmuka tidak *crash* jika layanan pusat sedang *maintenance*.
3. **Ergonomi Sentuh pada Ponsel (Hover vs Tap):**
   - *Tantangan:* Perangkat layar sentuh tidak memiliki mekanisme kursor *hover*.
   - *Mitigasi:* Menyediakan perilaku *Tap-to-Peek* pada mobile (sekali tap memunculkan popup ringkas, tap kedua atau tombol "Lihat Detail" membuka tabel rincian di bawah peta).

---
*Dokumen ini disusun untuk memastikan pengembangan aplikasi SiagaNusa terarah, terstruktur, dan memiliki fondasi teknis yang kokoh.*
