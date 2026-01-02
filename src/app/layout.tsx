import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';

export const metadata: Metadata = {
  title: "AlgoEdge - Automated Forex Trading Platform",
  description: "Professional automated forex trading with MetaTrader 5 integration. 10 high-performance trading robots, real-time monitoring, and advanced analytics.",
  keywords: ["forex trading", "automated trading", "mt5", "trading bot", "algoedge", "algorithmic trading", "forex robots", "trading platform"],
  authors: [{ name: "AlgoEdge" }],
  creator: "AlgoEdge",
  publisher: "AlgoEdge",
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "AlgoEdge - Automated Forex Trading Platform",
    description: "Professional automated forex trading with MetaTrader 5 integration",
    siteName: "AlgoEdge",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlgoEdge - Automated Forex Trading Platform",
    description: "Professional automated forex trading with MetaTrader 5 integration",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
