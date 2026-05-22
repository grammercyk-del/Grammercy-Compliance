# Gramercy Compliance Dashboard — Setup & Architecture Guide

## 🎯 Project Overview

**Gramercy Dashboard** is a production-grade Compliance Management System built for KIPL (Krishnapatnam Infrastructure Pvt. Ltd.). It provides enterprise-level compliance tracking, renewal management, risk analytics, and audit trails.

**Technology Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + Dark mode
- Database: Supabase (PostgreSQL)
- Charts: Recharts
- Export: ExcelJS
- Routing: React Router v6
- State: React Hooks (useState + useEffect)

---

## 📁 Project Architecture

### Folder Structure

```
src/
├── api/                    # Supabase API layer
│   ├── compliances.ts      # Compliance CRUD & queries
│   ├── lookups.ts          # Owner, Category, Department CRUD
│   └── alerts.ts           # Alert & risk score queries
├── components/
│   ├── auth/               # Login & auth protection
│   ├── common/             # Reusable UI: Modal, Toast, Skeleton, etc.
│   ├── layout/             # Sidebar, Navbar, AppShell
│   ├── compliance/         # Table, pagination, filters
│   ├── modals/             # Form modals, audit panel
│   ├── filters/            # Advanced filter system
│   ├── charts/             # Recharts visualizations
│   └── dashboard/          # Dashboard cards & stats
├── contexts/               # React Context (Auth, Theme)
├── hooks/                  # Custom hooks (useCompliances, useLookups, useToast)
├── lib/                    # Supabase client initialization
├── pages/                  # Page components (10 routes)
├── types/                  # TypeScript type definitions
├── utils/                  # Helpers (date, status, export, classnames)
├── App.tsx                 # Main routing
├── main.tsx                # Entry point
└── index.css               # Tailwind + global styles
```

### Key Design Patterns

**1. API Layer** (`src/api/`)
- Clean separation between UI and data
- All Supabase queries isolated
- Reusable functions with error handling
- Client-side filter function for flexibility

**2. Custom Hooks** (`src/hooks/`)
- `useCompliances()` — fetches & subscribes to compliance data
- `useLookups()` — fetches owner, category, department dropdowns
- `useToast()` — toast notification system
- Realtime subscriptions to base tables

**3. Contexts** (`src/contexts/`)
- **AuthContext**: User profile, role detection (editor/viewer)
- **ThemeContext**: Dark/light mode toggle with localStorage
- Both provide hooks for easy component access

**4. Component Hierarchy**
```
App
├── ThemeProvider
└── AuthProvider
    └── BrowserRouter
        ├── LoginPage
        └── ProtectedRoute
            └── AppShell (Sidebar + Navbar + Page)
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Flow

1. User logs in → `signIn(email, password)`
2. Session stored in localStorage via Supabase auth
3. On app load, `getCurrentUser()` checks session
4. User role fetched from `user_roles` table
5. ProtectedRoute blocks unauthenticated access

### Roles

- **editor**: Can create, edit, delete compliances
- **viewer**: Read-only access

ProtectedRoute component handles role checks:
```tsx
<ProtectedRoute requireEditor={true}>
  {/* Only editors see this */}
</ProtectedRoute>
```

---

## 📊 Database Schema (Supabase)

### Core Tables

**compliances**
- `compliance_id` (UUID, PK)
- `certificate_no`, `certificate_name`
- `owner_id`, `category_id`, `department_id` (FKs)
- `renewal_frequency`, `last_renewed_date`, `next_renewal_date`
- `notes`, `is_deleted`, `created_at`, `updated_at`

**compliances_audit**
- Tracks all INSERT/UPDATE/DELETE operations
- Stores `old_values` and `new_values` for diffs
- Used by AuditModal for history display

**owners, categories, departments**
- Simple lookup tables with `is_active` soft-delete flag
- Indexed for quick dropdowns

**user_roles**
- Maps user_id to role (editor/viewer)

### Views (Reporting)

- `compliances_with_status` — returns computed status, days_remaining
- `active_owners`, `active_categories`, `active_departments` — filtered by is_active
- `critical_alerts` — overdue/expired compliances
- `owner_risk_scores` — risk metrics per owner

---

## 🎨 Theme & Styling

### Dark Mode

Tailwind v3's `class` strategy:
- Stored in localStorage: `theme: 'light' | 'dark'`
- Applied to `<html class="dark">`
- Components use `dark:` prefix for dark styles

### Color System

**Primary Green** (Brand)
- Light: `#22c55e` (green-500)
- Dark: `#16a34a` (green-600)
- Light hover: `#4ade80` (green-400)

**Status Badges**
- Green (Active), Yellow (Due Soon), Red (Overdue/Expired), Gray (Pending)

**Components** styled with Tailwind layers:
- `.card` — rounded, shadow, border
- `.btn-primary`, `.btn-secondary`, `.btn-danger` — buttons
- `.input`, `.label` — forms
- `.badge-*` — status badges
- `.table-*` — table utilities

---

## 📋 Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginPage | Supabase auth |
| `/` | DashboardPage | Stats, charts, alerts overview |
| `/compliances` | CompliancesPage | Full CRUD table with filters/sort |
| `/alerts` | AlertsPage | Critical overdue/expired items |
| `/risk` | RiskPage | Owner risk analysis & charts |
| `/audit` | AuditPage | Placeholder for global audit log |
| `/owners` | OwnersPage | Placeholder for owner management |
| `/categories` | CategoriesPage | Placeholder for category management |
| `/departments` | DepartmentsPage | Placeholder for department management |
| `/reports` | ReportsPage | Excel export options |
| `/settings` | SettingsPage | Theme toggle, profile, about |

---

## 🔄 Data Flow & Realtime Updates

### Fetch & Subscribe Pattern

```tsx
const { data, loading, error, refetch } = useCompliances()

// Internally:
// 1. Initial fetch from compliances_with_status view
// 2. Subscribe to changes on compliances base table
// 3. On change: refetch view (important!)
// 4. UI updates via React state
```

### Important Rule: Views vs Base Tables

- **Read**: Always use views (`compliances_with_status`, `critical_alerts`)
- **Write**: Always use base tables or RPC calls
- **Real-time**: Subscribe to base tables, refetch views on change
- Derived fields (status, days_remaining) computed in views, never sent from UI

### Soft Delete Pattern

```tsx
await softDeleteCompliance(complianceId)
// Calls RPC: soft_delete_compliance(p_compliance_id)
// Sets is_deleted = true, doesn't remove row
// Refetch removes it from view
```

---

## 📤 Export & Reporting

### Excel Export (ExcelJS)

Three export functions:

1. **exportCompliances()** — full table data
2. **exportAlerts()** — critical items only
3. **exportRiskScores()** — owner risk analysis

Features:
- Green headers with white text
- Formatted dates (dd MMM yyyy)
- Borders and alternating row colors
- Auto-sized columns
- Frozen header row

---

## 🎯 Key Implementation Details

### Form Modal System

**Create/Edit Modal** (`ComplianceFormModal`)
- Loads lookup dropdowns on open
- Pre-fills edit values using `toInputDate()` utility
- Only sends writable fields to Supabase
- Validates renewal_frequency before submit

**Date Handling**
- Database: ISO string (YYYY-MM-DD)
- Form input: `<input type="date">`
- Display: `formatDate()` → "25 May 2026"
- Conversion: `normalizeDate()`, `toInputDate()`

### Filter System

**Client-side filtering** for flexibility:
- Search (certificate_no, certificate_name, owner_name)
- Dropdowns (owner_id, category_id, department_id, status, frequency)
- Date range (next_renewal_date)
- Checkboxes (overdue_only, due_soon_only)
- Filter chips show active filters with X to clear

### Table Features

- **Sortable columns**: Click header to sort (asc/desc toggle)
- **Column visibility**: Hide/show columns via menu
- **Pagination**: 10/20/50/100 rows per page
- **Row actions**: View audit history, edit, delete (editor only)
- **Responsive**: Horizontal scroll on mobile

### Toast Notifications

```tsx
const { toasts, push, dismiss } = useToast()

push('Success!', 'success')        // Auto-dismisses in 4s
push('Error occurred', 'error')
push('Info message', 'info')
push('Warning!', 'warning')
```

---

## 🚀 Getting Started

### Environment Setup

Create `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Gramercy Dashboard
```

### Install & Run

```bash
npm install
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
```

### Supabase Setup Required

Before running, your Supabase project needs:

1. **Tables**: compliances, compliances_audit, owners, categories, departments, user_roles
2. **Views**: compliances_with_status, active_owners, active_categories, active_departments, critical_alerts, owner_risk_scores
3. **Functions**: soft_delete_compliance() RPC
4. **Policies**: RLS enabled (auth checks)
5. **Triggers**: Audit & renewal automation triggers
6. **Auth**: User signup/login configured

---

## 📈 Performance Optimizations

1. **Code Splitting**: Vendor, Supabase, Charts in separate chunks
2. **Dark mode**: CSS-only toggle (no re-render)
3. **Memoization**: useMemo for filtered/sorted data
4. **Pagination**: Only visible rows in table
5. **Realtime**: Throttled with `eventsPerSecond: 10`
6. **Images**: No external images except Google Fonts

---

## 🔍 Debugging Tips

### Check Supabase Connection
```tsx
import { supabase } from '@/lib/supabase'
// In browser console:
supabase.auth.getUser().then(console.log)
```

### Watch Realtime Events
```tsx
const channel = supabase.channel('debug')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'compliances' },
    (payload) => console.log('Change:', payload))
  .subscribe()
```

### Inspect Component State
- React DevTools extension
- Look at `useCompliances()` and `useLookups()` hooks
- Check localStorage for theme & session

---

## 📝 Future Enhancements

- [ ] Owners, Categories, Departments CRUD pages
- [ ] Global audit log page with filtering
- [ ] Bulk actions (multi-select delete, export)
- [ ] Email notifications for upcoming renewals
- [ ] Custom reports builder
- [ ] User management & role assignment UI
- [ ] File attachments for compliances
- [ ] Task assignments & workflows

---

## 👥 Team & Deployment

**Built by:** Claude (Anthropic)  
**Organization:** KIPL (Krishnapatnam Infrastructure Pvt. Ltd.)  
**Deployment:** Vercel (recommended)

**Vercel Deployment:**
```bash
vercel link                # Connect repo
vercel env add VITE_*      # Add environment variables
vercel deploy              # Deploy
```

---

## 📞 Support

For questions, issues, or feature requests, contact your development team. All code follows enterprise SaaS patterns and is production-ready.

**Happy compliance tracking! 🎉**
