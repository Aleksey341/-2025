/* ========================================
   ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
   ======================================== */
let db;
let slidesData = {};
let viewedRegions = new Set();
let currentRegion = null;
let currentSlideIndex = 0;
let isSplitMode = false; // Флаг разделения карточки Владивостока
let isFirstLoad = true; // Флаг первой загрузки для анимации
let finalScreenInterval = null; // Интервал для мелькающих пожеланий
let floatingWishesInterval = null; // Интервал для плавающих пожеланий

// URL для QR-кода на GitHub Pages
const WISH_PAGE_URL = 'https://aleksey341.github.io/-2025/wish.html';
const QR_IMAGE_URL = './qr.png';

/* ========================================
   НОВОЕ: НАСТРОЙКИ ЗАГРУЗКИ СЛАЙДОВ ИЗ РЕПОЗИТОРИЯ
   ======================================== */
const PAGES_BASE_URL = 'https://aleksey341.github.io/-2025'; // базовый URL вашего GitHub Pages
const SLIDE_EXT = 'png';       // формат слайдов
const SLIDE_PAD = 2;           // 01, 02...
const SLIDE_MAX_TRY = 250;     // максимум попыток, чтобы не уйти в бесконечность

// защита от параллельной загрузки одного и того же региона
const repoLoadInFlight = new Map(); // regionId -> Promise

function pad2(n) {
  return String(n).padStart(SLIDE_PAD, '0');
}

// regionId используется для CSS и логики; folder — для пути в репозитории
function getRegionFolder(regionId) {
  const r = regions.find(x => x.id === regionId);
  return (r && r.folder) ? r.folder : regionId;
}

function buildSlideUrl(regionId, index1based) {
  const folder = getRegionFolder(regionId);
  const file = `${pad2(index1based)}.${SLIDE_EXT}`;
  // папки у вас лежат в корне репозитория: /Samara/01.png
  return `${PAGES_BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

async function urlExists(url) {
  // GitHub Pages обычно поддерживает HEAD, но на всякий случай есть fallback на GET
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return r.ok;
  } catch (_) {
    try {
      const r2 = await fetch(url, { method: 'GET', cache: 'no-store' });
      return r2.ok;
    } catch (__) {
      return false;
    }
  }
}

async function loadSlidesFromRepo(regionId) {
  // если уже есть — ничего не делаем
  if (slidesData[regionId] && slidesData[regionId].length > 0) {
    return;
  }

  // если уже грузится — ждём
  if (repoLoadInFlight.has(regionId)) {
    await repoLoadInFlight.get(regionId);
    return;
  }

  const p = (async () => {
    const collected = [];
    for (let i = 1; i <= SLIDE_MAX_TRY; i++) {
      const url = buildSlideUrl(regionId, i);
      const ok = await urlExists(url);
      if (!ok) break;
      collected.push({ name: `${pad2(i)}.${SLIDE_EXT}`, data: url });
    }

    if (!collected.length) {
      const folder = getRegionFolder(regionId);
      throw new Error(
        `Не найдены слайды в папке "${folder}". Ожидаю файлы вида 01.${SLIDE_EXT}, 02.${SLIDE_EXT}... ` +
        `Проверьте: регистр папки/файлов и что они доступны по Pages.`
      );
    }

    slidesData[regionId] = collected;

    // сортировка как и раньше (на всякий случай)
    slidesData[regionId].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    await saveToIndexedDB(regionId);
  })();

  repoLoadInFlight.set(regionId, p);

  try {
    await p;
  } finally {
    repoLoadInFlight.delete(regionId);
  }
}

/* ========================================
   Пожелания для эффекта мелькания
   ======================================== */
const wishesForAnimation = [
  "Пусть дисциплина будет мягкой, но рабочей 📌",
  "Пусть мотивация приходит изнутри 🔥",
  "Пусть вы чаще чувствуете уверенность 🧷",
  "Пусть решения даются легко 🧩",
  "Пусть вы не откладываете важное ⏭️",
  "Пусть каждый месяц приносит маленькую победу 🏆",
  "Пусть год станет для вас точкой роста 🌱",
  "Пусть ваши навыки монетизируются достойно 💼",
  "Пусть работа перестанет быть «вечно срочной» 🧯",
  "Пусть вы находите лучшие пути, а не длинные 🧭",
  "Пусть всё сложное становится простым 🧊",
  "Пусть ваши письма читают внимательно 📩",
  "Пусть дедлайны будут управляемыми 🗓️",
  "Пусть вы защищаете границы спокойно 🛡️",
  "Пусть решения принимаются быстрее ⚙️",
  "Пусть вы меньше объясняетесь и больше делаете 🛠️",
  "Пусть уважение к вам будет нормой 🤝",
  "Пусть ваши деньги работают без нервов 🧾",
  "Пусть финансовые цели приближаются каждый месяц 🎯",
  "Пусть доходы расширяют вашу свободу 🗝️",
  "Пусть покупки приносят радость, а не сожаление 🛍️",
  "Пусть вы находите выгодные варианты легко 🔎",
  "Пусть долги исчезают без драмы 🧽",
  "Пусть в бюджете будет место удовольствиям 🍰",
  "Пусть вы чувствуете контроль над финансами 📌",
  "Пусть год принесёт приятный прирост 📈",
  "Пусть ваша ценность растёт и на рынке, и внутри 💎",
  "Пусть дом будет наполнен светом 🕯️",
  "Пусть в доме будет место тишине 🤫",
  "Пусть утро начинается без спешки 🌅",
  "Пусть вечер заканчивается спокойствием 🌙",
  "Пусть техника не ломается, а служит 🔌",
  "Пусть в доме всегда есть вкусный чай 🍵",
  "Пусть ваш уголок будет идеальным убежищем 🪟",
  "Пусть в доме пахнет праздником 🎄",
  "Пусть в доме чаще звучит «как хорошо» 🤍",
  "Пусть уют создаётся легко 🧸",
  "Пусть любовь будет зрелой и тёплой ❤️",
  "Пусть забота будет взаимной 🤲",
  "Пусть вы слышите друг друга 👂",
  "Пусть близкие будут здоровы и спокойны 🫶",
  "Пусть в семье будет больше поддержки 🤝",
  "Пусть семейные праздники будут радостными 🎊",
  "Пусть ваши слова дома будут мягче 🕊️",
  "Пусть у вас будет время на разговоры ☕",
  "Пусть недосказанности исчезнут 🧩",
  "Пусть отношения станут проще и честнее 💬",
  "Пусть друзья появляются вовремя 🧭",
  "Пусть люди вас радуют, а не утомляют 🌿",
  "Пусть вас окружают надежные профессионалы 🧠",
  "Пусть вы встречаете доброту чаще 🤍",
  "Пусть вы легко находите общий язык 🗣️",
  "Пусть ваша репутация помогает вам ⭐"
];

/*
  ВАЖНО:
  - region.id оставляем как было (это CSS-раскладка bento)
  - добавьте region.folder, чтобы указать папку в репозитории, если она не совпадает с id

  Пример:
  { id:'region3', ..., folder:'Samara' }
*/
const regions = [
  { id: 'nn', name: 'ЯНАО', code: '#89', ornament: 'yanao', folder: 'Jamal' },
  { id: 'vladivostok', name: 'Владивосток', code: '#25', ornament: 'vladivostok', folder: 'Vladivostok' },
  { id: 'yanao', name: 'Новосибирск', code: '#54', ornament: 'Novosib', folder: 'Novosib' },
  { id: 'krasnodar', name: 'Нижний Новгород', code: '#52', ornament: 'nn', folder: 'NN' },
  { id: 'region1', name: 'Краснодар', code: '#23', ornament: 'krasnodar', folder: 'Krasnodar' },
  { id: 'region2', name: 'Санкт-Петербург', code: '#78', ornament: 'region4', folder: 'SPB' },
  { id: 'region3', name: 'Самара', code: '#63', ornament: 'samara', folder: 'Samara' },
  { id: 'region4', name: 'Арх', code: '#29', ornament: 'Арх', folder: 'Arhangelsk' }
];

// Скрытый регион Кировская область (появляется после разделения)
const kirovRegion = { id: 'kirov', name: 'Кировская область', code: '#43', ornament: 'kirov', folder: 'Kirovskaja' };

/* ========================================
   INDEXEDDB ИНИЦИАЛИЗАЦИЯ
   ======================================== */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PresentationDB', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      if (!db.objectStoreNames.contains('slides')) {
        db.createObjectStore('slides', { keyPath: 'regionId' });
      }

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id' });
      }
    };
  });
}

/* ========================================
   СОХРАНЕНИЕ В INDEXEDDB
   ======================================== */
async function saveToIndexedDB(regionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['slides'], 'readwrite');
    const store = transaction.objectStore('slides');
    const request = store.put({
      regionId: regionId,
      slides: slidesData[regionId]
    });

    request.onsuccess = () => {
      console.log('Slides saved for region:', regionId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   ЗАГРУЗКА ИЗ INDEXEDDB
   ======================================== */
async function loadFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['slides'], 'readonly');
    const store = transaction.objectStore('slides');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result;
      results.forEach(item => {
        if (item.slides && item.slides.length > 0) {
          // Конвертация старого формата в новый
          slidesData[item.regionId] = item.slides.map(slide => {
            if (typeof slide === 'string') {
              return { name: '', data: slide };
            }
            return slide;
          });

          // Сортировка слайдов по имени файла
          slidesData[item.regionId].sort((a, b) => {
            if (!a.name || !b.name) return 0;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
          });
        }
      });
      console.log('Loaded slides:', slidesData);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   СОХРАНЕНИЕ ПРОГРЕССА
   ======================================== */
async function saveProgressToIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');
    const request = store.put({
      id: 'viewedRegions',
      regions: Array.from(viewedRegions)
    });

    request.onsuccess = () => {
      console.log('Progress saved');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   ЗАГРУЗКА ПРОГРЕССА
   ======================================== */
async function loadProgressFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['progress'], 'readonly');
    const store = transaction.objectStore('progress');
    const request = store.get('viewedRegions');

    request.onsuccess = () => {
      if (request.result && request.result.regions) {
        viewedRegions = new Set(request.result.regions);
        console.log('Loaded progress:', viewedRegions);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   ЗАГРУЗКА СЛАЙДОВ ДЛЯ РЕГИОНА (БЫЛО uploadForRegion -> СТАЛО: загрузка из репозитория)
   ======================================== */
async function uploadForRegion(regionId, event) {
  event.stopPropagation();

  try {
    // грузим из GitHub Pages (папка региона)
    await loadSlidesFromRepo(regionId);
    createRegionCards();
  } catch (err) {
    console.error(err);
    alert(err.message || String(err));
  }
}

/* ========================================
   СОЗДАНИЕ КАРТОЧЕК РЕГИОНОВ
   ======================================== */
function createRegionCards() {
  const grid = document.getElementById('bentoGrid');
  grid.innerHTML = '';

  // Если в режиме разделения - добавляем класс к сетке
  if (isSplitMode) {
    grid.classList.add('split-mode');
  } else {
    grid.classList.remove('split-mode');
  }

  let cardIndex = 0;
  regions.forEach(region => {
    // В режиме разделения пропускаем Владивосток - его заменят две карточки
    if (isSplitMode && region.id === 'vladivostok') {
      // Создаём карточку Владивосток (неактивную)
      createSplitCard(grid, region, true, cardIndex);
      cardIndex++;
      // Создаём карточку Кировская область (активную)
      createSplitCard(grid, kirovRegion, false, cardIndex);
      cardIndex++;
      return;
    }

    createRegionCard(grid, region, false, cardIndex);
    cardIndex++;
  });

  // После первого создания карточек сбрасываем флаг
  if (isFirstLoad) {
    setTimeout(() => {
      isFirstLoad = false;
    }, 1000);
  }
}

/* ========================================
   СОЗДАНИЕ ОДНОЙ КАРТОЧКИ РЕГИОНА
   ======================================== */
function createRegionCard(grid, region, forceInactive = false, cardIndex = 0) {
  const item = document.createElement('div');
  item.className = `bento-item ${region.id}${isFirstLoad ? ' animate-in' : ''}`;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `${region.name} - ${viewedRegions.has(region.id) ? 'Просмотрено' : 'Нажмите для просмотра'}`);

  // Задержка появления для каскадного эффекта (только при первой загрузке)
  if (isFirstLoad) {
    item.style.setProperty('--appear-delay', `${cardIndex * 0.1}s`);
  }

  // Пометка просмотренных
  if (viewedRegions.has(region.id) || forceInactive) {
    item.classList.add('viewed');
  }

  const hasSlides = slidesData[region.id] && slidesData[region.id].length > 0;

  // Миниатюра первого слайда (ЛОГИКА ОСТАЛАСЬ КАК БЫЛО)
  let thumbnail = '';
  if (hasSlides) {
    thumbnail = slidesData[region.id][0].data;
  }

  // UI кнопки оставляем как было, но теперь она грузит из репозитория
  const uploadButtonHTML = hasSlides ? '' : `
    <button class="upload-region-btn" data-region-id="${region.id}" aria-label="Загрузить слайды для ${region.name}">
      📁 Загрузить слайды
    </button>
  `;

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${region.code}</span>
        </div>
        <img src="ornament_${region.ornament || region.id}.png" class="region-ornament" alt="${region.name}" onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${hasSlides ? `<img src="${thumbnail}" class="region-thumbnail" alt="${region.name}">` : uploadButtonHTML}
      </div>
    </div>
  `;

  // События клика и клавиатуры (если не принудительно неактивна)
  if (!forceInactive) {
    const openPresentationHandler = async (e) => {
      // Игнорировать клики на кнопку загрузки
      if (e.target.classList.contains('upload-region-btn') || e.target.closest('.upload-region-btn')) {
        return;
      }

      // Не реагировать на просмотренные
      if (viewedRegions.has(region.id)) {
        return;
      }

      // Переворот карточки
      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
      } else {
        // Второй клик - открытие презентации (ЛОГИКА КАК БЫЛО)
        if (hasSlides) {
          openPresentation(region.id);
          item.classList.remove('flipped');
        }
      }
    };

    item.addEventListener('click', (e) => { openPresentationHandler(e); });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPresentationHandler(e);
      }
    });

    // Обработчик для кнопки загрузки (теперь грузит из репозитория)
    if (!hasSlides) {
      const uploadBtn = item.querySelector('.upload-region-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          await uploadForRegion(region.id, e);
        }, true);
      }
    }
  }

  grid.appendChild(item);
}

/* ========================================
   СОЗДАНИЕ РАЗДЕЛЁННОЙ КАРТОЧКИ
   ======================================== */
function createSplitCard(grid, region, isLeft, cardIndex = 0) {
  const item = document.createElement('div');

  // Для левой карточки (Владивосток) - неактивна, для правой (Кировская) - активна
  const isInactive = isLeft;
  const cssClass = isLeft ? 'vladivostok-split-left' : 'kirov-split-right';

  item.className = `bento-item ${region.id} ${cssClass} split-card${isFirstLoad ? ' animate-in' : ''}`;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `${region.name} - ${isInactive ? 'Неактивна' : 'Нажмите для просмотра'}`);

  // Задержка появления для каскадного эффекта (только при первой загрузке)
  if (isFirstLoad) {
    item.style.setProperty('--appear-delay', `${cardIndex * 0.1}s`);
  }

  // Владивосток всегда неактивен после разделения
  if (isInactive || viewedRegions.has(region.id)) {
    item.classList.add('viewed');
  }

  const hasSlides = slidesData[region.id] && slidesData[region.id].length > 0;

  // Миниатюра первого слайда (ЛОГИКА ОСТАЛАСЬ КАК БЫЛО)
  let thumbnail = '';
  if (hasSlides) {
    thumbnail = slidesData[region.id][0].data;
  }

  const uploadButtonHTML = hasSlides ? '' : `
    <button class="upload-region-btn" data-region-id="${region.id}" aria-label="Загрузить слайды для ${region.name}">
      📁 Загрузить слайды
    </button>
  `;

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${region.code}</span>
        </div>
        <img src="ornament_${region.ornament || region.id}.png" class="region-ornament" alt="${region.name}" onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${hasSlides ? `<img src="${thumbnail}" class="region-thumbnail" alt="${region.name}">` : uploadButtonHTML}
      </div>
    </div>
  `;

  // События только для активной карточки (Кировская)
  if (!isInactive) {
    const openPresentationHandler = (e) => {
      if (e.target.classList.contains('upload-region-btn') || e.target.closest('.upload-region-btn')) {
        return;
      }

      if (viewedRegions.has(region.id)) {
        return;
      }

      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
      } else {
        if (hasSlides) {
          openPresentation(region.id);
          item.classList.remove('flipped');
        }
      }
    };

    item.addEventListener('click', openPresentationHandler);

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPresentationHandler(e);
      }
    });

    if (!hasSlides) {
      const uploadBtn = item.querySelector('.upload-region-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          await uploadForRegion(region.id, e);
        }, true);
      }
    }
  }

  grid.appendChild(item);
}

/* ========================================
   ОТКРЫТИЕ ПРЕЗЕНТАЦИИ
   ======================================== */
function openPresentation(regionId) {
  if (!slidesData[regionId] || slidesData[regionId].length === 0) return;

  currentRegion = regionId;
  currentSlideIndex = 0;

  const container = document.getElementById('slidesContainer');
  container.innerHTML = '';

  slidesData[regionId].forEach((slide, index) => {
    const img = document.createElement('img');
    img.src = slide.data;
    img.className = 'slide';
    img.alt = `Слайд ${index + 1} из ${slidesData[regionId].length}`;
    if (index === currentSlideIndex) img.classList.add('active');
    container.appendChild(img);
  });

  updateSlideCounter();
  updateNavigationButtons();

  const presentation = document.getElementById('presentation');
  presentation.classList.add('active');
  presentation.focus();

  viewedRegions.add(regionId);
  updateProgress();
  saveProgressToIndexedDB();
}

/* ========================================
   ЗАКРЫТИЕ ПРЕЗЕНЕНТАЦИИ
   ======================================== */
function closePresentation() {
  const wasKirovPresentation = currentRegion === 'kirov';

  document.getElementById('presentation').classList.remove('active');
  currentRegion = null;

  // Восстановить видимость основного интерфейса
  const container = document.querySelector('.container');
  const progressContainer = document.querySelector('.progress-container');
  container.style.display = 'block';
  progressContainer.style.display = 'block';

  saveProgressToIndexedDB();
  createRegionCards();

  // Если это была презентация карточки руководителя (#43) - показываем финальный экран
  if (wasKirovPresentation) {
    setTimeout(() => {
      showFinalScreen();
    }, 500);
  }
}

/* ========================================
   ОБНОВЛЕНИЕ КНОПОК НАВИГАЦИИ
   ======================================== */
function updateNavigationButtons() {
  if (!currentRegion) return;

  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.nav-button.prev');
  const nextBtn = document.querySelector('.nav-button.next');

  // Деактивация кнопки назад на первом слайде
  if (currentSlideIndex === 0) {
    prevBtn.classList.add('disabled');
    prevBtn.setAttribute('aria-disabled', 'true');
  } else {
    prevBtn.classList.remove('disabled');
    prevBtn.setAttribute('aria-disabled', 'false');
  }

  // Деактивация кнопки вперёд на последнем слайде
  if (currentSlideIndex === slides.length - 1) {
    nextBtn.classList.add('disabled');
    nextBtn.setAttribute('aria-disabled', 'true');
  } else {
    nextBtn.classList.remove('disabled');
    nextBtn.setAttribute('aria-disabled', 'false');
  }
}

/* ========================================
   СЛЕДУЮЩИЙ СЛАЙД
   ======================================== */
function nextSlide() {
  if (!currentRegion) return;

  const slides = document.querySelectorAll('.slide');

  if (currentSlideIndex >= slides.length - 1) return;

  slides[currentSlideIndex].classList.remove('active');
  currentSlideIndex++;
  slides[currentSlideIndex].classList.add('active');

  updateSlideCounter();
  updateNavigationButtons();
}

/* ========================================
   ПРЕДЫДУЩИЙ СЛАЙД
   ======================================== */
function prevSlide() {
  if (!currentRegion) return;

  const slides = document.querySelectorAll('.slide');

  if (currentSlideIndex <= 0) return;

  slides[currentSlideIndex].classList.remove('active');
  currentSlideIndex--;
  slides[currentSlideIndex].classList.add('active');

  updateSlideCounter();
  updateNavigationButtons();
}

/* ========================================
   ОБНОВЛЕНИЕ СЧЁТЧИКА СЛАЙДОВ
   ======================================== */
function updateSlideCounter() {
  if (!currentRegion) return;
  const total = slidesData[currentRegion].length;
  const counter = document.getElementById('slideCounter');
  counter.textContent = `${currentSlideIndex + 1} / ${total}`;
  counter.setAttribute('aria-label', `Слайд ${currentSlideIndex + 1} из ${total}`);
}

/* ========================================
   ОБНОВЛЕНИЕ ПРОГРЕССА
   ======================================== */
function updateProgress() {
  const total = regions.length;
  const viewed = viewedRegions.size;
  const percentage = (viewed / total) * 100;

  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const progressBar = document.querySelector('.progress-bar');

  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `Просмотрено: ${viewed} из ${total} регионов`;

  progressBar.setAttribute('aria-valuenow', percentage);

  // Когда все регионы просмотрены - разделить карточку Владивостока
  if (viewed === total && !isSplitMode) {
    setTimeout(() => {
      splitVladivostokCard();
    }, 500);
  }
}

/* ========================================
   РАЗДЕЛЕНИЕ КАРТОЧКИ ВЛАДИВОСТОКА
   ======================================== */
function splitVladivostokCard() {
  if (isSplitMode) return;
  isSplitMode = true;

  const vladivostokCard = document.querySelector('.bento-item.vladivostok');
  if (!vladivostokCard) return;

  // Добавляем класс для анимации разделения
  vladivostokCard.classList.add('splitting');

  // После анимации пересоздаём карточки
  setTimeout(() => {
    createRegionCards();
    saveSplitModeToIndexedDB();
  }, 800);
}

/* ========================================
   СОХРАНЕНИЕ РЕЖИМА РАЗДЕЛЕНИЯ
   ======================================== */
async function saveSplitModeToIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');
    const request = store.put({
      id: 'splitMode',
      value: isSplitMode
    });

    request.onsuccess = () => {
      console.log('Split mode saved');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   ЗАГРУЗКА РЕЖИМА РАЗДЕЛЕНИЯ
   ======================================== */
async function loadSplitModeFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['progress'], 'readonly');
    const store = transaction.objectStore('progress');
    const request = store.get('splitMode');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        isSplitMode = request.result.value;
        console.log('Loaded split mode:', isSplitMode);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   СБРОС СЛАЙДОВ
   ======================================== */
async function resetSlides() {
  if (!confirm('Вы уверены, что хотите удалить все загруженные слайды?')) return;

  slidesData = {};

  const transaction = db.transaction(['slides'], 'readwrite');
  const store = transaction.objectStore('slides');
  const request = store.clear();

  request.onsuccess = () => {
    console.log('All slides cleared');
    createRegionCards();
  };
}

/* ========================================
   СБРОС ПРОГРЕССА
   ======================================== */
async function resetProgress() {
  if (!confirm('Вы уверены, что хотите сбросить прогресс просмотра?')) return;

  viewedRegions.clear();
  isSplitMode = false; // Сбрасываем режим разделения

  const transaction = db.transaction(['progress'], 'readwrite');
  const store = transaction.objectStore('progress');
  const request = store.clear();

  request.onsuccess = () => {
    console.log('Progress cleared');

    updateProgress();
    createRegionCards();

    // Показать вступительный экран
    showIntroScreen();
  };
}

/* ========================================
   ПОКАЗ ВСТУПИТЕЛЬНОГО ЭКРАНА
   ======================================== */
function showIntroScreen() {
  const introScreen = document.getElementById('introScreen');
  const logo = document.getElementById('logo');
  const heroTitle = document.getElementById('heroTitle');
  const progressContainer = document.getElementById('progressContainer');
  const mainContainer = document.getElementById('mainContainer');
  const container = document.querySelector('.container');

  // Показать вступительный экран
  introScreen.classList.remove('hidden');

  // Добавить класс intro-active к body
  document.body.classList.add('intro-active');

  // Скрыть основные контейнеры
  container.style.display = 'none';
  progressContainer.style.display = 'none';

  // Скрыть основные элементы
  logo.classList.add('hidden-on-intro');
  heroTitle.classList.add('hidden-on-intro');
  progressContainer.classList.add('hidden-on-intro');
  mainContainer.classList.add('hidden-on-intro');

  // Добавить обработчик клавиатуры для вступительного экрана
  document.addEventListener('keydown', handleIntroKeyPress);
}

/* ========================================
   КЛАВИАТУРНАЯ НАВИГАЦИЯ
   ======================================== */
document.addEventListener('keydown', (e) => {
  const presentationActive = document.getElementById('presentation').classList.contains('active');

  // Навигация по слайдам региона
  if (presentationActive) {
    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Escape':
        e.preventDefault();
        closePresentation();
        break;
    }
  }
});

/* ========================================
   ПОДДЕРЖКА TOUCH-СОБЫТИЙ
   ======================================== */
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  const presentationActive = document.getElementById('presentation').classList.contains('active');

  if (presentationActive) {
    touchStartX = e.changedTouches[0].screenX;
  }
});

document.addEventListener('touchend', (e) => {
  const presentationActive = document.getElementById('presentation').classList.contains('active');

  if (presentationActive) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < swipeThreshold) return;

  if (diff > 0) {
    // Свайп влево - следующий слайд
    nextSlide();
  } else {
    // Свайп вправо - предыдущий слайд
    prevSlide();
  }
}

/* ========================================
   ВСТУПИТЕЛЬНЫЙ ЭКРАН
   ======================================== */
function hideIntroScreen() {
  const introScreen = document.getElementById('introScreen');
  const logo = document.getElementById('logo');
  const heroTitle = document.getElementById('heroTitle');
  const progressContainer = document.getElementById('progressContainer');
  const mainContainer = document.getElementById('mainContainer');
  const container = document.querySelector('.container');

  // Скрыть вступительный экран
  introScreen.classList.add('hidden');

  // Убрать класс intro-active у body
  document.body.classList.remove('intro-active');

  // Восстановить видимость основных контейнеров
  container.style.display = 'block';
  progressContainer.style.display = 'block';

  // Показать основные элементы
  logo.classList.remove('hidden-on-intro');
  heroTitle.classList.remove('hidden-on-intro');
  progressContainer.classList.remove('hidden-on-intro');
  mainContainer.classList.remove('hidden-on-intro');

  // Удалить обработчик клавиатуры
  document.removeEventListener('keydown', handleIntroKeyPress);
}

// Обработчик клавиатуры для вступительного экрана
function handleIntroKeyPress(event) {
  const introScreen = document.getElementById('introScreen');
  if (introScreen && !introScreen.classList.contains('hidden')) {
    if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      hideIntroScreen();
    }
  }
}

/* ========================================
   ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
   ======================================== */
async function init() {
  try {
    await initDB();
    await loadFromIndexedDB();
    await loadProgressFromIndexedDB();
    await loadSplitModeFromIndexedDB();
    createRegionCards();
    updateProgress();

    // Скрыть основные элементы при загрузке
    const logo = document.getElementById('logo');
    const heroTitle = document.getElementById('heroTitle');
    const progressContainer = document.getElementById('progressContainer');
    const mainContainer = document.getElementById('mainContainer');

    // Добавить класс intro-active к body
    document.body.classList.add('intro-active');

    logo.classList.add('hidden-on-intro');
    heroTitle.classList.add('hidden-on-intro');
    progressContainer.classList.add('hidden-on-intro');
    mainContainer.classList.add('hidden-on-intro');

    // Добавить обработчик клавиатуры для вступительного экрана
    document.addEventListener('keydown', handleIntroKeyPress);

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Ошибка инициализации приложения. Проверьте консоль для деталей.');
  }
}

/* ========================================
   ГЕНЕРАЦИЯ МЕРЦАЮЩИХ ЗВЁЗД
   ======================================== */
function createStars() {
  const container = document.getElementById('starsContainer');
  if (!container) return;

  const starCount = 150; // Количество звёзд
  const sizes = ['tiny', 'tiny', 'tiny', 'small', 'small', 'medium', 'large']; // Больше маленьких

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = `star ${sizes[Math.floor(Math.random() * sizes.length)]}`;

    // Случайное положение
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Случайная длительность и задержка мерцания
    star.style.setProperty('--twinkle-duration', `${1.5 + Math.random() * 3}s`);
    star.style.setProperty('--twinkle-delay', `${Math.random() * 3}s`);

    container.appendChild(star);
  }
}

/* ========================================
   ГЕНЕРАЦИЯ ПАДАЮЩИХ СНЕЖИНОК
   ======================================== */
function createSnowflakes() {
  const container = document.getElementById('snowflakesContainer');
  if (!container) return;

  const snowflakeCount = 60; // Много снежинок
  const snowflakeChars = ['❄', '❅', '❆', '✻', '✼', '❋', '✿', '❀'];

  for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];

    // Случайное положение по горизонтали
    snowflake.style.left = `${Math.random() * 100}%`;

    // Случайный размер (8-28px)
    const size = 8 + Math.random() * 20;
    snowflake.style.setProperty('--snowflake-size', `${size}px`);

    // Случайная длительность падения (8-18 секунд)
    const duration = 8 + Math.random() * 10;
    snowflake.style.setProperty('--fall-duration', `${duration}s`);

    // Случайная задержка
    snowflake.style.setProperty('--fall-delay', `${Math.random() * 15}s`);

    // Случайный дрейф влево/вправо (-100 до 100px)
    snowflake.style.setProperty('--drift', `${-100 + Math.random() * 200}px`);

    // Случайная прозрачность
    snowflake.style.opacity = 0.5 + Math.random() * 0.5;

    container.appendChild(snowflake);
  }
}

/* ========================================
   ЗАПУСК
   ======================================== */
// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createStars();
    createSnowflakes();
    init();
  });
} else {
  createStars();
  createSnowflakes();
  init();
}

/* ========================================
   ФИНАЛЬНЫЙ ЭКРАН С ПОЖЕЛАНИЯМИ
   ======================================== */

// Показать финальный экран
function showFinalScreen() {
  const finalScreen = document.getElementById('finalScreen');
  finalScreen.classList.add('active');

  // Запускаем эффекты
  startFlashingWishes();
  startFloatingWishes();
  generateQRCode();
}

// Закрыть финальный экран
function closeFinalScreen() {
  const finalScreen = document.getElementById('finalScreen');
  finalScreen.classList.remove('active');

  // Останавливаем эффекты
  stopFlashingWishes();
  stopFloatingWishes();

  // Очищаем фон
  const wishesBackground = document.getElementById('wishesBackground');
  wishesBackground.innerHTML = '';
}

// Эффект быстро мелькающих пожеланий
function startFlashingWishes() {
  const background = document.getElementById('wishesBackground');

  finalScreenInterval = setInterval(() => {
    const wish = wishesForAnimation[Math.floor(Math.random() * wishesForAnimation.length)];
    const flashElement = document.createElement('div');
    flashElement.className = 'flash-wish';
    flashElement.textContent = wish;

    background.appendChild(flashElement);

    // Удаляем после анимации
    setTimeout(() => {
      flashElement.remove();
    }, 150);
  }, 200);
}

function stopFlashingWishes() {
  if (finalScreenInterval) {
    clearInterval(finalScreenInterval);
    finalScreenInterval = null;
  }
}

// Эффект плавающих пожеланий по бокам
function startFloatingWishes() {
  const background = document.getElementById('wishesBackground');

  // Создаём начальные плавающие пожелания
  for (let i = 0; i < 15; i++) {
    setTimeout(() => createFloatingWish(background), i * 500);
  }

  // Продолжаем создавать новые
  floatingWishesInterval = setInterval(() => {
    createFloatingWish(background);
  }, 800);
}

function createFloatingWish(container) {
  const wish = wishesForAnimation[Math.floor(Math.random() * wishesForAnimation.length)];
  const element = document.createElement('div');
  element.className = 'floating-wish';
  element.textContent = wish;

  // Случайные параметры
  const startY = Math.random() * 80 + 10; // 10-90% от высоты
  const endY = startY + (Math.random() * 20 - 10); // небольшое отклонение
  const duration = 8 + Math.random() * 6; // 8-14 секунд

  element.style.setProperty('--start-y', `${startY}vh`);
  element.style.setProperty('--end-y', `${endY}vh`);
  element.style.setProperty('--float-duration', `${duration}s`);
  element.style.setProperty('--float-delay', '0s');

  container.appendChild(element);

  // Удаляем после завершения анимации
  setTimeout(() => {
    element.remove();
  }, duration * 1000);
}

function stopFloatingWishes() {
  if (floatingWishesInterval) {
    clearInterval(floatingWishesInterval);
    floatingWishesInterval = null;
  }
}

// Генерация QR-кода (статический файл из репозитория)
function generateQRCode() {
  const qrContainer = document.getElementById('qrCode');
  qrContainer.innerHTML = '';

  const img = document.createElement('img');
  img.src = QR_IMAGE_URL; // например './qr.png'
  img.alt = 'QR-код для получения пожелания';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';

  // На случай, если файл qr.png не найден / не загрузился
  img.onerror = () => {
    qrContainer.innerHTML = `
      <div style="text-align:center; padding:12px;">
        <div style="margin-bottom:8px;">QR не загрузился</div>
        <div style="font-size:14px; opacity:.85;">
          Откройте ссылку вручную:
          <a href="${WISH_PAGE_URL}" target="_blank" rel="noopener noreferrer">${WISH_PAGE_URL}</a>
        </div>
      </div>
    `;
  };

  qrContainer.appendChild(img);
}

/* ========================================
   ОБРАБОТКА ОШИБОК ЗАГРУЗКИ ИЗОБРАЖЕНИЙ
   ======================================== */
window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    console.warn('Image failed to load:', e.target.src);
  }
}, true);

/* ========================================
   УПРАВЛЕНИЕ ВИДИМОСТЬЮ СТРАНИЦЫ
   ======================================== */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Сохранение прогресса при сворачивании
    if (viewedRegions.size > 0) {
      saveProgressToIndexedDB().catch(err => console.error('Error saving progress:', err));
    }
  }
});
