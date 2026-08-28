# Пять стилистик

Сводная страница: [index.html](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/index.html)

Один и тот же продукт в пяти визуальных языках. Экраны везде одинаковые и
данные одни и те же — среда 26 августа программы «Сила + кроссфит», атлет
Артём Ковалёв. Отличается только то, как это выглядит.

| | Конструктор (десктоп) | Клиент (телефон) |
|---|---|---|
| **01 · Список** — плоскость, линии и воздух, оранжевый акцент | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/01-strava/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/01-strava/client.html) |
| **02 · Лайм** — пилюли на тёплом холсте, дорожка недели по объёму | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/02-lime/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/02-lime/client.html) |
| **03 · Тёплый** — бумага и одно тёмное пятно под «здесь и сейчас» | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/03-warm/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/03-warm/client.html) |
| **04 · Доска** — кремовая бумага, бронза, назначение перед названием | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/04-hwpo/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/04-hwpo/client.html) |
| **05 · Документ** — лист вместо карточек, числа столбцом справа | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/05-violet/trainer.html) | [открыть](https://raw.githack.com/serjnsk/fitbaza/prototype/screens-4-styles/prototypes/showcase/05-violet/client.html) |

## Прототипы живые

Это не скриншоты. В конструкторе переключаются дни и недели, строка
«Присед 5×3 80%» разбирается в упражнение со схемой и весом, проценты
пересчитываются в килограммы под выбранного клиента, работают библиотека,
поиск и шаблоны. У клиента отмечаются подходы и блоки, кнопка ведёт по
работе шаг за шагом.

## Как устроено

Варианты 02–05 — независимые острова: своя вёрстка, свой CSS, свои шаблоны
и своя копия доменной модели (`assets/data.js`). Правка в одном варианте
физически не может задеть другой. Вариант 01 собран на общем движке
в `assets/` — он появился раньше остальных.

В папке `reference/` каждого варианта лежат исходные макеты, с которых
собрана стилистика, и переданные с ними README с токенами.

Данные, разбор текста и расчёт нагрузки — из документации: CLI-1, CLI-2,
CON-5, CON-16, EX-1, EX-3, COM-1, TPL-1.
