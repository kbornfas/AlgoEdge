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
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Bot,
  Signal,
  FileText,
  Download,
  Key,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  ChevronRight,
  Package,
  X,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import Link from 'next/link';

interface Purchase {
  id: number;
  name: string;
  slug: string;
  thumbnail_url?: string;
  price_paid: number;
  created_at: string;
  license_key?: string;
  download_count?: number;
  subscription_status?: string;
  subscription_end?: string;
  product_type?: string;
  avatar_url?: string;
  display_name?: string;
}

interface Deliverable {
  id: number;
  deliverable_type: string;
  name: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  access_url?: string;
  invite_code?: string;
}

interface WhatYouGet {
  icon: string;
  text: string;
  description?: string;
}

const deliverableIcons: Record<string, any> = {
  download_file: Download,
  license_key: Key,
  course_access: Book,
  video_tutorial: Video,
  telegram_invite: MessageCircle,
  discord_invite: MessageCircle,
  setup_guide: FileText,
  documentation: Book,
  api_key: Key,
  source_code: FileText,
};

export default function MyPurchasesPage() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [purchases, setPurchases] = useState<{
    bots: Purchase[];
    products: Purchase[];
    signalSubscriptions: Purchase[];
  }>({ bots: [], products: [], signalSubscriptions: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<{
    type: string;
    id: number;
    data: any;
  } | null>(null);
  const [accessDetails, setAccessDetails] = useState<{
    purchase: any;
    deliverables: Deliverable[];
    whatYouGet: WhatYouGet[];
  } | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      fetchPurchases();
    }
  }, [isAuthenticated]);

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/purchases`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessDetails = async (type: string, id: number) => {
    setAccessLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/purchases/${type}/${id}/access`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccessDetails({
          purchase: data.purchase,
          deliverables: data.deliverables,
          whatYouGet: data.whatYouGet,
        });
      }
    } catch (error) {
      console.error('Error fetching access details:', error);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleDownload = async (deliverableId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/downloads/${deliverableId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Open download URL
        window.open(data.download.url, '_blank');
      } else {
        const error = await response.json();
        alert(error.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openAccessDialog = (type: string, id: number, data: any) => {
    setSelectedPurchase({ type, id, data });
    fetchAccessDetails(type, id);
  };

  const closeAccessDialog = () => {
    setSelectedPurchase(null);
    setAccessDetails(null);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12 }}>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
            Please log in to view your purchases.
          </Alert>
        </Container>
      </Box>
    );
  }

  const tabLabels = [
    { label: 'Trading Bots', count: purchases.bots.length, icon: Bot },
    { label: 'Digital Products', count: purchases.products.length, icon: FileText },
    { label: 'Signal Subscriptions', count: purchases.signalSubscriptions.length, icon: Signal },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: 'white',
              mb: 1,
            }}
          >
            📦 My Purchases
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Access your purchased bots, products, and subscriptions
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: 4,
            '& .MuiTabs-indicator': {
              bgcolor: '#22C55E',
            },
          }}
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
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22C55E',
                      height: 20,
                      fontSize: '0.75rem',
                    }}
                  />
                </Stack>
              }
              sx={{
                color: 'rgba(255,255,255,0.6)',
                '&.Mui-selected': { color: 'white' },
              }}
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
                {purchases.bots.length === 0 ? (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        py: 6,
                      }}
                    >
                      <Bot size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                        You haven't purchased any trading bots yet.
                      </Typography>
                      <Button
                        component={Link}
                        href="/marketplace/bots"
                        variant="contained"
                        sx={{ mt: 2, bgcolor: '#22C55E' }}
                      >
                        Browse Bots
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  purchases.bots.map((bot) => (
                    <Grid item xs={12} sm={6} md={4} key={bot.id}>
                      <Card
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          '&:hover': { borderColor: '#22C55E' },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              src={bot.thumbnail_url}
                              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', width: 56, height: 56 }}
                            >
                              <Bot size={28} color="#22C55E" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {bot.name}
                              </Typography>
                              <Chip
                                icon={<CheckCircle size={12} />}
                                label="Owned"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(34, 197, 94, 0.2)',
                                  color: '#22C55E',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>

                          <Stack spacing={1} sx={{ mb: 2 }}>
                            {bot.license_key && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  bgcolor: 'rgba(0,0,0,0.3)',
                                  borderRadius: 1,
                                  px: 1.5,
                                  py: 0.75,
                                }}
                              >
                                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                  {bot.license_key}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(bot.license_key!)}>
                                  <Copy size={14} color="#22C55E" />
                                </IconButton>
                              </Box>
                            )}
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                              Purchased: {new Date(bot.created_at).toLocaleDateString()}
                            </Typography>
                          </Stack>

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Download size={18} />}
                            onClick={() => openAccessDialog('bot', bot.id, bot)}
                            sx={{
                              bgcolor: '#22C55E',
                              '&:hover': { bgcolor: '#16A34A' },
                            }}
                          >
                            Access Downloads
                          </Button>
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
                {purchases.products.length === 0 ? (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        py: 6,
                      }}
                    >
                      <FileText size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                        You haven't purchased any digital products yet.
                      </Typography>
                      <Button
                        component={Link}
                        href="/marketplace/products"
                        variant="contained"
                        sx={{ mt: 2, bgcolor: '#F59E0B' }}
                      >
                        Browse Products
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  purchases.products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          '&:hover': { borderColor: '#F59E0B' },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              src={product.thumbnail_url}
                              sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', width: 56, height: 56 }}
                            >
                              <FileText size={28} color="#F59E0B" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {product.name}
                              </Typography>
                              <Chip
                                label={product.product_type || 'Digital Product'}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(245, 158, 11, 0.2)',
                                  color: '#F59E0B',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>

                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2 }}>
                            Purchased: {new Date(product.created_at).toLocaleDateString()}
                          </Typography>

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Package size={18} />}
                            onClick={() => openAccessDialog('product', product.id, product)}
                            sx={{
                              bgcolor: '#F59E0B',
                              '&:hover': { bgcolor: '#D97706' },
                            }}
                          >
                            Access Content
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* Signal Subscriptions Tab */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                {purchases.signalSubscriptions.length === 0 ? (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        py: 6,
                      }}
                    >
                      <Signal size={48} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                        You don't have any signal subscriptions yet.
                      </Typography>
                      <Button
                        component={Link}
                        href="/marketplace/signals"
                        variant="contained"
                        sx={{ mt: 2, bgcolor: '#3B82F6' }}
                      >
                        Browse Signal Providers
                      </Button>
                    </Card>
                  </Grid>
                ) : (
                  purchases.signalSubscriptions.map((sub) => (
                    <Grid item xs={12} sm={6} md={4} key={sub.id}>
                      <Card
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          '&:hover': { borderColor: '#3B82F6' },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              src={sub.avatar_url}
                              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', width: 56, height: 56 }}
                            >
                              {sub.display_name?.charAt(0) || 'S'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {sub.display_name}
                              </Typography>
                              <Chip
                                icon={sub.subscription_status === 'active' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                label={sub.subscription_status === 'active' ? 'Active' : 'Expired'}
                                size="small"
                                sx={{
                                  bgcolor: sub.subscription_status === 'active'
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                                  color: sub.subscription_status === 'active' ? '#22C55E' : '#EF4444',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>

                          {sub.subscription_end && (
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2 }}>
                              {sub.subscription_status === 'active' ? 'Renews' : 'Expired'}:{' '}
                              {new Date(sub.subscription_end).toLocaleDateString()}
                            </Typography>
                          )}

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Signal size={18} />}
                            onClick={() => openAccessDialog('signal', sub.id, sub)}
                            disabled={sub.subscription_status !== 'active'}
                            sx={{
                              bgcolor: '#3B82F6',
                              '&:hover': { bgcolor: '#2563EB' },
                              '&:disabled': { bgcolor: 'rgba(59, 130, 246, 0.3)' },
                            }}
                          >
                            Access Signals
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </>
        )}

        {/* Access Details Dialog */}
        <Dialog
          open={!!selectedPurchase}
          onClose={closeAccessDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
            },
          }}
        >
          {selectedPurchase && (
            <>
              <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                    🎁 What You Get
                  </Typography>
                  <IconButton onClick={closeAccessDialog}>
                    <X size={24} color="white" />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ py: 3 }}>
                {accessLoading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#22C55E' }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                      Loading your content...
                    </Typography>
                  </Box>
                ) : accessDetails ? (
                  <>
                    {/* What You Get Section */}
                    <Box sx={{ mb: 4 }}>
                      <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                        ✅ Included in Your Purchase:
                      </Typography>
                      <Grid container spacing={2}>
                        {accessDetails.whatYouGet.map((item, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                p: 2,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              <Typography sx={{ fontSize: '1.5rem' }}>{item.icon}</Typography>
                              <Box>
                                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                                  {item.text}
                                </Typography>
                                {item.description && (
                                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                    {item.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    {/* Downloadable Files */}
                    {accessDetails.deliverables.length > 0 && (
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                          📥 Downloadable Files & Access:
                        </Typography>
                        <List>
                          {accessDetails.deliverables.map((deliverable) => {
                            const IconComponent = deliverableIcons[deliverable.deliverable_type] || FileText;
                            return (
                              <ListItem
                                key={deliverable.id}
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.03)',
                                  borderRadius: 2,
                                  mb: 1,
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }}
                              >
                                <ListItemIcon>
                                  <IconComponent size={24} color="#22C55E" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                                      {deliverable.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                      {deliverable.description}
                                      {deliverable.file_size_bytes && (
                                        <> • {formatFileSize(deliverable.file_size_bytes)}</>
                                      )}
                                    </Typography>
                                  }
                                />
                                {deliverable.file_url && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={() => handleDownload(deliverable.id)}
                                    sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
                                  >
                                    Download
                                  </Button>
                                )}
                                {deliverable.access_url && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<ExternalLink size={16} />}
                                    href={deliverable.access_url}
                                    target="_blank"
                                    sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
                                  >
                                    Open
                                  </Button>
                                )}
                                {deliverable.invite_code && (
                                  <Stack direction="row" spacing={1}>
                                    <Chip
                                      label={deliverable.invite_code}
                                      sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.3)', color: 'white' }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => copyToClipboard(deliverable.invite_code!)}
                                    >
                                      <Copy size={16} color="#22C55E" />
                                    </IconButton>
                                  </Stack>
                                )}
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    )}

                    {/* Support Section */}
                    {(accessDetails.purchase.support_email || accessDetails.purchase.support_telegram) && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                          💬 Need Help?
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {accessDetails.purchase.support_email && (
                            <Button
                              variant="outlined"
                              size="small"
                              href={`mailto:${accessDetails.purchase.support_email}`}
                              sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
                            >
                              Email Support
                            </Button>
                          )}
                          {accessDetails.purchase.support_telegram && (
                            <Button
                              variant="outlined"
                              size="small"
                              href={`https://t.me/${accessDetails.purchase.support_telegram}`}
                              target="_blank"
                              sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
                            >
                              Telegram Support
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="error">Failed to load access details</Alert>
                )}
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                <Button onClick={closeAccessDialog} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Copy Toast */}
        {copied && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: '#22C55E',
              color: 'black',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              zIndex: 9999,
            }}
          >
            ✓ Copied to clipboard!
          </Box>
        )}
      </Container>
    </Box>
  );
}
