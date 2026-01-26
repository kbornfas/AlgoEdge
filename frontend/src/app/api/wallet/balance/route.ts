import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        wallet: { balance: 0 },
        error: 'No token provided'
      }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch wallet balance:', response.status);
      return NextResponse.json({ 
        wallet: { balance: 0 }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ 
      wallet: { balance: 0 }
    });
  }
}
