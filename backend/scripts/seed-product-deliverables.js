/**
 * Seed Product Deliverables
 * 
 * This script adds all the downloadable files to the product_deliverables table
 * for each marketplace product.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Product deliverables mapping
const productDeliverables = [
  // Gold Scalper Pro EA
  {
    slug: 'gold-scalper-pro-ea',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete guide to installing and configuring Gold Scalper Pro EA', fileName: 'User_Manual.md', filePath: '/products/gold-scalper-pro-ea/User_Manual.md' },
      { type: 'download_file', name: 'Conservative Settings', description: 'Low-risk settings for careful traders', fileName: 'Settings_Conservative.set', filePath: '/products/gold-scalper-pro-ea/Settings_Conservative.set' },
      { type: 'download_file', name: 'Moderate Settings', description: 'Balanced risk/reward settings', fileName: 'Settings_Moderate.set', filePath: '/products/gold-scalper-pro-ea/Settings_Moderate.set' },
      { type: 'download_file', name: 'Aggressive Settings', description: 'Higher risk settings for experienced traders', fileName: 'Settings_Aggressive.set', filePath: '/products/gold-scalper-pro-ea/Settings_Aggressive.set' },
    ]
  },
  // Silver Trend Rider EA
  {
    slug: 'silver-trend-rider-ea',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete guide to Silver Trend Rider EA', fileName: 'User_Manual.md', filePath: '/products/silver-trend-rider-ea/User_Manual.md' },
      { type: 'download_file', name: 'Conservative Settings', description: 'Safe settings for new users', fileName: 'Settings_Conservative.set', filePath: '/products/silver-trend-rider-ea/Settings_Conservative.set' },
      { type: 'download_file', name: 'Moderate Settings', description: 'Balanced settings for most traders', fileName: 'Settings_Moderate.set', filePath: '/products/silver-trend-rider-ea/Settings_Moderate.set' },
      { type: 'download_file', name: 'Aggressive Settings', description: 'High-performance settings', fileName: 'Settings_Aggressive.set', filePath: '/products/silver-trend-rider-ea/Settings_Aggressive.set' },
    ]
  },
  // Multi-Metal Portfolio EA
  {
    slug: 'multi-metal-portfolio-ea',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete portfolio management guide', fileName: 'User_Manual.md', filePath: '/products/multi-metal-portfolio-ea/User_Manual.md' },
      { type: 'download_file', name: 'Conservative Settings', description: 'Low-risk portfolio settings', fileName: 'Settings_Conservative.set', filePath: '/products/multi-metal-portfolio-ea/Settings_Conservative.set' },
      { type: 'download_file', name: 'Moderate Settings', description: 'Balanced portfolio settings', fileName: 'Settings_Moderate.set', filePath: '/products/multi-metal-portfolio-ea/Settings_Moderate.set' },
      { type: 'download_file', name: 'Aggressive Settings', description: 'Growth-focused settings', fileName: 'Settings_Aggressive.set', filePath: '/products/multi-metal-portfolio-ea/Settings_Aggressive.set' },
    ]
  },
  // Risk Manager Pro EA
  {
    slug: 'risk-manager-pro-ea',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete risk management guide', fileName: 'User_Manual.md', filePath: '/products/risk-manager-pro-ea/User_Manual.md' },
      { type: 'download_file', name: 'Standard Settings', description: 'General trading settings', fileName: 'Settings_Standard.set', filePath: '/products/risk-manager-pro-ea/Settings_Standard.set' },
      { type: 'download_file', name: 'Prop Firm Settings', description: 'Settings optimized for prop firm rules', fileName: 'Settings_PropFirm.set', filePath: '/products/risk-manager-pro-ea/Settings_PropFirm.set' },
      { type: 'download_file', name: 'Conservative Settings', description: 'Maximum protection settings', fileName: 'Settings_Conservative.set', filePath: '/products/risk-manager-pro-ea/Settings_Conservative.set' },
    ]
  },
  // News Trading Sniper EA
  {
    slug: 'news-trading-sniper-ea',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete news trading guide', fileName: 'User_Manual.md', filePath: '/products/news-trading-sniper-ea/User_Manual.md' },
      { type: 'download_file', name: 'Straddle Settings', description: 'Settings for straddle strategy', fileName: 'Settings_Straddle.set', filePath: '/products/news-trading-sniper-ea/Settings_Straddle.set' },
      { type: 'download_file', name: 'Fade Settings', description: 'Settings for fade strategy', fileName: 'Settings_Fade.set', filePath: '/products/news-trading-sniper-ea/Settings_Fade.set' },
      { type: 'download_file', name: 'Momentum Settings', description: 'Settings for momentum strategy', fileName: 'Settings_Momentum.set', filePath: '/products/news-trading-sniper-ea/Settings_Momentum.set' },
    ]
  },
  // Gold Trading Bible Ebook
  {
    slug: 'gold-trading-bible-ebook',
    deliverables: [
      { type: 'download_file', name: 'Gold Trading Bible', description: 'Complete 25-chapter guide to gold trading', fileName: 'Gold_Trading_Bible.md', filePath: '/products/gold-trading-bible-ebook/Gold_Trading_Bible.md' },
      { type: 'download_file', name: 'Trading Plan Template', description: 'Professional trading plan template', fileName: 'Trading_Plan_Template.md', filePath: '/products/gold-trading-bible-ebook/Trading_Plan_Template.md' },
    ]
  },
  // Technical Analysis Mastery Ebook
  {
    slug: 'technical-analysis-mastery-ebook',
    deliverables: [
      { type: 'download_file', name: 'Technical Analysis Mastery', description: '24-chapter comprehensive guide', fileName: 'Technical_Analysis_Mastery.md', filePath: '/products/technical-analysis-mastery-ebook/Technical_Analysis_Mastery.md' },
      { type: 'download_file', name: 'Support/Resistance Cheat Sheet', description: 'Quick reference for S/R levels', fileName: 'SR_Cheat_Sheet.md', filePath: '/products/technical-analysis-mastery-ebook/SR_Cheat_Sheet.md' },
      { type: 'download_file', name: 'Pattern Cheat Sheet', description: 'Chart pattern recognition guide', fileName: 'Pattern_Cheat_Sheet.md', filePath: '/products/technical-analysis-mastery-ebook/Pattern_Cheat_Sheet.md' },
    ]
  },
  // Risk Management Ebook
  {
    slug: 'risk-management-ebook',
    deliverables: [
      { type: 'download_file', name: 'Risk Management Guide', description: '11-chapter risk management guide', fileName: 'Risk_Management_Guide.md', filePath: '/products/risk-management-ebook/Risk_Management_Guide.md' },
      { type: 'download_file', name: 'Position Size Calculator Reference', description: 'Position sizing reference tables', fileName: 'Position_Size_Calculator.md', filePath: '/products/risk-management-ebook/Position_Size_Calculator.md' },
    ]
  },
  // Trading Psychology Blueprint Ebook
  {
    slug: 'trading-psychology-blueprint',
    deliverables: [
      { type: 'download_file', name: 'Trading Psychology Blueprint', description: '18-chapter psychology guide', fileName: 'Trading_Psychology_Blueprint.md', filePath: '/products/trading-psychology-blueprint/Trading_Psychology_Blueprint.md' },
      { type: 'download_file', name: 'Daily Psychology Checklist', description: 'Printable daily checklist', fileName: 'Daily_Psychology_Checklist.md', filePath: '/products/trading-psychology-blueprint/Daily_Psychology_Checklist.md' },
    ]
  },
  // Price Action Secrets Ebook
  {
    slug: 'price-action-secrets-ebook',
    deliverables: [
      { type: 'download_file', name: 'Price Action Secrets', description: '20-chapter price action guide', fileName: 'Price_Action_Secrets.md', filePath: '/products/price-action-secrets-ebook/Price_Action_Secrets.md' },
      { type: 'download_file', name: 'Price Action Cheat Sheet', description: 'Quick reference guide', fileName: 'PA_Cheat_Sheet.md', filePath: '/products/price-action-secrets-ebook/PA_Cheat_Sheet.md' },
    ]
  },
  // Smart Support Resistance Indicator
  {
    slug: 'smart-sr-indicator',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete indicator guide with trading strategies', fileName: 'User_Manual.md', filePath: '/products/smart-sr-indicator/User_Manual.md' },
    ]
  },
  // Trend Strength Dashboard Indicator
  {
    slug: 'trend-strength-dashboard',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Multi-timeframe dashboard guide', fileName: 'User_Manual.md', filePath: '/products/trend-strength-dashboard/User_Manual.md' },
    ]
  },
  // Supply Demand Zone Indicator
  {
    slug: 'supply-demand-zone-indicator',
    deliverables: [
      { type: 'download_file', name: 'User Manual', description: 'Complete S/D zone indicator guide', fileName: 'User_Manual.md', filePath: '/products/supply-demand-zone-indicator/User_Manual.md' },
    ]
  },
  // Professional Trading Journal Template
  {
    slug: 'professional-trading-journal',
    deliverables: [
      { type: 'download_file', name: 'Trading Journal Template', description: 'Complete journal system with templates', fileName: 'Trading_Journal_Template.md', filePath: '/products/professional-trading-journal/Trading_Journal_Template.md' },
    ]
  },
  // Forex Calculator Suite Template
  {
    slug: 'forex-calculator-suite',
    deliverables: [
      { type: 'download_file', name: 'Forex Calculator Suite', description: '8 essential trading calculators', fileName: 'Forex_Calculator_Suite.md', filePath: '/products/forex-calculator-suite/Forex_Calculator_Suite.md' },
    ]
  },
  // Trading Plan Template Bundle
  {
    slug: 'trading-plan-template-bundle',
    deliverables: [
      { type: 'download_file', name: 'Trading Plan Bundle', description: '4 professional planning documents', fileName: 'Trading_Plan_Bundle.md', filePath: '/products/trading-plan-template-bundle/Trading_Plan_Bundle.md' },
    ]
  },
  // MT5 Mastery Course
  {
    slug: 'mt5-mastery-course',
    deliverables: [
      { type: 'download_file', name: 'MT5 Mastery Course', description: 'Complete 10-module MT5 course', fileName: 'MT5_Mastery_Course.md', filePath: '/products/mt5-mastery-course/MT5_Mastery_Course.md' },
      { type: 'download_file', name: 'Quick Reference Card', description: 'Printable shortcuts & commands', fileName: 'Quick_Reference_Card.md', filePath: '/products/mt5-mastery-course/Quick_Reference_Card.md' },
    ]
  },
  // Prop Firm Challenge Blueprint
  {
    slug: 'prop-firm-challenge-blueprint',
    deliverables: [
      { type: 'download_file', name: 'Prop Firm Challenge Blueprint', description: 'Complete 10-chapter guide to passing evaluations', fileName: 'Prop_Firm_Challenge_Blueprint.md', filePath: '/products/prop-firm-challenge-blueprint/Prop_Firm_Challenge_Blueprint.md' },
      { type: 'download_file', name: 'Evaluation Tracker', description: 'Printable progress tracker', fileName: 'Evaluation_Tracker.md', filePath: '/products/prop-firm-challenge-blueprint/Evaluation_Tracker.md' },
    ]
  },
];

async function seedDeliverables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting deliverables seed...\n');
    
    for (const product of productDeliverables) {
      // Find the product by slug
      const productResult = await client.query(
        'SELECT id, name FROM marketplace_products WHERE slug = $1',
        [product.slug]
      );
      
      if (productResult.rows.length === 0) {
        console.log(`⚠️ Product not found: ${product.slug}`);
        continue;
      }
      
      const productId = productResult.rows[0].id;
      const productName = productResult.rows[0].name;
      
      console.log(`📦 Processing: ${productName}`);
      
      // Delete existing deliverables for this product
      await client.query(
        'DELETE FROM product_deliverables WHERE product_id = $1',
        [productId]
      );
      
      // Insert new deliverables
      for (let i = 0; i < product.deliverables.length; i++) {
        const d = product.deliverables[i];
        
        await client.query(`
          INSERT INTO product_deliverables (
            product_id, deliverable_type, name, description,
            file_url, file_name, display_order, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `, [
          productId,
          d.type,
          d.name,
          d.description,
          d.filePath,
          d.fileName,
          i + 1
        ]);
        
        console.log(`   ✅ Added: ${d.name}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Get summary
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT product_id) as products
      FROM product_deliverables
    `);
    
    console.log('\n✅ Deliverables seeded successfully!');
    console.log(`   Total deliverables: ${summary.rows[0].total}`);
    console.log(`   Products with deliverables: ${summary.rows[0].products}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding deliverables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDeliverables().catch(console.error);
