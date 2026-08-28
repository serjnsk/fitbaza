/* ═══════════════════════════════════════════════════════════════
   ТЁПЛЫЙ · клиент, «План на день» — поведение

   Свой рендер под свою вёрстку. Общего с первым и вторым вариантами
   нет ничего, кроме доменной модели, и та лежит здесь копией.

   Устройство экрана отличается от соседей не только цветом: план —
   это список БЛОКОВ, а не всех упражнений сразу. Развёрнут ровно
   один, текущий, и он же единственный тёмный. Пройденные схлопнуты
   с галочкой, будущие ждут строкой. Так экран не растёт вниз
   на три прокрутки и всегда отвечает на один вопрос: что сейчас.
   ═══════════════════════════════════════════════════════════════ */
if(location.search.includes('bare')) document.documentElement.classList.add('bare');

const $ = s => document.querySelector(s);
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

const MODEL = WD.blocks.map((b,i)=>({
  id:b.id, n:i+1, title:b.title||'Блок', note:b.note, fmt:findFmt(b.title),
  items: b.items.filter(x=>x.exId||(x.raw||'').trim()).map(x=>{
    const ex = x.exId ? byId(x.exId) : null;
    const sets = ex ? buildSets(x, PM) : [];
    return {id:x.id, ex, raw:x.raw, sets:sets.map(s=>({...s,done:false})),
            weighted: sets.length>1 && sets[0].kg != null, done:false};
  })
}));
/* Открыт всегда ровно один блок — тот, до которого дошла работа.
   Отдельного «свернуть/развернуть» нет: состояние экрана следует
   за состоянием тренировки, а не за настроением пользователя. */
let OPEN = 0, STARTED = false;

const blkDone = b => b.items.length && b.items.every(it=>it.done);
const firstUndone = () => { const i = MODEL.findIndex(b=>!blkDone(b)); return i<0 ? MODEL.length-1 : i };

/* Подпись блока справа: чем он меряется. Формат («AMRAP»), число
   кругов суперсета или просто количество упражнений. */
function measure(b){
  if(b.fmt) return b.fmt.k || 'комплекс';
  const m = b.title.match(/×\s*(\d+)/);
  if(m) return 'суперсет ×' + m[1];
  return b.items.length + ' упр';
}
function valOf(it){
  if(!it.ex) return {v:'', kg:''};
  const s = it.sets[0] || {};
  /* Повторы есть не у всего: у разминки в подходе секунды, у гребли
     калории. Сначала собираем «сколько за подход», и только потом
     умножаем на число подходов — иначе «2 × 90 сек» схлопывалось в «2». */
  const one = s.reps != null ? String(s.reps)
            : (s.val ? s.val + (s.unit ? ' ' + s.unit : '') : '');
  const scheme = it.sets.length > 1 && one ? it.sets.length + '×' + one : one;
  return {v: scheme, kg: s.kg != null ? fmtN(s.kg)+' кг' : ''};
}

function head(){
  const d = new Date(WD.date+'T00:00:00');
  $('#meta').textContent = `${DOWS[DAY]} · ${d.getDate()} ${MON[d.getMonth()]} · неделя ${WEEK}`;
  $('#title').textContent = WD.title;
  const n = MODEL.reduce((a,b)=>a+b.items.length,0);
  $('#sub').textContent =
    `${MODEL.length} ${plural(MODEL.length,'блок','блока','блоков')} · ` +
    `${n} ${plural(n,'упражнение','упражнения','упражнений')} · ~${Math.round(n*6)} мин`;
}

function noteHTML(){
  const m = (TALK.workout[talkKey(CID, WD.date)]||[]).find(x=>x.who==='trainer');
  return m ? `<div class="note"><i>${esc(TRAINER.ini)}</i><p>${esc(m.text)}</p></div>` : '';
}

function blockHTML(b, i){
  if(i !== OPEN){
    const done = blkDone(b);
    return `<button class="blk ${done?'done':''}" data-open="${i}">
      <span class="mark">✓</span><b>${esc(b.title)}</b>
      <span class="m">${esc(done ? 'готово' : measure(b))}</span>
    </button>`;
  }
  const rest = b.fmt && b.fmt.rest
    ? ` · отдых ${Math.floor(b.fmt.rest/60)}:${String(b.fmt.rest%60).padStart(2,'0')}` : '';
  return `<section class="blk now">
    <div class="top">
      <span class="chip">сейчас</span>
      <span class="k">блок ${b.n} из ${MODEL.length} · ${esc(measure(b))}${rest}</span>
    </div>
    <b class="nm">${esc(b.title)}</b>
    <div class="rows">${b.items.map(it=>{
      const {v,kg} = valOf(it);
      return `<button class="row ${it.done?'done':''}" data-it="${it.id}">
        <span class="t">${esc(it.ex ? it.ex.ru : (it.raw||''))}</span>
        ${v?`<span class="v">${esc(v)}</span>`:''}
        ${kg?`<span class="kg">${esc(kg)}</span>`:''}
      </button>` +
      (it.weighted && !it.done ? `<div class="sets">${it.sets.map((s,k)=>{
        const nowSet = !s.done && it.sets.findIndex(z=>!z.done) === k;
        return `<button data-set="${it.id}:${k}" class="${s.done?'done':nowSet?'now':''}">
          <s>${k+1}</s><em>${s.reps ?? '·'}${s.kg!=null?'×'+fmtN(s.kg):''}</em></button>`;
      }).join('')}</div>` : '');
    }).join('')}</div>
  </section>`;
}

function render(){
  head();
  $('#feed').innerHTML = noteHTML() + MODEL.map(blockHTML).join('');
  const b = MODEL[OPEN];
  const allDone = MODEL.every(blkDone);
  const cta = $('#cta');
  cta.classList.toggle('done', allDone);
  if(allDone) cta.innerHTML = `<span class="l"><b>Отправить тренеру</b>
      <s>${MODEL.length} ${plural(MODEL.length,'блок','блока','блоков')} · готово</s></span><i>✓</i>`;
  else if(!STARTED) cta.innerHTML = `<span class="l"><b>Начать тренировку</b>
      <s>блок 1 · ${esc(MODEL[0].title)}</s></span><i>▶</i>`;
  else {
    const it = b.items.find(x=>!x.done);
    const k = it && it.weighted ? it.sets.findIndex(s=>!s.done) + 1 : 0;
    cta.innerHTML = `<span class="l"><b>Продолжить</b>
      <s>блок ${b.n}${k?` · подход ${k} из ${it.sets.length}`:''}</s></span><i>▶</i>`;
  }
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const find = id => MODEL.flatMap(b=>b.items).find(i=>i.id===id);
$('#feed').addEventListener('click', e=>{
  const set = e.target.closest('[data-set]');
  if(set){ const [id,k] = set.dataset.set.split(':'); const it = find(id);
    it.sets[+k].done = !it.sets[+k].done; it.done = it.sets.every(s=>s.done);
    STARTED = true; return step() }
  const row = e.target.closest('[data-it]');
  if(row){ const it = find(row.dataset.it);
    it.done = !it.done; it.sets.forEach(s=>s.done = it.done);
    STARTED = true; return step() }
  const op = e.target.closest('[data-open]');
  if(op){ OPEN = +op.dataset.open; STARTED = true; return render() }
});
/* Когда блок закончен, экран сам переходит к следующему: искать,
   куда нажать дальше, не нужно. */
function step(){ if(blkDone(MODEL[OPEN])) OPEN = firstUndone(); render() }

$('#cta').addEventListener('click', ()=>{
  if(!STARTED){ STARTED = true; OPEN = firstUndone(); return render() }
  const b = MODEL[OPEN];
  const it = b.items.find(x=>!x.done);
  if(!it) return;
  if(it.weighted){ const s = it.sets.find(z=>!z.done); if(s) s.done = true;
                   it.done = it.sets.every(z=>z.done) }
  else it.done = true;
  step();
});

render();
