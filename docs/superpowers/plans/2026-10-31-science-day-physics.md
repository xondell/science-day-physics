# «Физика безупречного гола» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, one session) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Собрать автономный интерактивный 3D-лекторий на 9 глав для 1–4 классов, 39 минут, с обязательным 3D и интерактивом на каждой главе.

**Architecture:** Одна статическая страница без сборки. Классические скрипты, локальный Three.js (IIFE), один `WebGLRenderer`, лениво создаваемые сцены, canvas переезжает в `.visual-layer` активной главы. Панель слева overlay, камера сдвигается в якорную область через `setViewOffset`.

**Tech Stack:** HTML5, CSS3, vanilla JS (classic scripts), Three.js r170 (bundled), CanvasTexture, OrbitControls; Playwright для QA.

**Spec:** `docs/superpowers/specs/2026-10-31-science-day-physics-design.md`

## Global Constraints

- Только ноутбук/проектор: 1366×768, 1920×1080, 4:3. Телефон не тестировать.
- 3D и смысловой интерактив на **каждой** из 9 глав.
- Офлайн: никаких CDN, fetch, ES-модулей, внешних GLB; запуск с `file://`.
- Один WebGL-контекст; неактивные сцены не рендерятся.
- Русский язык, 1–4 классы, 39 минут, 5+ точек повтора.
- Fullscreen scene: `.visual-layer` = viewport ±3 px; панель overlay; restore вне панели.
- Все точные числа — с источником; модели подписаны как упрощённые.
- Заметки с предупреждением «видны на общем экране»; ответы викторины после клика.

## Review Focus

1. Canvas/сцена уезжает под панель или в колонку — проверять boundingRect и скриншоты open/closed.
2. 3D-объект вращается за панелью — проверять проекцию pivot в якорной области.
3. WebGL-контекст теряется/постер не появляется — тест с отключённым WebGL.
4. Стрелки на слайдере листают презентацию — тест клавиатуры на input.
5. Состояние викторины/ползунков сбрасывается при сворачивании панели — тест.

---

### Task 1: Каркас, шрифты, Three.js, данные глав

**Files:**
- Create: `index.html`, `assets/css/styles.css`, `assets/js/content.js`, `assets/js/app.js`, `assets/vendor/three.global.js`, `assets/fonts/*`
- Test: `tools/smoke.mjs`

**Interfaces:**
- `window.CONTENT = [{id, slug, kicker, title, time, panel, notes, scene}]`
- `window.APP = {go(n), next(), prev(), togglePanel(), toggleNotes(), ...}`

- [ ] Собрать Three.js + OrbitControls + RoundedBoxGeometry в IIFE, положить в `assets/vendor/three.global.js`.
- [ ] Скачать/скопировать `Unbounded` и `Manrope` (cyrillic woff2) + OFL.
- [ ] Создать `index.html` с шапкой, подвалом, контейнером слайдов, overlay-слоями.
- [ ] Создать `content.js` с 9 главами (тексты-заглушки допустимы на этом шаге).
- [ ] Проверить: страница открывается, 9 слайдов в DOM, шрифты грузятся локально, нет внешних запросов.

### Task 2: Движок презентации и панель

**Files:**
- Modify: `assets/js/app.js`, `assets/css/styles.css`, `index.html`

**Interfaces:**
- `go(n)`, `next()`, `prev()`, `renderSlide(n)`, `updateAnchor()`, `togglePanel()`, `toggleNotes()`, `toggleFullscreen()`, `togglePause()`.
- Slide DOM: `.slide > .visual-layer + .copy-panel + .restore-copy`.

- [ ] Реализовать один активный слайд, переходы без гонок, `#N`, Home/End, границы.
- [ ] Панель: collapse/restore, фокус, сохранение состояния, `T`.
- [ ] Шапка: главы, три секрета, разминка, заметки, пауза, fullscreen; `F`, `N`, `M`, `S`, `W`.
- [ ] Заметки-шторка с предупреждением; индекс; toast.
- [ ] Проверить: 20 быстрых переходов, панель open/closed, клавиши не крадут slider.

### Task 3: 3D-ядро и библиотека моделей

**Files:**
- Create: `assets/js/models.js`, `assets/js/scenes.js`

**Interfaces:**
- `SP.models.*` builders return `THREE.Group`.
- `SP.core.createRenderer()`, `SP.core.SceneHost` with `activate/deactivate/render/setAnchor/raycast`.
- Scene contract: `{build(ctx) -> {scene,camera,controls,update,labels,focus,dispose}}`.

- [ ] Один renderer, alpha, DPR cap, shadows, tone mapping.
- [ ] Перенос canvas в активный `.visual-layer`; resize; `setViewOffset` по anchor area.
- [ ] OrbitControls, auto-rotate, pause, click-vs-drag raycast.
- [ ] HTML-подписи с проекцией; скрытие под панелью.
- [ ] Fallback-постер при отсутствии WebGL/потере контекста.
- [ ] Модели: платформа, мячи, ворота, манекен, бегун, вратарь, шест, велосипед, бассейн, кубок, витрина.
- [ ] Проверить: сцена 100vw×100dvh, pivot в якоре, 60 fps на 1366×768.

### Task 4: Главы 1–3 (титул, секреты, футбол)

- [ ] Title: стадион, удар, конфетти, сброс.
- [ ] Secrets: 3 пьедестала, выбор, память, жесты.
- [ ] Football: симуляция силы/Магнуса, 3 цели, вратарь, дуга в метрах, замедление, сброс.
- [ ] Тесты: 3 закрутки → 3 разные траектории; сила → время; сброс.

### Task 5: Главы 4–6 (спринт, шест, велосипед/плавание)

- [ ] Sprint: светофор, случайная задержка, реакция, фальстарт, 3 попытки.
- [ ] Pole: слайдер, изгиб шеста, планка, энергия, успех/сбил.
- [ ] Cycle/swim: вкладки, ползунок, частицы, скорость.
- [ ] Тесты: каждая кнопка/вкладка/ползунок меняет 3D/числа.

### Task 6: Главы 7–9 (вращение, рекорды, викторина)

- [ ] Spin: 3 мяча, направление, дуга/отскок.
- [ ] Museum: 5 объектов/годов, подсветка, карточки, старый/новый мяч.
- [ ] Quiz: 6 вопросов, ответы, счёт, кубок, конфетти, финал.
- [ ] Тесты: все ответы, счёт, сброс, финал.

### Task 7: Контент, сценарий, источники

- [ ] `docs/lesson-script.md`: тайминг, речь, 5 повторов, адаптация 1–2/3–4, ответы.
- [ ] `docs/quiz.md`: вопросы + ключ.
- [ ] `docs/sources.md`: ссылки, даты, оговорки.
- [ ] `docs/requirements-coverage.md`: R1–R14 PASS/FAIL.
- [ ] `README.md`: запуск, клавиши, ограничения.

### Task 8: QA и исправления

- [ ] Playwright: 9 глав × 1366/1920 × open/closed; скриншоты в `qa/`.
- [ ] Геометрия `.scene/.visual-layer` = viewport ±3 px.
- [ ] Все интерактивы: значения до/после, 3D-изменение.
- [ ] Fullscreen, notes, quiz, hash, keyboard, reduced motion, WebGL off, file://.
- [ ] 3 прохода, один canvas, console без ошибок.
- [ ] `docs/qa-report.md` с PASS/FAIL/NOT RUN и путями.

### Task 9: Сдача

- [ ] Проверить `index.html` двойным кликом, без сети.
- [ ] Показать 3–5 ключевых скриншотов.
- [ ] Итог: что готово, как открыть, что проверено, что не проверено.
