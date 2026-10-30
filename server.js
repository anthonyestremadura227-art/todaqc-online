
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// ADMIN ACCOUNTS - EDIT HERE - PWEDE MO PALITAN PASSWORD - SECRET ADMIN - TODA QC LANG
const ADMIN_ACCOUNTS = [
  { username: 'admin', password: 'smoker123', name: 'Mark Anthony Naguit', role: 'admin', status: 'Active' },
  { username: 'adminmark', password: 'admin123', name: 'Mark Anthony Naguit - AdminMark', role: 'admin', status: 'Active' },
  { username: 'secretadmin', password: 'toda2024', name: 'Secret Admin', role: 'admin', status: 'Active' }
];
const ADMIN_ACCOUNT = ADMIN_ACCOUNTS[0];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Robust find index.html
function findIndexHtml(){
  const possible = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'frontend', 'index.html'),
    path.join(__dirname, '..', 'frontend', 'index.html'),
    path.join(__dirname, 'frontend', 'TODA_QC_BarangayLink_Style.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for(const p of possible){
    if(fs.existsSync(p)){
      console.log('Found index.html at:', p);
      return p;
    }
  }
  return null;
}

const DATA_DIR = __dirname;
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  queue: path.join(DATA_DIR, 'queue.json'),
  attendance: path.join(DATA_DIR, 'attendance.json'),
  trips: path.join(DATA_DIR, 'trips.json'),
  boundary: path.join(DATA_DIR, 'boundary.json')
};

function readJSON(file, def){
  try{
    if(!fs.existsSync(file)){
      fs.writeFileSync(file, JSON.stringify(def, null, 2));
      return def;
    }
    const data = fs.readFileSync(file, 'utf8');
    return data ? JSON.parse(data) : def;
  }catch(e){
    console.error('Read error', file, e.message);
    return def;
  }
}
function writeJSON(file, data){
  try{
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }catch(e){
    console.error('Write error', file, e.message);
  }
}

// Init files
if(!fs.existsSync(FILES.users)) writeJSON(FILES.users, ADMIN_ACCOUNTS);
if(!fs.existsSync(FILES.queue)) writeJSON(FILES.queue, []);
if(!fs.existsSync(FILES.attendance)) writeJSON(FILES.attendance, []);
if(!fs.existsSync(FILES.trips)) writeJSON(FILES.trips, []);
if(!fs.existsSync(FILES.boundary)) writeJSON(FILES.boundary, []);

// API - Login - FIXED - MAG REREKTA SA DASHBOARD
app.post('/api/login', (req,res)=>{
  try{
    const { username, password } = req.body;
    const u = (username||'').trim();
    const p = (password||'').trim();
    console.log(`Login attempt: ${u}`);
    
    // Check ADMIN_ACCOUNTS first
    const adminFound = ADMIN_ACCOUNTS.find(a=> a.username===u && a.password===p);
    if(adminFound){
      console.log(`Success: ${u} - Admin`);
      return res.json({ success: true, user: adminFound });
    }
    
    // Check regular users from file + admin accounts
    let users = readJSON(FILES.users, []);
    // Merge with ADMIN_ACCOUNTS for login check
    const allUsers = [...ADMIN_ACCOUNTS, ...users];
    // Dedupe by username - keep first (admin)
    const map = {};
    allUsers.forEach(x=>{ if(!map[x.username]) map[x.username]=x; });
    const finalUsers = Object.values(map);
    
    const found = finalUsers.find(x=> x.username===u && (x.password===p || x.username===x.password || !x.password));
    // For users without password field saved, check if password matches username or saved
    // Actually check stored users with password
    let stored = users.find(x=> x.username===u);
    if(stored){
      if(stored.password && stored.password===p){
        console.log(`Success: ${u} - Driver`);
        return res.json({ success: true, user: stored });
      }
      // If no password field but user exists, allow (for old data)
      if(!stored.password){
        console.log(`Success: ${u} - Driver (no pwd)`);
        return res.json({ success: true, user: stored });
      }
    }
    
    // Also check if user exists with same username/password pattern
    const simple = finalUsers.find(x=> x.username===u && x.password===p);
    if(simple){
      return res.json({ success: true, user: simple });
    }
    
    console.log(`Failed login: ${u}`);
    return res.json({ success: false, message: 'Invalid username or password' });
  }catch(e){
    console.error('Login error', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/users', (req,res)=>{
  try{
    let users = readJSON(FILES.users, []);
    // Always include ADMIN_ACCOUNTS
    const map = {};
    [...ADMIN_ACCOUNTS, ...users].forEach(u=>{ if(u.username) map[u.username]=u; });
    const merged = Object.values(map);
    res.json({ success: true, users: merged });
  }catch(e){
    res.json({ success: true, users: ADMIN_ACCOUNTS });
  }
});

app.post('/api/register', (req,res)=>{
  try{
    const { username, password, name, role } = req.body;
    const u = (username||'').trim();
    if(!u || !password) return res.json({ success: false, message: 'Username and password required' });
    let users = readJSON(FILES.users, []);
    if(users.find(x=>x.username===u) || ADMIN_ACCOUNTS.find(a=>a.username===u)){
      return res.json({ success: false, message: 'Username already exists' });
    }
    const newUser = { username: u, password: password, name: name||u, role: role||'driver', status: 'Active', createdAt: new Date().toISOString() };
    users.push(newUser);
    writeJSON(FILES.users, users);
    res.json({ success: true, user: newUser });
  }catch(e){
    res.json({ success: false, message: 'Server error' });
  }
});

// Other APIs - queue, attendance, trips, boundary - file based
app.get('/api/:type', (req,res)=>{
  const t = req.params.type;
  if(!FILES[t]) return res.json({ success: false });
  const data = readJSON(FILES[t], []);
  res.json({ success: true, data, [t]: data, users: t==='users'?data:undefined });
});
app.post('/api/:type', (req,res)=>{
  const t = req.params.type;
  if(!FILES[t]) return res.json({ success: false });
  const body = req.body;
  let data = readJSON(FILES[t], []);
  if(Array.isArray(body)){
    data = body;
  }else if(body.data){
    data = body.data;
  }else{
    data.push(body);
  }
  writeJSON(FILES[t], data);
  res.json({ success: true, data });
});

// Serve static - frontend files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch all - serve index.html
app.get('*', (req,res)=>{
  const indexPath = findIndexHtml();
  if(indexPath){
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Not Found - index.html missing. Make sure index.html is in root or frontend folder.');
});

app.listen(PORT, ()=>{ console.log(`TODA QC Server running on port ${PORT}`); console.log(`Admin accounts:`, ADMIN_ACCOUNTS.map(a=>a.username).join(', ')); });
