const express = require('express');
const path = require('path');
const os = require('os');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let users = [
  { id: '1', name: 'Admin', username: 'admin', password: 'admin123', role: 'President', contact: '09123456789', license: 'N01-123456', plate: 'ADMIN-001' },
  { id: '2', name: 'Officer', username: 'officer', password: 'officer123', role: 'Officer', contact: '09123456788', license: 'N01-123457', plate: 'OFF-001' },
  { id: '3', name: 'Bea Serafin', username: 'beaserafin1', password: '123456789', role: 'Driver', contact: '09111111111', license: 'BEA-123456', plate: 'BEA-001' },
  { id: '4', name: 'luna beast', username: 'lunabeast', password: '123', role: 'Driver', contact: '09333333333', license: 'N123-123456987', plate: 'ABC123' }
];
let drivers = [
  { id: '1', name: 'Bea Serafin', contact: '09111111111', license: 'BEA-123456', plate: 'BEA-001' },
  { id: '2', name: 'luna beast', contact: '09333333333', license: 'N123-123456987', plate: 'ABC123' }
];
let tricycles = [{ id: '1', plate: 'ABC123', driverName: 'luna beast', model: '', license: 'N123-123456987', contact: '09333333333' }];
let queue = [];
let attendance = [];
let trips = [];
let boundary = [];

function todayStr(){return new Date().toISOString().slice(0,10);}
function timeStr(){return new Date().toLocaleTimeString();}
function getLocalIP(){
  const nets = os.networkInterfaces();
  for(const name of Object.keys(nets)){
    for(const net of nets[name]){
      if(net.family==='IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

app.post('/api/login',(req,res)=>{
  const {username,password}=req.body;
  const user=users.find(u=>u.username===username && u.password===password);
  if(!user) return res.json({ok:false});
  res.json({ok:true,user});
});
app.post('/api/register',(req,res)=>{
  const {name,username,password,role,contact,license,plate}=req.body;
  if(!name||!username||!password) return res.json({ok:false,error:'Required!'});
  if(users.find(u=>u.username===username)) return res.json({ok:false,error:'Username exists!'});
  const newUser={id:Date.now().toString(),name,username,password,role:role||'Driver',contact:contact||'',license:license||'',plate:plate||''};
  users.push(newUser);
  if(newUser.role==='Driver') drivers.push({id:newUser.id,name:newUser.name,contact:newUser.contact,license:newUser.license,plate:newUser.plate});
  res.json({ok:true});
});
app.get('/api/users',(req,res)=>res.json(users));
app.get('/api/drivers',(req,res)=>res.json(drivers));
app.get('/api/tricycles',(req,res)=>res.json(tricycles));
app.post('/api/tricycles',(req,res)=>{
  const {plate,driverName,license}=req.body;
  if(!plate||!driverName||!license) return res.json({ok:false});
  tricycles.push({id:Date.now().toString(),plate,driverName,model:'',license,contact:req.body.contact||''});
  res.json({ok:true});
});
app.delete('/api/tricycles/:id',(req,res)=>{tricycles=tricycles.filter(t=>t.id!==req.params.id);res.json({ok:true});});
app.get('/api/queue',(req,res)=>res.json({queue}));
app.post('/api/queue/join',(req,res)=>{
  const {driverName,contact,origin,destination,fare,plate,license,route}=req.body;
  queue=queue.filter(q=>q.driverName!==driverName);
  queue.push({driverName,contact:contact||'',origin:origin||'',destination:destination||'',fare:Number(fare)||0,plate:plate||'',license:license||'',route:route||'Pila',time:timeStr(),date:todayStr()});
  if(fare&&Number(fare)>0) trips.push({driverName,plate:plate||'',license:license||'',fare:Number(fare),route:origin+' - '+destination,date:todayStr(),time:timeStr()});
  res.json({ok:true});
});
app.post('/api/queue/leave',(req,res)=>{queue=queue.filter(q=>q.driverName!==req.body.driverName);res.json({ok:true});});
app.get('/api/attendance',(req,res)=>res.json(attendance));
app.post('/api/attendance/mark',(req,res)=>{
  const {driverName,contact,plate,license,status}=req.body;
  attendance.push({driverName,contact:contact||'',plate:plate||'',license:license||'',status,date:todayStr(),time:timeStr()});
  res.json({ok:true});
});
app.get('/api/boundary',(req,res)=>res.json(boundary));
app.post('/api/boundary/pay',(req,res)=>{boundary.push({driverName:req.body.driverName,paid:Number(req.body.amount),status:'Paid',date:todayStr(),time:timeStr()});res.json({ok:true});});
app.get('/api/income',(req,res)=>{
  const byDriver={};
  trips.forEach(t=>{
    if(!byDriver[t.driverName]) byDriver[t.driverName]={trips:0,income:0,license:t.license||'',plate:t.plate||''};
    byDriver[t.driverName].trips+=1;
    byDriver[t.driverName].income+=Number(t.fare)||0;
  });
  res.json({trips,byDriver});
});
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'../frontend/index.html')));

app.listen(PORT,'0.0.0.0',()=>{
  const ip=getLocalIP();
  console.log('');
  console.log('========================================');
  console.log('✅ TODA QC - MOBILE READY - RUNNING!');
  console.log('========================================');
  console.log(`✅ Computer: http://localhost:${PORT}`);
  console.log(`✅ Phone (Same WiFi): http://${ip}:${PORT}`);
  console.log('========================================');
  console.log('📱 PAANO MAOOPEN SA PHONE:');
  console.log(`   1. Phone at Computer same WiFi`);
  console.log(`   2. Sa phone Chrome type: http://${ip}:${PORT}`);
  console.log('   3. Login: admin / admin123');
  console.log('========================================');
  console.log('✅ Features: MOBILE READY, HAMBURGER MENU, TOUCH FRIENDLY');
  console.log('✅ JOIN PILA SA TAAS, ENTER+CLICK LOGIN, ADMIN ONLY DELETE');
  console.log('========================================');
});
