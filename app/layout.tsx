import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marvel Marathon – Road to Doomsday",
  description: "Melis & Justis Marvel-Marathon bis Avengers: Doomsday",
};

export const viewport: Viewport = { themeColor: "#ec1d24", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@500;600;700&display=swap"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23ec1d24'/><text x='32' y='48' font-family='Impact' font-size='44' fill='white' text-anchor='middle'>M</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
