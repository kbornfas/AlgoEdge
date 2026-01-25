'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Bot,
  Package,
  Signal,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  FileText,
  Check,
  DollarSign,
  HelpCircle,
  Trash2,
  Eye,
  TrendingUp,
  Shield,
  Target,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Product type definitions
const productTypes = {
  bot: {
    icon: Bot,
    title: 'Trading Bot',
    description: 'Expert Advisor or automated trading strategy for MT4/MT5',
    color: '#8B5CF6',
    features: ['Automated trading', 'Backtested results', 'MT4/MT5 compatible'],
  },
  product: {
    icon: Package,
    title: 'Digital Product',
    description: 'E-books, courses, indicators, templates, and more',
    color: '#3B82F6',
    features: ['Instant download', 'Multiple formats', 'Lifetime access'],
  },
  signal: {
    icon: Signal,
    title: 'Signal Service',
    description: 'Subscription-based trading signals and alerts',
    color: '#22C55E',
    features: ['Real-time alerts', 'Entry/exit points', 'Risk management'],
  },
};

const botCategories = [
  'Scalping', 'Trend Following', 'Grid Trading', 'Martingale', 
  'News Trading', 'Hedging', 'Arbitrage', 'Price Action', 'Breakout', 'Mean Reversion', 'Other'
];

const productCategories = [
  { value: 'ebook', label: 'E-Book / PDF Guide' },
  { value: 'video_course', label: 'Video Course' },
  { value: 'indicator', label: 'MT4/MT5 Indicator' },
  { value: 'template', label: 'Chart Template' },
  { value: 'strategy_guide', label: 'Strategy Guide' },
  { value: 'tool', label: 'Trading Tool' },
  { value: 'other', label: 'Other' },
];

const platforms = [
  { value: 'mt4', label: 'MetaTrader 4' },
  { value: 'mt5', label: 'MetaTrader 5' },
  { value: 'both', label: 'MT4 & MT5' },
  { value: 'tradingview', label: 'TradingView' },
  { value: 'ctrader', label: 'cTrader' },
];

const tradingStyles = ['Scalping', 'Day Trading', 'Swing Trading', 'Position Trading', 'News Trading'];
const riskLevels = [
  { value: 'Low', color: '#22C55E', description: 'Conservative approach, smaller gains, minimal drawdown' },
  { value: 'Medium', color: '#F59E0B', description: 'Balanced risk/reward, moderate position sizes' },
  { value: 'High', color: '#EF4444', description: 'Aggressive approach, larger potential gains and losses' },
];

const commonInstruments = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 
  'US30', 'NAS100', 'SPX500', 'BTCUSD', 'ETHUSD'
];

const suggestedFeatures = {
  bot: [
    'Fully automated trading',
    'Smart lot sizing',
    'Built-in risk management',
    'News filter',
    'Multiple take profit levels',
    'Trailing stop loss',
    'Anti-slippage protection',
    'Visual trading panel',
    'Email/Telegram alerts',
    'Spread protection',
  ],
  product: [
    'Lifetime access',
    'Free updates',
    'HD quality',
    'Certificate included',
    'Downloadable resources',
    'Mobile friendly',
    '24/7 access',
    'Community access',
    'Support included',
    'Money-back guarantee',
  ],
  signal: [
    'Real-time alerts',
    'Entry & exit points',
    'Stop loss & take profit',
    'Risk per trade guidance',
    'Telegram channel access',
    'Technical analysis',
    'Daily market updates',
    'Multiple timeframes',
    'Win rate tracking',
    'Support chat',
  ],
};

export default function CreateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [listingType, setListingType] = useState<'bot' | 'product' | 'signal' | ''>(initialType as any);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Common fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  // Media
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [mainFile, setMainFile] = useState<File | null>(null);

  // Bot-specific fields
  const [botCategory, setBotCategory] = useState('');
  const [platform, setPlatform] = useState('mt5');
  const [currencyPairs, setCurrencyPairs] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [backtest, setBacktest] = useState({ 
    winRate: '', 
    profitFactor: '', 
    drawdown: '',
    totalTrades: '',
    period: '',
  });

  // Product-specific fields
  const [productType, setProductType] = useState('');
  const [productCategory, setProductCategory] = useState('');

  // Signal-specific fields
  const [tradingStyle, setTradingStyle] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [instrumentInput, setInstrumentInput] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [quarterlyPrice, setQuarterlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [lifetimePrice, setLifetimePrice] = useState('');
  const [performanceStats, setPerformanceStats] = useState({
    winRate: '',
    totalPips: '',
    avgPipsPerTrade: '',
    totalSignals: '',
  });

  const steps = ['Type', 'Basic Info', 'Details', 'Media', 'Pricing', 'Review'];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim()) && features.length < 15) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleAddInstrument = () => {
    if (instrumentInput.trim() && !instruments.includes(instrumentInput.toUpperCase().trim())) {
      setInstruments([...instruments, instrumentInput.toUpperCase().trim()]);
      setInstrumentInput('');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshots(prev => [...prev, reader.result as string]);
          setScreenshotFiles(prev => [...prev, file]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body: any = {};

      // Common fields for all types
      const commonFields = {
        name,
        description,
        short_description: shortDescription,
        features,
        tags,
        version,
      };

      if (listingType === 'bot') {
        endpoint = '/api/marketplace/bots';
        body = {
          ...commonFields,
          category: botCategory,
          platform,
          currency_pairs: currencyPairs,
          timeframe,
          minimum_deposit: parseFloat(minDeposit) || 0,
          price: isFree ? 0 : parseFloat(price),
          is_free: isFree,
          discount_percentage: parseFloat(discountPercent) || 0,
          backtest_results: {
            win_rate: parseFloat(backtest.winRate) || 0,
            profit_factor: parseFloat(backtest.profitFactor) || 0,
            max_drawdown: parseFloat(backtest.drawdown) || 0,
            total_trades: parseInt(backtest.totalTrades) || 0,
            period: backtest.period,
          },
        };
      } else if (listingType === 'product') {
        endpoint = '/api/marketplace/products';
        body = {
          ...commonFields,
          product_type: productType,
          category: productCategory,
          price: parseFloat(price) || 0,
          discount_percentage: parseFloat(discountPercent) || 0,
        };
      } else if (listingType === 'signal') {
        endpoint = '/api/marketplace/signals/providers';
        body = {
          ...commonFields,
          trading_style: tradingStyle,
          risk_level: riskLevel,
          instruments,
          pricing: {
            monthly: parseFloat(monthlyPrice) || 0,
            quarterly: parseFloat(quarterlyPrice) || 0,
            yearly: parseFloat(yearlyPrice) || 0,
            lifetime: parseFloat(lifetimePrice) || 0,
          },
          performance_stats: {
            win_rate: parseFloat(performanceStats.winRate) || 0,
            total_pips: parseInt(performanceStats.totalPips) || 0,
            avg_pips_per_trade: parseFloat(performanceStats.avgPipsPerTrade) || 0,
            total_signals: parseInt(performanceStats.totalSignals) || 0,
          },
        };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/seller');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create listing');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return !!listingType;
      case 1: return name.length >= 3 && shortDescription.length >= 10 && description.length >= 50;
      case 2: 
        if (listingType === 'bot') return botCategory && platform;
        if (listingType === 'product') return productType;
        if (listingType === 'signal') return tradingStyle && riskLevel && instruments.length > 0;
        return true;
      case 3: return true; // Media is optional
      case 4:
        if (listingType === 'signal') return monthlyPrice || yearlyPrice;
        return isFree || parseFloat(price) > 0;
      default: return true;
    }
  };

  const renderStepContent = () => {
    // Step 0: Choose Type
    if (activeStep === 0) {
      return (
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            What are you selling?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
            Choose the type of product you want to list on the marketplace
          </Typography>
          
          <Grid container spacing={3}>
            {(Object.keys(productTypes) as Array<keyof typeof productTypes>).map((type) => {
              const item = productTypes[type];
              const Icon = item.icon;
              const isSelected = listingType === type;
              return (
                <Grid item xs={12} md={4} key={type}>
                  <Card
                    onClick={() => setListingType(type)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? `${item.color}15` : 'rgba(255,255,255,0.02)',
                      border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        borderColor: item.color,
                        bgcolor: `${item.color}10`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          bgcolor: `${item.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon size={30} color={item.color} />
                      </Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', mb: 2 }}>
                        {item.description}
                      </Typography>
                      <Stack spacing={0.5}>
                        {item.features.map((f, i) => (
                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                            <Check size={14} color={item.color} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{f}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      {isSelected && (
                        <Chip
                          icon={<Check size={14} />}
                          label="Selected"
                          size="small"
                          sx={{ mt: 2, bgcolor: item.color, color: 'white' }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      );
    }

    // Step 1: Basic Info
    if (activeStep === 1) {
      return (
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Basic Information
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
            Provide the essential details about your listing
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Listing Name *"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={listingType === 'bot' ? 'e.g., Gold Scalper Pro EA' : 
                            listingType === 'product' ? 'e.g., Complete Trading Masterclass' : 
                            'e.g., Premium Forex Signals'}
                helperText={`${name.length}/100 characters - Make it descriptive and memorable`}
                inputProps={{ maxLength: 100 }}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Short Description (Tagline) *"
                fullWidth
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A brief summary that will appear in search results and cards"
                helperText={`${shortDescription.length}/255 characters - This is shown on listing cards`}
                inputProps={{ maxLength: 255 }}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Full Description *"
                fullWidth
                multiline
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Provide a detailed description of your ${listingType}. Include:
• What it does and how it works
• Key benefits and features
• Who it's best suited for
• Requirements or prerequisites
• What's included in the purchase`}
                helperText={`${description.length} characters - Minimum 50 characters. Be detailed and thorough!`}
                sx={textFieldStyles}
              />
            </Grid>
            
            {/* Tags */}
            <Grid item xs={12}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontWeight: 600 }}>
                Tags (helps buyers find your listing)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {tags.map((tag, i) => (
                  <Chip
                    key={i}
                    label={tag}
                    onDelete={() => setTags(tags.filter((_, idx) => idx !== i))}
                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', mb: 1 }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Add tag (e.g., forex, gold, scalping)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  sx={{ ...textFieldStyles, flex: 1 }}
                />
                <Button onClick={handleAddTag} variant="outlined" sx={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}>
                  <Plus size={18} />
                </Button>
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mt: 1 }}>
                {tags.length}/10 tags - Press Enter to add
              </Typography>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // Step 2: Type-specific Details
    if (activeStep === 2) {
      const typeColor = listingType ? productTypes[listingType].color : '#8B5CF6';
      
      return (
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            {listingType === 'bot' ? 'Bot Details' : listingType === 'product' ? 'Product Details' : 'Signal Details'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
            Provide specific details about your {listingType}
          </Typography>

          {listingType === 'bot' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={selectStyles}>
                  <InputLabel>Strategy Category *</InputLabel>
                  <Select value={botCategory} onChange={(e) => setBotCategory(e.target.value)} label="Strategy Category *">
                    {botCategories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={selectStyles}>
                  <InputLabel>Platform *</InputLabel>
                  <Select value={platform} onChange={(e) => setPlatform(e.target.value)} label="Platform *">
                    {platforms.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Currency Pairs / Instruments *"
                  fullWidth
                  value={currencyPairs}
                  onChange={(e) => setCurrencyPairs(e.target.value)}
                  placeholder="e.g., XAUUSD, EURUSD, US30"
                  helperText="Separate multiple pairs with commas"
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recommended Timeframe"
                  fullWidth
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  placeholder="e.g., M15, H1, H4"
                  helperText="Optimal timeframe for best results"
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Minimum Deposit"
                  fullWidth
                  type="number"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(e.target.value)}
                  placeholder="Recommended minimum to start"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Version"
                  fullWidth
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 1.0.0"
                  sx={textFieldStyles}
                />
              </Grid>
              
              {/* Backtest Results */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TrendingUp size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white', fontWeight: 700 }}>
                    Backtest / Performance Results
                  </Typography>
                  <Chip label="Highly Recommended" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: '0.7rem' }} />
                </Stack>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  Providing verified backtest results increases buyer trust and conversion rates by up to 300%.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Win Rate"
                      type="number"
                      fullWidth
                      value={backtest.winRate}
                      onChange={(e) => setBacktest({ ...backtest, winRate: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      placeholder="e.g., 75"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Profit Factor"
                      type="number"
                      fullWidth
                      value={backtest.profitFactor}
                      onChange={(e) => setBacktest({ ...backtest, profitFactor: e.target.value })}
                      placeholder="e.g., 2.5"
                      helperText="Gross profit / Gross loss"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Max Drawdown"
                      type="number"
                      fullWidth
                      value={backtest.drawdown}
                      onChange={(e) => setBacktest({ ...backtest, drawdown: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      placeholder="e.g., 15"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Total Trades"
                      type="number"
                      fullWidth
                      value={backtest.totalTrades}
                      onChange={(e) => setBacktest({ ...backtest, totalTrades: e.target.value })}
                      placeholder="e.g., 1500"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Testing Period"
                      fullWidth
                      value={backtest.period}
                      onChange={(e) => setBacktest({ ...backtest, period: e.target.value })}
                      placeholder="e.g., Jan 2020 - Dec 2024 (5 years)"
                      helperText="Longer testing periods demonstrate reliability"
                      sx={textFieldStyles}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Features */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  Key Features
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                  List the main features of your bot (click to add suggestions or type custom)
                </Typography>
                
                {/* Suggested Features */}
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1 }}>Quick add:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {suggestedFeatures.bot.filter(f => !features.includes(f)).slice(0, 6).map((f, i) => (
                    <Chip
                      key={i}
                      label={`+ ${f}`}
                      size="small"
                      onClick={() => setFeatures([...features, f])}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        color: 'rgba(255,255,255,0.6)', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' },
                        mb: 1,
                      }}
                    />
                  ))}
                </Stack>

                {/* Added Features */}
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {features.map((f, i) => (
                    <Chip
                      key={i}
                      label={f}
                      onDelete={() => setFeatures(features.filter((_, idx) => idx !== i))}
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', mb: 1 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add custom feature"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    sx={{ ...textFieldStyles, flex: 1 }}
                  />
                  <Button onClick={handleAddFeature} variant="outlined" sx={{ borderColor: '#22C55E', color: '#22C55E' }}>
                    <Plus size={18} />
                  </Button>
                </Stack>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mt: 1 }}>
                  {features.length}/15 features added
                </Typography>
              </Grid>
            </Grid>
          )}

          {listingType === 'product' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={selectStyles}>
                  <InputLabel>Product Type *</InputLabel>
                  <Select value={productType} onChange={(e) => setProductType(e.target.value)} label="Product Type *">
                    {productCategories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Category"
                  fullWidth
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="e.g., Forex, Crypto, Technical Analysis"
                  sx={textFieldStyles}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Version"
                  fullWidth
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 1.0"
                  sx={textFieldStyles}
                />
              </Grid>

              {/* Features for Product */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  What's Included
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                  Tell buyers exactly what they'll get
                </Typography>
                
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1 }}>Quick add:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {suggestedFeatures.product.filter(f => !features.includes(f)).slice(0, 6).map((f, i) => (
                    <Chip
                      key={i}
                      label={`+ ${f}`}
                      size="small"
                      onClick={() => setFeatures([...features, f])}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        color: 'rgba(255,255,255,0.6)', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' },
                        mb: 1,
                      }}
                    />
                  ))}
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {features.map((f, i) => (
                    <Chip
                      key={i}
                      label={f}
                      onDelete={() => setFeatures(features.filter((_, idx) => idx !== i))}
                      sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', mb: 1 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add what's included"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    sx={{ ...textFieldStyles, flex: 1 }}
                  />
                  <Button onClick={handleAddFeature} variant="outlined" sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}>
                    <Plus size={18} />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}

          {listingType === 'signal' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={selectStyles}>
                  <InputLabel>Trading Style *</InputLabel>
                  <Select value={tradingStyle} onChange={(e) => setTradingStyle(e.target.value)} label="Trading Style *">
                    {tradingStyles.map((style) => (
                      <MenuItem key={style} value={style}>{style}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={selectStyles}>
                  <InputLabel>Risk Level *</InputLabel>
                  <Select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} label="Risk Level *">
                    {riskLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: level.color }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem' }}>{level.value}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{level.description}</Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Instruments */}
              <Grid item xs={12}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontWeight: 600 }}>
                  Instruments Traded *
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1 }}>Quick add popular pairs:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {commonInstruments.filter(i => !instruments.includes(i)).slice(0, 8).map((inst) => (
                    <Chip
                      key={inst}
                      label={`+ ${inst}`}
                      size="small"
                      onClick={() => setInstruments([...instruments, inst])}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        color: 'rgba(255,255,255,0.6)', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' },
                        mb: 1,
                      }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {instruments.map((inst, i) => (
                    <Chip
                      key={i}
                      label={inst}
                      onDelete={() => setInstruments(instruments.filter((_, idx) => idx !== i))}
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', mb: 1 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add instrument (e.g., GBPJPY)"
                    value={instrumentInput}
                    onChange={(e) => setInstrumentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInstrument())}
                    sx={{ ...textFieldStyles, flex: 1 }}
                  />
                  <Button onClick={handleAddInstrument} variant="outlined" sx={{ borderColor: '#22C55E', color: '#22C55E' }}>
                    <Plus size={18} />
                  </Button>
                </Stack>
              </Grid>

              {/* Performance Stats */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Target size={20} color="#22C55E" />
                  <Typography sx={{ color: 'white', fontWeight: 700 }}>
                    Performance Statistics
                  </Typography>
                  <Chip label="Highly Recommended" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: '0.7rem' }} />
                </Stack>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  Signals with verified performance stats get 5x more subscribers.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Win Rate"
                      type="number"
                      fullWidth
                      value={performanceStats.winRate}
                      onChange={(e) => setPerformanceStats({ ...performanceStats, winRate: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      placeholder="e.g., 78"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Total Pips"
                      type="number"
                      fullWidth
                      value={performanceStats.totalPips}
                      onChange={(e) => setPerformanceStats({ ...performanceStats, totalPips: e.target.value })}
                      placeholder="e.g., 5000"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Avg Pips/Trade"
                      type="number"
                      fullWidth
                      value={performanceStats.avgPipsPerTrade}
                      onChange={(e) => setPerformanceStats({ ...performanceStats, avgPipsPerTrade: e.target.value })}
                      placeholder="e.g., 35"
                      sx={textFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      label="Total Signals"
                      type="number"
                      fullWidth
                      value={performanceStats.totalSignals}
                      onChange={(e) => setPerformanceStats({ ...performanceStats, totalSignals: e.target.value })}
                      placeholder="e.g., 250"
                      sx={textFieldStyles}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Features for Signal */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  What Subscribers Get
                </Typography>
                
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 1 }}>Quick add:</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {suggestedFeatures.signal.filter(f => !features.includes(f)).slice(0, 6).map((f, i) => (
                    <Chip
                      key={i}
                      label={`+ ${f}`}
                      size="small"
                      onClick={() => setFeatures([...features, f])}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        color: 'rgba(255,255,255,0.6)', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' },
                        mb: 1,
                      }}
                    />
                  ))}
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  {features.map((f, i) => (
                    <Chip
                      key={i}
                      label={f}
                      onDelete={() => setFeatures(features.filter((_, idx) => idx !== i))}
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', mb: 1 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Add feature"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    sx={{ ...textFieldStyles, flex: 1 }}
                  />
                  <Button onClick={handleAddFeature} variant="outlined" sx={{ borderColor: '#22C55E', color: '#22C55E' }}>
                    <Plus size={18} />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Box>
      );
    }

    // Step 3: Media
    if (activeStep === 3) {
      return (
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Media & Files
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
            Add images and files to make your listing stand out
          </Typography>

          <Grid container spacing={3}>
            {/* Thumbnail */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ImageIcon size={20} color="#8B5CF6" />
                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                  Thumbnail Image
                </Typography>
                <Chip label="Recommended" size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', fontSize: '0.7rem' }} />
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                This is the main image shown on listing cards. A professional thumbnail increases clicks by 200%.
              </Typography>
              <input
                type="file"
                ref={thumbnailInputRef}
                hidden
                accept="image/*"
                onChange={handleThumbnailChange}
              />
              {thumbnailPreview ? (
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', position: 'relative', borderRadius: 2 }}>
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail" 
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} 
                  />
                  <IconButton
                    onClick={() => { setThumbnailPreview(''); setThumbnailFile(null); }}
                    sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.7)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.8)' } }}
                  >
                    <X size={18} color="white" />
                  </IconButton>
                </Paper>
              ) : (
                <Paper
                  onClick={() => thumbnailInputRef.current?.click()}
                  sx={{
                    p: 4,
                    border: '2px dashed rgba(139, 92, 246, 0.3)',
                    bgcolor: 'rgba(139, 92, 246, 0.05)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.1)' },
                  }}
                >
                  <Upload size={40} color="#8B5CF6" style={{ marginBottom: 8 }} />
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Click to upload thumbnail
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                    PNG, JPG, WebP up to 5MB • Recommended: 1200×630px
                  </Typography>
                </Paper>
              )}
            </Grid>

            {/* Screenshots */}
            <Grid item xs={12}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                Screenshots / Gallery
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                Add screenshots showing your {listingType} in action, results, or interface
              </Typography>
              <input
                type="file"
                ref={screenshotInputRef}
                hidden
                accept="image/*"
                multiple
                onChange={handleScreenshotAdd}
              />
              <Grid container spacing={2}>
                {screenshots.map((ss, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Paper sx={{ position: 'relative', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden' }}>
                      <img 
                        src={ss} 
                        alt={`Screenshot ${i + 1}`} 
                        style={{ width: '100%', height: 120, objectFit: 'cover' }} 
                      />
                      <IconButton
                        onClick={() => removeScreenshot(i)}
                        size="small"
                        sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.7)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.8)' } }}
                      >
                        <X size={14} color="white" />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
                {screenshots.length < 8 && (
                  <Grid item xs={6} md={3}>
                    <Paper
                      onClick={() => screenshotInputRef.current?.click()}
                      sx={{
                        height: 120,
                        border: '2px dashed rgba(255,255,255,0.2)',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.05)' },
                      }}
                    >
                      <Plus size={24} color="#8B5CF6" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 1 }}>
                        Add Image
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mt: 1 }}>
                {screenshots.length}/8 images • Click each to remove
              </Typography>
            </Grid>

            {/* Main File (for products) */}
            {listingType === 'product' && (
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  Product File
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                  Upload the file buyers will receive (you can add this later from your seller dashboard)
                </Typography>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={(e) => setMainFile(e.target.files?.[0] || null)}
                />
                <Paper
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    p: 4,
                    border: `2px dashed ${mainFile ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.3)'}`,
                    bgcolor: mainFile ? 'rgba(34, 197, 94, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 246, 0.1)' },
                  }}
                >
                  {mainFile ? <Check size={40} color="#22C55E" /> : <FileText size={40} color="#3B82F6" />}
                  <Typography sx={{ color: 'white', fontWeight: 600, mt: 1 }}>
                    {mainFile ? mainFile.name : 'Click to upload product file'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                    PDF, ZIP, RAR, MP4 up to 500MB
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      );
    }

    // Step 4: Pricing
    if (activeStep === 4) {
      const typeColor = listingType ? productTypes[listingType].color : '#8B5CF6';
      
      return (
        <Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Pricing
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
            Set competitive prices for your {listingType}
          </Typography>

          {listingType === 'signal' ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                  Subscription Pricing
                </Typography>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <strong>Set at least one pricing tier.</strong> Monthly and yearly are most popular. Offer discounts on longer subscriptions to encourage commitment.
                </Alert>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 2 }}>
                  <Typography sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>Monthly *</Typography>
                  <TextField
                    type="number"
                    fullWidth
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    placeholder="49"
                    sx={textFieldStyles}
                  />
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>Quarterly</Typography>
                  <TextField
                    type="number"
                    fullWidth
                    value={quarterlyPrice}
                    onChange={(e) => setQuarterlyPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    placeholder="129"
                    helperText={monthlyPrice ? `Suggest ~$${(parseFloat(monthlyPrice) * 3 * 0.85).toFixed(0)} (15% off)` : ''}
                    sx={textFieldStyles}
                  />
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography sx={{ color: '#22C55E', fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>Yearly</Typography>
                    <Chip label="Popular" size="small" sx={{ bgcolor: '#22C55E', color: 'white', height: 18, fontSize: '0.65rem' }} />
                  </Stack>
                  <TextField
                    type="number"
                    fullWidth
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    placeholder="399"
                    helperText={monthlyPrice ? `Suggest ~$${(parseFloat(monthlyPrice) * 12 * 0.7).toFixed(0)} (30% off)` : ''}
                    sx={textFieldStyles}
                  />
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>Lifetime</Typography>
                  <TextField
                    type="number"
                    fullWidth
                    value={lifetimePrice}
                    onChange={(e) => setLifetimePrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    placeholder="999"
                    helperText="Optional - premium option"
                    sx={textFieldStyles}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <strong>Platform commission: 25%</strong> — You'll receive <strong>75%</strong> of each subscription payment
                </Alert>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22C55E' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22C55E' } }}
                    />
                  }
                  label={<Typography sx={{ color: 'white' }}>Offer for Free (great for building audience)</Typography>}
                />
              </Grid>
              {!isFree && (
                <>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <DollarSign size={20} color="#8B5CF6" />
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>Price *</Typography>
                      </Stack>
                      <TextField
                        type="number"
                        fullWidth
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        placeholder="99"
                        sx={textFieldStyles}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <TrendingUp size={20} color="#22C55E" />
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>Launch Discount</Typography>
                      </Stack>
                      <TextField
                        type="number"
                        fullWidth
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        placeholder="20"
                        helperText="Optional - creates urgency"
                        sx={textFieldStyles}
                      />
                    </Paper>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <strong>Platform commission: 25%</strong> — You'll receive <strong>75%</strong> of each sale
                  {price && !isFree && (
                    <>
                      <br />
                      <Box component="span" sx={{ mt: 1, display: 'block' }}>
                        Your earnings per sale: <strong>${(parseFloat(price) * 0.75 * (1 - (parseFloat(discountPercent) || 0) / 100)).toFixed(2)}</strong>
                        {discountPercent && ` (with ${discountPercent}% launch discount)`}
                      </Box>
                    </>
                  )}
                </Alert>
              </Grid>
            </Grid>
          )}
        </Box>
      );
    }

    // Step 5: Review
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <strong>Almost done!</strong> Review your listing details before submitting
        </Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                {listingType && (() => { const Icon = productTypes[listingType].icon; return <Icon size={18} color={productTypes[listingType].color} />; })()}
                <Typography sx={{ color: 'white', fontWeight: 600 }}>
                  {listingType && productTypes[listingType].title}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</Typography>
              <Typography sx={{ color: 'white', fontWeight: 600, mt: 0.5 }}>{name}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Short Description</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>{shortDescription}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Price</Typography>
              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.5rem', mt: 0.5 }}>
                {listingType === 'signal' 
                  ? `$${monthlyPrice}/mo` 
                  : isFree ? 'FREE' : `$${price}${discountPercent ? ` (-${discountPercent}%)` : ''}`}
              </Typography>
            </Paper>
          </Grid>
          {listingType === 'bot' && botCategory && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Category & Platform</Typography>
                <Typography sx={{ color: 'white', fontWeight: 600, mt: 0.5 }}>{botCategory} • {platform.toUpperCase()}</Typography>
              </Paper>
            </Grid>
          )}
          {listingType === 'signal' && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Trading Style & Risk</Typography>
                <Typography sx={{ color: 'white', fontWeight: 600, mt: 0.5 }}>{tradingStyle} • {riskLevel} Risk</Typography>
              </Paper>
            </Grid>
          )}
          {features.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Features ({features.length})</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {features.map((f, i) => (
                    <Chip key={i} label={f} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', mb: 0.5 }} />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}
          {tags.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Tags ({tags.length})</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {tags.map((t, i) => (
                    <Chip key={i} label={t} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', mb: 0.5 }} />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}
          {thumbnailPreview && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>Thumbnail</Typography>
                <img src={thumbnailPreview} alt="Thumbnail preview" style={{ height: 80, borderRadius: 8 }} />
              </Paper>
            </Grid>
          )}
        </Grid>

        <Alert severity="warning" sx={{ mt: 3, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <strong>Review Process:</strong> Your listing will be reviewed by our team before going live. This usually takes 24-48 hours.
        </Alert>
      </Box>
    );
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
        <Container maxWidth="sm">
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center', p: 4, borderRadius: 3 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Check size={40} color="#22C55E" />
            </Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              Listing Submitted Successfully!
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              Your listing is now pending review. We'll notify you by email once it's approved (usually within 24-48 hours).
            </Typography>
            <Button
              component={Link}
              href="/dashboard/seller"
              variant="contained"
              sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' }, px: 4, py: 1.5, borderRadius: 2 }}
            >
              Back to Seller Dashboard
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          component={Link}
          href="/dashboard/seller"
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, '&:hover': { color: 'white' } }}
        >
          Back to Seller Dashboard
        </Button>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>
            Create New Listing
          </Typography>
          {listingType && (
            <Chip 
              icon={(() => { const Icon = productTypes[listingType].icon; return <Icon size={14} />; })()}
              label={productTypes[listingType].title}
              sx={{ bgcolor: `${productTypes[listingType].color}20`, color: productTypes[listingType].color }}
            />
          )}
        </Stack>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
          All listings follow a professional template to ensure consistency and trust
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': { 
                    color: index <= activeStep ? 'white' : 'rgba(255,255,255,0.4)',
                    fontWeight: index === activeStep ? 700 : 400,
                  },
                  '& .MuiStepIcon-root': {
                    color: index < activeStep ? '#22C55E' : index === activeStep ? '#8B5CF6' : 'rgba(255,255,255,0.2)',
                  },
                  '& .MuiStepIcon-text': { fill: 'white' },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3 }}>
          {renderStepContent()}
        </Card>

        <Stack direction="row" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(activeStep - 1)}
            startIcon={<ArrowLeft size={18} />}
            sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="contained"
              endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Check size={18} />}
              sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, px: 4, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Submitting...' : 'Submit Listing'}
            </Button>
          ) : (
            <Button
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={!canProceed()}
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' }, '&:disabled': { bgcolor: 'rgba(139, 92, 246, 0.3)' }, px: 4, py: 1.5, borderRadius: 2 }}
            >
              Continue
            </Button>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputAdornment-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)' },
};

const selectStyles = {
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
};
