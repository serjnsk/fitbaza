/* ============================================================
   Общая логика — одна на все стилистики. Тема меняет только
   цвет и типографику, поведение везде одинаковое: иначе
   сравнивать варианты бессмысленно, они разойдутся по сути.
   ============================================================ */
/* ════════════════════════════════════════════════════════════
   КОНСТРУКТОР — тренировка как документ

   Данные общие с клиентским экраном: тот же data.js, та же
   программа, та же среда. Страницы должны расходиться только
   оформлением, иначе сверять их бессмысленно.

   Иерархия определяет, что куда вкладывается:
     упражнение → в блок · блок → в тренировку · тренировка → в день
   Неделя и программа — уровни выше, ими не наполняют день, их
   копируют целиком (CON-4). Поэтому в панели источников три
   уровня, а неделя живёт полосой сверху.

   Текст вводится в самой строке: CON-1 и CON-5 — один интерфейс
   поверх структуры, разбор идёт на лету. Кнопки «распознать» нет.

   ПМ здесь не редактируются: клиент вводит их у себя (PRO-4),
   тренер пишет проценты, расчёт автоматический (CON-16, CON-17).
   Килограммы в строках — превью под выбранного в топбаре атлета.
   ════════════════════════════════════════════════════════════ */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials = e => (e.en||e.ru||'').split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20?c:y===1?a:y>1&&y<5?b:c };
const fmtN = v => String(v).replace('.',',');
/* «Останется у Артём» режет глаз. Родительный падеж имени по простому
   правилу — для русских имён его хватает. */
const GEN_EX = {'Пётр':'Петра','Павел':'Павла','Лев':'Льва','Игорь':'Игоря'};
function gen(name){
  const n = String(name||'').split(' ')[0];
  if(GEN_EX[n]) return GEN_EX[n];          /* беглая гласная простым правилом не берётся */
  const l = n.slice(-1).toLowerCase(), pre = n.slice(-2,-1).toLowerCase();
  if(l === 'а') return n.slice(0,-1) + ('гкхжчшщ'.includes(pre) ? 'и' : 'ы');
  if(l === 'я') return n.slice(0,-1) + 'и';
  if(l === 'й' || l === 'ь') return n.slice(0,-1) + 'я';
  return n + 'а';
}
const DOW = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
/* Родительный падеж: «стёрта из среды», а не «из среда». */
const DOW_GEN = ['понедельника','вторника','среды','четверга','пятницы','субботы','воскресенья'];
const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const mmss = t => Math.floor(Math.max(0,t)/60)+':'+String(Math.max(0,Math.round(t))%60).padStart(2,'0');

/* Таймер вынесен за MVP (см. тот же флаг на экране клиента). Формат блока
   остаётся: он определяет, как клиент записывает результат, а не только
   отсчёт. */
const TIMER = false;

/* mkBlock из data.js ждёт элементы МАССИВАМИ [exId, scheme, pct, unit, val]
   и пересобирает их через mkItem. Если передать туда готовые объекты, он
   молча вернёт блок с пустыми упражнениями — без ошибки, без предупреждения.
   Там, где элементы уже собраны, пользуемся этим: он их не трогает. */
const blockOf = (title, items, note, kind) => ({
  id: nid('b'), kind: kind || 'strength', title: title || '',
  note: note || '', fmt: fmtPart(title) || null, items: items || [],
});

/* «Отдых» и «—» приходят из модели как заглушки пустого дня, а не как
   названия тренировок. Если день наполнили, они не должны остаться в поле. */
const REST_TITLES = new Set(['Отдых','—','']);

/* S.i — номер дня в плане программы, от нуля. Недели в модели нет, поэтому
   и в состоянии её нет: раньше здесь лежали «неделя» и «день внутри недели»,
   и любое действие приходилось переводить между двумя системами отсчёта. */
/* Конструктор отталкивается от клиента и даты, а не от программы: программа —
   то, что у клиента назначено, а не то, куда заходят. Без параметров в адресе
   открывается пустой конструктор с выбором даты и клиента (режим new);
   ?client=&date= ведёт сразу в редактор нужного дня. */
const Q = new URLSearchParams(location.search);
const S = { cid: Q.get('client') || 'c1', pid:'p1', i:0, date: Q.get('date') || TODAY,
            tab:'ex', q:'', compose:null,
            sel:null,    /* Set выбранных дней или null — режим выключен */
            paste:null   /* 'copy' | 'move' — ждём, куда вставить набор */ };
const PCACHE = {};
/* planOf строит план один раз на программу и сразу переносит формат блока в
   название (fmtIntoTitle): раньше это делалось только для стартовой
   программы, и после смены клиента чужие блоки приходили без формата. */
const planOf = pid => PCACHE[pid] ||= (b => { b.forEach(d=>d.blocks.forEach(fmtIntoTitle)); return b })(buildPlan(pid));
const plan = () => planOf(S.pid);
/* Привязка клиента к плану: программа берётся у клиента, день — из даты. */
function bindClient(cid, date){
  const c = client(cid); if(!c) return false;
  S.cid = cid; S.pid = c.prog || null;
  if(!S.pid) return false;
  S.date = date || S.date;
  const i = daysBetween(program(S.pid).start, S.date);
  if(i < 0 || i >= program(S.pid).days) return false;
  extendPlan(i);
  S.i = i; S.compose = null; S.sel = null; S.paste = null;
  return true;
}
/* Если из адреса пришло что-то негодное — откатываемся на клиента по умолчанию
   и сегодня, редактор должен открыться в любом случае. */
if(!bindClient(S.cid, S.date)) bindClient('c1', TODAY);
/* «Создать тренировку» без параметров — это новая тренировка, а не правка
   существующей: открываем первый ещё не составленный день, он пуст. */
if(!Q.get('date')){
  const n = composedDays(S.pid);
  if(n < program(S.pid).days){ extendPlan(n); S.i = n; S.date = plan()[n].date; }
}
const day  = () => plan()[S.i];
const PM   = () => pmOf(S.cid);

/* LOGO живёт в assets/nav.js — общий для обеих оболочек. */


/* ─── навигация по рабочему пространству ─── */
const ICON = {
 dash:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6"/><rect x="11" y="2.5" width="6.5" height="4" rx="1.6"/><rect x="11" y="8.5" width="6.5" height="9" rx="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6"/></svg>',
 users:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="8" cy="6.5" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14 4.2a3 3 0 0 1 0 5.6M15.5 12.6c1.6.7 2.8 2.3 2.8 4.4"/></svg>',
 cal:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg>',
 prog:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="15" height="15" rx="2.5"/><path d="M6 7h8M6 10h8M6 13h4.5"/></svg>',
 build:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 4.5h6M3 10h14M3 15.5h9"/><circle cx="13.5" cy="4.5" r="2"/><circle cx="15" cy="15.5" r="2"/></svg>',
 dumb:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4.5 7v6M2.5 8.5v3M15.5 7v6M17.5 8.5v3M6 10h8"/></svg>',
 tpl:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5A2 2 0 0 1 4.5 3.5h3l1.5 2h6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9z"/></svg>',
 brand:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="3"/></svg>',
 map:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11l-4.5 2-6-2-4.5 2v-11z"/><path d="M7 3.5v11M13 5.5v11"/></svg>',
 plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 3.5v9M3.5 8h9"/></svg>',
 back:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 8H3M7 4 3 8l4 4"/></svg>',
 arr:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
 copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
 grip:'<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/><circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/></svg>',
 x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
 chat:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 7.6a5.2 5.2 0 0 1-7.4 4.7L2.5 13.2l1-3.6A5.2 5.2 0 1 1 13.5 7.6z"/></svg>',
 ai:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 1.8 9.5 6 13.7 7.5 9.5 9 8 13.2 6.5 9 2.3 7.5 6.5 6z"/><path d="M12.8 11.4l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z"/></svg>',
 /* Отдельная папка для кнопок: у навигационной ICON.tpl другой viewBox
    и не задана толщина обводки — рядом со «Сохранить» и «Копией» она
    выглядела заметно тоньше. Здесь всё совпадает: 16 и 1.5. */
 folder:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M1.8 4.2a1.4 1.4 0 0 1 1.4-1.4h2.4l1.2 1.6h5.4a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4v-7.6z"/></svg>',
 star:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3.5 2.8h9v10.4L8 10.2l-4.5 3V2.8z"/></svg>',
 clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
 chk:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>',
};
/* NAV живёт в assets/nav.js — общий конфиг, см. комментарий там. */
/* renderNav живёт в assets/nav.js — общий для обеих оболочек. */

function renderTop(){
  /* Шапка одинакова на всех страницах и несёт только главное действие.
     Крошки, выбор клиента и «Назначить» переехали в рабочую зону — они
     относятся к тренировке, а не к приложению. */
  $('#topbar').innerHTML = `
    <span class="sp"></span>
    <a class="btn" href="constructor.html">${ICON.build} Создать тренировку</a>`;
}

function renderHead(){
  /* Ни крошки, ни названия программы: конструктор открывают на клиента и
     дату, программа — свойство клиента, а не адрес, по которому пришли. */
  $('#pagehead').innerHTML = `<div class="ph-row"><h1>Конструктор</h1></div>`;
}



/* COM-4 — обращение тренера ко всей тренировке. На экране клиента оно
   стоит под именем тренера, выше всех блоков, и читается первым. Значит
   и писаться должно здесь же, над документом, а не внутри блока:
   заметка к блоку (b.note) — про один блок, это — про весь день. */
const dayTalk = date => { const k = talkKey(S.cid, date);
  return TALK.workout[k] || (TALK.workout[k] = []) };
const trainerMsg = date => (dayTalk(date).find(m=>m.who==='trainer')||{}).text || '';
function setTrainerMsg(date, text){
  const arr = dayTalk(date), i = arr.findIndex(m=>m.who==='trainer');
  const t = (text||'').trim();
  if(!t){ if(i>=0) arr.splice(i,1); return }
  if(i>=0) arr[i].text = t;
  else arr.unshift({who:'trainer', text:t, at:'сейчас'});
}

/* Цель программы одинакова все восемь недель и на всех днях — на странице,
   где правят один день, она ни на что не влияет. Показываем то, что от
   недели к неделе меняется: сколько дней заполнено и чем они нагружены. */
function planStat(){
  const d = plan();
  const filled = d.filter(x=>x.blocks.some(b=>b.items.some(i=>i.exId))).length;
  const n = d.reduce((a,x)=>a+x.blocks.reduce((y,b)=>y+b.items.filter(i=>i.exId).length,0),0);
  if(!filled) return 'план пустой';
  return filled + ' ' + plural(filled,'тренировка','тренировки','тренировок') +
         ' · ' + n + ' ' + plural(n,'упражнение','упражнения','упражнений');
}



/* ─── дорожка плана ───
   Раньше здесь была решётка из семи дней с листанием по неделям. Теперь это
   непрерывная дорожка дней программы: тренер ставит тренировки в любом ритме,
   а не заполняет семь ячеек. Полоса прокручивается, выбранный день в центре. */
function renderStrip(){
  const d = plan(), p = program(S.pid), cur = d[S.i];
  /* Лента — семь дней текущей недели: неделя осталась представлением, и здесь
     она уместна. Дни за концом плана, но в сроке программы — пустые, клик по
     такому продлевает план. */
  const wk0 = addDays(cur.date, -dowMon(cur.date));
  const cells = Array.from({length:7}, (_,k)=>{
    const date = addDays(wk0, k), i = daysBetween(p.start, date);
    return {date, i, inPlan: i>=0 && i<d.length, inProg: i>=0 && i<p.days};
  });
  $('#wk').innerHTML = `
    <div class="wkh">
      <select class="cliSel" id="cli" title="Клиент">${CLIENTS.filter(c=>c.prog).map(c=>
        `<option value="${c.id}" ${c.id===S.cid?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
      <span class="wkn">
        <button id="dayPrev" title="Предыдущий день" ${S.i<1?'disabled':''}>${ICON.back}</button>
        <button id="dayNext" title="Следующий день" ${S.i>=p.days-1?'disabled':''}>${ICON.arr}</button>
      </span>
      <span class="sp"></span>
      ${S.sel ? `
        <b class="seln">Выбрано ${S.sel.size}</b>
        <button class="cp" id="selCopy" ${S.sel.size?'':'disabled'}>${ICON.copy} Скопировать</button>
        <button class="cp" id="selMove" ${S.sel.size?'':'disabled'}>${ICON.arr} Перенести</button>
        <button class="cp" id="selCancel">${ICON.x} Отмена</button>
      ` : (S.paste ? `<s class="hint">${S.paste==='copy'?'выберите день, куда скопировать':'выберите день, куда перенести'}</s>` : '')}
    </div>
    <div class="days" id="strip">
      ${cells.map(c=>{
        const dt = new Date(c.date + 'T00:00:00');
        const head = `<span class="d">${RU[dowMon(c.date)]} ${dt.getDate()}</span>`;
        if(!c.inProg) return `<span class="day void">${head}</span>`;
        if(!c.inPlan) return `<button class="day empty" data-day="${c.i}" title="Составить этот день">${head}<span class="e">не составлено</span></button>`;
        const x = d[c.i];
        const bl = x.blocks.filter(b=>b.items.some(y=>y.exId)).length;
        const n  = x.blocks.reduce((a,b)=>a+b.items.filter(y=>y.exId).length, 0);
        const picked = S.sel && S.sel.has(c.i);
        return `<button class="day ${c.i===S.i&&!S.sel?'on':''}${n?'':' rest'}${picked?' picked':''}${S.paste?' target':''}"
                        data-day="${c.i}" style="--load:${n||0}">
          ${S.sel ? `<span class="tick">${picked?ICON.chk:''}</span>` : ''}
          ${head}
          ${n ? `<span class="t">${esc(x.title)}</span>` : '<span class="e">отдых</span>'}
          ${n ? `<span class="k">${bl} ${plural(bl,'блок','блока','блоков')} · ${n} упр</span>` : ''}
          <span class="ld"><i style="flex:${n}"></i><u style="flex:${Math.max(1,10-n)}"></u><s>${n||''}</s></span>
        </button>`;
      }).join('')}
    </div>`;
}

/* ─── документ дня ─── */
/* Расшифровка формата словами — пригодится, когда вернётся таймер.
   Пока не вызывается ниоткуда: подтверждать разбор мы перестали. */
function tmSub(f){
  if(f.rest>0)      return `${f.rounds} × ${mmss(f.work)} через ${mmss(f.rest)}`;
  if(f.k==='EMOM')  return `${f.rounds} × ${mmss(f.work)} · всего ${mmss(f.total)}`;
  if(f.k==='AMRAP') return `максимум раундов за ${mmss(f.total)}`;
  return `на время · лимит ${mmss(f.total)}`;
}
function lineHTML(it){
  const ex = it.exId ? byId(it.exId) : null;
  /* Нераспознанная строка — предусмотренное состояние, а не ошибка:
     «нераспознанные строки остаются текстом и конвертируются вручную».
     Поэтому не предупреждаем, а даём тот самый ручной путь — выбор из базы
     одним нажатием. Текст при этом сохраняется как есть. */
  if(!ex) return `<div class="line raw" data-item="${it.id}">
    <span class="gr">${ICON.grip}</span>
    <span class="txt" contenteditable data-edit="${it.id}">${esc(it.raw||'')}</span>
    <button class="pick" data-pickfor="${it.id}">Выбрать упражнение</button>
    <button class="x" data-del="${it.id}">${ICON.x}</button>
  </div>`;
  const kg = workKg(it, PM());
  const tail = [it.scheme, it.pct ? '' : (it.val ? it.val+' '+it.unit : '')].filter(Boolean).join(' ');
  return `<div class="line" data-item="${it.id}">
    <span class="gr">${ICON.grip}</span>
    <span class="txt" contenteditable data-edit="${it.id}"><span class="nm">${esc(ex.ru)}</span>${tail?` <span class="sc">${esc(tail)}</span>`:''}</span>
    ${ex.pm ? `<button class="pct ${it.pct?'':'none'}" data-pct="${it.id}">${it.pct? fmtN(it.pct)+' %' : 'от ПМ'}</button>` : ''}
    <span class="kg">${kg!=null ? fmtN(kg)+' кг' : ''}</span>
    <button class="x" data-del="${it.id}">${ICON.x}</button>
  </div>`;
}
function blockHTML(b){
  const f = findFmt(b.title);
  return `<div class="blk ${PENDING && PENDING.ids.has(b.id) ? 'pending' : ''}" data-blk="${b.id}">
    <div class="blkh">
      <span class="gr" title="Перетащить блок">${ICON.grip}</span>
      <input class="bt" data-f="title" value="${esc(b.title)}"
             placeholder="Введите название блока">
      <button class="x" data-savblk="${b.id}" title="Сохранить блок в библиотеку">${ICON.star}</button>
      <button class="x" data-delblk="${b.id}">${ICON.x}</button>
    </div>
    <div class="bmeta">
      <label class="fld"><span class="k">Заметка</span>
        <input data-f="note" value="${esc(b.note||'')}" placeholder="Увидит клиент над этим блоком">
      </label>
    </div>
    ${b.items.map(lineHTML).join('')}
    <button class="addl" data-add="${b.id}">${ICON.plus} Упражнение — печатайте как в тетради: «Присед 5×3 80%»</button>
  </div>`;
}
/* Пустой день — момент, когда тренер выбирает, КАК начать. Здесь развилка
   уместна: распознавание текста — главное отличие продукта от тетради, и,
   спрятанное в плейсхолдер, оно бы осталось незамеченным. Дальше развилки
   нет: вставить текст можно в любую строку, и одна строка проходит молча. */
function emptyDay(){
  if(S.compose === 'text') return `
    <textarea class="paste" id="paste" rows="8" placeholder="Вставьте текст из заметок или напечатайте.

Разминка
гребля 500 м
мобилити плеч с PVC 2×10

Присед 5×3 80%
Жим лёжа 5×5"></textarea>
    <div class="pastef">
      <button class="lnk" id="pt-back">← Собрать вручную</button>
      <span class="sp"></span>
      <button class="btn" id="pt-go">${ICON.ai} Распознать</button>
    </div>`;
  return `
    <div class="start">
      <div class="ways">
        <button class="way" id="w-hand">
          <span class="ic">${ICON.plus}</span>
          <b>Создайте вручную или добавьте из шаблонов</b>
          <s>Подскажу упражнения по мере набора</s>
        </button>
        <button class="way ai" id="w-ai">
          <span class="ic">${ICON.ai}</span>
          <b>Добавьте текст — ИИ разберёт по блокам</b>
          <s>Из заметок, таблицы или переписки</s>
        </button>
      </div>
      ${S.i > 0 ? `<div class="orelse">
        или <button class="lnk" id="w-prev">возьмите повторите предыдущую тренировку</button>
      </div>` : ''}
    </div>`;
}

function renderDoc(){
  const d = day(), dt = new Date(d.date + 'T00:00:00');
  const n   = d.blocks.reduce((a,b)=>a+b.items.filter(x=>x.exId).length,0);
  const raw = d.blocks.reduce((a,b)=>a+b.items.filter(x=>!x.exId).length,0);
  const empty = !d.blocks.length;
  /* Полоса стоит вплотную над блоками, которыми управляет: заголовок и
     сообщение клиенту к разбору отношения не имеют, а блоки ниже — это
     ровно то, что она предлагает принять или отменить. */
  const propose = PENDING ? `<div class="propose">
      <span class="t"><b>${ICON.ai} Распознано ИИ</b><s>${pendingStat()}</s></span>
      <button class="lnk" id="pd-src">Показать исходник</button>
      <button class="btn gh" id="pd-no">Отменить</button>
      <button class="btn" id="pd-yes">Принять</button>
    </div>` : '';
  $('#doc').innerHTML = `
    <div class="doch">
      <span class="gr" title="Перетащить тренировку на другой день">${ICON.grip}</span>
      <input id="d-title" value="${esc(REST_TITLES.has(d.title) ? '' : (d.title||''))}"
             placeholder="${DOW[dowMon(day().date)]}, ${dt.getDate()} ${MON[dt.getMonth()]}">
      ${empty ? '' : `
        <span class="stat">${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')} · ${n} ${plural(n,'упражнение','упражнения','упражнений')}${raw?` · ${raw} остались текстом`:''}</span>
        <button class="x" id="sav-wo" title="Сохранить тренировку в библиотеку">${ICON.star}</button>
        <button class="x rm" id="clr-wo" title="Очистить день">${ICON.x}</button>`}
    </div>
    <div class="docacts">
      <button class="cp" id="fromTpl">${ICON.tpl} Из шаблона</button>
      <button class="cp" id="copyFrom">${ICON.copy} Скопировать существующую</button>
      <button class="cp" id="selStart">${ICON.chk} Выбрать несколько</button>
    </div>
    <label class="fld wmsg"><span class="k">${ICON.chat} Клиенту</span>
      <input id="w-msg" value="${esc(trainerMsg(d.date))}"
             placeholder="Сообщение ко всей тренировке — клиент увидит его первым">
      <kbd class="ent">↵ Enter</kbd>
    </label>
    ${propose}
    ${empty ? emptyDay()
      : PENDING ? ''    /* пока не принято, добавлять блоки рано */
      : `<button class="addb" id="add-blk">${ICON.plus} Добавить блок</button>`}
    ${d.blocks.map(blockHTML).join('')}`;
}

/* ─── панель источников: три уровня, которыми наполняют день ─── */
function renderSrc(){
  const q = norm(S.q), box = $('#src');
  if(S.tab === 'ex'){
    const list = EX.filter(e=>!q || norm(e.ru).includes(q) || norm(e.en).includes(q) ||
                              norm(e.eq).includes(q) || (ALIAS[e.id]||[]).some(a=>norm(a).includes(q)));
    const g = {}; list.forEach(e => (g[e.g] ||= []).push(e));
    box.innerHTML = Object.entries(g).map(([k,arr])=>`
      <div class="grpttl"><span class="lab">${esc(k)}</span><span class="ln"></span><span class="n">${arr.length}</span></div>
      ${arr.map(e=>`<div class="exc" draggable="true" data-ex="${e.id}">
        <span class="thumb ${e.m==='pending'?'pending':''}">${e.m==='ok'?esc(initials(e)):'·'}</span>
        <span class="body"><span class="nm">${esc(e.ru)}</span>
          <span class="en">${esc(e.en)} · ${esc(e.eq)}</span></span>
        <button class="add" data-addex="${e.id}" title="В открытый блок">${ICON.plus}</button>
      </div>`).join('')}`).join('') || '<div class="empty">Ничего не нашлось</div>';
    $('#railfoot').textContent = 'Всё это можно просто напечатать в строке — панель нужна, когда хочется посмотреть, что есть.';
  } else {
    const lvl = S.tab === 'blk' ? 'блок' : 'тренировка';
    TPL.filter(t=>t.lvl==='блок').forEach(fmtIntoTitle);   /* формат — в название */
    /* inline — записи, созданные ради ссылок внутри недели. Они не выбор
       тренера, а внутренняя кухня, и в источниках им не место. */
    const list = TPL.filter(t => t.lvl===lvl && !t.inline &&
      (!q || norm(t.title).includes(q) || norm(t.folder||'').includes(q)));
    box.innerHTML = list.map(t=>`
      <div class="tplc" draggable="true" data-tpl="${t.id}">
        <div class="h">
          <span class="nm">${esc(t.title)}</span>
          </div>
        <div class="ls">${lvl==='блок'
          ? t.items.map(i=>{ const e=byId(i[0]);
              const v = i[2] ? ` · ${i[2]}${i[3]==='%'?' %':' '+(i[3]||'')}` : '';
              return `<span>${esc(e.ru)}${i[1]?' — '+esc(i[1]):''}${esc(v)}</span>` }).join('')
          : (t.blocks||[]).map(id=>{ const b=tplById(id); return b?`<span>${esc(b.title)}</span>`:'' }).join('')}</div>
      </div>`).join('') || '<div class="empty">Пусто</div>';
    $('#railfoot').textContent = lvl === 'блок'
      ? 'Блок вставляется в открытую тренировку одним нажатием (CON-3).'
      : 'Шаблон тренировки занимает день целиком (TPL-3).';
  }
}
function render(){ renderStrip(); renderDoc(); renderSrc(); }

/* ═══════════ ИЗ ШАБЛОНА / КОПИЯ СУЩЕСТВУЮЩЕЙ ═══════════
   Две кнопки в строке дорожки. Составление «с нуля» отдельной кнопки не
   требует: пустой день уже есть, блоки накидываются из панели или текстом. */
function pickTemplate(){
  const list = TPL.filter(t=>t.lvl==='тренировка');
  openPick('Тренировка из шаблона', list.map(t=>`
    <button class="pk" data-tpl="${t.id}"><b>${esc(t.title)}</b>
      <s>${t.own?'своё':'общая база'} · ${tplStats(t).blocks} ${plural(tplStats(t).blocks,'блок','блока','блоков')}</s></button>`).join(''),
    el => { const t = tplById(el.dataset.tpl); const w = tplToWorkout(t); const d = day();
      d.title = w.title; d.rest = false; d.blocks = copyBlocks(w.blocks); render();
      toast('«' + t.title + '» вставлена в день ' + (S.i+1)); });
}

function pickExisting(){
  let srcId = S.cid;
  const draw = () => {
    const c = client(srcId); const days = c.prog ? planOf(c.prog).filter(x=>!x.rest) : [];
    return `
      <label class="pk-src"><span>Чья тренировка</span>
        <select id="pk-src">${CLIENTS.filter(x=>x.prog).map(x=>`<option value="${x.id}" ${x.id===srcId?'selected':''}>${esc(x.n)}${x.id===S.cid?' — этот клиент':''}</option>`).join('')}</select>
      </label>
      ${days.length ? days.map(x=>`<button class="pk" data-src="${c.id}" data-i="${x.i}"><b>${esc(x.title)}</b>
        <s>${x.w} ${dm(x.date)} · ${x.blocks.length} ${plural(x.blocks.length,'блок','блока','блоков')}</s></button>`).join('')
      : '<p class="warn">У клиента пока нет составленных тренировок.</p>'}`;
  };
  openPick('Скопировать тренировку', draw(), el => {
    const src = planOf(client(el.dataset.src).prog)[+el.dataset.i]; const d = day();
    d.title = src.title; d.rest = false; d.blocks = copyBlocks(src.blocks); render();
    toast('Скопировано: «' + src.title + '» → день ' + (S.i+1));
  }, wire);
  function wire(box){ box.querySelector('#pk-src').onchange = e => { srcId = e.target.value; box.querySelector('.mdb').innerHTML = draw(); wire(box) } }
}

/* Общая модалка выбора: список кнопок .pk, клик по одной — выбор. */
function openPick(title, body, onPick, after){
  const ov = document.createElement('div'); ov.className = 'ov on';
  ov.innerHTML = `<div class="md wmd"><div class="mdh"><span class="dot"></span><h2>${esc(title)}</h2>
    <button class="cls">✕</button></div><div class="mdb">${body}</div></div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => {
    const pk = e.target.closest('.pk');
    if(pk){ ov.remove(); onPick(pk); return }
    if(e.target === ov || e.target.closest('.cls')) ov.remove();
  });
  if(after) after(ov);
}

/* ─── разбор текста на лету (CON-1 + CON-5) ─── */
/* parseText разбирает МНОГО строк и возвращает массив записей вида
   {type:'ok', item, ex} | {type:'raw'} | {type:'fmt'}. Здесь строка всегда
   одна, поэтому берём первую запись и отдаём готовый item — иначе легко
   обратиться к массиву как к объекту, и разбор молча перестанет работать. */
function parseLine(text){
  const r = parseText(String(text||'').trim())[0];
  return r && r.type === 'ok' ? r.item : null;
}

/* ═══════════ ТЕКСТ → СТРУКТУРА (CON-5) ═══════════
   Набор одной строки и вставка двадцати — одна и та же операция, разного
   объёма. Поэтому отдельного режима «вставить текст» нет: одна поверхность
   принимает и то и другое, а порог простой — есть перевод строки, значит
   есть что показать на подтверждение.

   Подтверждение здесь не вежливость, а требование корректности. Регулярка
   ошибается предсказуемо: не узнала — оставила текстом, видно сразу. Модель
   ошибается правдоподобно: подставит похожее упражнение или не туда разобьёт
   блоки, и выглядеть это будет как успех. Молча применять такое к программе
   тренера нельзя — готовое не перечитывают.

   Распознавание двухэтапное. Регулярки отрабатывают мгновенно и покрывают
   обычную нотацию. Модель подключается только к остатку — группировке и
   разговорным строкам, — чтобы тренер видел, как большая часть разбирается
   сразу, а не ждал пустой экран. */

/* Строка-заголовок: короткая, без чисел, не упражнение. «Разминка»,
   «Силовая часть», «Комплекс:». Границей блока служит и пустая строка. */
const isHeader = L => L.length <= 42 && (/:$/.test(L) || !/\d/.test(L));

function textToBlocks(text){
  const blocks = [];
  let cur = null;
  const open = title => { cur = {title: title || '', items: [], src: []}; blocks.push(cur) };
  for(const line of String(text).split('\n')){
    const L = line.trim();
    if(!L){ cur = null; continue }                       /* пустая строка — граница */
    if(fmtPart(L) || isHeader(L)){ open(L.replace(/:$/,'')); cur.src.push(L); continue }
    if(!cur) open('');
    const parsed = parseLine(L);
    cur.items.push(parsed || rawItem(L));
    cur.src.push(L);
  }
  return blocks.filter(b => b.items.length);
}

/* ЗДЕСЬ будет модель. На вход — строки, которые регулярки не разобрали,
   и предварительная разбивка на блоки; на выход — уточнённая структура.
   Пока возвращаем как есть: поток и подтверждение от этого не зависят. */
async function aiRefine(blocks /*, source */){ return blocks }

let PENDING = null;   /* {ids:Set, snapshot, source} — предложение до принятия */

async function applyText(text){
  const parsed = textToBlocks(text);
  if(!parsed.length) return;
  const d = day();
  if(REST_TITLES.has(d.title)) d.title = '';
  const snapshot = {title: d.title, blocks: d.blocks.slice()};
  const refined = await aiRefine(parsed, text);
  const made = refined.map(b => blockOf(b.title, b.items));
  d.blocks = d.blocks.concat(made);
  PENDING = {ids: new Set(made.map(b=>b.id)), snapshot, source: text};
  S.compose = null;
  render();
}
/* Убрать тренировку — не диалог «вы уверены?», а отмена. Подтверждения
   прокликивают не читая; возврат работает даже когда ошибся всерьёз.
   Снимок — тот же приём, что у разбора текста. */
/* Очистка — единственное здесь необратимое по смыслу действие: тренировка
   исчезает из дня, а не переезжает. Поэтому спрашиваем, но объясняем ЧТО
   именно сотрётся и что останется нетронутым — «вы уверены?» без предмета
   прокликивают не читая. Возврат в тосте оставлен как страховка. */
function askClear(){
  const d = day();
  if(!d.blocks.length) return;
  const dt = new Date(d.date + 'T00:00:00');
  const n = d.blocks.reduce((a,b)=>a+b.items.filter(i=>i.exId).length, 0);
  const ov = document.createElement('div');
  ov.className = 'ov on';
  ov.innerHTML = `<div class="md ask">
    <div class="mdh"><span class="dot"></span><h2>Очистить день</h2>
      <button class="cls">✕</button></div>
    <div class="mdb">
      <p class="lead">Тренировка <b>«${esc(d.title || 'без названия')}»</b> будет стёрта
        из ${DOW_GEN[dowMon(day().date)]}, ${dt.getDate()} ${MON[dt.getMonth()]}.</p>
      <p class="sub">${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')} ·
        ${n} ${plural(n,'упражнение','упражнения','упражнений')} — всё вместе с заметками.</p>
      <div class="foot-note">Программа и остальные дни не изменятся. Если тренировка
        пригодится дальше — закройте это окно и сначала нажмите «Сохранить».</div>
    </div>
    <div class="mdf"><span class="sp"></span>
      <button class="btn gh cls">Отмена</button>
      <button class="btn rm" id="ask-ok">Очистить</button></div>
  </div>`;
  ov.addEventListener('click', e=>{
    if(e.target === ov || e.target.closest('.cls')){ ov.remove(); return }
    if(e.target.closest('#ask-ok')){ ov.remove(); clearDay() }
  });
  document.body.appendChild(ov);
}
function clearDay(){
  const d = day();
  if(!d.blocks.length) return;
  const snap = {title: d.title, blocks: d.blocks};
  d.title = ''; d.blocks = [];
  PENDING = null; S.compose = null;
  render();
  toast('День очищен', 'Вернуть', ()=>{
    const cur = day();
    cur.title = snap.title; cur.blocks = snap.blocks;
    render();
  });
}

function acceptPending(){
  if(!PENDING) return;
  const n = PENDING.ids.size;
  PENDING = null; render();
  toast('Принято · ' + n + ' ' + plural(n,'блок','блока','блоков'));
}
function cancelPending(){
  if(!PENDING) return;
  const d = day();
  d.title = PENDING.snapshot.title; d.blocks = PENDING.snapshot.blocks;
  /* Отменил — возвращаем текст, а не пустой экран: скорее всего он хочет
     поправить исходник и попробовать снова, а не начинать заново. */
  const src = PENDING.source;
  PENDING = null;
  if(!d.blocks.length){ S.compose = 'text'; render(); const t = $('#paste'); if(t) t.value = src }
  else render();
}
function showSource(){
  if(!PENDING) return;
  const box = document.createElement('div');
  box.className = 'ov on srcov';
  box.innerHTML = `<div class="md"><div class="mdh"><span class="dot"></span>
      <h2>Что вы вставили</h2><button class="cls">✕</button></div>
    <div class="mdb"><pre class="src">${esc(PENDING.source)}</pre></div></div>`;
  box.addEventListener('click', e=>{
    if(e.target === box || e.target.closest('.cls')) box.remove();
  });
  document.body.appendChild(box);
}
/* Сводка по предложению: сколько разобралось и сколько осталось текстом. */
function pendingStat(){
  const bs = day().blocks.filter(b=>PENDING.ids.has(b.id));
  const items = bs.flatMap(b=>b.items);
  const raw = items.filter(i=>!i.exId).length;
  return bs.length + ' ' + plural(bs.length,'блок','блока','блоков') + ' · ' +
    items.length + ' ' + plural(items.length,'упражнение','упражнения','упражнений') +
    (raw ? ' · ' + raw + ' ' + plural(raw,'строка осталась','строки остались','строк остались') + ' текстом' : '');
}

let SUG = null;
const closeSug = () => { if(SUG){ SUG.remove(); SUG = null } };
function showSug(el, text){
  closeSug();
  const t = (text||'').trim(); if(!t) return;
  const p = parseLine(t), first = norm(t.split(/\s+/)[0]);
  const cands = EX.filter(e => norm(e.ru).includes(first) || norm(e.en).includes(first))
                  .filter(e => !p || e.id !== p.exId).slice(0,5);
  const box = document.createElement('div');
  box.className = 'sug';
  const r = el.getBoundingClientRect();
  box.style.left = r.left + 'px';
  box.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  box.innerHTML =
    (p
      ? `<div class="cap">Разобрано</div>
         <button class="row on" data-pick="${p.exId}"><b>${esc(byId(p.exId).ru)}</b>
           <s>${esc([p.scheme, p.pct?fmtN(p.pct)+' %':(p.val?p.val+' '+p.unit:'')].filter(Boolean).join(' '))}</s></button>`
      : '<div class="cap">Пока текстом — выберите из базы</div>') +
    (cands.length ? '<div class="cap">Из базы</div>' + cands.map(e=>
      `<button class="row" data-pick="${e.id}"><b>${esc(e.ru)}</b><s>${esc(e.g)}</s></button>`).join('') : '');
  document.body.appendChild(box);
  SUG = box;
}
const findItem = id => {
  for(const b of day().blocks){ const i = b.items.find(x=>x.id===id); if(i) return {b,i} }
  return {};
};
function commitLine(id, text){
  const {i} = findItem(id); if(!i) return;
  const p = parseLine(text);
  if(p) Object.assign(i, {exId:p.exId, scheme:p.scheme||'', pct:p.pct??null,
                          unit:p.unit||'', val:p.val||'', raw:''});
  else { i.exId = null; i.raw = (text||'').trim() }
  render();
}

/* ─── проценты от ПМ (CON-16): сразу с весом под каждым ─── */
const PCTS = [60,65,70,75,80,85,90,95];
function openPct(btn){
  closeSug();
  const {i} = findItem(btn.dataset.pct);
  const box = document.createElement('div');
  box.className = 'sug';
  const r = btn.getBoundingClientRect();
  box.style.left = Math.max(12, r.right - 290) + 'px';
  box.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  box.innerHTML = '<div class="cap">Процент от максимума</div>' +
    PCTS.map(p=>`<button class="row" data-setpct="${p}"><b>${p} %</b>
      <s>${fmtN(workKg({...i, pct:p}, PM()))} кг</s></button>`).join('') +
    '<div class="ok"><button class="row" data-setpct="0"><b>Убрать процент</b></button></div>';
  document.body.appendChild(box); SUG = box;
  box.addEventListener('click', ev=>{
    const s = ev.target.closest('[data-setpct]'); if(!s) return;
    i.pct = +s.dataset.setpct || null; closeSug(); render();
  });
}

/* ─── вставка из панели источников ─── */
const lastBlock = () => {
  const d = day();
  if(!d.blocks.length) d.blocks.push(mkBlock('strength','Новый блок','',null,[]));
  return d.blocks[d.blocks.length-1];
};
/* Из панели упражнение падает в последний блок дня. Куда именно — не
   очевидно, поэтому подсвечиваем добавленное и подкручиваем к нему:
   лучше показать результат, чем объяснять его тостом. */
function flash(id){
  const el = $(`[data-item="${id}"]`) || $(`[data-blk="${id}"]`);
  if(!el) return;
  el.classList.add('just');
  el.scrollIntoView({block:'nearest', behavior:'smooth'});
  setTimeout(()=>el.classList.remove('just'), 900);
}
function addEx(exId){
  const it = mkItem(exId, '', null, null, '');
  lastBlock().items.push(it);
  render(); flash(it.id);
}
/* ═══════════ СОХРАНЕНИЕ В ШАБЛОНЫ (TPL-1, TPL-3) ═══════════
   Тренировка живёт внутри программы и привязана к дате. Шаблон — отдельная
   заготовка в библиотеке. Одно из другого не следует: чтобы переиспользовать
   удачный день, его надо явно положить в библиотеку.

   Шаблон тренировки ссылается на шаблоны блоков (так устроен tplToWorkout),
   поэтому сохранение дня кладёт в библиотеку и блоки — заодно они становятся
   доступны поодиночке, чего TPL-1 и хочет. */
const FOLDER_OF = b => fmtPart(b.title) ? 'Комплексы'
  : b.items.some(i => i.pct != null || i.unit === 'кг') ? 'Силовые блоки'
  : /заминк|растяж|заверш/i.test(b.title) ? 'Заминки' : 'Разминки';

function blockToTpl(b, folder){
  const t = {
    id: nid('t'), lvl:'блок', folder: folder || FOLDER_OF(b), used: 0,
    title: b.title || 'Блок без названия', fmt: fmtPart(b.title) || null,
    items: b.items.filter(i=>i.exId).map(i =>
      i.pct != null ? [i.exId, i.scheme||'', i.pct, '%']
                    : [i.exId, i.scheme||'', i.val||'', i.unit||'']),
  };
  TPL.unshift(t);
  return t.id;
}
function saveBlock(id, folder){
  const b = day().blocks.find(x=>x.id===id);
  if(!b || !b.items.some(i=>i.exId)) return toast('В пустом блоке нечего сохранять');
  blockToTpl(b, folder);
  toast('Блок «' + (b.title||'без названия') + '» — в папке «' + folder + '»');
  renderSrc();
}
function saveWorkout(){
  const d = day();
  const blocks = d.blocks.filter(b=>b.items.some(i=>i.exId));
  if(!blocks.length) return toast('В этом дне нечего сохранять');
  const ids = blocks.map(b => blockToTpl(b));
  TPL.unshift({id:nid('t'), lvl:'тренировка', used:0,
               title: d.title || 'Тренировка без названия', blocks: ids});
  toast('Тренировка и ' + blocks.length + ' ' +
        plural(blocks.length,'блок','блока','блоков') + ' — в библиотеке');
  renderSrc();
}
/* Папка блока — требование TPL-1. Предлагаем по содержимому, но выбор
   оставляем тренеру: «Разминка перед приседом» может лежать и там и там. */
function openFolder(btn){
  closeSug();
  const id = btn.dataset.savblk;
  const b = day().blocks.find(x=>x.id===id);
  const guess = FOLDER_OF(b);
  const box = document.createElement('div');
  box.className = 'sug';
  const r = btn.getBoundingClientRect();
  box.style.left = Math.max(12, r.right - 250) + 'px';
  box.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  box.innerHTML = '<div class="cap">Сохранить блок в папку</div>' +
    TPL_FOLDERS.map(f=>`<button class="row ${f===guess?'on':''}" data-folder="${esc(f)}">
      <b>${esc(f)}</b>${f===guess?'<s>подходит</s>':''}</button>`).join('');
  document.body.appendChild(box); SUG = box;
  box.addEventListener('click', ev=>{
    const f = ev.target.closest('[data-folder]'); if(!f) return;
    closeSug(); saveBlock(id, f.dataset.folder);
  });
}
/* Короткое подтверждение: действие незаметное, без него непонятно,
   случилось ли что-нибудь. */
let TOAST = null;
function toast(text, actionLabel, onAction){
  if(TOAST) TOAST.remove();
  TOAST = document.createElement('div');
  TOAST.className = 'toast';
  TOAST.innerHTML = `<span>${esc(text)}</span>` +
    (actionLabel ? `<button class="undo">${esc(actionLabel)}</button>` : '');
  if(onAction) TOAST.querySelector('.undo').addEventListener('click', ()=>{
    onAction(); const t = TOAST; TOAST = null; if(t) t.remove();
  });
  document.body.appendChild(TOAST);
  requestAnimationFrame(()=>TOAST.classList.add('on'));
  const life = actionLabel ? 6000 : 2600;   /* на отмену нужно успеть подумать */
  setTimeout(()=>{ const t = TOAST; if(!t) return; t.classList.remove('on');
                   setTimeout(()=>t.remove(), 260); TOAST = null }, life);
}

function addTplRaw(t){
  const d = day();
  if(t.lvl === 'блок'){
    d.blocks.push(blockOf(t.title, t.items.map(tplLine), '', t.kind));
  } else {
    const w = tplToWorkout(t);
    d.title = w.title || d.title; d.blocks = w.blocks;
  }
}
const addTpl = t => {
  addTplRaw(t); render();
  const last = day().blocks[day().blocks.length-1];
  if(last) flash(last.id);
};
/* CON-4 — «копирование предыдущей недели как основа новой»: неделя целиком,
   а не открытый день. Копия глубокая, иначе правки поедут в обе недели. */
const copyBlocks = bs => bs.map(b =>
  blockOf(b.title, b.items.map(i => ({...i, id:nid('i')})), b.note, b.kind));
/* ═══════════ ПРОИЗВОЛЬНЫЙ НАБОР ТРЕНИРОВОК (CON-4, CON-14) ═══════════
   Копия недели была частным случаем: отметить семь подряд и вставить семью
   днями позже. Здесь набор произвольный — подряд или вразбивку. */

const hasWork = d => d.blocks.some(b=>b.items.some(i=>i.exId));

function toggleSel(i){
  if(!hasWork(plan()[i])) return toast('В этом дне нечего копировать');
  S.sel.has(i) ? S.sel.delete(i) : S.sel.add(i);
  render();
}

function startPaste(mode){
  if(!S.sel || !S.sel.size) return toast('Сначала отметьте тренировки');
  S.paste = mode; render();
  toast(mode==='copy' ? 'Куда скопировать? Выберите день' : 'Куда перенести? Выберите день');
}

/* Относительные промежутки сохраняются: отметили 1-й, 3-й и 6-й дни, вставили
   с 10-го — лягут на 10-й, 12-й и 15-й. Так «копия недели» остаётся частным
   случаем, а ритм набора не ломается. */
function pasteAt(target){
  const src = [...S.sel].sort((a,b)=>a-b), base = src[0];
  const need = target + (src[src.length-1] - base);
  if(need >= program(S.pid).days) return toast('Набор не влезает до конца программы');
  extendPlan(need);
  const snap = src.map(i=>({off:i-base, title:plan()[i].title, blocks:copyBlocks(plan()[i].blocks)}));
  const move = S.paste === 'move';
  if(move) src.forEach(i=>{ const x=plan()[i]; x.title=''; x.rest=true; x.blocks=[] });
  snap.forEach(x=>{
    const t = plan()[target + x.off];
    t.title = x.title; t.rest = false; t.blocks = x.blocks;
  });
  const n = snap.length;
  S.sel = null; S.paste = null; S.i = target; render();
  toast((move?'Перенесено ':'Скопировано ') + n + ' ' +
        plural(n,'тренировка','тренировки','тренировок') + ' с дня ' + (target+1));
}

/* Продлеваем план до индекса включительно, дописывая пустые дни.
   Именно дописываем, а не пересобираем через buildPlan: пересборка создаёт
   новые объекты дней и стирает всё, что тренер уже наредактировал в
   остальных днях и ещё не сохранил. Первая версия делала ровно это и вдобавок
   зависала: длина проверялась у старого массива и не менялась никогда. */
function extendPlan(upto){
  while(plan().length <= upto){
    const i = plan().length;
    PLAN[S.pid].push(null);
    plan().push(buildDay(S.pid, i));
  }
}

/* Продление плана: день добавляется в конец, и это единственный способ
   расти — решётки, которую можно «открыть на неделю вперёд», больше нет. */
function addDay(){
  const p = program(S.pid);
  if(plan().length >= p.days) return toast('План уже составлен до конца программы');
  extendPlan(plan().length);
  S.i = plan().length - 1; S.compose = null; render();
  toast('День ' + (S.i+1) + ' добавлен');
}

/* Повтор предыдущей тренировки вместо копии целой недели. Недели нет, и
   копировать «семь дней назад» стало нечем: тренер повторяет нужный день. */
function repeatPrev(){
  const d = plan();
  let j = -1;
  for(let k=S.i-1; k>=0; k--){ if(d[k].blocks.some(b=>b.items.some(i=>i.exId))){ j=k; break } }
  if(j < 0) return toast('Раньше в плане нет ни одной тренировки');
  const src = d[j], cur = d[S.i];
  cur.title  = src.title;
  cur.rest   = false;
  cur.blocks = copyBlocks(src.blocks);
  S.compose = null; render();
  const n = cur.blocks.reduce((a,b)=>a+b.items.filter(i=>i.exId).length,0);
  toast('День ' + (j+1) + ' повторён · ' + n + ' ' + plural(n,'упражнение','упражнения','упражнений'));
}

/* ═══════════ НЕДЕЛЯ В ШАБЛОНЫ (TPL-2) ═══════════
   Сохранение недели порождает три уровня сразу: неделя → тренировки →
   блоки. Если складывать всё подряд, библиотека за три недели превращается
   в свалку из тёзок. Поэтому сверяем по СОСТАВУ: что уже есть — на то
   ссылаемся, копий не плодим.

   Новое тренер решает сам одной галочкой. Но неделя в модели ссылается на
   шаблоны тренировок, а те — на блоки, поэтому создать их придётся в любом
   случае. Разница в метке inline: с ней запись обслуживает только свою
   неделю и в панель источников не попадает. */
const sigItems = items => (items||[])
  .filter(i => i.exId)
  .map(i => `${i.exId}|${i.scheme||''}|${i.pct??''}|${i.val||''}`).join(';');
/* Элементы шаблона хранятся массивами [ex, scheme, val, unit] — приводим
   к той же форме, иначе одинаковые блоки не совпадут. */
const sigTplItems = items => (items||[])
  .map(i => `${i[0]}|${i[1]||''}|${i[3]==='%'?i[2]:''}|${i[3]==='%'?'':(i[2]??'')}`).join(';');
const sigBlock  = b => sigItems(b.items);
const sigTplBlk = t => sigTplItems(t.items);
const sigDay    = d => d.blocks.filter(b=>b.items.some(i=>i.exId)).map(sigBlock).join('§');
const sigTplWo  = t => (t.blocks||[]).map(id => { const b = tplById(id); return b ? sigTplBlk(b) : '' }).join('§');

/* Что из недели уже лежит в библиотеке, а чего там нет. */
/* Недельные аудит, сохранение и раскладка удалены вместе с сущностью недели.
   День сохраняется как шаблон тренировки через saveWorkout(), а вставляется
   из панели источников — второго механизма под это больше не нужно. */

function tplLabel(t){
  const st = tplStats(t);
  if(t.lvl==='программа')  return st.days + ' ' + plural(st.days,'день','дня','дней');
  if(t.lvl==='неделя')     return st.days  + ' ' + plural(st.days,'день','дня','дней') +
                                  ' · ' + st.n + ' упр';
  if(t.lvl==='тренировка') return st.blocks + ' ' + plural(st.blocks,'блок','блока','блоков');
  return st.n + ' ' + plural(st.n,'упражнение','упражнения','упражнений');
}

/* Шаблон недели раскладывается по семи дням; null — день отдыха (TPL-2). */
/* ═══════════ СЛОЙ ВЗАИМОДЕЙСТВИЯ ═══════════
   Клики, клавиатура и drag-and-drop конструктора. Восстановлен после того,
   как был вырезан вместе с недельными функциями: они лежали в одном диапазоне
   файла, и удаление по границам функций захватило и его. */
document.addEventListener('click', e=>{
  const d = e.target.closest('[data-day]');
  if(d){
    const i = +d.dataset.day;
    /* В режиме выбора клик по дню не переключает день, а отмечает его:
       иначе набор нельзя собрать, не потеряв уже отмеченное. */
    if(S.sel){ if(i < plan().length) toggleSel(i); return }
    if(S.paste){ pasteAt(i); return }
    extendPlan(i);
    S.i = i; S.compose = null; closeSug(); render(); return;
  }
  if(e.target.closest('#dayPrev')){ S.i = Math.max(0, S.i-1); S.compose = null; render(); return }
  if(e.target.closest('#dayNext')){ const i = Math.min(program(S.pid).days-1, S.i+1); extendPlan(i); S.i = i; S.compose = null; render(); return }
  if(e.target.closest('#fromTpl')){ pickTemplate(); return }
  if(e.target.closest('#copyFrom')){ pickExisting(); return }
  if(e.target.closest('#selStart')){ S.sel = new Set(); S.paste = null; render(); return }
  if(e.target.closest('#selCancel')){ S.sel = null; S.paste = null; render(); return }
  if(e.target.closest('#selCopy')){ startPaste('copy'); return }
  if(e.target.closest('#selMove')){ startPaste('move'); return }

  const tb = e.target.closest('[data-tab]');
  if(tb){ S.tab = tb.dataset.tab;
          $$('#tabs button').forEach(x=>x.classList.toggle('on', x===tb)); renderSrc(); return }

  /* Кликается вся карточка, а не только «+»: маленькая кнопка была
     единственным способом добавить, и по ней приходилось целиться. */
  const ae = e.target.closest('[data-ex]');  if(ae){ addEx(ae.dataset.ex); return }
  const at = e.target.closest('[data-tpl]'); if(at){ addTpl(tplById(at.dataset.tpl)); return }

  const add = e.target.closest('[data-add]');
  if(add){
    const b = day().blocks.find(x=>x.id===add.dataset.add);
    b.items.push(rawItem('')); render();
    const last = $$(`[data-blk="${b.id}"] [data-edit]`).pop(); if(last) last.focus();
    return;
  }
  if(e.target.closest('#w-hand')){
    day().blocks.unshift(blockOf('', []));
    S.compose = null; render();
    const t = $('.blk .bt'); if(t) t.focus();
    return;
  }
  if(e.target.closest('#w-ai')){ S.compose = 'text'; render(); $('#paste').focus(); return }
  if(e.target.closest('#pt-back')){ S.compose = null; render(); return }
  if(e.target.closest('#pt-go')){ applyText($('#paste').value); return }
  if(e.target.closest('#w-prev')){ copyPrev(); return }
  if(e.target.closest('#pd-yes')){ acceptPending(); return }
  if(e.target.closest('#pd-no')){  cancelPending(); return }
  if(e.target.closest('#pd-src')){ showSource();   return }
  if(e.target.closest('#sav-wo')){ saveWorkout(); return }
  if(e.target.closest('#clr-wo')){ askClear(); return }
  const sb = e.target.closest('[data-savblk]');
  if(sb){ openFolder(sb); return }
  if(e.target.closest('#add-blk')){
    /* Кнопка стоит сверху — значит и блок появляется сверху, под курсором,
       а не улетает в конец длинного дня. */
    day().blocks.unshift(mkBlock('strength','','',null,[]));
    render();
    const t = document.querySelector('.blk .bt'); if(t) t.focus();
    return;
  }
  const db = e.target.closest('[data-delblk]');
  if(db){ const d2 = day(); d2.blocks = d2.blocks.filter(b=>b.id!==db.dataset.delblk); render(); return }
  const dl = e.target.closest('[data-del]');
  if(dl){ const {b} = findItem(dl.dataset.del); b.items = b.items.filter(x=>x.id!==dl.dataset.del); render(); return }
  const pc = e.target.closest('[data-pct]'); if(pc){ openPct(pc); return }
  const pf = e.target.closest('[data-pickfor]');
  if(pf){ const {i} = findItem(pf.dataset.pickfor);
          showSug(pf, i.raw || '');
          if(SUG){ SUG.dataset.forItem = pf.dataset.pickfor; SUG.dataset.text = i.raw || '' }
          return; }

  const pick = e.target.closest('[data-pick]');
  if(pick && SUG){
    const {i} = findItem(SUG.dataset.forItem);
    if(i){ const cur = parseLine(SUG.dataset.text) || {};
           Object.assign(i, {exId:pick.dataset.pick, scheme:cur.scheme||'', pct:cur.pct??null,
                             unit:cur.unit||'', val:cur.val||'', raw:''}) }
    closeSug(); render(); return;
  }
  if(e.target.closest('#md-cancel') || e.target.closest('#md-x') ||
     e.target === $('#ov') || e.target.closest('#md-ok')){
    $('#ov').classList.remove('on'); return }
  const cl = e.target.closest('[data-cl]');
  if(cl){ const id = cl.dataset.cl;
          PICK.has(id) ? PICK.delete(id) : PICK.add(id);
          cl.classList.toggle('on', PICK.has(id)); paintPick(); return }
  if(e.target.closest('#md-all')){
    PICK = PICK.size === CLIENTS.length ? new Set() : new Set(CLIENTS.map(c=>c.id));
    $$('.md .cl').forEach(x=>x.classList.toggle('on', PICK.has(x.dataset.cl)));
    paintPick(); return;
  }
  if(!e.target.closest('.sug')) closeSug();
});

/* Вставка многострочного текста — куда бы её ни сделали. Одна строка
   проходит обычным путём, без подтверждения: там нечего проверять. */
document.addEventListener('paste', e=>{
  const t = (e.clipboardData || window.clipboardData).getData('text') || '';
  if(!/\n/.test(t.trim())) return;
  const into = e.target.closest('#paste, [data-edit]');
  if(!into) return;
  e.preventDefault();
  closeSug();
  applyText(t);
});
/* В пустом дне то же поле работает и на набор: Ctrl/⌘+Enter разбирает. */
document.addEventListener('keydown', e=>{
  if(e.target.id === 'paste' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)){
    e.preventDefault(); applyText(e.target.value);
  }
});

document.addEventListener('input', e=>{
  const ed = e.target.closest('[data-edit]');
  if(ed){
    ed.closest('.line').classList.add('edit');
    showSug(ed, ed.textContent);
    if(SUG){ SUG.dataset.forItem = ed.dataset.edit; SUG.dataset.text = ed.textContent }
    return;
  }
  const f = e.target.closest('[data-f]');
  if(f){
    const b = day().blocks.find(x=>x.id === f.closest('[data-blk]').dataset.blk);
    b[f.dataset.f] = f.value;
    if(f.dataset.f === 'title'){
      /* Формат — не отдельное поле, а то, что парсер нашёл в названии
         (TMR-1). Пересобираем на лету и сразу показываем расшифровку. */
      b.fmt = fmtPart(f.value);
      renderWeek();
    }
    return;
  }
  if(e.target.id === 'd-title'){ day().title = e.target.value; renderWeek(); return }
  if(e.target.id === 'w-msg'){ setTrainerMsg(day().date, e.target.value); return }
  if(e.target.id === 'q'){ S.q = e.target.value; renderSrc(); return }
});
document.addEventListener('change', e=>{
  if(e.target.id === 'cli'){
    /* Смена клиента — это смена плана: у каждого своя программа. Дату держим,
       чтобы тренер не терял место, где стоял. */
    const date = plan()[S.i].date;
    if(!bindClient(e.target.value, date)) { toast('У клиента нет программы или дата вне её'); return }
    render();
  }
});
document.addEventListener('keydown', e=>{
  const ed = e.target.closest('[data-edit]');
  if(e.target.id === 'w-msg' && e.key === 'Enter'){
    /* Поле пишет в модель на каждый символ, так что Enter ничего не «сохраняет».
       Но тренеру нужен сигнал, что он закончил мысль, — Enter снимает фокус
       и подтверждает галочкой. Подсказка висит только пока поле активно. */
    e.preventDefault();
    const k = e.target.closest('.wmsg').querySelector('.ent');
    k.textContent = '✓ Записано'; k.classList.add('done');
    e.target.blur();
    setTimeout(()=>{ k.textContent = '↵ Enter'; k.classList.remove('done') }, 1400);
    return;
  }
  if(ed && e.key === 'Enter'){ e.preventDefault();
    const id = ed.dataset.edit, txt = ed.textContent; closeSug(); commitLine(id, txt); return }
  if(e.key === 'Escape'){ closeSug(); $('#ov').classList.remove('on') }
});
document.addEventListener('focusout', e=>{
  const ed = e.target.closest('[data-edit]');
  if(ed) setTimeout(()=>{ if(!SUG) commitLine(ed.dataset.edit, ed.textContent) }, 120);
});

/* ═══════════ ПЕРЕТАСКИВАНИЕ (CON-8, CON-13) ═══════════
   Три уровня, одна механика: упражнение таскается между блоками, блок —
   между блоками и на другой день, тренировка целиком — только на день.
   Тащить можно лишь за ручку: строка редактируемая, и если сделать
   draggable всю, в ней перестанет выделяться текст. Поэтому draggable
   включается по нажатию на ручку и снимается по окончании. */
let DRAG = null;
const dayOf = i => plan()[i];

document.addEventListener('mousedown', e=>{
  const gr = e.target.closest('.gr'); if(!gr) return;
  const host = gr.closest('.line') || gr.closest('.blk') || gr.closest('.doc');
  if(host) host.draggable = true;
});

function clearDrag(){
  DRAG = null;
  $$('[draggable="true"]').forEach(x=>x.draggable = false);
  $$('.over,.dropafter,.dropbefore,.dayover').forEach(x=>
    x.classList.remove('over','dropafter','dropbefore','dayover'));
}
document.addEventListener('dragstart', e=>{
  const rail = e.target.closest('[data-ex],[data-tpl]');
  if(rail){ DRAG = rail.dataset.ex ? {t:'ex', v:rail.dataset.ex} : {t:'tpl', v:rail.dataset.tpl};
            e.dataTransfer.effectAllowed = 'copy'; return }
  const line = e.target.closest('.line');
  if(line && line.draggable){ DRAG = {t:'line', v:line.dataset.item}; return }
  const blk = e.target.closest('.blk');
  if(blk && blk.draggable){ DRAG = {t:'block', v:blk.dataset.blk}; return }
  const doc = e.target.closest('.doc');
  if(doc && doc.draggable){ DRAG = {t:'workout', v:S.i}; return }
  e.preventDefault();
});
document.addEventListener('dragover', e=>{
  if(!DRAG) return;
  e.preventDefault();
  $$('.over,.dropafter,.dropbefore,.dayover').forEach(x=>
    x.classList.remove('over','dropafter','dropbefore','dayover'));
  const d = e.target.closest('.day');
  if(d && DRAG.t !== 'ex'){ d.classList.add('dayover'); return }
  if(DRAG.t === 'workout') return;
  const line = e.target.closest('.line');
  if(line && DRAG.t !== 'block'){
    const r = line.getBoundingClientRect();
    line.classList.add(e.clientY < r.top + r.height/2 ? 'dropbefore' : 'dropafter');
    return;
  }
  const blk = e.target.closest('.blk');
  if(blk){
    if(DRAG.t === 'block'){
      const r = blk.getBoundingClientRect();
      blk.classList.add(e.clientY < r.top + r.height/2 ? 'dropbefore' : 'dropafter');
    } else blk.classList.add('over');
  }
});
document.addEventListener('drop', e=>{
  if(!DRAG) return;
  e.preventDefault();
  const d = e.target.closest('.day');
  if(d && DRAG.t !== 'ex'){ dropOnDay(+d.dataset.day); return }
  if(DRAG.t === 'ex' || DRAG.t === 'tpl'){ dropFromRail(e); return }
  if(DRAG.t === 'line')  { dropLine(e);  return }
  if(DRAG.t === 'block') { dropBlock(e); return }
  clearDrag();
});
document.addEventListener('dragend', clearDrag);

function dropFromRail(e){
  const blk = e.target.closest('.blk');
  if(DRAG.t === 'ex'){
    const b = blk ? day().blocks.find(x=>x.id===blk.dataset.blk) : lastBlock();
    b.items.push(mkItem(DRAG.v, '', null, null, ''));
  } else addTplRaw(tplById(DRAG.v));
  clearDrag(); render();
}
/* Упражнение переезжает в тот блок, над строкой которого его отпустили. */
function dropLine(e){
  const {b:from, i:item} = findItem(DRAG.v);
  const onLine = e.target.closest('.line'), onBlk = e.target.closest('.blk');
  if(!onBlk){ clearDrag(); return }
  const to = day().blocks.find(x=>x.id===onBlk.dataset.blk);
  from.items.splice(from.items.indexOf(item), 1);
  if(onLine && onLine.dataset.item !== DRAG.v){
    const r = onLine.getBoundingClientRect();
    const at = to.items.findIndex(x=>x.id===onLine.dataset.item);
    to.items.splice(e.clientY < r.top + r.height/2 ? at : at+1, 0, item);
  } else to.items.push(item);
  clearDrag(); render();
}
function dropBlock(e){
  const onBlk = e.target.closest('.blk');
  if(!onBlk || onBlk.dataset.blk === DRAG.v){ clearDrag(); return }
  const d = day(), from = d.blocks.findIndex(x=>x.id===DRAG.v);
  const [blk] = d.blocks.splice(from, 1);
  const r = onBlk.getBoundingClientRect();
  const at = d.blocks.findIndex(x=>x.id===onBlk.dataset.blk);
  d.blocks.splice(e.clientY < r.top + r.height/2 ? at : at+1, 0, blk);
  clearDrag(); render();
}
/* Перенос на другой день (CON-13). После переноса открываем тот день,
   куда положили: иначе тренер не увидит результата своего действия. */
function dropOnDay(idx){
  if(idx === S.i && DRAG.t !== 'line'){ clearDrag(); return }
  const src = day(), dst = dayOf(idx);
  if(DRAG.t === 'workout'){
    dst.title = src.title; dst.blocks = src.blocks;
    src.title = ''; src.blocks = [];
  }
  else if(DRAG.t === 'block'){
    const at = src.blocks.findIndex(x=>x.id===DRAG.v);
    const [blk] = src.blocks.splice(at, 1);
    dst.blocks.push(blk);
  }
  else if(DRAG.t === 'line'){
    const {b:from, i:item} = findItem(DRAG.v);
    if(!dst.blocks.length) dst.blocks.push(mkBlock('strength','Новый блок','',null,[]));
    from.items.splice(from.items.indexOf(item), 1);
    dst.blocks[dst.blocks.length-1].items.push(item);
  }
  else if(DRAG.t === 'tpl'){ S.i = idx; addTplRaw(tplById(DRAG.v)) }
  clearDrag();
  S.i = idx;
  render();
}

/* назначение (CON-9) */
/* Назначают обычно не одному: группа делает одну тренировку, проценты у
   каждого свои. Поэтому выбор множественный, а рядом с именем сразу видны
   максимумы — по ним понятно, во что превратятся проценты (CON-16). */
let PICK = new Set();
/* Какой максимум показать справа: тот, от которого считается эта тренировка. */
function mainPm(d){
  const ids = d.blocks.flatMap(b=>b.items).filter(i=>i.exId && i.pct!=null).map(i=>byId(i.exId).pm);
  return ids.find(Boolean) || 'dead';
}
function clientRow(c, key, needsPm){
  const pm = pmOf(c.id);
  const has = Object.values(pm).filter(v=>v!=null).length;
  const list = Object.entries(PMNAMES).filter(([k])=>pm[k]!=null).slice(0,4)
    .map(([k,n])=>n + ' ' + fmtN(pm[k])).join(' · ');
  /* Нет максимума — проценты не во что превращать (CON-16). Тренер должен
     узнать это здесь, а не от клиента, который откроет пустую тренировку. */
  const blind = needsPm && pm[key] == null;
  return `<button class="cl ${PICK.has(c.id)?'on':''} ${blind?'blind':''}" data-cl="${c.id}">
    <span class="box">${ICON.chk}</span>
    <span class="av">${esc(c.ini)}</span>
    <span class="who"><b>${esc(c.n)}</b>
      <s>${blind ? 'нет максимума — проценты не посчитаются'
                 : esc(has ? list : 'максимумы не заданы')}</s></span>
    <span class="pmv"><b>${pm[key]!=null?fmtN(pm[key]):'—'}</b><s>${esc(PMNAMES[key])}</s></span>
  </button>`;
}
/* Модалка «Назначить» удалена: назначение теперь неявное — тренировка стоит
   у клиента на дате. Массовое назначение (CON-10) переезжает из конструктора. */

/* В данных формат лежал отдельным полем — переносим в название один раз,
   чтобы источник остался один. */
renderNav('constructor.html'); renderTop(); renderHead(); render();

/* Сворачивание панели источников — состояние переживает перезагрузку,
   как и у левого меню. */
function setRailMin(min){
  document.body.classList.toggle('railmin', min);
  const b = document.getElementById('railtog');
  if(b) b.title = b.ariaLabel = min ? 'Развернуть панель' : 'Свернуть панель';
  try{ localStorage.setItem('tg.railmin', min ? '1' : '') }catch(_){}
}
$('#railtog').onclick = () => setRailMin(!document.body.classList.contains('railmin'));
try{ if(localStorage.getItem('tg.railmin')) setRailMin(true) }catch(_){}
