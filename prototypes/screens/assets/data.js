/* ============================================================
   fitbaza · доменная модель (общая для всех страниц)
   Сущности по 02 — Функциональные требования:
   упражнение → блок → тренировка → неделя → программа → шаблон
   ============================================================ */
const TODAY = '2026-08-26';                 /* среда — фиксируем для детерминизма */
const D = s => new Date(s + 'T00:00:00');
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_N = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dm = s => { const d=D(s); return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0') };
const addDays = (s,n) => { const d=D(s); d.setDate(d.getDate()+n); return iso(d) };
const dowMon = s => (D(s).getDay()+6)%7;    /* 0 = понедельник */
const daysBetween = (a,b) => Math.round((D(b)-D(a))/86400000);

/* ─── Тренер и его рабочее пространство (REG-3) ─── */
const TRAINER = {
  n:'Сергей Ковальчук', ini:'СК', workspace:'CrossFit Ладья',
  invite:'https://fitbaza.app/j/kovalchuk',
  brand:{ title:'Ковальчук · Strength & Conditioning', color:'#D7FF3F', bg:'#0B0D0F', logo:'СК' }
};

/* ─── База упражнений (EX-1) · гибкие показатели (EX-3) ─── */
const EX = [
 {id:'squat',  ru:'Приседания со штангой',      en:'Back Squat',       g:'Ноги',    eq:'Штанга',   pm:'squat',  u:['кг','повт'],              m:'ok',      own:false},
 {id:'fsquat', ru:'Фронтальный присед',          en:'Front Squat',      g:'Ноги',    eq:'Штанга',   pm:'fsquat', u:['кг','повт'],              m:'ok',      own:false},
 {id:'dead',   ru:'Становая тяга',               en:'Deadlift',         g:'Спина',   eq:'Штанга',   pm:'dead',   u:['кг','повт'],              m:'ok',      own:false},
 {id:'bench',  ru:'Жим лёжа',                    en:'Bench Press',      g:'Грудь',   eq:'Штанга',   pm:'bench',  u:['кг','повт'],              m:'ok',      own:false},
 {id:'press',  ru:'Жим стоя',                    en:'Strict Press',     g:'Плечи',   eq:'Штанга',   pm:'press',  u:['кг','повт'],              m:'ok',      own:false},
 {id:'clean',  ru:'Взятие на грудь в стойку',    en:'Power Clean',      g:'ТА',      eq:'Штанга',   pm:'clean',  u:['кг','повт'],              m:'pending', own:false},
 {id:'snatch', ru:'Рывок',                       en:'Snatch',           g:'ТА',      eq:'Штанга',   pm:'snatch', u:['кг','повт'],              m:'pending', own:false},
 {id:'jerk',   ru:'Толчок от груди',             en:'Push Jerk',        g:'ТА',      eq:'Штанга',   pm:'jerk',   u:['кг','повт'],              m:'pending', own:false},
 {id:'thrust', ru:'Трастер',                     en:'Thruster',         g:'Кроссфит',eq:'Штанга',   pm:null,     u:['кг','повт'],              m:'ok',      own:false},
 {id:'pullup', ru:'Подтягивания',                en:'Pull-up',          g:'Спина',   eq:'Турник',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'c2b',    ru:'Подтягивания до груди',       en:'Chest-to-Bar',     g:'Кроссфит',eq:'Турник',   pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'hspu',   ru:'Отжимания в стойке на руках', en:'HSPU',             g:'Кроссфит',eq:'Своё тело',pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'du',     ru:'Двойные прыжки',              en:'Double-unders',    g:'Кроссфит',eq:'Скакалка', pm:null,     u:['повт','сек'],             m:'ok',      own:false},
 {id:'wb',     ru:'Wall Ball',                   en:'Wall Ball Shots',  g:'Кроссфит',eq:'Мяч',      pm:null,     u:['повт','кг'],              m:'ok',      own:false},
 {id:'row',    ru:'Гребля',                      en:'Row',              g:'Кардио',  eq:'Эргометр', pm:null,     u:['м','сек','темп','кал'],   m:'ok',      own:false},
 {id:'bike',   ru:'Эйрбайк',                     en:'Echo Bike',        g:'Кардио',  eq:'Эргометр', pm:null,     u:['кал','сек','мощность'],   m:'pending', own:false},
 {id:'run',    ru:'Бег',                         en:'Run',              g:'Кардио',  eq:'—',        pm:null,     u:['м','сек','темп','пульс'], m:'ok',      own:false},
 {id:'burpee', ru:'Бёрпи',                       en:'Burpee',           g:'Кроссфит',eq:'—',        pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'box',    ru:'Запрыгивания на тумбу',       en:'Box Jump',         g:'Ноги',    eq:'Тумба',    pm:null,     u:['повт','высота'],          m:'ok',      own:false},
 {id:'ttb',    ru:'Носки к перекладине',         en:'Toes-to-Bar',      g:'Кор',     eq:'Турник',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'lunge',  ru:'Выпады с гантелями',          en:'DB Walking Lunge', g:'Ноги',    eq:'Гантели',  pm:null,     u:['повт','м','кг'],          m:'ok',      own:false},
 {id:'kbs',    ru:'Махи гирей',                  en:'KB Swing',         g:'Кроссфит',eq:'Гиря',     pm:null,     u:['повт','кг'],              m:'ok',      own:false},
 {id:'ring',   ru:'Отжимания на кольцах',        en:'Ring Dip',         g:'Грудь',   eq:'Кольца',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'ghd',    ru:'GHD Sit-up',                  en:'GHD Sit-up',       g:'Кор',     eq:'GHD',      pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'plank',  ru:'Планка',                      en:'Plank',            g:'Кор',     eq:'—',        pm:null,     u:['сек'],                    m:'ok',      own:false},
 {id:'rom',    ru:'Суставная разминка',          en:'Joint ROM',        g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'ok',      own:false},
 {id:'couch',  ru:'Растяжка «Couch»',            en:'Couch Stretch',    g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'pending', own:false},
 {id:'pvc',    ru:'Мобилити плеч с PVC',         en:'PVC Pass-through', g:'Мобилити',eq:'PVC',      pm:null,     u:['повт'],                   m:'ok',      own:false},
 /* EX-2 — собственные упражнения тренера: видны только ему и его клиентам */
 {id:'sled',   ru:'Толкание саней',              en:'Sled Push',        g:'Ноги',    eq:'Сани',     pm:null,     u:['м','кг','сек'],           m:'ok',      own:true},
 {id:'ropec',  ru:'Лазание по канату',           en:'Rope Climb',       g:'Спина',   eq:'Канат',    pm:null,     u:['повт','м'],               m:'pending', own:true},
 {id:'copen',  ru:'Раскрытие грудного отдела',   en:'T-Spine Opener',   g:'Мобилити',eq:'Ролл',     pm:null,     u:['сек','повт'],             m:'ok',      own:true, vid:false},
];
/* Техника — поле базы упражнений (EX-1). В боевой версии приезжает из датасета
   вместе с гифкой; здесь заполнено для упражнений этой тренировки. */
const TECH = {
 squat:'Штанга на трапеции, стопы чуть шире плеч, носки развёрнуты. Колени идут в сторону носков, спина нейтральна. Опускаться до параллели бедра с полом или ниже.',
 dead:'Гриф над серединой стопы, лопатки над грифом. Спина прямая от начала до конца, таз и плечи поднимаются одновременно. В верхней точке не отклоняться назад.',
 bench:'Лопатки сведены и прижаты, стопы упёрты в пол. Гриф опускается к низу груди, локти под углом 45° к корпусу.',
 press:'Гриф на передних дельтах, локти под грифом. Корпус жёсткий, ягодицы напряжены. Голова уходит назад, гриф идёт по прямой вверх.',
 clean:'Старт как в становой. Разгон бёдрами, затем быстрый подсед под штангу. Локти выходят вперёд, гриф ложится на дельты.',
 snatch:'Широкий хват, гриф над серединой стопы. Плавный съём, ускорение от бедра, глубокий подсед. Штанга фиксируется на прямых руках над головой.',
 pullup:'Хват чуть шире плеч, в нижней точке руки полностью выпрямлены. Подтягиваться до касания подбородком уровня перекладины.',
 ttb:'Вис на прямых руках, плечи активны. Носки касаются перекладины, обратно опускаться подконтрольно, не раскачиваясь.',
 hspu:'Стойка на руках у стены, ладони чуть шире плеч. Опускаться до касания головой пола, затем выжимать в исходное.',
 ring:'Кольца прижаты к корпусу, плечи ниже локтей в нижней точке. В верхней — полное выпрямление рук с разворотом колец.',
 bike:'Работают руки и ноги одновременно. Держать ровный темп, не срываться на первых калориях.',
 row:'Последовательность: ноги, корпус, руки. Возврат в обратном порядке. Спина нейтральна, тяга к низу груди.',
 plank:'Локти под плечами, таз не проваливается и не задирается. Ягодицы и живот напряжены, шея продолжает линию спины.',
 couch:'Колено у стены, стопа вверх, таз подкручен. Тянуть переднюю поверхность бедра, не прогибаясь в пояснице.',
 rom:'Последовательно по суставам сверху вниз: шея, плечи, локти, таз, колени, голеностоп. Без рывков.',
 pvc:'Широкий хват на трубе, руки прямые. Провести трубу над головой за спину и обратно, не сгибая локти.',
 box:'Отталкиваться двумя ногами, приземляться мягко на всю стопу. Полное выпрямление на тумбе.',
 lunge:'Шаг вперёд, колено задней ноги почти касается пола. Корпус вертикально, гантели вдоль тела.',
 thrust:'Фронтальный присед и жим одним движением. Штанга выходит вверх на разгибании ног.',
 wb:'Присед до параллели, бросок мяча в цель на выдохе. Ловить мяч и сразу уходить в следующий присед.',
 du:'Прыжок невысокий, вращение кистями, а не руками. Локти прижаты к корпусу.',
 burpee:'Грудь касается пола, в верхней точке полное выпрямление с прыжком.',
 kbs:'Разгон гирей за счёт таза, а не рук. Спина прямая, гиря выходит на уровень глаз или выше.',
 c2b:'Как обычные подтягивания, но касание перекладины грудью, а не подбородком.',
 ghd:'Опускаться подконтрольно до касания руками пола, подниматься одним движением.',
 fsquat:'Гриф на передних дельтах, локти высоко. Корпус максимально вертикально, колени вперёд.',
 jerk:'Короткий подсед, мощное выталкивание, уход под штангу. Фиксация на прямых руках.',
 run:'Ровный темп, дыхание в ритм. Приземление под центр тяжести.',
 sled:'Корпус наклонён вперёд, руки прямые. Толкать ногами, шаг короткий и частый.',
 ropec:'Захват каната ногами, подъём за счёт ног. Спуск подконтрольный, не скользить ладонями.',
 copen:'Ролл под лопатками, руки за головой. Прогибаться через ролл на выдохе, поясницу не включать.',
};
const GROUPS = ['Все','Ноги','Спина','Грудь','Плечи','ТА','Кроссфит','Кардио','Кор','Мобилити'];
const EQUIP  = ['Штанга','Гантели','Гиря','Турник','Кольца','Эргометр','Скакалка','Тумба','Мяч','Канат','Сани','GHD','PVC','Ролл','Своё тело','—'];
const byId = id => EX.find(e=>e.id===id);
const PMNAMES = {squat:'Присед',fsquat:'Фронт. присед',dead:'Становая',bench:'Жим лёжа',press:'Жим стоя',clean:'Взятие на грудь',snatch:'Рывок',jerk:'Толчок'};

const ALIAS = {
 squat:['присед','приседания','присед со штангой','back squat','бэк сквот'],
 fsquat:['фронтальный присед','фронт присед','фронтач','front squat'],
 dead:['становая','становая тяга','тяга становая','deadlift'],
 bench:['жим лежа','жим лёжа','жим штанги лежа','bench','bench press'],
 press:['жим стоя','жим стоя со штангой','strict press','military press'],
 clean:['взятие на грудь','взятие','клин','power clean','clean'],
 snatch:['рывок','снэтч','snatch'], jerk:['толчок','швунг толчковый','push jerk','jerk'],
 thrust:['трастер','трастеры','thruster','thrusters'],
 pullup:['подтягивания','подтягивание','пулап','pull up','pullup','pull-ups'],
 c2b:['до груди','подтягивания до груди','c2b','chest to bar'],
 hspu:['hspu','отжимания в стойке','стойка на руках','handstand push up'],
 du:['двойные','двойные прыжки','дабл андеры','double unders','du'],
 wb:['wall ball','волбол','мяч в стену','wallball'],
 row:['гребля','гребной','гребем','row','rower','erg'],
 bike:['эйрбайк','эйр байк','байк','велосипед','echo bike','assault bike'],
 run:['бег','пробежка','run','бегом'], burpee:['берпи','бёрпи','burpee','burpees'],
 box:['тумба','запрыгивания','запрыгивания на тумбу','box jump'],
 ttb:['носки к перекладине','ttb','toes to bar'],
 lunge:['выпады','выпады с гантелями','lunge','walking lunge'],
 kbs:['махи гирей','махи','свинг','гиря','kb swing','kettlebell swing'],
 ring:['кольца','отжимания на кольцах','ring dip','ring dips'],
 ghd:['ghd','гхд'], plank:['планка','plank'],
 rom:['суставная разминка','разминка суставов','мобилити','joint rom'],
 couch:['кауч','couch','couch stretch','растяжка','растяжка бедра'],
 pvc:['pvc','выкруты','мобилити плеч','pass through'],
 sled:['сани','толкание саней','sled','sled push'],
 ropec:['канат','лазание по канату','rope climb'],
 copen:['раскрытие грудного','t-spine','грудной отдел'],
};

/* ─── Библиотека шаблонов (TPL) ───────────────────────────────
   Две независимые оси, которые нельзя смешивать:

   УРОВЕНЬ (TPL-2) — место в иерархии сущностей:
     упражнение → блок → тренировка → неделя → программа
   ПАПКА (TPL-1) — способ разложить БЛОКИ, потому что разминок
     у тренера много: «Разминки», «Силовые блоки», «Комплексы»,
     «Заминки». К остальным уровням папки не относятся.

   Содержимое шаблона соответствует его уровню: в неделе лежат дни,
   в тренировке — блоки, в блоке — упражнения. Иначе «достать из
   шаблона сразу неделю» физически невозможно.
   ──────────────────────────────────────────────────────────── */
const TPL_LEVELS = ['упражнение','блок','тренировка','неделя','программа'];
const TPL_FOLDERS = ['Разминки','Силовые блоки','Комплексы','Заминки'];

const TPL = [
 /* ── уровень: упражнение — сохранённое назначение одной строкой ── */
 {id:'e1', lvl:'упражнение', title:'Присед 5×3 @ 80 %',      used:26, ex:['squat','5×3',80,'%']},
 {id:'e2', lvl:'упражнение', title:'Становая 3×5 @ 70 %',    used:19, ex:['dead','3×5',70,'%']},
 {id:'e3', lvl:'упражнение', title:'Гребля 500 м',           used:31, ex:['row','',500,'м']},
 {id:'e4', lvl:'упражнение', title:'Планка 3× по 45 сек',    used:14, ex:['plank','3×',45,'сек']},

 /* ── уровень: блок — единственный уровень с папками (TPL-1) ── */
 {id:'b1', lvl:'блок', folder:'Разминки', kind:'warmup', title:'Общая разминка · 10 мин', used:34,
  items:[['rom','2×',60,'сек'],['pvc','2×10'],['row','',500,'м']]},
 {id:'b2', lvl:'блок', folder:'Разминки', kind:'warmup', title:'Разминка перед приседом', used:21,
  items:[['rom','',90,'сек'],['squat','3×5',40,'%'],['box','2×5']]},
 {id:'b3', lvl:'блок', folder:'Разминки', kind:'warmup', title:'Разминка ТА', used:12,
  items:[['pvc','3×10'],['snatch','3×3',40,'%']]},
 {id:'b4', lvl:'блок', folder:'Силовые блоки', kind:'strength', title:'Присед 5×3 @ 75–85 %', used:18,
  items:[['squat','5×3',80,'%'],['lunge','3×10']]},
 {id:'b5', lvl:'блок', folder:'Силовые блоки', kind:'strength', title:'Жим + подтягивания', used:15,
  items:[['bench','5×5',75,'%'],['pullup','5×8']]},
 {id:'b6', lvl:'блок', folder:'Силовые блоки', kind:'strength', title:'Становая 3×5 @ 70 %', used:9,
  items:[['dead','3×5',70,'%'],['ttb','3×12']]},
 {id:'b7', lvl:'блок', folder:'Комплексы', kind:'metcon', title:'«Fran» · 21-15-9', used:7, fmt:'For time 8',
  items:[['thrust','21-15-9',43,'кг'],['pullup','21-15-9']]},
 {id:'b8', lvl:'блок', folder:'Комплексы', kind:'metcon', title:'EMOM 12 · сила + кардио', used:11, fmt:'EMOM 12',
  items:[['clean','3',70,'%'],['bike','',12,'кал']]},
 {id:'b9', lvl:'блок', folder:'Комплексы', kind:'metcon', title:'AMRAP 15 · гимнастика', used:6, fmt:'AMRAP 15',
  items:[['wb','',15,'повт'],['du','',50,'повт'],['box','10']]},
 {id:'b10',lvl:'блок', folder:'Заминки', kind:'cooldown', title:'Заминка / растяжка · 8 мин', used:29,
  items:[['couch','2×',90,'сек'],['plank','3×',45,'сек']]},

 /* ── уровень: тренировка — внутри блоки, а не россыпь упражнений ── */
 {id:'w1', lvl:'тренировка', title:'Силовой день · присед + жим', used:8, blocks:['b1','b4','b5','b10']},
 {id:'w2', lvl:'тренировка', title:'День ТА + метком', used:5, blocks:['b3','b9']},
 {id:'w3', lvl:'тренировка', title:'Становая + гимнастика', used:6, blocks:['b1','b6','b8','b10']},

 /* ── уровень: неделя — внутри семь дней, null = отдых ── */
 {id:'k1', lvl:'неделя', title:'Силовая неделя · база', used:4,
  days:['w1', null, 'w3', null, 'w2', null, null]},
 {id:'k2', lvl:'неделя', title:'Объёмная неделя · 5 дней', used:2,
  days:['w1','w2','w3', null,'w1','w2', null]},

 /* ── уровень: программа — последовательность недель ── */
 {id:'p1t', lvl:'программа', title:'Сила + кроссфит · 8 недель', used:3,
  goal:'Рост силовых при сохранении метконовой формы', weeks:8, base:'k1'},
 {id:'p2t', lvl:'программа', title:'Возвращение после травмы · 6 недель', used:1,
  goal:'Аккуратный возврат к базовым движениям', weeks:6, base:'k2'},
];
const tplById = id => TPL.find(t=>t.id===id);

/* Вид блока для цветной метки. У шаблонов уровня «тренировка» своего вида нет —
   день характеризует его первый неразминочный блок. Без этого метка рендерилась
   пустой: место занимала, цвета не давала. */
function tplKind(t){
  if(!t) return 'strength';
  if(t.kind) return t.kind;
  if(t.lvl==='тренировка'){
    const inner = (t.blocks||[]).map(tplById).filter(Boolean);
    return (inner.find(b=>b.kind && b.kind!=='warmup' && b.kind!=='cooldown') || inner[0] || {}).kind || 'strength';
  }
  if(t.lvl==='неделя'){
    const first = (t.days||[]).filter(Boolean).map(tplById).filter(Boolean)[0];
    return first ? tplKind(first) : 'strength';
  }
  return 'strength';
}

/* Разворачивание шаблона в рабочие сущности — уровень определяет результат */
function tplLine([ex, scheme, val, unit]){
  const i = mkItem(ex, scheme||'');
  if(unit==='%') i.pct = parseFloat(val);
  else if(val!=null && val!==''){ i.unit = unit || i.unit; i.val = String(val) }
  return i;
}
const tplToItem  = t => tplLine(t.ex);
const tplToBlock = t => ({id:nid('b'), kind:t.kind||'strength', title:t.title.replace(/\s·.*$/,''),
                          note:'', fmt:t.fmt||null, items:(t.items||[]).map(tplLine)});
function tplToWorkout(t){
  return {title:t.title, blocks:(t.blocks||[]).map(id=>tplToBlock(tplById(id))).filter(Boolean)};
}
function tplToWeekDays(t){
  return (t.days||[]).map(id=>{
    if(!id) return null;
    const w = tplById(id);
    return w ? tplToWorkout(w) : null;
  });
}
/* сколько дней с тренировками и упражнений внутри — для карточек библиотеки */
function tplStats(t){
  if(t.lvl==='упражнение') return {n:1};
  if(t.lvl==='блок') return {n:(t.items||[]).length};
  if(t.lvl==='тренировка'){ const w=tplToWorkout(t);
    return {n:w.blocks.reduce((a,b)=>a+b.items.length,0), blocks:w.blocks.length} }
  if(t.lvl==='неделя'){ const d=tplToWeekDays(t);
    return {days:d.filter(Boolean).length, n:d.filter(Boolean).reduce((a,w)=>a+w.blocks.reduce((x,b)=>x+b.items.length,0),0)} }
  if(t.lvl==='программа'){ const b=tplById(t.base);
    return {weeks:t.weeks, days:b?tplToWeekDays(b).filter(Boolean).length:0} }
  return {n:0};
}

/* ─── Клиенты тренера (PRO-1…PRO-6, CLI-2, COM) ─── */
const CLIENTS = [
 {id:'c1', n:'Артём Ковалёв', ini:'АК', sex:'м', born:'1994-03-12', since:'2022-05-04',
  sport:'Кроссфит', level:'Продвинутый', phone:'+7 913 240-11-08', tariff:'Индивидуально', prog:'p1',
  h:182, w:84, last:'2026-08-25', done:14, plan:16, streak:6,
  pm:{squat:150,fsquat:125,dead:190,bench:110,press:70,clean:105,snatch:82,jerk:112},
  hist:{squat:[['2026-04-06',132.5],['2026-05-11',137.5],['2026-06-15',142.5],['2026-07-20',145],['2026-08-24',150]],
        dead:[['2026-04-06',170],['2026-05-11',175],['2026-06-15',180],['2026-07-20',185],['2026-08-24',190]],
        clean:[['2026-04-06',92.5],['2026-05-18',97.5],['2026-06-22',100],['2026-08-03',105]],
        bench:[['2026-04-06',100],['2026-05-25',105],['2026-07-13',107.5],['2026-08-17',110]]},
  pr:{ex:'squat', v:150, prev:145, at:'2026-08-24'},
  comments:[{d:'2026-08-25', ex:'Становая тяга', tx:'Последний подход шёл тяжело, поясница подгружалась. Снизить на следующей?', reply:null},
            {d:'2026-08-24', ex:null, tx:'Присед 150 — новый максимум! Последний подход дался чисто, без срыва техники.', reply:'Отлично. Ставлю новый ПМ, проценты в программе пересчитаются сами.'}],
  note:'Склонен занижать RPE. На становой контролировать поясницу.'},

 {id:'c2', n:'Мария Соловьёва', ini:'МС', sex:'ж', born:'1997-11-02', since:'2025-09-15',
  sport:'Тренажёрный зал', level:'Средний', phone:'+7 923 118-42-77', tariff:'Индивидуально', prog:'p3',
  h:168, w:59, last:'2026-08-26', done:9, plan:12, streak:3,
  pm:{squat:72.5,dead:95,bench:45,press:32.5},
  hist:{squat:[['2026-05-04',60],['2026-06-08',65],['2026-07-13',70],['2026-08-17',72.5]],
        dead:[['2026-05-04',80],['2026-06-15',85],['2026-07-20',90],['2026-08-24',95]]},
  pr:null,
  comments:[{d:'2026-08-26', ex:'Приседания со штангой', tx:'Колено немного тянет на глубоком седе. Можно заменить на что-то?', reply:null}],
  note:'После травмы колена (март 2026). Глубину седа наращивать постепенно.'},

 {id:'c3', n:'Илья Гордеев', ini:'ИГ', sex:'м', born:'1991-06-21', since:'2024-02-10',
  sport:'Кроссфит', level:'Продвинутый', phone:'+7 903 552-10-19', tariff:'Группа', prog:'p2',
  h:178, w:80, last:'2026-08-20', done:7, plan:16, streak:0,
  pm:{squat:160,dead:200,bench:120,clean:110,snatch:88},
  hist:{squat:[['2026-05-04',150],['2026-06-15',155],['2026-07-20',160]],
        clean:[['2026-05-04',100],['2026-06-22',105],['2026-07-27',110]]},
  pr:null, comments:[], note:''},

 {id:'c4', n:'Дарья Лунина', ini:'ДЛ', sex:'ж', born:'1999-01-30', since:'2025-03-03',
  sport:'Кроссфит', level:'Средний', phone:'+7 913 700-88-45', tariff:'Группа', prog:'p2',
  h:171, w:63, last:'2026-08-25', done:13, plan:16, streak:5,
  pm:{squat:85,dead:110,bench:52.5,clean:62.5},
  hist:{squat:[['2026-05-04',72.5],['2026-06-15',77.5],['2026-07-20',82.5],['2026-08-24',85]]},
  pr:{ex:'squat', v:85, prev:82.5, at:'2026-08-24'},
  comments:[{d:'2026-08-25', ex:null, tx:'Комплекс зашёл, но двойные прыжки всё ещё рвут дыхание.', reply:null}], note:''},

 {id:'c5', n:'Пётр Ким', ini:'ПК', sex:'м', born:'1988-09-14', since:'2024-11-20',
  sport:'Кроссфит', level:'Начальный', phone:'+7 923 441-05-62', tariff:'Группа', prog:'p2',
  h:175, w:77, last:'2026-08-24', done:11, plan:16, streak:2,
  pm:{squat:105,dead:135,bench:75}, hist:{squat:[['2026-06-01',95],['2026-07-13',100],['2026-08-17',105]]},
  pr:null, comments:[], note:''},

 {id:'c6', n:'Никита Волков', ini:'НВ', sex:'м', born:'2001-07-08', since:'2026-08-22',
  sport:'Кроссфит', level:'Начальный', phone:'+7 913 009-77-31', tariff:'Индивидуально', prog:null,
  h:null, w:null, last:null, done:0, plan:0, streak:0,
  pm:{}, hist:{}, pr:null, comments:[], note:'Пришёл по ссылке-приглашению. Профиль не заполнен.'},
];
const client = id => CLIENTS.find(c=>c.id===id);

/* ─── Программы (сущность «программа» = последовательность недель) ─── */
const PROGRAMS = [
 {id:'p1', title:'Сила + кроссфит', goal:'Рост силовых при сохранении метконовой формы',
  weeks:8, cur:4, clients:['c1'], start:'2026-08-03', kind:'individual'},
 {id:'p2', title:'Командная подготовка', goal:'Общая база для группы, индивидуальные проценты',
  weeks:12, cur:6, clients:['c3','c4','c5'], start:'2026-07-20', kind:'group'},
 {id:'p3', title:'Возвращение после травмы', goal:'Аккуратный возврат к приседу после колена',
  weeks:6, cur:3, clients:['c2'], start:'2026-08-10', kind:'individual'},
];
const program = id => PROGRAMS.find(p=>p.id===id);

/* ═══════ Тренировки, блоки, недели ═══════ */
let uid = 0; const nid = p => p+(++uid);
function mkItem(exId, scheme='', pct=null, unit=null, val=''){
  const e = byId(exId);
  return {id:nid('i'), exId, raw:null, scheme, pct, unit: unit || (e ? e.u[0] : ''), val};
}
const rawItem = txt => ({id:nid('i'), exId:null, raw:txt, scheme:'', pct:null, unit:'', val:''});
const mkBlock = (kind,title,note,fmt,items) => ({id:nid('b'), kind, title, note:note||'', fmt:fmt||null,
  items:(items||[]).map(a=>mkItem(a[0],a[1]||'',a[2]??null,a[3]||null,a[4]||''))});

/* Недельный рисунок программы: 7 дней, null = отдых */
/* ─── Фактически записанные результаты (CLI-2) ───
   Это ФАКТ, а не назначение. Тренер написал 157,5 — атлет поднял 155,
   и в истории лежит 155. Разница между планом и фактом — единственное,
   ради чего эту строку вообще показывают: по ней видно, идти вверх
   или задержаться. Источник для графика в профиле (PRO-6). */
const LOG = [
  {date:'2026-08-12', cid:'c1', exId:'dead',  scheme:'3×5',  kg:130},
  {date:'2026-08-12', cid:'c1', exId:'dead',  scheme:'2×3',  kg:150},
  {date:'2026-08-12', cid:'c1', exId:'ttb',   scheme:'4×12', kg:null, done:'4×9'},
  {date:'2026-08-19', cid:'c1', exId:'dead',  scheme:'3×5',  kg:132.5},
  {date:'2026-08-19', cid:'c1', exId:'dead',  scheme:'2×3',  kg:155},
  {date:'2026-08-19', cid:'c1', exId:'ttb',   scheme:'4×12', kg:null, done:'4×10'},
  {date:'2026-08-19', cid:'c1', exId:'ring',  scheme:'4×8',  kg:null, done:'4×8'},
  {date:'2026-08-19', cid:'c1', exId:'hspu',  scheme:'4×6',  kg:null, done:'4×5'},
];
/* Последний факт по упражнению строго раньше указанной даты.
   Одно упражнение может стоять в тренировке дважды с разными схемами
   (3×5 разминочные и 2×3 рабочие) — сначала ищем совпадение по схеме. */
function lastResult(cid, exId, before, scheme){
  const rows = LOG.filter(r=>r.cid===cid && r.exId===exId && r.date < before)
                  .sort((a,b)=> a.date < b.date ? 1 : -1);
  return rows.find(r=>r.scheme===scheme) || rows[0] || null;
}

/* ─── Комментарии (COM-1, COM-2, COM-4) ───
   Чата в продукте нет: комментарий всегда прикреплён к объекту —
   к тренировке или к упражнению, — и тренер отвечает в той же ветке.
   Ветка при упражнении живёт дольше одной тренировки. */
/* Ключ переписки — пара «клиент + объект», а не объект сам по себе.
   Программу назначают нескольким клиентам, и всё, что относится к
   выполнению — блоки, схемы, заметки о технике, — едет с ней. А всё,
   что адресовано человеку, остаётся при человеке: «сбрось до 140»
   написано Артёму про его спину, Пете это показывать нельзя. */
const talkKey = (cid, x) => cid + '@' + x;
const TALK = {
  workout: {
    'c1@2026-08-26': [
      {who:'trainer', text:'Становую сегодня не гони — работаем в технике. Если спина круглится, сбрось до 140 и добери объёмом.', at:'вчера, 21:14'}
    ]
  },
  item: {
    'c1@dead': [
      {who:'client',  text:'Спина подкруглилась на последнем подходе', at:'19 авг'},
      {who:'trainer', text:'Видел на видео. Ставлю 155 и не больше — следим за поясницей.', at:'19 авг'}
    ]
  }
};

const PATTERN = {
 p1:[
  {t:'Сила · присед + жим', b:[
    ['warmup','Разминка','Темп спокойный, без отказа',null,[['rom','2×',null,'сек','60'],['pvc','2×10'],['row',null,null,'м','500']]],
    ['strength','Присед','Пауза 1 сек в нижней точке',null,[['squat','5×3',80],['squat','1×3',85]]],
    ['strength','Жим лёжа + подтягивания','',null,[['bench','5×5',75],['pullup','5×8']]],
    ['cooldown','Заминка','',null,[['couch','2×',null,'сек','90']]]]},
  {t:'Комплекс «Fran»', b:[
    ['warmup','Разминка','',null,[['rom','2×',null,'сек','60'],['burpee','2×8']]],
    ['metcon','«Fran» 21-15-9','Цель — sub 5:00','For time 8',[['thrust','21-15-9',null,'кг','43'],['pullup','21-15-9']]]]},
  {t:'Сила · становая + гимнастика', b:[
    ['warmup','Разминка','Мобилити т/б сустава',null,[['rom','2×',null,'сек','90'],['row',null,null,'кал','15'],['pvc','2×10']]],
    ['strength','Становая тяга','Каждый подход с пола, сброс',null,[['dead','3×5',70],['dead','2×3',82.5]]],
    ['metcon','EMOM 12','Нечётные — взятие, чётные — эйрбайк','EMOM 12',[['clean','3',70],['bike',null,null,'кал','12']]],
    ['strength','Гимнастика','',null,[['ttb','4×12'],['ring','4×8'],['hspu','4×6']]],
    ['cooldown','Заминка','',null,[['plank','3×',null,'сек','45'],['couch','2×',null,'сек','90']]]]},
  null,
  {t:'ТА + метком', b:[
    ['warmup','Разминка ТА','',null,[['pvc','3×10'],['snatch','3×3',40]]],
    ['strength','Рывок','На технику, вес не выше 80 %',null,[['snatch','6×2',75]]],
    ['metcon','AMRAP 15','','AMRAP 15',[['wb','15',null,'повт','15'],['du',null,null,'повт','50'],['box','10']]]]},
  {t:'Длинное кардио', b:[
    ['metcon','Аэробная база','Пульс 140–150',null,[['run',null,null,'м','5000'],['row',null,null,'м','2000']]]]},
  null],
 p2:[
  {t:'Сила · нижняя часть', b:[
    ['warmup','Разминка','',null,[['rom','2×',null,'сек','60'],['box','2×5']]],
    ['strength','Присед','Проценты индивидуальные',null,[['squat','5×5',75]]],
    ['strength','Тяга саней','',null,[['sled','4×',null,'м','20']]]]},
  {t:'Метком', b:[
    ['metcon','EMOM 12','','EMOM 12',[['kbs','12',null,'кг','24'],['burpee','10']]]]},
  {t:'Восстановление · мобилити', b:[
    ['warmup','Мобилити','Лёгкая аэробная работа',null,[['copen','3×',null,'сек','45'],['pvc','3×10'],['row',null,null,'м','2000']]]]},
  {t:'Сила · верх тела', b:[
    ['warmup','Разминка','',null,[['pvc','3×10']]],
    ['strength','Жим лёжа','',null,[['bench','5×5',75]]],
    ['strength','Подтягивания + канат','',null,[['pullup','5×8'],['ropec','4×1']]]]},
  {t:'Комплекс', b:[
    ['metcon','AMRAP 15','','AMRAP 15',[['thrust','12',null,'кг','40'],['c2b','9'],['du',null,null,'повт','40']]]]},
  {t:'Открытая тренировка', b:[
    ['metcon','Аэробная работа','',null,[['row',null,null,'м','3000'],['bike',null,null,'кал','40']]]]},
  null],
 p3:[
  {t:'Ноги · щадяще', b:[
    ['warmup','Разминка','Особое внимание колену',null,[['rom','3×',null,'сек','60'],['copen','2×',null,'сек','45']]],
    ['strength','Присед в частичной амплитуде','До боли не доводить',null,[['squat','4×6',60]]],
    ['cooldown','Заминка','',null,[['couch','2×',null,'сек','90']]]]},
  null,
  {t:'Верх тела', b:[
    ['warmup','Разминка','',null,[['pvc','3×10']]],
    ['strength','Жим + тяга','',null,[['bench','4×8',65],['pullup','4×6']]]]},
  null,
  {t:'Полное тело', b:[
    ['strength','Круговая','Без ударной нагрузки на колено',null,[['dead','4×6',65],['plank','3×',null,'сек','45'],['row',null,null,'м','1000']]]]},
  null,null],
};
/* Докуда программа реально составлена (дальше — пустые недели, сигнал на дашборде) */
const COMPOSED_WEEKS = {p1:5, p2:6, p3:4};

const weekStartDate = (pid,n) => addDays(program(pid).start, (n-1)*7);
function buildWeek(pid, n){
  const pat = PATTERN[pid] || [];
  const start = weekStartDate(pid,n);
  const composed = n <= (COMPOSED_WEEKS[pid]||0);
  return {pid, n, days: RU.map((w,i)=>{
    const d = pat[i];
    const date = addDays(start,i);
    if(!d || !composed) return {w, date, d:dm(date), title: d?'—':'Отдых', rest:true, blocks:[]};
    return {w, date, d:dm(date), title:d.t, rest:false, blocks:d.b.map(b=>mkBlock(b[0],b[1],b[2],b[3],b[4]))};
  })};
}

/* ═══════ Расчёт нагрузки (CON-16): проценты → рабочий вес ═══════ */
function workKg(item, pm){
  const e = item.exId && byId(item.exId);
  if(!e || !e.pm || item.pct == null || !pm) return null;
  const max = pm[e.pm];
  if(!max) return null;
  return Math.round(max * item.pct / 100 / 2.5) * 2.5;
}
const fmtNum = v => String(v).replace('.', ',');

/* Формат комплекса (EMOM 12, AMRAP 15) — часть содержания тренировки */
/* Формат живёт в НАЗВАНИИ блока, а не в отдельном поле: по TMR-1 тренер
   его просто пишет («EMOM 12»), а парсер узнаёт. Название может нести и
   имя комплекса — «"Fran" · For time 8», — поэтому пробуем каждую часть,
   разделённую точкой, и только потом строку целиком. */
function fmtPart(txt){
  const t = String(txt||'').trim();
  return t.split(/\s*·\s*/).find(p=>parseFmt(p)) || (parseFmt(t) ? t : null);
}
const findFmt = txt => parseFmt(fmtPart(txt));
/* Разовая нормализация: в данных формат лежал отдельным полем — переносим
   его в название, чтобы источник остался один. */
function fmtIntoTitle(b){
  if(b.fmt && !fmtPart(b.title)) b.title = b.title ? b.title + ' · ' + b.fmt : b.fmt;
  b.fmt = fmtPart(b.title);
  return b;
}

const mmssRaw = t => Math.floor(t/60)+':'+String(Math.round(t)%60).padStart(2,'0');
function parseFmt(s){
  if(!s) return null;
  const t = s.trim(); let m;
  if((m=t.match(/^EMOM\s*(\d+)/i)))       return {k:'EMOM',rounds:+m[1],work:60,rest:0,total:+m[1]*60,label:'каждую минуту'};
  if((m=t.match(/^E(\d+)MOM\s*(\d+)/i)))  return {k:'EMOM',rounds:+m[2],work:+m[1]*60,rest:0,total:+m[2]*+m[1]*60,label:'каждые '+m[1]+' мин'};
  if((m=t.match(/^AMRAP\s*(\d+)/i)))      return {k:'AMRAP',rounds:1,work:+m[1]*60,rest:0,total:+m[1]*60,label:'максимум раундов'};
  if(/^TABATA/i.test(t))                  return {k:'TABATA',rounds:8,work:20,rest:10,total:240,label:'20 / 10'};
  if((m=t.match(/^FOR\s*TIME\s*(\d+)?/i)))return {k:'FOR TIME',rounds:1,work:(+m[1]||20)*60,rest:0,total:(+m[1]||20)*60,label:'лимит времени'};
  if((m=t.match(/(\d+)\s*(?:rounds?|раунд\w*)\D+(\d+)\s*(?:sec|сек)\D+(\d+)\s*(?:sec|сек)/i)))
    return {k:'ИНТЕРВАЛЫ',rounds:+m[1],work:+m[2],rest:+m[3],total:+m[1]*(+m[2]+ +m[3]),label:m[2]+' / '+m[3]+' сек'};
  /* Русские формулировки. В TMR-1 оба примера англоязычные, но тренер
     пишет по-русски — «каждые 90 секунд», «5 раундов по 3 минуты». Без
     этих шаблонов он не получал таймер и не понимал почему.
     ВНИМАНИЕ: \w в JS — это [A-Za-z0-9_], кириллицу он не берёт. Окончания
     ловим явным [а-яё]*, иначе «раундов» не съедается после «раунд». */
  if((m=t.match(/кажд[а-яё]*\s*(\d+)\s*(сек|мин)[а-яё]*\D+(\d+)\s*(?:раунд|круг|повтор)[а-яё]*/i))){
    const w = m[2].toLowerCase()==='мин' ? +m[1]*60 : +m[1];
    return {k:'EMOM',rounds:+m[3],work:w,rest:0,total:+m[3]*w,
            label:'каждые '+m[1]+' '+(m[2].toLowerCase()==='мин'?'мин':'сек')};
  }
  if((m=t.match(/(\d+)\s*(?:раунд|круг)[а-яё]*\s*по\s*(\d+)\s*(мин|сек)[а-яё]*(?:[^\d]*отдых\D*?(\d+)\s*(мин|сек)[а-яё]*)?/i))){
    const sec = (v,u) => u && u.toLowerCase()==='мин' ? +v*60 : +v;
    const w = sec(m[2], m[3]), r = m[4] ? sec(m[4], m[5]) : 0;
    return {k: r ? 'ИНТЕРВАЛЫ' : 'РАУНДЫ', rounds:+m[1], work:w, rest:r,
            total:+m[1]*(w+r), label:r ? mmssRaw(w)+' через '+mmssRaw(r) : mmssRaw(w)+' в раунде'};
  }
  if((m=t.match(/^на\s*время\s*(\d+)?/i)))
    return {k:'FOR TIME',rounds:1,work:(+m[1]||20)*60,rest:0,total:(+m[1]||20)*60,label:'лимит времени'};
  return null;
}

/* ═══════ Текст → структура (CON-5, OQ-10) ═══════ */
const norm = s => s.toLowerCase().replace(/[ёë]/g,'е').replace(/[^a-zа-я0-9 ]/gi,' ').replace(/\s+/g,' ').trim();
const CAND = EX.map(e=>({e, c:[e.ru, e.en, ...(ALIAS[e.id]||[])].map(norm).filter(Boolean)}));
function sharedPrefix(a,b){ const L=Math.min(a.length,b.length); let i=0; while(i<L && a[i]===b[i]) i++; return i>=Math.ceil(L*.6)?i:0 }
function matchEx(text){
  const n = norm(text); if(!n) return null;
  const qt = n.split(' ').filter(t=>t.length>=3);
  let best=null, score=0;
  for(const {e,c} of CAND){
    let s=0;
    for(const cand of c){
      if(!cand) continue;
      if(n===cand){ s=Math.max(s,100+cand.length); continue }
      if(n.includes(cand)){ s=Math.max(s,40+cand.length); continue }
      const ct = cand.split(' ').filter(t=>t.length>=3);
      if(!ct.length||!qt.length) continue;
      let hit=0;
      for(const w of ct){ for(const q of qt){ if(q===w||sharedPrefix(q,w)>=4){ hit++; break } } }
      if(hit) s = Math.max(s, hit*6*(hit/ct.length));
    }
    if(s>score){ score=s; best=e }
  }
  return score>=6 ? best : null;
}
const NOL = '(?![а-яёa-z])';
const UNITS = [
  ['кг',  new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:кг|kg)'+NOL,'i')],
  ['сек', new RegExp('(\\d+)\\s*(?:сек|sec)'+NOL,'i')],
  ['кал', new RegExp('(\\d+)\\s*(?:кал|cal)'+NOL,'i')],
  ['повт',new RegExp('(\\d+)\\s*(?:повт\\w*|reps?|раз)'+NOL,'i')],
  ['м',   new RegExp('(\\d+)\\s*(?:метр\\w*|м|m)'+NOL,'i')],
];
const RE_SCHEME = /\d+\s*[x×хХ]\s*\d+|\d+(?:\s*-\s*\d+)+/;
const RE_SETS   = /\d+\s*[x×хХ]/;
function parseText(txt){
  const out=[];
  for(const line of txt.split('\n')){
    const L = line.trim(); if(!L) continue;
    const f = parseFmt(L);
    if(f && !RE_SCHEME.test(L)){ out.push({type:'fmt',src:L,fmt:L,f}); continue }
    let rest=L, unit=null, val='';
    for(const [u,re] of UNITS){ const m=rest.match(re); if(m){ unit=u; val=m[1].replace(',','.'); rest=rest.replace(m[0],' '); break } }
    let pct=null;
    const mp = rest.match(/@?\s*(\d{1,3}(?:[.,]\d)?)\s*%/);
    if(mp){ pct=parseFloat(mp[1].replace(',','.')); rest=rest.replace(mp[0],' ') }
    let scheme='';
    const ms = rest.match(RE_SCHEME) || rest.match(RE_SETS);
    if(ms){ scheme = ms[0].replace(/\s/g,'').replace(/[xхХ]/,'×'); rest = rest.replace(ms[0],' ') }
    else{ const lead = rest.match(/^\s*(\d+)\s+(?=\D)/); if(lead){ scheme=lead[1]; rest=rest.replace(lead[0],' ') } }
    const e = matchEx(rest);
    if(!e){ out.push({type:'raw',src:L}); continue }
    const item = mkItem(e.id, scheme);
    item.pct = pct;
    if(unit){ item.unit=unit; item.val=val }
    out.push({type:'ok',src:L,item,ex:e});
  }
  return out;
}

/* ═══════ Расписание клиента для календаря (CAL-1) ═══════ */
function scheduleFor(cid, from, to){
  const c = client(cid); if(!c || !c.prog) return [];
  const p = program(c.prog), pat = PATTERN[c.prog] || [];
  const out = [];
  for(let n=1; n<=p.weeks; n++){
    const start = weekStartDate(c.prog, n);
    if(addDays(start,6) < from) continue;
    if(start > to) break;
    if(n > (COMPOSED_WEEKS[c.prog]||0)) continue;
    pat.forEach((d,i)=>{
      if(!d) return;
      const date = addDays(start,i);
      if(date < from || date > to) return;
      const past = date < TODAY;
      const missed = past && c.streak===0 && daysBetween(date, TODAY) <= 5;
      out.push({cid, date, week:n, title:d.t, kind:d.b[d.b.length-1][0],
        status: past ? (missed?'missed':'done') : (date===TODAY?'today':'planned')});
    });
  }
  return out;
}
function scheduleAll(from,to){ return CLIENTS.flatMap(c=>scheduleFor(c.id,from,to)) }

/* ═══════ Состояние приложения (общее между страницами) ═══════ */
const STATE = (function(){
  const def = {online:true, queue:0, ids:false, navc:false, curClient:'c1', curProg:'p1', curWeek:4,
               pm:Object.fromEntries(CLIENTS.map(c=>[c.id, {...c.pm}])), replied:{}};
  let s = def;
  try{ const raw = localStorage.getItem('fitbaza.state'); if(raw) s = Object.assign({}, def, JSON.parse(raw)) }catch(_){}
  return s;
})();
function saveState(){ try{ localStorage.setItem('fitbaza.state', JSON.stringify(STATE)) }catch(_){} }
const pmOf = cid => (STATE.pm[cid] ||= {...(client(cid)?.pm||{})});
