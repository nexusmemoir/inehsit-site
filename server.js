const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const sessions = new Map();

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|webm|mov/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}
function auth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const data = readData();
  if (password === data.settings.adminPassword) {
    const token = makeToken();
    sessions.set(token, { createdAt: Date.now() });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Hatalı şifre' });
  }
});

app.post('/api/admin/logout', auth, (req, res) => {
  sessions.delete(req.headers['x-admin-token']);
  res.json({ ok: true });
});

app.get('/api/admin/verify', auth, (req, res) => res.json({ ok: true }));

app.get('/api/content', (req, res) => {
  const data = readData();
  res.json({
    hero: data.hero,
    stats: data.stats,
    services: data.services,
    testimonials: (data.testimonials || []).filter(t => t.active),
    brands: (data.brands || []).filter(b => b.active),
    settings: { siteTitle: data.settings.siteTitle, email: data.settings.email }
  });
});

app.get('/api/admin/submissions', auth, (req, res) => res.json(readData().submissions || []));
app.delete('/api/admin/submissions/:id', auth, (req, res) => {
  const data = readData();
  data.submissions = (data.submissions || []).filter(s => s.id !== req.params.id);
  writeData(data); res.json({ ok: true });
});
app.delete('/api/admin/submissions', auth, (req, res) => {
  const data = readData(); data.submissions = []; writeData(data); res.json({ ok: true });
});
app.put('/api/admin/submissions/:id/read', auth, (req, res) => {
  const data = readData();
  const s = data.submissions.find(s => s.id === req.params.id);
  if (s) s.read = true;
  writeData(data); res.json({ ok: true });
});

app.get('/api/admin/testimonials', auth, (req, res) => res.json(readData().testimonials || []));
app.post('/api/admin/testimonials', auth, (req, res) => {
  const data = readData();
  const t = { ...req.body, id: Date.now(), active: true };
  data.testimonials.push(t); writeData(data); res.json(t);
});
app.put('/api/admin/testimonials/:id', auth, (req, res) => {
  const data = readData();
  const idx = data.testimonials.findIndex(t => String(t.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.testimonials[idx] = { ...data.testimonials[idx], ...req.body };
  writeData(data); res.json(data.testimonials[idx]);
});
app.delete('/api/admin/testimonials/:id', auth, (req, res) => {
  const data = readData();
  data.testimonials = data.testimonials.filter(t => String(t.id) !== String(req.params.id));
  writeData(data); res.json({ ok: true });
});

app.get('/api/admin/brands', auth, (req, res) => res.json(readData().brands || []));
app.post('/api/admin/brands', auth, (req, res) => {
  const data = readData();
  const b = { ...req.body, id: Date.now(), active: true };
  data.brands.push(b); writeData(data); res.json(b);
});
app.put('/api/admin/brands/:id', auth, (req, res) => {
  const data = readData();
  const idx = data.brands.findIndex(b => String(b.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.brands[idx] = { ...data.brands[idx], ...req.body };
  writeData(data); res.json(data.brands[idx]);
});
app.delete('/api/admin/brands/:id', auth, (req, res) => {
  const data = readData();
  data.brands = data.brands.filter(b => String(b.id) !== String(req.params.id));
  writeData(data); res.json({ ok: true });
});

app.get('/api/admin/content', auth, (req, res) => {
  const data = readData();
  res.json({ hero: data.hero, stats: data.stats, services: data.services, settings: data.settings });
});
app.put('/api/admin/content', auth, (req, res) => {
  const data = readData();
  const { hero, stats, services, settings } = req.body;
  if (hero) data.hero = { ...data.hero, ...hero };
  if (stats) data.stats = stats;
  if (services) data.services = { ...data.services, ...services };
  if (settings) data.settings = { ...data.settings, ...settings };
  writeData(data); res.json({ ok: true });
});

app.post('/api/submit', (req, res) => {
  const data = readData();
  const sub = { id: crypto.randomUUID(), ...req.body, submittedAt: new Date().toISOString(), read: false };
  if (!data.submissions) data.submissions = [];
  data.submissions.unshift(sub);
  writeData(data); res.json({ ok: true });
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/hediye', (req, res) => res.sendFile(path.join(__dirname, 'hediye.html')));
app.get('/tesekkur', (req, res) => res.sendFile(path.join(__dirname, 'tesekkur.html')));
app.get('/gizlilik', (req, res) => res.sendFile(path.join(__dirname, 'gizlilik.html')));
app.get('/sartlar', (req, res) => res.sendFile(path.join(__dirname, 'sartlar.html')));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Upload endpoint (admin only)
app.post('/api/admin/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.listen(PORT, () => console.log(`Inehsit running on port ${PORT}`));
