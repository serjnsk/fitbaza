# Тренерграм — прототипы

Ветка `prototypes` репозитория [serjnsk/trenergram](https://github.com/serjnsk/trenergram). Здесь только прототипы; документация продукта — в параллельной ветке `main`.

## Что опубликовано

| | Адрес |
|---|---|
| **Рабочий прототип MVP** — `mvp/` | <https://serjnsk.github.io/trenergram/prototype/> |
| Документация продукта — ветка `main` | <https://serjnsk.github.io/trenergram/docs/> |

Прототип кликабельный: данные демонстрационные (тестовый тренер, 6 клиентов, 3 программы), состояние сохраняется в `localStorage` браузера. Разбор страниц и покрытых требований — в [`mvp/README.md`](mvp/README.md).

## Публикация

Автоматическая. Push в эту ветку запускает [`.github/workflows/pages.yml`](.github/workflows/pages.yml), который пересобирает сайт целиком: документацию из `main` в `/docs/`, содержимое `mvp/` в `/prototype/`.

Workflow лежит в обеих ветках и обязан быть одинаковым — Actions запускает его из той ветки, в которую был push, а собирает он всегда обе по явным `ref`. Правите здесь — перенесите в `main`.

## Локально

```bash
cd mvp && python3 -m http.server 8765
```

Дальше <http://localhost:8765/>. Открывать через `file://` тоже можно, но шрифты грузятся с Google Fonts — без сети вид будет другим.

**Пути только относительные.** Прототип отдаётся из подпапки `/trenergram/prototype/`, любой путь от корня (`/assets/…`) сломается на Pages, хотя локально из `mvp/` будет работать.

## Черновые итерации

Ветки с черновиками удалены, их последние коммиты закреплены тегами. Содержимое доступно по тегу, на Pages не публикуется:

| Тег | Что внутри |
|---|---|
| [`archive/screens-4-styles`](https://github.com/serjnsk/trenergram/tree/archive/screens-4-styles) | Пять стилистик × два экрана (`prototypes/showcase/`), более ранняя итерация в четырёх (`prototypes/screens/`), первая проба конструктора (`prototypes/constructor-styles/`) и `reference/` с исходными макетами дизайнера и токенами. Отсюда выбран вариант 01 «Список», доведённый до `mvp/` |
| [`archive/constructor-styles`](https://github.com/serjnsk/trenergram/tree/archive/constructor-styles) | Самая первая проба конструктора в пяти направлениях |
| [`archive/mvp-strava-prototype`](https://github.com/serjnsk/trenergram/tree/archive/mvp-strava-prototype) | Прежний дом `mvp/` до переноса в эту ветку |

Достать содержимое: `git checkout archive/screens-4-styles`.

Что уже решено и что переигрывать не стоит, а также открытые вопросы к заказчику — в [`HANDOVER.md`](HANDOVER.md).
