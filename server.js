
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const USERS_FILE = path.join(__dirname, 'users.json');

let users = [];
let tricycles = [];
let queue = [];
let attendance = [];
let boundary = [];
let income = { byDriver: {} };


function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`Loaded ${users.length} users from users.json`);
    } else {
      
      users = [
        { name: 'Admin', username: 'admin', password: 'smoker123', role: 'President', contact: '09123456789', license: 'N01-01-000001', plate: 'TODA-QC-01' },
        
      ];
      saveUsers();
    }
  } catch (e) {
    console.error('Error loading users:', e);
    users = [];
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

loadUsers();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/register', (req, res) => {
  const { name, username, password, role, contact, license, plate } = req.body;
  if (!name || !username || !password) return res.json({ ok: false, error: 'Required fields missing!' });
  if (users.find(u => u.username === username)) return res.json({ ok: false, error: 'Username exists na!' });
  const newUser = { name, username, password, role: role || 'Driver', contact: contact || '', license: license || '', plate: plate || '' };
  users.push(newUser);
  saveUsers();
  console.log(`New user registered: ${username}`);
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPass } = user;
    return res.json({ ok: true, user: userWithoutPass });
  }
  console.log(`Login failed for: ${username}`);
  res.status(401).json({ ok: false, error: 'Invalid username or password' });
});

app.get('/api/drivers', (req, res) => res.json(users));
app.get('/api/users', (req, res) => res.json(users));
app.get('/api/tricycles', (req, res) => res.json(tricycles));
app.post('/api/tricycles', (req, res) => {
  const t = { id: Date.now().toString(), ...req.body };
  tricycles.push(t);
  res.json({ ok: true, data: t });
});
app.delete('/api/tricycles/:id', (req, res) => {
  tricycles = tricycles.filter(t => t.id !== req.params.id);
  res.json({ ok: true });
});
app.get('/api/queue', (req, res) => res.json({ queue }));
app.post('/api/queue/join', (req, res) => {
  const item = { ...req.body, time: new Date().toLocaleTimeString() };
  queue.push(item);
  if (req.body.fare && Number(req.body.fare) > 0) {
    const name = req.body.driverName;
    if (!income.byDriver[name]) income.byDriver[name] = { trips: 0, income: 0, license: req.body.license };
    income.byDriver[name].trips += 1;
    income.byDriver[name].income += Number(req.body.fare);
  }
  res.json({ ok: true });
});
app.post('/api/queue/leave', (req, res) => {
  queue = queue.filter(q => q.driverName !== req.body.driverName);
  res.json({ ok: true });
});
app.get('/api/attendance', (req, res) => res.json(attendance));
app.post('/api/attendance/mark', (req, res) => {
  const { driverName, contact, plate, license, status } = req.body;
  const today = new Date().toISOString().slice(0,10);
  attendance.push({ driverName, contact, plate, license, status, date: today, time: new Date().toLocaleTimeString() });
  res.json({ ok: true });
});
app.get('/api/boundary', (req, res) => res.json(boundary));
app.post('/api/boundary/pay', (req, res) => {
  boundary.push({ driverName: req.body.driverName, paid: req.body.amount, status: 'Paid', date: new Date().toISOString().slice(0,10) });
  res.json({ ok: true });
});
app.get('/api/income', (req, res) => res.json(income));
app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'TODA QC', time: new Date().toISOString(), users: users.length }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
  const p1 = path.join(__dirname, '../frontend/index.html');
  const p2 = path.join(__dirname, '../index.html');
  res.sendFile(fs.existsSync(p1) ? p1 : p2);
});

app.listen(PORT, () => {
  console.log(`================================`);
  console.log(`TODA QC ONLINE - PERSISTENT`);
  console.log(`Port: ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`Users file: ${USERS_FILE}`);
  console.log(`Total users: ${users.length}`);
  users.forEach(u => console.log(` - ${u.username} / ${u.password} (${u.role})`));
  console.log(`================================`);
});
