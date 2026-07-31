# Deployment Backend Manajemen Surat

Backend adalah service Node.js yang menyediakan REST API, SSE, upload bukti foto, dan pengiriman FCM ke aplikasi kurir.

## Persiapan server PT

Install Node.js LTS, PostgreSQL, dan PM2. Pastikan database perusahaan sudah memiliki schema aplikasi serta user database dengan hak akses yang sesuai.

Clone branch backend dari repository:

```bash
git clone --branch backend https://github.com/HansPiterson/manajemen-surat.git manajemen-surat-source
cd manajemen-surat-source/projects/manajemen-surat-backend
```

Jika struktur hasil clone berbeda, gunakan folder yang berisi `package.json` backend sebagai working directory.

## Konfigurasi environment

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/manajemen_surat
PORT=3001
HOST=0.0.0.0
PUBLIC_URL=http://IP_SERVER_KANTOR:3001
JWT_SECRET=SECRET_RANDOM_PANJANG
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://HOST_WEBSITE
```

`PUBLIC_URL` harus menunjuk ke alamat yang dapat diakses website agar URL foto bukti yang disimpan database dapat dibuka.

## Firebase Admin

Backend membaca file berikut untuk FCM:

```text
serviceAccountKey.json
```

Salin file tersebut secara aman ke folder backend dan batasi izinnya:

```bash
chmod 600 serviceAccountKey.json
```

File ini di-ignore Git dan tidak boleh dimasukkan ke repository. Jika private key pernah dibagikan, revoke key lama di Firebase/Google Cloud lalu buat key baru sebelum deployment PT.

## Install dan jalankan

```bash
npm ci
mkdir -p uploads
pm2 start src/server.js --name manajemen-surat-backend
pm2 save
```

Uji service:

```bash
curl http://127.0.0.1:3001/health
```

Respons yang diharapkan memiliki `"status":"ok"`.

## Update backend

```bash
git fetch origin backend
git pull --ff-only origin backend
npm ci
node --check src/server.js
pm2 restart manajemen-surat-backend
```

Backup folder `uploads/` dan database sebelum migrasi atau perubahan besar. Jangan menghapus folder upload saat deploy.

## Endpoint frontend setelah pindah server

Setelah backend berpindah ke server PT:

1. Website: ubah `VITE_API_URL` pada `.env`, lalu `npm run build`.
2. Aplikasi Flutter: ubah `API_BASE_URL` pada `env/production.json`, lalu push agar GitHub Actions membuat APK baru.
3. Pastikan `CORS_ORIGIN`, firewall, reverse proxy, dan HTTPS sudah benar.

## Operasional dan keamanan

- Buka port API hanya sesuai kebutuhan firewall perusahaan.
- Gunakan reverse proxy HTTPS untuk website, API, SSE, dan upload.
- Jangan commit `.env`, `serviceAccountKey.json`, password database, JWT secret, atau token PAT.
- Pantau `pm2 logs manajemen-surat-backend` setelah deployment.
