const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const usersFile = path.join(__dirname, 'users.json');
const usersFileRoot = path.join(__dirname, '../users.json');

function readUsers(){
  try{
    let filePath = usersFile;
    if(!fs.existsSync(filePath) && fs.existsSync(usersFileRoot)){
      filePath = usersFileRoot;
    }
    if(!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath,'utf8');
    return JSON.parse(data);
  }catch(e){ return []; }
}
function writeUsers(users){
  try{
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    fs.writeFileSync(usersFileRoot, JSON.stringify(users, null, 2));
  }catch(e){
    fs.writeFileSync(usersFileRoot, JSON.stringify(users, null, 2));
  }
}

const ADMIN_ACCOUNT = { username: 'admin', password: 'smoker123', name: 'Mark Anthony Naguit', role: 'admin', status: 'Active' };

if(!fs.existsSync(usersFile) && !fs.existsSync(usersFileRoot)){
  writeUsers([ADMIN_ACCOUNT]);
}

app.post('/api/login', (req,res)=>{
  const { username, password } = req.body;
  const u = (username||'').trim();
  const p = (password||'').trim();
  if(u === ADMIN_ACCOUNT.username && p === ADMIN_ACCOUNT.password){
    console.log(`Login: ${u}`); console.log(`Success: ${u}`);
    return res.json({ success: true, user: ADMIN_ACCOUNT });
  }
  const users = readUsers();
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
  let users = readUsers();
  if(users.find(x => x.username === u)) return res.json({ success: false, message: 'Username already exists' });
  const newUser = { username: u, password: p, name: n, role: r, status: 'Pending', createdAt: new Date().toISOString() };
  users.push(newUser);
  writeUsers(users);
  console.log(`Registered: ${u} - ${r}`);
  return res.json({ success: true, user: newUser, message: 'Account created' });
});

app.post('/api/activate', (req,res)=>{
  const { username } = req.body;
  const u = (username||'').trim();
  let users = readUsers();
  const found = users.find(x => x.username === u);
  if(found && found.status !== 'Active'){ found.status = 'Active'; writeUsers(users); console.log(`Activated: ${u}`); }
  return res.json({ success: true });
});

app.get('/api/users', (req,res)=>{
  const users = readUsers();
  const safe = users.map(x => ({ username: x.username, name: x.name, role: x.role, status: x.status, createdAt: x.createdAt }));
  return res.json({ success: true, users: safe });
});

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, ()=>{
  console.log(`TODA QC - Single Admin Account`);
  console.log(`Port ${PORT} Serving ${path.join(__dirname, '../frontend/index.html')}`);
  console.log(`Admin: ${ADMIN_ACCOUNT.username} / ${ADMIN_ACCOUNT.password} - ${ADMIN_ACCOUNT.name} - Admin`);
  console.log(`================================`);
});
