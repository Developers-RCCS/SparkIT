let GAME_DATA = {
  project: {
    name: "SparkIT — ICT Literacy Initiative",
    tagline: "Igniting ICT literacy across Sri Lanka, one district at a time.",
    about: "Axis 25 explores Sri Lanka’s digital economy through hands-on learning and maker energy. Start in Phase 1 to register and pitch your idea; build in Phase 2; showcase in Phase 3.",
    location: "Sri Lanka",
    date: "2024-2025"
  },
  phases: [
    {
      id: 1, title: "Phase 1 & 2 — Bridging the Gap",
      summary: "For schools already exposed to ICT, SparkIT strengthens their foundation with advanced programming, robotics, and cybersecurity.",
      open: true,
      formFields: [
        {name:"fullName", label:"Full Name", type:"text", required:true},
        {name:"email", label:"Email", type:"email", required:true},
        {name:"phone", label:"Phone", type:"tel", required:true},
        {name:"bio", label:"Short Bio / Motivation", type:"textarea", required:true}
      ]
    },
    {
      id: 2, title: "Phase 2 — Advanced Foundation",
      summary: "Students dive into advanced topics like programming, robotics, and cybersecurity to match real industry needs.",
      open: false
    },
    {
      id: 3, title: "Phase 3 — The Big Leap",
      summary: "Monthly district workshops with sci-fi themed immersive learning, establishing ICT societies and continuous mentorship.",
      open: false
    }
  ],
  branches: [
    { x: 300,  label:"Overview", type:"about" },
    { x: 700,  label:"Phase 1 — Register", type:"phase1" },
    { x: 1150, label:"Phase 2 — Details", type:"phase2" },
    { x: 1600, label:"Phase 3 — Details", type:"phase3" },
    { x: 2000, label:"FAQ", type:"faq" },
    { x: 2400, label:"Contact", type:"contact" }
  ]
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width, H = canvas.height;

const state = {
  // player physics (px units in CSS pixels; velocities are px/s)
  player:{
    x:120, y:H-160, w:80, h:36,
    vx:0, ax:0,
    vy:0, ay:0,
    accel: 600,          // px/s^2
    friction: 380,       // px/s^2
    maxSpeed: 420,       // px/s
    trailParticles: []   // adaptive energy trail particles
  },/* ======= end content ======= */

  camera:{x:0, y:0},
  mode:'road', // 'road' | 'timeline'
  timeline:{
    active:false,
    length: 2000,
    milestones:[
  { y:160, key:'registration', title:'Registration', text:'Complete your Spark Flash registration.' },
  { y:560, key:'workshop1', title:'Game Dev', text:'Workshop 1 — Game Development: design, engines & rapid prototyping.' },
  { y:960, key:'workshop2', title:'CTF', text:'Workshop 2 — Capture The Flag: hacking challenges & cybersecurity basics.' },
  { y:1360, key:'workshop3', title:'Programming', text:'Workshop 3 — Programming: algorithms, team projects & mentoring.' },
  { y:1760, key:'competitions', title:'Competitions', text:'Pitch, demo & compete for recognition.' }
    ],
  crystals:[],
  particles:[],
  // enhancements
  orbs:[],            // collectible energy orbs
  ambient:[],         // ambient floating particles / motes
  hack:{ active:false, progress:0, target:'', timer:0, completed:false },
  confetti:[],        // celebration particles for competitions
  camY:0,             // inertial camera y (smoothed)
    visited:new Set(),
    roadReturnY:null
  },
  keys:{}, paused:false, near:null,
  world:{ length: 3000 },
  // Hidden data layer for spotlight reveal
  // Note: y values refer to canvas coordinates; keep near ground/background
  // H is dynamic; we'll compute default using a function at runtime if needed
  // but we seed with approximate positions; they'll be adjusted on resize
  // These will be used only in road mode
  // Screen-space y will be used directly; x is world-space
  // You can tweak these to place secrets where you like
  // If H changes, they still render okay since we don't lock to absolute bottom
  // Types: 'glyph' | 'dataStream' | 'circuit'
  // targetBranch is informational for future interactions
  hiddenData: [
    { x: 300,  y: H - 200, type: 'glyph',     text: '0x53' },
    { x: 650,  y: H - 120, type: 'dataStream', width: 200 },
    { x: 1150, y: H - 180, type: 'circuit',   targetBranch: 'phase2' },
    { x: 1550, y: H - 125, type: 'dataStream', width: 300 },
    { x: 2000, y: H - 190, type: 'glyph',     text: 'init()' }
  ],
  // XP/level system removed
  submissions: [],
  phase1Complete: false,
  lastBranchLabel: '',
  // timing
  lastT: performance.now(), dt: 0,
  // environment
  dayNight: { isNight:false, hour:12 },
  theme: 'neon', // 'neon' | 'sunset'
  settings: { forceDark: true },
  // obstacles and interactions
  obstacles: { potholes: [], speedBumps: [] },
  // phase gate
  gate: { x: 1800, triggered:false },
  // fireworks particles
  fireworks: [],
  // skid marks
  skids: [],
  // ghost car
  ghost: {
    x: 140, vx: 140, alpha: 0.25, pauseT: 0,
    stops: [], // will be built from branches
    stopIndex: 0
  },
  // decorative world billboards (to be initialized after world length known)
  billboards: [],
  // removed fuel/boost systems
  // weather system
  weather: {
    type: 'clear', // 'clear' | 'raining'
    intensity: 0,  // Current intensity from 0 (clear) to 1 (heavy rain)
    transitionSpeed: 0.3, // Rate of intensity change per second
    rainParticles: [],
    nextChange: performance.now() + 15000, // Schedule first potential change in 15s
    puddles: [] // For extra visual flair
  },
  // robot spotlight system
  spotlight: {
    active: false,
    x: 0,
    y: 0,
    radius: 250,
    dustMotes: []
  },
  // photo mode
  photo: { pending:false }
};

/* ===== Branded Preloader Logic ===== */
(function initPreloader(){
  const loader = document.getElementById('loader');
  if(!loader){ return; }
  document.body.classList.add('pre-init');
  const bar = document.getElementById('load-bar');
  const msgEl = document.getElementById('load-msg');
  const hintEl = document.getElementById('loader-hint');
  const dynamicHints = [
    'Compiling shaders',
    'Streaming assets',
    'Charging lightning array',
    'Linking workshops',
    'Spawning timeline milestones',
    'Optimizing parallax layers'
  ];
  let hintIndex = 0; let fakeProgress = 0; let assetsReady = false; let lastUpdate = performance.now();
  const swapHint = ()=>{ hintEl.textContent = dynamicHints[hintIndex % dynamicHints.length]; hintIndex++; };
  swapHint(); const hintTimer = setInterval(swapHint, 2200);
  // Basic asset list (images from billboards + logo + content.json)
  const assetUrls = [
    'assets/Logo-SparkIt.png','assets/rc1.png','assets/rc2.png','assets/kghs1.png','assets/kghs2.png','assets/content.json'
  ];
  let loaded = 0;
  function mark(){ loaded++; }
  assetUrls.forEach(u=>{
    if(u.endsWith('.json')){
      fetch(u).then(r=>{ if(r.ok) r.json().catch(()=>{}); }).finally(()=>mark());
    } else {
      const i = new Image(); i.onload = mark; i.onerror = mark; i.src = u + '?v=' + Date.now();
    }
  });
  function step(){
    const now = performance.now(); const dt = (now - lastUpdate)/1000; lastUpdate = now;
    // target progress: weighted combination of real load and time easing
    const real = loaded / assetUrls.length;
    const target = real * 0.85 + 0.15; // never stall at 0
    // ease fakeProgress toward target
    fakeProgress += (target - fakeProgress) * Math.min(1, dt*2.8);
    // slight autonomous progression if network slow
    if(real < 0.5) fakeProgress += dt*0.04;
    if(bar) bar.style.width = (Math.min(1,fakeProgress)*100).toFixed(2)+'%';
    if(msgEl){
      if(fakeProgress < 0.25) msgEl.textContent = 'Initializing…';
      else if(fakeProgress < 0.55) msgEl.textContent = 'Loading world…';
      else if(fakeProgress < 0.8) msgEl.textContent = 'Booting Spark Flash core…';
      else msgEl.textContent = 'Finalizing';
    }
    if(!assetsReady && real >= 0.99){ assetsReady = true; }
    if(assetsReady && fakeProgress > 0.985){ complete(); return; }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  function complete(){
    clearInterval(hintTimer);
    if(msgEl) msgEl.textContent = 'Ready';
    // world reveal: shrink loader with circular mask & hand off robot
    loader.classList.add('world-zoom');
    setTimeout(()=>{
      loader.classList.add('fade-out');
      document.body.classList.remove('pre-init');
      document.body.classList.add('loader-transition');
    }, 150);
    setTimeout(()=>{
      loader.remove();
      document.body.classList.remove('loader-transition');
    }, 1600);
  }
})();

// Safe localStorage operations with error handling
function safeLocalStorageGet(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.warn('localStorage get failed:', key, e);
    return defaultValue;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('localStorage set failed:', key, e);
    return false;
  }
}

function safeLocalStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn('localStorage remove failed:', key, e);
    return false;
  }
}

// Clean up legacy badges left in localStorage after removing the achievement system
try{
  if(localStorage.getItem('badges') !== null){
    safeLocalStorageRemove('badges');
    console.info('Legacy badges entry removed from localStorage');
  }
}catch(e){ /* ignore storage errors */ }

// Lightning (SparkIT Flash energizer)
state.lightning = {
  next: performance.now() + 4500, // initial delay
  active:false,
  t:0,
  duration: 640, // slower, more visible bolt lifecycle (ms)
  afterglow:0,
  afterglowMax:0,
  strikeX:null,
  strikeY:null,
  points:[],
  arcs:[],
  focus:0,          // 0..1 focus vignette intensity
  sparks:[],        // small particle sparks around sign
  rings:[],         // expanding energy rings
  lastSpawn:0,      // ring spawn timer
  cameraShake:0     // shake amplitude in px
};
function scheduleLightningStrike(delay=6000){ state.lightning.next = performance.now() + delay; }
function buildLightningPath(x1,y1,x2,y2){
  const pts=[{x:x1,y:y1}];
  const segments = 14;
  for(let i=1;i<segments;i++){
    const t=i/segments; const ix = x1 + (x2-x1)*t + (Math.random()-0.5)*38*(1-t);
    const iy = y1 + (y2-y1)*t + (Math.random()-0.5)*22;
    pts.push({x:ix,y:iy});
  }
  pts.push({x:x2,y:y2});
  return pts;
}
function triggerLightning(){
  const L = state.lightning; if(!state.phase1Sign) return;
  L.active=true; L.t=0; L.afterglow=0; L.afterglowMax=0; L.focus=1;
  // randomize the origin so bolts can come from random sky/cloud positions
  const signX = state.phase1Sign.x;
  const signY = state.phase1Sign.y;
  // source tends to be above and somewhat lateral — sometimes far, sometimes near
  const srcOffsetX = (Math.random()*1.6 - 0.8) * W; // ± ~80% of screen
  const srcX = state.camera.x + (W/2) + srcOffsetX;
  const srcY = -180 - Math.random()*160; // above the top
  L.strikeX = signX; L.strikeY = signY;
  L.points = buildLightningPath(srcX, srcY, L.strikeX, L.strikeY - 40);
  L.arcs = Array.from({length:7},()=>({life: 220+Math.random()*220, x:L.strikeX+(Math.random()*140-70), y:L.strikeY-80+Math.random()*90}));
  L.sparks = []; L.rings = []; L.lastSpawn = performance.now();
  L.leaks = [];
  L.cameraShake = 10; // initial intense shake
  // pre-seed sparks
  for(let i=0;i<40;i++){
    const a = Math.random()*Math.PI*2; const sp = 60+Math.random()*220;
    L.sparks.push({x:L.strikeX, y:L.strikeY-20, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 40, life: 300+Math.random()*260, fade: 0.6+Math.random()*0.4});
  }
  // spawn multiple electric leaks that will "crawl" out of the sign and fade
  const leaksCount = 8 + Math.floor(Math.random()*8);
  for(let i=0;i<leaksCount;i++){
    const ang = (Math.random()*Math.PI*2);
    const len = 80 + Math.random()*240;
    L.leaks.push({ang, lenTarget: len, len: 8 + Math.random()*18, v: 120 + Math.random()*240, life: 1200 + Math.random()*2600, alpha:1, nodes:6 + Math.floor(Math.random()*6)});
  }
  // XP system removed: reward disabled
}

// Weather System Functions
function updateWeather() {
  const w = state.weather;
  const dt = state.dt;

  // 1. Check if it's time to change the weather
  if (performance.now() > w.nextChange) {
    const oldType = w.type;
    w.type = (w.type === 'clear') ? 'raining' : 'clear';
    // Schedule the next change for 20-40 seconds from now
    w.nextChange = performance.now() + 20000 + Math.random() * 20000;
    
    // Add atmospheric toast notification
    if (w.type === 'raining') {
      toast('🌧️ Rain begins to fall...');
    } else {
      toast('☀️ Skies are clearing');
    }
  }

  // 2. Smoothly transition the intensity
  const targetIntensity = (w.type === 'raining') ? 1 : 0;
  if (w.intensity !== targetIntensity) {
    const change = w.transitionSpeed * dt;
    w.intensity = (targetIntensity > w.intensity)
      ? Math.min(targetIntensity, w.intensity + change)
      : Math.max(targetIntensity, w.intensity - change);
  }

  // 3. Update the rain particle system if it's raining
  if (w.intensity > 0) {
    updateRainParticles();
  } else {
    w.rainParticles = []; // Clear particles when not raining
  }
}

function updateRainParticles() {
  const w = state.weather;
  const dt = state.dt;

  // Update existing particles
  for (let i = w.rainParticles.length - 1; i >= 0; i--) {
    const p = w.rainParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y > H + 20) {
      w.rainParticles.splice(i, 1);
    }
  }

  // Spawn new particles based on intensity
  const spawnCount = Math.floor(250 * w.intensity * dt);
  for (let i = 0; i < spawnCount; i++) {
    w.rainParticles.push({
      x: Math.random() * W,
      y: -20,
      l: 10 + Math.random() * 15, // length of streak
      vx: -150, // Angled rain for a sense of speed/wind
      vy: 600 + Math.random() * 100,
      alpha: 0.2 + Math.random() * 0.4
    });
  }
}

// throttle state for analog touch input
state.throttle = { left:0, right:0 };

// initialize derived flags from existing data with safe localStorage
const storedSubmissions = safeLocalStorageGet('submissions', '[]');
const storedPhase1Complete = safeLocalStorageGet('phase1Complete');

try {
  state.submissions = JSON.parse(storedSubmissions);
} catch (e) {
  console.warn('Failed to parse stored submissions:', e);
  state.submissions = [];
}

state.phase1Complete = storedPhase1Complete === '1';

if(state.submissions.length && !state.phase1Complete){
  state.phase1Complete = true; 
  safeLocalStorageSet('phase1Complete','1');
}

// Canvas state optimization - minimize save/restore calls
const canvasStateManager = {
  stateStack: 0,
  maxStack: 10, // Warn if we exceed reasonable nesting
  
  save() {
    if (this.stateStack < this.maxStack) {
      ctx.save();
      this.stateStack++;
    } else {
      console.warn('Canvas state stack too deep, skipping save()');
    }
  },
  
  restore() {
    if (this.stateStack > 0) {
      ctx.restore();
      this.stateStack--;
    } else {
      console.warn('Attempting to restore canvas state without save()');
    }
  },
  
  reset() {
    while (this.stateStack > 0) {
      ctx.restore();
      this.stateStack--;
    }
  }
};

// Cache frequently accessed DOM elements
const domCache = {
  cursorBot: null,
  toastsContainer: null,
  
  getCursorBot() {
    if (!this.cursorBot || !document.contains(this.cursorBot)) {
      this.cursorBot = document.getElementById('cursor-bot');
    }
    return this.cursorBot;
  },
  
  getToastsContainer() {
    if (!this.toastsContainer || !document.contains(this.toastsContainer)) {
      this.toastsContainer = document.getElementById('toasts');
    }
    return this.toastsContainer;
  }
};

// Safe HTML setter - basic sanitization for innerHTML usage
function safeSetHTML(element, html) {
  // Since all HTML is internally generated, we mainly protect against potential script injection
  // This is a basic sanitization - for production consider using DOMPurify
  const sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  element.innerHTML = sanitized;
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;const toastsEl = domCache.getToastsContainer(); if(toastsEl) toastsEl.appendChild(t);setTimeout(()=>t.remove(),3000)}
// Extended toast to ping robot cursor to wave / deliver
const _origToast = toast; // preserve original for fallback (already assigned above)
toast = function(msg){
  _origToast(msg);
  try{
    const bot = domCache.getCursorBot();
    if(bot){
      bot.classList.add('wave');
      // brief delivery expression unless already in thrilled
      if(bot.getAttribute('data-mode')!=='thrilled'){
        bot.setAttribute('data-mode','impact');
        setTimeout(()=>{
          // only clear if still impact
          if(bot.getAttribute('data-mode')==='impact') bot.removeAttribute('data-mode');
        },1200);
      }
      setTimeout(()=> bot.classList.remove('wave'), 900);
    }
  }catch{}
};
function addXP(amount=50){
  // XP/leveling system removed - function kept for compatibility but does nothing
}
function updateHUD(){
  // XP/leveling removed — only update Phase 1 status badge if present.
  const sEl = document.getElementById('phase1-status'); if(sEl){ const s = state.phase1Complete ? 'Completed' : (GAME_DATA.phases[0].open ? 'Open' : 'Closed'); sEl.textContent = s; }
}
updateHUD();

// Seed volumetric dust for spotlight (one-time)
for (let i = 0; i < 150; i++) {
  state.spotlight.dustMotes.push({
    x: Math.random() * W,
    y: Math.random() * H,
    z: Math.random(),
    size: 1 + Math.random() * 1.5
  });
}

/* ======= Input ======= */
addEventListener('keydown', e=>{
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','KeyE','Enter','Escape','KeyP','KeyH','KeyF','KeyT'].includes(e.code)) e.preventDefault();
  state.keys[e.code]=true;
  if(state.mode==='road'){
    if(state.near && /phase 1/i.test(state.near.label||'')){
      // Allow either Down/S or E/Enter to enter timeline (no popup anymore)
      if(e.code==='ArrowDown' || e.code==='KeyS' || e.code==='KeyE' || e.code==='Enter'){
        enterTimeline();
        return; // prevent branch popup
      }
    }
  } else if(state.mode==='timeline'){
    if((e.code==='ArrowUp'||e.code==='KeyW') && state.player.y <= 140){ exitTimeline(); }
  }
  if(e.code==='KeyE' && state.near){ openBranch(state.near) }
  if(e.code==='Enter' && state.near){ openBranch(state.near) }
  if(e.code==='Escape'){ closePanel() }
  if(e.code==='KeyP'){ togglePause() }
  if(e.code==='KeyH'){ showHelp() }
  // KeyF toggles spotlight (hold-to-scan); photo mode moved to Shift+F
  if(e.code==='KeyF'){ state.spotlight.active = true; }
  if(e.code==='ShiftLeft' && state.keys['KeyF']){ triggerPhoto(); }
  if(e.code==='KeyT'){ toggleTheme() }
});
addEventListener('keyup', e=>{
  state.keys[e.code]=false;
  if(e.code==='KeyF'){ state.spotlight.active = false; }
});

// Spotlight pointer controls
addEventListener('pointermove', e => {
  state.spotlight.x = e.clientX;
  state.spotlight.y = e.clientY;
});
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => { if (e.button === 2) state.spotlight.active = true; });
addEventListener('mouseup',   e => { if (e.button === 2) state.spotlight.active = false; });

/* Touch */
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const interactBtn = document.getElementById('interactBtn');
let leftHeld=false, rightHeld=false;
['pointerdown','pointerup','pointerleave','pointercancel'].forEach(ev=>{
  leftBtn.addEventListener(ev, e=>{ leftHeld = ev==='pointerdown'; });
  rightBtn.addEventListener(ev, e=>{ rightHeld = ev==='pointerdown'; });
  interactBtn.addEventListener(ev, e=>{ if(ev==='pointerdown' && state.near) openBranch(state.near) });
});
// analog throttle ramp for touch
let lastAnalogT = performance.now();
function updateAnalogThrottle(){
  const now = performance.now(); const dt = Math.min(0.05, (now - lastAnalogT)/1000); lastAnalogT = now;
  const rateUp = 2.5, rateDown = 4.0; // per second
  // ramp towards target
  const targetR = rightHeld?1:0, targetL = leftHeld?1:0;
  state.throttle.right += Math.sign(targetR - state.throttle.right) * (targetR>state.throttle.right?rateUp:rateDown) * dt;
  state.throttle.left  += Math.sign(targetL - state.throttle.left) * (targetL>state.throttle.left?rateUp:rateDown) * dt;
  state.throttle.right = clamp(state.throttle.right,0,1);
  state.throttle.left  = clamp(state.throttle.left,0,1);
  requestAnimationFrame(updateAnalogThrottle);
}
updateAnalogThrottle();

/* ======= Panels ======= */
const overlay = document.getElementById('overlay');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
document.getElementById('closePanel').onclick = closePanel;
// Removed Export/Import/Privacy/Share Stamp buttons per request

function showOverlay(title, html){
  panelTitle.textContent = title;
  safeSetHTML(panelContent, html);
  overlay.style.display='grid';
  overlay.querySelector('.panel').focus();
  state.paused = true;
}
function closePanel(){ overlay.style.display='none'; state.paused=false }
function togglePause(){ state.paused=!state.paused; toast(state.paused?'Paused ⏸':'Resumed ▶') }
function showHelp(){
  showOverlay('Controls',
    `<div class="grid">
      <div class="card">
  <p><b>Keyboard:</b> ←/A and →/D to move. <b>E</b> to interact at a branch. <b>Shift/X</b> to boost. <b>F</b> Photo Mode. <b>Esc</b> to close. <b>P</b> to pause.</p>
        <p><b>Mobile:</b> Use the on-screen buttons.</p>
      </div>
          <div class="card">
            <p>Discover branches and complete Phase 1 registration. Your progress saves in this browser.</p>
          </div>
    </div>`
  );
}

/* ======= Branch Content ======= */
function branchHTML(type){
  if(type==='about'){
    return `
      <div class="grid overview">
        <div class="card hero">
          <h3>${GAME_DATA.project.name}</h3>
          <p>${GAME_DATA.project.tagline}</p>
          <div class="meta">
            <span class="chip">📍 ${GAME_DATA.project.location}</span>
            <span class="chip">🗓 ${GAME_DATA.project.date}</span>
          </div>
        </div>
        <div class="card problem">
          <h4>🚨 The Problem</h4>
          <p>Sri Lankan students face a growing gap between what schools teach and what the tech industry demands. With AI and global competition rising fast, students risk leaving school unprepared for the digital future.</p>
        </div>
        <div class="card solution">
          <h4>💡 The SparkIT Solution</h4>
          <p>${GAME_DATA.project.about}</p>
        </div>
        <div class="card phase">
          <h4>⚡ Phase 1 & 2 — Bridging the Gap</h4>
          <p>For schools already exposed to ICT, SparkIT strengthens their foundation. Students dive into advanced topics like programming, robotics, and cybersecurity to match real industry needs.</p>
        </div>
        <div class="card phase">
          <h4>🚀 Phase 3 — The Big Leap</h4>
          <p>Each month, SparkIT goes out to a new district, bringing an immersive one-day sci-fi themed workshop that transforms learning into an adventure. This is followed by:</p>
          <ul style="margin-top: 10px;">
            <li>• Establishing ICT societies in schools</li>
            <li>• Equipping them with resources</li>
            <li>• Continuous mentorship and follow-ups to ensure long-term growth</li>
          </ul>
        </div>
        <div class="card impact">
          <h4>🌍 The Impact</h4>
          <p>SparkIT isn't just another school project — it's a national movement. By empowering schools across districts, we aim to raise ICT literacy for an entire generation of Sri Lankans. This might be the most impactful initiative ever carried out by a student-led organization in Sri Lanka.</p>
        </div>
      </div>`;
  }
  if(type==='phase1'){
    const p = GAME_DATA.phases[0];
    const form = p.formFields.map(f=>{
      const base = `<label for="${f.name}">${f.label}${f.required?' *':''}</label>`;
      if(f.type==='textarea') return base + `<textarea id="${f.name}" name="${f.name}" ${f.required?'required':''}></textarea>`;
      return base + `<input id="${f.name}" name="${f.name}" type="${f.type}" ${f.required?'required':''}/>`;
    }).join('');
    return `
      <div class="card">
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
  <form id="phase1-form">
          ${form}
          <button class="btn" type="submit">Register for Phase 1</button>
          <div class="help">Demo only – your submission is stored locally in this browser. Use “Export Demo Data” to download a JSON file.</div>
          <div id="formMsg" class="help"></div>
        </form>
      </div>
      ${renderSubmissions()}`;
  }
  if(type==='phase2'){
    return `<div class="card"><h3>Phase 2 — Development</h3><p>Prototype with mentors. Unlocks after Phase 1.</p></div>`;
  }
  if(type==='phase3'){
    return `<div class="card"><h3>Phase 3 — Showcase</h3><p>Final presentations, awards, and press.</p></div>`;
  }
  if(type==='faq'){
    return `
      <div class="grid">
        <div class="card"><h4>Who can apply?</h4><p>Students and early-stage builders.</p></div>
        <div class="card"><h4>Is Phase 1 free?</h4><p>Yes.</p></div>
        <div class="card"><h4>Team size?</h4><p>Solo or up to 4.</p></div>
        <div class="card"><h4>Selection?</h4><p>Based on idea clarity and motivation.</p></div>
      </div>`;
  }
  if(type==='contact'){
    return `
      <div class="grid cols-2">
        <div class="card"><h4>Contact</h4><p>Email: hello@axis25.example</p><p>Phone: +94 7X XXX XXXX</p></div>
        <div class="card"><h4>Social</h4><p>IG: @axis25 • X: @axis25sl</p></div>
      </div>`;
  }
  return `<div class="card"><p>Coming soon.</p></div>`;
}

function renderSubmissions(){
  if(!state.submissions.length) return `<div class="card"><h4>No submissions yet</h4><p>Be the first to register.</p></div>`;
  const rows = state.submissions.map((s,i)=>`<tr><td>${i+1}</td><td>${s.fullName||''}</td><td>${s.email||''}</td><td>${s.phone||''}</td></tr>`).join('');
  return `
    <div class="card">
      <h4>Submissions (local demo)</h4>
      <div class="help">Stored in localStorage only.</div>
      <div style="overflow:auto">
        <table style="width:100%; border-collapse:collapse; font-size:14px">
          <thead><tr><th style="text-align:left; padding:6px; border-bottom:1px solid rgba(255,255,255,.15)">#</th>
          <th style="text-align:left; padding:6px; border-bottom:1px solid rgba(255,255,255,.15)">Name</th>
          <th style="text-align:left; padding:6px; border-bottom:1px solid rgba(255,255,255,.15)">Email</th>
          <th style="text-align:left; padding:6px; border-bottom:1px solid rgba(255,255,255,.15)">Phone</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function bindForm(){
  const f = document.getElementById('phase1-form');
  if(!f) return;
  // restore partial data
  try{
    const saved = JSON.parse(safeLocalStorageGet('phase1Draft', '{}'));
    Object.entries(saved).forEach(([k,v])=>{ const el=f.querySelector(`[name="${k}"]`); if(el) el.value=v; });
  }catch(e){ console.warn('Failed to restore draft:', e); }
  // auto-save while typing
  f.querySelectorAll('input,textarea').forEach(el=>{
    el.addEventListener('input', ()=>{
      const draft = Object.fromEntries(new FormData(f).entries());
      safeLocalStorageSet('phase1Draft', JSON.stringify(draft));
    });
  });
  f.addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    // basic validation
    if(!data.fullName || !data.email){ msg('Please fill required fields.', true); return; }
    state.submissions.push(data);
    if (!safeLocalStorageSet('submissions', JSON.stringify(state.submissions))) {
      msg('⚠️ Registration saved locally but storage may be full', false);
    }
    msg('✅ Registered! Thank you for registering.', false);
    // XP disabled: no XP awarded on registration
    state.phase1Complete = true; 
    safeLocalStorageSet('phase1Complete','1');
    safeLocalStorageRemove('phase1Draft');
    try{ if(navigator.vibrate) navigator.vibrate([20,30,20]); }catch{}
    // rerender submissions
    document.getElementById('panel-content').insertAdjacentHTML('beforeend','');
    // refresh panel content
    showOverlay('Phase 1 — Register', branchHTML('phase1'));
    bindForm();
  });
  function msg(text, err){ const el=document.getElementById('formMsg'); el.textContent=text; el.className='help ' + (err?'error':'success'); }
}

/* ======= Export demo data ======= */

function escapeXml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&apos;"}[c]))}

/* ======= Open branch ======= */
function openBranch(branch){
  // Handle synthetic timeline milestone branches
  if(branch && typeof branch.type==='string' && branch.type.startsWith('timeline:')){
    const m = branch._timeline;
    if(m){ state.timeline.visited.add(m.key); showOverlay(m.title, `<div class="card"><h3>${m.title}</h3><p>${m.text}</p><p class="help">Timeline milestone (demo)</p></div>`); return; }
  }
  // Intercept Phase 1 branch to enter underground timeline instead of popup
  if(branch && branch.type==='phase1'){
    enterTimeline();
    return;
  }
  const html = branchHTML(branch.type);
  showOverlay(branch.label, html);
  bindForm();
  // XP disabled: branch-visit reward removed
  state.lastBranchLabel = branch.label;
  // Removed share stamp button usage
  // Initialize liquid interaction & panel car only for overview
  if(branch.type==='about'){
    setTimeout(()=>{ try{ enhanceOverviewLiquidEffects(); }catch(e){ console.warn(e);} },0);
  }
}

/* ======= Fallback removed ======= */

/* ======= Game world drawing ======= */
/* ======= Billboards ======= */
class Billboard {
  constructor(imgSrc, x){
    this.img = new Image();
    this.img.src = imgSrc;
    this.x = x; // world coordinate (center)
    this.maxW = 260; this.maxH = 140; // bounding box for logo
    this.w = 200; this.h = 110; // fallback until image loads
    this.framePad = 12;
    this.wobble = 0; this.wobbleSpeed = 500 + Math.random()*500; // ms period variety
    this.parallax = 1; // use full world movement horizontally so all become reachable
    this.loaded = false;
    this.img.onload = ()=>{
      const iw = this.img.naturalWidth || 1;
      const ih = this.img.naturalHeight || 1;
      const scale = Math.min(this.maxW/iw, this.maxH/ih, 1);
      this.w = Math.round(iw*scale);
      this.h = Math.round(ih*scale);
      this.loaded = true;
    };
    this.img.onerror = ()=>{
      console.warn('Billboard image failed to load:', imgSrc);
      this.loaded = false; // keep placeholder
    };
  }
  update(){ this.wobble = Math.sin(performance.now()/this.wobbleSpeed)*1.5; }
  draw(ctx, cameraX, groundY){
    // Horizontal position: full world space so last billboard can appear before track ends.
    const screenX = this.x - cameraX; // no horizontal parallax (previous parallax prevented final visibility)
    if(screenX < -350 || screenX > W+350) return; // cull
    // Ground line behind buildings (passed from background renderer)
    const gY = groundY || (H - 240);
    // Desired clearance from ground to bottom of sign frame
    const clearance = 118 + this.wobble; // wobble subtly affects vertical feel
    const frameH = this.h + this.framePad*2;
    const frameW = this.w + this.framePad*2;
    const frameY = gY - clearance - frameH; // mount sign so pole reaches ground
    const frameX = screenX - this.w/2 - this.framePad;
    ctx.save();
    // optional glow at night
    if(state.dayNight.isNight){
      const glowGrad = ctx.createRadialGradient(screenX, frameY+frameH/2, 10, screenX, frameY+frameH/2, frameW);
      glowGrad.addColorStop(0,'rgba(124,248,200,0.15)');
      glowGrad.addColorStop(1,'rgba(124,248,200,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(frameX-20, frameY-20, frameW+40, frameH+60);
    }
    // shadow below (floating board - no poles)
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(screenX, frameY + frameH + 8, this.w*0.48, 10, 0, 0, Math.PI*2); ctx.fill();
    // frame
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 2;
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.strokeRect(frameX, frameY, frameW, frameH);
    // inner subtle gradient overlay for depth
    const innerGrad = ctx.createLinearGradient(frameX, frameY, frameX, frameY+frameH);
    innerGrad.addColorStop(0,'rgba(255,255,255,.04)');
    innerGrad.addColorStop(1,'rgba(0,0,0,.12)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(frameX+1, frameY+1, frameW-2, frameH-2);
    // logo
    if(this.loaded){
      ctx.drawImage(this.img, screenX - this.w/2, frameY + this.framePad, this.w, this.h);
      // desaturate look: a dark translucent film
      ctx.fillStyle = 'rgba(16,24,40,0.18)';
      ctx.fillRect(screenX - this.w/2, frameY + this.framePad, this.w, this.h);
    }else{
      ctx.fillStyle='rgba(255,255,255,.06)';
      ctx.fillRect(screenX - this.w/2, frameY + this.framePad, this.w, this.h);
      ctx.fillStyle='rgba(255,255,255,.25)';
      ctx.font='10px ui-sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('Loading', screenX, frameY + this.framePad + this.h/2);
    }
    ctx.restore();
  }
}

function initBillboards() {
  let container = document.getElementById("logo-container");
  if (container) container.remove();

  container = document.createElement("div");
  container.id = "logo-container";
  container.style.position = "fixed";
  container.style.top = "10px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.gap = "5px";
  container.style.zIndex = "5";

  const logoRow = document.createElement("div");
  logoRow.style.display = "flex";
  logoRow.style.alignItems = "center";
  logoRow.style.gap = "20px";
  logoRow.style.height = "100px";

  const imgs = [
    { src: 'assets/rc1.png', width: 45, height: 65 },
    { src: 'assets/kghs1.png', width: 52, height: 52 },
    { src: 'assets/rc2.png', width: 65, height: 33 },
    { src: 'assets/kghs2.png', width: 100, height: 100 }
  ];

  imgs.forEach(({src, width, height}) => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = width + "px";
    img.style.height = height + "px";
    logoRow.appendChild(img);
  });

  container.appendChild(logoRow);
  const extraImg = document.createElement("img");
  extraImg.src = "assets/Logo-SparkIt.png";
  extraImg.style.width = "150px";
  container.appendChild(extraImg);
  const tagline = document.createElement("div");
  tagline.innerText = "TRAIN. CONNECT. TRANSFORM.\nSPARK THE SIMULATION.";
  tagline.style.fontSize = "12px";
  tagline.style.fontWeight = "100";
  tagline.style.textAlign = "center";
  tagline.style.whiteSpace = "pre-line";
  tagline.style.marginTop = "8px";
  tagline.style.fontFamily = "Arial, Helvetica, sans-serif";
  tagline.style.letterSpacing = "1px";
  tagline.style.background = "linear-gradient(90deg, #03fb93, #ebb900)";
  tagline.style.webkitBackgroundClip = "text";
  tagline.style.color = "transparent";
  container.appendChild(tagline);
  container.appendChild(tagline);
  document.body.appendChild(container);
}

initBillboards();


function computeDayNight(){
  try{
    const hourStr = new Intl.DateTimeFormat('en-US',{hour:'2-digit', hour12:false, timeZone:'Asia/Colombo'}).format(new Date());
    const hour = Number(hourStr);
    state.dayNight.hour = isNaN(hour)?12:hour;
  }catch{ state.dayNight.hour = new Date().getHours(); }
  
  // Force dark mode for SparkIT theme consistency
  state.dayNight.isNight = true;
}

function drawBackground(){
  computeDayNight();
  const isNight = state.dayNight.isNight;
  const reduced = PREFERS_REDUCED_MOTION;
  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  if(state.theme==='sunset'){
    g.addColorStop(0, isNight? '#1a0f2b':'#ff9966');
    g.addColorStop(1, isNight? '#0a0f1e':'#ff5e62');
  }else{
    if(isNight){ g.addColorStop(0,'#07122b'); g.addColorStop(1,'#0a0f1e'); }
    else{ g.addColorStop(0,'#4aa3ff'); g.addColorStop(1,'#9fd0ff'); }
  }
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // parallax layers
  const cx = state.camera.x;
  // establish building baseline first so billboards can anchor behind it
  const yBase1 = H-240; const speed1 = reduced?0.05:0.2; // slowest layer movement
  // billboards (draw FIRST so buildings will partially occlude their poles, making them appear behind)
  state.billboards.forEach(b=>{ b.update(); b.draw(ctx, cx, yBase1); });
  // distant skyline (draw after billboards to sit visually in front of them)
  ctx.fillStyle = isNight ? 'rgba(138,164,255,.18)' : 'rgba(30,64,120,.25)';
  for(let x=-200; x<W+200; x+=220){
    const px = x - (cx*speed1 % 220);
    // building base & simple shape
    ctx.fillRect(px, yBase1, 140, 10);
    ctx.fillRect(px+20, yBase1-24, 60, 24);
    ctx.fillRect(px+90, yBase1-40, 40, 40);
  }
  // mid trees/banners
  const yBase2 = H-180; const speed2 = reduced?0.18:0.45;
  for(let x=-100; x<W+100; x+=160){
    const px = x - (cx*speed2 % 160);
    // banner
    ctx.fillStyle = isNight?'rgba(124,248,200,.35)':'rgba(255,255,255,.35)';
    ctx.fillRect(px, yBase2, 100, 8);
    // posts
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(px, yBase2-26, 4, 26);
    ctx.fillRect(px+100-4, yBase2-18, 4, 18);
  }
  // near crowd silhouettes
  const yBase3 = H-140; const speed3 = reduced?0.25:0.75;
  ctx.fillStyle = isNight? 'rgba(10,20,40,.9)':'rgba(20,30,50,.9)';
  for(let x=-120; x<W+120; x+=48){
    const px = x - (cx*speed3 % 48);
    ctx.beginPath(); ctx.arc(px, yBase3, 18, 0, Math.PI*2); ctx.fill();
  }
  // sponsor boards
  const sbY = H-200; ctx.fillStyle = 'rgba(255,255,255,.08)';
  for(let x=-300; x<W+300; x+=300){
    const px = x - (cx*(reduced?0.2:0.4) % 300);
    ctx.fillRect(px-60, sbY-50, 120, 50);
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.strokeRect(px-60, sbY-50, 120, 50);
    ctx.fillStyle = '#a8b3cf'; ctx.font='12px ui-sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Sponsor', px, sbY-25);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
  }
}

// Robot Spotlight — Volumetric beam and dust
function drawSpotlight(){
  const s = state.spotlight;
  const bot = document.getElementById('cursor-bot');
  if (!s.active) { if(bot) bot.classList.remove('scanning'); return; }
  if(bot) bot.classList.add('scanning');

  ctx.save();
  // Volumetric beam gradient (screen-space)
  const beamGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
  beamGrad.addColorStop(0, 'rgba(124, 248, 200, 0.25)');
  beamGrad.addColorStop(0.3, 'rgba(124, 248, 200, 0.10)');
  beamGrad.addColorStop(1, 'rgba(124, 248, 200, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2); ctx.fill();

  // Atmospheric dust motes inside the beam
  const camX = state.camera.x;
  s.dustMotes.forEach(m => {
    const dx = (m.x - camX * m.z * 0.1) - s.x;
    const dy = m.y - s.y;
    const dist = Math.hypot(dx, dy);
    if(dist < s.radius){
      const a = (1 - dist / s.radius);
      ctx.fillStyle = `rgba(200,255,230,${(a*0.7).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(m.x - camX * m.z * 0.1, m.y, m.size * (0.6 + 0.4*m.z), 0, Math.PI*2); ctx.fill();
    }
  });
  ctx.restore();
}

// Hidden data layer reveal within spotlight
function drawRevealedData(){
  const s = state.spotlight; if(!s.active || state.mode!=='road') return;
  const camX = state.camera.x;
  const spotWorldX = s.x + camX;

  (state.world.hiddenData||[]).forEach(d => {
    const dx = d.x - spotWorldX;
    const dy = d.y - s.y;
    const dist = Math.hypot(dx, dy);
    if(dist >= s.radius) return;
    const alpha = Math.pow(1 - dist / s.radius, 2);
    if(alpha <= 0.01) return;
    const sx = d.x - camX; const sy = d.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#7cf8c8';
    ctx.strokeStyle = '#7cf8c8';
    ctx.shadowColor = '#7cf8c8';
    ctx.shadowBlur = 15;

    if(d.type==='glyph'){
      ctx.font = '600 20px "Courier New", ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.text || '', sx, sy);
    } else if(d.type==='dataStream'){
      ctx.beginPath();
      for(let i=0;i<=d.width;i+=5){
        const wave = Math.sin((i + performance.now()/5) * 0.1) * 5;
        const x = sx + i; const y = sy + wave;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.lineWidth = 2; ctx.stroke();
    } else if(d.type==='circuit'){
      // Simple circuit glyph: grid of nodes with linking lines
      const w = 120, h = 60, cols=6, rows=3;
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          const px = sx - w/2 + (c/(cols-1))*w;
          const py = sy - h/2 + (r/(rows-1))*h;
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2); ctx.fill();
          if(c<cols-1){ ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px + w/(cols-1), py); ctx.stroke(); }
          if(r<rows-1){ ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px, py + h/(rows-1)); ctx.stroke(); }
        }
      }
    }
    ctx.restore();
  });
}

function drawRain() {
  const w = state.weather;
  if (w.intensity <= 0) return;

  ctx.save();
  
  // Draw different layers of rain for depth
  w.rainParticles.forEach(p => {
    ctx.globalAlpha = p.alpha * w.intensity;
    
    // Main rain streak
    ctx.strokeStyle = `rgba(170, 200, 255, ${ctx.globalAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // Use vx and vy to determine the angle of the streak
    ctx.lineTo(p.x + (p.vx / 40), p.y + (p.l));
    ctx.stroke();
    
    // Add a subtle highlight for more realistic look
    ctx.strokeStyle = `rgba(255, 255, 255, ${ctx.globalAlpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (p.vx / 45), p.y + (p.l * 0.7));
    ctx.stroke();
  });

  // Add some atmospheric mist effect during heavy rain
  if (w.intensity > 0.7) {
    ctx.globalAlpha = (w.intensity - 0.7) * 0.3;
    ctx.fillStyle = 'rgba(200, 220, 240, 1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawReflections() {
  const intensity = state.weather.intensity;
  if (intensity <= 0) return;

  const roadSurfaceY = H - 120; // Must match your drawRoad() value
  
  // Apply the same camera shake as the main scene for consistency
  const L = state.lightning;
  let shakeX=0, shakeY=0;
  if(L.cameraShake>0){
    shakeX = (Math.random()*2-1)*L.cameraShake;
    shakeY = (Math.random()*2-1)*L.cameraShake*0.6;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);
  
  // We flip the entire canvas vertically, pivoting on the road surface
  ctx.translate(0, roadSurfaceY);
  ctx.scale(1, -1);
  ctx.translate(0, -roadSurfaceY);

  // Set a clipping region so reflections don't draw over the sky
  ctx.beginPath();
  ctx.rect(0, roadSurfaceY, W, H);
  ctx.clip();

  // Now, redraw the elements you want to be reflected with reduced opacity
  // IMPORTANT: The drawing order is reversed. Car first, then trail, then background.
  ctx.globalAlpha = intensity * 0.5;
  drawCar();

  ctx.globalAlpha = intensity * 0.6;
  drawPlayerTrail();

  // Reflect the billboards and skyline with less clarity
  ctx.globalAlpha = intensity * 0.3;
  drawBackground(); // This will reflect glowing buildings etc.

  // Reflect the Hologram UI if it's active
  /*if (state.projection && state.projection.active) {
    ctx.globalAlpha = intensity * 0.4;
    drawHologramUI();
  }*/
  
  ctx.restore(); // This removes the flip, scale, and clipping mask

  // Finally, draw a "wet sheen" layer over the road to sell the effect
  ctx.save();
  ctx.translate(shakeX, shakeY); // Apply shake to sheen layer too
  
  // Base wet surface
  ctx.fillStyle = `rgba(10, 15, 25, ${0.4 * intensity})`;
  ctx.fillRect(-state.camera.x, roadSurfaceY, state.world.length + W, 80);
  
  // Add subtle shimmer effect
  if (intensity > 0.3) {
    const shimmerTime = performance.now() * 0.001;
    ctx.globalAlpha = intensity * 0.15;
    for (let i = 0; i < 8; i++) {
      const x = (-state.camera.x) + (i * W / 8) + Math.sin(shimmerTime + i) * 30;
      const gradient = ctx.createLinearGradient(x, roadSurfaceY, x + 40, roadSurfaceY + 80);
      gradient.addColorStop(0, 'rgba(170, 200, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(170, 200, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(170, 200, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, roadSurfaceY, 40, 80);
    }
  }
  
  ctx.restore();
}

function drawRoad(){
  // lightning effects and road rendering (background now drawn separately)
  const L = state.lightning;
  // camera shake while focused
  let shakeX=0, shakeY=0;
  if(L.cameraShake>0){
    shakeX = (Math.random()*2-1)*L.cameraShake;
    shakeY = (Math.random()*2-1)*L.cameraShake*0.6;
    L.cameraShake = Math.max(0, L.cameraShake - state.dt*22);
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  // horizon glow
  ctx.fillStyle = 'rgba(124,248,200,.08)';
  ctx.fillRect(-state.camera.x, H-260, state.world.length+W, 2);

  // road
  const roadY = H-120; const roadH = 80;
  const rg = ctx.createLinearGradient(0,roadY,0,roadY+roadH);
  rg.addColorStop(0,'#1a233b'); rg.addColorStop(1,'#0d1427');
  ctx.fillStyle = rg;
  ctx.fillRect(-state.camera.x, roadY, state.world.length+W, roadH);

  // center dashes
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.setLineDash([24,24]);
  ctx.beginPath(); ctx.moveTo(-state.camera.x, roadY+roadH/2); ctx.lineTo(-state.camera.x+state.world.length+W, roadY+roadH/2); ctx.stroke();
  ctx.setLineDash([]);

  // sponsor speed lane segments
  const lanes = state.sponsorLanes || (state.sponsorLanes = [
    {from:400, to:650, brand:'Brand A'}, {from:1200, to:1400, brand:'Brand B'}
  ]);
  lanes.forEach(l=>{
    const sx = l.from - state.camera.x; const ex = l.to - state.camera.x;
    if(ex<-20 || sx>W+20) return;
    ctx.fillStyle = 'rgba(124,248,200,.12)';
    ctx.fillRect(Math.max(sx,-state.camera.x), roadY+roadH-18, Math.min(ex,W+state.camera.x)-Math.max(sx,-state.camera.x), 12);
  });

  // branches (signs)
  GAME_DATA.branches.forEach(b=>{
    const bx = b.x - state.camera.x;
    if(bx<-100 || bx>W+100) return;

    // branch stem
    ctx.strokeStyle = 'rgba(138,164,255,.6)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(bx, roadY); ctx.lineTo(bx, roadY-130); ctx.stroke();

    // sign
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.strokeStyle = 'rgba(255,255,255,.2)';
    ctx.lineWidth=2;
    const sw=180, sh=48;
    ctx.fillRect(bx - sw/2, roadY-130 - sh, sw, sh);
    ctx.strokeRect(bx - sw/2, roadY-130 - sh, sw, sh);

  // sign label with backdrop (rename Phase 1 register)
  let label = b.label;
  if(/phase 1/i.test(label) || b.type==='phase1') label = 'SparkIT Flash';
  ctx.font='600 14px ui-sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  // backdrop halo for contrast
  ctx.fillStyle='rgba(11,16,32,.5)'; ctx.fillRect(bx - sw/2 + 6, roadY-130 - sh + 6, sw-12, sh-12);
  // record phase1 sign world position for lightning (center of sign face)
  if(b.type==='phase1' || /sparkit flash/i.test(label)){
    state.phase1Sign = { x: b.x, y: roadY-130 - sh/2 };
  }
  // energetic animation overlay if lightning active / afterglow
  let glowPulse = 0; const isFlash = state.phase1Sign && Math.abs(b.x - state.phase1Sign.x)<2;
  if(isFlash && (L.active || L.afterglow>0)){
    const tNow = performance.now();
    glowPulse = (Math.sin(tNow/90)+1)/2;
    const baseEnergy = L.active?1: (L.afterglow/3600);
    const energy = baseEnergy * (0.6 + 0.4*glowPulse);
    // expanding rings (added to lightning rings pool, drawn later)
    if(L.active && tNow - L.lastSpawn > 110){
      L.lastSpawn = tNow;
      L.rings.push({r:16, v: 180 + Math.random()*120, alpha:0.55});
      // occasional extra spark cluster
      if(Math.random()<0.35){
        for(let i=0;i<8;i++){
          const a = Math.random()*Math.PI*2; const sp = 80+Math.random()*160;
          L.sparks.push({x:L.strikeX, y:L.strikeY-20, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 30, life: 200+Math.random()*260, fade: 0.4+Math.random()*0.4});
        }
      }
    }
    ctx.save();
    ctx.translate(bx, roadY-130 - sh/2);
    // sign electrified fill flicker
    const grad = ctx.createLinearGradient(-sw/2, -sh/2, sw/2, sh/2);
    grad.addColorStop(0,'rgba(124,248,200,'+(0.85*energy).toFixed(3)+')');
    grad.addColorStop(0.5,'rgba(255,255,255,'+(0.35*energy).toFixed(3)+')');
    grad.addColorStop(1,'rgba(235,185,0,'+(0.65*energy).toFixed(3)+')');
    ctx.fillStyle = grad; ctx.globalAlpha = 0.35 + 0.55*energy; ctx.fillRect(-sw/2 + 6, -sh/2 + 6, sw-12, sh-12);
    ctx.globalAlpha = 1;
  // refined sheen sweep for a professional electric panel look
  // slow horizontal sweep highlights the sign face
  const nowT = performance.now();
  const sweepPos = ((nowT/1600) % 1); // slow loop
  const sweepX = -sw/2 + 6 + sweepPos * (sw-12);
  const sweepW = Math.max(28, sw * 0.18);
  const sheenGrad = ctx.createLinearGradient(sweepX - sweepW/2, -sh/2, sweepX + sweepW/2, sh/2);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.45, 'rgba(255,255,255,' + (0.06 * energy).toFixed(3) + ')');
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,' + (0.16 * energy).toFixed(3) + ')');
  sheenGrad.addColorStop(0.55, 'rgba(255,255,255,' + (0.06 * energy).toFixed(3) + ')');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(-sw/2 + 8, -sh/2 + 8, sw - 16, sh - 16);
  ctx.globalCompositeOperation = 'source-over';
  // subtle static circuit/cut lines overlay for texture (very low alpha)
  ctx.strokeStyle = `rgba(255,255,255,${(0.03 + 0.02 * energy).toFixed(3)})`;
  ctx.lineWidth = 1;
  // a few diagonal accent strokes to suggest circuitry without being noisy
  ctx.beginPath(); ctx.moveTo(-sw/4, -sh/2 + 10); ctx.lineTo(sw/4, sh/2 - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-sw/2 + 10,  -sh/4); ctx.lineTo(sw/2 - 10, sh/4); ctx.stroke();
  ctx.restore();
    // pulsing border
    ctx.strokeStyle = `rgba(124,248,200,${(0.45+0.4*energy).toFixed(3)})`;
    ctx.lineWidth = 3; ctx.strokeRect(-sw/2 + 4, -sh/2 + 4, sw-8, sh-8);
    ctx.restore();
  }
  // label with jitter & multi-layer glow if focused
  if(isFlash && (L.active || L.afterglow>0)){
    const focusAmt = L.active?1:Math.min(1, L.afterglow/1400);
    const jitter = L.active? (1.4 + Math.random()*1.2) : 0.6*Math.random();
    ctx.save();
    ctx.translate(bx, roadY-130 - sh/2);
    ctx.font='700 15px ui-sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const text = 'SparkIT Flash';
    // outer glow layers
    for(let gL=0; gL<3; gL++){
      ctx.fillStyle = `rgba(${gL===2?235:124},${gL===2?185:248},${gL===2?0:200},${(0.12+0.22*gL)*focusAmt})`;
      ctx.fillText(text, jitter*(gL-1), (gL-1)*jitter);
    }
    ctx.fillStyle = '#e6ecff';
    ctx.fillText(text,0,0);
    ctx.restore();
  } else {
    ctx.fillStyle='#e6ecff'; ctx.fillText(label, bx, roadY-130 - sh/2);
  }

    // interact hint if near
    const near = Math.abs(state.player.x - b.x) < 60;
    if(near){
      ctx.font='12px ui-sans-serif'; ctx.fillStyle='rgba(124,248,200,.9)'; ctx.fillText('Press E to interact', bx, roadY-140 - sh);
      state.near = b;
    }
  });

  // Lightning update & draw (overlay after signs)
  const now = performance.now();
  if(!L.active && now >= L.next){ triggerLightning(); }
  if(L.active){
    L.t += state.dt*1000; // ms
    // path flicker slower, ensure visible
    if(Math.random()<0.15){
      L.points = buildLightningPath(L.strikeX, -140 + state.camera.x, L.strikeX, L.strikeY - 40);
    }
    // phased brightness: ramp up then down
    const ph = L.t / L.duration;
    let flashA = ph < 0.55 ? (ph/0.55) : (1 - (ph-0.55)/0.45);
    flashA = Math.max(0, flashA);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle = `rgba(124,248,200,${0.95*flashA})`; ctx.lineWidth=4.5;
    ctx.beginPath();
    L.points.forEach((pt,i)=>{ const sx = pt.x - state.camera.x; const sy = pt.y; if(i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); });
    ctx.stroke();
    // inner core
    ctx.strokeStyle = `rgba(255,255,255,${flashA})`; ctx.lineWidth=2.2;
    ctx.beginPath();
    L.points.forEach((pt,i)=>{ const sx = pt.x - state.camera.x; const sy = pt.y; if(i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); });
    ctx.stroke();
    // radial flash near impact
    if(state.phase1Sign){
      const ix = L.strikeX - state.camera.x; const iy = L.strikeY;
      const radG = ctx.createRadialGradient(ix,iy,0,ix,iy,220);
      radG.addColorStop(0,`rgba(124,248,200,${0.35*flashA})`);
      radG.addColorStop(1,'rgba(124,248,200,0)');
      ctx.fillStyle = radG; ctx.beginPath(); ctx.arc(ix,iy,160,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // arcs
    L.arcs.forEach(a=>{ a.life -= state.dt*1000; if(a.life>0){
      ctx.save(); ctx.globalAlpha = Math.min(0.6, a.life/160);
      ctx.strokeStyle='rgba(124,248,200,.8)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      const sx = L.strikeX - state.camera.x, sy = L.strikeY;
      const ex = a.x - state.camera.x, ey = a.y;
      ctx.moveTo(sx,sy);
      const midx = (sx+ex)/2 + (Math.random()-0.5)*18;
      const midy = (sy+ey)/2 + (Math.random()-0.5)*18;
      ctx.lineTo(midx, midy); ctx.lineTo(ex,ey);
      ctx.stroke(); ctx.restore();
    }});
    L.arcs = L.arcs.filter(a=>a.life>0);
    // update sparks
    L.sparks.forEach(s=>{
      s.life -= state.dt*1000; if(s.life>0){
        s.vy += 140*state.dt; // gravity-ish
        s.x += s.vx*state.dt; s.y += s.vy*state.dt;
      }
    });
    L.sparks = L.sparks.filter(s=>s.life>0);
    // update rings
    L.rings.forEach(r=>{ r.r += r.v*state.dt; r.alpha -= state.dt*0.4; });
    L.rings = L.rings.filter(r=>r.alpha>0);
    // update electric leaks (grow length toward target, then slowly fade)
    if(L.leaks){
      L.leaks.forEach(le=>{
        // ease length towards target
        const d = (le.lenTarget - le.len) * Math.min(1, state.dt*2.8);
        le.len += d;
        // reduce life
        le.life -= state.dt*1000;
        // alpha easing near end
        if(le.life < 800) le.alpha = Math.max(0, le.life / 800);
      });
      L.leaks = L.leaks.filter(le=>le.life>80 && le.alpha>0.02);
    }
    if(L.t >= L.duration){
      L.active=false; L.afterglow = 4200; scheduleLightningStrike(7500 + Math.random()*4500);
    }
  } else if(L.afterglow>0){
    // eased afterglow: decay with smoother curve
    const dec = state.dt*1000;
    L.afterglow -= dec * 1.0; if(L.afterglow<0) L.afterglow=0;
    // gentle decay of focus with ease-out
    L.focus = Math.max(0, L.focus - state.dt*0.75);
    // update lingering sparks & rings
    L.sparks.forEach(s=>{
      s.life -= state.dt*1000; if(s.life>0){
        s.vy += 120*state.dt; s.x += s.vx*state.dt; s.y += s.vy*state.dt;
      }
    });
    L.sparks = L.sparks.filter(s=>s.life>0);
    L.rings.forEach(r=>{ r.r += r.v*state.dt; r.alpha -= state.dt*0.22; });
    L.rings = L.rings.filter(r=>r.alpha>0);
    // leaks continue to gracefully shorten and fade
    if(L.leaks){
      L.leaks.forEach(le=>{
        // shrink a bit towards zero with smooth easing
        le.len += (0 - le.len) * Math.min(1, state.dt*0.9);
        le.life -= state.dt*1000;
        if(le.life < 700) le.alpha = Math.max(0, le.life / 700);
      });
      L.leaks = L.leaks.filter(le=>le.alpha>0.02 && le.len>4);
    }
  }
  // draw sparks & rings (additive) AFTER main lightning and sign
  if((L.active || L.afterglow>0) && state.phase1Sign){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const sx = L.strikeX - state.camera.x; const sy = L.strikeY;
    L.rings.forEach(r=>{
      ctx.strokeStyle = `rgba(124,248,200,${(0.25*r.alpha).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, r.r, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(235,185,0,${(0.18*r.alpha).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx, sy, r.r*0.6, 0, Math.PI*2); ctx.stroke();
    });
    L.sparks.forEach(s=>{
      const a = Math.max(0, s.life / 400) * s.fade;
      if(a<=0) return;
      ctx.fillStyle = `rgba(${a>0.4?255:124},${a>0.4?255:248},${a>0.4?210:200},${a.toFixed(3)})`;
      ctx.fillRect(s.x - state.camera.x, s.y, 2, 2);
    });
    // draw electric leaks crawling out of sign (Flash movie cyborg leak style)
    if(L.leaks && L.leaks.length){
      L.leaks.forEach(le=>{
        const nodes = le.nodes;
        let prevX = sx; let prevY = sy - 6;
        for(let n=1;n<=nodes;n++){
          const t = n / nodes;
          const ang = le.ang + Math.sin((performance.now()*0.002) + n*0.6 + le.len*0.01) * 0.6;
          const segLen = (le.len / nodes) * (0.85 + Math.sin(n*0.9 + performance.now()*0.001)*0.15);
          const nx = prevX + Math.cos(ang) * segLen;
          const ny = prevY + Math.sin(ang) * segLen * 0.8;
          // alpha eases along the leak from bright near sign to dim at tip
          const segAlpha = (le.alpha) * (1 - t*0.85);
          ctx.strokeStyle = `rgba(200,250,220,${(0.9*segAlpha).toFixed(3)})`;
          ctx.lineWidth = 2.2 * (1 - t*0.7);
          ctx.beginPath(); ctx.moveTo(prevX - state.camera.x, prevY); ctx.lineTo(nx - state.camera.x, ny); ctx.stroke();
          // inner bright core
          ctx.strokeStyle = `rgba(255,255,255,${(0.65*segAlpha).toFixed(3)})`;
          ctx.lineWidth = 1.0 * (1 - t*0.6);
          ctx.beginPath(); ctx.moveTo(prevX - state.camera.x, prevY); ctx.lineTo(nx - state.camera.x, ny); ctx.stroke();
          prevX = nx; prevY = ny;
        }
      });
    }
    ctx.restore();
  }

  // focus vignette to draw attention to sign
  if(L.focus>0 && state.phase1Sign){
    ctx.save();
    const sx = state.phase1Sign.x - state.camera.x; const sy = state.phase1Sign.y;
    const vign = ctx.createRadialGradient(sx, sy, 60, sx, sy, Math.max(W,H));
    vign.addColorStop(0,'rgba(0,0,0,0)');
    vign.addColorStop(0.35,'rgba(0,0,0,'+(0.2*L.focus).toFixed(3)+')');
    vign.addColorStop(1,'rgba(0,0,0,'+(0.78*L.focus).toFixed(3)+')');
    ctx.fillStyle = vign; ctx.fillRect(-20,-20,W+40,H+40);
    ctx.restore();
  }

  // obstacles removed

  // obstacles removed

  // phase gate (draw if phase1Complete)
  if(state.phase1Complete){
    const gx = state.gate.x - state.camera.x;
    if(!(gx<-200 || gx>W+200)){
      // gate posts
      ctx.fillStyle='rgba(138,164,255,.5)';
      ctx.fillRect(gx-60, roadY-150, 10, 150);
      ctx.fillRect(gx+50, roadY-150, 10, 150);
      // banner
      ctx.fillStyle='rgba(124,248,200,.35)';
      ctx.fillRect(gx-60, roadY-150, 120, 16);
      ctx.font='12px ui-sans-serif'; ctx.fillStyle='#e6ecff'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText('Phase 1 Gate', gx, roadY-148);
    }
  }
  ctx.restore(); // shake restore
}

/* ===== Timeline Vertical Mode ===== */
function enterTimeline() {
  if(state.timeline.active) return;
  state.timeline.active = true; 
  state.mode='timeline';
  state.timeline.roadReturnY = state.player.y;
  state.player.vx=0; state.player.ax=0; 
  state.player.vy=0; state.player.ay=0; 
  state.player.y = 160;
  toast('Entered Spark Flash');

  const logos = document.getElementById("logo-container");
  if(logos) logos.style.display = "none"; // hide logos
}

function exitTimeline(){
  if(!state.timeline.active) return;
  state.timeline.active = false; 
  state.mode = 'road';
  state.player.vy = 0; 
  state.player.ay = 0;
  positionPlayerOnRoad();
  state.camera.y = 0;
  toast('Returned to Highway');

  const logos = document.getElementById("logo-container");
  if(logos) logos.style.display = "flex";
}
function drawTimeline(){
  // dark base
  ctx.fillStyle = '#04080f'; ctx.fillRect(0,0,W,H);
  ensureTimelineEnhancementsInit();
  // parallax cave layers (simple sine contours)
  const t = performance.now()/1000;
  for(let layer=0; layer<4; layer++){
    const speed = 0.1 + layer*0.07;
    const amp = 18 + layer*6;
    const col = ['#0a1622','#0d1d2b','#102534','#142e3f'][layer];
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0,0);
    for(let x=0;x<=W;x+=40){
      const y = Math.sin((x*0.35 + t*120*speed) / 50 + layer)*amp + layer*28;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(W,0); ctx.closePath();
    ctx.globalAlpha = 0.25 - layer*0.04; ctx.fill(); ctx.globalAlpha=1;
    // lower strata floor silhouettes
    ctx.beginPath();
    ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=60){
      const y = H - (layer*40 + 60) - Math.sin((x*0.25 + t*90*speed))/ (0.6+layer*0.2) * 18;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(W,H); ctx.closePath();
    ctx.globalAlpha=0.12 + layer*0.05; ctx.fill(); ctx.globalAlpha=1;
  }
  // vertical track
  const trackX = W/2;
  ctx.strokeStyle='rgba(124,248,200,.4)'; ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(trackX, -state.camera.y + 100); ctx.lineTo(trackX, -state.camera.y + state.timeline.length + 200); ctx.stroke();
  // milestones
  const p = state.player;
  state.near = null;
  state.timeline.milestones.forEach(m=>{
    const yScreen = m.y - state.camera.y;
    if(yScreen < -140 || yScreen > H+140) return;
    const active = Math.abs(p.y - m.y) < 70;
    if(active){ state.near = { label:m.title, type:'timeline:'+m.key, _timeline:m }; }
    // if near a workshop milestone, prepare robot transform/visuals and spawn themed particles
    if(active && /^workshop/.test(m.key)){
      applyRobotWorkshopVariant(m.key);
  // award small visit reward only on first passive approach
      if(!state.timeline.visited.has(m.key)){
        state.timeline.visited.add(m.key);
        // XP disabled: preserve visit tracking and show a small toast
        toast('Visited: ' + m.title);
        // spawn a short burst of themed particles
        spawnTimelineParticles(m.key, trackX, m.y);
      }
    }
    // compute attenuation based on torch distance (bot position)
    let atten = 1;
    try{
      const bot = document.getElementById('cursor-bot');
      const r = bot?.getBoundingClientRect();
      const by = r ? r.top + r.height/2 : H/2;
      const dy = Math.abs(by - yScreen);
      atten = Math.max(0.15, 1 - dy/520);
    }catch{}
  // color per type for stronger theme clarity
  const colActive = m.key==='workshop1' ? `rgba(180,120,255,${0.6+0.3*atten})` :
            m.key==='workshop2' ? `rgba(124,248,200,${0.6+0.3*atten})` :
            m.key==='workshop3' ? `rgba(120,200,255,${0.6+0.3*atten})` : `rgba(124,248,200,${0.6+0.3*atten})`;
  const colIdle   = m.key==='workshop1' ? `rgba(180,120,255,${0.25+0.35*atten})` :
            m.key==='workshop2' ? `rgba(138,164,255,${0.25+0.35*atten})` :
            m.key==='workshop3' ? `rgba(120,200,255,${0.25+0.35*atten})` : `rgba(138,164,255,${0.25+0.35*atten})`;
  ctx.fillStyle = active ? colActive : colIdle;
    ctx.beginPath(); ctx.ellipse(trackX, yScreen, 22, 22, 0, 0, Math.PI*2); ctx.fill();
    // outline
    ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(trackX, yScreen, 30, 30, 0, 0, Math.PI*2); ctx.stroke();
    // label
  ctx.font='600 16px ui-sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#e6ecff';
  ctx.fillText(m.title, trackX + 48, yScreen);
  // draw small icon glyph per workshop
  drawTimelineIcon(m.key, trackX + 36, yScreen);
    // progress bar
    ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(trackX+48, yScreen+16, 180, 5);
    if(state.timeline.visited.has(m.key)){
      ctx.fillStyle='rgba(124,248,200,.85)'; ctx.fillRect(trackX+48, yScreen+16, 180, 5);
    }
  });
  // collectibles & ambient & hack progress updates
  updateAmbient(); updateOrbs(); updateHackMiniGame(); updateConfetti(); checkCompetitionCelebration();
  drawAmbient(); drawOrbs(); drawTimelineParticles(); drawTether(); drawHackMiniGame(); drawMilestoneTooltip(); drawConfetti(); drawTimelineMinimap();
  // clear workshop variant if no current active workshop milestone proximity
  if(!(state.near && /workshop/.test(state.near.type||''))){
    if(state.currentWorkshopVariant){
      clearRobotWorkshopVariant();
    }
  }
  ctx.font='12px ui-sans-serif'; ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,.6)';
  if(p.y < 240) ctx.fillText('Spark Flash ↓ / S descend • Up / W exit', trackX, 54); else ctx.fillText('Spark Flash: E open • Up climb • Up @ top exit', trackX, 54);
  // torch spotlight (simulate from bot head relative to pointer; fallback center)
  try{
    const bot = document.getElementById('cursor-bot');
    const r = bot?.getBoundingClientRect();
    const bx = r ? r.left + r.width/2 : W/2;
    const by = r ? r.top + r.height/2 : H/2;
    // intensify spotlight when near a milestone
    const nearFactor = state.near && state.near.type && state.near.type.startsWith('timeline:') ? 0.55 : 0.35;
    const grad = ctx.createRadialGradient(bx,by,20,bx,by,320);
    grad.addColorStop(0,'rgba(255,255,210,'+nearFactor.toFixed(3)+')');
    grad.addColorStop(0.25,'rgba(255,255,180,'+(nearFactor*0.55).toFixed(3)+')');
    grad.addColorStop(1,'rgba(0,0,0,0.88)');
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = 'source-over';
  }catch{}
}

// Draw simple icon glyphs for timeline milestones
function drawTimelineIcon(key, x, y){
  ctx.save(); ctx.translate(x,y);
  ctx.globalAlpha = 0.95;
  if(key==='workshop1'){
    // Gamepad/joystick
    ctx.fillStyle='rgba(220,180,255,0.95)'; ctx.beginPath(); ctx.roundRect(-10,-10,20,20,4); ctx.fill();
    ctx.fillStyle='#2b1036'; ctx.beginPath(); ctx.arc(0, -2, 3.6, 0, Math.PI*2); ctx.fill();
  } else if(key==='workshop2'){
    // Lock/terminal glyph for CTF
    ctx.fillStyle='rgba(120,240,200,0.95)'; ctx.beginPath(); ctx.roundRect(-10,-8,20,16,3); ctx.fill();
    ctx.fillStyle='#022'; ctx.fillRect(-4,-2,8,3); ctx.fillStyle='#0f0'; ctx.fillRect(-5,3,10,2);
  } else if(key==='workshop3'){
    // Code bracket
    ctx.fillStyle='rgba(140,200,255,0.95)'; ctx.font='14px ui-sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('{ }', 0, 0);
  }
  ctx.restore();
}

// Spawn timeline-themed particles at a milestone
function spawnTimelineParticles(key, x, y){
  const s = state.timeline.particles || (state.timeline.particles = []);
  const worldX = x; const worldY = y;
  if(key==='workshop1'){
    for(let i=0;i<18;i++) s.push({type:'pixel', x:worldX + (Math.random()*120-60), y:worldY + (Math.random()*40-20), vx:(Math.random()*2-1)*30, vy:(Math.random()*-1-1)*30, life:900+Math.random()*900});
  } else if(key==='workshop2'){
  for(let i=0;i<26;i++) s.push({type:'ctf', x:worldX + (Math.random()*120-60), y:worldY + (Math.random()*40-20), vx:(Math.random()*2-1)*60, vy:(Math.random()*-1-1)*40, life:1200+Math.random()*1200});
  } else if(key==='workshop3'){
    for(let i=0;i<14;i++) s.push({type:'code', x:worldX + (Math.random()*120-60), y:worldY + (Math.random()*40-20), vx:(Math.random()*2-1)*40, vy:(Math.random()*-1-1)*20, life:1000+Math.random()*800});
  }
}

// Render timeline particles with bounds checking
function drawTimelineParticles(){
  const s = state.timeline.particles || [];
  const camY = state.camera.y;
  const screenTop = camY - 100; // Extra margin for smooth transitions
  const screenBottom = camY + H + 100;
  
  for(let i=s.length-1;i>=0;i--){
    const p = s[i]; 
    p.life -= state.dt*1000; 
    if(p.life<=0) { 
      s.splice(i,1); 
      continue; 
    }
    
    p.x += p.vx * state.dt; 
    p.y += p.vy * state.dt; 
    p.vy += 30 * state.dt;
    
    // Bounds checking - remove particles that are off-screen for too long
    if(p.y < screenTop || p.y > screenBottom) {
      if(!p.offScreenTime) p.offScreenTime = 0;
      p.offScreenTime += state.dt * 1000;
      if(p.offScreenTime > 2000) { // Remove after 2 seconds off-screen
        s.splice(i,1);
        continue;
      }
    } else {
      p.offScreenTime = 0;
    }
    
    const yScreen = p.y - camY;
    if(yScreen >= -50 && yScreen <= H + 50) { // Only render if on screen
      if(p.type==='pixel'){ 
        ctx.fillStyle = 'rgba(220,180,255,'+(Math.min(1,p.life/900)).toFixed(3)+')'; 
        ctx.fillRect(p.x, yScreen, 3,3); 
      }
      if(p.type==='ctf'){ 
        ctx.fillStyle = 'rgba(124,248,200,'+(Math.min(1,p.life/1200)).toFixed(3)+')'; 
        ctx.fillRect(p.x, yScreen, 2,8); 
      }
      if(p.type==='code'){ 
        ctx.fillStyle = 'rgba(200,240,255,'+(Math.min(1,p.life/1000)).toFixed(3)+')'; 
        ctx.fillText(';</', p.x, yScreen); 
      }
    }
  }
}

/* ===== Timeline Enhancements (collectibles, ambient, minimap, tether, hack) ===== */
function ensureTimelineEnhancementsInit(){
  const tl = state.timeline;
  // seed ambient motes lazily
  if(!tl._ambientSeeded){
    for(let i=0;i<140;i++) tl.ambient.push({x: (Math.random()*W*0.6 + W*0.2), y: Math.random()*tl.length, r: 2+Math.random()*4, drift:(Math.random()*0.4+0.2), pulse:Math.random()*Math.PI*2});
    tl._ambientSeeded = true;
  }
  // seed orbs (one at each milestone gap midpoint)
  if(!tl._orbsSeeded){
    const ms = tl.milestones.slice().sort((a,b)=>a.y-b.y);
    for(let i=0;i<ms.length-1;i++){
      const a = ms[i], b = ms[i+1];
      const mid = (a.y + b.y)/2;
      tl.orbs.push({y: mid, x: W/2 + (i%2===0? -70:70), collected:false, wobble:Math.random()*Math.PI*2});
    }
    tl._orbsSeeded = true;
  }
}

function updateAmbient(){
  const tl = state.timeline; const arr = tl.ambient;
  const camY = state.camera.y;
  arr.forEach(p=>{ p.pulse += state.dt*0.9; p.x += Math.sin(p.pulse*0.6)*p.drift; });
  // occasional shimmer spawn
  if(!tl._lastAmbientSpark || performance.now()-tl._lastAmbientSpark>900){
    tl._lastAmbientSpark = performance.now();
    const baseY = camY + Math.random()*H;
    tl.ambient.push({x: W/2 + (Math.random()*240-120), y: baseY, r:1.5, drift:0.3, pulse:0, spark:true, life:1400});
  }
  // update spark life
  for(let i=tl.ambient.length-1;i>=0;i--){ const p=tl.ambient[i]; if(p.spark){ p.life -= state.dt*1000; if(p.life<=0) tl.ambient.splice(i,1); }}
}
function drawAmbient(){
  const tl = state.timeline; const arr = tl.ambient; const camY = state.camera.y;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  arr.forEach(p=>{
    const yScreen = p.y - camY; if(yScreen<-50||yScreen>H+50) return;
    const a = p.spark? Math.min(1, (p.life||0)/1400) : 0.4 + Math.sin(p.pulse)*0.2;
    ctx.fillStyle = p.spark? `rgba(124,248,200,${a.toFixed(3)})` : `rgba(200,255,235,${(0.15*a).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(p.x, yScreen, p.r*(p.spark?1.8:1), 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function updateOrbs(){
  const tl = state.timeline; const p = state.player; const camY = state.camera.y;
  tl.orbs.forEach(o=>{
    o.wobble += state.dt*2.2; o.wx = o.x + Math.sin(o.wobble)*14; o.sy = o.y + Math.sin(o.wobble*0.7)*10;
    if(!o.collected && Math.abs(p.y - o.y) < 38){
      o.collected = true;
      // small burst confetti inside timeline
      for(let i=0;i<14;i++) state.timeline.confetti.push({x:W/2,y:o.y, vx:(Math.random()*2-1)*60, vy:(Math.random()*-1-0.2)*80, life:1100+Math.random()*600, col:i%3});
    }
  });
}
function drawOrbs(){
  const tl = state.timeline; const camY = state.camera.y;
  tl.orbs.forEach(o=>{
    const yScreen = o.sy - camY; if(yScreen<-80||yScreen>H+80) return;
    if(o.collected){ return; }
    const pul = (Math.sin(o.wobble*2)+1)/2;
    ctx.save(); ctx.translate(o.wx, yScreen);
    const r = 12 + pul*2;
    const g = ctx.createRadialGradient(0,0,2,0,0,r);
    g.addColorStop(0,'rgba(255,255,255,0.9)');
    g.addColorStop(0.5,'rgba(124,248,200,0.9)');
    g.addColorStop(1,'rgba(124,248,200,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

function drawTimelineMinimap(){
  const tl = state.timeline; const padding = 8; const mapH = 180; const mapW = 70;
  ctx.save(); ctx.translate(W - mapW - padding, padding+30);
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,mapW,mapH);
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.strokeRect(0,0,mapW,mapH);
  // milestones
  tl.milestones.forEach(m=>{
    const yRat = m.y / tl.length; const y = yRat * (mapH-16) + 8;
    ctx.fillStyle = tl.visited.has(m.key)? '#7cf8c8' : 'rgba(124,248,200,.35)';
    ctx.fillRect(mapW/2-4, y-4, 8,8);
  });
  // orbs
  tl.orbs.forEach(o=>{
    const yRat = o.y / tl.length; const y = yRat * (mapH-16) + 8;
    ctx.fillStyle = o.collected? 'rgba(255,255,255,.35)' : '#b4ffe9';
    ctx.fillRect(mapW/2-2, y-2, 4,4);
  });
  // player marker
  const py = (state.player.y / tl.length) * (mapH-16) + 8;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mapW/2, py, 5, 0, Math.PI*2); ctx.fill();
  ctx.font='10px ui-sans-serif'; ctx.fillStyle='rgba(255,255,255,.6)'; ctx.textAlign='center'; ctx.fillText('Map', mapW/2, mapH+10);
  ctx.restore();
}

function drawTether(){
  const tl = state.timeline; if(!tl.milestones.length) return; const p = state.player;
  // find next milestone above player
  const next = tl.milestones.filter(m=> m.y > p.y).sort((a,b)=>a.y-b.y)[0];
  if(!next) return;
  const x = W/2; const y1 = p.y - state.camera.y; const y2 = next.y - state.camera.y;
  ctx.save(); ctx.strokeStyle='rgba(124,248,200,0.25)'; ctx.lineWidth=2; ctx.setLineDash([6,6]);
  ctx.beginPath(); ctx.moveTo(x+42, y1); ctx.lineTo(x+42, y2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

function updateHackMiniGame(){
  const tl = state.timeline; const hack = tl.hack; if(hack.completed) return;
  // trigger near CTF milestone (workshop2) when visited
  const ctf = tl.milestones.find(m=>m.key==='workshop2'); if(!ctf) return;
  const active = Math.abs(state.player.y - ctf.y) < 70;
  if(active && !hack.active && !hack.completed){ hack.active=true; hack.progress=0; hack.timer=0; hack.target = (Math.random()*9000|0).toString(16); }
  if(hack.active){
    hack.timer += state.dt;
    // auto progress slowly; accelerate if Down key held
    const fast = state.keys['ArrowDown']||state.keys['KeyS'];
    hack.progress += state.dt * (fast? 28: 8);
  if(hack.progress >= 100){ hack.completed=true; hack.active=false; toast('Hack solved!'); }
  }
}
function drawHackMiniGame(){
  const hack = state.timeline.hack; if(!(hack.active||hack.completed)) return;
  const x = 30, y = 80; const w = 200, h = 70;
  ctx.save(); ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(124,248,200,0.6)'; ctx.strokeRect(x,y,w,h);
  ctx.font='12px ui-sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillStyle='#7cf8c8';
  ctx.fillText('CTF Hack Module', x+10, y+8);
  ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(x+10,y+30,w-20,14);
  const pct = hack.completed? 1 : Math.min(1, hack.progress/100);
  ctx.fillStyle='#7cf8c8'; ctx.fillRect(x+10,y+30,(w-20)*pct,14);
  ctx.fillStyle='#fff'; ctx.fillText(hack.completed? 'ACCESS GRANTED' : ('TARGET '+hack.target+' '+Math.floor(pct*100)+'%'), x+10, y+50);
  ctx.restore();
}

function drawMilestoneTooltip(){
  if(!state.near || !(state.near.type||'').startsWith('timeline:')) return;
  const m = state.near._timeline; if(!m) return; const text = m.text;
  const wMax = 260;
  const x = W/2 + 100; const y = m.y - state.camera.y - 50;
  ctx.save(); ctx.font='12px ui-sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
  // wrap text simple
  const words = text.split(' '); let line=''; const lines=[];
  words.forEach(w=>{ const test = line? line+' '+w : w; if(ctx.measureText(test).width > wMax-24){ lines.push(line); line=w; } else line=test; });
  if(line) lines.push(line);
  const boxH = 20 + lines.length*16;
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(x,y,wMax, boxH);
  ctx.strokeStyle='rgba(124,248,200,0.4)'; ctx.strokeRect(x,y,wMax, boxH);
  ctx.fillStyle='#e6ecff'; lines.forEach((ln,i)=> ctx.fillText(ln, x+12, y+10+i*16));
  ctx.restore();
}

// Badges/achievement system removed

function updateConfetti(){
  const list = state.timeline.confetti; if(!list.length) return;
  list.forEach(p=>{ p.life -= state.dt*1000; p.vy += 200*state.dt; p.x += p.vx*state.dt; p.y += p.vy*state.dt; });
  for(let i=list.length-1;i>=0;i--) if(list[i].life<=0) list.splice(i,1);
}
function drawConfetti(){
  const list = state.timeline.confetti; if(!list.length) return; const camY = state.camera.y;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  list.forEach(p=>{
    const yScreen = p.y - camY; if(yScreen<-40||yScreen>H+40) return;
    const a = Math.min(1, p.life/1200);
    const col = p.col===0? '#7cf8c8' : p.col===1? '#b488ff' : '#ebc400';
    ctx.fillStyle = col.replace('#','rgba(') + ', '+a.toFixed(3)+')'; // quick hack? convert hex - fallback below
    // safer fill style compute
    if(col==='#7cf8c8') ctx.fillStyle = `rgba(124,248,200,${a.toFixed(3)})`;
    if(col==='#b488ff') ctx.fillStyle = `rgba(180,136,255,${a.toFixed(3)})`;
    if(col==='#ebc400') ctx.fillStyle = `rgba(235,196,0,${a.toFixed(3)})`;
    ctx.fillRect(p.x, yScreen, 4,4);
  });
  ctx.restore();
}

function checkCompetitionCelebration(){
  const tl = state.timeline; const comp = tl.milestones.find(m=>m.key==='competitions'); if(!comp) return;
  if(!tl._compCelebrated && Math.abs(state.player.y - comp.y) < 60){
    tl._compCelebrated = true;
    for(let i=0;i<120;i++) tl.confetti.push({x:(Math.random()*120-60)+W/2, y:comp.y + (Math.random()*40-20), vx:(Math.random()*2-1)*100, vy:(Math.random()*-1-0.2)*160, life:1000+Math.random()*1200, col:i%3});
  }
}


// Apply a small accessory/transform to the robot cursor for each workshop
function applyRobotWorkshopVariant(key){
  const bot = document.getElementById('cursor-bot'); if(!bot) return;
  let gear = bot.querySelector('.bot-gear');
  if(!gear){ gear = document.createElement('div'); gear.className='bot-gear'; gear.style.position='absolute'; gear.style.left='0'; gear.style.top='0'; gear.style.pointerEvents='none'; bot.appendChild(gear); }
  gear.style.transform = 'translate(-14px,-18px) scale(1)';
  if(state.currentWorkshopVariant !== key){
    bot.classList.add('variant-transition');
    setTimeout(()=> bot.classList.remove('variant-transition'), 480);
  }
  bot.classList.remove('workshop-game','workshop-ctf','workshop-code');
  if(key==='workshop1'){
    bot.classList.add('workshop-game'); gear.innerHTML = '<svg width="28" height="18" viewBox="0 0 28 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="24" height="14" rx="3" fill="#b488ff"/><circle cx="8" cy="9" r="2" fill="#2b1036"/><rect x="18" y="7" width="6" height="4" rx="1" fill="#2b1036"/></svg>';
  } else if(key==='workshop2'){
    bot.classList.add('workshop-ctf'); gear.innerHTML = '<svg width="28" height="18" viewBox="0 0 28 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="24" height="14" rx="3" fill="#7cf8c8"/><path d="M8 11h12v1H8z" fill="#022"/><rect x="12" y="5" width="4" height="2" fill="#0f0"/></svg>';
  } else if(key==='workshop3'){
    bot.classList.add('workshop-code'); gear.innerHTML = '<div style="font:700 12px/12px ui-sans-serif; color:#dff; text-shadow:0 1px 0 rgba(0,0,0,.35)">{ }</div>';
  } else { gear.innerHTML=''; }
  state.currentWorkshopVariant = key;
}

function clearRobotWorkshopVariant(){
  const bot = document.getElementById('cursor-bot'); if(!bot) return;
  bot.classList.remove('workshop-game','workshop-ctf','workshop-code');
  const gear = bot.querySelector('.bot-gear'); if(gear){ gear.innerHTML=''; }
  state.currentWorkshopVariant = null;
}

/* ======= Car drawing ======= */
function drawCar(){
  const p = state.player;
  const y = p.y, x = p.x - state.camera.x;
  // transformation progress
  let transP = 0;
  if(state.transition){
    const {start,duration,kind} = state.transition;
    transP = clamp((performance.now()-start)/duration,0,1);
    if(transP>=1){ delete state.transition; }
    if(kind==='exit-underground') transP = 1 - transP; // reverse for exit morph
  }

  // shadow
  if(state.mode==='timeline'){
    // Rocket / drilling module hybrid
    const baseW = p.w * (1 - 0.3*transP);
    const bodyH = p.h + 50;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = '#7cf8c8';
    ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(0,-bodyH/2);
    ctx.lineTo(baseW/2, bodyH/2-14);
    ctx.lineTo(0, bodyH/2);
    ctx.lineTo(-baseW/2, bodyH/2-14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // window
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0,-6, baseW*0.25, 14,0,0,Math.PI*2); ctx.fill();
    // flame if moving down
    if(state.player.vy>20){
      const f = ctx.createLinearGradient(0,0,0,60); f.addColorStop(0,'rgba(255,200,80,.9)'); f.addColorStop(1,'rgba(255,80,20,0)');
      ctx.fillStyle=f; ctx.beginPath(); ctx.moveTo(0, bodyH/2); ctx.lineTo(10, bodyH/2+60); ctx.lineTo(-10, bodyH/2+60); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  } else {
    // Car (default)
    const grad = ctx.createLinearGradient(x-p.w/2,y-20,x+p.w/2,y+20);
    grad.addColorStop(0,'#8aa4ff'); grad.addColorStop(1,'#7cf8c8');
    ctx.fillStyle = grad; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.roundRect(x-p.w/2, y-p.h/2, p.w, p.h, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.25)';
    ctx.fillRect(x-p.w/2+10, y-p.h/2+6, 24, p.h-12);
    ctx.fillRect(x+p.w/2-34, y-p.h/2+6, 24, p.h-12);
    ctx.fillStyle='#0c1226';
    ctx.beginPath(); ctx.arc(x-p.w/3, y+p.h/2, 12, 0, Math.PI*2); ctx.arc(x+p.w/3, y+p.h/2, 12, 0, Math.PI*2); ctx.fill();
    if(state.player.vx>20){
      const lg = ctx.createRadialGradient(x+p.w/2, y, 0, x+p.w/2+70, y, 80);
      lg.addColorStop(0,'rgba(255,255,255,.25)'); lg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(x+p.w/2+70, y, 80, 28, 0, 0, Math.PI*2); ctx.fill();
    }
  }
  // end transformation branch

  // skid marks
  state.skids.forEach(s=>{
    const sx = s.x - state.camera.x;
    ctx.strokeStyle=`rgba(0,0,0,${s.alpha.toFixed(3)})`;
    ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(sx-6, y+p.h/2-1); ctx.lineTo(sx+6, y+p.h/2+1); ctx.stroke();
  });
}

/* ======= Player Trail Functions ======= */
function updatePlayerTrail() {
  const p = state.player;
  const dt = state.dt;

  // 1. Update existing particles and fade them out
  for (let i = p.trailParticles.length - 1; i >= 0; i--) {
    const particle = p.trailParticles[i];
    particle.life -= dt; // Decrease life over time (1 second life)
    particle.x += particle.vx * dt; // Particles can have their own slight movement
    particle.y += particle.vy * dt;
    if (particle.life <= 0) {
      p.trailParticles.splice(i, 1); // Remove dead particles
    }
  }

  // 2. Generate new particles if the car is moving fast
  const speed = Math.abs(p.vx);
  const speedThreshold = p.maxSpeed * 0.5; // Start showing trail at 50% max speed

  if (speed > speedThreshold) {
    // Make particle generation more frequent at higher speeds
    if (Math.random() > 0.8 - (speed / p.maxSpeed) * 0.5) {
      const particle = {
        x: p.x - Math.sign(p.vx) * (p.w / 2), // Start at the back of the car
        y: p.y + (Math.random() * p.h * 0.6 - p.h * 0.3), // Randomize y position slightly
        life: 0.5 + Math.random() * 0.5, // Particle lives for 0.5 to 1.0 seconds
        size: 2 + (speed / p.maxSpeed) * 4, // Bigger particles at higher speed
        // Give particles a slight velocity opposite to the car's movement
        vx: -p.vx * 0.1,
        vy: (Math.random() - 0.5) * 30
      };
      p.trailParticles.push(particle);
    }
  }
}

function drawPlayerTrail() {
  const particles = state.player.trailParticles;
  if (!particles.length) return;

  ctx.save();
  // Using 'lighter' creates a beautiful additive blending effect for glows
  ctx.globalCompositeOperation = 'lighter';

  particles.forEach(p => {
    const alpha = p.life / 1.0; // Fade out as life decreases
    if (alpha <= 0) return;

    const size = p.size * alpha; // Shrink as it fades
    const screenX = p.x - state.camera.x;

    // Create a radial gradient for a soft glow effect
    const grad = ctx.createRadialGradient(screenX, p.y, 0, screenX, p.y, size);
    grad.addColorStop(0, `rgba(124, 248, 200, ${alpha * 0.9})`);   // Inner color (matches your theme)
    grad.addColorStop(0.7, `rgba(138, 164, 255, ${alpha * 0.6})`); // Outer color
    grad.addColorStop(1, `rgba(138, 164, 255, 0)`);               // Fully transparent edge

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenX, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/* ======= Game loop ======= */
function step(){
  const now = performance.now();
  state.dt = Math.min(0.05, (now - state.lastT) / 1000); // clamp to 50ms
  state.lastT = now;

  // Robot cursor expression dynamics
  if(!state._botExpr){
    state._botExpr = {
      lastMoveX: state.player.x,
      lastMoveVCheckT: now,
      idleAccum: 0,
      boredTriggered:false,
      sleepyTriggered:false,
      lastThrillT:0
    };
  }
  const botExpr = state._botExpr;

  if(!state.paused){
    const leftKey = state.keys['ArrowLeft']||state.keys['KeyA'];
    const rightKey = state.keys['ArrowRight']||state.keys['KeyD'];
    const upKey = state.keys['ArrowUp']||state.keys['KeyW'];
    const downKey = state.keys['ArrowDown']||state.keys['KeyS'];
    const left = leftKey || leftHeld; // retained for potential lateral movement reuse
    const right = rightKey || rightHeld;
    const p = state.player; const dt = state.dt;
    if(state.mode==='road'){
      const analog = (rightKey?1:state.throttle.right) - (leftKey?1:state.throttle.left);
      const dir = clamp(analog, -1, 1);
      p.ax = dir * p.accel;
      p.vx += p.ax * dt;
      if(dir===0){
        const sign = Math.sign(p.vx);
        const mag = Math.max(0, Math.abs(p.vx) - p.friction*dt);
        p.vx = mag*sign;
      }
      let maxV = p.maxSpeed;
      const lanes = state.sponsorLanes||[];
      const onSponsor = lanes.some(l=> p.x>=l.from && p.x<=l.to);
      if(onSponsor){ maxV *= 1.25; }
      p.vx = clamp(p.vx, -maxV, maxV);
      const prevV = p.vx;
      p.x += p.vx * dt;
      p.x = clamp(p.x, 40, state.world.length-40);
      if(Math.abs(p.ax) > p.accel*0.8 && Math.abs(prevV) > p.maxSpeed*0.4){
        state.skids.push({ x:p.x, alpha:0.25 });
        if(state.skids.length>120) state.skids.shift();
      }
      state.camera.x = clamp(p.x - W*0.5, 0, state.world.length - W + 0);
      state.near = null;
      handleCollisions();
      updateGhost();
      updateFireworks();
      updatePlayerTrail(); // Update dynamic energy trail
      updateWeather(); // Update weather system
      state.skids.forEach(s=> s.alpha = Math.max(0, s.alpha - 0.3*dt));
      while(state.skids.length && state.skids[0].alpha<=0.01) state.skids.shift();
    } else if(state.mode==='timeline'){
      const dirY = (downKey?1:0) - (upKey?1:0);
      p.ay = dirY * p.accel;
      p.vy += p.ay * dt;
      if(dirY===0){
        const sign = Math.sign(p.vy);
        const mag = Math.max(0, Math.abs(p.vy) - p.friction*dt);
        p.vy = mag*sign;
      }
      p.vy = clamp(p.vy, -p.maxSpeed*0.75, p.maxSpeed*0.75);
      p.y += p.vy * dt;
      p.y = clamp(p.y, 140, state.timeline.length);
  // inertial smoothing for camera (ease toward target)
  const targetCam = clamp(p.y - H*0.45, 0, state.timeline.length - H*0.5 + 200);
  if(!state.timeline.camY) state.timeline.camY = targetCam;
  state.timeline.camY += (targetCam - state.timeline.camY) * Math.min(1, dt*3.5);
  state.camera.y = state.timeline.camY;
    }

  // fuel removed
  }

  // draw
  ctx.clearRect(0,0,W,H);

  // Evaluate bot expression triggers (after updating physics & player speed)
  try{
    const bot = domCache.getCursorBot();
    if(bot){
      const p = state.player;
      const speed = Math.abs(p.vx);
      const max = p.maxSpeed;
      const tNow = performance.now();
      // Track idle (no horizontal movement in road, no vertical in timeline)
      let moving = false;
      if(state.mode==='road') moving = speed > 2; else moving = Math.abs(p.vy) > 2;
      if(moving){
        botExpr.idleAccum = 0;
        botExpr.boredTriggered = false;
        botExpr.sleepyTriggered = false;
      } else {
        botExpr.idleAccum += state.dt;
      }
      // Thrilled: near max speed sustained for >0.6s
      if(state.mode==='road' && speed > max*0.9){
        if(tNow - botExpr.lastThrillT > 200){
          bot.setAttribute('data-mode','thrilled');
          botExpr.lastThrillT = tNow;
        }
      } else if(bot.getAttribute('data-mode')==='thrilled' && speed < max*0.5){
        // release thrilled if slowing down and not overlapped by other forced states
        bot.removeAttribute('data-mode');
      }
      // Idle boredom stages
      if(bot.getAttribute('data-mode')!=='thrilled'){ // don't override thrill
        if(!botExpr.sleepyTriggered && botExpr.idleAccum > 35){
          bot.setAttribute('data-mode','sleepy');
          botExpr.sleepyTriggered = true;
        } else if(!botExpr.boredTriggered && botExpr.idleAccum > 12){
          bot.setAttribute('data-mode','bored');
          botExpr.boredTriggered = true;
        }
      }
      // If user interacts (keys) clear bored/sleepy quickly
      if(moving && (bot.getAttribute('data-mode')==='bored' || bot.getAttribute('data-mode')==='sleepy')){
        bot.removeAttribute('data-mode');
      }
    }
  }catch{}
  if(state.mode==='road'){
    drawBackground(); // background for reflections
    drawRoad();

    // Reflections on wet road
    drawReflections();

    // World scene
    drawRevealedData(); // hidden layer first so car overlays if needed
    drawPlayerTrail();
    drawCar();
    drawGhost();
    drawFireworks();

    // Screen-space effects last
    drawSpotlight();
    drawRain();
  } else if(state.mode==='timeline'){
    drawTimeline();
    const trackX = W/2; // center alignment
    const savedX = state.player.x;
    state.player.x = trackX; // lock horizontally in timeline
    ctx.save();
    ctx.translate(0, -state.camera.y);
    drawCar();
    ctx.restore();
    state.player.x = savedX;
  }
  // HUD for fuel/boost removed

  requestAnimationFrame(step);
}
requestAnimationFrame(step);

/* ======= Resize handling ======= */
function positionPlayerOnRoad(){
  // Keep the car vertically locked relative to the road regardless of canvas CSS size.
  const roadY = H - 120; // must match drawRoad()
  const p = state.player;
  p.y = roadY - p.h/2 - 4; // small ground clearance
}
function resize(){
  // Use visualViewport when available to avoid mobile browser UI affecting layout and causing scroll.
  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;
  // Set canvas CSS size to viewport and internal buffer to DPR-scaled size.
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  ctx.setTransform(1,0,0,1,0,0); // reset any transforms
  ctx.scale(dpr, dpr);
  W = vw; H = vh;
  positionPlayerOnRoad();
  initBillboards(); // recompute billboard placements (y alignment & potential world length changes)
}
addEventListener('resize', resize);
if('visualViewport' in window){
  // Handle mobile address bar show/hide
  window.visualViewport.addEventListener('resize', resize);
}
resize();

/* ======= Click interaction on signs ======= */
canvas.addEventListener('pointerdown', (e)=>{
  // detect if clicked near a sign; translate to world x (CSS pixels)
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left); // CSS px since we scale the context by DPR
  const wx = cx + state.camera.x;
  let found = null;
  for(const b of GAME_DATA.branches){
    if(Math.abs(wx - b.x) < 80){ found = b; break; }
  }
  if(found){
    if(found.type==='phase1'){ enterTimeline(); } else { openBranch(found); }
  }
});

/* ======= Initial friendly toast ======= */
// Guided start overlay shown only for first-time visitors
(function guidedStart(){
  try{
    const seen = localStorage.getItem('sparkit_guided_start_v1');
    const overlay = document.getElementById('guide-overlay');
    if(!overlay) return;
    if(seen){ // Already seen: skip overlay and show shorter toast after a delay
      setTimeout(()=>toast('Drive → stop at signs. E to interact.'), 700);
      return;
    }
    // Activate overlay
    overlay.classList.add('active');
    let dismissed = false;
    function dismiss(reason){
      if(dismissed) return; dismissed = true;
      overlay.classList.add('fading');
      setTimeout(()=>{ overlay.remove(); }, 650);
      localStorage.setItem('sparkit_guided_start_v1','1');
      if(reason==='timeout'){ toast('Drive → Explore the highway'); }
    }
    // Dismiss on movement input
    const movementKeys = new Set(['ArrowRight','ArrowLeft','KeyA','KeyD']);
    addEventListener('keydown', e=>{ if(movementKeys.has(e.code)){ dismiss('move'); } }, {once:false});
    // Dismiss on touch button press
    ['leftBtn','rightBtn'].forEach(id=>{ const b=document.getElementById(id); if(b) b.addEventListener('pointerdown', ()=>dismiss('move'), {once:true}); });
    // Auto dismiss after 9s if user does nothing
    setTimeout(()=>dismiss('timeout'), 9000);
  }catch{}
})();

/* ======= Collisions, Ghost, Fireworks, Photo Mode ======= */
function handleCollisions(){
  const p = state.player; const x = p.x;
  // obstacles removed
  // phase gate
  if(state.phase1Complete && !state.gate.triggered && Math.abs(x - state.gate.x) < 40){
    state.gate.triggered = true;
  if(!PREFERS_REDUCED_MOTION) launchFireworks();
    showOverlay('Phase 1 Unlocked 🎖️', `<div class="card"><h3>Gate Cleared!</h3><p>You unlocked Phase 1.</p><button id="medalOk" class="btn">Continue</button></div>`);
    setTimeout(()=>{
      const btn = document.getElementById('medalOk'); if(btn) btn.onclick = ()=> closePanel();
    }, 0);
  }
}

function buildGhostStops(){
  if(state.ghost.stops.length) return;
  // visit each branch then loop to start
  state.ghost.stops = [{x:140, wait:0}].concat(GAME_DATA.branches.map(b=>({x:b.x-20, wait:1.8}))).concat([{x: state.world.length-80, wait:2.0}]);
  state.ghost.stopIndex = 0;
}

function updateGhost(){
  buildGhostStops();
  const g = state.ghost; const dt = state.dt;
  if(g.pauseT > 0){ g.pauseT -= dt; return; }
  const target = g.stops[g.stopIndex]; if(!target) return;
  const dx = target.x - g.x; const speed = 120; // px/s
  const step = Math.sign(dx) * speed * dt;
  if(Math.abs(dx) <= Math.abs(step)){
    g.x = target.x; g.pauseT = target.wait; g.stopIndex = (g.stopIndex+1)%g.stops.length;
  } else {
    g.x += step; g.vx = step/dt;
  }
}

function drawGhost(){
  const g = state.ghost; const y = state.player.y; const x = g.x - state.camera.x;
  if(x<-120 || x>W+120) return;
  ctx.save(); ctx.globalAlpha = g.alpha;
  ctx.fillStyle = 'rgba(138,164,255,.8)'; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.roundRect(x-state.player.w/2, y-state.player.h/2, state.player.w, state.player.h, 8);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function launchFireworks(){
  // spawn bursts
  for(let i=0;i<8;i++){
    const cx = (state.gate.x - state.camera.x) + (Math.random()*120-60) + state.camera.x;
    const cy = H - 220 + (Math.random()*40-20);
    for(let j=0;j<30;j++){
      const a = Math.random()*Math.PI*2; const sp = 90 + Math.random()*120;
      state.fireworks.push({x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1});
    }
  }
}

function updateFireworks(){
  if(!state.fireworks.length) return;
  const dt = state.dt;
  const g = 220; // gravity
  state.fireworks.forEach(p=>{
    p.vy += g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= 0.9*dt;
  });
  state.fireworks = state.fireworks.filter(p=>p.life>0 && p.y < H+50);
}

function drawFireworks(){
  if(!state.fireworks.length) return;
  state.fireworks.forEach(p=>{
    const a = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = `rgba(124,248,200,${a})`;
    ctx.fillRect(p.x - state.camera.x, p.y, 2, 2);
  });
}

function triggerPhoto(){
  if(state.photo.pending) return;
  state.photo.pending = true;
  // briefly pause to stabilize frame
  const wasPaused = state.paused; state.paused = true;
  setTimeout(()=>{
    try{
      // overlay simple frame
      ctx.save();
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=3; ctx.strokeRect(12,12,W-24,H-24);
      ctx.fillStyle='rgba(10,16,32,.6)'; ctx.fillRect(14,H-46,W-28,32);
      ctx.fillStyle='#e6ecff'; ctx.font='14px ui-sans-serif'; ctx.textBaseline='middle';
  const tag = `${GAME_DATA.project.name} — ${state.dayNight.isNight?'Night Drive':'Day Cruise'}`;
  const br = state.lastBranchLabel ? ` • ${state.lastBranchLabel}` : '';
  ctx.fillText(tag + br, 24, H-30);
      ctx.restore();
      // export
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'axis25-photo.png'; a.click();
      toast('Saved photo 📸');
    }finally{
      state.photo.pending = false;
      state.paused = wasPaused;
    }
  }, 40);
}

/* ======= Reduced motion ======= */
const PREFERS_REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

/* ======= Robot Cursor Character ======= */
(()=>{
  const bot = document.getElementById('cursor-bot');
  if(!bot) return;
  const body = document.body;
  const closeBtn = document.getElementById('closePanel');
  const hat = bot.querySelector('.hard-hat');
  let tx=window.innerWidth/2, ty=window.innerHeight/2; // target
  let x=tx, y=ty; // current
  let vx=0, vy=0; // velocity for easing
  let lastMoveT = performance.now();
  let waveCooldown = 0;
  let mobileMode = false; // compact mode for touch devices
  let targetExpr = null; // {mode,cx,cy,radius}
  let activeMode = ''; // currently applied expression
  const followEase = 10; // higher = snappier
  const damp = 5.5;
  function loop(now){
    const dt = Math.min(.05,(now - (loop._last||now))/1000); loop._last = now;
    const ax = (tx - x)*followEase - vx*damp;
    const ay = (ty - y)*followEase - vy*damp;
    vx += ax*dt; vy += ay*dt;
    x += vx*dt; y += vy*dt;
    bot.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    // idle / active state
    if(now - lastMoveT < 280){ bot.classList.add('active'); } else { bot.classList.remove('active'); }
    if(waveCooldown>0) waveCooldown -= dt;

    // Expression activation strictly on arrival inside target inner bounds (rectangle hysteresis)
    if(targetExpr){
      const {mode, inner, outer} = targetExpr;
      const inInner = x >= inner.l && x <= inner.r && y >= inner.t && y <= inner.b;
      const inOuter = x >= outer.l && x <= outer.r && y >= outer.t && y <= outer.b;
      if(inInner && activeMode !== mode){
        activeMode = mode;
        bot.classList.add('transitioning');
        bot.setAttribute('data-mode', activeMode);
        clearTimeout(bot._t1); bot._t1 = setTimeout(()=> bot.classList.remove('transitioning'), 240);
      } else if(activeMode === mode && !inOuter){
        activeMode=''; bot.removeAttribute('data-mode');
      }
    } else if(activeMode){ activeMode=''; bot.removeAttribute('data-mode'); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener('pointermove', e=>{
    tx = e.clientX; ty = e.clientY; lastMoveT = performance.now();
  }, {passive:true});
  window.addEventListener('pointerdown', ()=>{
    if(waveCooldown<=0){ bot.classList.add('wave'); setTimeout(()=>bot.classList.remove('wave'), 650); waveCooldown = 2.2; }
  });
  // Accessibility: allow toggle with keyboard (press C) to show system cursor again
  window.addEventListener('keydown', e=>{ if(e.code==='KeyC'){ body.classList.toggle('bot-cursor'); if(!body.classList.contains('bot-cursor')){ bot.style.display='none'; } else { bot.style.display='block'; } } });
  // Interaction with overview liquid cards: slight lean towards nearest animated card
  const observeLiquid = new MutationObserver(()=>attach());
  observeLiquid.observe(document.getElementById('panel-content'), {childList:true, subtree:true});
  function attach(){
    const grid = document.querySelector('#panel-content .grid.overview'); if(!grid) return;
    grid.addEventListener('pointermove', e=>{
      const card = e.target.closest('.card'); if(!card) return;
      // small attract effect: nudge bot 6% toward card center
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width/2; const cy = r.top + r.height/2;
      tx += (cx - tx)*0.06; ty += (cy - ty)*0.06;
      // record desired expression ONLY; activation happens when robot enters inner bounds
  let mode = 'hero';
  if(card.classList.contains('problem')) mode='problem'; else
  if(card.classList.contains('solution')) mode='solution'; else
  if(card.classList.contains('impact')) mode='impact'; else
  if(card.classList.contains('phase')) mode='phase'; else
  if(card.classList.contains('hero')) mode='hero';
      const padInner = 6; // tighter to delay activation until real arrival
      const padOuter = 14; // looser to prevent rapid flicker on exit
      targetExpr = {
        mode,
        inner:{ l:r.left+padInner, t:r.top+padInner, r:r.right-padInner, b:r.bottom-padInner },
        outer:{ l:r.left-padOuter, t:r.top-padOuter, r:r.right+padOuter, b:r.bottom+padOuter }
      };
    }, {passive:true});
    grid.addEventListener('pointerleave', ()=>{
  targetExpr = null; // expression will clear once out of range
    });
  }
  attach();

  /* ===== Mobile / Touch Optimization ===== */
  function detectMobile(){
    const small = window.innerWidth < 760 || window.innerHeight < 600;
    const touchCap = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
    return small && touchCap;
  }
  function applyMobileMode(on){
    if(on === mobileMode) return;
    mobileMode = on;
    if(on){
      bot.classList.add('mobile');
      bot.style.width='64px'; bot.style.height='64px';
      // Park helper at bottom-right as an assist bubble until user touches screen
      tx = window.innerWidth - 70; ty = window.innerHeight - 80;
      x = tx; y = ty; bot.style.transform=`translate(${x}px,${y}px)`;
      bot.setAttribute('data-mode','hero');
      // Tap to toggle follow
      let following = false;
      bot.addEventListener('pointerdown', ()=>{
        following = !following;
        if(following){ waveCooldown = 0; lastMoveT = performance.now(); bot.classList.add('active'); }
      });
      window.addEventListener('pointermove', e=>{ if(following){ tx = e.clientX; ty = e.clientY; lastMoveT = performance.now(); } }, {passive:true});
    } else {
      bot.classList.remove('mobile');
      bot.style.width='54px'; bot.style.height='54px';
    }
  }
  applyMobileMode(detectMobile());
  window.addEventListener('resize', ()=> applyMobileMode(detectMobile()));

  // Observe body class changes to toggle hard-hat
  const classObserver = new MutationObserver(()=>{
    if(!hat) return;
    if(document.body.classList.contains('underground-mode')) hat.style.display='block'; else hat.style.display='none';
  });
  classObserver.observe(document.body,{attributes:true, attributeFilter:['class']});
  if(document.body.classList.contains('underground-mode')){ if(hat) hat.style.display='block'; }

  /* ===== Reaction to Close Button ===== */
  if(closeBtn){
    const updateCloseTarget = ()=>{
      const r = closeBtn.getBoundingClientRect();
      const padInner = 2; const padOuter = 12; // tight inner, generous outer for easy exit
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      targetExpr = {
        mode:'phase',
        inner:{ l:r.left+padInner, t:r.top+padInner, r:r.right-padInner, b:r.bottom-padInner },
        outer:{ l:r.left-padOuter, t:r.top-padOuter, r:r.right+padOuter, b:r.bottom+padOuter }
      };
      // Soft attraction toward center
      tx += (cx - tx)*0.25; ty += (cy - ty)*0.25;
    };
    closeBtn.addEventListener('pointerenter', updateCloseTarget);
    closeBtn.addEventListener('focus', updateCloseTarget);
    closeBtn.addEventListener('pointerleave', ()=>{ targetExpr = null; });
    closeBtn.addEventListener('blur', ()=>{ targetExpr = null; });
    closeBtn.addEventListener('pointerdown', ()=>{
      // On click animate impact; immediate override independent of arrival
      activeMode='impact'; bot.setAttribute('data-mode','impact');
      setTimeout(()=>{ if(activeMode==='impact'){ activeMode=''; bot.removeAttribute('data-mode'); targetExpr=null; } }, 520);
    });

    // Expanded hit area (logic only) without altering button size
    const HIT_PAD = 14;
    document.addEventListener('pointerup', e=>{
      if(!overlay || overlay.style.display==='none') return;
      const r = closeBtn.getBoundingClientRect();
      if(e.clientX >= r.left - HIT_PAD && e.clientX <= r.right + HIT_PAD && e.clientY >= r.top - HIT_PAD && e.clientY <= r.bottom + HIT_PAD){
        closeBtn.click();
      }
    });
  }
})();

// Fuel/Boost HUD removed

/* ======= Theme toggle ======= */
function toggleTheme(){ state.theme = state.theme==='neon'?'sunset':'neon'; toast(state.theme==='neon'?'Neon Colombo Night':'Galle Face Sunset'); }

/* ======= Deep links ======= */
window.addEventListener('hashchange', handleHash);
function handleHash(){
  const s = new URLSearchParams(location.hash.slice(1));
  const id = s.get('branch'); if(!id) return;
  const b = (GAME_DATA.branches||[]).find(br => br.type===id || br.label.toLowerCase()===id.toLowerCase());
  if(b) openBranch(b);
}
handleHash();

/* ======= Content loading with proper error handling ======= */
async function loadContent(){
  try{
    const res = await fetch('assets/content.json');
    if(!res.ok) {
      throw new Error(`Failed to load content: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    GAME_DATA = data;
    console.info('Content loaded successfully');
  }catch(e){
    console.warn('Failed to load content.json:', e);
    // Fallback to default data already in GAME_DATA
    toast('⚠️ Using offline content');
  }
  // Rebuild text route and re-handle deep links with new content
  buildTextRoute();
  handleHash();
}
loadContent();

/* ======= Screen-reader route ======= */
function buildTextRoute(){
  const container = document.getElementById('textRoute'); if(!container) return;
  const div = container.querySelector('div'); if(!div) return;
  div.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Project Highway — Text Route'; title.style.position='static';
  div.appendChild(title);
  const ul = document.createElement('ul');
  (GAME_DATA.branches||[]).forEach(b=>{
    const li = document.createElement('li');
    const btn = document.createElement('button'); btn.textContent = b.label + ' — open'; btn.className='btn small';
    btn.onclick = ()=> openBranch(b);
    li.appendChild(btn); ul.appendChild(li);
  });
  div.appendChild(ul);
}
setTimeout(buildTextRoute, 300);

/* ======= Liquid Overview FX & Panel Car ======= */
function enhanceOverviewLiquidEffects(){
  const panel = document.querySelector('#panel-content .grid.overview');
  if(!panel) return;
  panel.classList.add('liquid-enabled');
  
  // Clean any previous FX and event listeners
  if(state.liquidFX){
    cancelAnimationFrame(state.liquidFX.raf);
    if(state.liquidFX.interval) clearInterval(state.liquidFX.interval);
    // Remove previous event listeners
    if(state.liquidFX.listeners) {
      state.liquidFX.listeners.forEach(({element, event, handler}) => {
        element.removeEventListener(event, handler);
      });
    }
  }
  
  const cards = [...panel.querySelectorAll('.card')];
  const physics = cards.map(el=>({el, x:0,y:0,vx:0,vy:0, tx:0,ty:0}));
  const listeners = []; // Track event listeners for cleanup
  let lastT = performance.now();
  let lastMX = null, lastMY = null;
  
  function frame(now){
    const dt = Math.min(.05,(now-lastT)/1000); lastT = now;
    physics.forEach(p=>{
      const k = 6, d = 4; // spring & damping
      const ax = (p.tx - p.x)*k - p.vx*d;
      const ay = (p.ty - p.y)*k - p.vy*d;
      p.vx += ax*dt; p.vy += ay*dt;
      p.x += p.vx*dt; p.y += p.vy*dt;
      // gentle friction
      p.vx *= 0.995; p.vy *= 0.995;
      p.el.style.setProperty('--dx', p.x.toFixed(3)+'px');
      p.el.style.setProperty('--dy', p.y.toFixed(3)+'px');
      // subtle sheen parallax
      p.el.style.setProperty('--glowX', (p.x*0.6).toFixed(2)+'px');
      p.el.style.setProperty('--glowY', (p.y*0.6).toFixed(2)+'px');
      // tilt based on displacement
      p.el.style.setProperty('--rotX', (p.y*-0.4).toFixed(2)+'deg');
      p.el.style.setProperty('--rotY', (p.x*0.4).toFixed(2)+'deg');
    });
    if(state.liquidFX && state.liquidFX.raf) {
      state.liquidFX.raf = requestAnimationFrame(frame);
    }
  }
  
  state.liquidFX = {physics, raf: requestAnimationFrame(frame), interval:0, listeners};
  const panelEl = document.querySelector('.panel');
  if(!panelEl) return;
  
  // Pointer influence
  const pointerMoveHandler = (e) => {
    const rect = panel.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let vx = 0, vy = 0;
    if(lastMX!=null){ vx = mx - lastMX; vy = my - lastMY; }
    lastMX = mx; lastMY = my;
    physics.forEach(p=>{
      const r = p.el.getBoundingClientRect();
      const cx = r.left + r.width/2 - rect.left;
      const cy = r.top + r.height/2 - rect.top;
      const dx = (mx - cx)/r.width;
      const dy = (my - cy)/r.height;
      const dist = Math.hypot(dx,dy);
      const influence = Math.max(0, 1 - dist*1.05);
      // Cursor velocity gives extra impulse (fluid feel)
      p.tx = dx*16*influence;
      p.ty = dy*16*influence;
      p.vx += vx*0.04*influence;
      p.vy += vy*0.04*influence;
    });
  };
  
  const pointerLeaveHandler = () => {
    physics.forEach(p=>{ p.tx = 0; p.ty = 0; });
  };
  
  const pointerDownHandler = (e) => {
    // ripple impulse
    const rect = panel.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    physics.forEach(p=>{
      const r = p.el.getBoundingClientRect();
      const cx = r.left + r.width/2 - rect.left;
      const cy = r.top + r.height/2 - rect.top;
      const dx = (cx - mx); const dy = (cy - my);
      const dist = Math.hypot(dx,dy);
      const fall = Math.max(0, 1 - dist/420);
      p.vx += (dx/dist||0)*-4*fall;
      p.vy += (dy/dist||0)*-4*fall;
    });
  };
  
  // Scroll influence
  let lastScroll = panelEl.scrollTop;
  const scrollHandler = () => {
    const s = panelEl.scrollTop; const delta = s - lastScroll; lastScroll = s;
    physics.forEach(p=>{ p.vy += delta*0.11; p.vx += (Math.random()*2-1)*0.3; });
  };
  
  // Add event listeners and track them
  panel.addEventListener('pointermove', pointerMoveHandler, {passive:true});
  panel.addEventListener('pointerleave', pointerLeaveHandler);
  panel.addEventListener('pointerdown', pointerDownHandler);
  panelEl.addEventListener('scroll', scrollHandler, {passive:true});
  
  listeners.push(
    {element: panel, event: 'pointermove', handler: pointerMoveHandler},
    {element: panel, event: 'pointerleave', handler: pointerLeaveHandler},
    {element: panel, event: 'pointerdown', handler: pointerDownHandler},
    {element: panelEl, event: 'scroll', handler: scrollHandler}
  );
  
  // Random drifting impulses
  state.liquidFX.interval = setInterval(()=>{
    if(!state.liquidFX) return; // Safety check
    physics.forEach(p=>{ if(Math.random()<0.18){ p.vx += (Math.random()*2-1)*2.4; p.vy += (Math.random()*2-1)*2.4; }});
  }, 2400);
}

// Extend closePanel to cleanup FX
const _closePanelOrig = closePanel;
closePanel = function(){
  try{
    if(state.liquidFX){
      cancelAnimationFrame(state.liquidFX.raf);
      if(state.liquidFX.interval) clearInterval(state.liquidFX.interval);
      // Clean up event listeners
      if(state.liquidFX.listeners) {
        state.liquidFX.listeners.forEach(({element, event, handler}) => {
          element.removeEventListener(event, handler);
        });
      }
      delete state.liquidFX;
    }
  }catch(e){ console.warn('Error cleaning up liquid FX:', e); }
  _closePanelOrig();
};

/* ================= Mobile / Responsive Enhancements (Added) ================= */
(function mobileEnhancements(){
  const orientationOverlay = document.getElementById('orientation-overlay');
  const continueBtn = document.getElementById('oo-continue');
  let orientationBypassed = false;
  function shouldShowOrientation(){
    if(orientationBypassed) return false;
    const w = window.innerWidth; const h = window.innerHeight;
    const portrait = h > w; const small = Math.min(w,h) < 640;
    return portrait && small;
  }
  function updateOrientationOverlay(){
    if(!orientationOverlay) return;
    const show = shouldShowOrientation();
    orientationOverlay.setAttribute('aria-hidden', String(!show));
    if(show) orientationOverlay.classList.add('active'); else orientationOverlay.classList.remove('active');
  }
  if(continueBtn){ continueBtn.addEventListener('click', ()=>{ orientationBypassed = true; updateOrientationOverlay(); }); }
  window.addEventListener('resize', updateOrientationOverlay);
  window.addEventListener('orientationchange', updateOrientationOverlay);
  setTimeout(updateOrientationOverlay, 400);

  // Adaptive DPR & low-power heuristic
  let dprDrop=false; let perfSamples=[]; let lastPerfT=performance.now();
  function perfProbe(){
    const now=performance.now(); const ft=now-lastPerfT; lastPerfT=now; perfSamples.push(ft);
    if(perfSamples.length>=120){
      const avg=perfSamples.reduce((a,b)=>a+b,0)/perfSamples.length;
      if(!dprDrop && avg>22){ document.body.classList.add('low-power'); dprDrop=true; resizeCanvasAdaptive(1.25); }
      else if(dprDrop && avg<17){ document.body.classList.remove('low-power'); dprDrop=false; resizeCanvasAdaptive(2); }
      perfSamples=[];
    }
    requestAnimationFrame(perfProbe);
  }
  requestAnimationFrame(perfProbe);
  function resizeCanvasAdaptive(maxDpr){
    const vw=window.visualViewport?.width||window.innerWidth; const vh=window.visualViewport?.height||window.innerHeight;
    canvas.style.width=vw+'px'; canvas.style.height=vh+'px';
    const dpr=Math.max(1, Math.min(maxDpr, window.devicePixelRatio||1));
    canvas.width=Math.round(vw*dpr); canvas.height=Math.round(vh*dpr);
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr); W=vw; H=vh; positionPlayerOnRoad();
  }

  // Gesture swipe
  let tSX=0,tSY=0,swiping=false; 
  window.addEventListener('touchstart',e=>{ if(e.touches.length===1){ tSX=e.touches[0].clientX; tSY=e.touches[0].clientY; swiping=true; } },{passive:true});
  window.addEventListener('touchmove',e=>{ if(!swiping) return; const dx=e.touches[0].clientX-tSX; const dy=e.touches[0].clientY-tSY; if(state.mode==='road'){ if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ state.player.vx += (dx>0?80:-80); swiping=false; } } else if(state.mode==='timeline'){ if(Math.abs(dy)>40 && Math.abs(dy)>Math.abs(dx)){ state.player.vy += (dy>0?80:-80); swiping=false; } } }, {passive:true});
  window.addEventListener('touchend',()=>{ swiping=false; }, {passive:true});

  // Inactivity fade for touch controls
  const touchWrap=document.getElementById('touch'); let lastAct=performance.now();
  ['pointerdown','touchstart','keydown'].forEach(ev=> window.addEventListener(ev,()=> lastAct=performance.now()));
  function fadeLoop(){ const now=performance.now(); if(touchWrap){ touchWrap.style.transition='opacity .4s ease'; touchWrap.style.opacity = (now-lastAct>6000)?'0.15':'1'; } requestAnimationFrame(fadeLoop);} requestAnimationFrame(fadeLoop);

  // Debounced resize (replace original listeners)
  const origResize=resize; let rT=null; function deb(){ if(rT) clearTimeout(rT); rT=setTimeout(()=> origResize(),140);} 
  window.removeEventListener('resize', resize); window.addEventListener('resize', deb);
  if('visualViewport' in window){ window.visualViewport.removeEventListener('resize', resize); window.visualViewport.addEventListener('resize', deb); }

  // Lightning throttle in low-power
  const _origLightning=triggerLightning; triggerLightning=function(){ if(document.body.classList.contains('low-power') && Math.random()<0.5){ scheduleLightningStrike(9000+Math.random()*6000); return;} _origLightning(); };
})();
// ================= End Mobile Enhancements =================
