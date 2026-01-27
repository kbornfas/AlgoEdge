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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Copy,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function CopyTradingPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);

  const features = [
    { icon: <Zap size={20} />, title: 'Automated Execution', description: 'Trades are copied instantly to your account' },
    { icon: <Shield size={20} />, title: 'Risk Management', description: 'Set your own risk limits and stop copying anytime' },
    { icon: <TrendingUp size={20} />, title: 'Verified Performance', description: 'All trader stats are verified and audited' },
    { icon: <Users size={20} />, title: 'Choose Your Trader', description: 'Select from top-performing traders' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 6 } }}>
        <Chip label="Coming Soon" color="primary" sx={{ mb: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
          Copy Trading
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}>
          Automatically copy trades from successful traders directly to your MT5 account. No experience required.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: { xs: 2, sm: 3, md: 4 }, '& .MuiAlert-message': { fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
        <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Copy Trading is launching soon!</Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          We're finalizing partnerships with top traders and ensuring a secure, reliable copy trading experience. 
          Sign up for notifications to be the first to know when it's available.
        </Typography>
      </Alert>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
        {features.map((feature, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', py: { xs: 1.5, sm: 2, md: 3 } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 50, md: 60 },
                    height: { xs: 40, sm: 50, md: 60 },
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: { xs: 1, sm: 1.5, md: 2 },
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.25rem' } }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center', bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px solid rgba(0, 102, 255, 0.2)' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}>
          How Copy Trading Will Work
        </Typography>
        <List sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
          <ListItem sx={{ py: { xs: 0.5, sm: 1 } }}>
            <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}><Check color="#22C55E" size={20} /></ListItemIcon>
            <ListItemText primary="Connect your MT5 account to AlgoEdge" primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }} />
          </ListItem>
          <ListItem sx={{ py: { xs: 0.5, sm: 1 } }}>
            <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}><Check color="#22C55E" size={20} /></ListItemIcon>
            <ListItemText primary="Browse and select traders based on performance" primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }} />
          </ListItem>
          <ListItem sx={{ py: { xs: 0.5, sm: 1 } }}>
            <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}><Check color="#22C55E" size={20} /></ListItemIcon>
            <ListItemText primary="Set your risk preferences and allocation" primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }} />
          </ListItem>
          <ListItem sx={{ py: { xs: 0.5, sm: 1 } }}>
            <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}><Check color="#22C55E" size={20} /></ListItemIcon>
            <ListItemText primary="Trades are automatically copied to your account" primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }} />
          </ListItem>
          <ListItem sx={{ py: { xs: 0.5, sm: 1 } }}>
            <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}><Check color="#22C55E" size={20} /></ListItemIcon>
            <ListItemText primary="Monitor performance and adjust settings anytime" primaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }} />
          </ListItem>
        </List>
        <Button variant="contained" size="large" sx={{ mt: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }, py: { xs: 1, sm: 1.5 } }} disabled>
          <Clock size={18} style={{ marginRight: 8 }} />
          Coming Soon
        </Button>
      </Card>
    </Container>
  );
}
