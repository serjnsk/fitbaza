/* Витрина стилей: переключатель внизу и нейтрализация навигации,
   чтобы заказчик не проваливался на страницы, которых в демо нет. */
const DEMO = [
  {f:'01-acid-signal.html',  n:'Acid Signal',      c:'#D7FF3F'},
  {f:'02-performance.html',  n:'Performance Lab',  c:'#C8A15A'},
  {f:'03-brutal.html',       n:'Brutal Sport',     c:'#FF3B18'},
  {f:'04-clinical.html',     n:'Clinical',         c:'#2B50E8'},
  {f:'05-neon.html',         n:'Neon Pulse',       c:'#7C5CFF'},
];
window.addEventListener('DOMContentLoaded', ()=>{
  const here = location.pathname.split('/').pop() || '01-acid-signal.html';
  document.querySelectorAll('.nav a.nitem').forEach(a=>{
    if(!a.getAttribute('href') || a.getAttribute('href').includes('constructor')) return;
    a.removeAttribute('href'); a.style.cursor='default'; a.style.opacity='.45';
  });
  const bar = document.createElement('div');
  bar.className = 'demobar';
  bar.innerHTML = DEMO.map((d,i)=>`<a href="${d.f}" class="${d.f===here?'on':''}">
      <i style="background:${d.c}"></i><b>0${i+1}</b> ${d.n}</a>`).join('')
    + `<a href="index.html" class="all">Все пять</a>`;
  document.body.appendChild(bar);
});
