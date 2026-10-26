import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PwaProvider from "@/components/pwa/PwaProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://siaganusa-app.levy-studios.site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time",
    template: "%s | SiagaNusa",
  },
  description:
    "Platform pemantauan titik api (hotspot) kebakaran hutan dan lahan (Karhutla) Indonesia secara real-time via data satelit NASA VIIRS & MODIS. Pantau peta interaktif, arah angin, dan kualitas udara ISPU.",
  applicationName: "SiagaNusa",
  authors: [{ name: "SiagaNusa", url: SITE_URL }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SiagaNusa",
  },
  keywords: [
    "SiagaNusa",
    "kebakaran hutan",
    "karhutla",
    "titik api",
    "hotspot indonesia",
    "pemantauan bencana",
    "NASA FIRMS",
    "satelit VIIRS",
    "satelit MODIS",
    "kabut asap",
    "ISPU",
    "arah angin",
    "BMKG",
    "BNPB",
    "Manggala Agni",
  ],
  creator: "SiagaNusa",
  publisher: "SiagaNusa",
  category: "Disaster Monitoring",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "SiagaNusa",
    title: "SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time",
    description:
      "Pantau persebaran titik api karhutla, radius bahaya panas & asap, arah angin Open-Meteo, dan indeks ISPU secara langsung untuk seluruh wilayah Indonesia.",
    images: [
      {
        url: `${SITE_URL}/images/og-siaganusa.jpg?v=2`,
        secureUrl: `${SITE_URL}/images/og-siaganusa.jpg?v=2`,
        width: 1200,
        height: 630,
        alt: "SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SiagaNusa – Pemantauan Kebakaran Hutan & Lahan Indonesia Real-Time",
    description:
      "Pantau persebaran titik api karhutla, radius bahaya panas & asap, arah angin Open-Meteo, dan indeks ISPU secara langsung untuk seluruh wilayah Indonesia.",
    images: [`${SITE_URL}/images/og-siaganusa.jpg?v=2`],
    creator: "@levystudios",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* PWA iOS Standalone Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SiagaNusa" />
        <meta name="format-detection" content="telephone=no" />

        {/* iOS Apple Touch Icons (All Retinas & iPads) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />

        {/* iOS Splash Screens (Apple Touch Startup Images) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179-2556.jpg"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1290-2796.jpg"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750-1334.jpg"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-screen.jpg" />

        {/* Preconnect ke tile server OpenStreetMap.
            Tanpa crossOrigin: tile Leaflet dimuat sebagai <img> non-CORS, sehingga
            koneksi CORS tidak akan pernah dipakai ulang oleh request tile. */}
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        {/* Preload tile pusat peta Indonesia (Zoom 5, x=26, y=16) yang terbukti menjadi elemen LCP utama */}
        <link
          rel="preload"
          as="image"
          href="https://tile.openstreetmap.org/5/26/16.png"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="https://tile.openstreetmap.org/5/25/16.png"
          fetchPriority="high"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}

