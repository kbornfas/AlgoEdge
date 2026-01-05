const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'kbonface03@gmail.com' },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        isVerified: true,
        isActivated: true,
        passwordHash: true,
      },
    });
    
    if (user) {
      console.log('User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Username:', user.username);
      console.log('  isAdmin:', user.isAdmin);
      console.log('  isVerified:', user.isVerified);
      console.log('  isActivated:', user.isActivated);
      console.log('  Has password hash:', !!user.passwordHash);
      console.log('  Password hash preview:', user.passwordHash?.substring(0, 20) + '...');
    } else {
      console.log('User not found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
