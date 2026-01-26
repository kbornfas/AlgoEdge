import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/admin/financial-summary`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin financial summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch financial summary' }, { status: 500 });
  }
}
