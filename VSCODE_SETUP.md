# 🎨 VS Code Setup & Quick Start

## 🚀 Open Project in VS Code

### **Option 1: Using File Explorer (Easiest)**

1. **Open File Explorer**
2. Navigate to: `C:\Users\Prathamesh\gramercy-dashboard`
3. **Right-click in the folder**
4. Select **"Open with Code"**
5. VS Code will open with the project loaded

### **Option 2: Using VS Code Directly**

1. **Open VS Code**
2. **File → Open Folder**
3. Select: `C:\Users\Prathamesh\gramercy-dashboard`
4. Click **Select Folder**

### **Option 3: Using Command Prompt**

```bash
cd C:\Users\Prathamesh\gramercy-dashboard
code .
```

---

## 📋 What's Configured for You

When you open the project in VS Code, you'll see:

### ✅ **Tasks** (Pre-configured commands)
- Dev Server (npm run dev)
- Install Dependencies (npm install)
- Production Build (npm run build)
- Preview Build (npm run preview)
- Type Check (tsc --noEmit)

### ✅ **Launch Configurations** (Debugging)
- Chrome debugging
- Firefox debugging

### ✅ **Recommended Extensions**
- Prettier (code formatting)
- ESLint (code linting)
- Tailwind CSS IntelliSense
- React snippets
- Chrome debugger

### ✅ **VS Code Settings**
- Auto-format on save
- Prettier configured
- TypeScript strict mode
- Tab size: 2 spaces
- Path aliases enabled (@/)

---

## 🎯 Start the Dev Server (3 Ways)

### **Way 1: Using VS Code Tasks (EASIEST)**

1. **Open the Command Palette** (Ctrl+Shift+P or Cmd+Shift+P on Mac)
2. **Type:** `Tasks: Run Task`
3. **Select:** `Dev Server (npm run dev)`
4. Terminal opens and shows:
   ```
   ➜  Local:   http://localhost:5173/
   ```
5. **Click the link or open browser to:** `http://localhost:5173/login`

### **Way 2: Using Terminal**

1. **Open Terminal in VS Code** (Ctrl+`)
2. **Type:**
   ```bash
   npm run dev
   ```
3. **Open browser:** `http://localhost:5173/login`

### **Way 3: Using Debug (Chrome)**

1. **Press F5** or go to **Run → Start Debugging**
2. **Select:** `Gramercy Dashboard - Chrome`
3. **Chrome opens automatically** with the app
4. **Debug your code** with breakpoints

---

## 📦 Install Dependencies First

If this is your first time:

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type:** `Tasks: Run Task`
3. **Select:** `Install Dependencies (npm install)`
4. **Wait for completion** (may take 1-2 minutes)
5. **Then run the dev server** (see above)

---

## 🔧 VS Code Keyboard Shortcuts for This Project

| What | Shortcut |
|------|----------|
| Command Palette | Ctrl+Shift+P |
| Open Terminal | Ctrl+` |
| Run Task | Ctrl+Shift+P → "Tasks: Run Task" |
| Start Debugging | F5 |
| Format Document | Shift+Alt+F |
| Go to File | Ctrl+P |
| Go to Definition | Ctrl+Click |
| Find & Replace | Ctrl+H |
| Toggle Sidebar | Ctrl+B |
| Split Editor | Ctrl+\ |

---

## 📂 Project Structure in VS Code

When you open the project, you'll see:

```
gramercy-dashboard/
├── src/                    ← Your code goes here
│   ├── api/               ← Supabase queries
│   ├── components/        ← React components
│   ├── pages/            ← Page components
│   ├── App.tsx           ← Main app file
│   └── main.tsx          ← Entry point
├── .vscode/              ← VS Code config (created for you)
│   ├── tasks.json       ← Pre-configured tasks
│   ├── launch.json      ← Debug configurations
│   ├── settings.json    ← Editor settings
│   └── extensions.json  ← Recommended extensions
├── .env                 ← Environment variables
├── .gitignore          ← Git ignore rules
├── package.json        ← Dependencies
├── vite.config.ts      ← Vite configuration
├── tailwind.config.js  ← Tailwind CSS config
└── QUICK_START.md      ← Getting started guide
```

---

## 💻 Run Different Commands

### **Build for Production**

1. **Command Palette** → `Tasks: Run Task`
2. **Select:** `Production Build (npm run build)`
3. **Output:** `dist/` folder created

### **Preview Production Build**

1. **Command Palette** → `Tasks: Run Task`
2. **Select:** `Preview Build (npm run preview)`
3. **Opens:** `http://localhost:4173/`

### **Type Check**

1. **Command Palette** → `Tasks: Run Task`
2. **Select:** `Type Check (tsc --noEmit)`
3. **Shows:** TypeScript errors (if any)

---

## 🐛 Debugging in VS Code

### **Set Breakpoints**

1. **Click line number** on the left to add a red dot
2. **Run dev server** with F5 (Chrome debugging)
3. **When code reaches breakpoint**, it pauses
4. **Inspect variables** in Debug panel

### **Debug Console**

1. **Bottom panel** shows logs & errors
2. **Type commands** in debug console

### **Watch Expressions**

1. **Add watches** in Debug panel
2. **Monitor variables** in real-time

---

## 🎨 Code Formatting

### **Auto-Format on Save**
- Prettier is configured
- Just save (Ctrl+S) and it formats automatically

### **Manual Format**
1. **Select code** (or Ctrl+A for all)
2. **Shift+Alt+F** to format
3. **Code reformats** instantly

---

## 🔍 Useful Extensions (Already Recommended)

When you open the project, VS Code will suggest these:

- **Prettier** — Code formatter
- **ESLint** — Code linting
- **Tailwind CSS** — Class suggestions
- **React Snippets** — Quick code templates
- **Chrome Debugger** — Debug in browser
- **GitHub Copilot** — AI code suggestions (optional)

**Install them from the Extensions panel (Ctrl+Shift+X)**

---

## ⚡ Quick Workflow

### **Typical Day of Development**

1. **Open project** in VS Code
2. **Ctrl+Shift+P → Tasks: Run Task → Dev Server**
3. **Edit files** in `src/` folder
4. **Browser auto-refreshes** as you save (HMR)
5. **Use Chrome debugger** (F5) to debug
6. **Format code** (Shift+Alt+F) before saving
7. **Type check** to catch errors (Ctrl+Shift+P → Type Check)
8. **Build for production** when ready

---

## 🚨 Common Issues & Fixes

### **"npm: command not found"**
- Node.js not installed
- Restart VS Code after installing Node.js

### **"Port 5173 already in use"**
- Another app is using port 5173
- Kill it or use different port
- Or close other terminals running npm

### **"Cannot find module"**
- Run: `Install Dependencies (npm install)` task
- Restart VS Code

### **Code not auto-formatting**
- Install Prettier extension
- Save file again (Ctrl+S)

### **Breakpoints not working**
- Make sure you're using F5 (Chrome debugging)
- Not just the dev server

---

## 📚 Next Steps

1. ✅ Open project in VS Code (you're here!)
2. ⏭️ **Run: `Dev Server (npm run dev)` task**
3. ⏭️ Open browser: `http://localhost:5173/login`
4. ⏭️ Read QUICK_START.md in VS Code
5. ⏭️ Create Supabase user
6. ⏭️ Add test data
7. ⏭️ Explore the dashboard!

---

## 🎯 One-Line Start

**Copy & paste in VS Code Terminal (Ctrl+`):**

```bash
npm install && npm run dev
```

Then open: `http://localhost:5173/login`

---

## 📞 Help

- **VS Code Tips?** — Press F1 or Ctrl+Shift+P
- **Project Issues?** — Read QUICK_START.md
- **Supabase Issues?** — Check PROJECT_SETUP.md
- **Code Issues?** — Check browser console (F12)

---

**Ready?** Press Ctrl+Shift+P and select "Dev Server (npm run dev)" 🚀
