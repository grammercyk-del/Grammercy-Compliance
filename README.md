# KIPL Compliance Intelligence Platform

A real-time compliance tracking and management system built with Next.js and Supabase.

## ✨ Features

- ✅ **Live Real-Time Tracking** - Updates appear instantly across all devices
- ✅ **Role-Based Access** - KIPL admin vs Gramercy view-only access
- ✅ **Multi-Device Access** - Works on desktop, mobile, tablet
- ✅ **Automated Alerts** - Smart notifications for expiring compliances
- ✅ **Status Dashboard** - Visual overview of all compliance statuses
- ✅ **Secure Authentication** - Email magic link login
- ✅ **100% Free Hosting** - Runs on free Supabase + Vercel tiers

---

## 🚀 Quick Start (15 Minutes)

### Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- A Supabase account (free) - [Sign up](https://supabase.com)
- A Vercel account (free) - [Sign up](https://vercel.com)

---

## Step 1: Setup Supabase (5 minutes)

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: KIPL Compliance
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to Mumbai (Singapore or Mumbai if available)
4. Click **"Create new project"** and wait 2 minutes

### 1.2 Run Database Schema

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"+ New query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy ALL the content and paste it into the SQL editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" ✅

### 1.3 Get API Keys

1. Click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. **Save these somewhere** - you'll need them in Step 2

### 1.4 Enable Email Auth

1. Go to **"Authentication"** in left sidebar
2. Click **"Providers"**
3. Make sure **"Email"** is enabled
4. Scroll down to **"Email Templates"**
5. Click **"Magic Link"** template
6. Make sure it's enabled ✅

---

## Step 2: Setup Local Development (5 minutes)

### 2.1 Download and Install

```bash
# Navigate to the project folder
cd kipl-compliance

# Install dependencies
npm install
```

### 2.2 Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```

### 2.3 Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## Step 3: Create User Accounts (3 minutes)

### 3.1 Sign Up First User

1. Go to your running app (localhost:3000)
2. Enter your KIPL email: `yourname@kesariprojects.com`
3. Click "Send Login Link"
4. Check your email and click the magic link
5. You'll be redirected to the dashboard

### 3.2 Add User Profile (Important!)

The first time you login, you need to manually add your profile in Supabase:

1. Go to Supabase → **"Table Editor"** → **"user_profiles"**
2. Click **"Insert row"**
3. Fill in:
   - **id**: Copy from **"Authentication" → "Users"** (your user ID)
   - **email**: `yourname@kesariprojects.com`
   - **full_name**: Your Name
   - **role**: `super_admin` or `kipl_admin`
   - **organization**: `KIPL`
4. Click **"Save"**

Now refresh your dashboard - you should see full access! ✅

### 3.3 Add More Users

Repeat the process for:
- KIPL team members (role: `kipl_user`, organization: `KIPL`)
- Gramercy viewers (role: `gramercy_viewer`, organization: `Gramercy`)

**Email Restriction for KIPL:**
- Only emails ending in `@kesariprojects.com` should have KIPL roles
- Gramercy users can have any authorized email

---

## Step 4: Deploy to Vercel (2 minutes)

### 4.1 Push to GitHub (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kipl-compliance.git
git push -u origin main
```

### 4.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. In **"Environment Variables"**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **"Deploy"**
6. Wait 2-3 minutes ⏳

Your app is now LIVE! 🎉

You'll get a URL like: `https://kipl-compliance.vercel.app`

---

## 🎯 How to Use

### For KIPL Team:

1. **Login** with your `@kesariprojects.com` email
2. **View Dashboard** - see all compliance statuses in real-time
3. **Add Compliance** - click "+ Add Compliance" button
4. **Edit/Delete** - use action buttons in the table
5. **Check Alerts** - click bell icon to see expiring compliances
6. **Multi-Device** - login from phone, laptop, tablet - all sync live!

### For Gramercy Team:

1. **Login** with your authorized email
2. **View Dashboard** - see all compliance data (read-only)
3. **Check Status** - monitor KIPL compliance in real-time
4. **Download Reports** - export data (coming in Phase 2)
5. **No Editing** - view-only access for transparency

---

## 🔥 Live Real-Time Feature

**How it works:**

When ANY KIPL team member updates a compliance:
```
KIPL User in Mumbai Office updates status
        ↓
Supabase Database (cloud)
        ↓
INSTANT broadcast to ALL connected devices:
  ✅ Gramercy client laptop (New York)
  ✅ KIPL manager phone (Mumbai)
  ✅ Your tablet (anywhere)
```

**No refresh needed** - changes appear INSTANTLY! ⚡

**Test it:**
1. Open dashboard on your laptop
2. Open same dashboard on your phone (or different browser)
3. Update a compliance from laptop
4. Watch it update LIVE on your phone! 🚀

---

## 📊 Understanding Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| ✅ Compliant | Green | More than 60 days until due |
| 🟡 Due in 60 Days | Yellow | Between 30-60 days |
| 🟠 Due in 30 Days | Orange | Between 7-30 days |
| 🔴 Due in 7 Days | Red | Less than 7 days - URGENT |
| ⛔ Expired | Dark Red | Past due date - CRITICAL |
| ⚪ Pending | Grey | Not yet active |

These are **auto-calculated** based on due dates!

---

## 🔐 Security Features

- ✅ **Row Level Security (RLS)** - Users only see what they should
- ✅ **Email Verification** - No password vulnerabilities
- ✅ **Role-Based Access** - KIPL can edit, Gramercy can only view
- ✅ **Activity Logs** - Track who changed what
- ✅ **Secure API** - All data encrypted in transit

---

## 💰 Costs (Spoiler: $0!)

### Free Tier Limits:

**Supabase Free Plan:**
- ✅ 500MB database (enough for 10,000+ compliances)
- ✅ Unlimited API requests
- ✅ Unlimited real-time connections
- ✅ 1GB file storage
- ✅ 50,000 monthly active users

**Vercel Free Plan:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Custom domain support
- ✅ Automatic SSL certificates

**You won't hit these limits** for years! 🎯

---

## 🛠️ Common Issues & Solutions

### Issue: "Missing Supabase environment variables"

**Solution:**
1. Check `.env.local` file exists
2. Verify both variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`

### Issue: "Access Denied" after login

**Solution:**
1. Go to Supabase → Table Editor → user_profiles
2. Check if your user profile exists
3. Verify `role` and `organization` are set correctly
4. Refresh the dashboard

### Issue: Real-time updates not working

**Solution:**
1. Check browser console for errors
2. Verify Supabase Realtime is enabled
3. Check SQL script ran successfully
4. Try hard refresh (Ctrl+Shift+R)

### Issue: Can't receive magic link emails

**Solution:**
1. Check spam/junk folder
2. Verify email in Supabase → Authentication → Users
3. Check Supabase → Authentication → Providers → Email is enabled
4. Wait 2-3 minutes (sometimes delayed)

---

## 📱 Mobile Access

The dashboard is **fully responsive**:

- ✅ Works on iPhone/Android
- ✅ Works on tablets
- ✅ Touch-friendly interface
- ✅ Same real-time features
- ✅ No app installation needed

Just open the URL in your mobile browser and login!

---

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:
```js
colors: {
  primary: {
    500: '#4CAF50', // Change to your brand color
  }
}
```

### Add More Departments

Edit `components/AddComplianceModal.tsx`:
```tsx
const departments = [
  'Fire',
  'Environmental',
  'YourNewDepartment', // Add here
];
```

### Change Company Name

Edit `app/dashboard/page.tsx`:
```tsx
<h1>KIPL Compliance Portal</h1>
// Change to your company name
```

---

## 🚀 Phase 2 Features (Coming Soon)

These features can be added later:

- 📎 File uploads for certificates (Supabase Storage)
- 📧 Automated email alerts
- 📊 Advanced analytics & charts
- 📄 PDF report generation
- 🔍 OCR for certificate auto-extraction
- 📱 Push notifications
- 🔄 Bulk import from Excel
- 👥 Department-wise access control

---

## 📞 Support

If you need help:

1. Check the **Common Issues** section above
2. Review Supabase docs: https://supabase.com/docs
3. Check Next.js docs: https://nextjs.org/docs
4. Contact your system administrator

---

## 📝 License

This project is built for KIPL internal use.

---

## 🎉 You're All Set!

Your compliance platform is now:
- ✅ Running live
- ✅ Accessible from anywhere
- ✅ Updating in real-time
- ✅ Completely free to operate
- ✅ Secure and scalable

**Next Steps:**
1. Add your team members
2. Import your compliance data
3. Start tracking in real-time!

Welcome to the future of compliance management! 🚀
