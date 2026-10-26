import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SiagaNusa – Pemantauan Bencana Real-Time',
    short_name: 'SiagaNusa',
    description:
      'Platform pemantauan bencana alam, kebakaran hutan & lahan (karhutla), simulator tsunami, arah angin, dan kualitas udara Indonesia.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'window-controls-overlay'],
    orientation: 'portrait-primary',
    background_color: '#070d18',
    theme_color: '#070d18',
    lang: 'id',
    dir: 'ltr',
    categories: ['weather', 'news', 'utilities', 'navigation'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Karhutla Watch',
        short_name: 'Karhutla',
        description: 'Pantau titik api dan kebakaran hutan real-time',
        url: '/',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Simulator Tsunami',
        short_name: 'Tsunami',
        description: 'Simulasi penjalaran gelombang tsunami nusantara',
        url: '/tsunami',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
