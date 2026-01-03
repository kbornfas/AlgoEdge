import pool from '../config/database.js';

export async function setupTestDatabase() {
  const client = await pool.connect();
  try {
    // Clean up test data
    await client.query('BEGIN');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM trades');
    await client.query('DELETE FROM user_robot_configs');
    await client.query('DELETE FROM mt5_accounts');
    await client.query('DELETE FROM user_settings');
    await client.query('DELETE FROM subscriptions');
    await client.query('DELETE FROM verification_codes');
    await client.query('DELETE FROM users');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function teardownTestDatabase() {
  await pool.end();
}

export async function createTestUser(userData = {}) {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIYLKLKLKK', // 'password123'
    is_verified: true,
  };

  const user = { ...defaultData, ...userData };
  
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, is_verified)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, is_verified, created_at`,
    [user.username, user.email, user.password_hash, user.is_verified]
  );

  return result.rows[0];
}
