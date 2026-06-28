# Surat Ekspedisi Digital (Manajemen Surat)

Aplikasi manajemen ekspedisi surat digital untuk PT Timah. Dibangun dengan React (Vite), Tailwind CSS v4, dan Supabase.

## Fitur Utama
- **Dashboard Admin**: Mengelola seluruh divisi, memantau statistik surat masuk/keluar secara global, dan memverifikasi bukti pengiriman foto (dengan validasi *Hash Anti-Tampering* dan *Geotagging*).
- **Portal Divisi**: Akses *read-only* yang terisolasi bagi masing-masing divisi untuk melihat riwayat surat mereka sendiri (difilter via Supabase RLS).
- **Tema Gelap/Terang**: Dukungan mode gelap (Dark Mode) yang terintegrasi secara mulus.
- **Autentikasi JWT**: Manajemen *session* berbasis *Role* (Admin vs Divisi) yang aman menggunakan Supabase Auth.

## Persyaratan
- Node.js (v18+)
- Akun Supabase (untuk Database dan Auth)

## Instalasi

1. **Clone repositori ini:**
   ```bash
   git clone <repo-url>
   cd manajemen-surat
   ```

2. **Instal dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin file `.env.example` menjadi `.env` dan masukkan kredensial Supabase Anda:
   ```bash
   cp .env.example .env
   ```

4. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```

## Teknologi
- [Vite](https://vitejs.dev/) - Build Tool
- [React](https://reactjs.org/) - UI Library
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling & Design System
- [Supabase](https://supabase.com/) - Backend (PostgreSQL, Auth, RLS)
- [TanStack Router](https://tanstack.com/router/latest) - Routing
- [HugeIcons React](https://hugeicons.com/) - Ikonografis

---

## 👨‍💻 Developer Handoff / Dokumentasi Lanjutan

Bagian ini ditujukan untuk tim Developer yang akan melanjutkan pengembangan aplikasi dan integrasi ke *Mobile App* (Flutter).

### Status Fitur (Selesai)

**✅ Frontend & Database Structure:**
1. **Skema Database & RLS**: Tabel `divisi`, `users`, `surat_ekspedisi` dirancang dan dilindungi dengan *Row Level Security* (RLS). Termasuk dukungan kolom baru `foto_latitude`, `foto_longitude`, dan `foto_bukti_url`.
2. **Dashboard Admin**: CRUD Divisi, Statistik Global, dan Manajemen Surat (termasuk *Pop-up Bukti Foto & Metadata*).
3. **Portal Divisi**: Pembuatan "Surat Draft" otomatis sesuai ID Divisi pengirim, dan riwayat surat terisolasi (read-only).
4. **Sistem Autentikasi**: *Auth Wrapper* & *Route Guards* berbasis *Role* yang tervalidasi langsung dari *database*.

**✅ Backend APIs (Edge Functions):**
1. **Pembuatan Akun Divisi (Admin)**: Edge Function `create-user` telah dibuat dan di-deploy, mendukung integrasi penambahan nama lengkap (`nama_lengkap`).
2. **API Endpoint untuk Mobile App (Flutter)**: Edge Function `sync-proof` telah dibuat dan dikonfigurasi untuk menerima multipart data (`hash`, `lat`, `lon`, `surat_id`), memvalidasi file, menyimpannya di bucket `bukti-surat`, serta memperbarui database.

---
## 📝 Changelog (Update Terbaru)
- **Standardisasi Skema**: Penyelarasan kolom `foto_bukti_url` dan `is_synced` agar sesuai antara Web App, Edge Functions, dan Mobile App (Flutter).
- **Tipe Data**: `surat_status` disederhanakan menjadi `draft`, `dikirim`, dan `diterima` sesuai alur ekspedisi nyata.
- **Divisi Akses**: Menambahkan kemampuan *insert* bagi entitas divisi untuk membuat *draft* surat awal.

Silakan jalankan `npx supabase db push` dan `npx supabase functions deploy` jika menggunakan instance baru.
