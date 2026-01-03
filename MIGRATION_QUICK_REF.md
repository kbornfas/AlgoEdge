# Prisma Migration Quick Reference

Quick reference card for common Prisma migration tasks.

## 🚀 Common Commands

### Development
```bash
# Push schema changes (fast, no migration files)
npm run prisma:push

# Create migration with history
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate
```

### Production
```bash
# Deploy all pending migrations
npm run prisma:migrate:deploy

# Check migration status
npm run prisma:migrate:status

# Sync schema from database
npm run prisma:db:pull
```

### Troubleshooting
```bash
# Interactive migration conflict resolver
npm run migrate:resolve

# Check database health
npm run db:check

# Initialize/reset database
npm run db:init
```

## 🔧 Fixing P3005 Error

When you see: `Error: P3005: The database schema is not empty`

### Quick Fix Options

**Option 1: Sync from Database**
```bash
npx prisma db pull
npx prisma generate
```

**Option 2: Mark Migrations as Applied**
```bash
npm run migrate:resolve
# Follow interactive prompts
```

**Option 3: Manual Resolution**
```bash
# List migrations
ls prisma/migrations/

# Mark specific migration as applied
npx prisma migrate resolve --applied "migration_name"

# Verify
npm run prisma:migrate:status
```

## 📋 Migration Workflow

### Starting Fresh
```bash
1. npm install
2. npm run prisma:generate
3. npm run prisma:push  # OR npm run prisma:migrate:deploy
4. npm run seed:all
```

### Making Schema Changes
```bash
1. Edit prisma/schema.prisma
2. npm run prisma:migrate  # Creates migration
3. git add prisma/migrations/
4. git commit -m "Add migration: description"
```

### Deploying to Production
```bash
1. git pull
2. npm run prisma:migrate:deploy
3. npm run seed:all  # If needed
4. npm start
```

## 🆘 Common Scenarios

### Database Already Has Schema
```bash
npx prisma db pull
npx prisma generate
```

### Migrations Out of Sync
```bash
npm run migrate:resolve
# Select option to mark migrations as applied
```

### Reset Everything (⚠️ Loses Data)
```bash
npx prisma migrate reset
npm run seed:all
```

### Backup Before Migration
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 📚 Full Documentation

- **Comprehensive Guide**: [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING_DETAILED.md](./TROUBLESHOOTING_DETAILED.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

*Last updated: January 3, 2026*
