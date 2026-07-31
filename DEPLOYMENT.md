# Deployment Website Manajemen Surat

Dokumen ini menjelaskan cara memindahkan website ke server perusahaan dan mengganti endpoint backend tanpa mengubah source code aplikasi.

## Konfigurasi endpoint

Website membaca endpoint REST API saat proses build melalui `VITE_API_URL`.

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://43.134.228.34:3001/api
```

Saat server kantor siap, ubah hanya nilainya:

```env
VITE_API_URL=http://IP_SERVER_KANTOR:3001/api
```

Setiap perubahan `.env` harus diikuti build ulang karena Vite menyimpan environment variable ke bundle frontend.

## Build production

```bash
npm ci
npm run build
```

Hasil build berada di folder `dist/`. Folder ini yang dilayani oleh web server atau PM2.

## Menjalankan dengan PM2

Contoh menggunakan Vite preview:

```bash
pm2 start npm --name manajemen-surat-web -- run preview -- --host 0.0.0.0 --port 5174
pm2 save
```

Jika process sudah ada:

```bash
npm run build
pm2 restart manajemen-surat-web
```

Untuk production dengan Nginx, arahkan virtual host ke folder `dist/` dan aktifkan fallback SPA ke `index.html` agar route detail surat tetap dapat dibuka langsung.

## Checklist pindah server

1. Clone branch `main` repository website.
2. Install Node.js LTS dan jalankan `npm ci`.
3. Salin `.env.example` menjadi `.env`.
4. Ubah `VITE_API_URL` ke alamat backend server PT.
5. Pastikan backend mengizinkan origin website pada `CORS_ORIGIN`.
6. Jalankan `npm run build`.
7. Jalankan hasil build melalui Nginx atau PM2.
8. Uji login, halaman Hubungkan Kurir, generate/scan QR, daftar surat, detail berdasarkan nomor, SSE, dan foto bukti.

## Catatan keamanan

- Jangan commit `.env` atau token JWT.
- Backend dan website harus memakai HTTPS pada deployment production.
- Jangan menaruh Firebase service account JSON di repository website.
