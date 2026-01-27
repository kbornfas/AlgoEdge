import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trading Psychology: Overcoming Fear and Greed in Forex | AlgoEdge',
  description: 'Master the mental game of trading. Learn how to overcome fear, manage greed, and develop the disciplined mindset needed for consistent forex profits.',
  keywords: 'trading psychology, forex psychology, overcoming fear trading, trading emotions, greed in trading, disciplined trading, mental game forex, trader mindset',
  openGraph: {
    title: 'Trading Psychology: Overcoming Fear and Greed',
    description: 'Master the mental game of forex trading',
    type: 'article',
    url: 'https://algoedgehub.com/blog/trading-psychology-overcoming-fear-greed',
    publishedTime: '2026-01-20T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Psychology Guide',
    description: 'Overcome fear and greed for consistent profits',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/trading-psychology-overcoming-fear-greed',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
