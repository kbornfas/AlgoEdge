import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing Email Service Configuration\n');

// Test environment variables
console.log('📋 Environment Variables Check:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('  SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set');
console.log('  SMTP_PASS:', process.env.SMTP_PASS || process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('  SMTP_FROM:', process.env.SMTP_FROM || `Default: "AlgoEdge" <${process.env.SMTP_USER}>`);
console.log('');

// Test email service import
console.log('📦 Testing Email Service Import...');
try {
  const emailService = await import('./services/emailService.js');
  console.log('✅ Email service imported successfully\n');
  
  // Test OTP generation
  console.log('🔢 Testing OTP Generation...');
  const otp = emailService.generateVerificationCode();
  console.log(`✅ Generated OTP: ${otp} (${otp.length} digits)\n`);
  
  // Test template rendering
  console.log('📧 Testing Email Templates...');
  const templates = emailService.default.emailTemplates;
  
  // Test OTP template
  const otpEmail = templates.verificationCode('TestUser', '123456', 10);
  console.log('✅ OTP Template:');
  console.log('   Subject:', otpEmail.subject);
  console.log('   HTML Length:', otpEmail.html.length, 'characters\n');
  
  // Test daily summary template
  const mockStats = {
    totalTrades: 5,
    winningTrades: 3,
    losingTrades: 2,
    dailyProfit: 125.50,
    winRate: '60.0'
  };
  const mockTrades = [
    { pair: 'EURUSD', type: 'BUY', profit: 45.00 },
    { pair: 'GBPUSD', type: 'SELL', profit: -20.00 },
    { pair: 'USDJPY', type: 'BUY', profit: 100.50 }
  ];
  const dailyEmail = templates.dailyTradeSummary('TestUser', mockStats, mockTrades);
  console.log('✅ Daily Summary Template:');
  console.log('   Subject:', dailyEmail.subject);
  console.log('   HTML Length:', dailyEmail.html.length, 'characters\n');
  
  console.log('✅ All email service tests passed!\n');
  console.log('💡 To test actual email sending:');
  console.log('   1. Set SMTP_* environment variables in .env');
  console.log('   2. Register a new user to test OTP email');
  console.log('   3. Use sendDailyTradeReport() to test daily reports\n');
  
} catch (error) {
  console.error('❌ Email service test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}

process.exit(0);
