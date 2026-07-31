import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data from database with divisi and assigned TU details
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.nama_lengkap, u.status, u.assigned_kurir_id,
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
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check kurir status
    if (user.role === 'kurir' && user.status !== 'approved') {
      return res.status(403).json({ error: 'Kurir account not approved' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireKurir = requireRole('kurir');
export const requireDivisi = requireRole('divisi');
