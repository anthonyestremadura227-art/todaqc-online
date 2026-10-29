const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.post('/api/login', (req,res)=>{
  const {username,password}=req.body;
  if(username==='admin'&&password==='admin123'){
    res.json({success:true,message:'Login success - TODA QC',user:{username:'admin'}});
  } else {
    res.json({success:false,message:'Invalid'});
  }
});
app.get('/api/toda', (req,res)=>{
  res.json([
    {id:1,name:'TODA 1 - Project 8',driver:'Juan Dela Cruz',status:'Available'},
    {id:2,name:'TODA 2 - Munoz',driver:'Pedro Santos',status:'On Trip'},
    {id:3,name:'TODA 3 - QC',driver:'Mark Naguit',status:'Available'}
  ]);
});
app.get('/api/health', (req,res)=>res.json({status:'OK'}));
app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT,'0.0.0.0',()=>{
  console.log('TODA QC ONLINE - LIVE! Port '+PORT);
});
