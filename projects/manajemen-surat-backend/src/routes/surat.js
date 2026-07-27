import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, requireAdmin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all surat (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, divisi_id } = req.query;
    const user = req.user;

    let query = `
      SELECT s.*,
             dp.nama as pengirim_nama,
             dt.nama as tujuan_nama,
             k.nama_lengkap as kurir_nama
      FROM surat_ekspedisi s
      LEFT JOIN divisi dp ON s.divisi_pengirim_id = dp.id
      LEFT JOIN divisi dt ON s.divisi_tujuan_id = dt.id
      LEFT JOIN users k ON s.kurir_id = k.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (user.role === 'divisi') {
      query += ` AND (s.divisi_pengirim_id = $${paramIndex} OR s.divisi_tujuan_id = $${paramIndex})`;
      values.push(user.divisi_id);
      paramIndex++;
    } else if (user.role === 'kurir') {
      query += ` AND (s.kurir_id = $${paramIndex} OR s.status = 'draft')`;
      values.push(user.id);
      paramIndex++;
    }

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (divisi_id && user.role === 'admin') {
      query += ` AND (s.divisi_pengirim_id = $${paramIndex} OR s.divisi_tujuan_id = $${paramIndex})`;
      values.push(divisi_id);
      paramIndex++;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get surat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics (admin only) — must be before /:id
router.get('/stats/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const [statsResult, recentResult, kurirResult, divisiResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'draft') as draft,
          COUNT(*) FILTER (WHERE status = 'dikirim') as dikirim,
          COUNT(*) FILTER (WHERE status = 'diterima') as diterima,
          COUNT(*) as total
        FROM surat_ekspedisi
      `),
      pool.query(`
        SELECT s.*,
               dp.nama as pengirim_nama,
               dt.nama as tujuan_nama,
               k.nama_lengkap as kurir_nama
        FROM surat_ekspedisi s
        LEFT JOIN divisi dp ON s.divisi_pengirim_id = dp.id
        LEFT JOIN divisi dt ON s.divisi_tujuan_id = dt.id
        LEFT JOIN users k ON s.kurir_id = k.id
        ORDER BY s.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT COUNT(DISTINCT kurir_id) as kurir_aktif
        FROM surat_ekspedisi
        WHERE status = 'dikirim' AND kurir_id IS NOT NULL
      `),
      pool.query(`SELECT COUNT(*) as total_divisi FROM divisi`),
    ]);

    const stats = {
      ...statsResult.rows[0],
      kurir_aktif: parseInt(kurirResult.rows[0].kurir_aktif) || 0,
      total_divisi: parseInt(divisiResult.rows[0].total_divisi) || 0,
    };

    res.json({
      stats,
      recentActivity: recentResult.rows,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get surat by nomor_surat (for detail page routing)
router.get('/nomor/:nomorSurat', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              dp.nama as pengirim_nama,
              dt.nama as tujuan_nama,
              k.nama_lengkap as kurir_nama
       FROM surat_ekspedisi s
       LEFT JOIN divisi dp ON s.divisi_pengirim_id = dp.id
       LEFT JOIN divisi dt ON s.divisi_tujuan_id = dt.id
       LEFT JOIN users k ON s.kurir_id = k.id
       WHERE s.nomor_surat = $1`,
      [req.params.nomorSurat]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Surat not found' });
    }

    const surat = result.rows[0];
    const user = req.user;

    if (user.role === 'divisi') {
      if (surat.divisi_pengirim_id !== user.divisi_id && surat.divisi_tujuan_id !== user.divisi_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (user.role === 'kurir') {
      if (surat.kurir_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(surat);
  } catch (err) {
    console.error('Get surat by nomor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single surat by uuid
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              dp.nama as pengirim_nama,
              dt.nama as tujuan_nama,
              k.nama_lengkap as kurir_nama
       FROM surat_ekspedisi s
       LEFT JOIN divisi dp ON s.divisi_pengirim_id = dp.id
       LEFT JOIN divisi dt ON s.divisi_tujuan_id = dt.id
       LEFT JOIN users k ON s.kurir_id = k.id
       WHERE s.uuid = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Surat not found' });
    }

    const surat = result.rows[0];
    const user = req.user;

    if (user.role === 'divisi') {
      if (surat.divisi_pengirim_id !== user.divisi_id && surat.divisi_tujuan_id !== user.divisi_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (user.role === 'kurir') {
      if (surat.kurir_id !== user.id && surat.status !== 'draft') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(surat);
  } catch (error) {
    console.error('Get surat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create surat (admin or divisi draft)
router.post('/',
  authenticate,
  body('nomor_surat').notEmpty().trim(),
  body('perihal').optional().trim(),
  body('divisi_tujuan_id').matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid UUID format'),
  body('divisi_pengirim_id').optional().matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('Invalid UUID format'),
  body('catatan').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nomor_surat, perihal, divisi_tujuan_id, catatan } = req.body;
    const user = req.user;

    try {
      let divisi_pengirim_id;

      if (user.role === 'admin') {
        divisi_pengirim_id = req.body.divisi_pengirim_id;
        if (!divisi_pengirim_id) {
          return res.status(400).json({ error: 'Admin must specify divisi_pengirim_id' });
        }
      } else if (user.role === 'divisi') {
        divisi_pengirim_id = user.divisi_id;
      } else {
        return res.status(403).json({ error: 'Only admin and divisi can create surat' });
      }

      const result = await pool.query(
        `INSERT INTO surat_ekspedisi
         (nomor_surat, perihal, divisi_pengirim_id, divisi_tujuan_id, catatan, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING *`,
        [nomor_surat, perihal, divisi_pengirim_id, divisi_tujuan_id, catatan]
      );

      const surat = result.rows[0];
      const divisiResult = await pool.query(
        `SELECT
           pengirim.nama AS pengirim_nama,
           tujuan.nama AS tujuan_nama
         FROM divisi pengirim
         JOIN divisi tujuan ON tujuan.id = $2
         WHERE pengirim.id = $1`,
        [surat.divisi_pengirim_id, surat.divisi_tujuan_id]
      );

      res.status(201).json({ ...surat, ...divisiResult.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Nomor surat already exists' });
      }
      console.error('Create surat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update surat by uuid
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const {
      status, kurir_id,
      perihal, divisi_pengirim_id, divisi_tujuan_id, nama_penerima,
      foto_bukti_url, foto_hash, foto_latitude, foto_longitude, catatan
    } = req.body;

    const current = await pool.query(
      'SELECT * FROM surat_ekspedisi WHERE uuid = $1',
      [req.params.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Surat not found' });
    }

    const surat = current.rows[0];

    if (user.role === 'divisi') {
      if (surat.divisi_pengirim_id !== user.divisi_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (user.role === 'kurir') {
      if (surat.status === 'draft' && status === 'dikirim' && kurir_id === user.id) {
        // allowed
      } else if (surat.kurir_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (perihal !== undefined) { updates.push(`perihal = $${paramIndex++}`); values.push(perihal); }
    if (divisi_pengirim_id !== undefined) { updates.push(`divisi_pengirim_id = $${paramIndex++}`); values.push(divisi_pengirim_id); }
    if (divisi_tujuan_id !== undefined) { updates.push(`divisi_tujuan_id = $${paramIndex++}`); values.push(divisi_tujuan_id); }
    if (nama_penerima !== undefined) { updates.push(`nama_penerima = $${paramIndex++}`); values.push(nama_penerima); }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
      if (status === 'dikirim' && !surat.tanggal_kirim) {
        updates.push(`tanggal_kirim = NOW()`);
      } else if (status === 'diterima' && !surat.tanggal_terima) {
        updates.push(`tanggal_terima = NOW()`);
      }
    }

    if (kurir_id !== undefined) { updates.push(`kurir_id = $${paramIndex++}`); values.push(kurir_id); }
    if (foto_bukti_url !== undefined) { updates.push(`foto_bukti_url = $${paramIndex++}`); values.push(foto_bukti_url); }
    if (foto_hash !== undefined) { updates.push(`foto_hash = $${paramIndex++}`); values.push(foto_hash); }
    if (foto_latitude !== undefined) { updates.push(`foto_latitude = $${paramIndex++}`); values.push(foto_latitude); }
    if (foto_longitude !== undefined) { updates.push(`foto_longitude = $${paramIndex++}`); values.push(foto_longitude); }
    if (catatan !== undefined) { updates.push(`catatan = $${paramIndex++}`); values.push(catatan); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE surat_ekspedisi SET ${updates.join(', ')} WHERE uuid = $${paramIndex} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update surat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete surat by uuid (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM surat_ekspedisi WHERE uuid = $1 RETURNING uuid',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Surat not found' });
    }

    res.json({ message: 'Surat deleted successfully' });
  } catch (error) {
    console.error('Delete surat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
