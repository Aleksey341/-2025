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

/**
 * Базовый URL для ассетов (папки и картинки) относительно текущей страницы.
 * Если index.html лежит в корне репозитория, то получится:
 * https://aleksey341.github.io/-2025/
 */
const ASSETS_BASE_URL = new URL('.', window.location.href).href;

// Настройки авто-поиска слайдов в папке
const SLIDE_FILE_EXT = 'png';
const SLIDE_PAD = 2;               // 01.png, 02.png
const SLIDE_MAX = 120;             // максимум попыток (на всякий)
const SLIDE_STOP_AFTER_MISSES = 5; // остановиться после N подряд промахов, если уже нашли хотя бы 1

/* ========================================
   Пожелания для эффекта мелькания
   ======================================== */
const wishesForAnimation = [
  "Пусть работа приносит смысл",
  "Пусть усилия замечают и ценят",
  "Пусть проекты завершаются вовремя",
  "Пусть рядом будут сильные союзники",
  "Пусть деньги приходят регулярно",
  "Пусть доход растёт быстрее расходов",
  "Пусть дом будет местом силы",
  "Пусть семья будет спокойным тылом",
  "Пусть здоровье будет крепким",
  "Пусть энергии хватает на главное",
  "Пусть Новый год принесёт удачу",
  "Пусть год подарит возможности",
  "Пусть мечты становятся реальностью",
  "Пусть вы гордитесь собой чаще",
  "Пусть вам везёт по-крупному",
  "Пусть удача будет вашим фоном",
  "Пусть всё важное складывается",
  "Пусть год будет счастливым"
];

/**
 * ВАЖНО:
 * - folder: имя папки в репозитории (в корне), где лежат 01.png, 02.png...
 * - ornament: как и было (для ornament_*.png)
 * - id/классы/порядок — не меняем (это влияет на бенто-сетку и CSS)
 */
const regions = [
  { id: 'nn',         name: 'ЯНАО',             code: '#89', ornament: 'yanao',      folder: 'ЯНАО' },
  { id: 'vladivostok',name: 'Владивосток',      code: '#25', ornament: 'vladivostok',folder: 'Vladivostok' },
  { id: 'yanao',      name: 'Новосибирск',      code: '#54', ornament: 'Novosib',    folder: 'Novosib' },
  { id: 'krasnodar',  name: 'Нижний Новгород',  code: '#52', ornament: 'nn',         folder: 'NN' },
  { id: 'region1',    name: 'Краснодар',        code: '#23', ornament: 'krasnodar',  folder: 'Krasnodar' },
  { id: 'region2',    name: 'Санкт-Петербург',  code: '#78', ornament: 'region4',    folder: 'SPB' },
  { id: 'region3',    name: 'Самара',           code: '#63', ornament: 'samara',     folder: 'Samara' },
  { id: 'region4',    name: 'Арх',              code: '#29', ornament: 'Арх',        folder: 'Arhangelsk' }
];

// Скрытый регион Кировская область (появляется после разделения)
const kirovRegion = { id: 'kirov', name: 'Кировская область', code: '#43', ornament: 'kirov', folder: 'Kirovskaja' };

/* ========================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ URL/ПРОВЕРКИ
   ======================================== */
function padNumber(num, size = 2) {
  return String(num).padStart(size, '0');
}

function buildUrlFromSegments(...segments) {
  // Кодируем каждый сегмент отдельно (важно для кириллицы в папках)
  const encoded = segments.map(s => encodeURIComponent(String(s))).join('/');
  return ASSETS_BASE_URL + encoded;
}

async function assetExists(url) {
  // GitHub Pages обычно поддерживает HEAD. Если вдруг нет — упадём в false.
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/* ========================================
   INDEXEDDB ИНИЦИАЛИЗАЦИЯ
   ======================================== */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PresentationDB', 3);

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
   АВТОЗАГРУЗКА СЛАЙДОВ ИЗ РЕПОЗИТОРИЯ (GitHub Pages)
   ======================================== */
async function loadRegionSlidesFromRepo(region) {
  const regionId = region.id;
  const folder = region.folder;

  if (!folder) return false;

  // Если уже есть слайды (из IndexedDB) — не перезагружаем
  if (slidesData[regionId] && slidesData[regionId].length > 0) {
    return true;
  }

  const found = [];
  let missesInRow = 0;
  let hasAny = false;

  for (let i = 1; i <= SLIDE_MAX; i++) {
    const fileName = `${padNumber(i, SLIDE_PAD)}.${SLIDE_FILE_EXT}`;
    const url = buildUrlFromSegments(folder, fileName);

    const exists = await assetExists(url);

    if (exists) {
      hasAny = true;
      missesInRow = 0;
      found.push({ name: fileName, data: url });
    } else {
      missesInRow++;
      // Если уже нашли хотя бы один файл и дальше идёт серия 404 — останавливаемся
      if (hasAny && missesInRow >= SLIDE_STOP_AFTER_MISSES) break;
    }
  }

  if (found.length > 0) {
    found.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    slidesData[regionId] = found;
    await saveToIndexedDB(regionId);
    return true;
  }

  // Если ничего не нашли — фиксируем пустым массивом, чтобы не дергать HEAD бесконечно
  slidesData[regionId] = [];
  await saveToIndexedDB(regionId);
  return false;
}

async function preloadAllSlidesFromRepo() {
  const all = [...regions, kirovRegion];

  // Последовательно, чтобы не устроить шторм из HEAD-запросов
  for (const r of all) {
    try {
      await loadRegionSlidesFromRepo(r);
    } catch (e) {
      console.warn('Repo preload failed for region:', r.id, e);
    }
  }

  // Перерисовать карточки, чтобы миниатюры появились автоматически
  createRegionCards();
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
   ОДНА КАРТОЧКА РЕГИОНА
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

  // Миниатюра первого слайда (как было)
  let thumbnail = '';
  if (hasSlides) {
    thumbnail = slidesData[region.id][0].data;
  }

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${region.code}</span>
        </div>
        <img src="ornament_${region.ornament || region.id}.png" class="region-ornament" alt="${region.name}" onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${hasSlides ? `<img src="${thumbnail}" class="region-thumbnail" alt="${region.name}">` : ``}
      </div>
    </div>
  `;

  // События клика и клавиатуры (если не принудительно неактивна)
  if (!forceInactive) {
    const openPresentationHandler = async (e) => {
      // Не реагировать на просмотренные
      if (viewedRegions.has(region.id)) return;

      // Переворот карточки
      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
        return;
      }

      // Второй клик — открытие презентации
      // Если слайдов еще нет — пробуем подтянуть из репозитория и затем открыть
      const nowHasSlides = slidesData[region.id] && slidesData[region.id].length > 0;

      if (!nowHasSlides) {
        const ok = await loadRegionSlidesFromRepo(region);
        createRegionCards(); // обновить миниатюры, если появились
        if (!ok) {
          // Ничего не нашли — просто не открываем
          return;
        }
      }

      openPresentation(region.id);
      item.classList.remove('flipped');
    };

    item.addEventListener('click', openPresentationHandler);

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPresentationHandler(e);
      }
    });
  }

  grid.appendChild(item);
}

/* ========================================
   РАЗДЕЛЁННАЯ КАРТОЧКА
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

  // Миниатюра первого слайда (как было)
  let thumbnail = '';
  if (hasSlides) {
    thumbnail = slidesData[region.id][0].data;
  }

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${region.code}</span>
        </div>
        <img src="ornament_${region.ornament || region.id}.png" class="region-ornament" alt="${region.name}" onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${hasSlides ? `<img src="${thumbnail}" class="region-thumbnail" alt="${region.name}">` : ``}
      </div>
    </div>
  `;

  // События только для активной карточки (Кировская)
  if (!isInactive) {
    const openPresentationHandler = async (e) => {
      if (viewedRegions.has(region.id)) return;

      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
        return;
      }

      const nowHasSlides = slidesData[region.id] && slidesData[region.id].length > 0;

      if (!nowHasSlides) {
        const ok = await loadRegionSlidesFromRepo(region);
        createRegionCards();
        if (!ok) return;
      }

      openPresentation(region.id);
      item.classList.remove('flipped');
    };

    item.addEventListener('click', openPresentationHandler);

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPresentationHandler(e);
      }
    });
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
   ЗАКРЫТИЕ ПРЕЗЕНТАЦИИ
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
   СЛЕДУЮЩИЙ/ПРЕДЫДУЩИЙ СЛАЙД
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
   СОХРАНЕНИЕ/ЗАГРУЗКА РЕЖИМА РАЗДЕЛЕНИЯ
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
   СБРОС СЛАЙДОВ/ПРОГРЕССА
   ======================================== */
async function resetSlides() {
  if (!confirm('Вы уверены, что хотите удалить все загруженные/кэшированные слайды?')) return;

  slidesData = {};

  const transaction = db.transaction(['slides'], 'readwrite');
  const store = transaction.objectStore('slides');
  const request = store.clear();

  request.onsuccess = async () => {
    console.log('All slides cleared');
    createRegionCards();
    // После очистки снова подтянем из репо
    await preloadAllSlidesFromRepo();
  };
}

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

  introScreen.classList.remove('hidden');
  document.body.classList.add('intro-active');

  container.style.display = 'none';
  progressContainer.style.display = 'none';

  logo.classList.add('hidden-on-intro');
  heroTitle.classList.add('hidden-on-intro');
  progressContainer.classList.add('hidden-on-intro');
  mainContainer.classList.add('hidden-on-intro');

  document.addEventListener('keydown', handleIntroKeyPress);
}

/* ========================================
   КЛАВИАТУРНАЯ НАВИГАЦИЯ
   ======================================== */
document.addEventListener('keydown', (e) => {
  const presentationActive = document.getElementById('presentation').classList.contains('active');

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
   TOUCH-СОБЫТИЯ
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

  if (diff > 0) nextSlide();
  else prevSlide();
}

/* ========================================
   ВСТУПИТЕЛЬНЫЙ ЭКРАН (скрыть)
   ======================================== */
function hideIntroScreen() {
  const introScreen = document.getElementById('introScreen');
  const logo = document.getElementById('logo');
  const heroTitle = document.getElementById('heroTitle');
  const progressContainer = document.getElementById('progressContainer');
  const mainContainer = document.getElementById('mainContainer');
  const container = document.querySelector('.container');

  introScreen.classList.add('hidden');
  document.body.classList.remove('intro-active');

  container.style.display = 'block';
  progressContainer.style.display = 'block';

  logo.classList.remove('hidden-on-intro');
  heroTitle.classList.remove('hidden-on-intro');
  progressContainer.classList.remove('hidden-on-intro');
  mainContainer.classList.remove('hidden-on-intro');

  document.removeEventListener('keydown', handleIntroKeyPress);
}

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
   ИНИЦИАЛИЗАЦИЯ
   ======================================== */
async function init() {
  try {
    await initDB();
    await loadFromIndexedDB();
    await loadProgressFromIndexedDB();
    await loadSplitModeFromIndexedDB();

    // Сначала рисуем сетку (как было)
    createRegionCards();
    updateProgress();

    // Затем автоматически подтягиваем слайды из репозитория (без кнопок)
    await preloadAllSlidesFromRepo();

    // Скрыть основные элементы при загрузке (как было)
    const logo = document.getElementById('logo');
    const heroTitle = document.getElementById('heroTitle');
    const progressContainer = document.getElementById('progressContainer');
    const mainContainer = document.getElementById('mainContainer');

    document.body.classList.add('intro-active');

    logo.classList.add('hidden-on-intro');
    heroTitle.classList.add('hidden-on-intro');
    progressContainer.classList.add('hidden-on-intro');
    mainContainer.classList.add('hidden-on-intro');

    document.addEventListener('keydown', handleIntroKeyPress);

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Ошибка инициализации приложения. Проверьте консоль для деталей.');
  }
}

/* ========================================
   ЗВЁЗДЫ/СНЕЖИНКИ (как было)
   ======================================== */
function createStars() {
  const container = document.getElementById('starsContainer');
  if (!container) return;

  const starCount = 150;
  const sizes = ['tiny', 'tiny', 'tiny', 'small', 'small', 'medium', 'large'];

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = `star ${sizes[Math.floor(Math.random() * sizes.length)]}`;

    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    star.style.setProperty('--twinkle-duration', `${1.5 + Math.random() * 3}s`);
    star.style.setProperty('--twinkle-delay', `${Math.random() * 3}s`);

    container.appendChild(star);
  }
}

function createSnowflakes() {
  const container = document.getElementById('snowflakesContainer');
  if (!container) return;

  const snowflakeCount = 60;
  const snowflakeChars = ['❄', '❅', '❆', '✻', '✼', '❋', '✿', '❀'];

  for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];

    snowflake.style.left = `${Math.random() * 100}%`;

    const size = 8 + Math.random() * 20;
    snowflake.style.setProperty('--snowflake-size', `${size}px`);

    const duration = 8 + Math.random() * 10;
    snowflake.style.setProperty('--fall-duration', `${duration}s`);

    snowflake.style.setProperty('--fall-delay', `${Math.random() * 15}s`);
    snowflake.style.setProperty('--drift', `${-100 + Math.random() * 200}px`);
    snowflake.style.opacity = 0.5 + Math.random() * 0.5;

    container.appendChild(snowflake);
  }
}

/* ========================================
   ЗАПУСК
   ======================================== */
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
function showFinalScreen() {
  const finalScreen = document.getElementById('finalScreen');
  finalScreen.classList.add('active');

  startFlashingWishes();
  startFloatingWishes();
  generateQRCode();
}

function closeFinalScreen() {
  const finalScreen = document.getElementById('finalScreen');
  finalScreen.classList.remove('active');

  stopFlashingWishes();
  stopFloatingWishes();

  const wishesBackground = document.getElementById('wishesBackground');
  wishesBackground.innerHTML = '';
}

function startFlashingWishes() {
  const background = document.getElementById('wishesBackground');

  finalScreenInterval = setInterval(() => {
    const wish = wishesForAnimation[Math.floor(Math.random() * wishesForAnimation.length)];
    const flashElement = document.createElement('div');
    flashElement.className = 'flash-wish';
    flashElement.textContent = wish;

    background.appendChild(flashElement);

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

function startFloatingWishes() {
  const background = document.getElementById('wishesBackground');

  for (let i = 0; i < 15; i++) {
    setTimeout(() => createFloatingWish(background), i * 500);
  }

  floatingWishesInterval = setInterval(() => {
    createFloatingWish(background);
  }, 800);
}

function createFloatingWish(container) {
  const wish = wishesForAnimation[Math.floor(Math.random() * wishesForAnimation.length)];
  const element = document.createElement('div');
  element.className = 'floating-wish';
  element.textContent = wish;

  const startY = Math.random() * 80 + 10;
  const endY = startY + (Math.random() * 20 - 10);
  const duration = 8 + Math.random() * 6;

  element.style.setProperty('--start-y', `${startY}vh`);
  element.style.setProperty('--end-y', `${endY}vh`);
  element.style.setProperty('--float-duration', `${duration}s`);
  element.style.setProperty('--float-delay', '0s');

  container.appendChild(element);

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
  img.src = QR_IMAGE_URL;
  img.alt = 'QR-код для получения пожелания';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';

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
    if (viewedRegions.size > 0) {
      saveProgressToIndexedDB().catch(err => console.error('Error saving progress:', err));
    }
  }
});
