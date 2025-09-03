// script.js - prototype frontend (works without a backend; will use API if available)

// small helper selectors
const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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

// ensure a demo username exists so prototype doesn't redirect
if (!localStorage.getItem('username')) localStorage.setItem('username','demo');
const currentUser = localStorage.getItem('username');
if ($('user-display')) $('user-display').textContent = currentUser;
if ($('year')) $('year').textContent = new Date().getFullYear();

// ----- Navigation: smooth anchor behavior for header nav
$$('.nav a, .hero-actions a, .section-head a, .challenge a, .badges a').forEach(a=>{
  a.addEventListener('click', (ev)=> {
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
  // attach start-quest click handlers
  $$('.start-quest').forEach(btn=> btn.addEventListener('click', (e)=>{
    const id = btn.dataset.id;
    // prefill a quest choice — for prototype just scroll to game and start quiz
    document.querySelector('#game')?.scrollIntoView({behavior:'smooth'});
  }));
}

function loadLibraryFromAPI(){
  // attempt API, fallback to demo
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
function renderChallenges(list){
  const container = $('challenges-list');
  if (!container) return;
  container.innerHTML = list.slice(0,2).map(c=>`
    <div class="challenge">
      <div class="title">${c.title}</div>
      <p class="muted">${c.description}</p>
      <a href="#game" class="btn btn-sm">Play</a>
    </div>
  `).join('');
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

// ----- Quiz (interactive game)
const QUESTIONS = [
  { q:'A bridge stays up because forces are...', options:['Unbalanced','Balanced','Random'], correct:1 },
  { q:'What is 3/4 + 1/4?', options:['1/2','1','2/4'], correct:1 },
  { q:'A variable in code is best described as...', options:['A fixed number','A container for values','A math operation'], correct:1 },
];
let qStep = 0, qChoice = null, qScore = 0;
function initQuiz(){
  if (!$('question')) return;
  $('total').textContent = QUESTIONS.length;
  renderQ();
  $('submit')?.addEventListener('click', ()=>{
    const cur = QUESTIONS[qStep];
    if (qChoice === cur.correct){ qScore++; if ($('score')) $('score').textContent = qScore; $('result').textContent = 'Correct! ✅'; }
    else { $('result').textContent = 'Not quite. ❌'; }
    qStep++;
    renderQ();
  });
  $('clear')?.addEventListener('click', ()=>{
    qChoice = null; $$('#options .btn').forEach(x=>x.classList.remove('btn-primary'));
    $('submit').disabled = true; $('clear').disabled = true; $('result').textContent = '';
  });
}
function renderQ(){
  if (qStep >= QUESTIONS.length){
    $('question').textContent = 'Great job!';
    $('options').innerHTML = `<div class="muted">You scored ${qScore} out of ${QUESTIONS.length}.</div>`;
    $('submit').disabled = true; $('clear').disabled = true;
    $('game-progress').style.width = '100%';
    // pretend reward (no API required)
    if (qScore >= Math.ceil(QUESTIONS.length*0.7)){
      setTimeout(()=> alert('🎉 Congrats — you earned a village reward!'), 300);
    }
    return;
  }
  const cur = QUESTIONS[qStep];
  $('question').textContent = cur.q;
  $('options').innerHTML = cur.options.map((o,i)=>`<button class="btn btn-alt" data-i="${i}">${o}</button>`).join('');
  $('game-progress').style.width = (qStep/QUESTIONS.length*100) + '%';
  $('submit').disabled = true; $('clear').disabled = true; qChoice = null; $('result').textContent = '';
  $$('#options .btn').forEach(b=> b.addEventListener('click', ()=>{
    $$('#options .btn').forEach(x=>x.classList.remove('btn-primary'));
    b.classList.add('btn-primary');
    qChoice = +b.dataset.i;
    $('submit').disabled = false; $('clear').disabled = false;
  }));
}

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
  // accuracy chart (svg polyline)
  const svg = $('accuracy-chart');
  if (svg) {
    const w = 300, h = 160, pad=20;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const xs = WEEKLY.map((_,i)=> pad + i*((w-2*pad)/(WEEKLY.length-1)) );
    const ys = WEEKLY.map(d=> h-pad - (d.accuracy/100)*(h-2*pad) );
    const pts = xs.map((x,i)=> `${x},${ys[i]}`).join(' ');
    // clear previous
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
  // render core content (use API if available)
  loadLibraryFromAPI();
  renderChallenges(demoQuests);
  renderStudents(demoStudents);
  loadLeaderboardFromAPI();
  loadVillageFromAPI();
  initQuiz();
  renderProgressCharts();

  // library search/filters already wired
  // tab toggle (overview/recs)
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

  // populate library search placeholder with event
  $$('#library-list .card').length && applyFilters();

  // If user wants to click Start Learning in hero, scroll to dashboard
  $$('.hero-actions a[href="#dashboard"]').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      document.querySelector('#dashboard')?.scrollIntoView({behavior:'smooth'});
    });
  });
}

// run init when DOM ready
document.addEventListener('DOMContentLoaded', initPage);
