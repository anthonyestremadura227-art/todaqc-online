const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// ============ SECRET ADMIN - DITO MO PAPALITAN - SECRET LANG - IKAW LANG NAKAKAALAM! ============
const ADMIN_ACCOUNTS = [
  { username: 'todaqc_admin', password: 'QcToda2024_Secret', role: 'admin', name: 'TODA QC Admin' },
  { username: 'noel', password: 'NoelThesis2024', role: 'admin', name: 'Sir Noel Montecillo' },
  { username: 'beaserafin', password: '123456789', role: 'driver', name: 'Bea Serafin' },
  { username: 'admin', password: 'smoker123', role: 'president', name: 'President' },
];
// ===============================================================================================

app.use(cors());
app.use(express.json());

// FIX PATH - FLAT STRUCTURE - 6 FILES - ROOT - src/index.html - HINDI ../index.html!
console.log('__dirname:', __dirname);
console.log('Checking index.html at:', path.join(__dirname, 'index.html'));
console.log('Exists:', fs.existsSync(path.join(__dirname, 'index.html')));

app.use(express.static(path.join(__dirname)));

app.post('/api/login', (req, res) => {
  const u = (req.body.username || '').toString().trim();
  const p = (req.body.password || '').toString().trim();
  console.log('Login attempt:', u);
  const account = ADMIN_ACCOUNTS.find(acc => acc.username === u && acc.password === p);
  if (account) {
    console.log('Login success:', u, '- Role:', account.role);
    res.json({ success: true, message: 'Login success', user: { username: account.username, role: account.role, name: account.name } });
  } else {
    console.log('Login failed:', u);
    res.json({ success: false, message: 'Invalid username or password' });
  }
});

app.get('/api/toda', (req, res) => {
  res.json([
    { id: 1, name: 'TODA 1 - Project 8', driver: 'Juan Dela Cruz', status: 'Available' },
    { id: 2, name: 'TODA 2 - Munoz', driver: ' 【entity-Pedro Santos¦canonical_name=Pedro Santos】', status: 'On Trip' },
    { id: 3, name: 'TODA 3 - QC', driver: 'Mark Naguit', status: 'Available' }
  ]);
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'TODA QC - todaqc.online', time: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// FIX - DITO - index.html - __dirname + '/index.html' - HINDI '../index.html' - PARA HINDI ENOENT!
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  console.log('Serving:', filePath);
  res.sendFile(filePath);
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
  const filePath = path.join(__dirname, 'index.html');
  res.sendFile(filePath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log('TODA QC ONLINE - PERSISTENT - BLANK USERNAME - SECRET ADMIN');
  console.log('Port:', PORT);
  console.log('Dir:', __dirname);
  console.log('Secret Admins:');
  ADMIN_ACCOUNTS.forEach(acc => console.log(` - ${acc.username} / ${acc.password} (${acc.role})`));
  console.log('=================================');
});
