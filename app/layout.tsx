import type { Metadata, Viewport } from "next";
import { Crimson_Pro, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ぬいすも",
  description: "ぬいぐるみたちの喫煙所",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ぬいすも",
    description: "ぬいぐるみたちの喫煙所",
    images: [{ url: "/ogp.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ぬいすも",
    description: "ぬいぐるみたちの喫煙所",
    images: ["/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${crimsonPro.variable} ${sourceSerif4.variable} antialiased`} style={{ fontFamily: "var(--font-source-serif-4), serif" }}>
        {children}
      </body>
    </html>
  );
}
