'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  Star,
  Plus,
  X,
  Play,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MediaItem {
  id: number;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export default function SellerMediaPage() {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Preview dialog state
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchMedia = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/profile/seller/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status !== 404) {
          throw new Error(data.error || 'Failed to fetch media');
        }
        setMedia([]);
        return;
      }
      
      const data = await response.json();
      setMedia(data.media || []);
    } catch (err: any) {
      // Don't show error for empty media
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setError('Only images and videos are allowed');
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
      if (file.size > maxSize) {
        setError(`File too large. Max ${isVideo ? '50MB' : '10MB'} for ${isVideo ? 'videos' : 'images'}`);
        return;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === validFiles.length) {
          setFilePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload each file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('title', mediaTitle);
        formData.append('description', mediaDescription);
        formData.append('is_featured', String(isFeatured));

        const response = await fetch(`${API_URL}/api/profile/seller/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload media');
        }
      }

      setSuccess(`${selectedFiles.length} file(s) uploaded successfully!`);
      setUploadDialogOpen(false);
      resetUploadState();
      fetchMedia();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const response = await fetch(`${API_URL}/api/profile/seller/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      setSuccess('Media deleted successfully');
      fetchMedia();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleFeatured = async (mediaId: number, featured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/profile/seller/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_featured: featured }),
      });

      if (!response.ok) {
        throw new Error('Failed to update media');
      }

      fetchMedia();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetUploadState = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setMediaTitle('');
    setMediaDescription('');
    setIsFeatured(false);
  };

  const images = media.filter(m => m.media_type === 'image');
  const videos = media.filter(m => m.media_type === 'video');

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <ImageIcon size={32} color="#8B5CF6" />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Performance Media
            </Typography>
            <Typography color="text.secondary">
              Upload screenshots and videos showcasing your trading performance
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
        >
          Upload Media
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Info Card */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Boost Your Credibility!
        </Typography>
        <Typography variant="body2">
          Upload screenshots of your trading results, account statements, or video walkthroughs. 
          Featured media will be prominently displayed on your seller profile to build trust with potential buyers.
        </Typography>
      </Alert>

      {/* Images Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <ImageIcon size={24} color="#22C55E" />
          <Typography variant="h6" fontWeight="bold">
            Screenshots & Images ({images.length})
          </Typography>
        </Box>

        {images.length === 0 ? (
          <Box textAlign="center" py={6}>
            <ImageIcon size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
            <Typography color="text.secondary" gutterBottom>
              No images uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload screenshots of your trading performance, account statements, or results
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {images.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ position: 'relative', bgcolor: 'rgba(255,255,255,0.03)' }}>
                  <Box
                    sx={{
                      height: 200,
                      backgroundImage: `url(${item.media_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewItem(item)}
                  />
                  {item.is_featured && (
                    <Chip
                      icon={<Star size={14} />}
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2 }}>
                    {item.title && (
                      <Typography fontWeight={600} noWrap>{item.title}</Typography>
                    )}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={item.is_featured}
                            onChange={(e) => handleToggleFeatured(item.id, e.target.checked)}
                          />
                        }
                        label={<Typography variant="caption">Featured</Typography>}
                      />
                      <Box>
                        <IconButton size="small" onClick={() => setPreviewItem(item)}>
                          <Eye size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Videos Section */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Video size={24} color="#3B82F6" />
          <Typography variant="h6" fontWeight="bold">
            Videos ({videos.length})
          </Typography>
        </Box>

        {videos.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Video size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
            <Typography color="text.secondary" gutterBottom>
              No videos uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload video walkthroughs of your trading strategy or live trading sessions
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {videos.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{ position: 'relative', bgcolor: 'rgba(255,255,255,0.03)' }}>
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => setPreviewItem(item)}
                  >
                    <Play size={48} color="white" />
                  </Box>
                  {item.is_featured && (
                    <Chip
                      icon={<Star size={14} />}
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2 }}>
                    {item.title && (
                      <Typography fontWeight={600} noWrap>{item.title}</Typography>
                    )}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={item.is_featured}
                            onChange={(e) => handleToggleFeatured(item.id, e.target.checked)}
                          />
                        }
                        label={<Typography variant="caption">Featured</Typography>}
                      />
                      <Box>
                        <IconButton size="small" onClick={() => setPreviewItem(item)}>
                          <Eye size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => { setUploadDialogOpen(false); resetUploadState(); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Upload Performance Media</Typography>
            <IconButton onClick={() => { setUploadDialogOpen(false); resetUploadState(); }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* File Upload Area */}
          <Box
            sx={{
              border: '2px dashed rgba(139, 92, 246, 0.3)',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              mb: 3,
              '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.05)' },
            }}
            component="label"
          >
            <Upload size={48} color="#8B5CF6" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Drop files here or click to upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Images (JPG, PNG - max 10MB) • Videos (MP4, WebM - max 50MB)
            </Typography>
            <input
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </Box>

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({selectedFiles.length})
              </Typography>
              <Grid container spacing={1}>
                {selectedFiles.map((file, index) => (
                  <Grid item xs={4} key={index}>
                    <Box sx={{ position: 'relative' }}>
                      {file.type.startsWith('image/') ? (
                        <Box
                          sx={{
                            height: 80,
                            backgroundImage: `url(${filePreviews[index] || ''})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 80,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Video size={24} />
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          '&:hover': { bgcolor: 'error.dark' },
                          width: 20,
                          height: 20,
                        }}
                      >
                        <X size={12} />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Title & Description */}
          <TextField
            fullWidth
            label="Title (optional)"
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g., January 2026 Trading Results"
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={mediaDescription}
            onChange={(e) => setMediaDescription(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
            placeholder="Describe what this media shows..."
          />
          <FormControlLabel
            control={
              <Switch
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                color="warning"
              />
            }
            label="Feature this media on my profile"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setUploadDialogOpen(false); resetUploadState(); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
          <IconButton
            onClick={() => setPreviewItem(null)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <X size={24} />
          </IconButton>
          {previewItem?.media_type === 'image' ? (
            <Box
              component="img"
              src={previewItem?.media_url}
              sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <Box
              component="video"
              src={previewItem?.media_url}
              controls
              autoPlay
              sx={{ width: '100%', maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
        {(previewItem?.title || previewItem?.description) && (
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.9)' }}>
            {previewItem?.title && (
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {previewItem.title}
              </Typography>
            )}
            {previewItem?.description && (
              <Typography color="text.secondary">
                {previewItem.description}
              </Typography>
            )}
          </Box>
        )}
      </Dialog>
    </Container>
  );
}
