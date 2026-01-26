import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Proxy to backend authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    console.log('[Login] Attempting login to:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: body.email,
        password: body.password,
        twoFACode: body.twoFactorCode,
      }),
    });

    console.log('[Login] Backend response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.log('[Login] Login failed:', data.error);
      // Return user-friendly error messages
      const userFriendlyError = {
        ...data,
        error: data.error || 'Login failed. Please check your credentials.',
      };
      return NextResponse.json(userFriendlyError, { status: response.status });
    }

    console.log('[Login] Login successful for user:', data.user?.email);
    return NextResponse.json(data);
  } catch (error: any) {
    // Log detailed error on server side only
    console.error('[Login API Error]:', error.message || error);
    
    // Return user-friendly message to frontend
    return NextResponse.json(
      { error: 'Unable to connect to server. Please try again later.' },
      { status: 500 }
    );
  }
}
