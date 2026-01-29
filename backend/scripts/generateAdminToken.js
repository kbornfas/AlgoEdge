import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Generate token for admin user (ID 12 from database)
const adminUserId = 12; // kbonface03@gmail.com
const token = jwt.sign(
  { 
    userId: adminUserId,
    id: adminUserId,
    email: 'kbonface03@gmail.com',
    is_admin: true
  },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

console.log('\n🔑 Admin JWT Token Generated:\n');
console.log(token);
console.log('\n📋 Instructions:');
console.log('1. Copy the token above');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run: localStorage.setItem("adminToken", "PASTE_TOKEN_HERE")');
console.log('5. Refresh the admin page\n');
