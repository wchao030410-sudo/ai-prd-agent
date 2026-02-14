# Analytics Setup Guide

## Overview

This project uses anonymous tracking to monitor user behavior without requiring authentication.

## Features

- ✅ Anonymous user identification (localStorage + cookie)
- ✅ Page view tracking
- ✅ PRD generation tracking
- ✅ Admin dashboard with password protection
- ✅ Daily statistics aggregation
- ✅ Vercel Analytics integration

## Environment Variables

Add these to your `.env` file:

```bash
# Admin Dashboard Password
# Generate hash with: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
ADMIN_PASSWORD_HASH=$2a$10$your_hash_here

# Admin JWT Secret (generate random string at least 32 chars)
ADMIN_JWT_SECRET=your_random_secret_at_least_32_characters_long
```

## Generating Admin Password Hash

Run this command to generate password hash:

```bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
```

Copy the output to `ADMIN_PASSWORD_HASH` in your `.env` file.

## Admin Dashboard

1. Go to `/admin/login`
2. Enter the password you set
3. View analytics, PRD logs, and user stats

## Data Privacy

- No personal data is collected
- Anonymous IDs are stored locally on user devices
- Users can clear their anonymous ID by clearing browser data
- All data is aggregated for analytics purposes only

## Database

Tables added:
- `AnalyticsEvent` - Individual event tracking
- `DailyStats` - Aggregated daily statistics
- `Session` - Updated with anonymousId and sessionId

Run migration:
```bash
npx prisma db push
```

## What Gets Tracked

### Automatic Tracking
- Page views (all pages)
- PRD generation (success/failure)
- Generation duration
- Token usage

### Admin Dashboard Shows
- Today's unique visitors
- Total page visits
- PRDs generated
- Success rate
- Error count

## Testing

Start your dev server:
```bash
npm run dev
```

1. Visit `http://localhost:3000`
2. Generate some PRDs to create test data
3. Go to `/admin/login` and login
4. View analytics at `/admin`
