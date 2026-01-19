import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AlgoEdge Blog - Forex Trading Strategies & MT5 Automation Guides',
  description: 'Learn proven forex trading strategies, MT5 automation tips, and how to maximize profits with AI-powered trading bots. Expert guides for beginners and pros.',
  keywords: 'forex trading, MT5 automation, trading bots, XAUUSD strategy, gold trading, automated trading, forex signals',
  openGraph: {
    title: 'AlgoEdge Blog - Forex Trading Strategies & Guides',
    description: 'Expert forex trading guides and MT5 automation tutorials',
    type: 'website',
    url: 'https://algoedgehub.com/blog',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
