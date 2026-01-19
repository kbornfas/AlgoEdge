import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best XAUUSD Strategy 2026: Complete Gold Trading Guide | AlgoEdge',
  description: 'Discover the most profitable XAUUSD (Gold) trading strategies for 2026. Learn AI-powered gold trading techniques with 94%+ win rates. Complete guide for beginners and pros.',
  keywords: 'XAUUSD strategy, gold trading, XAUUSD trading strategy 2026, best gold trading strategy, forex gold trading, automated gold trading, gold trading bot',
  openGraph: {
    title: 'Best XAUUSD Strategy 2026: Complete Gold Trading Guide',
    description: 'Learn the most profitable gold trading strategies used by professional traders',
    type: 'article',
    url: 'https://algoedgehub.com/blog/best-xauusd-strategy-2026',
    publishedTime: '2026-01-15T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best XAUUSD Strategy 2026',
    description: 'Complete gold trading guide with AI-powered strategies',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/best-xauusd-strategy-2026',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
