# Application Data Functions Documentation

Complete guide to application CRUD operations and data management.

---

## 📋 Overview

The [src/lib/applications.ts](src/lib/applications.ts) module provides all functions needed to:
- ✅ Create and manage candidate applications
- ✅ Submit applications for review
- ✅ Admin review and approval workflow
- ✅ Application statistics and reporting
- ✅ Audit trail logging

---

## 📄 Functions Reference

### **Candidate Functions**

#### 1. `createApplication(userId, data)`

Create a new application in draft status.

**Parameters:**
```typescript
userId: string              // User ID of the applicant
data: Partial<CandidateApplication>  // Initial application data
```

**Returns:** `Promise<CandidateApplication>`

**Example:**
```typescript
import { createApplication } from '../lib/applications'

const newApp = await createApplication(user.id, {
  post_applied_for: 'Software Engineer',
  name: 'John Doe',
  email: 'john@example.com',
  mobile_no: '9876543210',
  nationality: 'Indian'
})
```

---

#### 2. `updateApplication(applicationId, data)`

Update an existing application (typically in draft status).

**Parameters:**
```typescript
applicationId: string       // Application ID
data: Partial<CandidateApplication>  // Fields to update
```

**Returns:** `Promise<CandidateApplication>`

**Example:**
```typescript
const updated = await updateApplication(appId, {
  permanent_address: '123 Main St, City',
  date_of_birth: '1995-01-15',
  education: [
    { level: "Bachelor's", yearOfPassing: '2017', percentage: '85' }
  ]
})
```

---

#### 3. `submitApplication(applicationId)`

Submit a draft application for review.

**Parameters:**
```typescript
applicationId: string       // Application ID
```

**Returns:** `Promise<CandidateApplication>`

**Side Effects:**
- Changes status from 'draft' to 'submitted'
- Sets `submitted_at` timestamp

**Example:**
```typescript
const submitted = await submitApplication(appId)
console.log('Application submitted at:', submitted.submitted_at)
```

---

#### 4. `getUserApplication(userId)`

Get the most recent application for a user.

**Parameters:**
```typescript
userId: string              // User ID
```

**Returns:** `Promise<CandidateApplication | null>`

**Example:**
```typescript
const app = await getUserApplication(user.id)

if (app) {
  console.log('Status:', app.status)
} else {
  console.log('No application found')
}
```

---

#### 5. `getUserApplications(userId)`

Get all applications for a user (supports multiple applications).

**Parameters:**
```typescript
userId: string              // User ID
```

**Returns:** `Promise<CandidateApplication[]>`

**Example:**
```typescript
const apps = await getUserApplications(user.id)
console.log(`User has ${apps.length} applications`)
```

---

### **Admin Functions**

#### 6. `getApplicationById(applicationId)`

Get a specific application by ID.

**Parameters:**
```typescript
applicationId: string       // Application ID
```

**Returns:** `Promise<CandidateApplication | null>`

**Example:**
```typescript
const app = await getApplicationById('123e4567-e89b-12d3-a456-426614174000')
if (app) {
  console.log('Applicant:', app.name)
}
```

---

#### 7. `getAllApplications(filters?)`

Get all applications with optional filtering and pagination.

**Parameters:**
```typescript
filters?: {
  status?: string           // Filter by status
  searchQuery?: string      // Search by name or email
  limit?: number            // Number of results
  offset?: number           // Pagination offset
}
```

**Returns:** `Promise<CandidateApplication[]>`

**Example:**
```typescript
// Get all submitted applications
const submitted = await getAllApplications({ status: 'submitted' })

// Search by name
const results = await getAllApplications({ searchQuery: 'John' })

// Pagination
const page1 = await getAllApplications({ limit: 10, offset: 0 })
const page2 = await getAllApplications({ limit: 10, offset: 10 })
```

---

#### 8. `getApplicationStats()`

Get application statistics grouped by status.

**Parameters:** None

**Returns:** 
```typescript
Promise<{
  total: number
  draft: number
  submitted: number
  under_review: number
  approved: number
  rejected: number
  documents_pending: number
  completed: number
}>
```

**Example:**
```typescript
const stats = await getApplicationStats()
console.log(`Total applications: ${stats.total}`)
console.log(`Pending review: ${stats.submitted}`)
console.log(`Approved: ${stats.approved}`)
```

---

#### 9. `approveApplication(applicationId, adminId, notes?)`

Approve an application.

**Parameters:**
```typescript
applicationId: string       // Application ID
adminId: string             // Admin user ID
notes?: string              // Optional admin notes
```

**Returns:** `Promise<CandidateApplication>`

**Side Effects:**
- Changes status to 'approved'
- Sets `reviewed_by` and `reviewed_at`
- Logs action in `admin_actions_log` table

**Example:**
```typescript
const approved = await approveApplication(
  appId,
  admin.id,
  'All documents verified. Candidate approved.'
)
```

---

#### 10. `rejectApplication(applicationId, adminId, reason, notes?)`

Reject an application.

**Parameters:**
```typescript
applicationId: string       // Application ID
adminId: string             // Admin user ID
reason: string              // Rejection reason (required)
notes?: string              // Optional admin notes
```

**Returns:** `Promise<CandidateApplication>`

**Side Effects:**
- Changes status to 'rejected'
- Sets `reviewed_by`, `reviewed_at`, and `rejection_reason`
- Logs action in audit log

**Example:**
```typescript
const rejected = await rejectApplication(
  appId,
  admin.id,
  'Incomplete documents',
  'Missing 10th certificate and PAN card'
)
```

---

#### 11. `moveToUnderReview(applicationId, adminId)`

Move application to 'under_review' status.

**Parameters:**
```typescript
applicationId: string       // Application ID
adminId: string             // Admin user ID
```

**Returns:** `Promise<CandidateApplication>`

**Example:**
```typescript
const reviewing = await moveToUnderReview(appId, admin.id)
```

---

#### 12. `deleteApplication(applicationId, adminId)`

Delete an application (use with caution).

**Parameters:**
```typescript
applicationId: string       // Application ID
adminId: string             // Admin user ID
```

**Returns:** `Promise<{ success: boolean }>`

**Side Effects:**
- Logs deletion in audit log before deleting
- Permanently removes application and related data

**Example:**
```typescript
const result = await deleteApplication(appId, admin.id)
if (result.success) {
  console.log('Application deleted')
}
```

---

#### 13. `getApplicationAuditLog(applicationId)`

Get admin action history for an application.

**Parameters:**
```typescript
applicationId: string       // Application ID
```

**Returns:** `Promise<any[]>`

**Example:**
```typescript
const logs = await getApplicationAuditLog(appId)
logs.forEach(log => {
  console.log(`${log.action} by ${log.admin_id} at ${log.created_at}`)
})
```

---

## 🎯 Usage Examples

### Example 1: Candidate Application Flow

```typescript
import { 
  createApplication, 
  updateApplication, 
  submitApplication 
} from '../lib/applications'
import { useAuth } from '../contexts/AuthContext'

function ApplicationForm() {
  const { user } = useAuth()
  const [appId, setAppId] = useState<string>()

  // Step 1: Create draft application
  const handleStart = async () => {
    const app = await createApplication(user.id, {
      post_applied_for: 'Software Engineer',
      name: formData.name,
      email: formData.email
    })
    setAppId(app.id)
  }

  // Step 2: Save progress
  const handleSave = async () => {
    if (!appId) return
    
    await updateApplication(appId, {
      permanent_address: formData.address,
      mobile_no: formData.mobile,
      // ... other fields
    })
  }

  // Step 3: Submit application
  const handleSubmit = async () => {
    if (!appId) return
    
    const submitted = await submitApplication(appId)
    console.log('Application submitted:', submitted.status)
    navigate('/candidate/dashboard')
  }
}
```

---

### Example 2: Admin Review Dashboard

```typescript
import { 
  getAllApplications, 
  getApplicationStats,
  approveApplication,
  rejectApplication
} from '../lib/applications'
import { useAuth } from '../contexts/AuthContext'

function AdminDashboard() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get statistics
    const statistics = await getApplicationStats()
    setStats(statistics)

    // Get submitted applications
    const apps = await getAllApplications({ 
      status: 'submitted',
      limit: 20 
    })
    setApplications(apps)
  }

  const handleApprove = async (appId: string) => {
    await approveApplication(appId, profile.id, 'Approved')
    loadData() // Refresh
  }

  const handleReject = async (appId: string) => {
    await rejectApplication(
      appId, 
      profile.id,
      'Incomplete information'
    )
    loadData() // Refresh
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="stats">
        <div>Total: {stats?.total}</div>
        <div>Pending: {stats?.submitted}</div>
        <div>Approved: {stats?.approved}</div>
      </div>

      <div className="applications">
        {applications.map(app => (
          <div key={app.id}>
            <h3>{app.name}</h3>
            <p>Status: {app.status}</p>
            <button onClick={() => handleApprove(app.id)}>
              Approve
            </button>
            <button onClick={() => handleReject(app.id)}>
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### Example 3: Application List with Filters

```typescript
import { getAllApplications } from '../lib/applications'

function ApplicationList() {
  const [applications, setApplications] = useState([])
  const [filters, setFilters] = useState({
    status: 'all',
    searchQuery: '',
    limit: 10,
    offset: 0
  })

  useEffect(() => {
    loadApplications()
  }, [filters])

  const loadApplications = async () => {
    const apps = await getAllApplications(filters)
    setApplications(apps)
  }

  const handleSearch = (query: string) => {
    setFilters({ ...filters, searchQuery: query, offset: 0 })
  }

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status, offset: 0 })
  }

  const handleNextPage = () => {
    setFilters({ ...filters, offset: filters.offset + 10 })
  }

  return (
    <div>
      <input 
        type="text"
        placeholder="Search by name or email"
        onChange={(e) => handleSearch(e.target.value)}
      />

      <select onChange={(e) => handleStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="submitted">Submitted</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="list">
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>

      <button onClick={handleNextPage}>Next Page</button>
    </div>
  )
}
```

---

### Example 4: Application Detail Page

```typescript
import { 
  getApplicationById, 
  getApplicationAuditLog,
  approveApplication,
  rejectApplication
} from '../lib/applications'

function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const { profile } = useAuth()
  const [application, setApplication] = useState(null)
  const [auditLog, setAuditLog] = useState([])

  useEffect(() => {
    loadApplication()
  }, [applicationId])

  const loadApplication = async () => {
    const app = await getApplicationById(applicationId)
    setApplication(app)

    const logs = await getApplicationAuditLog(applicationId)
    setAuditLog(logs)
  }

  const handleApprove = async () => {
    await approveApplication(applicationId, profile.id)
    loadApplication()
  }

  const handleReject = async (reason: string) => {
    await rejectApplication(applicationId, profile.id, reason)
    loadApplication()
  }

  if (!application) return <div>Loading...</div>

  return (
    <div>
      <h1>Application Details</h1>
      <div>
        <h2>{application.name}</h2>
        <p>Email: {application.email}</p>
        <p>Status: {application.status}</p>
        <p>Applied for: {application.post_applied_for}</p>
      </div>

      <div className="audit-log">
        <h3>Action History</h3>
        {auditLog.map(log => (
          <div key={log.id}>
            <p>{log.action} at {log.created_at}</p>
            {log.details && <pre>{JSON.stringify(log.details, null, 2)}</pre>}
          </div>
        ))}
      </div>

      {application.status === 'submitted' && (
        <div>
          <button onClick={handleApprove}>Approve</button>
          <button onClick={() => handleReject('Needs more info')}>
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 🔒 Security Notes

### Row Level Security (RLS)

All database operations respect RLS policies:

1. **Candidates:**
   - Can create applications for themselves only
   - Can view and update their own applications
   - Can only update applications in 'draft' or 'submitted' status

2. **Admins:**
   - Can view all applications
   - Can update any application status
   - Can access audit logs

### Validation

Always validate data before calling functions:

```typescript
// ✅ Good
if (email && email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  await createApplication(userId, { email })
}

// ❌ Bad - no validation
await createApplication(userId, { email: userInput })
```

---

## 🧪 Testing

### Test 1: Create and Submit Application

```typescript
import { createApplication, submitApplication } from '../lib/applications'

const testApp = await createApplication(userId, {
  post_applied_for: 'Test Position',
  name: 'Test User',
  email: 'test@example.com',
  mobile_no: '9876543210',
  nationality: 'Indian'
})

console.log('Created:', testApp.id)
console.log('Status:', testApp.status) // Should be 'draft'

const submitted = await submitApplication(testApp.id)
console.log('New status:', submitted.status) // Should be 'submitted'
```

---

### Test 2: Admin Approval Flow

```typescript
import { approveApplication, getApplicationById } from '../lib/applications'

const before = await getApplicationById(appId)
console.log('Before:', before.status) // 'submitted'

await approveApplication(appId, adminId, 'All good')

const after = await getApplicationById(appId)
console.log('After:', after.status) // 'approved'
console.log('Reviewed by:', after.reviewed_by) // adminId
```

---

## 📊 Database Schema Reference

Applications are stored in the `candidate_applications` table:

```sql
CREATE TABLE candidate_applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  status TEXT CHECK (status IN ('draft', 'submitted', ...)),
  -- ... all application fields
  reviewed_by UUID REFERENCES auth.users,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  submitted_at TIMESTAMP
);
```

---

## 🔗 Related Documentation

- [Authentication Guide](AUTHENTICATION_GUIDE.md)
- [Database Schema](supabase/migrations/complete_schema.sql)
- [TypeScript Types](src/types/index.ts)
- [Supabase Client](src/lib/supabase.ts)

---

## ✅ Best Practices

1. **Always check for null returns:**
   ```typescript
   const app = await getUserApplication(userId)
   if (!app) {
     // Handle no application case
   }
   ```

2. **Use try-catch for error handling:**
   ```typescript
   try {
     await submitApplication(appId)
   } catch (error) {
     console.error('Failed to submit:', error)
     // Show user-friendly message
   }
   ```

3. **Validate required fields before submission:**
   ```typescript
   if (!formData.name || !formData.email) {
     throw new Error('Name and email are required')
   }
   ```

4. **Log admin actions for audit trail:**
   ```typescript
   // Admin actions automatically log to admin_actions_log
   // Access via getApplicationAuditLog(appId)
   ```

5. **Use filters for large datasets:**
   ```typescript
   // Good - paginated
   const apps = await getAllApplications({ limit: 20, offset: 0 })
   
   // Avoid - loads all
   const all = await getAllApplications()
   ```
