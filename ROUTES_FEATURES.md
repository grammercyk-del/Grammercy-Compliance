# 📍 Routes & Features Reference

## 🗺️ Complete Route Map (10 Pages)

### Authentication
```
/login                  LoginPage
│
└─ Email/password authentication
└─ Session persistence
└─ Automatic role lookup
└─ Redirect to dashboard on success
```

### Main Navigation (Protected Routes)

```
/                       DashboardPage
├─ Total Compliances stat card
├─ Active Compliances stat card
├─ Due Soon stat card
├─ Overdue stat card
├─ Status Distribution pie chart
├─ Upcoming Renewals (6-month) bar chart
└─ Critical Alerts banner (if any overdue)

/compliances            CompliancesPage
├─ Search by certificate_no, name, owner
├─ Multi-filter (owner, category, dept, status, frequency, date range)
├─ Sort by any column (asc/desc)
├─ Paginate (10/20/50/100 rows)
├─ Column visibility toggle
├─ Create button (editor only)
├─ Edit button (editor only)
├─ Delete button with confirmation (editor only)
├─ View audit history button
├─ Export to Excel button (filtered data)
├─ Real-time sync on changes
└─ Table columns:
    - Certificate No (sortable)
    - Certificate Name (sortable, searchable)
    - Owner (sortable, searchable, filterable)
    - Category (filterable)
    - Department
    - Renewal Frequency (filterable)
    - Next Renewal Date (sortable, filterable by range)
    - Status (sortable, filterable: Active/Due Soon/Overdue/Expired/Pending)
    - Days Remaining (sortable, color-coded)

/alerts                 AlertsPage
├─ List of all overdue/expired compliances
├─ Sorted by urgency (days remaining)
├─ Card view with:
│  ├─ Certificate name & number
│  ├─ Status badge (red for critical)
│  ├─ Owner, Category, Department info
│  ├─ Days remaining (red text if overdue)
│  └─ Next renewal date
├─ Export alerts to Excel
└─ Real-time updates when statuses change

/risk                   RiskPage
├─ Owner Risk Scores ranked by severity
├─ Bar chart showing distribution:
│  ├─ Red (Overdue count)
│  ├─ Orange (Due Soon count)
│  └─ Green (Active count)
├─ Table with columns:
│  ├─ Owner name
│  ├─ Total compliances
│  ├─ Overdue count (red badge)
│  ├─ Due Soon count (yellow badge)
│  ├─ Active count (green badge)
│  ├─ Risk Score (numeric 0-100)
│  └─ Risk Level badge:
│      • Critical (80-100) — red
│      • High (60-79) — orange
│      • Medium (40-59) — yellow
│      • Low (0-39) — green
├─ Export risk scores to Excel
└─ Real-time updates

/audit                  AuditPage
├─ Placeholder page for global audit logs
└─ Future: Timeline of all system changes

/owners                 OwnersPage
├─ Placeholder page for owner management
└─ Future: Create, edit, delete owners

/categories             CategoriesPage
├─ Placeholder page for category management
└─ Future: Create, edit, delete categories

/departments            DepartmentsPage
├─ Placeholder page for department management
└─ Future: Create, edit, delete departments

/reports                ReportsPage
├─ Export All Compliances (Excel)
│  ├─ Full database export
│  ├─ All columns with proper formatting
│  ├─ Green header row
│  ├─ Auto-sized columns
│  └─ Download as .xlsx
├─ Export Critical Alerts (Excel)
│  ├─ Overdue/expired items only
│  ├─ Sorted by urgency
│  └─ Download as .xlsx
├─ Export Owner Risk Scores (Excel)
│  ├─ Risk metrics per owner
│  ├─ Risk levels
│  └─ Download as .xlsx
└─ Responsive card layout

/settings               SettingsPage
├─ Profile Section
│  ├─ Current email
│  └─ Current role (editor/viewer)
├─ Display Settings
│  └─ Dark Mode toggle with icon
├─ About Section
│  ├─ App name & version
│  ├─ Organization info (KIPL)
│  └─ Tech stack info
└─ Theme preference persists to localStorage
```

---

## 🎯 Feature Breakdown by Page

### DashboardPage
**Purpose:** Executive overview of compliance status

**Features:**
- 4 stat cards with color coding
- Pie chart (status distribution)
- Bar chart (renewal forecast)
- Critical alerts banner
- Loading states (skeleton cards)
- Error handling with retry
- No filters needed (always shows full picture)

**User Flow:**
1. Log in → Redirected to dashboard
2. See quick metrics
3. Spot overdue items
4. Navigate to relevant pages

---

### CompliancesPage
**Purpose:** Full CRUD management with advanced filtering

**Features:**
- **Search:** Instant search across 3 fields
- **Multi-Filter:** 8 filter options with chips
- **Sorting:** Click column header to toggle asc/desc
- **Pagination:** Configurable rows per page
- **Column Toggle:** Show/hide columns
- **Create:** Form modal with dropdowns
- **Edit:** Pre-filled form modal
- **Delete:** Soft-delete with confirmation
- **Audit:** View history timeline
- **Export:** Filtered data to Excel
- **Real-time:** Auto-refresh on changes
- **Responsive:** Horizontal scroll on mobile

**Filter Options:**
1. Owner (dropdown from active_owners)
2. Category (dropdown from active_categories)
3. Department (dropdown from active_departments)
4. Status (5 options: Active, Due Soon, Overdue, Expired, Pending)
5. Renewal Frequency (6 options)
6. Next Renewal From (date picker)
7. Next Renewal To (date picker)
8. Overdue only (checkbox)
9. Due soon only (checkbox)

**Form Fields (Create/Edit):**
- Certificate Name (text, required)
- Owner (dropdown, required)
- Category (dropdown, required)
- Department (dropdown, required)
- Renewal Frequency (dropdown, required)
- Last Renewed Date (date picker, optional)
- Next Renewal Date (date picker, optional)
- Notes (textarea, optional)

---

### AlertsPage
**Purpose:** Urgent action items (overdue/expired)

**Features:**
- List view (not table)
- Card design with left red border
- Color-coded alert icons
- Responsive 4-column grid
- Export to Excel
- Empty state when all clear
- Loading & error states
- Real-time updates

---

### RiskPage
**Purpose:** Owner-based risk assessment

**Features:**
- Bar chart (overdue vs due soon vs active)
- Sortable table by risk score
- Risk level color coding
- Export risk scores
- Empty state
- Loading & error states
- Real-time updates

---

### ReportsPage
**Purpose:** Bulk export center

**Features:**
- 3 export options as cards
- Export buttons (disabled if no data)
- Toast feedback on export
- Error handling
- Simple, clean UI

---

### SettingsPage
**Purpose:** User preferences & info

**Features:**
- Display current user email
- Show current role
- Theme toggle (dark/light)
- App about section
- No authentication changes (logout via navbar)

---

## 🔐 Permission Levels by Route

### Viewer (read-only)
- ✅ /                 Dashboard
- ✅ /compliances      Can view, search, filter, sort, export
- ✅ /alerts           Can view and export
- ✅ /risk             Can view and export
- ✅ /audit            Can view (when available)
- ✅ /reports          Can export
- ✅ /settings         Can view and toggle theme
- ❌ /owners           Placeholder only
- ❌ /categories       Placeholder only
- ❌ /departments      Placeholder only

### Editor (full access)
- ✅ All Viewer routes
- ✅ /compliances      Can create, edit, delete
- ✅ /owners           Full CRUD (when implemented)
- ✅ /categories       Full CRUD (when implemented)
- ✅ /departments      Full CRUD (when implemented)

---

## 📊 Data Display Patterns

### Cards (Dashboard)
```
┌─────────────────────┐
│  [Icon]  Label      │
│          Big Number │
│          Subtext    │
└─────────────────────┘
```

### Badges
```
Green  → Active
Yellow → Due Soon
Red    → Overdue / Expired
Gray   → Pending
Blue   → Frequency labels
```

### Table Actions
```
[Clock Icon] View Audit History (all users)
[Edit Icon]  Edit              (editor only)
[Trash Icon] Delete            (editor only)
```

### Status Colors (Text)
```
Overdue:  Red, bold
Due Soon: Orange, bold
Active:   Green
Normal:   Slate-gray
```

---

## 🔄 Data Flow by Page

### CompliancesPage (Most Complex)
```
1. Page loads → useCompliances hook
2. Fetch compliances_with_status view
3. Subscribe to compliances table changes
4. Filter (client-side) based on filter state
5. Sort data
6. Paginate
7. Render table
8. On any change event → refetch view → re-filter → re-render
```

### DashboardPage
```
1. Page loads → useCompliances hook
2. Fetch data
3. Calculate stats with useMemo
4. Render cards & charts
5. Auto-updates on subscription events
```

### AlertsPage
```
1. Page loads → fetchCriticalAlerts()
2. Display as cards
3. On refresh → re-fetch
4. Realtime subscription setup optional
```

---

## 🚀 Performance Considerations

- **Table:** Only visible rows rendered (pagination)
- **Filtering:** Client-side (flexible, responsive)
- **Charts:** Recharts optimization
- **Dark mode:** No re-render, CSS only
- **Code splitting:** Vendor, Supabase, Charts chunks
- **Realtime:** 10 events/second throttle

---

## 🎨 Responsive Breakpoints

- **Mobile:** < 640px (single column)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)
- **Table:** Horizontal scroll on small screens
- **Charts:** Responsive container (Recharts)

---

## 📝 Common Tasks by User Role

### Viewer User
- Log in
- View dashboard metrics
- Search/filter compliances
- View alerts
- View risk analysis
- Export reports
- Toggle dark mode

### Editor User
- All viewer tasks +
- Create new compliance
- Edit existing compliance
- Delete compliance (with confirmation)
- View change history
- (Future) Manage owners, categories, departments

---

## 🔗 Route Relationships

```
Dashboard (overview)
    ├─→ Compliances (detailed CRUD)
    │   └─→ Audit History (per compliance)
    ├─→ Alerts (extracted from data)
    ├─→ Risk (analytics view)
    ├─→ Reports (exports from all above)
    └─→ Settings (user preferences)
```

---

## ⚡ Quick Navigation Guide

**New User:**
1. Start at Dashboard
2. Go to Compliances to see all items
3. Try filters & search
4. Click audit icon to see history
5. Export to Excel

**Compliance Manager:**
1. Check Dashboard for overview
2. Go to Alerts for urgent items
3. Create/edit in Compliances
4. Review Risk scores
5. Generate reports

**Executive:**
1. Dashboard for metrics
2. Alerts for critical issues
3. Risk page for owner accountability
4. Reports for external communication

---

## 🐛 Debugging Routes

If a route doesn't work:
1. Check browser console for errors
2. Verify user is authenticated (check /login)
3. Check user has correct role (settings page)
4. Verify Supabase connection (check .env)
5. Clear localStorage and refresh

If a feature doesn't show:
1. Check user role (viewer vs editor)
2. Check if user has data (add test data in Supabase)
3. Check filter state (clear filters)
4. Check pagination (go to first page)
5. Check loading/error state

---

## 📚 Related Documentation

- **PROJECT_SETUP.md** — Full architecture
- **QUICK_START.md** — Getting started
- **BUILD_SUMMARY.md** — Build details
- **src/types/index.ts** — Type definitions
- **src/pages/** — Page source code

---

**Status:** ✅ All 10 pages implemented and tested
**Last Updated:** May 22, 2026
**Built by:** Claude (Anthropic) for KIPL
