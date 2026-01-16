import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';
import { z } from 'zod';

// CRITICAL: Force dynamic rendering - do NOT prerender at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validation schema for admin login
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/admin/login
 * Authenticate admin user and return JWT token
 * Supports both database admin users and environment variable admin
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = adminLoginSchema.parse(body);

    // First, check environment variable admin credentials
    if (ADMIN_EMAIL && ADMIN_PASSWORD && 
        validatedData.email === ADMIN_EMAIL && 
        validatedData.password === ADMIN_PASSWORD) {
      
      // Check if admin user exists in DB, create if not
      let adminUser = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
      });

      if (!adminUser) {
        // Create the admin user in database
        const passwordHash = await hashPassword(ADMIN_PASSWORD);
        adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            email: ADMIN_EMAIL,
            passwordHash,
            fullName: 'System Administrator',
            isAdmin: true,
            isVerified: true,
            isActivated: true,
            approvalStatus: 'approved',
            paymentStatus: 'approved',
          },
        });
      } else if (!adminUser.isAdmin) {
        // Update existing user to be admin
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { isAdmin: true, isActivated: true, approvalStatus: 'approved' },
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { lastLogin: new Date() },
      });

      // Generate JWT token with admin flag
      const token = generateToken({
        userId: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        isAdmin: true,
      });

      return NextResponse.json({
        message: 'Admin login successful',
        token,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          fullName: adminUser.fullName,
        },
      });
    }

    // Fall back to database admin user lookup
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.passwordHash!
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token with admin flag
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: true,
    });

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Admin login failed. Please try again.' },
      { status: 500 }
    );
  }
}
