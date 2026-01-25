'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Button,
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Quote,
  Star,
  TrendingUp,
  Shield,
  Users,
  Award,
  ArrowLeft,
  CheckCircle,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  image?: string;
  rating: number;
  text: string;
  profit?: string;
  tradingPeriod: string;
  plan: 'Weekly' | 'Monthly' | 'Quarterly';
  verified: boolean;
  date: string;
  category: 'beginner' | 'experienced' | 'professional';
}

// Profile images for testimonials
const profileImages: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  4: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  5: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  6: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  7: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  8: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
  9: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  10: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
  11: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
  12: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
  13: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop&crop=face',
  14: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  15: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
  16: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face',
  17: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face',
  18: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=100&h=100&fit=crop&crop=face',
  19: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&crop=face',
  20: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face',
  21: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face',
  22: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face',
  23: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop&crop=face',
  24: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=100&h=100&fit=crop&crop=face',
  25: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop&crop=face',
  26: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=100&h=100&fit=crop&crop=face',
  27: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=face',
  28: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=100&h=100&fit=crop&crop=face',
  29: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face',
  30: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face',
  31: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face',
  32: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&crop=face',
  33: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=100&h=100&fit=crop&crop=face',
  34: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  35: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop&crop=face',
  36: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&crop=face',
  37: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=100&h=100&fit=crop&crop=face',
  38: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face',
  39: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100&h=100&fit=crop&crop=face',
  40: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=100&h=100&fit=crop&crop=face',
};

const testimonials: Testimonial[] = [
  // North America
  {
    id: 1,
    name: 'Michael Chen',
    location: 'New York, USA',
    avatar: 'MC',
    rating: 5,
    text: 'AlgoEdge completely changed my trading game. I was skeptical about automated trading at first, but after seeing consistent profits over 3 months, I\'m a believer. The risk management features saved me during volatile market days.',
    profit: '+32%',
    tradingPeriod: '6 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 2,
    name: 'Robert Johnson',
    location: 'Texas, USA',
    avatar: 'RJ',
    rating: 5,
    text: 'Finally, an automated trading system that actually works! The risk management is excellent - I set my limits and the bots respect them. My account has grown steadily.',
    profit: '+29%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'experienced',
  },
  {
    id: 3,
    name: 'David Miller',
    location: 'Vancouver, Canada',
    avatar: 'DM',
    rating: 5,
    text: 'The analytics dashboard is a game-changer. I can see exactly how each robot performs and adjust my strategy accordingly. The transparency is refreshing in this industry.',
    profit: '+41%',
    tradingPeriod: '6 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 4,
    name: 'Jennifer Martinez',
    location: 'California, USA',
    avatar: 'JM',
    rating: 5,
    text: 'As a busy professional, I don\'t have time to watch charts all day. AlgoEdge handles everything for me. My portfolio has seen consistent growth with minimal effort on my part.',
    profit: '+26%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 5,
    name: 'William Thompson',
    location: 'Toronto, Canada',
    avatar: 'WT',
    rating: 4,
    text: 'Good platform with solid execution. The Telegram notifications keep me updated on all trades. Would love to see more currency pairs in the future.',
    profit: '+18%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 6,
    name: 'Emily Davis',
    location: 'Chicago, USA',
    avatar: 'ED',
    rating: 5,
    text: 'The kill switch feature is brilliant! It protected my account during a flash crash last month. Customer support is also incredibly responsive.',
    profit: '+35%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  // Europe
  {
    id: 7,
    name: 'Sarah Williams',
    location: 'London, UK',
    avatar: 'SW',
    rating: 5,
    text: 'As someone new to forex trading, AlgoEdge made it incredibly easy to get started. The robots handle everything, and I just check my dashboard daily. Best investment I\'ve made!',
    profit: '+18%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 8,
    name: 'Anna Müller',
    location: 'Berlin, Germany',
    avatar: 'AM',
    rating: 4,
    text: 'Solid platform with good performance. The partial profit-taking feature helped me lock in gains during uncertain markets. Would love to see more educational content.',
    profit: '+19%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 9,
    name: 'Emma Rodriguez',
    location: 'Madrid, Spain',
    avatar: 'ER',
    rating: 4,
    text: 'Very impressed with the platform. The risk management features protected my account during high volatility. Only giving 4 stars because I wish there were more crypto pairs.',
    profit: '+22%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'experienced',
  },
  {
    id: 10,
    name: 'Pierre Dubois',
    location: 'Paris, France',
    avatar: 'PD',
    rating: 5,
    text: 'Excellent platform! The multi-timeframe analysis is sophisticated and the entry points are incredibly accurate. I\'ve been trading for 10 years and this is one of the best tools I\'ve used.',
    profit: '+44%',
    tradingPeriod: '6 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 11,
    name: 'Marco Rossi',
    location: 'Milan, Italy',
    avatar: 'MR',
    rating: 5,
    text: 'The scalping robot performs exceptionally during European sessions. Consistent small gains that add up significantly over time. Very satisfied with the results.',
    profit: '+31%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 12,
    name: 'Sophie Anderson',
    location: 'Stockholm, Sweden',
    avatar: 'SA',
    rating: 5,
    text: 'Started skeptical but now I\'m a true believer. The transparency and detailed trade logs give me confidence in the system. Highly recommended!',
    profit: '+27%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'beginner',
  },
  {
    id: 13,
    name: 'Jan Kowalski',
    location: 'Warsaw, Poland',
    avatar: 'JK',
    rating: 5,
    text: 'The best forex automation I\'ve tried. Simple setup, clear dashboard, and consistent results. The support team is also very helpful.',
    profit: '+23%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 14,
    name: 'Elena Petrova',
    location: 'Amsterdam, Netherlands',
    avatar: 'EP',
    rating: 4,
    text: 'Good returns with minimal effort. The platform is user-friendly and the bots run smoothly 24/7. Looking forward to new features.',
    profit: '+20%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'beginner',
  },
  {
    id: 15,
    name: 'Thomas Berg',
    location: 'Zurich, Switzerland',
    avatar: 'TB',
    rating: 5,
    text: 'Professional-grade trading automation at an affordable price. The risk-to-reward ratios are well-calibrated. My portfolio thanks AlgoEdge.',
    profit: '+38%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  // Asia Pacific
  {
    id: 16,
    name: 'James Thompson',
    location: 'Sydney, Australia',
    avatar: 'JT',
    rating: 5,
    text: 'I\'ve tried many trading bots before, and AlgoEdge is by far the best. The multi-timeframe analysis is sophisticated, and the entry points are incredibly accurate.',
    profit: '+38%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 17,
    name: 'Lisa Park',
    location: 'Seoul, South Korea',
    avatar: 'LP',
    rating: 5,
    text: 'Started with the weekly plan to test, now I\'m a quarterly subscriber. The consistency is remarkable. I can finally focus on my job without constantly monitoring charts.',
    profit: '+27%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 18,
    name: 'Kenji Tanaka',
    location: 'Tokyo, Japan',
    avatar: 'KT',
    rating: 5,
    text: 'The precision of the trading algorithms is impressive. Works especially well during Asian session. My account has grown steadily since I started.',
    profit: '+33%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 19,
    name: 'Priya Sharma',
    location: 'Mumbai, India',
    avatar: 'PS',
    rating: 5,
    text: 'AlgoEdge has been a game-changer for my trading journey. The automated system handles everything while I focus on my business. Excellent returns!',
    profit: '+25%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 20,
    name: 'Wei Chen',
    location: 'Singapore',
    avatar: 'WC',
    rating: 5,
    text: 'As a professional trader, I appreciate the sophisticated algorithms. The risk management features are top-notch and have protected my capital during volatile periods.',
    profit: '+42%',
    tradingPeriod: '6 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 21,
    name: 'Nguyen Van Minh',
    location: 'Ho Chi Minh, Vietnam',
    avatar: 'NM',
    rating: 4,
    text: 'Good platform with reliable execution. The Telegram alerts are very helpful. Would recommend for anyone looking to automate their trading.',
    profit: '+21%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'experienced',
  },
  {
    id: 22,
    name: 'Sarah Lim',
    location: 'Kuala Lumpur, Malaysia',
    avatar: 'SL',
    rating: 5,
    text: 'The robots work flawlessly 24/7. I\'ve seen steady profits since starting 4 months ago. The customer support is also very responsive.',
    profit: '+29%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 23,
    name: 'Raj Patel',
    location: 'Delhi, India',
    avatar: 'RP',
    rating: 5,
    text: 'Excellent value for money! The quarterly plan is very affordable and the returns have been consistent. Highly recommend for new traders.',
    profit: '+24%',
    tradingPeriod: '3 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'beginner',
  },
  {
    id: 24,
    name: 'Andrew Tan',
    location: 'Manila, Philippines',
    avatar: 'AT',
    rating: 4,
    text: 'Solid trading platform with good automation. The analytics help me understand my trading performance better. Would love more customization options.',
    profit: '+17%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  // Middle East & Africa
  {
    id: 25,
    name: 'Ahmed Hassan',
    location: 'Dubai, UAE',
    avatar: 'AH',
    rating: 5,
    text: 'The Telegram alerts are fantastic! I\'m always informed about trades in real-time. The scalping robot performs exceptionally well during London sessions.',
    profit: '+45%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 26,
    name: 'Mohammed Al-Rashid',
    location: 'Riyadh, Saudi Arabia',
    avatar: 'MA',
    rating: 5,
    text: 'Excellent platform with professional-grade features. The risk management tools have protected my investments during market volatility.',
    profit: '+36%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 27,
    name: 'Fatima Al-Khouri',
    location: 'Abu Dhabi, UAE',
    avatar: 'FK',
    rating: 5,
    text: 'Started trading with no experience, and AlgoEdge made it so simple. The automated bots handle everything. My returns have exceeded my expectations!',
    profit: '+22%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 28,
    name: 'Oluwaseun Adeyemi',
    location: 'Lagos, Nigeria',
    avatar: 'OA',
    rating: 5,
    text: 'AlgoEdge has transformed my trading experience. The platform is reliable and the profits have been consistent. Great customer support too!',
    profit: '+28%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 29,
    name: 'Thabo Molefe',
    location: 'Johannesburg, South Africa',
    avatar: 'TM',
    rating: 4,
    text: 'Good returns with minimal monitoring needed. The platform is user-friendly and the bots perform consistently well.',
    profit: '+19%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'beginner',
  },
  {
    id: 30,
    name: 'Hassan El-Mahdi',
    location: 'Cairo, Egypt',
    avatar: 'HM',
    rating: 5,
    text: 'The multi-strategy approach works brilliantly. Different robots for different market conditions means consistent performance across all sessions.',
    profit: '+31%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 31,
    name: 'Amina Okonkwo',
    location: 'Accra, Ghana',
    avatar: 'AO',
    rating: 5,
    text: 'I was skeptical at first but the results speak for themselves. Consistent profits every month. The affiliate program is also a nice bonus!',
    profit: '+26%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'January 2026',
    category: 'beginner',
  },
  {
    id: 32,
    name: 'Yusuf Ibrahim',
    location: 'Nairobi, Kenya',
    avatar: 'YI',
    rating: 5,
    text: 'AlgoEdge delivers exactly what it promises. Automated trading that actually works. My account has grown significantly since I started.',
    profit: '+34%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  // Latin America
  {
    id: 33,
    name: 'Carlos Silva',
    location: 'São Paulo, Brazil',
    avatar: 'CS',
    rating: 5,
    text: 'Excelente plataforma! The robots perform well across all market conditions. My trading has become completely hands-off and profitable.',
    profit: '+30%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 34,
    name: 'Maria Garcia',
    location: 'Mexico City, Mexico',
    avatar: 'MG',
    rating: 5,
    text: 'Started with zero trading knowledge. AlgoEdge\'s automated system made it possible for me to earn passive income. Absolutely recommend!',
    profit: '+21%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'January 2026',
    category: 'beginner',
  },
  {
    id: 35,
    name: 'Diego Fernandez',
    location: 'Buenos Aires, Argentina',
    avatar: 'DF',
    rating: 4,
    text: 'Good platform with reliable execution. The risk management features give me peace of mind. Looking forward to more features in the future.',
    profit: '+23%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'experienced',
  },
  {
    id: 36,
    name: 'Isabella Morales',
    location: 'Bogotá, Colombia',
    avatar: 'IM',
    rating: 5,
    text: 'The best investment I\'ve made this year. The bots run 24/7 and I just watch my account grow. Customer support is also excellent.',
    profit: '+27%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 37,
    name: 'Lucas Oliveira',
    location: 'Rio de Janeiro, Brazil',
    avatar: 'LO',
    rating: 5,
    text: 'Professional-grade trading automation at an affordable price. The scalping strategies work particularly well during high volatility periods.',
    profit: '+39%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 38,
    name: 'Andrea Torres',
    location: 'Lima, Peru',
    avatar: 'AT',
    rating: 4,
    text: 'Reliable platform with consistent results. The Telegram alerts keep me informed about every trade. Would recommend to anyone starting out.',
    profit: '+18%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  // Additional testimonials
  {
    id: 39,
    name: 'Alexander Volkov',
    location: 'Moscow, Russia',
    avatar: 'AV',
    rating: 5,
    text: 'The algorithmic precision is remarkable. Every trade is calculated and executed with perfect timing. My profits have been consistently growing.',
    profit: '+37%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 40,
    name: 'Chen Wei Ming',
    location: 'Hong Kong',
    avatar: 'CW',
    rating: 5,
    text: 'As a full-time trader, I appreciate the sophistication of AlgoEdge\'s algorithms. The multi-strategy approach provides excellent diversification.',
    profit: '+43%',
    tradingPeriod: '6 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 41,
    name: 'Grace Nakamura',
    location: 'Melbourne, Australia',
    avatar: 'GN',
    rating: 5,
    text: 'Finally found a trading solution that works! No more staying up late watching charts. AlgoEdge handles everything while I sleep.',
    profit: '+24%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'beginner',
  },
  {
    id: 42,
    name: 'Erik Johansson',
    location: 'Oslo, Norway',
    avatar: 'EJ',
    rating: 5,
    text: 'The transparency of this platform is what convinced me. Every trade is logged with detailed analytics. My account has grown 28% in 4 months.',
    profit: '+28%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 43,
    name: 'Aisha Mohammed',
    location: 'Doha, Qatar',
    avatar: 'AM',
    rating: 5,
    text: 'AlgoEdge provides institutional-quality trading at retail prices. The risk controls are excellent and have protected my capital during drawdowns.',
    profit: '+35%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'December 2025',
    category: 'professional',
  },
  {
    id: 44,
    name: 'Patrick O\'Brien',
    location: 'Dublin, Ireland',
    avatar: 'PO',
    rating: 4,
    text: 'Good solid platform for automated trading. The setup was easy and the bots have been profitable from day one. Will upgrade to quarterly soon.',
    profit: '+16%',
    tradingPeriod: '2 months',
    plan: 'Monthly',
    verified: true,
    date: 'November 2025',
    category: 'beginner',
  },
  {
    id: 45,
    name: 'Nina Kristensen',
    location: 'Copenhagen, Denmark',
    avatar: 'NK',
    rating: 5,
    text: 'The perfect solution for busy professionals. Set it up once and let it run. My trading results have never been better.',
    profit: '+29%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'experienced',
  },
  {
    id: 46,
    name: 'Ricardo Mendez',
    location: 'Santiago, Chile',
    avatar: 'RM',
    rating: 5,
    text: 'Increíble plataforma! The consistency of returns is what impressed me most. Week after week, steady profits without the stress.',
    profit: '+26%',
    tradingPeriod: '3 months',
    plan: 'Monthly',
    verified: true,
    date: 'December 2025',
    category: 'experienced',
  },
  {
    id: 47,
    name: 'Sofia Andersson',
    location: 'Helsinki, Finland',
    avatar: 'SA',
    rating: 5,
    text: 'I\'ve tested many automated trading solutions. AlgoEdge stands out for its reliability and consistent performance. Worth every penny!',
    profit: '+32%',
    tradingPeriod: '4 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
  {
    id: 48,
    name: 'Abdul Rahman',
    location: 'Kuwait City, Kuwait',
    avatar: 'AR',
    rating: 5,
    text: 'The gold trading algorithms are exceptional. Combined with the risk management features, this is the most reliable trading system I\'ve used.',
    profit: '+40%',
    tradingPeriod: '5 months',
    plan: 'Quarterly',
    verified: true,
    date: 'January 2026',
    category: 'professional',
  },
];

const stats = [
  { icon: <Users size={28} />, value: '2,500+', label: 'Active Traders', color: '#22C55E' },
  { icon: <TrendingUp size={28} />, value: '78%', label: 'Average Win Rate', color: '#0066FF' },
  { icon: <Star size={28} />, value: '4.8/5', label: 'User Rating', color: '#FFD700' },
  { icon: <Award size={28} />, value: '$5.2M+', label: 'Profits Generated', color: '#A000FF' },
];

const countries = [
  'USA', 'UK', 'Germany', 'Canada', 'Australia', 'Singapore', 'UAE', 'Japan', 
  'India', 'Brazil', 'South Africa', 'France', 'Italy', 'Spain', 'Netherlands',
  'Switzerland', 'Sweden', 'Poland', 'South Korea', 'Malaysia', 'Philippines',
  'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Vietnam', 'Ireland',
  'Denmark', 'Finland', 'Norway', 'Russia', 'Hong Kong'
];

export default function TestimonialsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTestimonials = selectedCategory === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.category === selectedCategory);

  const averageRating = testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0f1a',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={20} />}
          sx={{
            mb: 4,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#22C55E' },
          }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, #0d1421 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Quote size={48} color="#22C55E" style={{ marginBottom: 16 }} />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              mb: 2,
            }}
          >
            What Our Traders Say
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Real results from real traders using AlgoEdge across {countries.length}+ countries
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
            <Rating value={averageRating} precision={0.1} readOnly sx={{ color: '#FFD700' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {averageRating.toFixed(1)} out of 5 ({testimonials.length} reviews)
            </Typography>
          </Box>
          
          {/* Global reach indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Globe size={18} color="#22C55E" />
            <Typography variant="body2" sx={{ color: '#22C55E' }}>
              Trusted by traders in {countries.length}+ countries worldwide
            </Typography>
          </Box>
        </Paper>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'rgba(26, 35, 50, 0.5)',
                  border: `1px solid ${stat.color}30`,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: `1px solid ${stat.color}50`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" sx={{ color: stat.color, fontWeight: 700 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Category Filter */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => setSelectedCategory(value)}
            sx={{
              bgcolor: 'rgba(26, 35, 50, 0.5)',
              borderRadius: 2,
              p: 0.5,
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'none',
                minHeight: 40,
                '&.Mui-selected': { color: '#22C55E' },
              },
              '& .MuiTabs-indicator': { bgcolor: '#22C55E' },
            }}
          >
            <Tab label={`All Reviews (${testimonials.length})`} value="all" />
            <Tab label={`Beginners (${testimonials.filter(t => t.category === 'beginner').length})`} value="beginner" />
            <Tab label={`Experienced (${testimonials.filter(t => t.category === 'experienced').length})`} value="experienced" />
            <Tab label={`Professionals (${testimonials.filter(t => t.category === 'professional').length})`} value="professional" />
          </Tabs>
        </Box>

        {/* Testimonials Grid */}
        <Grid container spacing={3}>
          {filteredTestimonials.map((testimonial) => (
            <Grid item xs={12} md={6} lg={4} key={testimonial.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(26, 35, 50, 0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={profileImages[testimonial.id]}
                      sx={{
                        bgcolor: 'rgba(34, 197, 94, 0.15)',
                        color: '#22C55E',
                        fontWeight: 600,
                        width: 48,
                        height: 48,
                        border: '2px solid #22C55E',
                      }}
                    >
                      {testimonial.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                          {testimonial.name}
                        </Typography>
                        {testimonial.verified && (
                          <CheckCircle size={16} color="#22C55E" />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {testimonial.location}
                      </Typography>
                    </Box>
                    {testimonial.profit && (
                      <Chip
                        label={testimonial.profit}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(34, 197, 94, 0.15)',
                          color: '#22C55E',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      />
                    )}
                  </Box>

                  {/* Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={testimonial.rating} readOnly size="small" sx={{ color: '#FFD700' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {testimonial.date}
                    </Typography>
                  </Box>

                  {/* Quote */}
                  <Box sx={{ position: 'relative', flex: 1 }}>
                    <Quote
                      size={20}
                      color="rgba(34, 197, 94, 0.2)"
                      style={{ position: 'absolute', top: -5, left: -5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.7,
                        pl: 2,
                      }}
                    >
                      {testimonial.text}
                    </Typography>
                  </Box>

                  {/* Footer */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={testimonial.plan}
                        size="small"
                        sx={{
                          bgcolor: testimonial.plan === 'Quarterly' ? 'rgba(160, 0, 255, 0.15)' :
                                   testimonial.plan === 'Monthly' ? 'rgba(34, 197, 94, 0.15)' :
                                   'rgba(0, 102, 255, 0.15)',
                          color: testimonial.plan === 'Quarterly' ? '#A000FF' :
                                 testimonial.plan === 'Monthly' ? '#22C55E' :
                                 '#0066FF',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={testimonial.tradingPeriod}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            mt: 6,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0, 102, 255, 0.05) 50%, rgba(160, 0, 255, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Shield size={48} color="#22C55E" style={{ marginBottom: 16 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
            Join {testimonials.length * 50}+ Successful Traders
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, maxWidth: 600, mx: 'auto' }}>
            Start your automated trading journey today. Try AlgoEdge risk-free with our 7-day refund policy.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/auth/pricing"
              variant="contained"
              size="large"
              startIcon={<TrendingUp size={20} />}
              sx={{
                bgcolor: '#22C55E',
                px: 4,
                py: 1.5,
                fontWeight: 600,
                '&:hover': { bgcolor: '#16A34A' },
              }}
            >
              Start Trading Now
            </Button>
            <Button
              component={Link}
              href="/faq"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': { borderColor: '#22C55E', color: '#22C55E' },
              }}
            >
              Learn More
            </Button>
          </Box>
        </Paper>

        {/* Disclaimer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            mt: 4,
            px: 2,
          }}
        >
          * Trading results vary based on market conditions and individual settings. Past performance does not guarantee future results. 
          Trading involves risk of loss. Only trade with funds you can afford to lose.
        </Typography>
      </Container>
    </Box>
  );
}
