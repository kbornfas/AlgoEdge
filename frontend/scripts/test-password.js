const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'kbonface03@gmail.com' },
      select: {
        passwordHash: true,
      },
    });
    
    if (user) {
      const testPassword = 'BRBros@1234';
      const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
      console.log('Password test:');
      console.log('  Testing password:', testPassword);
      console.log('  Hash exists:', !!user.passwordHash);
      console.log('  Password matches:', isMatch);
      
      if (!isMatch) {
        // Let's update the password
        console.log('\nUpdating password...');
        const salt = await bcrypt.genSalt(12);
        const newHash = await bcrypt.hash(testPassword, salt);
        await prisma.user.update({
          where: { email: 'kbonface03@gmail.com' },
          data: { passwordHash: newHash }
        });
        console.log('Password updated successfully!');
      }
    } else {
      console.log('User not found!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
