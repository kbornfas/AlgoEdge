'use client';

import { useState, useEffect } from 'react';
import PullToRefresh from '@/components/PullToRefresh';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Wallet,
  TrendingUp,
  Package,
  Bot,
  Signal,
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCcw,
  ShieldCheck,
  Camera,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

interface SellerStats {
  wallet: {
    available_balance: number;
    pending_earnings: number;
    total_earnings: number;
    total_payouts: number;
  };
  is_verified: boolean;
  verification_pending: boolean;
  profile_image?: string;
  seller_slug?: string;
  totals: {
    bots: number;
    products: number;
    signals?: number;
    total_sales: number;
    total_revenue: number;
    avg_rating: number;
  };
  recent_transactions: Transaction[];
  listings: {
    bots: BotListing[];
    products: ProductListing[];
  };
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface BotListing {
  id: number;
  name: string;
  slug: string;
  price: number;
  is_free: boolean;
  status: string;
  total_purchases: number;
  avg_rating: number;
  created_at: string;
}

interface ProductListing {
  id: number;
  name: string;
  slug: string;
  price: number;
  type: string;
  status: string;
  total_purchases: number;
  avg_rating: number;
  created_at: string;
}

export default function SellerDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/status/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsSeller(data.is_seller);
        if (data.application) {
          setApplicationStatus(data.application.status);
        }
        
        // Only fetch seller stats if user is a seller
        if (data.is_seller) {
          await fetchSellerStats();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
      setLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Map API response to SellerStats interface
        const mappedStats: SellerStats = {
          wallet: {
            available_balance: parseFloat(data.wallet?.available_balance) || 0,
            pending_earnings: parseFloat(data.wallet?.pending_earnings) || 0,
            total_earnings: parseFloat(data.wallet?.total_earnings) || 0,
            total_payouts: parseFloat(data.wallet?.total_payouts) || 0,
          },
          is_verified: data.verification?.is_verified || false,
          verification_pending: data.verification?.verification_pending || false,
          profile_image: data.verification?.profile_image || undefined,
          seller_slug: data.verification?.seller_slug || undefined,
          totals: {
            bots: data.listings?.bots?.length || 0,
            products: data.listings?.products?.length || 0,
            signals: data.listings?.signalProvider ? 1 : 0,
            total_sales: data.listings?.bots?.reduce((sum: number, b: any) => sum + (b.total_sales || 0), 0) +
                         data.listings?.products?.reduce((sum: number, p: any) => sum + (p.total_sales || 0), 0),
            total_revenue: parseFloat(data.wallet?.total_earnings) || 0,
            avg_rating: 4.5,
          },
          recent_transactions: data.transactions || [],
          listings: {
            bots: data.listings?.bots || [],
            products: data.listings?.products || [],
          },
        };
        setStats(mappedStats);
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/payouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          method: payoutMethod,
          details: payoutDetails,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Payout request submitted successfully!');
        setPayoutDialogOpen(false);
        fetchSellerStats();
      } else {
        setError(data.error || 'Failed to request payout');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerifyLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/request-verification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          setSuccess('Verification request submitted! You will be notified once approved.');
          setVerifyDialogOpen(false);
          fetchSellerStats();
        }
      } else {
        setError(data.error || 'Failed to request verification');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  // Show "Become a Seller" screen if user is not a seller
  if (isSeller === false) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
        <Container maxWidth="md">
          <Card sx={{ 
            bgcolor: 'rgba(139, 92, 246, 0.1)', 
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 4,
            textAlign: 'center',
            py: 8,
            px: 4
          }}>
            <CardContent>
              <Box sx={{ 
                width: 100, height: 100, 
                borderRadius: '50%', 
                bgcolor: 'rgba(139, 92, 246, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3
              }}>
                <Package size={48} color="#8B5CF6" />
              </Box>
              
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
                Become a Seller
              </Typography>
              
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, maxWidth: 500, mx: 'auto' }}>
                {applicationStatus === 'pending' 
                  ? "Your seller application is being reviewed. You'll be notified once it's approved."
                  : applicationStatus === 'rejected'
                  ? "Your previous application was not approved. You can apply again with updated information."
                  : "Join our marketplace and start selling your trading bots, educational content, signals, and more to thousands of traders worldwide."}
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" sx={{ color: '#22C55E', fontWeight: 800 }}>80%</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Revenue Share</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" sx={{ color: '#00D4FF', fontWeight: 800 }}>0</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Listing Fee</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" sx={{ color: '#FF6B6B', fontWeight: 800 }}>24/7</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Support</Typography>
                </Box>
              </Stack>

              {applicationStatus === 'pending' ? (
                <Chip 
                  label="Application Under Review" 
                  color="warning" 
                  sx={{ fontSize: 16, py: 2, px: 3 }}
                />
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  href="/dashboard/seller/apply"
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                    color: 'white',
                    fontWeight: 700,
                    px: 6,
                    py: 1.5,
                    fontSize: 16,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
                    }
                  }}
                >
                  Apply to Become a Seller
                </Button>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await fetchSellerStats(); }}>
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, overflow: 'hidden', maxWidth: '100vw' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 2,
          mb: { xs: 2, md: 4 } 
        }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Seller Dashboard
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Manage your listings and track your earnings
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              startIcon={<Plus size={18} />}
              variant="outlined"
              fullWidth
              sx={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}
              component={Link}
              href="/dashboard/seller/create"
            >
              Add Listing
            </Button>
            <Button
              startIcon={<Wallet size={18} />}
              variant="contained"
              fullWidth
              onClick={() => setPayoutDialogOpen(true)}
              disabled={!stats?.wallet?.available_balance || stats.wallet.available_balance < 50}
              sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
            >
              Request Payout
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Verified Status Alert - Show for verified sellers */}
        {stats?.is_verified && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: { xs: 2, md: 3 }, 
              bgcolor: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.3)',
              '& .MuiAlert-icon': { color: '#22C55E' },
              '& .MuiAlert-message': { color: 'white' }
            }}
            icon={
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#22C55E"/>
              </svg>
            }
          >
            You are a verified seller! Your verified badge is displayed on all your listings.
          </Alert>
        )}

        {/* Verification Badge Card - Only show for non-verified sellers */}
        {!stats?.is_verified && (
        <Card
          sx={{
            mb: { xs: 2, md: 4 },
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={28} color="#8B5CF6" />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                      Get Verified
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.8rem', md: '1rem' } }}>
                      Boost your credibility with a verified seller badge
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1, md: 3 }} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={14} color="#22C55E" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Verified badge on all listings
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={14} color="#22C55E" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Higher visibility in search
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle size={14} color="#22C55E" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Increased buyer confidence
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                {stats?.verification_pending ? (
                  <Chip
                    icon={<Clock size={16} />}
                    label="Verification Pending"
                    sx={{
                      bgcolor: 'rgba(245, 158, 11, 0.2)',
                      color: '#F59E0B',
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '2rem', mb: 0.5 }}>
                      $50
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                      One-time payment
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={
                        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="white"/>
                        </svg>
                      }
                      onClick={handleRequestVerification}
                      disabled={verifyLoading}
                      sx={{
                        bgcolor: '#1D9BF0',
                        '&:hover': { bgcolor: '#1A8CD8' },
                        fontWeight: 700,
                        px: 3,
                      }}
                    >
                      {verifyLoading ? <CircularProgress size={20} color="inherit" /> : 'Get Verified Now'}
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        )}

        {/* Quick Actions */}
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, md: 4 } }}>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Package size={18} />}
              component={Link}
              href="/dashboard/seller/listings"
              sx={{
                py: { xs: 1.5, md: 2 },
                borderColor: 'rgba(34, 197, 94, 0.5)',
                color: '#22C55E',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34, 197, 94, 0.1)' },
                '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Manage Listings & Prices</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Listings</Box>
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download size={18} />}
              component={Link}
              href="/dashboard/seller/deliverables"
              sx={{
                py: { xs: 1.5, md: 2 },
                borderColor: 'rgba(245, 158, 11, 0.5)',
                color: '#F59E0B',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.1)' },
                '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Manage Deliverables</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Deliverables</Box>
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Users size={18} />}
              component={Link}
              href="/dashboard/seller/customers"
              sx={{
                py: { xs: 1.5, md: 2 },
                borderColor: 'rgba(59, 130, 246, 0.5)',
                color: '#3B82F6',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 246, 0.1)' },
                '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>View Customers</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Customers</Box>
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Star size={18} />}
              component={Link}
              href="/dashboard/seller/reviews"
              sx={{
                py: { xs: 1.5, md: 2 },
                borderColor: 'rgba(139, 92, 246, 0.5)',
                color: '#8B5CF6',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.1)' },
                '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Reviews & Ratings</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Reviews</Box>
            </Button>
          </Grid>
        </Grid>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Share Your Links Card */}
        <Card
          sx={{
            mb: { xs: 2, md: 4 },
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 3 } }}>
            <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="center" sx={{ mb: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  p: { xs: 1, md: 1.5 },
                  bgcolor: 'rgba(34, 197, 94, 0.2)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowUpRight size={24} color="#22C55E" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.5rem' } }}>
                  Share Your Links
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.75rem', md: '1rem' } }}>
                  Promote your profile and products on social media
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              {/* Seller Profile Link */}
              <Grid item xs={12}>
                <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                    Your Seller Profile
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                      <Typography sx={{ color: '#22C55E', fontFamily: 'monospace', fontSize: { xs: '0.7rem', md: '0.85rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {process.env.NEXT_PUBLIC_APP_URL || 'https://algoedgehub.com'}/sellers/{stats?.seller_slug || 'your-username'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'https://algoedgehub.com'}/sellers/${stats?.seller_slug || 'your-username'}`);
                        setSuccess('Profile link copied!');
                      }}
                      sx={{ color: '#22C55E' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>

              {/* Product Links */}
              {stats?.listings?.bots?.filter(b => b.status === 'approved')?.slice(0, 3).map((bot) => (
                <Grid item xs={12} sm={6} md={4} key={`bot-${bot.id}`}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Bot size={14} color="#8B5CF6" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bot.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.7rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        /marketplace/bots/{bot.slug}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'https://algoedgehub.com'}/marketplace/bots/${bot.slug}`);
                          setSuccess('Link copied!');
                        }}
                        sx={{ color: '#8B5CF6', p: 0.5 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
              {stats?.listings?.products?.filter(p => p.status === 'approved')?.slice(0, 3).map((product) => (
                <Grid item xs={12} sm={6} md={4} key={`product-${product.id}`}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <FileText size={14} color="#F59E0B" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.7rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        /marketplace/products/{product.slug}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL || 'https://algoedgehub.com'}/marketplace/products/${product.slug}`);
                          setSuccess('Link copied!');
                        }}
                        sx={{ color: '#F59E0B', p: 0.5 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Wallet Stats */}
        <Grid container spacing={{ xs: 1, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', minWidth: 0 }}>
              <CardContent sx={{ p: { xs: 1, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ p: 0.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 1, flexShrink: 0 }}>
                    <Wallet size={14} color="#8B5CF6" />
                  </Box>
                  <Chip
                    label="Available"
                    size="small"
                    sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', height: 18, fontSize: '0.55rem', display: { xs: 'none', sm: 'flex' } }}
                  />
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.6rem', md: '0.875rem' } }}>
                  Available
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.75rem' } }}>
                  ${Number(stats?.wallet?.available_balance || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', minWidth: 0 }}>
              <CardContent sx={{ p: { xs: 1, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ p: 0.5, bgcolor: 'rgba(245, 158, 11, 0.2)', borderRadius: 1, flexShrink: 0 }}>
                    <Clock size={14} color="#F59E0B" />
                  </Box>
                  <Chip
                    label="Pending"
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', height: 18, fontSize: '0.55rem', display: { xs: 'none', sm: 'flex' } }}
                  />
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.6rem', md: '0.875rem' } }}>
                  Pending
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.75rem' } }}>
                  ${Number(stats?.wallet?.pending_earnings || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', minWidth: 0 }}>
              <CardContent sx={{ p: { xs: 1, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ p: 0.5, bgcolor: 'rgba(34, 197, 94, 0.2)', borderRadius: 1, flexShrink: 0 }}>
                    <TrendingUp size={14} color="#22C55E" />
                  </Box>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.6rem', md: '0.875rem' } }}>
                  Total Earned
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.75rem' } }}>
                  ${Number(stats?.wallet?.total_earnings || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', minWidth: 0 }}>
              <CardContent sx={{ p: { xs: 1, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ p: 0.5, bgcolor: 'rgba(59, 130, 246, 0.2)', borderRadius: 1, flexShrink: 0 }}>
                    <DollarSign size={14} color="#3B82F6" />
                  </Box>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.6rem', md: '0.875rem' } }}>
                  Paid Out
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.75rem' } }}>
                  ${Number(stats?.wallet?.total_payouts || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Grid container spacing={{ xs: 1, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Bot size={20} color="#8B5CF6" />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                    Bots
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {stats?.totals?.bots || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Package size={20} color="#3B82F6" />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                    Products
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {stats?.totals?.products || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Users size={20} color="#22C55E" />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                    Sales
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {stats?.totals?.total_sales || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star size={20} color="#F59E0B" />
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                    Rating
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    {Number(stats?.totals?.avg_rating || 0).toFixed(1)} ★
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: { xs: 2, md: 3 },
            '& .MuiTab-root': { 
              color: 'rgba(255,255,255,0.5)',
              minWidth: { xs: 'auto', sm: 'unset' },
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            },
            '& .Mui-selected': { color: '#8B5CF6' },
            '& .MuiTabs-indicator': { bgcolor: '#8B5CF6' },
          }}
        >
          <Tab label="Bots" icon={<Bot size={16} />} iconPosition="start" />
          <Tab label="Products" icon={<Package size={16} />} iconPosition="start" />
          <Tab label="Transactions" icon={<FileText size={16} />} iconPosition="start" />
        </Tabs>

        {/* Bots Tab */}
        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 500, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Bot</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Price</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Sales</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Rating</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.7rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.listings?.bots?.length ? (
                  stats.listings.bots.map((bot) => (
                    <TableRow key={bot.id}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', width: 32, height: 32 }}>
                            <Bot size={16} color="#8B5CF6" />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 100, md: 200 } }}>{bot.name}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {bot.is_free ? 'Free' : `$${bot.price}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bot.status}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            bgcolor: bot.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 
                                     bot.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: bot.status === 'approved' ? '#22C55E' : 
                                   bot.status === 'pending' ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{bot.total_purchases}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Star size={12} fill="#F59E0B" color="#F59E0B" />
                          <Typography sx={{ color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{Number(bot.avg_rating || 0).toFixed(1)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, bot)}>
                          <MoreVertical size={16} color="white" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No bots listed yet</Typography>
                      <Button
                        component={Link}
                        href="/dashboard/seller/create?type=bot"
                        startIcon={<Plus size={16} />}
                        sx={{ mt: 2, color: '#8B5CF6' }}
                      >
                        Create Your First Bot
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Products Tab */}
        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Product</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Type</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Price</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Sales</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Rating</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.listings?.products?.length ? (
                  stats.listings.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)' }}>
                            <Package size={20} color="#3B82F6" />
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>{product.name}</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                              {product.slug}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.type} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'white' }}>${product.price}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          size="small"
                          sx={{
                            bgcolor: product.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 
                                     product.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: product.status === 'approved' ? '#22C55E' : 
                                   product.status === 'pending' ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'white' }}>{product.total_purchases}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Star size={14} fill="#F59E0B" color="#F59E0B" />
                          <Typography sx={{ color: 'white' }}>{Number(product.avg_rating || 0).toFixed(1)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, product)}>
                          <MoreVertical size={18} color="white" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No products listed yet</Typography>
                      <Button
                        component={Link}
                        href="/dashboard/seller/create?type=product"
                        startIcon={<Plus size={16} />}
                        sx={{ mt: 2, color: '#8B5CF6' }}
                      >
                        Create Your First Product
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Transactions Tab */}
        {activeTab === 2 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Date</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Type</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Description</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.recent_transactions?.length ? (
                  stats.recent_transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type}
                          size="small"
                          icon={tx.type === 'sale' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          sx={{
                            bgcolor: tx.type === 'sale' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: tx.type === 'sale' ? '#22C55E' : '#3B82F6',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{tx.description}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: tx.type === 'sale' ? '#22C55E' : '#3B82F6',
                            fontWeight: 600,
                          }}
                        >
                          {tx.type === 'sale' ? '+' : '-'}${Number(Math.abs(tx.amount) || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {tx.status === 'completed' && <CheckCircle size={14} color="#22C55E" />}
                          {tx.status === 'pending' && <Clock size={14} color="#F59E0B" />}
                          {tx.status === 'failed' && <XCircle size={14} color="#EF4444" />}
                          <Typography
                            sx={{
                              color: tx.status === 'completed' ? '#22C55E' : 
                                     tx.status === 'pending' ? '#F59E0B' : '#EF4444',
                              fontSize: '0.875rem',
                            }}
                          >
                            {tx.status}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No transactions yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <MenuItem
            onClick={() => {
              window.open(`/marketplace/bots/${selectedItem?.slug}`, '_blank');
              handleMenuClose();
            }}
            sx={{ color: 'white' }}
          >
            <Eye size={16} style={{ marginRight: 8 }} /> View
          </MenuItem>
          <MenuItem
            onClick={() => {
              // Navigate to edit page
              handleMenuClose();
            }}
            sx={{ color: 'white' }}
          >
            <Edit size={16} style={{ marginRight: 8 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: '#EF4444' }}>
            <Trash2 size={16} style={{ marginRight: 8 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Payout Dialog */}
        <Dialog
          open={payoutDialogOpen}
          onClose={() => setPayoutDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <DialogTitle sx={{ color: 'white' }}>Request Payout</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
              Available balance: <strong style={{ color: '#22C55E' }}>${Number(stats?.wallet?.available_balance || 0).toFixed(2)}</strong>
            </Typography>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
              inputProps={{ min: 50, max: stats?.wallet?.available_balance || 0 }}
              helperText="Minimum payout: $50"
            />
            <TextField
              label="Payout Method"
              select
              fullWidth
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
            </TextField>
            <TextField
              label="Payment Details"
              fullWidth
              multiline
              rows={3}
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              placeholder={payoutMethod === 'bank_transfer' ? 'Bank name, account number, routing number...' :
                          payoutMethod === 'paypal' ? 'PayPal email address' : 'Wallet address (BTC/ETH/USDT)'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPayoutDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              variant="contained"
              disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) < 50}
              sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
            >
              {payoutLoading ? <CircularProgress size={20} /> : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification Dialog */}
        <Dialog
          open={verifyDialogOpen}
          onClose={() => setVerifyDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
            </svg>
            Get Verified Seller Badge
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(29, 155, 240, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                </svg>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                Become a Verified Seller
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                Stand out from the competition with a verified badge
              </Typography>
              
              <Stack spacing={2} sx={{ textAlign: 'left', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <CheckCircle size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white' }}>Verified badge displayed on all your listings</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <CheckCircle size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white' }}>Priority placement in marketplace search results</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <CheckCircle size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white' }}>Increased buyer trust and higher conversion rates</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <CheckCircle size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white' }}>Access to premium seller analytics</Typography>
                </Box>
              </Stack>
              
              <Box sx={{ p: 3, bgcolor: 'rgba(29, 155, 240, 0.1)', borderRadius: 2, border: '1px solid rgba(29, 155, 240, 0.3)' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  One-time verification fee
                </Typography>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, my: 1 }}>
                  $50
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  Lifetime badge • No recurring fees
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button onClick={() => setVerifyDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Maybe Later
            </Button>
            <Button
              onClick={handleRequestVerification}
              variant="contained"
              disabled={verifyLoading}
              startIcon={verifyLoading ? <CircularProgress size={16} /> : (
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="white"/>
                </svg>
              )}
              sx={{ bgcolor: '#1D9BF0', '&:hover': { bgcolor: '#1A8CD8' }, px: 4 }}
            >
              {verifyLoading ? 'Processing...' : 'Pay $50 & Get Verified'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
    </PullToRefresh>
  );
}
