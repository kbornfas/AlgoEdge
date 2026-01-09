import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const META_API_TOKEN = process.env.METAAPI_TOKEN;

// Cache for MetaAPI connections to avoid reconnecting every request
const mt5Connections = new Map();

// Import MetaAPI SDK
let MetaApi;
let api;

async function initMetaApi() {
  if (!META_API_TOKEN) {
    console.error('METAAPI_TOKEN not configured');
    return false;
  }
  
  try {
    const { default: MetaApiClass } = await import('metaapi.cloud-sdk/esm-node');
    MetaApi = MetaApiClass;
    api = new MetaApi(META_API_TOKEN);
    console.log('✅ MT5Routes: MetaAPI SDK initialized');
    return true;
  } catch (err) {
    console.error('❌ MT5Routes: Failed to load MetaAPI SDK:', err.message);
    return false;
  }
}

// Initialize on load
initMetaApi();

// Health check for MT5 routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    route: 'mt5', 
    metaApiConfigured: !!META_API_TOKEN, 
    sdkLoaded: !!api 
  });
});

/**
 * POST /api/mt5/provision
 * Backend provisioning of MetaAPI accounts using SDK
 */
router.post('/provision', authenticate, async (req, res) => {
  console.log('=== MT5 Provision Request ===');
  
  if (!api) {
    // Try to initialize again
    await initMetaApi();
    if (!api) {
      console.error('MetaAPI SDK not initialized');
      return res.status(500).json({ error: 'MetaAPI SDK not initialized. Contact admin.' });
    }
  }

  const { accountId, password, server } = req.body;
  
  if (!accountId || !password || !server) {
    return res.status(400).json({ error: 'Missing accountId, password, or server' });
  }

  console.log('User:', req.user.id);
  console.log('Account:', accountId);
  console.log('Server:', server);

  try {
    // Check for existing account using SDK
    console.log('Checking for existing MetaAPI account...');
    
    // The SDK method is getAccounts() on metatraderAccountApi
    // But we need to handle both old and new SDK versions
    let accounts = [];
    try {
      if (typeof api.metatraderAccountApi.getAccounts === 'function') {
        accounts = await api.metatraderAccountApi.getAccounts();
      } else if (typeof api.metatraderAccountApi.getAccountsWithInfiniteScrollPagination === 'function') {
        const result = await api.metatraderAccountApi.getAccountsWithInfiniteScrollPagination();
        accounts = result.items || [];
      } else {
        // Try to list accounts differently
        console.log('Available methods:', Object.keys(api.metatraderAccountApi));
        throw new Error('Cannot find method to list accounts');
      }
    } catch (listErr) {
      console.log('Error listing accounts, trying to create directly:', listErr.message);
      accounts = [];
    }
    
    console.log('Found', accounts.length, 'existing accounts');

    // Look for matching account
    const existingAccount = accounts.find((acc) =>
      String(acc.login) === String(accountId) && acc.server === server
    );

    if (existingAccount) {
      console.log('Found existing account:', existingAccount.id, 'state:', existingAccount.state);
      
      // Deploy if needed
      if (existingAccount.state !== 'DEPLOYED') {
        console.log('Deploying existing account...');
        await existingAccount.deploy();
        await existingAccount.waitDeployed();
        console.log('Account deployed');
      }
      
      return res.json({ success: true, metaApiAccountId: existingAccount.id });
    }

    // Create new account using SDK
    console.log('Creating new MetaAPI account...');
    const newAccount = await api.metatraderAccountApi.createAccount({
      name: `AlgoEdge_${accountId}`,
      type: 'cloud',
      login: accountId,
      password,
      server,
      platform: 'mt5',
      magic: 123456,
    });
    console.log('Account created:', newAccount.id);

    // Deploy and wait
    console.log('Deploying new account...');
    await newAccount.deploy();
    
    console.log('Waiting for deployment...');
    await newAccount.waitDeployed();
    console.log('Account deployed successfully');

    return res.json({ success: true, metaApiAccountId: newAccount.id });
    
  } catch (error) {
    console.error('MT5 provision error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mt5/account-info/:accountId
 * Get account balance and equity from MetaAPI using SDK
 */
router.get('/account-info/:accountId', authenticate, async (req, res) => {
  if (!api) {
    await initMetaApi();
    if (!api) {
      return res.status(500).json({ error: 'MetaAPI SDK not initialized' });
    }
  }

  const { accountId } = req.params;

  try {
    console.log('Fetching account info for:', accountId);
    
    // Get account from SDK
    const account = await api.metatraderAccountApi.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Ensure deployed and connected to broker
    if (account.state !== 'DEPLOYED') {
      console.log('Account not deployed, deploying...');
      await account.deploy();
    }
    
    // Wait for deployment and broker connection with timeout
    console.log('Waiting for account deployment and broker connection...');
    await account.waitDeployed();
    
    // Wait for connection to broker (this is the key step)
    const connectionStatus = account.connectionStatus;
    if (connectionStatus !== 'CONNECTED') {
      console.log('Account connection status:', connectionStatus, '- waiting for connection...');
      await account.waitConnected();
    }
    
    // Get RPC connection
    const connection = account.getRPCConnection();
    await connection.connect();
    
    // Wait for synchronization with timeout handling
    try {
      await connection.waitSynchronized({ timeoutInSeconds: 30 });
    } catch (syncError) {
      console.log('Sync timeout, trying to get info anyway...');
    }
    
    // Get account info
    const info = await connection.getAccountInformation();
    console.log('Account info:', { balance: info.balance, equity: info.equity });

    return res.json({
      balance: info.balance || 0,
      equity: info.equity || info.balance || 0,
    });
  } catch (error) {
    console.error('Account info error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mt5/positions/:accountId
 * Get live open positions with current prices from MetaAPI
 * ALWAYS fetches fresh data from MetaAPI connection
 * @param accountId - Can be either MetaAPI account ID or database account ID
 */
router.get('/positions/:accountId', authenticate, async (req, res) => {
  // Set no-cache headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  if (!api) {
    await initMetaApi();
    if (!api) {
      return res.status(500).json({ error: 'MetaAPI SDK not initialized' });
    }
  }

  const { accountId } = req.params;

  try {
    // Try to find cached connection by checking both metaApiAccountId and database accountId
    let connection = null;
    let cachedInfo = null;
    
    // Method 1: Direct lookup by accountId (could be metaApiAccountId)
    if (mt5Connections.has(accountId)) {
      cachedInfo = mt5Connections.get(accountId);
      connection = cachedInfo?.connection;
    }
    
    // Method 2: Search through all connections to find by metaApiId
    if (!connection) {
      for (const [key, data] of mt5Connections.entries()) {
        if (data.metaApiId === accountId) {
          connection = data.connection;
          cachedInfo = data;
          break;
        }
      }
    }
    
    // Use cached connection if available
    if (connection) {
      try {
        // Always get fresh positions and account info
        const positions = await connection.getPositions();
        const info = await connection.getAccountInformation();
        
        console.log(`[${new Date().toISOString()}] Positions for ${accountId}: ${positions.length} positions, Balance: $${info.balance}, Equity: $${info.equity}`);
        
        return res.json({
          positions: positions.map(p => ({
            id: p.id,
            symbol: p.symbol,
            type: p.type?.toUpperCase() || 'BUY',
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit || p.unrealizedProfit || 0,
            swap: p.swap || 0,
            commission: p.commission || 0,
            openTime: p.time,
            stopLoss: p.stopLoss,
            takeProfit: p.takeProfit,
            comment: p.comment,
          })),
          account: {
            balance: info.balance || 0,
            equity: info.equity || 0,
            margin: info.margin || 0,
            freeMargin: info.freeMargin || 0,
            profit: info.profit || (info.equity - info.balance) || 0,
          },
          timestamp: Date.now(),
        });
      } catch (cacheErr) {
        console.log('Cached connection failed:', cacheErr.message);
      }
    }
    
    // Fallback: Get fresh connection via MetaAPI SDK
    console.log('Creating fresh connection for:', accountId);
    const account = await api.metatraderAccountApi.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Ensure deployed
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
    }
    await account.waitDeployed();
    
    // Get RPC connection
    const newConnection = account.getRPCConnection();
    await newConnection.connect();
    
    // Quick sync with short timeout
    try {
      await newConnection.waitSynchronized({ timeoutInSeconds: 5 });
    } catch (syncError) {
      console.log('Sync timeout, continuing...');
    }
    
    // Cache this connection for future use
    mt5Connections.set(accountId, { 
      connection: newConnection, 
      account, 
      metaApiId: accountId,
      lastUsed: Date.now() 
    });
    
    const info = await newConnection.getAccountInformation();
    const positions = await newConnection.getPositions();
    
    console.log(`Fresh positions for ${accountId}: ${positions.length} positions, Balance: $${info.balance}`);

    return res.json({
      positions: positions.map(p => ({
        id: p.id,
        symbol: p.symbol,
        type: p.type?.toUpperCase() || 'BUY',
        volume: p.volume,
        openPrice: p.openPrice,
        currentPrice: p.currentPrice,
        profit: p.profit || p.unrealizedProfit || 0,
        swap: p.swap || 0,
        commission: p.commission || 0,
        openTime: p.time,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
        comment: p.comment,
      })),
      account: {
        balance: info.balance || 0,
        equity: info.equity || 0,
        margin: info.margin || 0,
        freeMargin: info.freeMargin || 0,
        profit: info.profit || 0,
      },
    });
  } catch (error) {
    console.error('Positions error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mt5/close-robot-trades
 * Close all open trades for a specific robot
 */
router.post('/close-robot-trades', authenticate, async (req, res) => {
  if (!api) {
    await initMetaApi();
    if (!api) {
      return res.status(500).json({ error: 'MetaAPI SDK not initialized' });
    }
  }

  const { metaApiAccountId, robotId } = req.body;

  if (!metaApiAccountId) {
    return res.status(400).json({ error: 'Missing metaApiAccountId' });
  }

  try {
    console.log(`Closing all trades for robot: ${robotId || 'ALL'}`);
    
    // Get account from SDK
    const account = await api.metatraderAccountApi.getAccount(metaApiAccountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Ensure deployed
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
      await account.waitDeployed();
    }
    
    // Get RPC connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    
    // Get open positions
    const positions = await connection.getPositions();
    console.log('Found', positions.length, 'open positions');

    // Filter positions by robot if specified (using magic number or comment)
    let positionsToClose = positions;
    if (robotId) {
      positionsToClose = positions.filter(p => 
        p.comment?.includes(robotId) || 
        p.clientId?.includes(robotId)
      );
      console.log(`Filtered to ${positionsToClose.length} positions for robot ${robotId}`);
    }

    let closed = 0;
    const errors = [];

    // Close each position
    for (const position of positionsToClose) {
      try {
        console.log(`Closing position ${position.id}: ${position.symbol} ${position.type}`);
        
        // Close the position
        const closeResult = await connection.closePosition(position.id);
        
        if (closeResult) {
          closed++;
          console.log(`✅ Closed position ${position.id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to close position ${position.id}:`, err.message);
        errors.push(`${position.symbol}: ${err.message}`);
      }
    }

    return res.json({
      message: `Closed ${closed} of ${positionsToClose.length} positions`,
      closed,
      total: positionsToClose.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Close trades error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mt5/close-all-trades
 * Close ALL open trades for an account (used by Stop All)
 */
router.post('/close-all-trades', authenticate, async (req, res) => {
  if (!api) {
    await initMetaApi();
    if (!api) {
      return res.status(500).json({ error: 'MetaAPI SDK not initialized' });
    }
  }

  const { metaApiAccountId } = req.body;

  if (!metaApiAccountId) {
    return res.status(400).json({ error: 'Missing metaApiAccountId' });
  }

  try {
    console.log('Closing ALL trades for account:', metaApiAccountId);
    
    // Get account from SDK
    const account = await api.metatraderAccountApi.getAccount(metaApiAccountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Ensure deployed
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
      await account.waitDeployed();
    }
    
    // Get RPC connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    
    // Get open positions
    const positions = await connection.getPositions();
    console.log('Found', positions.length, 'positions to close');

    let closed = 0;
    const errors = [];

    // Close ALL positions
    for (const position of positions) {
      try {
        console.log(`Closing position ${position.id}: ${position.symbol} ${position.type}`);
        await connection.closePosition(position.id);
        closed++;
        console.log(`✅ Closed position ${position.id}`);
      } catch (err) {
        console.error(`❌ Failed to close position ${position.id}:`, err.message);
        errors.push(`${position.symbol}: ${err.message}`);
      }
    }

    return res.json({
      message: `Closed ${closed} of ${positions.length} positions`,
      closed,
      total: positions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Close all trades error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mt5/history/:accountId
 * Get trade history (closed deals) from MetaAPI
 */
router.get('/history/:accountId', authenticate, async (req, res) => {
  if (!api) {
    await initMetaApi();
    if (!api) {
      return res.status(500).json({ error: 'MetaAPI SDK not initialized' });
    }
  }

  const { accountId } = req.params;
  const { startTime, endTime } = req.query;

  try {
    console.log('Fetching trade history for:', accountId);
    
    // Get account from SDK
    const account = await api.metatraderAccountApi.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Ensure deployed
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
      await account.waitDeployed();
    }
    
    // Get streaming connection for history access
    const connection = account.getStreamingConnection();
    await connection.connect();
    await connection.waitSynchronized();
    
    // Calculate time range (default: last 30 days)
    const now = new Date();
    const start = startTime ? new Date(startTime) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime) : now;
    
    // Get history deals from terminal state
    const historyStorage = connection.historyStorage;
    const deals = historyStorage.deals || [];
    console.log('Found', deals.length, 'deals in history');
    
    // Filter to only include entry/exit deals (not balance operations)
    const tradeDeals = deals.filter(d => 
      d.type === 'DEAL_TYPE_BUY' || 
      d.type === 'DEAL_TYPE_SELL'
    );
    
    // Map to trade format
    const trades = tradeDeals.map(deal => ({
      id: deal.id,
      symbol: deal.symbol,
      type: deal.type?.includes('BUY') ? 'BUY' : 'SELL',
      volume: deal.volume,
      price: deal.price,
      profit: deal.profit || 0,
      commission: deal.commission || 0,
      swap: deal.swap || 0,
      time: deal.time,
      positionId: deal.positionId,
      comment: deal.comment,
      entryType: deal.entryType, // DEAL_ENTRY_IN or DEAL_ENTRY_OUT
    }));

    return res.json({
      trades,
      count: trades.length,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  } catch (error) {
    console.error('Trade history error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
