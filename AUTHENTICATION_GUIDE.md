# Authentication Setup Documentation

Complete guide to the authentication system implementation for the Employee Onboarding Application.

---

## 📋 Overview

The authentication system provides:
- ✅ User signup and login
- ✅ Role-based access control (Candidate vs Admin)
- ✅ Protected routes with automatic redirects
- ✅ Session management and auto-refresh
- ✅ Profile data synchronization
- ✅ Auth state persistence across page refreshes

---

## 🏗️ Architecture

### File Structure
```
src/
├── lib/
│   ├── supabase.ts          # Supabase client with TypeScript types
│   └── auth.ts              # Authentication functions
├── contexts/
│   └── AuthContext.tsx      # Global auth state management
├── components/
│   └── ProtectedRoute.tsx   # Route protection component
└── App.tsx                  # App with AuthProvider integration
```

---

## 📄 File Descriptions

### 1. [src/lib/auth.ts](src/lib/auth.ts)

**Purpose:** Core authentication functions

**Functions:**
| Function | Description | Returns |
|----------|-------------|---------|
| `signUp(data)` | Register new user with email/password | User data |
| `signIn(data)` | Login existing user | Session data |
| `signOut()` | Logout current user | Success status |
| `getSession()` | Get current session | Session or null |
| `getCurrentUser()` | Get authenticated user | User or null |
| `getCurrentUserProfile()` | Get user profile from database | Profile or null |
| `onAuthStateChange(callback)` | Listen to auth state changes | Subscription |
| `updateUserProfile(userId, updates)` | Update user profile | Updated profile |
| `resetPassword(email)` | Send password reset email | Success status |
| `updatePassword(newPassword)` | Change user password | Success status |

**TypeScript Interfaces:**
```typescript
interface SignUpData {
  email: string
  password: string
  fullName: string
  role?: 'candidate' | 'admin'
}

interface SignInData {
  email: string
  password: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'candidate' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

---

### 2. [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

**Purpose:** Global authentication state management

**Provides:**
```typescript
interface AuthContextType {
  user: User | null              // Supabase auth user
  profile: UserProfile | null    // Database profile with role
  session: Session | null        // Current session
  loading: boolean               // Auth initialization status
  signOut: () => Promise<void>   // Logout function
  refreshProfile: () => Promise<void> // Reload profile from DB
}
```

**Features:**
- ✅ Automatic session initialization on app load
- ✅ Real-time auth state synchronization
- ✅ Profile data loading and caching
- ✅ Cleanup on unmount

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, profile, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>
  
  return <div>Welcome, {profile?.full_name}!</div>
}
```

---

### 3. [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)

**Purpose:** Protect routes from unauthorized access

**Props:**
```typescript
interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'candidate' | 'admin'
}
```

**Behavior:**
| Scenario | Action |
|----------|--------|
| Loading auth state | Show loading spinner |
| No user authenticated | Redirect to `/candidate/login` |
| Wrong role | Redirect to appropriate dashboard |
| Authorized | Render children |

**Usage:**
```typescript
<Route 
  path="/candidate/dashboard" 
  element={
    <ProtectedRoute requiredRole="candidate">
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

---

### 4. [src/App.tsx](src/App.tsx) (Updated)

**Changes:**
- ✅ Wrapped entire app with `<AuthProvider>`
- ✅ Protected candidate routes with `requiredRole="candidate"`
- ✅ Protected admin routes with `requiredRole="admin"`
- ✅ Login pages remain public

---

## 🔐 Authentication Flow

### Sign Up Flow
```
1. User fills signup form (email, password, fullName)
2. Call signUp(data) from auth.ts
3. Supabase creates auth.users record
4. Trigger auto-creates profiles record (via SQL trigger)
5. User metadata (full_name, role) stored
6. User is automatically logged in
7. AuthContext updates state
8. Redirect to dashboard
```

### Sign In Flow
```
1. User fills login form (email, password)
2. Call signIn(data) from auth.ts
3. Supabase validates credentials
4. Session created and stored
5. getCurrentUserProfile() fetches profile
6. AuthContext updates (user, profile, session)
7. Redirect to dashboard based on role
```

### Protected Route Access Flow
```
1. User navigates to protected route
2. ProtectedRoute checks auth state
3. If loading → Show spinner
4. If no user → Redirect to login
5. If user exists, load profile
6. Check role requirement
7. If role matches or no requirement → Render page
8. If role mismatch → Redirect to correct dashboard
```

### Sign Out Flow
```
1. User clicks logout
2. Call signOut() from AuthContext
3. Supabase clears session
4. AuthContext clears state (user, profile, session)
5. Redirect to login page
```

---

## 🎯 Integration Examples

### Example 1: Login Page

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { profile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signIn({ email, password })
      
      // Redirect based on role (profile will be loaded by AuthContext)
      // Wait a moment for profile to load
      setTimeout(() => {
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard')
        } else {
          navigate('/candidate/dashboard')
        }
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  )
}
```

---

### Example 2: Signup Page

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'candidate' as const
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signUp(formData)
      navigate('/candidate/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        placeholder="Full Name"
        required
      />
      <input 
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      <input 
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

---

### Example 3: Using Auth in Components

```typescript
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Welcome, {profile?.full_name}!</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {profile?.role}</p>
      
      <button onClick={signOut}>
        Logout
      </button>
    </div>
  )
}
```

---

### Example 4: Role-Based UI

```typescript
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { profile } = useAuth()

  return (
    <nav>
      <h1>Onboarding App</h1>
      
      {profile?.role === 'admin' && (
        <div>
          <a href="/admin/applications">Applications</a>
          <a href="/admin/reports">Reports</a>
        </div>
      )}
      
      {profile?.role === 'candidate' && (
        <div>
          <a href="/candidate/dashboard">Dashboard</a>
          <a href="/candidate/apply">Apply</a>
        </div>
      )}
    </nav>
  )
}
```

---

## 🧪 Testing Authentication

### Test 1: Verify Database Trigger

After running the database migration, the `handle_new_user()` trigger should auto-create profiles.

**Test:**
```sql
-- 1. Sign up a new user via UI
-- 2. Check if profile was created automatically:

SELECT * FROM public.profiles 
WHERE email = 'test@example.com';
```

**Expected:** Profile record exists with default role 'candidate'.

---

### Test 2: Test Protected Routes

**Steps:**
1. Navigate to `/candidate/dashboard` without logging in
2. Should redirect to `/candidate/login`
3. Log in as candidate
4. Should access dashboard successfully
5. Try to access `/admin/dashboard`
6. Should redirect back to candidate dashboard

---

### Test 3: Test Auth State Persistence

**Steps:**
1. Log in as candidate
2. Refresh the page (F5)
3. Should remain logged in
4. Auth state should restore automatically
5. No redirect to login page

---

### Test 4: Test Sign Out

**Steps:**
1. Log in
2. Click logout button
3. Should clear session
4. Redirect to login page
5. Accessing protected routes should redirect to login

---

## 🔧 Troubleshooting

### Issue 1: "useAuth must be used within AuthProvider"

**Cause:** Component using `useAuth()` is not wrapped by `<AuthProvider>`

**Solution:**
```typescript
// Ensure App.tsx has AuthProvider wrapping all routes
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* routes */}
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

---

### Issue 2: Infinite loading spinner

**Cause:** Profile not loading from database

**Debug:**
```typescript
// In browser console
console.log(await supabase.auth.getUser())
console.log(await supabase.from('profiles').select('*'))
```

**Solutions:**
- Check if profile exists in database
- Verify RLS policies allow user to read their profile
- Check for console errors

---

### Issue 3: "Failed to fetch profile"

**Cause:** RLS policies or database connection issue

**Solutions:**
1. Verify RLS policies are created:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

2. Check if user can read their profile:
```sql
-- As the logged-in user
SELECT * FROM public.profiles 
WHERE id = auth.uid();
```

---

### Issue 4: Wrong role redirects

**Cause:** Role check logic or profile.role value incorrect

**Debug:**
```typescript
// Add console.log in ProtectedRoute.tsx
console.log('User role:', profile?.role)
console.log('Required role:', requiredRole)
```

**Solution:** Verify profile.role is exactly 'candidate' or 'admin' (lowercase).

---

## ✅ Security Best Practices

1. **Never expose admin credentials in code**
   ```typescript
   // ❌ Bad
   const ADMIN_EMAIL = 'admin@example.com'
   
   // ✅ Good
   // Store in .env.local for testing only
   ```

2. **Always validate on the server (RLS policies)**
   ```sql
   -- Client-side checks can be bypassed
   -- RLS policies enforce server-side security
   CREATE POLICY "Users can only update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id);
   ```

3. **Use HTTPS in production**
   ```typescript
   // Supabase handles this automatically
   // Ensure your deployed app uses HTTPS
   ```

4. **Implement password requirements**
   ```typescript
   const validatePassword = (password: string) => {
     return password.length >= 8
   }
   ```

5. **Handle errors gracefully**
   ```typescript
   try {
     await signIn(data)
   } catch (error) {
     // Don't expose detailed error messages to users
     setError('Invalid email or password')
   }
   ```

---

## 🎓 Next Steps

After authentication is setup:

1. ✅ **Update existing login pages** to use `signIn()` and `signUp()`
2. ✅ **Add logout buttons** to dashboards using `signOut()`
3. ✅ **Display user info** using `useAuth()` hook
4. ✅ **Implement signup forms** for new users
5. ✅ **Add password reset functionality**
6. ✅ **Create admin user setup guide**

---

## 📚 Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Database Schema: [supabase/migrations/complete_schema.sql](supabase/migrations/complete_schema.sql)
- Supabase Client: [src/lib/supabase.ts](src/lib/supabase.ts)
