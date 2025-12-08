import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, TrendingUp, Wallet, Settings, Link2, BookOpen, Users, History, Bot, LogOut, AlertCircle, CheckCircle, User, Mail, Lock, Bell, Shield, HelpCircle, FileText, Eye, EyeOff, Calendar, BarChart3, PieChart, LineChart, Download, Upload, X, Check, Clock, DollarSign, TrendingDown, Zap, Target, Sun, Moon } from 'lucide-react';
import { LineChart as RechartsLine, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell, BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { authAPI, userAPI, tradeAPI, setAuthToken, getAuthToken, websocket } from './services/api';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';

const AlgoEdge = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Page Navigation
  const [currentPage, setCurrentPage] = useState('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // MT5 Configuration
  const [mt5Config, setMt5Config] = useState({
    apiKey: '',
    apiSecret: '',
    accountId: '',
    server: ''
  });
  const [showMt5Config, setShowMt5Config] = useState(false);

  // Trading State
  const [connected, setConnected] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState('algoedge_1_0');
  const [robotStats, setRobotStats] = useState({});
  const [balance, setBalance] = useState(0);
  const [dailyPnL, setDailyPnL] = useState(0);
  const [equity, setEquity] = useState(0);
  const [activePositions, setActivePositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [trades, setTrades] = useState([]);
  const [priceData, setPriceData] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    tradeAlerts: true,
    dailyReports: false,
    theme: 'dark',
    riskLevel: 'medium',
    autoCloseProfit: false,
    stopLossPercent: 2,
    takeProfitPercent: 5
  });

  // Profile State
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    country: '',
    timezone: 'UTC'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Modal States - Must be declared before useEffect hooks that reference them
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRiskDisclosure, setShowRiskDisclosure] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Password Reset
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAuthModal || showPasswordReset || showPricingModal || showTerms || showPrivacy || showRiskDisclosure) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAuthModal, showPasswordReset, showPricingModal, showTerms, showPrivacy, showRiskDisclosure]);

  // Preserve input focus during re-renders
  useEffect(() => {
    const activeElement = document.activeElement;
    const activeId = activeElement?.id;
    
    if (activeId && (activeId.startsWith('auth-') || activeId.startsWith('reset-'))) {
      // Restore focus on next tick if it was lost
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(activeId);
        if (element && document.activeElement !== element) {
          element.focus();
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  });

  const [resetStep, setResetStep] = useState(1);

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Strategy Configuration
  const [strategy, setStrategy] = useState({
    type: 'EMA_CROSSOVER',
    pairs: ['EURUSD', 'GBPUSD'],
    timeframe: 'M15',
    riskPercent: 2,
    indicators: {
      ema_fast: 3,
      ema_slow: 30,
      rsi_period: 14,
      macd_fast: 12,
      macd_slow: 26
    }
  });

  // Loading States
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isMT5Loading, setIsMT5Loading] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Admin tracking
  const [isAdmin, setIsAdmin] = useState(false);

  // Performance Data
  const [performanceData, setPerformanceData] = useState([
    { date: 'Mon', profit: 120, trades: 5 },
    { date: 'Tue', profit: -50, trades: 3 },
    { date: 'Wed', profit: 280, trades: 8 },
    { date: 'Thu', profit: 150, trades: 6 },
    { date: 'Fri', profit: 420, trades: 10 },
    { date: 'Sat', profit: 180, trades: 4 },
    { date: 'Sun', profit: 90, trades: 2 }
  ]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  // ⚠️ IMPORTANT: Replace this with your Railway backend URL after deployment!
  // Example: 'https://algoedge-backend-production.up.railway.app'
  const BACKEND_URL = 'REPLACE_WITH_YOUR_RAILWAY_URL_AFTER_DEPLOYMENT';

  // Subscription state
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');

  // Theme Configuration
  const themes = {
    dark: {
      bg: 'bg-black',
      bgGradient: 'bg-gradient-to-br from-black via-gray-950 to-black',
      card: 'bg-gray-900/90',
      cardHover: 'hover:bg-gray-800/90',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      border: 'border-green-500',
      borderHover: 'hover:border-green-400',
      accent: 'from-green-500 to-green-600',
      accentAlt: 'from-red-500 to-red-600',
      accentBlue: 'from-blue-500 to-blue-600',
      accentYellow: 'from-yellow-500 to-yellow-600',
      sidebar: 'bg-black/95',
      input: 'bg-gray-900/80 border-green-500 text-white',
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    },
    light: {
      bg: 'bg-white',
      bgGradient: 'bg-gradient-to-br from-gray-50 via-green-50 to-gray-50',
      card: 'bg-white/95',
      cardHover: 'hover:bg-gray-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',
      border: 'border-green-500',
      borderHover: 'hover:border-green-600',
      accent: 'from-green-500 to-green-600',
      accentAlt: 'from-red-500 to-red-600',
      accentBlue: 'from-blue-500 to-blue-600',
      accentYellow: 'from-yellow-500 to-yellow-600',
      sidebar: 'bg-white/95',
      input: 'bg-white border-green-500 text-gray-900',
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-amber-600',
      info: 'text-cyan-600'
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  // Trading Robots Configuration
  const tradingRobots = [
    {
      id: 'algoedge_1_0',
      name: 'AlgoEdge 1.0',
      description: 'Triple EMA + RSI System',
      winRate: 72,
      strategy: 'Trend Following',
      timeframe: 'M15',
      riskLevel: 'Medium',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'ea888',
      name: 'EA888',
      description: 'Ichimoku Cloud Breakout',
      winRate: 68,
      strategy: 'Breakout',
      timeframe: 'M30',
      riskLevel: 'High',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'poverty_killer',
      name: 'Poverty Killer',
      description: 'Aggressive Momentum Strategy',
      winRate: 76,
      strategy: 'Momentum',
      timeframe: 'H1',
      riskLevel: 'High',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'golden_sniper',
      name: 'Golden Sniper',
      description: 'Fibonacci + Stochastic',
      winRate: 70,
      strategy: 'Precision Entry',
      timeframe: 'M15',
      riskLevel: 'Medium',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'scalp_master_pro',
      name: 'Scalp Master Pro',
      description: 'High-Frequency Scalping',
      winRate: 65,
      strategy: 'Scalping',
      timeframe: 'M5',
      riskLevel: 'Medium',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'trend_dominator',
      name: 'Trend Dominator',
      description: 'ADX + Parabolic SAR',
      winRate: 74,
      strategy: 'Trend Riding',
      timeframe: 'H4',
      riskLevel: 'Low',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'profit_maximizer',
      name: 'Profit Maximizer',
      description: 'Donchian Channel + RSI',
      winRate: 69,
      strategy: 'Breakout',
      timeframe: 'H1',
      riskLevel: 'Medium',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  // Toast Notification System
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-green-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Custom Logo SVG */}
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-black border-2 border-green-500">
                {/* Advanced Forex Trading Logo SVG */}
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="30" height="30" rx="8" fill="#111" stroke="#22c55e" strokeWidth="2"/>
                  {/* Candlestick chart bars */}
                  <rect x="10" y="14" width="2" height="8" rx="1" fill="#22c55e" />
                  <rect x="16" y="10" width="2" height="12" rx="1" fill="#ef4444" />
                  <rect x="22" y="16" width="2" height="6" rx="1" fill="#22c55e" />
                  {/* Up arrow for profit */}
                  <path d="M8 26L14 20L20 26" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Down arrow for loss */}
                  <path d="M28 10L22 16L16 10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Currency symbol ($) */}
                  <text x="18" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" fontFamily="Arial">$</text>
                </svg>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-red-500">Algo</span><span className="text-green-500">Edge</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
                className="px-6 py-2 text-white hover:text-green-500 transition-colors font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-400 hover:to-green-500 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-300 text-sm mb-6 animate-bounce">
              <Zap className="w-4 h-4" />
              <span>Live Trading • Real Results • AI-Powered</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">Trade Smarter.</span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Not Harder.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
              Harness the power of AI-driven trading robots to execute profitable trades 24/7. Connect your MT5 account and let our battle-tested algorithms work for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-xl hover:from-green-400 hover:to-green-500 transform hover:scale-105 transition-all"
              >
                Start Trading Free
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-lg font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-green-900 to-green-800 backdrop-blur-xl rounded-2xl p-6 border-2 border-green-500 text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">72%</div>
              <div className="text-white text-sm font-semibold">Average Win Rate</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 backdrop-blur-xl rounded-2xl p-6 border-2 border-blue-500 text-center">
              <div className="text-4xl font-bold text-blue-500 mb-2">7</div>
              <div className="text-white text-sm font-semibold">Trading Robots</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 backdrop-blur-xl rounded-2xl p-6 border-2 border-yellow-500 text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">24/7</div>
              <div className="text-white text-sm font-semibold">Automated Trading</div>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-800 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500 text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">$0</div>
              <div className="text-white text-sm font-semibold">Setup Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-green-500">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to succeed in automated trading</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-900 to-green-800 backdrop-blur-xl rounded-2xl p-8 border-2 border-green-500 hover:border-green-400 transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-500">AI-Powered Robots</h3>
              <p className="text-gray-400 mb-4">Choose from 7 pre-configured trading robots powered by advanced algorithms. Each robot specializes in different strategies—from scalping to trend following.</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> EMA Crossover System</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Ichimoku Cloud Breakout</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> RSI + MACD Strategies</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-blue-800 backdrop-blur-xl rounded-2xl p-8 border-2 border-blue-500 hover:border-blue-400 transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Link2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-500">MT5 Integration</h3>
              <p className="text-gray-400 mb-4">Seamlessly connect your MetaTrader 5 account. We never hold your funds—all trading happens through your trusted broker.</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-blue-500" /> Secure API Connection</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-blue-500" /> Real-time Sync</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-blue-500" /> Multiple Accounts</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 backdrop-blur-xl rounded-2xl p-8 border-2 border-yellow-500 hover:border-yellow-400 transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-500">Real-Time Analytics</h3>
              <p className="text-gray-400 mb-4">Monitor your performance with live dashboards, detailed trade history, and comprehensive profit/loss tracking.</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Live Trade Feed</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Performance Charts</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Risk Management Tools</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-2xl shadow-green-500/50">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Create Account</h3>
              <p className="text-gray-400">Sign up for free in under 2 minutes. No credit card required to start.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-2xl shadow-cyan-500/50">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Connect MT5</h3>
              <p className="text-gray-400">Link your MetaTrader 5 account securely using our encrypted API integration.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-2xl shadow-green-500/50">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Start Trading</h3>
              <p className="text-gray-400">Choose your robot, set your risk level, and watch your portfolio grow 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Built for Security & Trust</h2>
              <p className="text-xl text-gray-300 mb-8">Your capital security is our top priority. AlgoEdge employs bank-grade encryption and never holds your funds.</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">SSL/TLS Encryption</h4>
                    <p className="text-gray-400">All data transmission is encrypted with industry-standard 256-bit SSL.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">2FA Authentication</h4>
                    <p className="text-gray-400">Protect your account with two-factor authentication via authenticator apps.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Audit Logging</h4>
                    <p className="text-gray-400">Complete audit trail of all account activities and trades for transparency.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                    <span className="text-gray-300">Active Users</span>
                    <span className="text-2xl font-bold text-green-400">1,247+</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                    <span className="text-gray-300">Total Trades</span>
                    <span className="text-2xl font-bold text-cyan-400">52,891</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="text-2xl font-bold text-purple-400">68.4%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                    <span className="text-gray-300">Uptime</span>
                    <span className="text-2xl font-bold text-yellow-400">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Ready to Automate Your Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-10">Join thousands of traders who trust AlgoEdge to manage their portfolios 24/7.</p>
          <button
            onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
            className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-xl shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transform hover:scale-105 transition-all"
          >
            Get Started Free
          </button>
          <p className="text-sm text-gray-500 mt-6">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-purple-500/20 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  <span className="text-red-500">Algo</span><span className="text-green-500">Edge</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">AI-powered trading platform for the modern trader.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => { setIsLogin(false); setShowAuthModal(true); }} className="hover:text-purple-400 transition-colors">Get Started</button></li>
                <li><button onClick={() => setShowPricingModal(true)} className="hover:text-purple-400 transition-colors">Pricing</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button className="hover:text-purple-400 transition-colors">Documentation</button></li>
                <li><button className="hover:text-purple-400 transition-colors">API Reference</button></li>
                <li><button className="hover:text-purple-400 transition-colors">Support</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => setShowTerms(true)} className="hover:text-purple-400 transition-colors">Terms of Service</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-purple-400 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => setShowRiskDisclosure(true)} className="hover:text-purple-400 transition-colors">Risk Disclosure</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-500/20 pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 AlgoEdge. All rights reserved. Trading involves risk. Past performance does not guarantee future results.</p>
          </div>
        </div>
      </footer>
    </div>
  );

  // Authentication Handler
  // Auth state for two-step registration
  const [registrationStep, setRegistrationStep] = useState(1); // 1 = enter details, 2 = verify code
  const [pendingRegistrationEmail, setPendingRegistrationEmail] = useState('');

  const handleAuth = useCallback(async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          showToast('Email and password are required', 'error');
          setIsAuthLoading(false);
          return;
        }

        const response = await authAPI.login({ username: email, password });
        setAuthToken(response.token);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        showToast('Login successful! Welcome back.', 'success');

        websocket.connect(response.token);

        try {
          const profile = await userAPI.getProfile();
          setSubscriptionPlan(profile.subscription?.plan || 'free');

          const trades = await tradeAPI.getTrades();
          setTradeHistory(trades.trades || []);

          const stats = await tradeAPI.getTradeStats();
          setBalance(stats.stats?.total_profit || 0);
          setEquity(stats.stats?.total_profit || 0);
          setDailyPnL(stats.stats?.total_profit || 0);
        } catch (err) {
          console.error('Error fetching user data:', err);
        }

        setShowAuthModal(false);
        setCurrentPage('dashboard');
      } else {
        // Registration flow
        if (registrationStep === 1) {
          // Step 1: Send verification code
          if (!username || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            setIsAuthLoading(false);
            return;
          }

          if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            setIsAuthLoading(false);
            return;
          }

          const response = await authAPI.register({ username, email, password });
          
          if (response.requiresVerification) {
            setPendingRegistrationEmail(email);
            setRegistrationStep(2);
            showToast('Verification code sent to your email!', 'success');
          }
        } else if (registrationStep === 2) {
          // Step 2: Verify code and complete registration
          if (!verificationCode) {
            showToast('Please enter the verification code', 'error');
            setIsAuthLoading(false);
            return;
          }

          const response = await authAPI.verifyRegistration({ 
            email: pendingRegistrationEmail, 
            code: verificationCode 
          });

          // Show success message and switch to login
          showToast('🎉 Registration successful! Please login to access your account.', 'success');
          
          // Reset registration state and switch to login
          setRegistrationStep(1);
          setPendingRegistrationEmail('');
          setVerificationCode('');
          setPassword('');
          setConfirmPassword('');
          setIsLogin(true); // Switch to login tab
          // Keep the modal open so user can login
        }
      }

      // Clear form fields
      if (isLogin || registrationStep === 2) {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Auth error:', error);
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  }, [isLogin, registrationStep, email, password, username, confirmPassword, verificationCode, pendingRegistrationEmail]);

  const handleLogout = () => {
    setShowConfirmDialog(true);
    setConfirmAction(() => () => {
      // Clear authentication
      setAuthToken(null);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setConnected(false);
      setBotActive(false);
      setWsConnected(false);
      
      // Disconnect WebSocket
      websocket.disconnect();
      
      // Reset state
      setCurrentPage('dashboard');
      setBalance(0);
      setEquity(0);
      setDailyPnL(0);
      setTradeHistory([]);
      setSubscriptionPlan('free');
      
      showToast('Logged out successfully', 'info');
      setShowConfirmDialog(false);
    });
  };

  // Password Reset Flow
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (resetStep === 1) {
      showToast('Password reset code sent to your email', 'success');
      setResetStep(2);
    } else if (resetStep === 2) {
      if (resetCode === '123456') {
        setResetStep(3);
        showToast('Code verified! Enter your new password.', 'success');
      } else {
        showToast('Invalid code. Try again.', 'error');
      }
    } else if (resetStep === 3) {
      if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }
      showToast('Password reset successful! Please login.', 'success');
      setShowPasswordReset(false);
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
    }
  };

  // 2FA Setup
  const handle2FASetup = () => {
    if (twoFAEnabled) {
      setTwoFAEnabled(false);
      showToast('2FA disabled successfully', 'info');
    } else {
      setShow2FASetup(true);
    }
  };

  const verify2FACode = () => {
    if (twoFACode === '123456') {
      setTwoFAEnabled(true);
      setShow2FASetup(false);
      showToast('2FA enabled successfully!', 'success');
      setTwoFACode('');
    } else {
      showToast('Invalid 2FA code', 'error');
    }
  };

  // Profile Update
  const handleProfileUpdate = () => {
    setIsEditingProfile(false);
    showToast('Profile updated successfully', 'success');
  };

  // Settings Update
  const handleSettingsUpdate = () => {
    showToast('Settings saved successfully', 'success');
  };

  // MT5 Connection
  const handleMT5Connection = async () => {
    if (!connected) {
      // Connect to MT5 by adding the account
      setIsMT5Loading(true);
      try {
        setConnectionStatus('Connecting to MT5...');
        
        const accountData = {
          login: mt5Config.accountId,
          password: mt5Config.apiSecret,
          server: mt5Config.server,
          platform: 'MT5',
          broker: mt5Config.server.split('-')[0] || 'Unknown'
        };
        
        const response = await userAPI.addMT5Account(accountData);
        
        setConnected(true);
        setConnectionStatus('Connected to MT5');
        setWsConnected(true);
        showToast('Successfully connected to MT5!', 'success');
        
        // Fetch updated balance from backend
        const profile = await userAPI.getProfile();
        setBalance(profile.balance || 0);
        setEquity(profile.equity || 0);
        
      } catch (error) {
        console.error('MT5 connection failed:', error);
        showToast(error.message || 'Failed to connect to MT5', 'error');
        setConnectionStatus('Connection failed');
      } finally {
        setIsMT5Loading(false);
      }
    } else {
      // Disconnect
      setConnected(false);
      setBotActive(false);
      setWsConnected(false);
      setConnectionStatus('Disconnected');
      showToast('Disconnected from MT5', 'info');
    }
  };

  // Bot Control
  const handleBotToggle = async () => {
    if (!connected) {
      showToast('Please connect to MT5 first', 'error');
      return;
    }

    if (botActive) {
      setShowConfirmDialog(true);
      setConfirmAction(() => async () => {
        try {
          // Update robot config on backend
          await userAPI.updateRobotConfig(selectedRobot, { 
            enabled: false 
          });
          
          setBotActive(false);
          if (window.tradeIntervalId) {
            clearInterval(window.tradeIntervalId);
            window.tradeIntervalId = null;
          }
          showToast(`${tradingRobots.find(r => r.id === selectedRobot)?.name} stopped`, 'info');
          setShowConfirmDialog(false);
        } catch (error) {
          console.error('Failed to stop robot:', error);
          showToast(error.message || 'Failed to stop robot', 'error');
          setShowConfirmDialog(false);
        }
      });
    } else {
      try {
        const robot = tradingRobots.find(r => r.id === selectedRobot);
        
        // Update robot config on backend
        await userAPI.updateRobotConfig(selectedRobot, { 
          enabled: true,
          riskLevel: settings.riskLevel,
          stopLossPercent: settings.stopLossPercent,
          takeProfitPercent: settings.takeProfitPercent
        });
        
        setBotActive(true);
        showToast(`${robot.name} activated successfully!`, 'success');
        
        // Simulate opening trades periodically
        const pairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
        const types = ['BUY', 'SELL'];
        
        const openTrade = () => {
          if (!botActive) return;
          
          const pair = pairs[Math.floor(Math.random() * pairs.length)];
          const type = types[Math.floor(Math.random() * types.length)];
          const openPrice = Math.random() * 2 + 1; // Random price between 1-3
          const volume = (Math.random() * 0.5 + 0.1).toFixed(2); // 0.1 - 0.6 lots
          
          const newTrade = {
            id: Date.now() + Math.random(),
            pair,
            type,
            volume: parseFloat(volume),
            openPrice: parseFloat(openPrice.toFixed(4)),
            closePrice: null,
            profit: 0,
            status: 'open',
            robot: robot.name,
            openTime: new Date().toISOString(),
            closeTime: null
        };
        
        setTrades(prev => [newTrade, ...prev]);
        setActivePositions(prev => [...prev, newTrade]);
        showToast(`${robot.name} opened ${pair} ${type} position`, 'success');
        
        // Simulate closing the trade after some time
        setTimeout(() => {
          const closePrice = openPrice + (Math.random() - 0.5) * 0.05;
          const pips = type === 'BUY' ? (closePrice - openPrice) * 10000 : (openPrice - closePrice) * 10000;
          const profit = pips * parseFloat(volume) * 10;
          
          setTrades(prev => prev.map(t => 
            t.id === newTrade.id 
              ? { ...t, closePrice: parseFloat(closePrice.toFixed(4)), profit: parseFloat(profit.toFixed(2)), status: 'closed', closeTime: new Date().toISOString() }
              : t
          ));
          setActivePositions(prev => prev.filter(p => p.id !== newTrade.id));
          
          if (profit > 0) {
            showToast(`Trade closed: +$${profit.toFixed(2)}`, 'success');
          } else {
            showToast(`Trade closed: $${profit.toFixed(2)}`, 'error');
          }
          
          setBalance(prev => prev + profit);
          setDailyPnL(prev => prev + profit);
        }, Math.random() * 30000 + 15000); // Close after 15-45 seconds
      };
      
      // Open first trade immediately
      setTimeout(openTrade, 3000);
      
      // Continue opening trades every 10-20 seconds
      const tradeInterval = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance to open a new trade
          openTrade();
        }
      }, Math.random() * 10000 + 10000);
      
      // Store interval ID to clear later
      window.tradeIntervalId = tradeInterval;
      } catch (error) {
        console.error('Failed to activate robot:', error);
        showToast(error.message || 'Failed to activate robot', 'error');
      }
    }
  };

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && getAuthToken()) {
      // Connect WebSocket
      const token = getAuthToken();
      websocket.connect(token);
      
      // Listen for trade events
      websocket.on('trade:new', (trade) => {
        setTradeHistory(prev => [trade, ...prev]);
        showToast(`New trade opened: ${trade.symbol}`, 'success');
      });
      
      websocket.on('trade:closed', (trade) => {
        setTradeHistory(prev => prev.map(t => t.id === trade.id ? trade : t));
        showToast(`Trade closed: ${trade.symbol} - P/L: $${trade.profit?.toFixed(2)}`, 
          trade.profit > 0 ? 'success' : 'error');
      });
      
      websocket.on('balance:update', (balanceData) => {
        setBalance(balanceData.balance);
        setEquity(balanceData.equity);
      });
      
      websocket.on('notification', (notification) => {
        showToast(notification.message, notification.type || 'info');
      });
      
      websocket.on('connected', () => {
        setWsConnected(true);
        console.log('WebSocket connected');
      });
      
      websocket.on('disconnect', () => {
        setWsConnected(false);
        console.log('WebSocket disconnected');
      });
      
      return () => {
        websocket.off('trade:new');
        websocket.off('trade:closed');
        websocket.off('balance:update');
        websocket.off('notification');
        websocket.off('connected');
        websocket.off('disconnect');
      };
    }
  }, [isAuthenticated]);

  // Load MT5 accounts when authenticated
  useEffect(() => {
    const loadMT5Accounts = async () => {
      if (isAuthenticated && getAuthToken()) {
        try {
          const accounts = await userAPI.getMT5Accounts();
          if (accounts && accounts.length > 0) {
            // If user has MT5 accounts, set connected to true
            setConnected(true);
            setWsConnected(true);
            setConnectionStatus('Connected to MT5');
          }
        } catch (error) {
          console.error('Failed to load MT5 accounts:', error);
        }
      }
    };
    
    loadMT5Accounts();
  }, [isAuthenticated]);

  // Simulate real-time updates when bot is active
  useEffect(() => {
    if (botActive && connected) {
      const interval = setInterval(() => {
        // Update prices
        setPriceData(prev => ({
          'EURUSD': prev['EURUSD'] + (Math.random() - 0.5) * 0.0010,
          'GBPUSD': prev['GBPUSD'] + (Math.random() - 0.5) * 0.0015,
          'USDJPY': prev['USDJPY'] + (Math.random() - 0.5) * 0.15,
          'AUDUSD': prev['AUDUSD'] + (Math.random() - 0.5) * 0.0012
        }));
        
        // Update balance
        setBalance(prev => prev + (Math.random() - 0.48) * 50);
        setEquity(prev => prev + (Math.random() - 0.48) * 60);
        setDailyPnL(prev => prev + (Math.random() - 0.48) * 10);
        
        // Update positions
        setActivePositions(prev => prev.map(pos => ({
          ...pos,
          profit: (Math.random() - 0.3) * 100
        })));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [botActive, connected]);

  // Toast Component
  const ToastContainer = () => {
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-xl border animate-slide-in ${
            toast.type === 'success' ? `${isDarkMode ? 'bg-green-500/20 border-green-500/50' : 'bg-green-100 border-green-500'}` :
            toast.type === 'error' ? `${isDarkMode ? 'bg-red-500/20 border-red-500/50' : 'bg-red-100 border-red-500'}` :
            `${isDarkMode ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-100 border-blue-500'}`
          }`}
        >
          {toast.type === 'success' && <CheckCircle className={`w-5 h-5 ${theme.success}`} />}
          {toast.type === 'error' && <AlertCircle className={`w-5 h-5 ${theme.error}`} />}
          {toast.type === 'info' && <Bell className={`w-5 h-5 ${theme.info}`} />}
          <span className={`text-sm ${theme.text}`}>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className={theme.textMuted}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    );
  };

  // Confirmation Dialog
  const ConfirmDialog = () => {
    if (!showConfirmDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} max-w-md shadow-2xl`}>
          <h3 className={`text-xl font-bold ${theme.text} mb-4`}>Confirm Action</h3>
          <p className={`${theme.textSecondary} mb-6`}>Are you sure you want to proceed?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className={`flex-1 py-2 px-4 ${theme.card} ${theme.text} rounded-lg border ${theme.border} ${theme.cardHover}`}
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className={`flex-1 py-2 px-4 bg-gradient-to-r ${theme.accent} text-white rounded-lg hover:shadow-lg`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Auth Modal Component - Memoized to prevent re-renders
  const AuthModal = useMemo(() => {
    if (!showAuthModal) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="bg-black backdrop-blur-xl rounded-2xl border-2 border-green-500 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setRegistrationStep(1); }}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  isLogin ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setRegistrationStep(1); }}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  !isLogin ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && registrationStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    id="auth-username"
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border-2 border-green-500 rounded-lg text-white focus:outline-none focus:border-green-400"
                    placeholder="Enter username"
                    required={!isLogin}
                    autoComplete="username"
                  />
                </div>
              )}

              {(!isLogin && registrationStep === 1) || isLogin ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      id="auth-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border-2 border-blue-500 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                        placeholder="Enter password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {!isLogin && registrationStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                    placeholder="Re-enter password"
                    required={!isLogin}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {!isLogin && registrationStep === 2 && (
                <div>
                  <div className="mb-4 p-4 bg-green-900 border-2 border-green-500 rounded-lg">
                    <p className="text-sm text-green-500 font-semibold">
                      <Mail className="w-4 h-4 inline mr-2" />
                      We've sent a 6-digit verification code to <strong>{pendingRegistrationEmail}</strong>
                    </p>
                  </div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                  <input
                    id="auth-verification-code"
                    type="text"
                    name="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-gray-900 border-2 border-green-500 rounded-lg text-green-500 text-center text-2xl tracking-widest focus:outline-none focus:border-green-400 font-bold"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">Enter the 6-digit code from your email</p>
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowAuthModal(false); setShowPasswordReset(true); }}
                    className="text-sm text-green-400 hover:text-green-300"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className={`w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-400 hover:to-green-500 transition-all ${
                  isAuthLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isAuthLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Logging in...' : registrationStep === 1 ? 'Sending code...' : 'Verifying...'}
                  </span>
                ) : (
                  isLogin ? 'Login' : registrationStep === 1 ? 'Continue' : 'Verify & Complete'
                )}
              </button>
            </form>

            {!isLogin && (
              <div className="mt-4 text-xs text-gray-400 text-center">
                By registering, you agree to our{' '}
                <button onClick={() => { setShowAuthModal(false); setShowTerms(true); }} className="text-green-400 hover:underline">Terms of Service</button>
                {' '}and{' '}
                <button onClick={() => { setShowAuthModal(false); setShowPrivacy(true); }} className="text-green-400 hover:underline">Privacy Policy</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [showAuthModal, isLogin, username, email, password, confirmPassword, showPassword, registrationStep, pendingRegistrationEmail, verificationCode, isAuthLoading, handleAuth]);

  // Show landing page when not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        {AuthModal}
        
        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-8 border ${theme.border} max-w-md w-full shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme.text}`}>Reset Password</h2>
                <button onClick={() => { setShowPasswordReset(false); setResetStep(1); }} className={theme.textMuted}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                )}
                
                {resetStep === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
                      placeholder="Enter 6-digit code"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-2">Demo code: 123456</p>
                  </div>
                )}
                
                {resetStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
                >
                  {resetStep === 1 ? 'Send Code' : resetStep === 2 ? 'Verify Code' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        <LandingPage />
      </>
    );
  }

  // MT5 Configuration Modal
  if (showMt5Config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <ToastContainer />
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">MT5 Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <input
                  type="text"
                  value={mt5Config.apiKey}
                  onChange={(e) => setMt5Config({...mt5Config, apiKey: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter MT5 API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Secret</label>
                <input
                  type="password"
                  value={mt5Config.apiSecret}
                  onChange={(e) => setMt5Config({...mt5Config, apiSecret: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter API Secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account ID</label>
                <input
                  type="text"
                  value={mt5Config.accountId}
                  onChange={(e) => setMt5Config({...mt5Config, accountId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter Account ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Server</label>
                <input
                  type="text"
                  value={mt5Config.server}
                  onChange={(e) => setMt5Config({...mt5Config, server: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., MetaQuotes-Demo"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMt5Config(false)}
                className="flex-1 py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMt5Config(false);
                  handleMT5Connection();
                }}
                disabled={isMT5Loading}
                className={`flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-green-500/50 hover:shadow-xl ${
                  isMT5Loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isMT5Loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'robots':
        return <RobotsPage />;
      case 'trades':
        return <TradesPage />;
      case 'history':
        return <TradeHistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'help':
        return <HelpPage />;
      case 'strategy':
        return <StrategyPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Dashboard Page Component
  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Trading Dashboard
        </h2>
        {wsConnected && (
          <div className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} border ${isDarkMode ? 'border-green-500/50' : 'border-green-500'} rounded-lg`}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className={`text-sm font-semibold ${theme.success}`}>Live</span>
          </div>
        )}
      </div>

      {/* MT5 Connection & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl hover:shadow-purple-500/20 transition-all`}>
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="w-6 h-6 text-purple-400" />
            <h3 className={`text-xl font-semibold ${theme.text}`}>MT5 Connection</h3>
          </div>
          
          <button
            onClick={() => connected ? handleMT5Connection() : setShowMt5Config(true)}
            disabled={isMT5Loading}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all mb-4 ${
              isMT5Loading
                ? 'bg-gray-500 text-white opacity-50 cursor-not-allowed'
                : connected
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
                : `bg-gradient-to-r ${theme.accent} text-white shadow-lg hover:shadow-xl`
            }`}
          >
            {isMT5Loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </span>
            ) : (
              connected ? '✓ Connected' : '○ Connect to MT5'
            )}
          </button>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={theme.textMuted}>Status:</span>
              <span className={`font-medium ${connected ? theme.success : theme.textMuted}`}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl hover:shadow-pink-500/20 transition-all`}>
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-pink-400" />
            <h3 className={`text-xl font-semibold ${theme.text}`}>Account Balance</h3>
          </div>
          
          <div className={`bg-gradient-to-r ${theme.accent} rounded-xl p-4 mb-4 shadow-lg`}>
            <div className="text-3xl font-bold text-white">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={theme.textMuted}>Equity:</span>
              <span className={`${theme.text} font-medium`}>
                ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Status */}
      <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-cyan-400" />
            <h3 className={`text-xl font-semibold ${theme.text}`}>Trading Robot</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'} border border-purple-500/50`}>
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">
              {tradingRobots.find(r => r.id === selectedRobot)?.name}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            <div className={`text-xs ${theme.textMuted}`}>Win Rate</div>
            <div className="text-lg font-bold text-green-400">
              {tradingRobots.find(r => r.id === selectedRobot)?.winRate}%
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            <div className={`text-xs ${theme.textMuted}`}>Strategy</div>
            <div className={`text-sm font-semibold ${theme.text}`}>
              {tradingRobots.find(r => r.id === selectedRobot)?.strategy}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            <div className={`text-xs ${theme.textMuted}`}>Timeframe</div>
            <div className={`text-sm font-semibold ${theme.text}`}>
              {tradingRobots.find(r => r.id === selectedRobot)?.timeframe}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleBotToggle}
          disabled={!connected}
          className={`w-full py-3 px-8 rounded-xl font-semibold transition-all ${
            !connected
              ? `${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} ${theme.textMuted} cursor-not-allowed`
              : botActive
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
          }`}
        >
          {!connected ? 'Connect MT5 First' : botActive ? '⏸ Stop Robot' : '▶ Start Robot'}
        </button>
      </div>

      {/* Performance Charts */}
      <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl`}>
        <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>Weekly Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                border: `1px solid ${isDarkMode ? '#8b5cf6' : '#a855f7'}`,
                borderRadius: '8px'
              }}
              labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
            />
            <Area type="monotone" dataKey="profit" stroke="#a855f7" fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl hover:shadow-green-500/20 transition-all`}>
          <div className={`${theme.textMuted} text-sm mb-2`}>Daily P/L</div>
          <div className={`text-3xl font-bold ${dailyPnL >= 0 ? theme.success : theme.error}`}>
            ${Math.abs(dailyPnL).toFixed(1)}
          </div>
        </div>

        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl hover:shadow-purple-500/20 transition-all`}>
          <div className={`${theme.textMuted} text-sm mb-2`}>Win Rate</div>
          <div className="text-3xl font-bold text-purple-400">68.5%</div>
        </div>

        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl hover:shadow-pink-500/20 transition-all`}>
          <div className={`${theme.textMuted} text-sm mb-2`}>Active Trades</div>
          <div className="text-3xl font-bold text-pink-400">{activePositions.length}</div>
        </div>
      </div>
    </div>
  );

  // Trades Page Component - Shows all trades taken by the robot
  const TradesPage = () => {
    const openTrades = trades.filter(t => t.status === 'open');
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
    const winningTrades = closedTrades.filter(t => t.profit > 0).length;
    const losingTrades = closedTrades.filter(t => t.profit < 0).length;
    const winRate = closedTrades.length > 0 ? ((winningTrades / closedTrades.length) * 100).toFixed(1) : 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Live Trades
          </h2>
          <div className="flex gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} border border-green-500/50 rounded-lg`}>
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-xs text-gray-400">Open Trades</div>
                <div className="text-lg font-bold text-green-400">{openTrades.length}</div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'} border border-purple-500/50 rounded-lg`}>
              <DollarSign className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-gray-400">Total P/L</div>
                <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalProfit.toFixed(2)}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'} border border-cyan-500/50 rounded-lg`}>
              <Target className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-gray-400">Win Rate</div>
                <div className="text-lg font-bold text-cyan-400">{winRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${theme.card} backdrop-blur-xl rounded-xl p-4 border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className={`text-sm ${theme.textMuted}`}>Winning Trades</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{winningTrades}</div>
          </div>
          <div className={`${theme.card} backdrop-blur-xl rounded-xl p-4 border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <X className="w-5 h-5 text-red-400" />
              <span className={`text-sm ${theme.textMuted}`}>Losing Trades</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{losingTrades}</div>
          </div>
          <div className={`${theme.card} backdrop-blur-xl rounded-xl p-4 border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className={`text-sm ${theme.textMuted}`}>Total Trades</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{trades.length}</div>
          </div>
          <div className={`${theme.card} backdrop-blur-xl rounded-xl p-4 border ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className={`text-sm ${theme.textMuted}`}>Avg Profit</span>
            </div>
            <div className={`text-2xl font-bold ${closedTrades.length > 0 && totalProfit / closedTrades.length >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${closedTrades.length > 0 ? (totalProfit / closedTrades.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Open Trades */}
        {openTrades.length > 0 && (
          <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-green-400" />
              <h3 className={`text-xl font-semibold ${theme.text}`}>Open Positions</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                {openTrades.length} Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Time</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Pair</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Type</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Volume</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Open Price</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Robot</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                  {openTrades.map((trade) => (
                    <tr key={trade.id} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>
                        {new Date(trade.openTime).toLocaleTimeString()}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${theme.text}`}>{trade.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>{trade.volume}</td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>{trade.openPrice}</td>
                      <td className={`px-4 py-3 text-sm ${theme.textMuted}`}>{trade.robot}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold animate-pulse">
                          OPEN
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Closed Trades */}
        <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-2xl`}>
          <div className="flex items-center gap-3 mb-4">
            <History className="w-6 h-6 text-purple-400" />
            <h3 className={`text-xl font-semibold ${theme.text}`}>Closed Trades</h3>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
              {closedTrades.length} Completed
            </span>
          </div>
          
          {closedTrades.length === 0 ? (
            <div className="text-center py-8">
              <Clock className={`w-12 h-12 ${theme.textMuted} mx-auto mb-3`} />
              <p className={`${theme.textMuted}`}>No closed trades yet. Activate a robot to start trading.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Open Time</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Close Time</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Pair</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Type</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Volume</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Open Price</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Close Price</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Profit/Loss</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Robot</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                  {closedTrades.map((trade) => (
                    <tr key={trade.id} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>
                        {new Date(trade.openTime).toLocaleTimeString()}
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>
                        {new Date(trade.closeTime).toLocaleTimeString()}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${theme.text}`}>{trade.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>{trade.volume}</td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>{trade.openPrice}</td>
                      <td className={`px-4 py-3 text-sm ${theme.text}`}>{trade.closePrice}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme.textMuted}`}>{trade.robot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Robots Selection Page
  const RobotsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Trading Robots
        </h2>
        <div className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'} border border-purple-500/50 rounded-lg`}>
          <Bot className="w-5 h-5 text-purple-400" />
          <span className={`text-sm font-semibold ${theme.text}`}>
            {tradingRobots.length} Robots Available
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tradingRobots.map((robot) => (
          <div
            key={robot.id}
            className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border transition-all cursor-pointer ${
              selectedRobot === robot.id
                ? 'border-purple-500 shadow-2xl shadow-purple-500/30 scale-105'
                : `${theme.border} ${theme.cardHover}`
            }`}
            onClick={() => {
              if (!botActive) {
                setSelectedRobot(robot.id);
                showToast(`${robot.name} selected!`, 'success');
              } else {
                showToast('Stop the current robot before switching', 'warning');
              }
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${robot.color} rounded-lg flex items-center justify-center shadow-lg`}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              {selectedRobot === robot.id && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
                  <span className="text-xs font-bold text-green-400">SELECTED</span>
                </div>
              )}
            </div>

            <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{robot.name}</h3>
            <p className={`text-sm ${theme.textMuted} mb-4`}>{robot.description}</p>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.textMuted}`}>Win Rate</span>
                <span className="text-lg font-bold text-green-400">{robot.winRate}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.textMuted}`}>Strategy</span>
                <span className={`text-sm font-semibold ${theme.text}`}>{robot.strategy}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.textMuted}`}>Timeframe</span>
                <span className={`text-sm font-semibold ${theme.text}`}>{robot.timeframe}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.textMuted}`}>Risk Level</span>
                <span className={`text-sm font-semibold ${
                  robot.riskLevel === 'Low' ? 'text-green-400' :
                  robot.riskLevel === 'Medium' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {robot.riskLevel}
                </span>
              </div>
            </div>

            {selectedRobot === robot.id && (
              <button
                className={`w-full mt-4 py-2 rounded-lg font-semibold bg-gradient-to-r ${robot.color} text-white shadow-lg`}
              >
                ✓ Active Robot
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={`${theme.card} backdrop-blur-xl rounded-2xl p-6 border ${theme.border} shadow-xl`}>
        <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>Robot Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Robot</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Win Rate</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Strategy</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Timeframe</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${theme.text}`}>Risk</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
              {tradingRobots.map((robot) => (
                <tr key={robot.id} className={`${theme.cardHover} transition-colors`}>
                  <td className={`px-4 py-3 ${theme.text} font-semibold`}>{robot.name}</td>
                  <td className="px-4 py-3 text-green-400 font-bold">{robot.winRate}%</td>
                  <td className={`px-4 py-3 ${theme.text}`}>{robot.strategy}</td>
                  <td className={`px-4 py-3 ${theme.text}`}>{robot.timeframe}</td>
                  <td className={`px-4 py-3 font-semibold ${
                    robot.riskLevel === 'Low' ? 'text-green-400' :
                    robot.riskLevel === 'Medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {robot.riskLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Trade History Page
  const TradeHistoryPage = () => (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
        Trade History
      </h2>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Pair</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Entry</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Exit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Profit/Loss</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {tradeHistory.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{trade.date}</td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">{trade.pair}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{trade.entry}</td>
                  <td className="px-6 py-4 text-sm text-white">{trade.exit || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}{trade.profit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.status === 'open' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Settings Page
  const SettingsPage = () => (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
        Settings
      </h2>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Notifications</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-white">Email Notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="w-12 h-6 rounded-full"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-white">Trade Alerts</span>
            <input
              type="checkbox"
              checked={settings.tradeAlerts}
              onChange={(e) => setSettings({...settings, tradeAlerts: e.target.checked})}
              className="w-12 h-6 rounded-full"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-white">Daily Reports</span>
            <input
              type="checkbox"
              checked={settings.dailyReports}
              onChange={(e) => setSettings({...settings, dailyReports: e.target.checked})}
              className="w-12 h-6 rounded-full"
            />
          </label>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Risk Management</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss %</label>
            <input
              type="number"
              value={settings.stopLossPercent}
              onChange={(e) => setSettings({...settings, stopLossPercent: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit %</label>
            <input
              type="number"
              value={settings.takeProfitPercent}
              onChange={(e) => setSettings({...settings, takeProfitPercent: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-6">Security</h3>
        
        <button
          onClick={handle2FASetup}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            twoFAEnabled
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
          }`}
        >
          {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>

        {show2FASetup && (
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
            <p className="text-white mb-2">Enter the code from your authenticator app:</p>
            <input
              type="text"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              placeholder="6-digit code (demo: 123456)"
              className="w-full px-4 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white mb-2"
            />
            <button
              onClick={verify2FACode}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Verify
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSettingsUpdate}
        className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg"
      >
        Save Settings
      </button>
    </div>
  );

  // Profile Page
  const ProfilePage = () => (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
        Profile
      </h2>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{currentUser?.username}</h3>
            <p className="text-gray-400">{currentUser?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({...profile, fullName: e.target.value})}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white disabled:opacity-50"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white disabled:opacity-50"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile({...profile, country: e.target.value})}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white disabled:opacity-50"
              placeholder="Enter country"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Strategy Configuration Page
  const StrategyPage = () => (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
        Strategy Configuration
      </h2>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-4">Select Strategy</h3>
        
        <select
          value={strategy.type}
          onChange={(e) => setStrategy({...strategy, type: e.target.value})}
          className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white mb-4"
        >
          <option value="EMA_CROSSOVER">EMA Crossover</option>
          <option value="RSI">RSI Strategy</option>
          <option value="MACD">MACD Strategy</option>
          <option value="BOLLINGER">Bollinger Bands</option>
        </select>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Fast EMA</label>
            <input
              type="number"
              value={strategy.indicators.ema_fast}
              onChange={(e) => setStrategy({...strategy, indicators: {...strategy.indicators, ema_fast: parseInt(e.target.value)}})}
              className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Slow EMA</label>
            <input
              type="number"
              value={strategy.indicators.ema_slow}
              onChange={(e) => setStrategy({...strategy, indicators: {...strategy.indicators, ema_slow: parseInt(e.target.value)}})}
              className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white"
            />
          </div>
        </div>

        <button
          onClick={() => showToast('Strategy saved successfully!', 'success')}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg"
        >
          Save Strategy
        </button>
      </div>
    </div>
  );

  // Help/FAQ Page
  const HelpPage = () => (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
        Help & FAQ
      </h2>

      <div className="space-y-4">
        {[
          { q: 'How do I connect to MT5?', a: 'Go to Settings and enter your MT5 credentials from your broker.' },
          { q: 'Is my money safe?', a: 'AlgoEdge never holds your funds. All trading happens through your MT5 broker account.' },
          { q: 'What is the minimum deposit?', a: 'The minimum deposit depends on your MT5 broker requirements.' },
          { q: 'Can I use demo account?', a: 'Yes! You can connect any MT5 demo account to test strategies risk-free.' },
          { q: 'How do I enable 2FA?', a: 'Go to Settings > Security and click Enable 2FA.' }
        ].map((faq, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
            <p className="text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <button
          onClick={() => setShowTerms(true)}
          className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all"
        >
          <FileText className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-semibold">Terms of Service</h3>
        </button>

        <button
          onClick={() => setShowPrivacy(true)}
          className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all"
        >
          <Shield className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-semibold">Privacy Policy</h3>
        </button>

        <button
          onClick={() => setShowRiskDisclosure(true)}
          className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all"
        >
          <AlertCircle className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-white font-semibold">Risk Disclosure</h3>
        </button>
      </div>
      
      <button
        onClick={() => setShowPricingModal(true)}
        className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
      >
        View Pricing & Upgrade
      </button>
    </div>
  );

  // Pricing Modal
  const PricingModal = () => {
    if (!showPricingModal) return null;
    
    const plans = [
      {
        name: 'Free',
        price: 0,
        features: ['1 MT5 Connection', 'Basic Strategies', 'Demo Only', 'Community Support'],
        current: subscriptionPlan === 'free'
      },
      {
        name: 'Pro',
        price: 49,
        features: ['3 MT5 Connections', 'All Strategies', 'Live Trading', 'Email Alerts', 'Priority Support'],
        current: subscriptionPlan === 'pro',
        popular: true
      },
      {
        name: 'Enterprise',
        price: 199,
        features: ['Unlimited Connections', 'Custom Strategies', 'API Access', 'White-Label', 'Dedicated Support'],
        current: subscriptionPlan === 'enterprise'
      }
    ];
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Choose Your Plan</h2>
            <button onClick={() => setShowPricingModal(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`relative bg-slate-700/30 rounded-xl p-6 border ${plan.popular ? 'border-purple-500 scale-105' : 'border-purple-500/20'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-purple-400 mb-4">
                  ${plan.price}<span className="text-lg text-gray-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (plan.current) {
                      showToast('You are already on this plan', 'info');
                    } else {
                      showToast(`Upgrade to ${plan.name} - Feature coming soon!`, 'info');
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.current
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : plan.price === 0 ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Legal Document Modal
  const LegalModal = ({ show, onClose, title, content }) => {
    if (!show) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-purple-500/20">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="overflow-y-auto p-6 text-gray-300 space-y-4">
            {content}
          </div>
          <div className="p-6 border-t border-purple-500/20">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Terms of Service Content
  const TermsContent = () => (
    <>
      <h3 className="text-xl font-bold text-white">1. ACCEPTANCE OF TERMS</h3>
      <p>By accessing and using AlgoEdge, you accept and agree to be bound by these terms. Trading involves significant risk of loss.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">2. TRADING RISKS</h3>
      <p>You acknowledge that trading foreign exchange and leveraged products involves risk. You may lose all deposited funds. Past performance does not indicate future results.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">3. NO INVESTMENT ADVICE</h3>
      <p>AlgoEdge does not provide investment advice. The service executes your predefined strategies. You are solely responsible for trading decisions.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">4. LIMITATION OF LIABILITY</h3>
      <p>We are not liable for trading losses. Our total liability shall not exceed fees paid in the last 12 months.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">5. USER RESPONSIBILITIES</h3>
      <p>You agree to provide accurate information, maintain account security, and use the service lawfully.</p>
      
      <p className="text-sm text-gray-500 mt-8">Last Updated: December 7, 2024</p>
    </>
  );

  // Privacy Policy Content
  const PrivacyContent = () => (
    <>
      <h3 className="text-xl font-bold text-white">INFORMATION WE COLLECT</h3>
      <p>We collect: Name, email, trading activity, IP address, device information, and usage data.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">HOW WE USE YOUR DATA</h3>
      <p>To provide service, process transactions, send notifications, improve experience, and comply with legal obligations.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">DATA SECURITY</h3>
      <p>We use SSL/TLS encryption, encrypted password storage, regular security audits, and secure cloud infrastructure.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">YOUR RIGHTS</h3>
      <p>You can access, correct, delete, or export your data. You can opt-out of marketing communications.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">DATA SHARING</h3>
      <p>We share data with service providers (hosting, email, payments). We NEVER sell your personal information.</p>
      
      <p className="text-sm text-gray-500 mt-8">Last Updated: December 7, 2024</p>
    </>
  );

  // Risk Disclosure Content
  const RiskContent = () => (
    <>
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
        <h3 className="text-xl font-bold text-red-400 mb-2">⚠️ IMPORTANT WARNING</h3>
        <p className="text-red-300">Trading forex, CFDs, and leveraged products carries HIGH RISK. You could lose ALL invested capital.</p>
      </div>
      
      <h3 className="text-xl font-bold text-white">LEVERAGE RISK</h3>
      <p>Leverage amplifies profits AND losses. Small market movements can result in large losses exceeding your deposit.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">MARKET RISK</h3>
      <p>Markets are volatile and unpredictable. Economic and political events affect prices. Past performance does not guarantee future results.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">TECHNICAL RISK</h3>
      <p>Internet issues, platform malfunctions, and system bugs may prevent order execution or cause errors.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">AUTOMATED TRADING RISKS</h3>
      <p>Algorithms may malfunction. Strategies may perform poorly. Systems require constant monitoring. No system is foolproof.</p>
      
      <h3 className="text-xl font-bold text-white mt-6">CAPITAL REQUIREMENTS</h3>
      <p className="text-yellow-300 font-semibold">Only trade with money you can afford to lose. Never invest borrowed money or funds needed for living expenses.</p>
      
      <p className="text-sm text-gray-500 mt-8">Last Updated: December 7, 2024</p>
    </>
  );

  // Main Dashboard Layout
  return (
    <div className={`flex h-screen ${theme.bgGradient} ${theme.text}`}>
      <ToastContainer />
      <ConfirmDialog />
      <PricingModal />
      
      {/* Show Terms or Privacy if needed */}
      {showTerms && (
        <TermsOfService onBack={() => setShowTerms(false)} />
      )}
      
      {showPrivacy && (
        <PrivacyPolicy onBack={() => setShowPrivacy(false)} />
      )}
      
      {/* Legal Modals */}
      <LegalModal 
        show={showRiskDisclosure} 
        onClose={() => setShowRiskDisclosure(false)} 
        title="Risk Disclosure" 
        content={<RiskContent />} 
      />
      
      {/* Sidebar */}
      <div className={`w-64 ${theme.sidebar} backdrop-blur-xl border-r ${theme.border} p-6 flex flex-col shadow-2xl`}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              AlgoEdge
            </h1>
          </div>
          <div className="ml-12">
            <p className={`text-sm ${theme.textMuted}`}>Welcome, {currentUser?.username}</p>
            {wsConnected && (
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'dashboard' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <Activity className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setCurrentPage('robots')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'robots' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <Bot className="w-5 h-5" />
            Robots
          </button>
          
          <button 
            onClick={() => setCurrentPage('trades')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'trades' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Live Trades
          </button>
          
          <button 
            onClick={() => setCurrentPage('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'history' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <History className="w-5 h-5" />
            Trade History
          </button>
          
          <button 
            onClick={() => setCurrentPage('strategy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'strategy' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <Target className="w-5 h-5" />
            Strategy
          </button>
          
          <button 
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'settings' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'profile' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
          
          <button 
            onClick={() => setCurrentPage('help')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              currentPage === 'help' 
                ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} ${theme.cardHover}`
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            Help & FAQ
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${theme.textMuted} ${theme.cardHover}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${theme.error} hover:bg-red-900/20 transition-all`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
};

export default AlgoEdge;
