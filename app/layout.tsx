import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
  generator: "Next.js",
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
