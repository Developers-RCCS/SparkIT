/* ======= CONFIG: customize your project here ======= */
const GAME_DATA = {
  project: {
    name: "Axis 25 — Digital Economy Summit",
    tagline: "A 3-phase journey: learn, build, and launch.",
    about: "Axis 25 explores Sri Lanka’s digital economy through hands-on learning and maker energy. Start in Phase 1 to register and pitch your idea; build in Phase 2; showcase in Phase 3.",
    location: "Colombo, Sri Lanka",
    date: "October 10–12, 2025"
  },
  phases: [
    {
      id: 1, title: "Phase 1 — Exploration",
      summary: "Register, share your idea, and join the cohort.",
      open: true,
      formFields: [
        {name:"fullName", label:"Full Name", type:"text", required:true},
        {name:"email", label:"Email", type:"email", required:true},
        {name:"phone", label:"Phone", type:"tel", required:true},
        {name:"bio", label:"Short Bio / Motivation", type:"textarea", required:true}
      ]
    },
    {
      id: 2, title: "Phase 2 — Development",
      summary: "Prototype, test, and get mentored.",
      open: false
    },
    {
      id: 3, title: "Phase 3 — Showcase",
      summary: "Pitch and present your outcomes.",
      open: false
    }
  ],
  branches: [
    { x: 300,  label:"About Project", type:"about" },
    { x: 700,  label:"Phase 1 — Register", type:"phase1" },
    { x: 1150, label:"Phase 2 — Details", type:"phase2" },
    { x: 1600, label:"Phase 3 — Details", type:"phase3" },
    { x: 2000, label:"FAQ", type:"faq" },
    { x: 2400, label:"Contact", type:"contact" }
  ]
};
/* ======= end config ======= */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width, H = canvas.height;

const state = {
  player:{x:120, y:H-160, w:80, h:36, vx:0, speed:4.2},
  camera:{x:0},
  keys:{}, paused:false, near:null,
  world:{ length: 2800 },
  xp: Number(localStorage.getItem('xp')||0),
  level: Number(localStorage.getItem('level')||1),
  submissions: JSON.parse(localStorage.getItem('submissions')||'[]')
};

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.getElementById('toasts').appendChild(t);setTimeout(()=>t.remove(),3000)}
function addXP(amount=50){
  state.xp+=amount;
  if(state.xp>=state.level*200){ state.level++; toast(`Level up! You reached Level ${state.level} ✨`)}
  localStorage.setItem('xp',state.xp); localStorage.setItem('level',state.level);
  updateHUD();
}
function updateHUD(){
  document.getElementById('xp').textContent = state.xp;
  document.getElementById('level').textContent = state.level;
  const pct = Math.min(99, (state.xp % (state.level*200)) / (state.level*200) * 100);
  document.getElementById('xpbar').style.width = pct + '%';
  document.getElementById('phase1-status').textContent = GAME_DATA.phases[0].open ? 'Open' : 'Closed';
}
updateHUD();

/* ======= Input ======= */
addEventListener('keydown', e=>{
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','KeyE','Escape','KeyP','KeyH'].includes(e.code)) e.preventDefault();
  state.keys[e.code]=true;
  if(e.code==='KeyE' && state.near){ openBranch(state.near) }
  if(e.code==='Escape'){ closePanel() }
  if(e.code==='KeyP'){ togglePause() }
  if(e.code==='KeyH'){ showHelp() }
});
addEventListener('keyup', e=>state.keys[e.code]=false);

/* Touch */
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const interactBtn = document.getElementById('interactBtn');
let leftHeld=false, rightHeld=false;
['pointerdown','pointerup','pointerleave','pointercancel'].forEach(ev=>{
  leftBtn.addEventListener(ev, e=>{ leftHeld = ev==='pointerdown' });
  rightBtn.addEventListener(ev, e=>{ rightHeld = ev==='pointerdown' });
  interactBtn.addEventListener(ev, e=>{ if(ev==='pointerdown' && state.near) openBranch(state.near) });
});

/* ======= Panels ======= */
const overlay = document.getElementById('overlay');
const panelContent = document.getElementById('panel-content');
const panelTitle = document.getElementById('panel-title');
document.getElementById('closePanel').onclick = closePanel;
document.getElementById('btnPause').onclick = togglePause;
document.getElementById('btnHelp').onclick = showHelp;
document.getElementById('btnExport').onclick = exportDemo;

function showOverlay(title, html){
  panelTitle.textContent = title;
  panelContent.innerHTML = html;
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
        <p><b>Keyboard:</b> ←/A and →/D to move. <b>E</b> to interact at a branch. <b>Esc</b> to close. <b>P</b> to pause.</p>
        <p><b>Mobile:</b> Use the on-screen buttons.</p>
      </div>
      <div class="card">
        <p>Collect XP by discovering branches and completing Phase 1 registration. Your progress saves in this browser.</p>
      </div>
    </div>`
  );
}

/* ======= Branch Content ======= */
function branchHTML(type){
  if(type==='about'){
    return `
      <div class="grid cols-2">
        <div class="card">
          <h3>${GAME_DATA.project.name}</h3>
          <p>${GAME_DATA.project.tagline}</p>
          <div class="meta">
            <span class="chip">📍 ${GAME_DATA.project.location}</span>
            <span class="chip">🗓 ${GAME_DATA.project.date}</span>
          </div>
        </div>
        <div class="card">
          <h4>About</h4>
          <p>${GAME_DATA.project.about}</p>
        </div>
        ${GAME_DATA.phases.map(p=>`
          <div class="card">
            <h4>${p.title}</h4>
            <p>${p.summary}</p>
            <div class="meta"><span class="chip">${p.open?'Open ✅':'Locked 🔒'}</span></div>
          </div>`).join('')}
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
  f.addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    // basic validation
    if(!data.fullName || !data.email){ msg('Please fill required fields.', true); return; }
    state.submissions.push(data);
    localStorage.setItem('submissions', JSON.stringify(state.submissions));
    msg('✅ Registered! +100 XP awarded.', false);
    addXP(100);
    // rerender submissions
    document.getElementById('panel-content').insertAdjacentHTML('beforeend','');
    // refresh panel content
    showOverlay('Phase 1 — Register', branchHTML('phase1'));
    bindForm();
  });
  function msg(text, err){ const el=document.getElementById('formMsg'); el.textContent=text; el.className='help ' + (err?'error':'success'); }
}

/* ======= Export demo data ======= */
function exportDemo(){
  const dump = {
    project: GAME_DATA.project,
    submissions: state.submissions,
    xp: state.xp, level: state.level, exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'axis25-demo-export.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Exported demo JSON 📦');
}

/* ======= Open branch ======= */
function openBranch(branch){
  const html = branchHTML(branch.type);
  showOverlay(branch.label, html);
  bindForm();
  addXP(20);
}

/* ======= Fallback non-canvas view ======= */
function buildFallback(){
  const fb = document.getElementById('fallbackContent');
  const phases = GAME_DATA.phases.map(p=>`<li><b>${p.title}</b> — ${p.summary} ${p.open?'(Open)':'(Locked)'}</li>`).join('');
  fb.innerHTML = `
    <p><b>${GAME_DATA.project.name}</b> — ${GAME_DATA.project.tagline}</p>
    <p>${GAME_DATA.project.about}</p>
    <ul>${phases}</ul>
    <hr>
    <p><b>Phase 1 Registration (fallback)</b></p>
    <p>If the overlay doesn’t open, press the “Phase 1 — Register” branch in-game or use this fallback form.</p>
  `;
}
buildFallback();

/* ======= Game world drawing ======= */
function drawRoad(){
  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0b1530'); g.addColorStop(1,'#0a0f1e');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

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

    // sign label
    ctx.font='14px ui-sans-serif'; ctx.fillStyle='#e6ecff'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(b.label, bx, roadY-130 - sh/2);

    // interact hint if near
    const near = Math.abs(state.player.x - b.x) < 60;
    if(near){
      ctx.font='12px ui-sans-serif'; ctx.fillStyle='rgba(124,248,200,.9)'; ctx.fillText('Press E to interact', bx, roadY-140 - sh);
      state.near = b;
    }
  });
}

/* ======= Car drawing ======= */
function drawCar(){
  const p = state.player;
  const y = p.y, x = p.x - state.camera.x;

  // shadow
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y+p.h, p.w*.6, 10, 0, 0, Math.PI*2); ctx.fill();

  // body
  const grad = ctx.createLinearGradient(x-p.w/2,y-20,x+p.w/2,y+20);
  grad.addColorStop(0,'#8aa4ff'); grad.addColorStop(1,'#7cf8c8');
  ctx.fillStyle = grad; ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.roundRect(x-p.w/2, y-p.h/2, p.w, p.h, 8);
  ctx.fill(); ctx.stroke();

  // windows
  ctx.fillStyle='rgba(255,255,255,.25)';
  ctx.fillRect(x-p.w/2+10, y-p.h/2+6, 24, p.h-12);
  ctx.fillRect(x+p.w/2-34, y-p.h/2+6, 24, p.h-12);

  // wheels
  ctx.fillStyle='#0c1226';
  ctx.beginPath(); ctx.arc(x-p.w/3, y+p.h/2, 12, 0, Math.PI*2); ctx.arc(x+p.w/3, y+p.h/2, 12, 0, Math.PI*2); ctx.fill();

  // headlight glow if moving right
  if(state.player.vx>0.2){
    const lg = ctx.createRadialGradient(x+p.w/2, y, 0, x+p.w/2+70, y, 80);
    lg.addColorStop(0,'rgba(255,255,255,.25)'); lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(x+p.w/2+70, y, 80, 28, 0, 0, Math.PI*2); ctx.fill();
  }
}

/* ======= Game loop ======= */
function step(){
  if(!state.paused){
    const left = state.keys['ArrowLeft']||state.keys['KeyA']||leftHeld;
    const right = state.keys['ArrowRight']||state.keys['KeyD']||rightHeld;
    state.player.vx = (right?1:0) - (left?1:0);
    state.player.x += state.player.vx * state.player.speed;
    state.player.x = clamp(state.player.x, 40, state.world.length-40);
    // camera follows
    state.camera.x = clamp(state.player.x - W*0.5, 0, state.world.length - W + 0);
    state.near = null;
  }

  // draw
  ctx.clearRect(0,0,W,H);
  drawRoad();
  drawCar();

  requestAnimationFrame(step);
}
requestAnimationFrame(step);

/* ======= Resize handling ======= */
function positionPlayerOnRoad(){
  // Place the car so wheels sit nicely on the road across screen sizes
  const roadY = H - 120; // must match drawRoad()
  const p = state.player;
  p.y = roadY - p.h/2 - 4; // small ground clearance
}
function resize(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * devicePixelRatio);
  canvas.height = Math.round(rect.height * devicePixelRatio);
  W = canvas.width; H = canvas.height;
  positionPlayerOnRoad();
}
addEventListener('resize', resize); resize();

/* ======= Click interaction on signs ======= */
canvas.addEventListener('pointerdown', (e)=>{
  // detect if clicked near a sign; translate to world x
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (canvas.width/rect.width);
  const wx = cx + state.camera.x;
  let found = null;
  for(const b of GAME_DATA.branches){
    if(Math.abs(wx - b.x) < 80){ found = b; break; }
  }
  if(found) openBranch(found);
});

/* ======= Initial friendly toast ======= */
setTimeout(()=>toast('Drive → and stop at signs. Press E to interact.'), 400);
