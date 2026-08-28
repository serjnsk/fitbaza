/* ═══════════════════════════════════════════════════════════════
   ФИОЛЕТОВЫЙ · конструктор тренера — поведение

   Свой рендер под свою вёрстку. Общего с другими вариантами нет
   ничего, кроме доменной модели, и та лежит здесь копией.

   Работает: переключение дней и недель, свободный ввод строки
   с разбором («Присед 5×3 80%»), правка и удаление строк, проценты
   по кругу, добавление блоков и шаблонов, добавление из библиотеки,
   поиск, смена клиента с пересчётом процентов в килограммы,
   назначение недели.
   ═══════════════════════════════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const pad2 = n => String(n).padStart(2,'0');
const DOWS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const MON  = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
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
/* Ярлык блока выводится из содержимого, а не хранится: сущности
   «тип блока» в модели нет, и заводить её ради подписи не нужно —
   она разойдётся с тем, что тренер написал. */
function tagOf(b){
  if(/размин|разогр/i.test(b.title)) return {t:'разогрев'};
  if(/заминк|растяж/i.test(b.title)) return {t:'заминка'};
  const f = findFmt(b.title); if(f) return {t:f.k || 'комплекс'};
  if(b.items.some(i=>i.pct!=null)) return {t:'сила · % от 1ПМ', acc:true};
  return null;
}

/* ═══════════ РЕЛЬС И ТОПБАР ═══════════ */
/* Иконки тонкие и линейные — под язык листа: заливок в этой стилистике
   нет нигде, кроме акцентных плашек, и рельс не должен быть исключением.
   Каждая рисует то, что за ней стоит, а не абстрактный значок. */
const ICO = {
  dash:'<path d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z"/>',
  cli :'<circle cx="10" cy="6.5" r="3.2"/><path d="M4 17c0-3.3 2.7-5 6-5s6 1.7 6 5"/>',
  prog:'<path d="M10 2.5 17.5 6 10 9.5 2.5 6z"/><path d="M2.5 10 10 13.5 17.5 10"/><path d="M2.5 14 10 17.5 17.5 14"/>',
  bld :'<path d="M3 6h5M12 6h5M3 14h9M16 14h1"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="14" r="2"/>',
  base:'<path d="M4 8v4M16 8v4M6.5 6v8M13.5 6v8M6.5 10h7"/>',
  tpl :'<path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h3.4l1.4 2h7.2A1.5 1.5 0 0 1 17.5 7.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5z"/>',
};
const RAIL = [{n:'Дашб',i:'dash'},{n:'Клиен',i:'cli'},{n:'Прогр',i:'prog'},
              {n:'Констр',i:'bld',on:1},{n:'База',i:'base'},{n:'Шабл',i:'tpl'}];
function renderRail(){
  $('#rail').innerHTML = `<div class="lg">fb</div>` +
    RAIL.map(x=>`<a href="#" class="${x.on?'on':''}" title="${esc(x.n)}">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round">${ICO[x.i]}</svg>
      <s>${esc(x.n)}</s></a>`).join('') +
    `<span class="me">${esc(TRAINER.ini)}</span>`;
}
function renderTop(){
  const p = program(S.pid);
  $('#top').innerHTML = `
    <nav class="crumb"><span>programs</span><s>/</s>
      <span>${esc(p.title.toLowerCase().replace(/\s+\+\s+/,'+'))}</span><s>/</s>
      <b>w${pad2(S.wk)}</b></nav>
    <span class="stt ${S.assigned?'on':''}">${S.assigned?'назначено':'черновик'}</span>
    <span class="sp"></span>
    <span class="forw"><span>веса для</span>
      <label><i>${esc(client(S.cid).ini)}</i>
        <select id="cli">${CLIENTS.map(c=>
          `<option value="${c.id}" ${c.id===S.cid?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
      </label></span>
    <button class="btn">⌘S Сохранить</button>
    <button class="btn acc" id="assign">Назначить →</button>`;
}

/* ═══════════ НЕДЕЛЯ ═══════════ */
function renderWeek(){
  const w = week(), p = program(S.pid);
  const a = new Date(w.days[0].date+'T00:00:00'), b = new Date(w.days[6].date+'T00:00:00');
  const filled = w.days.filter(d=>exCount(d)>0).length;
  const nAll = w.days.reduce((x,d)=>x+exCount(d),0);
  $('#wkh').innerHTML = `
    <h2>Неделя ${pad2(S.wk)}</h2>
    <span class="m">из ${pad2(p.weeks)} · ${a.getDate()}–${b.getDate()} ${MON[b.getMonth()]}
      · ${filled} ${plural(filled,'день','дня','дней')} · ${nAll} упр</span>
    <span class="sp"></span>
    <button class="act" id="prev" ${S.wk<2?'disabled':''}>← пред</button>
    <button class="act" id="next" ${S.wk>=p.weeks?'disabled':''}>след →</button>
    <button class="act" id="copyprev" ${S.wk<2?'disabled':''}>копия w${pad2(S.wk-1)}</button>
    <button class="act">из шаблона</button>`;
  $('#days').innerHTML = w.days.map((d,i)=>{
    const n = exCount(d), rest = n === 0;
    const dt = new Date(d.date+'T00:00:00');
    return `<button class="day ${i===S.day?'on':''} ${rest?'rest':''}" data-day="${i}">
      <span class="d">${DOWS[i]} · ${dt.getDate()}</span>
      <span class="t">${esc(rest ? 'Отдых' : d.title)}</span>
      ${rest ? '' : `<span class="k">${d.blocks.length} бл · ${n} упр</span>`}
    </button>`;
  }).join('');
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
    <span class="nm" contenteditable data-edit="${it.id}">${esc(it.raw||'')}</span>
    <button class="pick" data-pick="${it.id}">выбрать из базы</button>
    <button class="x" data-del="${it.id}">✕</button></div>`;
  const kg = workKg(it, PM());
  const v = [it.scheme, kg!=null ? '= '+fmtN(kg)+' кг' : (it.val ? it.val+' '+it.unit : '')]
    .filter(Boolean).join(' · ');
  return `<div class="line ${S.sel===it.id?'on':''}" data-item="${it.id}">
    <span class="nm" contenteditable data-edit="${it.id}">${esc(ex.ru)}</span>
    <span class="en">${esc(ex.en)} · ${esc(ex.eq.toLowerCase())}</span>
    ${ex.pm ? `<button class="pct ${it.pct==null?'none':''}" data-pct="${it.id}">${
      it.pct!=null ? fmtN(it.pct)+'%' : 'от ПМ'}</button>` : ''}
    <span class="v">${esc(v)}</span>
    <button class="x" data-del="${it.id}">✕</button></div>`;
}

function blockHTML(b, i){
  const tag = tagOf(b), f = findFmt(b.title);
  return `<section class="blk" data-blk="${b.id}" data-n="${pad2(i+1)}">
    <div class="bh">
      <input class="nm" value="${esc(b.title)}" data-f="title" data-blk="${b.id}"
             placeholder="Название блока">
      ${tag ? `<span class="tag ${tag.acc?'acc':''}">${esc(tag.t)}</span>` : ''}
      ${f && f.rest ? `<span class="rest">отдых ${Math.floor(f.rest/60)}:${pad2(f.rest%60)}</span>` : ''}
      <span class="sp"></span>
      <button class="ib" title="Сохранить в библиотеку">✧</button>
      <button class="ib" title="Дублировать" data-dup="${b.id}">⧉</button>
      <button class="ib" data-delblk="${b.id}" title="Удалить">✕</button>
    </div>
    <label class="bnote"><span>заметка:</span>
      <input value="${esc(b.note||'')}" data-f="note" data-blk="${b.id}"
             placeholder="увидит клиент над этим блоком"></label>
    ${b.items.map(lineHTML).join('')}
    <button class="addl" data-add="${b.id}">+ печатайте как в тетради — «Присед 5×3 80%»</button>
  </section>`;
}

function renderDoc(){
  const d = day(), dt = new Date(d.date+'T00:00:00');
  const n = exCount(d);
  $('#doc').innerHTML = `
    <div class="dh">
      <h1><input id="dtitle" value="${esc(REST.has(d.title)?'':(d.title||''))}"
                 placeholder="${DOWS[S.day]} · ${dt.getDate()} ${MON[dt.getMonth()]}"></h1>
      <div class="stats">
        <div class="stat"><b>${pad2(d.blocks.length)}</b><s>блоков</s></div>
        <div class="stat"><b>${pad2(n)}</b><s>упражн</s></div>
        <div class="stat"><b>~${n*6}<em>м</em></b><s>объём</s></div>
      </div>
    </div>
    <label class="wmsg"><span>клиенту</span>
      <input id="wmsg" value="${esc(trainerMsg(d.date))}"
             placeholder="Сообщение ко всей тренировке — клиент увидит его первым"></label>
    ${d.blocks.map(blockHTML).join('')}
    <button class="addb" id="addblk">+ Добавить блок</button>`;
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
    body = [...new Set(list.map(e=>e.g))].map(g=>{
      const items = list.filter(e=>e.g===g);
      return `<div class="grp"><b>${esc(g)}</b><s>${pad2(items.length)}</s></div>` +
        items.map(e=>`<button class="exc ${inDay(e.id)?'in':''}" data-ex="${e.id}">
          <i>${esc(initials(e))}</i>
          <span class="b"><span class="nm">${esc(e.ru)}</span>
            <span class="en">${esc(e.en)} · ${esc(e.eq.toLowerCase())}</span></span>
          ${inDay(e.id)?'<span class="chip">в плане</span>':''}</button>`).join('');
    }).join('');
  } else {
    const lvl = S.tab === 'blk' ? 'блок' : 'тренировка';
    const list = TPL.filter(t=>t.lvl===lvl && hit(t.title));
    body = list.map(t=>`<button class="exc" data-tpl="${t.id}">
      <i>${t.items ? pad2(t.items.length) : pad2(t.blocks.length)}</i>
      <span class="b"><span class="nm">${esc(t.title)}</span>
        <span class="en">${t.items ? 'упражнений' : 'блоков'} · ${t.used} раз</span></span>
    </button>`).join('');
  }
  $('#libb').innerHTML = body || '<div class="empty">ничего не нашлось</div>';
  $$('#tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  $('#q').placeholder = S.tab==='ex' ? `поиск по базе — ${EX.length}` : 'поиск по шаблонам';
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

/* Правка строки перечитывается тем же разбором, что и ввод: одна
   дорога вместо двух. */
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

renderRail(); render();
