#!/usr/bin/env node

/**
 * Seed admin user
 * Creates the default admin user if it doesn't exist
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🔧 Seeding admin user...');

    const adminEmail = process.env.ADMIN_EMAIL || 'kbonface03@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'BRBros@1234';
    const adminUsername = 'admin';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      
      // Update to ensure admin flags are set
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          isActivated: true,
          isVerified: true,
        },
      });
      
      console.log('✅ Admin flags updated');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        fullName: 'AlgoEdge Admin',
        isAdmin: true,
        isActivated: true,
        isVerified: true,
        paymentStatus: 'approved',
      },
    });

    // Create subscription for admin
    await prisma.subscription.create({
      data: {
        userId: admin.id,
        plan: 'enterprise',
        status: 'active',
      },
    });

    // Create user settings
    await prisma.userSettings.create({
      data: {
        userId: admin.id,
      },
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the admin password after first login!');
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
