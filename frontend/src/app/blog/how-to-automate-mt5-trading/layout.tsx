import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Automate MT5 Trading: Step-by-Step Guide 2026 | AlgoEdge',
  description: 'Complete guide to automating your MetaTrader 5 trading. Learn how to connect MT5 to AI-powered trading bots and start earning passive income. Step-by-step setup instructions.',
  keywords: 'MT5 automation, automate MT5 trading, MetaTrader 5 bot, MT5 trading bot, automated forex trading, MT5 API, expert advisors, algo trading MT5',
  openGraph: {
    title: 'How to Automate MT5 Trading: Complete Guide 2026',
    description: 'Learn to automate your MetaTrader 5 trading with AI-powered bots',
    type: 'article',
    url: 'https://algoedgehub.com/blog/how-to-automate-mt5-trading',
    publishedTime: '2026-01-12T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Automate MT5 Trading',
    description: 'Complete step-by-step guide to MT5 automation',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/how-to-automate-mt5-trading',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
