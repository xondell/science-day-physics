/* Контент урока. Один источник для слайдов, заметок и экспорта в docs/. */
(function () {
  'use strict';

  window.MUSEUM = [
    {
      year: '1997', title: 'Мяч и вращение', object: 'ball',
      text: 'Роберто Карлос закрутил мяч с 35 метров. Воздух давил на него с одной стороны сильнее — и мяч облетел стенку.',
      detail: 'Эффект Магнуса. Исследование 2010 года показало: это не случайность, а физика.'
    },
    {
      year: '2009', title: 'Секундомер', object: 'stopwatch',
      text: 'Усэйн Болт пробежал 100 метров за 9,58 секунды. Его реакция на выстрел — 0,146 секунды.',
      detail: 'Стартовые колодки, точное время и тренировка реакции помогают показать максимум.'
    },
    {
      year: '2014', title: 'Камера у линии', object: 'camera',
      text: 'На чемпионате мира появилась технология определения гола. Она видит, полностью ли мяч пересёк линию.',
      detail: 'Камеры и датчики помогают судье принять точное решение.'
    },
    {
      year: '2022', title: 'Велосипед', object: 'bike',
      text: 'Филиппо Ганна проехал за час 56,792 километра. На такой скорости почти всё решает сопротивление воздуха.',
      detail: 'Поза, шлем, костюм и рама — всё работает на аэродинамику.'
    },
    {
      year: '2026', title: 'Шест', object: 'pole',
      text: 'Арман Дюплантис прыгнул на 6,31 метра. Шест согнулся, накопил энергию и вернул её прыгуну.',
      detail: 'Современные материалы делают шест лёгким и упругим.'
    }
  ];

  window.QUIZ = [
    {
      q: 'Почему закрученный мяч летит по дуге?',
      options: ['Его тянет магнит', 'Воздух давит на него с одной стороны сильнее', 'Мяч становится легче'],
      answer: 1,
      why: 'Это эффект Магнуса: вращение меняет давление воздуха вокруг мяча.'
    },
    {
      q: 'Что нужно сделать, чтобы мяч полетел быстрее?',
      options: ['Сильнее разогнать ногу и передать больше энергии', 'Закрыть глаза', 'Покрутить мяч в другую сторону'],
      answer: 0,
      why: 'Сила удара задаёт скорость. Чем больше энергии передал — тем быстрее полёт.'
    },
    {
      q: 'Зачем спринтеру стартовые колодки?',
      options: ['Чтобы стоять красивее', 'Чтобы оттолкнуться и быстрее набрать скорость', 'Чтобы не слышать выстрел'],
      answer: 1,
      why: 'Колодки дают упор: сила толчка работает лучше, старт получается быстрее.'
    },
    {
      q: 'Куда «прячется» энергия разбега в прыжке с шестом?',
      options: ['В планку', 'В изогнутый шест, а потом возвращается', 'В кроссовки'],
      answer: 1,
      why: 'Шест работает как пружина: сгибается, запасает энергию и поднимает прыгуна.'
    },
    {
      q: 'Почему велосипедист наклоняется вперёд?',
      options: ['Чтобы меньше сопротивляться воздуху', 'Чтобы было жарче', 'Чтобы педали крутились сами'],
      answer: 0,
      why: 'Чем меньше площадь тела, тем меньше сопротивление воздуха и тем выше скорость.'
    },
    {
      q: 'Как science помогает понять, что гол забит?',
      options: ['Спрашивает болельщиков', 'Смотрит камеры и датчики у линии', 'Считает крики'],
      answer: 1,
      why: 'Технология определения гола видит, полностью ли мяч пересёк линию.'
    }
  ];

  window.CONTENT = [
    {
      id: 1, slug: 'start', scene: 'title', navTitle: 'Титул', time: '2 мин',
      kicker: '01 · Старт',
      title: 'Почему мяч летит не туда?',
      panel: `
        <h1 class="panel-title">Почему мяч летит не туда?</h1>
        <p class="panel-lead">Кажется, что мячом управляет волшебство. На самом деле — силы. Сегодня соберём «формулу» гола и рекорда.</p>
        <div class="chips"><span class="chip orange">3D-макет</span><span class="chip green">наука</span><span class="chip blue">спорт</span></div>
        <div class="btn-row">
          <button class="btn primary" type="button" data-act="title-kick">Ударить по мячу</button>
          <button class="btn secondary" type="button" data-act="title-reset">Сброс</button>
        </div>
        <p class="status neutral" id="titleStatus">Покрутите макет мышью. Нажмите «Ударить».</p>
        <p class="fact"><b>Международный день науки.</b> 9 глав, 39 минут, 1–4 классы.</p>
        <p class="panel-prompt"><strong>Вопрос классу:</strong> кто управляет мячом — волшебство или наука?</p>
        <details class="more"><summary>Что нас ждёт</summary><div class="more-body"><p>Футбол, спринт, прыжок с шестом, велосипед, плавание, теннис и баскетбол. И три слова, которые объясняют всё: <b>сила, вращение, точность</b>.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">2 мин</span> · Цель: зацепить вопросом и показать, что мячом управляют силы.</p>
        <h3>Что сказать</h3>
        <p class="say">«Посмотрите на мяч. Кажется, что он летит сам по себе. Но у каждого полёта есть причина. Сегодня мы её найдём».</p>
        <p class="repeat">Повторите вопрос 3 раза: «Кто управляет мячом?» — пауза — «Наука!»</p>
        <h3>Действие</h3>
        <p>Покрутите макет мышью. Нажмите «Ударить по мячу». Спросите: «Почему он попал в угол?» Не объясняйте пока — это интрига.</p>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: достаточно «мячом управляют силы». 3–4: спросите, какие силы они знают.</p>
        <h3>Переход</h3>
        <p>«Чтобы понять гол, нам нужны три секрета. Сейчас мы их назовём».</p>
      `
    },
    {
      id: 2, slug: 'secrets', scene: 'secrets', navTitle: 'Три секрета', time: '4 мин',
      kicker: '02 · Три секрета',
      title: 'Запомните три слова',
      panel: `
        <h2 class="panel-title">Запомните три слова</h2>
        <p class="panel-lead">Любой спортивный результат держится на трёх секретах. Скажем их вместе и покажем руками.</p>
        <div class="secret-grid">
          <button class="secret-card" type="button" data-act="secret" data-secret="force" aria-pressed="false">
            <span class="secret-num">1</span><strong>СИЛА</strong><span class="gesture">топнуть ногой</span><span class="secret-note">Сильнее оттолкнулся — быстрее полетел.</span>
          </button>
          <button class="secret-card" type="button" data-act="secret" data-secret="spin" aria-pressed="false">
            <span class="secret-num">2</span><strong>ВРАЩЕНИЕ</strong><span class="gesture">покрутить рукой</span><span class="secret-note">Закрутил — мяч полетел по дуге.</span>
          </button>
          <button class="secret-card" type="button" data-act="secret" data-secret="precision" aria-pressed="false">
            <span class="secret-num">3</span><strong>ТОЧНОСТЬ</strong><span class="gesture">показать на цель</span><span class="secret-note">Попал в угол — получил результат.</span>
          </button>
        </div>
        <div class="memory-box" id="memoryBox">
          <div class="memory-words"><span class="memory-word">СИЛА</span><span class="memory-word">ВРАЩЕНИЕ</span><span class="memory-word">ТОЧНОСТЬ</span></div>
          <button class="btn small secondary" type="button" data-act="memory">Проверь память</button>
        </div>
        <p class="status neutral" id="secretReadout">Выберите секрет — объект в 3D подсветится.</p>
        <p class="panel-prompt"><strong>Повторим хором:</strong> сила — вращение — точность! (2 раза)</p>
        <details class="more"><summary>Зачем эти слова</summary><div class="more-body"><p>Это не формула. Это три вопроса к любому движению: <b>с какой силой?</b> <b>с каким вращением?</b> <b>насколько точно?</b></p></div></details>
      `,
      notes: `
        <p><span class="time-badge">4 мин</span> · Цель: ввести и закрепить три слова-жеста.</p>
        <h3>Что сказать</h3>
        <p class="say">«Запомните три слова. Первое — СИЛА. Топните ногой: топ! Второе — ВРАЩЕНИЕ. Покрутите рукой: вж-ж-ж. Третье — ТОЧНОСТЬ. Покажите на цель: туда!»</p>
        <p class="repeat">Повторите 2 раза: «Сила — вращение — точность!» Дети повторяют хором и показывают жесты.</p>
        <h3>Действие</h3>
        <p>Нажимайте на карточки: камера подлетает к объекту. Затем «Проверь память» — слова исчезают. Спросите: «Какое первое? Второе? Третье?» Откройте снова.</p>
        <h3>Вопросы</h3>
        <ul><li>«Сила — это что делаем?» — толкаем.</li><li>«Вращение — что делаем?» — крутим.</li><li>«Точность — что делаем?» — целимся.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: только слова и жесты. 3–4: спросите, где в жизни ещё важна точность.</p>
        <h3>Переход</h3>
        <p>«Теперь проверим силу и вращение на футбольном мяче».</p>
      `
    },
    {
      id: 3, slug: 'football', scene: 'football', navTitle: 'Футбол', time: '7 мин',
      kicker: '03 · Футбол',
      title: 'Как закрутить мяч в девятку',
      panel: `
        <h2 class="panel-title">Как закрутить мяч в девятку</h2>
        <p class="panel-lead">Свободный удар с 35 метров. Роберто Карлос закрутил мяч вокруг стенки — и он влетел в ворота.</p>
        <div class="chips"><span class="chip orange">35 м</span><span class="chip green">~130 км/ч</span><span class="chip blue">дуга ~2,6 м</span></div>
        <div class="controls">
          <div class="control"><div class="control-top"><label for="fbForce">Сила удара</label><output id="fbForceOut">105 км/ч</output></div><input id="fbForce" type="range" min="60" max="120" step="5" value="105"></div>
          <div class="control"><div class="control-top"><label for="fbSpin">Закрутка</label><output id="fbSpinOut">вправо · 70</output></div><input id="fbSpin" type="range" min="-100" max="100" step="5" value="70"></div>
        </div>
        <div class="segmented" role="group" aria-label="Куда бить">
          <button class="seg" type="button" data-act="target" data-target="left" aria-pressed="false">Левый верх</button>
          <button class="seg" type="button" data-act="target" data-target="right" aria-pressed="true">Правый верх</button>
          <button class="seg" type="button" data-act="target" data-target="center" aria-pressed="false">Центр</button>
        </div>
        <div class="btn-row fill">
          <button class="btn primary" type="button" data-act="fb-kick">Ударить</button>
          <button class="btn secondary" type="button" data-act="fb-slow" aria-pressed="false">Замедленно</button>
          <button class="btn secondary" type="button" data-act="fb-reset">Сброс</button>
        </div>
        <div class="readout">
          <div class="readout-item"><span class="readout-label">Результат</span><span class="readout-value" id="fbStatus">готов</span></div>
          <div class="readout-item"><span class="readout-label">Дуга</span><span class="readout-value orange" id="fbCurve">—</span></div>
        </div>
        <p class="fact">Модель упрощённая: показаны гравитация, сопротивление воздуха и закрутка.</p>
        <p class="panel-prompt"><strong>Повторим:</strong> вращение меняет полёт мяча.</p>
        <details class="more"><summary>Что такое эффект Магнуса</summary><div class="more-body"><p>Вращающийся мяч увлекает за собой воздух. С одной стороны воздух движется быстрее, давление падает — мяч уходит в эту сторону. Это и есть <b>эффект Магнуса</b>.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">7 мин</span> · Цель: показать силу и вращение на главном примере — штрафном.</p>
        <h3>Что сказать</h3>
        <p class="say">«Роберто Карлос стоял в 35 метрах от ворот. Он ударил сильно и закрутил мяч. Сначала мяч полетел мимо стенки, а потом свернул в ворота. Вратарь даже не двинулся».</p>
        <p class="repeat">Скажите 3 раза: «Сила — скорость. Вращение — дуга. Точность — гол».</p>
        <h3>Действие</h3>
        <ol><li>Поставьте силу 105, закрутку 70. Ударьте. Спросите: «Куда свернул мяч?»</li><li>Поставьте закрутку 0. Ударьте. «А теперь?» — мяч летит прямее.</li><li>Поставьте закрутку −80. «В какую сторону теперь?»</li><li>Включите «Замедленно» и повторите.</li></ol>
        <h3>Вопросы</h3>
        <ul><li>«Какое слово свернуло мяч?» — вращение.</li><li>«Что изменит силу?» — разгон ноги, техника.</li><li>«Почему вратарь не поймал?» — мяч обманул его.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: не называйте 35 м и 130 км/ч; достаточно «далеко» и «очень быстро». 3–4: покажите дугу в метрах и спросите, почему она больше на длинной дистанции.</p>
        <h3>Переход</h3>
        <p>«В футболе нужна сила. А где ещё решают доли секунды? На старте!»</p>
      `
    },
    {
      id: 4, slug: 'sprint', scene: 'sprint', navTitle: 'Спринт', time: '4 мин',
      kicker: '04 · Спринт',
      title: 'Старт решают десятые',
      panel: `
        <h2 class="panel-title">Старт решают десятые</h2>
        <p class="panel-lead">Усэйн Болт пробежал 100 метров за 9,58 секунды. Но сначала его мозг и мышцы должны были отреагировать на сигнал.</p>
        <div class="readout">
          <div class="readout-item"><span class="readout-label">Ваша реакция</span><span class="readout-value orange" id="sprintTime">—</span></div>
          <div class="readout-item"><span class="readout-label">У Болта</span><span class="readout-value" id="sprintChampion">0,146 с</span></div>
        </div>
        <p class="status neutral" id="sprintStatus">Нажмите «На старт». На зелёный — жмите пробел или кнопку.</p>
        <div class="meter"><div class="meter-fill green" id="sprintMeter"></div></div>
        <div class="btn-row fill">
          <button class="btn primary" type="button" data-act="sprint" id="sprintBtn">На старт</button>
          <button class="btn secondary" type="button" data-act="sprint-reset">Сброс</button>
        </div>
        <p class="fact">Фальстарт — раньше 0,1 с. Реакцию тренируют, но она не может быть равна нулю.</p>
        <p class="panel-prompt"><strong>Повторим:</strong> старт — это сила + точность.</p>
        <details class="more"><summary>Почему колодки</summary><div class="more-body"><p>Колодки дают упор ногам. Спортсмен отталкивается под углом и быстрее набирает скорость. Это <b>сила</b> и <b>техника</b>.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">4 мин</span> · Цель: показать реакцию и старт, дать классу подвигаться.</p>
        <h3>Что сказать</h3>
        <p class="say">«Болт пробежал 100 метров за 9,58 секунды. Но секунды начинаются не с первого шага, а с реакции на выстрел. У Болта — 0,146 секунды. Это быстрее, чем вы скажете "раз"».</p>
        <p class="repeat">Повторите 2 раза: «Сила — разгон. Точность — реакция».</p>
        <h3>Действие</h3>
        <p>Все встают. Учитель нажимает «На старт». На зелёный — класс хлопает или жмёт пробел. Покажите результат. Повторите 3 раза. Если кто-то хлопнул раньше — это фальстарт.</p>
        <h3>Вопросы</h3>
        <ul><li>«Почему нельзя стартовать мгновенно?» — мозгу и мышцам нужно время.</li><li>«Что будет, если начать раньше?» — фальстарт.</li><li>«Реакция тренируется?» — да, но не до нуля.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: игра и «быстро-медленно». 3–4: сравните 0,146 с и 0,2–0,3 с, обсудите тренировку.</p>
        <h3>Переход</h3>
        <p>«А если нужно не просто бежать, а прыгнуть выше всех?»</p>
      `
    },
    {
      id: 5, slug: 'pole', scene: 'pole', navTitle: 'Шест', time: '5 мин',
      kicker: '05 · Прыжок с шестом',
      title: 'Разбег становится высотой',
      panel: `
        <h2 class="panel-title">Разбег становится высотой</h2>
        <p class="panel-lead">Арман Дюплантис прыгнул на 6,31 метра. Разбег запасает энергию, шест изгибается — и возвращает её прыгуну.</p>
        <div class="control"><div class="control-top"><label for="poleSpeed">Скорость разбега</label><output id="poleSpeedOut">9,0 м/с</output></div><input id="poleSpeed" type="range" min="6" max="9.8" step="0.1" value="9"></div>
        <div class="btn-row fill">
          <button class="btn primary" type="button" data-act="pole-jump">Прыжок</button>
          <button class="btn secondary" type="button" data-act="pole-reset">Сброс</button>
        </div>
        <div class="readout">
          <div class="readout-item"><span class="readout-label">Высота планки</span><span class="readout-value" id="poleHeight">6,31 м</span></div>
          <div class="readout-item"><span class="readout-label">Результат</span><span class="readout-value orange" id="poleStatus">готов</span></div>
        </div>
        <div class="fact">Энергия: разбег → изгиб шеста → высота.</div>
        <div class="energy-bars" aria-hidden="true">
          <div class="energy-row"><span>разбег</span><div class="meter"><div class="meter-fill" id="energyKinetic"></div></div></div>
          <div class="energy-row"><span>шест</span><div class="meter"><div class="meter-fill green" id="energyElastic"></div></div></div>
          <div class="energy-row"><span>высота</span><div class="meter"><div class="meter-fill blue" id="energyPotential"></div></div></div>
        </div>
        <p class="panel-prompt"><strong>Повторим:</strong> разбег → энергия → высота.</p>
        <details class="more"><summary>Почему шест гнётся</summary><div class="more-body"><p>Шест — упругая пружина. Он сгибается, запасает энергию разбега, а потом распрямляется и подбрасывает прыгуна. Модель упрощённая.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">5 мин</span> · Цель: показать переход энергии и роль шеста.</p>
        <h3>Что сказать</h3>
        <p class="say">«Дюплантис разбегается, ставит шест и взлетает на 6,31 метра. Шест — не волшебная палка. Он сгибается, как пружина, запасает энергию разбега и возвращает её».</p>
        <p class="repeat">Повторите 3 раза: «Разбег — энергия — высота».</p>
        <h3>Действие</h3>
        <p>Поставьте скорость 6,0 — прыжок не удаётся. Поставьте 9,8 — планка на 6,31. Спросите: «Почему?» Покажите шкалы энергии.</p>
        <h3>Вопросы</h3>
        <ul><li>«Куда ушла энергия разбега?» — в шест.</li><li>«Потом куда?» — в высоту.</li><li>«Что будет, если разбег медленный?» — не хватит энергии.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: «быстрее разбег — выше прыжок», без чисел. 3–4: обсудите упругость и материалы.</p>
        <h3>Переход</h3>
        <p>«А где ещё мешает среда? В воздухе на велосипеде и в воде».</p>
      `
    },
    {
      id: 6, slug: 'cycle', scene: 'cycle', navTitle: 'Сопротивление', time: '5 мин',
      kicker: '06 · Сопротивление',
      title: 'Почему они наклоняются?',
      panel: `
        <h2 class="panel-title">Почему они наклоняются?</h2>
        <p class="panel-lead">На большой скорости главный соперник — воздух или вода. Форма тела меняет сопротивление.</p>
        <div class="segmented" role="group" aria-label="Вид спорта">
          <button class="seg" type="button" data-act="mode" data-mode="bike" aria-pressed="true">Велосипед</button>
          <button class="seg" type="button" data-act="mode" data-mode="swim" aria-pressed="false">Плавание</button>
        </div>
        <div class="control"><div class="control-top"><label for="aeroRange" id="aeroLabel">Аэродинамичная поза</label><output id="aeroOut">70%</output></div><input id="aeroRange" type="range" min="0" max="100" step="5" value="70"></div>
        <div class="readout">
          <div class="readout-item"><span class="readout-label" id="speedLabel">Скорость</span><span class="readout-value orange" id="aeroSpeed">49 км/ч</span></div>
          <div class="readout-item"><span class="readout-label">Сопротивление</span><span class="readout-value" id="aeroDrag">среднее</span></div>
        </div>
        <p class="status neutral" id="aeroStatus">Наклонитесь сильнее — сопротивление упадёт.</p>
        <p class="fact"><b>Факт:</b> Ганна проехал 56,792 км за час. Вода примерно в 800 раз плотнее воздуха.</p>
        <p class="panel-prompt"><strong>Повторим:</strong> форма уменьшает сопротивление.</p>
        <details class="more"><summary>Почему в воде сложнее</summary><div class="more-body"><p>Вода плотнее воздуха примерно в 800 раз. Поэтому пловцу так важно вытянуться в «стрелу» и не раскидывать руки и ноги.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">5 мин</span> · Цель: показать сопротивление среды и роль формы.</p>
        <h3>Что сказать</h3>
        <p class="say">«Велосипедист на скорости толкает воздух. Чем больше тело, тем труднее. Поэтому он наклоняется. Пловец тоже вытягивается — вода в 800 раз плотнее воздуха».</p>
        <p class="repeat">Повторите 2 раза: «Меньше площадь — меньше сопротивление — быстрее».</p>
        <h3>Действие</h3>
        <p>Переключите «Велосипед / Плавание». Двигайте ползунок от 0 до 100. Смотрите на частицы потока и скорость. Спросите: «Когда быстрее?»</p>
        <h3>Вопросы</h3>
        <ul><li>«Почему велосипедист низко?» — меньше сопротивление.</li><li>«Почему пловец вытягивается?» — та же причина.</li><li>«Что было бы без формы?» — медленнее.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: «узкий — быстрее». 3–4: сравните воздух и воду, обсудите шлем и костюм.</p>
        <h3>Переход</h3>
        <p>«Вращение работает не только в футболе. Проверим на других мячах».</p>
      `
    },
    {
      id: 7, slug: 'spin', scene: 'spin', navTitle: 'Вращение везде', time: '3 мин',
      kicker: '07 · Вращение везде',
      title: 'Один секрет — разные мячи',
      panel: `
        <h2 class="panel-title">Один секрет — разные мячи</h2>
        <p class="panel-lead">Футбол, теннис, баскетбол. Везде вращение меняет полёт и отскок.</p>
        <div class="segmented" role="group" aria-label="Выберите мяч">
          <button class="seg" type="button" data-act="spin-mode" data-spin="football" aria-pressed="true">Футбол</button>
          <button class="seg" type="button" data-act="spin-mode" data-spin="tennis" aria-pressed="false">Теннис</button>
          <button class="seg" type="button" data-act="spin-mode" data-spin="basketball" aria-pressed="false">Баскетбол</button>
        </div>
        <div class="control"><div class="control-top"><label for="spinRange">Закрутка</label><output id="spinOut">вправо · 60</output></div><input id="spinRange" type="range" min="-100" max="100" step="5" value="60"></div>
        <div class="readout">
          <div class="readout-item"><span class="readout-label">Что происходит</span><span class="readout-value orange" id="spinEffect">дуга</span></div>
          <div class="readout-item"><span class="readout-label">Направление</span><span class="readout-value" id="spinDirection">вправо</span></div>
        </div>
        <p class="status neutral" id="spinStatus">Выберите мяч и покрутите ползунок.</p>
        <p class="panel-prompt"><strong>Повторим:</strong> вращение управляет полётом — в любом спорте.</p>
        <details class="more"><summary>Теннис и баскетбол</summary><div class="more-body"><p>В теннисе верхнее вращение заставляет мяч нырять вниз. В баскетболе нижнее вращение смягчает отскок от щита и кольца. Правило одно — <b>вращение</b>.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">3 мин</span> · Цель: перенести правило вращения на другие виды спорта.</p>
        <h3>Что сказать</h3>
        <p class="say">«Одно и то же правило работает в футболе, теннисе и баскетболе. Мяч закрутили — он полетел иначе. В теннисе ныряет, в баскетболе мягче отскакивает».</p>
        <p class="repeat">Повторите 2 раза: «Вращение управляет полётом».</p>
        <h3>Действие</h3>
        <p>Переключайте мячи. Меняйте закрутку от −100 до 100. Спросите: «Куда уходит мяч?» Покажите, что направление меняется.</p>
        <h3>Вопросы</h3>
        <ul><li>«В каком спорте ещё важна закрутка?» — теннис, баскетбол, волейбол.</li><li>«Что общего?» — вращение.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: достаточно «крутится — летит по-другому». 3–4: обсудите верхнее/нижнее вращение.</p>
        <h3>Переход</h3>
        <p>«А как наука помогает спортсменам и судьям? Посмотрим на витрину рекордов».</p>
      `
    },
    {
      id: 8, slug: 'museum', scene: 'museum', navTitle: 'Наука и рекорды', time: '3 мин',
      kicker: '08 · Наука и рекорды',
      title: 'Что стоит за рекордом?',
      panel: `
        <h2 class="panel-title">Что стоит за рекордом?</h2>
        <p class="panel-lead">Наука помогает измерять, тренировать и делать материалы. Выберите год — узнаете историю.</p>
        <div class="segmented years" role="group" aria-label="Годы рекордов">
          <button class="seg" type="button" data-act="year" data-year="1997" aria-pressed="true">1997</button>
          <button class="seg" type="button" data-act="year" data-year="2009" aria-pressed="false">2009</button>
          <button class="seg" type="button" data-act="year" data-year="2014" aria-pressed="false">2014</button>
          <button class="seg" type="button" data-act="year" data-year="2022" aria-pressed="false">2022</button>
          <button class="seg" type="button" data-act="year" data-year="2026" aria-pressed="false">2026</button>
        </div>
        <div class="museum-info" id="museumInfo">
          <div class="museum-year">1997</div>
          <h3>Мяч и вращение</h3>
          <p>Роберто Карлос закрутил мяч с 35 метров. Воздух давил на него с одной стороны сильнее — и мяч облетел стенку.</p>
        </div>
        <p class="panel-prompt"><strong>Рекорд-детектив:</strong> что помогло — сила, вращение или точность?</p>
        <details class="more"><summary>Главная мысль</summary><div class="more-body"><p>Наука не заменяет тренировку. Она помогает <b>понять</b>, <b>измерить</b> и <b>улучшить</b> результат: камеры, секундомеры, материалы, датчики.</p></div></details>
      `,
      notes: `
        <p><span class="time-badge">3 мин</span> · Цель: показать, что наука — помощник спортсмена и судьи.</p>
        <h3>Что сказать</h3>
        <p class="say">«Рекорд — это не только сила. Это точные измерения, хорошие материалы и тренировка. Наука помогает понять, что именно улучшить».</p>
        <p class="repeat">Повторите 3 раза: «Наука — помощник спортсмена».</p>
        <h3>Действие</h3>
        <p>Нажимайте годы. Для каждого спросите: «Что помогло?» 1997 — вращение; 2009 — реакция и секундомер; 2014 — камеры; 2022 — аэродинамика; 2026 — шест и материалы.</p>
        <h3>Вопросы</h3>
        <ul><li>«Как узнать, что мяч пересёк линию?» — камеры/датчики.</li><li>«Зачем секундомер?» — измерить и сравнить.</li><li>«Что важнее: сила или техника?» — вместе.</li></ul>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: выберите 2–3 объекта. 3–4: обсудите, какие технологии знают дети.</p>
        <h3>Переход</h3>
        <p>«А теперь проверим, кто запомнил три секрета. Викторина!»</p>
      `
    },
    {
      id: 9, slug: 'quiz', scene: 'quiz', navTitle: 'Викторина и финал', time: '6 мин',
      kicker: '09 · Викторина',
      title: 'Проверим три секрета',
      panel: `
        <h2 class="panel-title">Проверим три секрета</h2>
        <p class="panel-lead">Шесть вопросов. Отвечайте командой — кубок растёт с каждым правильным ответом.</p>
        <div id="quizCard"></div>
        <p class="panel-prompt" id="quizPrompt"><strong>Повторим перед стартом:</strong> сила — вращение — точность.</p>
      `,
      notes: `
        <p><span class="time-badge">6 мин</span> · Цель: проверить понимание и ещё раз повторить три секрета.</p>
        <h3>Что сказать</h3>
        <p class="say">«Сейчас шесть вопросов. Отвечаем командой. За правильный ответ кубок поднимается. Готовы?»</p>
        <p class="repeat">Перед началом: «Закройте глаза. Три слова?» — «Сила, вращение, точность!»</p>
        <h3>Действие</h3>
        <p>Читайте вопрос, дайте 5–10 секунд на обсуждение, затем нажмите вариант. После ответа прочитайте объяснение. Не спешите: важно понять, а не угадать.</p>
        <h3>Финал</h3>
        <p class="repeat">«Скажи соседу три слова и покажи три жеста». Затем хором: «Сила — вращение — точность!»</p>
        <h3>Для 1–2 / 3–4</h3>
        <p>1–2: можно оставить 4 вопроса. 3–4: попросите объяснить ответ своими словами.</p>
        <h3>После урока</h3>
        <p>«Билет на выход»: каждый называет один секрет и один пример. Поблагодарите класс.</p>
      `
    }
  ];
})();
