# IronTrack — Deployment Guide

## What you're deploying
- **Admin Dashboard** → `https://yoursite.com/` (password protected)
- **Client PWA** → `https://yoursite.com/client` (clients install this)

---

## Step 1 — Prerequisites
Install these once on your computer:
- [Node.js](https://nodejs.org) (download the LTS version)
- [Git](https://git-scm.com/downloads)
- A free [GitHub](https://github.com) account
- A free [Vercel](https://vercel.com) account (sign up with GitHub)

---

## Step 2 — Set up the project locally
Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
cd irontrack
npm install
npm run dev
```

Visit `http://localhost:5173` — you should see the app running locally.

---

## Step 3 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial IronTrack deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/irontrack.git
git push -u origin main
```

(Create a new repo on GitHub first at github.com/new — name it `irontrack`)

---

## Step 4 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your `irontrack` repository
4. Leave all settings as default — Vercel detects Vite automatically
5. Click **Deploy**

Your app will be live at `https://irontrack.vercel.app` (or similar) in ~60 seconds.

---

## Step 5 — Give clients the PWA link
Send clients this URL:
```
https://yoursite.vercel.app/client
```

**iPhone instructions to share with clients:**
1. Open the link in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add" — the IronTrack icon appears on their home screen

**Android instructions:**
1. Open the link in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Install"

---

## Step 6 — Custom domain (optional)
In Vercel → your project → Settings → Domains, add your own domain (e.g. `irontrack.yourgym.com`).

---

## URLs summary
| Who | URL | How to access |
|-----|-----|---------------|
| You (admin) | `https://yoursite.vercel.app/` | Browser, login required |
| Clients | `https://yoursite.vercel.app/client` | Install as PWA from phone |

---

## Local development
```bash
npm run dev      # start local server
npm run build    # build for production
npm run preview  # preview production build locally
```

Any time you push changes to GitHub, Vercel automatically redeploys.
