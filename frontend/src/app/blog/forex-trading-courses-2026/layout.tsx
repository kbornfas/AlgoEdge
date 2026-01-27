import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Forex Trading Courses & Education 2026: Learning Guide | AlgoEdge',
  description: 'Master forex trading with the best courses, ebooks, and educational resources. Compare top-rated programs and start your journey to profitable trading.',
  keywords: 'forex trading courses, forex education, best forex courses 2026, learn forex trading, trading courses, forex training, forex ebooks, trading education',
  openGraph: {
    title: 'Best Forex Trading Courses & Education 2026',
    description: 'Complete learning guide for forex trading education',
    type: 'article',
    url: 'https://algoedgehub.com/blog/forex-trading-courses-2026',
    publishedTime: '2026-01-25T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Forex Trading Courses 2026',
    description: 'Complete learning guide for beginners to pros',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/forex-trading-courses-2026',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
