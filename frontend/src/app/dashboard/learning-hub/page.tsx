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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
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
  Crown,
  Unlock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  instructor: string;
  rating: number;
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Forex Trading Fundamentals',
    description: 'Learn the basics of forex trading, including currency pairs, pips, lot sizes, and market structure.',
    lessons: 12,
    duration: '2h 30m',
    level: 'Beginner',
    category: 'Forex Basics',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    isLocked: true,
    instructor: 'Michael Chen',
    rating: 4.9,
  },
  {
    id: 2,
    title: 'Technical Analysis Mastery',
    description: 'Master chart patterns, candlestick formations, indicators, and technical analysis strategies.',
    lessons: 18,
    duration: '4h 15m',
    level: 'Intermediate',
    category: 'Technical Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
    isLocked: true,
    instructor: 'Sarah Williams',
    rating: 4.8,
  },
  {
    id: 3,
    title: 'Risk Management Essentials',
    description: 'Learn how to protect your capital, set proper stop losses, and manage risk like a professional.',
    lessons: 8,
    duration: '1h 45m',
    level: 'Beginner',
    category: 'Risk Management',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    isLocked: true,
    instructor: 'David Park',
    rating: 4.7,
  },
  {
    id: 4,
    title: 'Smart Money Concepts',
    description: 'Understand institutional trading strategies, order blocks, liquidity pools, and market manipulation.',
    lessons: 15,
    duration: '3h 30m',
    level: 'Advanced',
    category: 'Advanced Strategies',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    isLocked: true,
    instructor: 'James Anderson',
    rating: 4.9,
  },
  {
    id: 5,
    title: 'Trading Psychology Masterclass',
    description: 'Develop the mindset of a successful trader, overcome fear, greed, and emotional barriers.',
    lessons: 10,
    duration: '2h',
    level: 'Intermediate',
    category: 'Psychology',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    isLocked: true,
    instructor: 'Emma Thompson',
    rating: 4.8,
  },
  {
    id: 6,
    title: 'Price Action Trading',
    description: 'Trade using pure price action without indicators. Learn support, resistance, and trend analysis.',
    lessons: 14,
    duration: '3h 15m',
    level: 'Intermediate',
    category: 'Technical Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80',
    isLocked: true,
    instructor: 'Robert Miller',
    rating: 4.6,
  },
  {
    id: 7,
    title: 'Gold & Commodities Trading',
    description: 'Specialized course on trading gold (XAUUSD), silver, oil, and other commodities effectively.',
    lessons: 11,
    duration: '2h 45m',
    level: 'Intermediate',
    category: 'Commodities',
    thumbnail: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80',
    isLocked: true,
    instructor: 'Alex Johnson',
    rating: 4.7,
  },
  {
    id: 8,
    title: 'Algorithmic Trading Basics',
    description: 'Introduction to automated trading, trading bots, and building your first trading algorithm.',
    lessons: 16,
    duration: '4h',
    level: 'Advanced',
    category: 'Algorithmic Trading',
    thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80',
    isLocked: true,
    instructor: 'Kevin Lee',
    rating: 4.9,
  },
  {
    id: 9,
    title: 'News Trading Strategies',
    description: 'Learn to trade high-impact news events, economic calendars, and fundamental analysis.',
    lessons: 9,
    duration: '2h 15m',
    level: 'Advanced',
    category: 'Fundamental Analysis',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    isLocked: true,
    instructor: 'Lisa Brown',
    rating: 4.5,
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
  {
    question: 'Who can access the Learning Hub?',
    answer: 'The Learning Hub is exclusively available to Monthly, Yearly, and Lifetime subscribers. Free and Weekly subscribers do not have access to courses. Upgrade to Monthly or above to unlock all educational content.',
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
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Forex Basics', 'Technical Analysis', 'Risk Management', 'Advanced Strategies', 'Psychology', 'Commodities', 'Algorithmic Trading', 'Fundamental Analysis'];

  // Check user subscription status
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check localStorage for user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          // Check if admin - admins always have access
          if (user.isAdmin || user.is_admin) {
            setIsAdmin(true);
            setIsPremium(true);
          }
          // Check subscription plan - only monthly, yearly, lifetime have access (NOT free or weekly)
          const plan = (user.subscriptionPlan || user.subscription_plan || '').toLowerCase();
          if (plan === 'monthly' || plan === 'yearly' || plan === 'lifetime' || plan === 'premium') {
            setIsPremium(true);
          }
        }

        // Also check via API for most up-to-date status
        const token = localStorage.getItem('token');
        if (token) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const response = await fetch(`${API_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            if (user.is_admin || user.isAdmin) {
              setIsAdmin(true);
              setIsPremium(true);
            }
            // Only monthly, yearly, lifetime plans have access
            const plan = (user.plan || user.subscription_plan || user.subscriptionPlan || '').toLowerCase();
            if (plan === 'monthly' || plan === 'yearly' || plan === 'lifetime' || plan === 'premium') {
              setIsPremium(true);
            }
          }
        }
      } catch (err) {
        console.error('Error checking access:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  const hasAccess = isPremium || isAdmin;

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 0.5, borderRadius: 2, bgcolor: hasAccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
          {hasAccess ? <Unlock size={18} color="#22C55E" /> : <Crown size={18} color="#F59E0B" />}
          <Typography variant="body2" sx={{ color: hasAccess ? '#22C55E' : '#F59E0B', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {hasAccess ? 'Premium Unlocked' : 'Premium Content'}
          </Typography>
        </Box>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
          Learning Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Master the art of trading with our comprehensive courses and resources
        </Typography>
      </Box>

      {/* Premium Notice */}
      {!hasAccess ? (
        <Alert 
          severity="info" 
          icon={<Crown size={20} />}
          sx={{ 
            mb: { xs: 2, sm: 3, md: 4 }, 
            bgcolor: 'rgba(0, 102, 255, 0.1)', 
            border: '1px solid rgba(0, 102, 255, 0.3)',
            '& .MuiAlert-icon': { color: '#0066FF' },
            '& .MuiAlert-message': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <strong>Premium Access Required:</strong> All courses are available exclusively to Monthly subscribers and above. 
            Upgrade your subscription to unlock unlimited access to all educational content.
          </Typography>
        </Alert>
      ) : (
        <Alert 
          severity="success" 
          icon={<Unlock size={20} />}
          sx={{ 
            mb: { xs: 2, sm: 3, md: 4 }, 
            bgcolor: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            '& .MuiAlert-icon': { color: '#22C55E' },
            '& .MuiAlert-message': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <strong>Premium Access Unlocked!</strong> You have full access to all courses and educational content. 
            Enjoy learning and trading!
          </Typography>
        </Alert>
      )}

      {/* Search and Filter */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
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
          sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', overflowX: 'auto', pb: 1 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              sx={{ fontWeight: selectedCategory === category ? 600 : 400, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, flexShrink: 0 }}
            />
          ))}
        </Box>
      </Box>

      {/* Courses Grid */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
          Courses ({filteredCourses.length})
        </Typography>
        {hasAccess ? (
          <Chip 
            icon={<Unlock size={14} />} 
            label="All Courses Unlocked" 
            size="small"
            sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}
          />
        ) : (
          <Chip 
            icon={<Lock size={14} />} 
            label="All Courses Locked" 
            size="small"
            sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
          />
        )}
      </Box>
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card 
              sx={{ 
                height: '100%', 
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              {/* Lock/Unlock Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {hasAccess ? (
                  <>
                    <Unlock size={14} color="#22C55E" />
                    <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 600 }}>
                      Unlocked
                    </Typography>
                  </>
                ) : (
                  <>
                    <Lock size={14} color="#F59E0B" />
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                      Premium
                    </Typography>
                  </>
                )}
              </Box>
              
              {/* Course Image */}
              <Box
                sx={{
                  height: { xs: 140, sm: 160, md: 180 },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={course.thumbnail}
                  alt={course.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                  }}
                />
                {/* Rating */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Star size={14} fill="#FFD700" color="#FFD700" />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {course.rating}
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={course.level}
                    size="small"
                    sx={{
                      bgcolor: `${getLevelColor(course.level)}20`,
                      color: getLevelColor(course.level),
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                    }}
                  />
                  <Chip 
                    label={course.category} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ lineHeight: 1.3, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: { xs: 32, sm: 40 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {course.description}
                </Typography>
                
                {/* Instructor */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Instructor: <strong>{course.instructor}</strong>
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                      <Video size={14} />
                      {course.lessons} lessons
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                      <Clock size={14} />
                      {course.duration}
                    </Typography>
                  </Box>
                </Box>
                
                {hasAccess ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<Play size={16} />}
                    sx={{
                      bgcolor: '#22C55E',
                      '&:hover': {
                        bgcolor: '#16A34A',
                      },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.75, sm: 1 },
                    }}
                  >
                    Start Learning
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    startIcon={<Lock size={16} />}
                    component={Link}
                    href="/auth/pricing"
                    sx={{
                      borderColor: '#F59E0B',
                      color: '#F59E0B',
                      '&:hover': {
                        borderColor: '#D97706',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                      },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.75, sm: 1 },
                    }}
                  >
                    Subscribe to Unlock
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQs */}
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
        Frequently Asked Questions
      </Typography>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}
