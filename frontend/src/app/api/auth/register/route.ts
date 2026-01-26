import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register
 * Proxy to backend authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    // Create username from first and last name
    const firstName = body.firstName?.trim() || '';
    const lastName = body.lastName?.trim() || '';
    const username = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : body.email?.split('@')[0] || 'user';
    
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        firstName: firstName,
        lastName: lastName,
        email: body.email,
        password: body.password,
        referralCode: body.referralCode || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
