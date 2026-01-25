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
  Alert,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Users,
  MessageSquare,
  Trophy,
  Calendar,
  Clock,
} from 'lucide-react';

export default function CommunityPage() {
  const features = [
    { 
      icon: <MessageSquare size={24} />, 
      title: 'Trading Discussions', 
      description: 'Share ideas, ask questions, and learn from experienced traders',
      color: '#0066FF'
    },
    { 
      icon: <Trophy size={24} />, 
      title: 'Trading Competitions', 
      description: 'Participate in weekly and monthly trading challenges',
      color: '#FFD700'
    },
    { 
      icon: <Calendar size={24} />, 
      title: 'Live Events', 
      description: 'Join webinars, AMAs, and live trading sessions',
      color: '#22C55E'
    },
    { 
      icon: <Users size={24} />, 
      title: 'Networking', 
      description: 'Connect with traders from around the world',
      color: '#A855F7'
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Chip label="Coming Soon" color="primary" sx={{ mb: 2 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Community Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Connect with fellow traders, share strategies, and grow together in our vibrant trading community.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography fontWeight={600}>Community features are coming soon!</Typography>
        <Typography variant="body2">
          We're building a powerful community platform where you can connect with other traders, 
          share strategies, and participate in exciting events. Stay tuned!
        </Typography>
      </Alert>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', py: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    bgcolor: `${feature.color}20`,
                    color: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px solid rgba(0, 102, 255, 0.2)' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Join 5,000+ Traders Waiting
        </Typography>
        <AvatarGroup max={5} sx={{ justifyContent: 'center', mb: 2 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Avatar 
              key={i} 
              src={`https://images.unsplash.com/photo-${1500000000000 + i * 100}?w=40&h=40&fit=crop&crop=face`}
              sx={{ width: 50, height: 50 }}
            />
          ))}
        </AvatarGroup>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Be the first to know when our community launches. Get early access and exclusive perks.
        </Typography>
        <Button variant="contained" size="large" disabled>
          <Clock size={18} style={{ marginRight: 8 }} />
          Coming Soon
        </Button>
      </Card>
    </Container>
  );
}
