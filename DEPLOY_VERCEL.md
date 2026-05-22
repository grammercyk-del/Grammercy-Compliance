# 🚀 Deploy to Vercel — Complete Guide

## ✅ Prerequisites

Before deploying, make sure you have:

- ✅ Gramercy Dashboard built locally (working on `npm run dev`)
- ✅ GitHub account (Vercel uses GitHub for deployments)
- ✅ Vercel account (sign up at vercel.com)
- ✅ Supabase project with credentials
- ✅ Git repository pushed to GitHub

---

## 📋 Step 1: Push Code to GitHub

### **If you haven't already:**

```bash
cd C:\Users\Prathamesh\gramercy-dashboard

# Initialize git if not already
git init
git add .
git commit -m "Initial commit: Gramercy Dashboard"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/gramercy-dashboard.git
git branch -M main
git push -u origin main
```

### **Replace with your actual GitHub URL!**

---

## 🔑 Step 2: Create Vercel Account

1. **Go to:** https://vercel.com
2. **Click:** "Sign Up"
3. **Choose:** "Continue with GitHub"
4. **Authorize** Vercel to access your GitHub account
5. **Done!** You're logged in

---

## 📤 Step 3: Import Project to Vercel

### **Option A: From Vercel Dashboard (Easiest)**

1. **Go to:** https://vercel.com/dashboard
2. **Click:** "Add New..."
3. **Select:** "Project"
4. **Search** for: `gramercy-dashboard` repository
5. **Click:** "Import"
6. **Click:** "Deploy"
7. **Wait** ~2-3 minutes for deployment

### **Option B: Using Vercel CLI**

```bash
npm i -g vercel
cd C:\Users\Prathamesh\gramercy-dashboard
vercel
```

Follow the prompts to link your project.

---

## 🔐 Step 4: Add Environment Variables

**IMPORTANT:** Your `.env` file has sensitive Supabase credentials. You need to add them to Vercel.

### **Method 1: Via Vercel Dashboard (Easy)**

1. **Go to:** https://vercel.com/dashboard
2. **Select** your project: `gramercy-dashboard`
3. **Click:** "Settings"
4. **Click:** "Environment Variables"
5. **Add 3 variables:**

```
Name: VITE_SUPABASE_URL
Value: https://ikqqrqakaszwcezgqmbs.supabase.co
Environment: Production, Preview, Development
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcXFycWFrYXN6d2NlemdxbWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjc0MjQsImV4cCI6MjA5NDY0MzQyNH0.Mcj-sWqFbgjC45yD8UB_5uJkOiMLOMw85rfl7l8VLfU
Environment: Production, Preview, Development
```

```
Name: VITE_APP_NAME
Value: Gramercy Dashboard
Environment: Production, Preview, Development
```

6. **Click:** "Save"

### **Method 2: Using Vercel CLI**

```bash
vercel env add VITE_SUPABASE_URL
# Paste: https://ikqqrqakaszwcezgqmbs.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add VITE_APP_NAME
# Type: Gramercy Dashboard
```

---

## 🔄 Step 5: Redeploy with Environment Variables

After adding environment variables:

1. **Go to:** https://vercel.com/dashboard
2. **Select** your project
3. **Click:** "Deployments"
4. **Find** the latest deployment
5. **Click:** the three dots (...)
6. **Select:** "Redeploy"
7. **Click:** "Redeploy"

**Wait** ~1-2 minutes for the new deployment to complete.

---

## ✅ Step 6: Verify Deployment

### **Check if it's working:**

1. **Go to:** https://vercel.com/dashboard
2. **Select** your project
3. **Look for** a blue "Ready" checkmark
4. **Copy** the deployment URL (looks like: `gramercy-dashboard-xyz.vercel.app`)
5. **Open** in browser: `https://your-project.vercel.app/login`
6. **You should see** the login page!

### **If you see errors:**

Click the **"View Logs"** button to see what went wrong.

---

## 🔗 Step 7: Set Custom Domain (Optional)

### **Add your own domain:**

1. **Go to** your project settings on Vercel
2. **Click:** "Domains"
3. **Enter** your domain (e.g., `dashboard.mycompany.com`)
4. **Follow** instructions to update DNS settings
5. **Wait** 10-30 minutes for DNS to propagate

---

## 🚀 Step 8: Automatic Deployments

**Great news!** Vercel is now set up for automatic deployments:

- ✅ **Every time you push to GitHub**, Vercel automatically deploys
- ✅ **Preview deployments** for pull requests
- ✅ **Production deployment** when you merge to `main`

**Workflow:**
```
1. Make changes locally
2. git commit and git push to GitHub
3. Vercel automatically deploys
4. Your site is updated in seconds!
```

---

## 📊 Verify Deployment Works

### **Test the app:**

1. **Open** your deployed URL: `https://your-project.vercel.app`
2. **Go to** `/login` page
3. **Create** a test user in Supabase
4. **Log in** — you should see the dashboard!
5. **Test features:**
   - Create a compliance
   - Edit it
   - Delete it
   - Export to Excel
   - Switch to dark mode
   - Try filters

---

## 🐛 Troubleshooting

### **"Blank page" or "Cannot find module"**

**Solution:**
- Check that environment variables are added
- Redeploy the project
- Check build logs in Vercel

### **"Port 5173 not found"**

**Solution:**
- This is normal for production
- Vercel uses port 3000
- Your app should work fine

### **"Login not working"**

**Solution:**
- Check Supabase credentials in environment variables
- Make sure Supabase project is active
- Verify user exists in Supabase Authentication

### **"CORS error"**

**Solution:**
- Add your Vercel domain to Supabase CORS settings
- In Supabase: Authentication → URL Configuration
- Add your Vercel URL to allowed redirect URLs

---

## 🔒 Security Checklist

Before going live:

- ✅ Never commit `.env` file to GitHub
- ✅ Environment variables added to Vercel
- ✅ Supabase RLS policies enabled
- ✅ User authentication working
- ✅ Role-based access control tested
- ✅ No console errors in browser
- ✅ HTTPS enforced (automatic on Vercel)

---

## 📈 Monitoring Deployment

### **View deployment status:**

1. **Go to:** https://vercel.com/dashboard
2. **Select** your project
3. **Click:** "Deployments" tab
4. **See** all deployment history

### **View logs:**

1. **Click** on a deployment
2. **View** "Build Logs"
3. **View** "Runtime Logs"

---

## 🎯 Advanced: Custom Build Settings (Optional)

If you need to customize build settings:

1. **Create file:** `vercel.json` in project root

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key"
  }
}
```

2. **Push to GitHub**
3. **Vercel automatically deploys** with new settings

---

## 💰 Pricing

**Vercel is FREE for:**
- ✅ Static sites (like yours!)
- ✅ Up to 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ SSL/HTTPS

**You only pay if you use serverless functions** (which you're not).

---

## 🔄 Update Process

**After deployment, to update your app:**

1. **Make changes** locally
2. **Test** with `npm run dev`
3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Feature: Add X functionality"
   git push origin main
   ```
4. **Vercel automatically deploys** in seconds!

---

## 📚 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Supabase:** https://supabase.com
- **GitHub:** https://github.com

---

## ✨ You're Live!

Your app is now deployed and automatically updating whenever you push to GitHub.

**Share your live URL:**
- https://your-project.vercel.app

---

## 🆘 Need Help?

If something doesn't work:

1. **Check Vercel logs** (Deployments → click deployment → View Logs)
2. **Check browser console** (F12 → Console)
3. **Check Supabase** status
4. **Review VSCODE_SETUP.md** for local testing
5. **Read PROJECT_SETUP.md** for architecture details

---

## 📋 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_NAME)
- [ ] Redeployed with env vars
- [ ] Verified blue "Ready" checkmark
- [ ] Tested login at deployed URL
- [ ] Tested creating compliance
- [ ] Tested filters and export
- [ ] Tested dark mode
- [ ] Shared URL with team

---

**Congratulations! Your Gramercy Dashboard is now live! 🎉**

Built by Claude (Anthropic) for KIPL
May 22, 2026
