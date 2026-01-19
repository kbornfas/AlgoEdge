import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Forex Bots for Beginners 2026: Top 5 Automated Trading Systems | AlgoEdge',
  description: 'Discover the best forex trading bots for beginners in 2026. Comprehensive review of top 5 automated trading systems including features, costs, win rates, and honest pros/cons.',
  keywords: 'best forex bots, forex trading bot, automated forex trading, forex robot, EA forex, forex bot for beginners, best forex EA 2026, forex automation',
  openGraph: {
    title: 'Best Forex Bots for Beginners 2026: Top 5 Review',
    description: 'Comprehensive review of the top 5 forex trading bots for beginners',
    type: 'article',
    url: 'https://algoedgehub.com/blog/best-forex-bots-for-beginners',
    publishedTime: '2026-01-10T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Forex Bots for Beginners 2026',
    description: 'Top 5 automated trading systems reviewed',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/best-forex-bots-for-beginners',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
