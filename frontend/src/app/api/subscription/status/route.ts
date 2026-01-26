import { NextRequest, NextResponse } from 'next/server';

// Use backend URL from env, fallback to common ports
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or authorization header
    const authHeader = request.headers.get('authorization');
    let token = request.cookies.get('auth_token')?.value;
    
    // Extract token from Bearer header if present
    if (!token && authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    }

    // Validate token format - must be a valid JWT (has 3 parts separated by dots)
    if (!token || token === 'undefined' || token === 'null' || !token.includes('.')) {
      console.log('No valid token provided for subscription status check');
      return NextResponse.json({ 
        status: 'trial', 
        plan: null, 
        expiresAt: null, 
        isActive: false 
      });
    }

    console.log('Calling backend subscription status at:', `${API_URL}/api/whop/subscription/status`);
    
    const response = await fetch(`${API_URL}/api/whop/subscription/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend subscription status error:', response.status, await response.text().catch(() => 'no body'));
      return NextResponse.json({ 
        status: 'trial', 
        plan: null, 
        expiresAt: null, 
        isActive: false 
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    // Return safe default instead of throwing
    return NextResponse.json({ 
      status: 'trial', 
      plan: null, 
      expiresAt: null, 
      isActive: false 
    });
  }
}
