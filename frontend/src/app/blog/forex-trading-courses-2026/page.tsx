'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid,
  Avatar,
  Rating,
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, Star, BookOpen, Video, FileText, Award, Users, TrendingUp, ArrowRight, GraduationCap, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const courses = [
  {
    rank: 1,
    name: 'AlgoEdge Complete Trading Mastery',
    rating: 4.9,
    students: 12500,
    hours: 45,
    modules: 12,
    price: '$299',
    salePrice: '$199',
    type: 'Video Course',
    level: 'Beginner to Advanced',
    instructor: 'AlgoEdge Academy',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    features: ['Lifetime access', 'Certificate', 'Live Q&A sessions', 'Private community'],
    recommended: true,
  },
  {
    rank: 2,
    name: 'Price Action Bible eBook',
    rating: 4.8,
    students: 8700,
    pages: 380,
    price: '$49',
    salePrice: '$39',
    type: 'eBook',
    level: 'Intermediate',
    instructor: 'AlgoEdge Academy',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=250&fit=crop',
    features: ['PDF + ePub formats', '200+ chart examples', 'Downloadable checklists'],
    recommended: true,
  },
  {
    rank: 3,
    name: 'Ultimate MT5 Indicator Pack',
    rating: 4.7,
    students: 5200,
    indicators: 25,
    price: '$149',
    salePrice: '$99',
    type: 'Indicators',
    level: 'All Levels',
    instructor: 'AlgoEdge Dev Team',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    features: ['Source code included', 'Lifetime updates', 'Video tutorials'],
    recommended: false,
  },
  {
    rank: 4,
    name: 'Smart Money Concepts Course',
    rating: 4.8,
    students: 6300,
    hours: 28,
    modules: 8,
    price: '$199',
    salePrice: '$149',
    type: 'Video Course',
    level: 'Intermediate to Advanced',
    instructor: 'AlgoEdge Academy',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
    features: ['ICT concepts', 'Order blocks', 'Liquidity analysis'],
    recommended: false,
  },
  {
    rank: 5,
    name: 'Trading Psychology Masterclass',
    rating: 4.6,
    students: 4100,
    hours: 12,
    modules: 6,
    price: '$99',
    salePrice: '$79',
    type: 'Video Course',
    level: 'All Levels',
    instructor: 'Dr. Sarah Mitchell',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=250&fit=crop',
    features: ['Mindset training', 'Journal templates', 'Workbook included'],
    recommended: false,
  },
];

const curriculum = [
  { module: 1, title: 'Foundation: Market Structure', lessons: 8, duration: '3.5 hours', topics: ['Price action basics', 'Trend identification', 'Support & resistance', 'Market phases'] },
  { module: 2, title: 'Technical Analysis Mastery', lessons: 12, duration: '5 hours', topics: ['Candlestick patterns', 'Chart patterns', 'Indicators', 'Multiple timeframe analysis'] },
  { module: 3, title: 'Entry & Exit Strategies', lessons: 10, duration: '4 hours', topics: ['Entry triggers', 'Stop loss placement', 'Take profit strategies', 'Scaling in/out'] },
  { module: 4, title: 'Risk Management', lessons: 8, duration: '3 hours', topics: ['Position sizing', 'Risk/reward ratios', 'Drawdown management', 'Portfolio allocation'] },
  { module: 5, title: 'Trading Psychology', lessons: 6, duration: '2.5 hours', topics: ['Emotional control', 'Discipline building', 'Loss recovery', 'Peak performance'] },
  { module: 6, title: 'Advanced Strategies', lessons: 15, duration: '6 hours', topics: ['Smart money concepts', 'Order flow', 'Algorithmic trading', 'News trading'] },
];

export default function ForexEducationGuidePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        py: 6,
      }}
    >
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          component={Link}
          href="/blog"
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'text.secondary', mb: 4, textTransform: 'none' }}
        >
          Back to Blog
        </Button>

        {/* Article Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip 
              label="Forex Education" 
              size="small" 
              sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', fontWeight: 600 }} 
            />
            <Chip 
              label="Course Reviews" 
              size="small" 
              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontWeight: 600 }} 
            />
          </Stack>
          
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 800,
              color: 'white',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Best Forex Trading Courses & Education in 2026: Complete Learning Guide
          </Typography>

          <Typography
            sx={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.8)',
              mb: 3,
              lineHeight: 1.7,
            }}
          >
            Master forex trading with the best courses, ebooks, and educational resources. Compare top-rated programs, 
            learn what to look for, and start your journey from beginner to profitable trader.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 25, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">14 min read</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Featured Image */}
        <Box
          sx={{
            width: '100%',
            height: 400,
            borderRadius: 3,
            overflow: 'hidden',
            mb: 6,
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=400&fit=crop"
            alt="Forex Trading Education"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </Box>

        {/* Key Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { icon: <Users size={24} />, value: '50,000+', label: 'Students Enrolled', color: '#22C55E' },
            { icon: <GraduationCap size={24} />, value: '45+', label: 'Hours of Content', color: '#3B82F6' },
            { icon: <Star size={24} />, value: '4.8/5', label: 'Average Rating', color: '#F59E0B' },
            { icon: <Award size={24} />, value: '95%', label: 'Completion Rate', color: '#8B5CF6' },
          ].map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: 'rgba(255,255,255,0.03)', 
                borderRadius: 2, 
                border: '1px solid rgba(255,255,255,0.08)',
                textAlign: 'center',
              }}>
                <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                <Typography sx={{ color: stat.color, fontWeight: 800, fontSize: '1.5rem' }}>{stat.value}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Key Takeaways */}
        <Alert 
          severity="info" 
          icon={<BookOpen size={20} />}
          sx={{ 
            mb: 6, 
            bgcolor: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            '& .MuiAlert-message': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiAlert-icon': { color: '#F59E0B' },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Key Takeaways
          </Typography>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Quality education significantly reduces the learning curve and prevents costly mistakes</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• The best courses combine theory with practical exercises and live market examples</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• AlgoEdge Complete Trading Mastery rated #1 with 12,500+ students</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Always practice on a demo account before risking real money</ListItem>
          </List>
        </Alert>

        {/* Table of Contents */}
        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 700 }}>
            📑 Table of Contents
          </Typography>
          <List dense>
            {[
              'Why Forex Education Matters',
              'Top 5 Trading Courses Reviewed',
              'What to Look For in a Course',
              'Sample Curriculum Breakdown',
              'Types of Learning Resources',
              'Getting Started: Your Learning Path',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <Typography sx={{ color: '#F59E0B', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {index + 1}. {item}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Introduction */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Why Forex Education Matters
        </Typography>
        
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
          The forex market processes over <strong>$7.5 trillion in daily volume</strong>, making it the largest financial 
          market in the world. Yet, studies show that <strong>70-80% of retail traders lose money</strong>. The difference 
          between profitable traders and the rest? Education and proper training.
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
          Self-taught traders often spend years learning lessons the hard way - through blown accounts and painful 
          mistakes. A structured trading education can compress years of learning into months, teaching you:
        </Typography>

        <List sx={{ mb: 4 }}>
          {[
            'Proven trading strategies that actually work',
            'Risk management techniques to protect your capital',
            'Technical and fundamental analysis skills',
            'Trading psychology and emotional discipline',
            'How to create and follow a trading plan',
          ].map((item, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle size={18} color="#22C55E" />
              </ListItemIcon>
              <ListItemText primary={item} sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.9)' } }} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Course Reviews */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Top 5 Forex Trading Courses (2026)
        </Typography>

        {courses.map((course) => (
          <Card 
            key={course.rank}
            sx={{ 
              mb: 3, 
              bgcolor: course.recommended ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)', 
              border: course.recommended ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Grid container>
              {/* Course Image */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: { xs: 200, md: '100%' },
                    minHeight: 200,
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src={course.image}
                    alt={course.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {course.recommended && (
                    <Chip 
                      label="Editor's Pick" 
                      size="small" 
                      sx={{ 
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: '#F59E0B', 
                        color: '#000',
                        fontWeight: 700,
                      }} 
                    />
                  )}
                  <Chip 
                    label={course.type} 
                    size="small" 
                    sx={{ 
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      bgcolor: 'rgba(0,0,0,0.7)', 
                      color: 'white',
                    }} 
                  />
                </Box>
              </Grid>

              {/* Course Details */}
              <Grid item xs={12} md={8}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                        {course.rank === 1 ? '🥇 ' : course.rank === 2 ? '🥈 ' : course.rank === 3 ? '🥉 ' : `#${course.rank} `}
                        {course.name}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        by {course.instructor} • {course.level}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {course.salePrice !== course.price && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                          {course.price}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.5rem' }}>
                        {course.salePrice}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < Math.floor(course.rating) ? '#EAB308' : 'transparent'} color="#EAB308" />
                    ))}
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', ml: 1 }}>
                      {course.rating} ({course.students.toLocaleString()} students)
                    </Typography>
                  </Stack>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {course.hours && (
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Video size={16} color="#3B82F6" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                            {course.hours}h video
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {course.modules && (
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BookOpen size={16} color="#22C55E" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                            {course.modules} modules
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {course.pages && (
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FileText size={16} color="#8B5CF6" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                            {course.pages} pages
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {course.indicators && (
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <BarChart3 size={16} color="#EC4899" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                            {course.indicators} indicators
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    <Grid item xs={6} sm={3}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Users size={16} color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                          {course.students.toLocaleString()} enrolled
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    {course.features.map((feature, i) => (
                      <Chip 
                        key={i}
                        label={feature}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.08)', 
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.75rem',
                          mb: 0.5,
                        }}
                      />
                    ))}
                  </Stack>

                  <Button 
                    component={Link}
                    href="/marketplace/products"
                    variant="contained"
                    endIcon={<ArrowRight size={16} />}
                    sx={{ 
                      bgcolor: '#F59E0B', 
                      color: '#000',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#D97706' }
                    }}
                  >
                    View Course
                  </Button>
                </CardContent>
              </Grid>
            </Grid>
          </Card>
        ))}

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* What to Look For */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          What to Look For in a Trading Course
        </Typography>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { icon: <GraduationCap size={24} />, title: 'Qualified Instructors', desc: 'Verified track record with real trading experience, not just theory', color: '#22C55E' },
            { icon: <Target size={24} />, title: 'Practical Application', desc: 'Live examples, exercises, and real market analysis - not just slides', color: '#3B82F6' },
            { icon: <Users size={24} />, title: 'Community Support', desc: 'Access to fellow students, Q&A sessions, and ongoing mentorship', color: '#F59E0B' },
            { icon: <Award size={24} />, title: 'Updated Content', desc: 'Regular updates to reflect current market conditions and strategies', color: '#8B5CF6' },
            { icon: <TrendingUp size={24} />, title: 'Progressive Structure', desc: 'Clear learning path from basics to advanced concepts', color: '#EC4899' },
            { icon: <BarChart3 size={24} />, title: 'Risk Management Focus', desc: 'Emphasis on capital preservation, not just profit potential', color: '#14B8A6' },
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ 
                bgcolor: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': { borderColor: feature.color, transform: 'translateY(-4px)' }
              }}>
                <CardContent>
                  <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1, fontSize: '1rem' }}>{feature.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{feature.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Sample Curriculum */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Sample Curriculum: AlgoEdge Trading Mastery
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.8 }}>
          Here's what you'll learn in our comprehensive 45-hour trading course:
        </Typography>

        {curriculum.map((module, index) => (
          <Paper 
            key={index}
            sx={{ 
              p: 3, 
              bgcolor: 'rgba(255,255,255,0.03)', 
              borderRadius: 2, 
              mb: 2, 
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s',
              '&:hover': { borderColor: 'rgba(245, 158, 11, 0.3)' }
            }}
          >
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#F59E0B', color: '#000', fontWeight: 700, width: 32, height: 32, fontSize: '0.9rem' }}>
                    {module.module}
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                    {module.title}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 2, ml: 6 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    📚 {module.lessons} lessons
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    ⏱️ {module.duration}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ ml: 6 }}>
                  {module.topics.map((topic, i) => (
                    <Chip 
                      key={i}
                      label={topic}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(245, 158, 11, 0.1)', 
                        color: '#F59E0B',
                        fontSize: '0.75rem',
                        mb: 0.5,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ))}

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Types of Resources */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Types of Learning Resources
        </Typography>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { 
              type: 'Video Courses', 
              icon: <Video size={32} />, 
              desc: 'Comprehensive video lessons with visual demonstrations of charts and strategies. Best for visual learners.',
              pros: ['Visual learning', 'Step-by-step', 'Replay anytime'],
              color: '#3B82F6'
            },
            { 
              type: 'eBooks & PDFs', 
              icon: <FileText size={32} />, 
              desc: 'In-depth written guides with chart examples and detailed explanations. Perfect for reference.',
              pros: ['Detailed content', 'Easy reference', 'Printable'],
              color: '#8B5CF6'
            },
            { 
              type: 'Indicators & Tools', 
              icon: <BarChart3 size={32} />, 
              desc: 'Custom MT4/MT5 indicators and trading tools to enhance your technical analysis.',
              pros: ['Practical tools', 'Save time', 'Proven systems'],
              color: '#22C55E'
            },
            { 
              type: 'Mentorship', 
              icon: <Users size={32} />, 
              desc: 'One-on-one or group coaching with experienced traders. Fastest way to improve.',
              pros: ['Personalized', 'Direct feedback', 'Accountability'],
              color: '#F59E0B'
            },
          ].map((resource, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card sx={{ 
                bgcolor: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                height: '100%',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: resource.color, mb: 2 }}>{resource.icon}</Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{resource.type}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontSize: '0.9rem' }}>{resource.desc}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {resource.pros.map((pro, i) => (
                      <Chip 
                        key={i}
                        icon={<CheckCircle size={12} />}
                        label={pro}
                        size="small"
                        sx={{ 
                          bgcolor: `${resource.color}20`, 
                          color: resource.color,
                          fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: resource.color }
                        }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: 'rgba(245, 158, 11, 0.1)', 
          borderRadius: 3, 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center',
          mb: 5,
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Ready to Master Forex Trading?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join 12,500+ students who have transformed their trading with AlgoEdge education. Start with our complete course bundle and save 30%.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              component={Link}
              href="/marketplace/products"
              variant="contained" 
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ 
                bgcolor: '#F59E0B', 
                color: '#000', 
                fontWeight: 700,
                px: 4,
                '&:hover': { bgcolor: '#D97706' }
              }}
            >
              Browse All Courses
            </Button>
            <Button 
              component={Link}
              href="/auth/register"
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: '#F59E0B', 
                color: '#F59E0B',
                fontWeight: 700,
                px: 4,
                '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(245, 158, 11, 0.1)' }
              }}
            >
              Create Free Account
            </Button>
          </Stack>
        </Paper>

        {/* FAQ */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Frequently Asked Questions
        </Typography>

        {[
          { q: 'Do I need any prior trading experience?', a: 'No! Our courses are designed for complete beginners. We start with the absolute basics and progressively build up to advanced strategies.' },
          { q: 'How long does it take to complete the course?', a: 'The full course is 45 hours of video content. Most students complete it in 4-8 weeks, studying 1-2 hours daily. You have lifetime access, so go at your own pace.' },
          { q: 'Is there a certificate upon completion?', a: 'Yes, you receive a verifiable certificate of completion that you can add to your LinkedIn profile or resume.' },
          { q: 'What if I have questions during the course?', a: 'You get access to our private student community and weekly live Q&A sessions where you can ask questions directly to our instructors.' },
        ].map((faq, index) => (
          <Paper key={index} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{faq.q}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{faq.a}</Typography>
          </Paper>
        ))}

        {/* Author */}
        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Written by <strong style={{ color: 'white' }}>AlgoEdge Academy Team</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last updated: January 25, 2026
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/blog"
            variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            More Articles
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
