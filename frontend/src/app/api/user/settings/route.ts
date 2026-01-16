import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/middleware';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  tradeAlerts: z.boolean().optional(),
  dailyReports: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  marketNews: z.boolean().optional(),
  telegramAlerts: z.boolean().optional(),
  riskLevel: z.string().optional(),
  stopLossPercent: z.number().optional(),
  takeProfitPercent: z.number().optional(),
  autoCloseProfit: z.boolean().optional(),
  theme: z.string().optional(),
  tradingPrefs: z.any().optional(),
});

/**
 * GET /api/user/settings
 * Get current user settings
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.userId,
          emailNotifications: true,
          tradeAlerts: true,
          dailyReports: false,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/settings
 * Update user settings
 */
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Ensure settings exist first
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    });

    let settings;
    if (existingSettings) {
      settings = await prisma.userSettings.update({
        where: { userId: user.userId },
        data: validatedData,
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.userId,
          ...validatedData,
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
