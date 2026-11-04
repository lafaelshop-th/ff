const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

const DB = path.join(__dirname, 'db', 'data.json');
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'RUNUNIED0955725722';

function load() {
  if (!fs.existsSync(DB)) {
    fs.mkdirSync(path.dirname(DB), {recursive: true});
    fs.writeFileSync(DB, JSON.stringify({keys: [], users: [], binds: [], sessions: []}, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}
function save(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- PUBLIC API ---
app.post('/api/bind', (req, res) => {
  const { hwid } = req.body;
  if (!hwid) return res.json({ok: false, msg: 'no hwid'});
  const db = load();
  if (!db.binds.find(b => b.hwid === hwid)) {
    db.binds.push({hwid, ts: Date.now()});
    save(db);
  }
  res.json({ok: true});
});

app.get('/api/check-hwid', (req, res) => {
  const hwid = req.query.hwid;
  const db = load();
  res.json({bound: !!db.binds.find(b => b.hwid === hwid)});
});

app.post('/api/activate-key', (req, res) => {
  const { key, hwid } = req.body;
  const db = load();
  const k = db.keys.find(x => x.key === key && !x.used);
  if (!k) return res.json({ok: false, msg: 'INVALID OR USED KEY'});
  k.used = true;
  k.hwid = hwid;
  k.usedAt = Date.now();
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions.push({token, hwid, key, ts: Date.now()});
  save(db);
  res.json({ok: true, token});
});

app.post('/api/activate-package', (req, res) => {
  const { uid, pkg, hwid, token } = req.body;
  const db = load();
  const sess = db.sessions.find(s => s.token === token && s.hwid === hwid);
  if (!sess) return res.json({ok: false, msg: 'SESSION INVALID'});
  let user = db.users.find(u => u.uid === uid);
  if (!user) {
    user = {uid, hwid, packages: [], ts: Date.now()};
    db.users.push(user);
  }
  if (!user.packages.includes(pkg)) user.packages.push(pkg);
  user.hwid = hwid;
  save(db);
  res.json({ok: true});
});

app.get('/api/download-binder', (req, res) => {
  // Stub binder - in production replace with real native binder that POSTs HWID
  const binder = `@echo off
title FF LOCKER BINDER
echo Collecting HWID...
for /f "tokens=2 delims==" %%a in ('wmic csproduct get uuid /value') do set UUID=%%a
echo HWID: %UUID%
echo.
echo Binding machine...
curl -s -X POST http://localhost:3000/api/bind -H "Content-Type: application/json" -d "{\\"hwid\\":\\"%UUID%\\"}"
echo.
echo Done. Return to the website. LED should turn green.
pause
`;
  res.setHeader('Content-Disposition', 'attachment; filename=FF_BINDER.bat');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(binder);
});

// --- ADMIN ---
app.post('/api/admin/login', (req, res) => {
  const { email, name, password } = req.body;
  if (name === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(16).toString('hex');
    res.json({ok: true, token});
  } else {
    res.json({ok: false, msg: 'BAD CREDENTIALS'});
  }
});

app.post('/api/admin/gen-key', (req, res) => {
  const { token, count = 1 } = req.body;
  // simple check - production would verify admin token properly
  const db = load();
  const keys = [];
  for (let i = 0; i < Math.min(count, 50); i++) {
    const key = [0,0,0,0].map(() => crypto.randomBytes(2).toString('hex').toUpperCase()).join('-');
    db.keys.push({key, used: false, created: Date.now()});
    keys.push(key);
  }
  save(db);
  res.json({ok: true, keys});
});

app.get('/api/admin/stats', (req, res) => {
  const db = load();
  res.json({
    keys: db.keys.length,
    used: db.keys.filter(k => k.used).length,
    users: db.users.length,
    binds: db.binds.length
  });
});

app.get('/api/admin/users', (req, res) => {
  const db = load();
  res.json(db.users);
});

app.get('/api/admin/keys', (req, res) => {
  const db = load();
  res.json(db.keys);
});

app.listen(PORT, () => {
  console.log(`FF LOCKER running on http://localhost:${PORT}`);
  console.log(`Admin: name=Admin  pass=RUNUNIED0955725722`);
});