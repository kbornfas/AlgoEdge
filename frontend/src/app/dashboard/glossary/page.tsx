'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';
import { BookOpen, Search, TrendingUp, Eye } from 'lucide-react';

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string;
  example: string | null;
  related_terms: string[];
  view_count: number;
}

export default function GlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  useEffect(() => {
    fetchTerms();
    fetchCategories();
  }, [selectedCategory]);

  const fetchTerms = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/glossary?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTerms(data.terms || []);
      }
    } catch (error) {
      console.error('Failed to fetch glossary terms:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/glossary/meta/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTerms();
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/glossary/search/full-text?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setTerms(data.terms || []);
      }
    } catch (error) {
      console.error('Failed to search glossary:', error);
    }
  };

  const openTerm = async (term: GlossaryTerm) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/glossary/${term.term}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTerm(data.term);
      }
    } catch (error) {
      console.error('Failed to fetch term details:', error);
    }
  };

  const filteredTerms = terms.filter((term) =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 4 }, overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <BookOpen size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Trading Glossary
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Learn trading terms and concepts
            </Typography>
          </Box>
        </Stack>

        {/* Search Bar */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                placeholder="Search trading terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ 
                  bgcolor: '#8B5CF6', 
                  minWidth: { xs: 'auto', sm: 100 }, 
                  py: { xs: 1.5, sm: 1 },
                  width: { xs: '100%', sm: 'auto' }
                }}
                startIcon={<Search size={18} />}
              >
                Search
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All"
            onClick={() => setSelectedCategory('')}
            sx={{
              bgcolor: selectedCategory === '' ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 600,
              '&:hover': { bgcolor: selectedCategory === '' ? '#7C3AED' : 'rgba(255,255,255,0.1)' },
            }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                bgcolor: selectedCategory === cat ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
                color: 'white',
                fontWeight: 600,
                '&:hover': { bgcolor: selectedCategory === cat ? '#7C3AED' : 'rgba(255,255,255,0.1)' },
              }}
            />
          ))}
        </Stack>

        {/* Terms Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          {filteredTerms.map((term) => (
            <Card
              key={term.id}
              onClick={() => openTerm(term)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#8B5CF6',
                  bgcolor: 'rgba(139, 92, 246, 0.05)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1.5 }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.15rem' }}>
                    {term.term}
                  </Typography>
                  <Chip
                    label={term.category}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(139, 92, 246, 0.2)',
                      color: '#8B5CF6',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem',
                    mb: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {term.definition}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Eye size={14} color="rgba(255,255,255,0.5)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {term.view_count} views
                    </Typography>
                  </Stack>

                  {term.related_terms.length > 0 && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {term.related_terms.length} related terms
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {filteredTerms.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Search size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No terms found
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Term Detail Dialog */}
      <Dialog
        open={!!selectedTerm}
        onClose={() => setSelectedTerm(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F2E', maxWidth: 700 } }}
      >
        {selectedTerm && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                  {selectedTerm.term}
                </Typography>
                <Chip
                  label={selectedTerm.category}
                  sx={{
                    bgcolor: 'rgba(139, 92, 246, 0.2)',
                    color: '#8B5CF6',
                    fontWeight: 600,
                  }}
                />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.7 }}>
                {selectedTerm.definition}
              </Typography>

              {selectedTerm.example && (
                <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3B82F6', p: 2, mb: 3 }}>
                  <Typography sx={{ color: '#3B82F6', fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                    Example:
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {selectedTerm.example}
                  </Typography>
                </Box>
              )}

              {selectedTerm.related_terms.length > 0 && (
                <Box>
                  <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
                    Related Terms:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedTerm.related_terms.map((rt, idx) => (
                      <Chip
                        key={idx}
                        label={rt}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Eye size={16} color="rgba(255,255,255,0.5)" />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  {selectedTerm.view_count} views
                </Typography>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
