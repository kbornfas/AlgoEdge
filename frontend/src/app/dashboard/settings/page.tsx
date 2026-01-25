'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Collapse,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  TrendingUp,
  Send,
  LogOut,
  Trash2,
  Download,
  AlertTriangle,
  Monitor,
  Copy,
  Key,
  QrCode,
  CheckCircle,
  Settings,
  Palette,
  Globe,
  Clock,
  BarChart3,
  Target,
  Zap,
  BellRing,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Laptop,
  Languages,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Camera,
  Upload,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SettingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  status?: 'enabled' | 'disabled' | 'warning';
  children?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
}

interface SecurityLevel {
  level: number;
  label: string;
  color: string;
}

// Components
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Fade in={value === index} timeout={300}>
      <div role="tabpanel" hidden={value !== index} {...other}>
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
      </div>
    </Fade>
  );
}

function SettingCard({ icon, title, description, action, status, children, expandable, defaultExpanded = false }: SettingCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const statusColors = {
    enabled: theme.palette.success.main,
    disabled: theme.palette.grey[500],
    warning: theme.palette.warning.main,
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: expandable ? 'pointer' : 'default',
          }}
          onClick={() => expandable && setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: status ? `linear-gradient(135deg, ${statusColors[status]} 0%, ${alpha(statusColors[status], 0.7)} 100%)` : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(status ? statusColors[status] : theme.palette.primary.main, 0.4)}`,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={600}>{title}</Typography>
                {status && (
                  <Chip 
                    label={status === 'enabled' ? 'Active' : status === 'warning' ? 'Attention' : 'Inactive'} 
                    size="small" 
                    sx={{ 
                      height: 20,
                      bgcolor: alpha(statusColors[status], 0.15),
                      color: statusColors[status],
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            {expandable && (
              <IconButton size="small">
                {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </IconButton>
            )}
          </Box>
        </Box>
        {children && (
          <Collapse in={expandable ? expanded : true}>
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              {children}
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityMeter({ level }: { level: number }) {
  const theme = useTheme();
  const levels: SecurityLevel[] = [
    { level: 25, label: 'Weak', color: theme.palette.error.main },
    { level: 50, label: 'Fair', color: theme.palette.warning.main },
    { level: 75, label: 'Good', color: theme.palette.info.main },
    { level: 100, label: 'Excellent', color: theme.palette.success.main },
  ];
  
  const currentLevel = levels.find(l => level <= l.level) || levels[levels.length - 1];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight={600}>Security Score</Typography>
        <Typography variant="body2" sx={{ color: currentLevel.color, fontWeight: 600 }}>
          {level}% - {currentLevel.label}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={level} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: alpha(currentLevel.color, 0.2),
          '& .MuiLinearProgress-bar': {
            bgcolor: currentLevel.color,
            borderRadius: 4,
          }
        }} 
      />
    </Box>
  );
}

// Timezone options
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'Europe/London', label: 'GMT - London', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'CET - Paris, Berlin', offset: '+01:00' },
  { value: 'Europe/Moscow', label: 'MSK - Moscow', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'GST - Dubai', offset: '+04:00' },
  { value: 'Asia/Singapore', label: 'SGT - Singapore', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'JST - Tokyo', offset: '+09:00' },
  { value: 'Asia/Hong_Kong', label: 'HKT - Hong Kong', offset: '+08:00' },
  { value: 'Australia/Sydney', label: 'AEST - Sydney', offset: '+11:00' },
  { value: 'Africa/Nairobi', label: 'EAT - Nairobi', offset: '+03:00' },
  { value: 'Africa/Lagos', label: 'WAT - Lagos', offset: '+01:00' },
  { value: 'Africa/Johannesburg', label: 'SAST - Johannesburg', offset: '+02:00' },
];

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];

// Currency options
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export default function SettingsPage() {
  const router = useRouter();
  const theme = useTheme();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Dialogs
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Profile State
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    bio: '',
    country: '',
    dateOfBirth: '',
    avatarUrl: '',
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password Strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    tradeAlerts: true,
    marketNews: false,
    weeklyReports: true,
    monthlyReports: true,
    priceAlerts: true,
    securityAlerts: true,
    promotionalEmails: false,
    newsletterEmails: true,
    pushNotifications: true,
    pushTradeAlerts: true,
    pushPriceAlerts: true,
    telegramAlerts: false,
    telegramTradeAlerts: true,
    telegramPriceAlerts: true,
    telegramDailyDigest: false,
    soundEnabled: true,
    soundVolume: 70,
  });

  // Trading Preferences
  const [tradingPrefs, setTradingPrefs] = useState({
    defaultRiskPercent: 2,
    maxDailyTrades: 10,
    maxDailyLossPercent: 5,
    maxLotSize: 0.5,
    defaultLotSize: 0.01,
    tradingHoursStart: '00:00',
    tradingHoursEnd: '23:59',
    timezone: 'UTC',
    autoStopOnDailyLoss: true,
    weekendTrading: false,
    newsFilterEnabled: true,
    newsFilterMinutes: 30,
    maxOpenTrades: 5,
    trailingStopEnabled: false,
    trailingStopPips: 20,
    breakEvenEnabled: false,
    breakEvenPips: 10,
    defaultTakeProfit: 50,
    defaultStopLoss: 25,
    partialCloseEnabled: false,
    partialClosePercent: 50,
    partialClosePips: 30,
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    accentColor: 'blue',
    compactMode: false,
    showProfitInPips: false,
    showPercentageGain: true,
    animationsEnabled: true,
    chartDefaultTimeframe: '1H',
    dashboardLayout: 'default',
    sidebarCollapsed: false,
  });

  // Localization Settings
  const [localization, setLocalization] = useState({
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showOnLeaderboard: true,
    shareTradeHistory: false,
    allowDataAnalytics: true,
    hideBalance: false,
    twoClickTrade: true,
    confirmBeforeClose: true,
    sessionTimeout: 30,
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    twoFactorSecret: '',
    twoFactorQrCode: '',
    telegramConnected: false,
    telegramChatId: '',
    loginNotifications: true,
    ipWhitelist: false,
    whitelistedIps: [] as string[],
    lastPasswordChange: '',
    activeSessions: 1,
  });

  // Sessions
  const [sessions, setSessions] = useState<Array<{
    id: number;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }>>([]);

  // Telegram state
  const [telegramConnectLink, setTelegramConnectLink] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Calculate security score
  const calculateSecurityScore = useCallback(() => {
    let score = 0;
    if (security.twoFactorEnabled) score += 30;
    if (security.telegramConnected) score += 15;
    if (security.loginNotifications) score += 10;
    if (passwords.newPassword.length >= 12) score += 15;
    if (profile.phone) score += 10;
    if (privacy.twoClickTrade) score += 10;
    if (privacy.confirmBeforeClose) score += 10;
    return Math.min(score, 100);
  }, [security, passwords, profile, privacy]);

  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    setSecurityScore(calculateSecurityScore());
  }, [calculateSecurityScore]);

  // Calculate password strength
  useEffect(() => {
    const pwd = passwords.newPassword;
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 20;
    if (/[A-Z]/.test(pwd)) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 10;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 15;
    setPasswordStrength(strength);
  }, [passwords.newPassword]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
    fetchSessions();
    checkTelegramStatusSilent();
    setPageLoading(false);
  }, [router]);

  // Auto-poll for Telegram connection when dialog is open
  useEffect(() => {
    if (!showTelegramDialog || !telegramConnectLink) return;
    
    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/api/telegram/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (data.connected) {
          setSecurity(prev => ({ 
            ...prev, 
            telegramConnected: true, 
            telegramChatId: data.chatId || '',
          }));
          setNotifications(prev => ({ ...prev, telegramAlerts: data.alertsEnabled ?? true }));
          setShowTelegramDialog(false);
          setTelegramConnectLink('');
          setSuccess('🎉 Telegram connected successfully!');
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [showTelegramDialog, telegramConnectLink]);

  const checkTelegramStatusSilent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.connected) {
        setSecurity(prev => ({ 
          ...prev, 
          telegramConnected: true, 
          telegramChatId: data.chatId || '',
        }));
        setNotifications(prev => ({ ...prev, telegramAlerts: data.alertsEnabled ?? true }));
      }
    } catch (err) {
      // Silent fail
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          username: data.username || '',
          phone: data.phone || '',
          bio: data.bio || '',
          country: data.country || '',
          dateOfBirth: data.dateOfBirth || '',
          avatarUrl: data.avatarUrl || '',
        });
        
        setSecurity(prev => ({
          ...prev,
          twoFactorEnabled: data.twoFaEnabled === true,
          lastPasswordChange: data.lastPasswordChange || '',
        }));
        
        if (data.settings) {
          setNotifications(prev => ({ ...prev, ...data.settings }));
          if (data.settings.tradingPrefs) {
            setTradingPrefs(prev => ({ ...prev, ...data.settings.tradingPrefs }));
          }
          if (data.settings.appearance) {
            setAppearance(prev => ({ ...prev, ...data.settings.appearance }));
          }
          if (data.settings.localization) {
            setLocalization(prev => ({ ...prev, ...data.settings.localization }));
          }
          if (data.settings.privacy) {
            setPrivacy(prev => ({ ...prev, ...data.settings.privacy }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sessions) {
          setSessions(data.sessions);
        }
      }
    } catch (err) {
      // Use mock data if API not available
      setSessions([
        { id: 1, device: 'Windows PC', browser: 'Chrome 120', location: 'New York, USA', ip: '192.168.1.xxx', lastActive: 'Active now', current: true },
        { id: 2, device: 'iPhone 15', browser: 'Safari Mobile', location: 'London, UK', ip: '10.0.0.xxx', lastActive: '2 hours ago', current: false },
      ]);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.fullName = profile.fullName;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (settingsType: string, data: object) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [settingsType]: data }),
      });

      if (response.ok) {
        setSuccess(`${settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} settings saved`);
      } else {
        setError(`Failed to save ${settingsType} settings`);
      }
    } catch (err) {
      setError(`Failed to save ${settingsType} settings`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurity(prev => ({ 
          ...prev, 
          twoFactorSecret: data.secret,
          twoFactorQrCode: data.qrCode 
        }));
        setShow2FADialog(true);
      } else {
        const errorData = await response.json();
        if (errorData.error?.includes('already enabled')) {
          setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        }
        setError(errorData.error || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: twoFACode }),
      });

      if (response.ok) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        setShow2FADialog(false);
        setTwoFACode('');
        setSuccess('Two-factor authentication enabled');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid 2FA code');
      }
    } catch (err) {
      setError('Failed to verify 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false, twoFactorSecret: '', twoFactorQrCode: '' }));
        setSuccess('Two-factor authentication disabled');
      } else {
        setError('Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTelegram = async () => {
    setTelegramLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/telegram/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTelegramConnectLink(data.connectLink);
        setShowTelegramDialog(true);
      } else {
        if (data.error === 'Telegram already connected') {
          setError('Telegram is already connected to your account');
        } else {
          setError(data.error || 'Failed to generate connection link');
        }
      }
    } catch (err) {
      setError('Failed to connect to Telegram');
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleCheckTelegramConnection = async (showError = true) => {
    setTelegramLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.connected) {
        setSecurity(prev => ({ 
          ...prev, 
          telegramConnected: true, 
          telegramChatId: data.chatId || '',
        }));
        setNotifications(prev => ({ ...prev, telegramAlerts: data.alertsEnabled ?? true }));
        setShowTelegramDialog(false);
        setTelegramConnectLink('');
        setSuccess('🎉 Telegram connected successfully!');
        return true;
      } else {
        if (showError) {
          setError('Not connected yet. Please click the link and start the bot.');
        }
        return false;
      }
    } catch (err) {
      if (showError) {
        setError('Failed to check connection status');
      }
      return false;
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/telegram/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSecurity(prev => ({ ...prev, telegramConnected: false, telegramChatId: '' }));
        setNotifications(prev => ({ ...prev, telegramAlerts: false }));
        setSuccess('Telegram disconnected');
      } else {
        setError('Failed to disconnect Telegram');
      }
    } catch (err) {
      setError('Failed to disconnect Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: number) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    setSuccess('Session logged out');
  };

  const handleLogoutAllSessions = async () => {
    setSessions(sessions.filter(s => s.current));
    setSuccess('All other sessions logged out');
  };

  const handleExportData = async () => {
    setSuccess('Data export started. You will receive an email with download link.');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === 'DELETE') {
      localStorage.clear();
      setShowDeleteDialog(false);
      router.push('/');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  if (pageLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="text" width={300} height={24} sx={{ mb: 4 }} />
        <Skeleton variant="rounded" height={500} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={24} color="white" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account, preferences, and security settings
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      </Collapse>

      <Collapse in={!!success}>
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Collapse>

      {/* Main Content */}
      <Paper 
        sx={{ 
          width: '100%',
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            px: 2,
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab icon={<User size={18} />} label="Profile" iconPosition="start" />
          <Tab icon={<TrendingUp size={18} />} label="Trading" iconPosition="start" />
          <Tab icon={<Shield size={18} />} label="Security" iconPosition="start" />
          <Tab icon={<Bell size={18} />} label="Notifications" iconPosition="start" />
          <Tab icon={<Palette size={18} />} label="Appearance" iconPosition="start" />
          <Tab icon={<Globe size={18} />} label="Localization" iconPosition="start" />
          <Tab icon={<Lock size={18} />} label="Privacy" iconPosition="start" />
          <Tab icon={<Monitor size={18} />} label="Sessions" iconPosition="start" />
          <Tab icon={<AlertTriangle size={18} />} label="Danger Zone" iconPosition="start" sx={{ color: 'error.main' }} />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                mb: 4,
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    onClick={() => setShowAvatarDialog(true)}
                    sx={{ bgcolor: 'primary.main', color: 'white', width: 32, height: 32 }}
                  >
                    <Camera size={16} />
                  </IconButton>
                }
              >
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    fontSize: '2.5rem',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                  src={profile.avatarUrl}
                >
                  {profile.fullName?.charAt(0) || profile.username?.charAt(0) || 'U'}
                </Avatar>
              </Badge>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={700}>{profile.fullName || profile.username}</Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>{profile.email}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<User size={14} />} label={`@${profile.username}`} size="small" />
                  {profile.country && <Chip icon={<MapPin size={14} />} label={profile.country} size="small" />}
                </Box>
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={20} /> Personal Information
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Full Name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Username" value={profile.username} disabled helperText="Username cannot be changed" InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email Address" type="email" value={profile.email} disabled helperText="Contact support to change email" InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone Number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 234 567 8900" InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} placeholder="e.g., United States" InputProps={{ startAdornment: <InputAdornment position="start"><MapPin size={18} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Date of Birth" type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Bio" multiline rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." helperText={`${profile.bio.length}/500 characters`} inputProps={{ maxLength: 500 }} />
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={20} /> Timezone
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select value={tradingPrefs.timezone} label="Timezone" onChange={(e) => setTradingPrefs({ ...tradingPrefs, timezone: e.target.value })}>
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{tz.label}</span>
                          <Typography variant="caption" color="text.secondary">{tz.offset}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={handleUpdateProfile} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>

        {/* Trading Preferences Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <SettingCard icon={<Target size={24} color="white" />} title="Risk Management" description="Configure your default trading risk parameters" expandable defaultExpanded>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom fontWeight={500}>Default Risk Per Trade: <Chip label={`${tradingPrefs.defaultRiskPercent}%`} size="small" color={tradingPrefs.defaultRiskPercent > 5 ? 'error' : 'primary'} /></Typography>
                  <Slider value={tradingPrefs.defaultRiskPercent} onChange={(_, value) => setTradingPrefs({ ...tradingPrefs, defaultRiskPercent: value as number })} min={0.5} max={10} step={0.5} marks={[{ value: 1, label: '1%' }, { value: 5, label: '5%' }, { value: 10, label: '10%' }]} valueLabelDisplay="auto" sx={{ color: tradingPrefs.defaultRiskPercent > 5 ? 'error.main' : 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary">💡 Recommended: 1-2% for conservative trading</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom fontWeight={500}>Max Daily Loss: <Chip label={`${tradingPrefs.maxDailyLossPercent}%`} size="small" color={tradingPrefs.maxDailyLossPercent > 10 ? 'error' : 'warning'} /></Typography>
                  <Slider value={tradingPrefs.maxDailyLossPercent} onChange={(_, value) => setTradingPrefs({ ...tradingPrefs, maxDailyLossPercent: value as number })} min={1} max={20} step={1} marks={[{ value: 5, label: '5%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }]} valueLabelDisplay="auto" sx={{ color: tradingPrefs.maxDailyLossPercent > 10 ? 'error.main' : 'warning.main' }} />
                  <Typography variant="caption" color="text.secondary">⚠️ Trading stops when daily loss reaches this limit</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Max Daily Trades" value={tradingPrefs.maxDailyTrades} onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxDailyTrades: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 1, max: 100 }, startAdornment: <InputAdornment position="start"><BarChart3 size={18} /></InputAdornment> }} helperText="1-100 trades per day" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Max Lot Size" value={tradingPrefs.maxLotSize} onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxLotSize: parseFloat(e.target.value) || 0.01 })} InputProps={{ inputProps: { min: 0.01, max: 10, step: 0.01 } }} helperText="Maximum lot size per trade" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Default Lot Size" value={tradingPrefs.defaultLotSize} onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultLotSize: parseFloat(e.target.value) || 0.01 })} InputProps={{ inputProps: { min: 0.01, max: 10, step: 0.01 } }} helperText="Default lot size for new trades" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Max Open Trades" value={tradingPrefs.maxOpenTrades} onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxOpenTrades: parseInt(e.target.value) || 1 })} InputProps={{ inputProps: { min: 1, max: 50 } }} helperText="Maximum concurrent positions" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Default Take Profit (pips)" value={tradingPrefs.defaultTakeProfit} onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultTakeProfit: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 0, max: 1000 } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="number" label="Default Stop Loss (pips)" value={tradingPrefs.defaultStopLoss} onChange={(e) => setTradingPrefs({ ...tradingPrefs, defaultStopLoss: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 0, max: 500 } }} />
                </Grid>
              </Grid>
            </SettingCard>

            <SettingCard icon={<Clock size={24} color="white" />} title="Trading Hours" description="Set when the bot is allowed to open new trades" expandable>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="time" label="Start Time" value={tradingPrefs.tradingHoursStart} onChange={(e) => setTradingPrefs({ ...tradingPrefs, tradingHoursStart: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="time" label="End Time" value={tradingPrefs.tradingHoursEnd} onChange={(e) => setTradingPrefs({ ...tradingPrefs, tradingHoursEnd: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select value={tradingPrefs.timezone} label="Timezone" onChange={(e) => setTradingPrefs({ ...tradingPrefs, timezone: e.target.value })}>
                      {TIMEZONES.map((tz) => (<MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <FormControlLabel control={<Switch checked={tradingPrefs.weekendTrading} onChange={(e) => setTradingPrefs({ ...tradingPrefs, weekendTrading: e.target.checked })} />} label="Allow Weekend Trading" />
              </Box>
            </SettingCard>

            <SettingCard icon={<AlertCircle size={24} color="white" />} title="News Filter" description="Automatically pause trading during high-impact news events" action={<Switch checked={tradingPrefs.newsFilterEnabled} onChange={(e) => setTradingPrefs({ ...tradingPrefs, newsFilterEnabled: e.target.checked })} />}>
              {tradingPrefs.newsFilterEnabled && (
                <TextField type="number" label="Minutes Before/After News" value={tradingPrefs.newsFilterMinutes} onChange={(e) => setTradingPrefs({ ...tradingPrefs, newsFilterMinutes: parseInt(e.target.value) || 15 })} InputProps={{ inputProps: { min: 5, max: 120 } }} helperText="Pause trading this many minutes before and after news" sx={{ maxWidth: 300 }} />
              )}
            </SettingCard>

            <SettingCard icon={<Zap size={24} color="white" />} title="Advanced Features" description="Trailing stops, break-even, and partial closes" expandable>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel control={<Switch checked={tradingPrefs.trailingStopEnabled} onChange={(e) => setTradingPrefs({ ...tradingPrefs, trailingStopEnabled: e.target.checked })} />} label="Enable Trailing Stop" />
                  {tradingPrefs.trailingStopEnabled && (
                    <TextField fullWidth type="number" label="Trailing Stop (pips)" value={tradingPrefs.trailingStopPips} onChange={(e) => setTradingPrefs({ ...tradingPrefs, trailingStopPips: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 5, max: 100 } }} sx={{ mt: 2 }} />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel control={<Switch checked={tradingPrefs.breakEvenEnabled} onChange={(e) => setTradingPrefs({ ...tradingPrefs, breakEvenEnabled: e.target.checked })} />} label="Enable Break-Even" />
                  {tradingPrefs.breakEvenEnabled && (
                    <TextField fullWidth type="number" label="Move to Break-Even at (pips)" value={tradingPrefs.breakEvenPips} onChange={(e) => setTradingPrefs({ ...tradingPrefs, breakEvenPips: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 5, max: 100 } }} sx={{ mt: 2 }} />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel control={<Switch checked={tradingPrefs.partialCloseEnabled} onChange={(e) => setTradingPrefs({ ...tradingPrefs, partialCloseEnabled: e.target.checked })} />} label="Enable Partial Close" />
                  {tradingPrefs.partialCloseEnabled && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Close % of Position" value={tradingPrefs.partialClosePercent} onChange={(e) => setTradingPrefs({ ...tradingPrefs, partialClosePercent: parseInt(e.target.value) || 50 })} InputProps={{ inputProps: { min: 10, max: 90 } }} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth type="number" label="At Profit (pips)" value={tradingPrefs.partialClosePips} onChange={(e) => setTradingPrefs({ ...tradingPrefs, partialClosePips: parseInt(e.target.value) || 0 })} InputProps={{ inputProps: { min: 5, max: 200 } }} />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </SettingCard>

            <SettingCard icon={<Shield size={24} color="white" />} title="Safety Features" description="Automatic protections to safeguard your account">
              <FormControlLabel control={<Switch checked={tradingPrefs.autoStopOnDailyLoss} onChange={(e) => setTradingPrefs({ ...tradingPrefs, autoStopOnDailyLoss: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Auto-Stop on Daily Loss Limit</Typography><Typography variant="body2" color="text.secondary">Automatically pause all trading when daily loss limit is reached</Typography></Box>} />
            </SettingCard>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={() => handleUpdateSettings('tradingPrefs', tradingPrefs)} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Trading Preferences'}
            </Button>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Card sx={{ mb: 4, p: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)` }}>
              <SecurityMeter level={securityScore} />
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {!security.twoFactorEnabled && <Chip icon={<AlertCircle size={14} />} label="Enable 2FA for +30% security" size="small" color="warning" />}
                {!security.telegramConnected && <Chip icon={<Send size={14} />} label="Connect Telegram for +15% security" size="small" />}
              </Box>
            </Card>

            <SettingCard icon={<Lock size={24} color="white" />} title="Password" description="Change your account password" status={security.lastPasswordChange ? 'enabled' : 'warning'} expandable defaultExpanded>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type={showPassword ? 'text' : 'password'} label="Current Password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</IconButton></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} md={6} />
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type={showNewPassword ? 'text' : 'password'} label="New Password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}</IconButton></InputAdornment> }} />
                  {passwords.newPassword && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={passwordStrength} sx={{ height: 4, borderRadius: 2, bgcolor: alpha(passwordStrength > 60 ? theme.palette.success.main : theme.palette.warning.main, 0.2), '& .MuiLinearProgress-bar': { bgcolor: passwordStrength > 60 ? 'success.main' : passwordStrength > 30 ? 'warning.main' : 'error.main' } }} />
                      <Typography variant="caption" color="text.secondary">Password strength: {passwordStrength > 60 ? 'Strong' : passwordStrength > 30 ? 'Medium' : 'Weak'}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type="password" label="Confirm New Password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} error={passwords.confirmPassword !== '' && passwords.newPassword !== passwords.confirmPassword} helperText={passwords.confirmPassword !== '' && passwords.newPassword !== passwords.confirmPassword ? 'Passwords do not match' : ''} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" startIcon={<Lock size={18} />} onClick={handleChangePassword} disabled={loading || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}>Change Password</Button>
              </Box>
            </SettingCard>

            <SettingCard icon={<Key size={24} color="white" />} title="Two-Factor Authentication (2FA)" description="Add an extra layer of security with authenticator app" status={security.twoFactorEnabled ? 'enabled' : 'disabled'} action={security.twoFactorEnabled ? <Button variant="outlined" color="error" size="small" onClick={handleDisable2FA}>Disable</Button> : <Button variant="contained" size="small" startIcon={<QrCode size={16} />} onClick={handleEnable2FA}>Enable</Button>} />

            <SettingCard icon={<Send size={24} color="white" />} title="Telegram Integration" description="Connect Telegram for instant notifications" status={security.telegramConnected ? 'enabled' : 'disabled'} action={security.telegramConnected ? <Button variant="outlined" color="error" size="small" onClick={handleDisconnectTelegram}>Disconnect</Button> : <Button variant="contained" size="small" startIcon={<Send size={16} />} onClick={handleConnectTelegram} disabled={telegramLoading} sx={{ bgcolor: '#0088cc', '&:hover': { bgcolor: '#006699' } }}>{telegramLoading ? <CircularProgress size={16} /> : 'Connect'}</Button>}>
              {security.telegramConnected && <Typography variant="body2" color="text.secondary">Connected to Chat ID: <code>{security.telegramChatId}</code></Typography>}
            </SettingCard>

            <SettingCard icon={<Bell size={24} color="white" />} title="Login Notifications" description="Get notified when someone logs into your account" action={<Switch checked={security.loginNotifications} onChange={(e) => setSecurity({ ...security, loginNotifications: e.target.checked })} />} />
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <SettingCard icon={<Mail size={24} color="white" />} title="Email Notifications" description="Configure which emails you receive" expandable defaultExpanded>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { key: 'emailNotifications', label: 'Account Updates', desc: 'Important account-related notifications' },
                  { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'When trades are opened or closed' },
                  { key: 'priceAlerts', label: 'Price Alerts', desc: 'When price targets are reached' },
                  { key: 'securityAlerts', label: 'Security Alerts', desc: 'Login attempts and security events' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Weekly trading performance summary' },
                  { key: 'monthlyReports', label: 'Monthly Reports', desc: 'Monthly trading performance summary' },
                  { key: 'marketNews', label: 'Market News', desc: 'Market news and analysis' },
                  { key: 'newsletterEmails', label: 'Newsletter', desc: 'Tips, updates, and educational content' },
                  { key: 'promotionalEmails', label: 'Promotional', desc: 'Special offers and promotions' },
                ].map((item) => (
                  <FormControlLabel key={item.key} control={<Switch checked={notifications[item.key as keyof typeof notifications] as boolean} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />} label={<Box><Typography fontWeight={500}>{item.label}</Typography><Typography variant="body2" color="text.secondary">{item.desc}</Typography></Box>} />
                ))}
              </Box>
            </SettingCard>

            <SettingCard icon={<BellRing size={24} color="white" />} title="Push Notifications" description="Browser and mobile push notifications" action={<Switch checked={notifications.pushNotifications} onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })} />}>
              {notifications.pushNotifications && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel control={<Switch checked={notifications.pushTradeAlerts} onChange={(e) => setNotifications({ ...notifications, pushTradeAlerts: e.target.checked })} />} label="Trade Alerts" />
                  <FormControlLabel control={<Switch checked={notifications.pushPriceAlerts} onChange={(e) => setNotifications({ ...notifications, pushPriceAlerts: e.target.checked })} />} label="Price Alerts" />
                </Box>
              )}
            </SettingCard>

            {security.telegramConnected && (
              <SettingCard icon={<Send size={24} color="white" />} title="Telegram Notifications" description="Configure Telegram alert preferences" action={<Switch checked={notifications.telegramAlerts} onChange={(e) => setNotifications({ ...notifications, telegramAlerts: e.target.checked })} />}>
                {notifications.telegramAlerts && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel control={<Switch checked={notifications.telegramTradeAlerts} onChange={(e) => setNotifications({ ...notifications, telegramTradeAlerts: e.target.checked })} />} label="Trade Alerts" />
                    <FormControlLabel control={<Switch checked={notifications.telegramPriceAlerts} onChange={(e) => setNotifications({ ...notifications, telegramPriceAlerts: e.target.checked })} />} label="Price Alerts" />
                    <FormControlLabel control={<Switch checked={notifications.telegramDailyDigest} onChange={(e) => setNotifications({ ...notifications, telegramDailyDigest: e.target.checked })} />} label="Daily Digest" />
                  </Box>
                )}
              </SettingCard>
            )}

            <SettingCard icon={notifications.soundEnabled ? <Volume2 size={24} color="white" /> : <VolumeX size={24} color="white" />} title="Sound Notifications" description="Play sounds for important alerts" action={<Switch checked={notifications.soundEnabled} onChange={(e) => setNotifications({ ...notifications, soundEnabled: e.target.checked })} />}>
              {notifications.soundEnabled && (
                <Box sx={{ maxWidth: 300 }}>
                  <Typography gutterBottom>Volume: {notifications.soundVolume}%</Typography>
                  <Slider value={notifications.soundVolume} onChange={(_, value) => setNotifications({ ...notifications, soundVolume: value as number })} min={0} max={100} step={10} />
                </Box>
              )}
            </SettingCard>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={() => handleUpdateSettings('notifications', notifications)} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Notification Settings'}
            </Button>
          </Box>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <SettingCard icon={appearance.theme === 'dark' ? <Moon size={24} color="white" /> : <Sun size={24} color="white" />} title="Theme" description="Choose your preferred color scheme">
              <ToggleButtonGroup value={appearance.theme} exclusive onChange={(_, value) => value && setAppearance({ ...appearance, theme: value })} sx={{ mb: 2 }}>
                <ToggleButton value="light" sx={{ px: 3 }}><Sun size={18} style={{ marginRight: 8 }} /> Light</ToggleButton>
                <ToggleButton value="dark" sx={{ px: 3 }}><Moon size={18} style={{ marginRight: 8 }} /> Dark</ToggleButton>
                <ToggleButton value="system" sx={{ px: 3 }}><Laptop size={18} style={{ marginRight: 8 }} /> System</ToggleButton>
              </ToggleButtonGroup>
            </SettingCard>

            <SettingCard icon={<Monitor size={24} color="white" />} title="Display Options" description="Customize how information is displayed" expandable defaultExpanded>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel control={<Switch checked={appearance.compactMode} onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Compact Mode</Typography><Typography variant="body2" color="text.secondary">Reduce spacing for more content</Typography></Box>} />
                <FormControlLabel control={<Switch checked={appearance.showProfitInPips} onChange={(e) => setAppearance({ ...appearance, showProfitInPips: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Show Profit in Pips</Typography><Typography variant="body2" color="text.secondary">Display profit/loss in pips instead of currency</Typography></Box>} />
                <FormControlLabel control={<Switch checked={appearance.showPercentageGain} onChange={(e) => setAppearance({ ...appearance, showPercentageGain: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Show Percentage Gain</Typography><Typography variant="body2" color="text.secondary">Display percentage alongside currency amounts</Typography></Box>} />
                <FormControlLabel control={<Switch checked={appearance.animationsEnabled} onChange={(e) => setAppearance({ ...appearance, animationsEnabled: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Enable Animations</Typography><Typography variant="body2" color="text.secondary">Smooth transitions and effects</Typography></Box>} />
              </Box>
            </SettingCard>

            <SettingCard icon={<BarChart3 size={24} color="white" />} title="Chart Defaults" description="Default chart settings">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Default Timeframe</InputLabel>
                <Select value={appearance.chartDefaultTimeframe} label="Default Timeframe" onChange={(e) => setAppearance({ ...appearance, chartDefaultTimeframe: e.target.value })}>
                  <MenuItem value="1M">1 Minute</MenuItem>
                  <MenuItem value="5M">5 Minutes</MenuItem>
                  <MenuItem value="15M">15 Minutes</MenuItem>
                  <MenuItem value="30M">30 Minutes</MenuItem>
                  <MenuItem value="1H">1 Hour</MenuItem>
                  <MenuItem value="4H">4 Hours</MenuItem>
                  <MenuItem value="1D">1 Day</MenuItem>
                </Select>
              </FormControl>
            </SettingCard>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={() => handleUpdateSettings('appearance', appearance)} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Appearance Settings'}
            </Button>
          </Box>
        </TabPanel>

        {/* Localization Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <SettingCard icon={<Languages size={24} color="white" />} title="Language" description="Choose your preferred language">
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Language</InputLabel>
                <Select value={localization.language} label="Language" onChange={(e) => setLocalization({ ...localization, language: e.target.value })}>
                  {LANGUAGES.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '1.25rem' }}>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SettingCard>

            <SettingCard icon={<DollarSign size={24} color="white" />} title="Display Currency" description="Currency for displaying values">
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Currency</InputLabel>
                <Select value={localization.currency} label="Currency" onChange={(e) => setLocalization({ ...localization, currency: e.target.value })}>
                  {CURRENCIES.map((curr) => (
                    <MenuItem key={curr.code} value={curr.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography fontWeight={600} sx={{ minWidth: 30 }}>{curr.symbol}</Typography>
                        <span>{curr.name} ({curr.code})</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SettingCard>

            <SettingCard icon={<Calendar size={24} color="white" />} title="Date & Time Format" description="How dates and times are displayed">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select value={localization.dateFormat} label="Date Format" onChange={(e) => setLocalization({ ...localization, dateFormat: e.target.value })}>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (01/25/2026)</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (25/01/2026)</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-25)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select value={localization.timeFormat} label="Time Format" onChange={(e) => setLocalization({ ...localization, timeFormat: e.target.value })}>
                      <MenuItem value="12h">12-hour (2:30 PM)</MenuItem>
                      <MenuItem value="24h">24-hour (14:30)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </SettingCard>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={() => handleUpdateSettings('localization', localization)} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Localization Settings'}
            </Button>
          </Box>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <SettingCard icon={<Eye size={24} color="white" />} title="Profile Visibility" description="Control who can see your profile">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel control={<Switch checked={privacy.profilePublic} onChange={(e) => setPrivacy({ ...privacy, profilePublic: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Public Profile</Typography><Typography variant="body2" color="text.secondary">Allow others to view your profile</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.showOnLeaderboard} onChange={(e) => setPrivacy({ ...privacy, showOnLeaderboard: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Show on Leaderboard</Typography><Typography variant="body2" color="text.secondary">Appear in public trading leaderboards</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.shareTradeHistory} onChange={(e) => setPrivacy({ ...privacy, shareTradeHistory: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Share Trade History</Typography><Typography variant="body2" color="text.secondary">Allow verified users to see your trade history</Typography></Box>} />
              </Box>
            </SettingCard>

            <SettingCard icon={<Database size={24} color="white" />} title="Data & Analytics" description="Control how your data is used">
              <FormControlLabel control={<Switch checked={privacy.allowDataAnalytics} onChange={(e) => setPrivacy({ ...privacy, allowDataAnalytics: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Allow Analytics</Typography><Typography variant="body2" color="text.secondary">Help us improve by sharing anonymous usage data</Typography></Box>} />
            </SettingCard>

            <SettingCard icon={<Shield size={24} color="white" />} title="Trading Safety" description="Extra confirmations for trading actions">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel control={<Switch checked={privacy.hideBalance} onChange={(e) => setPrivacy({ ...privacy, hideBalance: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Hide Balance</Typography><Typography variant="body2" color="text.secondary">Hide balance from dashboard (click to reveal)</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.twoClickTrade} onChange={(e) => setPrivacy({ ...privacy, twoClickTrade: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Two-Click Trading</Typography><Typography variant="body2" color="text.secondary">Require confirmation before placing trades</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.confirmBeforeClose} onChange={(e) => setPrivacy({ ...privacy, confirmBeforeClose: e.target.checked })} />} label={<Box><Typography fontWeight={500}>Confirm Before Close</Typography><Typography variant="body2" color="text.secondary">Ask for confirmation before closing trades</Typography></Box>} />
              </Box>
            </SettingCard>

            <SettingCard icon={<Clock size={24} color="white" />} title="Session Timeout" description="Auto-logout after inactivity">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Timeout</InputLabel>
                <Select value={privacy.sessionTimeout} label="Timeout" onChange={(e) => setPrivacy({ ...privacy, sessionTimeout: e.target.value as number })}>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                  <MenuItem value={0}>Never</MenuItem>
                </Select>
              </FormControl>
            </SettingCard>

            <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={() => handleUpdateSettings('privacy', privacy)} disabled={loading} sx={{ px: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
              {loading ? <CircularProgress size={20} /> : 'Save Privacy Settings'}
            </Button>
          </Box>
        </TabPanel>

        {/* Sessions Tab */}
        <TabPanel value={tabValue} index={7}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>Active Sessions</Typography>
                <Typography color="text.secondary">Manage devices where you are currently logged in</Typography>
              </Box>
              <Button variant="outlined" color="error" size="small" startIcon={<LogOut size={16} />} onClick={handleLogoutAllSessions} disabled={sessions.filter(s => !s.current).length === 0}>Logout All Others</Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sessions.map((session) => (
                <Card key={session.id} sx={{ bgcolor: session.current ? alpha(theme.palette.primary.main, 0.1) : 'background.paper', border: '1px solid', borderColor: session.current ? 'primary.main' : 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: session.current ? 'primary.main' : 'grey.700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Monitor size={24} color="white" />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={600}>{session.device}</Typography>
                            {session.current && <Chip label="Current" size="small" color="primary" />}
                          </Box>
                          <Typography variant="body2" color="text.secondary">{session.browser} • {session.location}</Typography>
                          <Typography variant="caption" color={session.current ? 'success.main' : 'text.secondary'}>{session.lastActive} • IP: {session.ip}</Typography>
                        </Box>
                      </Box>
                      {!session.current && (
                        <Button variant="outlined" color="error" size="small" startIcon={<LogOut size={16} />} onClick={() => handleLogoutSession(session.id)}>Logout</Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {sessions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Monitor size={48} color={theme.palette.text.secondary} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>No active sessions found</Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Danger Zone Tab */}
        <TabPanel value={tabValue} index={8}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography fontWeight={600}>⚠️ Danger Zone</Typography>
              <Typography variant="body2">Actions in this section are permanent and cannot be undone. Please proceed with caution.</Typography>
            </Alert>

            <SettingCard icon={<Download size={24} color="white" />} title="Export Your Data" description="Download a copy of all your data including trades, settings, and account info" action={<Button variant="outlined" startIcon={<Download size={16} />} onClick={handleExportData}>Export Data</Button>} />

            <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: '2px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography fontWeight={600} color="error.main">Delete Account</Typography>
                      <Typography variant="body2" color="text.secondary">Permanently delete your account and all associated data. This action cannot be undone.</Typography>
                    </Box>
                  </Box>
                  <Button variant="contained" color="error" startIcon={<Trash2 size={16} />} onClick={() => setShowDeleteDialog(true)}>Delete Account</Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</Typography>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 220, height: 220, bgcolor: 'white', mx: 'auto', p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {security.twoFactorQrCode ? <img src={security.twoFactorQrCode} alt="2FA QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} /> : <CircularProgress />}
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Or enter this code manually:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TextField fullWidth value={security.twoFactorSecret} InputProps={{ readOnly: true }} size="small" sx={{ '& input': { fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 600 } }} />
            <IconButton onClick={() => copyToClipboard(security.twoFactorSecret)}><Copy size={18} /></IconButton>
          </Box>
          <TextField fullWidth label="Enter 6-digit code from app" placeholder="000000" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputProps={{ maxLength: 6 }} sx={{ '& input': { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 600 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShow2FADialog(false); setTwoFACode(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm2FA} disabled={twoFACode.length !== 6 || loading}>{loading ? <CircularProgress size={20} /> : 'Verify & Enable'}</Button>
        </DialogActions>
      </Dialog>

      {/* Telegram Connect Dialog */}
      <Dialog open={showTelegramDialog} onClose={() => { setShowTelegramDialog(false); setTelegramConnectLink(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Send size={24} color="#0088cc" />Connect Telegram</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Important:</strong> The connection link expires in 10 minutes. If it expires, click "Generate New Link" below.
            </Typography>
          </Alert>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Click the button below to open Telegram and connect your account:</Typography>
          <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>1</Avatar>
                <Typography fontWeight={600}>Open Telegram Bot</Typography>
              </Box>
              <Button fullWidth variant="contained" component="a" href={telegramConnectLink || '#'} target="_blank" rel="noopener noreferrer" startIcon={<Send size={18} />} disabled={!telegramConnectLink} sx={{ bgcolor: '#0088cc', '&:hover': { bgcolor: '#006699' }, py: 1.5 }}>Open @Algoedge_rs_bot in Telegram</Button>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>2</Avatar>
                <Typography fontWeight={600}>Press START in Telegram</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">After opening the bot, press the <b>START</b> button</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>3</Avatar>
                <Typography fontWeight={600}>Verify Connection</Typography>
              </Box>
              <Button fullWidth variant="outlined" onClick={() => handleCheckTelegramConnection(true)} disabled={telegramLoading} startIcon={telegramLoading ? <CircularProgress size={18} /> : <CheckCircle size={18} />}>{telegramLoading ? 'Checking...' : 'I Pressed START - Verify Now'}</Button>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button 
            variant="text" 
            onClick={async () => {
              setTelegramLoading(true);
              await handleConnectTelegram();
              setTelegramLoading(false);
            }} 
            disabled={telegramLoading}
            startIcon={<RefreshCw size={16} />}
          >
            Generate New Link
          </Button>
          <Button onClick={() => { setShowTelegramDialog(false); setTelegramConnectLink(''); }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>⚠️ Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            This action is <strong>permanent</strong> and cannot be undone. All your data including:
            <ul style={{ marginBottom: 0, marginTop: 8 }}>
              <li>Trade history and performance data</li>
              <li>MT5 connection settings</li>
              <li>Account preferences and settings</li>
              <li>Payment and billing history</li>
              <li>All purchased products and subscriptions</li>
            </ul>
            will be permanently deleted.
          </Alert>
          <Typography sx={{ mb: 2 }}>To confirm, type <strong>DELETE</strong> below:</Typography>
          <TextField fullWidth value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="Type DELETE to confirm" error={deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE'} helperText={deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE' ? 'Please type DELETE exactly' : ''} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE'}>Delete My Account Forever</Button>
        </DialogActions>
      </Dialog>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onClose={() => setShowAvatarDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 3, fontSize: '3rem' }} src={profile.avatarUrl}>{profile.fullName?.charAt(0) || 'U'}</Avatar>
            <Button variant="outlined" startIcon={<Upload size={18} />} component="label">Upload Photo<input type="file" hidden accept="image/*" /></Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Max 2MB, JPG or PNG</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAvatarDialog(false)}>Cancel</Button>
          <Button variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
