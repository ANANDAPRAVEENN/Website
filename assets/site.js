'use strict';
const nav = document.getElementById('nav');
const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, {passive:true});
updateNav();
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {if(e.key === 'Escape' && navLinks.classList.contains('open')) {setMenu(false);menuBtn.focus();}});
window.matchMedia('(min-width:981px)').addEventListener('change', e => {if(e.matches) setMenu(false);});
// Essential content and accurate totals remain visible without JavaScript.
document.querySelectorAll('.count').forEach(el => {el.textContent=el.dataset.target;});
function filterProjects(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-pressed', String(b === btn));
  });
  const cards = document.querySelectorAll('[data-project]');
  cards.forEach(card => {
    const show = cat === 'all' || card.dataset.cat.split(' ').includes(cat);
    card.hidden = !show;
  });
}
const video = document.getElementById('showcase-video');
const overlay = document.getElementById('play-overlay');
const muteBtn = document.getElementById('mute-btn');
const videoStatus = document.getElementById('video-status');
function updateVideo() {
  overlay.hidden = !video.paused && !video.ended;
  muteBtn.style.display = overlay.hidden ? 'block' : 'none';
  muteBtn.textContent = video.muted ? '🔇 Unmute' : '🔊 Mute';
  muteBtn.setAttribute('aria-pressed', String(video.muted));
}
async function toggleVideo(player) {
  videoStatus.textContent = '';
  if (!player.paused) {player.pause();return;}
  try {await player.play();} catch {videoStatus.textContent = 'The showcase could not play. Please try again, or contact us for project samples.';}
  updateVideo();
}
function toggleMute() {video.muted=!video.muted;updateVideo();}
['play','pause','ended','volumechange'].forEach(event => video.addEventListener(event,updateVideo));
video.addEventListener('error', () => {videoStatus.textContent='The showcase is temporarily unavailable. Please contact us for project samples.';updateVideo();});
// Prepare a readable fallback email, but never claim it has been sent.
const form = document.getElementById('enquiry-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('[type="submit"]');
const fallback = document.getElementById('email-fallback');
let pendingKey = null;
let pendingBody = null;
form.addEventListener('submit', async e => {
  e.preventDefault();
  if(!form.reportValidity() || submit.disabled) return;
  const data = Object.fromEntries(new FormData(form));
  const body = JSON.stringify(data);
  if(body !== pendingBody) {pendingBody=body;pendingKey=crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;}
  const summary = `Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not supplied'}\nService: ${data.service}\n\n${data.message}`;
  fallback.href=`mailto:info@geoinformatics.co.in?subject=${encodeURIComponent('Project enquiry: '+data.service)}&body=${encodeURIComponent(summary)}`;
  if(document.body.dataset.demo === 'true') {
    document.getElementById('enquiry-summary').textContent=summary;
    document.getElementById('enquiry-preview').showModal();
    status.textContent='Demo preview only — no message has been sent.';
    return;
  }
  submit.disabled=true;submit.textContent='Sending…';status.textContent='Submitting your enquiry…';status.dataset.state='pending';
  try {
    const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pendingKey},body,signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    if(!response.ok || !result.accepted) throw new Error(result.error || 'Sending is unavailable.');
    status.textContent='Your enquiry has been submitted. Thank you — our team will be in touch.';
    status.dataset.state='success';form.reset();pendingKey=null;pendingBody=null;
    fallback.href='mailto:info@geoinformatics.co.in';fallback.textContent='Prefer email? Contact info@geoinformatics.co.in';
  } catch {
    status.dataset.state='error';status.textContent='We could not confirm your enquiry was sent. Your details are still here. You can try again or open the prepared email below.';
    fallback.textContent='Open your enquiry in your email app';
  } finally {submit.disabled=false;submit.textContent='Send Project Enquiry';}
});
// Map is optional: blocked tiles or CDN access must not break the rest of the page.
if(typeof L !== 'undefined') {
  const fallbackMap=document.querySelector('.map-fallback');
  const map = L.map('client-map',{center:[20,15],zoom:2,zoomSnap:.25,zoomControl:true,scrollWheelZoom:false,attributionControl:true,worldCopyJump:false});
  map.createPane('land');map.getPane('land').style.zIndex=190;
  if(typeof worldLand !== 'undefined') {
    L.geoJSON(worldLand,{pane:'land',interactive:false,style:{color:'#83a99a',weight:.5,fillColor:'#325a47',fillOpacity:1},attribution:'Natural Earth'}).addTo(map);
    if(fallbackMap) fallbackMap.hidden=true;
  }
  const tiles=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:10,minZoom:0,noWrap:true,attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'}).addTo(map);

  function makeIcon(isHQ) {
    return L.divIcon({className:'',html:`<div style="width:${isHQ?16:12}px;height:${isHQ?16:12}px;background:${isHQ?'#b9efc9':'#ffffff'};border-radius:50%;border:2px solid #155b3a;box-shadow:0 0 0 5px rgba(185,239,201,.22)"></div>`,iconSize:[16,16],iconAnchor:[8,8],popupAnchor:[0,-10]});
  }
const clients=[
  [-26.65,153.06,'Sunshine Coast','Australia','LiDAR Classification · 600 SqKm'],
  [-33.87,151.21,'Sydney','Australia','Western Sydney Corridor · 64 SqKm'],
  [-31.95,115.86,'Perth','Australia','City of Karratha & Newman Sites'],
  [44.05,-123.09,'Oregon','USA','Calistoga Fire Mitigation · 100 Acres'],
  [41.85,-87.65,'Chicago','USA','Forest Fire Analysis · 200 Acres'],
  [49.25,-123.10,'Vancouver','Canada','High Density LiDAR'],
  [50.85,4.35,'Belgium','Europe','European Geospatial Project'],
  [-15.78,-47.93,'Brazil','South America','Canal Alagoano · 13,000 UAV Images'],
  [13.08,80.27,'Chennai','India','Geoinformatics HQ · All Services'],
  [51.51,-0.13,'London','UK','UK Geospatial Services'],
  [43.30,5.38,'Marseille','France','European Mapping Project']
];
  clients.forEach(c=>{
    const hq=c[2]==='Chennai';
    L.marker([c[0],c[1]],{icon:makeIcon(hq),title:c[2],alt:`${c[2]}, ${c[3]}`}).addTo(map).bindPopup(`<strong>${c[2]}${hq?' · HQ':''}</strong><span>${c[3]}</span><span>${c[4]}</span>`);
  });
  map.fitBounds(clients.map(c=>[c[0],c[1]]),{padding:[38,38],maxZoom:4,animate:false});
}
