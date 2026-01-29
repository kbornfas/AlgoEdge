'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Heart, Trash2, Bell, BellOff, ShoppingCart } from 'lucide-react';

interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  seller_username: string;
  target_price: number | null;
  price_alert_active: boolean;
  created_at: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [alertDialog, setAlertDialog] = useState<{ open: boolean; item: WishlistItem | null }>({
    open: false,
    item: null,
  });
  const [targetPrice, setTargetPrice] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWishlist();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const openAlertDialog = (item: WishlistItem) => {
    setAlertDialog({ open: true, item });
    setTargetPrice(item.target_price?.toString() || '');
  };

  const setPriceAlert = async () => {
    if (!alertDialog.item || !targetPrice) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist/price-alert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: alertDialog.item.product_id,
          target_price: parseFloat(targetPrice),
        }),
      });
      setAlertDialog({ open: false, item: null });
      fetchWishlist();
    } catch (error) {
      console.error('Failed to set price alert:', error);
    }
  };

  const removePriceAlert = async (productId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wishlist/price-alert/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWishlist();
    } catch (error) {
      console.error('Failed to remove price alert:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 4 }, overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
          <Box sx={{ p: { xs: 1, md: 1.5 }, bgcolor: 'rgba(236, 72, 153, 0.2)', borderRadius: 2 }}>
            <Heart size={20} color="#EC4899" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              My Wishlist
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </Typography>
          </Box>
        </Stack>

        {/* Items Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {items.map((item) => (
            <Card key={item.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box
                sx={{
                  height: 180,
                  backgroundImage: `url(${item.image_url || '/placeholder-product.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={() => removeItem(item.product_id)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.8)' },
                  }}
                >
                  <Trash2 size={18} color="white" />
                </IconButton>
              </Box>
              <CardContent>
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.05rem', mb: 0.5 }}>
                  {item.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>
                  by {item.seller_username}
                </Typography>
                <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.2rem', mb: 2 }}>
                  ${item.price}
                </Typography>

                {item.price_alert_active && item.target_price && (
                  <Chip
                    label={`Alert: ${item.target_price < item.price ? 'Below' : 'Above'} $${item.target_price}`}
                    size="small"
                    icon={<Bell size={14} />}
                    onDelete={() => removePriceAlert(item.product_id)}
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22C55E',
                      fontSize: '0.75rem',
                      mb: 1,
                    }}
                  />
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={item.price_alert_active ? <BellOff size={16} /> : <Bell size={16} />}
                    onClick={() => openAlertDialog(item)}
                    fullWidth
                    sx={{
                      color: '#F59E0B',
                      borderColor: '#F59E0B',
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      py: { xs: 1, md: 0.5 },
                    }}
                  >
                    {item.price_alert_active ? 'Edit Alert' : 'Price Alert'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ShoppingCart size={16} />}
                    href={`/marketplace/${item.product_id}`}
                    fullWidth
                    sx={{
                      bgcolor: '#3B82F6',
                      fontSize: { xs: '0.8rem', md: '0.75rem' },
                      py: { xs: 1, md: 0.5 },
                    }}
                  >
                    View
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {items.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Heart size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2, mb: 2 }}>
                Your wishlist is empty
              </Typography>
              <Button variant="contained" href="/marketplace" sx={{ bgcolor: '#3B82F6' }}>
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Price Alert Dialog */}
      <Dialog 
        open={alertDialog.open} 
        onClose={() => setAlertDialog({ open: false, item: null })} 
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#1A1F2E', mx: { xs: 2, sm: 'auto' } } }}
      >
        <DialogTitle sx={{ color: 'white' }}>Set Price Alert</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontSize: '0.875rem' }}>
            Get notified when {alertDialog.item?.name} reaches your target price
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, fontSize: '0.85rem' }}>
            Current Price: ${alertDialog.item?.price}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Target Price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            sx={{
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog({ open: false, item: null })} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button onClick={setPriceAlert} variant="contained" sx={{ bgcolor: '#F59E0B' }}>
            Set Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
