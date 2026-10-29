const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Log all files for debugging
console.log('=== TODA QC DEBUG ===');
console.log('__dirname:', __dirname);
try {
  const files = fs.readdirSync(__dirname);
  console.log('Files in root:', files);
  if (fs.existsSync(path.join(__dirname, 'frontend'))) {
    console.log('frontend folder exists:', fs.readdirSync(path.join(__dirname, 'frontend')));
  }
  if (fs.existsSync(path.join(__dirname, 'Backend'))) {
    console.log('Backend folder exists:', fs.readdirSync(path.join(__dirname, 'Backend')));
  }
} catch(e) {
  console.log('Error listing files:', e.message);
}

// Serve static from multiple possible locations - robust!
const possibleStatic = [
  path.join(__dirname),
  path.join(__dirname, 'frontend'),
  path.join(__dirname, 'Backend'),
  path.join(__dirname, 'backend')
];
possibleStatic.forEach(p => {
  if (fs.existsSync(p)) {
    app.use(express.static(p));
    console.log('Serving static from:', p);
  }
});
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(__dirname));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, message: 'Login success - TODA QC', user: { username: 'admin' } });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TODA QC - todaqc.online', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Find index.html in multiple locations
function findIndex() {
  const candidates = [
    path.join(__dirname, 'frontend', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'frontend', 'toda.html'),
    path.join(__dirname, 'toda.html'),
    path.join(__dirname, 'Backend', 'frontend', 'index.html'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      console.log('Found index at:', c);
      return c;
    }
  }
  console.log('No index found in candidates, listing all html files:');
  return null;
}

app.get('/', (req, res) => {
  const indexPath = findIndex();
  if (indexPath) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html>
      <head><title>TODA QC - Deploy Fix</title></head>
      <body style="font-family:Arial;padding:40px;text-align:center">
        <h1>TODA QC ONLINE - LIVE!</h1>
        <p>Server is running but index.html not found.</p>
        <p>Files in root: ${fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join(', ') : 'error'}</p>
        <p>Frontend exists: ${fs.existsSync(path.join(__dirname, 'frontend'))}</p>
        <p>Login API: POST /api/login with admin/admin123</p>
        <a href="/api/health">Check Health</a>
        <script>console.log('TODA QC Debug');</script>
      </body>
      </html>
    `);
  }
});

app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  const indexPath = findIndex();
  if (indexPath) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log('TODA QC ONLINE - LIVE!');
  console.log('Port:', PORT);
  console.log('URL: https://todaqc-online.onrender.com');
  console.log('Login: admin / admin123');
  console.log('=================================');
});
