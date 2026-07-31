# Surat Ekspedisi Digital — Website Manajemen Surat

Website operasional untuk mengelola surat ekspedisi PT Timah. Website digunakan oleh **Administrator** dan **Pengguna Divisi** untuk membuat surat, mengelola data organisasi, memantau status pengiriman, serta melihat bukti pengiriman dari aplikasi kurir.

Website ini terhubung ke backend REST API perusahaan. Aplikasi kurir Flutter menggunakan backend yang sama sehingga perubahan status surat dan bukti pengiriman dapat ditampilkan pada website.

Panduan pemindahan ke server baru tersedia pada [`DEPLOYMENT.md`](DEPLOYMENT.md). Endpoint backend website dikonfigurasi melalui `VITE_API_URL` pada file `.env` sebelum menjalankan build production.

## Fitur Utama

### Administrator

- Dashboard statistik surat secara global.
- Melihat jumlah surat total, Draft, Dikirim, dan Diterima.
- Melihat kurir aktif dan jumlah divisi.
- Manajemen divisi.
- Manajemen pengguna dan kurir.
- Memantau koneksi QR antara setiap akun Tata Usaha dan kurir tanpa assignment manual.
- Approve atau menonaktifkan akun kurir.
- Membuat surat baru.
- Mengubah data surat yang masih dapat diedit.
- Menghapus surat sesuai aturan status.
- Melihat daftar surat dengan filter dan pencarian.
- Melihat detail surat berdasarkan nomor surat.
- Melihat bukti foto pengiriman dalam halaman detail.
- Membuka foto bukti dalam mode layar penuh.
- Melihat nama penerima, kurir, tanggal, dan koordinat GPS.
- Melihat analitik distribusi surat.
- Menerima pembaruan data melalui Server-Sent Events (SSE).
- Membuka halaman Panduan Pengguna.

### Pengguna Divisi

- Melihat dashboard khusus divisi.
- Melihat surat masuk dan surat keluar divisinya.
- Menghubungkan satu kurir penanggung jawab melalui QR sekali pakai.
- Membuat surat baru untuk divisi tujuan; surat hanya masuk ke kurir yang terhubung dengan akun pembuat.
- Melihat status perjalanan surat.
- Membuka detail surat berdasarkan nomor surat.
- Melihat nama penerima dan bukti foto setelah pengiriman selesai.
- Melihat lokasi GPS bukti pengiriman melalui Google Maps.
- Menerima pembaruan surat secara real-time melalui SSE.
- Membuka halaman Panduan Pengguna.

## Alur Operasional Surat

```text
Akun Tata Usaha membuat QR pairing
        ↓
Kurir scan QR dari aplikasi
        ↓
Pengguna divisi membuat surat di website
        ↓
Surat tersimpan sebagai Draft untuk kurir pasangan akun TU
        ↓
Surat tersedia hanya pada aplikasi kurir tersebut
        ↓
Kurir mengambil tugas
        ↓
Status berubah menjadi Dikirim
        ↓
Kurir memasukkan nama penerima
        ↓
Kurir mengambil foto bukti + GPS
        ↓
Bukti dikirim ke backend
        ↓
Status berubah menjadi Diterima
        ↓
Website menampilkan foto, penerima, waktu, dan koordinat
```

### Status Surat

| Status | Penjelasan |
|---|---|
| `draft` | Surat baru dibuat dan belum diambil kurir. |
| `dikirim` | Surat sudah diambil kurir dan sedang dalam proses pengantaran. |
| `diterima` | Pengiriman selesai dan bukti pengiriman sudah tersedia. |

Surat berstatus `diterima` diperlakukan sebagai catatan final agar bukti pengiriman tidak berubah secara sembarangan.

## Panduan Penggunaan Website

### 1. Login

1. Buka alamat website.
2. Masukkan email dan password.
3. Jika pengguna adalah divisi, masukkan kode divisi apabila diminta.
4. Sistem mengarahkan pengguna ke dashboard sesuai role.

Role yang tersedia:

- `admin`: memiliki akses operasional penuh.
- `divisi`: hanya dapat melihat dan mengelola data yang berkaitan dengan divisinya.
- `kurir`: menggunakan aplikasi mobile untuk mengambil dan mengantar surat.

### Hubungkan Kurir untuk Setiap Akun Tata Usaha

1. Login menggunakan akun divisi/Tata Usaha.
2. Buka menu **Hubungkan Kurir**.
3. Tekan **Buat QR koneksi**.
4. Minta kurir membuka tab **Akun** pada aplikasi dan memilih **Scan QR Tata Usaha**.
5. Kurir melakukan scan sebelum countdown 5 menit berakhir.
6. Pastikan nama kurir tampil sebagai koneksi aktif pada website.

Satu akun TU hanya memiliki satu kurir aktif dan satu kurir hanya memiliki satu akun TU aktif. Jika kurir melakukan pairing ke TU lain, hubungan sebelumnya diputus. Surat lama yang sudah dimiliki kurir tetap tercatat pada kurir lama, sedangkan surat baru mengikuti pairing terbaru.

### 2. Membuat Surat Baru sebagai Admin

1. Buka menu **Surat Ekspedisi**.
2. Tekan **Buat Surat Baru**.
3. Isi nomor surat atau gunakan format nomor yang ditentukan perusahaan.
4. Isi perihal surat.
5. Pilih divisi pengirim.
6. Pilih divisi tujuan.
7. Periksa data yang dimasukkan.
8. Tekan **Simpan**.

Surat baru akan tersimpan sebagai `Draft` dan tersedia untuk kurir.

### 3. Membuat Surat Baru sebagai Divisi

1. Buka **Dashboard** atau **Surat Masuk / Keluar**.
2. Tekan **Buat Surat Baru**.
3. Isi perihal surat.
4. Pilih divisi tujuan.
5. Periksa kembali tujuan surat.
6. Tekan **Simpan**.

Divisi pengirim otomatis menggunakan divisi dari akun yang sedang login.

### 4. Memantau Surat

Gunakan menu **Surat Ekspedisi** atau **Surat Masuk / Keluar** untuk:

- Mencari berdasarkan nomor surat.
- Memfilter berdasarkan status.
- Melihat divisi pengirim.
- Melihat divisi tujuan.
- Melihat kurir yang mengambil surat.
- Melihat tanggal pembuatan dan perubahan status.

Website dapat menerima perubahan melalui SSE sehingga daftar surat diperbarui tanpa harus selalu memuat ulang halaman.

### 5. Melihat Detail Surat

Klik nomor surat atau tombol detail. Halaman detail menampilkan:

- Nomor surat.
- Perihal.
- Divisi pengirim.
- Divisi tujuan.
- Status surat.
- Nama kurir.
- Nama penerima.
- Tanggal surat.
- Tanggal pengiriman.
- Tanggal diterima.
- Foto bukti pengiriman.
- Koordinat GPS.

Nomor surat digunakan sebagai alamat halaman detail, contoh:

```text
/admin/surat/EKS-20260727-4342
/divisi/surat/EKS-20260727-4342
```

### 6. Melihat Foto Bukti

Jika foto tersedia:

1. Buka halaman detail surat.
2. Scroll ke bagian **Bukti Pengiriman**.
3. Tekan **Lihat Foto**.
4. Foto ditampilkan dalam mode layar penuh.
5. Tekan tombol `X` untuk menutup preview.

Foto berasal dari aplikasi kurir dan dapat memuat watermark nomor surat, nama penerima, waktu, GPS, serta alamat lokasi.

Hash anti-tampering digunakan untuk validasi teknis dan tidak ditampilkan sebagai informasi utama pada UI website.

### 7. Manajemen Divisi

Administrator dapat membuka **Manajemen Divisi** untuk:

- Melihat daftar divisi.
- Menambah divisi.
- Mengubah nama atau data divisi.
- Menghapus divisi jika tidak memiliki ketergantungan data.
- Memastikan divisi tersedia ketika membuat surat.

### 8. Manajemen Pengguna dan Kurir

Administrator dapat membuka **Manajemen Pengguna** untuk:

- Melihat daftar pengguna.
- Melihat role pengguna.
- Melihat status akun kurir.
- Menyetujui akun kurir yang masih pending.
- Menonaktifkan akun kurir.
- Mengubah data pengguna.
- Menghapus pengguna sesuai kebutuhan operasional.

### 9. Analitik

Menu **Analitik** digunakan untuk membaca ringkasan data surat, termasuk distribusi status dan data per divisi. Jika nama divisi tidak tersedia, periksa relasi `divisi_pengirim_id` dan `divisi_tujuan_id` pada backend.

### 10. Panduan Pengguna

Menu **Panduan Pengguna** tersedia pada sidebar Admin dan Divisi. Halaman ini berisi:

- Ringkasan fungsi website.
- Alur surat end-to-end.
- Penjelasan status.
- Cara melihat bukti pengiriman.
- FAQ dan troubleshooting.

## Realtime dengan SSE

Website menggunakan Server-Sent Events untuk menerima event perubahan surat dari backend.

Event yang digunakan:

```text
surat_created
surat_updated
connected
```

Endpoint SSE:

```text
GET /api/events?token=<jwt>
```

Jika koneksi SSE terputus, client mencoba menghubungkan kembali secara otomatis setelah beberapa detik.

## API Backend

URL API dapat diatur melalui environment variable:

```env
VITE_API_URL=http://43.134.228.34:3001/api
```

Jika `VITE_API_URL` tidak diatur, client menggunakan default:

```text
http://localhost:3001/api
```

Endpoint utama:

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/auth/login` | Login pengguna. |
| `POST` | `/auth/register` | Registrasi pengguna. |
| `GET` | `/auth/me` | Mengambil profil pengguna aktif. |
| `GET` | `/pairing/status` | Membaca koneksi TU–kurir aktif. |
| `POST` | `/pairing/token` | Membuat QR sekali pakai untuk akun TU. |
| `POST` | `/pairing/claim` | Menghubungkan kurir menggunakan token QR. |
| `DELETE` | `/pairing/connection` | Memutus koneksi kurir dari akun TU. |
| `GET` | `/divisi` | Mengambil daftar divisi. |
| `POST` | `/divisi` | Membuat divisi. |
| `PUT` | `/divisi/:id` | Mengubah divisi. |
| `DELETE` | `/divisi/:id` | Menghapus divisi. |
| `GET` | `/surat` | Mengambil daftar surat. |
| `GET` | `/surat/by-nomor/:nomorSurat` | Mengambil surat berdasarkan nomor. |
| `GET` | `/surat/:uuid` | Mengambil surat berdasarkan UUID. |
| `POST` | `/surat` | Membuat surat baru. |
| `PUT` | `/surat/:uuid` | Mengubah surat atau status surat. |
| `DELETE` | `/surat/:uuid` | Menghapus surat. |
| `GET` | `/surat/stats/summary` | Mengambil statistik dashboard. |
| `POST` | `/surat/:uuid/bukti` | Menerima upload bukti dari aplikasi kurir. |
| `GET` | `/events` | Membuka koneksi SSE. |
| `GET` | `/uploads/:filename` | Mengakses foto bukti yang tersimpan. |

## Struktur Project

```text
src/
├── App.jsx                    Router dan route guard
├── main.jsx                   Entry point React
├── App.css                    Style tambahan
├── index.css                  Tailwind dan global style
├── components/
│   ├── AuthWrapper.jsx        Proteksi role dan autentikasi
│   ├── Navbar.jsx             Header website
│   ├── Sidebar.jsx            Navigasi utama
│   └── ui/                    Komponen dialog, filter, search, skeleton
├── contexts/
│   └── ThemeContext.jsx       Tema terang/gelap
├── hooks/
│   └── useSSE.js              Koneksi realtime Server-Sent Events
├── layouts/
│   ├── AdminLayout.jsx
│   └── DivisiLayout.jsx
├── lib/
│   ├── api.js                 REST API client utama
│   ├── apiClient.js           REST client alternatif
│   └── utils.js                Utility format data
└── pages/
    ├── Login.jsx
    ├── UserGuide.jsx
    ├── admin/
    │   ├── Dashboard.jsx
    │   ├── DivisiManagement.jsx
    │   ├── KurirManagement.jsx
    │   ├── SuratViewer.jsx
    │   ├── SuratDetail.jsx
    │   ├── Analytics.jsx
    │   └── Settings.jsx
    └── divisi/
        ├── Dashboard.jsx
        ├── CourierPairing.jsx
        ├── SuratViewer.jsx
        ├── SuratDetail.jsx
        └── Settings.jsx
```

## Teknologi

- React 19.
- Vite 5.
- Tailwind CSS v4.
- TanStack Router.
- REST API dengan `fetch`.
- Server-Sent Events untuk realtime.
- Recharts untuk analitik.
- `qrcode.react` untuk QR pairing TU–kurir.
- Lucide React dan HugeIcons untuk ikon.
- Node.js dan Express pada backend terpisah.

Repository ini masih memiliki dependency Supabase lama untuk kompatibilitas source tertentu, tetapi alur website aktif menggunakan REST API backend perusahaan melalui `VITE_API_URL`.

## Persyaratan Development

- Node.js 18 atau lebih baru.
- npm.
- Backend manajemen surat aktif.
- Browser modern.

## Instalasi Lokal

```bash
git clone https://github.com/HansPiterson/manajemen-surat.git
cd manajemen-surat
npm install
```

Salin konfigurasi environment:

```bash
cp .env.example .env
```

Isi `.env`:

```env
VITE_API_URL=http://43.134.228.34:3001/api
```

Jangan commit `.env` ke repository public.

## Menjalankan Development Server

```bash
npm run dev
```

Vite akan menjalankan website pada alamat development yang ditampilkan di terminal. Untuk menjalankan pada port tertentu, gunakan konfigurasi Vite atau parameter CLI yang sesuai.

## Build Production

```bash
npm run build
```

Hasil build tersedia di folder:

```text
dist/
```

Untuk preview hasil production secara lokal:

```bash
npm run preview -- --host 0.0.0.0 --port 5174
```

## Deployment dengan PM2

Contoh menjalankan backend website yang sudah dibuild:

```bash
pm2 start npm \
  --name manajemen-surat-web \
  --cwd /path/ke/manajemen-surat \
  -- run preview -- --host 0.0.0.0 --port 5174
```

Setelah service berhasil berjalan:

```bash
pm2 save
pm2 status
```

Backend REST API dijalankan pada service terpisah. Website dan backend harus sama-sama aktif agar login dan data surat dapat digunakan.

## Validasi Sebelum Push

```bash
npm run build
npm run lint
```

`npm run lint` saat ini dapat menampilkan warning legacy pada beberapa file lama. Warning tersebut tidak selalu menghentikan build, tetapi tetap perlu ditinjau saat refactor berikutnya.

## Environment Production

Jangan menaruh credential sensitif di repository public. Gunakan environment variable pada server deployment:

```env
VITE_API_URL=https://api.example.com/api
```

Pastikan backend mengatur:

- CORS untuk domain website.
- JWT secret.
- Database connection.
- URL publik upload foto.
- Directory upload bukti.
- Firebase service account hanya di backend.

Service account Firebase tidak boleh berada di source code frontend atau repository public.

## Troubleshooting

### Website menampilkan data kosong

1. Pastikan backend aktif.
2. Periksa nilai `VITE_API_URL`.
3. Pastikan token login masih valid.
4. Periksa CORS backend.
5. Buka Network panel browser untuk melihat response endpoint.

### Login gagal

Periksa endpoint `/api/auth/login`, kredensial, status akun, dan response backend. Pastikan website tidak sedang menggunakan URL API lokal ketika dibuka dari server production.

### Divisi tidak tampil pada dropdown

Pastikan endpoint `/api/divisi` mengembalikan data dan user memiliki role yang sesuai. Periksa juga `divisi_pengirim_id` serta `divisi_tujuan_id` pada request pembuatan surat.

### Website tidak realtime

Periksa endpoint `/api/events`, token JWT, CORS, dan koneksi SSE pada browser. Pastikan backend tidak memblokir koneksi `text/event-stream`.

### Foto bukti tidak tampil

Pastikan:

- `foto_bukti_url` tersimpan pada database.
- URL foto dapat diakses dari browser.
- Backend menyajikan folder `/uploads`.
- Kurir sudah berhasil melakukan sinkronisasi.
- Tidak ada masalah CORS atau mixed content.

### Halaman detail tidak ditemukan

Pastikan nomor surat digunakan dalam format URL yang benar:

```text
/admin/surat/EKS-20260727-4342
```

atau:

```text
/divisi/surat/EKS-20260727-4342
```

## Status Implementasi

- [x] Login REST API.
- [x] Role guard Admin dan Divisi.
- [x] Dashboard Admin.
- [x] Dashboard Divisi.
- [x] Manajemen Divisi.
- [x] Manajemen Pengguna/Kurir.
- [x] CRUD Surat Ekspedisi.
- [x] Filter dan pencarian surat.
- [x] Halaman detail surat berbasis nomor surat.
- [x] Preview foto bukti dalam halaman detail.
- [x] Preview foto full-screen dengan tombol close.
- [x] Nama penerima.
- [x] GPS bukti pengiriman.
- [x] Analitik.
- [x] Realtime SSE.
- [x] Panduan Pengguna website.
- [x] Tampilan responsif desktop dan mobile.
- [ ] Dokumentasi screenshot operasional.
- [ ] Automated frontend test suite.

## Repository Terkait

- Website manajemen surat: `https://github.com/HansPiterson/manajemen-surat`
- Aplikasi kurir Flutter: `https://github.com/zenttzy/Aplikasi-Ekspedisi-Surat`

Website dan aplikasi kurir harus menggunakan backend REST API yang sama agar status surat, nama penerima, foto bukti, dan GPS tetap sinkron.
