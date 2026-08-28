/* ═══════════════════════════════════════════════════════════════
   HWPO · клиент, «План дня» — поведение

   Свой рендер под свою вёрстку. Общего с другими вариантами нет
   ничего, кроме доменной модели, и та лежит здесь копией.

   Отметка идёт разделами: один большой круг на блок. Так работают
   по доске в зале — вычёркивают целый кусок, а не каждую строку.
   Отдельные строки тоже нажимаются, если хочется точнее, и когда
   отмечены все, круг блока закрывается сам.
   ═══════════════════════════════════════════════════════════════ */
if(location.search.includes('bare')) document.documentElement.classList.add('bare');

const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const mmss = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');

const CID='c1', PROG='p1';
const WEEK = Math.floor(daysBetween(program(PROG).start, TODAY)/7) + 1;
const W    = buildWeek(PROG, WEEK);
const DAY  = Math.max(0, W.days.findIndex(d=>d.date===TODAY));
const WD   = W.days[DAY];
const PM   = pmOf(CID);

const MODEL = WD.blocks.map((b,i)=>({
  n:i+1, title:b.title||'Блок', note:b.note, fmt:findFmt(b.title), open:true,
  items: b.items.filter(x=>x.exId||(x.raw||'').trim()).map(x=>{
    const ex = x.exId ? byId(x.exId) : null;
    const sets = ex ? buildSets(x, PM) : [];
    return {id:x.id, ex, raw:x.raw, item:x, sets, done:false};
  })
}));
let STARTED = false;
const blkDone = b => b.items.length && b.items.every(i=>i.done);

/* Задание строкой: сколько — потом что, вес бронзой в конце.
   Порядок как на доске: объём читается по левому краю. */
function prescHTML(it){
  if(!it.ex) return esc(it.raw||'');
  const s = it.sets[0] || {};
  const kg = s.kg;
  const head = it.sets.length > 1
    ? it.sets.length + '×' + (s.reps ?? (s.val ? s.val + ' ' + (s.unit||'') : ''))
    : (s.reps != null ? String(s.reps) : (s.val ? s.val + ' ' + (s.unit||'') : ''));
  const pct = it.item.pct != null ? ` @ ${fmtN(it.item.pct)}%` : '';
  return `${esc(head)} ${esc(it.ex.ru)}${pct}${kg!=null?` <em>${fmtN(kg)} кг</em>`:''}`;
}
/* Сколько подходов в блоке — заголовок карточки деталей. Берём
   максимум по упражнениям: блок делают кругами, и круг задаёт
   самое длинное упражнение в нём. */
function setsOf(b){
  const n = Math.max(1, ...b.items.map(i=>i.sets.length||1));
  return `${n} ${plural(n,'подход','подхода','подходов')}`;
}

function head(){
  /* В макете имя программы набрано через вертикальную черту:
     «СИЛА | КРОССФИТ». Плюс в капители читается как знак операции. */
  $('#pn').textContent = program(PROG).title.replace(/\s*\+\s*/,' | ');
  $('#wkt').innerHTML = `Неделя ${WEEK} · <b>${WEEK}/${program(PROG).weeks}</b>`;
  $('#dd').innerHTML = W.days.map((x,i)=>{
    const n = x.blocks.reduce((a,b)=>a+b.items.filter(y=>y.exId).length,0);
    return `<span class="d ${n?'':'rest'} ${i===DAY?'on':''}">
      <s>Д${i+1}</s><b>${n ? n : '☾'}</b></span>`;
  }).join('');
}

function render(){
  head();
  const m = (TALK.workout[talkKey(CID, WD.date)]||[]).find(x=>x.who==='trainer');
  $('#feed').innerHTML =
    (m ? `<div class="note"><span class="k">Заметка тренера</span>
        <p>${esc(m.text)}</p></div>` : '') +
    MODEL.map((b,i)=>`
      <section class="blk ${blkDone(b)?'done':''}" data-b="${i}">
        <div class="bh"><b>${esc(b.title)}</b>
          <button class="mark" data-mark="${i}">✓</button></div>
        <button class="tog" data-tog="${i}"><i>${b.open?'⌄':'›'}</i>
          ${b.open?'скрыть детали':'показать детали'}</button>
        ${b.open ? `<div class="card">
          <h3>${esc(setsOf(b))}</h3>
          ${b.items.map(it=>`<button class="ex ${it.done?'done':''}" data-it="${it.id}">
            ${prescHTML(it)}</button>`).join('')}
          ${b.fmt && b.fmt.rest ? `<div class="rest">Отдых ${mmss(b.fmt.rest)} между подходами</div>` : ''}
          <button class="more">Видео техники<s>›</s></button>
          ${b.note ? `<button class="more">Заметки тренера<s>›</s></button>` : ''}
        </div>` : ''}
      </section>`).join('');

  const done = MODEL.filter(blkDone).length, all = MODEL.length;
  const cta = $('#cta');
  cta.classList.toggle('done', done>=all);
  if(!STARTED)       cta.innerHTML = 'Начать тренировку';
  else if(done>=all) cta.innerHTML = 'Отправить тренеру <s>готово</s>';
  else               cta.innerHTML = `Продолжить <s>блок ${done+1} из ${all}</s>`;
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
$('#feed').addEventListener('click', e=>{
  const mk = e.target.closest('[data-mark]');
  if(mk){ const b = MODEL[+mk.dataset.mark]; const v = !blkDone(b);
    b.items.forEach(i=>i.done = v); STARTED = true; return render() }
  const tg = e.target.closest('[data-tog]');
  if(tg){ const b = MODEL[+tg.dataset.tog]; b.open = !b.open; return render() }
  const it = e.target.closest('[data-it]');
  if(it){ const x = MODEL.flatMap(b=>b.items).find(y=>y.id===it.dataset.it);
    x.done = !x.done; STARTED = true; return render() }
});
$('#cta').addEventListener('click', ()=>{
  if(!STARTED){ STARTED = true; return render() }
  const b = MODEL.find(x=>!blkDone(x)); if(!b) return;
  const it = b.items.find(i=>!i.done); if(it) it.done = true;
  render();
});

render();
