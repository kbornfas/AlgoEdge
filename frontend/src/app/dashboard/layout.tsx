'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
  Tooltip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LayoutDashboard,
  TrendingUp,
  Settings,
  History,
  PlayCircle,
  User,
  LogOut,
  BarChart3,
  Users,
  Zap,
  Store,
  Wallet,
  ShoppingBag,
  Lock,
  Crown,
  ChevronRight,
  Sparkles,
  Bell,
  Shield,
  BookOpen,
  MessageSquare,
  Newspaper,
  Target,
  Award,
  Gift,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import SubscriptionGuard from '@/components/SubscriptionGuard';

const drawerWidth = 280;

// Menu categories for better organization
const menuCategories = [
  {
    title: 'Trading',
    items: [
      { text: 'Overview', icon: LayoutDashboard, href: '/dashboard', requiresSubscription: false },
      { text: 'Trading Signals', icon: Zap, href: '/dashboard/signals', requiresSubscription: true },
      { text: 'Trading Robots', icon: PlayCircle, href: '/dashboard/robots', requiresSubscription: true },
      { text: 'Copy Trading', icon: Target, href: '/dashboard/copy-trading', requiresSubscription: true },
      { text: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', requiresSubscription: true },
      { text: 'Trade History', icon: History, href: '/dashboard/history', requiresSubscription: true },
      { text: 'MT5 Connection', icon: TrendingUp, href: '/dashboard/mt5', requiresSubscription: true },
    ],
  },
  {
    title: 'Finance',
    items: [
      { text: 'Wallet', icon: Wallet, href: '/dashboard/wallet', requiresSubscription: false },
      { text: 'My Purchases', icon: ShoppingBag, href: '/dashboard/purchases', requiresSubscription: false },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { text: 'Browse Products', icon: Store, href: '/marketplace', requiresSubscription: false },
      { text: 'Seller Dashboard', icon: BarChart3, href: '/dashboard/seller', requiresSubscription: false },
      { text: 'Seller Earnings', icon: Wallet, href: '/dashboard/seller-wallet', requiresSubscription: false },
    ],
  },
  {
    title: 'Resources',
    items: [
      { text: 'Learning Hub', icon: BookOpen, href: '/dashboard/learning-hub', requiresSubscription: true },
      { text: 'Market News', icon: Newspaper, href: '/dashboard/news', requiresSubscription: true },
      { text: 'Community', icon: MessageSquare, href: '/dashboard/community', requiresSubscription: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { text: 'Affiliate Program', icon: Users, href: '/dashboard/affiliate', requiresSubscription: false },
      { text: 'Notifications', icon: Bell, href: '/dashboard/notifications', requiresSubscription: false },
      { text: 'Settings', icon: Settings, href: '/dashboard/settings', requiresSubscription: false },
      { text: 'Help & Support', icon: HelpCircle, href: '/dashboard/support', requiresSubscription: false },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const pathname = usePathname();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsSubscribed(false);
          setSubscriptionLoading(false);
          return;
        }

        const response = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isActive || data.status === 'active');
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, []);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${API_URL}/api/wallet/balance`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.wallet?.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchWalletBalance();
    // Refresh balance every 15 seconds to catch updates after admin approval
    const interval = setInterval(fetchWalletBalance, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleMenuItemClick = (item: any, e: React.MouseEvent) => {
    if (item.requiresSubscription && !isSubscribed && !subscriptionLoading) {
      e.preventDefault();
      setLockedFeature(item.text);
      setShowSubscriptionModal(true);
    }
    if (isMobile) setMobileOpen(false);
  };

  const drawer = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      {/* Logo Section */}
      <Box 
        sx={{ 
          px: 3, 
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 102, 255, 0.4)',
          }}
        >
          <Box
            component="img"
            src="/images/logo.png"
            alt="AlgoEdge"
            sx={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </Box>
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            AlgoEdge
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Trading Platform
          </Typography>
        </Box>
      </Box>
      
      {/* Subscription Status */}
      {!subscriptionLoading && (
        <Box sx={{ px: 2, py: 2 }}>
          {isSubscribed ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Crown size={16} color="#22C55E" />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#22C55E' }}>
                  Premium Member
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Full access to all features
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                border: '1px solid rgba(0, 102, 255, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Sparkles size={16} color="#0066FF" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Free Plan
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/auth/pricing"
                variant="contained"
                size="small"
                fullWidth
                endIcon={<ChevronRight size={16} />}
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  py: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(0, 102, 255, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0052CC 0%, #00B8D9 100%)',
                    boxShadow: '0 6px 20px rgba(0, 102, 255, 0.5)',
                  },
                }}
              >
                Upgrade to Premium
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {menuCategories.map((category) => (
          <Box key={category.title} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{
                px: 1.5,
                py: 1,
                display: 'block',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              {category.title}
            </Typography>
            <List disablePadding>
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                const isLocked = item.requiresSubscription && !isSubscribed && !subscriptionLoading;
                
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <Tooltip 
                      title={isLocked ? "Upgrade to Premium to access" : ""}
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        component={Link}
                        href={isLocked ? '/auth/pricing' : item.href}
                        selected={isActive}
                        onClick={(e) => handleMenuItemClick(item, e)}
                        sx={{
                          borderRadius: 2,
                          mx: 0.5,
                          py: 1.2,
                          opacity: isLocked ? 0.5 : 1,
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          '&::before': isActive ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 4,
                            height: '60%',
                            borderRadius: '0 4px 4px 0',
                            background: 'linear-gradient(180deg, #0066FF 0%, #00D4FF 100%)',
                          } : {},
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.18),
                            },
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon 
                          sx={{ 
                            minWidth: 40,
                            color: isActive ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          <Icon size={20} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'primary.main' : 'text.primary',
                          }}
                        />
                        {isLocked && (
                          <Lock size={14} style={{ color: theme.palette.text.secondary }} />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Section at Bottom */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {user?.email}
            </Typography>
          </Box>
          <ChevronRight size={16} style={{ color: theme.palette.text.secondary }} />
        </Box>
      </Box>
    </Box>
  );
  if (!user) {
    return null;
  }

  return (
    <SubscriptionGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Top AppBar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            ml: { lg: `${drawerWidth}px` },
            bgcolor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
          <Toolbar sx={{ px: { xs: 2, lg: 3 } }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { lg: 'none' },
                color: 'text.primary',
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary',
                  letterSpacing: '-0.3px',
                }}
              >
                {menuCategories.flatMap(c => c.items).find(item => 
                  item.href === pathname || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                )?.text || 'Dashboard'}
              </Typography>
            </Box>

            {/* Wallet Balance Box */}
            <Tooltip title="Go to Wallet" arrow>
              <Box
                component={Link}
                href="/dashboard/wallet"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  mr: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.2),
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    borderColor: alpha(theme.palette.success.main, 0.4),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Wallet size={18} color={theme.palette.success.main} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: theme.palette.success.main,
                    fontFamily: 'monospace',
                  }}
                >
                  ${walletBalance !== null ? walletBalance.toFixed(2) : '---'}
                </Typography>
              </Box>
            </Tooltip>

            <ThemeToggle />

            <IconButton 
              onClick={handleProfileMenuOpen} 
              sx={{ 
                ml: 1.5,
                display: { lg: 'none' },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
                  fontWeight: 600,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem 
                component={Link} 
                href="/dashboard/settings" 
                onClick={handleProfileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <User size={18} />
                </ListItemIcon>
                <Typography variant="body2">Profile Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                <ListItemIcon>
                  <LogOut size={18} color="currentColor" />
                </ListItemIcon>
                <Typography variant="body2">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Box
          component="nav"
          sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
        >
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: 'none',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '4px 0 24px rgba(0,0,0,0.3)'
                  : '4px 0 24px rgba(0,0,0,0.05)',
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            pt: { xs: 8, sm: 9 },
            pb: 4,
            px: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          {children}
        </Box>

        {/* Subscription Required Modal */}
        <Dialog
          open={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxWidth: 440,
              mx: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
              backgroundImage: 'none',
            },
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 212, 255, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Lock size={32} color="#0066FF" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Premium Feature
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', px: 4, pb: 2 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              <strong style={{ color: theme.palette.primary.main }}>{lockedFeature}</strong> is a premium feature.
              Upgrade your subscription to unlock all trading tools, signals, robots, and analytics.
            </Typography>
            <Stack spacing={1.5} sx={{ textAlign: 'left', mb: 2 }}>
              {[
                'Real-time trading signals',
                'Automated trading robots',
                'Advanced analytics & insights',
                'Copy trading features',
                'Learning resources & community',
                'Priority support',
              ].map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: 'rgba(34, 197, 94, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Crown size={12} color="#22C55E" />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {feature}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, flexDirection: 'column', gap: 1.5 }}>
            <Button
              component={Link}
              href="/auth/pricing"
              variant="contained"
              fullWidth
              size="large"
              endIcon={<ChevronRight size={18} />}
              sx={{
                background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
                fontWeight: 700,
                py: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0052CC 0%, #00B8D9 100%)',
                  boxShadow: '0 6px 20px rgba(0, 102, 255, 0.5)',
                },
              }}
            >
              View Premium Plans
            </Button>
            <Button
              onClick={() => setShowSubscriptionModal(false)}
              fullWidth
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              }}
            >
              Maybe Later
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SubscriptionGuard>
  );
}
