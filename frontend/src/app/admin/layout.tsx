'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  Store,
  Signal,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  TrendingUp,
  Bot,
  Package,
  UserCog,
  CreditCard,
  FileText,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import Link from 'next/link';

// Twitter-style verified badge SVG component
const VerifiedBadgeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path 
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" 
      fill="#1D9BF0"
    />
  </svg>
);

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED_WIDTH = 80;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const userData = localStorage.getItem('adminUser') || localStorage.getItem('user');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    if (userData) {
      const user = JSON.parse(userData);
      setAdminUser(user);
      
      // Check if user is admin
      if (!user.is_admin) {
        router.push('/dashboard');
        return;
      }
    }

    // Fetch notifications count
    fetchNotifications();
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/pending-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.pendingVerifications?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={22} />, href: '/admin/dashboard' },
    { label: 'Users', icon: <Users size={22} />, href: '/admin/users', badge: 0 },
    { label: 'Marketplace', icon: <Store size={22} />, href: '/admin/marketplace', badge: notifications },
    { label: 'Wallets', icon: <Wallet size={22} />, href: '/admin/wallets' },
    { label: 'Withdrawals', icon: <CreditCard size={22} />, href: '/admin/withdrawals' },
    { label: 'Deposits', icon: <CreditCard size={22} />, href: '/admin/deposits' },
    { label: 'Payment Accounts', icon: <Wallet size={22} />, href: '/admin/payment-accounts' },
    { label: 'Signals', icon: <Signal size={22} />, href: '/admin/signals' },
    { label: 'Affiliates', icon: <Wallet size={22} />, href: '/admin/affiliates' },
    { label: 'Verifications', icon: <VerifiedBadgeIcon />, href: '/admin/verifications', badge: notifications },
    { label: 'Settings', icon: <Settings size={22} />, href: '/admin/settings' },
  ];

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0a0f1a',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={24} color="white" />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.5px',
                }}
              >
                AlgoEdge
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Admin Panel
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} color="white" />
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, py: 2, px: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  component={Link}
                  href={item.href}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2,
                    bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error" max={99}>
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                          fontSize: '0.9rem',
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* User Section */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#3B82F6',
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          {adminUser?.name?.charAt(0) || adminUser?.email?.charAt(0) || 'A'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {adminUser?.name || 'Admin'}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {adminUser?.email || 'admin@algoedge.io'}
            </Typography>
          </Box>
        )}
        {!collapsed && (
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                '&:hover': { color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              <LogOut size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: 'rgba(59, 130, 246, 0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)' },
          }}
        >
          <Menu size={24} />
        </IconButton>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
              boxSizing: 'border-box',
              transition: 'width 0.2s ease-in-out',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          overflow: 'auto',
          bgcolor: '#0a0f1a',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
