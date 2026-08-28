/* ═══════════════════════════════════════════════════════════════
   ЛАЙМ · конструктор тренера — поведение

   Свой рендер под свою вёрстку. Общего с другими вариантами нет
   ничего, кроме доменной модели, и та лежит здесь копией: правка
   в одном варианте не должна доезжать до другого — из-за этой связи
   и ломались правки раньше.

   Что работает: переключение дней, свободный ввод строки с разбором
   («Присед 5×3 80%»), правка и удаление строк, добавление блоков,
   добавление из библиотеки, поиск, смена клиента с пересчётом
   процентов в килограммы, назначение недели.
   ═══════════════════════════════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const DOWS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
/* Пустой день модель называет «Отдых» или прочерком — в поле названия
   это должно читаться как пустота, а не как введённый текст. */
const REST_TITLES = new Set(['Отдых','—','']);
const MON  = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];

const S = { pid:'p1', wk:0, day:0, cid:'c1', tab:'ex', q:'', sel:null, assigned:false };
S.wk  = Math.floor(daysBetween(program(S.pid).start, TODAY)/7) + 1;
const WEEKS = {};
const week = () => WEEKS[S.wk] ||= buildWeek(S.pid, S.wk);
const day  = () => week().days[S.day];
const PM   = () => pmOf(S.cid);
S.day = Math.max(0, week().days.findIndex(d=>d.date===TODAY));

/* Разбор одной строки: parseText возвращает список результатов,
   нам нужен первый и только если он распознан. */
function parseLine(text){
  const r = parseText(String(text||'').trim())[0];
  return r && r.type === 'ok' ? r.item : null;
}
/* Тип блока выводится из содержимого, а не хранится: отдельной
   сущности «тип блока» в модели нет и заводить её ради ярлыка
   не стоит — она разойдётся с тем, что тренер написал. */
function tagOf(b){
  if(/размин|разогр/i.test(b.title)) return 'РАЗОГРЕВ';
  if(/заминк|растяж/i.test(b.title)) return 'ЗАМИНКА';
  const f = findFmt(b.title); if(f) return f.k || 'КОМПЛЕКС';
  if(b.items.some(i=>i.pct!=null)) return 'СИЛА · % ОТ 1ПМ';
  return null;
}
const isPower = b => b.items.some(i=>i.pct!=null);
const exCount = d => d.blocks.reduce((a,b)=>a+b.items.filter(i=>i.exId).length,0);

/* ═══════════ РЕЛЬС ═══════════ */
/* Иконки линейные, обводка 1.5 — рисуют то, что за ними стоит,
   а не абстрактный значок. Один набор на все варианты, но кегль
   и цвет каждая стилистика задаёт себе сама. */
const ICO = {
  dash:'<path d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z"/>',
  cli :'<circle cx="10" cy="6.5" r="3.2"/><path d="M4 17c0-3.3 2.7-5 6-5s6 1.7 6 5"/>',
  cal :'<rect x="3" y="4.5" width="14" height="12.5" rx="1.5"/><path d="M3 8.5h14M7 3v3M13 3v3"/>',
  prog:'<path d="M10 2.5 17.5 6 10 9.5 2.5 6z"/><path d="M2.5 10 10 13.5 17.5 10"/><path d="M2.5 14 10 17.5 17.5 14"/>',
  bld :'<path d="M3 6h5M12 6h5M3 14h9M16 14h1"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="14" r="2"/>',
  base:'<path d="M4 8v4M16 8v4M6.5 6v8M13.5 6v8M6.5 10h7"/>',
  tpl :'<path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.4l1.4 2h7.2A1.5 1.5 0 0 1 17.5 7.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5z"/>',
  brand:'<circle cx="10" cy="10" r="7"/><path d="M10 6.5v7M6.5 10h7"/>',
  map :'<path d="M2.5 5.5 7.5 3.5v11l-5 2z"/><path d="M7.5 3.5l5 2v11l-5-2z"/><path d="M12.5 5.5l5-2v11l-5 2z"/>',
};
const svg = k => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg>`;
const NAV = [
  {g:'Работа'},
  {n:'Дашборд', i:'dash'}, {n:'Клиенты', i:'cli', c:()=>CLIENTS.length}, {n:'Календарь', i:'cal'},
  {g:'Программы'},
  {n:'Программы', i:'prog', c:()=>PROGRAMS.length}, {n:'Конструктор', i:'bld', on:true},
  {g:'Библиотеки'},
  {n:'База упражнений', i:'base', c:()=>EX.length}, {n:'Шаблоны', i:'tpl', c:()=>TPL.length},
  {g:'Настройки'},
  {n:'Бренд и профиль', i:'brand'}, {n:'Карта сайта', i:'map'},
];
function renderNav(){
  $('#nav').innerHTML = `
    <div class="lg"><i>fb</i><b>Fitbaza</b><s></s></div>
    <div class="body">${NAV.map(x => x.g
      ? `<div class="grp">${esc(x.g)}</div>`
      : `<a href="#" class="${x.on?'on':''}">${svg(x.i)}
           <span>${esc(x.n)}</span>${x.c?`<em>${x.c()}</em>`:''}</a>`).join('')}</div>
    <div class="me"><i>${esc(TRAINER.ini)}</i>
      <span><b>${esc(TRAINER.n)}</b><s>${esc(TRAINER.workspace)}</s></span></div>`;
}

/* ═══════════ ТОПБАР ═══════════ */
function renderTop(){
  const p = program(S.pid);
  $('#top').innerHTML = `
    <nav class="crumb"><a href="#">Программы</a><s>/</s>
      <a href="#">${esc(p.title)}</a><s>/</s><b>Неделя ${S.wk}</b></nav>
    <span class="stt ${S.assigned?'on':''}">${S.assigned?'назначено':'черновик'}</span>
    <span class="sp"></span>
    <span class="forw"><span>веса для</span>
      <label><i>${esc(client(S.cid).ini||'АК')}</i>
        <select id="cli">${CLIENTS.map(c=>
          `<option value="${c.id}" ${c.id===S.cid?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
      </label></span>
    <button class="ib" title="Поиск">⌕</button>
    <button class="go" id="assign"><s>✓</s> Назначить</button>`;
}

/* ═══════════ ДОРОЖКА НЕДЕЛИ ═══════════ */
function renderWeek(){
  const w = week(), p = program(S.pid);
  const dates = [w.days[0], w.days[6]].map(d=>new Date(d.date+'T00:00:00'));
  const span = `${dates[0].getDate()}–${dates[1].getDate()} ${MON[dates[1].getMonth()]}`;
  const filled = w.days.filter(d=>exCount(d)>0).length;
  const nAll = w.days.reduce((a,d)=>a+exCount(d),0);
  $('#wk').innerHTML = `
    <div class="wkh">
      <span class="arr">
        <button id="prev" ${S.wk<2?'disabled':''} title="Прошлая неделя">←</button>
        <button id="next" ${S.wk>=p.weeks?'disabled':''} title="Следующая неделя">→</button>
      </span>
      <b>Неделя ${S.wk} из ${p.weeks}</b>
      <s>${span} · ${filled} ${plural(filled,'день','дня','дней')} · ${nAll} упр</s>
      <span class="sp"></span>
      <button class="act">Сохранить</button>
      <button class="act">Из шаблонов</button>
      ${S.wk>1?'<button class="act" id="copyprev">Копия прошлой недели</button>':''}
    </div>
    <div class="track">${w.days.map((d,i)=>{
      const n = exCount(d), rest = n === 0;
      const dt = new Date(d.date+'T00:00:00');
      return `<button class="day ${i===S.day?'on':''} ${rest?'rest':''}"
                      data-day="${i}" style="--w:${4+n}">
        <span class="h"><b>${dt.getDate()}</b><s>${DOWS[i]}${i===S.day&&!rest?' · сейчас':''}</s></span>
        ${rest ? '<span class="t">отдых</span>'
               : `<span class="t">${esc(d.title)}</span>
                  <span class="ld"><i style="flex:${n}"></i>
                    <u style="flex:${Math.max(1,14-n)}"></u><em>${n}</em></span>`}
      </button>`}).join('')}</div>
    <div class="legend"><i></i><span>упражнений в дне</span>
      <span class="ln"></span><span>ширина дня = объём</span></div>`;
}

/* ═══════════ ДОКУМЕНТ ДНЯ ═══════════ */
const dayTalk = date => { const k = talkKey(S.cid, date);
  return TALK.workout[k] || (TALK.workout[k] = []) };
const trainerMsg = date => (dayTalk(date).find(m=>m.who==='trainer')||{}).text || '';
function setTrainerMsg(date, text){
  const arr = dayTalk(date), i = arr.findIndex(m=>m.who==='trainer'), t = (text||'').trim();
  if(!t){ if(i>=0) arr.splice(i,1); return }
  if(i>=0) arr[i].text = t; else arr.unshift({who:'trainer', text:t, at:'сейчас'});
}

function lineHTML(it){
  const ex = it.exId ? byId(it.exId) : null;
  if(!ex) return `<div class="line raw" data-item="${it.id}">
    <span class="gr">⠿</span>
    <span class="nm" contenteditable data-edit="${it.id}">${esc(it.raw||'')}</span>
    <button class="pick" data-pick="${it.id}">выбрать из базы</button>
    <button class="x" data-del="${it.id}">✕</button>
  </div>`;
  const kg = workKg(it, PM());
  const val = [it.scheme, kg!=null ? fmtN(kg)+' кг' : (it.val ? it.val+' '+it.unit : '')]
    .filter(Boolean).join(' · ');
  return `<div class="line ${S.sel===it.id?'on':''}" data-item="${it.id}">
    <span class="gr">⠿</span>
    <span class="nm" contenteditable data-edit="${it.id}">${esc(ex.ru)}</span>
    <span class="en">${esc(ex.en)} · ${esc(ex.eq.toLowerCase())}</span>
    ${it.pct!=null ? `<button class="val pct" data-pct="${it.id}">${fmtN(it.pct)}%</button>` : ''}
    ${val ? `<span class="val">${esc(val)}</span>` : ''}
    <button class="x" data-del="${it.id}">✕</button>
  </div>`;
}

function blockHTML(b, i){
  const tag = tagOf(b), f = findFmt(b.title);
  return `<section class="card blk ${isPower(b)?'pw':''}" data-blk="${b.id}">
    <div class="bh">
      <span class="no">${i+1}</span>
      <input value="${esc(b.title)}" data-f="title" data-blk="${b.id}"
             placeholder="Название блока">
      ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
      ${f && f.rest ? `<span class="rest">отдых ${Math.floor(f.rest/60)}:${String(f.rest%60).padStart(2,'0')}</span>` : ''}
      <button class="ib" title="Сохранить блок">✧</button>
      <button class="ib" data-delblk="${b.id}" title="Удалить блок">✕</button>
    </div>
    <label class="bnote"><span>заметка</span>
      <input value="${esc(b.note||'')}" data-f="note" data-blk="${b.id}"
             placeholder="Увидит клиент над этим блоком"></label>
    ${b.items.map(lineHTML).join('')}
    <button class="addl" data-add="${b.id}">+ Упражнение — печатайте как в тетради: «Присед 5×3 80%»</button>
  </section>`;
}

function renderDoc(){
  const d = day(), dt = new Date(d.date+'T00:00:00');
  const n = exCount(d);
  $('#doc').innerHTML = `
    <section class="card dayc">
      <div class="dayh">
        <span class="ph"></span>
        <input id="dtitle" value="${esc(REST_TITLES.has(d.title)?'':(d.title||''))}"
               placeholder="${DOWS[S.day]} · ${dt.getDate()} ${MON[dt.getMonth()]}">
        ${d.blocks.length ? `<span class="n">${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')} · ${n} упр</span>
          <button class="ib" title="Сохранить тренировку">✧</button>
          <button class="ib" id="clear" title="Очистить день">✕</button>` : ''}
      </div>
      <label class="wmsg"><span>клиенту</span>
        <input id="wmsg" value="${esc(trainerMsg(d.date))}"
               placeholder="Сообщение ко всей тренировке — клиент увидит его первым"></label>
    </section>
    <button class="addb" id="addblk">+ Добавить блок</button>
    ${d.blocks.map(blockHTML).join('')}`;
}

/* ═══════════ БИБЛИОТЕКА ═══════════ */
const inDay = id => day().blocks.some(b=>b.items.some(i=>i.exId===id));
const initials = e => e.en.split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function renderLib(){
  const q = S.q.trim().toLowerCase();
  const hit = t => !q || String(t).toLowerCase().includes(q);
  let body = '';
  if(S.tab === 'ex'){
    const list = EX.filter(e=>hit(e.ru)||hit(e.en));
    const groups = [...new Set(list.map(e=>e.g))];
    body = groups.map(g=>{
      const items = list.filter(e=>e.g===g);
      return `<div class="grp"><b>${esc(g)}</b><s>${items.length}</s></div>` +
        items.map(e=>`<button class="exc ${inDay(e.id)?'in':''}" data-ex="${e.id}">
          <i>${esc(initials(e))}</i>
          <span class="b"><span class="nm">${esc(e.ru)}</span>
            <span class="en">${esc(e.en)} · ${esc(e.eq.toLowerCase())}</span></span>
          ${inDay(e.id)?'<span class="chip">в плане</span>':''}
        </button>`).join('');
    }).join('');
  } else if(S.tab === 'blk'){
    const list = TPL.filter(t=>t.lvl==='блок' && hit(t.title));
    body = list.map(b=>`<button class="tplc" data-tplb="${b.id}">
      <span class="h"><span class="nm">${esc(b.title)}</span>
        <span class="chip">${b.items.length} упр</span></span>
      <s>${esc(b.items.map(i=>{const e=byId(i[0]); return e?e.ru:''}).filter(Boolean).join(' · '))}</s>
    </button>`).join('');
  } else {
    const list = TPL.filter(t=>t.lvl==='тренировка' && hit(t.title));
    const nameOf = id => (TPL.find(x=>x.id===id)||{}).title || '';
    body = list.map(t=>`<button class="tplc" data-tplw="${t.id}">
      <span class="h"><span class="nm">${esc(t.title)}</span>
        <span class="chip">${t.blocks.length} бл</span></span>
      <s>${esc(t.blocks.map(nameOf).filter(Boolean).join(' · '))}</s>
    </button>`).join('');
  }
  $('#libb').innerHTML = body || '<div class="empty">Ничего не нашлось</div>';
  $$('#tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  $('#q').placeholder = S.tab==='ex' ? `Поиск по базе — ${EX.length}`
    : S.tab==='blk' ? 'Поиск по блокам' : 'Поиск по тренировкам';
}

function render(){ renderTop(); renderWeek(); renderDoc(); renderLib() }

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
document.addEventListener('click', e=>{
  const t = e.target;
  const day_ = t.closest('[data-day]');
  if(day_){ S.day = +day_.dataset.day; S.sel = null; return render() }
  if(t.closest('#prev')){ S.wk--; S.day = 0; S.sel = null; return render() }
  if(t.closest('#next')){ S.wk++; S.day = 0; S.sel = null; return render() }
  if(t.closest('#assign')){ S.assigned = true; return renderTop() }
  if(t.closest('#clear')){ day().blocks = []; day().title = 'Отдых'; return render() }
  if(t.closest('#addblk')){
    day().blocks.push(mkBlock(null,'Новый блок','',null,[]));
    if(REST_TITLES.has(day().title)) day().title = 'Тренировка';
    return render();
  }
  const tab = t.closest('[data-tab]');
  if(tab){ S.tab = tab.dataset.tab; return renderLib() }

  const del = t.closest('[data-del]');
  if(del){ const id = del.dataset.del;
    day().blocks.forEach(b=>b.items = b.items.filter(i=>i.id!==id)); return render() }
  const dblk = t.closest('[data-delblk]');
  if(dblk){ day().blocks = day().blocks.filter(b=>b.id!==dblk.dataset.delblk); return render() }

  /* Проценты по кругу: 60 → 70 → 80 → 90 → без процента. Отдельного
     поля не нужно, тренер думает шагами по десять. */
  const pct = t.closest('[data-pct]');
  if(pct){ const it = findItem(pct.dataset.pct);
    it.pct = it.pct == null ? 60 : it.pct >= 90 ? null : it.pct + 10; return render() }

  const add = t.closest('[data-add]');
  if(add){ openInput(add) }

  const exb = t.closest('[data-ex]');
  if(exb){ addExercise(exb.dataset.ex); return render() }

  const tb = t.closest('[data-tplb]');
  if(tb){ const tpl = TPL.find(x=>x.id===tb.dataset.tplb);
    day().blocks.push(mkBlock(null, tpl.title, '', tpl.fmt||null, tpl.items));
    if(REST_TITLES.has(day().title)) day().title = 'Тренировка';
    return render() }
  const tw = t.closest('[data-tplw]');
  if(tw){ const tpl = TPL.find(x=>x.id===tw.dataset.tplw);
    day().blocks = tpl.blocks.map(id=>{ const b = TPL.find(x=>x.id===id);
      return mkBlock(null, b.title, '', b.fmt||null, b.items) });
    day().title = tpl.title;
    return render() }

  const line = t.closest('.line');
  if(line && !t.closest('button')) S.sel = line.dataset.item, render();
});

const findItem = id => day().blocks.flatMap(b=>b.items).find(i=>i.id===id);

/* Свободный ввод — главный путь: строка превращается в кнопку-поле,
   разбирается на упражнение со схемой и процентом, а нераспознанное
   остаётся текстом. Это прямо в требованиях: «нераспознанные строки
   остаются текстом и конвертируются вручную». */
function openInput(btn){
  const bid = btn.dataset.add;
  btn.innerHTML = '<input placeholder="Присед 5×3 80%">';
  const inp = btn.querySelector('input');
  inp.focus();
  const commit = () => {
    const txt = inp.value.trim();
    if(txt){
      const b = day().blocks.find(x=>x.id===bid);
      const p = parseLine(txt);
      b.items.push(p ? mkItem(p.exId, p.scheme||'', p.pct??null, p.unit||null, p.val||'')
                     : rawItem(txt));
    }
    render();
  };
  inp.addEventListener('keydown', ev=>{ if(ev.key==='Enter') commit();
    if(ev.key==='Escape') render() });
  inp.addEventListener('blur', commit);
}

function addExercise(exId){
  const d = day();
  if(!d.blocks.length){ d.blocks.push(mkBlock(null,'Новый блок','',null,[]));
                        if(REST_TITLES.has(d.title)) d.title = 'Тренировка' }
  d.blocks[d.blocks.length-1].items.push(mkItem(exId, ''));
}

/* Правка текста строки: на выходе из поля строка перечитывается тем же
   разбором, что и при вводе. Одна дорога вместо двух. */
document.addEventListener('blur', e=>{
  const ed = e.target.closest?.('[data-edit]');
  if(ed){ const it = findItem(ed.dataset.edit);
    if(!it) return;
    const p = parseLine(ed.textContent);
    if(p){ it.exId = p.exId; it.raw = null; it.scheme = p.scheme||it.scheme;
           if(p.pct!=null) it.pct = p.pct }
    else { it.exId = null; it.raw = ed.textContent.trim() }
    return render();
  }
}, true);

document.addEventListener('change', e=>{
  if(e.target.id === 'cli'){ S.cid = e.target.value; return render() }
});
document.addEventListener('input', e=>{
  const t = e.target;
  if(t.id === 'q'){ S.q = t.value; return renderLib() }
  if(t.id === 'dtitle'){ day().title = t.value.trim() || 'Тренировка'; return renderWeek() }
  if(t.id === 'wmsg'){ return setTrainerMsg(day().date, t.value) }
  const f = t.dataset.f;
  if(f){ const b = day().blocks.find(x=>x.id===t.dataset.blk);
         if(b) b[f] = t.value; if(f==='title') renderLib() }
});

renderNav(); render();
