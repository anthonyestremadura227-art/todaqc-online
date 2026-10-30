const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

const ADMIN_ACCOUNTS = [
  { username: 'admin', password: 'smoker123', name: 'Mark Anthony Naguit', role: 'admin' },
  { username: 'adminmark', password: 'admin123', name: 'Mark Anthony Naguit - AdminMark', role: 'admin' },
  { username: 'secretadmin', password: 'toda2024', name: 'Secret Admin', role: 'admin' },
  { username: 'adminbea', password: 'bea123', name: 'Admin Bea', role: 'admin' },
  { username: 'secretarybea', password: 'bea123', name: 'Secretary Bea', role: 'admin' }
];

const DATA_DIR = __dirname;
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  queue: path.join(DATA_DIR, 'queue.json'),
  attendance: path.join(DATA_DIR, 'attendance.json'),
  trips: path.join(DATA_DIR, 'trips.json'),
  boundary: path.join(DATA_DIR, 'boundary.json'),
  tricycles: path.join(DATA_DIR, 'tricycles.json')
};

function readJSON(file, fallback){
  try{ if(!fs.existsSync(file)) return fallback; const c=fs.readFileSync(file,'utf8'); return JSON.parse(c); }catch(e){ return fallback; }
}
function writeJSON(file, data){
  try{ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }catch(e){ console.error('write error', e.message); }
}

function initFiles(){
  for(const k in FILES){
    if(!fs.existsSync(FILES[k])) writeJSON(FILES[k], []);
  }
}
initFiles();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Robust index.html finder
function findIndexHtml(){
  const possible = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'frontend', 'index.html'),
    path.join(__dirname, '..', 'frontend', 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for(const p of possible){
    if(fs.existsSync(p)) return p;
  }
  return null;
}

app.get('/api/health', (req,res)=>{ res.json({ status: 'ok', time: new Date().toISOString(), adminAccounts: ADMIN_ACCOUNTS.map(a=>a.username) }); });

// USERS - returns with password for admin view (thesis demo - in prod use hashing)
app.get('/api/users', (req,res)=>{
  try{
    let users = readJSON(FILES.users, []);
    // Merge with admin accounts for display but don't overwrite password if already exists
    // Filter undefined / corrupted
    users = users.filter(u=> u && u.username && u.name);
    res.json({ success: true, users });
  }catch(e){ res.json({ success: false, message: 'Server error' }); }
});

app.get('/api/tricycles', (req,res)=>{
  try{
    let tricycles = readJSON(FILES.tricycles, []);
    tricycles = tricycles.filter(t=> t && t.username && t.name && t.license && t.plate);
    res.json({ success: true, tricycles });
  }catch(e){ res.json({ success: false, message: 'Server error' }); }
});

app.post('/api/register', (req,res)=>{
  try{
    const { username, password, name, role, license, plate } = req.body;
    const u = (username||'').trim();
    const p = (password||'').trim();
    if(!u || !p) return res.json({ success: false, message: 'Username and password required' });
    if(u.length<3) return res.json({ success: false, message: 'Username must be at least 3 characters' });
    if(p.length<6) return res.json({ success: false, message: 'Password must be at least 6 characters' });
    let users = readJSON(FILES.users, []);
    users = users.filter(x=> x && x.username);
    if(users.find(x=>x.username===u) || ADMIN_ACCOUNTS.find(a=>a.username===u)){
      return res.json({ success: false, message: 'Username already exists' });
    }
    const newUser = { username: u, password: p, name: name||u, role: role||'driver', license: license||'', plate: plate||'', status: 'Active', createdAt: new Date().toISOString() };
    users.push(newUser);
    writeJSON(FILES.users, users);
    let tricycles = readJSON(FILES.tricycles, []);
    tricycles = tricycles.filter(t=> t && t.username);
    if(license && plate){
      tricycles.push({ name: name||u, username: u, license: license, plate: plate, status: 'Pending', createdAt: new Date().toISOString() });
      writeJSON(FILES.tricycles, tricycles);
    }
    res.json({ success: true, user: newUser });
  }catch(e){ console.error(e); res.json({ success: false, message: 'Server error: '+e.message }); }
});

app.post('/api/login', (req,res)=>{
  try{
    const { username, password } = req.body;
    const u = (username||'').trim();
    const p = (password||'').trim();
    if(!u || !p) return res.json({ success: false, message: 'Username and password required' });
    // Check admin first
    const admin = ADMIN_ACCOUNTS.find(a=> a.username===u && a.password===p);
    if(admin){ return res.json({ success: true, user: { username: admin.username, name: admin.name, role: admin.role, status: 'Active' } }); }
    // Check users - allow login even without license/plate (old records)
    let users = readJSON(FILES.users, []);
    users = users.filter(x=> x && x.username);
    const found = users.find(x=> x.username===u && x.password===p);
    if(found){
      return res.json({ success: true, user: { username: found.username, name: found.name, role: found.role, license: found.license||'', plate: found.plate||'', status: found.status||'Active' } });
    }
    // Debug: user exists but password mismatch - return hint for thesis
    const exists = users.find(x=> x.username===u);
    if(exists){
      return res.json({ success: false, message: 'Wrong password for user: '+u+'. Stored password is: '+exists.password+' - Try that or reset via Admin User Management Change Password. If still fails, database may have corrupted spaces - try re-register with new username.' });
    }
    res.json({ success: false, message: 'Invalid username or password - User not found: '+u });
  }catch(e){ console.error(e); res.json({ success: false, message: 'Server error: '+e.message }); }
});

// PUT - Change password / license / plate - Admin can fix jom
app.put('/api/users/:username', (req,res)=>{
  try{
    const uname = req.params.username;
    const { password, license, plate, name, status } = req.body;
    let users = readJSON(FILES.users, []);
    let idx = users.findIndex(u=> u && u.username===uname);
    if(idx>=0){
      if(password) users[idx].password=password;
      if(license!==undefined) users[idx].license=license;
      if(plate!==undefined) users[idx].plate=plate;
      if(name) users[idx].name=name;
      if(status) users[idx].status=status;
      users[idx].updatedAt=new Date().toISOString();
      writeJSON(FILES.users, users);
      let tricycles = readJSON(FILES.tricycles, []);
      let tIdx = tricycles.findIndex(t=> t && t.username===uname);
      if(tIdx>=0){
        if(license!==undefined) tricycles[tIdx].license=license;
        if(plate!==undefined) tricycles[tIdx].plate=plate;
        if(name) tricycles[tIdx].name=name;
        if(password) tricycles[tIdx].password=password;
        writeJSON(FILES.tricycles, tricycles);
      }
      res.json({ success: true, user: users[idx] });
    }else{
      res.json({ success: false, message: 'User not found: '+uname });
    }
  }catch(e){ res.json({ success: false, message: 'Server error: '+e.message }); }
});

// DELETE user - admin can delete corrupted jom
app.delete('/api/users/:username', (req,res)=>{
  try{
    const uname = req.params.username;
    let users = readJSON(FILES.users, []);
    users = users.filter(u=> u && u.username!==uname);
    writeJSON(FILES.users, users);
    let tricycles = readJSON(FILES.tricycles, []);
    tricycles = tricycles.filter(t=> t && t.username!==uname);
    writeJSON(FILES.tricycles, tricycles);
    let queue = readJSON(FILES.queue, []);
    queue = queue.filter(q=> q && q.username!==uname);
    writeJSON(FILES.queue, queue);
    let attendance = readJSON(FILES.attendance, []);
    attendance = attendance.filter(a=> a && a.username!==uname && a.driver!==uname);
    writeJSON(FILES.attendance, attendance);
    res.json({ success: true });
  }catch(e){ res.json({ success: false, message: 'Server error' }); }
});

app.get('/api/queue', (req,res)=>{ try{ let q=readJSON(FILES.queue, []); q=q.filter(x=> x && x.name && x.username); res.json({ success:true, queue:q }); }catch(e){ res.json({ success:false }); } });
app.post('/api/queue', (req,res)=>{ try{ const { queue }=req.body; const clean = (queue||[]).filter(x=> x && x.name && x.username); writeJSON(FILES.queue, clean); res.json({ success:true }); }catch(e){ res.json({ success:false }); } });

app.get('/api/attendance', (req,res)=>{ try{ let a=readJSON(FILES.attendance, []); a=a.filter(x=> x && x.driver && x.date && x.status && x.time); res.json({ success:true, attendance:a }); }catch(e){ res.json({ success:false }); } });
app.post('/api/attendance', (req,res)=>{ try{ const { attendance }=req.body; const clean = (attendance||[]).filter(x=> x && x.driver && x.date && x.status && x.time); writeJSON(FILES.attendance, clean); res.json({ success:true }); }catch(e){ res.json({ success:false }); } });

app.get('/api/trips', (req,res)=>{ try{ let t=readJSON(FILES.trips, []); t=t.filter(x=> x && x.driver && x.date); res.json({ success:true, trips:t }); }catch(e){ res.json({ success:false }); } });
app.post('/api/trips', (req,res)=>{ try{ const { trips }=req.body; writeJSON(FILES.trips, trips||[]); res.json({ success:true }); }catch(e){ res.json({ success:false }); } });

app.get('/api/boundary', (req,res)=>{ try{ let b=readJSON(FILES.boundary, []); res.json({ success:true, boundary:b }); }catch(e){ res.json({ success:false }); } });
app.post('/api/boundary', (req,res)=>{ try{ const { boundary }=req.body; writeJSON(FILES.boundary, boundary||[]); res.json({ success:true }); }catch(e){ res.json({ success:false }); } });

app.post('/api/tricycles', (req,res)=>{ try{ const { tricycles }=req.body; const clean=(tricycles||[]).filter(t=> t && t.username && t.name && t.license && t.plate); writeJSON(FILES.tricycles, clean); res.json({ success:true }); }catch(e){ res.json({ success:false }); } });

// Reset endpoint for thesis demo - clears corrupted DB
app.post('/api/reset-db', (req,res)=>{
  try{
    const { secret } = req.body;
    if(secret!=='toda2024reset'){
      return res.json({ success:false, message:'Invalid reset secret - use toda2024reset' });
    }
    writeJSON(FILES.queue, []);
    writeJSON(FILES.attendance, []);
    writeJSON(FILES.trips, []);
    writeJSON(FILES.boundary, []);
    writeJSON(FILES.tricycles, []);
    // Keep users but clean undefined
    let users = readJSON(FILES.users, []);
    users = users.filter(u=> u && u.username && u.name && u.password);
    writeJSON(FILES.users, users);
    res.json({ success:true, message:'Database cleaned - queue, attendance, trips, boundary, tricycles cleared - users cleaned' });
  }catch(e){ res.json({ success:false }); }
});

// Serve frontend
const indexPath = findIndexHtml();
if(indexPath){
  const dir = path.dirname(indexPath);
  app.use(express.static(dir));
  app.get('*', (req,res)=>{
    if(req.path.startsWith('/api/')) return res.status(404).json({ success:false, message:'API not found' });
    const idx = findIndexHtml();
    if(idx) res.sendFile(idx);
    else res.status(404).send('Not Found - index.html missing');
  });
}else{
  app.get('*', (req,res)=>{
    if(req.path.startsWith('/api/')) return res.status(404).json({ success:false });
    res.status(404).send('Not Found - index.html missing - Check GitHub root has index.html');
  });
}

app.listen(PORT, ()=>{ console.log(`TODA QC Server running on port ${PORT} - Admin accounts: ${ADMIN_ACCOUNTS.map(a=>a.username).join(', ')}`); console.log('Database files initialized - users, queue, attendance, trips, boundary, tricycles - Empty DB that fills when register - Auto queue - Attendance visible to admin - No duplicate - X delete - Tricycle Reg License Plate - Password View Admin Only - Jom fix'); });
