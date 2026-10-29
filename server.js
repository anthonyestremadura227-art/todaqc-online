const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serve frontend folder - TODA QC
app.use(express.static(path.join(__dirname, 'frontend')));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login:', username);
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, message: 'Login success - TODA QC', user: { username: 'admin' } });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/toda', (req, res) => {
  res.json([
    { id: 1, name: 'TODA 1 - Project 8', driver: 'Juan Dela Cruz', status: 'Available' },
    { id: 2, name: 'TODA 2 - Munoz', driver: 'Pedro Santos', status: 'On Trip' },
    { id: 3, name: 'TODA 3 - QC', driver: 'Mark Naguit', status: 'Available' }
  ]);
});

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'TODA QC' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'TODA QC' }));

// Serve frontend/index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// PWA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log('TODA QC ONLINE - LIVE!');
  console.log('Port:', PORT);
  console.log('https://todaqc-online.onrender.com');
  console.log('Login: admin / admin123');
  console.log('=================================');
});
