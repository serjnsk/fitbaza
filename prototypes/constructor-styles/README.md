# Конструктор тренировок — пять визуальных направлений

## ▶︎ [Открыть прототип](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/index.html)

Живая страница, а не картинка: можно печатать в строку тренировки, вызывать
подсказки из базы, разложить неделю из шаблона, перетаскивать упражнения.
Внизу каждой страницы — переключатель между стилями.

Открыть сразу конкретное направление:

| | Направление | Шрифты | Тема | |
|---|---|---|---|---|
| 01 | Acid Signal | Archivo · JetBrains Mono | тёмная | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/01-acid-signal.html) |
| 02 | Performance Lab | Onest · JetBrains Mono | тёмная | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/02-performance.html) |
| 03 | Brutal Sport | Oswald · Golos Text | тёмная | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/03-brutal.html) |
| 04 | Clinical Precision | Golos Text | светлая | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/04-clinical.html) |
| 05 | Neon Pulse | Unbounded · Inter Tight | тёмная | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/constructor-styles/prototypes/constructor-styles/05-neon.html) |

Логика и данные во всех пяти одинаковы — сравнивается только стилистика.

---

## Что в прототипе работает

- **CON-1, CON-5** — текст и структура одним полем: клик по строке возвращает
  нотацию тренера, парсер разбирает набранное на лету. Отдельной кнопки
  «распознать» нет: текстовый ввод — интерфейс поверх структуры
- **CON-2** — подсказки из базы упражнений по мере набора
- **CON-3, TPL-3** — вставка блоков и тренировок, разворачивание недели из
  шаблона сразу на семь дней
- **CON-4** — копия прошлой недели
- **CON-8, CON-13** — перетаскивание строк, блоков и тренировок между днями
- **CON-16** — проценты от ПМ в килограммы, округление до 2,5 кг
- **EX-3** — гибкие показатели упражнения

## Чего сознательно нет

Этапы 2 и 3 в интерфейс не выведены: платежи, таймер, групповые программы
с индивидуальными правками, импорт из Excel и TRNR, видео, анкеты, уведомления.

## Как это открывается

GitHub показывает HTML как исходный код, поэтому ссылки ведут через
`raw.githack.com` — он отдаёт файлы ветки с правильными типами, и страница
открывается как обычный сайт. Ничего устанавливать не нужно, но нужен интернет:
шрифты подгружаются с Google Fonts.

Локально прототип тоже работает — скачать папку и открыть `index.html`.
