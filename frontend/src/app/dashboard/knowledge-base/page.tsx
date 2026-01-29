'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { BookOpen, Search, ChevronDown, ThumbsUp, ThumbsDown, Eye, TrendingUp } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  article_count: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  category_name: string;
  author_username: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedArticles();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchArticlesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchArticlesByCategory = async (slug: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/category/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const fetchFeaturedArticles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/featured`);
      if (res.ok) {
        const data = await res.json();
        setFeaturedArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured articles:', error);
    }
  };

  const searchArticles = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Failed to search articles:', error);
    }
  };

  const openArticle = async (slug: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/article/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedArticle(data.article);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    }
  };

  const voteHelpful = async (articleId: number, isHelpful: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge-base/article/${articleId}/helpful`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_helpful: isHelpful }),
      });
      if (selectedArticle?.slug) {
        openArticle(selectedArticle.slug);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.2)', borderRadius: 2 }}>
            <BookOpen size={24} color="#22C55E" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Knowledge Base
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Tutorials, guides, and help articles
            </Typography>
          </Box>
        </Stack>

        {/* Search Bar */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchArticles()}
                sx={{
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              />
              <Button
                variant="contained"
                onClick={searchArticles}
                sx={{ bgcolor: '#22C55E', minWidth: 100 }}
                startIcon={<Search size={18} />}
              >
                Search
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
          {/* Sidebar - Categories */}
          <Box>
            <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
              Categories
            </Typography>
            <Stack spacing={1}>
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setSelectedArticle(null);
                  }}
                  sx={{
                    bgcolor: selectedCategory === cat.slug ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: selectedCategory === cat.slug ? '#22C55E' : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#22C55E' },
                  }}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                        {cat.name}
                      </Typography>
                      <Chip
                        label={cat.article_count}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    </Stack>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 0.5 }}>
                      {cat.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <TrendingUp size={18} color="#F59E0B" />
                  <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                    Popular
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {featuredArticles.slice(0, 5).map((article) => (
                    <Card
                      key={article.id}
                      onClick={() => openArticle(article.slug)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#F59E0B' },
                      }}
                    >
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography sx={{ color: 'white', fontSize: '0.85rem', fontWeight: 500, mb: 0.5 }}>
                          {article.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Eye size={12} color="rgba(255,255,255,0.5)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                            {article.view_count}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Main Content */}
          <Box>
            {selectedArticle ? (
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ p: 4 }}>
                  <Chip
                    label={selectedArticle.category_name}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22C55E',
                      mb: 2,
                    }}
                  />
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.8rem', mb: 2 }}>
                    {selectedArticle.title}
                  </Typography>

                  <Stack direction="row" spacing={3} sx={{ mb: 3, pb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Eye size={16} color="rgba(255,255,255,0.5)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {selectedArticle.view_count} views
                      </Typography>
                    </Stack>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      By {selectedArticle.author_username}
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.8,
                      fontSize: '1rem',
                      mb: 4,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedArticle.content}
                  </Typography>

                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      Was this article helpful?
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<ThumbsUp size={18} />}
                        onClick={() => voteHelpful(selectedArticle.id, true)}
                        sx={{
                          color: '#22C55E',
                          borderColor: '#22C55E',
                          '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.1)' },
                        }}
                      >
                        Yes ({selectedArticle.helpful_count})
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ThumbsDown size={18} />}
                        onClick={() => voteHelpful(selectedArticle.id, false)}
                        sx={{
                          color: '#EF4444',
                          borderColor: '#EF4444',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                        }}
                      >
                        No ({selectedArticle.not_helpful_count})
                      </Button>
                    </Stack>
                  </Box>

                  <Button
                    onClick={() => setSelectedArticle(null)}
                    sx={{ color: 'rgba(255,255,255,0.5)', mt: 3 }}
                  >
                    ← Back to articles
                  </Button>
                </CardContent>
              </Card>
            ) : articles.length > 0 ? (
              <Stack spacing={1.5}>
                {articles.map((article) => (
                  <Card
                    key={article.id}
                    onClick={() => openArticle(article.slug)}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34, 197, 94, 0.05)' },
                    }}
                  >
                    <CardContent>
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', mb: 1 }}>
                        {article.title}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={article.category_name}
                          size="small"
                          sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: '0.7rem' }}
                        />
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Eye size={14} color="rgba(255,255,255,0.5)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            {article.view_count}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ThumbsUp size={14} color="rgba(255,255,255,0.5)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            {article.helpful_count}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <BookOpen size={56} color="rgba(255,255,255,0.15)" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                    Select a category to view articles
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
