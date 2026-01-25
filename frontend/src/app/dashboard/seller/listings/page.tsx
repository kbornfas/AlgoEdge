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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import {
  Bot,
  Signal,
  FileText,
  Edit,
  DollarSign,
  Plus,
  Eye,
  TrendingUp,
  Package,
  X,
  Save,
  History,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: number;
  name: string;
  slug: string;
  thumbnail_url?: string;
  price: number;
  price_type?: string;
  subscription_period?: string;
  monthly_price?: number;
  quarterly_price?: number;
  yearly_price?: number;
  is_free?: boolean;
  total_sales?: number;
  total_revenue?: number;
  status: string;
  rating_average?: number;
  rating_count?: number;
  subscriber_count?: number;
}

interface PriceHistory {
  id: number;
  old_price: number;
  new_price: number;
  change_reason?: string;
  created_at: string;
}

export default function SellerListingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [listings, setListings] = useState<{
    bots: Listing[];
    products: Listing[];
    signalProvider: Listing | null;
  }>({ bots: [], products: [], signalProvider: null });
  const [loading, setLoading] = useState(true);
  const [editPriceDialog, setEditPriceDialog] = useState<{
    type: string;
    listing: Listing;
  } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newPriceType, setNewPriceType] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }
  }, [isAuthenticated]);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (type: string, id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/price-history/${type}/${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const openPriceDialog = (type: string, listing: Listing) => {
    setEditPriceDialog({ type, listing });
    setNewPrice(listing.price?.toString() || listing.monthly_price?.toString() || '0');
    setNewPriceType(listing.price_type || 'one_time');
    setChangeReason('');
    fetchPriceHistory(type, listing.id);
  };

  const closePriceDialog = () => {
    setEditPriceDialog(null);
    setNewPrice('');
    setChangeReason('');
    setPriceHistory([]);
    setShowHistory(false);
  };

  const handleUpdatePrice = async () => {
    if (!editPriceDialog) return;

    setSaving(true);
    try {
      let endpoint = '';
      let body: any = { change_reason: changeReason };

      if (editPriceDialog.type === 'bot') {
        endpoint = `/api/marketplace/seller/bots/${editPriceDialog.listing.id}/price`;
        body.price = parseFloat(newPrice);
        body.price_type = newPriceType;
      } else if (editPriceDialog.type === 'product') {
        endpoint = `/api/marketplace/seller/products/${editPriceDialog.listing.id}/price`;
        body.price = parseFloat(newPrice);
      } else if (editPriceDialog.type === 'signal') {
        endpoint = `/api/marketplace/seller/signals/price`;
        body.monthly_price = parseFloat(newPrice);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Refresh listings
        fetchListings();
        closePriceDialog();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Update price error:', error);
      alert('Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12 }}>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
            Please log in to view your seller dashboard.
          </Alert>
        </Container>
      </Box>
    );
  }

  const tabLabels = [
    { label: 'Trading Bots', count: listings.bots.length, icon: Bot },
    { label: 'Digital Products', count: listings.products.length, icon: FileText },
    { label: 'Signal Service', count: listings.signalProvider ? 1 : 0, icon: Signal },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'suspended': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
              📊 My Listings
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Manage your products, bots, and signal services
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            component={Link}
            href="/dashboard/seller/new"
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
          >
            Add New Listing
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Package size={32} color="#22C55E" />
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Total Listings
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {listings.bots.length + listings.products.length + (listings.signalProvider ? 1 : 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUp size={32} color="#3B82F6" />
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Total Sales
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {listings.bots.reduce((sum, b) => sum + (b.total_sales || 0), 0) +
                        listings.products.reduce((sum, p) => sum + (p.total_sales || 0), 0) +
                        (listings.signalProvider?.subscriber_count || 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <DollarSign size={32} color="#F59E0B" />
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Total Revenue
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      ${(listings.bots.reduce((sum, b) => sum + (b.total_revenue || 0), 0) +
                        listings.products.reduce((sum, p) => sum + (p.total_revenue || 0), 0)).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 4, '& .MuiTabs-indicator': { bgcolor: '#22C55E' } }}
        >
          {tabLabels.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  <Chip
                    label={tab.count}
                    size="small"
                    sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', height: 20 }}
                  />
                </Stack>
              }
              sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: 'white' } }}
            />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#22C55E' }} />
          </Box>
        ) : (
          <>
            {/* Bots Tab */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                {listings.bots.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                      <Bot size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                        You haven't listed any trading bots yet.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        component={Link}
                        href="/dashboard/seller/bots/new"
                        sx={{ bgcolor: '#22C55E' }}
                      >
                        List a Bot
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  listings.bots.map((bot) => (
                    <Grid item xs={12} md={6} key={bot.id}>
                      <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={bot.thumbnail_url} sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', width: 56, height: 56 }}>
                                <Bot size={28} color="#22C55E" />
                              </Avatar>
                              <Box>
                                <Typography sx={{ color: 'white', fontWeight: 700 }}>{bot.name}</Typography>
                                <Chip
                                  label={bot.status}
                                  size="small"
                                  sx={{ bgcolor: `${getStatusColor(bot.status)}20`, color: getStatusColor(bot.status), height: 20 }}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '1.5rem' }}>
                                ${bot.price}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                {bot.price_type === 'subscription' ? '/mo' : 'one-time'}
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Sales</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>{bot.total_sales || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Revenue</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>${bot.total_revenue || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Rating</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {bot.rating_average?.toFixed(1) || '-'} ⭐
                              </Typography>
                            </Grid>
                          </Grid>

                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Eye size={16} />}
                              component={Link}
                              href={`/marketplace/bots/${bot.slug}`}
                              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', flex: 1 }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DollarSign size={16} />}
                              onClick={() => openPriceDialog('bot', bot)}
                              sx={{ borderColor: '#22C55E', color: '#22C55E', flex: 1 }}
                            >
                              Edit Price
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Edit size={16} />}
                              component={Link}
                              href={`/dashboard/seller/bots/${bot.id}/edit`}
                              sx={{ bgcolor: '#3B82F6', flex: 1 }}
                            >
                              Edit
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Products Tab */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                {listings.products.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                      <FileText size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                        You haven't listed any digital products yet.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        component={Link}
                        href="/dashboard/seller/products/new"
                        sx={{ bgcolor: '#F59E0B' }}
                      >
                        List a Product
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  listings.products.map((product) => (
                    <Grid item xs={12} md={6} key={product.id}>
                      <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={product.thumbnail_url} sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', width: 56, height: 56 }}>
                                <FileText size={28} color="#F59E0B" />
                              </Avatar>
                              <Box>
                                <Typography sx={{ color: 'white', fontWeight: 700 }}>{product.name}</Typography>
                                <Chip
                                  label={product.status}
                                  size="small"
                                  sx={{ bgcolor: `${getStatusColor(product.status)}20`, color: getStatusColor(product.status), height: 20 }}
                                />
                              </Box>
                            </Box>
                            <Typography sx={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.5rem' }}>
                              ${product.price}
                            </Typography>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Sales</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>{product.total_sales || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Revenue</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>${product.total_revenue || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Rating</Typography>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {product.rating_average?.toFixed(1) || '-'} ⭐
                              </Typography>
                            </Grid>
                          </Grid>

                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Eye size={16} />}
                              component={Link}
                              href={`/marketplace/products/${product.slug}`}
                              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', flex: 1 }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DollarSign size={16} />}
                              onClick={() => openPriceDialog('product', product)}
                              sx={{ borderColor: '#F59E0B', color: '#F59E0B', flex: 1 }}
                            >
                              Edit Price
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Edit size={16} />}
                              component={Link}
                              href={`/dashboard/seller/products/${product.id}/edit`}
                              sx={{ bgcolor: '#3B82F6', flex: 1 }}
                            >
                              Edit
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Signal Service Tab */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                {!listings.signalProvider ? (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                      <Signal size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                        You haven't set up a signal service yet.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        component={Link}
                        href="/dashboard/seller/signals/setup"
                        sx={{ bgcolor: '#3B82F6' }}
                      >
                        Become a Signal Provider
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  <Grid item xs={12} md={8}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={listings.signalProvider.thumbnail_url}
                              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', width: 72, height: 72 }}
                            >
                              <Signal size={36} color="#3B82F6" />
                            </Avatar>
                            <Box>
                              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                                {listings.signalProvider.name}
                              </Typography>
                              <Chip
                                label={listings.signalProvider.status}
                                size="small"
                                sx={{
                                  bgcolor: `${getStatusColor(listings.signalProvider.status)}20`,
                                  color: getStatusColor(listings.signalProvider.status),
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ color: '#3B82F6', fontWeight: 800, fontSize: '2rem' }}>
                              ${listings.signalProvider.monthly_price}/mo
                            </Typography>
                            {listings.signalProvider.is_free && (
                              <Chip label="FREE" size="small" sx={{ bgcolor: '#22C55E', color: 'white' }} />
                            )}
                          </Box>
                        </Box>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                          <Grid item xs={3}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Subscribers</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {listings.signalProvider.subscriber_count || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Total Revenue</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              ${listings.signalProvider.total_revenue || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Rating</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {listings.signalProvider.rating_average?.toFixed(1) || '-'} ⭐
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Reviews</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {listings.signalProvider.rating_count || 0}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="outlined"
                            startIcon={<Eye size={18} />}
                            component={Link}
                            href={`/marketplace/signals/${listings.signalProvider.slug}`}
                            sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<DollarSign size={18} />}
                            onClick={() => openPriceDialog('signal', listings.signalProvider!)}
                            sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
                          >
                            Update Pricing
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Edit size={18} />}
                            component={Link}
                            href="/dashboard/seller/signals/edit"
                            sx={{ bgcolor: '#3B82F6' }}
                          >
                            Edit Profile
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </>
        )}

        {/* Edit Price Dialog */}
        <Dialog
          open={!!editPriceDialog}
          onClose={closePriceDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 },
          }}
        >
          {editPriceDialog && (
            <>
              <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                    💰 Update Price
                  </Typography>
                  <IconButton onClick={closePriceDialog}>
                    <X size={24} color="white" />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
                  Existing customers who already purchased will not be affected. New price applies to new purchases only.
                </Alert>

                <Stack spacing={3}>
                  <TextField
                    label="New Price"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    }}
                  />

                  {editPriceDialog.type === 'bot' && (
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Price Type</InputLabel>
                      <Select
                        value={newPriceType}
                        onChange={(e) => setNewPriceType(e.target.value)}
                        label="Price Type"
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        <MenuItem value="one_time">One-time Purchase</MenuItem>
                        <MenuItem value="subscription">Monthly Subscription</MenuItem>
                        <MenuItem value="free">Free</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    label="Reason for Change (optional)"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="e.g., Limited time discount, New features added"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    }}
                  />

                  {/* Price History Toggle */}
                  <Button
                    startIcon={<History size={18} />}
                    onClick={() => setShowHistory(!showHistory)}
                    sx={{ color: 'rgba(255,255,255,0.6)', justifyContent: 'flex-start' }}
                  >
                    {showHistory ? 'Hide' : 'Show'} Price History
                  </Button>

                  {showHistory && priceHistory.length > 0 && (
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>
                        Recent Price Changes:
                      </Typography>
                      {priceHistory.map((h) => (
                        <Box
                          key={h.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            py: 0.75,
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                            ${h.old_price} → ${h.new_price}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            {new Date(h.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                <Button onClick={closePriceDialog} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                  onClick={handleUpdatePrice}
                  disabled={saving}
                  sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
                >
                  {saving ? 'Saving...' : 'Update Price'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
}
