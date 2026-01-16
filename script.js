/* ========================================
   CONFIG
   ======================================== */

// База GitHub Pages вашего проекта
const PAGES_BASE_URL = 'https://aleksey341.github.io/-2025';

// Если папки со слайдами лежат в корне репозитория (как у вас сейчас) — оставьте пусто:
// Пример: https://.../-2025/Samara/01.png
const SLIDES_ROOT_DIR = ''; // '' или 'slides' если перенесёте всё в /slides/

// Формат номера файла: 2 цифры (01..99)
const SLIDE_EXT = 'png';
const SLIDE_PAD = 2;
const SLIDE_MAX_TRY = 200; // максимальное число слайдов на регион, чтобы не уйти в бесконечность

// URL страницы с пожеланием
const WISH_PAGE_URL = 'https://aleksey341.github.io/-2025/wish.html';
const QR_IMAGE_URL = './qr.png';

/* ========================================
   GLOBAL STATE
   ======================================== */
let db;
let slidesData = {};              // { regionId: [ {name, data}, ... ] }  data = URL
let viewedRegions = new Set();
let currentRegion = null;
let currentSlideIndex = 0;
let isSplitMode = false;
let isFirstLoad = true;
let finalScreenInterval = null;
let floatingWishesInterval = null;

// Пожелания для эффекта мелькания (оставил как было, можно расширять)
const wishesForAnimation = [
  "Пусть дисциплина будет мягкой, но рабочей",
  "Пусть мотивация приходит изнутри",
  "Пусть вы чаще чувствуете уверенность",
  "Пусть решения даются легко",
  "Пусть каждый месяц приносит маленькую победу",
  "Пусть год станет для вас точкой роста",
  "Пусть ваши навыки монетизируются достойно",
  "Пусть дедлайны будут управляемыми",
  "Пусть уважение к вам будет нормой",
  "Пусть ваши деньги работают без нервов",
  "Пусть дом будет наполнен светом",
  "Пусть любовь будет зрелой и тёплой",
  "Пусть забота будет взаимной",
  "Пусть вы слышите друг друга",
  "Пусть в семье будет больше поддержки",
  "Пусть вас окружают надёжные люди"
];

/* ========================================
   REGIONS (ID == folder name in repo)
   ======================================== */

// Базовые регионы (до разделения Владивостока)
const regions = [
  { id: 'Samara',       name: 'Самара',            code: '#63', ornament: 'samara' },
  { id: 'SPB',          name: 'Санкт-Петербург',   code: '#78', ornament: 'spb' },
  { id: 'Vladivostok',  name: 'Владивосток',       code: '#25', ornament: 'vladivostok' },
  { id: 'Jamal',        name: 'ЯНАО',              code: '#89', ornament: 'yanao' },
  { id: 'Krasnodar',    name: 'Краснодар',         code: '#23', ornament: 'krasnodar' },
  { id: 'NN',           name: 'Нижний Новгород',   code: '#52', ornament: 'nn' },
  { id: 'Novosib',      name: 'Новосибирск',       code: '#54', ornament: 'novosib' },
  { id: 'Arhangelsk',   name: 'Архангельск',       code: '#29', ornament: 'arhangelsk' }
];

// Скрытый регион Кировская (появляется после разделения Владивостока)
const kirovRegion = { id: 'Kirovskaja', name: 'Кировская область', code: '#43', ornament: 'kirovskaja' };

/* ========================================
   HELPERS
   ======================================== */
function $(id) { return document.getElementById(id); }

function to2(n) {
  return String(n).padStart(SLIDE_PAD, '0');
}

function buildSlideUrl(regionId, index1based) {
  const file = `${to2(index1based)}.${SLIDE_EXT}`;
  const parts = [PAGES_BASE_URL];
  if (SLIDES_ROOT_DIR) parts.push(SLIDES_ROOT_DIR);
  parts.push(regionId, file);
  return parts.join('/').replace(/([^:]\/)\/+/g, '$1'); // нормализуем двойные слэши
}

function safeText(s) {
  return String(s ?? '');
}

function getTotalRegionsCount() {
  // После split появляется ещё один активный регион (Кировская),
  // при этом Владивосток остаётся просмотренным и карточка слева становится неактивной.
  return regions.length + (isSplitMode ? 1 : 0);
}

function hasSlides(regionId) {
  return Array.isArray(slidesData[regionId]) && slidesData[regionId].length > 0;
}

/* ========================================
   INDEXEDDB INIT
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

async function saveToIndexedDB(regionId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['slides'], 'readwrite');
    const store = tx.objectStore('slides');
    const request = store.put({ regionId, slides: slidesData[regionId] || [] });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['slides'], 'readonly');
    const store = tx.objectStore('slides');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      results.forEach(item => {
        if (item.slides && item.slides.length > 0) {
          // нормализуем формат
          slidesData[item.regionId] = item.slides.map(slide => {
            if (typeof slide === 'string') return { name: '', data: slide };
            return slide;
          });

          slidesData[item.regionId].sort((a, b) => {
            const an = a?.name || '';
            const bn = b?.name || '';
            return an.localeCompare(bn, undefined, { numeric: true });
          });
        }
      });
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

async function saveProgressToIndexedDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['progress'], 'readwrite');
    const store = tx.objectStore('progress');
    const request = store.put({ id: 'viewedRegions', regions: Array.from(viewedRegions) });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadProgressFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['progress'], 'readonly');
    const store = tx.objectStore('progress');
    const request = store.get('viewedRegions');

    request.onsuccess = () => {
      if (request.result?.regions) viewedRegions = new Set(request.result.regions);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

async function saveSplitModeToIndexedDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['progress'], 'readwrite');
    const store = tx.objectStore('progress');
    const request = store.put({ id: 'splitMode', value: !!isSplitMode });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadSplitModeFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['progress'], 'readonly');
    const store = tx.objectStore('progress');
    const request = store.get('splitMode');

    request.onsuccess = () => {
      isSplitMode = !!request.result?.value;
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/* ========================================
   DOWNLOAD SLIDES FROM GITHUB PAGES
   ======================================== */

// Проверка существования файла (HEAD, fallback на GET)
async function urlExists(url) {
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

// Скачиваем регион: 01..N, пока не 404
async function downloadRegionSlides(regionId, { onProgress } = {}) {
  const collected = [];
  for (let i = 1; i <= SLIDE_MAX_TRY; i++) {
    const url = buildSlideUrl(regionId, i);
    const ok = await urlExists(url);
    if (!ok) break;

    collected.push({
      name: `${to2(i)}.${SLIDE_EXT}`,
      data: url
    });

    if (typeof onProgress === 'function') {
      onProgress({ loaded: collected.length, lastUrl: url });
    }
  }
  return collected;
}

async function loadFromRepoForRegion(regionId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // UI: покажем простую индикацию
  const btn = document.querySelector(`.upload-region-btn[data-region-id="${CSS.escape(regionId)}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Загрузка...';
  }

  try {
    const slides = await downloadRegionSlides(regionId, {
      onProgress: ({ loaded }) => {
        if (btn) btn.textContent = `⏳ Загрузка... (${loaded})`;
      }
    });

    if (!slides.length) {
      alert(`В папке ${regionId} не найдено слайдов (ожидаются 01.${SLIDE_EXT}, 02.${SLIDE_EXT}...).\nПроверьте регистр папки и публикацию GitHub Pages.`);
      return;
    }

    slidesData[regionId] = slides;
    await saveToIndexedDB(regionId);
    createRegionCards();
  } catch (err) {
    console.error(err);
    alert('Ошибка загрузки слайдов. Откройте консоль (F12) для деталей.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📥 Загрузить слайды';
    }
  }
}

/* ========================================
   UI: REGION CARDS
   ======================================== */
function createRegionCards() {
  const grid = $('bentoGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (isSplitMode) grid.classList.add('split-mode');
  else grid.classList.remove('split-mode');

  let cardIndex = 0;

  regions.forEach(region => {
    if (isSplitMode && region.id === 'Vladivostok') {
      // слева — Владивосток (неактивный), справа — Кировская (активная)
      createSplitCard(grid, region, true, cardIndex); cardIndex++;
      createSplitCard(grid, kirovRegion, false, cardIndex); cardIndex++;
      return;
    }

    createRegionCard(grid, region, false, cardIndex);
    cardIndex++;
  });

  if (isFirstLoad) {
    setTimeout(() => { isFirstLoad = false; }, 1000);
  }
}

function createRegionCard(grid, region, forceInactive = false, cardIndex = 0) {
  const item = document.createElement('div');
  item.className = `bento-item ${region.id}${isFirstLoad ? ' animate-in' : ''}`;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `${region.name} - ${viewedRegions.has(region.id) ? 'Просмотрено' : 'Нажмите для просмотра'}`);

  if (isFirstLoad) item.style.setProperty('--appear-delay', `${cardIndex * 0.1}s`);

  if (viewedRegions.has(region.id) || forceInactive) item.classList.add('viewed');

  const regionHasSlides = hasSlides(region.id);
  const thumbnail = regionHasSlides ? slidesData[region.id][0].data : '';

  const actionHTML = regionHasSlides
    ? `<img src="${safeText(thumbnail)}" class="region-thumbnail" alt="${safeText(region.name)}">`
    : `<button class="upload-region-btn" data-region-id="${safeText(region.id)}" aria-label="Загрузить слайды для ${safeText(region.name)}">📥 Загрузить слайды</button>`;

  // Орнамент (если файла нет — просто скрываем)
  const ornamentFile = `ornament_${safeText(region.ornament || region.id)}.png`;

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${safeText(region.code)}</span>
        </div>
        <img src="${ornamentFile}" class="region-ornament" alt="${safeText(region.name)}"
             onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${actionHTML}
      </div>
    </div>
  `;

  if (!forceInactive) {
    const openPresentationHandler = (e) => {
      // Клик по кнопке загрузки
      if (e.target.classList.contains('upload-region-btn') || e.target.closest('.upload-region-btn')) return;

      // Просмотренные не открываем
      if (viewedRegions.has(region.id)) return;

      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
      } else {
        if (regionHasSlides) {
          openPresentation(region.id);
          item.classList.remove('flipped');
        } else {
          alert('Сначала загрузите слайды для этого региона.');
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

    // Кнопка "Загрузить слайды" из GitHub Pages
    if (!regionHasSlides) {
      const uploadBtn = item.querySelector('.upload-region-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          loadFromRepoForRegion(region.id, e);
        }, true);
      }
    }
  }

  grid.appendChild(item);
}

function createSplitCard(grid, region, isLeft, cardIndex = 0) {
  const item = document.createElement('div');

  const isInactive = isLeft;
  const cssClass = isLeft ? 'vladivostok-split-left' : 'kirov-split-right';

  item.className = `bento-item ${region.id} ${cssClass} split-card${isFirstLoad ? ' animate-in' : ''}`;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-label', `${region.name} - ${isInactive ? 'Неактивна' : 'Нажмите для просмотра'}`);

  if (isFirstLoad) item.style.setProperty('--appear-delay', `${cardIndex * 0.1}s`);

  if (isInactive || viewedRegions.has(region.id)) item.classList.add('viewed');

  const regionHasSlides = hasSlides(region.id);
  const thumbnail = regionHasSlides ? slidesData[region.id][0].data : '';

  const actionHTML = regionHasSlides
    ? `<img src="${safeText(thumbnail)}" class="region-thumbnail" alt="${safeText(region.name)}">`
    : `<button class="upload-region-btn" data-region-id="${safeText(region.id)}" aria-label="Загрузить слайды для ${safeText(region.name)}">📥 Загрузить слайды</button>`;

  const ornamentFile = `ornament_${safeText(region.ornament || region.id)}.png`;

  item.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="license-plate">
          <span class="license-code">${safeText(region.code)}</span>
        </div>
        <img src="${ornamentFile}" class="region-ornament" alt="${safeText(region.name)}"
             onerror="this.style.display='none'">
      </div>
      <div class="card-back">
        ${actionHTML}
      </div>
    </div>
  `;

  if (!isInactive) {
    const openPresentationHandler = (e) => {
      if (e.target.classList.contains('upload-region-btn') || e.target.closest('.upload-region-btn')) return;
      if (viewedRegions.has(region.id)) return;

      if (!item.classList.contains('flipped')) {
        item.classList.add('flipped');
      } else {
        if (regionHasSlides) {
          openPresentation(region.id);
          item.classList.remove('flipped');
        } else {
          alert('Сначала загрузите слайды для этого региона.');
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

    if (!regionHasSlides) {
      const uploadBtn = item.querySelector('.upload-region-btn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          loadFromRepoForRegion(region.id, e);
        }, true);
      }
    }
  }

  grid.appendChild(item);
}

/* ========================================
   PRESENTATION VIEW
   ======================================== */
function openPresentation(regionId) {
  if (!hasSlides(regionId)) return;

  currentRegion = regionId;
  currentSlideIndex = 0;

  const container = $('slidesContainer');
  container.innerHTML = '';

  slidesData[regionId].forEach((slide, index) => {
    const img = document.createElement('img');
    img.src = slide.data; // URL
    img.className = 'slide';
    img.alt = `Слайд ${index + 1} из ${slidesData[regionId].length}`;
    if (index === currentSlideIndex) img.classList.add('active');
    container.appendChild(img);
  });

  updateSlideCounter();
  updateNavigationButtons();

  const presentation = $('presentation');
  presentation.classList.add('active');
  presentation.focus();

  viewedRegions.add(regionId);
  updateProgress();
  saveProgressToIndexedDB().catch(console.error);
}

function closePresentation() {
  const wasKirovPresentation = currentRegion === kirovRegion.id;

  $('presentation').classList.remove('active');
  currentRegion = null;

  const container = document.querySelector('.container');
  const progressContainer = document.querySelector('.progress-container');
  if (container) container.style.display = 'block';
  if (progressContainer) progressContainer.style.display = 'block';

  saveProgressToIndexedDB().catch(console.error);
  createRegionCards();

  if (wasKirovPresentation) {
    setTimeout(() => showFinalScreen(), 500);
  }
}

function updateNavigationButtons() {
  if (!currentRegion) return;

  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.nav-button.prev');
  const nextBtn = document.querySelector('.nav-button.next');

  if (!prevBtn || !nextBtn) return;

  if (currentSlideIndex === 0) {
    prevBtn.classList.add('disabled');
    prevBtn.setAttribute('aria-disabled', 'true');
  } else {
    prevBtn.classList.remove('disabled');
    prevBtn.setAttribute('aria-disabled', 'false');
  }

  if (currentSlideIndex === slides.length - 1) {
    nextBtn.classList.add('disabled');
    nextBtn.setAttribute('aria-disabled', 'true');
  } else {
    nextBtn.classList.remove('disabled');
    nextBtn.setAttribute('aria-disabled', 'false');
  }
}

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

function updateSlideCounter() {
  if (!currentRegion) return;
  const total = slidesData[currentRegion].length;
  const counter = $('slideCounter');
  if (!counter) return;
  counter.textContent = `${currentSlideIndex + 1} / ${total}`;
  counter.setAttribute('aria-label', `Слайд ${currentSlideIndex + 1} из ${total}`);
}

/* ========================================
   PROGRESS / SPLIT MODE
   ======================================== */
function updateProgress() {
  const total = getTotalRegionsCount();
  const viewed = viewedRegions.size;
  const percentage = Math.min(100, (viewed / total) * 100);

  const progressFill = $('progressFill');
  const progressText = $('progressText');
  const progressBar = document.querySelector('.progress-bar');

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (progressText) progressText.textContent = `Просмотрено: ${viewed} из ${total} регионов`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', String(percentage));

  // Когда все базовые регионы просмотрены — включаем split
  if (viewedRegions.size >= regions.length && !isSplitMode) {
    setTimeout(() => splitVladivostokCard(), 500);
  }
}

function splitVladivostokCard() {
  if (isSplitMode) return;
  isSplitMode = true;

  const vladCard = document.querySelector('.bento-item.Vladivostok');
  if (vladCard) vladCard.classList.add('splitting');

  setTimeout(() => {
    createRegionCards();
    saveSplitModeToIndexedDB().catch(console.error);
    updateProgress();
  }, 800);
}

/* ========================================
   RESET
   ======================================== */
async function resetSlides() {
  if (!confirm('Вы уверены, что хотите удалить все загруженные слайды?')) return;

  slidesData = {};

  const tx = db.transaction(['slides'], 'readwrite');
  const store = tx.objectStore('slides');
  const request = store.clear();

  request.onsuccess = () => createRegionCards();
}

async function resetProgress() {
  if (!confirm('Вы уверены, что хотите сбросить прогресс просмотра?')) return;

  viewedRegions.clear();
  isSplitMode = false;

  const tx = db.transaction(['progress'], 'readwrite');
  const store = tx.objectStore('progress');
  const request = store.clear();

  request.onsuccess = () => {
    updateProgress();
    createRegionCards();
    showIntroScreen();
  };
}

/* ========================================
   INTRO SCREEN (оставил вашу логику)
   ======================================== */
function showIntroScreen() {
  const introScreen = $('introScreen');
  const logo = $('logo');
  const heroTitle = $('heroTitle');
  const progressContainer = $('progressContainer');
  const mainContainer = $('mainContainer');
  const container = document.querySelector('.container');

  if (!introScreen) return;

  introScreen.classList.remove('hidden');
  document.body.classList.add('intro-active');

  if (container) container.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';

  if (logo) logo.classList.add('hidden-on-intro');
  if (heroTitle) heroTitle.classList.add('hidden-on-intro');
  if (progressContainer) progressContainer.classList.add('hidden-on-intro');
  if (mainContainer) mainContainer.classList.add('hidden-on-intro');

  document.addEventListener('keydown', handleIntroKeyPress);
}

function hideIntroScreen() {
  const introScreen = $('introScreen');
  const logo = $('logo');
  const heroTitle = $('heroTitle');
  const progressContainer = $('progressContainer');
  const mainContainer = $('mainContainer');
  const container = document.querySelector('.container');

  if (!introScreen) return;

  introScreen.classList.add('hidden');
  document.body.classList.remove('intro-active');

  if (container) container.style.display = 'block';
  if (progressContainer) progressContainer.style.display = 'block';

  if (logo) logo.classList.remove('hidden-on-intro');
  if (heroTitle) heroTitle.classList.remove('hidden-on-intro');
  if (progressContainer) progressContainer.classList.remove('hidden-on-intro');
  if (mainContainer) mainContainer.classList.remove('hidden-on-intro');

  document.removeEventListener('keydown', handleIntroKeyPress);
}

function handleIntroKeyPress(event) {
  const introScreen = $('introScreen');
  if (introScreen && !introScreen.classList.contains('hidden')) {
    if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      hideIntroScreen();
    }
  }
}

/* ========================================
   KEYBOARD + TOUCH NAVIGATION
   ======================================== */
document.addEventListener('keydown', (e) => {
  const presentationActive = $('presentation')?.classList.contains('active');

  if (presentationActive) {
    switch (e.key) {
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

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  const presentationActive = $('presentation')?.classList.contains('active');
  if (presentationActive) touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  const presentationActive = $('presentation')?.classList.contains('active');
  if (presentationActive) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    const swipeThreshold = 50;
    if (Math.abs(diff) < swipeThreshold) return;
    if (diff > 0) nextSlide();
    else prevSlide();
  }
});

/* ========================================
   VISUAL EFFECTS (оставил ваши хелперы, без изменений)
   ======================================== */
function createStars() {
  const container = $('starsContainer');
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
  const container = $('snowflakesContainer');
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
   FINAL SCREEN + QR
   ======================================== */
function showFinalScreen() {
  const finalScreen = $('finalScreen');
  if (!finalScreen) return;
  finalScreen.classList.add('active');

  startFlashingWishes();
  startFloatingWishes();
  generateQRCode();
}

function closeFinalScreen() {
  const finalScreen = $('finalScreen');
  if (!finalScreen) return;
  finalScreen.classList.remove('active');

  stopFlashingWishes();
  stopFloatingWishes();

  const wishesBackground = $('wishesBackground');
  if (wishesBackground) wishesBackground.innerHTML = '';
}

function startFlashingWishes() {
  const background = $('wishesBackground');
  if (!background) return;

  finalScreenInterval = setInterval(() => {
    const wish = wishesForAnimation[Math.floor(Math.random() * wishesForAnimation.length)];
    const flashElement = document.createElement('div');
    flashElement.className = 'flash-wish';
    flashElement.textContent = wish;

    background.appendChild(flashElement);

    setTimeout(() => flashElement.remove(), 150);
  }, 200);
}

function stopFlashingWishes() {
  if (finalScreenInterval) {
    clearInterval(finalScreenInterval);
    finalScreenInterval = null;
  }
}

function startFloatingWishes() {
  const background = $('wishesBackground');
  if (!background) return;

  for (let i = 0; i < 15; i++) setTimeout(() => createFloatingWish(background), i * 500);

  floatingWishesInterval = setInterval(() => createFloatingWish(background), 800);
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
  setTimeout(() => element.remove(), duration * 1000);
}

function stopFloatingWishes() {
  if (floatingWishesInterval) {
    clearInterval(floatingWishesInterval);
    floatingWishesInterval = null;
  }
}

function generateQRCode() {
  const qrContainer = $('qrCode');
  if (!qrContainer) return;
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
   IMAGE ERROR LOG
   ======================================== */
window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    console.warn('Image failed to load:', e.target.src);
  }
}, true);

/* ========================================
   VISIBILITY SAVE
   ======================================== */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (viewedRegions.size > 0) saveProgressToIndexedDB().catch(console.error);
  }
});

/* ========================================
   INIT
   ======================================== */
async function init() {
  try {
    await initDB();
    await loadFromIndexedDB();
    await loadProgressFromIndexedDB();
    await loadSplitModeFromIndexedDB();

    createRegionCards();
    updateProgress();

    // стартовый экран как у вас
    document.body.classList.add('intro-active');

    const logo = $('logo');
    const heroTitle = $('heroTitle');
    const progressContainer = $('progressContainer');
    const mainContainer = $('mainContainer');

    if (logo) logo.classList.add('hidden-on-intro');
    if (heroTitle) heroTitle.classList.add('hidden-on-intro');
    if (progressContainer) progressContainer.classList.add('hidden-on-intro');
    if (mainContainer) mainContainer.classList.add('hidden-on-intro');

    document.addEventListener('keydown', handleIntroKeyPress);

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Ошибка инициализации приложения. Проверьте консоль для деталей.');
  }
}

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

// Экспортируем в глобальную область (если у вас кнопки в HTML вызывают функции)
window.closePresentation = closePresentation;
window.resetSlides = resetSlides;
window.resetProgress = resetProgress;
window.hideIntroScreen = hideIntroScreen;
window.closeFinalScreen = closeFinalScreen;
