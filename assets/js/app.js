/* Оболочка презентации: навигация, панель, 3D-хост, викторина, оверлеи. */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = window.CONTENT || [];

  const state = {
    index: 0,
    started: false,
    panelOpen: true,
    notesOpen: false,
    overlay: null,
    paused: false,
    webgl: true,
    renderer: null,
    canvas: null,
    activeScene: null,
    scenes: {},
    wired: {},
    labels: [],
    panelRect: null,
    sprint: { phase: 'idle', greenAt: 0, attempts: 0, best: null, timers: [] },
    quiz: { i: 0, score: 0, answered: false, done: false },
    museum: 0,
    warmup: { remaining: 60, running: false, timer: null, step: 0 },
    pointer: { down: false, x: 0, y: 0, moved: false },
    toastTimer: null
  };

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad(n) { return String(n).padStart(2, '0'); }

  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- Разметка слайдов ---------------- */

  function renderSlides() {
    const slides = $('#slides');
    const dots = $('#dots');
    const grid = $('#indexGrid');
    slides.innerHTML = '';
    dots.innerHTML = '';
    grid.innerHTML = '';

    chapters.forEach((ch, i) => {
      const section = document.createElement('section');
      section.className = 'slide';
      section.id = 'chapter-' + ch.id;
      section.dataset.index = String(i);
      section.setAttribute('aria-hidden', 'true');
      section.setAttribute('aria-label', pad(ch.id) + '. ' + ch.title);
      section.innerHTML =
        '<div class="visual-layer"></div>' +
        '<div class="scene-overlays" aria-hidden="true"></div>' +
        '<aside class="copy-panel" aria-label="Текст главы">' +
          '<button class="collapse-copy" type="button" data-collapse aria-label="Свернуть панель" title="Свернуть панель (T)">‹</button>' +
          '<div class="panel-kicker"><span>' + ch.kicker + '</span><span class="time">' + ch.time + '</span></div>' +
          ch.panel +
        '</aside>' +
        '<button class="restore-copy" type="button" data-restore hidden>Показать текст <span aria-hidden="true">›</span></button>';
      slides.appendChild(section);

      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.dataset.go = String(i);
      dot.setAttribute('aria-label', 'Глава ' + (i + 1) + ': ' + ch.navTitle);
      dot.title = pad(i + 1) + '. ' + ch.navTitle + ' · ' + ch.time;
      dots.appendChild(dot);

      const card = document.createElement('button');
      card.className = 'index-card-item';
      card.type = 'button';
      card.dataset.go = String(i);
      card.innerHTML = '<span class="num">' + pad(i + 1) + '</span><strong>' + ch.navTitle + '</strong><span class="time">' + ch.time + '</span>';
      grid.appendChild(card);
    });
  }

  /* ---------------- 3D-хост ---------------- */

  function makeRenderer() {
    if (!state.webgl) return null;
    try {
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute('aria-label', 'Интерактивная 3D-сцена: вращайте мышью, выбирайте объекты');
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        state.webgl = false;
        toast('3D-контекст потерян. Показана статичная схема.');
        showFallbackFor(state.index);
      }, false);
      return renderer;
    } catch (e) {
      state.webgl = false;
      return null;
    }
  }

  function sceneContext() {
    return {
      canvas: state.canvas,
      renderer: state.renderer,
      reducedMotion: reducedMotion,
      emit: handleSceneEvent
    };
  }

  function ensureScene(i) {
    if (!state.webgl) return null;
    if (state.scenes[i]) return state.scenes[i];
    const ch = chapters[i];
    if (!ch || !SP.scenes || !SP.scenes[ch.scene]) return null;
    try {
      const scene = SP.scenes[ch.scene](sceneContext());
      if (!scene || !scene.scene || !scene.camera || !scene.controls) return null;
      scene.controls.enabled = false;
      scene.controls.addEventListener('start', () => {
        if (!state.paused) {
          state.paused = true;
          syncPauseButton();
          toast('Автоповорот остановлен. Кнопка ▶ справа сверху включит его снова.');
        }
      });
      state.scenes[i] = scene;
      return scene;
    } catch (err) {
      console.error('Не удалось построить 3D-сцену', ch.scene, err);
      toast('3D-сцена недоступна. Показан текстовый режим.');
      showFallbackFor(i);
      return null;
    }
  }

  function activateScene(i) {
    const slide = $('.slide[data-index="' + i + '"]');
    if (!slide) return;
    if (state.activeScene && state.activeScene.controls) state.activeScene.controls.enabled = false;
    const scene = ensureScene(i);
    state.activeScene = scene || null;
    state.labels = [];

    const layer = $('.visual-layer', slide);
    if (scene && state.canvas) {
      layer.appendChild(state.canvas);
      state.canvas.style.display = 'block';
      if (state.renderer) {
        state.renderer.setSize(window.innerWidth, window.innerHeight);
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      }
      scene.camera.aspect = window.innerWidth / window.innerHeight;
      scene.camera.updateProjectionMatrix();
      scene.controls.enabled = true;
      scene.controls.autoRotate = !reducedMotion && !state.paused;
      scene.controls.autoRotateSpeed = scene.autoRotateSpeed || 0.42;
      state.labels = scene.labels || [];
      mountLabels();
      applyAnchor();
    } else {
      showFallbackFor(i);
    }
  }

  function showFallbackFor(i) {
    const slide = $('.slide[data-index="' + i + '"]');
    if (!slide) return;
    const layer = $('.visual-layer', slide);
    if (!layer || $('.fallback', layer)) return;
    layer.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'fallback';
    const img = document.createElement('img');
    img.alt = 'Статичная схема главы ' + (i + 1);
    img.src = 'assets/fallback/chapter-' + (i + 1) + '.png';
    img.addEventListener('error', () => {
      img.remove();
      const ph = document.createElement('div');
      ph.className = 'fallback-placeholder';
      ph.innerHTML = '<strong>3D-схема</strong><span>WebGL недоступен — используйте текст и кнопки в панели.</span>';
      box.appendChild(ph);
    });
    const note = document.createElement('div');
    note.className = 'fallback-note';
    note.textContent = '3D недоступно · текст и управление работают';
    box.appendChild(img);
    box.appendChild(note);
    layer.appendChild(box);
  }

  /* ---------------- Якорная область ---------------- */

  function panelIsOpen() {
    return state.panelOpen;
  }

  function computeAnchor() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const short = h <= 820;
    const top = (short ? 58 : 64) + 24;
    const bottom = (short ? 58 : 64) + 24;
    let left = 70;
    let right = w - 58;
    const slide = $('.slide.active');
    const panel = slide ? $('.copy-panel', slide) : null;
    if (panel && !panel.hidden) {
      const r = panel.getBoundingClientRect();
      state.panelRect = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      left = Math.max(left, r.right + 34);
    } else {
      state.panelRect = null;
    }
    if (right - left < 360) left = Math.max(60, right - 360);
    const cx = (left + right) / 2;
    const cy = (top + h - bottom) / 2;
    return { w, h, left, right, top, bottom, cx, cy, open: panelIsOpen() };
  }

  function applyAnchor() {
    const scene = state.activeScene;
    if (!scene || !scene.camera) return;
    const a = computeAnchor();
    const w = a.w, h = a.h;
    scene.camera.aspect = w / h;
    // Сдвигаем проекцию так, чтобы центр объекта оказался в свободной области справа от панели.
    scene.camera.setViewOffset(w, h, w * 0.5 - a.cx, h * 0.5 - a.cy, w, h);
    scene.camera.updateProjectionMatrix();
    if (scene.onAnchor) scene.onAnchor(a);
  }

  /* ---------------- Переключение глав ---------------- */

  function go(n, opts) {
    opts = opts || {};
    n = clamp(Number(n) || 0, 0, chapters.length - 1);
    if (n === state.index && state.started && !opts.force) return;
    const previous = state.index;
    state.index = n;
    state.started = true;

    $$('.slide').forEach((el, i) => {
      const active = i === n;
      el.classList.toggle('active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    const ch = chapters[n];
    $('#chapterNum').textContent = pad(n + 1);
    $('#chapterName').textContent = ch ? ch.navTitle : '';
    $('#counter').textContent = (n + 1) + ' / ' + chapters.length;
    $('#progressFill').style.width = ((n + 1) / chapters.length * 100) + '%';
    updateDots();

    const slide = $('.slide[data-index="' + n + '"]');
    if (slide) {
      const panel = $('.copy-panel', slide);
      if (panel) panel.scrollTop = 0;
    }

    activateScene(n);
    wireChapter(n);
    applyPanelVisibility();
    syncPauseButton();
    if (state.notesOpen) renderNotes();
    if (state.overlay === 'index') renderIndexCurrent();
    if (location.hash !== '#' + (n + 1)) {
      try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) { /* file:// */ }
    }
  }

  function next() { go(state.index + 1); }
  function prev() { go(state.index - 1); }

  function updateDots() {
    $$('#dots .dot').forEach((d, i) => {
      d.classList.toggle('active', i === state.index);
      d.classList.toggle('done', i < state.index);
    });
    $('#prevBtn').disabled = state.index === 0;
    $('#nextBtn').disabled = state.index === chapters.length - 1;
  }

  /* ---------------- Панель ---------------- */

  function applyPanelVisibility() {
    $$('.slide').forEach((slide) => {
      const panel = $('.copy-panel', slide);
      const restore = $('.restore-copy', slide);
      if (panel) panel.hidden = !state.panelOpen;
      if (restore) restore.hidden = state.panelOpen;
    });
  }

  function togglePanel(force) {
    state.panelOpen = typeof force === 'boolean' ? force : !state.panelOpen;
    applyPanelVisibility();
    applyAnchor();
    const slide = $('.slide.active');
    if (slide) {
      if (state.panelOpen) {
        const btn = $('.collapse-copy', slide);
        if (btn) btn.focus({ preventScroll: true });
      } else {
        const btn = $('.restore-copy', slide);
        if (btn) btn.focus({ preventScroll: true });
      }
    }
  }

  /* ---------------- Заметки, индекс, секреты, разминка ---------------- */

  function renderNotes() {
    const ch = chapters[state.index];
    if (!ch) return;
    $('#notesTitle').textContent = 'Глава ' + pad(state.index + 1) + ' · ' + ch.navTitle;
    $('#notesBody').innerHTML = ch.notes || '';
  }

  function openNotes() {
    renderNotes();
    state.notesOpen = true;
    $('#notesDrawer').hidden = false;
    const close = $('#notesDrawer [data-close]');
    if (close) close.focus({ preventScroll: true });
  }
  function closeNotes() {
    state.notesOpen = false;
    $('#notesDrawer').hidden = true;
  }
  function toggleNotes() { state.notesOpen ? closeNotes() : openNotes(); }

  function overlayOpen(name) {
    closeOverlays();
    state.overlay = name;
    const el = name === 'index' ? $('#indexOverlay') : name === 'secrets' ? $('#secretsOverlay') : $('#warmupOverlay');
    if (!el) return;
    if (name === 'index') renderIndexCurrent();
    el.hidden = false;
    const focusable = el.querySelector('button, [tabindex]');
    if (focusable) focusable.focus({ preventScroll: true });
  }
  function closeOverlays() {
    ['index', 'secrets', 'warmup'].forEach((name) => {
      const el = name === 'index' ? $('#indexOverlay') : name === 'secrets' ? $('#secretsOverlay') : $('#warmupOverlay');
      if (el) el.hidden = true;
    });
    state.overlay = null;
  }
  function renderIndexCurrent() {
    $$('#indexGrid .index-card-item').forEach((c, i) => c.classList.toggle('current', i === state.index));
  }

  function repeatSecrets() {
    const cards = $$('#secretsOverlay [data-secret-card]');
    cards.forEach((c, i) => {
      c.classList.remove('pulse');
      void c.offsetWidth;
      c.style.animationDelay = (i * 0.18) + 's';
      c.classList.add('pulse');
    });
    toast('Сила — вращение — точность!');
  }

  function warmupRender() {
    const w = state.warmup;
    $('#warmupTimer').textContent = String(w.remaining);
    const active = Math.min(2, Math.floor((60 - w.remaining) / 20));
    w.step = active;
    $$('#warmupSteps .warmup-step').forEach((s, i) => s.classList.toggle('active', w.running && i === active));
  }
  function warmupStart() {
    const w = state.warmup;
    clearInterval(w.timer);
    w.remaining = 60;
    w.running = true;
    warmupRender();
    w.timer = setInterval(() => {
      w.remaining -= 1;
      if (w.remaining <= 0) {
        w.remaining = 0;
        w.running = false;
        clearInterval(w.timer);
        w.timer = null;
        toast('Разминка окончена. Садимся и продолжаем!');
      }
      warmupRender();
    }, 1000);
  }
  function warmupStop() {
    const w = state.warmup;
    w.running = false;
    clearInterval(w.timer);
    w.timer = null;
    warmupRender();
  }

  /* ---------------- Полный экран и пауза ---------------- */

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      const p = el.requestFullscreen ? el.requestFullscreen() : null;
      if (p && p.catch) p.catch(() => toast('Полный экран недоступен — показ продолжится в окне.'));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
  function syncFullscreenButton() {
    const btn = $('#fullscreenBtn');
    if (!btn) return;
    const on = !!document.fullscreenElement;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Выйти из полного экрана (F)' : 'Полный экран (F)');
    btn.title = on ? 'Выйти из полного экрана (F)' : 'Полный экран (F)';
  }

  function syncPauseButton() {
    const btn = $('#pauseBtn');
    if (!btn) return;
    btn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
    const label = state.paused ? 'Включить автоповорот' : 'Пауза автоповорота';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
  function togglePause() {
    state.paused = !state.paused;
    if (state.activeScene && state.activeScene.controls) {
      state.activeScene.controls.autoRotate = !state.paused && !reducedMotion;
    }
    syncPauseButton();
    toast(state.paused ? 'Автоповорот остановлен' : 'Автоповорот включён');
  }

  /* ---------------- Подписи 3D ---------------- */

  function mountLabels() {
    const root = $('#labels');
    root.innerHTML = '';
    state.labels.forEach((label) => {
      const el = document.createElement('div');
      el.className = 'scene-label' + (label.accent ? ' accent' : '');
      el.textContent = label.text;
      root.appendChild(el);
      label._el = el;
    });
  }

  function updateLabels() {
    const scene = state.activeScene;
    if (!scene || !scene.camera) return;
    const w = window.innerWidth, h = window.innerHeight;
    const panel = state.panelRect;
    state.labels.forEach((label) => {
      const el = label._el;
      if (!el) return;
      const cls = 'scene-label' + (label.accent ? ' accent' : '');
      if (el.className !== cls) el.className = cls;
      if (el.textContent !== label.text) el.textContent = label.text;
      if (label.hidden || !label.position) { el.style.display = 'none'; return; }
      const v = label.position.clone().project(scene.camera);
      if (v.z < -1 || v.z > 1) { el.style.display = 'none'; return; }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      if (x < -80 || x > w + 80 || y < -60 || y > h + 60) { el.style.display = 'none'; return; }
      if (panel && x < panel.right + 8 && y > panel.top - 10 && y < panel.bottom + 10) {
        el.style.display = 'none'; return;
      }
      el.style.display = '';
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-100%)';
    });
  }

  /* ---------------- События сцен ---------------- */

  function handleSceneEvent(type, payload) {
    payload = payload || {};
    if (type === 'title-status') {
      const el = $('#titleStatus');
      if (el) { el.textContent = payload.text || ''; el.className = 'status ' + (payload.kind || 'neutral'); }
    }
    if (type === 'fb-status') {
      const status = $('#fbStatus');
      const curve = $('#fbCurve');
      if (status) { status.textContent = payload.text || '—'; status.className = 'readout-value ' + (payload.kind === 'bad' ? 'orange' : ''); }
      if (curve && payload.curve != null) curve.textContent = payload.curve;
    }
    if (type === 'pole-energy') {
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.style.width = clamp(v, 0, 100) + '%'; };
      set('energyKinetic', payload.kinetic || 0);
      set('energyElastic', payload.elastic || 0);
      set('energyPotential', payload.potential || 0);
      if (payload.height != null) {
        const el = $('#poleHeight');
        if (el) el.textContent = String(payload.height).replace('.', ',') + ' м';
      }
      if (payload.status) {
        const el = $('#poleStatus');
        if (el) {
          el.textContent = payload.status;
          el.className = 'readout-value ' + (payload.kind === 'bad' ? 'orange' : '');
        }
      }
    }
    if (type === 'sprint-status') {
      const el = $('#sprintStatus');
      if (el) { el.textContent = payload.text || ''; el.className = 'status ' + (payload.kind || 'neutral'); }
    }
    if (type === 'cycle-status') {
      const el = $('#aeroStatus');
      if (el) { el.textContent = payload.text || ''; el.className = 'status ' + (payload.kind || 'neutral'); }
    }
    if (type === 'spin-status') {
      const el = $('#spinStatus');
      if (el) { el.textContent = payload.text || ''; el.className = 'status ' + (payload.kind || 'neutral'); }
    }
    if (type === 'museum-select') {
      selectYear(Number(payload.year));
    }
    if (type === 'secret-select') {
      const key = ['force', 'spin', 'precision'][payload.index];
      const btn = document.querySelector('.slide.active [data-act="secret"][data-secret="' + key + '"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
    }
  }

  /* ---------------- Подключение контролов ---------------- */

  function sceneOf(i) { return state.scenes[i] || null; }

  function setPressed(group, button) {
    $$('[data-act="' + group + '"]', button.closest('.copy-panel') || document).forEach((b) => {
      b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
    });
  }

  function wireChapter(i) {
    if (state.wired[i]) return;
    const slide = $('.slide[data-index="' + i + '"]');
    if (!slide) return;
    const panel = $('.copy-panel', slide);
    if (!panel) return;
    state.wired[i] = true;

    // Кнопка «Показать текст» лежит рядом с панелью, поэтому слушаем весь слайд.
    slide.addEventListener('click', (e) => {
      if (e.target.closest('[data-restore]')) togglePanel(true);
    });

    panel.addEventListener('click', (e) => {
      const collapse = e.target.closest('[data-collapse]');
      if (collapse) { togglePanel(false); return; }
      const restore = e.target.closest('[data-restore]');
      if (restore) { togglePanel(true); return; }
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      const sc = sceneOf(i);
      const api = sc && sc.api;

      if (i === 0) {
        if (act === 'title-kick') { if (api) api.kick(); else toast('В этом режиме 3D недоступно.'); }
        if (act === 'title-reset') { if (api) api.reset(); }
      }

      if (i === 1) {
        if (act === 'secret') {
          const key = btn.dataset.secret;
          const was = btn.getAttribute('aria-pressed') === 'true';
          $$('[data-act="secret"]', panel).forEach((b) => b.setAttribute('aria-pressed', 'false'));
          btn.setAttribute('aria-pressed', was ? 'false' : 'true');
          if (api) api.select(was ? -1 : (key === 'force' ? 0 : key === 'spin' ? 1 : 2));
          const read = $('#secretReadout');
          if (read) {
            read.className = 'status good';
            read.textContent = was ? 'Выберите секрет — объект в 3D подсветится.' : key === 'force'
              ? 'Сила: сильнее оттолкнулся — быстрее полетел. Покажите жест: топнуть ногой.'
              : key === 'spin' ? 'Вращение: закрутил — мяч полетел по дуге. Покрутите рукой.'
              : 'Точность: попал в цель — получил результат. Покажите на цель.';
          }
        }
        if (act === 'memory') {
          const box = $('#memoryBox');
          const hidden = box.classList.toggle('hidden');
          btn.textContent = hidden ? 'Показать слова' : 'Проверь память';
          if (api) api.memory(hidden);
          const read = $('#secretReadout');
          if (read) { read.className = 'status neutral'; read.textContent = hidden ? 'Слова спрятаны. Назовите три секрета и покажите жесты.' : 'Слова снова видны. Проверьте себя.'; }
        }
      }

      if (i === 2) {
        if (act === 'target') {
          setPressed('target', btn);
          if (api) api.setTarget(btn.dataset.target);
        }
        if (act === 'fb-kick') { if (api) api.kick(); }
        if (act === 'fb-slow') {
          const on = btn.getAttribute('aria-pressed') !== 'true';
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (api) api.setSlow(on);
        }
        if (act === 'fb-reset') { if (api) api.reset(); }
      }

      if (i === 3) {
        if (act === 'sprint') sprintAction();
        if (act === 'sprint-reset') resetSprint();
      }

      if (i === 4) {
        if (act === 'pole-jump') { if (api) api.jump(); }
        if (act === 'pole-reset') { if (api) api.reset(); }
      }

      if (i === 5) {
        if (act === 'mode') {
          setPressed('mode', btn);
          if (api) api.setMode(btn.dataset.mode);
          const label = $('#aeroLabel');
          const speedLabel = $('#speedLabel');
          if (label) label.textContent = btn.dataset.mode === 'bike' ? 'Аэродинамичная поза' : 'Обтекаемость пловца';
          if (speedLabel) speedLabel.textContent = btn.dataset.mode === 'bike' ? 'Скорость' : 'Скорость';
          updateCycleReadout(btn.dataset.mode === 'bike' ? 'bike' : 'swim', Number($('#aeroRange').value));
        }
        if (act === 'aero') { /* range handled on input */ }
      }

      if (i === 6) {
        if (act === 'spin-mode') {
          setPressed('spin-mode', btn);
          if (api) api.select(btn.dataset.spin);
          updateSpinReadout(btn.dataset.spin, Number($('#spinRange').value));
        }
      }

      if (i === 7) {
        if (act === 'year') {
          setPressed('year', btn);
          selectYear(Number(btn.dataset.year));
        }
      }

      if (i === 8) {
        if (act === 'quiz-option') quizAnswer(Number(btn.dataset.opt));
        if (act === 'quiz-next') quizNext();
        if (act === 'quiz-reset') quizReset();
        if (act === 'quiz-final') quizFinal();
      }
    });

    panel.addEventListener('input', (e) => {
      const id = e.target.id;
      const sc = sceneOf(i);
      const api = sc && sc.api;
      if (id === 'fbForce') {
        const out = $('#fbForceOut');
        if (out) out.textContent = e.target.value + ' км/ч';
        if (api) api.setForce(Number(e.target.value));
      }
      if (id === 'fbSpin') {
        const v = Number(e.target.value);
        const out = $('#fbSpinOut');
        if (out) out.textContent = (v > 0 ? 'вправо' : v < 0 ? 'влево' : 'без закрутки') + (v ? ' · ' + Math.abs(v) : '');
        if (api) api.setSpin(v);
      }
      if (id === 'poleSpeed') {
        const v = Number(e.target.value);
        const out = $('#poleSpeedOut');
        if (out) out.textContent = String(v).replace('.', ',') + ' м/с';
        if (api) api.setSpeed(v);
      }
      if (id === 'aeroRange') {
        const v = Number(e.target.value);
        const out = $('#aeroOut');
        if (out) out.textContent = v + '%';
        if (api) api.setAero(v);
        const mode = $('.seg[data-act="mode"][aria-pressed="true"]', panel);
        updateCycleReadout(mode ? mode.dataset.mode : 'bike', v);
      }
      if (id === 'spinRange') {
        const v = Number(e.target.value);
        const out = $('#spinOut');
        if (out) out.textContent = (v > 0 ? 'вправо' : v < 0 ? 'влево' : 'без закрутки') + (v ? ' · ' + Math.abs(v) : '');
        if (api) api.setSpin(v);
        const mode = $('.seg[data-act="spin-mode"][aria-pressed="true"]', panel);
        updateSpinReadout(mode ? mode.dataset.spin : 'football', v);
      }
    });

    // initial values for this chapter
    if (i === 2) {
      const sc = sceneOf(2);
      if (sc && sc.api) {
        sc.api.setForce(Number($('#fbForce').value));
        sc.api.setSpin(Number($('#fbSpin').value));
        sc.api.setTarget('right');
      }
    }
    if (i === 4) {
      const sc = sceneOf(4);
      if (sc && sc.api) sc.api.setSpeed(Number($('#poleSpeed').value));
    }
    if (i === 5) {
      const sc = sceneOf(5);
      if (sc && sc.api) sc.api.setAero(Number($('#aeroRange').value));
      updateCycleReadout('bike', Number($('#aeroRange').value));
    }
    if (i === 6) {
      const sc = sceneOf(6);
      if (sc && sc.api) sc.api.setSpin(Number($('#spinRange').value));
      updateSpinReadout('football', Number($('#spinRange').value));
    }
    if (i === 7) selectYear(1997);
    if (i === 8) renderQuiz();
  }

  function setRangeFill(input) {
    if (!input) return;
    const min = Number(input.min || 0), max = Number(input.max || 100), v = Number(input.value);
    const p = ((v - min) / (max - min)) * 100;
    input.style.background = 'linear-gradient(90deg, var(--orange) 0%, var(--orange) ' + p + '%, rgba(20,35,30,.08) ' + p + '%, rgba(20,35,30,.08) 100%)';
  }

  /* ---------------- Спринт ---------------- */

  function clearSprintTimers() {
    state.sprint.timers.forEach((t) => clearTimeout(t));
    state.sprint.timers = [];
  }
  function sprintStatus(text, kind) {
    const el = $('#sprintStatus');
    if (el) { el.textContent = text; el.className = 'status ' + (kind || 'neutral'); }
  }
  function sprintButton(text) {
    const b = $('#sprintBtn');
    if (b) b.textContent = text;
  }
  function startSprint() {
    clearSprintTimers();
    const s = state.sprint;
    const sc = sceneOf(3);
    if (!sc) { toast('3D недоступно — используйте кнопку как таймер.'); }
    s.phase = 'ready';
    s.attempts++;
    s.greenAt = 0;
    sprintButton('ЖМИ!');
    sprintStatus('Приготовьтесь…', 'neutral');
    if (sc && sc.api) { sc.api.setLight('red'); sc.api.resetRunner(); }
    if (sc && sc.api) sc.api.setLight('red');
    const t1 = setTimeout(() => {
      if (state.index !== 3 || state.sprint.phase !== 'ready') return;
      if (sc && sc.api) sc.api.setLight('yellow');
      sprintStatus('Внимание…', 'neutral');
    }, 550);
    const delay = 1300 + Math.random() * 1900;
    const t2 = setTimeout(() => {
      if (state.index !== 3 || state.sprint.phase !== 'ready') return;
      s.phase = 'go';
      s.greenAt = performance.now();
      if (sc && sc.api) { sc.api.setLight('green'); sc.api.run(); }
      sprintStatus('ЗЕЛЁНЫЙ! Жмите пробел или кнопку!', 'good');
    }, 550 + delay);
    s.timers.push(t1, t2);
  }
  function sprintAction() {
    const s = state.sprint;
    if (s.phase === 'ready') { falseStart(); return; }
    if (s.phase === 'go') { sprintReact(); return; }
    startSprint();
  }
  function falseStart() {
    clearSprintTimers();
    const s = state.sprint;
    s.phase = 'false';
    const sc = sceneOf(3);
    if (sc && sc.api) { sc.api.setLight('red'); sc.api.falseStart(); }
    sprintStatus('Фальстарт! Стартовать можно только после зелёного.', 'bad');
    sprintButton('Ещё раз');
    const t = setTimeout(() => { if (state.index === 3 && state.sprint.phase === 'false') resetSprint(); }, 2200);
    s.timers.push(t);
  }
  function sprintReact() {
    const s = state.sprint;
    const t = (performance.now() - s.greenAt) / 1000;
    if (t < 0.1) { falseStart(); return; }
    s.phase = 'done';
    if (s.best == null || t < s.best) s.best = t;
    const el = $('#sprintTime');
    if (el) el.textContent = t.toFixed(3).replace('.', ',') + ' с';
    const meter = $('#sprintMeter');
    if (meter) meter.style.width = clamp(100 - (t - 0.12) * 105, 8, 100) + '%';
    sprintStatus(t < 0.2 ? 'Отлично! Это уровень хорошей реакции.' : t < 0.28 ? 'Хорошо! Реакция тренируется.' : 'Есть над чем работать: попробуйте ещё раз.', t < 0.28 ? 'good' : 'neutral');
    sprintButton('Ещё раз');
    const sc = sceneOf(3);
    if (sc && sc.api) sc.api.finish(t);
    const timer = setTimeout(() => { if (state.index === 3 && state.sprint.phase === 'done') sprintButton('Ещё раз'); }, 2200);
    s.timers.push(timer);
  }
  function resetSprint() {
    clearSprintTimers();
    state.sprint.phase = 'idle';
    state.sprint.greenAt = 0;
    const sc = sceneOf(3);
    if (sc && sc.api) { sc.api.reset(); sc.api.setLight('off'); }
    const el = $('#sprintTime');
    if (el) el.textContent = '—';
    const meter = $('#sprintMeter');
    if (meter) meter.style.width = '0%';
    sprintButton('На старт');
    sprintStatus('Нажмите «На старт». На зелёный — жмите пробел или кнопку.', 'neutral');
  }

  /* ---------------- Велосипед / плавание ---------------- */

  function updateCycleReadout(mode, aero) {
    const t = clamp(aero, 0, 100);
    const speed = mode === 'bike' ? 32 + t * 0.23 : 4.2 + t * 0.035;
    const drag = t > 75 ? 'низкое' : t > 40 ? 'среднее' : 'высокое';
    const sp = $('#aeroSpeed');
    const dr = $('#aeroDrag');
    if (sp) sp.textContent = String(speed.toFixed(1)).replace('.', ',') + ' км/ч';
    if (dr) dr.textContent = drag;
  }

  /* ---------------- Вращение ---------------- */

  function updateSpinReadout(mode, spin) {
    const dir = spin > 0 ? 'вправо' : spin < 0 ? 'влево' : 'нет';
    const effect = mode === 'football' ? 'дуга' : mode === 'tennis' ? 'нырок' : 'мягкий отскок';
    const eff = $('#spinEffect');
    const d = $('#spinDirection');
    if (eff) eff.textContent = effect;
    if (d) d.textContent = dir;
  }

  /* ---------------- Музей ---------------- */

  function selectYear(year) {
    const idx = window.MUSEUM.findIndex((m) => Number(m.year) === year);
    if (idx < 0) return;
    state.museum = idx;
    const info = $('#museumInfo');
    const m = window.MUSEUM[idx];
    if (info) {
      info.innerHTML = '<div class="museum-year">' + m.year + '</div><h3>' + m.title + '</h3><p>' + m.text + '</p><p class="fact">' + m.detail + '</p>';
    }
    const btn = $('.seg[data-act="year"][data-year="' + year + '"]');
    if (btn) setPressed('year', btn);
    const sc = sceneOf(7);
    if (sc && sc.api) sc.api.select(idx);
  }

  /* ---------------- Викторина ---------------- */

  function quizPips() {
    let html = '<div class="quiz-progress" aria-hidden="true">';
    for (let k = 0; k < window.QUIZ.length; k++) {
      html += '<span class="quiz-pip ' + (k < state.quiz.i ? 'done' : k === state.quiz.i && !state.quiz.done ? 'active' : '') + '"></span>';
    }
    html += '</div><span class="quiz-count">' + Math.min(state.quiz.i + 1, window.QUIZ.length) + ' / ' + window.QUIZ.length + '</span>';
    return html;
  }

  function renderQuiz() {
    const card = $('#quizCard');
    if (!card) return;
    const q = state.quiz;
    if (q.done) {
      const total = window.QUIZ.length;
      const praise = q.score === total ? 'Идеально! Кубок сияет!' : q.score >= total - 2 ? 'Отличная работа!' : 'Хорошее начало — повторите три секрета.';
      card.innerHTML =
        '<div class="quiz-score">' + q.score + ' / ' + total + ' <span>правильных</span></div>' +
        '<p class="panel-lead">' + praise + '</p>' +
        '<div class="final-words"><span class="final-word">СИЛА</span><span class="final-word">ВРАЩЕНИЕ</span><span class="final-word">ТОЧНОСТЬ</span></div>' +
        '<p class="final-say">Скажи соседу три слова и покажи три жеста. Кто запомнил — тот готов объяснить любой рекорд.</p>' +
        '<div class="btn-row"><button class="btn primary" type="button" data-act="quiz-reset">Пройти ещё раз</button><button class="btn secondary" type="button" data-act="quiz-final">Финал</button></div>';
      const prompt = $('#quizPrompt');
      if (prompt) prompt.innerHTML = '<strong>Билет на выход:</strong> назови один секрет и один пример. Спасибо классу!';
      return;
    }
    const item = window.QUIZ[q.i];
    let opts = '';
    item.options.forEach((o, k) => {
      let cls = 'quiz-option';
      if (q.answered) {
        if (k === item.answer) cls += ' correct';
        else if (k === q.chosen) cls += ' wrong';
      }
      opts += '<button class="' + cls + '" type="button" data-act="quiz-option" data-opt="' + k + '" ' + (q.answered ? 'disabled' : '') + '><span class="mark">' + String.fromCharCode(65 + k) + '</span>' + o + '</button>';
    });
    card.innerHTML =
      '<div class="quiz-top">' + quizPips() + '</div>' +
      '<p class="quiz-question">' + item.q + '</p>' +
      '<div class="quiz-options">' + opts + '</div>' +
      '<p class="quiz-feedback ' + (q.answered ? (q.chosen === item.answer ? 'good' : 'bad') : '') + '" aria-live="polite">' +
        (q.answered ? (q.chosen === item.answer ? 'Верно! ' : 'Почти! Правильный ответ: ' + String.fromCharCode(65 + item.answer) + '. ') + item.why : 'Выберите ответ — обсудите командой.') +
      '</p>' +
      (q.answered ? '<div class="btn-row"><button class="btn primary" type="button" data-act="quiz-next">' + (q.i === window.QUIZ.length - 1 ? 'Итоги' : 'Дальше') + '</button></div>' : '');
  }

  function quizAnswer(k) {
    const q = state.quiz;
    if (q.answered || q.done) return;
    q.answered = true;
    q.chosen = k;
    const item = window.QUIZ[q.i];
    if (k === item.answer) q.score++;
    const sc = sceneOf(8);
    if (sc && sc.api) {
      if (k === item.answer) sc.api.correct(q.score); else sc.api.wrong();
    }
    renderQuiz();
  }
  function quizNext() {
    const q = state.quiz;
    if (!q.answered) return;
    if (q.i >= window.QUIZ.length - 1) {
      q.done = true;
      const sc = sceneOf(8);
      if (sc && sc.api) sc.api.celebrate();
    } else {
      q.i++;
      q.answered = false;
      q.chosen = null;
      const sc = sceneOf(8);
      if (sc && sc.api) sc.api.setQuestion(q.i);
    }
    renderQuiz();
  }
  function quizReset() {
    state.quiz = { i: 0, score: 0, answered: false, done: false, chosen: null };
    const sc = sceneOf(8);
    if (sc && sc.api) sc.api.reset();
    renderQuiz();
  }
  function quizFinal() {
    openSecrets();
    toast('Сила — вращение — точность!');
  }

  /* ---------------- Клавиатура и события ---------------- */

  function isTypingTarget(t) {
    return !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'));
  }
  function isButtonTarget(t) {
    return !!(t && t.closest && t.closest('button, a, summary'));
  }

  function onKeydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key;
    if (key === 'Escape') {
      if (state.overlay) { closeOverlays(); return; }
      if (state.notesOpen) { closeNotes(); return; }
      if (state.panelOpen) { togglePanel(false); return; }
      return;
    }
    if (key === 'f' || key === 'F') { e.preventDefault(); toggleFullscreen(); return; }
    if (key === 'n' || key === 'N') { e.preventDefault(); toggleNotes(); return; }
    if (key === 'm' || key === 'M') { e.preventDefault(); state.overlay === 'index' ? closeOverlays() : overlayOpen('index'); return; }
    if (key === 's' || key === 'S') { e.preventDefault(); state.overlay === 'secrets' ? closeOverlays() : openSecrets(); return; }
    if (key === 'w' || key === 'W') { e.preventDefault(); state.overlay === 'warmup' ? closeOverlays() : overlayOpen('warmup'); return; }
    if (key === 't' || key === 'T') { e.preventDefault(); togglePanel(); return; }
    if (isTypingTarget(e.target)) return;

    if (key === ' ' || key === 'Spacebar') {
      if (state.index === 3 && !isButtonTarget(e.target)) { e.preventDefault(); sprintAction(); return; }
      if (!isButtonTarget(e.target)) { e.preventDefault(); next(); }
      return;
    }
    if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'PageDown') { e.preventDefault(); next(); return; }
    if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp') { e.preventDefault(); prev(); return; }
    if (key === 'Home') { e.preventDefault(); go(0); return; }
    if (key === 'End') { e.preventDefault(); go(chapters.length - 1); return; }
  }

  function onPointerDown(e) {
    if (!state.activeScene || !state.canvas) return;
    state.pointer.down = true;
    state.pointer.x = e.clientX; state.pointer.y = e.clientY; state.pointer.moved = false;
  }
  function onPointerMove(e) {
    if (!state.activeScene) return;
    if (state.pointer.down) {
      const dx = e.clientX - state.pointer.x, dy = e.clientY - state.pointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) state.pointer.moved = true;
    }
  }
  function onPointerUp(e) {
    if (!state.activeScene || !state.canvas) return;
    const moved = state.pointer.moved;
    state.pointer.down = false;
    if (moved || e.button !== 0) return;
    const rect = state.canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, state.activeScene.camera);
    const hits = ray.intersectObjects(state.activeScene.scene.children, true);
    for (let i = 0; i < hits.length; i++) {
      let o = hits[i].object;
      while (o) {
        if (o.userData && typeof o.userData.pick === 'function') {
          o.userData.pick(hits[i]);
          return;
        }
        o = o.parent;
      }
    }
  }

  function bindGlobal() {
    $('#prevBtn').addEventListener('click', prev);
    $('#nextBtn').addEventListener('click', next);
    $('#dots').addEventListener('click', (e) => {
      const d = e.target.closest('[data-go]');
      if (d) go(Number(d.dataset.go));
    });
    $('#indexGrid').addEventListener('click', (e) => {
      const d = e.target.closest('[data-go]');
      if (d) { closeOverlays(); go(Number(d.dataset.go)); }
    });
    $$('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'index') state.overlay === 'index' ? closeOverlays() : overlayOpen('index');
        if (a === 'secrets') openSecrets();
        if (a === 'warmup') overlayOpen('warmup');
        if (a === 'notes') toggleNotes();
        if (a === 'pause') togglePause();
        if (a === 'fullscreen') toggleFullscreen();
      });
    });
    $$('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const what = btn.dataset.close;
        if (what === 'notes') closeNotes();
        else closeOverlays();
      });
    });
    $$('#indexOverlay, #secretsOverlay, #warmupOverlay').forEach((ov) => {
      ov.addEventListener('click', (e) => { if (e.target === ov) closeOverlays(); });
    });
    $('[data-repeat-secrets]').addEventListener('click', repeatSecrets);
    $('#warmupStart').addEventListener('click', warmupStart);
    $('#warmupStop').addEventListener('click', warmupStop);
    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', () => {
      if (state.renderer) {
        state.renderer.setSize(window.innerWidth, window.innerHeight);
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      }
      if (state.activeScene) {
        state.activeScene.camera.aspect = window.innerWidth / window.innerHeight;
        state.activeScene.camera.updateProjectionMatrix();
      }
      applyAnchor();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (state.activeScene && state.activeScene.controls) state.activeScene.controls.autoRotate = false;
      } else if (state.activeScene && state.activeScene.controls) {
        state.activeScene.controls.autoRotate = !state.paused && !reducedMotion;
      }
    });
    if (state.canvas) {
      state.canvas.addEventListener('pointerdown', onPointerDown);
      state.canvas.addEventListener('pointermove', onPointerMove);
      state.canvas.addEventListener('pointerup', onPointerUp);
    }
  }

  function openSecrets() {
    overlayOpen('secrets');
  }

  /* ---------------- Запуск ---------------- */

  function init() {
    renderSlides();
    state.webgl = webglAvailable();
    state.renderer = makeRenderer();
    if (state.renderer) state.canvas = state.renderer.domElement;
    bindGlobal();
    const initial = clamp((parseInt((location.hash || '#1').replace('#', ''), 10) || 1) - 1, 0, chapters.length - 1);
    go(initial, { force: true });
    if (!state.webgl) toast('WebGL недоступен: показаны статичные схемы, текст и викторина работают.');

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (!document.hidden && state.activeScene && state.renderer) {
        try {
          if (state.activeScene.update) state.activeScene.update(dt, now / 1000);
          if (state.activeScene.controls) state.activeScene.controls.update();
          state.renderer.render(state.activeScene.scene, state.activeScene.camera);
          updateLabels();
        } catch (err) {
          console.error(err);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.APP = {
    go, next, prev, togglePanel, toggleNotes, toggleFullscreen, togglePause,
    openNotes, closeNotes, openSecrets, closeOverlays,
    get state() { return state; },
    get scene() { return state.activeScene; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
