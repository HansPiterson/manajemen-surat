import { broadcast } from '../sse.js';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `bukti-${req.params.uuid}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  },
});

router.post('/:uuid/bukti', authenticate, upload.single('foto'), async (req, res) => {
  try {
    const { uuid } = req.params;
    const { lat, long: lng, nama_penerima, foto_hash } = req.body;

    const current = await pool.query(
      'SELECT * FROM surat_ekspedisi WHERE uuid = $1',
      [uuid]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Surat not found' });
    }

    const surat = current.rows[0];
    if (req.user.role === 'kurir' && surat.kurir_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const publicUrl = req.file
      ? `${process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`}/uploads/${req.file.filename}`
      : null;

    const result = await pool.query(
      `UPDATE surat_ekspedisi
       SET status = 'diterima',
           foto_bukti_url = COALESCE($1, foto_bukti_url),
           foto_hash = COALESCE($2, foto_hash),
           foto_latitude = COALESCE($3::double precision, foto_latitude),
           foto_longitude = COALESCE($4::double precision, foto_longitude),
           nama_penerima = COALESCE($5, nama_penerima),
           tanggal_terima = NOW(),
           updated_at = NOW()
       WHERE uuid = $6
       RETURNING *`,
      [publicUrl, foto_hash || null, lat || null, lng || null, nama_penerima || null, uuid]
    );

    broadcast('surat_updated', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Upload bukti error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
