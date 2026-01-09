'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
} from '@mui/material';
import { Search, TrendingUp, TrendingDown, RefreshCw, Clock, CheckCircle } from 'lucide-react';

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
      const response = await fetch('/api/user/positions', {
        headers: getAuthHeaders(),
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
      console.error('Failed to fetch positions:', err);
    }
  }, [getAuthHeaders]);

  // Fetch closed trades from database
  const fetchClosedTrades = useCallback(async () => {
    try {
      const response = await fetch('/api/user/trades?status=closed', {
        headers: getAuthHeaders(),
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
    let isMounted = true;
    
    const pollPositions = async () => {
      if (!isMounted) return;
      await fetchOpenPositions();
      if (isMounted) {
        setTimeout(pollPositions, 2000); // Poll every 2 seconds
      }
    };
    
    // Start polling after initial load
    const timer = setTimeout(pollPositions, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchOpenPositions]);

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

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Trades
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your open positions and trading history
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Chip
            icon={refreshing ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
            label="Refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Box>

      {/* Account Summary Card */}
      <Paper sx={{ mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Account Balance
            </Typography>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              ${accountInfo?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Account Equity
            </Typography>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              ${accountInfo?.equity?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Open P/L
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                color: openProfit >= 0 ? '#4caf50' : '#f44336', 
                fontWeight: 'bold'
              }}
            >
              {openProfit >= 0 ? '+' : ''}${openProfit.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Summary Stats */}
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 3 }, 
        mb: 4, 
        flexWrap: 'wrap',
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
      }}>
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, minWidth: { xs: 100, sm: 150 }, flex: '1 1 auto' }}>
          <Typography variant="body2" color="text.secondary">Open Positions</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {openPositions.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Floating P/L</Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: openProfit >= 0 ? 'success.main' : 'error.main' }}
          >
            {openProfit >= 0 ? '+' : ''}${openProfit.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Closed Trades</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{closedTrades.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Realized P/L</Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: closedProfit >= 0 ? 'success.main' : 'error.main' }}
          >
            {closedProfit >= 0 ? '+' : ''}${closedProfit.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Win Rate</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{winRate.toFixed(1)}%</Typography>
        </Paper>
      </Box>

      {/* ==================== OPEN POSITIONS SECTION ==================== */}
      <Paper sx={{ mb: 4, overflow: 'hidden', maxWidth: '100%' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Clock size={20} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Open Positions ({openPositions.length})
          </Typography>
        </Box>
        
        <TableContainer sx={{ 
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'background.paper' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
        }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Symbol</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Robot</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Open Price</TableCell>
                <TableCell>Current Price</TableCell>
                <TableCell>SL</TableCell>
                <TableCell>TP</TableCell>
                <TableCell>P/L</TableCell>
                <TableCell>Open Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : openPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No open positions
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                openPositions.map((position) => {
                  // Normalize type: POSITION_TYPE_BUY -> BUY, POSITION_TYPE_SELL -> SELL
                  const displayType = position.type?.includes('BUY') ? 'BUY' : 'SELL';
                  return (
                  <TableRow key={position.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{position.symbol}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={displayType === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        label={displayType}
                        color={displayType === 'BUY' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={position.comment?.replace('AlgoEdge-', '') || 'Manual'}
                        size="small"
                        variant="outlined"
                        color="info"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>{position.volume}</TableCell>
                    <TableCell>{position.openPrice?.toFixed(5)}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'info.main', fontWeight: 500 }}>
                        {position.currentPrice?.toFixed(5) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'error.main' }}>
                      {position.stopLoss?.toFixed(5) || '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'success.main' }}>
                      {position.takeProfit?.toFixed(5) || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: position.profit >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {position.openTime ? new Date(position.openTime).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ==================== CLOSED TRADES SECTION ==================== */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'grey.700', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle size={20} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Trade History ({closedTrades.length})
          </Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Search by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="BUY">Buy</MenuItem>
              <MenuItem value="SELL">Sell</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Symbol</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Type</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Volume</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Open Price</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Close Price</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>P/L</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Open Time</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Close Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedClosedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No closed trades found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClosedTrades.map((trade) => (
                  <TableRow key={trade.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{trade.symbol}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={trade.type === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        label={trade.type}
                        color={trade.type === 'BUY' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{trade.lotSize ?? trade.volume ?? '-'}</TableCell>
                    <TableCell>{trade.openPrice?.toFixed(5) ?? '-'}</TableCell>
                    <TableCell>{trade.closePrice?.toFixed(5) ?? '-'}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: (trade.profit || 0) >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 500,
                        }}
                      >
                        {(trade.profit || 0) >= 0 ? '+' : ''}${(trade.profit || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {trade.openTime ? new Date(trade.openTime).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {trade.closeTime ? new Date(trade.closeTime).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredClosedTrades.length > rowsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={Math.ceil(filteredClosedTrades.length / rowsPerPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
