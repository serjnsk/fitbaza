# Экраны в четырёх стилистиках

Конструктор тренера и экран тренировки клиента — по одному разу в каждой из
четырёх визуальных гипотез. Данные, поведение и содержимое везде одинаковые:
одна и та же тренировка «Сила · становая + гимнастика», среда 26 августа.
Различается только цвет и типографика — чтобы сравнивать оформление,
а не разную степень готовности.

**[▶︎ Открыть витрину со всеми восемью экранами](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/index.html)**

| | конструктор тренера | тренировка клиента |
|---|---|---|
| **01 · Strava** — белая база, оранжевый акцент | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/01-strava/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/01-strava/client.html) |
| **02 · HWPO** — песок и терракота, капитель | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/02-hwpo/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/02-hwpo/client.html) |
| **03 · Nibble** — фиолетовый, Onest | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/03-nibble/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/03-nibble/client.html) |
| **04 · Ladder** — лайм; тренеру светлая, клиенту тёмная | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/04-ladder/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/screens/04-ladder/client.html) |

Конструктор смотреть на десктопе, экран клиента — в любом окне, он нарисован
внутри рамки телефона.

## Как устроено

Восемь страниц собраны из общих частей, а не скопированы восемь раз:

- `assets/base-trainer.css`, `assets/base-client.css` — раскладка. Не задают
  ни одного цвета напрямую, только переменные.
- `assets/theme-*.css` — тема: цвета, шрифты, скругления и небольшие правки
  под характер стиля.
- `assets/trainer.js`, `assets/client.js` — логика, одна на все варианты.
- `assets/data.js` — доменная модель, общая с остальными прототипами.

Поэтому поведение во всех четырёх стилистиках одинаковое, а правка расходится
на восемь страниц сразу.

## Замечания по стилистикам

**HWPO** снят прямо с [hwpotraining.com](https://www.hwpotraining.com): вопреки
ожиданию это не чёрно-белое, а тёплая песочная гамма с терракотой `#935D38`.
Родной шрифт Industry платный — взят Archivo с узкой шириной. Скругления на
сайте нулевые, здесь 2–6px: в интерфейсе из сотни мелких прямоугольников
острые углы режут глаз.

**Ladder** — единственный вариант, где экраны намеренно расходятся. У клиента
чёрная база один в один: экран смотрят в зале, при плохом свете, и на чёрном
лайм работает как цвет, контраст выше 15:1. У тренера светлая адаптация —
лайм только заливкой под чёрным текстом, потому что как цвет текста на белом
он даёт 1,4:1 при норме 4,5:1.
