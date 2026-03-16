const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.RENDER_DISK_PATH || '/var/data';
// Fallback to __dirname if /var/data doesn't exist (local dev)
const DATA_DIR_FINAL = require('fs').existsSync('/var/data') ? '/var/data' : __dirname;
const DATA_FILE = path.join(DATA_DIR_FINAL, 'data.json');
const UPLOADS_DIR = path.join(DATA_DIR_FINAL, 'uploads');
const sessions = new Map();

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Auto-create data.json if missing (first deploy)
if (!fs.existsSync(DATA_FILE)) {
  const defaultData = {
    settings: { adminPassword: 'inehsit2025', siteTitle: 'Inehsit — Yapay Zeka Reklam Videoları', email: 'info@inehsit.io', copyright: '© 2025 Inehsit. Tüm hakları saklıdır.', logoUrl: '', faviconUrl: '' },
    hero: { badge: 'Yapay Zeka Destekli Video', typewriterPhrases: ['Ürününüzü gerçekten'], title2: 'izleten reklamlar', description: 'Çekim yok, stüdyo yok, uzun bekleyiş yok.', videoUrl: '', ctaPrimary: 'Bilgi Alın, Sizi Arayalım →', ctaSecondary: 'Hizmetlere Bak' },
    stats: [{ num: '48s', label: 'İçinde Konsept' }, { num: '3-5', label: 'İş Günü Teslim' }, { num: '100+', label: 'Teslim Edilen Video' }, { num: '1', label: 'Revizyon Hakkı' }],
    services: {
      urun: { tag: 'Ürün Tanıtım Videosu', title: 'Ürün görseliniz var,\nreklam filmi hazır', description: 'Kozmetik, kıyafet veya aksesuar satıyorsunuz.', tags: ['Kozmetik', 'Kıyafet', 'Aksesuar', 'E-ticaret'], videoUrl: '' },
      proje: { tag: 'Proje Tanıtım Videosu', title: 'Projenizi yatırımcıya\nve alıcıya anlatın', description: 'Arsa, konut projesi veya müteahhit tanıtımı.', tags: ['İnşaat', 'Arsa', 'Gayrimenkul'], videoUrl: '' },
      hediye: { tag: 'Hediye Videom', title: 'Fotoğraftan kişisel\nanimatif video', description: 'Sevdiklerinize özel sürpriz.', tags: ['Animatif', 'Hediye', 'Özel Gün'], videoUrl: '' }
    },
    testimonials: [],
    brands: [],
    hediye: {
      hero: { eyebrow: 'Kişiye Özel Hediye Video', title: 'Sözcükler yetersiz kaldığında <em>bir video</em> yeterli olur', description: 'Fotoğraf gönderin, hikayenizi anlatın.', heroVideoUrl: '', heroCardCaption: 'Ahmet ve Selin için hazırlandı', heroCardTag: 'Yıldönümü Videosu', ctaPrimary: 'Sipariş Ver →', ctaSecondary: 'Örnek İzle' },
      occasions: [{ icon: '💍', title: 'Evlilik Teklifi', desc: 'O anı çok daha büyük yapın.' }, { icon: '💑', title: 'Yıldönümü', desc: 'Yılların özeti, tek bir videoda.' }, { icon: '🎂', title: 'Doğum Günü', desc: 'Alışılmışın dışında bir sürpriz.' }, { icon: '🌷', title: 'Anneler Günü', desc: 'Annenize layık bir sürpriz.' }, { icon: '🎓', title: 'Mezuniyet', desc: 'O anı ölümsüzleştirin.' }, { icon: '✈️', title: 'Veda', desc: 'Uzakta olanlara özel bir hatıra.' }, { icon: '💌', title: 'Sürpriz', desc: 'Gerekçesi olmak zorunda değil.' }, { icon: '🎁', title: 'Diğer', desc: 'Aklınızdaki her özel an için.' }],
      exampleVideo: { title: 'Nasıl görünüyor?', desc: 'Teslim ettiğimiz videolardan bir örnek.', videoUrl: '' },
      sliderImages: [],
      process: { title: 'Nasıl çalışır?', desc: 'Formdan sipariş verin, gerisini biz halledelim.', steps: [{ num: '01', title: 'Formu Doldurun', desc: 'Özel gün ve detayları bildirin.' }, { num: '02', title: 'Konsept Onayı', desc: '24 saat içinde sahne planı paylaşıyoruz.' }, { num: '03', title: 'Prodüksiyon', desc: '3 ila 5 iş günü içinde hazır.' }, { num: '04', title: 'Teslimat', desc: 'Paylaşmaya hazır formatta teslim.' }] },
      testimonials: [],
      brands: [],
      form: { title: 'Siparişinizi oluşturun', desc: 'Detayları paylaşın, sizi arayıp konuşalım.', note: 'Fotoğraflarınızı sipariş onayı sonrası WhatsApp üzerinden iletebilirsiniz.' }
    },
    submissions: []
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
  console.log('data.json created with defaults');
}

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
    settings: {
      siteTitle: data.settings.siteTitle,
      email: data.settings.email,
      copyright: data.settings.copyright,
      logoUrl: data.settings.logoUrl,
      faviconUrl: data.settings.faviconUrl
    },
    hediye: data.hediye ? {
      ...data.hediye,
      testimonials: (data.hediye.testimonials || []).filter(t => t.active),
      brands: (data.hediye.brands || []).filter(b => b.active),
      sliderImages: (data.hediye.sliderImages || []).filter(s => s.active)
    } : null
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

// ── Admin: Hediye Page Content ────────────────────────────
app.get('/api/admin/hediye', auth, (req, res) => res.json(readData().hediye || {}));

app.put('/api/admin/hediye', auth, (req, res) => {
  const data = readData();
  if (!data.hediye) data.hediye = {};
  const { hero, occasions, exampleVideo, process, form } = req.body;
  if (hero) data.hediye.hero = { ...data.hediye.hero, ...hero };
  if (occasions) data.hediye.occasions = occasions;
  if (exampleVideo) data.hediye.exampleVideo = { ...data.hediye.exampleVideo, ...exampleVideo };
  if (process) data.hediye.process = { ...data.hediye.process, ...process };
  if (form) data.hediye.form = { ...data.hediye.form, ...form };
  writeData(data); res.json({ ok: true });
});

// Hediye Testimonials
app.get('/api/admin/hediye/testimonials', auth, (req, res) => res.json(readData().hediye?.testimonials || []));
app.post('/api/admin/hediye/testimonials', auth, (req, res) => {
  const data = readData();
  if (!data.hediye) data.hediye = {};
  if (!data.hediye.testimonials) data.hediye.testimonials = [];
  const t = { ...req.body, id: Date.now(), active: true };
  data.hediye.testimonials.push(t); writeData(data); res.json(t);
});
app.put('/api/admin/hediye/testimonials/:id', auth, (req, res) => {
  const data = readData();
  const idx = (data.hediye?.testimonials || []).findIndex(t => String(t.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.hediye.testimonials[idx] = { ...data.hediye.testimonials[idx], ...req.body };
  writeData(data); res.json(data.hediye.testimonials[idx]);
});
app.delete('/api/admin/hediye/testimonials/:id', auth, (req, res) => {
  const data = readData();
  if (data.hediye) data.hediye.testimonials = (data.hediye.testimonials || []).filter(t => String(t.id) !== String(req.params.id));
  writeData(data); res.json({ ok: true });
});

// Hediye Brands
app.get('/api/admin/hediye/brands', auth, (req, res) => res.json(readData().hediye?.brands || []));
app.post('/api/admin/hediye/brands', auth, (req, res) => {
  const data = readData();
  if (!data.hediye) data.hediye = {};
  if (!data.hediye.brands) data.hediye.brands = [];
  const b = { ...req.body, id: Date.now(), active: true };
  data.hediye.brands.push(b); writeData(data); res.json(b);
});
app.put('/api/admin/hediye/brands/:id', auth, (req, res) => {
  const data = readData();
  const idx = (data.hediye?.brands || []).findIndex(b => String(b.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.hediye.brands[idx] = { ...data.hediye.brands[idx], ...req.body };
  writeData(data); res.json(data.hediye.brands[idx]);
});
app.delete('/api/admin/hediye/brands/:id', auth, (req, res) => {
  const data = readData();
  if (data.hediye) data.hediye.brands = (data.hediye.brands || []).filter(b => String(b.id) !== String(req.params.id));
  writeData(data); res.json({ ok: true });
});

// Hediye Slider Images
app.get('/api/admin/hediye/slides', auth, (req, res) => res.json(readData().hediye?.sliderImages || []));
app.post('/api/admin/hediye/slides', auth, (req, res) => {
  const data = readData();
  if (!data.hediye) data.hediye = {};
  if (!data.hediye.sliderImages) data.hediye.sliderImages = [];
  const s = { ...req.body, id: Date.now(), active: true };
  data.hediye.sliderImages.push(s); writeData(data); res.json(s);
});
app.put('/api/admin/hediye/slides/:id', auth, (req, res) => {
  const data = readData();
  const idx = (data.hediye?.sliderImages || []).findIndex(s => String(s.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.hediye.sliderImages[idx] = { ...data.hediye.sliderImages[idx], ...req.body };
  writeData(data); res.json(data.hediye.sliderImages[idx]);
});
app.delete('/api/admin/hediye/slides/:id', auth, (req, res) => {
  const data = readData();
  if (data.hediye) data.hediye.sliderImages = (data.hediye.sliderImages || []).filter(s => String(s.id) !== String(req.params.id));
  writeData(data); res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Inehsit running on port ${PORT}`));
