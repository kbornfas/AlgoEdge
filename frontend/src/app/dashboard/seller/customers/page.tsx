'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Stack,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  People as CustomersIcon,
  Visibility as ViewIcon,
  ShoppingCart as PurchaseIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Customer {
  id: number;
  full_name: string;
  email: string;
  profile_image: string | null;
  user_joined: string;
  total_purchases: number;
  total_spent: number;
  last_purchase: string;
}

interface Purchase {
  id: number;
  type: string;
  item_name: string;
  item_slug: string;
  price_paid: number;
  created_at: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function SellerCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPurchases, setCustomerPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const limit = 20;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/seller/customers?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, API_URL]);

  const fetchCustomerPurchases = async (customerId: number) => {
    if (!token) return;
    
    try {
      setLoadingPurchases(true);
      const response = await fetch(`${API_URL}/api/seller/customers/${customerId}/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch purchases');
      
      const data = await response.json();
      setCustomerPurchases(data.purchases || []);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerPurchases(customer.id);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <CustomersIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            My Customers
          </Typography>
          <Typography color="text.secondary">
            View all buyers of your products and bots
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CustomersIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{total}</Typography>
                  <Typography color="text.secondary">Total Customers</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PurchaseIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0)}
                  </Typography>
                  <Typography color="text.secondary">Total Purchases</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <MoneyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(customers.reduce((sum, c) => sum + parseFloat(String(c.total_spent || 0)), 0))}
                  </Typography>
                  <Typography color="text.secondary">Total Revenue</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customers Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        {customers.length === 0 ? (
          <Box textAlign="center" py={6}>
            <CustomersIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No customers yet
            </Typography>
            <Typography color="text.secondary">
              When someone purchases your products or bots, they&apos;ll appear here.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Purchases</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell>Last Purchase</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar src={customer.profile_image || undefined}>
                            {customer.full_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography fontWeight={500}>{customer.full_name || 'Unknown'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell align="center">
                        <Chip label={customer.total_purchases} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(parseFloat(String(customer.total_spent || 0)))}
                      </TableCell>
                      <TableCell>
                        {customer.last_purchase ? formatDate(customer.last_purchase) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" py={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Customer Details Dialog */}
      <Dialog
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={selectedCustomer?.profile_image || undefined}>
                {selectedCustomer?.full_name?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedCustomer?.full_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer?.email}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setSelectedCustomer(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Purchase History
          </Typography>
          {loadingPurchases ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : customerPurchases.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={2}>
              No purchases found
            </Typography>
          ) : (
            <List>
              {customerPurchases.map((purchase) => (
                <ListItem key={purchase.id} divider>
                  <ListItemText
                    primary={purchase.item_name}
                    secondary={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip label={purchase.type} size="small" />
                        <Typography variant="body2">{formatDate(purchase.created_at)}</Typography>
                      </Stack>
                    }
                  />
                  <Typography fontWeight={600} color="success.main">
                    {formatCurrency(parseFloat(String(purchase.price_paid)))}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
