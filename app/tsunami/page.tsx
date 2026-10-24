import type { Metadata } from 'next';
import TsunamiComingSoonClient from '@/components/tsunami/TsunamiComingSoonClient';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://siaganusa-app.levy-studios.site';

export const metadata: Metadata = {
  title: 'Simulator Tsunami Nusantara – Pemodelan Gelombang Megathrust & Inundasi Pesisir',
  description:
    'Simulasi interaktif hidrodinamika rambatan gelombang tsunami, deformasi sesar lempeng megathrust bawah laut, estimasi waktu tiba (ETA), dan proyeksi peta zona rendaman pesisir Indonesia.',
  keywords: [
    'Simulator Tsunami',
    'Tsunami Indonesia',
    'Simulasi Megathrust',
    'Gelombang Tsunami',
    'Inundasi Pesisir',
    'Mitigasi Bencana Bahari',
    'BMKG Tsunami',
    'SiagaNusa',
  ],
  openGraph: {
    title: 'Simulator Tsunami Nusantara – SiagaNusa',
    description:
      'Platform numerik interaktif memodelkan penjalaran gelombang tsunami dari patahan megathrust laut dalam hingga proyeksi zona rendaman permukiman.',
    type: 'website',
    url: `${SITE_URL}/tsunami`,
    siteName: 'SiagaNusa',
    locale: 'id_ID',
    images: [
      {
        url: `${SITE_URL}/images/og-siaganusa.jpg?v=2`,
        secureUrl: `${SITE_URL}/images/og-siaganusa.jpg?v=2`,
        width: 1200,
        height: 630,
        alt: 'Simulator Tsunami Nusantara – SiagaNusa',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulator Tsunami Nusantara – SiagaNusa',
    description:
      'Platform numerik interaktif memodelkan penjalaran gelombang tsunami dari patahan megathrust laut dalam hingga proyeksi zona rendaman permukiman.',
    images: [`${SITE_URL}/images/og-siaganusa.jpg?v=2`],
    creator: '@levystudios',
  },
};

export default function TsunamiSimulatorPage() {
  return <TsunamiComingSoonClient />;
}
