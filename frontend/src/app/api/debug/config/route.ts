import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || process.env.API_URL;
  
  const result: any = {
    backendUrl: BACKEND_URL || 'NOT SET',
    hasMetaApiToken: !!process.env.METAAPI_TOKEN,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };
  
  // Test backend connectivity
  if (BACKEND_URL) {
    try {
      const backendUrl = BACKEND_URL.replace(/\/$/, '');
      const resp = await fetch(`${backendUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      result.backendReachable = resp.ok;
      result.backendStatus = resp.status;
      if (resp.ok) {
        result.backendHealth = await resp.json();
      }
    } catch (err: any) {
      result.backendReachable = false;
      result.backendError = err.message;
    }
    
    // Test MT5 route
    try {
      const backendUrl = BACKEND_URL.replace(/\/$/, '');
      const resp = await fetch(`${backendUrl}/api/mt5/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      result.mt5RouteReachable = resp.ok;
      if (resp.ok) {
        result.mt5Health = await resp.json();
      }
    } catch (err: any) {
      result.mt5RouteReachable = false;
      result.mt5Error = err.message;
    }
  }
  
  return NextResponse.json(result);
}
