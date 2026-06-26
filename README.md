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
