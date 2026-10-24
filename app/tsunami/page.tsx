import type { Metadata } from 'next';
import TsunamiComingSoonClient from '@/components/tsunami/TsunamiComingSoonClient';

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
  },
};

export default function TsunamiSimulatorPage() {
  return <TsunamiComingSoonClient />;
}
