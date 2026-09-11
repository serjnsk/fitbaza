/* ═══════════ МЕНЮ РАБОЧЕГО ПРОСТРАНСТВА — ЕДИНСТВЕННЫЙ ИСТОЧНИК ═══════════
   Файл подключают все страницы, включая конструктор. Раньше конфиг был
   продублирован в ui.js и trainer.js, причём в копии конструктора все ссылки
   стояли заглушками '#': с экрана конструктора нельзя было уйти никуда.
   Дублировать этот массив нельзя — меню обязано быть сквозным. */
const NAV = [
 {g:'Работа'},
 {h:'index.html',      k:'dash',  n:'Дашборд'},
 {h:'calendar.html',   k:'cal',   n:'Календарь',              a:'Кален'},
 {h:'clients.html',    k:'users', n:'Клиенты',                a:'Клиен',  c:()=>CLIENTS.length},
 {g:'Библиотеки'},
 /* Четыре базы по уровням сущностей из документации: упражнение → блок →
    тренировка → программа (недели живут вкладкой внутри базы программ).
    В каждой — и общая база сервиса, и сохранённое тренером, личное с пометкой. */
 {h:'exercises.html',  k:'dumb',  n:'База упражнений',        a:'Упраж',  c:()=>EX.length},
 {h:'blocks.html',     k:'folder',n:'База блоков'            , a:'Блоки',  c:()=>TPL.filter(t=>t.lvl==='блок').length},
 {h:'workouts.html',   k:'tpl',   n:'База тренировок',        a:'Трен',   c:()=>TPL.filter(t=>t.lvl==='тренировка').length},
 {h:'programs.html',   k:'prog',  n:'База программ',          a:'Прогр',  c:()=>TPL.filter(t=>t.lvl==='программа').length},
 {g:'Настройки'},
 {h:'brand.html',      k:'brand', n:'Бренд тренера',          a:'Бренд'},
];



/* ═══════════ ЛОГОТИП — ЕДИНСТВЕННЫЙ ИСТОЧНИК ═══════════
   Был продублирован в ui.js и trainer.js ровно как меню до этого. Держим
   здесь: обе оболочки подключают этот файл.

   Не SVG, а текст: «ТРЕНЕРГРАМ» — десять кириллических прописных, рисовать
   их путями до утверждения финального знака рано. Срез 45° сверху-слева и
   снизу-справа — тот же приём, что на заставке (см. design.html), поэтому
   шапка и первый экран читаются как один бренд. */
const BRAND = 'ТРЕНЕРГРАМ';
/* Два начертания: слово в развёрнутом меню, знак «Т» — в свёрнутом.
   Оба в разметке, переключает CSS: перерисовывать меню ради этого незачем. */
const LOGO = `<span class="logo" role="img" aria-label="${BRAND}">`
  + `<i>${BRAND}</i><em>${BRAND[0]}</em></span>`;

/* ═══════════ ОТРИСОВКА МЕНЮ — ОДНА НА ОБЕ ОБОЛОЧКИ ═══════════
   Третий дубль подряд после NAV и LOGO: конструктор живёт на своей оболочке,
   и любое общее определение норовит в ней размножиться. Держим здесь. */
function renderNav(page){
  $('#nav').innerHTML = `
    <div class="nh">
      ${LOGO}
      <button class="navtog" id="navtog" title="Свернуть меню" aria-label="Свернуть меню">${ICON.back}</button>
    </div>
    <div class="nbody">
      ${NAV.map(x => x.g
        ? `<div class="ngrp">${esc(x.g)}</div>`
        : `<a href="${x.h}" class="${x.h===page?'on':''}" title="${esc(x.n)}">${ICON[x.k]}
             <span class="ntxt">${esc(x.n)}</span><i class="nab">${esc(x.a||x.n)}</i>
             ${x.c?`<span class="cnt">${x.c()}</span>`:''}</a>`).join('')}
    </div>
    <a class="nfoot" href="brand.html" title="${esc(TRAINER.n)}">
      <span class="av">${esc(TRAINER.ini)}</span>
      <span><b>${esc(TRAINER.n)}</b><s>${esc(TRAINER.workspace)}</s></span>
    </a>`;
  $('#navtog').onclick = () => setNavMin(true);
  /* Из свёрнутого состояния выходят кликом по знаку: кнопки-стрелки там нет,
     она заняла бы половину колонки. */
  $('#nav .logo').onclick = () => { if(document.body.classList.contains('navmin')) setNavMin(false) };
}

/* Состояние сворачивания переживает переход между страницами — иначе меню
   разворачивалось бы на каждом клике и сворачивать его было бы бессмысленно. */
function setNavMin(min){
  document.body.classList.toggle('navmin', min);
  const b = document.getElementById('navtog');
  if(b) b.title = b.ariaLabel = min ? 'Развернуть меню' : 'Свернуть меню';
  try{ localStorage.setItem('tg.navmin', min ? '1' : '') }catch(_){}
}
try{ if(localStorage.getItem('tg.navmin')) document.documentElement.classList.add('navmin-boot') }catch(_){}
addEventListener('DOMContentLoaded', ()=>{
  if(document.documentElement.classList.contains('navmin-boot')) setNavMin(true);
});
