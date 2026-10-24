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

export const metadata: Metadata = {
  title: {
    default: "SiagaNusa – Pemantauan Bencana Indonesia Real-Time",
    template: "%s | SiagaNusa",
  },
  description:
    "Platform pemantauan titik api kebakaran hutan dan lahan Indonesia secara real-time menggunakan data satelit dari API KANARI.",
  metadataBase: new URL("https://siaganusa.vercel.app"),
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
