/**
 * @file app/page.tsx
 * @description Halaman utama SiagaNusa - Karhutla Watch.
 * Merakit seluruh komponen: Header, DisasterMap, Floating Controls, dan DisasterTable.
 * Ini adalah Server Component yang me-render Client Components di bawahnya.
 */

import type { Metadata } from 'next';
import KarhutlaWatchClient from '@/components/KarhutlaWatchClient';

export const metadata: Metadata = {
  title: 'SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time',
  description:
    'Platform pemantauan titik api (hotspot) kebakaran hutan dan lahan Indonesia secara real-time menggunakan data satelit VIIRS & MODIS dari API KANARI. Pantau persebaran karhutla, arah angin, dan prakiraan cuaca.',
  keywords: 'kebakaran hutan, karhutla, titik api, hotspot indonesia, pemantauan bencana, VIIRS, MODIS, kabut asap',
  openGraph: {
    title: 'SiagaNusa – Karhutla Watch Indonesia',
    description: 'Pemantauan titik api kebakaran hutan Indonesia real-time',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function HomePage() {
  return <KarhutlaWatchClient />;
}
