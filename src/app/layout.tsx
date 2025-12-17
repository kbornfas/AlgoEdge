import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme';

export const metadata: Metadata = {
  title: "AlgoEdge - AI-Powered Trading Platform",
  description: "Automated Forex Trading with MetaTrader 5 Integration",
  keywords: "forex trading, automated trading, mt5, trading bot, algoedge",
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
