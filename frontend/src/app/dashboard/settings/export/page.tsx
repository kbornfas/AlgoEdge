'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Chip,
  Alert,
} from '@mui/material';
import { Download, FileSpreadsheet, Calendar, Filter, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ExportDataPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [exportType, setExportType] = useState('trades');
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('csv');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      params.append('type', exportType);
      params.append('format', format);
      
      if (dateRange === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      } else {
        params.append('days', dateRange);
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      
      // Get filename from content-disposition header
      const disposition = res.headers.get('content-disposition');
      let filename = `algoedge_${exportType}_export.${format}`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0f1a', 
      py: { xs: 2, md: 4 },
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.2)', borderRadius: 2 }}>
            <Download size={24} color="#10B981" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Export Data
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Download your trading data and account information
            </Typography>
          </Box>
        </Stack>

        {/* Back link */}
        <Button
          component={Link}
          href="/dashboard/settings"
          sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}
          startIcon={<span>←</span>}
        >
          Back to Settings
        </Button>

        {/* Success Alert */}
        {success && (
          <Alert 
            severity="success" 
            icon={<CheckCircle size={20} />}
            sx={{ mb: 3, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}
          >
            Export completed! Your download should start automatically.
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Export Options Card */}
        <Card sx={{ 
          bgcolor: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.1)',
          mb: 3,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Data Type */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Data Type</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  label="Data Type"
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10B981' },
                  }}
                >
                  <MenuItem value="trades">Trade History</MenuItem>
                  <MenuItem value="activity">Account Activity</MenuItem>
                  <MenuItem value="transactions">Wallet Transactions</MenuItem>
                  <MenuItem value="signals">Signal History</MenuItem>
                </Select>
              </FormControl>

              {/* Date Range */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="365">Last year</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                  <MenuItem value="custom">Custom range</MenuItem>
                </Select>
              </FormControl>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    }}
                  />
                </Stack>
              )}

              {/* Format */}
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5, fontSize: '0.875rem' }}>
                  Export Format
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label="CSV"
                    icon={<FileSpreadsheet size={16} />}
                    onClick={() => setFormat('csv')}
                    sx={{
                      bgcolor: format === 'csv' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: format === 'csv' ? '#10B981' : 'rgba(255,255,255,0.7)',
                      border: format === 'csv' ? '1px solid #10B981' : '1px solid transparent',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' },
                    }}
                  />
                  <Chip
                    label="JSON"
                    onClick={() => setFormat('json')}
                    sx={{
                      bgcolor: format === 'json' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: format === 'json' ? '#10B981' : 'rgba(255,255,255,0.7)',
                      border: format === 'json' ? '1px solid #10B981' : '1px solid transparent',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' },
                    }}
                  />
                </Stack>
              </Box>

              {/* Export Button */}
              <Button
                variant="contained"
                onClick={handleExport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                sx={{
                  bgcolor: '#10B981',
                  color: 'white',
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#059669' },
                  '&.Mui-disabled': { bgcolor: 'rgba(16, 185, 129, 0.3)' },
                }}
              >
                {loading ? 'Preparing Export...' : 'Download Export'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card sx={{ 
          bgcolor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <CardContent>
            <Typography sx={{ color: '#3B82F6', fontWeight: 600, mb: 1 }}>
              About Data Export
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              • <strong>Trade History</strong>: All your trades including entry/exit prices, P&L, and timestamps<br/>
              • <strong>Account Activity</strong>: Login history, settings changes, and security events<br/>
              • <strong>Wallet Transactions</strong>: Deposits, withdrawals, and balance history<br/>
              • <strong>Signal History</strong>: Signals you've received and their outcomes<br/><br/>
              CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
