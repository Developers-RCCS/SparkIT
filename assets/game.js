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
      id: 3, title: "SparkIT Fusion",
      summary: "Advanced fusion of technology and innovation - Coming Soon! This phase will feature cutting-edge workshops and collaborative projects.",
      open: false,
      locked: true
    }
  ],
  branches: [
    { x: 300,  label:"Overview", type:"about" },
    { x: 700,  label:"Phase 1 — Register", type:"phase1" },
    { x: 1150, label:"SparkIT Fusion", type:"phase3" },
    { x: 1600, label:"FAQ", type:"faq" },
    { x: 2000, label:"Contact", type:"contact" }
  ],
  branchDescriptions: {
    "Overview": "Learn about the SparkIT initiative and our mission to ignite ICT literacy in Sri Lanka",
    "Phase 1 — Register": "Join our session series designed to uplift awareness across different areas of ICT.",
    "SparkIT Fusion": "A community-driven effort bringing ICT knowledge and resources to schools across Sri Lanka",
    "FAQ": "Find answers to common questions about SparkIT and the competition process",
    "Contact": "Get in touch with our team for support, partnerships, or more information"
  },
  milestones: [
    {"y":160, "key":"registration", "title":"Registration", "text":"Complete your Spark Flash registration."},
    {"y":560, "key":"workshop1", "title":"Robotics and Automations", "text":"Workshop 1 — Robotics and Automations: design, build & program autonomous systems."},
    {"y":960, "key":"workshop2", "title":"Immersive Technologies", "text":"Workshop 2 — Immersive Technologies: VR, AR & interactive digital experiences."},
    {"y":1360, "key":"workshop3", "title":"Programming", "text":"Workshop 3 — Programming: algorithms, team projects & mentoring."},
    {"y":1760, "key":"competitions", "title":"Competitions", "text":"Pitch, demo & compete for recognition."}
  ],
  undergroundDescriptions: {
    "Robotics and Automations": "Navigating Opportunities in Robotics and Smart Automation",
    "Immersive Technologies": "Exploring Career Pathways in Immersive Technology",
    "Programming": "Workshop 3 — Programming: algorithms, team projects & mentoring",
    "Competitions": "Pitch, demo & compete for recognition and prizes"
  },
  faq: [
    { question: "Who can join this?", answer: "This project is open to students enthusiastic about ICT and eager to enhance their digital skills." },
    { question: "Is SparkIt Flash held online or physical?", answer: "SparkIt Flash is held online." },
    { question: "Is there a cost to join the program?", answer: "Participation is free" },
    { question: "Do I need any prior computer knowledge to join?", answer: "No The sessions suit all levels—from beginners to advanced learners" }
  ]
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width, H = canvas.height;

// Global image references
let sparkItLogoImage = null;

// Global audio context and sound system
let audioContext = null;
let soundEnabled = true;

// Sound effect configurations for fun, game-like audio
const SOUND_EFFECTS = {
  walle_move: { freq: 220, duration: 0.08, type: 'sine', volume: 0.15, envelope: 'bounce' },
  walle_beep: { freq: 440, duration: 0.15, type: 'sine', volume: 0.2, envelope: 'cheerful' },
  walle_chirp: { freq: 660, duration: 0.12, type: 'sine', volume: 0.18, envelope: 'happy' },
  walle_drill: { freq: 180, duration: 0.3, type: 'triangle', volume: 0.12, envelope: 'working' },
  walle_joy: { freq: 523, duration: 0.25, type: 'sine', volume: 0.2, envelope: 'celebration' },
  walle_curious: { freq: 349, duration: 0.2, type: 'sine', volume: 0.15, envelope: 'wonder' },
  eve_scan: { freq: 880, duration: 0.08, type: 'sine', volume: 0.12, envelope: 'sparkle' },
  branch_hover: { freq: 293, duration: 0.08, type: 'sine', volume: 0.1, envelope: 'gentle' },
  branch_click: { freq: 392, duration: 0.15, type: 'sine', volume: 0.15, envelope: 'success' },
  ui_error: { freq: 220, duration: 0.2, type: 'sine', volume: 0.15, envelope: 'gentle_error' },
  lightning: { freq: 200, duration: 0.25, type: 'triangle', volume: 0.12, envelope: 'magic' },
  timeline_transition: { freq: 523, duration: 0.4, type: 'sine', volume: 0.1, envelope: 'transition' }
};

// Initialize audio context
function initAudioContext() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    soundEnabled = false;
  }
}

// Play fun, game-like sound effects
function playSound(soundType, pitchVariation = 0) {
  if (!soundEnabled || !audioContext || !SOUND_EFFECTS[soundType]) return;
  
  try {
    // Resume audio context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const config = SOUND_EFFECTS[soundType];
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq + pitchVariation, audioContext.currentTime);
    
    // Create fun, game-like envelopes based on sound type
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    
    switch(config.envelope) {
      case 'bounce':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(config.volume * 0.7, now + 0.04);
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'cheerful':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.2 + pitchVariation, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'happy':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
        oscillator.frequency.setValueAtTime(config.freq * 1.1 + pitchVariation, now + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'working':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.02);
        gainNode.gain.setValueAtTime(config.volume * 0.9, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'celebration':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.5 + pitchVariation, now + 0.1);
        oscillator.frequency.linearRampToValueAtTime(config.freq + pitchVariation, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'wonder':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.02);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.3 + pitchVariation, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'sparkle':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.005);
        oscillator.frequency.setValueAtTime(config.freq * 1.2 + pitchVariation, now + 0.02);
        oscillator.frequency.setValueAtTime(config.freq * 1.4 + pitchVariation, now + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'gentle':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'success':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.25 + pitchVariation, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'gentle_error':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.03);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 0.9 + pitchVariation, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'magic':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.02);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.6 + pitchVariation, now + 0.15);
        gainNode.gain.linearRampToValueAtTime(0.001, now + config.duration);
        break;
      case 'transition':
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.05);
        oscillator.frequency.linearRampToValueAtTime(config.freq * 1.3 + pitchVariation, now + 0.2);
        oscillator.frequency.linearRampToValueAtTime(config.freq + pitchVariation, now + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
        break;
      default:
        // Default gentle envelope
        gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
    }
    
    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + config.duration);
    
  } catch (e) {
    console.warn('Error playing sound:', e);
  }
}

// Special compound sound effects
function playWalleExpression(emotion) {
  switch(emotion) {
    case 'happy':
      playSound('walle_chirp');
      setTimeout(() => playSound('walle_beep', 100), 150);
      break;
    case 'curious':
      playSound('walle_curious');
      setTimeout(() => playSound('walle_beep', -50), 200);
      break;
    case 'excited':
      playSound('walle_joy');
      setTimeout(() => playSound('walle_chirp', 50), 100);
      setTimeout(() => playSound('walle_beep', 200), 250);
      break;
    case 'working':
      playSound('walle_move');
      break;
  }
}

// Load SparkIT logo
function loadSparkItLogo() {
  sparkItLogoImage = new Image();
  sparkItLogoImage.src = 'assets/Logo-SparkIt.png';
}

// Initialize logo loading and audio
loadSparkItLogo();
initAudioContext();

const state = {
  // player physics (px units in CSS pixels; velocities are px/s)
  player:{
    x:120, y:H-160, w:80, h:60, // Updated height for WALL-E proportions (was h:36)
    vx:0, ax:0,
    vy:0, ay:0,
    accel: 600,          // px/s^2
    friction: 380,       // px/s^2
    maxSpeed: 420,       // px/s
    trailParticles: []   // adaptive energy trail particles
  },
  
  // WALL-E character state
  walle: {
    eyeBlink: { timer: 0, isBlinking: false },
    armExtension: { left: 0, right: 0 }, // 0-1 extension amount
    headTilt: 0, // -15 to +15 degrees
    curiosityMode: false,
    antennaStatus: 0.3 // LED brightness 0-1
  },/* ======= end content ======= */

  camera:{x:0, y:0},
  mode:'road', // 'road' | 'timeline'
  timeline:{
    active:false,
    length: 2000,
    milestones:[
  { y:160, key:'registration', title:'Registration', text:'Complete your Spark Flash registration.' },
  { y:560, key:'workshop1', title:'Robotics and Automations', text:'Workshop 1 — Robotics and Automations: design, build & program autonomous systems.' },
  { y:960, key:'workshop2', title:'Immersive Technologies', text:'Workshop 2 — Immersive Technologies: VR, AR & interactive digital experiences.' },
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
  // trash pile for WALL-E collision
  trashPile: {
    x: 500, // positioned between overview (300) and phase1 (700)
    y: H - 320, // on the road surface
    width: 240, // increased from 80
    height: 200,  // increased from 60
    image: null, // will be loaded
    collided: false
  },
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
  // WALL-E digging sequence
  worldTransition: {
    active: false,
    phase: 'none', // 'none' | 'preparing' | 'digging' | 'descending'
    progress: 0,   // Progress within the current phase (0 to 1)
    startTime: 0,
    cameraShake: 0,
    roadCrackParticles: [],
    drillSparks: [],
    thrusterFlames: [],
    soundEffects: { drilling: false, transformation: false }
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
    'assets/Logo-SparkIt.png','assets/rc1.png','assets/rc2.png','assets/kghs1.png','assets/kghs2.png','assets/content.json','assets/trash-pile.png'
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
  
  // Play lightning sound effect
  playSound('lightning', Math.random() * 100 - 50);
  
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

// WALL-E Digging Sequence
function startWorldTransition() {
  const wt = state.worldTransition;
  if (wt.active) return; // Prevent re-triggering

  // Play drilling preparation sound
  playWalleExpression('working');
  setTimeout(() => playSound('walle_drill'), 500);

  wt.active = true;
  wt.phase = 'preparing';
  wt.startTime = performance.now();
  wt.progress = 0;
  wt.cameraShake = 8; // Gentle initial preparation
  wt.roadCrackParticles = [];
  wt.drillSparks = [];
  wt.thrusterFlames = [];
  
  state.paused = true; // Take control from the player
  
  // Audio feedback
  toast('🤖� WALL-E preparing to dig...');
}

function updateWorldTransition() {
  const wt = state.worldTransition;
  if (!wt.active) return;
  
  const elapsed = performance.now() - wt.startTime;
  const dt = state.dt;
  
  // Phase 1: WALL-E prepares to dig (lasts 1 second)
  if (wt.phase === 'preparing') {
    wt.progress = Math.min(1, elapsed / 1000);
    wt.cameraShake = Math.max(0, 5 * (1 - wt.progress * 0.5)); // Light shake as WALL-E gets ready
    
    // Gentle preparation particles (dust being kicked up)
    if (Math.random() > 0.7) {
      wt.roadCrackParticles.push({
        x: state.player.x + (Math.random() * 80 - 40),
        y: H - 120 + Math.random() * 10,
        vy: -Math.random() * 50 - 20,
        vx: (Math.random() - 0.5) * 40,
        life: 0.8 + Math.random() * 0.4,
        size: 1 + Math.random() * 3,
        spin: (Math.random() - 0.5) * 5
      });
    }
    
    if (wt.progress >= 1) {
      wt.phase = 'digging';
      wt.startTime = performance.now();
      wt.progress = 0;
      wt.cameraShake = 15; // Strong shake for digging
      toast('⛏️🤖 WALL-E is digging...');
    }
  }
  
  // Phase 2: WALL-E digs the hole (lasts 2 seconds)
  else if (wt.phase === 'digging') {
    wt.progress = Math.min(1, elapsed / 2000);
    wt.cameraShake = Math.max(0, 15 * (1 - wt.progress * 0.6)); // Strong digging vibration
    
    // Intense drilling sparks and debris
    if (Math.random() > 0.4) {
      wt.drillSparks.push({
        x: state.player.x + (Math.random() * 60 - 30),
        y: H - 100,
        vy: -Math.random() * 250 - 80,
        vx: (Math.random() - 0.5) * 120,
        life: 0.6 + Math.random() * 0.4,
        brightness: 0.9 + Math.random() * 0.1
      });
    }
    
    // Dirt and rock debris flying out
    if (Math.random() > 0.5) {
      wt.roadCrackParticles.push({
        x: state.player.x + (Math.random() * 100 - 50),
        y: H - 110 + Math.random() * 15,
        vy: -Math.random() * 180 - 60,
        vx: (Math.random() - 0.5) * 140,
        life: 1.2 + Math.random() * 0.6,
        size: 2 + Math.random() * 5,
        spin: (Math.random() - 0.5) * 8
      });
    }
    
    if (wt.progress >= 1) {
      wt.phase = 'descending';
      wt.startTime = performance.now();
      wt.progress = 0;
      wt.cameraShake = 6; // Light shake for descent
      state.timeline.roadReturnY = state.player.y; // Save for later
      toast('⬇️🤖 WALL-E descending into the underground...');
    }
  }
  
  // Phase 3: WALL-E descends into the underground (lasts 2.5 seconds)
  else if (wt.phase === 'descending') {
    wt.progress = Math.min(1, elapsed / 2500);
    wt.cameraShake = Math.max(0, 8 * (1 - wt.progress));
    
    // Move the player object itself with easing
    const startY = state.timeline.roadReturnY;
    const endY = H + 200; // Descend off-screen
    const easedProgress = 1 - Math.pow(1 - wt.progress, 3); // Ease-out cubic
    state.player.y = startY + (endY - startY) * easedProgress;
    
    // Thruster flames and debris
    if (Math.random() > 0.4) {
      wt.thrusterFlames.push({
        x: state.player.x + (Math.random() * 60 - 30),
        y: state.player.y + 50,
        vy: Math.random() * 100 + 50,
        vx: (Math.random() - 0.5) * 40,
        life: 0.4 + Math.random() * 0.3,
        size: 4 + Math.random() * 8
      });
    }
    
    // Rock debris falling past
    if (Math.random() > 0.8) {
      wt.roadCrackParticles.push({
        x: Math.random() * W,
        y: -20,
        vy: Math.random() * 200 + 100,
        vx: (Math.random() - 0.5) * 50,
        life: 3.0,
        size: 2 + Math.random() * 4,
        spin: (Math.random() - 0.5) * 8
      });
    }
    
    if (wt.progress >= 1) {
      // Transition is complete!
      wt.active = false;
      wt.phase = 'none';
      wt.cameraShake = 0;
      state.paused = false;
      // Clear all particle arrays
      wt.roadCrackParticles = [];
      wt.drillSparks = [];
      wt.thrusterFlames = [];
      // Now call the original function to set up the timeline state
      enterTimeline(); 
    }
  }

  // Update all particle systems
  wt.roadCrackParticles.forEach(p => {
    p.life -= dt;
    p.vy += 350 * dt; // Gravity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.spin += p.spin * dt;
  });
  wt.roadCrackParticles = wt.roadCrackParticles.filter(p => p.life > 0 && p.y < H + 100);

  wt.drillSparks.forEach(p => {
    p.life -= dt;
    p.vy += 180 * dt; // Light gravity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  });
  wt.drillSparks = wt.drillSparks.filter(p => p.life > 0);

  wt.thrusterFlames.forEach(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.size *= 0.95; // Shrink over time
  });
  wt.thrusterFlames = wt.thrusterFlames.filter(p => p.life > 0);
}

function drawWorldTransition() {
  const wt = state.worldTransition;
  if (!wt.active) return;

  const p = state.player;
  const playerScreenX = p.x - state.camera.x;
  const roadY = H - 120;

  ctx.save();

  // Draw the digging hole and effects
  if (wt.phase === 'digging' || wt.phase === 'descending') {
    const maxHoleWidth = 120; // Smaller, more WALL-E sized hole
    const holeWidth = maxHoleWidth * Math.pow(wt.progress, 0.6); // Ease-out
    
    // Left side of the road (intact)
    ctx.save();
    ctx.beginPath();
    ctx.rect(-state.camera.x, roadY, playerScreenX - holeWidth / 2 + state.camera.x, 80);
    ctx.clip();
    
    // Draw road normally in this region
    const rg = ctx.createLinearGradient(0,roadY,0,roadY+80);
    rg.addColorStop(0,'#1a233b'); rg.addColorStop(1,'#0d1427');
    ctx.fillStyle = rg;
    ctx.fillRect(-state.camera.x, roadY, state.world.length+W, 80);
    
    ctx.restore();
    
    // Right side of the road (intact)
    ctx.save();
    ctx.beginPath();
    ctx.rect(playerScreenX + holeWidth / 2, roadY, state.world.length + W, 80);
    ctx.clip();
    
    // Draw road normally in this region
    ctx.fillStyle = rg;
    ctx.fillRect(-state.camera.x, roadY, state.world.length+W, 80);
    
    ctx.restore();
    
    // The dug hole
    if(wt.progress > 0) {
      const holeGrad = ctx.createLinearGradient(playerScreenX, roadY, playerScreenX, roadY + 80);
      holeGrad.addColorStop(0, `rgba(60, 40, 20, ${0.9 * wt.progress})`);  // Dark brown earth
      holeGrad.addColorStop(0.5, `rgba(40, 25, 15, ${0.8 * wt.progress})`); // Darker earth
      holeGrad.addColorStop(1, `rgba(20, 15, 10, ${0.9 * wt.progress})`);   // Very dark depths
      
      ctx.fillStyle = holeGrad;
      ctx.fillRect(playerScreenX - holeWidth / 2, roadY, holeWidth, 80);
      
      // Dirt particles floating up from hole
      if (wt.phase === 'digging' && wt.progress > 0.2) {
        for (let i = 0; i < 3; i++) {
          const dirtX = playerScreenX + (Math.random() - 0.5) * holeWidth * 0.6;
          const dirtY = roadY + 60 - Math.sin(performance.now() * 0.003 + i) * 40;
          const dirtAlpha = (Math.sin(performance.now() * 0.002 + i * 0.7) + 1) * 0.2 * wt.progress;
          
          ctx.fillStyle = `rgba(139, 69, 19, ${dirtAlpha})`; // Saddle brown dirt
          ctx.beginPath();
          ctx.arc(dirtX, dirtY, 2 + Math.sin(performance.now() * 0.008 + i) * 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  
  // Draw crack particles (debris)
  wt.roadCrackParticles.forEach(part => {
    const alpha = Math.min(1, part.life / 1.5);
    ctx.save();
    ctx.translate(part.x - state.camera.x, part.y);
    ctx.rotate(part.spin * part.life);
    ctx.fillStyle = `rgba(60, 70, 80, ${alpha})`;
    ctx.fillRect(-part.size/2, -part.size/2, part.size, part.size);
    ctx.restore();
  });
  
  // Draw energy sparks
  wt.drillSparks.forEach(spark => {
    const alpha = Math.min(1, spark.life / 0.8) * spark.brightness;
    ctx.fillStyle = `rgba(124, 248, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(spark.x - state.camera.x, spark.y, 2 + alpha * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Spark trail
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spark.x - state.camera.x, spark.y);
    ctx.lineTo(spark.x - state.camera.x - spark.vx * 0.02, spark.y - spark.vy * 0.02);
    ctx.stroke();
  });
  
  // Draw thruster flames
  wt.thrusterFlames.forEach(flame => {
    const alpha = Math.min(1, flame.life / 0.4);
    const gradient = ctx.createRadialGradient(
      flame.x - state.camera.x, flame.y, 0,
      flame.x - state.camera.x, flame.y, flame.size
    );
    gradient.addColorStop(0, `rgba(255, 200, 80, ${alpha})`);
    gradient.addColorStop(0.7, `rgba(255, 100, 50, ${alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(255, 50, 20, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(flame.x - state.camera.x, flame.y, flame.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw WALL-E with digging animation
  const walleScreenY = (wt.phase === 'descending') ? (p.y - state.camera.y) : (p.y);
  
  ctx.save();
  ctx.translate(playerScreenX, walleScreenY);
  
  let drillProgress = 0;
  if (wt.phase === 'preparing') drillProgress = wt.progress * 0.3; // Slight drill extension during prep
  if (wt.phase === 'digging') drillProgress = 0.3 + (wt.progress * 0.7); // Full drill during digging
  if (wt.phase === 'descending') drillProgress = 1;

  // Draw WALL-E body with metallic texture
  const grad = ctx.createLinearGradient(-p.w/2,-p.h/2,p.w/2,p.h/2);
  grad.addColorStop(0,'#d4d4d4'); grad.addColorStop(0.5,'#a8a8a8'); grad.addColorStop(1,'#8c8c8c');
  ctx.fillStyle = grad; 
  ctx.strokeStyle='rgba(0,0,0,.4)'; 
  ctx.lineWidth=2;
  
  // WALL-E main body - boxy shape
  ctx.beginPath(); 
  ctx.roundRect(-p.w/2, -p.h/2, p.w, p.h, 4); 
  ctx.fill(); 
  ctx.stroke();

  // WALL-E's front panel/chest
  ctx.fillStyle='#a8a8a8'; // Lighter metallic panel
  ctx.fillRect(-p.w/2+8, -p.h/2+8, p.w-16, p.h-16);
  
  // Central control panel indicator
  ctx.fillStyle='#666';
  ctx.fillRect(-4, -p.h/2 + 18, 8, 6);
  
  // WALL-E's eyes
  ctx.fillStyle='#000';
  const eyeY = -p.h/2 + 12;
  ctx.fillRect(-p.w/4-4, eyeY, 8, 6); // Left eye
  ctx.fillRect(p.w/4-4, eyeY, 8, 6);  // Right eye
  
  // Eye glow during digging
  if (drillProgress > 0.3) {
    ctx.fillStyle=`rgba(124, 248, 200, ${drillProgress})`;
    ctx.fillRect(-p.w/4-3, eyeY+1, 6, 4);
    ctx.fillRect(p.w/4-3, eyeY+1, 6, 4);
  }

  // WALL-E's tracks/treads
  ctx.fillStyle='#666';
  ctx.beginPath(); 
  ctx.arc(-p.w/3, p.h/2, 8, 0, Math.PI*2); 
  ctx.arc(p.w/3, p.h/2, 8, 0, Math.PI*2); 
  ctx.fill();

  // Drill attachment extending during animation
  if (drillProgress > 0) {
    const drillLength = 40 * drillProgress;
    const drillGlow = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
    
    ctx.save();
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8 * drillProgress;
    
    // Drill body
    ctx.fillStyle = `rgba(220, 220, 220, ${drillGlow})`;
    ctx.fillRect(-4, p.h/2 + 5, 8, drillLength);
    
    // Drill tip with spinning effect
    const spinAngle = performance.now() * 0.02 * drillProgress;
    ctx.save();
    ctx.translate(0, p.h/2 + 5 + drillLength);
    ctx.rotate(spinAngle);
    
    ctx.fillStyle = `rgba(255, 170, 0, ${drillGlow})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 8);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();
    
    // Drill sparks during digging
    if (wt.phase === 'digging') {
      for(let i = 0; i < 3; i++) {
        const sparkAngle = spinAngle + (i * Math.PI * 2 / 3);
        const sparkX = Math.cos(sparkAngle) * 8;
        const sparkY = Math.sin(sparkAngle) * 8;
        ctx.fillStyle = `rgba(255, 200, 100, ${Math.random() * drillGlow})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
    ctx.restore();
  }

  // Side thrusters during descent
  if (wt.phase === 'descending') {
    const thrusterGlow = Math.sin(performance.now() * 0.02) * 0.3 + 0.7;
    
    // Left thruster
    ctx.fillStyle = `rgba(255, 100, 50, ${thrusterGlow})`;
    ctx.beginPath();
    ctx.ellipse(-p.w/2 - 10, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Right thruster
    ctx.beginPath();
    ctx.ellipse(p.w/2 + 10, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main thruster beneath
    ctx.fillStyle = `rgba(255, 150, 80, ${thrusterGlow})`;
    ctx.beginPath();
    ctx.ellipse(0, p.h/2 + 15, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
  ctx.restore();
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
  cursorEve: null,
  toastsContainer: null,
  
  getCursorEve() {
    if (!this.cursorEve || !document.contains(this.cursorEve)) {
      this.cursorEve = document.getElementById('cursor-eve');
    }
    return this.cursorEve;
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
function isMobileDevice(){ return (('ontouchstart' in window) || navigator.maxTouchPoints>0) && Math.min(window.innerWidth, window.innerHeight) < 900; }
function toast(msg){
  // Suppress random/informational toasts on mobile for cleaner UX
  if(isMobileDevice()){
    // Allow only explicit form success/error messages (contain ✅ or ⚠️) or critical events
    const allow = /✅|⚠️|error|saved|registered|access/i.test(String(msg||''));
    if(!allow) return;
  }
  const t=document.createElement('div');t.className='toast';t.textContent=msg;const toastsEl = domCache.getToastsContainer(); if(toastsEl) toastsEl.appendChild(t);setTimeout(()=>t.remove(),2600)
}
// Extended toast to ping robot cursor to wave / deliver
const _origToast = toast; // preserve original for fallback (already assigned above)
toast = function(msg){
  _origToast(msg);
  try{
    const eve = domCache.getCursorEve();
    if(eve){
      eve.classList.add('wave');
      // brief delivery expression unless already in thrilled
      if(eve.getAttribute('data-mode')!=='thrilled'){
        eve.setAttribute('data-mode','impact');
        setTimeout(()=>{
          // only clear if still impact
          if(eve.getAttribute('data-mode')==='impact') eve.removeAttribute('data-mode');
        },1200);
      }
      setTimeout(()=> eve.classList.remove('wave'), 900);
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
  // Resume audio context on first user interaction
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','KeyE','Enter','Escape','KeyP','KeyH','KeyF','KeyT'].includes(e.code)) e.preventDefault();
  state.keys[e.code]=true;
  if(state.mode==='road'){
    if(state.near && /phase 1/i.test(state.near.label||'')){
      // Allow either Down/S or E/Enter to enter timeline (no popup anymore)
      if(e.code==='ArrowDown' || e.code==='KeyS' || e.code==='KeyE' || e.code==='Enter'){
  // Launch cinematic drilling transition instead of instant switch
  startWorldTransition();
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
  // Quick access to WALL-E Wasteland theme for testing
  if(e.code==='KeyW' && e.shiftKey){ setWallEWastelandTheme() }
});
addEventListener('keyup', e=>{
  state.keys[e.code]=false;
  if(e.code==='KeyF'){ state.spotlight.active = false; }
});

// 3D EVE Cursor Mouse Interaction System
let eveRotationState = { rotateX: 0, rotateY: 0, targetX: 0, targetY: 0 };
let lastEveUpdateTime = 0;
let cachedEveBody = null;

function updateEveRotation(clientX, clientY) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Calculate rotation based on mouse position relative to screen center
  // Range: -20 to +20 degrees for more noticeable 3D effect
  const maxRotation = 20;
  eveRotationState.targetX = ((clientY - centerY) / centerY) * maxRotation;
  eveRotationState.targetY = -((clientX - centerX) / centerX) * maxRotation;
}

function animateEveRotation(currentTime) {
  // Throttle to 60fps for smooth performance
  if (currentTime - lastEveUpdateTime < 16.67) {
    requestAnimationFrame(animateEveRotation);
    return;
  }
  lastEveUpdateTime = currentTime;
  
  // Smooth interpolation for natural movement
  const ease = 0.08;
  eveRotationState.rotateX += (eveRotationState.targetX - eveRotationState.rotateX) * ease;
  eveRotationState.rotateY += (eveRotationState.targetY - eveRotationState.rotateY) * ease;
  
  const eve = domCache.getCursorEve();
  if (eve) {
    // Cache the eve-body element for performance
    if (!cachedEveBody || !document.contains(cachedEveBody)) {
      cachedEveBody = eve.querySelector('.eve-body');
    }
    
    if (cachedEveBody) {
      // Check if EVE is currently waving (has wave class)
      const isWaving = eve.classList.contains('wave');
      
      if (!isWaving) {
        // Apply 3D rotation only when not waving to avoid conflicts
        cachedEveBody.style.transform = `rotateX(${eveRotationState.rotateX}deg) rotateY(${eveRotationState.rotateY}deg)`;
      } else {
        // When waving, temporarily clear our transform to let CSS animation take over
        cachedEveBody.style.transform = '';
      }
    }
  }
  
  requestAnimationFrame(animateEveRotation);
}

// Start the 3D animation loop
requestAnimationFrame(animateEveRotation);

// Spotlight pointer controls
addEventListener('pointermove', e => {
  state.spotlight.x = e.clientX;
  state.spotlight.y = e.clientY;
  
  // Update EVE cursor 3D rotation based on mouse position
  if (typeof updateEveRotation === 'function') {
    updateEveRotation(e.clientX, e.clientY);
  }
});
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousedown', e => { if (e.button === 2) state.spotlight.active = true; });
addEventListener('mouseup',   e => { if (e.button === 2) state.spotlight.active = false; });

/* Touch */
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const interactBtn = document.getElementById('interactBtn');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const interactBtn2 = document.getElementById('interactBtn2');
let leftHeld=false, rightHeld=false;
['pointerdown','pointerup','pointerleave','pointercancel'].forEach(ev=>{
  leftBtn.addEventListener(ev, e=>{ leftHeld = ev==='pointerdown'; });
  rightBtn.addEventListener(ev, e=>{ rightHeld = ev==='pointerdown'; });
  interactBtn.addEventListener(ev, e=>{ 
    if(ev==='pointerdown' && state.near) {
      // Resume audio context on interaction
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      openBranch(state.near);
    }
  });
  if(upBtn) upBtn.addEventListener(ev, e=>{ if(ev==='pointerdown') state.keys['ArrowUp']=true; else state.keys['ArrowUp']=false; });
  if(downBtn) downBtn.addEventListener(ev, e=>{ if(ev==='pointerdown') state.keys['ArrowDown']=true; else state.keys['ArrowDown']=false; });
  if(interactBtn2) interactBtn2.addEventListener(ev, e=>{ if(ev==='pointerdown' && state.near) openBranch(state.near) });
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
  document.body.classList.add('overview-open'); // Add overview class to hide text boxes
  
  // FORCE HIDE all description elements immediately
  forceHideDescriptionElements();
  
  state.paused = true;
}
function closePanel(){ overlay.style.display='none'; document.body.classList.remove('overview-open'); state.paused=false }
function togglePause(){ state.paused=!state.paused; toast(state.paused?'Paused ⏸':'Resumed ▶') }
function showHelp(){
  showOverlay('Controls & Features',
    `<div class="grid">
      <div class="card">
        <h4>🎮 Movement Controls</h4>
        <p><b>Desktop:</b> ←/→ Arrow keys or A/D keys to move</p>
        <p><b>Mobile:</b> Use on-screen touch buttons or swipe</p>
      </div>
      <div class="card">
        <h4>⚡ Action Controls</h4>
        <p><b>E</b> - Interact with branches and explore sections</p>
        <p><b>Shift/X</b> - Boost speed for faster movement</p>
        <p><b>T</b> - Enter Timeline/Underground mode</p>
        <p><b>F</b> - Photo Mode (freeze and capture moments)</p>
      </div>
      <div class="card">
        <h4>🎛️ System Controls</h4>
        <p><b>Esc</b> - Close panels and overlays</p>
        <p><b>P</b> - Pause/Resume game</p>
        <p><b>H</b> - Show this help screen</p>
        <p><b>C</b> - Toggle system cursor visibility</p>
      </div>
      <div class="card">
        <h4>💡 Hidden Features</h4>
        <p>Hidden features are hidden... mess around to find out! 🕵️‍♂️</p>
        <p>Some secrets only reveal themselves to the curious explorer</p>
        <p>Try different interactions and see what WALL-E can discover</p>
      </div>
      <div class="card">
        <h4>📱 Mobile Features</h4>
        <p><b>Touch & Hold</b> - Activate special interactions</p>
        <p><b>Swipe Left/Right</b> - Quick movement controls</p>
        <p><b>Tap EVE</b> - Trigger expressions and reactions</p>
      </div>
      <div class="card">
        <h4>� Exploration Tips</h4>
        <p>Discover all branches to unlock the complete SparkIT experience</p>
        <p>Each section contains unique content and interactions</p>
        <p>WALL-E has many surprises for dedicated explorers</p>
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
    const p = GAME_DATA.phases[1]; // SparkIT Fusion phase
    const cardClass = p.locked ? 'card phase locked' : 'card phase';
    const availabilityText = p.locked ? '<div class="availability" style="color: #ff6b6b; font-weight: bold; margin-top: 10px;">Available Soon</div>' : '';
    return `<div class="${cardClass}"><h3>${p.title}</h3><p>${p.summary}</p>${availabilityText}</div>`;
  }
  if(type==='faq'){
    const faqData = GAME_DATA.faq || [
      { question: "Who can apply?", answer: "Students and early-stage builders." },
      { question: "Is Phase 1 free?", answer: "Yes." },
      { question: "Team size?", answer: "Solo or up to 4." },
      { question: "Selection?", answer: "Based on idea clarity and motivation." }
    ];
    
    const faqCards = faqData.map(item => 
      `<div class="card"><h4>${item.question}</h4><p>${item.answer}</p></div>`
    ).join('');
    
    return `<div class="grid">${faqCards}</div>`;
  }
  if(type==='contact'){
    return `
      <div class="grid">
        <div class="card">
          
          <p><strong>Chairman | RCCS</strong><br>Sanindu Lakshan<br>📞 +94 70 155 4500</p>
          <p><strong>Secretary | RCCS</strong><br>Thushan Nilanga<br>📞 +94 71 065 1400</p>
          <p><strong>Treasurer | RCCS</strong><br>Ravindu Vidarshana<br>📞 +94 77 911 6695</p>
        </div>
        <div class="card">
          
          <p><strong>Chairman | KGHSICT</strong><br>Yuhasa Gunawardhana<br>📞 +94 74 193 4280</p>
          <p><strong>Secretary | KGHSICT</strong><br>Sachithra Randeniya<br>📞 +94 71 345 0265</p>
          <p><strong>Treasurer | KGHSICT</strong><br>Thathsarani Danushika<br>📞 +94 76 694 2445</p>
        </div>
        <div class="card">
         
          <p><strong>Email Us | RCCS</strong><br>📧 info@rccsonline.com</p>
          <p><strong>Email Us | KGHSICT</strong><br>📧 ictclub2024.kghs@gmail.com</p>
        </div>
        <div class="card">
         
          <p><strong>Teacher-In-Charge | RCCS</strong><br>Mrs. B. A. N. D. Samarasinghe<br>📞 +94 71 446 4570</p>
          <p><strong>Teacher-In-Charge | KGHSICT</strong><br>Mrs. R. A. G. K. Lakmali<br>📞 +94 71 197 5747</p>
        </div>
      </div>`;
  }
  if(type==='registration'){
    return `<div class="card"><h3>🚀 Registration Portal</h3><p>Opening registration page...</p></div>`;
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
  // Play branch interaction sound
  if(branch.type === 'phase3') {
    playSound('ui_error'); // Error sound for locked content
  } else {
    playSound('branch_click'); // Success sound for accessible content
  }
  
  // Handle synthetic timeline milestone branches
  if(branch && typeof branch.type==='string' && branch.type.startsWith('timeline:')){
    const m = branch._timeline;
    if(m){ state.timeline.visited.add(m.key); showOverlay(m.title, `<div class="card"><h3>${m.title}</h3><p>${m.text}</p><p class="help">Timeline milestone (demo)</p></div>`); return; }
  }
  
  // Block SparkIT Fusion (phase3) interactions
  if(branch && branch.type === 'phase3'){
    showOverlay(branch.label, `<div class="card phase locked"><h3>SparkIT Fusion</h3><p>Advanced fusion of technology and innovation</p><div class="availability" style="color: #ff6b6b; font-weight: bold; margin-top: 10px;">Coming Soon!</div><p style="margin-top: 10px; opacity: 0.8;">This phase will be available in the future. Check back later for exciting new features!</p></div>`);
    return;
  }
  
  // Handle registration portal with special effects
  if(branch && branch.type==='registration'){
    // Open the dedicated registration page
    window.open('registration.html', '_blank');
    return;
  }
  // Intercept Phase 1 branch to start drilling sequence instead of direct timeline entry
  if(branch && branch.type==='phase1'){
    playSound('walle_drill'); // Special drilling sound
    startWorldTransition();
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
  extraImg.style.width = "250px";
  container.appendChild(extraImg);
  const tagline = document.createElement("div");
  tagline.style.background = "linear-gradient(90deg, #c9a9ff, #b794ff)";
  tagline.style.webkitBackgroundClip = "text";
  tagline.style.backgroundClip = "text";
  tagline.style.color = "transparent";
  tagline.style.fontWeight = "600";
  tagline.style.letterSpacing = "2px";
  tagline.innerText = "IGNITING ICT LITERACY ACROSS SRI LANKA";
  tagline.style.fontSize = "12px";
  tagline.style.fontWeight = "100";
  tagline.style.textAlign = "center";
  tagline.style.whiteSpace = "pre-line";
  tagline.style.marginTop = "8px";
  tagline.style.fontFamily = "Arial, Helvetica, sans-serif";
  tagline.style.letterSpacing = "1px";
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
  
  // Check for WALL-E wasteland theme first
  if(state.theme === 'walle-wasteland') {
    drawWallEWastelandBackground();
    return;
  }
  
  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  if(state.theme==='walle-purple'){
    // Purple theme for WALL-E
    g.addColorStop(0, '#2d1b40');  // Dark purple
    g.addColorStop(1, '#1a0d26');  // Very dark purple
  } else if(state.theme==='sunset'){
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

/**
 * WALL-E Wasteland Background Implementation
 * Based on June 27, 2008 WALL-E Movie Poster
 * Recreates the iconic desolate Earth setting with:
 * - Twilight sky gradient (orange to deep purple)
 * - Star field in upper atmosphere
 * - Trash tower silhouettes on horizon
 * - Scattered waste debris on ground
 * - Atmospheric dust particles
 * - Horizon glow effects
 */
function drawWallEWastelandBackground(){
  const cx = state.camera.x;
  const reduced = PREFERS_REDUCED_MOTION;
  
  // === WALL-E WASTELAND SKY ===
  const horizonY = H * 0.7;
  const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
  
  // Twilight sky gradient based on poster analysis
  skyGradient.addColorStop(0, '#1a0f2b');     // Deep space purple
  skyGradient.addColorStop(0.3, '#6b2c91');   // Purple
  skyGradient.addColorStop(0.6, '#ff6b4a');   // Orange-pink
  skyGradient.addColorStop(0.85, '#ff9966');  // Warm orange
  skyGradient.addColorStop(1, '#ffcc99');     // Horizon glow
  
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, W, horizonY);
  
  // Ground gradient
  const groundGradient = ctx.createLinearGradient(0, horizonY, 0, H);
  groundGradient.addColorStop(0, '#a0783c');  // Dusty orange
  groundGradient.addColorStop(1, '#6b4913');  // Darker brown
  
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, horizonY, W, H * 0.3);
  
  // === STAR FIELD ===
  drawWastelandStars();
  
  // === ATMOSPHERIC HORIZON GLOW ===
  drawWastelandAtmosphere();
  
  // === TRASH TOWER SILHOUETTES ===
  drawTrashTowers();
  
  // === WASTE DEBRIS ===
  drawWasteDebris();
  
  // === ATMOSPHERIC DUST PARTICLES ===
  drawWastelandDustParticles();
}

function drawWastelandDustParticles(){
  if(PREFERS_REDUCED_MOTION) return; // Skip particles for reduced motion
  
  // Initialize dust particles array if not exists
  if(!state.wastelandDust) {
    state.wastelandDust = [];
    // Spawn initial dust particles
    for(let i = 0; i < 30; i++) {
      state.wastelandDust.push({
        x: Math.random() * W * 2, // Spread across wider area
        y: H * 0.5 + Math.random() * H * 0.4, // In lower atmosphere
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 10,
        size: 1 + Math.random() * 2,
        life: Math.random(),
        alpha: 0.1 + Math.random() * 0.2
      });
    }
  }
  
  // Update dust particles
  state.wastelandDust.forEach(particle => {
    particle.x += particle.vx * state.dt;
    particle.y += particle.vy * state.dt;
    particle.life += state.dt * 0.3;
    
    // Wrap particles around screen
    if(particle.x < -state.camera.x - 50) particle.x = W + state.camera.x + 50;
    if(particle.x > W + state.camera.x + 50) particle.x = -state.camera.x - 50;
    if(particle.y < 0) particle.y = H;
    if(particle.y > H) particle.y = 0;
  });
  
  // Draw dust particles
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  state.wastelandDust.forEach(particle => {
    const screenX = particle.x - state.camera.x;
    if(screenX > -10 && screenX < W + 10) {
      const alpha = particle.alpha * (0.5 + 0.5 * Math.sin(particle.life));
      ctx.fillStyle = `rgba(210, 180, 140, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawWastelandStars(){
  const stars = [
    // Predefined star positions for consistency
    {x: 120, y: 60, size: 1}, {x: 340, y: 45, size: 2},
    {x: 580, y: 85, size: 1}, {x: 760, y: 30, size: 3},
    {x: 180, y: 120, size: 1}, {x: 420, y: 70, size: 2},
    {x: 680, y: 110, size: 1}, {x: 820, y: 90, size: 2},
    {x: 240, y: 40, size: 1}, {x: 480, y: 100, size: 1},
    {x: 720, y: 50, size: 2}, {x: 860, y: 130, size: 1},
    {x: 300, y: 80, size: 1}, {x: 540, y: 35, size: 2},
    {x: 780, y: 115, size: 1}, {x: 920, y: 65, size: 3},
    {x: 60, y: 95, size: 1}, {x: 380, y: 25, size: 1},
    {x: 620, y: 140, size: 2}, {x: 800, y: 75, size: 1},
    {x: 160, y: 55, size: 1}, {x: 460, y: 120, size: 1},
    {x: 700, y: 30, size: 2}, {x: 880, y: 100, size: 1},
    {x: 280, y: 65, size: 1}, {x: 520, y: 90, size: 2},
    {x: 760, y: 140, size: 1}, {x: 900, y: 45, size: 1}
  ];
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  stars.forEach(star => {
    if(star.y < H * 0.5) { // Only in upper sky
      // Adjust star position based on camera for slight parallax
      const starX = star.x - (state.camera.x * 0.1);
      
      ctx.beginPath();
      ctx.arc(starX, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow for larger stars
      if(star.size > 2) {
        const starGlow = ctx.createRadialGradient(
          starX, star.y, 0,
          starX, star.y, star.size * 3
        );
        starGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        starGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(starX, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      }
    }
  });
}

function drawWastelandAtmosphere(){
  const horizonY = H * 0.7;
  
  // === HORIZON GLOW ===
  const glowGradient = ctx.createRadialGradient(
    W/2, horizonY, 0,
    W/2, horizonY, W * 0.6
  );
  glowGradient.addColorStop(0, 'rgba(255, 204, 153, 0.4)');
  glowGradient.addColorStop(1, 'rgba(255, 204, 153, 0)');
  
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, horizonY - 100, W, 200);
}

function drawTrashTowers(){
  const cx = state.camera.x;
  const horizonY = H * 0.7;
  const parallaxSpeed = 0.15; // Slow movement for distant towers
  
  // Predefined tower positions and heights
  const towers = [
    {x: 100, height: 300, width: 25},
    {x: 280, height: 450, width: 30},
    {x: 450, height: 250, width: 20},
    {x: 680, height: 380, width: 35},
    {x: 920, height: 200, width: 15},
    {x: 1150, height: 320, width: 28},
    {x: 1380, height: 480, width: 32},
    {x: 1580, height: 180, width: 18},
    {x: 1820, height: 350, width: 26},
    {x: 2100, height: 420, width: 30},
    {x: 2350, height: 280, width: 22},
    {x: 2580, height: 360, width: 29},
    {x: 2800, height: 400, width: 31}
  ];
  
  towers.forEach(tower => {
    const screenX = tower.x - (cx * parallaxSpeed);
    
    if (screenX > -tower.width && screenX < W + tower.width) {
      // Main tower body
      ctx.fillStyle = '#2d1810'; // Dark silhouette
      ctx.fillRect(
        screenX - tower.width/2,
        horizonY - tower.height,
        tower.width,
        tower.height
      );
      
      // Add stepping detail (ramped sides)
      ctx.fillStyle = '#1a1008';
      for(let step = 0; step < 3; step++) {
        const stepY = horizonY - (tower.height * (0.7 + step * 0.1));
        ctx.fillRect(screenX - tower.width/2 - 2, stepY, 4, 8);
        ctx.fillRect(screenX + tower.width/2 - 2, stepY, 4, 8);
      }
    }
  });
}

function drawWasteDebris(){
  const cx = state.camera.x;
  const groundY = H * 0.75;
  const debrisSpeed = 0.8; // Foreground parallax
  
  // Scattered waste cubes and debris
  const debris = [
    {x: 150, y: groundY + 10, size: 8, type: 'cube'},
    {x: 320, y: groundY + 5, size: 12, type: 'cylinder'},
    {x: 480, y: groundY + 8, size: 6, type: 'cube'},
    {x: 650, y: groundY + 12, size: 10, type: 'cube'},
    {x: 820, y: groundY + 6, size: 14, type: 'cylinder'},
    {x: 980, y: groundY + 9, size: 7, type: 'cube'},
    {x: 1150, y: groundY + 11, size: 9, type: 'cube'},
    {x: 1320, y: groundY + 7, size: 13, type: 'cylinder'},
    {x: 1480, y: groundY + 10, size: 8, type: 'cube'},
    {x: 1650, y: groundY + 14, size: 11, type: 'cylinder'},
    {x: 1820, y: groundY + 6, size: 9, type: 'cube'},
    {x: 1980, y: groundY + 8, size: 12, type: 'cube'},
    {x: 2150, y: groundY + 13, size: 7, type: 'cylinder'},
    {x: 2320, y: groundY + 9, size: 10, type: 'cube'},
    {x: 2480, y: groundY + 11, size: 8, type: 'cube'},
    {x: 2650, y: groundY + 7, size: 15, type: 'cylinder'}
  ];
  
  debris.forEach(item => {
    const screenX = item.x - (cx * debrisSpeed);
    
    if (screenX > -item.size && screenX < W + item.size) {
      ctx.fillStyle = '#4d3820'; // Rust brown
      
      if (item.type === 'cube') {
        ctx.fillRect(
          screenX - item.size/2, 
          item.y - item.size,
          item.size, 
          item.size
        );
        // Add highlight edge
        ctx.fillStyle = '#6d4830';
        ctx.fillRect(screenX - item.size/2, item.y - item.size, item.size, 2);
      } else if (item.type === 'cylinder') {
        ctx.beginPath();
        ctx.ellipse(screenX, item.y, item.size/2, item.size/2, item.size/4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// EVE Spotlight — Volumetric beam and dust
function drawSpotlight(){
  const s = state.spotlight;
  const eve = document.getElementById('cursor-eve');
  if (!s.active) { if(eve) eve.classList.remove('scanning'); return; }
  if(eve) eve.classList.add('scanning');

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

// Memorable EVE aura — screen-space subtle glow and pulse
function drawEveAura(){
  try{
    const eve = domCache.getCursorEve(); if(!eve) return;
    const r = eve.getBoundingClientRect();
    const cx = r.left + r.width/2; const cy = r.top + r.height/2;
    const t = performance.now()*0.001;
    const base = 38 + Math.sin(t*2.1)*4;
    // Stronger pulse shortly after a bump
    const since = (performance.now() - (window._eveLastBump||0));
    const pulse = since < 600 ? (1 - since/600) : 0;
    ctx.save();
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, base + 26*pulse);
    g1.addColorStop(0, `rgba(0,184,232,${(0.22 + 0.25*pulse).toFixed(3)})`);
    g1.addColorStop(1, 'rgba(0,184,232,0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(cx, cy, base + 26*pulse, 0, Math.PI*2); ctx.fill();
    // outer soft ring
    const g2 = ctx.createRadialGradient(cx, cy, base, cx, cy, base*1.6 + 30*pulse);
    g2.addColorStop(0, 'rgba(74,144,226,0.12)');
    g2.addColorStop(1, 'rgba(74,144,226,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy, base*1.6 + 30*pulse, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }catch{}
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
  // IMPORTANT: The drawing order is reversed. WALL-E first, then trail, then background.
  ctx.globalAlpha = intensity * 0.5;
  updateWallEAnimations();
  drawWallE();

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

  // branches (EVE-style trees)
  GAME_DATA.branches.forEach(b=>{
    const bx = b.x - state.camera.x;
    if(bx<-150 || bx>W+150) return;

    // Tree trunk with organic curves
    const trunkWidth = 8;
    const trunkHeight = 140;
    ctx.strokeStyle = 'rgba(139,79,179,.8)';
    ctx.lineWidth = trunkWidth;
    ctx.lineCap = 'round';
    
    // Main trunk with slight curve
    ctx.beginPath();
    ctx.moveTo(bx-2, roadY);
    ctx.quadraticCurveTo(bx+1, roadY-trunkHeight*0.3, bx-1, roadY-trunkHeight*0.7);
    ctx.quadraticCurveTo(bx+2, roadY-trunkHeight*0.9, bx, roadY-trunkHeight);
    ctx.stroke();
    
    // Tree branches with textured details
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(139,79,179,.7)';
    
    // Primary branches
    ctx.beginPath();
    // Left branch
    ctx.moveTo(bx-1, roadY-trunkHeight*0.6);
    ctx.quadraticCurveTo(bx-25, roadY-trunkHeight*0.75, bx-35, roadY-trunkHeight*0.8);
    // Right branch  
    ctx.moveTo(bx+1, roadY-trunkHeight*0.7);
    ctx.quadraticCurveTo(bx+30, roadY-trunkHeight*0.85, bx+40, roadY-trunkHeight*0.9);
    // Upper branches
    ctx.moveTo(bx, roadY-trunkHeight*0.85);
    ctx.quadraticCurveTo(bx-15, roadY-trunkHeight*0.95, bx-20, roadY-trunkHeight);
    ctx.moveTo(bx, roadY-trunkHeight*0.85);
    ctx.quadraticCurveTo(bx+15, roadY-trunkHeight*0.95, bx+25, roadY-trunkHeight);
    ctx.stroke();
    
    // Secondary branch details
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(139,79,179,.5)';
    ctx.beginPath();
    // Fine branch details
    ctx.moveTo(bx-35, roadY-trunkHeight*0.8);
    ctx.lineTo(bx-42, roadY-trunkHeight*0.82);
    ctx.moveTo(bx-35, roadY-trunkHeight*0.8);
    ctx.lineTo(bx-38, roadY-trunkHeight*0.86);
    ctx.moveTo(bx+40, roadY-trunkHeight*0.9);
    ctx.lineTo(bx+48, roadY-trunkHeight*0.92);
    ctx.moveTo(bx+40, roadY-trunkHeight*0.9);
    ctx.lineTo(bx+44, roadY-trunkHeight*0.96);
    ctx.stroke();

    // Stylish information panel (enhanced glass effect)
    const panelWidth = 160;
    const panelHeight = 42;
    const panelX = bx - panelWidth/2;
    const panelY = roadY - trunkHeight - panelHeight - 10;
    
    // Multi-layer panel background for depth
    const gradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(139,79,179,0.35)');
    gradient.addColorStop(0.3, 'rgba(163,73,164,0.45)');
    gradient.addColorStop(0.7, 'rgba(139,79,179,0.35)');
    gradient.addColorStop(1, 'rgba(106,76,147,0.25)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Secondary inner gradient for glass effect
    const innerGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
    innerGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
    innerGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    innerGradient.addColorStop(1, 'rgba(139,79,179,0.1)');
    
    ctx.fillStyle = innerGradient;
    ctx.fillRect(panelX + 1, panelY + 1, panelWidth - 2, panelHeight - 2);
    
    // Enhanced border with gradient
    const borderGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY);
    borderGradient.addColorStop(0, 'rgba(139,79,179,0.6)');
    borderGradient.addColorStop(0.5, 'rgba(163,73,164,1.0)');
    borderGradient.addColorStop(1, 'rgba(139,79,179,0.6)');
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Subtle corner accents
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    const cornerSize = 3;
    // Top-left corner highlight
    ctx.fillRect(panelX + 1, panelY + 1, cornerSize, 1);
    ctx.fillRect(panelX + 1, panelY + 1, 1, cornerSize);
    // Bottom-right corner highlight  
    ctx.fillRect(panelX + panelWidth - cornerSize - 1, panelY + panelHeight - 2, cornerSize, 1);
    ctx.fillRect(panelX + panelWidth - 2, panelY + panelHeight - cornerSize - 1, 1, cornerSize);
    
    // Panel reflection effect
    const reflectionGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight * 0.4);
    reflectionGradient.addColorStop(0, 'rgba(255,255,255,0.12)');
    reflectionGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(panelX + 2, panelY + 2, panelWidth - 4, panelHeight * 0.4);
    
    // Connecting stem to panel
    ctx.strokeStyle = 'rgba(139,79,179,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, roadY - trunkHeight);
    ctx.lineTo(bx, panelY + panelHeight);
    ctx.stroke();

    // Tree leaves/energy particles with variation
    const time = performance.now() * 0.002;
    const treeVariation = b.x * 0.001; // Unique variation per tree
    
    // Floating energy particles around crown
    for(let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2 + time + treeVariation;
      const radius = 20 + Math.sin(time * 1.5 + i + treeVariation) * 12;
      const leafX = bx + Math.cos(angle) * radius;
      const leafY = roadY - trunkHeight + Math.sin(angle) * radius * 0.7 - 10;
      
      const particleSize = 1.5 + Math.sin(time * 3 + i) * 0.8;
      const alpha = 0.4 + Math.sin(time * 2 + i) * 0.3;
      
      ctx.fillStyle = `rgba(139,79,179,${alpha})`;
      ctx.beginPath();
      ctx.arc(leafX, leafY, particleSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add small sparkles
      if(i % 3 === 0) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(leafX + Math.sin(time * 4 + i) * 3, leafY + Math.cos(time * 4 + i) * 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Ground roots/energy tendrils
    ctx.strokeStyle = 'rgba(139,79,179,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i = 0; i < 4; i++) {
      const rootAngle = (i / 4) * Math.PI + time * 0.5;
      const rootLength = 15 + Math.sin(time + i + treeVariation) * 5;
      const rootX = bx + Math.cos(rootAngle) * rootLength;
      const rootY = roadY + Math.sin(time * 2 + i) * 2;
      
      ctx.moveTo(bx, roadY);
      ctx.quadraticCurveTo(
        bx + Math.cos(rootAngle) * rootLength * 0.5, 
        roadY + 3, 
        rootX, 
        rootY
      );
    }
    ctx.stroke();

  // Label text with enhanced styling
  let label = b.label;
  if(/phase 1/i.test(label) || b.type==='phase1') label = 'SparkIT Flash';
  
  ctx.font='600 13px ui-sans-serif'; 
  ctx.textAlign='center'; 
  ctx.textBaseline='middle';
  
  // Text with enhanced contrast
  ctx.fillStyle='rgba(255,255,255,0.95)';
  ctx.fillText(label, bx, panelY + panelHeight/2);
  
  // Text glow effect
  ctx.shadowColor = 'rgba(139,79,179,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, bx, panelY + panelHeight/2);
  ctx.shadowBlur = 0;
  
  // Record phase1 tree position for lightning
  if(b.type==='phase1' || /sparkit flash/i.test(label)){
    state.phase1Sign = { x: b.x, y: panelY + panelHeight/2 };
  }
  
  // Lightning effects for Phase 1 tree
  let glowPulse = 0; 
  const isFlash = state.phase1Sign && Math.abs(b.x - state.phase1Sign.x)<2;
  if(isFlash && (L.active || L.afterglow>0)){
    const tNow = performance.now();
    glowPulse = (Math.sin(tNow/90)+1)/2;
    const baseEnergy = L.active?1: (L.afterglow/3600);
    const energy = baseEnergy * (0.6 + 0.4*glowPulse);
    
    // Lightning rings for tree
    if(L.active && tNow - L.lastSpawn > 110){
      L.lastSpawn = tNow;
      L.rings.push({r:16, v: 180 + Math.random()*120, alpha:0.55});
      
      // Tree-specific sparks around branches
      if(Math.random()<0.35){
        for(let i=0;i<12;i++){
          const a = Math.random()*Math.PI*2; 
          const sp = 60+Math.random()*140;
          const sparkX = L.strikeX + (Math.random()-0.5)*80; // Spread around tree
          const sparkY = L.strikeY-40 + (Math.random()-0.5)*60;
          L.sparks.push({
            x: sparkX, y: sparkY, 
            vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 20, 
            life: 150+Math.random()*200, 
            fade: 0.3+Math.random()*0.5
          });
        }
      }
    }
    
    // Electrified tree effects
    ctx.save();
    
    // Energized trunk glow
    ctx.strokeStyle = `rgba(139,79,179,${(0.8*energy).toFixed(3)})`;
    ctx.lineWidth = 12 + energy * 8;
    ctx.shadowColor = 'rgba(139,79,179,0.8)';
    ctx.shadowBlur = 20 + energy * 10;
    ctx.beginPath();
    ctx.moveTo(bx-2, roadY);
    ctx.quadraticCurveTo(bx+1, roadY-trunkHeight*0.3, bx-1, roadY-trunkHeight*0.7);
    ctx.quadraticCurveTo(bx+2, roadY-trunkHeight*0.9, bx, roadY-trunkHeight);
    ctx.stroke();
    
    // Electrified panel glow
    ctx.fillStyle = `rgba(139,79,179,${(0.4*energy).toFixed(3)})`;
    ctx.shadowBlur = 15 + energy * 10;
    ctx.fillRect(panelX-2, panelY-2, panelWidth+4, panelHeight+4);
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // interaction hint if near - expand detection to roughly the branch tile width
  // panelWidth is the tile width used for branch panels; use half-width plus small padding
  const near = Math.abs(state.player.x - b.x) < ( (typeof panelWidth !== 'undefined' ? panelWidth : 120) * 0.5 + 8 );
    if(near){
      // Play hover sound if this is a new branch
      if(!state.near || state.near.x !== b.x) {
        playSound('branch_hover', Math.random() * 50 - 25);
      }
      
      // Enhanced interaction hint with tree theme
      ctx.font='12px ui-sans-serif'; 
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 2;
      
      // Special handling for SparkIT Fusion (phase3)
      if(b.type === 'phase3') {
        ctx.fillStyle='rgba(255,107,107,.9)'; // Red color for "Coming Soon"
        ctx.fillText('Coming Soon', bx, roadY-trunkHeight-panelHeight-30);
      } else {
        ctx.fillStyle='rgba(139,79,179,.9)'; 
        // Device-specific interaction text
        const interactionText = isMobileDevice() ? 'Click here to interact' : 'Press E to interact';
        ctx.fillText(interactionText, bx, roadY-trunkHeight-panelHeight-30);
      }
      ctx.shadowBlur = 0;
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

// Draw trash pile on the road
function drawTrashPile() {
  const trash = state.trashPile;
  if (!trash.image) return; // Image not loaded yet
  
  const trashScreenX = trash.x - state.camera.x;
  
  // Only draw if visible on screen
  if (trashScreenX < -trash.width || trashScreenX > W + trash.width) return;
  
  ctx.save();
  
  // Add a subtle glow effect if WALL-E is nearby
  const distanceToWallE = Math.abs(state.player.x - trash.x);
  if (distanceToWallE < 120) { // increased range for larger trash pile
    const glowIntensity = Math.max(0, 1 - distanceToWallE / 120);
    const glow = ctx.createRadialGradient(
      trashScreenX, trash.y, 0,
      trashScreenX, trash.y, trash.width * 0.8
    );
    glow.addColorStop(0, `rgba(255, 255, 0, ${0.15 * glowIntensity})`);
    glow.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(
      trashScreenX - trash.width, 
      trash.y - trash.height, 
      trash.width * 2, 
      trash.height * 2
    );
  }
  
  // Apply color filter based on current theme to match background
  let colorFilter = 'none';
  const isNight = state.dayNight.isNight;
  
  if (state.theme === 'walle-purple') {
    // Purple tint to match WALL-E theme
    colorFilter = 'hue-rotate(240deg) saturate(0.7) brightness(0.8)';
  } else if (state.theme === 'walle-wasteland') {
    // Dusty orange/brown tint to match wasteland theme
    colorFilter = 'hue-rotate(30deg) saturate(0.8) brightness(0.85)';
  } else if (state.theme === 'sunset') {
    if (isNight) {
      // Dark purple/blue tint for night
      colorFilter = 'hue-rotate(220deg) saturate(0.6) brightness(0.7)';
    } else {
      // Warm orange/red tint for sunset
      colorFilter = 'hue-rotate(20deg) saturate(1.2) brightness(0.9)';
    }
  } else {
    // Default neon theme
    if (isNight) {
      // Cool blue tint for night
      colorFilter = 'hue-rotate(200deg) saturate(0.5) brightness(0.6)';
    } else {
      // Light blue tint for day
      colorFilter = 'hue-rotate(190deg) saturate(0.8) brightness(1.1)';
    }
  }
  
  // Apply the color filter
  ctx.filter = colorFilter;
  
  // Draw the trash pile image (now larger)
  ctx.drawImage(
    trash.image,
    trashScreenX - trash.width/2,
    trash.y - trash.height/2,
    trash.width,
    trash.height
  );
  
  // Reset filter for other elements
  ctx.filter = 'none';
  
  // Add interaction hint if WALL-E is very close
  if (distanceToWallE < 80 && !trash.collided) { // adjusted range for larger trash pile
    ctx.font = '12px ui-sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Interesting trash!', trashScreenX, trash.y - trash.height/2 - 15);
  }
  
  ctx.restore();
}

/* ===== Timeline Vertical Mode ===== */
function enterTimeline() {
  if(state.timeline.active) return;
  
  // Play timeline transition sound
  playSound('timeline_transition');
  playWalleExpression('excited');
  
  state.timeline.active = true; 
  state.mode='timeline';
  document.body.classList.add('timeline-mode'); // Add timeline class to hide text boxes
  document.body.classList.add('underground-mode'); // Also add underground class for extra coverage
  
  // FORCE HIDE all description elements immediately
  forceHideDescriptionElements();
  
  state.timeline.roadReturnY = state.player.y;
  state.player.vx=0; state.player.ax=0; 
  state.player.vy=0; state.player.ay=0; 
  state.player.y = 160;
  state.camera.x = 0; // ensure screen-space drawing in timeline
  toast('Entered Spark Flash');

  // Switch UI/EVE to underground styling
  try{ 
    document.body.classList.add('underground-mode'); 
    const eve = document.getElementById('cursor-eve');
    if(eve){ eve.classList.add('enter-underground'); setTimeout(()=> eve.classList.remove('enter-underground'), 700); }
    
    // Show underground text box
    setTimeout(() => {
      if (isUndergroundInitialized && undergroundDescription) {
        console.log('Showing underground description on mode enter');
        undergroundDescription.classList.add('visible');
        isUndergroundVisible = true;
      }
    }, 800);
  }catch{}

  // Show vertical controls on mobile, hide horizontal ones
  try{
    const tv = document.getElementById('touch-vertical');
    const th = document.getElementById('touch');
    if(isMobileDevice()){ if(tv) tv.style.display='flex'; if(th) th.style.display='none'; }
  // refresh EVE avoidance rectangles now that controls changed
  try{ window._refreshEveAvoidRects && window._refreshEveAvoidRects(); }catch{}
  }catch{}

  const logos = document.getElementById("logo-container");
  if(logos) logos.style.display = "none"; // hide logos
  // enable timeline tap interactions
  try{ canvas.addEventListener('pointerdown', handleTimelineTap); }catch{}
}

function exitTimeline(){
  if(!state.timeline.active) return;
  
  // Play exit timeline sound
  playSound('timeline_transition', -100);
  playWalleExpression('happy');
  
  state.timeline.active = false; 
  state.mode = 'road';
  document.body.classList.remove('timeline-mode'); // Remove timeline class to show text boxes
  document.body.classList.remove('underground-mode'); // Remove underground class as well
  state.player.vy = 0; 
  state.player.ay = 0;
  positionPlayerOnRoad();
  state.camera.y = 0;
  toast('Returned to Highway');

  // Restore surface styling
  try{ 
    document.body.classList.remove('underground-mode');
    const eve = document.getElementById('cursor-eve');
    if(eve){ eve.classList.add('exit-underground'); setTimeout(()=> eve.classList.remove('exit-underground'), 700); }
    
    // Hide underground text box
    if (isUndergroundInitialized && undergroundDescription) {
      console.log('Hiding underground description on mode exit');
      undergroundDescription.classList.remove('visible');
      isUndergroundVisible = false;
    }
  }catch{}

  // Restore horizontal controls on mobile
  try{
    const tv = document.getElementById('touch-vertical');
    const th = document.getElementById('touch');
    if(isMobileDevice()){ if(tv) tv.style.display='none'; if(th) th.style.display='flex'; }
  // refresh EVE avoidance rectangles now that controls changed
  try{ window._refreshBotAvoidRects && window._refreshBotAvoidRects(); }catch{}
  }catch{}

  const logos = document.getElementById("logo-container");
  if(logos) logos.style.display = "flex";
  // disable timeline tap interactions
  try{ canvas.removeEventListener('pointerdown', handleTimelineTap); }catch{}
}

// FORCE HIDE all description elements immediately
function forceHideDescriptionElements() {
  const elements = [
    'branch-description',
    'eve-mobile-dialog'
  ];
  
  // Only hide these if NOT in underground mode
  if (!document.body.classList.contains('underground-mode')) {
    elements.push('underground-description');
    elements.push('eve-underground-dialog');
  }
  
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
    }
  });
  
  // Also hide road glass-description elements, but keep underground-box
  document.querySelectorAll('.glass-description').forEach(el => {
    if (!el.classList.contains('underground-box')) {
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
    }
  });
}

function drawTimeline(){
  // dark base
  ctx.fillStyle = '#04080f'; ctx.fillRect(0,0,W,H);
  ensureTimelineEnhancementsInit();
  // light shafts
  (function shafts(){
    const shaftCount = 6; const now = performance.now();
    for(let i=0;i<shaftCount;i++){
      const x = (i+0.5) * (W/shaftCount) + Math.sin((now*0.0006)+(i*1.7))*20;
      const g = ctx.createLinearGradient(x,0,x,H);
      g.addColorStop(0,'rgba(124,248,200,0)');
      g.addColorStop(0.35,'rgba(124,248,200,0.05)');
      g.addColorStop(0.65,'rgba(138,164,255,0.06)');
      g.addColorStop(1,'rgba(124,248,200,0)');
      ctx.fillStyle=g; ctx.fillRect(x-18,0,36,H);
    }
  })();
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
  // vertical track (green path) with rails and animated pulse
  const trackX = W/2; const _now = performance.now();
  // Find CTF milestone to stop timeline there
  const ctfMilestone = state.timeline.milestones.find(m => m.key === 'workshop2');
  const timelineEndY = ctfMilestone ? ctfMilestone.y + 100 : state.timeline.length + 200;
  
  ctx.save();
  ctx.strokeStyle='rgba(124,248,200,.44)'; ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(trackX, -state.camera.y + 100); ctx.lineTo(trackX, -state.camera.y + timelineEndY); ctx.stroke();
  // animated dash
  ctx.strokeStyle='rgba(235,185,0,.42)'; ctx.lineWidth=3.5; ctx.setLineDash([18,14]);
  ctx.lineDashOffset = -((_now*0.12)%100);
  ctx.beginPath(); ctx.moveTo(trackX, -state.camera.y + 80); ctx.lineTo(trackX, -state.camera.y + timelineEndY); ctx.stroke();
  ctx.setLineDash([]);
  // side rails
  ctx.strokeStyle='rgba(138,164,255,.22)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(trackX-28, -state.camera.y + 120); ctx.lineTo(trackX-28, -state.camera.y + timelineEndY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(trackX+28, -state.camera.y + 120); ctx.lineTo(trackX+28, -state.camera.y + timelineEndY); ctx.stroke();
  
  // Show unfinished digging after CTF
  if (ctfMilestone) {
    const digY = -state.camera.y + timelineEndY;
    if (digY > -40 && digY < H + 40) {
      // Draw obvious barrier wall
      ctx.fillStyle = 'rgba(139,69,19,0.8)';
      ctx.fillRect(trackX - 50, digY - 20, 100, 40);
      
      // Barrier texture with rocks and debris
      for (let i = 0; i < 15; i++) {
        const bx = trackX - 45 + (i % 5) * 22;
        const by = digY - 15 + Math.floor(i / 5) * 12;
        ctx.fillStyle = `rgba(101,67,33,${0.6 + Math.random() * 0.3})`;
        ctx.fillRect(bx + Math.random() * 4, by + Math.random() * 4, 8, 8);
      }
      
      // Warning barriers
      ctx.strokeStyle = 'rgba(255,215,0,0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(trackX - 60, digY - 25);
      ctx.lineTo(trackX + 60, digY - 25);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw rough tunnel end with debris
      ctx.fillStyle = 'rgba(205,133,63,0.3)';
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const r = 25 + Math.sin(_now * 0.001 + i) * 8;
        const x = trackX + Math.cos(angle) * r;
        const y = digY + Math.sin(angle) * r * 0.6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Debris particles with more visibility
      for (let i = 0; i < 12; i++) {
        const px = trackX + (Math.random() - 0.5) * 80;
        const py = digY + (Math.random() - 0.5) * 50;
        const size = 2 + Math.random() * 4;
        ctx.fillStyle = `rgba(139,69,19,${0.5 + Math.random() * 0.4})`;
        ctx.fillRect(px, py, size, size);
      }
      
      // Prominent warning text
      ctx.font = 'bold 16px ui-sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,215,0,0.95)';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText('🚧 TUNNEL UNDER CONSTRUCTION 🚧', trackX, digY + 60);
      ctx.fillText('🚧 TUNNEL UNDER CONSTRUCTION 🚧', trackX, digY + 60);
      
      ctx.font = '14px ui-sans-serif';
      ctx.fillStyle = 'rgba(205,133,63,0.9)';
      ctx.fillText('Access denied beyond CTF milestone', trackX, digY + 80);
    }
  }
  // rail flickers
  for(let i=0;i<8;i++){
    const ry = (((_now*0.12)+(i*220)) % (state.timeline.length+400)) - state.camera.y;
    if(ry>-40 && ry<H+40){
      const alpha = 0.2 + 0.2*Math.sin((_now*0.005)+i);
      ctx.fillStyle = `rgba(124,248,200,${alpha.toFixed(3)})`;
      ctx.fillRect(trackX-28, ry, 3, 8);
      ctx.fillRect(trackX+25, ry+12, 3, 8);
    }
  }
  ctx.restore();
  // milestones (filter out registration for underground mode)
  const p = state.player;
  state.near = null;
  state.timeline.milestones.forEach(m=>{
    // Skip registration milestone in underground timeline
    if(m.key === 'registration') return;
    
    const yScreen = m.y - state.camera.y;
    if(yScreen < -140 || yScreen > H+140) return;
    const active = Math.abs(p.y - m.y) < 70;
    if(active){ state.near = { label:m.title, type:'timeline:'+m.key, _timeline:m }; }
    // if near a workshop milestone, prepare EVE transform/visuals and spawn themed particles
    if(active && /^workshop/.test(m.key)){
      applyEveWorkshopVariant(m.key);
  // award small visit reward only on first passive approach
      if(!state.timeline.visited.has(m.key)){
        state.timeline.visited.add(m.key);
        // XP disabled: preserve visit tracking and show a small toast
        toast('Visited: ' + m.title);
        // spawn a short burst of themed particles
        spawnTimelineParticles(m.key, trackX, m.y);
      }
    }
    // compute attenuation based on torch distance (EVE position)
    let atten = 1;
    try{
      const eve = document.getElementById('cursor-eve');
      const r = eve?.getBoundingClientRect();
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

  // collectibles & ambient & hack progress updates + crystals + ripples
  updateAmbient(); updateOrbs(); updateHackMiniGame(); updateConfetti(); checkCompetitionCelebration(); updateCrystals(); updateRipples();
  drawAmbient(); drawCrystals(); drawOrbs(); drawTimelineParticles(); drawTether(); drawHackMiniGame(); drawMilestoneTooltip(); drawRipples(); drawConfetti(); drawTimelineMinimap();
  // clear workshop variant if no current active workshop milestone proximity
  if(!(state.near && /workshop/.test(state.near.type||''))){
    if(state.currentWorkshopVariant){
      clearEveWorkshopVariant();
    }
  }
  ctx.font='12px ui-sans-serif'; ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,.6)';
  if(p.y < 240) ctx.fillText('Spark Flash ↓ / S descend • Up / W exit', trackX, 54); else ctx.fillText('Spark Flash: E open • Up climb • Up @ top exit', trackX, 54);
  // torch spotlight (simulate from EVE position relative to pointer; fallback center)
  try{
    const eve = document.getElementById('cursor-eve');
    const r = eve?.getBoundingClientRect();
    const bx = r ? r.left + r.width/2 : W/2;
    const by = r ? r.top + r.height/2 : H/2;
    // intensify spotlight when near a milestone
    const nearFactor = state.near && state.near.type && state.near.type.startsWith('timeline:') ? 0.65 : 0.45;
    const grad = ctx.createRadialGradient(bx,by,40,bx,by,450);
    // Purple-white underground torch light with WALL-E theme
    grad.addColorStop(0,'rgba(255,255,255,'+nearFactor.toFixed(3)+')');
    grad.addColorStop(0.15,'rgba(199,125,255,'+(nearFactor*0.8).toFixed(3)+')');
    grad.addColorStop(0.35,'rgba(166,99,204,'+(nearFactor*0.6).toFixed(3)+')');
    grad.addColorStop(0.55,'rgba(139,79,179,'+(nearFactor*0.4).toFixed(3)+')');
    grad.addColorStop(0.75,'rgba(106,76,147,'+(nearFactor*0.25).toFixed(3)+')');
    grad.addColorStop(1,'rgba(0,0,0,0.92)');
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
  // seed crystals on cave walls
  if(!tl._crystalsSeeded){
  const list = []; let count = 32;
  if(Math.min(W,H) < 640) count = 20; // reduce on small mobile screens
    for(let i=0;i<count;i++){
      list.push({ y: Math.random()*tl.length, x: (Math.random()<0.5? (W/2 - 110 - Math.random()*120) : (W/2 + 110 + Math.random()*120)), size: 8+Math.random()*16, phase: Math.random()*Math.PI*2 });
    }
    tl.crystals = list; tl._crystalsSeeded = true;
  }
  if(!tl.ripples) tl.ripples = [];
}

function updateCrystals(){
  const tl = state.timeline; const p = state.player;
  (tl.crystals||[]).forEach(c=>{ c.phase += state.dt*1.4; c.bright = 0.3 + 0.7*Math.max(0, 1 - Math.abs((c.y - p.y))/220); });
}
function drawCrystals(){
  const tl = state.timeline; const camY = state.camera.y;
  (tl.crystals||[]).forEach(c=>{
    const y = c.y - camY; if(y<-60||y>H+60) return;
    const pul = (Math.sin(c.phase*2)+1)/2;
    const a = Math.min(1, (0.25 + 0.55*pul) * (c.bright||0.6));
    const g = ctx.createRadialGradient(c.x, y, 0, c.x, y, c.size*3);
    g.addColorStop(0, `rgba(124,248,200,${(0.35*a).toFixed(3)})`);
    g.addColorStop(1, 'rgba(124,248,200,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(c.x,y,c.size*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(180, 236, 220, ${Math.min(0.9,0.45+0.35*a).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(c.x, y - c.size);
    ctx.lineTo(c.x + c.size*0.7, y);
    ctx.lineTo(c.x, y + c.size*1.1);
    ctx.lineTo(c.x - c.size*0.7, y);
    ctx.closePath(); ctx.fill();
  });
}

function updateRipples(){
  const tl = state.timeline; if(!tl.ripples) return; const dt = state.dt;
  for(let i=tl.ripples.length-1;i>=0;i--){ const r=tl.ripples[i]; r.t+=dt; r.r+=120*dt; r.a = Math.max(0, 1 - r.t/1.2); if(r.a<=0) tl.ripples.splice(i,1); }
}
function drawRipples(){
  const tl = state.timeline; if(!tl.ripples) return; const camY = state.camera.y;
  tl.ripples.forEach(r=>{
    const y = r.y - camY; if(y<-40||y>H+40) return;
    const g = ctx.createRadialGradient(W/2, y, r.r*0.6, W/2, y, r.r);
    g.addColorStop(0, `rgba(124,248,200,${(0.12*r.a).toFixed(3)})`);
    g.addColorStop(1, 'rgba(124,248,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W/2, y, r.r, 0, Math.PI*2); ctx.fill();
  });
}

// Handle timeline tap interactions (crystals + path ripples)
function handleTimelineTap(e){
  try{
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left);
    const cy = (e.clientY - rect.top);
    const tl = state.timeline; const camY = state.camera.y;
    let did=false;
    // Tap crystals on cave walls for sparkle and ripple
    (tl.crystals||[]).forEach(c=>{
      const yScreen = c.y - camY;
      if(Math.abs(cx - c.x) < 28 && Math.abs(cy - yScreen) < 28){
        const now = performance.now();
        if(!c._cool || now - c._cool > 650){
          c._cool = now;
          tl.ripples.push({ y:c.y, r:8, t:0, a:1 });
          // shard sparkles as particles
          for(let i=0;i<10;i++) tl.particles.push({type:'pixel', x:c.x + (Math.random()*20-10), y:c.y + (Math.random()*12-6), vx:(Math.random()*2-1)*40, vy:(Math.random()*-1-0.2)*60, life:800+Math.random()*600});
          // ambient spark
          tl.ambient.push({x:c.x, y:c.y, r:2, drift:0.2, pulse:0, spark:true, life:1000});
          did = true;
        }
      }
    });
    // Tap near the center path to spawn a ripple at that y
    if(!did && Math.abs(cx - W/2) < 50){
      const yWorld = cy + camY;
      tl.ripples.push({ y:yWorld, r:8, t:0, a:1 });
      did = true;
    }
    // subtle haptics
    if(did){ try{ if(navigator.vibrate) navigator.vibrate(12); }catch{}
    }
  }catch{}
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
  // spawn ripple on the path
  state.timeline.ripples.push({ y:o.y, r:6, t:0, a:1 });
  // subtle haptics on collect
  try{ if(navigator.vibrate) navigator.vibrate(10); }catch{}
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


// Apply workshop styling to EVE cursor for each workshop
function applyEveWorkshopVariant(key){
  const eve = document.getElementById('cursor-eve'); if(!eve) return;
  if(state.currentWorkshopVariant !== key){
    eve.classList.add('variant-transition');
    setTimeout(()=> eve.classList.remove('variant-transition'), 480);
  }
  eve.classList.remove('workshop-game','workshop-ctf','workshop-code');
  if(key==='workshop1'){
    eve.classList.add('workshop-game');
  } else if(key==='workshop2'){
    eve.classList.add('workshop-ctf');
  } else if(key==='workshop3'){
    eve.classList.add('workshop-code');
  }
  state.currentWorkshopVariant = key;
}

function clearEveWorkshopVariant(){
  const eve = document.getElementById('cursor-eve'); if(!eve) return;
  eve.classList.remove('workshop-game','workshop-ctf','workshop-code');
  state.currentWorkshopVariant = null;
}

/* ======= Car drawing ======= */
// WALL-E Animation State Machine and Character Update
function updateWallEAnimations() {
  const walle = state.walle;
  const dt = state.dt;
  const p = state.player;
  const t = performance.now();
  
  // Eye blink animation (every 4-6 seconds with natural variation)
  walle.eyeBlink.timer += dt;
  const blinkInterval = 4 + Math.sin(t * 0.0003) * 2; // 4-6 second variance
  if (walle.eyeBlink.timer > blinkInterval) {
    walle.eyeBlink.isBlinking = true;
    setTimeout(() => walle.eyeBlink.isBlinking = false, 120);
    walle.eyeBlink.timer = 0;
  }
  
  // Curiosity mode near interaction points
  const nearBranch = state.near;
  const wasInCuriosityMode = walle.curiosityMode;
  walle.curiosityMode = !!nearBranch;
  
  // Play sound when WALL-E becomes curious
  if (walle.curiosityMode && !wasInCuriosityMode) {
    playWalleExpression('curious');
  }
  
  // Eye blink with occasional beep
  if (walle.eyeBlink.isBlinking && Math.random() < 0.3) {
    playSound('walle_chirp', Math.random() * 100 - 50);
  }
  
  // Head tilt based on movement and curiosity
  if (walle.curiosityMode) {
    walle.headTilt = Math.sin(t * 0.003) * 12; // Curious head bob
  } else if (Math.abs(p.vx) > 100) {
    walle.headTilt = Math.sign(p.vx) * 5; // Lean into turns
  } else {
    walle.headTilt = Math.sin(t * 0.001) * 3; // Idle gentle sway
  }
  
  // Arm animation based on movement
  const isMoving = Math.abs(p.vx) > 20;
  if (isMoving) {
    walle.armExtension.left = 0.3 + Math.sin(t * 0.004) * 0.2;
    walle.armExtension.right = 0.3 + Math.sin(t * 0.004 + Math.PI) * 0.2;
  } else {
    walle.armExtension.left = Math.max(0, walle.armExtension.left - dt * 0.8);
    walle.armExtension.right = Math.max(0, walle.armExtension.right - dt * 0.8);
  }
  
  // Antenna blinking (status indicator)
  walle.antennaStatus = Math.sin(t * 0.003) > 0.7 ? 1 : 0.3;
}

// Hyper-detailed film-accurate WALL-E drawing function
function drawWallE() {
  const p = state.player;
  const walle = state.walle;
  const t = performance.now() * 0.001;
  const sx = p.x - state.camera.x;
  const sy = p.y;
  
  ctx.save();
  ctx.translate(sx, sy);
  
  // Apply head tilt rotation
  if (walle.headTilt) {
    ctx.rotate(walle.headTilt * Math.PI / 180 * 0.1); // Subtle body lean
  }

  // === CHASSIS (CORE BODY) ===
  // Base dimensions adjusted for WALL-E proportions (80x60px from 80x36px)
  const bodyW = p.w;
  const bodyH = 60;
  
  // Main body gradient with film-accurate yellow
  const bodyGrad = ctx.createLinearGradient(-bodyW/2, -bodyH/2, bodyW/2, bodyH/2);
  bodyGrad.addColorStop(0, '#D4A574'); // Pixar's canonical yellow
  bodyGrad.addColorStop(0.3, '#C49664'); // Mid tone
  bodyGrad.addColorStop(1, '#B08854'); // Shadow tone
  
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 6);
  ctx.fill();
  
  // Weathering and rust effects
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  // Rust patches (organic blob shapes)
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(-bodyW/3, -bodyH/4, 8, 0, Math.PI * 2);
  ctx.arc(bodyW/4, bodyH/3, 6, 0, Math.PI * 2);
  ctx.arc(-bodyW/6, bodyH/2, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Paint chips (exposed metal)
  ctx.fillStyle = '#737472';
  ctx.fillRect(-bodyW/2 + 5, -bodyH/2 + 8, 3, 2);
  ctx.fillRect(bodyW/2 - 8, bodyH/2 - 5, 4, 2);
  ctx.fillRect(-bodyW/4, -bodyH/3, 2, 3);
  
  ctx.restore();
  
  // Panel seams and rivets
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-bodyW/2 + 10, -bodyH/2);
  ctx.lineTo(-bodyW/2 + 10, bodyH/2);
  ctx.moveTo(bodyW/2 - 10, -bodyH/2);
  ctx.lineTo(bodyW/2 - 10, bodyH/2);
  ctx.stroke();
  
  // Rivets
  ctx.fillStyle = '#737472';
  const rivetPositions = [
    [-bodyW/2 + 10, -bodyH/3], [bodyW/2 - 10, -bodyH/3],
    [-bodyW/2 + 10, bodyH/3], [bodyW/2 - 10, bodyH/3]
  ];
  rivetPositions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Front compactor door (closed - could animate open for interactions)
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-bodyW/3, -bodyH/2, bodyW/1.5, bodyH/3, 3);
  ctx.stroke();

  // === TREADS (NO WHEELS!) ===
  const treadY = bodyH/2 + 8;
  const treadWidth = 18;
  const treadHeight = 12;
  
  // Calculate tread animation based on movement
  const treadOffset = (t * Math.abs(p.vx) * 0.01) % 8;
  
  // Left tread
  drawTread(-bodyW/3, treadY, treadWidth, treadHeight, treadOffset, 'left');
  
  // Right tread  
  drawTread(bodyW/3, treadY, treadWidth, treadHeight, treadOffset, 'right');

  // === BINOCULAR EYES (EXPRESSIVE CORE) ===
  const neckExtension = 5 + Math.sin(t * 0.002) * 2; // Subtle breathing
  const headY = -bodyH/2 - 20 - neckExtension;
  
  // Telescoping neck segments
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 6;
  const neckSegments = 3;
  for (let i = 0; i < neckSegments; i++) {
    const segY = -bodyH/2 - (i + 1) * 5 - neckExtension * (i / neckSegments);
    ctx.beginPath();
    ctx.moveTo(-8, segY);
    ctx.lineTo(8, segY);
    ctx.stroke();
  }
  
  // Head rotation for curiosity
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(walle.headTilt * Math.PI / 180);
  
  // Binocular housing
  const eyeHousingW = 45;
  const eyeHousingH = 20;
  ctx.fillStyle = '#737472';
  ctx.beginPath();
  ctx.roundRect(-eyeHousingW/2, -eyeHousingH/2, eyeHousingW, eyeHousingH, 5);
  ctx.fill();
  
  // Housing weathering
  ctx.fillStyle = '#555';
  ctx.fillRect(-eyeHousingW/2 + 2, -eyeHousingH/2 + 2, eyeHousingW - 4, 3);
  
  // Individual eye assemblies
  const eyeSpacing = 16;
  [-1, 1].forEach((side, i) => {
    const eyeX = side * eyeSpacing;
    
    // Eye socket (deep recess)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(eyeX, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Lens assembly
    const blinkScale = walle.eyeBlink.isBlinking ? 0.1 : 1;
    const pupilSize = walle.curiosityMode ? 6 : 5;
    
    ctx.save();
    ctx.translate(eyeX, 0);
    ctx.scale(1, blinkScale);
    
    // Outer lens ring
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Glowing lens
    const eyeGlow = 0.7 + 0.3 * Math.sin(t * 1.5 + i * Math.PI);
    const lensGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    lensGrad.addColorStop(0, `rgba(74,144,226,${eyeGlow})`);
    lensGrad.addColorStop(0.7, `rgba(74,144,226,${eyeGlow * 0.6})`);
    lensGrad.addColorStop(1, 'rgba(74,144,226,0.2)');
    
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Mechanical iris and pupil
    if (!walle.eyeBlink.isBlinking) {
      // Iris blades (simplified)
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      for (let blade = 0; blade < 6; blade++) {
        const angle = (blade / 6) * Math.PI * 2;
        const x1 = Math.cos(angle) * pupilSize;
        const y1 = Math.sin(angle) * pupilSize;
        const x2 = Math.cos(angle) * (pupilSize + 2);
        const y2 = Math.sin(angle) * (pupilSize + 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      // Black pupil with slight tracking
      const trackX = walle.curiosityMode ? Math.sin(t * 0.003) * 1.5 : 0;
      const trackY = walle.curiosityMode ? Math.cos(t * 0.003) * 1 : 0;
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(trackX, trackY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupil highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(trackX - 1, trackY - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    
    // Lens smudges for realism
    if (Math.random() > 0.95) { // Occasionally visible
      ctx.fillStyle = 'rgba(150,150,150,0.2)';
      ctx.beginPath();
      ctx.arc(eyeX + Math.random() * 4 - 2, Math.random() * 4 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  ctx.restore(); // End head rotation

  // === ARMS/HANDS (HYDRAULIC) ===
  const armBaseY = -5;
  
  // Left arm
  drawHydraulicArm(-bodyW/2, armBaseY, walle.armExtension.left, -1);
  
  // Right arm
  drawHydraulicArm(bodyW/2, armBaseY, walle.armExtension.right, 1);

  // === SMALL DETAILS FOR CUTENESS ===
  
  // Antenna with blinking status light
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyW/3, -bodyH/2);
  ctx.lineTo(bodyW/3 + 5, -bodyH/2 - 15);
  ctx.stroke();
  
  // Blinking red light
  ctx.fillStyle = `rgba(187,0,5,${walle.antennaStatus})`;
  ctx.beginPath();
  ctx.arc(bodyW/3 + 5, -bodyH/2 - 15, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Status indicator LEDs on chest
  const ledPositions = [
    [-8, -5], [8, -5], [0, 5] // Three LEDs in triangle formation
  ];
  ledPositions.forEach(([x, y], i) => {
    const ledState = (t + i) % 3 < 1 ? 0.8 : 0.2;
    ctx.fillStyle = `rgba(187,0,5,${ledState})`;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Side vents with subtle steam effect
  if (Math.abs(p.vx) > 200) { // Only when moving fast
    ctx.fillStyle = 'rgba(200,220,255,0.3)';
    for (let i = 0; i < 3; i++) {
      const steam = {
        x: -bodyW/2 - 3 + Math.random() * 2,
        y: -bodyH/4 + i * 5 + Math.random() * 3,
        size: 1 + Math.random()
      };
      ctx.beginPath();
      ctx.arc(steam.x, steam.y, steam.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Projected shadow for 2.5D depth
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.scale(1, 0.3);
  ctx.translate(0, bodyH * 2);
  ctx.beginPath();
  ctx.ellipse(0, 0, bodyW/2, bodyH/3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  ctx.restore(); // End main transform
}

// Helper function to draw detailed tank treads
function drawTread(x, y, width, height, offset, side) {
  ctx.save();
  ctx.translate(x, y);
  
  // Main tread body (rubber belt)
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.roundRect(-width/2, -height/2, width, height, 4);
  ctx.fill();
  
  // Metal lugs (16 per tread as per research)
  const lugCount = 6; // Visible lugs on curved section
  const lugSpacing = width / (lugCount - 1);
  
  ctx.fillStyle = '#A9A9A9';
  for (let i = 0; i < lugCount; i++) {
    const lugX = -width/2 + i * lugSpacing + offset % lugSpacing;
    if (lugX >= -width/2 && lugX <= width/2) {
      // Lug with wear patterns
      ctx.beginPath();
      ctx.roundRect(lugX - 1, -height/2 - 2, 2, height + 4, 1);
      ctx.fill();
      
      // Wear chips on lugs
      if (Math.random() > 0.7) {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(lugX, -height/2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#A9A9A9';
      }
    }
  }
  
  // Mud/dust buildup
  ctx.fillStyle = '#D2B48C';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.roundRect(-width/2 + 2, height/2 - 2, width - 4, 2, 1);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Drive sprocket (simplified)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, height/2 - 1, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
  
  // Dust particles when moving
  if (Math.abs(state.player.vx) > 50) {
    const dustCount = Math.floor(Math.abs(state.player.vx) / 100);
    for (let i = 0; i < dustCount; i++) {
      const dust = {
        x: x + (Math.random() - 0.5) * width * 2,
        y: y + height/2 + Math.random() * 10,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.3
      };
      
      ctx.fillStyle = `rgba(210,180,140,${dust.alpha})`;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Helper function to draw hydraulic arms
function drawHydraulicArm(baseX, baseY, extension, side) {
  const maxLength = 25;
  const currentLength = maxLength * extension;
  
  ctx.save();
  ctx.translate(baseX, baseY);
  
  // Hydraulic piston body
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(side * currentLength, 0);
  ctx.stroke();
  
  // Piston segments for telescoping effect
  const segments = 3;
  for (let i = 0; i < segments; i++) {
    const segLength = (currentLength / segments) * (i + 1);
    ctx.strokeStyle = i % 2 ? '#777' : '#999';
    ctx.lineWidth = 4 - i;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * segLength, 0);
    ctx.stroke();
  }
  
  // Hand gripper (3-fingered)
  if (extension > 0.1) {
    const handX = side * currentLength;
    ctx.fillStyle = '#A9A9A9';
    
    // Palm
    ctx.beginPath();
    ctx.arc(handX, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Three fingers
    const fingerAngles = [-30, 0, 30];
    fingerAngles.forEach(angle => {
      const rad = angle * Math.PI / 180;
      const fingerLength = 6;
      const fx = handX + Math.cos(rad) * fingerLength * side;
      const fy = Math.sin(rad) * fingerLength;
      
      ctx.strokeStyle = '#A9A9A9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(handX, 0);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    });
  }
  
  // Hydraulic fluid leaks (weathering detail)
  if (Math.random() > 0.8 && extension > 0.3) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(side * currentLength * 0.7, -2, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// Collision detection for WALL-E and trash pile
function checkTrashPileCollision() {
  const p = state.player;
  const trash = state.trashPile;
  
  // Simple box collision detection
  const wallELeft = p.x - p.w/2;
  const wallERight = p.x + p.w/2;
  const wallETop = p.y - p.h/2;
  const wallEBottom = p.y + p.h/2;
  
  const trashLeft = trash.x - trash.width/2;
  const trashRight = trash.x + trash.width/2;
  const trashTop = trash.y - trash.height/2;
  const trashBottom = trash.y + trash.height/2;
  
  // Check if WALL-E is colliding with trash pile
  if (wallERight > trashLeft && wallELeft < trashRight &&
      wallEBottom > trashTop && wallETop < trashBottom) {
    
    if (!trash.collided) {
      // First time collision
      trash.collided = true;
      
      // Visual feedback
      toast('🤖🗑️ WALL-E found some interesting trash!');
      
      // Add some curiosity animation
      state.walle.curiosityMode = true;
      state.walle.headTilt = 10;
      
      // Reset curiosity mode after a delay
      setTimeout(() => {
        state.walle.curiosityMode = false;
        state.walle.headTilt = 0;
      }, 2000);
      
      // Stop WALL-E briefly to examine the trash
      state.player.vx *= 0.3;
    }
    
    return true;
  }
  
  return false;
}

// Legacy car drawing function - REPLACED BY WALL-E SYSTEM
// This function is disabled in favor of the new hyper-detailed film-accurate WALL-E
function drawCar_LEGACY(){
  const p = state.player;
  const y = p.y, x = (state.mode==='timeline' ? p.x : (p.x - state.camera.x));
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
    // Advanced drill/rocket morph with animated drill head and side lights
    const baseW = p.w * 1.05;
    const bodyH = p.h + 66;
    const t = performance.now()*0.002;
    ctx.save();
    ctx.translate(x,y);
    // Body
    const bodyGrad = ctx.createLinearGradient(-baseW/2,-bodyH/2,baseW/2,bodyH/2);
    bodyGrad.addColorStop(0,'#6be3f5'); bodyGrad.addColorStop(0.5,'#7cf8c8'); bodyGrad.addColorStop(1,'#8aa4ff');
    ctx.fillStyle = bodyGrad; ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(0,-bodyH/2);
    ctx.lineTo(baseW/2, bodyH/2-18);
    ctx.lineTo(0, bodyH/2);
    ctx.lineTo(-baseW/2, bodyH/2-18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Window
    ctx.fillStyle='rgba(4,10,20,.6)'; ctx.beginPath(); ctx.ellipse(0,-10, baseW*0.26, 15,0,0,Math.PI*2); ctx.fill();
    // Side lights pulsating
    const pul = (Math.sin(t*3)+1)/2;
    ctx.fillStyle = `rgba(124,248,200,${(0.65+0.35*pul).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(-baseW/2+10, 4, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(baseW/2-10, 4, 4, 0, Math.PI*2); ctx.fill();
    // Rotating drill head
    const r = 20; const seg = 6; const ang = performance.now()*0.02 * Math.sign(state.player.vy||1);
    ctx.save(); ctx.translate(0, -bodyH/2 + 6); ctx.rotate(ang);
    for(let i=0;i<seg;i++){
      const a = (i*(Math.PI*2/seg));
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      ctx.lineTo(Math.cos(a+0.2)*(r+10), Math.sin(a+0.2)*(r+10));
      ctx.closePath();
      ctx.fillStyle = i%2? 'rgba(230,240,255,.9)':'rgba(200,230,255,.8)';
      ctx.fill();
    }
    // Drill glow
    const dg = ctx.createRadialGradient(0,0,0,0,0,r+16);
    dg.addColorStop(0,'rgba(124,248,200,.55)'); dg.addColorStop(1,'rgba(124,248,200,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0,0,r+16,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // Thruster flame if moving
    if(state.player.vy>20){
      const f = ctx.createLinearGradient(0,0,0,66); f.addColorStop(0,'rgba(255,210,120,.95)'); f.addColorStop(1,'rgba(255,90,30,0)');
      ctx.fillStyle=f; ctx.beginPath(); ctx.moveTo(0, bodyH/2); ctx.lineTo(12, bodyH/2+66); ctx.lineTo(-12, bodyH/2+66); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  } else {
    // Draw WALL-E character instead of car
    drawWallE();
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

  // Always update the world transition so the cinematic can play while paused
  if(state.worldTransition && state.worldTransition.active){
    updateWorldTransition();
  }
  
  // Update WALL-E animations
  updateWallEAnimations();
  
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
      
      // Add movement sound effects
      if(Math.abs(p.vx) > 50 && Math.random() < 0.03) {
        const pitchVariation = (Math.abs(p.vx) / p.maxSpeed) * 100 - 50; // Higher pitch when moving faster
        playSound('walle_move', pitchVariation);
      }
      
      if(Math.abs(p.ax) > p.accel*0.8 && Math.abs(prevV) > p.maxSpeed*0.4){
        state.skids.push({ x:p.x, alpha:0.25 });
        if(state.skids.length>120) state.skids.shift();
        // Play acceleration sound
        playSound('walle_beep', Math.random() * 100 - 50);
      }
      state.camera.x = clamp(p.x - W*0.5, 0, state.world.length - W + 0);
      
      // Apply camera shake from world transition
      if (state.worldTransition.active && state.worldTransition.cameraShake > 0) {
        state.camera.x += (Math.random() - 0.5) * state.worldTransition.cameraShake;
        state.camera.y += (Math.random() - 0.5) * state.worldTransition.cameraShake * 0.5; // Vertical shake too
      }
      state.near = null;
      handleCollisions();
      checkTrashPileCollision(); // Check WALL-E collision with trash pile
      updateGhost();
      updateFireworks();
      updatePlayerTrail(); // Update dynamic energy trail
      updateWeather(); // Update weather system
  // updateWorldTransition runs above even if paused
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
  // Lock horizontal position to track and constrain movement strictly on the green path
  state.player.x = W/2; // hard lock to center path in CSS px space
  p.y += p.vy * dt;
      
      // Collision detection at CTF barrier
      const ctfMilestone = state.timeline.milestones.find(m => m.key === 'workshop2');
      if (ctfMilestone) {
        const barrierY = ctfMilestone.y + 80; // Barrier slightly after CTF
        if (p.y > barrierY) {
          p.y = barrierY; // Stop at barrier
          p.vy = Math.min(0, p.vy); // Cancel downward velocity
          // Show bounce back effect and feedback
          if (p.vy > 20) {
            p.vy = -p.vy * 0.3; // Small bounce back
            // Show feedback message
            if (!state.timeline.barrierMessageShown) {
              toast('🚧 Construction ahead - CTF workshop is the current limit!');
              state.timeline.barrierMessageShown = true;
            }
          }
        }
      }
      
      p.y = clamp(p.y, 140, state.timeline.length);
      // Auto-exit when pushing beyond the top while going up (mobile-friendly)
      if(p.y <= 142 && (upKey || p.vy < -20)){
        exitTimeline();
        // prevent further timeline update this frame
        return requestAnimationFrame(step);
      }
  // inertial smoothing for camera (ease toward target)
  const targetCam = clamp(p.y - H*0.45, 0, state.timeline.length - H*0.5 + 200);
  if(!state.timeline.camY) state.timeline.camY = targetCam;
  const ease = state._timelineCamEase || 3.5;
  state.timeline.camY += (targetCam - state.timeline.camY) * Math.min(1, dt*ease);
  state.camera.y = state.timeline.camY;
    }

  // fuel removed
  }

  // draw
  ctx.clearRect(0,0,W,H);

  // Evaluate EVE expression triggers (after updating physics & player speed)
  try{
    const eve = domCache.getCursorEve();
    if(eve){
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
          eve.setAttribute('data-mode','thrilled');
          botExpr.lastThrillT = tNow;
        }
      } else if(eve.getAttribute('data-mode')==='thrilled' && speed < max*0.5){
        // release thrilled if slowing down and not overlapped by other forced states
        eve.removeAttribute('data-mode');
      }
      // Idle boredom stages
      if(eve.getAttribute('data-mode')!=='thrilled'){ // don't override thrill
        if(!botExpr.sleepyTriggered && botExpr.idleAccum > 35){
          eve.setAttribute('data-mode','sleepy');
          botExpr.sleepyTriggered = true;
        } else if(!botExpr.boredTriggered && botExpr.idleAccum > 12){
          eve.setAttribute('data-mode','bored');
          botExpr.boredTriggered = true;
        }
      }
      // If user interacts (keys) clear bored/sleepy quickly
      if(moving && (eve.getAttribute('data-mode')==='bored' || eve.getAttribute('data-mode')==='sleepy')){
        eve.removeAttribute('data-mode');
      }
    }
  }catch{}
  if(state.mode==='road'){
    drawBackground(); // background for reflections
    drawRoad();
    drawTrashPile(); // Draw trash pile on the road

    // Reflections on wet road
    drawReflections();

    // World scene
    drawRevealedData(); // hidden layer first so WALL-E overlays if needed
    drawPlayerTrail();
    updateWallEAnimations();
    drawWallE();
    drawGhost();
    drawFireworks();

    // Screen-space effects last
    drawSpotlight();
    drawRain();
    drawWorldTransition();
  } else if(state.mode==='timeline'){
    drawTimeline();
    const trackX = W/2; // center alignment
    const savedX = state.player.x;
    state.player.x = trackX; // lock horizontally in timeline
    ctx.save();
    ctx.translate(0, -state.camera.y);
    updateWallEAnimations();
    drawWallE();
    ctx.restore();
    state.player.x = savedX;
  }
  // Screen-space EVE aura (memorable companion)
  drawEveAura();
  // HUD for fuel/boost removed

  requestAnimationFrame(step);
}
requestAnimationFrame(step);

// Initialize trash pile image
function initTrashPile() {
  const img = new Image();
  img.onload = () => {
    state.trashPile.image = img;
  };
  img.onerror = () => {
    console.warn('Failed to load trash pile image');
  };
  img.src = 'assets/trash-pile.png';
}
initTrashPile();

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
  // Update trash pile position to stay on road surface
  state.trashPile.y = H - 120;
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
  if(state.mode !== 'road') return; // ignore road sign clicks while in timeline
  // detect if clicked near a sign; translate to world x (CSS pixels)
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left); // CSS px since we scale the context by DPR
  const wx = cx + state.camera.x;
  let found = null;
  for(const b of GAME_DATA.branches){
    if(Math.abs(wx - b.x) < 80){ found = b; break; }
  }
  if(found){
  if(found.type==='phase1'){ startWorldTransition(); } else { openBranch(found); }
  }
});

/* ======= Initial friendly toast ======= */
// Guided start overlay shown only for first-time visitors
(function guidedStart(){
  try{
    const seen = localStorage.getItem('sparkit_guided_start_v2'); // Changed to v2 to show help to all users
    const overlay = document.getElementById('guide-overlay');
    if(!overlay) return;
    if(seen){ // Already seen: skip overlay and show shorter toast after a delay
      setTimeout(()=>toast('Drive → stop at signs. E to interact.'), 700);
      return;
    }
    
    // Show comprehensive help on first visit
    setTimeout(() => {
      showHelp();
      localStorage.setItem('sparkit_guided_start_v2','1');
      // Also dismiss the guide overlay if it exists
      if(overlay) {
        overlay.classList.add('fading');
        setTimeout(()=>{ overlay.remove(); }, 650);
      }
    }, 1000); // Delay to let game load first
    
    return; // Skip the old overlay system
    
    // Activate overlay
    overlay.classList.add('active');
    let dismissed = false;
    function dismiss(reason){
      if(dismissed) return; dismissed = true;
      overlay.classList.add('fading');
      setTimeout(()=>{ overlay.remove(); }, 650);
      localStorage.setItem('sparkit_guided_start_v2','1');
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

/* ======= EVE Cursor Character ======= */
(()=>{
  const eve = document.getElementById('cursor-eve');
  if(!eve) return;
  const body = document.body;
  const closeBtn = document.getElementById('closePanel');
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
  // Avoid zones (buttons) — repulsion only when driving
  let avoidRects = [];
  function refreshAvoidRects(){
    const ids = ['leftBtn','rightBtn','interactBtn','upBtn','downBtn','interactBtn2','touch','touch-vertical'];
    avoidRects = ids.map(id=>{ const el=document.getElementById(id); if(!el) return null; const r=el.getBoundingClientRect(); return {el,r}; }).filter(Boolean);
  }
  refreshAvoidRects();
  // expose for UI toggles
  window._refreshEveAvoidRects = ()=>{ refreshAvoidRects(); };
  addEventListener('resize', ()=> setTimeout(refreshAvoidRects, 0));
  const vv = window.visualViewport; if(vv){
    vv.addEventListener('resize', ()=> setTimeout(refreshAvoidRects, 0));
    vv.addEventListener('scroll', ()=> setTimeout(refreshAvoidRects, 0));
  }
  let lastBumpT = 0;
  function loop(now){
    const dt = Math.min(.05,(now - (loop._last||now))/1000); loop._last = now;
    const ax = (tx - x)*followEase - vx*damp;
    const ay = (ty - y)*followEase - vy*damp;
    vx += ax*dt; vy += ay*dt;
    x += vx*dt; y += vy*dt;
    eve.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    // idle / active state
    if(now - lastMoveT < 280){ eve.classList.add('active'); } else { eve.classList.remove('active'); }
    if(waveCooldown>0) waveCooldown -= dt;

    // Proximity avoidance to buttons when vehicle is driving
    try{
      const p = state.player || {vx:0,vy:0};
      const driving = state.mode==='road' ? Math.abs(p.vx) > 6 : Math.abs(p.vy) > 6;
      if(driving){
        // Repel from any control rects within radius
        const R = 110; // influence radius
        let rx = 0, ry = 0, mag = 0;
        avoidRects.forEach(({r})=>{
          // Use nearest point on rect to bot center
          const cx = clamp(x, r.left, r.right);
          const cy = clamp(y, r.top, r.bottom);
          const dx = x - cx; const dy = y - cy;
          const d = Math.hypot(dx,dy);
          if(d < R && d > 0.001){
            const k = 1 - (d/R);
            const f = k*k*120; // quadratic falloff
            rx += (dx/d) * f;
            ry += (dy/d) * f;
            mag += f;
          }
        });
        if(mag>0){
          // Apply repulsion by nudging the target away
          tx += rx * dt; ty += ry * dt;
          // Clamp within viewport
          tx = clamp(tx, 24, (window.innerWidth||W)-24);
          ty = clamp(ty, 24, (window.innerHeight||H)-24);
          // Emotion bump occasionally
          if(now - lastBumpT > 450){
            lastBumpT = now;
            window._eveLastBump = now;
            eve.setAttribute('data-mode','impact');
            setTimeout(()=>{ if(eve.getAttribute('data-mode')==='impact') eve.removeAttribute('data-mode'); }, 420);
          }
        }
      }
    }catch{}

    // Expression activation strictly on arrival inside target inner bounds (rectangle hysteresis)
    if(targetExpr){
      const {mode, inner, outer} = targetExpr;
      const inInner = x >= inner.l && x <= inner.r && y >= inner.t && y <= inner.b;
      const inOuter = x >= outer.l && x <= outer.r && y >= outer.t && y <= outer.b;
      if(inInner && activeMode !== mode){
        activeMode = mode;
        eve.classList.add('transitioning');
        eve.setAttribute('data-mode', activeMode);
        clearTimeout(eve._t1); eve._t1 = setTimeout(()=> eve.classList.remove('transitioning'), 240);
      } else if(activeMode === mode && !inOuter){
        activeMode=''; eve.removeAttribute('data-mode');
      }
    } else if(activeMode){ activeMode=''; eve.removeAttribute('data-mode'); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener('pointermove', e=>{
    tx = e.clientX; ty = e.clientY; lastMoveT = performance.now();
  }, {passive:true});
  window.addEventListener('pointerdown', ()=>{
    if(waveCooldown<=0){ eve.classList.add('wave'); setTimeout(()=>eve.classList.remove('wave'), 650); waveCooldown = 2.2; }
  });
  // Accessibility: allow toggle with keyboard (press C) to show system cursor again
  window.addEventListener('keydown', e=>{ if(e.code==='KeyC'){ body.classList.toggle('eve-cursor'); if(!body.classList.contains('eve-cursor')){ eve.style.display='none'; } else { eve.style.display='block'; } } });
  // Interaction with overview liquid cards: slight lean towards nearest animated card
  const observeLiquid = new MutationObserver(()=>attach());
  observeLiquid.observe(document.getElementById('panel-content'), {childList:true, subtree:true});
  function attach(){
    const grid = document.querySelector('#panel-content .grid.overview'); if(!grid) return;
    grid.addEventListener('pointermove', e=>{
      const card = e.target.closest('.card'); if(!card) return;
      // small attract effect: nudge EVE 6% toward card center
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width/2; const cy = r.top + r.height/2;
      tx += (cx - tx)*0.06; ty += (cy - ty)*0.06;
      // record desired expression ONLY; activation happens when EVE enters inner bounds
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
      eve.classList.add('mobile');
      eve.style.width='64px'; eve.style.height='64px';
      // Keep following pointer by default in mobile; no parking trap
      if(!eve._mobileInit){
        eve._mobileInit = true;
        window.addEventListener('pointermove', e=>{ tx = e.clientX; ty = e.clientY; lastMoveT = performance.now(); }, {passive:true});
        eve.addEventListener('pointerdown', ()=>{ 
          waveCooldown = 0; 
          lastMoveT = performance.now(); 
          eve.classList.add('active'); 
          // Play EVE scan sound
          playSound('eve_scan', Math.random() * 200 - 100);
        });
      }
    } else {
      eve.classList.remove('mobile');
      eve.style.width='54px'; eve.style.height='54px';
    }
  }
  applyMobileMode(detectMobile());
  window.addEventListener('resize', ()=> applyMobileMode(detectMobile()));

  // EVE doesn't have a hard-hat component, skip this observer
  // Underground mode styling is handled via CSS

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
function toggleTheme(){ 
  if(state.theme === 'neon') state.theme = 'sunset';
  else if(state.theme === 'sunset') state.theme = 'walle-purple';
  else if(state.theme === 'walle-purple') state.theme = 'walle-wasteland';
  else state.theme = 'neon';
  
  const messages = {
    'neon': 'Neon Colombo Night',
    'sunset': 'Galle Face Sunset', 
    'walle-purple': 'WALL-E Purple Cosmos',
    'walle-wasteland': 'WALL-E Wasteland Earth'
  };
  toast(messages[state.theme] || 'Theme changed');
}

// Set WALL-E Wasteland Theme directly
function setWallEWastelandTheme() {
  state.theme = 'walle-wasteland';
  // Disable day/night cycle for consistent poster look
  state.dayNight.isNight = false;
  state.settings.forceDark = false;
  toast('🤖🏜️ WALL-E Wasteland Earth activated');
}

// Make theme functions globally accessible for console testing
window.setWallEWastelandTheme = setWallEWastelandTheme;
window.toggleTheme = toggleTheme;

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
  document.body.classList.remove('overview-open'); // Remove overview class to show text boxes
  _closePanelOrig();
};

/* ================= Mobile / Responsive Enhancements (Added) ================= */
// Mobile enhancements (orientation prompt disabled)
(function mobileEnhancements(){
  const orientationOverlay = document.getElementById('orientation-overlay');
  // Disable rotate-to-play overlay entirely for mobile per request
  if(orientationOverlay){ orientationOverlay.style.display = 'none'; orientationOverlay.setAttribute('aria-hidden','true'); }

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
  // Exit timeline on mobile: when at the top band and an upward swipe starts near the top area
  canvas.addEventListener('touchstart', e=>{
    if(state.mode!=='timeline') return;
    try{
      const rect = canvas.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      if(y < 80 && state.player.y <= 148){ // near top and at top segment
        exitTimeline();
      }
    }catch{}
  }, {passive:true});

  // Prevent long-press context/menu and text selection on control buttons
  const controls = ['leftBtn','rightBtn','interactBtn','upBtn','downBtn','interactBtn2'].map(id=>document.getElementById(id)).filter(Boolean);
  controls.forEach(btn=>{
    btn.addEventListener('contextmenu', e=> e.preventDefault());
    btn.addEventListener('selectstart', e=> e.preventDefault());
    btn.setAttribute('draggable','false');
  });

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
  
  // Timeline mobile tuning: faster camera easing and hint at exit
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  if(smallScreen){ state._timelineCamEase = 5.2; }
  
  // Branch Description System with Speed Detection
  // Load descriptions from GAME_DATA content.json
  const branchDescriptions = GAME_DATA.branchDescriptions || {
    'Overview': 'Learn about the SparkIT initiative and our mission to ignite ICT literacy across Sri Lanka',
    'Phase 1 — Register': 'Join the competition by completing your registration and profile setup',
    'SparkIT Fusion': 'Advanced fusion of technology and innovation - Coming Soon! Register for Phase 1 first.',
    'FAQ': 'Find answers to common questions about SparkIT and the competition process',
    'Contact': 'Get in touch with our team for support, partnerships, or more information'
  };
  
  // Underground timeline descriptions (excluding registration)
  const undergroundDescriptions = GAME_DATA.undergroundDescriptions || {
    'Robotics and Automations': 'Workshop 1 — Robotics and Automations: design, build & program autonomous systems',
    'Immersive Technologies': 'Workshop 2 — Immersive Technologies: VR, AR & interactive digital experiences',
    'Programming': 'Workshop 3 — Programming: algorithms, team projects & mentoring',
    'Competitions': 'Pitch, demo & compete for recognition and prizes'
  };
  
  let branchDescription = null;
  let branchText = null;
  let undergroundDescription = null;
  let undergroundText = null;
  let currentBranch = null;
  let currentUndergroundBranch = null;
  let descriptionTimeout = null;
  let undergroundTimeout = null;
  let isDescriptionInitialized = false;
  let isUndergroundInitialized = false;
  // Track last player speed and whether the description is currently visible
  let lastPlayerSpeed = 0;
  let isDescriptionVisible = false;
  let isUndergroundVisible = false;
  
  // Mobile detection
  function isMobileDevice() {
    return window.innerWidth <= 768;
  }
  
  // Position dialog next to EVE cursor
  function positionDialogNearEve(dialog, isUnderground = false) {
    if (!dialog || !isMobileDevice()) return;
    
    const eve = document.getElementById('cursor-eve');
    if (!eve) return;
    
    const eveRect = eve.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal position relative to EVE
    const eveX = eveRect.left + eveRect.width / 2;
    const eveY = eveRect.top + eveRect.height / 2;
    
    // Preferred position: above and to the right of EVE
    let dialogX = eveX + 30;
    let dialogY = eveY - dialogRect.height - 20;
    
    // Boundary checks and adjustments
    const margin = 10;
    
    // Right boundary check
    if (dialogX + dialogRect.width > viewportWidth - margin) {
      dialogX = eveX - dialogRect.width - 30; // Move to left side
    }
    
    // Left boundary check
    if (dialogX < margin) {
      dialogX = margin;
    }
    
    // Top boundary check
    if (dialogY < margin) {
      dialogY = eveY + 40; // Move below EVE
    }
    
    // Bottom boundary check
    if (dialogY + dialogRect.height > viewportHeight - margin) {
      dialogY = viewportHeight - dialogRect.height - margin;
    }
    
    // Apply position
    dialog.style.left = `${dialogX}px`;
    dialog.style.top = `${dialogY}px`;
    
    // Update speech bubble tail position
    const tailX = Math.max(10, Math.min(dialogRect.width - 20, eveX - dialogX));
    const tailY = eveY < dialogY ? -8 : dialogRect.height;
    
    // Position the speech bubble tail to point at EVE
    const beforeTail = dialog.querySelector('::before') || dialog;
    const afterTail = dialog.querySelector('::after') || dialog;
    
    // Update CSS custom properties for tail positioning
    dialog.style.setProperty('--tail-x', `${tailX}px`);
    dialog.style.setProperty('--tail-y', `${tailY}px`);
    dialog.style.setProperty('--tail-direction', eveY < dialogY ? 'up' : 'down');
    
    // Update the tail styles dynamically
    const style = document.createElement('style');
    const tailDirection = eveY < dialogY ? 'down' : 'up';
    const borderProp = tailDirection === 'down' ? 'border-bottom' : 'border-top';
    const color1 = isUnderground ? 'rgba(199, 125, 255, 0.7)' : 'rgba(0, 184, 232, 0.4)';
    const color2 = isUnderground ? 'rgba(139, 79, 179, 0.95)' : 'rgba(255, 255, 255, 0.98)';
    
    style.textContent = `
      ${isUnderground ? '.eve-underground-dialog' : '.eve-mobile-dialog'}::before {
        left: ${tailX}px !important;
        ${tailDirection === 'down' ? 'top' : 'bottom'}: ${Math.abs(tailY)}px !important;
        ${borderProp}: 8px solid ${color1} !important;
        border-left: 8px solid transparent !important;
        border-right: 8px solid transparent !important;
        ${tailDirection === 'up' ? 'border-bottom' : 'border-top'}: none !important;
      }
      ${isUnderground ? '.eve-underground-dialog' : '.eve-mobile-dialog'}::after {
        left: ${tailX + 2}px !important;
        ${tailDirection === 'down' ? 'top' : 'bottom'}: ${Math.abs(tailY) - 2}px !important;
        ${borderProp}: 6px solid ${color2} !important;
        border-left: 6px solid transparent !important;
        border-right: 6px solid transparent !important;
        ${tailDirection === 'up' ? 'border-bottom' : 'border-top'}: none !important;
      }
    `;
    
    // Remove old style if exists
    const oldStyle = document.querySelector(`#dialog-tail-style-${isUnderground ? 'underground' : 'road'}`);
    if (oldStyle) oldStyle.remove();
    
    style.id = `dialog-tail-style-${isUnderground ? 'underground' : 'road'}`;
    document.head.appendChild(style);
  }
  
  // Get appropriate description elements based on screen size
  function getDescriptionElements() {
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      return {
        branchDescription: document.getElementById('eve-mobile-dialog'),
        branchText: document.querySelector('#eve-mobile-dialog #mobile-branch-text'),
        undergroundDescription: document.getElementById('eve-underground-dialog'),
        undergroundText: document.querySelector('#eve-underground-dialog #mobile-underground-text')
      };
    } else {
      return {
        branchDescription: document.getElementById('branch-description'),
        branchText: document.getElementById('branch-text'),
        undergroundDescription: document.getElementById('underground-description'),
        undergroundText: document.getElementById('underground-text')
      };
    }
  }
  
  // Update description elements when window resizes
  function updateDescriptionElements() {
    const elements = getDescriptionElements();
    branchDescription = elements.branchDescription;
    branchText = elements.branchText;
    undergroundDescription = elements.undergroundDescription;
    undergroundText = elements.undergroundText;
    
    // Force hide road description elements if we're in timeline or overview mode (but not underground mode for underground elements)
    const shouldHideRoad = document.body.classList.contains('timeline-mode') || 
                          document.body.classList.contains('overview-open');
    const isUndergroundMode = document.body.classList.contains('underground-mode');
    
    // Show/hide appropriate elements based on device type
    const isMobile = isMobileDevice();
    
    // Desktop elements
    const desktopBranch = document.getElementById('branch-description');
    const desktopUnderground = document.getElementById('underground-description');
    
    // Mobile elements
    const mobileBranch = document.getElementById('eve-mobile-dialog');
    const mobileUnderground = document.getElementById('eve-underground-dialog');
    
    if (shouldHideRoad) {
      // FORCE HIDE road description elements
      if (desktopBranch) desktopBranch.style.display = 'none';
      if (mobileBranch) mobileBranch.style.display = 'none';
      
      // Only hide underground elements if NOT in underground mode
      if (!isUndergroundMode) {
        if (desktopUnderground) desktopUnderground.style.display = 'none';
        if (mobileUnderground) mobileUnderground.style.display = 'none';
      }
    } else if (isMobile) {
      if (desktopBranch) desktopBranch.style.display = 'none';
      if (desktopUnderground && !isUndergroundMode) desktopUnderground.style.display = 'none';
      if (mobileBranch) mobileBranch.style.display = 'block';
      if (mobileUnderground && isUndergroundMode) mobileUnderground.style.display = 'block';
    } else {
      if (mobileBranch) mobileBranch.style.display = 'none';
      if (mobileUnderground) mobileUnderground.style.display = 'none';
      if (desktopBranch) desktopBranch.style.display = 'block';
      if (desktopUnderground && isUndergroundMode) desktopUnderground.style.display = 'block';
    }
  }
  
  // Initialize description elements when DOM is ready
  function initBranchDescription() {
    updateDescriptionElements(); // Set up appropriate elements based on screen size
    
    if (branchDescription && branchText) {
      console.log('Branch description elements found and initialized');
      isDescriptionInitialized = true;
      
      // Show default message after a delay
      setTimeout(() => {
        if (!document.body.classList.contains('pre-init') && 
            !document.body.classList.contains('loader-transition')) {
          console.log('Showing initial description box');
          branchDescription.classList.add('visible');
          // Position mobile dialog next to EVE
          if (isMobileDevice() && branchDescription.id === 'eve-mobile-dialog') {
            setTimeout(() => positionDialogNearEve(branchDescription, false), 100);
          }
        }
      }, 3000);
    } else {
      console.warn('Branch description elements not found');
    }
    
    if (undergroundDescription && undergroundText) {
      console.log('Underground description elements found and initialized');
      isUndergroundInitialized = true;
      
      // Don't automatically show underground box - only show when near milestones with content
      // Remove the automatic show logic that was here before
    } else {
      console.warn('Underground description elements not found');
    }
  }
  
  function updateUndergroundDescription(milestone) {
    if (!isUndergroundInitialized || !undergroundDescription || !undergroundText) return;

    // Only show in underground mode
    if (!document.body.classList.contains('underground-mode')) {
      if (isUndergroundVisible) {
        undergroundDescription.classList.remove('visible');
        isUndergroundVisible = false;
      }
      return;
    }

    // Check player speed - decide visibility when slowed or stopped
    const playerSpeed = Math.abs(state.player.vy || 0); // Use vertical speed for timeline
    const speedThreshold = 100; // Lower threshold for timeline movement

    console.log('Updating underground description:', milestone?.title, 'Speed:', playerSpeed.toFixed(1), 'Visible:', isUndergroundVisible);

    clearTimeout(undergroundTimeout);

    // Determine desired visibility: show when near a known milestone and player is slow/stopped
    const desiredVisible = !!(milestone && undergroundDescriptions[milestone.title] && playerSpeed <= speedThreshold);

    // If the desired visibility changed or milestone changed, update UI
    const milestoneChanged = currentUndergroundBranch !== milestone;
    currentUndergroundBranch = milestone;

    if (desiredVisible && (!isUndergroundVisible || milestoneChanged)) {
      // Smooth text transition for slow movement or when newly arrived
      console.log('Showing underground description for:', milestone.title);
      
      // Update both desktop and mobile underground text elements
      const desktopUndergroundText = document.getElementById('underground-text');
      const mobileUndergroundText = document.getElementById('mobile-underground-text');
      
      // Fade out current text
      if (undergroundText) undergroundText.style.opacity = '0.5';
      if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.style.opacity = '0.5';
      if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.style.opacity = '0.5';
      
      setTimeout(() => {
        const newText = undergroundDescriptions[milestone.title];
        
        // Update all underground text elements
        if (undergroundText) undergroundText.textContent = newText;
        if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.textContent = newText;
        if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.textContent = newText;
        
        // Fade in new text
        if (undergroundText) undergroundText.style.opacity = '1';
        if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.style.opacity = '1';
        if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.style.opacity = '1';
        
        undergroundDescription.classList.add('visible');
        isUndergroundVisible = true;
        // Position mobile dialog next to EVE
        if (isMobileDevice() && undergroundDescription.id === 'eve-underground-dialog') {
          setTimeout(() => positionDialogNearEve(undergroundDescription, true), 100);
        }
      }, 200);
    } else if (!desiredVisible && isUndergroundVisible) {
      // Hide when moving fast or no milestone nearby
      const hideDelay = playerSpeed > speedThreshold ? 100 : 500;
      console.log('Hiding underground description, delay:', hideDelay);

      undergroundTimeout = setTimeout(() => {
        // Update both desktop and mobile underground text elements
        const desktopUndergroundText = document.getElementById('underground-text');
        const mobileUndergroundText = document.getElementById('mobile-underground-text');
        
        // Fade out all text elements
        if (undergroundText) undergroundText.style.opacity = '0.5';
        if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.style.opacity = '0.5';
        if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.style.opacity = '0.5';
        
        setTimeout(() => {
          undergroundDescription.classList.remove('visible');
          isUndergroundVisible = false;
          setTimeout(() => {
            // Clear all underground text elements instead of setting default text
            if (undergroundText) undergroundText.textContent = '';
            if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.textContent = '';
            if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.textContent = '';
            
            // Restore opacity
            if (undergroundText) undergroundText.style.opacity = '1';
            if (desktopUndergroundText && desktopUndergroundText !== undergroundText) desktopUndergroundText.style.opacity = '1';
            if (mobileUndergroundText && mobileUndergroundText !== undergroundText) mobileUndergroundText.style.opacity = '1';
          }, 300);
        }, 200);
      }, hideDelay);
    }
  }

  function updateBranchDescription(branch) {
    if (!isDescriptionInitialized || !branchDescription || !branchText) return;

    // Check player speed - decide visibility when slowed or stopped
    const playerSpeed = Math.abs(state.player.vx);
    const speedThreshold = 150; // pixels per second

    console.log('Updating branch description:', branch?.label, 'Speed:', playerSpeed.toFixed(1), 'Visible:', isDescriptionVisible);

    clearTimeout(descriptionTimeout);

    // Determine desired visibility: show when near a known branch and player is slow/stopped
    const desiredVisible = !!(branch && branchDescriptions[branch.label] && playerSpeed <= speedThreshold);

    // If the desired visibility changed (e.g. we slowed down while still near the branch) or branch changed, update UI
    const branchChanged = currentBranch !== branch;
    currentBranch = branch;

    if (desiredVisible && (!isDescriptionVisible || branchChanged)) {
      // Smooth text transition for slow movement or when newly arrived
      console.log('Showing branch description for:', branch.label);
      branchText.style.opacity = '0.5';
      setTimeout(() => {
        branchText.textContent = branchDescriptions[branch.label];
        branchText.style.opacity = '1';
        branchDescription.classList.add('visible');
        isDescriptionVisible = true;
        // Position mobile dialog next to EVE
        if (isMobileDevice() && branchDescription.id === 'eve-mobile-dialog') {
          setTimeout(() => positionDialogNearEve(branchDescription, false), 100);
        }
      }, 200);
    } else if (!desiredVisible && isDescriptionVisible) {
      // Hide when moving fast or no branch nearby
      const hideDelay = playerSpeed > speedThreshold ? 100 : 600;
      console.log('Hiding description, delay:', hideDelay);

      descriptionTimeout = setTimeout(() => {
        branchText.style.opacity = '0.5';
        setTimeout(() => {
          branchDescription.classList.remove('visible');
          isDescriptionVisible = false;
          setTimeout(() => {
            branchText.textContent = 'Explore the SparkIT journey and discover opportunities ahead';
            branchText.style.opacity = '1';
          }, 300);
        }, 200);
      }, hideDelay);
    }

    lastPlayerSpeed = playerSpeed;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBranchDescription);
  } else {
    initBranchDescription();
  }
  
  // Handle window resize to switch between mobile/desktop dialogs
  window.addEventListener('resize', () => {
    setTimeout(() => {
      const wasVisible = isDescriptionVisible;
      const wasUndergroundVisible = isUndergroundVisible;
      
      // Hide current elements
      if (branchDescription && wasVisible) {
        branchDescription.classList.remove('visible');
      }
      if (undergroundDescription && wasUndergroundVisible) {
        undergroundDescription.classList.remove('visible');
      }
      
      // Update to new elements
      updateDescriptionElements();
      
      // Restore visibility on new elements
      if (branchDescription && wasVisible) {
        setTimeout(() => {
          branchDescription.classList.add('visible');
          // Position mobile dialog next to EVE
          if (isMobileDevice() && branchDescription.id === 'eve-mobile-dialog') {
            setTimeout(() => positionDialogNearEve(branchDescription, false), 100);
          }
        }, 100);
      }
      if (undergroundDescription && wasUndergroundVisible) {
        setTimeout(() => {
          undergroundDescription.classList.add('visible');
          // Position mobile dialog next to EVE
          if (isMobileDevice() && undergroundDescription.id === 'eve-underground-dialog') {
            setTimeout(() => positionDialogNearEve(undergroundDescription, true), 100);
          }
        }, 100);
      }
    }, 100);
  });
  
  // Hook into the existing game loop to monitor branch proximity and speed transitions
  let lastNearBranch = null;
  let lastNearMilestone = null;
  setInterval(() => {
    if (!isDescriptionInitialized) return;

    const nearBranch = state.near;
    const playerSpeed = Math.abs(state.player.vx || 0);

    // Handle road branches
    if (!document.body.classList.contains('underground-mode')) {
      // Trigger update when branch changes, or when we slow down/stop while staying near the same branch
      const branchChanged = nearBranch !== lastNearBranch;
      const speedDropped = playerSpeed <= 150 && lastPlayerSpeed > 150;
      const stopped = playerSpeed === 0 && lastPlayerSpeed !== 0;

      if (branchChanged || (nearBranch && (speedDropped || stopped))) {
        updateBranchDescription(nearBranch);
      }
    }

    // Handle underground timeline milestones
    if (isUndergroundInitialized && document.body.classList.contains('underground-mode')) {
      const nearMilestone = state.near && state.near._timeline ? state.near._timeline : null;
      const verticalSpeed = Math.abs(state.player.vy || 0);
      
      const milestoneChanged = nearMilestone !== lastNearMilestone;
      const verticalSpeedDropped = verticalSpeed <= 100 && Math.abs((state.player.lastVy || 0)) > 100;
      const verticalStopped = verticalSpeed === 0 && Math.abs((state.player.lastVy || 0)) !== 0;

      if (milestoneChanged || (nearMilestone && (verticalSpeedDropped || verticalStopped))) {
        updateUndergroundDescription(nearMilestone);
      }
      
      lastNearMilestone = nearMilestone;
      state.player.lastVy = state.player.vy;
    }

    lastNearBranch = nearBranch;
    lastPlayerSpeed = playerSpeed;
  }, 100);
  
  // Track cursor movement for mobile dialog positioning
  let dialogPositionTimer;
  
  function trackCursorForDialog() {
    if (!isMobileDevice()) return;
    
    clearTimeout(dialogPositionTimer);
    dialogPositionTimer = setTimeout(() => {
      const mobileDialog = document.getElementById('eve-mobile-dialog');
      const undergroundDialog = document.getElementById('eve-underground-dialog');
      
      if (mobileDialog && mobileDialog.style.display !== 'none') {
        positionDialogNearEve(mobileDialog, false);
      }
      
      if (undergroundDialog && undergroundDialog.style.display !== 'none') {
        positionDialogNearEve(undergroundDialog, true);
      }
    }, 50); // Throttle to avoid excessive updates
  }
  
  // Add event listeners for cursor tracking
  document.addEventListener('mousemove', trackCursorForDialog);
  document.addEventListener('touchmove', trackCursorForDialog);
  
  // Show a one-time hint on how to exit timeline on mobile
  let hinted=false; const origEnter=enterTimeline; enterTimeline = function(){ origEnter(); if(!hinted && isMobileDevice()){ hinted=true; setTimeout(()=> toast('Swipe up or tap ▲ to climb; Up @ top to exit'), 600); } };
})();
