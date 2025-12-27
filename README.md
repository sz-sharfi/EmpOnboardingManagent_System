# Onboarding Application UI

A modern, full-featured onboarding application built with React, TypeScript, Vite, and Supabase.

## 🚀 Features

### Candidate Portal
- ✅ User authentication and signup
- ✅ Multi-step application form with validation
- ✅ Save draft and resume later
- ✅ Document upload management
- ✅ Application status dashboard
- ✅ Application preview and print

### Admin Portal  
- ✅ Admin authentication
- ✅ View all applications
- ✅ Review and approve/reject applications
- ✅ Filter and search applications
- ✅ Detailed application review page

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Supabase** - Backend & Database
- **Lucide React** - Icons

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd onboarding-ui-vite
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Supabase**
- Create a Supabase account at https://supabase.com
- Create a new project
- Get your project URL and anon key from Settings → API
- Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Run database migration**
- Go to Supabase SQL Editor
- Copy and paste contents of `supabase/migrations/001_init.sql`
- Execute the script

5. **Start development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:5173
```

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Detailed Supabase configuration
- **[DATABASE_TROUBLESHOOTING.md](DATABASE_TROUBLESHOOTING.md)** - Fix common issues
- **[DATABASE_FIX_SUMMARY.md](DATABASE_FIX_SUMMARY.md)** - Technical implementation details
- **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Complete testing checklist
- **[FLOW_DIAGRAM.md](FLOW_DIAGRAM.md)** - Visual architecture diagrams

## 🧪 Testing

### Browser Console Debug
Open browser console (F12) and run:
```javascript
testSupabase()  // Test complete setup
listApps()      // List your applications  
checkApp('id')  // Check specific application
```

### Verification
```bash
# Run build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── pages/
│   ├── candidate/          # Candidate portal pages
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ApplicationFormPage.tsx
│   │   ├── DocumentUploadPage.tsx
│   │   └── ApplicationPreviewPage.tsx
│   └── admin/              # Admin portal pages
│       ├── AdminLoginPage.tsx
│       ├── AdminDashboardPage.tsx
│       └── ApplicationDetailPage.tsx
├── utils/
│   ├── supabaseClient.ts   # Supabase configuration
│   ├── supabaseDebug.ts    # Debug utilities
│   └── validation.ts       # Form validation
├── types/
│   └── index.ts            # TypeScript interfaces
├── styles/
│   └── index.css           # Global styles & Tailwind
└── App.tsx                 # Main app with routing

supabase/
├── migrations/
│   └── 001_init.sql        # Database schema & RLS policies
└── verify_setup.sql        # Database verification script
```

## 🔐 Environment Variables

Required variables in `.env.local`:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 🐛 Troubleshooting

### Common Issues

**"Missing Supabase URL or Anon Key"**
- Create `.env.local` file with correct credentials
- Restart dev server

**"relation 'applications' does not exist"**
- Run migration script in Supabase SQL Editor

**Data not inserting**
- Check browser console for errors
- Run `testSupabase()` in console
- Verify you're logged in
- Check [DATABASE_TROUBLESHOOTING.md](DATABASE_TROUBLESHOOTING.md)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
