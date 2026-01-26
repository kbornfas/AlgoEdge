import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    // Validate token format - must be a valid JWT (has 3 parts separated by dots)
    if (!token || token === 'undefined' || token === 'null' || !token.includes('.')) {
      return NextResponse.json({ 
        wallet: { balance: 0 },
        error: 'No valid token provided'
      }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Log error on server side only
      console.error('[Wallet Balance Error]:', response.status);
      return NextResponse.json({ 
        wallet: { balance: 0 }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // Log detailed error on server side only
    console.error('[Wallet Balance Error]:', error.message || error);
    return NextResponse.json({ 
      wallet: { balance: 0 }
    });
  }
}
