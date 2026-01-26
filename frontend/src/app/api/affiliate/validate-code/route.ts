import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/affiliate/validate-code
 * Validate a referral code (public endpoint)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    const response = await fetch(`${backendUrl}/api/affiliate/validate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: body.code,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Validate Code Error]:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
