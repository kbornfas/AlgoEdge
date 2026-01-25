import pool from '../config/database.js';

async function updateThumbnails() {
  try {
    // Professional trading/finance images from Unsplash
    const botImages = {
      'gold-scalper-pro': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
      'silver-trend-rider': 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
      'multi-metal-portfolio': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
      'news-trading-sniper': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
      'risk-manager-pro': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    };

    console.log('Updating bot thumbnails...');
    for (const [slug, url] of Object.entries(botImages)) {
      await pool.query('UPDATE marketplace_bots SET thumbnail_url = $1 WHERE slug = $2', [url, slug]);
      console.log('  Updated:', slug);
    }

    // Product images
    const productImages = [
      { pattern: '%ebook%', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop' },
      { pattern: '%course%', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop' },
      { pattern: '%indicator%', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop' },
      { pattern: '%template%', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop' },
      { pattern: '%calculator%', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop' },
    ];

    console.log('\nUpdating product thumbnails...');
    for (const { pattern, url } of productImages) {
      const result = await pool.query(
        'UPDATE marketplace_products SET thumbnail_url = $1 WHERE slug LIKE $2 AND (thumbnail_url IS NULL OR thumbnail_url = \'\')',
        [url, pattern]
      );
      console.log(`  Pattern ${pattern}: ${result.rowCount} updated`);
    }

    // Set default image for products without thumbnails
    const defaultImg = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
    await pool.query(
      'UPDATE marketplace_products SET thumbnail_url = $1 WHERE thumbnail_url IS NULL OR thumbnail_url = \'\'',
      [defaultImg]
    );

    console.log('\n✅ All thumbnails updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateThumbnails();
