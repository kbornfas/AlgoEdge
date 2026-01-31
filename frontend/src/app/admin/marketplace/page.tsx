'use client';

import { useState, useEffect } from 'react';
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
  Badge,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Bot,
  Package,
  Signal,
  Eye,
  Check,
  X,
  MoreVertical,
  Search,
  Filter,
  RefreshCcw,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Star,
  ExternalLink,
  Trash2,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Store,
} from 'lucide-react';
import Link from 'next/link';

interface PendingItem {
  id: number;
  type: 'bot' | 'product' | 'signal';
  name: string;
  seller_name: string;
  seller_email: string;
  price: number;
  is_free: boolean;
  created_at: string;
  status: string;
  description?: string;
  category?: string;
}

interface PendingVerification {
  id: number;
  email: string;
  name: string;
  created_at: string;
  wallet_balance: number;
  products_count: number;
  bots_count: number;
  signals_count: number;
}

interface MarketplaceStats {
  pending_bots: number;
  pending_products: number;
  pending_signals: number;
  pending_verifications: number;
  pending_seller_applications: number;
  total_sellers: number;
  total_sales_today: number;
  revenue_today: number;
  commission_today: number;
}

interface SellerApplication {
  id: number;
  user_id: number;
  user_email: string;
  username: string;
  profile_image: string;
  full_name: string;
  display_name?: string; // Optional trading alias/brand name
  bio: string;
  tagline: string;
  experience_years: number;
  trading_style: string;
  specialties: string[];
  phone: string;
  country: string;
  website: string;
  telegram: string;
  twitter: string;
  created_at: string;
  status: string;
}

export default function AdminMarketplacePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutProvider, setCheckoutProvider] = useState('stripe');
  const [adminNotes, setAdminNotes] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [verificationRejectionReason, setVerificationRejectionReason] = useState('');
  const [sellerApplications, setSellerApplications] = useState<SellerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [applicationRejectionReason, setApplicationRejectionReason] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/marketplace/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch pending verifications
      const verificationsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/pending-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (verificationsRes.ok) {
        const verificationsData = await verificationsRes.json();
        setPendingVerifications(verificationsData.pendingVerifications || []);
      }

      // Fetch pending seller applications
      const applicationsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/admin/seller-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        setSellerApplications(applicationsData.applications || []);
      }

      // Fetch pending items based on tab
      const type = ['bots', 'products', 'signals'][activeTab];
      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/marketplace/pending?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setPendingItems(itemsData.items || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: PendingItem) => {
    // Validate checkout URL is provided
    if (!checkoutUrl) {
      setAlert({ type: 'error', message: 'Checkout URL is required to approve a listing. Please add a payment link.' });
      return;
    }
    if (!checkoutProvider) {
      setAlert({ type: 'error', message: 'Please select a checkout provider' });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/marketplace/${item.type}s/${item.id}/approve`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_url: checkoutUrl,
          checkout_provider: checkoutProvider,
          admin_notes: adminNotes,
          final_price: finalPrice ? parseFloat(finalPrice) : null,
        }),
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `${item.name} has been approved with checkout link!` });
        setPendingItems(pendingItems.filter((i) => i.id !== item.id));
        setReviewDialogOpen(false);
        // Reset fields
        setCheckoutUrl('');
        setCheckoutProvider('stripe');
        setAdminNotes('');
        setFinalPrice('');
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to approve' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (item: PendingItem) => {
    if (!rejectionReason) {
      setAlert({ type: 'error', message: 'Please provide a rejection reason' });
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/marketplace/${item.type}s/${item.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `${item.name} has been rejected` });
        setPendingItems(pendingItems.filter((i) => i.id !== item.id));
        setReviewDialogOpen(false);
        setRejectionReason('');
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to reject' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewDialog = (item: PendingItem) => {
    setSelectedItem(item);
    setReviewDialogOpen(true);
    setAnchorEl(null);
  };

  const handleApproveVerification = async (verification: PendingVerification) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/approve-verification/${verification.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `${verification.name} has been verified!` });
        setPendingVerifications(pendingVerifications.filter((v) => v.id !== verification.id));
        setVerificationDialogOpen(false);
        setSelectedVerification(null);
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to approve verification' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async (verification: PendingVerification) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/reject-verification/${verification.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: verificationRejectionReason || 'Does not meet verification requirements' }),
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `Verification rejected for ${verification.name}. Fee has been refunded.` });
        setPendingVerifications(pendingVerifications.filter((v) => v.id !== verification.id));
        setVerificationDialogOpen(false);
        setSelectedVerification(null);
        setVerificationRejectionReason('');
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to reject verification' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Seller Application handlers
  const handleApproveSellerApplication = async (application: SellerApplication) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/admin/seller-applications/${application.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `${application.full_name} is now a verified seller!` });
        setSellerApplications(sellerApplications.filter((a) => a.id !== application.id));
        setApplicationDialogOpen(false);
        setSelectedApplication(null);
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to approve seller application' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSellerApplication = async (application: SellerApplication) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/admin/seller-applications/${application.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: applicationRejectionReason || 'Application does not meet requirements' }),
      });
      
      if (res.ok) {
        setAlert({ type: 'success', message: `Seller application rejected for ${application.full_name}` });
        setSellerApplications(sellerApplications.filter((a) => a.id !== application.id));
        setApplicationDialogOpen(false);
        setSelectedApplication(null);
        setApplicationRejectionReason('');
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Failed to reject seller application' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = pendingItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bot': return <Bot size={20} color="#8B5CF6" />;
      case 'product': return <Package size={20} color="#3B82F6" />;
      case 'signal': return <Signal size={20} color="#22C55E" />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pl: { xs: 6, md: 0 } }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
              Marketplace Management
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Review and manage marketplace listings
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshCcw size={18} />}
            onClick={fetchData}
            sx={{ color: '#8B5CF6' }}
          >
            Refresh
          </Button>
        </Box>

        {alert && (
          <Alert
            severity={alert.type}
            onClose={() => setAlert(null)}
            sx={{ mb: 3 }}
          >
            {alert.message}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={stats?.pending_bots || 0} color="warning">
                  <Bot size={24} color="#F59E0B" />
                </Badge>
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Pending Bots
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={stats?.pending_products || 0} color="primary">
                  <Package size={24} color="#3B82F6" />
                </Badge>
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Pending Products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={stats?.pending_signals || 0} color="success">
                  <Signal size={24} color="#22C55E" />
                </Badge>
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Pending Signals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Users size={24} color="#8B5CF6" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  {stats?.total_sellers || 0} Sellers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp size={24} color="#22C55E" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  {stats?.total_sales_today || 0} Sales Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <DollarSign size={24} color="#22C55E" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  ${stats?.commission_today?.toFixed(2) || '0.00'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  Commission Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Verifications Section */}
        {pendingVerifications.length > 0 && (
          <Card sx={{ mb: 4, bgcolor: 'rgba(29, 155, 240, 0.1)', border: '1px solid rgba(29, 155, 240, 0.3)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                </svg>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Pending Seller Verifications
                </Typography>
                <Chip
                  label={pendingVerifications.length}
                  size="small"
                  sx={{ bgcolor: '#1D9BF0', color: 'white', fontWeight: 700 }}
                />
              </Stack>
              
              <Grid container spacing={2}>
                {pendingVerifications.map((verification) => (
                  <Grid item xs={12} md={6} lg={4} key={verification.id}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                            {verification.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: 'white', fontWeight: 700 }}>
                              {verification.name}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                              {verification.email}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {verification.products_count + verification.bots_count}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                              Listings
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.25rem' }}>
                              ${parseFloat(String(verification.wallet_balance || 0)).toFixed(0)}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                              Wallet
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {verification.signals_count}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                              Signals
                            </Typography>
                          </Box>
                        </Stack>
                        
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 2 }}>
                          Requested: {new Date(verification.created_at).toLocaleDateString()}
                        </Typography>
                        
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircle size={16} />}
                            onClick={() => handleApproveVerification(verification)}
                            disabled={actionLoading}
                            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
                          >
                            Approve
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<XCircle size={16} />}
                            onClick={() => {
                              setSelectedVerification(verification);
                              setVerificationDialogOpen(true);
                            }}
                            sx={{ borderColor: '#EF4444', color: '#EF4444' }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Pending Seller Applications Section */}
        {sellerApplications.length > 0 && (
          <Card sx={{ mb: 4, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Store size={28} color="#8B5CF6" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Pending Seller Applications
                </Typography>
                <Chip
                  label={sellerApplications.length}
                  size="small"
                  sx={{ bgcolor: '#8B5CF6', color: 'white', fontWeight: 700 }}
                />
              </Stack>
              
              <Grid container spacing={2}>
                {sellerApplications.map((application) => (
                  <Grid item xs={12} md={6} lg={4} key={application.id}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar 
                            src={application.profile_image} 
                            sx={{ bgcolor: '#8B5CF6', width: 48, height: 48 }}
                          >
                            {(application.display_name || application.full_name)?.charAt(0) || 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: 'white', fontWeight: 700 }}>
                              {application.display_name || application.full_name}
                            </Typography>
                            {application.display_name && (
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                Real name: {application.full_name}
                              </Typography>
                            )}
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                              {application.user_email}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        {application.tagline && (
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 2, fontStyle: 'italic' }}>
                            "{application.tagline}"
                          </Typography>
                        )}
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                          {application.trading_style && (
                            <Chip
                              label={application.trading_style}
                              size="small"
                              sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', fontSize: '0.75rem' }}
                            />
                          )}
                          {application.experience_years && (
                            <Chip
                              label={`${application.experience_years} yrs exp`}
                              size="small"
                              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#86EFAC', fontSize: '0.75rem' }}
                            />
                          )}
                          {application.country && (
                            <Chip
                              label={application.country}
                              size="small"
                              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', fontSize: '0.75rem' }}
                            />
                          )}
                        </Stack>
                        
                        {application.bio && (
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {application.bio}
                          </Typography>
                        )}
                        
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 2 }}>
                          Applied: {new Date(application.created_at).toLocaleDateString()}
                        </Typography>
                        
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircle size={16} />}
                            onClick={() => handleApproveSellerApplication(application)}
                            disabled={actionLoading}
                            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
                          >
                            Approve
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            startIcon={<XCircle size={16} />}
                            onClick={() => {
                              setSelectedApplication(application);
                              setApplicationDialogOpen(true);
                            }}
                            sx={{ borderColor: '#EF4444', color: '#EF4444' }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)' },
            '& .Mui-selected': { color: '#8B5CF6' },
            '& .MuiTabs-indicator': { bgcolor: '#8B5CF6' },
          }}
        >
          <Tab
            label={
              <Badge badgeContent={stats?.pending_bots || 0} color="warning">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Bot size={18} />
                  <span>Bots</span>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats?.pending_products || 0} color="primary">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Package size={18} />
                  <span>Products</span>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats?.pending_signals || 0} color="success">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Signal size={18} />
                  <span>Signal Providers</span>
                </Stack>
              </Badge>
            }
          />
        </Tabs>

        {/* Search */}
        <TextField
          placeholder="Search by name or seller..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />,
          }}
          sx={{
            mb: 3,
            width: { xs: '100%', md: 400 },
            '& .MuiOutlinedInput-root': {
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.03)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            },
          }}
        />

        {/* Pending Items Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8B5CF6' }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Item</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Seller</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Price</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Submitted</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)' }}>
                            {getTypeIcon(item.type)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>{item.name}</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                              {item.category || item.type}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'white' }}>{item.seller_name}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {item.seller_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: item.is_free ? '#22C55E' : 'white', fontWeight: 600 }}>
                          {item.is_free ? 'FREE' : `$${item.price}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Clock size={14} color="rgba(255,255,255,0.5)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Review">
                            <IconButton
                              size="small"
                              onClick={() => openReviewDialog(item)}
                              sx={{ color: '#8B5CF6' }}
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quick Approve">
                            <IconButton
                              size="small"
                              onClick={() => handleApprove(item)}
                              sx={{ color: '#22C55E' }}
                            >
                              <Check size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quick Reject">
                            <IconButton
                              size="small"
                              onClick={() => openReviewDialog(item)}
                              sx={{ color: '#EF4444' }}
                            >
                              <X size={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                      <CheckCircle size={40} color="#22C55E" style={{ marginBottom: 8 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        No pending items to review
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Review Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            Review Listing
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedItem && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(139, 92, 246, 0.2)' }}>
                      {getTypeIcon(selectedItem.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                        {selectedItem.name}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        by {selectedItem.seller_name} • {selectedItem.seller_email}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Type</Typography>
                    <Typography sx={{ color: 'white', fontWeight: 600, textTransform: 'capitalize' }}>
                      {selectedItem.type}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Price</Typography>
                    <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.25rem' }}>
                      {selectedItem.is_free ? 'FREE' : `$${selectedItem.price}`}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedItem.description && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                        Description
                      </Typography>
                      <Typography sx={{ color: 'white' }}>{selectedItem.description}</Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Checkout URL Section - REQUIRED for approval */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <Typography sx={{ color: '#22C55E', fontWeight: 700, mb: 2 }}>
                      ✓ Checkout Link Setup (Required to Approve)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 1 }}>
                          Checkout URL *
                        </Typography>
                        <TextField
                          fullWidth
                          value={checkoutUrl}
                          onChange={(e) => setCheckoutUrl(e.target.value)}
                          placeholder="https://buy.stripe.com/... or https://gumroad.com/l/..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.03)',
                              '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 1 }}>
                          Provider *
                        </Typography>
                        <TextField
                          fullWidth
                          select
                          value={checkoutProvider}
                          onChange={(e) => setCheckoutProvider(e.target.value)}
                          SelectProps={{ native: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.03)',
                              '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                            },
                            '& .MuiNativeSelect-icon': { color: 'rgba(255,255,255,0.5)' },
                          }}
                        >
                          <option value="stripe" style={{ background: '#1a1a2e' }}>Stripe</option>
                          <option value="gumroad" style={{ background: '#1a1a2e' }}>Gumroad</option>
                          <option value="whop" style={{ background: '#1a1a2e' }}>Whop</option>
                          <option value="paypal" style={{ background: '#1a1a2e' }}>PayPal</option>
                          <option value="other" style={{ background: '#1a1a2e' }}>Other</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 1 }}>
                          Final Price (optional override)
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={finalPrice}
                          onChange={(e) => setFinalPrice(e.target.value)}
                          placeholder={`${selectedItem?.price || 0}`}
                          InputProps={{ startAdornment: <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>$</span> }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.03)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 1 }}>
                          Admin Notes (visible to seller)
                        </Typography>
                        <TextField
                          fullWidth
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Any notes for the seller..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              bgcolor: 'rgba(255,255,255,0.03)',
                              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                    Rejection Reason (required if rejecting)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this listing is being rejected..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button onClick={() => setReviewDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedItem && handleReject(selectedItem)}
              disabled={actionLoading}
              variant="outlined"
              color="error"
              startIcon={<XCircle size={18} />}
            >
              Reject
            </Button>
            <Button
              onClick={() => selectedItem && handleApprove(selectedItem)}
              disabled={actionLoading}
              variant="contained"
              startIcon={actionLoading ? <CircularProgress size={18} /> : <CheckCircle size={18} />}
              sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Verification Rejection Dialog */}
        <Dialog
          open={verificationDialogOpen}
          onClose={() => {
            setVerificationDialogOpen(false);
            setSelectedVerification(null);
            setVerificationRejectionReason('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <XCircle size={24} color="#EF4444" />
            Reject Verification
          </DialogTitle>
          <DialogContent>
            {selectedVerification && (
              <Box>
                <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
                  The $50 verification fee will be refunded to the seller's wallet.
                </Alert>
                
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                    {selectedVerification.name}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {selectedVerification.email}
                  </Typography>
                </Box>
                
                <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  Rejection Reason
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={verificationRejectionReason}
                  onChange={(e) => setVerificationRejectionReason(e.target.value)}
                  placeholder="Explain why this verification is being rejected..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setVerificationDialogOpen(false);
                setSelectedVerification(null);
                setVerificationRejectionReason('');
              }}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedVerification && handleRejectVerification(selectedVerification)}
              disabled={actionLoading}
              variant="contained"
              color="error"
              startIcon={actionLoading ? <CircularProgress size={18} /> : <XCircle size={18} />}
            >
              Reject & Refund
            </Button>
          </DialogActions>
        </Dialog>

        {/* Seller Application Rejection Dialog */}
        <Dialog
          open={applicationDialogOpen}
          onClose={() => {
            setApplicationDialogOpen(false);
            setSelectedApplication(null);
            setApplicationRejectionReason('');
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        >
          <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <XCircle size={24} color="#EF4444" />
            Reject Seller Application
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Box>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                      src={selectedApplication.profile_image}
                      sx={{ bgcolor: '#8B5CF6', width: 48, height: 48 }}
                    >
                      {(selectedApplication.display_name || selectedApplication.full_name)?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>
                        {selectedApplication.display_name || selectedApplication.full_name}
                      </Typography>
                      {selectedApplication.display_name && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          Real name: {selectedApplication.full_name}
                        </Typography>
                      )}
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {selectedApplication.user_email}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  Rejection Reason
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={applicationRejectionReason}
                  onChange={(e) => setApplicationRejectionReason(e.target.value)}
                  placeholder="Explain why this seller application is being rejected..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setApplicationDialogOpen(false);
                setSelectedApplication(null);
                setApplicationRejectionReason('');
              }}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedApplication && handleRejectSellerApplication(selectedApplication)}
              disabled={actionLoading}
              variant="contained"
              color="error"
              startIcon={actionLoading ? <CircularProgress size={18} /> : <XCircle size={18} />}
            >
              Reject Application
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
