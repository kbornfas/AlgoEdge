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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Chip label="Coming Soon" color="primary" sx={{ mb: 2 }} />
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Copy Trading
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Automatically copy trades from successful traders directly to your MT5 account. No experience required.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography fontWeight={600}>Copy Trading is launching soon!</Typography>
        <Typography variant="body2">
          We're finalizing partnerships with top traders and ensuring a secure, reliable copy trading experience. 
          Sign up for notifications to be the first to know when it's available.
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
                    bgcolor: 'primary.main',
                    color: 'white',
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
          How Copy Trading Will Work
        </Typography>
        <List sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
          <ListItem>
            <ListItemIcon><Check color="#22C55E" /></ListItemIcon>
            <ListItemText primary="Connect your MT5 account to AlgoEdge" />
          </ListItem>
          <ListItem>
            <ListItemIcon><Check color="#22C55E" /></ListItemIcon>
            <ListItemText primary="Browse and select traders based on performance" />
          </ListItem>
          <ListItem>
            <ListItemIcon><Check color="#22C55E" /></ListItemIcon>
            <ListItemText primary="Set your risk preferences and allocation" />
          </ListItem>
          <ListItem>
            <ListItemIcon><Check color="#22C55E" /></ListItemIcon>
            <ListItemText primary="Trades are automatically copied to your account" />
          </ListItem>
          <ListItem>
            <ListItemIcon><Check color="#22C55E" /></ListItemIcon>
            <ListItemText primary="Monitor performance and adjust settings anytime" />
          </ListItem>
        </List>
        <Button variant="contained" size="large" sx={{ mt: 3 }} disabled>
          <Clock size={18} style={{ marginRight: 8 }} />
          Coming Soon
        </Button>
      </Card>
    </Container>
  );
}
