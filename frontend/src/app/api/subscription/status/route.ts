import { NextRequest, NextResponse } from 'next/server';

// Use backend URL from env, fallback to common ports
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or authorization header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        status: 'trial', 
        plan: null, 
        expiresAt: null, 
        isActive: false 
      });
    }

    const response = await fetch(`${API_URL}/api/whop/subscription/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch subscription status:', response.status);
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
    return NextResponse.json({ 
      status: 'trial', 
      plan: null, 
      expiresAt: null, 
      isActive: false 
    });
  }
}
