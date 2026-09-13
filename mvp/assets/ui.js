/* ============================================================
   Тренерграм · mvp-strava · оболочка рабочего пространства
   (навигация, топбар, модалки, тосты, графики) для страниц,
   которых нет в showcase/01-strava: index, clients, client,
   calendar, programs, exercises, templates, brand, sitemap.

   Конструктор (constructor.html) в свою логику не пускает —
   он работает на assets/trainer.js как есть, без изменений.
   Здесь тот же визуальный язык (base-trainer.css + тема),
   просто обобщённый под initShell(cfg) — как в mvp/assets/ui.js.
   ============================================================ */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el = h => { const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstElementChild };
const initials = e => (e.en||e.ru||'').split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const age = born => { const b=D(born), t=D(TODAY); let a=t.getFullYear()-b.getFullYear();
  if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate())) a--; return a };
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20?c:y===1?a:y>1&&y<5?b:c };
function yearsSince(date){
  const y = daysBetween(date, TODAY)/365.25;
  if(y<1){ const n=Math.max(1,Math.round(daysBetween(date,TODAY)/30)); return n+' '+plural(n,'месяц','месяца','месяцев') }
  const n=Math.floor(y); return n+' '+plural(n,'год','года','лет');
}
const humanDate = s => { const d=D(s); return d.getDate()+' '+MONTHS[d.getMonth()] };
function ago(date){
  if(!date) return '—';
  const n = daysBetween(date, TODAY);
  return n===0?'сегодня':n===1?'вчера':n+' '+plural(n,'день','дня','дней')+' назад';
}

/* Тот же символьный набор, что в trainer.js — чтобы иконка «Клиенты»
   или «Календарь» выглядела одинаково, с какой бы страницы её ни открыли. */
const ICON = {
 dash:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6"/><rect x="11" y="2.5" width="6.5" height="4" rx="1.6"/><rect x="11" y="8.5" width="6.5" height="9" rx="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6"/></svg>',
 users:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="8" cy="6.5" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14 4.2a3 3 0 0 1 0 5.6M15.5 12.6c1.6.7 2.8 2.3 2.8 4.4"/></svg>',
 cal:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg>',
 prog:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="15" height="15" rx="2.5"/><path d="M6 7h8M6 10h8M6 13h4.5"/></svg>',
 build:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 4.5h6M3 10h14M3 15.5h9"/><circle cx="13.5" cy="4.5" r="2"/><circle cx="15" cy="15.5" r="2"/></svg>',
 dumb:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4.5 7v6M2.5 8.5v3M15.5 7v6M17.5 8.5v3M6 10h8"/></svg>',
 tpl:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5A2 2 0 0 1 4.5 3.5h3l1.5 2h6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9z"/></svg>',
 brand:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="3"/></svg>',
 map:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11l-4.5 2-6-2-4.5 2v-11z"/><path d="M7 3.5v11M13 5.5v11"/></svg>',
 plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 3.5v9M3.5 8h9"/></svg>',
 back:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 8H3M7 4 3 8l4 4"/></svg>',
 arr:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
 copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
 grip:'<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/><circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/></svg>',
 x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
 chat:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 7.6a5.2 5.2 0 0 1-7.4 4.7L2.5 13.2l1-3.6A5.2 5.2 0 1 1 13.5 7.6z"/></svg>',
 folder:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M1.8 4.2a1.4 1.4 0 0 1 1.4-1.4h2.4l1.2 1.6h5.4a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4v-7.6z"/></svg>',
 star:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3.5 2.8h9v10.4L8 10.2l-4.5 3V2.8z"/></svg>',
 clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
 chk:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>',
 search:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>',
};

/* LOGO живёт в assets/nav.js — общий для обеих оболочек. */


/* Меню вынесено в assets/nav.js — общий конфиг для всех страниц. *//* renderNav живёт в assets/nav.js — общий для обеих оболочек. */


/* ─── шапка ───
   Одинакова на всех страницах и несёт ровно одно — главное действие тренера.
   Крошки и заголовок живут в рабочей зоне (renderHead): в шапке они делали
   её разной на каждом экране и отрывали название от содержимого. */
function renderTop(){
  $('#topbar').innerHTML = `
    <span class="sp"></span>
    ${topButton()}`;
  bindTopButton();
}

/* ─── заголовок рабочей зоны ───
   cfg.crumb = [{n,h}...] (последний — текущая страница, без ссылки)
   либо cfg.title. cfg.actions — действия страницы, они тоже здесь, а не в шапке. */
function renderHead(cfg){
  const head = $('#pagehead'); if(!head) return;
  const crumb = cfg.crumb || [];
  const title = cfg.title || (crumb.length ? crumb[crumb.length-1].n : '');
  head.innerHTML = `
    ${crumb.length > 1 ? `<nav class="crumb">${crumb.slice(0,-1).map(c=>
      `<a href="${c.h}">${esc(c.n)}</a><span class="sep">/</span>`).join('')}</nav>` : ''}
    <div class="ph-row">
      <h1>${esc(title)}</h1>
      ${cfg.sub?`<span class="ph-sub">${esc(cfg.sub)}</span>`:''}
      <span class="sp"></span>
      ${cfg.actions||''}
    </div>`;
}

function initShell(cfg){
  renderNav(cfg.page);
  renderTop();
  renderHead(cfg);
}

/* ─── тосты и модалки (те же классы, что у шторки назначения в конструкторе) ─── */
function toast(msg){
  const t = el(`<div class="toast"><span>${esc(msg)}</span></div>`);
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('on'));
  setTimeout(()=>{ t.classList.remove('on'); setTimeout(()=>t.remove(),200) }, 2400);
}
function openModal({title, body, foot, wide}){
  $('#ov').innerHTML = `<div class="md${wide?' wmd':''}">
    <div class="mdh"><span class="dot"></span><h2>${esc(title)}</h2><button class="cls" data-close>✕</button></div>
    <div class="mdb">${body}</div>
    ${foot?`<div class="mdf">${foot}</div>`:''}
  </div>`;
  $('#ov').classList.add('on');
}
const closeModal = () => $('#ov')?.classList.remove('on');

/* ─── графики (PRO-6) ─── */
function sparkline(vals, w=64, h=20, color='var(--acc)'){
  if(!vals || vals.length<2) return '';
  const min=Math.min(...vals), max=Math.max(...vals), sp=max-min||1;
  const pts = vals.map((v,i)=>[i/(vals.length-1)*w, h-2-(v-min)/sp*(h-4)]);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"
      stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pts[pts.length-1][0].toFixed(1)}" cy="${pts[pts.length-1][1].toFixed(1)}" r="2" fill="${color}"/></svg>`;
}
function lineChart(series, unit='кг'){
  const W=640, H=190, PL=44, PR=16, PT=18, PB=26;
  if(!series || series.length<2) return `<div style="padding:26px;text-align:center;color:var(--tx4);font-size:11.5px">Недостаточно данных для графика</div>`;
  const vals = series.map(s=>s[1]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const lo = min - (max-min||10)*.35, hi = max + (max-min||10)*.2;
  const x = i => PL + i/(series.length-1)*(W-PL-PR);
  const y = v => PT + (1-(v-lo)/(hi-lo))*(H-PT-PB);
  const ticks = [lo+(hi-lo)*.15, (lo+hi)/2, hi-(hi-lo)*.08].map(v=>Math.round(v/2.5)*2.5);
  const pts = series.map((s,i)=>[x(i), y(s[1])]);
  const path = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area = path+` L${pts[pts.length-1][0].toFixed(1)} ${H-PB} L${pts[0][0].toFixed(1)} ${H-PB} Z`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--acc)" stop-opacity=".16"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/>
    </linearGradient></defs>
    ${ticks.map(t=>`<line x1="${PL}" y1="${y(t).toFixed(1)}" x2="${W-PR}" y2="${y(t).toFixed(1)}" stroke="var(--line)"/>
      <text class="yl" x="${PL-8}" y="${(y(t)+3).toFixed(1)}" text-anchor="end">${fmtNum(t)}</text>`).join('')}
    <path d="${area}" fill="url(#lg1)"/>
    <path d="${path}" fill="none" stroke="var(--acc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4:3}"
        fill="${i===pts.length-1?'var(--acc)':'var(--bg)'}" stroke="var(--acc)" stroke-width="1.6"/>`).join('')}
    ${series.map((s,i)=>`<text class="yl" x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${dm(s[0])}</text>`).join('')}
    <text class="yl" x="${x(series.length-1).toFixed(1)}" y="${(y(series[series.length-1][1])-11).toFixed(1)}"
      text-anchor="middle" fill="var(--acc)" style="font-size:11px;font-weight:700">${fmtNum(series[series.length-1][1])} ${unit}</text>
  </svg>`;
}

document.addEventListener('click', e=>{
  if(e.target.closest('[data-close]') || e.target===$('#ov')) closeModal();
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeModal();
  if(e.key==='/' && !/input|textarea/i.test(e.target.tagName)){ const q=$('#q'); if(q){ e.preventDefault(); q.focus() } }
});

/* ═══════════ ОБЩАЯ ВИТРИНА БИБЛИОТЕК (TPL) ═══════════
   Блоки, тренировки, недели и программы показываются одинаково — различаются
   только содержимым карточки. Раньше это была одна страница «Шаблоны» с
   переключателем уровней; теперь уровни развели по разделам меню, но витрина
   обязана остаться одной, иначе четыре базы разъедутся по поведению.

   В каждой базе рядом лежит своё и общее (как у упражнений, EX-2):
   личное помечено чипом и всегда выше, внутри личного — новое первым. */
const LIB = { q:'', own:false, folder:'Все', tab:0 };

const libSort = (a,b) =>
  a.own !== b.own ? (a.own ? -1 : 1)                       /* своё выше общего */
  : a.own ? (b.at||'').localeCompare(a.at||'')             /* новее выше */
  : (b.used||0)-(a.used||0);

function libLines(t){
  if(t.lvl==='блок')
    return (t.items||[]).map(x=>`<span>${esc((byId(x[0])||{}).ru || x[0])}${x[1]?' · '+esc(x[1]):''}</span>`).join('');
  if(t.lvl==='тренировка')
    return (t.blocks||[]).map(id=>`<span>${esc((tplById(id)||{}).title || id)}</span>`).join('');
  if(t.lvl==='программа'){
    const q = (t.seq||[]).map(id=>id ? (tplById(id)||{}).title || id : 'отдых');
    return `<span>${esc(t.goal||'')}</span>`
      + `<span>цикл: ${esc(q.join(' → '))}</span>`;
  }
  return '';
}

/* Столбцы зависят от уровня: у блока — папка и состав, у тренировки —
   блоки, у программы — длина и цикл. Общее у всех — название, «своё/общая»
   и частота использования: по ней тренер и выбирает. */
function libCols(level){
  const nameCol = {k:'title', n:'Название', sort:byStr('title'), cell:t=>
    `<div class="cellname"><div style="min-width:0">
       <div class="n">${esc(t.title)}</div>
       <div class="sub">${libLines(t).replace(/<\/span><span>/g,' · ').replace(/<\/?span>/g,'')}</div>
     </div></div>`};
  const ownCol = {k:'own', n:'Источник', w:'110px', sort:byNum(t=>t.own?0:1), cell:t=>
    t.own ? `<span class="chip ok">своё</span>` : `<span class="chip ghost">общая</span>`};
  const usedCol = {k:'used', n:'Исп.', w:'70px', r:true, num:true, sort:byNum(t=>t.used),
    cell:t=>t.used ? t.used+'×' : '—'};
  if(level==='блок') return [nameCol,
    {k:'folder', n:'Папка', w:'140px', sort:byStr('folder'), cell:t=>esc(t.folder||'—')},
    {k:'n', n:'Упр.', w:'70px', r:true, num:true, sort:byNum(t=>tplStats(t).n),
      cell:t=>tplStats(t).n},
    ownCol, usedCol];
  if(level==='тренировка') return [nameCol,
    {k:'blocks', n:'Блоков', w:'80px', r:true, num:true, sort:byNum(t=>tplStats(t).blocks),
      cell:t=>tplStats(t).blocks},
    {k:'n', n:'Упр.', w:'70px', r:true, num:true, sort:byNum(t=>tplStats(t).n),
      cell:t=>tplStats(t).n},
    ownCol, usedCol];
  return [nameCol,
    {k:'days', n:'Дней', w:'80px', r:true, num:true, sort:byNum(t=>t.days), cell:t=>t.days},
    {k:'cycle', n:'Цикл', w:'80px', r:true, num:true, sort:byNum(t=>tplStats(t).cycle),
      cell:t=>tplStats(t).cycle},
    {k:'wo', n:'Трен.', w:'75px', r:true, num:true, sort:byNum(t=>tplStats(t).workouts),
      cell:t=>tplStats(t).workouts},
    ownCol, usedCol];
}

/* cfg: {level, add, tabs:[{n,level}]} — tabs только у базы программ (Программы / Недели) */
function renderLib(cfg){
  const level = cfg.tabs ? cfg.tabs[LIB.tab].level : cfg.level;
  const all = TPL.filter(t=>t.lvl===level);
  const withFolders = level==='блок';
  const list = all.filter(t=>{
    if(LIB.own && !t.own) return false;
    if(withFolders && LIB.folder!=='Все' && t.folder!==LIB.folder) return false;
    if(LIB.q && norm(t.title).indexOf(norm(LIB.q))<0) return false;
    return true;
  }).sort(libSort);

  const cols = libCols(level);
  const grid = list.length
    ? `<div class="card">${dataTable('lib-'+level, cols, list)}</div>`
    : `<div class="empty"><div class="t">Ничего не нашли</div><div class="d">Измените поиск или фильтр</div></div>`;

  $('#page').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <label class="search" style="width:250px">${ICON.search}<input id="q" placeholder="${esc(cfg.ph)}" value="${esc(LIB.q)}"></label>
      <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--tx2);cursor:pointer">
        <input type="checkbox" id="own" ${LIB.own?'checked':''}> Только свои
      </label>
      <span class="sp" style="flex:1"></span>
      <button class="btn gh" id="btnAdd">${ICON.plus} ${esc(cfg.add)}</button>
    </div>

    ${cfg.tabs?`<div class="filters" style="margin-bottom:14px">
      ${cfg.tabs.map((t,i)=>`<button data-tab="${i}" class="${LIB.tab===i?'on':''}">${esc(t.n)}</button>`).join('')}
    </div>`:''}

    ${withFolders?`<div class="filters" style="margin-bottom:16px">
      ${['Все',...TPL_FOLDERS].map(f=>`<button data-folder="${esc(f)}" class="${LIB.folder===f?'on':''}">${esc(f)}</button>`).join('')}
    </div>`:''}

    ${grid}

    <div class="cols2" style="margin-top:26px">
      <div class="kpi"><span class="k">${ICON.folder} Общая база сервиса</span><div class="v">${all.filter(t=>!t.own).length}</div><div class="d">доступны сразу, менять нельзя — только копировать к себе</div></div>
      <div class="kpi"><span class="k">${ICON.plus} Сохранено вами</span><div class="v acc">${all.filter(t=>t.own).length}</div><div class="d">видно только в вашем рабочем пространстве</div></div>
    </div>`;

  $$('.filters [data-tab]').forEach(b=>b.onclick=()=>{ LIB.tab=+b.dataset.tab; renderLib(cfg) });
  $$('.filters [data-folder]').forEach(b=>b.onclick=()=>{ LIB.folder=b.dataset.folder; renderLib(cfg) });
  $('#own').onchange=e=>{ LIB.own=e.target.checked; renderLib(cfg) };
  $('#q').oninput=e=>{ LIB.q=e.target.value; renderLib(cfg) };
  $('#btnAdd').onclick=()=>toast('В конструкторе: соберите и нажмите «Сохранить в библиотеку»');
  bindTable('lib-'+level, ()=>renderLib(cfg), id=>libDetail(tplById(id)));
  const qEl=$('#q'); if(qEl){ qEl.focus({preventScroll:true}); qEl.setSelectionRange(LIB.q.length,LIB.q.length) }
}

function libDetail(t){
  if(!t) return;
  openModal({title:t.title, body:`
    <div style="display:flex;gap:6px;margin-bottom:14px">
      ${t.folder?`<span class="chip">${esc(t.folder)}</span>`:''}
      ${t.own?`<span class="chip ok">своё</span>`:`<span class="chip ghost">общая база сервиса</span>`}
      ${t.used?`<span class="chip">использован ${t.used}×</span>`:''}
    </div>
    <div class="ls" style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--tx2)">${libLines(t)}</div>
    <div class="hint">${t.own
      ? 'Ваш шаблон: его можно переименовать, изменить и удалить.'
      : 'Шаблон из общей базы сервиса. Изменить его нельзя — вставьте в тренировку и сохраните как свой.'}</div>`,
    foot:`<span class="sp"></span><a class="btn" href="constructor.html">${ICON.build} Вставить в тренировку</a>`});
}


/* ═══════════ ТАЙМЛАЙН ДНЯ — общий для дашборда и дня календаря ═══════════
   Строка — занятие, а не клиент (см. sessionsOn в data.js). Держим в одном
   месте: экран дня в календаре показывает ровно то же, что дашборд, и
   расхождение между ними было бы багом, а не вариантом. */
/* date нужна ссылкам: конструктор открывается на клиента и дату (?client=&date=).
   У группового занятия программа одна на всех — ведём на первого атлета. */
function timelineHTML(ses, gaps, date){
  if(!ses.length && !gaps) return `<div class="empty"><div class="t">Занятий нет</div></div>`;
  const rows = ses.map((s,i)=>{
    const prev = ses[i-1];
    /* Маркер «сейчас» вставляется между занятиями, а не поверх шкалы:
       равномерной временной оси тут нет, строки идут подряд. */
    const nowHere = hhmm(s.time) >= hhmm(NOW) && (!prev || hhmm(prev.time) < hhmm(NOW));
    const p = program(s.pid);
    const many = s.who.length > 3;
    return `${nowHere?nowRow():''}
      <a class="r ${s.state}" href="constructor.html?client=${s.who[0].id}&date=${date||TODAY}">
        <span class="tm">${s.time}</span>
        <span class="sp"><span class="dot"></span></span>
        <span class="bd">
          <span class="t">${esc(s.title)}</span>
          <span class="sub">
            <span>${esc(p?p.title:'')}</span>${s.draft?`<span class="chip warn">черновик</span>`:''}
            ${s.state==='done'?`<span class="chip ok">Результаты записаны</span>`
              :s.state==='nores'?`<span class="chip warn">${s.done?`${s.done} из ${s.who.length} записали`:'Без результата'}</span>`
              :`<span class="chip">${s.who.length} ${plural(s.who.length,'атлет','атлета','атлетов')}</span>`}
          </span>
          <span class="who">
            <span class="stack">${s.who.slice(0,many?4:3).map(c=>`<span class="av s" title="${esc(c.n)}">${esc(c.ini)}</span>`).join('')}</span>
            <span class="nm">${many ? `${s.who.length} ${plural(s.who.length,'атлет','атлета','атлетов')}` : s.who.map(c=>esc(c.n)).join(', ')}</span>
          </span>
        </span>
      </a>`;
  }).join('');
  const tail = ses.length && hhmm(NOW) > hhmm(ses[ses.length-1].time) ? nowRow() : '';
  /* Несоставленное — тоже строка дня: пустой день и «программа кончилась»
     обязаны выглядеть по-разному, иначе дырку не видно (NFR-4). */
  const gap = gaps ? `<a class="r gap" href="constructor.html">
      <span class="tm">—</span>
      <span class="sp"><span class="dot"></span></span>
      <span class="bd">
        <span class="t">Не составлено</span>
        <span class="sub"><span>${gaps} ${plural(gaps,'атлет ждёт','атлета ждут','атлетов ждут')} тренировку на этот день</span></span>
      </span>
    </a>` : '';
  return `<div class="tl">${rows}${tail}${gap}</div>`;
}
const nowRow = () => `<div class="now"><span class="tm">${NOW}</span><span class="sp"><i></i></span><span class="ln"></span></div>`;

/* Семь дней недели, в которую попадает сегодня — для «Недели одним взглядом». */
const weekDays = (anchor=TODAY) => {
  const start = addDays(anchor, -dowMon(anchor));
  return Array.from({length:7},(_,i)=>addDays(start,i));
};


/* ═══════════ ТАБЛИЦА СО СОРТИРОВКОЙ — одна на все списки ═══════════
   cols: [{k, n, w, r, sort(a,b), cell(row)}]. Состояние сортировки живёт в
   TSORT по идентификатору таблицы: при перерисовке порядок не сбрасывается,
   иначе сортировать было бы бессмысленно — любой фильтр обнулял бы её. */
const TSORT = {};
function dataTable(id, cols, rows){
  const st = TSORT[id] ||= {k:null, dir:1};
  const col = cols.find(c=>c.k===st.k);
  const list = col && col.sort ? [...rows].sort((a,b)=>col.sort(a,b)*st.dir) : rows;
  return `<div class="tblwrap"><table class="tbl" data-tbl="${id}"><thead><tr>
    ${cols.map(c=>`<th class="${c.r?'r ':''}${c.sort?'srt ':''}${st.k===c.k?(st.dir>0?'up':'dn'):''}"
      ${c.sort?`data-sort="${esc(c.k)}"`:''}${c.w?` style="width:${c.w}"`:''}>${esc(c.n)}</th>`).join('')}
  </tr></thead><tbody>
    ${list.map(r=>`<tr class="click" data-row="${esc(r.id)}">
      ${cols.map(c=>`<td class="${c.r?'r ':''}${c.num?'num':''}">${c.cell(r)}</td>`).join('')}
    </tr>`).join('')}
  </tbody></table></div>`;
}
function bindTable(id, redraw, onRow){
  $$(`[data-tbl="${id}"] th[data-sort]`).forEach(th=>th.onclick=()=>{
    const st = TSORT[id];
    if(st.k === th.dataset.sort) st.dir = -st.dir; else { st.k = th.dataset.sort; st.dir = 1 }
    redraw();
  });
  if(onRow) $$(`[data-tbl="${id}"] tr[data-row]`).forEach(tr=>tr.onclick=()=>onRow(tr.dataset.row));
}
const byStr = k => (a,b) => String(a[k]||'').localeCompare(String(b[k]||''));
const byNum = f => (a,b) => (f(a)||0) - (f(b)||0);
