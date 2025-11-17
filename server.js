// server.js (ESM)
// =================== Imports & setup ===================
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// =================== SQLite (file db/menu.db) ===================
const DB_PATH = path.join(__dirname, 'db', 'menu.db');
sqlite3.verbose();
const db = new sqlite3.Database(DB_PATH);

// Promisified helpers
const run = (sql, params=[]) => new Promise((res, rej) => {
  db.run(sql, params, function(err){ err ? rej(err) : res(this); });
});
const all = (sql, params=[]) => new Promise((res, rej) => {
  db.all(sql, params, (err, rows) => err ? rej(err) : res(rows));
});
const get = (sql, params=[]) => new Promise((res, rej) => {
  db.get(sql, params, (err, row) => err ? rej(err) : res(row));
});

// Init schema + seed team (dấu vết nhóm)
async function initDB(){
  await run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    category TEXT CHECK(category IN ('food','drink')) NOT NULL,
    image TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT
  )`);

  const tcount = await get('SELECT COUNT(*) AS c FROM team');
  if((tcount?.c ?? 0) === 0){
    // Điền thông tin thật của nhóm bạn ở đây:
    const TEAM_MEMBERS = [
      { name: 'Nguyễn Hoàng Nhân', role: 'UI/Frontend' },
      { name: 'Trần Minh Thư', role: 'Logic/Frontend' },
      { name: 'Đỗ Thị Duyên', role: 'Backend/DB' }
    ];
    for(const m of TEAM_MEMBERS){
      await run('INSERT INTO team(name,role) VALUES(?,?)', [m.name, m.role]);
    }
  }
}
await initDB();

// =================== Basic Auth (bảo vệ admin & API ghi) ===================
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

function basicAuth(req, res, next){
  const hdr = req.headers.authorization || '';
  const parts = hdr.split(' ');
  if(parts[0] === 'Basic' && parts[1]){
    const [u, p] = Buffer.from(parts[1], 'base64').toString().split(':');
    if(u === ADMIN_USER && p === ADMIN_PASS) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Secure Area"');
  return res.status(401).send('Unauthorized');
}

// =================== Middlewares ===================
app.use(express.json({ limit: '1mb' }));

// Bảo vệ file admin.html qua route (đặt TRƯỚC static)
app.get('/admin.html', basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Phục vụ static (index.html, css/js, ảnh…)
app.use(express.static(path.join(__dirname, 'public')));

// =================== API (Meta + Team) ===================
app.get('/api/meta', (req, res) => {
  res.json({
    dbPath: DB_PATH,
    tables: {
      items: ['id','name','price','category','image','description','created_at'],
      team:  ['id','name','role']
    }
  });
});

app.get('/api/team', async (req, res, next) => {
  try {
    const rows = await all('SELECT id,name,role FROM team ORDER BY id');
    res.json(rows);
  } catch (e) { next(e); }
});

// =================== API Items (GET public, ghi cần auth) ===================
app.get('/api/items', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    if(category && ['food','drink'].includes(category)){
      sql += ' AND category = ?'; params.push(category);
    }
    if(q){
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }
    sql += ' ORDER BY id DESC';
    const rows = await all(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

app.post('/api/items', basicAuth, async (req, res, next) => {
  try {
    const { name, price, category, image, description } = req.body || {};
    if(!name || !category){
      return res.status(400).json({ error: 'name & category required' });
    }
    const p = Number.isFinite(+price) ? +price : 0;
    const r = await run(
      'INSERT INTO items(name,price,category,image,description) VALUES(?,?,?,?,?)',
      [name, p, category, image || null, description || null]
    );
    const row = await get('SELECT * FROM items WHERE id = ?', [r.lastID]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

app.put('/api/items/:id', basicAuth, async (req, res, next) => {
  try {
    const id = +req.params.id;
    const { name, price, category, image, description } = req.body || {};
    const p = Number.isFinite(+price) ? +price : 0;
    await run(
      'UPDATE items SET name=?, price=?, category=?, image=?, description=? WHERE id=?',
      [name, p, category, image || null, description || null, id]
    );
    const row = await get('SELECT * FROM items WHERE id=?', [id]);
    res.json(row);
  } catch (e) { next(e); }
});

app.delete('/api/items/:id', basicAuth, async (req, res, next) => {
  try {
    await run('DELETE FROM items WHERE id=?', [+req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// =================== Error handler ===================
app.use((err, req, res, next) => {
  console.error('Internal error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// =================== Start server (0.0.0.0 để máy khác/Ngrok truy cập) ===================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`▶ Server chạy:  http://localhost:${PORT}`);
  console.log(`   Tĩnh:        / (public/) | Quản lý: /admin.html (Basic Auth)`);
  console.log(`   DB file:     ${DB_PATH}`);
});

