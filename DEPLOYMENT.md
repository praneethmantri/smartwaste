# 🚀 Smart Waste Management System - Cloud Deployment Guide

This full-stack application (React 19 + Express.js + PostgreSQL + Prisma) is pre-configured for automated cloud deployment with zero configuration needed.

---

## 🌟 Option 1: 1-Click Deployment on Render (Recommended & Free)

The project includes a ready-to-use [`render.yaml`](./render.yaml) blueprint that automatically provisions:
- A free managed PostgreSQL database (`smartwaste-db`)
- A production Node.js web service running both the Express API and React frontend (`smartwaste-app`)
- Automatic database schema creation (`prisma db push`) and demo data seeding on startup

### Step 1: Push Project to GitHub

Open PowerShell or Terminal in `d:/smartwaste/smartwaste` and run:

```bash
# 1. Rename local branch to main (if not already)
git branch -M main

# 2. Add your GitHub repository URL (replace with your repo link)
git remote add origin https://github.com/YOUR_USERNAME/smartwaste.git

# 3. Push code to GitHub
git push -u origin main
```

---

### Step 2: Deploy on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in (or sign up with GitHub).
2. Click the **"New +"** button at top right and select **"Blueprint"**.
3. Select your GitHub repository (`smartwaste`).
4. Render will detect [`render.yaml`](./render.yaml) automatically:
   - **PostgreSQL Database**: Free Tier (`smartwaste-db`)
   - **Web Service**: Free Tier (`smartwaste-app`)
   - **Build Command**: `npm run deploy:build`
   - **Start Command**: `npm start`
5. Click **"Apply"**.
6. Render will build the React frontend, generate the Prisma client, apply database migrations, and boot up the server.

Once deployment completes (approx 2–3 minutes), your app will be live at:
`https://smartwaste-app-xxxx.onrender.com`

---

## 🚂 Option 2: Deploy on Railway

If you prefer [Railway](https://railway.app):

1. Go to [railway.app](https://railway.app) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and choose your repository.
3. Click **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
4. In your Web Service settings:
   - Go to **Variables** -> Add Reference -> Select `DATABASE_URL` from PostgreSQL.
   - Add `JWT_SECRET` (e.g. `your_super_secret_jwt_key_12345`).
   - Add `NODE_ENV` = `production`.
5. In **Settings** -> **Build Command**: `npm run deploy:build`
6. In **Settings** -> **Start Command**: `npm start`
7. Click **Generate Domain** under Settings -> Networking.

---

## 🔑 Pre-Configured Demo Credentials

On initial deployment, the database is automatically seeded with demo accounts:

| Role | Email | Password |
|---|---|---|
| **Municipal Administrator** | `admin@smartwaste.gov` | `Admin@123` |
| **Field Sanitation Worker** | `ramesh.worker@smartwaste.gov` | `Worker@123` |
| **Citizen (Rahul Sharma)** | `rahul.citizen@example.com` | `Citizen@123` |
| **Citizen (Priya Patel)** | `priya.patel@example.com` | `Citizen@123` |

---

## 🛠️ Architecture Notes

- **Unified Single-Port Hosting**: In production, Express directly serves the pre-built React application from `frontend/dist`. This eliminates CORS issues, domain mismatches, and saves hosting costs.
- **Auto-Seeding**: [`backend/src/server.js`](./backend/src/server.js) checks if the database is empty upon boot; if so, it automatically runs [`backend/prisma/seed.js`](./backend/prisma/seed.js) so your live app has sample complaints, workers, and zones right away.
- **Leaflet & OpenStreetMap**: Configured in CSP to render maps without external API keys.
- **Multilingual Support**: Fully baked into the frontend bundle with English, Telugu, and Hindi translations.
