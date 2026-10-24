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
    'Platform pemantauan titik api (hotspot) kebakaran hutan dan lahan Indonesia secara real-time menggunakan data satelit NASA VIIRS & MODIS dari API KANARI. Pantau persebaran karhutla, arah angin live, dan indeks kualitas udara ISPU.',
  keywords: [
    'kebakaran hutan',
    'karhutla',
    'titik api',
    'hotspot indonesia',
    'pemantauan bencana',
    'NASA FIRMS',
    'VIIRS',
    'MODIS',
    'kabut asap',
    'ISPU',
    'arah angin',
    'SiagaNusa',
  ],
  alternates: {
    canonical: 'https://siaganusa.vercel.app',
  },
  openGraph: {
    title: 'SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time',
    description:
      'Pantau persebaran titik api karhutla, radius bahaya panas & asap, arah angin Open-Meteo, dan indeks ISPU secara langsung untuk seluruh wilayah Indonesia.',
    url: 'https://siaganusa.vercel.app',
    siteName: 'SiagaNusa',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/images/og-siaganusa.jpg',
        width: 1376,
        height: 768,
        alt: 'SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time',
    description:
      'Pantau persebaran titik api karhutla, radius bahaya panas & asap, arah angin Open-Meteo, dan indeks ISPU secara langsung untuk seluruh wilayah Indonesia.',
    images: ['/images/og-siaganusa.jpg'],
    creator: '@levystudios',
  },
};

export default function HomePage() {
  return <KarhutlaWatchClient />;
}
