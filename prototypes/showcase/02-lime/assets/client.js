/* ═══════════════════════════════════════════════════════════════
   ЛАЙМ · клиент, «План дня» — поведение

   Свой рендер, не общий с другими вариантами: разметку диктует
   макет этой стилистики, и подгонять её под чужой каркас значило бы
   снова связать варианты между собой.

   Данные общие только по смыслу — та же среда 26 августа программы
   «Сила + кроссфит», тот же атлет. Модель лежит в assets/data.js
   отдельной копией: домен один, но правка в одном варианте не должна
   доезжать до другого.
   ═══════════════════════════════════════════════════════════════ */
if(location.search.includes('bare')) document.documentElement.classList.add('bare');

const $  = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const DOWS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');

const CID='c1', PROG='p1';
const WEEK = Math.floor(daysBetween(program(PROG).start, TODAY)/7) + 1;
const W    = buildWeek(PROG, WEEK);
const DAY  = Math.max(0, W.days.findIndex(d=>d.date===TODAY));
const WD   = W.days[DAY];
const PM   = pmOf(CID);

/* ─── журнал ───
   Экран показывает план, но отмечать по нему можно: у каждой единицы
   работы своё состояние. Единица — либо подход силового упражнения,
   либо упражнение целиком, если подход у него один. */
const MODEL = WD.blocks.map((b,bi)=>{
  const items = b.items.filter(i=>i.exId || (i.raw||'').trim()).map(i=>{
    const ex = i.exId ? byId(i.exId) : null;
    const sets = ex ? buildSets(i, PM) : [];
    /* Ряд пилюль-подходов появляется только там, где подход —
       самостоятельная единица работы: у силового упражнения с весом.
       «Суставная разминка 2 × 90 сек» — одна строка, её отмечают
       целиком, разбивать её на два «90» бессмысленно. */
    return {id:i.id, ex, raw:i.raw, sets:sets.map(s=>({...s, done:false})),
            multi: sets.length>1 && sets[0].kg != null, done:false};
  });
  return {id:b.id, n:bi+1, title:b.title||'Блок', note:b.note, fmt:findFmt(b.title),
          items, fold:false};
});
let STARTED = false;

/* Тип блока не хранится в модели — мы его туда сознательно не добавляли.
   Здесь он выводится из содержимого: проценты от ПМ значат силовую
   работу, формат («EMOM 12») — метком, название разминки — разогрев.
   Выведенное не нужно поддерживать руками и оно не может разойтись
   с тем, что тренер реально написал. */
function tagOf(b){
  if(/размин|разогр/i.test(b.title)) return 'РАЗОГРЕВ';
  if(/заминк|растяж|мобил/i.test(b.title)) return 'ЗАМИНКА';
  if(b.fmt) return b.fmt.k || 'КОМПЛЕКС';
  if(b.items.some(i=>i.ex && i.ex.pm && i.sets.length>1)) return 'СИЛА';
  return null;
}
/* Значение упражнения строкой: то, что тренер назначил, уже
   пересчитанное в килограммы (проценты клиент не видит). */
function valOf(it){
  if(!it.ex) return '';
  const s = it.sets[0] || {};
  const unit = s.kg != null ? '' : (s.unit || '');
  const one  = s.reps != null ? String(s.reps)
             : (s.val ? s.val + (unit ? ' ' + unit : '') : '');
  let out = it.sets.length > 1 && one ? it.sets.length + ' × ' + one : one;
  if(s.kg != null) out += (out ? ' · ' : '') + fmtN(s.kg) + ' кг';
  return out.trim();
}
const units = () => MODEL.flatMap(b => b.items.flatMap(it =>
  it.multi ? it.sets.map(s=>({b, it, s})) : [{b, it, s:null}]));
const isDone = u => u.s ? u.s.done : u.it.done;
const left   = () => units().filter(u=>!isDone(u));
const total  = () => units().length;
const doneN  = () => units().filter(isDone).length;

/* ═══════════ ОТРИСОВКА ═══════════ */
const CHK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';

function head(){
  const d = new Date(WD.date+'T00:00:00');
  $('#meta').textContent = `${DOWS[DAY]} · ${d.getDate()} ${MON[d.getMonth()]} · неделя ${WEEK}`;
  $('#title').textContent = WD.title;
  const n = MODEL.reduce((a,b)=>a+b.items.length,0);
  /* Минуты — оценка по упражнениям, а не по подходам: подходов 30,
     и умножение давало полтора часа сверху. Пять с небольшим минут
     на упражнение — то, что реально уходит вместе с отдыхом. */
  const mins = Math.round(n * 5.4);
  $('#chips').innerHTML =
    `<span class="chip on">${MODEL.length} ${plural(MODEL.length,'блок','блока','блоков')}</span>
     <span class="chip">${n} упр</span>
     <span class="chip">~${mins} мин</span>`;
}

function blockHTML(b){
  const tag = tagOf(b);
  const cur = current();
  const on  = !!(cur && cur.b === b);
  const allDone = b.items.length && b.items.every(it => it.multi
    ? it.sets.every(s=>s.done) : it.done);
  const fold = b.fold;
  return `<section class="blk${on?' on':''}${fold?' fold':''}" data-b="${b.id}">
    <div class="bh" data-fold="${b.id}">
      <span class="no">${b.n}</span>
      <b>${esc(b.title)}</b>
      ${fold ? `<span class="cnt">${b.items.length} упр</span>`
             : (tag ? `<span class="tag">${esc(tag)}</span>` : '')}
      ${allDone && !fold ? '<span class="cnt">готово</span>' : ''}
    </div>
    ${(b.fmt || b.note) && !fold ? `<div class="mode">
      ${b.fmt ? `<span class="k">${esc(b.fmt.k||'формат')}</span>
                 <span class="v">${esc(b.title.match(/[\d:×xх\s]+$/)?.[0]?.trim() || '')}</span>` : ''}
      ${b.fmt && b.note ? '<span class="sep"></span>' : ''}
      ${b.note ? `<span class="t">${esc(b.note)}</span>` : ''}
    </div>` : ''}
    ${fold ? '' : `<div class="rows">${b.items.map(itemHTML).join('')}</div>`}
  </section>`;
}

function itemHTML(it){
  if(!it.ex) return `<div class="row"><span class="chk"></span>
    <span class="nm">${esc(it.raw||'')}</span></div>`;
  const row = `<button class="row${it.done?' done':''}" data-it="${it.id}">
      <span class="chk">${CHK}</span>
      <span class="nm">${esc(it.ex.ru)}</span>
      <span class="val">${esc(valOf(it))}</span>
    </button>`;
  if(!it.multi) return row;
  /* Упражнение с подходами живёт на своей подложке: ряд пилюль под ним
     нужно читать как продолжение строки, а не как соседнюю сущность. */
  const cur = current();
  return `<div class="ex">${row}
    <div class="sets">${it.sets.map((s,i)=>
      `<button data-set="${it.id}:${i}"
        class="${s.done?'done':''}${cur&&cur.s===s?' now':''}">${s.reps ?? (s.val||'·')}</button>`
    ).join('')}</div>
  </div>`;
}

function current(){
  if(!STARTED) return null;
  return left()[0] || null;
}

function render(){
  head();
  $('#feed').innerHTML = coachHTML() + MODEL.map(blockHTML).join('');
  const n = doneN(), t = total();
  const cta = $('#cta');
  if(!STARTED)      cta.innerHTML = '<span class="g">▶</span> Начать тренировку';
  else if(n >= t) { cta.innerHTML = '<span class="g">✓</span> Завершить и отправить';
                    cta.classList.add('done') }
  else              cta.innerHTML = `<span class="g">✓</span> Выполнено — далее`;
}

function coachHTML(){
  const msg = (TALK.workout[talkKey(CID, WD.date)]||[]).find(m=>m.who==='trainer');
  if(!msg) return '';
  return `<div class="coach">
    <div class="h">
      <span class="av">${esc(TRAINER.ini)}</span>
      <span class="k">сообщение тренера</span>
      <span class="n">${esc(TRAINER.n)}</span>
    </div>
    <p>${esc(msg.text)}</p>
  </div>`;
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
$('#feed').addEventListener('click', e=>{
  const set = e.target.closest('[data-set]');
  if(set){ const [id,i] = set.dataset.set.split(':');
           const it = find(id); it.sets[+i].done = !it.sets[+i].done;
           it.done = it.sets.every(s=>s.done); STARTED = true; return render() }
  const row = e.target.closest('[data-it]');
  if(row){ const it = find(row.dataset.it);
           it.done = !it.done; it.sets.forEach(s=>s.done = it.done);
           STARTED = true; return render() }
  const fold = e.target.closest('[data-fold]');
  if(fold){ const b = MODEL.find(x=>x.id===fold.dataset.fold); b.fold = !b.fold; return render() }
});
const find = id => MODEL.flatMap(b=>b.items).find(i=>i.id===id);

/* Кнопка ведёт по работе шаг за шагом: пока не начал — «начать»,
   дальше отмечает текущую единицу и переходит к следующей. */
$('#cta').addEventListener('click', ()=>{
  if(!STARTED){ STARTED = true; return render() }
  const u = current();
  if(!u) return;
  if(u.s){ u.s.done = true; u.it.done = u.it.sets.every(s=>s.done) }
  else u.it.done = true;
  render();
});

render();

/* ─── реплика клиента ко всей тренировке (COM-1) ───
   В макете на этом месте «⌕ — поиск/видео»: глобального поиска на
   экране тренировки у нас нет, а видео привязано к упражнению, не
   ко дню. Место отдано тому, что в требованиях есть.

   Поле разворачивается прямо в нижней панели: ради одной строки
   поднимать шторку и закрывать ей план — лишнее движение. */
const myMsg = () => ((TALK.workout[talkKey(CID, WD.date)]||[])
  .find(m=>m.who==='client')||{}).text || '';
function setMyMsg(text){
  const k = talkKey(CID, WD.date);
  const arr = TALK.workout[k] || (TALK.workout[k] = []);
  const i = arr.findIndex(m=>m.who==='client'), t = (text||'').trim();
  if(!t){ if(i>=0) arr.splice(i,1); return }
  if(i>=0) arr[i].text = t; else arr.push({who:'client', text:t, at:'сейчас'});
}
const mark = () => $('#say').classList.toggle('has', !!myMsg());
$('#say').addEventListener('click', ()=>{
  const ft = $('#say').parentElement, prev = ft.innerHTML;
  ft.innerHTML = `<span class="say">
    <input id="sayin" placeholder="Что сказать тренеру?" value="${esc(myMsg())}">
    <button id="sayok" title="Отправить">↑</button></span>`;
  const inp = $('#sayin'); inp.focus();
  const done = () => { setMyMsg(inp.value); ft.innerHTML = prev; mark() };
  $('#sayok').addEventListener('click', done);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter') done() });
});
mark();
