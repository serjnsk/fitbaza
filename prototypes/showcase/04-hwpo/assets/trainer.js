/* ═══════════════════════════════════════════════════════════════
   HWPO · конструктор тренера — поведение

   Свой рендер под свою вёрстку. Общего с другими вариантами нет
   ничего, кроме доменной модели, и та лежит здесь копией.

   Работает: переключение дней и недель, свободный ввод строки
   с разбором («Присед 5×3 80%»), правка и удаление строк, проценты
   по кругу, добавление и дублирование блоков, шаблоны, добавление
   из библиотеки, поиск, смена клиента с пересчётом процентов
   в килограммы, назначение недели.
   ═══════════════════════════════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const DOWS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const DOWF = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const MONF = ['января','февраля','марта','апреля','мая','июня','июля','августа',
              'сентября','октября','ноября','декабря'];
const REST = new Set(['Отдых','—','']);

const S = { pid:'p1', wk:0, day:0, cid:'c1', tab:'ex', q:'', sel:null, assigned:false };
S.wk = Math.floor(daysBetween(program(S.pid).start, TODAY)/7) + 1;
const WEEKS = {};
const week = () => WEEKS[S.wk] ||= buildWeek(S.pid, S.wk);
const day  = () => week().days[S.day];
const PM   = () => pmOf(S.cid);
S.day = Math.max(0, week().days.findIndex(d=>d.date===TODAY));

function parseLine(text){
  const r = parseText(String(text||'').trim())[0];
  return r && r.type === 'ok' ? r.item : null;
}
const exCount = d => d.blocks.reduce((a,b)=>a+b.items.filter(i=>i.exId).length,0);
/* Тоннаж — то, ради чего тренер и смотрит на день целиком: сумма
   поднятого веса по всем подходам. Считается из того же расчёта,
   что и килограммы в строке, отдельного поля не заводим. */
function tonnage(d){
  let t = 0;
  d.blocks.forEach(b=>b.items.forEach(i=>{
    const kg = workKg(i, PM()); if(kg == null) return;
    buildSets(i, PM()).forEach(s=>{ if(s.reps) t += kg * s.reps });
  }));
  return Math.round(t);
}
/* Столбик на упражнение, высота — число подходов. Одинаковых
   столбиков не бывает: день с пятью подходами читается иначе,
   чем день из пяти одиночных упражнений. */
function loadBars(d){
  const out = [];
  d.blocks.forEach(b=>b.items.forEach(i=>{
    if(!i.exId) return;
    out.push(Math.max(1, buildSets(i, PM()).length));
  }));
  return out;
}
/* Ярлык блока выводится из содержимого, а не хранится: сущности
   «тип блока» в модели нет, и заводить её ради подписи не нужно. */
function chipOf(b){
  const f = findFmt(b.title);
  if(f) return {t:f.k || 'комплекс', acc:true};
  const pow = b.items.filter(i=>i.pct!=null);
  if(pow.length){ const n = Math.max(...pow.map(i=>buildSets(i, PM()).length));
    return {t:`${n} ${plural(n,'подход','подхода','подходов')}`, acc:true} }
  const m = b.title.match(/×\s*(\d+)/);
  if(m) return {t:`${m[1]} ${plural(+m[1],'круг','круга','кругов')}`};
  const n = b.items.length;
  return {t:`${n} упр · ${n*3} мин`};
}
/* Назначение строкой ПЕРЕД названием — примета этой стилистики.
   Порядок «сколько, потом что» позволяет читать объём по левому
   краю, не разбирая названия. */
function presc(it){
  const kg = workKg(it, PM());
  if(kg != null) return (it.scheme || '') + (it.scheme ? ' · ' : '') + fmtN(kg) + ' кг';
  if(it.val) return (it.scheme ? it.scheme + ' · ' : '') + it.val + ' ' + it.unit;
  return it.scheme || '—';
}

/* ═══════════ НАВИГАЦИЯ ═══════════ */
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
  {g:'Работа'}, {n:'Дашборд', i:'dash'}, {n:'Клиенты', i:'cli', c:()=>CLIENTS.length},
  {n:'Календарь', i:'cal'},
  {g:'Программы'}, {n:'Программы', i:'prog', c:()=>PROGRAMS.length},
  {n:'Конструктор', i:'bld', on:1},
  {g:'Библиотеки'}, {n:'База упражнений', i:'base', c:()=>EX.length},
  {n:'Шаблоны', i:'tpl', c:()=>TPL.length},
  {g:'Настройки'}, {n:'Бренд и профиль', i:'brand'},
];
function renderNav(){
  $('#nav').innerHTML = `
    <div class="lg">FITBAZA<i></i></div>
    <div class="body">${NAV.map(x=>x.g
      ? `<div class="grp">${esc(x.g)}</div>`
      : `<a href="#" class="${x.on?'on':''}">${svg(x.i)}
           <span>${esc(x.n)}</span>${x.c?`<em>${x.c()}</em>`:''}</a>`).join('')}</div>
    <div class="me"><i>${esc(TRAINER.ini)}</i>
      <span><b>${esc(TRAINER.n)}</b><s>${esc(TRAINER.workspace)}</s></span></div>`;
}
function renderTop(){
  const p = program(S.pid);
  $('#top').innerHTML = `
    <nav class="crumb"><span>Программы</span><s>/</s><span>${esc(p.title)}</span><s>/</s>
      <b>Неделя ${S.wk}</b></nav>
    <span class="sp"></span>
    <span class="forw"><span>веса для</span>
      <label><select id="cli">${CLIENTS.map(c=>
        `<option value="${c.id}" ${c.id===S.cid?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
      </label></span>
    <button class="go ${S.assigned?'on':''}" id="assign">${S.assigned?'Назначено':'Назначить'}</button>`;
}

/* ═══════════ НЕДЕЛЯ ═══════════ */
function renderWeek(){
  const w = week(), p = program(S.pid);
  const filled = w.days.filter(d=>exCount(d)>0).length;
  const nAll = w.days.reduce((x,d)=>x+exCount(d),0);
  $('#wk').innerHTML = `
    <div class="wkh">
      <span class="arr">
        <button id="prev" ${S.wk<2?'disabled':''} title="Прошлая неделя">←</button>
        <button id="next" ${S.wk>=p.weeks?'disabled':''} title="Следующая неделя">→</button>
      </span>
      <h2>Неделя ${S.wk} из ${p.weeks}</h2>
      <span class="m">${filled} ${plural(filled,'день','дня','дней')} · ${nAll} ${plural(nAll,'упражнение','упражнения','упражнений')}</span>
      <span class="sp"></span>
      <button class="act">Из шаблонов</button>
      <button class="act" id="copyprev" ${S.wk<2?'disabled':''}>Копия прошлой недели</button>
      <button class="act">Сохранить</button>
    </div>
    <div class="days">${w.days.map((d,i)=>{
      const n = exCount(d), rest = n === 0;
      const bars = loadBars(d), max = Math.max(1, ...bars);
      const dt = new Date(d.date+'T00:00:00');
      return `<button class="day ${i===S.day?'on':''} ${rest?'rest':''}" data-day="${i}">
        <span class="d">${dt.getDate()}<s>${DOWS[i]}</s></span>
        <span class="t">${esc(rest ? 'Отдых' : d.title)}</span>
        <span class="bars">${bars.map(v=>
          `<i style="height:${Math.round(v/max*100)}%"></i>`).join('') || '<i style="height:0"></i>'}</span>
        <span class="n">${rest ? '—' : `${n} упр · ${n*6} мин`}</span>
      </button>`}).join('')}</div>`;
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
    <span class="v">—</span>
    <span class="nm" contenteditable data-edit="${it.id}">${esc(it.raw||'')}</span>
    <button class="pick" data-pick="${it.id}">выбрать из базы</button>
    <button class="x" data-del="${it.id}">✕</button></div>`;
  return `<div class="line ${S.sel===it.id?'on':''}" data-item="${it.id}">
    <span class="v">${esc(presc(it))}</span>
    <span class="nm" contenteditable data-edit="${it.id}">${esc(ex.ru)}</span>
    <span class="en">${esc(ex.en)}</span>
    ${ex.pm ? `<button class="pct ${it.pct==null?'none':''}" data-pct="${it.id}">${
      it.pct!=null ? fmtN(it.pct)+'% от 1ПМ' : 'от ПМ'}</button>` : ''}
    <span class="tag">${esc(ex.g)}</span>
    <button class="x" data-del="${it.id}">✕</button></div>`;
}

function blockHTML(b){
  const chip = chipOf(b);
  return `<section class="blk" data-blk="${b.id}">
    <div class="bh">
      <input class="nm" value="${esc(b.title)}" data-f="title" data-blk="${b.id}"
             placeholder="Название блока">
      <span class="chip ${chip.acc?'acc':''}">${esc(chip.t)}</span>
      <span class="sp"></span>
      <button class="ta" data-dup="${b.id}">Дублировать</button>
      <button class="ta" data-delblk="${b.id}">✕</button>
    </div>
    <label class="bnote"><span class="k">Заметка</span>
      <input value="${esc(b.note||'')}" data-f="note" data-blk="${b.id}"
             placeholder="Увидит клиент над этим блоком"></label>
    ${b.items.map(lineHTML).join('')}
    <button class="addl" data-add="${b.id}">+ печатайте как в тетради — «Присед 5×3 80%»</button>
  </section>`;
}

function renderDoc(){
  const d = day(), dt = new Date(d.date+'T00:00:00');
  const n = exCount(d), t = tonnage(d);
  const idx = week().days.filter(x=>exCount(x)>0).indexOf(d) + 1;
  const total = week().days.filter(x=>exCount(x)>0).length;
  $('#doc').innerHTML = `
    <div class="dh">
      <span class="k">${DOWF[S.day]}, ${dt.getDate()} ${MONF[dt.getMonth()]}${
        idx ? ` · тренировка ${idx} из ${total}` : ''}</span>
      <div class="row">
        <h1><input id="dtitle" value="${esc(REST.has(d.title)?'':(d.title||''))}"
                   placeholder="Название тренировки"></h1>
        <button class="btn">В шаблоны</button>
        <button class="btn" id="clear">Очистить</button>
      </div>
      <div class="meta">
        <span>${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')}</span><s>·</s>
        <span>${n} ${plural(n,'упражнение','упражнения','упражнений')}</span><s>·</s>
        <span>~${n*6} минут</span>${t?`<s>·</s><span>тоннаж ${t.toLocaleString('ru-RU')} кг</span>`:''}
      </div>
    </div>
    <label class="wmsg"><span class="k">Заметка клиенту</span>
      <input id="wmsg" value="${esc(trainerMsg(d.date))}"
             placeholder="Клиент увидит это первым, до всех блоков"></label>
    ${d.blocks.map(blockHTML).join('')}
    <button class="addb" id="addblk">+ Добавить блок</button>`;
}

/* ═══════════ БИБЛИОТЕКА ═══════════ */
const inBlock = id => { const b = day().blocks.find(b=>b.items.some(i=>i.exId===id));
  return b ? b.title : null };
function renderLib(){
  const q = S.q.trim().toLowerCase();
  const hit = t => !q || String(t).toLowerCase().includes(q);
  let body = '';
  if(S.tab === 'ex'){
    const list = EX.filter(e=>hit(e.ru)||hit(e.en));
    body = [...new Set(list.map(e=>e.g))].map(g=>
      `<div class="grp">${esc(g)}</div>` +
      list.filter(e=>e.g===g).map(e=>{
        const inb = inBlock(e.id);
        const pm = e.pm && PM()[e.pm];
        return `<button class="exc ${inb?'in':''}" data-ex="${e.id}">
          <span class="b"><span class="nm">${esc(e.ru)}</span>
            <span class="en">${inb ? 'уже в блоке «'+esc(inb)+'»'
              : esc(e.eq) + (pm ? ' · 1ПМ ' + fmtN(pm) : '')}</span></span>
          <span class="pl">${inb ? '✓' : '+'}</span>
        </button>`}).join('')).join('');
  } else {
    const lvl = S.tab === 'blk' ? 'блок' : 'тренировка';
    const list = TPL.filter(t=>t.lvl===lvl && hit(t.title));
    body = list.map(t=>`<button class="exc" data-tpl="${t.id}">
      <span class="b"><span class="nm">${esc(t.title)}</span>
        <span class="en">${t.items ? t.items.length+' упражнений' : t.blocks.length+' блоков'} · ${t.used} раз</span></span>
      <span class="pl">+</span>
    </button>`).join('');
  }
  $('#libb').innerHTML = body || '<div class="empty">ничего не нашлось</div>';
  $$('#tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  $('#q').placeholder = S.tab==='ex' ? `Поиск среди ${EX.length}` : 'Поиск по шаблонам';
}

function render(){ renderTop(); renderWeek(); renderDoc(); renderLib() }

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const findItem = id => day().blocks.flatMap(b=>b.items).find(i=>i.id===id);
document.addEventListener('click', e=>{
  const t = e.target;
  const d = t.closest('[data-day]');
  if(d){ S.day = +d.dataset.day; S.sel = null; return render() }
  if(t.closest('#prev')){ S.wk--; S.day = 0; S.sel = null; return render() }
  if(t.closest('#next')){ S.wk++; S.day = 0; S.sel = null; return render() }
  if(t.closest('#assign')){ S.assigned = true; return renderTop() }
  if(t.closest('#clear')){ day().blocks = []; day().title = 'Отдых'; return render() }
  if(t.closest('#addblk')){
    day().blocks.push(mkBlock(null,'Новый блок','',null,[]));
    if(REST.has(day().title)) day().title = 'Тренировка';
    return render();
  }
  const tab = t.closest('[data-tab]');
  if(tab){ S.tab = tab.dataset.tab; return renderLib() }
  const dup = t.closest('[data-dup]');
  if(dup){ const b = day().blocks.find(x=>x.id===dup.dataset.dup);
    const copy = mkBlock(null, b.title, b.note, b.fmt,
      b.items.filter(i=>i.exId).map(i=>[i.exId, i.scheme, i.pct, i.unit, i.val]));
    day().blocks.splice(day().blocks.indexOf(b)+1, 0, copy); return render() }
  const del = t.closest('[data-del]');
  if(del){ day().blocks.forEach(b=>b.items = b.items.filter(i=>i.id!==del.dataset.del));
    return render() }
  const dblk = t.closest('[data-delblk]');
  if(dblk){ day().blocks = day().blocks.filter(b=>b.id!==dblk.dataset.delblk); return render() }
  /* Проценты по кругу: 60 → 70 → 80 → 90 → без процента. Тренер
     думает шагами по десять, отдельное поле для этого избыточно. */
  const pct = t.closest('[data-pct]');
  if(pct){ const it = findItem(pct.dataset.pct);
    it.pct = it.pct == null ? 60 : it.pct >= 90 ? null : it.pct + 10; return render() }
  const add = t.closest('[data-add]');
  if(add) return openInput(add);
  const exb = t.closest('[data-ex]');
  if(exb){ addExercise(exb.dataset.ex); return render() }
  const tpl = t.closest('[data-tpl]');
  if(tpl){ const x = TPL.find(z=>z.id===tpl.dataset.tpl);
    if(x.items) day().blocks.push(mkBlock(null, x.title, '', x.fmt||null, x.items));
    else { day().blocks = x.blocks.map(id=>{ const b = TPL.find(z=>z.id===id);
             return mkBlock(null, b.title, '', b.fmt||null, b.items) });
           day().title = x.title }
    if(REST.has(day().title)) day().title = 'Тренировка';
    return render() }
  const line = t.closest('.line');
  if(line && !t.closest('button')){ S.sel = line.dataset.item; render() }
});

/* Свободный ввод — главный путь. Нераспознанное остаётся текстом:
   это предусмотренное состояние работы, а не ошибка. */
function openInput(btn){
  const bid = btn.dataset.add;
  btn.innerHTML = '<input placeholder="Присед 5×3 80%">';
  const inp = btn.querySelector('input'); inp.focus();
  const commit = () => {
    const txt = inp.value.trim();
    if(txt){ const b = day().blocks.find(x=>x.id===bid); const p = parseLine(txt);
      b.items.push(p ? mkItem(p.exId, p.scheme||'', p.pct??null, p.unit||null, p.val||'')
                     : rawItem(txt)) }
    render();
  };
  inp.addEventListener('keydown', ev=>{ if(ev.key==='Enter') commit();
    if(ev.key==='Escape') render() });
  inp.addEventListener('blur', commit);
}
function addExercise(exId){
  const d = day();
  if(!d.blocks.length){ d.blocks.push(mkBlock(null,'Новый блок','',null,[]));
                        if(REST.has(d.title)) d.title = 'Тренировка' }
  d.blocks[d.blocks.length-1].items.push(mkItem(exId, ''));
}

document.addEventListener('blur', e=>{
  const ed = e.target.closest?.('[data-edit]');
  if(!ed) return;
  const it = findItem(ed.dataset.edit); if(!it) return;
  const p = parseLine(ed.textContent);
  if(p){ it.exId = p.exId; it.raw = null; it.scheme = p.scheme || it.scheme;
         if(p.pct!=null) it.pct = p.pct }
  else { it.exId = null; it.raw = ed.textContent.trim() }
  render();
}, true);

document.addEventListener('change', e=>{
  if(e.target.id === 'cli'){ S.cid = e.target.value; render() }
});
document.addEventListener('input', e=>{
  const t = e.target;
  if(t.id === 'q'){ S.q = t.value; return renderLib() }
  if(t.id === 'dtitle'){ day().title = t.value.trim() || 'Тренировка'; return renderWeek() }
  if(t.id === 'wmsg') return setTrainerMsg(day().date, t.value);
  const f = t.dataset.f;
  if(f){ const b = day().blocks.find(x=>x.id===t.dataset.blk); if(b) b[f] = t.value }
});

renderNav(); render();
