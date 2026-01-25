'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Avatar,
  Rating,
  LinearProgress,
  Divider,
  Breadcrumbs,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  BookOpen,
  Video,
  FileText,
  Award,
  Play,
  Clock,
  Star,
  Lock,
  Check,
  ChevronLeft,
  ChevronDown,
  Users,
  BarChart,
  BookMarked,
  Download,
  Share2,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'quiz';
  isLocked: boolean;
  isCompleted: boolean;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  lessons: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail: string;
  isLocked: boolean;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
    students: number;
    courses: number;
  };
  rating: number;
  totalReviews: number;
  students: number;
  lastUpdated: string;
  language: string;
  modules: Module[];
  whatYouWillLearn: string[];
  requirements: string[];
}

interface Review {
  id: number;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  review: string;
}

// Course database
const coursesData: Record<string, Course> = {
  '1': {
    id: 1,
    title: 'Forex Trading Fundamentals',
    description: 'Learn the basics of forex trading, including currency pairs, pips, and market structure.',
    longDescription: `This comprehensive course is designed for complete beginners who want to start their journey in forex trading. You'll learn everything from understanding currency pairs to executing your first trade.

The forex market is the largest financial market in the world, with a daily trading volume exceeding $6 trillion. This course will give you the foundation you need to participate in this exciting market.

By the end of this course, you'll have a solid understanding of how the forex market works, how to read currency quotes, what pips and lots are, and how to place your first trade on a trading platform.`,
    lessons: 12,
    duration: '2h 30m',
    level: 'Beginner',
    category: 'Forex Basics',
    thumbnail: '/images/courses/forex-basics.jpg',
    isLocked: false,
    instructor: {
      name: 'Michael Roberts',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
      bio: 'Professional forex trader with over 15 years of experience. Former investment banker at Goldman Sachs.',
      students: 45000,
      courses: 8,
    },
    rating: 4.8,
    totalReviews: 2340,
    students: 45000,
    lastUpdated: 'December 2024',
    language: 'English',
    modules: [
      {
        id: 1,
        title: 'Introduction to Forex',
        description: 'Understanding the forex market',
        lessons: [
          { id: 1, title: 'What is Forex Trading?', duration: '10:30', type: 'video', isLocked: false, isCompleted: true },
          { id: 2, title: 'History of the Forex Market', duration: '8:15', type: 'video', isLocked: false, isCompleted: true },
          { id: 3, title: 'Who Trades Forex?', duration: '12:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 2,
        title: 'Currency Pairs & Quotes',
        description: 'Understanding how currencies are quoted',
        lessons: [
          { id: 4, title: 'Major Currency Pairs', duration: '15:20', type: 'video', isLocked: false, isCompleted: false },
          { id: 5, title: 'Reading Currency Quotes', duration: '11:45', type: 'video', isLocked: false, isCompleted: false },
          { id: 6, title: 'Quiz: Currency Pairs', duration: '10:00', type: 'quiz', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 3,
        title: 'Pips, Lots & Leverage',
        description: 'Essential forex terminology',
        lessons: [
          { id: 7, title: 'Understanding Pips', duration: '13:30', type: 'video', isLocked: false, isCompleted: false },
          { id: 8, title: 'Lot Sizes Explained', duration: '14:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 9, title: 'Leverage & Margin', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 4,
        title: 'Your First Trade',
        description: 'Executing trades on MT5',
        lessons: [
          { id: 10, title: 'Setting Up Your Trading Platform', duration: '20:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 11, title: 'Placing Your First Order', duration: '15:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 12, title: 'Course Summary & Resources', duration: '8:00', type: 'article', isLocked: false, isCompleted: false },
        ],
      },
    ],
    whatYouWillLearn: [
      'Understand how the forex market works',
      'Read and interpret currency quotes',
      'Calculate pip values and position sizes',
      'Use leverage and margin safely',
      'Execute trades on MT5 platform',
      'Analyze basic market conditions',
    ],
    requirements: [
      'No prior trading experience required',
      'A computer or smartphone with internet',
      'Willingness to learn and practice',
    ],
  },
  '2': {
    id: 2,
    title: 'Technical Analysis Mastery',
    description: 'Master chart patterns, indicators, and technical analysis strategies.',
    longDescription: `Technical analysis is the backbone of successful trading. This intermediate course will teach you how to read price charts like a professional trader.

You'll learn to identify key chart patterns, use popular indicators effectively, and develop a systematic approach to analyzing any market. We cover everything from basic candlestick patterns to advanced multi-timeframe analysis.

Whether you're looking to day trade or swing trade, the skills you learn in this course will give you an edge in the markets.`,
    lessons: 18,
    duration: '4h 15m',
    level: 'Intermediate',
    category: 'Technical Analysis',
    thumbnail: '/images/courses/technical-analysis.jpg',
    isLocked: false,
    instructor: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
      bio: 'Certified Market Technician (CMT) with 12 years of trading experience. Specialized in price action analysis.',
      students: 32000,
      courses: 5,
    },
    rating: 4.9,
    totalReviews: 1890,
    students: 32000,
    lastUpdated: 'November 2024',
    language: 'English',
    modules: [
      {
        id: 1,
        title: 'Candlestick Foundations',
        description: 'Reading price through candlesticks',
        lessons: [
          { id: 1, title: 'Introduction to Candlestick Charts', duration: '12:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 2, title: 'Single Candlestick Patterns', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 3, title: 'Multi-Candlestick Patterns', duration: '22:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 2,
        title: 'Support & Resistance',
        description: 'Key price levels every trader must know',
        lessons: [
          { id: 4, title: 'Drawing Support & Resistance', duration: '15:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 5, title: 'Support & Resistance Strategies', duration: '20:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 6, title: 'Quiz: S&R Identification', duration: '15:00', type: 'quiz', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 3,
        title: 'Trend Analysis',
        description: 'Identifying and trading with the trend',
        lessons: [
          { id: 7, title: 'What is a Trend?', duration: '10:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 8, title: 'Trendlines & Channels', duration: '16:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 9, title: 'Moving Averages', duration: '20:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 10, title: 'Trend Continuation Patterns', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 4,
        title: 'Technical Indicators',
        description: 'Mastering popular indicators',
        lessons: [
          { id: 11, title: 'RSI & Oscillators', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 12, title: 'MACD Strategies', duration: '15:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 13, title: 'Bollinger Bands', duration: '14:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 5,
        title: 'Advanced Patterns',
        description: 'Professional chart pattern recognition',
        lessons: [
          { id: 14, title: 'Head & Shoulders', duration: '16:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 15, title: 'Double Tops & Bottoms', duration: '14:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 16, title: 'Triangles & Wedges', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 17, title: 'Putting It All Together', duration: '25:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 18, title: 'Final Exam', duration: '30:00', type: 'quiz', isLocked: false, isCompleted: false },
        ],
      },
    ],
    whatYouWillLearn: [
      'Read candlestick charts with confidence',
      'Identify key support and resistance levels',
      'Draw trendlines and channels correctly',
      'Use RSI, MACD, and Bollinger Bands',
      'Recognize major chart patterns',
      'Combine multiple indicators for better signals',
    ],
    requirements: [
      'Basic understanding of forex trading',
      'Completion of "Forex Trading Fundamentals" recommended',
      'Access to a charting platform',
    ],
  },
  '3': {
    id: 3,
    title: 'Risk Management Essentials',
    description: 'Learn how to protect your capital and manage risk like a professional.',
    longDescription: `Risk management is what separates successful traders from those who blow their accounts. This essential course teaches you the critical skills needed to protect your capital.

Learn to calculate proper position sizes, set effective stop losses, and manage your emotions during drawdowns. We'll cover the math behind risk management and show you how professional traders think about risk.

After completing this course, you'll have a complete risk management framework that you can apply to any trading strategy.`,
    lessons: 8,
    duration: '1h 45m',
    level: 'Beginner',
    category: 'Risk Management',
    thumbnail: '/images/courses/risk-management.jpg',
    isLocked: false,
    instructor: {
      name: 'David Thompson',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
      bio: 'Former hedge fund risk manager. Now teaches traders how to protect their capital while maximizing returns.',
      students: 28000,
      courses: 4,
    },
    rating: 4.7,
    totalReviews: 1456,
    students: 28000,
    lastUpdated: 'December 2024',
    language: 'English',
    modules: [
      {
        id: 1,
        title: 'The Importance of Risk Management',
        description: 'Why most traders fail',
        lessons: [
          { id: 1, title: 'Why Traders Blow Their Accounts', duration: '10:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 2, title: 'The Risk-Reward Ratio', duration: '12:00', type: 'video', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 2,
        title: 'Position Sizing',
        description: 'How much to risk per trade',
        lessons: [
          { id: 3, title: 'The 1% Rule', duration: '15:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 4, title: 'Position Size Calculator', duration: '12:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 5, title: 'Quiz: Position Sizing', duration: '10:00', type: 'quiz', isLocked: false, isCompleted: false },
        ],
      },
      {
        id: 3,
        title: 'Stop Loss Strategies',
        description: 'Protecting your capital',
        lessons: [
          { id: 6, title: 'Types of Stop Losses', duration: '18:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 7, title: 'Where to Place Your Stop Loss', duration: '16:00', type: 'video', isLocked: false, isCompleted: false },
          { id: 8, title: 'Course Summary', duration: '12:00', type: 'article', isLocked: false, isCompleted: false },
        ],
      },
    ],
    whatYouWillLearn: [
      'Calculate the correct position size for any trade',
      'Understand and apply risk-reward ratios',
      'Set effective stop losses',
      'Manage drawdowns psychologically',
      'Create a personal risk management plan',
      'Avoid common mistakes that blow accounts',
    ],
    requirements: [
      'Basic understanding of forex trading',
      'A calculator (or use our free tools)',
    ],
  },
  '4': {
    id: 4,
    title: 'Smart Money Concepts',
    description: 'Understand institutional trading strategies and liquidity concepts.',
    longDescription: `Smart Money Concepts (SMC) is an advanced trading methodology that focuses on understanding how institutional traders move the markets.

This course will teach you to identify order blocks, liquidity zones, and fair value gaps. You'll learn to see the market through the eyes of the "smart money" - the banks and hedge funds that control price movement.

Warning: This is advanced content. You should have a solid foundation in technical analysis before taking this course.`,
    lessons: 15,
    duration: '3h 30m',
    level: 'Advanced',
    category: 'Advanced Strategies',
    thumbnail: '/images/courses/smart-money.jpg',
    isLocked: true,
    instructor: {
      name: 'James Wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      bio: 'Former institutional trader with 20 years of experience. Specialized in order flow and market structure analysis.',
      students: 15000,
      courses: 3,
    },
    rating: 4.9,
    totalReviews: 892,
    students: 15000,
    lastUpdated: 'November 2024',
    language: 'English',
    modules: [
      {
        id: 1,
        title: 'Introduction to SMC',
        description: 'Understanding institutional trading',
        lessons: [
          { id: 1, title: 'What is Smart Money?', duration: '15:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 2, title: 'Market Structure Basics', duration: '20:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 3, title: 'Break of Structure (BOS)', duration: '18:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 2,
        title: 'Order Blocks',
        description: 'Where institutions place their orders',
        lessons: [
          { id: 4, title: 'What are Order Blocks?', duration: '16:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 5, title: 'Identifying Order Blocks', duration: '22:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 6, title: 'Trading Order Block Entries', duration: '25:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 3,
        title: 'Liquidity Concepts',
        description: 'Understanding where the money flows',
        lessons: [
          { id: 7, title: 'What is Liquidity?', duration: '12:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 8, title: 'Liquidity Sweeps', duration: '20:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 9, title: 'Trading Liquidity Grabs', duration: '22:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 4,
        title: 'Fair Value Gaps',
        description: 'Imbalance in price delivery',
        lessons: [
          { id: 10, title: 'Understanding FVGs', duration: '15:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 11, title: 'Trading FVG Retracements', duration: '20:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 5,
        title: 'Advanced SMC Strategies',
        description: 'Putting it all together',
        lessons: [
          { id: 12, title: 'Multi-Timeframe SMC Analysis', duration: '25:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 13, title: 'Live Trade Examples', duration: '30:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 14, title: 'Creating Your SMC Trading Plan', duration: '18:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 15, title: 'Final Assessment', duration: '30:00', type: 'quiz', isLocked: true, isCompleted: false },
        ],
      },
    ],
    whatYouWillLearn: [
      'Identify market structure and breaks of structure',
      'Find and trade order blocks',
      'Understand liquidity concepts',
      'Use fair value gaps in your analysis',
      'Trade like institutional traders',
      'Develop an advanced SMC trading strategy',
    ],
    requirements: [
      'Solid understanding of technical analysis',
      'Completion of "Technical Analysis Mastery" course',
      'At least 6 months of trading experience',
      'Premium subscription required',
    ],
  },
  '5': {
    id: 5,
    title: 'Trading Psychology',
    description: 'Develop the mindset of a successful trader and overcome emotional barriers.',
    longDescription: `Your psychology is the most important factor in your trading success. This course addresses the mental and emotional challenges every trader faces.

Learn to manage fear and greed, develop discipline, and create routines that support consistent trading. We draw from cognitive behavioral therapy and performance psychology to give you practical tools for improvement.

This course will transform how you think about trading and help you develop the mental edge needed for long-term success.`,
    lessons: 10,
    duration: '2h',
    level: 'Intermediate',
    category: 'Psychology',
    thumbnail: '/images/courses/psychology.jpg',
    isLocked: true,
    instructor: {
      name: 'Dr. Emily Foster',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
      bio: 'Trading psychologist with a PhD in Behavioral Finance. Has coached hundreds of professional traders.',
      students: 22000,
      courses: 6,
    },
    rating: 4.8,
    totalReviews: 1234,
    students: 22000,
    lastUpdated: 'October 2024',
    language: 'English',
    modules: [
      {
        id: 1,
        title: 'The Trading Mind',
        description: 'Understanding your psychology',
        lessons: [
          { id: 1, title: 'Why Psychology Matters', duration: '12:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 2, title: 'Common Psychological Traps', duration: '15:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 2,
        title: 'Managing Emotions',
        description: 'Controlling fear and greed',
        lessons: [
          { id: 3, title: 'Understanding Fear in Trading', duration: '14:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 4, title: 'Managing Greed', duration: '12:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 5, title: 'The FOMO Problem', duration: '10:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 3,
        title: 'Building Discipline',
        description: 'Creating winning habits',
        lessons: [
          { id: 6, title: 'Your Pre-Trading Routine', duration: '15:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 7, title: 'Journaling for Success', duration: '12:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 8, title: 'Handling Losing Streaks', duration: '18:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
      {
        id: 4,
        title: 'Peak Performance',
        description: 'Achieving your best',
        lessons: [
          { id: 9, title: 'The Flow State in Trading', duration: '15:00', type: 'video', isLocked: true, isCompleted: false },
          { id: 10, title: 'Long-Term Success Mindset', duration: '17:00', type: 'video', isLocked: true, isCompleted: false },
        ],
      },
    ],
    whatYouWillLearn: [
      'Identify and overcome your psychological weaknesses',
      'Manage fear, greed, and FOMO',
      'Develop a disciplined trading routine',
      'Use journaling to improve performance',
      'Handle losing streaks without tilting',
      'Achieve flow state in your trading',
    ],
    requirements: [
      'Some trading experience (demo or live)',
      'Openness to self-reflection',
      'Premium subscription required',
    ],
  },
};

const demoReviews: Review[] = [
  {
    id: 1,
    userName: 'John M.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
    rating: 5,
    date: '2 days ago',
    review: 'Excellent course! The explanations are clear and the examples are practical. I finally understand how the forex market works.',
  },
  {
    id: 2,
    userName: 'Sarah K.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
    rating: 5,
    date: '1 week ago',
    review: 'Very comprehensive and well-structured. The instructor knows what he\'s talking about. Highly recommended for beginners!',
  },
  {
    id: 3,
    userName: 'Mike T.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
    rating: 4,
    date: '2 weeks ago',
    review: 'Good content overall. Would have liked more live trading examples, but the theory is solid.',
  },
  {
    id: 4,
    userName: 'Lisa R.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
    rating: 5,
    date: '3 weeks ago',
    review: 'This course gave me the confidence to start trading. The instructor explains complex concepts in simple terms.',
  },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Beginner': return '#22C55E';
    case 'Intermediate': return '#F59E0B';
    case 'Advanced': return '#EF4444';
    default: return '#6B7280';
  }
};

const getLessonIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video size={18} />;
    case 'article': return <FileText size={18} />;
    case 'quiz': return <Award size={18} />;
    default: return <Play size={18} />;
  }
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | false>(1);

  useEffect(() => {
    const courseData = coursesData[courseId];
    if (courseData) {
      setCourse(courseData);
    }
    setLoading(false);
  }, [courseId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h4" gutterBottom>Course Not Found</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          The course you're looking for doesn't exist or has been removed.
        </Typography>
        <Button variant="contained" component={Link} href="/dashboard/learning-hub">
          Back to Learning Hub
        </Button>
      </Box>
    );
  }

  const completedLessons = course.modules.reduce(
    (total, module) => total + module.lessons.filter(l => l.isCompleted).length,
    0
  );
  const progressPercent = (completedLessons / course.lessons) * 100;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          Dashboard
        </Link>
        <Link href="/dashboard/learning-hub" style={{ textDecoration: 'none', color: 'inherit' }}>
          Learning Hub
        </Link>
        <Typography color="text.primary">{course.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Course Header */}
          <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label={course.category} 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip 
                label={course.level}
                sx={{ bgcolor: getLevelColor(course.level), color: 'white' }}
              />
              {course.isLocked && (
                <Chip 
                  icon={<Lock size={14} />}
                  label="Premium"
                  sx={{ bgcolor: '#FFD700', color: '#000' }}
                />
              )}
            </Box>
            
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              {course.title}
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, fontSize: '1.1rem' }}>
              {course.description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={course.rating} precision={0.1} readOnly sx={{ color: '#FFD700' }} />
                <Typography sx={{ color: 'white' }}>
                  {course.rating} ({course.totalReviews.toLocaleString()} reviews)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.8)' }}>
                <Users size={18} />
                <Typography>{course.students.toLocaleString()} students</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.8)' }}>
                <Clock size={18} />
                <Typography>{course.duration}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.8)' }}>
                <BookOpen size={18} />
                <Typography>{course.lessons} lessons</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Course Description */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              About this course
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line', color: 'text.secondary', lineHeight: 1.8 }}>
              {course.longDescription}
            </Typography>
          </Paper>

          {/* What You'll Learn */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              What you'll learn
            </Typography>
            <Grid container spacing={2}>
              {course.whatYouWillLearn.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Check size={20} style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} />
                    <Typography>{item}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Course Content */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Course content
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {course.modules.length} modules • {course.lessons} lessons • {course.duration} total
            </Typography>
            
            {course.modules.map((module) => (
              <Accordion 
                key={module.id}
                expanded={expandedModule === module.id}
                onChange={(_, isExpanded) => setExpandedModule(isExpanded ? module.id : false)}
                sx={{ mb: 1, '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ChevronDown />}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        Module {module.id}: {module.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {module.lessons.length} lessons
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <List disablePadding>
                    {module.lessons.map((lesson, index) => (
                      <ListItem 
                        key={lesson.id}
                        sx={{ 
                          py: 1.5,
                          px: 2,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                          opacity: lesson.isLocked ? 0.6 : 1,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {lesson.isCompleted ? (
                            <Check size={20} style={{ color: '#22C55E' }} />
                          ) : lesson.isLocked ? (
                            <Lock size={18} style={{ color: '#9CA3AF' }} />
                          ) : (
                            getLessonIcon(lesson.type)
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={lesson.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Clock size={14} />
                              <Typography variant="caption">{lesson.duration}</Typography>
                              <Chip 
                                label={lesson.type} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                        />
                        {!lesson.isLocked && (
                          <Button 
                            size="small" 
                            startIcon={<Play size={14} />}
                            sx={{ ml: 2 }}
                          >
                            Start
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Requirements */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Requirements
            </Typography>
            <List disablePadding>
              {course.requirements.map((req, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <BookMarked size={16} />
                  </ListItemIcon>
                  <ListItemText primary={req} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Reviews */}
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Student Reviews
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star size={20} fill="#FFD700" color="#FFD700" />
                <Typography variant="h6">{course.rating}</Typography>
                <Typography color="text.secondary">({course.totalReviews.toLocaleString()})</Typography>
              </Box>
            </Box>
            
            {demoReviews.map((review) => (
              <Box key={review.id} sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar src={review.avatar} sx={{ width: 48, height: 48 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{review.userName}</Typography>
                      <Typography variant="caption" color="text.secondary">{review.date}</Typography>
                    </Box>
                    <Rating value={review.rating} size="small" readOnly sx={{ mb: 1 }} />
                    <Typography color="text.secondary">{review.review}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            
            <Button variant="outlined" fullWidth>
              Show all reviews
            </Button>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            {/* Progress */}
            {!course.isLocked && completedLessons > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Your progress</Typography>
                  <Typography variant="body2" fontWeight={600}>{Math.round(progressPercent)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercent} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {completedLessons} of {course.lessons} lessons completed
                </Typography>
              </Box>
            )}

            {course.isLocked ? (
              <>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  Premium Course
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Upgrade to Premium to access this advanced course and all other premium content.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5 }}
                  component={Link}
                  href="/pricing"
                >
                  Upgrade to Premium
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  startIcon={<Play />}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {completedLessons > 0 ? 'Continue Learning' : 'Start Course'}
                </Button>
              </>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            {/* Instructor */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Your Instructor
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar 
                src={course.instructor.avatar} 
                sx={{ width: 64, height: 64 }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{course.instructor.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.instructor.students.toLocaleString()} students
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.instructor.courses} courses
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {course.instructor.bio}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Course Info */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Course Details
            </Typography>
            <List disablePadding>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BookOpen size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary="Lessons"
                  secondary={course.lessons}
                />
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Clock size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary="Duration"
                  secondary={course.duration}
                />
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BarChart size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary="Level"
                  secondary={course.level}
                />
              </ListItem>
              <ListItem sx={{ py: 1, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Award size={18} />
                </ListItemIcon>
                <ListItemText 
                  primary="Certificate"
                  secondary="Yes, upon completion"
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Share2 size={18} />} fullWidth>
                Share
              </Button>
              <Button variant="outlined" startIcon={<Heart size={18} />} fullWidth>
                Save
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
