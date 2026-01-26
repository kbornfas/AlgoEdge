import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/otp/verify
 * Proxy to backend to verify OTP code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const response = await fetch(`${backendUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        code: body.code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Return the token and user data from backend
    return NextResponse.json({
      message: 'Email verified successfully',
      token: data.token,
      user: data.user || {
        email: body.email,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('[OTP Verify Error]:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
