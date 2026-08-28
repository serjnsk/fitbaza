/* ═══════════════════════════════════════════════════════════════
   ТЁПЛЫЙ · конструктор тренера — поведение

   Третий остров. Общего с первым и вторым вариантами нет ничего,
   кроме доменной модели, и та лежит здесь копией: правка в одном
   варианте не должна доезжать до другого.

   Работает: переключение дней, свободный ввод строки с разбором
   («Присед 5×3 80%»), правка и удаление строк, добавление и
   дублирование блоков, добавление из библиотеки, поиск, смена
   клиента с пересчётом процентов в килограммы, назначение.
   ═══════════════════════════════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const DOWS = ['пн','вт','ср','чт','пт','сб','вс'];
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
/* В карточке дня помещается пара слов, поэтому от названия оставляем
   то, что его отличает: часть после разделителя («Сила · становая +
   гимнастика» → «становая + гимнастика») или без общего первого слова
   («Длинное кардио» → «кардио»). Аббревиатуры не трогаем: «ТА + метком»
   без «ТА» перестаёт быть собой. Сокращение только для показа —
   в документе и у клиента название остаётся полным. */
function shortTitle(t){
  const s = String(t||'').trim();
  if(s.includes(' · ')) return low(s.split(' · ').pop());
  const w = s.split(/\s+/);
  if(w.length > 1 && w[0].length > 3 && w[0] !== w[0].toUpperCase())
    return low(w.slice(1).join(' '));
  return s;
}
const low = s => s.charAt(0).toLowerCase() + s.slice(1);
/* Подпись блока: чем он меряется. Формат, круги суперсета или счёт
   упражнений. Отдельной сущности «тип блока» в модели нет и заводить
   её ради ярлыка не нужно — она разойдётся с тем, что тренер написал. */
function measure(b){
  const f = findFmt(b.title);
  if(f) return f.k ? f.k.toLowerCase() : 'комплекс';
  if(b.items.some(i=>i.pct!=null)){
    const n = Math.max(...b.items.map(i=>buildSets(i, PM()).length));
    return `сила · ${n} ${plural(n,'подход','подхода','подходов')}`;
  }
  const m = b.title.match(/×\s*(\d+)/);
  if(m) return `суперсет · ${m[1]} ${plural(+m[1],'круг','круга','кругов')}`;
  return `${b.items.length} ${plural(b.items.length,'упр','упр','упр')} · ~${b.items.length*3} мин`;
}

/* ═══════════ РЕЛЬС И ШАПКА ═══════════ */
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
const RAIL = [{i:'dash',n:'Дашборд'},{i:'cli',n:'Клиенты'},{i:'bld',n:'Конструктор',on:1},
              {i:'base',n:'База упражнений'},{i:'tpl',n:'Шаблоны'}];
function renderRail(){
  $('#rail').innerHTML = `<div class="lg">f</div>` +
    RAIL.map(x=>`<a href="#" class="${x.on?'on':''}" title="${esc(x.n)}">${svg(x.i)}</a>`).join('') +
    `<span class="me">${esc(TRAINER.ini)}</span>`;
}
function renderTop(){
  const p = program(S.pid);
  $('#top').innerHTML = `
    <button class="back" title="Назад">←</button>
    <span class="crumb">${esc(p.title)} · неделя ${S.wk} из ${p.weeks}</span>
    <span class="sp"></span>
    <span class="who"><i>${esc(client(S.cid).ini)}</i>
      <select id="cli">${CLIENTS.map(c=>
        `<option value="${c.id}" ${c.id===S.cid?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
    </span>
    <button class="btn">Сохранить</button>
    <button class="btn acc" id="assign">${S.assigned?'Назначено':'Назначить'}</button>`;
}

/* ═══════════ ДОКУМЕНТ ═══════════ */
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
    <span class="b"><span class="nm" contenteditable data-edit="${it.id}">${esc(it.raw||'')}</span></span>
    <button class="pick" data-pick="${it.id}">выбрать из базы</button>
    <button class="x" data-del="${it.id}">✕</button></div>`;
  const kg = workKg(it, PM());
  const sets = buildSets(it, PM());
  const scheme = [it.scheme, it.pct!=null ? '@ '+fmtN(it.pct)+'%' : '',
                  kg==null && it.val ? it.val+' '+it.unit : ''].filter(Boolean).join(' ');
  return `<div class="line ${S.sel===it.id?'on':''}" data-item="${it.id}">
      <span class="b">
        <span class="nm" contenteditable data-edit="${it.id}">${esc(ex.ru)}</span>
        <span class="en">${esc(ex.en)} · ${esc(ex.eq.toLowerCase())}</span>
      </span>
      ${scheme?`<span class="v">${esc(scheme)}</span>`:''}
      ${kg!=null?`<span class="kg">${fmtN(kg)} кг</span>`:''}
      <button class="x" data-del="${it.id}">✕</button>
    </div>` +
    /* Ряд карточек-подходов только там, где подход — самостоятельная
       единица: у силового упражнения с весом. У разминки «2 × 90 сек»
       две одинаковые карточки ничего не сообщают. */
    (sets.length>1 && kg!=null ? `<div class="sets">${sets.map((s,i)=>
      `<span class="s ${i===0?'past':i===1?'now':''}"><s>${i+1}</s>
        <em>${s.reps ?? '·'} × ${fmtN(s.kg)}</em></span>`).join('')}
      <button class="add" data-addset="${it.id}">+ подход</button></div>` : '');
}

function blockHTML(b){
  return `<section class="blk" data-blk="${b.id}">
    <div class="bh">
      <input class="nm" value="${esc(b.title)}" data-f="title" data-blk="${b.id}"
             placeholder="Название блока">
      <span class="chip ${b.items.some(i=>i.pct!=null)?'acc':''}">${esc(measure(b))}</span>
      <span class="sp"></span>
      <button class="dup" data-dup="${b.id}">Дублировать</button>
      <button class="x" data-delblk="${b.id}">✕</button>
    </div>
    <label class="bnote"><span>заметка</span>
      <input value="${esc(b.note||'')}" data-f="note" data-blk="${b.id}"
             placeholder="Увидит клиент над этим блоком"></label>
    ${b.items.map(lineHTML).join('')}
    <button class="addl" data-add="${b.id}">+ Упражнение — печатайте как в тетради: «Присед 5×3 80%»</button>
  </section>`;
}

function renderDoc(){
  const w = week(), d = day(), dt = new Date(d.date+'T00:00:00');
  const n = exCount(d);
  $('#h1').innerHTML = `<input id="dtitle" value="${esc(REST.has(d.title)?'':(d.title||''))}"
    placeholder="${DOWF[S.day]}, ${dt.getDate()} ${MONF[dt.getMonth()]}">`;
  $('#sub').innerHTML = [
    `${DOWF[S.day]}, ${dt.getDate()} ${MONF[dt.getMonth()]}`,
    `${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')}`,
    `${n} ${plural(n,'упражнение','упражнения','упражнений')}`,
    `~${n*6} минут`
  ].join('<s>·</s>');
  $('#days').innerHTML = w.days.map((x,i)=>{
    const rest = exCount(x)===0;
    const dt = new Date(x.date+'T00:00:00');
    const dots = rest ? 0 : x.blocks.length;
    return `<button class="day ${i===S.day?'on':''} ${rest?'rest':''}" data-day="${i}">
      <span class="h"><b>${dt.getDate()}</b>
        <s>${DOWS[i]}${i===S.day&&!rest?' · сегодня':''}</s></span>
      <span class="t">${esc(rest ? 'отдых' : shortTitle(x.title))}</span>
      <span class="dots">${'<i></i>'.repeat(dots)}</span>
      <span class="ln"></span>
    </button>`;
  }).join('');
  $('#doc').innerHTML =
    `<div class="wmsg"><i>”</i><span class="b">
       <span class="k">Сообщение ${esc(client(S.cid).n.split(' ')[0])}у</span>
       <input id="wmsg" value="${esc(trainerMsg(d.date))}"
              placeholder="Клиент увидит это первым, до всех блоков"></span></div>` +
    d.blocks.map(blockHTML).join('') +
    `<button class="addb" id="addblk">+ Добавить блок</button>`;
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
          <span class="nm">${esc(e.ru)}</span>
          <span class="en">${inb ? 'уже в блоке «'+esc(inb)+'»'
            : esc(e.eq) + (pm ? ' · 1ПМ ' + fmtN(pm) : '')}</span>
        </button>`}).join('')).join('');
  } else {
    const lvl = S.tab === 'blk' ? 'блок' : 'тренировка';
    const list = TPL.filter(t=>t.lvl===lvl && hit(t.title));
    body = list.map(t=>`<button class="exc" data-tpl="${t.id}">
      <span class="nm">${esc(t.title)}</span>
      <span class="en">${t.items ? t.items.length+' упр' : t.blocks.length+' блоков'} · ${t.used} раз</span>
    </button>`).join('');
  }
  $('#libb').innerHTML = body || '<div class="empty">Ничего не нашлось</div>';
  $$('#tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  $('#q').placeholder = S.tab==='ex' ? `Поиск среди ${EX.length}` : 'Поиск по шаблонам';
}

function render(){ renderTop(); renderDoc(); renderLib() }

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const findItem = id => day().blocks.flatMap(b=>b.items).find(i=>i.id===id);
document.addEventListener('click', e=>{
  const t = e.target;
  const d = t.closest('[data-day]');
  if(d){ S.day = +d.dataset.day; S.sel = null; return render() }
  if(t.closest('#assign')){ S.assigned = true; return renderTop() }
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
  /* «+ подход» дописывает круг к схеме: 5×3 становится 6×3. Схема —
     это и есть подходы, отдельного списка держать не нужно. */
  const as = t.closest('[data-addset]');
  if(as){ const it = findItem(as.dataset.addset);
    const m = (it.scheme||'').match(/^(\d+)\s*×\s*(\d+)$/);
    it.scheme = m ? `${+m[1]+1}×${m[2]}` : (it.scheme||'2×1');
    return render() }
  const add = t.closest('[data-add]');
  if(add) return openInput(add);
  const exb = t.closest('[data-ex]');
  if(exb) { addExercise(exb.dataset.ex); return render() }
  const tpl = t.closest('[data-tpl]');
  if(tpl){ const x = TPL.find(z=>z.id===tpl.dataset.tpl);
    if(x.items) day().blocks.push(mkBlock(null, x.title, '', x.fmt||null, x.items));
    else { day().blocks = x.blocks.map(id=>{ const b = TPL.find(z=>z.id===id);
             return mkBlock(null, b.title, '', b.fmt||null, b.items) });
           day().title = x.title }
    if(REST.has(day().title)) day().title = 'Тренировка';
    return render() }
  const line = t.closest('.line');
  if(line && !t.closest('button')) { S.sel = line.dataset.item; render() }
});

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
  if(t.id === 'dtitle'){ day().title = t.value.trim() || 'Тренировка';
    return $('#days').querySelector('.day.on').textContent = `${DOWS[S.day]} · ${day().title}` }
  if(t.id === 'wmsg') return setTrainerMsg(day().date, t.value);
  const f = t.dataset.f;
  if(f){ const b = day().blocks.find(x=>x.id===t.dataset.blk); if(b) b[f] = t.value }
});

renderRail(); render();
