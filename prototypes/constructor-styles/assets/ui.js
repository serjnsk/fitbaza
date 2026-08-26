/* ============================================================
   fitbaza · оболочка рабочего пространства (навигация, топбар,
   модалки, тосты, графики). Общая для всех страниц сайта.
   ============================================================ */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el = h => { const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstElementChild };
const initials = e => (e.en||e.ru||'').split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const age = born => { const b=D(born), t=D(TODAY); let a=t.getFullYear()-b.getFullYear();
  if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate())) a--; return a };
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return n+' '+(x>10&&x<20?c:y===1?a:y>1&&y<5?b:c) };
function yearsSince(date){
  const y = daysBetween(date, TODAY)/365.25;
  if(y<1) return plural(Math.max(1,Math.round(daysBetween(date,TODAY)/30)),'месяц','месяца','месяцев');
  return plural(Math.floor(y),'год','года','лет');
}
const humanDate = s => { const d=D(s); return d.getDate()+' '+MONTHS[d.getMonth()] };
function ago(date){
  if(!date) return '—';
  const n = daysBetween(date, TODAY);
  return n===0?'сегодня':n===1?'вчера':plural(n,'день','дня','дней')+' назад';
}

const ICON = {
 dash:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6"/><rect x="11" y="2.5" width="6.5" height="4" rx="1.6"/><rect x="11" y="8.5" width="6.5" height="9" rx="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6"/></svg>',
 users:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="8" cy="6.5" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14 4.2a3 3 0 0 1 0 5.6M15.5 12.6c1.6.7 2.8 2.3 2.8 4.4"/></svg>',
 cal:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg>',
 prog:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="15" height="15" rx="2.5"/><path d="M6 7h8M6 10h8M6 13h4.5"/></svg>',
 build:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 4.5h6M3 10h14M3 15.5h9"/><circle cx="13.5" cy="4.5" r="2"/><circle cx="15" cy="15.5" r="2"/></svg>',
 dumb:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4.5 7v6M2.5 8.5v3M15.5 7v6M17.5 8.5v3M6 10h8"/></svg>',
 tpl:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5A2 2 0 0 1 4.5 3.5h3l1.5 2h6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9z"/></svg>',
 brand:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7.5"/><path d="M10 2.5v15M2.5 10h15" opacity=".45"/><circle cx="10" cy="10" r="3"/></svg>',
 map:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11l-4.5 2-6-2-4.5 2v-11z"/><path d="M7 3.5v11M13 5.5v11"/></svg>',
 plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3.5v9M3.5 8h9"/></svg>',
 copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
 star:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 2.5h9v11l-4.5-2.9-4.5 2.9v-11z"/></svg>',
 x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
 chk:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>',
 clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
 search:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>',
 grip:'<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/><circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/></svg>',
 arr:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
 back:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 8H3M7 4 3 8l4 4"/></svg>',
 link:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-1 1"/><path d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l1-1"/></svg>',
 fire:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 1.5S4 5 4 8.5a4 4 0 0 0 8 0c0-1.5-1-3-2-4 0 1.5-1 2-1.5 2S8 4.5 8 1.5z"/></svg>',
 chat:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 7.5c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5-2.5 5-5.5 5c-.8 0-1.6-.1-2.3-.4L3 13.5l.6-2.3a4.7 4.7 0 0 1-1.1-3.7z"/></svg>',
};

/* ─── навигация ─── */
const NAV = [
 {g:'Работа'},
 {h:'index.html',      k:'dash',  n:'Дашборд'},
 {h:'clients.html',    k:'users', n:'Клиенты',        c:()=>CLIENTS.length},
 {h:'calendar.html',   k:'cal',   n:'Календарь',      rid:'CAL-1'},
 {g:'Программы'},
 {h:'programs.html',   k:'prog',  n:'Программы',      c:()=>PROGRAMS.length},
 {h:'constructor.html',k:'build', n:'Конструктор',    rid:'CON'},
 {g:'Библиотеки'},
 {h:'exercises.html',  k:'dumb',  n:'База упражнений',c:()=>EX.length, rid:'EX-1'},
 {h:'templates.html',  k:'tpl',   n:'Шаблоны',        c:()=>TPL.length, rid:'TPL-2'},
 {g:'Настройки'},
 {h:'brand.html',      k:'brand', n:'Бренд и профиль',rid:'BRD-1'},
 {h:'sitemap.html',    k:'map',   n:'Карта сайта'},
];

function renderNav(page){
  $('#nav').innerHTML = `
   <div class="nh">
     <span class="mk"></span>
     <span class="wm"><b>fitbaza</b></span>
     <button class="iact" id="navToggle" title="Свернуть навигацию">${ICON.grip}</button>
   </div>
   <div class="nbody">
     ${NAV.map(x=>{
       if(x.g) return `<div class="ngrp">${x.g}</div>`;
       const on = x.h && x.h===page;
       const cnt = x.c ? `<span class="cnt">${x.c()}</span>` : '';
       const body = `${ICON[x.k]}<span class="ntxt">${esc(x.n)}</span>${x.rid?`<span class="rid">${x.rid}</span>`:''}${cnt}`;
       return `<a class="nitem ${on?'on':''}" href="${x.h}" title="${esc(x.n)}">${body}</a>`;
     }).join('')}
   </div>
   <div class="nfoot">
     <a class="nitem" href="brand.html" title="${esc(TRAINER.n)}">
       <span class="av s">${TRAINER.ini}</span>
       <span class="ntxt">${esc(TRAINER.n)}</span>
     </a>
   </div>`;
}

/* ─── топбар ─── */
function renderTop(cfg){
  const left = cfg.crumb
    ? `<nav class="crumb">${cfg.crumb.map((c,i)=>i<cfg.crumb.length-1
        ? `<a href="${c.h}">${esc(c.n)}</a><span class="sep">/</span>`
        : `<span class="cur">${esc(c.n)}</span>`).join('')}</nav>`
    : `<div style="min-width:0"><div class="ptitle">${esc(cfg.title)}</div></div>`;
  const sub = cfg.sub ? `<div class="psub">${cfg.sub}</div>` : '';
  $('#topbar').innerHTML = `${left}${sub}<div class="spacer"></div>${cfg.actions||''}
    <label class="swt" id="idSwt"><span class="tr"></span>ID требований</label>`;
}
/* Правки применяются сразу; отдельной кнопки «сохранить» и индикатора нет.
   О значимых действиях сообщает тост. */
function touch(){ saveState() }

/* ─── тосты и модалки ─── */
function toast(msg, rid){
  const t = el(`<div class="toast"><span class="dot acid"></span><span>${esc(msg)}</span>${rid?`<span class="rid hot">${rid}</span>`:''}</div>`);
  $('#toasts').appendChild(t);
  setTimeout(()=>{t.style.transition='.2s';t.style.opacity='0';t.style.transform='translateY(6px)';setTimeout(()=>t.remove(),200)},2400);
}
function openModal({title, rid, body, foot, wide}){
  $('#scrim').innerHTML = `<div class="modal ${wide?'wide':''}">
    <div class="mh"><span class="dot acid"></span><span class="t">${esc(title)}</span>
      ${rid?`<span class="rid hot">${rid}</span>`:''}
      <button class="iact" data-close>${ICON.x}</button></div>
    <div class="mb">${body}</div>
    ${foot?`<div class="mf">${foot}</div>`:''}</div>`;
  $('#scrim').classList.add('on');
}
const closeModal = () => $('#scrim').classList.remove('on');

/* ─── графики (PRO-6) ─── */
function sparkline(vals, w=64, h=20, color='var(--acid)'){
  if(!vals || vals.length<2) return '';
  const min=Math.min(...vals), max=Math.max(...vals), sp=max-min||1;
  const pts = vals.map((v,i)=>[i/(vals.length-1)*w, h-2-(v-min)/sp*(h-4)]);
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"
      stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
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
    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--acid)" stop-opacity=".18"/><stop offset="1" stop-color="var(--acid)" stop-opacity="0"/>
    </linearGradient></defs>
    ${ticks.map(t=>`<line x1="${PL}" y1="${y(t).toFixed(1)}" x2="${W-PR}" y2="${y(t).toFixed(1)}" stroke="rgba(255,255,255,.06)"/>
      <text class="yl" x="${PL-8}" y="${(y(t)+3).toFixed(1)}" text-anchor="end">${fmtNum(t)}</text>`).join('')}
    <path d="${area}" fill="url(#g1)"/>
    <path d="${path}" fill="none" stroke="var(--acid)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===pts.length-1?4:3}"
        fill="${i===pts.length-1?'var(--acid)':'var(--bg)'}" stroke="var(--acid)" stroke-width="1.6"/>`).join('')}
    ${series.map((s,i)=>`<text class="yl" x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${dm(s[0])}</text>`).join('')}
    <text class="yl" x="${x(series.length-1).toFixed(1)}" y="${(y(series[series.length-1][1])-11).toFixed(1)}"
      text-anchor="middle" fill="var(--acid)" style="font-size:11px;font-weight:600">${fmtNum(series[series.length-1][1])} ${unit}</text>
  </svg>`;
}

/* ─── загрузка страницы ─── */
function initShell(cfg){
  document.body.classList.toggle('ids', !!STATE.ids);
  document.body.classList.toggle('navc', !!STATE.navc || !!cfg.collapseNav);
  renderNav(cfg.page);
  renderTop(cfg);
}
document.addEventListener('click', e=>{
  if(e.target.closest('#navToggle')){ STATE.navc=!document.body.classList.contains('navc');
    document.body.classList.toggle('navc',STATE.navc); saveState(); window.dispatchEvent(new Event('resize')); return }
  if(e.target.closest('#idSwt')){ STATE.ids=!document.body.classList.contains('ids');
    document.body.classList.toggle('ids',STATE.ids); $('#idSwt').classList.toggle('on',STATE.ids); saveState(); return }
  if(e.target.closest('[data-close]') || e.target===$('#scrim')) closeModal();
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeModal();
  if(e.key==='/' && !/input|textarea/i.test(e.target.tagName)){ const q=$('#q'); if(q){ e.preventDefault(); q.focus() } }
});
window.addEventListener('DOMContentLoaded', ()=>{ if(STATE.ids) $('#idSwt')?.classList.add('on') });
