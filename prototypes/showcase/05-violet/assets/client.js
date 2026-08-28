/* ═══════════════════════════════════════════════════════════════
   ФИОЛЕТОВЫЙ · клиент, «План тренировки» — поведение

   Свой рендер под свою вёрстку. Общего с другими вариантами нет
   ничего, кроме доменной модели, и та лежит здесь копией.

   Экран — документ: все блоки видны сразу, ничего не сворачивается.
   Отметка не двигает вёрстку, а меняет состояние строки: пройденное
   уходит в серый и зачёркивается, текущее держит акцентную планку
   на поле. Так план читается целиком и по нему же работают.
   ═══════════════════════════════════════════════════════════════ */
if(location.search.includes('bare')) document.documentElement.classList.add('bare');

const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20 ? c : y>1&&y<5 ? b : y===1 ? a : c };
const fmtN = v => String(v).replace('.',',');
const DOWS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const pad2 = n => String(n).padStart(2,'0');

const CID='c1', PROG='p1';
const WEEK = Math.floor(daysBetween(program(PROG).start, TODAY)/7) + 1;
const W    = buildWeek(PROG, WEEK);
const DAY  = Math.max(0, W.days.findIndex(d=>d.date===TODAY));
const WD   = W.days[DAY];
const PM   = pmOf(CID);

const MODEL = WD.blocks.map((b,i)=>({
  n:i+1, title:b.title||'Блок', note:b.note, fmt:findFmt(b.title),
  items: b.items.filter(x=>x.exId||(x.raw||'').trim()).map(x=>{
    const ex = x.exId ? byId(x.exId) : null;
    const sets = ex ? buildSets(x, PM) : [];
    return {id:x.id, ex, raw:x.raw, sets:sets.map(s=>({...s,done:false})),
            weighted: sets.length>1 && sets[0].kg != null, done:false};
  })
}));
let STARTED = false;

/* Ярлык блока выводится из содержимого, а не хранится: отдельной
   сущности «тип блока» в модели нет и заводить её ради подписи
   не нужно — она разойдётся с тем, что тренер написал. */
function tagOf(b){
  if(/размин|разогр/i.test(b.title)) return 'разогрев';
  if(/заминк|растяж/i.test(b.title)) return 'заминка';
  if(b.fmt) return b.fmt.k || 'комплекс';
  const pct = b.items.find(i=>i.sets[0] && i.sets[0].kg != null);
  if(pct) return 'сила';
  return null;
}
function valOf(it){
  const s = it.sets[0] || {};
  const one = s.reps != null ? String(s.reps)
            : (s.val ? s.val + (s.unit ? ' ' + s.unit : '') : '');
  const scheme = it.sets.length > 1 && one ? it.sets.length + ' × ' + one : one;
  return {v:scheme, kg: s.kg != null ? fmtN(s.kg) + ' кг' : ''};
}
const units = () => MODEL.flatMap(b=>b.items.flatMap(it =>
  it.weighted ? it.sets.map(s=>({it,s})) : [{it,s:null}]));
const isDone = u => u.s ? u.s.done : u.it.done;
const current = () => STARTED ? (units().find(u=>!isDone(u)) || null) : null;

function head(){
  const d = new Date(WD.date+'T00:00:00');
  const filled = W.days.filter(x=>x.blocks.some(b=>b.items.some(i=>i.exId))).length;
  $('#wk').innerHTML = `<span>W${pad2(WEEK)}</span>
    <span class="dots">${W.days.slice(0,5).map((x,i)=>{
      const has = x.blocks.some(b=>b.items.some(y=>y.exId));
      return `<i class="${has && i<=DAY ? 'on':''}"></i>`}).join('')}</span>
    <span>${DAY+1}/${filled}</span>`;
  $('#day').innerHTML = `<span>${DOWS[DAY]} · ${pad2(d.getDate())}.${pad2(d.getMonth()+1)}</span>
    <span class="now">сегодня</span>`;
  $('#title').textContent = WD.title;
  const n = MODEL.reduce((a,b)=>a+b.items.length,0);
  $('#sub').innerHTML = [`${MODEL.length} ${plural(MODEL.length,'блок','блока','блоков')}`,
    `${n} ${plural(n,'упражнение','упражнения','упражнений')}`,
    `~${Math.round(n*6)} мин`].join('<s>/</s>');
}

function render(){
  head();
  const m = (TALK.workout[talkKey(CID, WD.date)]||[]).find(x=>x.who==='trainer');
  const cur = current();
  $('#feed').innerHTML =
    (m ? `<div class="note"><i>${esc(TRAINER.ini)}</i><div>
        <span class="k">${esc(TRAINER.n.split(' ')[0])} · тренер</span>
        <p>${esc(m.text)}</p></div></div>` : '') +
    MODEL.map(b=>{
      const tag = tagOf(b);
      const on = cur && b.items.includes(cur.it);
      const rest = b.fmt && b.fmt.rest
        ? `отдых ${Math.floor(b.fmt.rest/60)}:${pad2(b.fmt.rest%60)}` : '';
      return `<section class="blk ${on?'on':''}" data-n="${pad2(b.n)}">
        <div class="bh"><b>${esc(b.title)}</b>
          ${tag?`<span class="tag">${esc(tag)}</span>`:''}
          <span class="m">${esc(rest || b.items.length+' упр')}</span></div>
        ${b.note?`<div class="bnote">заметка: ${esc(b.note)}</div>`:''}
        ${b.items.map(it=>{
          const {v,kg} = valOf(it);
          const isCur = cur && cur.it === it;
          return `<button class="row ${it.done?'done':''} ${isCur?'now':''}" data-it="${it.id}">
            <span class="b"><span class="nm">${esc(it.ex ? it.ex.ru : (it.raw||''))}</span>
              ${it.ex?`<span class="en">${esc(it.ex.en)} · ${esc(it.ex.eq.toLowerCase())}</span>`:''}</span>
            <span class="v">${esc(v)}${kg?`<em>${esc(kg)}</em>`:''}</span>
          </button>` +
          (it.weighted && !it.done ? `<div class="sets">${it.sets.map((s,i)=>{
            const nowSet = !s.done && it.sets.findIndex(z=>!z.done)===i && isCur;
            return `<button data-set="${it.id}:${i}"
              class="${s.done?'done':nowSet?'now':''}">${s.reps ?? '·'}</button>`}).join('')}</div>`:'');
        }).join('')}
      </section>`}).join('');

  const done = units().filter(isDone).length, all = units().length;
  const cta = $('#cta');
  cta.classList.toggle('done', done>=all);
  if(!STARTED)       cta.innerHTML = 'Начать тренировку';
  else if(done>=all) cta.innerHTML = 'Отправить тренеру <s>готово</s>';
  else               cta.innerHTML = `Выполнено — далее <s>${done}/${all}</s>`;
}

const find = id => MODEL.flatMap(b=>b.items).find(i=>i.id===id);
$('#feed').addEventListener('click', e=>{
  const set = e.target.closest('[data-set]');
  if(set){ const [id,i] = set.dataset.set.split(':'); const it = find(id);
    it.sets[+i].done = !it.sets[+i].done; it.done = it.sets.every(s=>s.done);
    STARTED = true; return render() }
  const row = e.target.closest('[data-it]');
  if(row){ const it = find(row.dataset.it);
    it.done = !it.done; it.sets.forEach(s=>s.done = it.done);
    STARTED = true; return render() }
});
$('#cta').addEventListener('click', ()=>{
  if(!STARTED){ STARTED = true; return render() }
  const u = current(); if(!u) return;
  if(u.s){ u.s.done = true; u.it.done = u.it.sets.every(s=>s.done) } else u.it.done = true;
  render();
});

render();
