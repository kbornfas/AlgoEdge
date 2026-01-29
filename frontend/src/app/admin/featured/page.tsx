'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Avatar,
  Stack,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Star,
  StarOff,
  Search,
  Bot,
  Signal,
  Package,
  Users,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Bot {
  id: number;
  name: string;
  slug: string;
  thumbnail_url: string;
  is_featured: boolean;
  status: string;
  total_sales: number;
  seller_id: number;
  seller_username: string;
  seller_name: string;
  seller_verified: boolean;
}

interface SignalProvider {
  id: number;
  name: string;
  slug: string;
  avatar_url: string;
  is_featured: boolean;
  status: string;
  subscriber_count: number;
  provider_id: number;
  provider_username: string;
  provider_name: string;
  provider_verified: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  thumbnail_url: string;
  is_featured: boolean;
  status: string;
  total_sales: number;
  seller_id: number;
  seller_username: string;
  seller_name: string;
  seller_verified: boolean;
}

interface Seller {
  id: number;
  username: string;
  full_name: string;
  profile_image: string;
  seller_featured: boolean;
  has_blue_badge: boolean;
  bots_count: number;
  products_count: number;
  signals_count: number;
}

export default function AdminFeaturedPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [signals, setSignals] = useState<SignalProvider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchFeaturedData();
  }, []);

  const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token');

  const fetchFeaturedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/featured`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        setBots(data.bots || []);
        setSignals(data.signals || []);
        setProducts(data.products || []);
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching featured data:', error);
      setSnackbar({ open: true, message: 'Failed to load featured data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleBotFeatured = async (botId: number, currentlyFeatured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/bots/${botId}/feature`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ featured: !currentlyFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        setBots(bots.map(b => b.id === botId ? { ...b, is_featured: !currentlyFeatured } : b));
        setSnackbar({ open: true, message: data.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to update bot', severity: 'error' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update bot', severity: 'error' });
    }
  };

  const toggleSignalFeatured = async (signalId: number, currentlyFeatured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/signals/${signalId}/feature`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ featured: !currentlyFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        setSignals(signals.map(s => s.id === signalId ? { ...s, is_featured: !currentlyFeatured } : s));
        setSnackbar({ open: true, message: data.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to update signal', severity: 'error' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update signal', severity: 'error' });
    }
  };

  const toggleProductFeatured = async (productId: number, currentlyFeatured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}/feature`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ featured: !currentlyFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(products.map(p => p.id === productId ? { ...p, is_featured: !currentlyFeatured } : p));
        setSnackbar({ open: true, message: data.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to update product', severity: 'error' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update product', severity: 'error' });
    }
  };

  const toggleSellerFeatured = async (sellerId: number, currentlyFeatured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${sellerId}/feature`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ featured: !currentlyFeatured }),
      });
      const data = await response.json();
      if (data.success) {
        setSellers(sellers.map(s => s.id === sellerId ? { ...s, seller_featured: !currentlyFeatured } : s));
        setSnackbar({ open: true, message: data.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to update seller', severity: 'error' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update seller', severity: 'error' });
    }
  };

  const filteredBots = bots.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.seller_username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSignals = signals.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.provider_username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.seller_username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSellers = sellers.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  const tabCounts = {
    bots: bots.filter(b => b.is_featured).length,
    signals: signals.filter(s => s.is_featured).length,
    products: products.filter(p => p.is_featured).length,
    sellers: sellers.filter(s => s.seller_featured).length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#fff' }}>
        Featured Content Management
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
        Manage what appears on the landing page. Sellers must be verified and have at least 1 listing to be featured.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Bot size={24} color="#22C55E" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#22C55E' }}>{tabCounts.bots}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Featured Bots</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Signal size={24} color="#3B82F6" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#3B82F6' }}>{tabCounts.signals}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Featured Signals</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Package size={24} color="#F59E0B" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B' }}>{tabCounts.products}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Featured Products</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Users size={24} color="#8B5CF6" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B5CF6' }}>{tabCounts.sellers}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Featured Sellers</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Search */}
      <TextField
        placeholder="Search by name or seller..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255,255,255,0.05)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
          },
          '& input': { color: '#fff' },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} color="rgba(255,255,255,0.5)" />
            </InputAdornment>
          ),
        }}
      />

      {/* Tabs */}
      <Paper sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
            '& .Mui-selected': { color: '#22C55E' },
            '& .MuiTabs-indicator': { bgcolor: '#22C55E' },
          }}
        >
          <Tab label={`Bots (${bots.length})`} icon={<Bot size={18} />} iconPosition="start" />
          <Tab label={`Signals (${signals.length})`} icon={<Signal size={18} />} iconPosition="start" />
          <Tab label={`Products (${products.length})`} icon={<Package size={18} />} iconPosition="start" />
          <Tab label={`Sellers (${sellers.length})`} icon={<Users size={18} />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Content */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          {filteredBots.map((bot) => (
            <Grid item xs={12} sm={6} md={4} key={bot.id}>
              <Card sx={{ 
                bgcolor: bot.is_featured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                border: bot.is_featured ? '2px solid #22C55E' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={bot.thumbnail_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400'}
                  alt={bot.name}
                />
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {bot.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        by {bot.seller_name || bot.seller_username}
                        {bot.seller_verified && (
                          <CheckCircle size={12} style={{ marginLeft: 4, color: '#3B82F6' }} />
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                        {bot.total_sales} sales
                      </Typography>
                    </Box>
                    <Tooltip title={bot.is_featured ? 'Remove from featured' : 'Add to featured'}>
                      <IconButton 
                        onClick={() => toggleBotFeatured(bot.id, bot.is_featured)}
                        sx={{ 
                          color: bot.is_featured ? '#EAB308' : 'rgba(255,255,255,0.5)',
                          '&:hover': { color: '#EAB308' },
                        }}
                      >
                        {bot.is_featured ? <Star fill="#EAB308" size={24} /> : <StarOff size={24} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  {!bot.seller_verified && (
                    <Alert severity="warning" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.7rem' } }}>
                      Seller not verified - cannot feature
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {filteredSignals.map((signal) => (
            <Grid item xs={12} sm={6} md={4} key={signal.id}>
              <Card sx={{ 
                bgcolor: signal.is_featured ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                border: signal.is_featured ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
              }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                      <Avatar 
                        src={signal.avatar_url} 
                        sx={{ width: 50, height: 50, border: '2px solid #3B82F6' }}
                      >
                        {signal.name?.substring(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                          {signal.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                          by {signal.provider_name || signal.provider_username}
                          {signal.provider_verified && (
                            <CheckCircle size={12} style={{ marginLeft: 4, color: '#3B82F6' }} />
                          )}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {signal.subscriber_count} subscribers
                        </Typography>
                      </Box>
                    </Stack>
                    <Tooltip title={signal.is_featured ? 'Remove from featured' : 'Add to featured'}>
                      <IconButton 
                        onClick={() => toggleSignalFeatured(signal.id, signal.is_featured)}
                        sx={{ 
                          color: signal.is_featured ? '#EAB308' : 'rgba(255,255,255,0.5)',
                          '&:hover': { color: '#EAB308' },
                        }}
                      >
                        {signal.is_featured ? <Star fill="#EAB308" size={24} /> : <StarOff size={24} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  {!signal.provider_verified && (
                    <Alert severity="warning" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.7rem' } }}>
                      Provider not verified - cannot feature
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card sx={{ 
                bgcolor: product.is_featured ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                border: product.is_featured ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
              }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={product.thumbnail_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'}
                  alt={product.name}
                />
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {product.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        by {product.seller_name || product.seller_username}
                        {product.seller_verified && (
                          <CheckCircle size={12} style={{ marginLeft: 4, color: '#3B82F6' }} />
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                        {product.total_sales} sales
                      </Typography>
                    </Box>
                    <Tooltip title={product.is_featured ? 'Remove from featured' : 'Add to featured'}>
                      <IconButton 
                        onClick={() => toggleProductFeatured(product.id, product.is_featured)}
                        sx={{ 
                          color: product.is_featured ? '#EAB308' : 'rgba(255,255,255,0.5)',
                          '&:hover': { color: '#EAB308' },
                        }}
                      >
                        {product.is_featured ? <Star fill="#EAB308" size={24} /> : <StarOff size={24} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  {!product.seller_verified && (
                    <Alert severity="warning" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.7rem' } }}>
                      Seller not verified - cannot feature
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          {filteredSellers.map((seller) => {
            const totalListings = parseInt(String(seller.bots_count || 0)) + parseInt(String(seller.products_count || 0)) + parseInt(String(seller.signals_count || 0));
            const canFeature = seller.has_blue_badge && totalListings >= 1;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={seller.id}>
                <Card sx={{ 
                  bgcolor: seller.seller_featured ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                  border: seller.seller_featured ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <Avatar 
                          src={seller.profile_image} 
                          sx={{ width: 50, height: 50, border: '2px solid #8B5CF6' }}
                        >
                          {seller.full_name?.substring(0, 2) || seller.username?.substring(0, 2)}
                        </Avatar>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                              {seller.full_name || seller.username}
                            </Typography>
                            {seller.has_blue_badge && (
                              <Box component="img" src="/verified-badge.svg" alt="Verified" sx={{ width: 16, height: 16 }} />
                            )}
                          </Stack>
                          <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                            @{seller.username}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip 
                              label={`${seller.bots_count} bots`} 
                              size="small" 
                              sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(34,197,94,0.2)', color: '#22C55E' }} 
                            />
                            <Chip 
                              label={`${seller.signals_count} signals`} 
                              size="small" 
                              sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }} 
                            />
                            <Chip 
                              label={`${seller.products_count} products`} 
                              size="small" 
                              sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(245,158,11,0.2)', color: '#F59E0B' }} 
                            />
                          </Stack>
                        </Box>
                      </Stack>
                      <Tooltip title={
                        !canFeature 
                          ? 'Seller must be verified and have 1+ listings' 
                          : seller.seller_featured 
                            ? 'Remove from featured' 
                            : 'Add to featured'
                      }>
                        <span>
                          <IconButton 
                            onClick={() => toggleSellerFeatured(seller.id, seller.seller_featured)}
                            disabled={!canFeature && !seller.seller_featured}
                            sx={{ 
                              color: seller.seller_featured ? '#EAB308' : 'rgba(255,255,255,0.5)',
                              '&:hover': { color: '#EAB308' },
                              '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
                            }}
                          >
                            {seller.seller_featured ? <Star fill="#EAB308" size={24} /> : <StarOff size={24} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                    {!canFeature && !seller.seller_featured && (
                      <Alert severity="warning" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { fontSize: '0.7rem' } }}>
                        {!seller.has_blue_badge ? 'Seller not verified' : 'No approved listings'}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
