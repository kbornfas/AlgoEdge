import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

import app from '../server.js';
import pool from '../config/database.js';
import { setupTestDatabase, teardownTestDatabase } from './helpers.js';

describe('Login API - Error Handling & Validation', () => {
  let testUser;

  beforeAll(async () => {
    // Wait for database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await setupTestDatabase();
    
    // Create a test user for login tests
    const passwordHash = await bcrypt.hash('password123', 12);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, is_verified`,
      ['loginuser', 'loginuser@example.com', passwordHash, true]
    );
    testUser = result.rows[0];
    
    // Create default subscription and settings
    await pool.query(
      'INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, $3)',
      [testUser.id, 'free', 'active']
    );
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [testUser.id]
    );
  });

  describe('POST /api/auth/login - Missing Credentials', () => {
    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password required');
      
      // Verify error message is clear and actionable
      expect(response.body.error).toMatch(/required/i);
      expect(response.body.error).toMatch(/username/i);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password required');
      
      // Verify error message is clear and actionable
      expect(response.body.error).toMatch(/required/i);
      expect(response.body.error).toMatch(/password/i);
    });

    it('should return 400 when both username and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Username and password required');
    });
  });

  describe('POST /api/auth/login - Invalid Credentials', () => {
    it('should return 401 when username does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
      
      // Verify error message doesn't reveal if user exists
      expect(response.body.error).not.toMatch(/not found|does not exist/i);
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
      
      // Verify error message doesn't reveal if username or password is wrong
      expect(response.body.error).not.toMatch(/password|incorrect/i);
    });

    it('should allow login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('loginuser@example.com');
    });
  });

  describe('POST /api/auth/login - Successful Login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.email).toBe('loginuser@example.com');
      expect(response.body.user.isVerified).toBe(true);
      
      // Verify token is a valid JWT format
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should update last_login timestamp on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);

      // Verify last_login was updated
      const result = await pool.query(
        'SELECT last_login FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(result.rows[0].last_login).not.toBeNull();
    });
  });

  describe('POST /api/auth/login - Database Failure', () => {
    it('should return 500 with user-friendly error when database fails', async () => {
      // Mock a database failure
      const originalQuery = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Login failed');
      
      // Verify error message is user-friendly
      expect(response.body.error).not.toContain('Database connection failed');
      expect(response.body.error).toMatch(/failed/i);

      // Restore original query method
      pool.query = originalQuery;
    });
  });

  describe('Error Message Quality for Login', () => {
    it('should provide clear, actionable error messages for QA/ops', async () => {
      const testCases = [
        {
          input: { password: 'password123' },
          expectedStatus: 400,
          expectedError: 'Username and password required',
        },
        {
          input: { username: 'loginuser' },
          expectedStatus: 400,
          expectedError: 'Username and password required',
        },
        {
          input: { username: 'wronguser', password: 'password123' },
          expectedStatus: 401,
          expectedError: 'Invalid credentials',
        },
        {
          input: { username: 'loginuser', password: 'wrongpass' },
          expectedStatus: 401,
          expectedError: 'Invalid credentials',
        },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(testCase.input);

        expect(response.status).toBe(testCase.expectedStatus);
        expect(response.body.error).toBeDefined();
        expect(response.body.error).toBe(testCase.expectedError);
        
        // Error messages should be:
        // 1. Clear - easy to understand
        expect(response.body.error.length).toBeLessThan(100);
        
        // 2. Actionable - tells user what to do
        expect(response.body.error).toMatch(/required|invalid|failed/i);
        
        // 3. Traceable - consistent format for logging
        expect(typeof response.body.error).toBe('string');
        
        // 4. Secure - doesn't reveal sensitive info
        if (testCase.expectedStatus === 401) {
          expect(response.body.error).not.toMatch(/user|exists|password|wrong/i);
        }
      }
    });

    it('should use consistent error format across all endpoints', async () => {
      const endpoints = [
        { path: '/api/auth/register', body: {} },
        { path: '/api/auth/login', body: {} },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .post(endpoint.path)
          .send(endpoint.body);

        // All errors should have the same structure
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
        
        // Error should be the root level, not nested
        expect(response.body.error).toBeDefined();
      }
    });
  });

  describe('2FA Login Flow', () => {
    let user2FA;

    beforeEach(async () => {
      // Create a user with 2FA enabled
      const passwordHash = await bcrypt.hash('password123', 12);
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, is_verified, two_fa_enabled, two_fa_secret)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, email`,
        ['user2fa', 'user2fa@example.com', passwordHash, true, true, 'TEST2FASECRET']
      );
      user2FA = result.rows[0];
    });

    it('should return requires2FA when 2FA is enabled and no code provided', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user2fa',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requires2FA');
      expect(response.body.requires2FA).toBe(true);
      expect(response.body).not.toHaveProperty('token');
    });

    it('should return 401 when 2FA code is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user2fa',
          password: 'password123',
          twoFACode: '000000',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid 2FA code');
    });
  });
});
