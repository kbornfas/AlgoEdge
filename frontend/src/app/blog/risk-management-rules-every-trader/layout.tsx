import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '5 Risk Management Rules Every Forex Trader Must Follow | AlgoEdge',
  description: 'Protect your capital with essential risk management strategies. Learn position sizing, stop losses, and the 2% rule for long-term trading success.',
  keywords: 'risk management forex, trading risk management, position sizing, stop loss strategy, 2% rule trading, forex risk rules, protect trading capital, money management',
  openGraph: {
    title: '5 Risk Management Rules Every Forex Trader Must Follow',
    description: 'Essential risk management strategies for long-term trading success',
    type: 'article',
    url: 'https://algoedgehub.com/blog/risk-management-rules-every-trader',
    publishedTime: '2026-01-18T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Risk Management Rules for Traders',
    description: 'Protect your capital with these essential strategies',
  },
  alternates: {
    canonical: 'https://algoedgehub.com/blog/risk-management-rules-every-trader',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
