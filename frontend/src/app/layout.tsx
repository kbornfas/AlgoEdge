import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from '@/context/ThemeContext';

const GA_MEASUREMENT_ID = "G-N3C6NNCLVL";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a0f1a',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://algoedgehub.com'),
  title: {
    default: "AlgoEdge - AI-Powered Automated Forex Trading Platform",
    template: "%s | AlgoEdge",
  },
  description: "AlgoEdge is the leading AI-powered automated forex trading platform. Connect your MT5 account and let our 12+ intelligent trading robots trade XAUUSD, EURUSD, GBPUSD and more with up to 84% win rate. Start trading smarter today!",
  keywords: [
    "forex trading",
    "automated trading",
    "trading bot",
    "forex robot",
    "mt5 trading",
    "metatrader 5",
    "algorithmic trading",
    "gold trading",
    "xauusd trading",
    "ai trading",
    "copy trading",
    "forex signals",
    "trading platform",
    "algoedge",
    "automated forex",
    "trading robots",
    "forex automation",
    "currency trading",
    "online trading",
    "smart trading"
  ],
  authors: [{ name: "AlgoEdge", url: "https://algoedgehub.com" }],
  creator: "AlgoEdge Trading Platform",
  publisher: "AlgoEdge",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://algoedgehub.com',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://algoedgehub.com",
    title: "AlgoEdge - AI-Powered Automated Forex Trading Platform",
    description: "Connect your MT5 account and let our intelligent trading robots trade for you. 12+ AI robots, up to 84% win rate, real-time P/L tracking.",
    siteName: "AlgoEdge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AlgoEdge - Automated Forex Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlgoEdge - AI-Powered Automated Forex Trading",
    description: "Connect your MT5 and let AI trade for you. 12+ robots, up to 84% win rate!",
    images: ["/og-image.png"],
    creator: "@algoedge",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/images/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/images/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  category: "Finance",
  verification: {
    google: "ADD_YOUR_GOOGLE_VERIFICATION_CODE_HERE",
    // Get this from Google Search Console: https://search.google.com/search-console
    // 1. Add property > URL prefix > https://algoedgehub.com
    // 2. Choose "HTML tag" verification method
    // 3. Copy the content value (looks like: "abc123xyz...")
    // 4. Replace ADD_YOUR_GOOGLE_VERIFICATION_CODE_HERE with that value
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: 'transparent' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
