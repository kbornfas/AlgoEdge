'use client';

import { useState, useEffect } from 'react';
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
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Download,
  Key,
  Video,
  FileText,
  Link as LinkIcon,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Send,
  Code,
  Bot,
  Package,
  Signal,
  Info,
} from 'lucide-react';

interface Deliverable {
  id: number;
  product_type: string;
  product_id: number;
  deliverable_type: string;
  name: string;
  description?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  content?: string;
  download_limit?: number;
  is_active: boolean;
  display_order: number;
  product_name?: string;
}

interface Product {
  id: number;
  name: string;
  type: 'bot' | 'product' | 'signal';
}

const DELIVERABLE_TYPES = [
  { value: 'download_file', label: 'Downloadable File', icon: Download, description: 'EA files, indicators, scripts' },
  { value: 'license_key', label: 'License Key', icon: Key, description: 'Auto-generated or manual license' },
  { value: 'telegram_invite', label: 'Telegram Invite', icon: Send, description: 'Private Telegram group access' },
  { value: 'discord_invite', label: 'Discord Invite', icon: LinkIcon, description: 'Private Discord server access' },
  { value: 'video_tutorial', label: 'Video Tutorial', icon: Video, description: 'Setup guides, training videos' },
  { value: 'setup_guide', label: 'Setup Guide', icon: FileText, description: 'PDF or text documentation' },
  { value: 'source_code', label: 'Source Code', icon: Code, description: 'MQL4/5 source files' },
  { value: 'ea_file', label: 'EA File (.ex4/.ex5)', icon: Bot, description: 'Compiled Expert Advisor' },
  { value: 'indicator_file', label: 'Indicator File', icon: Package, description: 'Custom indicator' },
  { value: 'course_access', label: 'Course Access', icon: Video, description: 'Online course enrollment' },
  { value: 'api_key', label: 'API Access', icon: Key, description: 'API credentials' },
  { value: 'support_access', label: 'Support Access', icon: Info, description: 'Priority support ticket access' },
  { value: 'community_access', label: 'Community Access', icon: Signal, description: 'Private community membership' },
];

export default function DeliverablesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<Deliverable | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_type: 'bot',
    product_id: '',
    deliverable_type: 'download_file',
    name: '',
    description: '',
    file_url: '',
    content: '',
    download_limit: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [deliverablesRes, dashboardRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/deliverables`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (deliverablesRes.ok) {
        const data = await deliverablesRes.json();
        setDeliverables(data.deliverables);
      }

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        const allProducts: Product[] = [
          ...data.listings.bots.map((b: any) => ({ id: b.id, name: b.name, type: 'bot' as const })),
          ...data.listings.products.map((p: any) => ({ id: p.id, name: p.name, type: 'product' as const })),
        ];
        if (data.listings.signalProvider) {
          allProducts.push({
            id: data.listings.signalProvider.id,
            name: data.listings.signalProvider.name,
            type: 'signal',
          });
        }
        setProducts(allProducts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setFormData({
      product_type: 'bot',
      product_id: '',
      deliverable_type: 'download_file',
      name: '',
      description: '',
      file_url: '',
      content: '',
      download_limit: '',
      is_active: true,
      display_order: deliverables.length,
    });
    setAddDialog(true);
  };

  const openEditDialog = (d: Deliverable) => {
    setFormData({
      product_type: d.product_type,
      product_id: d.product_id.toString(),
      deliverable_type: d.deliverable_type,
      name: d.name,
      description: d.description || '',
      file_url: d.file_url || '',
      content: d.content || '',
      download_limit: d.download_limit?.toString() || '',
      is_active: d.is_active,
      display_order: d.display_order,
    });
    setEditDialog(d);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = !!editDialog;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/deliverables/${editDialog.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/deliverables`;

      const body = {
        product_type: formData.product_type,
        product_id: parseInt(formData.product_id),
        deliverable_type: formData.deliverable_type,
        name: formData.name,
        description: formData.description || null,
        file_url: formData.file_url || null,
        content: formData.content || null,
        download_limit: formData.download_limit ? parseInt(formData.download_limit) : null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      };

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchData();
        setAddDialog(false);
        setEditDialog(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save deliverable');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save deliverable');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/deliverables/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete deliverable');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete deliverable');
    }
  };

  const getDeliverableIcon = (type: string) => {
    const deliverableType = DELIVERABLE_TYPES.find(d => d.value === type);
    const Icon = deliverableType?.icon || Package;
    return <Icon size={20} />;
  };

  const filteredProducts = products.filter(p => p.type === formData.product_type);

  const groupedDeliverables = {
    bot: deliverables.filter(d => d.product_type === 'bot'),
    product: deliverables.filter(d => d.product_type === 'product'),
    signal: deliverables.filter(d => d.product_type === 'signal'),
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12 }}>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
            Please log in to manage deliverables.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', pt: 12, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
              📦 Product Deliverables
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Manage what buyers receive when they purchase your products
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={openAddDialog}
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
          >
            Add Deliverable
          </Button>
        </Box>

        {/* Info Card */}
        <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', mb: 4 }}>
          <CardContent>
            <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              💡 What are Deliverables?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              Deliverables are the files, access links, and resources that buyers receive after purchasing your product. 
              For example: EA files, setup guides, license keys, Telegram group invites, video tutorials, etc.
              Adding deliverables ensures buyers know exactly what they're getting.
            </Typography>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 4, '& .MuiTabs-indicator': { bgcolor: '#22C55E' } }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Bot size={18} />
                <span>Bots</span>
                <Chip label={groupedDeliverables.bot.length} size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', height: 20 }} />
              </Stack>
            }
            sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: 'white' } }}
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <FileText size={18} />
                <span>Products</span>
                <Chip label={groupedDeliverables.product.length} size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', height: 20 }} />
              </Stack>
            }
            sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: 'white' } }}
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Signal size={18} />
                <span>Signals</span>
                <Chip label={groupedDeliverables.signal.length} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', height: 20 }} />
              </Stack>
            }
            sx={{ color: 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: 'white' } }}
          />
        </Tabs>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#22C55E' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {(['bot', 'product', 'signal'] as const)[activeTab] === 'bot' &&
              (groupedDeliverables.bot.length === 0 ? (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                    <Package size={48} color="rgba(255,255,255,0.3)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                      No deliverables added for trading bots yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={openAddDialog}
                      sx={{ bgcolor: '#22C55E' }}
                    >
                      Add Bot Deliverable
                    </Button>
                  </Card>
                </Grid>
              ) : (
                groupedDeliverables.bot.map((d) => (
                  <Grid item xs={12} md={6} lg={4} key={d.id}>
                    <DeliverableCard deliverable={d} onEdit={openEditDialog} onDelete={handleDelete} getIcon={getDeliverableIcon} />
                  </Grid>
                ))
              ))}

            {(['bot', 'product', 'signal'] as const)[activeTab] === 'product' &&
              (groupedDeliverables.product.length === 0 ? (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                    <Package size={48} color="rgba(255,255,255,0.3)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                      No deliverables added for digital products yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={openAddDialog}
                      sx={{ bgcolor: '#F59E0B' }}
                    >
                      Add Product Deliverable
                    </Button>
                  </Card>
                </Grid>
              ) : (
                groupedDeliverables.product.map((d) => (
                  <Grid item xs={12} md={6} lg={4} key={d.id}>
                    <DeliverableCard deliverable={d} onEdit={openEditDialog} onDelete={handleDelete} getIcon={getDeliverableIcon} />
                  </Grid>
                ))
              ))}

            {(['bot', 'product', 'signal'] as const)[activeTab] === 'signal' &&
              (groupedDeliverables.signal.length === 0 ? (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
                    <Package size={48} color="rgba(255,255,255,0.3)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 2 }}>
                      No deliverables added for signal service yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={18} />}
                      onClick={openAddDialog}
                      sx={{ bgcolor: '#3B82F6' }}
                    >
                      Add Signal Deliverable
                    </Button>
                  </Card>
                </Grid>
              ) : (
                groupedDeliverables.signal.map((d) => (
                  <Grid item xs={12} md={6} lg={4} key={d.id}>
                    <DeliverableCard deliverable={d} onEdit={openEditDialog} onDelete={handleDelete} getIcon={getDeliverableIcon} />
                  </Grid>
                ))
              ))}
          </Grid>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={addDialog || !!editDialog}
          onClose={() => { setAddDialog(false); setEditDialog(null); }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 },
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                {editDialog ? '✏️ Edit Deliverable' : '➕ Add Deliverable'}
              </Typography>
              <IconButton onClick={() => { setAddDialog(false); setEditDialog(null); }}>
                <X size={24} color="white" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={3}>
              {/* Product Type */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Product Type</InputLabel>
                <Select
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value, product_id: '' })}
                  label="Product Type"
                  disabled={!!editDialog}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                >
                  <MenuItem value="bot">Trading Bot</MenuItem>
                  <MenuItem value="product">Digital Product</MenuItem>
                  <MenuItem value="signal">Signal Service</MenuItem>
                </Select>
              </FormControl>

              {/* Product Select */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Select Product</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  label="Select Product"
                  disabled={!!editDialog}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                >
                  {filteredProducts.map((p) => (
                    <MenuItem key={p.id} value={p.id.toString()}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Deliverable Type */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Deliverable Type</InputLabel>
                <Select
                  value={formData.deliverable_type}
                  onChange={(e) => setFormData({ ...formData, deliverable_type: e.target.value })}
                  label="Deliverable Type"
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
                >
                  {DELIVERABLE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <t.icon size={18} />
                        <Box>
                          <Typography>{t.label}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)' }}>{t.description}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Name */}
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Forex King EA v2.0.ex5"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                }}
              />

              {/* Description */}
              <TextField
                label="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                placeholder="e.g., Full EA file with all features unlocked"
                sx={{
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                }}
              />

              {/* File URL (for download types) */}
              {['download_file', 'ea_file', 'indicator_file', 'source_code', 'setup_guide', 'video_tutorial'].includes(formData.deliverable_type) && (
                <TextField
                  label="File URL"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://storage.example.com/files/my-ea.ex5"
                  helperText="Direct download URL to the file"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              )}

              {/* Content (for invites, keys, etc) */}
              {['license_key', 'telegram_invite', 'discord_invite', 'api_key', 'course_access'].includes(formData.deliverable_type) && (
                <TextField
                  label={formData.deliverable_type === 'license_key' ? 'License Key (or leave blank for auto-generated)' : 'Invite Link / Access URL'}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={formData.deliverable_type === 'telegram_invite' ? 'https://t.me/+abc123' : 'https://discord.gg/abc123'}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  }}
                />
              )}

              {/* Download Limit */}
              {['download_file', 'ea_file', 'indicator_file', 'source_code'].includes(formData.deliverable_type) && (
                <TextField
                  label="Download Limit (optional)"
                  type="number"
                  value={formData.download_limit}
                  onChange={(e) => setFormData({ ...formData, download_limit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  helperText="Maximum number of times buyer can download"
                  sx={{
                    '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              )}

              {/* Active Switch */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22C55E' } }}
                  />
                }
                label="Active (visible to buyers)"
                sx={{ color: 'white' }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
            <Button onClick={() => { setAddDialog(false); setEditDialog(null); }} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
              onClick={handleSave}
              disabled={saving || !formData.product_id || !formData.name}
              sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
            >
              {saving ? 'Saving...' : 'Save Deliverable'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

// Deliverable Card Component
function DeliverableCard({
  deliverable,
  onEdit,
  onDelete,
  getIcon,
}: {
  deliverable: Deliverable;
  onEdit: (d: Deliverable) => void;
  onDelete: (id: number) => void;
  getIcon: (type: string) => React.ReactNode;
}) {
  const typeColor = deliverable.product_type === 'bot' ? '#22C55E' : deliverable.product_type === 'product' ? '#F59E0B' : '#3B82F6';

  const getTypeLabel = (type: string) => {
    const t = DELIVERABLE_TYPES.find(d => d.value === type);
    return t?.label || type;
  };

  return (
    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: `${typeColor}20`, p: 1, borderRadius: 1.5 }}>
              {getIcon(deliverable.deliverable_type)}
            </Box>
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                {deliverable.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                {getTypeLabel(deliverable.deliverable_type)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={deliverable.is_active ? 'Active' : 'Hidden'}
            size="small"
            sx={{
              bgcolor: deliverable.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: deliverable.is_active ? '#22C55E' : '#EF4444',
              height: 22,
            }}
          />
        </Box>

        {deliverable.description && (
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 2 }}>
            {deliverable.description}
          </Typography>
        )}

        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mb: 2 }}>
          For: {deliverable.product_name || `${deliverable.product_type} #${deliverable.product_id}`}
        </Typography>

        {deliverable.download_limit && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2 }}>
            Download limit: {deliverable.download_limit}
          </Typography>
        )}

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit size={14} />}
            onClick={() => onEdit(deliverable)}
            sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', flex: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Trash2 size={14} />}
            onClick={() => onDelete(deliverable.id)}
            sx={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#EF4444', flex: 1 }}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
