'use client';

import { useState } from 'react';
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
  Avatar,
  Rating,
  Divider,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Bot,
  Package,
  Signal,
  ArrowLeft,
  Star,
  Users,
  Download,
  ShoppingCart,
  Check,
  Shield,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Target,
  Zap,
  Play,
  FileText,
  BookOpen,
  Video,
  Layout,
  File,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

// Unified Listing Interface - All listing types use this
export interface ListingData {
  id: number;
  type: 'bot' | 'product' | 'signal';
  name: string;
  slug: string;
  description: string;
  short_description: string;
  
  // Seller info
  seller_id: number;
  seller_name: string;
  seller_avatar?: string;
  seller_rating: number;
  seller_total_sales: number;
  seller_verified?: boolean;
  
  // Pricing
  price: number;
  is_free?: boolean;
  discount_percentage?: number;
  pricing?: {
    monthly?: number;
    quarterly?: number;
    yearly?: number;
    lifetime?: number;
  };
  
  // Stats
  total_purchases?: number;
  total_subscribers?: number;
  avg_rating: number;
  total_reviews: number;
  
  // Media
  thumbnail_url?: string;
  screenshots?: string[];
  preview_video_url?: string;
  
  // Bot-specific
  category?: string;
  platform?: string;
  currency_pairs?: string;
  timeframe?: string;
  minimum_deposit?: number;
  backtest_results?: {
    win_rate: number;
    profit_factor: number;
    max_drawdown: number;
    total_trades?: number;
    period?: string;
  };
  
  // Product-specific
  product_type?: string;
  file_size_bytes?: number;
  
  // Signal-specific
  trading_style?: string;
  risk_level?: string;
  instruments?: string[];
  performance_stats?: {
    win_rate: number;
    total_pips: number;
    avg_pips_per_trade: number;
    total_signals?: number;
    best_month_pips?: number;
    worst_month_pips?: number;
  };
  
  // Common
  features: string[];
  tags: string[];
  version?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReviewData {
  id: number;
  user_name: string;
  avatar?: string;
  rating: number;
  title?: string;
  review: string;
  created_at: string;
  verified_purchase?: boolean;
}

// Reviewer profile images
const reviewerImages: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
  3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
  4: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
  5: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
};

// Type-specific icons
const typeIcons = {
  bot: Bot,
  product: Package,
  signal: Signal,
};

const typeColors = {
  bot: '#8B5CF6',
  product: '#3B82F6',
  signal: '#22C55E',
};

const productTypeIcons: Record<string, any> = {
  ebook: BookOpen,
  video_course: Video,
  indicator: BarChart3,
  template: Layout,
  strategy_guide: FileText,
  other: File,
};

interface ListingTemplateProps {
  listing: ListingData;
  reviews: ReviewData[];
  onPurchase?: () => void;
  onSubscribe?: (plan: string) => void;
  purchasing?: boolean;
  walletBalance?: number | null;
  backUrl?: string;
}

export default function ListingTemplate({
  listing,
  reviews,
  onPurchase,
  onSubscribe,
  purchasing = false,
  walletBalance = null,
  backUrl = '/marketplace',
}: ListingTemplateProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly' | 'lifetime'>('monthly');

  const TypeIcon = typeIcons[listing.type];
  const typeColor = typeColors[listing.type];
  
  const discountedPrice = listing.discount_percentage 
    ? listing.price * (1 - listing.discount_percentage / 100)
    : listing.price;

  const getSelectedPrice = () => {
    if (listing.type !== 'signal' || !listing.pricing) return listing.price;
    return listing.pricing[selectedPlan] || 0;
  };

  const getRiskColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#22C55E';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/marketplace" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            Marketplace
          </Link>
          <Link 
            href={`/marketplace/${listing.type}s`} 
            style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
          >
            {listing.type === 'bot' ? 'Bots' : listing.type === 'product' ? 'Products' : 'Signals'}
          </Link>
          <Typography sx={{ color: 'white' }}>{listing.name}</Typography>
        </Breadcrumbs>

        {/* Back Button */}
        <Button
          component={Link}
          href={backUrl}
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}
        >
          Back
        </Button>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Hero Section */}
            <Card sx={{ 
              bgcolor: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              mb: 3,
              overflow: 'hidden',
            }}>
              {/* Thumbnail/Banner */}
              {listing.thumbnail_url && (
                <Box
                  sx={{
                    height: 250,
                    backgroundImage: `url(${listing.thumbnail_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(10, 15, 26, 1) 0%, transparent 100%)',
                  }} />
                </Box>
              )}
              
              <CardContent sx={{ p: 4, pt: listing.thumbnail_url ? 2 : 4 }}>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  {/* Icon/Avatar */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: `${typeColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `2px solid ${typeColor}`,
                    }}
                  >
                    <TypeIcon size={40} color={typeColor} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    {/* Badges */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                      <Chip
                        label={listing.type === 'bot' ? 'Trading Bot' : listing.type === 'product' ? 'Digital Product' : 'Signal Service'}
                        size="small"
                        sx={{ bgcolor: `${typeColor}20`, color: typeColor, fontWeight: 600 }}
                      />
                      {listing.is_verified && (
                        <Chip
                          icon={<CheckCircle size={14} />}
                          label="Verified"
                          size="small"
                          sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', '& .MuiChip-icon': { color: '#22C55E' } }}
                        />
                      )}
                      {listing.discount_percentage && listing.discount_percentage > 0 && (
                        <Chip
                          label={`${listing.discount_percentage}% OFF`}
                          size="small"
                          sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: 700 }}
                        />
                      )}
                      {listing.is_free && (
                        <Chip
                          label="FREE"
                          size="small"
                          sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontWeight: 700 }}
                        />
                      )}
                    </Stack>

                    {/* Title */}
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                      {listing.name}
                    </Typography>

                    {/* Short Description */}
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                      {listing.short_description}
                    </Typography>

                    {/* Stats Row */}
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Star size={16} fill="#F59E0B" color="#F59E0B" />
                        <Typography sx={{ color: 'white', fontWeight: 700 }}>
                          {Number(listing.avg_rating || 0).toFixed(1)}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          ({listing.total_reviews || 0} reviews)
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Users size={16} color="rgba(255,255,255,0.5)" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {listing.total_purchases || listing.total_subscribers || 0} {listing.type === 'signal' ? 'subscribers' : 'purchases'}
                        </Typography>
                      </Stack>
                      {listing.platform && (
                        <Chip
                          label={listing.platform.toUpperCase()}
                          size="small"
                          sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }}
                        />
                      )}
                      {listing.risk_level && (
                        <Chip
                          label={`${listing.risk_level} Risk`}
                          size="small"
                          sx={{ bgcolor: `${getRiskColor(listing.risk_level)}20`, color: getRiskColor(listing.risk_level) }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                mb: 3,
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
                '& .Mui-selected': { color: typeColor },
                '& .MuiTabs-indicator': { bgcolor: typeColor },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Details" />
              <Tab label={`Reviews (${listing.total_reviews || reviews.length})`} />
            </Tabs>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Box>
                {/* Description */}
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                      About This {listing.type === 'bot' ? 'Bot' : listing.type === 'product' ? 'Product' : 'Service'}
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        lineHeight: 1.8,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {listing.description}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Features */}
                {listing.features && listing.features.length > 0 && (
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                        Key Features
                      </Typography>
                      <Grid container spacing={2}>
                        {listing.features.map((feature, i) => (
                          <Grid item xs={12} sm={6} key={i}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: `${typeColor}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Check size={14} color={typeColor} />
                              </Box>
                              <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{feature}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Stats (Bot/Signal) */}
                {(listing.backtest_results || listing.performance_stats) && (
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                        Performance Statistics
                      </Typography>
                      <Grid container spacing={2}>
                        {listing.backtest_results && (
                          <>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
                                <TrendingUp size={24} color="#22C55E" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Win Rate</Typography>
                                <Typography variant="h4" sx={{ color: '#22C55E', fontWeight: 800 }}>
                                  {listing.backtest_results.win_rate}%
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                                <BarChart3 size={24} color="#3B82F6" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Profit Factor</Typography>
                                <Typography variant="h4" sx={{ color: '#3B82F6', fontWeight: 800 }}>
                                  {listing.backtest_results.profit_factor}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
                                <AlertTriangle size={24} color="#EF4444" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Max Drawdown</Typography>
                                <Typography variant="h4" sx={{ color: '#EF4444', fontWeight: 800 }}>
                                  {listing.backtest_results.max_drawdown}%
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', textAlign: 'center' }}>
                                <Zap size={24} color="#8B5CF6" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Total Trades</Typography>
                                <Typography variant="h4" sx={{ color: '#8B5CF6', fontWeight: 800 }}>
                                  {listing.backtest_results.total_trades || 'N/A'}
                                </Typography>
                              </Paper>
                            </Grid>
                          </>
                        )}
                        {listing.performance_stats && (
                          <>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
                                <TrendingUp size={24} color="#22C55E" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Win Rate</Typography>
                                <Typography variant="h4" sx={{ color: '#22C55E', fontWeight: 800 }}>
                                  {listing.performance_stats.win_rate}%
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                                <Target size={24} color="#3B82F6" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Total Pips</Typography>
                                <Typography variant="h4" sx={{ color: '#3B82F6', fontWeight: 800 }}>
                                  {listing.performance_stats.total_pips?.toLocaleString() || 'N/A'}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', textAlign: 'center' }}>
                                <BarChart3 size={24} color="#8B5CF6" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Avg Pips/Trade</Typography>
                                <Typography variant="h4" sx={{ color: '#8B5CF6', fontWeight: 800 }}>
                                  {listing.performance_stats.avg_pips_per_trade || 'N/A'}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Paper sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                                <Signal size={24} color="#F59E0B" />
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>Total Signals</Typography>
                                <Typography variant="h4" sx={{ color: '#F59E0B', fontWeight: 800 }}>
                                  {listing.performance_stats.total_signals || 'N/A'}
                                </Typography>
                              </Paper>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {listing.tags.map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Details Tab */}
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={2}>
                  {listing.category && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Category</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.category}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.platform && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Platform</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.platform.toUpperCase()}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.currency_pairs && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Currency Pairs</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.currency_pairs}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.timeframe && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Timeframe</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.timeframe}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.minimum_deposit && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Min. Deposit</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>${listing.minimum_deposit}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.trading_style && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Trading Style</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.trading_style}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.risk_level && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Risk Level</Typography>
                        <Typography sx={{ color: getRiskColor(listing.risk_level), fontWeight: 600 }}>{listing.risk_level}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.product_type && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Product Type</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.product_type.replace('_', ' ').toUpperCase()}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.file_size_bytes && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>File Size</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{formatFileSize(listing.file_size_bytes)}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.version && (
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Version</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>v{listing.version}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {listing.instruments && listing.instruments.length > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>Instruments Traded</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {listing.instruments.map((inst, i) => (
                            <Chip key={i} label={inst} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }} />
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Reviews Tab */}
            {activeTab === 2 && (
              <Box>
                {/* Rating Summary */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ color: '#22C55E', fontWeight: 900 }}>
                        {Number(listing.avg_rating || 0).toFixed(1)}
                      </Typography>
                      <Rating value={Number(listing.avg_rating) || 0} readOnly precision={0.1} size="large" sx={{ mb: 1 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {listing.total_reviews || reviews.length} reviews
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <Stack key={stars} direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', width: 60, fontSize: '0.875rem' }}>{stars} stars</Typography>
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, height: 8 }}>
                              <Box sx={{ width: `${percentage}%`, bgcolor: '#FFD700', borderRadius: 1, height: '100%' }} />
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', width: 40, fontSize: '0.875rem' }}>{count}</Typography>
                          </Stack>
                        );
                      })}
                    </Grid>
                  </Grid>
                </Paper>

                {/* Review Cards */}
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <Paper 
                      key={review.id} 
                      sx={{ 
                        p: 3, 
                        mb: 2, 
                        bgcolor: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          borderColor: `${typeColor}50`,
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Avatar 
                          src={review.avatar || reviewerImages[(index % 5) + 1]} 
                          sx={{ width: 56, height: 56, border: `2px solid ${typeColor}` }}
                        >
                          {review.user_name?.[0] || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>{review.user_name}</Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Rating value={review.rating} readOnly size="small" />
                                {review.verified_purchase && (
                                  <Chip 
                                    label="Verified Purchase" 
                                    size="small" 
                                    icon={<Check size={12} />}
                                    sx={{ 
                                      bgcolor: `${typeColor}20`, 
                                      color: typeColor,
                                      fontSize: '0.7rem',
                                      height: 20,
                                      '& .MuiChip-icon': { color: typeColor },
                                    }} 
                                  />
                                )}
                              </Stack>
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                              {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Typography>
                          </Stack>
                          {review.title && (
                            <Typography sx={{ color: 'white', fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                              "{review.title}"
                            </Typography>
                          )}
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                            {review.review}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <MessageSquare size={40} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No reviews yet</Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              position: 'sticky', 
              top: 20,
            }}>
              <CardContent sx={{ p: 3 }}>
                {/* Price */}
                <Box sx={{ mb: 3 }}>
                  {listing.type === 'signal' && listing.pricing ? (
                    <>
                      <ToggleButtonGroup
                        value={selectedPlan}
                        exclusive
                        onChange={(_, v) => v && setSelectedPlan(v)}
                        fullWidth
                        sx={{ mb: 2 }}
                      >
                        {[
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'quarterly', label: '3 Months' },
                          { value: 'yearly', label: 'Yearly' },
                        ].map((plan) => (
                          <ToggleButton
                            key={plan.value}
                            value={plan.value}
                            disabled={!listing.pricing?.[plan.value as keyof typeof listing.pricing]}
                            sx={{
                              color: 'rgba(255,255,255,0.6)',
                              borderColor: 'rgba(255,255,255,0.2)',
                              '&.Mui-selected': {
                                bgcolor: `${typeColor}20`,
                                color: typeColor,
                                borderColor: typeColor,
                              },
                            }}
                          >
                            {plan.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900 }}>
                          ${getSelectedPrice()}
                          <Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                            /{selectedPlan === 'monthly' ? 'mo' : selectedPlan === 'quarterly' ? '3mo' : 'yr'}
                          </Typography>
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      {listing.is_free ? (
                        <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900, textAlign: 'center' }}>
                          FREE
                        </Typography>
                      ) : (
                        <>
                          {listing.discount_percentage && listing.discount_percentage > 0 && (
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
                                ${listing.price}
                              </Typography>
                              <Chip
                                label={`-${listing.discount_percentage}%`}
                                size="small"
                                sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                              />
                            </Stack>
                          )}
                          <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900, textAlign: 'center' }}>
                            ${Number(discountedPrice || 0).toFixed(2)}
                          </Typography>
                        </>
                      )}
                    </>
                  )}
                </Box>

                {/* Wallet Balance */}
                {walletBalance !== null && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(29, 155, 240, 0.1)', border: '1px solid rgba(29, 155, 240, 0.3)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        Your Wallet Balance
                      </Typography>
                      <Typography sx={{ color: '#1D9BF0', fontWeight: 700 }}>
                        ${Number(walletBalance || 0).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Paper>
                )}

                {/* Buy/Subscribe Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => listing.type === 'signal' ? onSubscribe?.(selectedPlan) : onPurchase?.()}
                  disabled={purchasing}
                  startIcon={purchasing ? <CircularProgress size={20} /> : listing.type === 'signal' ? <Signal size={20} /> : <ShoppingCart size={20} />}
                  sx={{
                    bgcolor: typeColor,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    '&:hover': { bgcolor: typeColor, filter: 'brightness(0.9)' },
                    mb: 2,
                  }}
                >
                  {purchasing ? 'Processing...' : listing.is_free ? 'Get for Free' : listing.type === 'signal' ? 'Subscribe Now' : 'Buy Now'}
                </Button>

                {/* Trust Badges */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {[
                    { icon: Shield, text: 'Secure Payment' },
                    { icon: Download, text: listing.type === 'signal' ? 'Instant Access' : 'Instant Download' },
                    { icon: Clock, text: 'Lifetime Access' },
                    { icon: MessageSquare, text: 'Seller Support' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <item.icon size={16} color="#22C55E" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                {/* Seller Info */}
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                    Sold by
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                      src={listing.seller_avatar} 
                      sx={{ bgcolor: `${typeColor}20`, width: 48, height: 48 }}
                    >
                      {listing.seller_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{listing.seller_name}</Typography>
                        {listing.seller_verified && <CheckCircle size={14} color="#22C55E" />}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                          {Number(listing.seller_rating || 0).toFixed(1)} • {listing.seller_total_sales} sales
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
