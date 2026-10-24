/**
 * @file components/map/LeafletMapInner.tsx
 * @description Komponen inti Leaflet Map untuk SiagaNusa.
 *
 * Fitur Visualisasi:
 * 1. Titik api individual dengan visualisasi cluster & level keyakinan.
 * 2. Visualisasi Luas Sebaran Kebakaran (Bounding Box & Radius Dampak Termal).
 * 3. Animasi Aliran Vektor Arah Angin Berulang (Repeating Wind Flow Animation).
 * 4. Toggle layer arah angin dengan batas zoom cerdas (Zoom Threshold >= 8 / saat hotspot dipilih).
 * 5. Popup Interaktif Detail Cuaca & Arah Angin Terkini.
 * 6. Floating Telemetry HUD di sudut kiri bawah peta tanpa tumpang tindih dengan kontrol.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type * as Leaflet from 'leaflet';
import type { DisasterHotspot } from '@/types/disaster';
import type { LocationWeather, RegionalZone } from '@/types/weather';
import type { AirQualityData } from '@/types/airQuality';
import { INDONESIA_SEA_WIND_TRACKS } from '@/constants/seaWindTracks';
import { INDONESIA_BOUNDS_LEAFLET, isInsideIndonesia } from '@/lib/indonesiaBounds';

// ─── Koordinat Pusat Indonesia ───────────────────────────────────────────────
const INDONESIA_CENTER: [number, number] = [-2.5, 118.0];
const INDONESIA_DEFAULT_ZOOM = 5;
const INDONESIA_MIN_ZOOM = 4;
const INDONESIA_MAX_ZOOM = 18;
const WIND_ZOOM_THRESHOLD = 8; // Zoom level minimum untuk menampilkan layer angin umum

// ─── Tile Layer Configs (OpenStreetMap Murni) ─────────────────────────────────
const TILE_LAYERS = {
  light: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  dark: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
};

// ─── Warna marker per confidence level ───────────────────────────────────────
const CONFIDENCE_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  HIGH:   { fill: '#EF4444', stroke: '#B91C1C', label: 'Tinggi' },
  MEDIUM: { fill: '#F97316', stroke: '#C2410C', label: 'Sedang' },
  LOW:    { fill: '#EAB308', stroke: '#A16207', label: 'Rendah' },
};

function degreeToCardinalName(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Utara (N)';
  if (normalized >= 22.5 && normalized < 67.5) return 'Timur Laut (NE)';
  if (normalized >= 67.5 && normalized < 112.5) return 'Timur (E)';
  if (normalized >= 112.5 && normalized < 157.5) return 'Tenggara (SE)';
  if (normalized >= 157.5 && normalized < 202.5) return 'Selatan (S)';
  if (normalized >= 202.5 && normalized < 247.5) return 'Barat Daya (SW)';
  if (normalized >= 247.5 && normalized < 292.5) return 'Barat (W)';
  return 'Barat Laut (NW)';
}

/**
 * Mencari zona regional terdekat untuk koordinat tertentu di Indonesia
 */
function getClosestRegionalZone(lat: number, lng: number, zones: RegionalZone[]): RegionalZone | null {
  if (!zones || zones.length === 0) return null;
  let closest = zones[0];
  let minDist = Number.MAX_VALUE;
  for (const z of zones) {
    const dLat = z.lat - lat;
    const dLng = z.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      closest = z;
    }
  }
  return closest;
}

interface LeafletMapInnerProps {
  hotspots: DisasterHotspot[];
  isDark: boolean;
  onHotspotClick: (hotspot: DisasterHotspot) => void;
  selectedHotspotId: string | null;
  isWindLayerActive?: boolean;
  isSeaWindLayerActive?: boolean;
  selectedWeather?: LocationWeather | null;
  isLoadingWeather?: boolean;
  selectedAirQuality?: AirQualityData | null;
  isLoadingAirQuality?: boolean;
  regionalWeather?: RegionalZone[];
}

export default function LeafletMapInner({
  hotspots,
  isDark,
  onHotspotClick,
  selectedHotspotId,
  isWindLayerActive = false,
  isSeaWindLayerActive = false,
  selectedWeather,
  isLoadingWeather = false,
  selectedAirQuality,
  isLoadingAirQuality = false,
  regionalWeather = [],
}: LeafletMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const areaLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seaWindLayerRef = useRef<any>(null);

  // State kesiapan peta Leaflet setelah dynamic import & inisialisasi selesai
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Zoom level state untuk mengontrol density sesuai expert GIS UX
  const [currentZoom, setCurrentZoom] = useState<number>(INDONESIA_DEFAULT_ZOOM);

  // ─── Buat SVG icon untuk marker titik api murni (tanpa icon segitiga) ──────
  const createFireIcon = useCallback((
    L: typeof Leaflet,
    confidence: string,
    isSelected = false,
    maxFrp = 0
  ) => {
    const { fill, stroke } = CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.LOW;
    const baseSize = maxFrp > 500 ? 30 : maxFrp > 100 ? 26 : 22;
    const outerSize = isSelected ? baseSize + 10 : baseSize;
    const innerSize = Math.round(outerSize * 0.6);

    const pulseClass = isSelected ? 'fire-pulse-active' : '';

    const totalBox = outerSize + 6;
    const center = totalBox / 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalBox}" height="${totalBox}" viewBox="0 0 ${totalBox} ${totalBox}" class="${pulseClass}">
        <!-- Lingkaran Luar Titik Api -->
        <circle cx="${center}" cy="${center}" r="${outerSize / 2 - 1}" fill="${fill}" fill-opacity="${isSelected ? 0.45 : 0.28}" stroke="${stroke}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
        
        <!-- Lingkaran Inti Titik Api -->
        <circle cx="${center}" cy="${center}" r="${innerSize / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        
        <!-- Cincin Garis Putus-putus jika Terpilih -->
        ${isSelected ? `<circle cx="${center}" cy="${center}" r="${outerSize / 2 - 4}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2,2"/>` : ''}
      </svg>`;

    return L.divIcon({
      html: svg,
      className: 'fire-marker-icon',
      iconSize: [totalBox, totalBox],
      iconAnchor: [center, center],
      popupAnchor: [0, -(center + 6)],
    });
  }, []);

  // ─── Inisialisasi peta Leaflet (hanya sekali) ──────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let mounted = true;

    const initMap = async () => {
      const [L] = await Promise.all([
        import('leaflet').then((m) => m.default),
        import('leaflet/dist/leaflet.css'),
        import('leaflet.markercluster'),
        import('leaflet.markercluster/dist/MarkerCluster.css'),
        import('leaflet.markercluster/dist/MarkerCluster.Default.css'),
      ]);

      if (!mounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: INDONESIA_CENTER,
        zoom: INDONESIA_DEFAULT_ZOOM,
        minZoom: INDONESIA_MIN_ZOOM,
        maxZoom: INDONESIA_MAX_ZOOM,
        maxBounds: [INDONESIA_BOUNDS_LEAFLET.southWest, INDONESIA_BOUNDS_LEAFLET.northEast],
        maxBoundsViscosity: INDONESIA_BOUNDS_LEAFLET.maxBoundsViscosity,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Event listener saat zoom peta berubah
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Tile layer awal
      const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: INDONESIA_MAX_ZOOM,
      });
      tileLayer.addTo(map);

      const areaGroup = L.layerGroup().addTo(map);
      const windGroup = L.layerGroup().addTo(map);
      const seaWindGroup = L.layerGroup().addTo(map);

      tileLayerRef.current = tileLayer;
      areaLayerRef.current = areaGroup;
      windLayerRef.current = windGroup;
      seaWindLayerRef.current = seaWindGroup;
      mapRef.current = map;

      // Peta dan seluruh layer group Leaflet sudah siap digunakan
      if (mounted) {
        setIsMapReady(true);
      }

      // Invalidate size agar Leaflet segera membaca dimensi kontainer layar (sangat krusial untuk perangkat mobile)
      setTimeout(() => {
        if (mounted && map) map.invalidateSize();
      }, 150);
      setTimeout(() => {
        if (mounted && map) map.invalidateSize();
      }, 600);
    };

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    initMap().catch(console.error);

    return () => {
      mounted = false;
      setIsMapReady(false);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Ganti tile layer saat tema berubah ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const changeTile = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current) return;

      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }

      const tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
      const newTile = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: INDONESIA_MAX_ZOOM,
      });
      newTile.addTo(mapRef.current);
      tileLayerRef.current = newTile;
    };

    changeTile().catch(console.error);
  }, [isDark]);

  // ─── Render markers saat data hotspot berubah ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    let active = true;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MCG = (L as any).markerClusterGroup;

      if (!mapRef.current || !active) return;

      if (markerLayerRef.current) {
        mapRef.current.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }

      if (hotspots.length === 0) return;

      const clusterLayer = MCG
        ? MCG({
            maxClusterRadius: 45,
            showCoverageOnHover: true,
            chunkedLoading: true,
            chunkInterval: 100,
            chunkDelay: 10,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            iconCreateFunction: (c: any) => {
              const count = c.getChildCount();
              const size = count > 50 ? 46 : count > 20 ? 38 : 30;
              return L.divIcon({
                html: `<div style="width:${size}px;height:${size}px;background:radial-gradient(circle,rgba(239,68,68,0.95),rgba(185,28,28,0.88));border:2px solid rgba(254,202,202,0.8);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${size > 38 ? 13 : 11}px;box-shadow:0 3px 10px rgba(239,68,68,0.5);">${count}</div>`,
                className: '',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              });
            },
          })
        : L.layerGroup();

      const markersToAdd: Leaflet.Marker[] = [];

      hotspots.forEach((hotspot) => {
        if (!hotspot.latitude || !hotspot.longitude) return;
        if (!isInsideIndonesia(hotspot.latitude, hotspot.longitude)) return;

        const isSelected = hotspot.id === selectedHotspotId;
        const icon = createFireIcon(L, hotspot.confidence, isSelected, hotspot.maxFrp);
        const marker = L.marker([hotspot.latitude, hotspot.longitude], { icon });

        // Evaluasi isi tooltip secara lazy (hanya saat kursor diarahkan ke marker)
        // Ini menghindari kompilasi string & Date parsing untuk 1.000+ marker saat inisialisasi awal (mengurangi TBT).
        marker.bindTooltip(
          () => {
            const d = new Date(hotspot.detectedAt);
            const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const { fill, label } = CONFIDENCE_COLORS[hotspot.confidence] || CONFIDENCE_COLORS.LOW;
            const frpText = hotspot.maxFrp ? `${hotspot.maxFrp.toFixed(1)} MW` : 'Tidak Terukur';
            const sensorCountText = hotspot.count ? `${hotspot.count} titik sensor` : '1 titik';

            return `
              <div style="font-family:system-ui,sans-serif;min-width:210px;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.18);">
                <div style="background:${fill};color:white;padding:6px 10px;font-weight:700;font-size:11px;display:flex;justify-content:space-between;align-items:center;">
                  <span>🔥 ${label} Confidence</span>
                  <span style="font-size:10px;background:rgba(0,0,0,0.2);padding:1px 6px;border-radius:4px;">${frpText}</span>
                </div>
                <div style="padding:10px;background:white;color:#1f2937;">
                  <div style="font-weight:700;font-size:13px;color:#111827;margin-bottom:2px;">${hotspot.locationName}</div>
                  <div style="color:#4b5563;font-size:11px;margin-bottom:6px;">📍 ${hotspot.province}</div>
                  
                  <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:6px;padding:6px;font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">
                    <div><span style="color:#6b7280;">Daya:</span> <b>${frpText}</b></div>
                    <div><span style="color:#6b7280;">Kluster:</span> <b>${sensorCountText}</b></div>
                    <div style="grid-column:span 2;"><span style="color:#6b7280;">Satelit:</span> ${hotspot.satellite}</div>
                  </div>

                  <div style="color:#6b7280;font-size:10px;margin-bottom:6px;">🕒 ${timeStr} · ${dateStr}</div>
                  <div style="font-size:10px;color:#dc2626;font-weight:600;display:flex;align-items:center;gap:3px;">
                    <span>🎯 Klik untuk fokus & lihat aliran arah angin</span>
                  </div>
                </div>
              </div>`;
          },
          {
            direction: 'top',
            offset: [0, -10],
            className: 'siaganusa-tooltip',
            sticky: false,
          }
        );

        marker.on('click', () => {
          onHotspotClick(hotspot);
          if (mapRef.current) {
            mapRef.current.setView([hotspot.latitude, hotspot.longitude], 12, {
              animate: true,
              duration: 0.8,
            });
          }
        });

        markersToAdd.push(marker);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (clusterLayer as any).addLayers === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clusterLayer as any).addLayers(markersToAdd);
      } else {
        markersToAdd.forEach((m) => clusterLayer.addLayer(m));
      }

      if (!active || !mapRef.current) return;

      clusterLayer.addTo(mapRef.current);
      markerLayerRef.current = clusterLayer;
      mapRef.current.invalidateSize();
    };

    updateMarkers().catch(console.error);

    return () => {
      active = false;
    };
  }, [hotspots, selectedHotspotId, createFireIcon, isMapReady, onHotspotClick]);

  // ─── Otomatis Zoom & Pusatkan Peta Saat Hotspot Dipilih (dari Tabel/Peta) ───
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !selectedHotspotId) return;
    const hotspot = hotspots.find((h) => h.id === selectedHotspotId);
    if (!hotspot || !hotspot.latitude || !hotspot.longitude) return;

    // Jika marker berada di dalam cluster, uncluster & tampilkan marker tersebut secara presisi
    if (markerLayerRef.current && typeof markerLayerRef.current.zoomToShowLayer === 'function') {
      const allMarkers = markerLayerRef.current.getLayers ? markerLayerRef.current.getLayers() : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetMarker = allMarkers.find((m: any) => {
        const pos = m.getLatLng ? m.getLatLng() : null;
        return pos && Math.abs(pos.lat - hotspot.latitude) < 0.0001 && Math.abs(pos.lng - hotspot.longitude) < 0.0001;
      });
      if (targetMarker) {
        markerLayerRef.current.zoomToShowLayer(targetMarker, () => {
          targetMarker.openTooltip?.();
        });
        return;
      }
    }

    mapRef.current.setView([hotspot.latitude, hotspot.longitude], 12, {
      animate: true,
      duration: 0.8,
    });
  }, [selectedHotspotId, hotspots, isMapReady]);

  // ─── Visualisasi Area Kebakaran & Animasi Arah Angin Berulang ─────────────
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    let active = true;

    const renderFireSpreadAndWind = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current || !active) return;

      // Bersihkan layer sebelumnya
      if (areaLayerRef.current) areaLayerRef.current.clearLayers();
      if (windLayerRef.current) windLayerRef.current.clearLayers();

      // Cari hotspot aktif
      const hotspot = hotspots.find((h) => h.id === selectedHotspotId);
      if (!hotspot || !isInsideIndonesia(hotspot.latitude, hotspot.longitude)) return;

      const [lng, lat] = [hotspot.longitude, hotspot.latitude];
      let hasBboxSpread = false;
      let bboxRadiusMeters = 0;
      if (hotspot.bbox && Array.isArray(hotspot.bbox) && hotspot.bbox.length === 4) {
        const [minLng, minLat, maxLng, maxLat] = hotspot.bbox;
        if (Math.abs(maxLng - minLng) > 0.001 || Math.abs(maxLat - minLat) > 0.001) {
          hasBboxSpread = true;
          // Hitung jarak terjauh dari centroid ke sudut bbox (dalam meter)
          const dLatKm = Math.max(Math.abs(maxLat - lat), Math.abs(minLat - lat)) * 111;
          const dLngKm = Math.max(Math.abs(maxLng - lng), Math.abs(minLng - lng)) * 111 * Math.cos((lat * Math.PI) / 180);
          bboxRadiusMeters = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm) * 1000;
        }
      }

      // ─── 1. Radius Estimasi Bahaya Panas & Asap (Halo Buffer - Layer Bawah) ─────
      // Lingkaran SELALU mengelilingi di luar area lahan terbakar (+ buffer 1.5 - 4 km)
      // sehingga kotak lahan terbakar dan lingkaran bahaya asap tidak saling menimpa!
      const radiusMeters = hasBboxSpread
        ? bboxRadiusMeters + Math.max(1500, Math.min(5000, (hotspot.maxFrp ? Math.sqrt(hotspot.maxFrp) * 60 : 2000)))
        : Math.max(800, Math.min(4500, (hotspot.count || 1) * 400 + (hotspot.maxFrp ? Math.sqrt(hotspot.maxFrp) * 25 : 0)));

      const bufferCircle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: hasBboxSpread ? '#F97316' : '#DC2626',
        fillColor: '#EF4444',
        fillOpacity: hasBboxSpread ? 0.08 : 0.20,
        dashArray: hasBboxSpread ? '5, 5' : '6, 6',
        weight: hasBboxSpread ? 1.5 : 2,
      });

      bufferCircle.bindTooltip(
        `<div style="font-family:system-ui,sans-serif;padding:4px 6px;min-width:240px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="font-size:14px;">⚠️</span>
            <b style="color:#c2410c;font-size:12px;">Radius Bahaya Panas &amp; Asap</b>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:3px 6px;font-size:11px;color:#9a3412;margin-bottom:3px;">
            ⭕ <b>Jangkauan Radiasi:</b> ~${(radiusMeters / 1000).toFixed(1)} km (${Math.round(radiusMeters)} m)
          </div>
          <div style="font-size:10.5px;color:#4b5563;line-height:1.35;">
            Zona bahaya paparan radiasi termal langsung &amp; konsentrasi gas/asap pekat berbahaya di sekeliling kobaran.
          </div>
        </div>`,
        { sticky: true }
      );

      bufferCircle.on('mouseover', () => {
        bufferCircle.setStyle({ weight: 2.5, fillOpacity: hasBboxSpread ? 0.16 : 0.28 });
      });
      bufferCircle.on('mouseout', () => {
        bufferCircle.setStyle({ weight: hasBboxSpread ? 1.5 : 2, fillOpacity: hasBboxSpread ? 0.08 : 0.20 });
      });

      areaLayerRef.current.addLayer(bufferCircle);

      // ─── 2. Bounding Box Sebaran Kluster (Layer Atas - Prioritas Interaksi) ─────
      if (hasBboxSpread && hotspot.bbox) {
        const [minLng, minLat, maxLng, maxLat] = hotspot.bbox;
        const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
        const bboxRect = L.rectangle(bounds, {
          color: '#B91C1C',
          weight: 2.5,
          dashArray: '6, 6',
          fillColor: '#EA580C',
          fillOpacity: 0.35,
        });

        bboxRect.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;padding:4px 6px;min-width:240px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              <span style="font-size:14px;">🔥</span>
              <b style="color:#b91c1c;font-size:12px;">Jejak Lahan Terbakar (Deteksi Satelit)</b>
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:3px 6px;font-size:11px;color:#991b1b;margin-bottom:3px;">
              📐 <b>Cakupan Sensor:</b> ${hotspot.count ?? 1} titik koordinat satelit
            </div>
            <div style="font-size:10.5px;color:#4b5563;line-height:1.35;">
              Area fisik vegetasi yang <b>sudah &amp; sedang terbakar</b> berdasarkan rekaman anomali sensor satelit NASA VIIRS/MODIS.
            </div>
          </div>`,
          { sticky: true }
        );

        bboxRect.on('mouseover', (e: Leaflet.LeafletMouseEvent) => {
          if (e && e.originalEvent) e.originalEvent.stopPropagation();
          bboxRect.setStyle({ weight: 3.5, fillOpacity: 0.5 });
        });
        bboxRect.on('mouseout', () => {
          bboxRect.setStyle({ weight: 2.5, fillOpacity: 0.35 });
        });

        areaLayerRef.current.addLayer(bboxRect);
        bboxRect.bringToFront();
      }

      // ─── 3. Area Strategi Pemadaman & Pembasahan Lahan (Sekat Basah Taktis) ───
      // Mengarahkan tim satgas Manggala Agni / BPBD untuk membasahi tanah di depan arah tiupan angin
      if (selectedWeather && selectedHotspotId) {
        const weather = selectedWeather;
        const blowTowardsDeg = (weather.windDirectionDegree + 180) % 360;
        const targetCardinalName = degreeToCardinalName(blowTowardsDeg);

        const radiusKm = radiusMeters / 1000;
        const tacticalWindOffset = Math.max(0.8, Math.min(4.5, (weather.windSpeedKmh / 10) * 1.5));
        const wettingDistKm = radiusKm + tacticalWindOffset;

        const startAngle = blowTowardsDeg - 50;
        const endAngle = blowTowardsDeg + 50;
        const arcPoints: [number, number][] = [];
        const innerArcPoints: [number, number][] = [];
        const outerArcPoints: [number, number][] = [];

        const bandWidthKm = 0.35; // Lebar zona pembasahan tanah 350 meter
        const innerDistKm = Math.max(0.8, wettingDistKm - bandWidthKm / 2);
        const outerDistKm = wettingDistKm + bandWidthKm / 2;

        for (let a = startAngle; a <= endAngle; a += 5) {
          const radA = (a * Math.PI) / 180;
          const cosA = Math.cos(radA);
          const sinA = Math.sin(radA);
          const cosLat = Math.cos((lat * Math.PI) / 180);

          const cLat = lat + (wettingDistKm / 111) * cosA;
          const cLng = lng + (wettingDistKm / (111 * cosLat)) * sinA;
          arcPoints.push([cLat, cLng]);

          const inLat = lat + (innerDistKm / 111) * cosA;
          const inLng = lng + (innerDistKm / (111 * cosLat)) * sinA;
          innerArcPoints.push([inLat, inLng]);

          const outLat = lat + (outerDistKm / 111) * cosA;
          const outLng = lng + (outerDistKm / (111 * cosLat)) * sinA;
          outerArcPoints.push([outLat, outLng]);
        }

        // Pita Area Pembasahan Lahan Gambut
        const wettingPolygon = L.polygon([...outerArcPoints, ...innerArcPoints.reverse()], {
          color: '#059669',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#10B981',
          fillOpacity: 0.24,
        });

        // Garis Sekat Taktis Utama
        const wettingLine = L.polyline(arcPoints, {
          color: '#059669',
          weight: 4.5,
          dashArray: '8, 6',
          opacity: 0.95,
          className: 'wetting-firebreak-line',
        });

        const wettingTooltipHtml = `
          <div style="font-family:system-ui,sans-serif;min-width:250px;padding:4px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:15px;">🛡️</span>
              <b style="color:#059669;font-size:12px;">Batas Strategi Pembasahan Lahan (Sekat Basah)</b>
            </div>
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:5px 8px;font-size:11px;color:#065f46;margin-bottom:4px;">
              <div>📍 <b>Jarak Taktis:</b> ~${wettingDistKm.toFixed(1)} km (${Math.round(wettingDistKm * 1000)} m)</div>
              <div>🧭 <b>Sektor Target:</b> Menuju ${targetCardinalName}</div>
            </div>
            <div style="font-size:10.5px;color:#475569;line-height:1.4;">
              Area prioritas pembasahan air / sekat bakar (Manggala Agni / BPBD) untuk memutus suplai bahan bakar sebelum api menjalar.
            </div>
          </div>
        `;

        wettingPolygon.bindTooltip(wettingTooltipHtml, { sticky: true });
        wettingLine.bindTooltip(wettingTooltipHtml, { sticky: true });

        // Marker Lencana di Puncak Busur Sekat
        const midArcIdx = Math.floor(arcPoints.length / 2);
        const apexCoord = arcPoints[midArcIdx];
        const wettingBadgeHtml = `
          <div class="wetting-strategy-badge">
            <span class="wetting-badge-dot"></span>
            <span>Sekat Basah: ~${wettingDistKm.toFixed(1)} km</span>
          </div>
        `;

        const wettingBadgeIcon = L.divIcon({
          html: wettingBadgeHtml,
          className: 'wetting-strategy-divicon',
          iconSize: [160, 26],
          iconAnchor: [80, 13],
        });

        const wettingMarker = L.marker(apexCoord, { icon: wettingBadgeIcon });
        wettingMarker.bindTooltip(wettingTooltipHtml, { sticky: true });

        areaLayerRef.current.addLayer(wettingPolygon);
        areaLayerRef.current.addLayer(wettingLine);
        areaLayerRef.current.addLayer(wettingMarker);
      }

      // ─── 2. Animasi & Layer Arah Angin (Jika toggle aktif) ──────────────
      if (isWindLayerActive) {
        // A. Jika ada hotspot aktif terpilih dengan data cuaca presisi
        if (selectedWeather && selectedHotspotId) {
          const weather = selectedWeather;
          const blowTowardsDeg = (weather.windDirectionDegree + 180) % 360;
          const targetCardinalName = degreeToCardinalName(blowTowardsDeg);
          const rad = (blowTowardsDeg * Math.PI) / 180;

          // Panjang vektor proporsional terhadap kecepatan angin (2.5 km s/d 8.5 km)
          const spreadDistanceKm = Math.max(2.5, Math.min(8.5, (weather.windSpeedKmh / 10) * 3));
          const deltaLat = (spreadDistanceKm / 111) * Math.cos(rad);
          const deltaLng = (spreadDistanceKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(rad);

          const targetLat = lat + deltaLat;
          const targetLng = lng + deltaLng;

          // Garis Aliran Angin dengan Animasi Repeat
          const windLine = L.polyline([[lat, lng], [targetLat, targetLng]], {
            color: '#3B82F6',
            weight: 4.5,
            className: 'wind-flow-line-animated',
            opacity: 0.95,
          });

          // Marker Icon Baru Arah Angin Aerodinamis (Centering Presisi Sempurna dengan Line Motion)
          const arrowHtml = `
            <div class="wind-arrow-anchor-center">
              <div class="wind-pulse-ripple-repeat"></div>
              <div class="wind-pulse-ripple-repeat wind-pulse-ripple-delay"></div>
              
              <div class="wind-arrow-rotator" style="transform: rotate(${blowTowardsDeg}deg);">
                <div class="wind-flow-stream-motion">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="wind-arrow-svg-pulse">
                    <defs>
                      <linearGradient id="selectedStreamGrad" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#38BDF8" />
                        <stop offset="50%" stop-color="#2563EB" />
                        <stop offset="100%" stop-color="#1E3A8A" />
                      </linearGradient>
                      <filter id="selectedStreamGlow" x="0" y="0" width="40" height="40">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#38BDF8" flood-opacity="0.85" />
                      </filter>
                    </defs>
                    <!-- Ekor hembusan ganda melengkung -->
                    <path d="M15 34C15 34 17 27 17 23" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
                    <path d="M25 34C25 34 23 27 23 23" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
                    <!-- Kepala Aerodynamic Jet Stream tepat di sumbu tengah (x=20) -->
                    <path d="M20 4L28 22C28 22 23 19 20 19C17 19 12 22 12 22L20 4Z" fill="url(#selectedStreamGrad)" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round" filter="url(#selectedStreamGlow)"/>
                    <circle cx="20" cy="14" r="2.4" fill="#FFFFFF" />
                  </svg>
                </div>
              </div>

              <!-- Badge Kecepatan Angin Mengambang di Bawah Poros -->
              <div class="wind-floating-speed-badge">
                <span class="wind-pulse-dot"></span>
                <span>${weather.windSpeedKmh} km/j · ${weather.windDirectionCardinal}</span>
              </div>
            </div>
          `;

          const arrowIcon = L.divIcon({
            html: arrowHtml,
            className: 'wind-arrow-divicon-centered',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          const arrowMarker = L.marker([targetLat, targetLng], { icon: arrowIcon });

          const windPopupHtml = `
            <div class="wind-detail-popup">
              <div class="wind-popup-header">
                <span class="wind-popup-icon-badge">💨</span>
                <div>
                  <div style="font-weight:700;font-size:13px;color:#0f172a;">Analisis Angin & Potensi Karhutla</div>
                  <div style="font-size:10px;color:#64748b;">Sumber: Open-Meteo Real-Time</div>
                </div>
              </div>
              <div class="wind-popup-body">
                <div class="wind-stat-row">
                  <span class="ws-label">Kecepatan Angin:</span>
                  <span class="ws-val"><b>${weather.windSpeedKmh} km/jam</b></span>
                </div>
                <div class="wind-stat-row">
                  <span class="ws-label">Arah Angin Berasal:</span>
                  <span class="ws-val">${degreeToCardinalName(weather.windDirectionDegree)}</span>
                </div>
                <div class="wind-stat-highlight">
                  <div style="font-size:10px;color:#1e40af;font-weight:600;margin-bottom:2px;">Proyeksi Rambatan Api:</div>
                  <div style="font-size:12.5px;font-weight:700;color:#dc2626;">➡️ Menuju ${targetCardinalName}</div>
                </div>
                <div class="wind-stat-row">
                  <span class="ws-label">Suhu & Kelembapan:</span>
                  <span class="ws-val">${weather.temperatureCelsius}°C · ${weather.relativeHumidity}%</span>
                </div>
              </div>
            </div>
          `;

          arrowMarker.bindPopup(windPopupHtml, {
            className: 'siaganusa-wind-popup-wrapper',
            offset: [0, -22],
            closeButton: true,
            autoPan: false,
          });

          arrowMarker.openPopup();
          windLayerRef.current.addLayer(windLine);
          windLayerRef.current.addLayer(arrowMarker);
        }

        // B. Tampilkan Semua Icon Arah Angin di Seluruh Wilayah Indonesia (Disesuaikan dengan Data & Wilayah)
        // Memilih titik representatif seimbang per provinsi/wilayah agar tidak bertumpuk
        const seenLocations = new Set<string>();
        const windSamplePoints: DisasterHotspot[] = [];

        for (const h of hotspots) {
          if (!h.latitude || !h.longitude) continue;
          if (!isInsideIndonesia(h.latitude, h.longitude)) continue;
          if (h.id === selectedHotspotId) continue; // Sudah dirender di atas

          // Batasi kepadatan per grid regional saat zoom out
          const gridKey = currentZoom < 8
            ? `${Math.round(h.latitude * 1.5)}_${Math.round(h.longitude * 1.5)}_${h.province}`
            : `${Math.round(h.latitude * 4)}_${Math.round(h.longitude * 4)}`;

          if (!seenLocations.has(gridKey)) {
            seenLocations.add(gridKey);
            windSamplePoints.push(h);
            if (currentZoom < 8 && windSamplePoints.length >= 35) break;
            if (currentZoom >= 8 && windSamplePoints.length >= 120) break;
          }
        }

        windSamplePoints.forEach((point, idx) => {
          const zone = getClosestRegionalZone(point.latitude, point.longitude, regionalWeather);
          const windDeg = zone ? zone.windDirectionDegree : 110;
          const blowDeg = (windDeg + 180) % 360;
          const speed = zone ? zone.windSpeedKmh : 12;
          const cardinal = zone ? zone.windDirectionCardinal : 'ESE';
          const animDelay = ((idx % 7) * 0.25).toFixed(2);

          const regionalArrowHtml = `
            <div class="wind-regional-marker" style="animation-delay: ${animDelay}s;" title="Angin di ${point.province}: ${speed} km/j (${cardinal})">
              <div class="wind-aerodynamic-arrow" style="transform: rotate(${blowDeg}deg);">
                <div class="wind-flow-stream-motion" style="animation-delay: ${animDelay}s;">
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <linearGradient id="regGrad_${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#38BDF8" />
                        <stop offset="100%" stop-color="#2563EB" />
                      </linearGradient>
                    </defs>
                    <path d="M10 26C10 26 12 21 12 18" stroke="#93C5FD" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
                    <path d="M22 26C22 26 20 21 20 18" stroke="#93C5FD" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
                    <path d="M16 3L23 18C23 18 19 15.5 16 15.5C13 15.5 9 18 9 18L16 3Z" fill="url(#regGrad_${idx})" stroke="#FFFFFF" stroke-width="1.3" stroke-linejoin="round"/>
                    <circle cx="16" cy="11.5" r="2" fill="#FFFFFF"/>
                  </svg>
                </div>
              </div>
              <div class="wind-regional-badge">
                <span>${speed}k</span>
              </div>
            </div>
          `;

          const regIcon = L.divIcon({
            html: regionalArrowHtml,
            className: 'wind-regional-divicon',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          const regMarker = L.marker([point.latitude, point.longitude], { icon: regIcon });
          regMarker.on('click', () => {
            onHotspotClick(point);
            if (mapRef.current) {
              mapRef.current.setView([point.latitude, point.longitude], 12, { animate: true, duration: 0.8 });
            }
          });

          windLayerRef.current.addLayer(regMarker);
        });
      }
    };

    renderFireSpreadAndWind().catch(console.error);

    return () => {
      active = false;
      if (areaLayerRef.current) areaLayerRef.current.clearLayers();
      if (windLayerRef.current) windLayerRef.current.clearLayers();
    };
  }, [selectedHotspotId, hotspots, isWindLayerActive, selectedWeather, currentZoom, regionalWeather, onHotspotClick, isMapReady]);

  // ─── 3. Layer Polyline Aliran Angin Wilayah Laut Indonesia (Toggle Terpisah) ─────
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    if (seaWindLayerRef.current) {
      seaWindLayerRef.current.clearLayers();
    }

    if (!isSeaWindLayerActive) return;

    let active = true;

    const renderSeaWind = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current || !active || !seaWindLayerRef.current) return;

      INDONESIA_SEA_WIND_TRACKS.forEach((track, idx) => {
        // 1. Gambar Polyline lengkung aliran angin laut dengan animasi stroke-dashoffset repeat
        const seaLine = L.polyline(track.coordinates, {
          color: '#06B6D4',
          weight: 3.5,
          className: 'sea-wind-stream-line',
          opacity: 0.88,
          smoothFactor: 1.5,
        });

        // 2. Marker indikator di titik tengah jalur laut
        const midIdx = Math.floor(track.coordinates.length / 2);
        const midCoord = track.coordinates[midIdx];
        const animDelay = ((idx % 6) * 0.25).toFixed(2);

        const seaMarkerHtml = `
          <div class="sea-wind-marker" style="animation-delay: ${animDelay}s;" title="Pola Angin Laut: ${track.name}">
            <span class="sea-wind-marker-icon">🌊</span>
            <span class="sea-wind-pointer-arrow" style="transform: rotate(${track.defaultDegree}deg);">➔</span>
            <span>${track.name.split('(')[0].trim()}: ${track.defaultSpeedKmh} km/j</span>
          </div>
        `;

        const seaIcon = L.divIcon({
          html: seaMarkerHtml,
          className: 'sea-wind-divicon',
          iconSize: [180, 26],
          iconAnchor: [90, 13],
        });

        const seaMarker = L.marker(midCoord, { icon: seaIcon });
        seaMarker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;padding:6px;min-width:190px;">
            <div style="font-weight:700;color:#0284c7;font-size:12.5px;margin-bottom:2px;">🌊 ${track.name}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:5px;">Sektor: ${track.seaRegion}</div>
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:6px;margin-bottom:4px;font-size:11px;color:#0369a1;">
              <div>Kecepatan: <b>${track.defaultSpeedKmh} km/jam</b></div>
              <div>Arah Angin: <b>${track.defaultCardinal} (${track.defaultDegree}°)</b></div>
            </div>
            <div style="font-size:10px;color:#64748b;font-style:italic;">Pola sirkulasi angin maritim perairan kepulauan Indonesia</div>
          </div>
        `);

        seaWindLayerRef.current.addLayer(seaLine);
        seaWindLayerRef.current.addLayer(seaMarker);
      });
    };

    renderSeaWind().catch(console.error);

    return () => {
      active = false;
      if (seaWindLayerRef.current) seaWindLayerRef.current.clearLayers();
    };
  }, [isSeaWindLayerActive, isMapReady]);

  const currentHotspot = hotspots.find((h) => h.id === selectedHotspotId);

  // Hitung radius bahaya panas dan sekat basah taktis untuk HUD
  let hudRadiusKm = 1.0;
  if (currentHotspot) {
    let bboxR = 0;
    if (currentHotspot.bbox && Array.isArray(currentHotspot.bbox) && currentHotspot.bbox.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = currentHotspot.bbox;
      if (Math.abs(maxLng - minLng) > 0.001 || Math.abs(maxLat - minLat) > 0.001) {
        const dLat = Math.max(Math.abs(maxLat - currentHotspot.latitude), Math.abs(minLat - currentHotspot.latitude)) * 111;
        const dLng = Math.max(Math.abs(maxLng - currentHotspot.longitude), Math.abs(minLng - currentHotspot.longitude)) * 111 * Math.cos((currentHotspot.latitude * Math.PI) / 180);
        bboxR = Math.sqrt(dLat * dLat + dLng * dLng) * 1000;
      }
    }
    const rMeters = bboxR > 0
      ? bboxR + Math.max(1500, Math.min(5000, (currentHotspot.maxFrp ? Math.sqrt(currentHotspot.maxFrp) * 60 : 2000)))
      : Math.max(800, Math.min(4500, (currentHotspot.count || 1) * 400 + (currentHotspot.maxFrp ? Math.sqrt(currentHotspot.maxFrp) * 25 : 0)));
    hudRadiusKm = rMeters / 1000;
  }
  const hudTacticalOffset = selectedWeather ? Math.max(0.8, Math.min(4.5, (selectedWeather.windSpeedKmh / 10) * 1.5)) : 1.2;
  const hudWettingDistKm = hudRadiusKm + hudTacticalOffset;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '340px' }}>
      <div
        ref={mapContainerRef}
        id="siaganusa-map"
        style={{ width: '100%', height: '100%' }}
        aria-label="Peta titik kebakaran hutan Indonesia"
      />

      {/* ─── Telemetry HUD Floating Card di Sudut Kiri Bawah (Hanya tampil di Layar Tablet/iPad & Laptop/PC) ─── */}
      {currentHotspot && (
        <aside
          className="fire-telemetry-hud hidden md:block"
          aria-label="Panel Analisis Perambatan Api & Cuaca"
        >
          <div className="telemetry-header">
            <div className="telemetry-title">
              <span className="telemetry-flame">🔥</span>
              <div>
                <strong>{currentHotspot.locationName}</strong>
                <span className="telemetry-province">{currentHotspot.province}</span>
              </div>
            </div>
            <button
              onClick={() => onHotspotClick({ ...currentHotspot, id: '' })}
              className="telemetry-close-btn"
              aria-label="Tutup panel telemetry"
            >
              ✕
            </button>
          </div>

          <div className="telemetry-metrics">
            <div className="telemetry-item">
              <span className="telemetry-label">Daya Panas (FRP)</span>
              <strong className="telemetry-val text-brand">
                {currentHotspot.maxFrp ? `${currentHotspot.maxFrp.toFixed(1)} MW` : 'N/A'}
              </strong>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Kluster Satelit</span>
              <strong className="telemetry-val">
                {currentHotspot.count ?? 1} deteksi
              </strong>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Kecepatan Angin</span>
              <strong className="telemetry-val">
                {isLoadingWeather ? '...' : selectedWeather ? `${selectedWeather.windSpeedKmh} km/j` : 'Memuat...'}
              </strong>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Kualitas Udara</span>
              <strong
                className="telemetry-val"
                style={{
                  color: selectedAirQuality?.ispuInfo.color || 'inherit',
                }}
              >
                {isLoadingAirQuality
                  ? '...'
                  : selectedAirQuality
                  ? `ISPU ${selectedAirQuality.ispuValue} (${selectedAirQuality.ispuInfo.label})`
                  : 'N/A'}
              </strong>
            </div>
          </div>

          <div className="telemetry-footer">
            <span className="telemetry-spread-tag">
              🧭 Proyeksi Rambatan: <b>{selectedWeather ? `Menuju ${degreeToCardinalName((selectedWeather.windDirectionDegree + 180) % 360)}` : 'Menganalisis cuaca...'}</b>
            </span>
            {selectedWeather && (
              <span className="telemetry-wetting-tag">
                🛡️ Sekat Basah: <b>~{hudWettingDistKm.toFixed(1)} km</b> arah {degreeToCardinalName((selectedWeather.windDirectionDegree + 180) % 360)}
              </span>
            )}
            {selectedAirQuality && (
              <span className="telemetry-ispu-mask-tag">
                😷 Masker: <b>{selectedAirQuality.ispuInfo.maskRecommendation}</b>
              </span>
            )}
          </div>
        </aside>
      )}

      {/* Petunjuk Zoom jika layer angin aktif tapi sedang zoom out jauh */}
      {isWindLayerActive && !currentHotspot && currentZoom < WIND_ZOOM_THRESHOLD && (
        <div className="wind-zoom-hint" aria-live="polite">
          <span>💨 Zoom in atau klik titik api untuk melihat aliran angin</span>
        </div>
      )}
    </div>
  );
}
