/**
 * @file components/map/DisasterMap.tsx
 * @description Wrapper komponen peta yang menangani dynamic import Leaflet (ssr: false).
 * Menggunakan next/dynamic dengan ssr: false karena Leaflet memerlukan window object.
 */

'use client';

import dynamic from 'next/dynamic';
import type { DisasterHotspot } from '@/types/disaster';
import type { LocationWeather, RegionalZone } from '@/types/weather';
import type { AirQualityData } from '@/types/airQuality';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export interface DisasterMapProps {
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

export default function DisasterMap(props: DisasterMapProps) {
  return <LeafletMapInner {...props} />;
}

/** Skeleton loader untuk peta saat module Leaflet belum dimuat */
function MapSkeleton() {
  return (
    <div className="map-skeleton" aria-label="Peta sedang dimuat...">
      <div className="map-skeleton__pulse" />
      <div className="map-skeleton__text">
        <span className="map-skeleton__icon">🗺️</span>
        <p>Memuat peta Indonesia...</p>
      </div>
    </div>
  );
}
