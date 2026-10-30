const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

const usersFile = path.join(__dirname, 'users.json');
const queueFile = path.join(__dirname, 'queue.json');
const attendanceFile = path.join(__dirname, 'attendance.json');
const tripsFile = path.join(__dirname, 'trips.json');
const boundaryFile = path.join(__dirname, 'boundary.json');

function readJson(filePath, defaultVal){
  try{
    if(!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath,'utf8'));
  }catch(e){ return defaultVal; }
}
function writeJson(filePath, data){
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


const ADMIN_ACCOUNTS = [
  { username: 'adminmark', password: 'smoker123', name: 'Mark Anthony Naguit', role: 'admin', status: 'Active' },
  { username: 'secretadmin', password: 'toda2024', name: 'Secret Admin', role: 'admin', status: 'Active' }
];
const ADMIN_ACCOUNT = ADMIN_ACCOUNTS[0]; // Main admin


if(!fs.existsSync(usersFile)) writeJson(usersFile, [ADMIN_ACCOUNT]);
if(!fs.existsSync(queueFile)) writeJson(queueFile, []);
if(!fs.existsSync(attendanceFile)) writeJson(attendanceFile, []);
if(!fs.existsSync(tripsFile)) writeJson(tripsFile, []);
if(!fs.existsSync(boundaryFile)) writeJson(boundaryFile, []);

app.post('/api/login', (req,res)=>{
  const { username, password } = req.body;
  const u = (username||'').trim();
  const p = (password||'').trim();
  const adminFound = ADMIN_ACCOUNTS.find(a=> a.username===u && a.password===p);
  if(adminFound){
    console.log(`Login: ${u}`); console.log(`Success: ${u} - Admin`);
    return res.json({ success: true, user: adminFound });
  }
  const users = readJson(usersFile, []);
  const found = users.find(x => x.username === u && x.password === p);
  if(found){
    console.log(`Login: ${u}`); console.log(`Success: ${u}`);
    return res.json({ success: true, user: found });
  }
  console.log(`Login: ${u}`); console.log(`Failed: ${u}`);
  return res.json({ success: false, message: 'Invalid username or password' });
});

app.post('/api/register', (req,res)=>{
  const { name, username, password, role } = req.body;
  const u = (username||'').trim();
  const n = (name||'').trim();
  const p = (password||'').trim();
  const r = (role||'driver').trim();
  if(!n || !u || !p) return res.json({ success: false, message: 'Please fill all fields' });
  if(u.length < 3) return res.json({ success: false, message: 'Username must be at least 3 characters' });
  if(p.length < 6) return res.json({ success: false, message: 'Password must be at least 6 characters' });
  let users = readJson(usersFile, []);
  if(users.find(x => x.username === u)) return res.json({ success: false, message: 'Username already exists' });
  const newUser = { username: u, password: p, name: n, role: r, status: 'Pending', createdAt: new Date().toISOString() };
  users.push(newUser);
  writeJson(usersFile, users);
  console.log(`Registered: ${u} - ${r}`);
  return res.json({ success: true, user: newUser, message: 'Account created' });
});

app.post('/api/activate', (req,res)=>{
  const { username } = req.body;
  const u = (username||'').trim();
  let users = readJson(usersFile, []);
  const found = users.find(x => x.username === u);
  if(found && found.status !== 'Active'){ found.status = 'Active'; writeJson(usersFile, users); console.log(`Activated: ${u}`); }
  return res.json({ success: true });
});

app.get('/api/users', (req,res)=>{
  const users = readJson(usersFile, []);
  const safe = users.map(x => ({ username: x.username, name: x.name, role: x.role, status: x.status, createdAt: x.createdAt, password: x.password }));
  return res.json({ success: true, users: safe });
});

app.get('/api/queue', (req,res)=>{ res.json({ success: true, queue: readJson(queueFile, []) }); });
app.post('/api/queue', (req,res)=>{ writeJson(queueFile, req.body.queue||[]); res.json({ success: true }); });

app.get('/api/attendance', (req,res)=>{ res.json({ success: true, attendance: readJson(attendanceFile, []) }); });
app.post('/api/attendance', (req,res)=>{ writeJson(attendanceFile, req.body.attendance||[]); console.log(`Attendance saved - Total: ${(req.body.attendance||[]).length}`); res.json({ success: true }); });

app.get('/api/trips', (req,res)=>{ res.json({ success: true, trips: readJson(tripsFile, []) }); });
app.post('/api/trips', (req,res)=>{ writeJson(tripsFile, req.body.trips||[]); res.json({ success: true }); });

app.get('/api/boundary', (req,res)=>{ res.json({ success: true, boundaries: readJson(boundaryFile, []) }); });
app.post('/api/boundary', (req,res)=>{ writeJson(boundaryFile, req.body.boundaries||[]); res.json({ success: true }); });

// Robust static file handling - try multiple locations
const possibleIndexPaths = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'frontend', 'index.html'),
  path.join(__dirname, '..', 'frontend', 'index.html'),
  path.join(__dirname, 'public', 'index.html')
];

function findIndexHtml(){
  for(const p of possibleIndexPaths){
    if(fs.existsSync(p)) return p;
  }
  return possibleIndexPaths[0];
}

app.get('/', (req,res)=>{
  const indexPath = findIndexHtml();
  console.log(`Serving index from: ${indexPath} - Exists: ${fs.existsSync(indexPath)}`);
  if(fs.existsSync(indexPath)){
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Not Found - index.html not found. Checked: ${possibleIndexPaths.join(', ')} - Files in dir: ${fs.readdirSync(__dirname).join(', ')}`);
  }
});

// Catch-all for SPA - must be last
app.get('*', (req,res)=>{
  if(req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: 'API not found' });
  const indexPath = findIndexHtml();
  if(fs.existsSync(indexPath)){
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found - index.html missing');
  }
});

app.listen(PORT, ()=>{
  console.log(`TODA QC - Single Admin Account`);
  console.log(`Port ${PORT}`);
  console.log(`Checking index paths:`);
  possibleIndexPaths.forEach(p=> console.log(`  ${p} - Exists: ${fs.existsSync(p)}`));
  console.log(`Serving from: ${findIndexHtml()}`);
  console.log(`Admin: ${ADMIN_ACCOUNT.username} / ${ADMIN_ACCOUNT.password} - ${ADMIN_ACCOUNT.name} - Admin`);
  console.log(`Files in __dirname: ${fs.readdirSync(__dirname).join(', ')}`);
  console.log(`================================`);
});
