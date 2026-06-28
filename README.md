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

### Status Fitur (Selesai vs Tertunda)

**✅ Selesai (Frontend & Database Structure):**
1. **Skema Database & RLS**: Tabel `divisi`, `users`, `surat_ekspedisi` telah dirancang dan dilindungi dengan *Row Level Security* (RLS).
2. **Dashboard Admin**: CRUD Divisi, Statistik Global, dan Manajemen Surat (termasuk *Pop-up Bukti Foto & Metadata*).
3. **Portal Divisi**: Tampilan *read-only* surat terisolasi berdasarkan divisi, dengan mode *Full Screen* (Monitoring).
4. **Sistem Autentikasi**: *Auth Wrapper* & *Route Guards* berbasis *Role*.

**⏳ Tertunda (Backend APIs - Edge Functions):**
1. **Pembuatan Akun Divisi (Admin)**: Karena pembuatan *user* di tabel `auth.users` membutuhkan privilese Admin, kita harus membuat *Supabase Edge Function* (`create-user`) agar form di UI "Manajemen Divisi" bisa didaftarkan dengan aman.
2. **API Endpoint untuk Mobile App (Flutter)**: Kita harus membuat *Edge Function* (`sync-proof`) yang berfungsi menerima *Multipart/Form-Data* dari kurir. API ini akan:
   - Menerima gambar fisik.
   - Menerima koordinat (*Latitude/Longitude*) & waktu.
   - Menerima *Hash SHA-256* dari gambar untuk validasi anti-manipulasi.
   - Menyimpan gambar ke *Supabase Storage* (`surat-bukti`) lalu melakukan *update* pada tabel `surat_ekspedisi`.

### Mengapa Supabase Edge Functions (vs Node.js)?

Untuk *backend logic* yang tersisa, sangat direkomendasikan menggunakan **Supabase Edge Functions** dibandingkan membangun server *Node.js (Express)* terpisah karena:
1. **Jauh Lebih Murah**: *Edge Functions* sudah tergabung dalam biaya/tier gratis Supabase (hingga jutaan panggilan/bulan). Anda tidak perlu menyewa VPS (seperti DigitalOcean) atau platform hosting (Render/Heroku) terpisah.
2. **Lebih Cepat & Praktis**: Konfigurasi keamanan (validasi token JWT pengguna) terhubung langsung dengan ekosistem Supabase secara otomatis. 
3. **Performa Tinggi**: Dijalankan secara terdistribusi secara global (Deno Edge) sehingga latensi API untuk aplikasi Flutter kurir di lapangan akan sangat kecil.

### Panduan Implementasi Selanjutnya
1. **Inisialisasi Backend**: Gunakan Supabase CLI (`supabase init`) untuk mulai mengembangkan *Edge Functions* lokal.
2. **Testing API Mobile**: Setelah Edge Function `sync-proof` dibuat, uji coba integrasi unggah gambar dari aplikasi Dart/Flutter Anda menggunakan kredensial JWT sesi kurir.
