# Environment Variables Setup Guide

Complete guide for configuring environment variables for local development and deployment.

---

## Quick Start (5 Minutes)

### Step 1: Create .env File

```bash
# In project root directory
cp .env.example .env
```

Or manually create `.env` file in project root.

### Step 2: Get Supabase Credentials

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to API Settings**
   - Click **Settings** (gear icon) in left sidebar
   - Click **API** under "Project Settings"

3. **Copy Your Values**
   
   **Project URL:**
   ```
   Found under "Project URL" section
   Example: https://abcdefghijklmnop.supabase.co
   ```
   
   **Anon Key:**
   ```
   Found under "Project API keys" → "anon public"
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Update .env File

Open `.env` and paste your values:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

✅ **Done!** Your app should now connect to Supabase.

---

## Detailed Instructions

### Where to Find Each Value

#### 1. VITE_SUPABASE_URL

**Location:** Supabase Dashboard → Settings → API → Project URL

**Format:**
```
https://[PROJECT_ID].supabase.co
```

**Example:**
```
https://xyzabc123def456.supabase.co
```

**Screenshot Reference:**
```
┌─────────────────────────────────────────┐
│ Project URL                             │
│ https://xyzabc123def456.supabase.co     │
│ [Copy]                                  │
└─────────────────────────────────────────┘
```

#### 2. VITE_SUPABASE_ANON_KEY

**Location:** Supabase Dashboard → Settings → API → Project API keys → anon public

**Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[long string]
```

**⚠️ IMPORTANT:**
- Copy the **"anon public"** key (NOT "service_role")
- This is a JWT token (starts with `eyJ`)
- It's safe to use in frontend code
- Protected by Row Level Security (RLS)

**Screenshot Reference:**
```
┌─────────────────────────────────────────┐
│ Project API keys                        │
│                                         │
│ anon public    [Safe to use in browser]│
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...   │
│ [Copy]                                  │
│                                         │
│ service_role   [Secret! Server only]   │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...   │
│ [Copy]                                  │
└─────────────────────────────────────────┘
```

---

## Security Notes

### ✅ Safe Keys (Frontend Use)

**anon/public key:**
- ✅ Safe to use in frontend
- ✅ Safe to commit to git (if public repo)
- ✅ Can be exposed in browser
- ✅ Protected by RLS policies

### ❌ Dangerous Keys (Backend Only)

**service_role key:**
- ❌ NEVER use in frontend
- ❌ NEVER commit to git
- ❌ Bypasses RLS policies
- ❌ Full database access

### Best Practices

1. **Always use .env for local development**
   - Keep credentials out of source code
   - Easy to switch between projects

2. **Add .env to .gitignore**
   ```gitignore
   # Environment variables
   .env
   .env.local
   .env.*.local
   ```

3. **Commit .env.example**
   - Template for other developers
   - Shows required variables
   - No actual secrets

4. **Use environment variables in hosting**
   - Never hardcode in source
   - Set in platform settings
   - Can differ per environment

---

## Git Configuration

### Update .gitignore

Ensure `.env` files are ignored:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Keep only the example
!.env.example
```

### Verify .env is Ignored

```bash
# Check git status
git status

# .env should NOT appear in the list
# If it does, remove it:
git rm --cached .env
```

---

## Local Development Setup

### Option 1: Single .env File (Simple)

```env
# .env
VITE_SUPABASE_URL=https://localhost.supabase.co
VITE_SUPABASE_ANON_KEY=your-local-key
```

### Option 2: Environment-Specific Files (Advanced)

**For different environments:**

**.env.development:**
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key
```

**.env.production:**
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key
```

**Load based on mode:**
```bash
# Development
npm run dev

# Production build
npm run build
```

---

## Deployment Configurations

### Vercel

**Via Dashboard:**
1. Go to your project on Vercel
2. Click **Settings**
3. Click **Environment Variables**
4. Add variables:
   ```
   Name: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co
   Environment: Production, Preview, Development
   ```
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Environment: Production, Preview, Development
   ```
5. Redeploy application

**Via CLI:**
```bash
vercel env add VITE_SUPABASE_URL
# Paste value when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Paste value when prompted

# Redeploy
vercel --prod
```

### Netlify

**Via Dashboard:**
1. Go to Site settings
2. Click **Environment variables** (under "Build & deploy")
3. Click **Add a variable**
4. Add:
   ```
   Key: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co
   Scope: All scopes
   ```
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Scope: All scopes
   ```
5. Trigger new deploy

**Via netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

# DO NOT put actual secrets here!
# Use Netlify dashboard instead
```

### GitHub Pages (with GitHub Actions)

**Set repository secrets:**
1. Go to repository Settings
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Use in workflow (.github/workflows/deploy.yml):**
```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Other Platforms

**Railway:**
```bash
railway variables set VITE_SUPABASE_URL=https://...
railway variables set VITE_SUPABASE_ANON_KEY=eyJ...
```

**Render:**
- Dashboard → Environment → Environment Variables
- Add variables manually

**Heroku:**
```bash
heroku config:set VITE_SUPABASE_URL=https://...
heroku config:set VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Environment Validation

### Add Validation Function

Create `src/lib/validateEnv.ts`:

```typescript
/**
 * Validate environment variables are set
 * Throws clear error if missing
 */
export function validateEnvironment() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      '❌ VITE_SUPABASE_URL is not set!\n' +
      'Please create a .env file with your Supabase URL.\n' +
      'See .env.example for reference.'
    );
  }

  if (!key) {
    throw new Error(
      '❌ VITE_SUPABASE_ANON_KEY is not set!\n' +
      'Please add your Supabase anon key to .env file.\n' +
      'See .env.example for reference.'
    );
  }

  // Validate format
  if (!url.startsWith('https://')) {
    console.warn('⚠️ VITE_SUPABASE_URL should start with https://');
  }

  if (!key.startsWith('eyJ')) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY should be a JWT token (starts with eyJ)');
  }

  // Log in development only
  if (import.meta.env.DEV) {
    console.log('✅ Environment variables loaded');
    console.log('Supabase URL:', url);
    console.log('Anon Key:', key.substring(0, 20) + '...');
  }

  return { url, key };
}
```

### Use in supabase.ts

Update `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { validateEnvironment } from './validateEnv';
import type { Database } from '../types/supabase';

// Validate environment variables
const { url, key } = validateEnvironment();

// Create Supabase client
export const supabase = createClient<Database>(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is not defined"

**Cause:** Environment variables not loaded

**Solutions:**

1. **Check .env file exists**
   ```bash
   ls -la .env
   ```

2. **Check .env file location**
   - Must be in project root
   - Same level as package.json

3. **Check variable names**
   - Must start with `VITE_`
   - Vite only exposes variables with this prefix

4. **Restart dev server**
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

### Issue: "Failed to connect to Supabase"

**Cause:** Wrong URL or key

**Solutions:**

1. **Verify URL format**
   ```env
   # Correct
   VITE_SUPABASE_URL=https://abc123.supabase.co
   
   # Wrong - no https://
   VITE_SUPABASE_URL=abc123.supabase.co
   
   # Wrong - trailing slash
   VITE_SUPABASE_URL=https://abc123.supabase.co/
   ```

2. **Verify key is complete**
   - Should be very long (200+ characters)
   - No line breaks
   - No spaces

3. **Check project is running**
   - Supabase project should be active
   - Not paused or deleted

### Issue: Variables not updating

**Cause:** Cache or build issue

**Solutions:**

1. **Clear Vite cache**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Full rebuild**
   ```bash
   npm run build
   npm run preview
   ```

---

## Testing Environment Setup

### Quick Test

```typescript
// In browser console
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
```

### Use Test Helpers

```javascript
// Load test helpers
import { checkEnvironment } from './src/utils/testHelpers';

// Check environment
checkEnvironment();
```

### Expected Output

```
✅ Environment variables loaded
Supabase URL: https://your-project.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIs...[HIDDEN]
```

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables set in hosting platform
- [ ] Values tested and working
- [ ] .env NOT committed to git
- [ ] .env.example committed as template
- [ ] Service role key NOT used in frontend
- [ ] RLS policies enabled and tested
- [ ] Error handling for missing variables
- [ ] Environment validated on app start

---

## Quick Reference

### Local Development
```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env

# Restart dev server
npm run dev
```

### Get Supabase Keys
```
Dashboard → Settings → API
- Project URL → VITE_SUPABASE_URL
- anon public → VITE_SUPABASE_ANON_KEY
```

### Deployment
```
Platform dashboard → Environment Variables
Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
Redeploy
```

---

**✅ Environment configuration complete!**

Your application is now connected to Supabase and ready for development or deployment.
