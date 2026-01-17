import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // 'signin' or 'signup'

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Google sign-in was cancelled or failed')}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=No authorization code received', request.url)
    );
  }

  try {
    // Exchange code for tokens
    // Use the same redirect_uri that was used to initiate the OAuth flow
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/auth/login?error=Failed to authenticate with Google', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.redirect(
        new URL('/auth/login?error=Failed to get user information from Google', request.url)
      );
    }

    const googleUser = await userInfoResponse.json();

    // Send to backend for authentication/registration
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const authResponse = await fetch(`${backendUrl}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleId: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
        lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
        picture: googleUser.picture,
        isNewUser: state === 'signup',
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      // Handle specific error cases
      if (authData.requiresRegistration) {
        // User doesn't exist - redirect to register page
        return NextResponse.redirect(
          new URL('/auth/register?error=' + encodeURIComponent('No account found with this email. Please register first.'), request.url)
        );
      }
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(authData.error || 'Authentication failed')}`, request.url)
      );
    }

    // Successful login - redirect to dashboard (or pricing if no subscription)
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Set token in a secure cookie
    response.cookies.set('auth_token', authData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Also set a non-httpOnly cookie for client-side access
    response.cookies.set('user_data', JSON.stringify({
      id: authData.user.id,
      email: authData.user.email,
      firstName: authData.user.firstName,
      lastName: authData.user.lastName,
      role: authData.user.role,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=An unexpected error occurred during sign-in', request.url)
    );
  }
}
