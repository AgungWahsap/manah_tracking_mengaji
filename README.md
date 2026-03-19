# 🕌 Manah Tracking — Sistem Absensi Sholat Berjamaah

<p align="center">
  <strong>Sistem manajemen absensi sholat 5 waktu untuk pesantren</strong><br/>
  Dibangun dengan React.js, Express.js, PostgreSQL & Drizzle ORM
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📖 Deskripsi

**Manah Tracking** adalah aplikasi web full-stack untuk mengelola absensi sholat berjamaah 5 waktu di lingkungan pesantren. Sistem ini menggantikan proses absensi manual (kertas) menjadi digital, dilengkapi dengan dashboard real-time, fitur pengajuan izin, tracking sholat sunnah, dan export laporan.

### ❓ Masalah yang Diselesaikan

| Masalah | Solusi |
|---|---|
| Absensi manual sering tercecer | Digitalisasi penuh dengan database |
| Rekap bulanan memakan waktu berjam-jam | Export otomatis ke Excel |
| Santri tidak punya email pribadi | Login via **kode akses unik** |
| Sulit memantau kedisiplinan santri | Dashboard + statistik real-time |

---

## ✨ Fitur Utama

### 👤 Fitur User (Santri/Staff)
- 🔐 **Login Kode Unik** — Masuk tanpa email/password
- 🕐 **Jadwal Sholat Real-time** — Countdown menuju adzan berikutnya
- ✅ **Check-in Mandiri** — Absen langsung dari HP saat waktu sholat masuk
- 📝 **Pengajuan Izin** — Ajukan izin sakit/khidmat dengan approval workflow
- 📊 **Dashboard Pribadi** — Lihat statistik kehadiran (hadir, telat, alfa, izin)
- 📜 **Riwayat Absensi** — Filter per minggu, bulan, atau semester
- 🤲 **Tracking Sholat Sunnah** — Catat ibadah sunnah harian

### 👨‍💼 Fitur Admin
- 📋 **Bulk Attendance** — Input absensi banyak santri sekaligus
- 📊 **Rekap Global** — Lihat absensi seluruh santri per hari/minggu/bulan
- ✅ **Approval Izin** — Setujui atau tolak pengajuan izin santri
- 👥 **Manajemen Data Santri** — CRUD data pengguna
- 🔑 **Manajemen Kode Akses** — Generate dan kelola kode login
- 📤 **Export Data** — Download laporan dalam format Excel
- ⚙️ **Pengaturan Sistem** — Atur jadwal sholat dan toleransi waktu

---

## 🛠️ Teknologi

### Frontend (`apps/web`)

| Teknologi | Fungsi |
|---|---|
| [React 18](https://react.dev/) | UI Library |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |
| [React Router v7](https://reactrouter.com/) | Client-side Routing |
| [TanStack React Query](https://tanstack.com/query) | Server State Management |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| [Axios](https://axios-http.com/) | HTTP Client |
| [Better Auth (Client)](https://www.better-auth.com/) | Session Management |

### Backend (`apps/api`)

| Teknologi | Fungsi |
|---|---|
| [Express.js 5](https://expressjs.com/) | HTTP Server Framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe SQL Query Builder |
| [PostgreSQL](https://www.postgresql.org/) | Relational Database |
| [Better Auth](https://www.better-auth.com/) | Authentication Framework |
| [Zod](https://zod.dev/) | Schema Validation |
| [ExcelJS](https://github.com/exceljs/exceljs) | Excel Export |
| [Helmet](https://helmetjs.github.io/) | Security Headers |

### Infrastructure

| Teknologi | Fungsi |
|---|---|
| [Vercel](https://vercel.com/) | Deployment (Frontend + Backend) |
| npm Workspaces | Monorepo Management |

---

## 📁 Struktur Proyek

```
manah-tracking/
├── apps/
│   ├── api/                          # Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── auth/                 # Better Auth + Custom Plugin
│   │   │   │   ├── index.ts          # Auth configuration
│   │   │   │   └── code-login-plugin.ts  # Login via kode unik
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle ORM schema (10 tabel)
│   │   │   │   ├── index.ts          # Database connection
│   │   │   │   └── seed.ts           # Seed data awal
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts # requireAuth, requireAdmin
│   │   │   │   └── error.middleware.ts
│   │   │   ├── routes/               # Express route handlers
│   │   │   │   ├── attendance.routes.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── ...
│   │   │   ├── services/             # Business logic layer
│   │   │   │   ├── attendance.service.ts  # Core: check-in, stats, recap
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── ...
│   │   │   └── index.ts              # Express app entry
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── web/                          # Frontend (React + Vite)
│       ├── src/
│       │   ├── components/           # Reusable UI components
│       │   │   ├── HeroSection.jsx   # Prayer times + check-in
│       │   │   ├── StatsSection.jsx  # Attendance statistics
│       │   │   ├── Sidebar.jsx       # User navigation
│       │   │   ├── SidebarAdmin.jsx  # Admin navigation
│       │   │   └── layouts/          # UserLayout, AdminLayout
│       │   ├── pages/                # Route pages
│       │   │   ├── Dashboard.jsx
│       │   │   ├── GlobalRecap.jsx
│       │   │   ├── AdminBulkAttendance.jsx
│       │   │   └── ...
│       │   ├── services/             # API service layer
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/                  # API client, auth client
│       │   └── App.jsx               # Router configuration
│       └── package.json
│
├── package.json                      # Root monorepo config
└── docker-compose.yml                # PostgreSQL container
```

---

## 🚀 Instalasi & Setup

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v15+ (atau Docker)
- **npm** v9+

### 1. Clone Repository

```bash
git clone https://github.com/AgungWahsap/Manah-Tracking.git
cd Manah-Tracking
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

**Opsi A: Docker (Recommended)**

```bash
docker-compose up -d
```

**Opsi B: PostgreSQL Lokal**

Buat database baru di PostgreSQL:

```sql
CREATE DATABASE manah_tracking;
```

### 4. Konfigurasi Environment

```bash
# Copy file .env.example
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/manah_tracking
BETTER_AUTH_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 5. Migrasi & Seed Database

```bash
# Push schema ke database
cd apps/api
npm run db:push

# (Opsional) Seed data awal
npm run db:seed
```

### 6. Jalankan Development Server

```bash
# Dari root directory — jalankan frontend + backend bersamaan
npm run dev
```

Akses:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📊 Database Schema

Sistem menggunakan **10 tabel utama** dengan relasi yang terstruktur:

```
User ──┬── AttendanceRecord (5 waktu × hari)
       ├── Permit (izin sakit/khidmat)
       ├── SunnahRecord (tracking sholat sunnah)
       ├── AccessCode (login tanpa password)
       ├── Session (auth session)
       └── ActivityLog (audit trail)

Asrama ──── User (one-to-many)
PrayerTime ──── AttendanceRecord (reference)
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/login/code` | — | Login dengan kode unik |
| `POST` | `/api/attendance/check-in` | User | Absensi mandiri |
| `POST` | `/api/attendance/permit` | User | Ajukan izin |
| `GET` | `/api/attendance/history` | User | Riwayat absensi |
| `GET` | `/api/attendance/stats` | User | Statistik kehadiran |
| `GET` | `/api/attendance/today-status` | User | Status hari ini |
| `POST` | `/api/attendance/bulk` | Admin | Bulk attendance input |
| `GET` | `/api/attendance/global` | Admin | Rekap global |
| `PUT` | `/api/attendance/permit/:id` | Admin | Approve/reject izin |
| `GET` | `/api/attendance/report` | Admin | Report untuk export |
| `DELETE` | `/api/attendance/daily` | Admin | Reset absensi harian |
| `GET` | `/api/dashboard/prayer-times` | User | Jadwal sholat |
| `GET` | `/api/users` | Admin | Data santri |
| `GET` | `/api/codes` | Admin | Manajemen kode akses |

---

## 🚢 Deployment

Proyek ini di-deploy ke **Vercel** sebagai dua project terpisah:
- `apps/web` → Frontend (Static/SSR)
- `apps/api` → Backend (Serverless Functions)

Frontend menggunakan **Vercel Rewrites** (`vercel.json`) untuk mem-proxy request `/api/*` ke backend, sehingga menghindari masalah CORS dan cookie cross-origin.

---

## 📝 License

MIT License — Silakan gunakan dan modifikasi sesuai kebutuhan.

---

<p align="center">
  Dibuat dengan ❤️ untuk pesantren Indonesia 🇮🇩
</p>
