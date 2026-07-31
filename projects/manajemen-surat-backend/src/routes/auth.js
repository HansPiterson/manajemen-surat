import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('kode_divisi').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, kode_divisi } = req.body;

    try {
      const result = await pool.query(
      `SELECT u.*,
                CASE WHEN u.role = 'kurir' THEN assigned_divisi.id ELSE d.id END as divisi_id,
                CASE WHEN u.role = 'kurir' THEN assigned_divisi.kode ELSE d.kode END as divisi_kode,
                CASE WHEN u.role = 'kurir' THEN assigned_divisi.nama ELSE d.nama END as divisi_nama,
                assigned_tu.nama_lengkap as assigned_tu_nama
         FROM users u
         LEFT JOIN divisi d ON u.divisi_id = d.id
         LEFT JOIN LATERAL (
           SELECT tu.nama_lengkap, tu.divisi_id
           FROM users tu
           WHERE tu.role = 'divisi'
             AND tu.assigned_kurir_id = u.id
           ORDER BY tu.updated_at DESC NULLS LAST, tu.created_at ASC
           LIMIT 1
         ) assigned_tu ON TRUE
         LEFT JOIN divisi assigned_divisi ON assigned_divisi.id = assigned_tu.divisi_id
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check divisi login - must provide kode_divisi and match
      if (user.role === 'divisi') {
        if (!kode_divisi) {
          return res.status(400).json({ error: 'Kode divisi required for divisi login' });
        }

        if (!user.divisi_kode || user.divisi_kode.toLowerCase() !== kode_divisi.toLowerCase()) {
          return res.status(401).json({ error: 'Invalid divisi code' });
        }
      }

      // Check kurir approval status
      if (user.role === 'kurir' && user.status !== 'approved') {
        return res.status(403).json({
          error: 'Account pending approval',
          status: user.status
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          divisi_id: user.divisi_id,
          divisi_nama: user.divisi_nama,
          divisi_kode: user.divisi_kode,
          assigned_tu_nama: user.assigned_tu_nama || null,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Register (public endpoint for kurir self-registration)
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nama_lengkap').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nama_lengkap } = req.body;

    try {
      // Check if email exists
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, nama_lengkap, role, status)
         VALUES ($1, $2, $3, 'kurir', 'pending')
         RETURNING id, email, nama_lengkap, role, status`,
        [email, password_hash, nama_lengkap]
      );

      res.status(201).json({
        message: 'Registration successful. Awaiting admin approval.',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
