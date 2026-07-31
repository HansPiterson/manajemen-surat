# Pairing QR Tata Usaha dan Kurir

Fitur pairing menghubungkan **satu akun Tata Usaha (role `divisi`)** dengan **satu kurir approved**. Assignment tidak lagi ditentukan hanya dari divisi karena satu divisi dapat memiliki beberapa akun TU dengan kurir penanggung jawab yang berbeda.

## Aturan kepemilikan

- Satu TU memiliki maksimal satu kurir aktif.
- Satu kurir memiliki maksimal satu TU aktif.
- Pairing baru pada kurir otomatis memutus hubungan TU sebelumnya.
- Surat baru yang dibuat TU disimpan sebagai `draft` dan langsung mencatat `kurir_id` dari pairing TU saat itu.
- Surat lama yang sudah dimiliki kurir tetap dapat diakses kurir tersebut setelah TU mengganti pairing.
- Surat TU yang belum memiliki kurir tidak dibagikan secara acak.
- Surat yang dibuat admin hanya memiliki kurir jika admin mengirim `kurir_id` kurir approved secara eksplisit.

## Keamanan QR

QR berisi deep link berikut:

```text
ekspedisi-surat://pair?token=<random-token>
```

Backend menyimpan SHA-256 token, bukan token mentah. Token berlaku 5 menit, hanya dapat dipakai sekali, dan dikunci di dalam transaksi PostgreSQL saat diklaim.

QR tidak boleh berisi password, JWT, Firebase token, atau credential pengguna.

## Migration

Jalankan sekali menggunakan user database yang memiliki izin membuat tabel pada schema `public`:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f migrations/004_courier_pairing_tokens.sql
```

Migration membuat tabel `courier_pairing_tokens` dan index token. Relasi aktif tetap disimpan pada `users.assigned_kurir_id`.

## Endpoint

| Method | Endpoint | Role | Fungsi |
|---|---|---|---|
| `GET` | `/api/pairing/status` | Divisi/Kurir | Membaca koneksi aktif. |
| `POST` | `/api/pairing/token` | Divisi | Membuat QR sekali pakai selama 5 menit. |
| `POST` | `/api/pairing/claim` | Kurir approved | Mengklaim token dari QR. |
| `DELETE` | `/api/pairing/connection` | Divisi | Memutus kurir aktif TU. |

Contoh respons pembuatan QR:

```json
{
  "pairing_url": "ekspedisi-surat://pair?token=...",
  "expires_at": "2026-07-31T16:30:00.000Z",
  "expires_in_seconds": 300
}
```

Contoh payload claim:

```json
{
  "token": "raw-token-dari-query-parameter-qr"
}
```

## Urutan deployment

1. Backup database.
2. Pull branch backend terbaru.
3. Jalankan migration pairing.
4. Jalankan `npm ci`.
5. Periksa sintaks dengan `node --check src/server.js`.
6. Restart PM2 backend.
7. Uji `/health`.
8. Deploy website yang memiliki menu **Hubungkan Kurir**.
9. Build APK Flutter yang memiliki menu **Scan QR Tata Usaha**.
