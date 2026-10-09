# Smart Waste Collection & Management System — Complete Production Deployment Guide

**Target Architecture:**
- **Frontend:** Vercel (React 18, Vite, Tailwind CSS, Leaflet, PWA)
- **Backend:** Render (Node.js, Express.js, Prisma ORM, JWT, Helmet, Swagger)
- **Database:** Neon PostgreSQL (Serverless PostgreSQL 16+, SSL, PgBouncer pooling)
- **Image Storage:** Cloudinary (Persistent Cloud CDN Object Storage)
- **Code Repository:** GitHub

---

## 1. Architecture & Deployment Matrix

| Tier | Provider | Service Type | Free Tier Specs | Expected Production URL |
|---|---|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Edge Static / SPA | Unlimited deployments, automatic HTTPS & CDN | `https://smartwaste-app.vercel.app` |
| **Backend** | [Render](https://render.com) | Web Service (Node.js) | 512 MB RAM, free tier, auto-sleep after inactivity | `https://smartwaste-backend.onrender.com` |
| **Database** | [Neon](https://neon.tech) | Serverless PostgreSQL | 0.5 GiB storage, pooled & direct connections, SSL | `postgresql://neondb_owner:***@ep-xyz.neon.tech/neondb?sslmode=require` |
| **Media CDN** | [Cloudinary](https://cloudinary.com) | Media Cloud | 25 GB monthly storage & bandwidth | `https://res.cloudinary.com/<cloud-name>/image/upload/...` |

---

## 2. Step 1: GitHub Repository Setup

Ensure your local repository at `C:\projects\smartwaste` is pushed to GitHub.

1. **Create a new repository on GitHub:**
   - Go to [https://github.com/new](https://github.com/new).
   - Repository name: `smartwaste` (or `smart-waste-management-system`).
   - Visibility: **Private** (recommended) or **Public**.
   - Do **NOT** initialize with a README or `.gitignore` (we already have a configured codebase).

2. **Link and push your local commits:**
   ```powershell
   cd C:\projects\smartwaste

   # Rename branch to main if required
   git branch -M main

   # Add your remote origin (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/smartwaste.git

   # Push the codebase
   git push -u origin main
   ```

> [!NOTE]
> All sensitive `.env` files, temporary uploads, and test logs are strictly excluded by `.gitignore`. No private credentials exist in the committed code.

---

## 3. Step 2: Database Provisioning on Neon PostgreSQL

1. **Sign up / Log in to Neon:**
   - Navigate to [https://neon.tech](https://neon.tech) and sign up with GitHub.
2. **Create a New Project:**
   - Project Name: `smartwaste-db`
   - Postgres Version: `16` or `17`
   - Region: Select the region nearest to your users (e.g., `AWS US East (Ohio)` or `Asia Pacific (Singapore)`).
3. **Copy the Connection String:**
   - In the Neon Dashboard, navigate to the **Dashboard** tab.
   - Under **Connection Details**, ensure **Pooled connection** is selected.
   - Copy the string format:
     ```
     postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Save this URL for the backend Render configuration as `DATABASE_URL`.

---

## 4. Step 3: Cloudinary Persistent Media Storage Setup

Render uses an ephemeral filesystem, meaning local `/uploads` files are erased on every deploy or server restart. Cloudinary provides permanent CDN hosting for waste grievance photos and worker resolution proofs.

1. **Sign up / Log in to Cloudinary:**
   - Navigate to [https://cloudinary.com](https://cloudinary.com) and create a free account.
2. **Retrieve API Credentials:**
   - Go to the **Cloudinary Dashboard**.
   - Copy three values:
     - **Cloud Name:** (e.g. `dxyza123`)
     - **API Key:** (e.g. `123456789012345`)
     - **API Secret:** (e.g. `abcdef1234567890_ghijklmnop`)

---

## 5. Step 4: Express API Backend Deployment on Render

1. **Sign up / Log in to Render:**
   - Go to [https://render.com](https://render.com) and sign in with GitHub.
2. **Create New Web Service:**
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository `smartwaste`.
3. **Configure the Service:**
   - **Name:** `smartwaste-backend`
   - **Language / Runtime:** `Node`
   - **Region:** Choose the region closest to your Neon database (e.g. `Oregon (US West)` or `Frankfurt`).
   - **Root Directory:** `backend`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx prisma db push
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
4. **Configure Environment Variables:**
   Under **Environment Variables**, add:

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production security & logging |
   | `PORT` | `10000` | Render internal listening port |
   | `DATABASE_URL` | `postgresql://neondb_owner:***@...neon.tech/neondb?sslmode=require` | Neon connection string |
   | `JWT_SECRET` | *(Click "Generate" or use a 64-char string)* | Token signing secret |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |
   | `CLIENT_URL` | `*` *(or your Vercel URL once deployed)* | Allowed CORS origins |
   | `CLOUDINARY_CLOUD_NAME` | `YOUR_CLOUD_NAME` | Cloudinary credentials |
   | `CLOUDINARY_API_KEY` | `YOUR_API_KEY` | Cloudinary API Key |
   | `CLOUDINARY_API_SECRET` | `YOUR_API_SECRET` | Cloudinary API Secret |

5. **Deploy & Seed Database:**
   - Click **Deploy Web Service**.
   - Render will clone the repository, install dependencies, run `npx prisma db push` to create all PostgreSQL tables on Neon, and start the API.
   - **Seed Initial Demonstration Data:**
     In the Render dashboard, open the **Shell** tab and run:
     ```bash
     node prisma/seed.js
     ```
     This creates the standard municipal service zones, workers (`suresh.worker@smartwaste.gov`), admin (`admin@smartwaste.gov`), and sample citizen accounts.
6. **Verify Backend Health:**
   - Your public backend URL will be: `https://smartwaste-backend.onrender.com`
   - Test health check: `https://smartwaste-backend.onrender.com/api/health`
   - Test Swagger docs: `https://smartwaste-backend.onrender.com/api/docs`

---

## 6. Step 5: React / Vite Frontend Deployment on Vercel

1. **Sign up / Log in to Vercel:**
   - Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. **Import Repository:**
   - Click **Add New...** → **Project**.
   - Select your `smartwaste` GitHub repository.
3. **Configure the Project:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)
4. **Configure Environment Variables:**
   Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://smartwaste-backend.onrender.com/api` |

5. **Deploy:**
   - Click **Deploy**.
   - Vercel will build the frontend and deploy it globally to `https://smartwaste-app.vercel.app` (or custom subdomain).
6. **Lock Down Backend CORS:**
   - Go back to Render → `smartwaste-backend` → **Environment**.
   - Update `CLIENT_URL` from `*` to `https://smartwaste-app.vercel.app` to enforce strict production CORS.

---

## 7. Step 6: End-to-End Verification of the Deployed App

### A. Geolocation & HTTPS GPS Verification
- Because Vercel serves the entire application over valid **HTTPS**, browser security policies permit real-time device geolocation.
- Navigate to `https://smartwaste-app.vercel.app/raise-complaint` on your mobile phone or laptop.
- Click **"Use My GPS"**:
  - Browser prompts: *"Allow smartwaste-app.vercel.app to access your location?"* → Tap **Allow**.
  - High-accuracy GPS returns latitude, longitude, and accuracy radius (e.g. `±14m`).
  - Leaflet map centers smoothly with an accuracy radius circle.
  - Citizens can tap or drag the pin to make manual fine-tuning adjustments.

### B. Persistent Media Uploads (Cloudinary)
- Submit a complaint with a waste photograph.
- Inspect the complaint: the image URL begins with `https://res.cloudinary.com/...`
- Log in as worker (`suresh.worker@smartwaste.gov`), upload a completion photograph, and verify that both images remain accessible and never disappear after Render dyno restarts.

### C. PWA Installation
- On Android (Chrome) or iOS (Safari), tap **"Add to Home Screen"** or **"Install App"**.
- The app installs with the municipal green icon (`icon-192.png`) and functions as a standalone web application.

---

## 8. Verified Demonstration Accounts

| Role | Email | Password |
|---|---|---|
| **Municipal Administrator** | `admin@smartwaste.gov` | `AdminPassword@123` |
| **Sanitation Worker** | `suresh.worker@smartwaste.gov` | `WorkerPassword@123` |
| **Sanitation Worker** | `ramesh.worker@smartwaste.gov` | `WorkerPassword@123` |
| **Citizen** | `priya.citizen@example.com` | `CitizenPassword@123` |
| **Citizen (New)** | *Register freely on `/register`* | *Custom Password* |

---

## 9. Troubleshooting & FAQ

- **Q: Render free tier service spins down after 15 minutes of inactivity.**
  *A:* Free Render instances spin down when idle. The first request after sleep may take ~30–50 seconds to cold start. Once awake, response times return to normal (<50ms). You can use a free uptime monitoring tool (like UptimeRobot) to ping `/api/health` every 10 minutes to prevent sleep if desired.
- **Q: Direct page refresh on Vercel returns 404.**
  *A:* This is prevented by the [`frontend/vercel.json`](file:///C:/projects/smartwaste/frontend/vercel.json) rewrite rule which routes all requests to `/index.html`.
- **Q: Leaflet map tiles don't load over HTTPS.**
  *A:* OpenStreetMap tile URLs use protocol-relative or `https://{s}.tile.openstreetmap.org` URLs, fully compatible with HTTPS.
