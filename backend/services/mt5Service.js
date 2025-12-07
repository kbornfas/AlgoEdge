import pool from '../config/database.js';
import MetaApi from 'metaapi.cloud-sdk';
import {
  emitMT5Status,
  emitBalanceUpdate,
  emitNewTrade,
  emitTradeClosed,
} from './websocketService.js';

/**
 * MT5 Integration Service with MetaAPI
 * 
 * This service uses MetaApi.cloud to connect to real MetaTrader 5 brokers.
 * Features:
 * - Real-time market data streaming
 * - Trade execution (market/limit/stop orders)
 * - Account balance synchronization
 * - Position management
 * - Historical data access
 */

// Initialize MetaAPI
const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

// Store active MT5 connections
const mt5Connections = new Map();
const metaApiAccounts = new Map();

// Connect to MT5 Account
export const connectMT5Account = async (accountId, login, password, server) => {
  try {
    console.log(`Connecting to MT5 account ${login} on ${server}...`);
    
    // Check if account already exists in MetaAPI
    let metaApiAccount;
    const accounts = await api.metatraderAccountApi.getAccounts();
    const existingAccount = accounts.find(acc => acc.login === login && acc.server === server);
    
    if (existingAccount) {
      console.log(`Found existing MetaAPI account: ${existingAccount.id}`);
      metaApiAccount = existingAccount;
    } else {
      // Create new MetaAPI account
      console.log('Creating new MetaAPI account...');
      metaApiAccount = await api.metatraderAccountApi.createAccount({
        name: `AlgoEdge_${login}`,
        type: 'cloud',
        login: login,
        password: password,
        server: server,
        platform: 'mt5',
        magic: 123456, // Your EA magic number
      });
      console.log(`MetaAPI account created: ${metaApiAccount.id}`);
    }
    
    // Deploy account
    await metaApiAccount.deploy();
    console.log('Waiting for deployment...');
    await metaApiAccount.waitDeployed();
    
    // Connect to terminal
    console.log('Connecting to terminal...');
    const connection = metaApiAccount.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    
    console.log('Successfully connected to MT5!');
    
    // Get account information
    const accountInfo = await connection.getAccountInformation();
    
    const connectionData = {
      accountId,
      login,
      server,
      metaApiId: metaApiAccount.id,
      connected: true,
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      lastUpdate: new Date(),
      connection,
    };

    mt5Connections.set(accountId, connectionData);
    metaApiAccounts.set(accountId, metaApiAccount);

    // Update database
    await pool.query(
      'UPDATE mt5_accounts SET status = $1, balance = $2, last_sync = CURRENT_TIMESTAMP WHERE id = $3',
      ['connected', accountInfo.balance, accountId]
    );

    // Get user_id for this account
    const result = await pool.query(
      'SELECT user_id FROM mt5_accounts WHERE id = $1',
      [accountId]
    );

    if (result.rows.length > 0) {
      emitMT5Status(result.rows[0].user_id, accountId, 'connected');
      emitBalanceUpdate(result.rows[0].user_id, {
        accountId,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
      });
    }

    console.log(`MT5 account ${accountId} connected with balance: $${accountInfo.balance}`);
    return connectionData;
  } catch (error) {
    console.error('MT5 connection error:', error);
    
    // Update database with error status
    await pool.query(
      'UPDATE mt5_accounts SET status = $1 WHERE id = $2',
      ['error', accountId]
    );
    
    throw new Error(`Failed to connect to MT5: ${error.message}`);
  }
};

// Disconnect MT5 Account
export const disconnectMT5Account = async (accountId) => {
  try {
    const connectionData = mt5Connections.get(accountId);
    
    if (connectionData && connectionData.connection) {
      // Close MetaAPI connection
      await connectionData.connection.close();
    }
    
    const metaApiAccount = metaApiAccounts.get(accountId);
    if (metaApiAccount) {
      // Undeploy account to save resources
      await metaApiAccount.undeploy();
    }

    mt5Connections.delete(accountId);
    metaApiAccounts.delete(accountId);

    await pool.query(
      'UPDATE mt5_accounts SET status = $1 WHERE id = $2',
      ['disconnected', accountId]
    );

    const result = await pool.query(
      'SELECT user_id FROM mt5_accounts WHERE id = $1',
      [accountId]
    );

    if (result.rows.length > 0) {
      emitMT5Status(result.rows[0].user_id, accountId, 'disconnected');
    }

    console.log(`MT5 account ${accountId} disconnected`);
  } catch (error) {
    console.error('MT5 disconnection error:', error);
    throw error;
  }
};

// Get Account Balance
export const getAccountBalance = async (accountId) => {
  try {
    const connectionData = mt5Connections.get(accountId);
    if (!connectionData || !connectionData.connection) {
      throw new Error('MT5 account not connected');
    }

    // Get real balance from MetaAPI
    const accountInfo = await connectionData.connection.getAccountInformation();

    return {
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      margin: accountInfo.margin,
      freeMargin: accountInfo.freeMargin,
      leverage: accountInfo.leverage,
      profit: accountInfo.profit,
    };
  } catch (error) {
    console.error('Get balance error:', error);
    throw error;
  }
};

// Sync account balance and emit update
export const syncAccountBalance = async (accountId) => {
  try {
    const balance = await getAccountBalance(accountId);
    
    await pool.query(
      'UPDATE mt5_accounts SET balance = $1, last_sync = CURRENT_TIMESTAMP WHERE id = $2',
      [balance.balance, accountId]
    );

    const result = await pool.query(
      'SELECT user_id FROM mt5_accounts WHERE id = $1',
      [accountId]
    );

    if (result.rows.length > 0) {
      emitBalanceUpdate(result.rows[0].user_id, {
        accountId,
        balance: balance.balance,
        equity: balance.equity,
      });
    }

    return balance;
  } catch (error) {
    console.error('Sync balance error:', error);
    throw error;
  }
};

// Open Trade
export const openTrade = async (accountId, robotId, symbol, orderType, volume, stopLoss, takeProfit) => {
  try {
    const connectionData = mt5Connections.get(accountId);
    if (!connectionData || !connectionData.connection) {
      throw new Error('MT5 account not connected');
    }

    // Place real order via MetaAPI
    const result = await connectionData.connection.createMarketOrder(
      symbol,
      volume,
      orderType,
      stopLoss,
      takeProfit
    );

    console.log('Trade result:', result);

    // Get user_id
    const accountResult = await pool.query(
      'SELECT user_id FROM mt5_accounts WHERE id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('MT5 account not found');
    }

    const userId = accountResult.rows[0].user_id;

    // Insert trade into database
    const tradeResult = await pool.query(
      `INSERT INTO trades (user_id, mt5_account_id, robot_id, symbol, order_type, volume, 
       open_price, stop_loss, take_profit, mt5_ticket, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')
       RETURNING *`,
      [userId, accountId, robotId, symbol, orderType, volume, result.price, stopLoss, takeProfit, result.orderId]
    );

    const trade = tradeResult.rows[0];

    // Emit real-time update
    emitNewTrade(userId, trade);

    console.log(`Real trade opened: ${result.orderId} for user ${userId}`);
    return trade;
  } catch (error) {
    console.error('Open trade error:', error);
    throw error;
  }
};

// Close Trade
export const closeTrade = async (tradeId) => {
  try {
    // Get trade details
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND status = $2',
      [tradeId, 'open']
    );

    if (tradeResult.rows.length === 0) {
      throw new Error('Trade not found or already closed');
    }

    const trade = tradeResult.rows[0];
    const connectionData = mt5Connections.get(trade.mt5_account_id);

    if (!connectionData || !connectionData.connection) {
      throw new Error('MT5 account not connected');
    }

    // Close real trade via MetaAPI
    const result = await connectionData.connection.closePosition(trade.mt5_ticket);
    
    console.log('Close trade result:', result);

    // Get current position to calculate profit
    const positions = await connectionData.connection.getPositions();
    const position = positions.find(p => p.id === trade.mt5_ticket);
    
    let closePrice, profit;
    
    if (position) {
      closePrice = position.currentPrice;
      profit = position.profit;
    } else {
      // Position already closed, use result data
      closePrice = result.price || trade.open_price;
      profit = trade.order_type === 'buy'
        ? (closePrice - trade.open_price) * trade.volume * 100000
        : (trade.open_price - closePrice) * trade.volume * 100000;
    }

    // Update trade
    const updatedTradeResult = await pool.query(
      `UPDATE trades 
       SET status = 'closed', close_price = $1, profit = $2, closed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [closePrice, profit, tradeId]
    );

    const closedTrade = updatedTradeResult.rows[0];

    // Emit real-time update
    emitTradeClosed(trade.user_id, closedTrade);

    console.log(`Real trade closed: ${trade.mt5_ticket} with profit: $${profit}`);
    return closedTrade;
  } catch (error) {
    console.error('Close trade error:', error);
    throw error;
  }
};

// Get Open Positions
export const getOpenPositions = async (accountId) => {
  try {
    const connectionData = mt5Connections.get(accountId);
    if (!connectionData || !connectionData.connection) {
      throw new Error('MT5 account not connected');
    }

    // Get real positions from MetaAPI
    const positions = await connectionData.connection.getPositions();
    
    console.log(`Retrieved ${positions.length} open positions for account ${accountId}`);

    return positions;
  } catch (error) {
    console.error('Get positions error:', error);
    throw error;
  }
};

// Initialize MT5 connections on server start
export const initializeMT5Connections = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM mt5_accounts WHERE status = $1',
      ['connected']
    );

    for (const account of result.rows) {
      try {
        await connectMT5Account(
          account.id,
          account.mt5_login,
          account.mt5_password,
          account.mt5_server
        );
      } catch (error) {
        console.error(`Failed to reconnect MT5 account ${account.id}:`, error);
      }
    }

    console.log(`Initialized ${result.rows.length} MT5 connections`);
  } catch (error) {
    console.error('Initialize MT5 connections error:', error);
  }
};

// Periodic balance sync (run every 5 minutes)
export const startBalanceSyncScheduler = () => {
  setInterval(async () => {
    for (const [accountId, connection] of mt5Connections) {
      if (connection.connected) {
        try {
          await syncAccountBalance(accountId);
        } catch (error) {
          console.error(`Failed to sync balance for account ${accountId}:`, error);
        }
      }
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('Balance sync scheduler started');
};

export default {
  connectMT5Account,
  disconnectMT5Account,
  getAccountBalance,
  syncAccountBalance,
  openTrade,
  closeTrade,
  getOpenPositions,
  initializeMT5Connections,
  startBalanceSyncScheduler,
};
