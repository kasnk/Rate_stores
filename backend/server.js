const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { run, get, all, exec } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ---- DB SCHEMA INIT (for convenience) ----
const initDb = async () => {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      address TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','normal','owner')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      address TEXT,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, store_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);

  // Seed an admin if none exists
  const admin = await get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await run(
      `INSERT INTO users (name, email, address, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      ['Default System Admin', 'admin@example.com', 'Admin Address', passwordHash, 'admin']
    );
    console.log('Seeded default admin: admin@example.com / Admin@123');
  }
};

// ---- AUTH ROUTES ----
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, address, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const hash = await bcrypt.hash(password, 10);
    const insert = await run(
      `INSERT INTO users (name, email, address, password_hash, role)
       VALUES (?, ?, ?, ?, 'normal')`,
      [name, email, address || '', hash]
    );
    const created = await get(
      `SELECT id, name, email, address, role FROM users WHERE id = ?`,
      [insert.id]
    );
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, address: user.address, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- ADMIN ROUTES ----
// dashboard counts
app.get('/api/admin/summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const userCountRow = await get(`SELECT COUNT(*) AS count FROM users`);
    const storeCountRow = await get(`SELECT COUNT(*) AS count FROM stores`);
    const ratingCountRow = await get(`SELECT COUNT(*) AS count FROM ratings`);
    const user_count = userCountRow ? userCountRow.count : 0;
    const store_count = storeCountRow ? storeCountRow.count : 0;
    const rating_count = ratingCountRow ? ratingCountRow.count : 0;
    res.json({ user_count, store_count, rating_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// add user (admin)
app.post('/api/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;
    if (!['admin', 'normal', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const hash = await bcrypt.hash(password, 10);
    const insert = await run(
      `INSERT INTO users (name, email, address, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, address || '', hash, role]
    );
    const created = await get(
      `SELECT id, name, email, address, role FROM users WHERE id = ?`,
      [insert.id]
    );
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// list users with filters
app.get('/api/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, address, role } = req.query;
    const conditions = [];
    const params = [];
    if (name) {
      conditions.push(`u.name LIKE ?`);
      params.push(`%${name}%`);
    }
    if (email) {
      conditions.push(`u.email LIKE ?`);
      params.push(`%${email}%`);
    }
    if (address) {
      conditions.push(`u.address LIKE ?`);
      params.push(`%${address}%`);
    }
    if (role) {
      conditions.push(`u.role = ?`);
      params.push(role);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const users = await all(
      `SELECT u.id, u.name, u.email, u.address, u.role,
              CASE WHEN u.role = 'owner'
                   THEN COALESCE(
                     (SELECT AVG(r.rating)
                      FROM stores s
                      JOIN ratings r ON r.store_id = s.id
                      WHERE s.owner_id = u.id), 0)
              END AS owner_rating
       FROM users u
       ${where}
       ORDER BY u.name ASC`,
      params
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// add store
app.post('/api/admin/stores', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, address, owner_id } = req.body;
    const insert = await run(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES (?, ?, ?, ?)`,
      [name, email || null, address || '', owner_id || null]
    );
    const created = await get(
      `SELECT id, name, email, address, owner_id FROM stores WHERE id = ?`,
      [insert.id]
    );
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// list stores with rating
app.get('/api/admin/stores', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, address } = req.query;
    const conditions = [];
    const params = [];
    if (name) {
      conditions.push(`s.name LIKE ?`);
      params.push(`%${name}%`);
    }
    if (email) {
      conditions.push(`s.email LIKE ?`);
      params.push(`%${email}%`);
    }
    if (address) {
      conditions.push(`s.address LIKE ?`);
      params.push(`%${address}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stores = await all(
      `SELECT s.id, s.name, s.email, s.address,
              COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY s.name ASC`,
      params
    );
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- NORMAL USER STORE & RATING ROUTES ----
app.get('/api/stores', authenticate, async (req, res) => {
  try {
    const { name, address } = req.query;
    const conditions = [];
    const params = [];
    if (name) {
      conditions.push(`s.name LIKE ?`);
      params.push(`%${name}%`);
    }
    if (address) {
      conditions.push(`s.address LIKE ?`);
      params.push(`%${address}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(req.user.id);
    const stores = await all(
      `SELECT s.id, s.name, s.address,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              (SELECT rating FROM ratings ur WHERE ur.store_id = s.id AND ur.user_id = ?) AS user_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY s.name ASC`,
      params
    );
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/stores/:storeId/rating', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    // Upsert manually for SQLite
    const existing = await get(
      `SELECT id FROM ratings WHERE user_id = ? AND store_id = ?`,
      [req.user.id, storeId]
    );
    if (existing) {
      await run(
        `UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [rating, existing.id]
      );
      const updated = await get(
        `SELECT id, user_id, store_id, rating FROM ratings WHERE id = ?`,
        [existing.id]
      );
      res.status(200).json(updated);
    } else {
      const insert = await run(
        `INSERT INTO ratings (user_id, store_id, rating)
         VALUES (?, ?, ?)`,
        [req.user.id, storeId, rating]
      );
      const created = await get(
        `SELECT id, user_id, store_id, rating FROM ratings WHERE id = ?`,
        [insert.id]
      );
      res.status(201).json(created);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---- STORE OWNER ROUTES ----
app.get('/api/owner/summary', authenticate, requireRole('owner'), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const storeRows = await all(
      `SELECT s.id, s.name,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(r.id) AS rating_count
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = ?
       GROUP BY s.id`,
      [ownerId]
    );
    res.json(storeRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/owner/store-raters/:storeId', authenticate, requireRole('owner'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const ownerCheck = await get(
      `SELECT id FROM stores WHERE id = ? AND owner_id = ?`,
      [storeId, req.user.id]
    );
    if (!ownerCheck) {
      return res.status(403).json({ message: 'Not your store' });
    }
    const raters = await all(
      `SELECT u.id, u.name, u.email, u.address, r.rating, r.created_at, r.updated_at
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = ?
       ORDER BY r.updated_at DESC`,
      [storeId]
    );
    res.json(raters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server after DB init
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init DB', err);
    process.exit(1);
  });


