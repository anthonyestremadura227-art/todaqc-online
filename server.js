const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static - FLAT - nasa root lahat - hindi ../frontend!
app.use(express.static(path.join(__dirname)));

// In-memory data - TODA QC System - BUO!
let queue = [];
let currentNumber = 0;
let todaList = [
  { id: 1, name: 'TODA 1 - Project 8', driver: 'Juan Dela Cruz', status: 'Available' },
  { id: 2, name: 'TODA 2 - Munoz', driver: '【entity-Pedro Santos¦canonical_name=Pedro Santos】', status: 'On Trip' },
  { id: 3, name: 'TODA 3 - Quezon City', driver: 'Mark Naguit', status: 'Available' }
];

// API - Login - BUO - admin / admin123 - Enter + Click!
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);
  
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Login successful - TODA QC',
      user: { username: 'admin', role: 'admin', name: 'TODA QC Admin' }
    });
  } else {
    res.json({ success: false, message: 'Invalid username or password' });
  }
});

// API - Get TODA List - BUO!
app.get('/api/toda', (req, res) => {
  res.json(todaList);
});

// API - Get Queue - BUO!
app.get('/api/queue', (req, res) => {
  res.json({ queue, currentNumber, total: queue.length });
});

// API - Add to Queue - BUO!
app.post('/api/queue/add', (req, res) => {
  const { name, destination, todaId } = req.body;
  currentNumber++;
  const newQueue = {
    id: currentNumber,
    number: `QC-${String(currentNumber).padStart(3, '0')}`,
    name: name || 'Passenger',
    destination: destination || 'QC',
    todaId: todaId || 1,
    status: 'Waiting',
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  };
  queue.push(newQueue);
  console.log('Added to queue:', newQueue.number);
  res.json({ success: true, data: newQueue, message: 'Added to queue' });
});

// API - Next Queue - BUO!
app.post('/api/queue/next', (req, res) => {
  if (queue.length > 0) {
    const next = queue.shift();
    next.status = 'Boarding';
    console.log('Next:', next.number);
    res.json({ success: true, data: next });
  } else {
    res.json({ success: false, message: 'No queue' });
  }
});

// API - Clear Queue - BUO!
app.post('/api/queue/clear', (req, res) => {
  queue = [];
  currentNumber = 0;
  res.json({ success: true, message: 'Queue cleared' });
});

// Health check - para kay Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TODA QC - todaqc.online', time: new Date().toISOString() });
});

// Serve index.html - FLAT - nasa root!
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback - PWA - lahat ng route - balik index.html - BUO!
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server - 0.0.0.0 - para sa Render + Mobile!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`TODA QC ONLINE - RUNNING!`);
  console.log(`Port: ${PORT}`);
  console.log(`https://todaqc-online.onrender.com`);
  console.log(`Domain: https://todaqc.online`);
  console.log(`Login: admin / admin123`);
  console.log(`Queue: ${queue.length} waiting`);
  console.log(`=================================`);
});
