# Dokumentasi Masalah & Solusi (Troubleshooting & Solution)
## SiagaNusa — Platform Pemantauan Bencana Real-Time

Dokumen ini mencatat riwayat kendala teknis (*trouble*), akar permasalahan (*root cause*), serta solusi penyelesaiannya (*solution*) yang ditemui selama proses pengembangan aplikasi **SiagaNusa**.

---

## Daftar Isi
1. [Issue 01: Peta Leaflet Tidak Muncul / Blank Abu-abu (Race Condition CDN & SSR)](#issue-01-peta-leaflet-tidak-muncul--blank-abu-abu-race-condition-cdn--ssr)
2. [Issue 02: Tile Peta Memunculkan "api key required carto.com/basemap/apikey"](#issue-02-tile-peta-memunculkan-api-key-required-cartocombasemapapikey)
3. [Issue 03: Error PostCSS / Turbopack pada @import CSS](#issue-03-error-postcss--turbopack-pada-import-css)
4. [Issue 04: Ketidaksesuaian Data Titik Api KANARI & Visualisasi Sebaran/Arah Api](#issue-04-ketidaksesuaian-data-titik-api-kanari--visualisasi-sebaranarah-api)
5. [Issue 05: Estetika Animasi Repeat Arah Angin, Toggle Layer Peta, Zoom Threshold UX & Optimasi Layout Panel Detail Tabel](#issue-05-estetika-animasi-repeat-arah-angin-toggle-layer-peta-zoom-threshold-ux--optimasi-layout-panel-detail-tabel)

---

## Issue 01: Peta Leaflet Tidak Muncul / Blank Abu-abu (Race Condition CDN & SSR)

### Gejala (Symptoms)
* Data titik panas (*hotspot*) dari API KANARI berhasil dimuat dan tampil pada tabel statistik.
* Area kontainer peta tetap kosong, berwarna abu-abu, atau gagal menginisialisasi peta Leaflet.

### Akar Masalah (Root Cause)
1. **Window Object di Server-Side:** Leaflet bergantung langsung pada objek browser global (`window` dan `document`). Next.js secara default mengeksekusi kode di server (SSR), sehingga impor langsung tanpa penanganan khusus akan memicu error `window is not defined`.
2. **Race Condition CDN Script Loading:** Awalnya, script Leaflet dan plugin MarkerCluster dimuat secara dinamis via tag `<script>` CDN di dalam `useEffect`. Hal ini menyebabkan *race condition*: komponen React sudah mencoba menjalankan `L.map()` sebelum script Leaflet dari CDN selesai diunduh dan dieksekusi oleh browser.

### Solusi (Solution)
1. **Pemisahan Komponen Dinamis (`next/dynamic`):**
   Membuat komponen pembungkus [`DisasterMap.tsx`](../components/map/DisasterMap.tsx) yang memuat inti peta [`LeafletMapInner.tsx`](../components/map/LeafletMapInner.tsx) dengan opsi `{ ssr: false }`.
2. **Impor Langsung dari Package NPM:**
   Menghapus pemuatan script via CDN dan beralih ke package npm lokal (`leaflet` dan `leaflet.markercluster`) dengan *dynamic import* asinkron di dalam `useEffect` sisi klien.

```tsx
// components/map/DisasterMap.tsx
import dynamic from 'next/dynamic';

const LeafletMapInner = dynamic(
  () => import('@/components/map/LeafletMapInner'),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);
```

---

## Issue 02: Tile Peta Memunculkan "api key required carto.com/basemap/apikey"

### Gejala (Symptoms)
* Peta Leaflet berhasil diinisialisasi dan kontrol zoom muncul.
* Potongan gambar (*tiles*) peta tidak menampilkan gambar wilayah/daratan, melainkan gambar berulang dengan teks watermark:
  > **"api key required carto.com/basemap/apikey"**

### Akar Masalah (Root Cause)
* Konfigurasi awal menggunakan tile layer dari penyedia pihak ketiga **CARTO** (`basemaps.cartocdn.com` untuk tema `light_all` dan `dark_all`).
* CARTO baru-baru ini memperketat kebijakan layanannya dengan **mewajibkan API Key** untuk semua akses tile raster. Permintaan publik anonim (tanpa key) secara otomatis dialihkan ke tile peringatan tersebut.

### Solusi (Solution)
1. **Migrasi Penuh ke OpenStreetMap Resmi:**
   Mengganti URL tile layer di [`LeafletMapInner.tsx`](../components/map/LeafletMapInner.tsx) menggunakan server resmi **OpenStreetMap (OSM)** yang 100% gratis, berbasis data terbuka (*open data*), dan tidak memerlukan API key:
   ```typescript
   const TILE_LAYERS = {
     light: {
       url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
     },
     dark: {
       url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
     },
   };
   ```
2. **Dukungan Dark Mode via CSS Filter:**
   Agar peta tetap memiliki estetika mode gelap yang elegan tanpa memerlukan tile berbayar, ditambahkan filter CSS khusus pada lapisan tile OpenStreetMap di [`globals.css`](../app/globals.css):
   ```css
   [data-theme="dark"] .leaflet-tile-pane {
     filter: invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%);
   }

   [data-theme="dark"] .leaflet-container {
     background-color: #0b0f17;
   }
   ```
   *Catatan:* Filter hanya diterapkan pada `.leaflet-tile-pane` sehingga marker titik api (merah, oranye, kuning) dan popup tetap mempertahankan warna aslinya yang tajam dan kontras.
3. **Optimasi Preconnect:**
   Memperbarui tag `<link rel="preconnect">` pada [`app/layout.tsx`](../app/layout.tsx) agar browser melakukan *handshake* awal ke `tile.openstreetmap.org` untuk mempercepat pemuatan potongan peta.

---

## Issue 03: Error PostCSS / Turbopack pada @import CSS

### Gejala (Symptoms)
* Halaman dev server sempat mengembalikan status `HTTP 500`:
  > `Error: @import rules must precede all rules aside from @charset and @layer statements`

### Akar Masalah (Root Cause)
* Di dalam [`app/globals.css`](../app/globals.css), baris `@import "tailwindcss";` diletakkan di atas, lalu diikuti oleh deklarasi `@import url("https://fonts.googleapis.com/...");`.
* Pada engine Turbopack dan Tailwind v4, deklarasi `@import "tailwindcss"` dikompilasi menjadi aturan internal CSS terlebih dahulu, sehingga `@import` font eksternal setelahnya dianggap melanggar spesifikasi standar CSS.

### Solusi (Solution)
* Menghapus baris `@import url(...)` font Google dari `globals.css`.
* Font **Inter** sudah dimuat secara optimal menggunakan modul bawaan Next.js `next/font/google` di [`app/layout.tsx`](../app/layout.tsx), yang lebih efisien karena melakukan *self-hosting* font tanpa blocking render jaringan.

---

## Praktik Terbaik untuk Fitur Peta Selanjutnya (Best Practices)

1. **Selalu Gunakan Dynamic Import untuk Komponen Geografis:**
   Semua komponen yang menggunakan Leaflet, Mapbox GL, atau manipulasi canvas/DOM peta harus dibungkus dengan `next/dynamic({ ssr: false })`.
2. **Gunakan Penyedia Tile Terbuka:**
   Utamakan OpenStreetMap (OSM) atau penyedia yang tidak mengunci akses dengan API key berbayar untuk menjaga ketersediaan layanan publik secara konsisten.
3. **Cleanup Leaflet Instance Saat Unmount:**
   Selalu pastikan method `map.remove()` dipanggil di fungsi pembersih `useEffect` untuk menghindari kebocoran memori (*memory leak*) pada aplikasi SPA.

---

## Issue 04: Ketidaksesuaian Data Titik Api KANARI & Visualisasi Sebaran/Arah Api

### Gejala (Symptoms)
* Jumlah dan lokasi titik api di peta tidak sama dengan tampilan pada kanari.io (hanya muncul 12 titik simulasi mock).
* Titik api hanya tampil sebagai lingkaran kecil tanpa informasi seberapa luas area kebakaran (*footprint*) dan ke mana arah perambatan apinya.

### Akar Masalah (Root Cause)
1. **Endpoint KANARI Sebelumnya Menggunakan Mock:**
   * URL endpoint KANARI resmi adalah `https://kanari.io/api/events?hours=24&full=1` (bebas akses, tanpa API key). Sebelumnya sistem mengarah ke URL placeholder yang gagal terhubung sehingga otomatis jatuh ke data mock (12 titik).
2. **Ketiadaan Visualisasi Bounding Box & Arah Angin:**
   * Data satelit KANARI sebenarnya menyertakan `bbox` (koordinat batas sebaran kluster), `count` (jumlah deteksi), dan `maxFrp` (daya pancar radiasi api dalam MegaWatt). Sebelumnya nilai-nilai ini belum di-parse ke model data dan belum divisualisasikan.
   * Arah perambatan api di alam nyata digerakkan oleh tiupan angin, namun data angin dari Open-Meteo belum dikaitkan ke koordinat titik api.

### Solusi (Solution)
1. **Integrasi Langsung API Resmi KANARI.io:**
   * Memperbarui [`app/api/hotspots/route.ts`](../app/api/hotspots/route.ts) untuk mengambil data live real-time dari `https://kanari.io/api/events?hours=24&full=1`.
   * Melakukan filtering wilayah geografis Indonesia (`lat: -11 s/d 6.1, lng: 95 s/d 141`) secara server-side dengan *in-memory cache* 5 menit (mematuhi ketentuan fair-use). Hasilnya: **1.360+ titik kluster kebakaran aktif real-time Indonesia** langsung tampil akurat.
2. **Visualisasi Luas Area (Bounding Box & Buffer Zone):**
   * Di [`components/map/LeafletMapInner.tsx`](../components/map/LeafletMapInner.tsx), saat titik api dipilih, sistem menggambar poligon batas area (`L.rectangle`) dari koordinat `bbox` kluster kebakaran.
   * Ditambahkan lingkaran zona radius dampak (`L.circle`) dengan radius proporsional terhadap daya panas api (`maxFrp`) dan jumlah titik sensor.
3. **Integrasi Open-Meteo & Vektor Arah Perambatan Api:**
   * Dibuat route [`app/api/weather/route.ts`](../app/api/weather/route.ts) untuk mengambil data cuaca real-time (`wind_speed_10m`, `wind_direction_10m`).
   * Pada peta, ditampilkan panah arah angin (*Wind Vector Arrow*) dan kerucut proyeksi rambatan api (*Fire Spread Projection*).
   * Ditambahkan kartu mengambang *Telemetry HUD* yang menampilkan analisis daya panas api (MW), jumlah sensor, kecepatan angin, serta arah perambatan.

---

## Issue 05: Estetika Animasi Repeat Arah Angin, Toggle Layer Peta, Zoom Threshold UX & Optimasi Layout Panel Detail Tabel

### Gejala (Symptoms)
1. **Animasi Angin Terlalu Statis:** Indikator arah angin pada titik api sebelumnya kurang dinamis dan tidak memberikan kesan aliran udara (*continuous air flow*).
2. **Ketiadaan Kontrol Toggle & Polusi Visual Saat Zoom Out:** Indikator arah angin tidak dapat dimatikan/dihidupkan pengguna secara manual, dan jika peta di-zoom out pada skala nasional, elemen vektor angin membuat peta terasa sesak (*cluttered*).
3. **Tampilan Detail Data di Dekat Tabel Tumpang Tindih (*Layout Overlap*):** Saat salah satu titik api diklik dari tabel atau peta, kotak informasi rincian di dekat tabel memiliki teks dan badge yang saling bertumpukan, sulit dibaca, dan tidak rapi pada berbagai ukuran layar.

### Akar Masalah (Root Cause)
1. **SVG & CSS Dash Animation Belum Diterapkan:** Garis vektor panah hanya berupa polyline statis tanpa efek `stroke-dashoffset` dan gelombang denyut konsentris berulang (*repeating pulse radar wave*).
2. **Belum Ada State Global untuk Toggle Angin & Zoom Listener:** Komponen Leaflet belum memantau tingkat zoom pengguna (`zoomend` event) dan belum ada tombol kontrol mengambang khusus untuk lapisan angin.
3. **Keterbatasan CSS Grid & Card Constraints pada Panel Detail:** Elemen rincian titik api menggunakan flexbox sederhana tanpa pembagian kolom terstruktur (`grid-template-columns`), menyebabkan teks koordinat panjang, data FRP, dan metrik cuaca bertabrakan dengan kolom data tabel di bawahnya.

### Solusi (Solution)
1. **Animasi Repeat Aliran Angin Aerodinamis:**
   * **Garis Aliran Berulang (`.wind-flow-line-animated`):** Menggunakan SVG dash array beranimasi looping halus (`windStreamRepeat: stroke-dashoffset 28px -> 0px`) yang mengalir dari pusat api ke arah perambatan.
   * **Kepala Panah Aerodinamis & Radar Pulse:** Ujung panah dihiasi kepala panah tajam berputar sesuai azimuth sudut perambatan (`(wind_direction + 180) % 360`) dengan efek radar ganda konsentris berulang (`.wind-pulse-ripple-repeat`).
2. **Fitur Toggle Interaktif & Best-Practice Zoom Threshold (>= 8):**
   * **Tombol Toggle Mengambang (`MapFloatingControls`):** Tombol toggle arah angin (`btn-toggle-wind`) dengan ikon `<Wind />` dan lampu status aktif (`floating-btn-indicator`).
   * **GIS Zoom Threshold UX:** Vektor arah angin otomatis hanya dirender ketika tingkat pembesaran peta `zoom >= 8` (level kabupaten/kecamatan). Pada level nasional (`zoom < 8`), peta tetap bersih dengan tooltip petunjuk yang ramah pengguna.
3. **Redesain Menyeluruh Panel Detail Terpilih (`.selected-hotspot-panel`):**
   * **Header Visual Premium:** Menampilkan ikon api berdenyut (*pulsing flame*), tingkat kepercayaan (*confidence badge*), dan progress bar visual daya panas api (FRP Gauge) bergradasi.
   * **4 Kolom Kartu Metrik (Stat Cards):**
     1. *Waktu Deteksi* (Kalender & Jam presisi)
     2. *Satelit & Sensor* (Instrumen VIIRS/MODIS)
     3. *Cuaca & Angin Live* (Suhu, kelembapan, dan kecepatan angin Open-Meteo)
     4. *Koordinat Presisi* (Latitude/Longitude dengan tombol aksi 1-klik salin)
   * **Banner Peringatan Perambatan Asap:** Kotak peringatan darurat dengan proyeksi sudut rambat dan tombol langsung buka titik di Google Maps.
   * **Tabel Anti Tumpang-Tindih:** Tabel diberikan `min-width: 860px`, `border-collapse: separate`, dan scroll horizontal kontainer yang mulus agar tidak ada teks yang terpotong pada layar ponsel maupun desktop.
