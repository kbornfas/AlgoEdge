'use client';

import { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  BookOpen,
  Video,
  FileText,
  Award,
  Search,
  ChevronDown,
  Play,
  Clock,
  Star,
  Lock,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: number;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail: string;
  isLocked: boolean;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Forex Trading Fundamentals',
    description: 'Learn the basics of forex trading, including currency pairs, pips, and market structure.',
    lessons: 12,
    duration: '2h 30m',
    level: 'Beginner',
    category: 'Forex Basics',
    thumbnail: '/images/courses/forex-basics.jpg',
    isLocked: false,
  },
  {
    id: 2,
    title: 'Technical Analysis Mastery',
    description: 'Master chart patterns, indicators, and technical analysis strategies.',
    lessons: 18,
    duration: '4h 15m',
    level: 'Intermediate',
    category: 'Technical Analysis',
    thumbnail: '/images/courses/technical-analysis.jpg',
    isLocked: false,
  },
  {
    id: 3,
    title: 'Risk Management Essentials',
    description: 'Learn how to protect your capital and manage risk like a professional.',
    lessons: 8,
    duration: '1h 45m',
    level: 'Beginner',
    category: 'Risk Management',
    thumbnail: '/images/courses/risk-management.jpg',
    isLocked: false,
  },
  {
    id: 4,
    title: 'Smart Money Concepts',
    description: 'Understand institutional trading strategies and liquidity concepts.',
    lessons: 15,
    duration: '3h 30m',
    level: 'Advanced',
    category: 'Advanced Strategies',
    thumbnail: '/images/courses/smart-money.jpg',
    isLocked: true,
  },
  {
    id: 5,
    title: 'Trading Psychology',
    description: 'Develop the mindset of a successful trader and overcome emotional barriers.',
    lessons: 10,
    duration: '2h',
    level: 'Intermediate',
    category: 'Psychology',
    thumbnail: '/images/courses/psychology.jpg',
    isLocked: true,
  },
];

const faqs = [
  {
    question: 'How do I start trading on AlgoEdge?',
    answer: 'First, create an account and verify your email. Then, connect your MT5 trading account to start receiving signals and using our trading tools.',
  },
  {
    question: 'What is the minimum deposit?',
    answer: 'The minimum deposit is $19. You can deposit using M-Pesa, Airtel Money, USDT, or Bitcoin.',
  },
  {
    question: 'How do trading signals work?',
    answer: 'Our AI-powered system analyzes market data and generates trading signals with entry price, stop loss, and take profit levels. You can follow these signals manually or use our automated trading feature.',
  },
  {
    question: 'Can I withdraw my earnings anytime?',
    answer: 'Yes, you can request a withdrawal at any time. Minimum withdrawal is $10, and processing takes 24-48 hours.',
  },
  {
    question: 'How does the affiliate program work?',
    answer: 'Share your unique referral link and earn 10-20% commission on every subscription from your referrals, depending on your tier level.',
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

export default function LearningHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Forex Basics', 'Technical Analysis', 'Risk Management', 'Advanced Strategies', 'Psychology'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Learning Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Master the art of trading with our comprehensive courses and resources
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              sx={{ fontWeight: selectedCategory === category ? 600 : 400 }}
            />
          ))}
        </Box>
      </Box>

      {/* Courses Grid */}
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Courses
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card sx={{ height: '100%', position: 'relative', opacity: course.isLocked ? 0.7 : 1 }}>
              {course.isLocked && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    p: 0.5,
                    zIndex: 1,
                  }}
                >
                  <Lock size={20} color="#F59E0B" />
                </Box>
              )}
              <Box
                sx={{
                  height: 150,
                  bgcolor: 'grey.800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={48} color="#6B7280" />
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    label={course.level}
                    size="small"
                    sx={{
                      bgcolor: `${getLevelColor(course.level)}20`,
                      color: getLevelColor(course.level),
                      fontWeight: 600,
                    }}
                  />
                  <Chip label={course.category} size="small" variant="outlined" />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      <Video size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {course.lessons} lessons
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {course.duration}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth
                  variant={course.isLocked ? 'outlined' : 'contained'}
                  sx={{ mt: 2 }}
                  startIcon={course.isLocked ? <Lock size={16} /> : <Play size={16} />}
                  component={Link}
                  href={`/dashboard/learning-hub/${course.id}`}
                >
                  {course.isLocked ? 'View Course' : 'Start Course'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQs */}
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Frequently Asked Questions
      </Typography>
      <Box sx={{ mb: 4 }}>
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Typography fontWeight={600}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}
