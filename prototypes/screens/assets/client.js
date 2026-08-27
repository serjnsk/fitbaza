/* ============================================================
   Общая логика — одна на все стилистики. Тема меняет только
   цвет и типографику, поведение везде одинаковое: иначе
   сравнивать варианты бессмысленно, они разойдутся по сути.
   ============================================================ */
/* ════════════════════════════════════════════════════════════
   Экран клиента «Тренировка на сегодня»

   Берём ту же тренировку, что тренер собрал в конструкторе:
   программа p1, текущая неделя, среда. Данные общие — это важно,
   иначе экраны разойдутся и перестанут быть парой.

   Ключевое отличие от экрана тренера: клиент не видит процентов.
   Тренер пишет «70 %», система знает ПМ атлета и показывает
   килограммы (CON-16). Обратно в проценты клиент не заглядывает.
   ════════════════════════════════════════════════════════════ */
/* ?bare — режим чистого захвата: только телефон, без пояснительной панели.
   Нужен, чтобы в Figma приезжал один экран, а не страница с текстом. */
if(location.search.includes('bare')) document.documentElement.classList.add('bare');

/* ─── ТАЙМЕР (TMR-1…TMR-4) ───
   Заказчик вынес таймер за пределы MVP: в первой итерации его нет ни у
   клиента, ни в конструкторе. Код не удаляю — он вернётся сразу после
   выкатки, и переписывать разбор форматов заново незачем. Всё, что его
   касается, висит на этом флаге: TIMER = true возвращает таймер целиком.

   ВАЖНО: формат блока («EMOM 12») от таймера НЕ зависит и остаётся в MVP —
   он решает, как записывается результат: один на блок или по подходам
   (CLI-2). Убирать его вместе с таймером было бы ошибкой. */
const TIMER = false;

const CID = 'c1';
const PROG = 'p1';
const WEEK = Math.floor(daysBetween(program(PROG).start, TODAY)/7) + 1;
const DAY  = Math.max(0, buildWeek(PROG, WEEK).days.findIndex(d=>d.date===TODAY));
const W    = buildWeek(PROG, WEEK);
const WD    = W.days[DAY];
const PM   = pmOf(CID);
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
/* Иконка речи — одна на весь экран: у реплик, у кнопки комментария и
   у тренера в шапке. Стрелка там означала просто «дальше», а ведёт она
   в обсуждение тренировки — иконка говорит это прямо. */
const ICO_COM = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9.5a6.5 6.5 0 0 1-9.3 5.9L3 16.5l1.2-4.5A6.5 6.5 0 1 1 17 9.5z"/></svg>`;
const DOW = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

/* Упражнение — одна сущность, и выглядеть оно должно одинаково, в каком бы
   блоке ни стояло. Быстрый путь даёт галочка в шапке: отметил всё разом.

   Отдельно стоит только блок с форматом: там результат один на весь блок —
   время или раунды, а не построчно. Решает это САМ ФОРМАТ, который тренер
   написал явно («EMOM 12»), а не тип блока. Раньше здесь стояло
   KIND_MODE[b.kind], то есть поведение зависело от ярлыка «комплекс» —
   а ярлыка этого в требованиях нет: «разминка, силовой блок, комплекс,
   заминка» упоминаются только как примеры в определении блока и как
   названия папок в библиотеке шаблонов (TPL-1). */
const modeOf = b => !!fmtPart(b.title) ? 'rounds' : 'sets';

function buildSets(item){
  const kg = workKg(item, PM);
  const sc = item.scheme || '';
  let rounds = 1, reps = null;
  let m;
  if((m = sc.match(/^(\d+)\s*×\s*(\d+)$/))) { rounds = +m[1]; reps = +m[2] }
  else if((m = sc.match(/^(\d+)\s*×$/)))    { rounds = +m[1] }
  else if(/^\d+(-\d+)+$/.test(sc))          { const l = sc.split('-').map(Number);
                                              return l.map((r,i)=>({n:i+1, kg, reps:r, unit:'кг',
                                                val:item.val||null, done:false, actKg:null, actRep:null})) }
  else if(/^\d+$/.test(sc))                 { reps = +sc }
  const out = [];
  for(let i=0;i<Math.max(1,rounds);i++)
    out.push({n:i+1, kg, reps, unit: kg!=null?'кг':(item.unit||''),
              val: kg!=null?null:(item.val||null), done:false, actKg:null, actRep:null});
  return out;
}

const MODEL = WD.blocks.map(b=>({
  id:b.id, title:b.title, fmt:fmtPart(b.title), note:b.note,
  kind:b.kind, mode:modeOf(b),
  result:null,                       /* для комплекса — общий результат блока */
  /* Строки, которые парсер не разобрал, тоже доезжают до клиента. Раньше
     фильтр по exId их выбрасывал, и написанное тренером молча исчезало —
     против прямого правила: «нераспознанные строки остаются текстом».
     Человеку они понятны и без структуры: «растяжка по ощущениям 5 минут». */
  items:b.items
    .filter(i => i.exId || (i.raw||'').trim())
    .map(i => i.exId
      ? { id:i.id, ex:byId(i.exId), scheme:i.scheme, unit:i.unit, val:i.val,
          kg:workKg(i, PM), sets:buildSets(i), done:false, comment:null }
      : { id:i.id, raw:i.raw.trim(), sets:[], done:false, comment:null })
}));

/* «В прошлый раз» — это факт из журнала (CLI-2), а не назначение.
   Показывать план прошлой недели бессмысленно: он обычно совпадает
   с сегодняшним, и строка врёт про то, что человек реально поднял.
   Нет факта — нет строки: упражнение новое, сравнивать не с чем. */
function prevLine(it){
  const r = lastResult(CID, it.ex.id, TODAY, it.scheme);
  if(!r) return '';
  const what = r.kg!=null ? fmtN(r.kg)+' кг · '+r.scheme : r.done;
  return `<div class="prev">
    <span class="ic">↺</span>в прошлый раз <b>${esc(what)}</b>
    <i>${dm(r.date)}</i></div>`;
}

const fmtN = v => String(v).replace('.',',');
/* единица прогресса зависит от блока: подход, упражнение или комплекс целиком */
function units(){
  const out = [];
  MODEL.forEach(b=>{
    /* Упражнения считаются одинаково во всех блоках. У комплекса сверху
       добавляется ещё один шаг — записать общий результат. */
    b.items.forEach(it => it.sets.length
      ? it.sets.forEach(s=>out.push({b,it,s}))
      : out.push({b,it}));            /* текстовая строка — один шаг */
    if(b.mode === 'rounds') out.push({b});
  });
  return out;
}
const isDone = u => u.s ? u.s.done : (u.it ? u.it.done : !!u.b.result);
const doneCount = () => units().filter(isDone).length;
function volume(){
  return MODEL.flatMap(b=>b.mode==='sets'?b.items.flatMap(i=>i.sets):[])
    .filter(s=>s.done)
    .reduce((a,s)=>{ const kg=s.actKg??s.kg, r=s.actRep??s.reps; return a+(kg!=null&&r?kg*r:0) },0);
}
/* Порядок упражнений в зале не наш: стойка занята, что-то объединили
   в суперсет, что-то пропустили и вернулись. Поэтому приложение не
   указывает, ЧТО делать следующим, — оно идёт за атлетом.
   LAST — упражнение, в котором он сейчас работает. Пока внутри него
   остались подходы, кнопка и метка держатся его; когда закончил —
   переходим к первому несделанному по списку. Так же устроен Hevy:
   подсвечено сделанное, а не следующее. */
let CUR = null, LAST = null, STARTED = false;
function currentUnit(){
  /* Пока не начал — не подсвечиваем ничего. Метка появляется только
     после явного «Начать тренировку», иначе экран указывает на первый
     подход человеку, который ещё стоит в раздевалке. */
  if(!STARTED) return null;
  const left = units().filter(u=>!isDone(u));
  return (LAST && left.find(u=>u.it && u.it.id===LAST)) || left[0] || null;
}
const currentSet = () => (CUR && CUR.s) ? CUR : null;

/* ═══════════ ОТРИСОВКА ═══════════ */
function wdDate(){ return new Date(WD.date + 'T00:00:00') }
function renderHead(){
  const d = wdDate();
  /* Неделя программы — это «когда», а не «кто». Её место рядом с датой,
     а не в подписи тренера: там она читалась как часть его имени. */
  $('#daylab').innerHTML = `<b>${DOW[DAY]}, ${d.getDate()} ${MON[d.getMonth()]}</b>
    <s>неделя ${WEEK} из ${program(PROG).weeks}</s>`;
  $('#title').textContent  = WD.title;
  /* Имя тренера — не украшение, а место, куда прикреплена его речь (COM-4)
     и вход в обсуждение тренировки (COM-1). Есть сообщение — оно здесь;
     нет — остаётся подпись авторства, как у Centr.

     Длинное сообщение обрезаем двумя строками: тренер пишет абзацем, а на
     экране это съедало пол-экрана до первого упражнения. Остальное — за
     «полностью», и ведёт оно туда же, в обсуждение. */
  const msg = (TALK.workout[talkKey(CID, WD.date)]||[]).find(m=>m.who==='trainer');
  $('#byline').innerHTML = `<button class="coach" data-talk="workout">
    <span class="av">${esc(TRAINER.ini)}</span>
    <span class="cn"><b>${esc(TRAINER.n)}</b><span class="k">Тренер</span></span>
    <span class="ch">${ICO_COM}</span>
    ${msg?`<span class="msg from-trainer"><i>${esc(msg.text)}</i>
      <em>полностью <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l6 6-6 6"/></svg></em></span>`:''}
  </button>`;
}
const initials = e => e.en.split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
/* Реплика: кто сказал — слева, роль — прижата к правому краю,
   сам текст с новой строки во всю ширину. Так длинная заметка
   не обтекает подпись и не рвётся на короткие огрызки. */
/* Угол-хвостик показывает, с чьей стороны реплика: у тренера срезан
   левый нижний, у клиента — правый. Текст при этом остаётся во всю
   ширину: выравнивать пузыри по краям на узком экране — терять место. */
const note = (who, role, text, cls='') => `<div class="note ${cls} ${role?'from-trainer':'from-client'}">
  <span class="h">${ICO_COM}<b>${esc(who)}</b>${role?`<span class="k">${esc(role)}</span>`:''}</span>
  <span class="tx">${esc(text)}</span></div>`;
/* Всё назначенное одной строкой под названием: вес, схема, снаряд.
   Раньше это было растащено по углам шапки и читалось как таблица без
   заголовков — что за «132,5» и что за «3×5», приходилось догадываться.
   В строке порядок естественный: сколько · сколько раз · на чём. */
/* Шапка упражнения одна на все блоки. В комплексе у неё нет галочки —
   там результат один на весь блок, — но название, миниатюра, стрелка
   к технике и строка параметров те же. Упражнение остаётся упражнением,
   в каком бы блоке ни стояло. */
function exHead(it, withChk){
  return `<div class="exh">
    <span class="th">${esc(initials(it.ex))}</span>
    <button class="nm" data-open="${it.id}">
      <b>${esc(it.ex.ru)}</b>
      <svg class="ch" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l6 6-6 6"/></svg>
    </button>
    ${withChk ? `<button class="chk exchk ${allDone(it)?'done':someDone(it)?'part':''}"
      data-check-ex="${it.id}" aria-label="Отметить упражнение целиком">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5 8 14l7.5-8"/></svg>
    </button>` : ''}
  </div>
  <div class="exmeta">${metaOf(it)}</div>`;
}

function metaOf(it){
  const parts = [];
  if(it.kg != null)                     parts.push(fmtN(it.kg) + ' кг');
  else if(it.unit === 'сек' && it.val)  parts.push(mmss(+it.val));
  else if(it.val)                       parts.push(it.val + ' ' + it.unit);
  if(it.scheme)                         parts.push(it.scheme);
  if(it.ex.eq && it.ex.eq !== '—')      parts.push(it.ex.eq);
  return parts.map(esc).join(' · ');
}

/* что назначено — одной строкой справа от названия */
function prescOf(it){
  if(it.kg!=null) return `<div class="w">${fmtN(it.kg)}<small>кг</small></div>
    <div class="sets">${esc(it.scheme||'')}</div>`;
  if(it.unit==='сек' && it.val)
                  return `<div class="w">${mmss(+it.val)}</div>
    <div class="sets">${esc(it.scheme||'')}</div>`;
  if(it.val)      return `<div class="w">${esc(it.val)}<small>${esc(it.unit)}</small></div>
    <div class="sets">${esc(it.scheme||'')}</div>`;
  return `<div class="w">${esc(it.scheme||'—')}</div>`;
}

function setRow(it, s, cur){
  const kg = s.actKg ?? s.kg, rep = s.actRep ?? s.reps;
  const edited = s.actKg!=null || s.actRep!=null;
  const cells = [];
  if(kg!=null) cells.push(`<span class="f${s.done?'':' ghost'}">${fmtN(kg)}<u>кг</u></span>`);
  else if(s.unit==='сек' && s.val) cells.push(`<span class="f${s.done?'':' ghost'}">${mmss(+s.val)}</span>`);
  else if(s.val) cells.push(`<span class="f${s.done?'':' ghost'}">${esc(s.val)}<u>${esc(s.unit)}</u></span>`);
  if(rep!=null) cells.push(`<span class="f${s.done?'':' ghost'}">${rep}<u>повт</u></span>`);
  const timed = s.kg==null && s.unit==='сек' && s.val;
  /* Значения стоят вместе и читаются как одна запись — «132,5 кг × 5 повт».
     Раньше их разносила сетка в две равные колонки, и между ними зияла
     дыра: глазу приходилось собирать одно число с другим через полэкрана. */
  return `<div class="set ${s.done?'done':''} ${cur?'now':''} ${timed?'timed':''} ${edited?'hasedit':''}"
       data-item="${it.id}" data-set="${s.n}">
    <span class="i">${s.n}</span>
    <span class="vals">${cells.join('<em>×</em>')}</span>
    ${edited?'<span class="edited">исправлено</span>':''}
    <button class="chk" data-check><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5 8 14l7.5-8"/></svg></button>
  </div>`;
}

const allDone  = it => it.sets.length ? it.sets.every(s=>s.done) : !!it.done;
const someDone = it => it.sets.some(s=>s.done);
function exBlockSets(b){
  const cur = CUR;
  return b.items.map(it=>{
    /* Текстовая строка: ни схемы, ни подходов — только то, что написал
       тренер, и галочка. Открывать нечего, база тут ни при чём. */
    if(it.raw) return `<div class="ex" data-item="${it.id}">
      <div class="exin"><div class="exh raw">
        <span class="tx">${esc(it.raw)}</span>
        <button class="chk exchk ${it.done?'done':''}" data-check-ex="${it.id}"
          aria-label="Отметить выполненным">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5 8 14l7.5-8"/></svg>
        </button>
      </div></div></div>`;
    /* Один подход — шапка и есть этот подход: она уже показывает
       и назначение, и галочку. Печатать то же самое второй строкой незачем. */
    const body = `
      ${exHead(it, true)}
      ${it.sets.length>1 ? `<div class="sets">${it.sets.map(s=>setRow(it, s, cur && cur.s===s)).join('')}</div>` : ''}`;
    /* У упражнения с одним подходом строки нет — метке некуда встать.
       Тогда её носит сама шапка: иначе кнопка зовёт «далее · Гребля»,
       а на экране не подсвечено ничего. */
    const solo = it.sets.length===1 && cur && cur.it===it;
    return `<div class="ex ${solo?'now':''}" data-item="${it.id}">
      <div class="exin">
      ${body}
      ${prevLine(it)}
      ${it.comment?note('Вы', null, it.comment):''}
      ${(()=>{ const th = TALK.item[talkKey(CID, it.ex.id)] || [];
        /* Слово «Обсуждение» убрано — оно повторялось под каждым упражнением
           и не несло смысла. А вот ответ тренера — несёт: ради него в ветку
           и заходят, поэтому он назван словами, а не числом. */
        const n = th.filter(m=>m.who==='trainer').length;
        const lab = n ? `${n} ${plural(n,'ответ','ответа','ответов')} тренера`
                      : 'Оставить комментарий тренеру';
        return `<button class="addc${th.length?' has':''}" data-comment="${it.id}">
          ${ICO_COM}<span class="cnt">${lab}</span>
        </button>`; })()}
      </div>
      ${itemTimerCard(it)}
    </div>`;
  }).join('');
}
/* разминка и заминка — просто отметки, без разбивки на подходы */
/* комплекс — результат один на весь блок: время или раунды */
/* Комплекс рисуется ТЕМ ЖЕ кодом, что и всё остальное. Отличие ровно одно:
   сверх упражнений он просит общий результат — время или раунды, потому что
   его тренер задал форматом. Никаких других различий у упражнения нет: те же
   карточки, те же галочки. «Взятие на грудь» остаётся взятием на грудь,
   в каком бы блоке ни стояло. */
function exBlockRounds(b){
  return exBlockSets(b) + `
    ${b.result
      ? `<div class="mres done"><span class="k">Ваш результат</span><b>${esc(b.result)}</b>
           <button class="edit" data-result="${b.id}">изменить</button></div>`
      : `<button class="mres ${CUR&&CUR.b===b&&!CUR.it?'now':''}" data-result="${b.id}">
           <span class="k">Записать результат</span>
           <b>${b.fmt&&/AMRAP/i.test(b.fmt)?'раунды и повторы':'время или раунды'}</b></button>`}`;
}

/* Чипа с форматом в шапке блока больше нет: формат теперь живёт в самом
   названии («EMOM 12»), и чип печатал ту же строку второй раз подряд.
   Расшифровку — «12 × 1:00 · всего 12:00» — несёт карточка таймера ниже,
   там она к месту, потому что рядом кнопка запуска. */
function renderFeed(){
  $('#feed').innerHTML = MODEL.map(b=>`
    <div class="blk">
      <div class="blkh">
        <span class="n">${esc(b.title || 'Блок')}</span>
        <span class="ln"></span>
      </div>
      ${b.note?note(TRAINER.n, 'Тренер', b.note, 'top'):''}
      ${b.mode==='rounds' ? exBlockRounds(b) : exBlockSets(b)}
    </div>`).join('');
}

function renderProgress(){
  const all = units().length, done = doneCount();
  /* Полоса набрана отрезками — по одному на шаг тренировки. Так видно
     не «примерно сколько процентов», а сколько подходов осталось, что
     ближе к тому, чем человек в зале меряет работу. При 330pt ширины
     23 шага дают по 11,5pt на отрезок; если шагов станет больше сорока,
     они сольются в кашу — тогда возвращаемся к сплошной полосе. */
  const bar = $('#progbar');
  if(all && all <= 40){
    bar.classList.remove('solid');
    if(bar.children.length !== all)
      bar.innerHTML = Array.from({length:all}, ()=>'<i></i>').join('');
    [...bar.children].forEach((seg,i)=> seg.className = i < done ? 'on' : '');
  } else {
    bar.classList.add('solid');
    bar.innerHTML = `<i class="on" style="width:${all?done/all*100:0}%"></i>`;
  }
  $('#proglab').innerHTML = `<b>${done}</b> из ${all} шагов`;
  const v = volume();
  $('#progvol').textContent = v ? new Intl.NumberFormat('ru').format(Math.round(v)) + ' кг объём'
                                : 'начните тренировку';
  /* Три состояния кнопки: пригласить начать, вести по шагам, завершить.
     «Выполнено → далее» подтверждает шаг как назначено и переходит к
     следующему. Записать другой результат можно касанием по самой строке —
     кнопка для того случая, когда всё прошло по плану, а это большинство. */
  const u = CUR, left = all - done;
  const done_svg = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5 8 14l7.5-8"/></svg>';
  $('#cta').innerHTML =
    !left     ? `${done_svg} Завершить тренировку` :
    !STARTED  ? 'Начать тренировку' :
    !u        ? `Осталось шагов · ${left}` :
    u.s       ? `Выполнено <span class="ar">→</span> далее`
              : 'Записать результат';
}
function render(){ CUR = currentUnit(); renderFeed(); renderProgress() }

/* ═══════════ РЕЗУЛЬТАТ КОМПЛЕКСА (CLI-2) ═══════════
   Что именно записывать, диктует формат, который задал тренер:
   у AMRAP это раунды и повторы, у EMOM — сколько раундов выдержал,
   у «на время» — само время. Спрашивать всё сразу и разбирать
   свободный текст здесь незачем. */
const plural = (n, one, few, many) =>
  (n%10===1 && n%100!==11) ? one : (n%10>=2 && n%10<=4 && (n%100<10||n%100>=20)) ? few : many;
let RS = null;
function resMode(b){
  const f = b.fmt && parseFmt(b.fmt);
  if(f && f.k==='AMRAP') return {k:'amrap'};
  if(f && f.rounds > 1)  return {k:'rounds', of:f.rounds};
  return {k:'time'};
}
function openRes(bid){
  const b = MODEL.find(x=>x.id===bid);
  const m = resMode(b);
  RS = {b, m};
  $('#rs-fmt').textContent  = b.fmt || b.title;
  $('#rs-plan').textContent =
    m.k==='amrap'  ? 'Сколько кругов успели за отведённое время' :
    m.k==='rounds' ? 'Сколько раундов прошли как назначено' :
                     'За сколько прошли весь комплекс';
  $('#rs-fields').classList.toggle('one', m.k==='rounds');
  $('#rs-f2').style.display = m.k==='rounds' ? 'none' : '';
  $('#rs-k1').textContent = m.k==='amrap'?'Раундов' : m.k==='rounds'?'Раундов':'Минут';
  $('#rs-u1').textContent = m.k==='rounds' ? 'из '+m.of : m.k==='amrap'?'кругов':'мин';
  $('#rs-k2').textContent = m.k==='amrap'?'Повторов сверху':'Секунд';
  $('#rs-u2').textContent = m.k==='amrap'?'повт':'сек';
  const prev = b.result && b.result.match(/\d+/g);
  $('#rs-a').value = prev ? prev[0] : (m.k==='rounds' ? m.of : '');
  $('#rs-b').value = prev && prev[1] ? prev[1] : '';
  $('#res').classList.add('on');
  setTimeout(()=>$('#rs-a').focus(), 260);
}
function saveRes(){
  const a = parseInt($('#rs-a').value, 10), b2 = parseInt($('#rs-b').value, 10);
  if(isNaN(a)) return;
  const m = RS.m;
  RS.b.result =
    m.k==='amrap'  ? a + ' ' + plural(a,'раунд','раунда','раундов') + (b2 ? ' + ' + b2 : '') :
    m.k==='rounds' ? a + ' из ' + m.of + ' ' + plural(m.of,'раунда','раундов','раундов') :
                     a + ':' + String(isNaN(b2)?0:b2).padStart(2,'0');
  $('#res').classList.remove('on');
  render();
}
$('#rs-save').addEventListener('click', saveRes);
$('#res').addEventListener('click', e=>{ if(e.target.id==='res') $('#res').classList.remove('on') });

/* ═══════════ ОБСУЖДЕНИЕ (COM-1, COM-2, COM-4) ═══════════
   Чата в продукте нет. Комментарий всегда висит на объекте — на
   тренировке или на упражнении, — и ответ тренера ложится в ту же
   ветку. Поэтому здесь не лента сообщений, а разговор про одну вещь. */
let TK = null;
function threadOf(scope, id){
  if(scope==='workout'){ const k = talkKey(CID, WD.date);
    return TALK.workout[k] || (TALK.workout[k] = []) }
  const {it} = findSet(id, 1), k = talkKey(CID, it.ex.id);
  return TALK.item[k] || (TALK.item[k] = []);
}
function openTalk(scope, id){
  TK = {scope, id};
  const {it} = id ? findSet(id, 1) : {};
  /* Название тренировки здесь не нужно: мы внутри неё, это видно
     по всему остальному экрану. Заголовок занимает всю ширину и
     укладывается в одну строку. */
  $('#tk-title').textContent = scope==='workout' ? 'Обсуждение тренировки' : it.ex.ru;
  $('#tk-sub').textContent   = scope==='workout' ? '' : 'обсуждение';
  $('#tk-text').placeholder  = scope==='workout'
    ? 'Как прошла тренировка? Что написать тренеру?'
    : 'Что не так с упражнением? Вес, техника, ощущения';
  $('#tk-text').value = '';
  paintThread();
  $('#talk').classList.add('on');
  setTimeout(()=>$('#tk-text').focus(), 260);
}
function paintThread(){
  const th = threadOf(TK.scope, TK.id);
  $('#tk-thread').innerHTML = th.length ? th.map(m=>`
    <div class="msg ${m.who} ${m.who==='trainer'?'from-trainer':'from-client'}">
      <span class="who">${m.who==='trainer'?esc(TRAINER.n):'Вы'}<i>${esc(m.at)}</i></span>
      <span class="tx">${esc(m.text)}</span>
    </div>`).join('')
    : `<div class="empty">Здесь пока пусто. Тренер увидит комментарий там же,
       где составлял тренировку, и ответит в этой же ветке.</div>`;
}
function sendTalk(){
  const v = $('#tk-text').value.trim();
  if(!v) return;
  threadOf(TK.scope, TK.id).push({who:'client', text:v, at:'сейчас'});
  if(TK.scope==='item'){ const {it} = findSet(TK.id, 1); it.comment = v }
  $('#tk-text').value = '';
  paintThread(); render();
}
$('#tk-send').addEventListener('click', sendTalk);
$('#talk').addEventListener('click', e=>{ if(e.target.id==='talk') $('#talk').classList.remove('on') });

/* ═══════════ ВЗАИМОДЕЙСТВИЕ ═══════════ */
function findSet(itemId, n){
  for(const b of MODEL){
    const it = b.items.find(x=>x.id===itemId);
    if(it) return {it, s:it.sets.find(x=>x.n===+n)};
  }
  return {};
}
/* галочка — отметить как есть; касание по цифрам — вписать фактический результат */
document.addEventListener('click', e=>{
  const chk = e.target.closest('.set [data-check]') || e.target.closest('.set .chk');
  if(chk){
    const row = chk.closest('.set');
    const {s} = findSet(row.dataset.item, row.dataset.set);
    if(s){ s.done = !s.done; STARTED = true; LAST = row.dataset.item;
           if(!s.done){ s.actKg=null; s.actRep=null } render() }
    return;
  }
  const exc = e.target.closest('[data-check-ex]');
  if(exc){
    /* Шапка снимает и ставит разом: для разминки это единственный разумный
       способ, для силового — быстрый откат, если отметил не то. */
    const {it} = findSet(exc.dataset.checkEx, 1);
    if(!it.sets.length){ it.done = !it.done; STARTED = true; LAST = it.id; render(); return }
    const on = !allDone(it);
    it.sets.forEach(s=>{ s.done = on; if(!on){ s.actKg=null; s.actRep=null } });
    it.done = on; STARTED = true; LAST = it.id; render();
    return;
  }
  const row = e.target.closest('.set');
  if(row){ STARTED = true; LAST = row.dataset.item; openSheet(row.dataset.item, row.dataset.set); return }

  const ci = e.target.closest('[data-check-item]');
  if(ci){
    const {it} = findSet(ci.dataset.checkItem, 1); if(!it) return;
    it.done = !it.done; LAST = it.id; render();
    return;
  }
  const rs = e.target.closest('[data-result]');
  if(rs){ openRes(rs.dataset.result); return }
  const cm = e.target.closest('[data-comment]');
  if(cm){ openTalk('item', cm.dataset.comment); return }
  const tk = e.target.closest('[data-talk]');
  if(tk){ openTalk(tk.dataset.talk); return }
  if(e.target.closest('#cta')){
    if(!STARTED){                       /* старт: метка встаёт на первый шаг */
      STARTED = true; render();
      const el = $('.now'); if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
      return;
    }
    const u = CUR;
    if(!u){ alert('Тренировка завершена. Тренер увидит результаты и сможет ответить.'); return }
    if(u.s){                            /* прошло по плану — отмечаем и идём дальше */
      u.s.done = true; LAST = u.it.id; render();
      const el = $('.now'); if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
    }
    else openRes(u.b.id);               /* комплекс — записать результат */
    return;
  }
  if(e.target === $('#sheet')) closeSheet();
});

let SHEET = null;
function openSheet(itemId, n){
  const {it, s} = findSet(itemId, n);
  if(!it || !s) return;
  SHEET = {itemId, n};
  $('#sh-ex').textContent  = it.ex.ru;
  $('#sh-set').textContent = 'подход ' + s.n + ' из ' + it.sets.length;
  const planKg = s.kg!=null ? fmtN(s.kg)+' кг' : (s.val? s.val+' '+s.unit : '—');
  $('#sh-plan').textContent = 'Назначено: ' + planKg + (s.reps? ' · '+s.reps+' повторов' : '');
  $('#sh-kg').value  = s.actKg ?? (s.kg ?? '');
  $('#sh-rep').value = s.actRep ?? (s.reps ?? '');
  /* быстрые правки от назначенного — чаще всего атлет отклоняется на шаг блинов */
  const base = s.kg;
  $('#sh-quick').innerHTML = base!=null
    ? [-5,-2.5,+2.5,+5].map(d=>`<button data-delta="${d}">${d>0?'+':''}${fmtN(d)} кг</button>`).join('')
      + `<button data-reset>вернуть ${fmtN(base)}</button>`
    : '';
  $('#sheet').classList.add('on');
}
const closeSheet = () => { $('#sheet').classList.remove('on'); SHEET = null };

document.addEventListener('click', e=>{
  const d = e.target.closest('[data-delta]');
  if(d){ const v = parseFloat(($('#sh-kg').value||'0').replace(',','.')) || 0;
    $('#sh-kg').value = fmtN(Math.max(0, Math.round((v + +d.dataset.delta)*10)/10)); return }
  if(e.target.closest('[data-reset]')){
    const {s} = findSet(SHEET.itemId, SHEET.n); $('#sh-kg').value = fmtN(s.kg); return }
  if(e.target.closest('#sh-save')){
    if(!SHEET) return;
    const {s} = findSet(SHEET.itemId, SHEET.n);
    const kg = parseFloat(($('#sh-kg').value||'').replace(',','.'));
    const rp = parseInt($('#sh-rep').value, 10);
    /* Шторка подставляет назначенное, чтобы подтвердить подход одним касанием.
       Значит подтверждение приходит теми же числами — и записывать их как
       «фактический результат» нельзя, иначе каждый подход помечается
       исправленным. Отклонение фиксируем, совпадение — нет. */
    s.actKg  = (isNaN(kg) || kg === s.kg)   ? null : kg;
    s.actRep = (isNaN(rp) || rp === s.reps) ? null : rp;
    s.done = true;
    closeSheet(); render();
    const el = $('.now');
    if(el) el.scrollIntoView({block:'center', behavior:'smooth'});
  }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSheet() });


/* ════════════════════════════════════════════════════════════
   ТАЙМЕР · TMR-1…TMR-4

   Ничего настраивать не нужно: формат, который тренер написал
   в блоке, парсер уже разобрал на раунды и интервалы (TMR-1).
   Для упражнений, измеряемых в секундах, таймер собирается
   из самого назначения — «планка 45 сек» даёт отсчёт 45.
   ════════════════════════════════════════════════════════════ */
/* Одна карточка на оба масштаба: над блоком, если формат задал тренер,
   и над упражнением, если оно измеряется временем. Механика одна,
   меняется только то, чем таймер управляет. */
function timerCard(kind, id, title, sub){
  return `<button class="tmlaunch" data-timer-${kind}="${id}">
    <span class="ico"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="11" r="7"/><path d="M10 7.5V11l2.5 1.6M7.5 2h5"/></svg></span>
    <span class="t"><b>${esc(title)}</b><s>${esc(sub)}</s></span>
    <span class="go">Начать</span></button>`;
}
/* Карточка таймера подписана просто «Таймер» и у блока, и у упражнения:
   что именно отсчитываем, уже сказано выше — в названии блока («EMOM 12»)
   или в названии упражнения. Повторять это в карточке незачем. */
const timedItem = it => it.unit==='сек' && it.val;
/* Рамкой стала сама карточка упражнения: она одна на все упражнения,
   а таймер — просто нижняя зона внутри неё. Отдельная обёртка только
   для упражнений с таймером давала фон трём из десяти. */
function itemTimerCard(it){
  if(!TIMER || !timedItem(it)) return '';
  const n = it.sets.length;
  return timerCard('item', it.id, 'Таймер',
    n>1 ? `${n} × ${mmss(+it.val)} · всего ${mmss(+it.val*n)}` : mmss(+it.val));
}

/* короткая расшифровка формата: что именно получит атлет */
function tmSub(f){
  if(f.rest>0)      return `${f.rounds} × ${mmss(f.work)} через ${mmss(f.rest)} · ${mmss(f.total)}`;
  if(f.k==='EMOM')  return `${f.rounds} × ${mmss(f.work)} · всего ${mmss(f.total)}`;
  if(f.k==='AMRAP') return `максимум раундов за ${mmss(f.total)}`;
  return `на время · лимит ${mmss(f.total)}`;
}
/* Одна запись длительности на весь клиентский экран: m:ss — ровно то,
   что тикает в таймере. Ведущий ноль не пишем: 1:30, 0:45, 12:00.
   Секунды остаются языком тренера в конструкторе, клиент их не видит. */
const mmss = t => Math.floor(Math.max(0,t)/60)+':'+String(Math.max(0,Math.round(t))%60).padStart(2,'0');

let TM = null;      /* {plan, i, left, running, raf, sound} */
let AC = null;
function beep(hi){
  if(!TM || !TM.sound) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.frequency.value = hi ? 880 : 520;
    g.gain.setValueAtTime(.001, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.25, AC.currentTime+.01);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime+.32);
    o.start(); o.stop(AC.currentTime+.34);
  }catch(_){}
  if(navigator.vibrate) navigator.vibrate(hi?[90,60,90]:60);
}

/* формат блока → последовательность отрезков */
function planFromFmt(fmt){
  const f = parseFmt(fmt);
  if(!f) return null;
  const seq = [];
  if(f.rest > 0){
    for(let r=1;r<=f.rounds;r++){
      seq.push({kind:'work', sec:f.work, round:r});
      if(r<f.rounds) seq.push({kind:'rest', sec:f.rest, round:r});
    }
  } else if(f.k==='EMOM'){
    for(let r=1;r<=f.rounds;r++) seq.push({kind:'work', sec:f.work, round:r});
  } else {
    seq.push({kind:'work', sec:f.total, round:1});
  }
  return {seq, rounds:f.rounds, kind:f.k, label:f.label, total:f.total, up:/FOR TIME/i.test(f.k)};
}
/* один подход на время: прожил — отметился */
function planFromSet(it, s){
  const sec = parseInt(s.val ?? it.val, 10) || 60;
  return {seq:[{kind:'work', sec, round:1}], rounds:1, kind:'ПОДХОД',
          label:mmss(sec), total:sec, up:false};
}
/* назначение в секундах → отсчёт по подходам */
function planFromSets(it){
  const n = it.sets.length, sec = parseInt(it.val,10);
  if(!sec) return null;
  const seq = [];
  for(let r=1;r<=n;r++) seq.push({kind:'work', sec, round:r});
  return {seq, rounds:n, kind:'ПОДХОДЫ', label:n>1?mmss(sec)+' в подходе':mmss(sec), total:sec*n, up:false};
}

function openTimer(plan, title, sub, mark){
  TM = {plan, i:0, left:plan.seq[0].sec, running:false, sound:true, elapsed:0, mark:mark||null};
  $('#tm-title').textContent = title;
  $('#tm-sub').textContent   = sub;
  $('#tm-plan').innerHTML = `
    <div class="r"><b>Раундов</b><span class="v">${plan.rounds}</span></div>
    <div class="r"><b>${plan.up?'Лимит':'Всего'}</b><span class="v">${mmss(plan.total)}</span></div>
    <div class="r"><b>Режим</b><span class="v">${esc(plan.label)}</span></div>`;
  $('#timer').classList.add('on');
  paintTimer();
}
function closeTimer(){ stopTimer(); $('#timer').classList.remove('on'); TM=null }
function paintTimer(){
  if(!TM) return;
  const seg = TM.plan.seq[TM.i];
  $('#tm-phase').textContent = TM.plan.up ? 'Идёт время' : seg.kind==='rest' ? 'Отдых' : 'Работа';
  $('#tm-phase').className = 'phase' + (seg.kind==='rest'?' rest':'');
  $('#tm-big').textContent = mmss(TM.plan.up ? TM.elapsed : TM.left);
  $('#tm-rnd').textContent = TM.plan.rounds>1 ? `Раунд ${seg.round} из ${TM.plan.rounds}` : '';
  $('#tm-ring').style.width = (seg.sec ? (1 - TM.left/seg.sec)*100 : 0) + '%';
  $('#tm-dots').innerHTML = TM.plan.rounds>1 && TM.plan.rounds<=16
    ? Array.from({length:TM.plan.rounds},(_,k)=>
        `<i class="${k+1<seg.round?'done':k+1===seg.round?'now':''}"></i>`).join('') : '';
  $('#tm-go').textContent = TM.running ? 'Пауза' : (TM.i===0 && TM.left===TM.plan.seq[0].sec ? 'Старт' : 'Продолжить');
}
function tickTimer(ts){
  if(!TM || !TM.running) return;
  if(!TM.last) TM.last = ts;
  const dt = (ts - TM.last)/1000; TM.last = ts;
  TM.left -= dt; TM.elapsed += dt;
  if(TM.left <= 0){
    const wasLast = TM.i >= TM.plan.seq.length-1;
    if(wasLast){
      TM.running=false; TM.left=0; beep(true); paintTimer();
      $('#tm-go').textContent='Заново';
      /* Правило: время вышло — упражнение выполнено. Отсчёт и есть работа,
         переспрашивать «сделали?» бессмысленно. Отмечаем сами и говорим
         об этом вслух, иначе клиент решит, что галочку надо ставить руками. */
      let mk = null;
      if(TM.mark){
        const {it} = findSet(TM.mark.item, 1);
        if(it){ it.done = true; it.sets.forEach(x=>x.done = true); mk = it.ex.ru }
        render();
      }
      $('#tm-phase').textContent = mk ? 'Готово · отмечено' : 'Готово';
      return;
    }
    TM.i++; TM.left += TM.plan.seq[TM.i].sec; beep(TM.plan.seq[TM.i].kind==='work');
  }
  paintTimer();
  TM.raf = requestAnimationFrame(tickTimer);
}
function startTimer(){ if(!TM||TM.running) return; TM.running=true; TM.last=0; beep(true);
  TM.raf = requestAnimationFrame(tickTimer); paintTimer() }
function stopTimer(){ if(!TM) return; TM.running=false; if(TM.raf) cancelAnimationFrame(TM.raf); }
function resetTimer(){ if(!TM) return; stopTimer(); TM.i=0; TM.left=TM.plan.seq[0].sec; TM.elapsed=0; paintTimer() }

document.addEventListener('click', e=>{
  if(!TIMER && e.target.closest('[data-timer-block],[data-timer-item]')) return;
  const lt = e.target.closest('[data-timer-block]');
  if(lt){ const b2 = MODEL.find(x=>x.id===lt.dataset.timerBlock);
    const plan = planFromFmt(b2.fmt); if(plan) openTimer(plan, b2.title, b2.fmt); return }
  const ts = e.target.closest('[data-timer-item]');
  if(ts){
    const {it} = findSet(ts.dataset.timerItem, 1);
    LAST = it.id;
    const plan = planFromSets(it);
    if(plan) openTimer(plan, it.ex.ru, it.sets.length>1 ? it.sets.length + ' × ' + mmss(+it.val) : mmss(+it.val), {item:it.id, all:true});
    return;
  }
  if(e.target.closest('#tm-close')) return closeTimer();
  if(e.target.closest('#tm-reset')) return resetTimer();
  if(e.target.closest('#tm-snd')){ TM.sound = !TM.sound; $('#tm-snd').classList.toggle('off', !TM.sound); return }
  if(e.target.closest('#tm-go')){
    if(!TM) return;
    if($('#tm-go').textContent==='Заново') return resetTimer();
    TM.running ? (stopTimer(), paintTimer()) : startTimer();
  }
});

renderHead(); render();
