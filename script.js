// small helper selectors
const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// redirect to signup if not logged in
if (!localStorage.getItem('username') && window.location.pathname.includes('web.html')) {
  window.location.href = 'signup.html';
}

const API = 'http://localhost:3000'; // optional backend
let demoQuests = [
  { id:'physics-bridge', title:'Balance the Bridge', subject:'Physics', grade:'6', duration:15, difficulty:'Medium', tags:['forces','engineering'], description:'Apply forces to build a stable bridge.', reward:{bricks:5,ecoPoints:2} },
  { id:'math-fractions', title:'Fraction Frenzy', subject:'Math', grade:'5', duration:10, difficulty:'Easy', tags:['fractions'], description:'Solve fraction puzzles against the clock.', reward:{bricks:3} },
  { id:'coding-scratch', title:'Scratch to Python', subject:'Coding', grade:'6', duration:20, difficulty:'Medium', tags:['logic','variables'], description:'Transition from blocks to Python basics.', reward:{materials:4} },
  { id:'chemistry-states', title:'States of Matter', subject:'Chemistry', grade:'7', duration:12, difficulty:'Easy', tags:['matter'], description:'Classify solids, liquids, and gases with mini-games.', reward:{ecoPoints:1} },
  { id:'bio-ecosystems', title:'Ecosystem Explorer', subject:'Biology', grade:'6', duration:18, difficulty:'Medium', tags:['food web'], description:'Balance a food web and keep your biome alive.', reward:{materials:2,ecoPoints:3} },
  { id:'math-ratios', title:'Ratios in Real Life', subject:'Math', grade:'6', duration:15, difficulty:'Medium', tags:['ratios'], description:'Use ratios to solve real-world scenarios.', reward:{bricks:4} },
];

const demoStudents = [
  { name:'Ava Patel', grade:6, quest:'Forces & Motion', progress:60 },
  { name:'Liam Chen', grade:6, quest:'Ratios in Real Life', progress:40 },
  { name:'Mia Garcia', grade:5, quest:'Fraction Frenzy', progress:80 },
];

const demoLeaderboard = [
  { username:'player1', totalResources:120, buildings:5 },
  { username:'player2', totalResources:95, buildings:3 },
  { username:'demo', totalResources:50, buildings:2 },
];

// Achievements demo
const demoAchievements = [
  { name: 'Quiz Whiz', earned: true },
  { name: 'Algebra Ace', earned: true },
  { name: 'Physics Pro', earned: true },
  { name: 'Coding Cadet', earned: false },
];

// ensure a demo username exists so prototype doesn't redirect
if (!localStorage.getItem('username')) localStorage.setItem('username','demo');
const currentUser = localStorage.getItem('username');
if ($('user-display')) $('user-display').textContent = currentUser;
if ($('year')) $('year').textContent = new Date().getFullYear();

// ----- Navigation: smooth anchor behavior for header nav
$$('.nav a, .hero-actions a, .section-head a, .challenge a, .badges a').forEach(a=>{
  a.addEventListener('click', (ev)=>{
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) {
      ev.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

// ----- Library rendering & filters
function renderLibrary(items) {
  const container = $('library-list');
  container.innerHTML = items.map(c=>`
    <div class="card" data-id="${c.id}" data-subject="${c.subject}" data-grade="${c.grade}" data-tags="${(c.tags||[]).join(',')}">
      <div class="card-head"><h3>${c.title}</h3></div>
      <div class="card-body">
        <p class="muted">${c.description}</p>
        <div class="row wrap small muted mt"><span>⏱ ${c.duration}m</span><span>• Difficulty: ${c.difficulty}</span><span>• Grade ${c.grade}</span></div>
        <div class="row wrap mt">${(c.tags||[]).map(t=>`<span class="badge badge-alt">${t}</span>`).join('')}</div>
        <div class="row gap mt"><a href="#game" class="btn btn-primary btn-sm start-quest" data-id="${c.id}">Start Quest</a><a href="#progress" class="btn btn-alt btn-sm">View Progress</a></div>
      </div>
    </div>
  `).join('');
  // attach start-quest click handlers (keeps original behavior of scrolling)
  $$('.start-quest').forEach(btn=> btn.addEventListener('click', (e)=>{
    const id = btn.dataset.id;
    // prefill a quest choice — for prototype just scroll to game and start quiz
    document.querySelector('#game')?.scrollIntoView({behavior:'smooth'});
  }));
}

function loadLibraryFromAPI(){
  fetch(`${API}/quests`).then(r=>r.json()).then(data=>{
    if (Array.isArray(data) && data.length) renderLibrary(data);
    else renderLibrary(demoQuests);
  }).catch(()=> renderLibrary(demoQuests));
}

// filters
const qIn = $('q'), subIn = $('subject'), gradeIn = $('grade');
function applyFilters(){
  const term = (qIn?.value||'').toLowerCase();
  const sub = subIn?.value || 'all';
  const gr = gradeIn?.value || 'all';
  const items = demoQuests.filter(c=>
    (sub==='all'||c.subject===sub) &&
    (gr==='all'||c.grade===gr) &&
    (term===''|| c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term) || (c.tags||[]).some(t=>t.toLowerCase().includes(term)))
  );
  renderLibrary(items);
}
[qIn, subIn, gradeIn].forEach(el=> el && el.addEventListener('input', applyFilters));
subIn?.addEventListener('change', applyFilters);

// ----- Challenges (Dashboard new challenges)
// ----- Challenges (Dashboard new challenges)
function renderChallenges(list){
  const container = $('challenges-list');
  if (!container) return;
  container.innerHTML = list.slice(0,2).map(c=>`
    <div class="challenge">
      <div class="title">${c.title}</div>
      <p class="muted">${c.description}</p>
      <a href="#game" class="btn btn-sm start-quest" data-id="${c.id}">Play</a>
    </div>
  `).join('');

  // attach click handlers to actually start subject-specific quests
  $$('.challenge .start-quest').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      if (id) startQuestById(id);
    });
  });
}


// ----- Leaderboard
function renderLeaderboard(list){
  const tbody = $('leaderboard-body');
  if (!tbody) return;
  tbody.innerHTML = list.map((u,i)=>`<tr><td>${i+1}</td><td>${u.username}</td><td>${u.totalResources}</td><td>${u.buildings}</td></tr>`).join('');
  const sideList = $('leaderboard-list');
  if (sideList) {
    sideList.innerHTML = '';
    list.forEach((entry,i)=>{
      const d = document.createElement('div');
      d.textContent = `${i+1}. ${entry.username} — ${entry.totalResources} resources, ${entry.buildings} buildings`;
      sideList.appendChild(d);
    });
  }
}

function loadLeaderboardFromAPI(){
  fetch(`${API}/leaderboard`).then(r=>r.json()).then(data=>{
    if (Array.isArray(data) && data.length) renderLeaderboard(data);
    else renderLeaderboard(demoLeaderboard);
  }).catch(()=> renderLeaderboard(demoLeaderboard));
}

// ----- Students (Admin table)
function renderStudents(list){
  const tbody = $('students');
  if (!tbody) return;
  tbody.innerHTML = list.map(s=>`<tr><td>${s.name}</td><td>Grade ${s.grade}</td><td>${s.quest}</td><td class="right"><div class="progress"><div style="width:${s.progress}%"></div></div></td></tr>`).join('');
}
renderStudents(demoStudents);

// ----- Village (dashboard stats)
function renderVillage(v){
  if ($('bricks-count')) $('bricks-count').textContent = v.bricks || 0;
  if ($('energy-count')) $('energy-count').textContent = v.energyUnits || 0;
  if ($('materials-count')) $('materials-count').textContent = v.materials || 0;
  if ($('eco-count')) $('eco-count').textContent = v.ecoPoints || 0;
}
function loadVillageFromAPI(){
  fetch(`${API}/village/${currentUser}`).then(r=>r.json()).then(data=>{
    if (data && typeof data === 'object') renderVillage(data);
    else renderVillage({bricks:0,energyUnits:0,materials:0,ecoPoints:0});
  }).catch(()=> renderVillage({bricks:0,energyUnits:0,materials:0,ecoPoints:0}));
}

// ----- Achievements (capsules)
function renderAchievements(list) {
  const container = $('achievements-list');
  if (!container) return;
  container.innerHTML = list.map(a => `
    <span class="badge capsule ${a.earned ? 'earned' : 'locked'}">${a.name}</span>
  `).join('');
}

// ----- Quiz (interactive game)
// NOTE: This section was adjusted so "Start Quest" starts subject-specific questions.
// All other page logic and names remain the same to avoid breaking other code.

// original fallback questions (kept for compatibility)
const QUESTIONS = [
  { q:'A bridge stays up because forces are...', options:['Unbalanced','Balanced','Random'], correct:1 },
  { q:'What is 3/4 + 1/4?', options:['1/2','1','2/4'], correct:1 },
  { q:'A variable in code is best described as...', options:['A fixed number','A container for values','A math operation'], correct:1 },
];

// subject-specific banks
const QUESTIONS_BY_SUBJECT = {
  Physics: [
    { q:'A bridge stays up because forces are...', options:['Unbalanced','Balanced','Random'], correct:1 },
    { q:'Which of these is a type of force?', options:['Friction','Color','Shape'], correct:0 },
    { q:'Which law explains action and reaction?', options:["Newton’s 1st","Newton’s 2nd","Newton’s 3rd"], correct:2 },
    { q:'Unit of force is...', options:['Newton','Joule','Watt'], correct:0 },
    { q:'What is the acceleration due to gravity on Earth?', options:['9.8 m/s²','10 m/s²','8 m/s²'], correct:0 },
    { q:'Energy of motion is called...', options:['Kinetic energy','Potential energy','Thermal energy'], correct:0 },
    { q:'Which simple machine is a seesaw?', options:['Pulley','Lever','Inclined plane'], correct:1 },
    { q:'Which wave needs a medium to travel?', options:['Light','Sound','Radio'], correct:1 },
    { q:'What is the speed of light?', options:['3×10^8 m/s','3×10^6 m/s','1×10^8 m/s'], correct:0 },
    { q:'Magnet attracts...', options:['Wood','Plastic','Iron'], correct:2 }
  ],
  Math: [
    { q:'What is 3/4 + 1/4?', options:['1/2','1','2/4'], correct:1 },
    { q:'Solve: 2x + 3 = 7. What is x?', options:['2','3','4'], correct:0 },
    { q:'If ratio is 2:3 and total is 10, first part is?', options:['4','6','5'], correct:0 },
    { q:'Square root of 81 is...', options:['8','9','7'], correct:1 },
    { q:'What is 25% of 200?', options:['25','50','75'], correct:1 },
    { q:'Simplify: 12 ÷ (3 × 2)', options:['2','6','4'], correct:0 },
    { q:'Perimeter of a square of side 5 is...', options:['20','25','10'], correct:0 },
    { q:'Value of π (approx) is...', options:['3.14','2.71','1.41'], correct:0 },
    { q:'LCM of 4 and 6 is...', options:['24','12','8'], correct:1 },
    { q:'Convert 0.5 into fraction', options:['1/2','1/3','2/5'], correct:0 }
  ],
  Coding: [
    { q:'A variable in code is best described as...', options:['A fixed number','A container for values','A math operation'], correct:1 },
    { q:'Which symbol starts a comment in JavaScript?', options:['#','//','<!--'], correct:1 },
    { q:'Which keyword declares a variable in modern JS?', options:['var','let','both'], correct:2 },
    { q:'Which loop runs at least once?', options:['for','while','do...while'], correct:2 },
    { q:'Which of these is NOT a data type in JS?', options:['string','boolean','character'], correct:2 },
    { q:'Which HTML tag links a JS file?', options:['<script>','<link>','<js>'], correct:0 },
    { q:'Which function prints to the console?', options:['print()','console.log()','echo()'], correct:1 },
    { q:'Arrays in JS are written with...', options:['{}','[]','()'], correct:1 },
    { q:'Which operator is used for strict equality?', options:['==','====','=','!=='], correct:1 },
    { q:'JS was first created in...', options:['1995','2000','1990'], correct:0 }
  ],
  Chemistry: [
    { q:'Water turning into vapor is...', options:['Condensation','Evaporation','Freezing'], correct:1 },
    { q:'Which state of matter has a definite volume but no fixed shape?', options:['Solid','Liquid','Gas'], correct:1 },
    { q:'Chemical symbol of Sodium is...', options:['So','Na','S'], correct:1 },
    { q:'pH value of neutral water is...', options:['7','0','14'], correct:0 },
    { q:'Table salt is...', options:['NaCl','KCl','CaCl2'], correct:0 },
    { q:'Which gas is needed for combustion?', options:['Oxygen','Nitrogen','Carbon dioxide'], correct:0 },
    { q:'CO2 is...', options:['Carbon monoxide','Carbon dioxide','Calcium oxide'], correct:1 },
    { q:'Acids taste...', options:['Sweet','Sour','Bitter'], correct:1 },
    { q:'Which metal is liquid at room temp?', options:['Mercury','Iron','Aluminum'], correct:0 },
    { q:'H2O2 is called...', options:['Hydrogen oxide','Hydrogen peroxide','Heavy water'], correct:1 }
  ],
  Biology: [
    { q:'Plants produce energy using...', options:['Photosynthesis','Respiration','Digestion'], correct:0 },
    { q:'Which structure contains genetic material?', options:['Mitochondria','Nucleus','Cell membrane'], correct:1 },
    { q:'Basic unit of life is...', options:['Tissue','Cell','Organ'], correct:1 },
    { q:'Human heart has how many chambers?', options:['2','3','4'], correct:2 },
    { q:'Which blood cells fight infection?', options:['RBC','WBC','Platelets'], correct:1 },
    { q:'Largest organ in human body?', options:['Liver','Skin','Brain'], correct:1 },
    { q:'Which gas do humans exhale?', options:['Oxygen','Carbon dioxide','Nitrogen'], correct:1 },
    { q:'Process of breaking food is...', options:['Respiration','Digestion','Photosynthesis'], correct:1 },
    { q:'Fish breathe using...', options:['Lungs','Gills','Skin'], correct:1 },
    { q:'DNA stands for...', options:['Deoxyribonucleic acid','Dynamic nucleotide acid','Double nuclear acid'], correct:0 }
  ]
};


let activeQuestions = null; // current question set (subject-specific) or null -> fallback to QUESTIONS
let qStep = 0, qChoice = null, qScore = 0;

function startQuestById(questId) {
  const quest = demoQuests.find(q => q.id === questId);
  if (!quest) {
    // fallback to generic if no quest found
    activeQuestions = null;
  } else {
    const bank = QUESTIONS_BY_SUBJECT[quest.subject];
    // clone bank to avoid accidental shared-state mutation
    activeQuestions = bank ? bank.map(q => ({...q, options: [...q.options]})) : null;
  }
  // reset progress / score
  qStep = 0; qChoice = null; qScore = 0;
  // scroll to game and initialize
  document.querySelector('#game')?.scrollIntoView({behavior:'smooth'});
  initQuiz();
}

function initQuiz(){
  if (!$('question')) return;
  const use = (activeQuestions && activeQuestions.length) ? activeQuestions : QUESTIONS;
  $('total').textContent = use.length;
  // reset scores/date display
  qScore = 0;
  if ($('score')) $('score').textContent = qScore;
  renderQ();
  // attach listeners (keeps same names so other code unaffected)
  $('submit')?.addEventListener('click', ()=> {
    const curSet = (activeQuestions && activeQuestions.length) ? activeQuestions : QUESTIONS;
    const cur = curSet[qStep];
    if (!cur) return;
    if (qChoice === cur.correct){ qScore++; if ($('score')) $('score').textContent = qScore; $('result').textContent = 'Correct! ✅'; }
    else { $('result').textContent = 'Not quite. ❌'; }
    qStep++;
    renderQ();
  });
  $('clear')?.addEventListener('click', ()=> {
    qChoice = null; $$('#options .btn').forEach(x=>x.classList.remove('btn-primary'));
    $('submit').disabled = true; $('clear').disabled = true; $('result').textContent = '';
  });
}

function renderQ(){
  const curSet = (activeQuestions && activeQuestions.length) ? activeQuestions : QUESTIONS;
  if (qStep >= curSet.length){
    $('question').textContent = 'Great job!';
    $('options').innerHTML = `<div class="muted">You scored ${qScore} out of ${curSet.length}.</div>`;
    $('submit').disabled = true; $('clear').disabled = true;
    $('game-progress').style.width = '100%';
    if (qScore >= Math.ceil(curSet.length*0.7)){
      setTimeout(()=> alert('🎉 Congrats — you earned a village reward!'), 300);
    }
    return;
  }
  const cur = curSet[qStep];
  $('question').textContent = cur.q;
  $('options').innerHTML = cur.options.map((o,i)=>`<button class="btn btn-alt" data-i="${i}">${o}</button>`).join('');
  $('game-progress').style.width = (qStep/curSet.length*100) + '%';
  $('submit').disabled = true; $('clear').disabled = true; qChoice = null; $('result').textContent = '';
  $$('#options .btn').forEach(b=> b.addEventListener('click', ()=>{
    $$('#options .btn').forEach(x=>x.classList.remove('btn-primary'));
    b.classList.add('btn-primary');
    qChoice = +b.dataset.i;
    $('submit').disabled = false; $('clear').disabled = false;
  }));
}

// Ensure Start Quest buttons actually launch subject-specific quests
// (this sits in addition to the renderLibrary handler which scrolls to #game)
document.addEventListener('click', (e) => {
  const el = e.target.closest('.start-quest');
  if (!el) return;
  e.preventDefault();
  const id = el.dataset.id;
  if (id) startQuestById(id);
});

// ----- Progress charts (demo)
function renderProgressCharts(){
  const WEEKLY = [
    { day:'Mon', minutes:20, accuracy:80 },
    { day:'Tue', minutes:15, accuracy:60 },
    { day:'Wed', minutes:30, accuracy:85 },
    { day:'Thu', minutes:25, accuracy:70 },
    { day:'Fri', minutes:35, accuracy:90 },
    { day:'Sat', minutes:10, accuracy:50 },
    { day:'Sun', minutes:0,  accuracy:0  },
  ];
  const maxMin = Math.max(...WEEKLY.map(d=>d.minutes))||1;
  const minutesChart = $('minutes-chart');
  if (minutesChart) minutesChart.innerHTML = WEEKLY.map(d=>{
    const h = Math.round((d.minutes/maxMin)*100);
    return `<div class="bar" style="height:${h}%" data-label="${d.day}"></div>`;
  }).join('');
  const svg = $('accuracy-chart');
  if (svg) {
    const w = 300, h = 160, pad=20;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const xs = WEEKLY.map((_,i)=> pad + i*((w-2*pad)/(WEEKLY.length-1)) );
    const ys = WEEKLY.map(d=> h-pad - (d.accuracy/100)*(h-2*pad) );
    const pts = xs.map((x,i)=> `${x},${ys[i]}`).join(' ');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const ns = 'http://www.w3.org/2000/svg';
    const poly = document.createElementNS(ns,'polyline');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill','none');
    poly.setAttribute('stroke','black');
    poly.setAttribute('stroke-width','2');
    svg.appendChild(poly);
  }
}

// ----- Page initialization
function initPage(){
  loadLibraryFromAPI();
  renderChallenges(demoQuests);
  renderStudents(demoStudents);
  loadLeaderboardFromAPI();
  loadVillageFromAPI();
  renderAchievements(demoAchievements);
  initQuiz();
  renderProgressCharts();

  // Logout
  const logoutBtn = $('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.replace('signup.html');
    });
  }

  // tab toggle
  $$('.tab').forEach(btn => btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.toggle('active', b===btn));
    $$('.tabpanel').forEach(p=>p.classList.remove('active'));
    const id = btn.dataset.tab==='overview' ? '#tab-overview' : '#tab-recs';
    document.querySelector(id)?.classList.add('active');
  }));

  // assign content action (demo)
  $('assign-btn')?.addEventListener('click', ()=>{
    const g = $('assign-group')?.value;
    const m = $('assign-module')?.value;
    alert(`Assigned ${m} to ${g} (demo).`);
  });

  // language selects keep in sync
  const langKey = 'app.lang';
  const selects = [ $('lang-select'), $('lang-select-hero') ].filter(Boolean);
  const saved = localStorage.getItem(langKey) || 'en';
  selects.forEach(s=>s.value = saved);
  selects.forEach(s=> s.addEventListener('change', e=>{
    localStorage.setItem(langKey, e.target.value);
    selects.forEach(x=> x.value = e.target.value);
  }));

  $$('#library-list .card').length && applyFilters();

  $$('.hero-actions a[href="#dashboard"]').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      document.querySelector('#dashboard')?.scrollIntoView({behavior:'smooth'});
    });
  });
}

// run init when DOM ready
document.addEventListener('DOMContentLoaded', initPage);

const scrollBtn = $('scrollTopBtn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) scrollBtn.style.display = 'block';
  else scrollBtn.style.display = 'none';
});

scrollBtn.addEventListener('click', () => {
  window.scrollTo({top: 0, behavior: 'smooth'});
});
