'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  openPrice: number;
  closePrice: number;
  profit: number;
  lotSize: number;
  openTime: string;
  closeTime: string;
  status: 'open' | 'closed';
}

export default function TradeHistoryPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchTrades();
  }, [router]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/trades', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      } else {
        // Use mock data for demo
        setTrades(getMockTrades());
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err);
      setTrades(getMockTrades());
    } finally {
      setLoading(false);
    }
  };

  const getMockTrades = (): Trade[] => [
    {
      id: 1,
      symbol: 'EUR/USD',
      type: 'BUY',
      openPrice: 1.0850,
      closePrice: 1.0895,
      profit: 45.30,
      lotSize: 0.10,
      openTime: '2026-01-05T10:30:00Z',
      closeTime: '2026-01-05T12:45:00Z',
      status: 'closed',
    },
    {
      id: 2,
      symbol: 'GBP/USD',
      type: 'SELL',
      openPrice: 1.2650,
      closePrice: 1.2675,
      profit: -12.50,
      lotSize: 0.05,
      openTime: '2026-01-05T08:15:00Z',
      closeTime: '2026-01-05T11:30:00Z',
      status: 'closed',
    },
    {
      id: 3,
      symbol: 'USD/JPY',
      type: 'BUY',
      openPrice: 148.50,
      closePrice: 148.79,
      profit: 28.90,
      lotSize: 0.10,
      openTime: '2026-01-04T14:00:00Z',
      closeTime: '2026-01-04T18:30:00Z',
      status: 'closed',
    },
    {
      id: 4,
      symbol: 'XAU/USD',
      type: 'BUY',
      openPrice: 2045.50,
      closePrice: 2058.30,
      profit: 128.00,
      lotSize: 0.01,
      openTime: '2026-01-04T09:00:00Z',
      closeTime: '2026-01-04T15:45:00Z',
      status: 'closed',
    },
    {
      id: 5,
      symbol: 'EUR/GBP',
      type: 'SELL',
      openPrice: 0.8580,
      closePrice: 0.8565,
      profit: 15.00,
      lotSize: 0.10,
      openTime: '2026-01-03T11:30:00Z',
      closeTime: '2026-01-03T16:00:00Z',
      status: 'closed',
    },
  ];

  const filteredTrades = trades
    .filter((trade) => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || trade.type === filterType;
      return matchesSearch && matchesFilter;
    });

  const paginatedTrades = filteredTrades.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const winRate = trades.length > 0
    ? (trades.filter((t) => t.profit > 0).length / trades.length) * 100
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Trade History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View your complete trading history and performance
      </Typography>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Total Trades</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{trades.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Total Profit</Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: totalProfit >= 0 ? 'success.main' : 'error.main' }}
          >
            ${totalProfit.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">Win Rate</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{winRate.toFixed(1)}%</Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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

      {/* Trades Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Lot Size</TableCell>
              <TableCell>Open Price</TableCell>
              <TableCell>Close Price</TableCell>
              <TableCell>Profit/Loss</TableCell>
              <TableCell>Open Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No trades found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrades.map((trade) => (
                <TableRow key={trade.id}>
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
                  <TableCell>{trade.lotSize}</TableCell>
                  <TableCell>{trade.openPrice.toFixed(5)}</TableCell>
                  <TableCell>{trade.closePrice.toFixed(5)}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        color: trade.profit >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 500,
                      }}
                    >
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(trade.openTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trade.status}
                      color={trade.status === 'closed' ? 'default' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredTrades.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(filteredTrades.length / rowsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
