# 💰 Paisa — Expense Tracker

A full-featured personal finance tracker with Firebase backend and Netlify deployment.

## Features

- 📊 **13 expense categories**: Rent, EMI, Food, Travel, Fuel, Savings, Utility, Healthcare, Entertainment, Shopping, Subscriptions, Education, Miscellaneous
- 🎯 **Budget allocation**: Set % of salary per category
- 📝 **Expense notes**: Add descriptions (e.g., "Breakfast", "EMI - HDFC car loan") for detailed breakdowns
- 📈 **Breakdown view**: See per-category spending charts grouped by description
- 🗓️ **Monthly navigation**: Browse and compare any past month
- 🔐 **2 user logins** via Firebase Authentication
- ☁️ **Firebase Firestore** database — data persists forever
- 🚀 **Netlify deploy** ready

---

## Setup Guide

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create Project**
2. **Enable Authentication**:
   - Go to Authentication → Sign-in method → Enable **Email/Password**
   - Go to Authentication → Users → **Add user** → create both accounts (e.g., `user1@yourapp.com` and `user2@yourapp.com`)
3. **Enable Firestore**:
   - Go to Firestore Database → **Create database** → Start in **production mode**
   - Set rules:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId}/{document=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
4. **Get your config**:
   - Project Settings → Your apps → **Add app** (Web) → Copy the config

### 2. Local Development

```bash
# Clone and install
npm install

# Create .env file
cp .env.example .env
# Fill in your Firebase config values in .env

# Run dev server
npm run dev
```

### 3. Deploy to Netlify

**Option A — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init
```

**Option B — Netlify UI:**
1. Push this repo to GitHub
2. Go to [Netlify](https://netlify.com) → **Add new site** → Import from GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Add environment variables** in Netlify → Site settings → Environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Deploy!

---

## Data Structure (Firestore)

```
users/
  {userId}/
    months/
      {YYYY-MM}/          ← salary + budget allocations per month
        salary: number
        allocations: { rent: 25, food: 15, ... }
    expenses/
      {expenseId}/        ← individual expense records
        category: string
        amount: number
        note: string       ← "Breakfast", "Monthly rent", etc.
        date: Timestamp
        month: string      ← "2025-06"
```

---

## Usage

1. **Login** with one of the 2 Firebase user accounts
2. Click **⚙️ Budget** → enter your salary and set % per category
3. Click **+ Add Expense** → pick category, enter amount and a description
4. Click any **category card** to see full breakdown with chart
5. Use **‹ ›** arrows to browse previous months

## Tech Stack

- React 18 + Vite
- Firebase 10 (Auth + Firestore)
- Recharts (charts)
- Sora + DM Mono (fonts)
- Netlify (hosting)
