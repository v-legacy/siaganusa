/**
 * @file hooks/useDisasterData.ts
 * @description Custom React hook untuk pengambilan dan manajemen state data
 * titik api / hotspot kebakaran dari internal API /api/hotspots.
 *
 * Fitur:
 * - Auto-fetch saat mount dan setiap interval (default: 10 menit)
 * - State: loading, error, data, summary
 * - Refresh manual
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DisasterHotspot, HotspotSummary } from '@/types/disaster';
import { isInsideIndonesia } from '@/lib/indonesiaBounds';

const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 menit

interface UseDisasterDataReturn {
  hotspots: DisasterHotspot[];
  summary: HotspotSummary | null;
  isLoading: boolean;
  error: string | null;
  dataSource: string;
  fetchedAt: string | null;
  refresh: () => void;
}

export function useDisasterData(): UseDisasterDataReturn {
  const [hotspots, setHotspots] = useState<DisasterHotspot[]>([]);
  const [summary, setSummary] = useState<HotspotSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Gunakan ref untuk menghindari stale closure di interval
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    // Cegah fetch bersamaan (race condition)
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const endpoint = isRefresh ? '/api/hotspots?refresh=true' : '/api/hotspots';
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Gagal mengambil data: HTTP ${response.status}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error('Response API menunjukkan kegagalan.');
      }

      const rawHotspots: DisasterHotspot[] = Array.isArray(json.data) ? json.data : [];
      // Pertahanan berlapis: eliminasi titik di luar NKRI
      const validHotspots = rawHotspots.filter((h) => isInsideIndonesia(h.latitude, h.longitude));

      setError(null);
      setHotspots(validHotspots);
      setSummary({
        total: validHotspots.length,
        high: validHotspots.filter((h) => h.confidence === 'HIGH').length,
        medium: validHotspots.filter((h) => h.confidence === 'MEDIUM').length,
        low: validHotspots.filter((h) => h.confidence === 'LOW').length,
        lastUpdated: json.summary?.lastUpdated || new Date().toISOString(),
      });
      setDataSource(json.source);
      setFetchedAt(json.fetchedAt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      console.error('[useDisasterData] Error:', msg);
      setError(msg);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Fetch pertama kali
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Auto-refetch setiap interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchData(true);
  }, [fetchData]);

  return { hotspots, summary, isLoading, error, dataSource, fetchedAt, refresh };
}
