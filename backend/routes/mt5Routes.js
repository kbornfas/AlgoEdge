import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.ai';
const META_API_TOKEN = process.env.METAAPI_TOKEN;

// Helper: fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log(`[fetch] ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, signal: controller.signal });
    console.log(`[fetch] ${response.status} ${response.statusText}`);
    return response;
  } catch (err) {
    console.error(`[fetch] Failed on ${url}:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper: ensure response is OK
async function ensureOk(response, context) {
  if (response.ok) return;
  let body;
  try {
    const text = await response.text();
    try {
      body = JSON.parse(text || '{}');
    } catch {
      body = text;
    }
  } catch {}
  const detail = typeof body === 'string' ? body : body?.message || body?.error || JSON.stringify(body || {});
  throw new Error(`${context} failed: HTTP ${response.status}${detail ? ` - ${detail}` : ''}`);
}

/**
 * POST /api/mt5/provision
 * Backend provisioning of MetaAPI accounts (more reliable than frontend)
 */
router.post('/provision', authenticate, async (req, res) => {
  console.log('=== MT5 Provision Request ===');
  
  if (!META_API_TOKEN) {
    console.error('METAAPI_TOKEN not configured on backend');
    return res.status(500).json({ error: 'MetaAPI token not configured on backend. Contact admin.' });
  }

  const { accountId, password, server } = req.body;
  
  if (!accountId || !password || !server) {
    return res.status(400).json({ error: 'Missing accountId, password, or server' });
  }

  console.log('User:', req.user.id);
  console.log('Account:', accountId);
  console.log('Server:', server);

  const headers = {
    'auth-token': META_API_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    // Check for existing account
    console.log('Checking for existing MetaAPI account...');
    const listResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts`, { headers });
    await ensureOk(listResponse, 'List accounts');
    const accounts = await listResponse.json();
    console.log('Found', accounts.length, 'existing accounts');

    // Look for matching account
    const existingAccount = accounts.find((acc) =>
      String(acc.login) === String(accountId) && acc.server === server
    );

    if (existingAccount) {
      console.log('Found existing account:', existingAccount._id);
      
      // Deploy if needed
      if (existingAccount.state !== 'DEPLOYED') {
        console.log('Deploying existing account...');
        const deployResp = await fetchWithTimeout(
          `${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}/deploy`,
          { method: 'POST', headers }
        );
        await ensureOk(deployResp, 'Deploy');
        
        // Wait for deployment
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const statusResp = await fetchWithTimeout(
            `${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}`,
            { headers }
          );
          await ensureOk(statusResp, 'Status check');
          const status = await statusResp.json();
          console.log('Deployment status:', status.state, status.connectionStatus);
          if (status.state === 'DEPLOYED' && status.connectionStatus === 'CONNECTED') {
            break;
          }
        }
      }
      
      return res.json({ success: true, metaApiAccountId: existingAccount._id });
    }

    // Create new account
    console.log('Creating new MetaAPI account...');
    const createResp = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        login: accountId,
        password,
        server,
        platform: 'mt5',
        application: 'MetaApi',
        reliability: 'high',
      }),
    });
    await ensureOk(createResp, 'Create account');
    const createData = await createResp.json();
    console.log('Account created:', createData.id);

    // Deploy
    console.log('Deploying new account...');
    const deployResp = await fetchWithTimeout(
      `${PROVISIONING_API_URL}/users/current/accounts/${createData.id}/deploy`,
      { method: 'POST', headers }
    );
    await ensureOk(deployResp, 'Deploy');

    // Wait for deployment
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResp = await fetchWithTimeout(
        `${PROVISIONING_API_URL}/users/current/accounts/${createData.id}`,
        { headers }
      );
      await ensureOk(statusResp, 'Status check');
      const status = await statusResp.json();
      console.log('Deployment status:', status.state, status.connectionStatus);
      
      if (status.state === 'DEPLOYED' && status.connectionStatus === 'CONNECTED') {
        return res.json({ success: true, metaApiAccountId: createData.id });
      }
      
      if (status.state === 'DEPLOY_FAILED') {
        return res.status(400).json({ error: 'Deployment failed. Verify MT5 credentials and server name.' });
      }
    }

    // Even if not fully connected yet, return success
    return res.json({ success: true, metaApiAccountId: createData.id });
    
  } catch (error) {
    console.error('MT5 provision error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mt5/account-info/:accountId
 * Get account balance and equity from MetaAPI
 */
router.get('/account-info/:accountId', authenticate, async (req, res) => {
  if (!META_API_TOKEN) {
    return res.status(500).json({ error: 'MetaAPI token not configured' });
  }

  const { accountId } = req.params;
  const headers = {
    'auth-token': META_API_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    // Get account details for region
    console.log('Fetching account info for:', accountId);
    const accountResp = await fetchWithTimeout(
      `${PROVISIONING_API_URL}/users/current/accounts/${accountId}`,
      { headers }
    );
    await ensureOk(accountResp, 'Get account');
    const accountData = await accountResp.json();
    const region = accountData.region || 'vint-hill';

    const regionMap = {
      'vint-hill': 'https://mt-client-api-v1.vint-hill.agiliumtrade.ai',
      'new-york': 'https://mt-client-api-v1.new-york.agiliumtrade.ai',
      'london': 'https://mt-client-api-v1.london.agiliumtrade.ai',
      'singapore': 'https://mt-client-api-v1.singapore.agiliumtrade.ai',
    };
    const clientApiUrl = regionMap[region] || regionMap['vint-hill'];
    console.log('Region:', region, 'URL:', clientApiUrl);

    // Get account info
    const infoResp = await fetchWithTimeout(
      `${clientApiUrl}/users/current/accounts/${accountId}/account-information`,
      { headers }
    );
    await ensureOk(infoResp, 'Get account info');
    const info = await infoResp.json();
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

export default router;
