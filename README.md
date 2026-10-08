# Smart Waste Collection and Management System

**A Full-Stack, Production-Ready Digital Sanitation Platform for Communities and Municipalities**  
*Built for B.Tech Computer Science Community Service Project (CSP)*

---

## 1. Project Overview & Civic Objective

Rapid urbanization and peri-urban development lead to severe sanitation challenges:
- Irregular door-to-door garbage collection
- Overflowing municipal dustbins and illegal open dumping
- Water stagnation and disease vectors from blocked stormwater drains
- Inability for citizens to report and track waste issues transparently
- Communication gaps between sanitation workers and civic supervisors
- Absence of waste segregation at source (wet, dry, plastic, hazardous, e-waste)

This **Smart Waste Collection and Management System** bridges citizens, sanitation workers, and municipal administrators through a unified mobile-first web application backed by a normalized PostgreSQL database and Express.js REST API.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with Material Design 3 design tokens
- **Icons:** Lucide React
- **Routing:** React Router v6
- **Maps & Geolocation:** Leaflet & React-Leaflet with OpenStreetMap tiles
- **Analytics Visualizations:** Recharts (Bar, Pie, and Area Charts)
- **PWA:** Web App Manifest (`manifest.json`) and Service Worker (`sw.js`)
- **Multilingual Support:** English, Telugu (తెలుగు), Hindi (हिन्दी)

### Backend
- **Runtime:** Node.js (v24 LTS)
- **Framework:** Express.js (ES Module architecture)
- **Database & ORM:** PostgreSQL 18 with Prisma ORM 5
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Authorization:** Role-Based Access Control (`CITIZEN`, `WORKER`, `ADMIN`)
- **Validation:** Zod schema validation on all inputs
- **File Uploads:** Multer with mime-type checking, file size bounds, and local disk storage
- **API Documentation:** OpenAPI 3.0 via Swagger UI
- **Report Generation:** PDFKit (PDF audit stream) and native CSV streaming

---

## 3. User Roles & Workflows

### 1. Citizen Portal
- **Registration & Auth:** Dedicated public citizen sign-up with contact information and password encryption.
- **Raise Complaint:**
  - Auto-generated reference code (`SW-YYYY-XXXX`)
  - Waste classification (Wet, Dry, Plastic, E-waste, Mixed, Other)
  - Issue category (Overflowing dustbin, Garbage not collected, Illegal dumping, Blocked drainage, etc.)
  - Priority selector (Low, Medium, High, Emergency)
  - Interactive Leaflet map with **"Use My GPS"** coordinate capture and draggable pin
  - Photo upload with instant client preview and server-side validation
- **Complaint Tracking:** Visual step-tracker (`Submitted` → `Assigned` → `In Progress` → `Completed`), chronological audit trail, and proof review.
- **Civic Actions:** Reopen complaints if work is incomplete; submit 1–5 star ratings and reviews once resolved.
- **Waste Segregation Guide:** Visual instructions for colour-coded bin disposal and municipal recycling pipelines.

### 2. Sanitation Worker Portal
- **Task Roster:** Filter tasks by `Assigned`, `In Progress`, and `Completed`.
- **Navigation:** Direct OpenStreetMap / GPS turn-by-turn routing to the exact waste location.
- **On-Site Execution:**
  - Update status to `IN_PROGRESS` upon arrival.
  - Upload photographic proof of the cleaned area along with clearance notes.
  - Transition task to `COMPLETED`, automatically timestamping resolution time and notifying the citizen.

### 3. Administrator Control Center
- **Live Database KPIs:** Real metrics for Total Grievances, Pending Queue, Cleaned Sites, and Average Resolution Time in hours.
- **Interactive Visualizations:**
  - Grievances by category (Bar chart)
  - Resolution status distribution (Donut / Pie chart)
  - Municipal ward / zone density (Bar chart)
  - Worker performance leaderboard (Resolved count)
- **Worker Allocation:** Re-assign open complaints to specific sanitation workers and zones.
- **Schedule Management:** Add, update, and cancel municipal collection timetables.
- **Reporting & Audits:** 1-click downloads for raw CSV datasets and formatted PDF municipal audit reports.

---

## 4. Database Architecture (Prisma & PostgreSQL)

The relational database (`smartwaste_db`) contains 9 relational tables:

```
[User] 1---1 [Worker]
   |            |
   | 1        1 |
   |            |
[Complaint] ----+
   |  |
   |  +--- * [ComplaintStatusHistory]
   |  +--- * [CompletionProof]
   |  +--- 1 [Feedback]
   |  +--- * [Notification]
   |
[ServiceZone] 1---* [CollectionSchedule]
       | 1
       +----* [Worker]
```

---

## 5. Local Setup Instructions (Windows)

### Prerequisites
1. **Node.js** (v18 or higher recommended)
2. **PostgreSQL 14+** (running locally on port 5432 or via Docker)

### Step 1: Clone or Open Project
```powershell
cd C:\projects\smartwaste
```

### Step 2: Database Setup & Migration
Verify that PostgreSQL service is running and configure credentials in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:Cse@123@localhost:5432/smartwaste_db?schema=public"
JWT_SECRET="smartwaste_csp_jwt_secret_production_ready_2026_key"
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./uploads
```

Push the Prisma schema to PostgreSQL:
```powershell
cd backend
npx.cmd prisma db push
```

### Step 3: Seed Demo Data
Populate the database with demo administrator, workers, citizens, zones, schedules, and complaints:
```powershell
node prisma/seed.js
node prisma/create-sample-images.js
```

### Step 4: Start Backend Server
```powershell
# From C:\projects\smartwaste\backend:
node --watch src/server.js
```
*Backend will be running at:* `http://localhost:5000`  
*Swagger API Docs available at:* `http://localhost:5000/api/docs`  
*Health check:* `http://localhost:5000/api/health`

### Step 5: Start Frontend Dev Server
Open a second terminal window:
```powershell
cd C:\projects\smartwaste\frontend
npm.cmd run dev
```
*Frontend will be running at:* `http://localhost:5173`

---

## 6. Demo Accounts (For Viva / Evaluation)

For fast demonstration during college review, the Login screen contains **1-tap autofill buttons** for all three roles:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartwaste.gov` | `AdminPassword@123` | Full control center, KPIs, worker allocation, CSV/PDF export |
| **Worker (North)** | `ramesh.worker@smartwaste.gov` | `WorkerPassword@123` | Assigned to Gandhi Nagar Ward, task navigation & proof upload |
| **Worker (Central)** | `suresh.worker@smartwaste.gov` | `WorkerPassword@123` | Waste truck driver for Clock Tower Commercial Hub |
| **Citizen (Rahul)** | `rahul.citizen@example.com` | `CitizenPassword@123` | Residential user with active complaints and notifications |
| **Citizen (Priya)** | `priya.citizen@example.com` | `CitizenPassword@123` | Citizen with high priority plastic waste report |

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Citizen registration |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve session profile |
| `POST` | `/api/complaints` | Citizen / Admin | Create new complaint with GPS & photo |
| `GET` | `/api/complaints` | Authenticated | Role-filtered complaints list with search |
| `GET` | `/api/complaints/:id` | Authenticated | Complaint details, history & proofs |
| `PATCH` | `/api/complaints/:id/status`| Worker / Admin | Transition status (`IN_PROGRESS`, `COMPLETED`) |
| `PATCH` | `/api/complaints/:id/assign`| Admin | Assign sanitation personnel |
| `POST` | `/api/complaints/:id/reopen`| Citizen | Reopen unresolved complaint |
| `GET` | `/api/workers/tasks` | Worker | Fetch tasks assigned to authenticated worker |
| `POST` | `/api/workers/tasks/:id/completion-proof` | Worker | Upload cleanup photo & close task |
| `GET` | `/api/schedules` | Authenticated | View collection calendar by ward |
| `POST` | `/api/schedules` | Admin | Create new pickup timetable |
| `POST` | `/api/feedback` | Citizen | Submit 1–5 star rating & feedback |
| `GET` | `/api/notifications` | Authenticated | Fetch in-app notifications |
| `GET` | `/api/admin/statistics` | Admin | Real database counts & avg resolution time |
| `GET` | `/api/admin/analytics` | Admin | Chart aggregations for Recharts |
| `GET` | `/api/admin/export/csv` | Admin | Stream raw CSV complaint audit dump |
| `GET` | `/api/admin/export/pdf` | Admin | Generate formatted PDF municipal report |

---

## 8. Test Execution Results

The automated integration test suite verifies backend authentication, role protection, complaints submission, scheduling, and notifications against live PostgreSQL:

```powershell
npm.cmd test
```

**Results:**
- `✔ 1. Health Check Endpoint (46ms)`
- `✔ 2. Authentication Flow - Citizen Registration & Login (239ms)`
- `✔ 3. Role-Based Access Control (RBAC) Enforcement (185ms)`
- `✔ 4. Citizen Complaint Creation and Retrieval Flow (123ms)`
- `✔ 5. Collection Schedule Retrieval & Filtering (93ms)`
- `✔ 6. In-App Notifications Fetch and Mark Read (108ms)`
- **All 6 tests passing, 0 failures.**

---

## 9. Viva / Evaluation Talking Points

1. **Why PostgreSQL & Prisma?**
   - Relational integrity ensures no orphaned complaints, enforces foreign keys across status histories and completion proofs, and transactions prevent race conditions during worker task allocation.
2. **How does GPS capture work without proprietary APIs?**
   - The app uses standard browser Geolocation API (`navigator.geolocation`) with high accuracy enabled, combined with OpenStreetMap tiles via Leaflet, ensuring 100% free, privacy-preserving municipal deployment without Google Maps API billing.
3. **How is security handled?**
   - Sensitive administrator endpoints enforce backend checks (`authorizeRoles('ADMIN')`), passwords are salted and hashed with `bcryptjs`, file uploads are strictly validated by mimetype and extension on the server, and rate limiting protects against brute force attacks.
4. **Is data persistent?**
   - Yes. All complaints, images, proofs, ratings, schedules, and user credentials persist in PostgreSQL.
