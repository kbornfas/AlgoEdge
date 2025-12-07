# AlgoEdge Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Stripe account (for payments)
- SMTP email service (Gmail, SendGrid, etc.)

## Environment Setup

1. **Copy environment template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure environment variables:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `SMTP_*`: Email service credentials
   - `STRIPE_*`: Stripe API keys and webhook secret
   - `FRONTEND_URL`: Your frontend domain

## Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run init-db
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:3000`

## Production Deployment

### Option 1: Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Add PostgreSQL:**
   ```bash
   railway add --database postgresql
   ```

5. **Set environment variables:**
   ```bash
   railway variables set JWT_SECRET=your_secret_here
   railway variables set SMTP_HOST=smtp.gmail.com
   railway variables set SMTP_PORT=587
   # ... set all other variables from .env
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Get deployment URL:**
   ```bash
   railway domain
   ```

### Option 2: Docker + Docker Compose

1. **Create `.env` file in root directory** with all required variables

2. **Build and start containers:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

4. **Stop containers:**
   ```bash
   docker-compose down
   ```

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **SSH into your server**

2. **Install Node.js 18+:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PostgreSQL:**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

4. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd AlgoEdge/backend
   ```

5. **Install dependencies:**
   ```bash
   npm ci --only=production
   ```

6. **Create `.env` file** with production values

7. **Initialize database:**
   ```bash
   npm run init-db
   ```

8. **Install PM2 for process management:**
   ```bash
   sudo npm install -g pm2
   ```

9. **Start application:**
   ```bash
   pm2 start server.js --name algoedge-backend
   pm2 save
   pm2 startup
   ```

10. **Configure Nginx reverse proxy:**
    ```nginx
    server {
        listen 80;
        server_name api.yourdomain.com;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

11. **Setup SSL with Let's Encrypt:**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.yourdomain.com
    ```

## Stripe Webhook Configuration

1. **Go to Stripe Dashboard** → Developers → Webhooks

2. **Add endpoint:** `https://your-domain.com/api/payments/webhook`

3. **Select events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

4. **Copy webhook signing secret** and set as `STRIPE_WEBHOOK_SECRET`

## Database Migrations

The application automatically creates tables on first run. For schema updates:

1. **Backup database:**
   ```bash
   pg_dump -U algoedge algoedge > backup.sql
   ```

2. **Apply changes** by modifying `config/database.js`

3. **Restart application**

## Monitoring

1. **Health check endpoint:** `GET /health`

2. **PM2 monitoring:**
   ```bash
   pm2 monit
   pm2 logs algoedge-backend
   ```

3. **Database monitoring:**
   ```bash
   psql -U algoedge -d algoedge
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check firewall rules allow port 5432

### Email Not Sending
- Verify SMTP credentials
- Check SMTP port (587 for TLS, 465 for SSL)
- Enable "Less secure app access" for Gmail

### Stripe Webhook Failing
- Verify webhook secret matches Stripe dashboard
- Check endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

### WebSocket Connection Failed
- Ensure `FRONTEND_URL` matches your frontend domain
- Check CORS configuration in `server.js`
- Verify WebSocket port is not blocked by firewall

## Security Checklist

- ✅ Strong JWT_SECRET (32+ characters)
- ✅ PostgreSQL user has limited permissions
- ✅ Environment variables not committed to git
- ✅ HTTPS enabled with valid SSL certificate
- ✅ Rate limiting configured
- ✅ Helmet security headers enabled
- ✅ Regular dependency updates: `npm audit fix`
- ✅ Firewall configured (only allow 80, 443, 22)
- ✅ Database backups scheduled

## Performance Optimization

1. **Enable PostgreSQL connection pooling** (already configured)
2. **Add Redis for session storage** (optional)
3. **Enable gzip compression** (already configured)
4. **Use CDN for static assets**
5. **Monitor with tools like New Relic or DataDog**

## Support

For issues or questions:
- GitHub Issues: <your-repo-url>/issues
- Email: support@algoedge.com
