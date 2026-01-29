'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiFetch, isSubscriptionError } from '@/lib/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Skeleton,
  CircularProgress,
  alpha,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock, 
  CheckCircle,
  Activity,
  DollarSign,
  BarChart3,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  History,
} from 'lucide-react';

// GlassCard component for modern styling
const GlassCard = ({ children, sx = {}, ...props }: { children: React.ReactNode; sx?: object; [key: string]: unknown }) => (
  <Paper
    elevation={0}
    sx={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

// StatCard component for stats display
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = '#10B981',
  trend,
  prefix = '',
  suffix = '',
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color?: string;
  trend?: 'up' | 'down' | null;
  prefix?: string;
  suffix?: string;
}) => (
  <GlassCard sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(50% - 8px)', md: '1 1 180px' }, minWidth: { xs: 'calc(50% - 8px)', sm: 140, md: 160 } }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 1, md: 1.5 } }}>
      <Box
        sx={{
          width: { xs: 36, md: 44 },
          height: { xs: 36, md: 44 },
          borderRadius: 2,
          background: alpha(color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} color={color} />
      </Box>
      {trend && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            px: { xs: 0.5, md: 1 },
            py: 0.3,
            borderRadius: 1,
            bgcolor: trend === 'up' ? alpha('#10B981', 0.15) : alpha('#EF4444', 0.15),
          }}
        >
          {trend === 'up' ? (
            <ArrowUpRight size={14} color="#10B981" />
          ) : (
            <ArrowDownRight size={14} color="#EF4444" />
          )}
        </Box>
      )}
    </Box>
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
      {label}
    </Typography>
    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }, color: trend ? (trend === 'up' ? '#10B981' : '#EF4444') : 'white' }}>
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
    </Typography>
  </GlassCard>
);

interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice?: number;
  profit: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  openPrice: number;
  closePrice: number | null;
  profit: number;
  lotSize?: number;
  volume?: number;
  openTime: string;
  closeTime: string | null;
  status: 'open' | 'closed';
}

interface AccountInfo {
  balance: number;
  equity: number;
  profit: number;
}

export default function TradesPage() {
  const router = useRouter();
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const rowsPerPage = 10;

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Fetch live open positions from MetaAPI
  const fetchOpenPositions = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await apiFetch(`${apiUrl}/api/user/positions?_t=${Date.now()}`, {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.account) {
          setAccountInfo({
            balance: data.account.balance || 0,
            equity: data.account.equity || 0,
            profit: data.account.profit ?? ((data.account.equity || 0) - (data.account.balance || 0)),
          });
        }
        
        if (data.positions) {
          setOpenPositions(data.positions.map((p: any) => ({
            id: p.id,
            symbol: p.symbol,
            type: p.type?.toUpperCase() || 'BUY',
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit || 0,
            openTime: p.openTime,
            stopLoss: p.stopLoss,
            takeProfit: p.takeProfit,
            comment: p.comment,
          })));
        }
        
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Subscription error redirects automatically
      if (isSubscriptionError(err)) return;
      console.error('Failed to fetch positions:', err);
    }
  }, [getAuthHeaders]);

  // Fetch closed trades from database
  const fetchClosedTrades = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await apiFetch(`${apiUrl}/api/user/trades?status=closed&_t=${Date.now()}`, {
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const mappedTrades = (data.trades || []).map((trade: any) => ({
          ...trade,
          lotSize: trade.volume || trade.lotSize || 0,
          openPrice: Number(trade.openPrice) || 0,
          closePrice: trade.closePrice ? Number(trade.closePrice) : null,
          profit: Number(trade.profit) || 0,
          status: 'closed' as const,
        }));
        setClosedTrades(mappedTrades);
      }
    } catch (err) {
      // Subscription error redirects automatically
      if (isSubscriptionError(err)) return;
      console.error('Failed to fetch closed trades:', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOpenPositions(), fetchClosedTrades()]);
      setLoading(false);
    };
    
    loadData();
  }, [router, fetchOpenPositions, fetchClosedTrades]);

  // Poll for real-time position updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(() => {
      fetchOpenPositions();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [fetchOpenPositions]);

  // Poll closed trades every 10 seconds
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const interval = setInterval(() => {
      fetchClosedTrades();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchClosedTrades]);

  // WebSocket connection for real-time trade updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket: Socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected for trade updates');
    });

    socket.on('trade:closed', () => {
      fetchClosedTrades();
      fetchOpenPositions();
      setLastUpdated(new Date());
    });

    socket.on('trade:new', () => {
      fetchOpenPositions();
      setLastUpdated(new Date());
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchClosedTrades, fetchOpenPositions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOpenPositions(), fetchClosedTrades()]);
    setRefreshing(false);
  };

  // Filter closed trades
  const filteredClosedTrades = closedTrades.filter((trade) => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || trade.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const paginatedClosedTrades = filteredClosedTrades.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Calculate stats
  const openProfit = openPositions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const closedProfit = closedTrades.reduce((sum, t) => sum + (Number(t.profit) || 0), 0);
  const totalProfit = openProfit + closedProfit;
  const winningTrades = closedTrades.filter((t) => (t.profit || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  // Table styles
  const tableHeadCellSx = {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 600,
    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    bgcolor: 'rgba(255,255,255,0.02)',
    py: { xs: 1, md: 1.5 },
    px: { xs: 1, sm: 1.5, md: 2 },
    whiteSpace: 'nowrap',
  };

  const tableCellSx = {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    py: { xs: 1, md: 1.5 },
    px: { xs: 1, sm: 1.5, md: 2 },
    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100vw', 
      overflowX: 'hidden',
      px: { xs: 0, sm: 0 },
      boxSizing: 'border-box',
    }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, mb: 1 }}>
              <Box
                sx={{
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
                  Trade History
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.3, fontSize: { xs: '0.75rem', md: '0.875rem' }, display: { xs: 'none', sm: 'block' } }}>
                  Monitor your open positions and trading performance
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
            {lastUpdated && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 0.5, md: 1 }, 
                px: { xs: 1, md: 2 }, 
                py: { xs: 0.5, md: 0.75 }, 
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
              }}>
                <Zap size={14} color="#10B981" />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  Live • {lastUpdated.toLocaleTimeString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Account Summary Card */}
      <GlassCard sx={{ mb: { xs: 2, md: 4 }, overflow: 'hidden', mx: { xs: 1.5, sm: 2, md: 0 } }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            p: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 1.5, md: 2 } }}>
            <Wallet size={20} color="#10B981" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Account Overview
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 120, md: 150 }, flex: { xs: '1 1 calc(50% - 8px)', sm: 'none' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                Account Balance
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                ${accountInfo?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </Typography>
            </Box>
            <Box sx={{ minWidth: { xs: 'calc(50% - 8px)', sm: 120, md: 150 }, flex: { xs: '1 1 calc(50% - 8px)', sm: 'none' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                Account Equity
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                ${accountInfo?.equity?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
              </Typography>
            </Box>
            <Box sx={{ minWidth: { xs: '100%', sm: 120, md: 150 }, flex: { xs: '1 1 100%', sm: 'none' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
                Floating P/L
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: openProfit >= 0 ? '#10B981' : '#EF4444', 
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
                }}
              >
                {openProfit >= 0 ? '+' : ''}${openProfit.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </GlassCard>

      {/* Stats Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 1.5, md: 2 }, 
        mb: { xs: 2, md: 4 }, 
        flexWrap: 'wrap',
        overflowX: { xs: 'visible', md: 'auto' },
        pb: 1,
        px: { xs: 1.5, sm: 2, md: 0 },
      }}>
        <StatCard
          icon={Activity}
          label="Open Positions"
          value={openPositions.length}
          color="#3B82F6"
        />
        <StatCard
          icon={DollarSign}
          label="Floating P/L"
          value={`$${Math.abs(openProfit).toFixed(2)}`}
          color={openProfit >= 0 ? '#10B981' : '#EF4444'}
          trend={openProfit !== 0 ? (openProfit > 0 ? 'up' : 'down') : null}
          prefix={openProfit >= 0 ? '+' : '-'}
        />
        <StatCard
          icon={BarChart3}
          label="Closed Trades"
          value={closedTrades.length}
          color="#8B5CF6"
        />
        <StatCard
          icon={Target}
          label="Realized P/L"
          value={`$${Math.abs(closedProfit).toFixed(2)}`}
          color={closedProfit >= 0 ? '#10B981' : '#EF4444'}
          trend={closedProfit !== 0 ? (closedProfit > 0 ? 'up' : 'down') : null}
          prefix={closedProfit >= 0 ? '+' : '-'}
        />
        <StatCard
          icon={CheckCircle}
          label="Win Rate"
          value={winRate.toFixed(1)}
          suffix="%"
          color="#F59E0B"
        />
      </Box>

      {/* Open Positions Section */}
      <GlassCard sx={{ mb: { xs: 2, md: 4 }, mx: { xs: 1.5, sm: 2, md: 0 } }}>
        <Box 
          sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.5 }, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
            <Box
              sx={{
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
                borderRadius: 1.5,
                bgcolor: alpha('#3B82F6', 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#3B82F6" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
                Open Positions
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                {openPositions.length} active trade{openPositions.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          {openPositions.length > 0 && (
            <Chip
              label={`${openProfit >= 0 ? '+' : ''}$${openProfit.toFixed(2)}`}
              size="small"
              sx={{
                bgcolor: openProfit >= 0 ? alpha('#10B981', 0.2) : alpha('#EF4444', 0.2),
                color: openProfit >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', md: '0.8125rem' },
              }}
            />
          )}
        </Box>
        
        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 } }}>
          <Table size="small" sx={{ minWidth: { xs: 700, md: 900 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadCellSx}>Symbol</TableCell>
                <TableCell sx={tableHeadCellSx}>Type</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', md: 'table-cell' } }}>Robot</TableCell>
                <TableCell sx={tableHeadCellSx}>Volume</TableCell>
                <TableCell sx={tableHeadCellSx}>Open Price</TableCell>
                <TableCell sx={tableHeadCellSx}>Current</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', sm: 'table-cell' } }}>SL</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', sm: 'table-cell' } }}>TP</TableCell>
                <TableCell sx={tableHeadCellSx}>P/L</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', md: 'table-cell' } }}>Open Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j} sx={tableCellSx}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : openPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ ...tableCellSx, py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Activity size={40} color="rgba(255,255,255,0.2)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        No open positions
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                openPositions.map((position) => {
                  const displayType = position.type?.includes('BUY') ? 'BUY' : 'SELL';
                  return (
                    <TableRow 
                      key={position.id} 
                      sx={{ 
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell sx={tableCellSx}>
                        <Typography sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{position.symbol}</Typography>
                      </TableCell>
                      <TableCell sx={tableCellSx}>
                        <Chip
                          icon={displayType === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          label={displayType}
                          size="small"
                          sx={{
                            bgcolor: displayType === 'BUY' ? alpha('#10B981', 0.15) : alpha('#EF4444', 0.15),
                            color: displayType === 'BUY' ? '#10B981' : '#EF4444',
                            fontWeight: 600,
                            fontSize: { xs: '0.65rem', md: '0.8125rem' },
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ ...tableCellSx, display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip
                          label={position.comment?.replace('AlgoEdge-', '') || 'Manual'}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(139, 92, 246, 0.15)',
                            color: '#A78BFA',
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={tableCellSx}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{position.volume}</Typography>
                      </TableCell>
                      <TableCell sx={tableCellSx}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{position.openPrice?.toFixed(5)}</Typography>
                      </TableCell>
                      <TableCell sx={tableCellSx}>
                        <Typography sx={{ color: '#3B82F6', fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {position.currentPrice?.toFixed(5) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...tableCellSx, display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography sx={{ color: '#EF4444', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {position.stopLoss?.toFixed(5) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...tableCellSx, display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography sx={{ color: '#10B981', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          {position.takeProfit?.toFixed(5) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tableCellSx}>
                        <Typography
                          sx={{
                            color: position.profit >= 0 ? '#10B981' : '#EF4444',
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                          }}
                        >
                          {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...tableCellSx, display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {position.openTime ? new Date(position.openTime).toLocaleString() : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </GlassCard>

      {/* Trade History Section */}
      <GlassCard sx={{ mx: { xs: 1.5, sm: 2, md: 0 } }}>
        <Box 
          sx={{ 
            p: { xs: 1.5, sm: 2, md: 2.5 }, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
              <Box
                sx={{
                  width: { xs: 32, md: 36 },
                  height: { xs: 32, md: 36 },
                  borderRadius: 1.5,
                  bgcolor: alpha('#8B5CF6', 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={18} color="#8B5CF6" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
                  Trade History
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  {closedTrades.length} completed trade{closedTrades.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                placeholder="Search symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="rgba(255,255,255,0.4)" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  minWidth: { xs: 0, sm: 150, md: 180 },
                  flex: { xs: 1, sm: 'none' },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    py: { xs: 0.75, md: 1 },
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: 90, md: 100 } }}>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8B5CF6' },
                    '& .MuiSelect-select': {
                      py: { xs: 0.75, md: 1 },
                    },
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 } }}>
          <Table size="small" sx={{ minWidth: { xs: 500, md: 800 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadCellSx}>Symbol</TableCell>
                <TableCell sx={tableHeadCellSx}>Type</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', sm: 'table-cell' } }}>Volume</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', md: 'table-cell' } }}>Open Price</TableCell>
                <TableCell sx={tableHeadCellSx}>Close</TableCell>
                <TableCell sx={tableHeadCellSx}>P/L</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', md: 'table-cell' } }}>Open Time</TableCell>
                <TableCell sx={{ ...tableHeadCellSx, display: { xs: 'none', sm: 'table-cell' } }}>Close Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j} sx={tableCellSx}><Skeleton sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedClosedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ ...tableCellSx, py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <BarChart3 size={40} color="rgba(255,255,255,0.2)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        No closed trades found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClosedTrades.map((trade) => (
                  <TableRow 
                    key={trade.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={tableCellSx}>
                      <Typography sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{trade.symbol}</Typography>
                    </TableCell>
                    <TableCell sx={tableCellSx}>
                      <Chip
                        icon={trade.type === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        label={trade.type}
                        size="small"
                        sx={{
                          bgcolor: trade.type === 'BUY' ? alpha('#10B981', 0.15) : alpha('#EF4444', 0.15),
                          color: trade.type === 'BUY' ? '#10B981' : '#EF4444',
                          fontWeight: 600,
                          fontSize: { xs: '0.65rem', md: '0.8125rem' },
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...tableCellSx, display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{trade.lotSize ?? trade.volume ?? '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ ...tableCellSx, display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{trade.openPrice?.toFixed(5) ?? '-'}</Typography>
                    </TableCell>
                    <TableCell sx={tableCellSx}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{trade.closePrice?.toFixed(5) ?? '-'}</Typography>
                    </TableCell>
                    <TableCell sx={tableCellSx}>
                      <Typography
                        sx={{
                          color: (trade.profit || 0) >= 0 ? '#10B981' : '#EF4444',
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                      >
                        {(trade.profit || 0) >= 0 ? '+' : ''}${(trade.profit || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...tableCellSx, display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {trade.openTime ? new Date(trade.openTime).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...tableCellSx, display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {trade.closeTime ? new Date(trade.closeTime).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        {filteredClosedTrades.length > rowsPerPage && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: { xs: 1.5, md: 2 },
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Pagination
              count={Math.ceil(filteredClosedTrades.length / rowsPerPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'rgba(255,255,255,0.7)',
                  minWidth: { xs: 28, md: 32 },
                  height: { xs: 28, md: 32 },
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  '&.Mui-selected': {
                    bgcolor: alpha('#8B5CF6', 0.3),
                    color: 'white',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                },
              }}
            />
          </Box>
        )}
      </GlassCard>
    </Box>
  );
}