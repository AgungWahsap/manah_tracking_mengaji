# 🕌 Manah Tracking — Sistem Absensi Mengaji

<p align="center">
  <strong>Sistem absensi mengaji berbasis input massal admin untuk pesantren</strong><br/>
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

**Manah Tracking** adalah aplikasi web full-stack untuk mengelola absensi mengaji di pesantren. Admin masuk menggunakan kode unik, mengatur jadwal, mengisi absensi santri secara massal, dan melihat rekap. Santri hanya menjadi data peserta dan tidak memiliki akun login.

### ❓ Masalah yang Diselesaikan

| Masalah | Solusi |
|---|---|
| Absensi manual sering tercecer | Digitalisasi penuh dengan database |
| Rekap absensi sulit dihitung | Rekap dan export CSV berdasarkan periode |
| Input absensi mengaji secara manual | Input massal digital per sesi |
| Daftar santri perlu dikelompokkan | Kelas dengan impor dan export Excel |
| Santri tidak membutuhkan akses aplikasi | Login hanya untuk admin |

---

## ✨ Fitur Utama

### 👨‍💼 Fitur Admin
- 🔐 **Login kode unik admin** — Santri tidak dapat login
- ✅ **Absensi massal** — Pilih Hadir (H), Sakit (S), Izin (I), atau Alfa (A)
- 🟠 **Alfa otomatis** — Status yang tidak diubah akan tersimpan sebagai Alfa
- 📖 **Empat sesi mengaji** — Subuh, Dzuhur, Ashar, dan Isya
- 👥 **Data peserta** — Tambah, ubah, dan nonaktifkan data santri tanpa membuat akun
- 🏫 **Kelas dan Excel** — Kelompokkan peserta, unduh template `.xlsx`, lalu impor nama/NIS
- 📊 **Rekap dan CSV** — Lihat dan unduh catatan per periode dan sesi
- ⚙️ **Pengaturan waktu** — Atur jam sesi melalui web admin

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
│   │   │   │   ├── schema.ts         # Schema admin, peserta, jadwal, dan absensi
│   │   │   │   ├── index.ts          # Database connection
│   │   │   │   └── seed.ts           # Jadwal sesi dan admin awal
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts # requireAuth, requireAdmin
│   │   │   │   └── error.middleware.ts
│   │   │   ├── routes/               # Express route handlers
│   │   │   │   ├── recitation.routes.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── ...
│   │   │   ├── services/             # Business logic layer
│   │   │   │   ├── recitation.service.ts  # Peserta, sesi, absensi, rekap
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── ...
│   │   │   └── index.ts              # Express app entry
│   │   ├── drizzle.config.ts
│   │   ├── drizzle/                  # SQL migrasi data awal
│   │   └── package.json
│   │
│   └── web/                          # Frontend (React + Vite)
│       ├── src/
│       │   ├── components/           # Header, navigation, shared UI
│       │   │   ├── SidebarAdmin.jsx
│       │   │   └── layouts/AdminLayout.jsx
│       │   ├── pages/                # Route pages
│       │   │   ├── AdminBulkAttendance.jsx
│       │   │   ├── GlobalRecap.jsx
│       │   │   ├── DataSantri.jsx
│       │   │   └── AdminSettings.jsx
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

## 🚀 Instalasi & Setup (Neon + lokal)

### Prerequisites

- **Node.js** v18+
- **Database Neon PostgreSQL** (PostgreSQL lokal tidak diperlukan)
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

### 3. Setup database Neon

1. Buat project Neon dan branch **development** khusus pengujian.
2. Dari halaman **Connect**, pilih database `neondb` lalu salin connection string PostgreSQL.
3. Untuk menjalankan Drizzle dari laptop, gunakan koneksi direct jika tersedia; pastikan koneksi menggunakan TLS (`sslmode=require`).
4. Jangan gunakan branch produksi untuk pengujian atau migrasi.

### 4. Konfigurasi Environment

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Edit `apps\api\.env` dan ganti connection string dengan nilai dari Neon:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 5. Schema, migrasi data, dan seed

Jalankan schema Drizzle:

```powershell
Set-Location apps\api
npm run db:push
```

Setelah berhasil, buka **Neon SQL Editor**, pastikan branch development yang benar dipilih, lalu jalankan seluruh isi `apps\api\drizzle\0001_recitation_attendance.sql` satu kali. Migrasi ini menyalin data santri lama dan menonaktifkan akses login non-admin di database yang dipilih; jangan jalankan pada branch produksi.

Kembali ke PowerShell (masih di `apps\api`) dan seed jadwal serta admin:

```powershell
npm run db:seed
```

Simpan kode admin yang ditampilkan seed untuk login. File `.env` lokal tidak boleh dibagikan atau dimasukkan ke Git.

### 6. Jalankan Development Server

```powershell
# Kembali ke root repository
Set-Location ..\..
# Jalankan frontend + backend bersamaan
npm run dev
```

Akses:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

Gunakan `http://localhost:5173` saat login lokal. Cookie development hanya dinonaktifkan atribut `Secure` untuk HTTP lokal; di production tetap `Secure`.

---

## 📊 Database Schema

Data baru disimpan terpisah dari tabel absensi shalat lama:

```
User (admin) ──┬── AccessCode ── Session
               └── RecitationAttendance (admin pencatat)

RecitationClass ── RecitationStudent ── RecitationAttendance ── RecitationSession
                                      (tanggal, H/S/I/A)       (Subuh/Dzuhur/Ashar/Isya)
```

Migrasi menyalin data santri lama sebagai daftar peserta, menonaktifkan kode akses dan sesi santri lama, serta menghapus kredensial akun non-admin. Baris pengguna dan tabel absensi shalat lama tetap disimpan agar histori lama tidak terhapus.

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/login/code` | — | Login admin dengan kode unik |
| `GET/POST/PATCH` | `/api/recitation/classes` | Admin | Kelola kelas |
| `GET` | `/api/recitation/classes/:id/template` | Admin | Unduh template/daftar kelas Excel |
| `POST` | `/api/recitation/classes/:id/import` | Admin | Impor nama dan NIS dari Excel |
| `GET` | `/api/recitation/sessions` | Admin | Jadwal empat sesi |
| `PUT` | `/api/recitation/sessions` | Admin | Ubah jadwal sesi |
| `GET` | `/api/recitation/students` | Admin | Daftar peserta |
| `POST` | `/api/recitation/students` | Admin | Tambah peserta |
| `PATCH` | `/api/recitation/students/:id` | Admin | Ubah/nonaktifkan peserta |
| `GET` | `/api/recitation/attendance` | Admin | Muat absensi sesi |
| `PUT` | `/api/recitation/attendance` | Admin | Simpan absensi massal |
| `GET` | `/api/recitation/recap` | Admin | Rekap periode |

Saat menyimpan absensi, API juga memastikan seluruh santri aktif memiliki catatan; santri yang tidak dikirim atau belum dipilih dicatat sebagai Alfa.
Impor Excel menerima `.xlsx` maksimal 3 MB dengan kolom `Nama Santri` (wajib); kolom `NIS` opsional. Baris kosong diabaikan, data cocok diperbarui, peserta baru ditambahkan, dan santri yang tidak terdapat dalam file tidak dihapus.

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
