'use strict';
// Vercel Node function. Credentials stay in server environment variables.
const services = new Set(['LiDAR Processing','Photogrammetry','GIS Services','Orthophoto Production','Laser Scanning','Engineering & CAD','Other / General Enquiry']);
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST.'});}
  const origin = req.headers.origin;
  const host = req.headers.host;
  if(origin) {
    try {if(new URL(origin).host !== host) return res.status(403).json({error:'Origin not allowed.'});}
    catch {return res.status(403).json({error:'Origin not allowed.'});}
  }
  if(!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({error:'JSON required.'});
  let b=req.body;
  try {if(typeof b === 'string') b=JSON.parse(b);} catch {return res.status(400).json({error:'Invalid request.'});}
  if(!b || typeof b !== 'object' || Array.isArray(b)) return res.status(400).json({error:'Invalid request.'});
  const limits={firstName:80,lastName:80,email:254,phone:40,service:60,message:4000,website:200};
  const data={};
  for(const [field,max] of Object.entries(limits)) {
    if(b[field] != null && typeof b[field] !== 'string') return res.status(400).json({error:'Invalid field.'});
    data[field]=(b[field] || '').trim();
    if(data[field].length>max) return res.status(400).json({error:'Field too long.'});
  }
  if(data.website) return res.status(400).json({error:'Invalid request.'});
  if(!data.firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !services.has(data.service) || data.message.length<20 || /[\r\n]/.test(data.email+data.firstName+data.lastName)) return res.status(400).json({error:'Check the required fields.'});
  const key=req.headers['idempotency-key'];
  if(typeof key !== 'string' || !/^[a-zA-Z0-9-]{10,100}$/.test(key)) return res.status(400).json({error:'Invalid request ID.'});
  if(!process.env.RESEND_API_KEY || !process.env.ENQUIRY_FROM) return res.status(503).json({error:'Email delivery is not configured. Please use the email link.'});
  try {
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`enquiry-${key}`},
      body:JSON.stringify({from:process.env.ENQUIRY_FROM,to:[process.env.ENQUIRY_TO || 'info@geoinformatics.co.in'],reply_to:data.email,subject:`Website enquiry: ${data.service}`,text:`Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not supplied'}\nService: ${data.service}\n\n${data.message}`}),
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok) return res.status(502).json({error:'Email service unavailable. Please retry or use the email link.'});
    const result=await response.json();
    if(!result.id) return res.status(502).json({error:'Email service did not confirm submission.'});
    return res.status(200).json({accepted:true});
  } catch {return res.status(502).json({error:'Unable to confirm submission. Please retry or use the email link.'});}
};
