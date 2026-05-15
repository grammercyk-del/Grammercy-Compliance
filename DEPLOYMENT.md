# 🚀 KIPL Compliance Platform - Quick Deployment Checklist

Follow this step-by-step to get your system live in 15 minutes!

---

## ✅ Pre-Deployment Checklist

- [ ] Node.js 18+ installed on your computer
- [ ] Supabase account created (free)
- [ ] Vercel account created (free)
- [ ] GitHub account (for deployment)

---

## 📋 Step-by-Step Deployment

### ⏱️ STEP 1: Supabase Setup (5 min)

- [ ] Create new Supabase project
  - Name: KIPL Compliance
  - Region: Singapore/Mumbai
  - Save your database password!

- [ ] Run the database schema
  - Go to SQL Editor
  - Copy content from `supabase-schema.sql`
  - Paste and run
  - ✅ Should see "Success"

- [ ] Get your API credentials
  - Go to Settings → API
  - Copy **Project URL**
  - Copy **anon public** key
  - Save both somewhere safe!

- [ ] Enable email authentication
  - Go to Authentication → Providers
  - Check that Email is enabled
  - Done!

---

### ⏱️ STEP 2: Local Setup (5 min)

- [ ] Open terminal in project folder

- [ ] Install dependencies
  ```bash
  npm install
  ```

- [ ] Create environment file
  ```bash
  cp .env.example .env.local
  ```

- [ ] Add your Supabase credentials to `.env.local`
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

- [ ] Start development server
  ```bash
  npm run dev
  ```

- [ ] Open http://localhost:3000
  - ✅ Should see login page

---

### ⏱️ STEP 3: Create Your Account (2 min)

- [ ] Enter your email on login page
  - Use: `yourname@kesariprojects.com`

- [ ] Check your email for magic link

- [ ] Click the magic link
  - You'll see "Access Denied" - this is normal!

- [ ] Add your user profile in Supabase
  - Go to Supabase → Table Editor → user_profiles
  - Click "Insert row"
  - Fill in:
    * **id**: (copy from Authentication → Users)
    * **email**: yourname@kesariprojects.com
    * **full_name**: Your Name
    * **role**: super_admin
    * **organization**: KIPL
  - Click Save

- [ ] Refresh your dashboard
  - ✅ Should now see full dashboard!

---

### ⏱️ STEP 4: Deploy to Vercel (3 min)

- [ ] Push code to GitHub
  ```bash
  git init
  git add .
  git commit -m "KIPL Compliance Platform"
  git branch -M main
  # Create repo on GitHub first, then:
  git remote add origin https://github.com/yourusername/kipl-compliance.git
  git push -u origin main
  ```

- [ ] Deploy on Vercel
  - Go to vercel.com
  - Click "Add New" → "Project"
  - Import your GitHub repo
  - Add environment variables:
    * NEXT_PUBLIC_SUPABASE_URL
    * NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Click "Deploy"
  - Wait 2-3 minutes

- [ ] Test your live site
  - ✅ Visit the Vercel URL
  - ✅ Login should work
  - ✅ Dashboard should load

---

## 🎉 You're Live!

Your app is now:
- ✅ Running on the internet
- ✅ Accessible from any device
- ✅ Updating in real-time
- ✅ Completely free
- ✅ Ready for your team!

---

## 👥 Next Steps

### Add Team Members:

For each KIPL team member:
1. They login with their @kesariprojects.com email
2. You add their profile in Supabase:
   - role: `kipl_admin` or `kipl_user`
   - organization: `KIPL`

For Gramercy viewers:
1. They login with their authorized email
2. You add their profile:
   - role: `gramercy_viewer`
   - organization: `Gramercy`

### Add Compliance Data:

1. Login to your dashboard
2. Click "+ Add Compliance"
3. Fill in the details
4. Save!

**OR** import your existing data:
- You can manually add from your Excel sheet
- Or we can add bulk import feature later

---

## 🧪 Test Real-Time Feature

1. Open dashboard on your laptop
2. Open same site on your phone
3. Add a compliance from laptop
4. Watch it appear INSTANTLY on phone! ⚡

---

## 🆘 If Something Goes Wrong

### Can't login?
- Check spam folder for magic link
- Make sure email is verified in Supabase

### "Access Denied" error?
- Make sure you added your user_profile in Supabase
- Check role and organization are correct

### Real-time not working?
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify SQL script ran successfully

### Vercel deployment failed?
- Check environment variables are set
- Make sure both Supabase keys are added
- Try redeploying

---

## 📞 Need Help?

Check the full README.md for detailed troubleshooting!

---

**Estimated Total Time: 15 minutes**

Ready? Let's do this! 🚀
