/* ============================================================
   fitbaza · mvp-strava · оболочка рабочего пространства
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

/* Копия LOGO из trainer.js (assets/logo.svg) — держим инлайн по той же
   причине: маленький, а инлайн даёт квадрату брать акцент темы из CSS. */
const LOGO = `<svg class="logo" viewBox="0 0 336 49" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="fitbaza">
<path d="M2 2H37.584V12.56H16.144V20.112H34.576V30.224H16.144V46.032H2V2Z" fill="currentColor"/>
<path d="M45.3275 46.032V2H59.4715V46.032H45.3275Z" fill="currentColor"/>
<path d="M94.9065 13.264V46.032H80.7625V13.264H66.2985V2H109.307V13.264H94.9065Z" fill="currentColor"/>
<path d="M145.062 2C147.281 2 149.307 2.46933 151.142 3.408C153.019 4.304 154.491 5.584 155.558 7.248C156.667 8.912 157.222 10.768 157.222 12.816C157.222 18.2347 154.769 21.648 149.862 23.056V23.312C155.451 24.592 158.246 28.2613 158.246 34.32C158.246 36.624 157.67 38.672 156.518 40.464C155.409 42.2133 153.873 43.5787 151.91 44.56C149.947 45.5413 147.793 46.032 145.446 46.032H115.75V2H145.062ZM129.894 19.152H139.622C140.561 19.152 141.329 18.832 141.926 18.192C142.566 17.5093 142.886 16.6773 142.886 15.696V15.056C142.886 14.1173 142.566 13.328 141.926 12.688C141.286 12.0053 140.518 11.664 139.622 11.664H129.894V19.152ZM129.894 35.792H140.646C141.585 35.792 142.353 35.472 142.95 34.832C143.59 34.1493 143.91 33.3173 143.91 32.336V31.696C143.91 30.7147 143.59 29.904 142.95 29.264C142.353 28.5813 141.585 28.24 140.646 28.24H129.894V35.792Z" fill="currentColor"/>
<path d="M194.004 46.032L192.148 39.824H176.724L174.868 46.032H160.404L176.468 2H192.916L208.98 46.032H194.004ZM179.668 29.968H189.204L184.596 14.288H184.34L179.668 29.968Z" fill="currentColor"/>
<path d="M232.872 35.472H253.801V46.032H211.113V41.488L231.529 12.56H212.648V2H253.288V6.544L232.872 35.472Z" fill="currentColor"/>
<path d="M290.004 46.032L288.148 39.824H272.724L270.868 46.032H256.404L272.468 2H288.916L304.98 46.032H290.004ZM275.668 29.968H285.204L280.596 14.288H280.34L275.668 29.968Z" fill="currentColor"/>
<path d="M333.98 26.032H313.98V46.032H333.98V26.032Z" fill="var(--acc)"/>
</svg>`;

/* ─── навигация по рабочему пространству ─── */
const NAV = [
 {g:'Работа'},
 {h:'index.html',      k:'dash',  n:'Дашборд'},
 {h:'clients.html',    k:'users', n:'Клиенты',        a:'Клиен', c:()=>CLIENTS.length},
 {h:'calendar.html',   k:'cal',   n:'Календарь',      a:'Кален'},
 {g:'Программы'},
 {h:'programs.html',   k:'prog',  n:'Программы',      a:'Прогр', c:()=>PROGRAMS.length},
 {h:'constructor.html',k:'build', n:'Конструктор',    a:'Констр'},
 {g:'Библиотеки'},
 {h:'exercises.html',  k:'dumb',  n:'База упражнений',a:'База',  c:()=>EX.length},
 {h:'templates.html',  k:'tpl',   n:'Шаблоны',        a:'Шабл',  c:()=>TPL.length},
 {g:'Настройки'},
 {h:'brand.html',      k:'brand', n:'Бренд и профиль',a:'Бренд'},
 {h:'sitemap.html',    k:'map',   n:'Карта сайта',    a:'Карта'},
];
function renderNav(page){
  $('#nav').innerHTML = `
    <div class="nh">${LOGO}</div>
    <div class="nbody">
      ${NAV.map(x => x.g
        ? `<div class="ngrp">${esc(x.g)}</div>`
        : `<a href="${x.h}" class="${x.h===page?'on':''}">${ICON[x.k]}
             <span class="ntxt">${esc(x.n)}</span><i class="nab">${esc(x.a||x.n)}</i>
             ${x.c?`<span class="cnt">${x.c()}</span>`:''}</a>`).join('')}
    </div>
    <a class="nfoot" href="brand.html">
      <span class="av">${esc(TRAINER.ini)}</span>
      <span><b>${esc(TRAINER.n)}</b><s>${esc(TRAINER.workspace)}</s></span>
    </a>`;
}

/* ─── топбар ───
   cfg.crumb = [{n,h}...] (последний элемент — текущая страница, без ссылки)
   либо cfg.title — простой заголовок без хлебных крошек. */
function renderTop(cfg){
  const crumb = cfg.crumb || [{n:cfg.title}];
  $('#topbar').innerHTML = `
    <nav class="crumb">${crumb.map((c,i)=>i<crumb.length-1
      ? `<a href="${c.h}">${esc(c.n)}</a><span class="sep">/</span>`
      : `<span class="cur">${esc(c.n)}</span>`).join('')}</nav>
    ${cfg.sub?`<span class="sep">·</span><span class="cur" style="font-weight:500;color:var(--tx3)">${esc(cfg.sub)}</span>`:''}
    <span class="sp"></span>
    ${cfg.actions||''}`;
}

function initShell(cfg){
  renderNav(cfg.page);
  renderTop(cfg);
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
