import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Trading APIs for Algorithmic Trading 2026: Developer Guide | AlgoEdge',
  description: 'Compare the top trading APIs for building automated trading systems. Real-time market data, historical prices, WebSocket streaming, and everything developers need.',
  keywords: 'trading API, algorithmic trading API, forex API, market data API, trading bot API, automated trading API, WebSocket trading, real-time market data',
  openGraph: {
    title: 'Best Trading APIs for Algorithmic Trading 2026',
    description: 'Complete developer guide to trading APIs for automated systems',
    type: 'article',
    url: 'https://algoedgehub.com/blog/best-trading-api-2026',
    publishedTime: '2026-01-25T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Trading APIs 2026',
    description: 'Developer guide to algorithmic trading APIs',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/best-trading-api-2026',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
