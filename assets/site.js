const copyText = (text, onSuccess, onFailure) => {
  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();

    if (copied) {
      onSuccess();
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(onFailure);
      return;
    }

    onFailure();
  } catch {
    onFailure();
  }
};

document.querySelectorAll('[data-copy-text]').forEach((button) => {
  const originalLabel = button.textContent;
  const reset = () => {
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove('copied');
    }, 2200);
  };

  button.addEventListener('click', () => {
    button.textContent = 'Копируем…';
    copyText(
      button.dataset.copyText,
      () => {
        button.textContent = 'Скопировано ✓';
        button.classList.add('copied');
        reset();
      },
      () => {
        button.textContent = 'Не удалось скопировать';
        reset();
      },
    );
  });
});

const statuses = {
  active: 'Сервер активен',
  maintenance: 'Технические работы',
  soon: 'Скоро открытие',
};

document.querySelectorAll('[data-server-status]').forEach((status) => {
  const state = statuses[status.dataset.serverStatus] ? status.dataset.serverStatus : 'active';
  status.classList.add(`status-${state}`);
  status.querySelector('.server-status-label').textContent = statuses[state];
});

const cursorSevens = document.querySelector('#cursor-sevens');

if (cursorSevens && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const particleCount = 67;
  const repelDistance = 210;
  const particles = Array.from({ length: particleCount }, (_, index) => {
    const element = document.createElement('span');
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const angle = (Math.PI * 2 * index) / particleCount;

    element.className = 'cursor-seven';
    element.style.setProperty('--float-delay', `${-(Math.random() * 5.5).toFixed(2)}s`);
    element.style.setProperty('--float-duration', `${(3.8 + Math.random() * 2.8).toFixed(2)}s`);

    const symbol = document.createElement('span');
    symbol.className = 'cursor-seven-symbol';
    symbol.textContent = '🇫🇷';
    element.append(symbol);
    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    element.style.fontSize = `${12 + Math.round(Math.random() * 10)}px`;
    element.style.opacity = `${0.42 + Math.random() * 0.44}`;
    cursorSevens.append(element);

    return { element, x, y, angle };
  });

  let pointerX = -1000;
  let pointerY = -1000;
  let queued = false;

  const moveSevens = () => {
    queued = false;

    particles.forEach((particle) => {
      const x = (particle.x / 100) * window.innerWidth;
      const y = (particle.y / 100) * window.innerHeight;
      const dx = x - pointerX;
      const dy = y - pointerY;
      const distance = Math.hypot(dx, dy);
      const strength = distance < repelDistance
        ? ((repelDistance - distance) / repelDistance) ** 1.35 * 78
        : 0;
      const angle = distance > 0.1 ? Math.atan2(dy, dx) : particle.angle;
      const offsetX = Math.cos(angle) * strength;
      const offsetY = Math.sin(angle) * strength;

      particle.element.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${strength * 0.055}deg)`;
    });
  };

  const queueMove = () => {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(moveSevens);
    }
  };

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursorSevens.classList.add('is-active');
    queueMove();
  }, { passive: true });

  window.addEventListener('resize', queueMove, { passive: true });
}

const ruleSearch = document.querySelector('#rule-search');
const searchResult = document.querySelector('#search-result');

if (ruleSearch && searchResult) {
  const groups = [...document.querySelectorAll('#rules details, #minecraft details')];
  const initialOpen = new Map(groups.map((group) => [group, group.open]));
  const normalise = (value) => value.toLocaleLowerCase('ru-RU').trim();

  ruleSearch.addEventListener('input', () => {
    const query = normalise(ruleSearch.value);
    let found = 0;

    groups.forEach((group) => {
      const items = [...group.children].filter((item) => item.matches('p, .minecraft-examples'));

      if (!query) {
        group.hidden = false;
        group.open = initialOpen.get(group);
        items.forEach((item) => {
          item.hidden = false;
        });
        return;
      }

      const summaryMatches = normalise(group.querySelector('summary').textContent).includes(query);
      let hasMatch = summaryMatches;

      items.forEach((item) => {
        const matches = summaryMatches || normalise(item.textContent).includes(query);
        item.hidden = !matches;
        hasMatch ||= matches;
      });

      group.hidden = !hasMatch;
      if (hasMatch) {
        group.open = true;
        found += 1;
      }
    });

    searchResult.textContent = found
      ? `Найдено разделов: ${found}. Подходящие пункты раскрыты.`
      : 'Ничего не найдено. Попробуйте другое слово или номер правила.';
  });

  ruleSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      ruleSearch.value = '';
      ruleSearch.dispatchEvent(new Event('input'));
      ruleSearch.blur();
    }
  });
}

const worldStage = document.querySelector('[data-world-stage]');
const worldCube = document.querySelector('[data-world-cube]');
const worldReset = document.querySelector('[data-world-reset]');
const worldCountries = document.querySelectorAll('[data-country]');
const countryPanel = document.querySelector('[data-country-panel]');
const worldZoomRange = document.querySelector('[data-world-zoom-range]');
const worldZoomButtons = document.querySelectorAll('[data-world-zoom]');
const worldCaption = document.querySelector('[data-world-caption]');
const worldCountrySelects = document.querySelectorAll('[data-world-country-select]');

if (worldStage && worldCube) {
  const defaultRotation = { x: -14, y: -31 };
  const defaultZoom = 1;
  const minZoom = 0.72;
  const maxZoom = 1.38;
  const countryData = {
    france: {
      status: 'ТЕРРИТОРИЯ ВЫБРАНА',
      statusType: '',
      title: 'Французская Империя',
      kind: 'Территория в игровом мире',
      summary: 'Сильное европейское государство Земли XIII века. Империя строит порядок на уважении к РП, защите граждан и честной дипломатии.',
      ownerLabel: 'ВЛАДЕЛЕЦ ТЕРРИТОРИИ',
      owner: 'Jordan',
      rulerLabel: 'ИМПЕРАТОР',
      ruler: 'Шарль Дэ‑Вилл',
      capitalLabel: 'СТОЛИЦА',
      capital: 'Paris',
      era: 'XIII век н. э.',
      flag: 'linear-gradient(90deg,#2f60bb 0 33.33%,#f4f6ff 33.33% 66.66%,#d84c59 66.66%)',
      flagLabel: 'Флаг Франции',
      lawsTitle: 'Базовые законы Империи',
      laws: [
        'Уважайте жителей и отыгрывайте события в рамках RP‑правил сервера.',
        'Границы, договоры и войны признаются только после согласования и фиксации в игровом процессе.',
        'Запрещены грабёж, разрушения и захват имущества без обоснованной RP‑причины.',
        'Споры решаются через дипломатию; при конфликте окончательное слово — за Императором и администрацией проекта.',
      ],
      caption: 'Открыта Французская Империя. Потяните карту или выберите другую территорию.',
    },
    england: {
      status: 'ТЕСТОВАЯ СТРАНА · В РАЗРАБОТКЕ',
      statusType: 'is-development',
      title: 'Королевство Англия',
      kind: 'Тестовая карточка атласа',
      summary: 'Черновая территория для проверки интерактивной карты. Её правила и руководство будут добавлены, когда страна появится в игре.',
      ownerLabel: 'СТАТУС',
      owner: 'В разработке',
      rulerLabel: 'ПРАВИТЕЛЬ',
      ruler: 'Тестовая карточка',
      capitalLabel: 'СТОЛИЦА',
      capital: 'London',
      era: 'XIII век н. э.',
      flag: 'linear-gradient(90deg,transparent 42%,#e55a63 42% 58%,transparent 58%),linear-gradient(#eef5ff 42%,#e55a63 42% 58%,#eef5ff 58%),#3c6ebf',
      flagLabel: 'Тестовый флаг Англии',
      lawsTitle: 'Карточка в разработке',
      laws: [
        'Страна добавлена для тестирования карты и навигации.',
        'Данные о владельце, правилах и дипломатии появятся после открытия территории.',
      ],
      caption: 'Вы открыли тестовую страну. Она помечена как «в разработке».',
    },
    empire: {
      status: 'ТЕСТОВАЯ СТРАНА · В РАЗРАБОТКЕ',
      statusType: 'is-development',
      title: 'Священная Римская Империя',
      kind: 'Тестовая карточка атласа',
      summary: 'Черновая центральноевропейская территория. Используется, чтобы показать, как новые страны будут появляться на карте.',
      ownerLabel: 'СТАТУС',
      owner: 'В разработке',
      rulerLabel: 'ПРАВИТЕЛЬ',
      ruler: 'Тестовая карточка',
      capitalLabel: 'СТОЛИЦА',
      capital: 'Aachen',
      era: 'XIII век н. э.',
      flag: 'linear-gradient(135deg,#202732 0 33%,#e4bf64 33% 66%,#b94250 66%)',
      flagLabel: 'Тестовый флаг Священной Римской Империи',
      lawsTitle: 'Карточка в разработке',
      laws: [
        'Страна добавлена для тестирования карты и навигации.',
        'Перед открытием территория получит владельца, историю и собственные игровые законы.',
      ],
      caption: 'Вы открыли тестовую страну. Она помечена как «в разработке».',
    },
    egypt: {
      status: 'ТЕСТОВАЯ СТРАНА · В РАЗРАБОТКЕ',
      statusType: 'is-development',
      title: 'Мамлюкский Султанат',
      kind: 'Тестовая карточка атласа',
      summary: 'Черновая африканская территория. Нужна для проверки того, как карта будет работать с государствами разных регионов мира.',
      ownerLabel: 'СТАТУС',
      owner: 'В разработке',
      rulerLabel: 'ПРАВИТЕЛЬ',
      ruler: 'Тестовая карточка',
      capitalLabel: 'СТОЛИЦА',
      capital: 'Cairo',
      era: 'XIII век н. э.',
      flag: 'linear-gradient(135deg,#d1b557,#e8eff6 50%,#39856c)',
      flagLabel: 'Тестовый флаг Мамлюкского Султаната',
      lawsTitle: 'Карточка в разработке',
      laws: [
        'Страна добавлена для тестирования карты и навигации.',
        'После открытия здесь появятся сведения о правителе, столице и законах территории.',
      ],
      caption: 'Вы открыли тестовую страну. Она помечена как «в разработке».',
    },
    earth: {
      status: 'ПЛАНЕТА ВЫБРАНА',
      statusType: 'is-world',
      title: 'Земля',
      kind: 'Планета игрового мира',
      summary: 'Главная карта проекта: Земля в эпохе XIII века нашей эры. Здесь развиваются страны игроков, работают дипломатия, экономика и RP‑события.',
      ownerLabel: 'ТИП ОБЪЕКТА',
      owner: 'Планета',
      rulerLabel: 'НАСЕЛЕНИЕ',
      ruler: 'Страны игроков',
      capitalLabel: 'АТЛАС',
      capital: 'Версия 0.2',
      era: 'XIII век н. э.',
      flag: 'radial-gradient(circle at 32% 29%,#b4fff4 0 5%,transparent 6%),radial-gradient(circle at 66% 63%,#79d993 0 20%,transparent 21%),linear-gradient(135deg,#50cbe8,#1c579a 67%,#122e59)',
      flagLabel: 'Символ планеты Земля',
      lawsTitle: 'Информация о планете',
      laws: [
        'Эпоха мира — XIII век нашей эры; все события проходят в рамках RP‑правил проекта.',
        'Страны игроков добавляются на карту по мере создания и одобрения администрации.',
        'Клик по территории открывает её законы, руководство и краткую информацию.',
      ],
      caption: 'Выбрана Земля. Нажмите на выделенную страну, чтобы открыть её карточку.',
    },
  };
  const countryFields = {
    status: countryPanel?.querySelector('[data-country-status]'),
    flag: countryPanel?.querySelector('[data-country-flag]'),
    title: countryPanel?.querySelector('[data-country-title]'),
    kind: countryPanel?.querySelector('[data-country-kind]'),
    summary: countryPanel?.querySelector('[data-country-summary]'),
    ownerLabel: countryPanel?.querySelector('[data-country-owner-label]'),
    owner: countryPanel?.querySelector('[data-country-owner]'),
    rulerLabel: countryPanel?.querySelector('[data-country-ruler-label]'),
    ruler: countryPanel?.querySelector('[data-country-ruler]'),
    capitalLabel: countryPanel?.querySelector('[data-country-capital-label]'),
    capital: countryPanel?.querySelector('[data-country-capital]'),
    era: countryPanel?.querySelector('[data-country-era]'),
    lawsTitle: countryPanel?.querySelector('[data-country-laws-title]'),
    laws: countryPanel?.querySelector('[data-country-laws]'),
  };
  let rotationX = defaultRotation.x;
  let rotationY = defaultRotation.y;
  let zoom = defaultZoom;
  let dragStartX = 0;
  let dragStartY = 0;
  let startRotationX = rotationX;
  let startRotationY = rotationY;
  let activePointer = null;
  let didDrag = false;

  const setCubeRotation = () => {
    worldCube.style.setProperty('--tilt-x', `${rotationX}deg`);
    worldCube.style.setProperty('--tilt-y', `${rotationY}deg`);
  };

  const setZoom = (nextZoom) => {
    zoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));
    worldCube.style.setProperty('--zoom', zoom.toFixed(2));
    if (worldZoomRange) worldZoomRange.value = String(Math.round(zoom * 100));
  };

  const animateCountryPanel = () => {
    if (countryPanel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      countryPanel.animate(
        [
          { opacity: 0.55, transform: 'translateY(7px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 280, easing: 'cubic-bezier(.2,.75,.22,1)' },
      );
    }
  };

  const showCountry = (countryKey) => {
    const data = countryData[countryKey];
    if (!data || !countryPanel) return;

    countryPanel.dataset.activeCountry = countryKey;
    countryFields.status.className = `country-selected ${data.statusType}`.trim();
    countryFields.status.textContent = data.status;
    countryFields.flag.style.background = data.flag;
    countryFields.flag.setAttribute('aria-label', data.flagLabel);
    countryFields.title.textContent = data.title;
    countryFields.kind.textContent = data.kind;
    countryFields.summary.textContent = data.summary;
    countryFields.ownerLabel.textContent = data.ownerLabel;
    countryFields.owner.textContent = data.owner;
    countryFields.rulerLabel.textContent = data.rulerLabel;
    countryFields.ruler.textContent = data.ruler;
    countryFields.capitalLabel.textContent = data.capitalLabel;
    countryFields.capital.textContent = data.capital;
    countryFields.era.textContent = data.era;
    countryFields.lawsTitle.textContent = data.lawsTitle;
    countryFields.laws.replaceChildren(...data.laws.map((law) => {
      const item = document.createElement('li');
      item.textContent = law;
      return item;
    }));
    if (worldCaption) worldCaption.textContent = data.caption;

    worldCountries.forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.country === countryKey));
    });
    worldCountrySelects.forEach((item) => {
      item.setAttribute('aria-pressed', String(item.dataset.worldCountrySelect === countryKey));
    });
    animateCountryPanel();
  };

  const beginDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    activePointer = event.pointerId;
    didDrag = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    startRotationX = rotationX;
    startRotationY = rotationY;
    worldStage.classList.add('is-dragging');
    worldStage.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    if (event.pointerId !== activePointer) return;

    const shiftX = event.clientX - dragStartX;
    const shiftY = event.clientY - dragStartY;
    didDrag ||= Math.hypot(shiftX, shiftY) > 5;
    rotationY = startRotationY + shiftX * 0.42;
    rotationX = Math.max(-58, Math.min(38, startRotationX - shiftY * 0.32));
    setCubeRotation();
  };

  const endDrag = (event) => {
    if (event.pointerId !== activePointer) return;

    worldStage.releasePointerCapture?.(event.pointerId);
    activePointer = null;
    worldStage.classList.remove('is-dragging');
    window.setTimeout(() => { didDrag = false; }, 0);
  };

  worldStage.addEventListener('pointerdown', beginDrag);
  worldStage.addEventListener('pointermove', moveDrag);
  worldStage.addEventListener('pointerup', endDrag);
  worldStage.addEventListener('pointercancel', endDrag);
  worldStage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  }, { passive: false });
  worldStage.addEventListener('click', (event) => {
    if (didDrag || event.target.closest('[data-country]')) return;
    showCountry('earth');
  });

  worldCountries.forEach((country) => {
    country.addEventListener('click', () => {
      if (didDrag) return;
      showCountry(country.dataset.country);
    });
  });

  worldCountrySelects.forEach((country) => {
    country.addEventListener('click', () => showCountry(country.dataset.worldCountrySelect));
  });

  worldZoomRange?.addEventListener('input', () => setZoom(Number(worldZoomRange.value) / 100));
  worldZoomButtons.forEach((button) => {
    button.addEventListener('click', () => setZoom(zoom + (button.dataset.worldZoom === 'in' ? 0.1 : -0.1)));
  });

  worldReset?.addEventListener('click', () => {
    rotationX = defaultRotation.x;
    rotationY = defaultRotation.y;
    setZoom(defaultZoom);
    setCubeRotation();
    worldCube.focus({ preventScroll: true });
  });

  worldCube.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 18 : 8;
    const controls = {
      ArrowLeft: () => { rotationY -= step; },
      ArrowRight: () => { rotationY += step; },
      ArrowUp: () => { rotationX = Math.max(-58, rotationX - step); },
      ArrowDown: () => { rotationX = Math.min(38, rotationX + step); },
      '+': () => { setZoom(zoom + 0.1); },
      '-': () => { setZoom(zoom - 0.1); },
    };

    if (controls[event.key]) {
      event.preventDefault();
      controls[event.key]();
      setCubeRotation();
    }
  });

  setCubeRotation();
  setZoom(defaultZoom);
  showCountry('earth');
}

// Секретная миссия атласа: полёт из Европы к Луне и французский флаг.
const atlasScene = document.querySelector('.atlas-scene');
const atlasPlanet = document.querySelector('.atlas-planet');
const atlasDanger = document.querySelector('[data-atlas-danger]');
const atlasDoNotClick = document.querySelector('[data-atlas-do-not-click]');
const atlasClickCount = document.querySelector('[data-atlas-click-count]');
const atlasEarth = atlasPlanet?.querySelector('.atlas-earth');
const atlasMoonWrap = document.querySelector('.atlas-moon-wrap');
const atlasMoon = atlasMoonWrap?.querySelector('.atlas-moon');

if (atlasScene && atlasPlanet && atlasDanger && atlasDoNotClick && atlasClickCount) {
  const clickLimit = 100;
  let clicks = 0;
  let missionLaunched = false;
  let missionFinished = false;

  const updateWarning = () => {
    atlasClickCount.textContent = String(clicks);
    atlasDoNotClick.setAttribute('aria-label', `Не кликай. Нажато ${clicks} из ${clickLimit}`);

    if (clicks >= 85 && clicks < clickLimit) {
      atlasDanger.classList.add('is-critical');
      atlasDoNotClick.textContent = 'ПОСЛЕДНИЙ ОТСЧЁТ';
    } else if (clicks >= 60) {
      atlasDoNotClick.textContent = 'ТРАЕКТОРИЯ ГОТОВА?';
    }
  };

  const showCelebration = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelector('.atlas-celebration')?.remove();
    const celebration = document.createElement('div');
    celebration.className = 'atlas-celebration';
    celebration.setAttribute('aria-hidden', 'true');

    for (let index = 0; index < 34; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'atlas-celebration-piece';
      piece.textContent = index % 2 === 0 ? '🎉' : '🎊';
      piece.style.setProperty('--x', `${3 + ((index * 37) % 94)}%`);
      piece.style.setProperty('--size', `${26 + ((index * 5) % 18)}px`);
      piece.style.setProperty('--delay', `${(index % 9) * 0.09}s`);
      piece.style.setProperty('--duration', `${3.65 + ((index % 5) * 0.22)}s`);
      piece.style.setProperty('--drift', `${-88 + ((index * 43) % 177)}px`);
      piece.style.setProperty('--spin', `${360 + ((index % 6) * 90)}deg`);
      celebration.append(piece);
    }

    document.body.append(celebration);
  };

  const launchMission = () => {
    if (missionLaunched) return;
    missionLaunched = true;
    atlasDoNotClick.disabled = true;
    atlasDoNotClick.textContent = 'МИССИЯ В ПУТИ';
    atlasDanger.classList.remove('is-critical');
    atlasPlanet.classList.add('is-rocket-launch');

    const finishMission = () => {
      if (missionFinished) return;
      missionFinished = true;
      atlasScene.classList.add('has-lunar-flag');
      atlasDoNotClick.textContent = 'ФЛАГ УСТАНОВЛЕН';
      atlasDanger.classList.add('is-complete');
      showCelebration();
    };

    const rocket = atlasPlanet.querySelector('.atlas-rocket');
    rocket?.addEventListener('animationend', finishMission, { once: true });
    window.setTimeout(finishMission, 4300);
  };

  atlasDoNotClick.addEventListener('click', () => {
    if (missionLaunched) return;
    clicks += 1;
    updateWarning();
    if (clicks >= clickLimit) launchMission();
  });

  const addClickReaction = (control, animatedElement, className, animationName, onPlay, onFinish) => {
    if (!control || !animatedElement) return;

    const playReaction = () => {
      animatedElement.classList.remove(className);
      window.requestAnimationFrame(() => {
        animatedElement.classList.add(className);
        onPlay?.();
      });
    };

    control.addEventListener('click', playReaction);
    control.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      playReaction();
    });
    animatedElement.addEventListener('animationend', (event) => {
      if (event.animationName !== animationName) return;
      animatedElement.classList.remove(className);
      onFinish?.();
    });
  };

  addClickReaction(
    atlasEarth,
    atlasEarth,
    'is-clicked',
    'atlas-earth-click',
    () => {
      atlasPlanet.classList.remove('is-earth-clicked');
      window.requestAnimationFrame(() => atlasPlanet.classList.add('is-earth-clicked'));
    },
    () => atlasPlanet.classList.remove('is-earth-clicked'),
  );
  addClickReaction(atlasMoonWrap, atlasMoon, 'is-clicked', 'atlas-moon-click');
}

const backToTop = document.querySelector('#back-to-top');

if (backToTop) {
  const updateBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 650);
  };

  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const supportDialog = document.querySelector('#support-dialog');
const supportOpen = document.querySelector('#support-open');
const supportWallet = document.querySelector('#support-wallet');
const supportCloseControls = document.querySelectorAll('[data-support-close]');
const supportCurrencies = document.querySelectorAll('[data-support-currency]');
const supportAmounts = document.querySelectorAll('[data-support-amount]');
const supportCustomAmount = document.querySelector('#support-custom-amount');
const supportSummaryValue = document.querySelector('#support-summary-value');
const supportConfirm = document.querySelector('#support-confirm');
const supportResult = document.querySelector('#support-result');
const supportSheet = supportDialog?.querySelector('.support-sheet');

if (supportDialog && supportOpen && supportSummaryValue && supportConfirm && supportResult) {
  let selectedCurrency = 'RUB';
  let selectedSymbol = '₽';
  let selectedAmount = 100;

  const formattedSupportValue = () => `${selectedAmount.toLocaleString('ru-RU')} ${selectedSymbol}`;

  const updateSupportChoices = () => {
    supportCurrencies.forEach((currency) => {
      currency.setAttribute('aria-pressed', String(currency.dataset.supportCurrency === selectedCurrency));
    });
    supportAmounts.forEach((amount) => {
      const isSelected = Number(amount.dataset.supportAmount) === selectedAmount && !supportCustomAmount?.value;
      amount.setAttribute('aria-pressed', String(isSelected));
    });
    document.querySelectorAll('[data-support-symbol]').forEach((symbol) => {
      symbol.textContent = selectedSymbol;
    });
    supportSummaryValue.textContent = formattedSupportValue();
  };

  const openSupportDialog = () => {
    supportDialog.classList.add('is-open');
    supportDialog.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => supportSheet?.focus({ preventScroll: true }), 80);
  };

  const closeSupportDialog = () => {
    supportDialog.classList.remove('is-open');
    supportDialog.setAttribute('aria-hidden', 'true');
    supportOpen.focus({ preventScroll: true });
  };

  const showMoneyBurst = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelector('.support-money-burst')?.remove();
    const burst = document.createElement('div');
    burst.className = 'support-money-burst';
    burst.setAttribute('aria-hidden', 'true');
    const symbols = ['💸', '💰', '🪙', '✨'];

    for (let index = 0; index < 18; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'support-money-piece';
      piece.textContent = symbols[index % symbols.length];
      piece.style.setProperty('--money-x', `${-170 + ((index * 47) % 330)}px`);
      piece.style.setProperty('--money-y', `${75 + ((index * 29) % 200)}px`);
      piece.style.setProperty('--money-size', `${18 + ((index * 3) % 15)}px`);
      piece.style.setProperty('--money-delay', `${(index % 6) * 0.055}s`);
      piece.style.setProperty('--money-duration', `${1.55 + ((index % 4) * 0.16)}s`);
      piece.style.setProperty('--money-rotate', `${-150 + ((index * 67) % 300)}deg`);
      burst.append(piece);
    }

    document.body.append(burst);
    window.setTimeout(() => burst.remove(), 2800);
  };

  supportOpen.addEventListener('click', openSupportDialog);
  supportCloseControls.forEach((control) => control.addEventListener('click', closeSupportDialog));
  supportWallet?.addEventListener('click', openSupportDialog);

  supportCurrencies.forEach((currency) => {
    currency.addEventListener('click', () => {
      selectedCurrency = currency.dataset.supportCurrency || 'RUB';
      selectedSymbol = currency.dataset.supportSymbol || '₽';
      updateSupportChoices();
    });
  });

  supportAmounts.forEach((amount) => {
    amount.addEventListener('click', () => {
      selectedAmount = Number(amount.dataset.supportAmount) || 100;
      if (supportCustomAmount) supportCustomAmount.value = '';
      updateSupportChoices();
    });
  });

  supportCustomAmount?.addEventListener('input', () => {
    const amount = Math.floor(Number(supportCustomAmount.value));
    if (amount > 0) {
      selectedAmount = Math.min(amount, 100000);
      updateSupportChoices();
    }
  });

  supportConfirm.addEventListener('click', () => {
    supportResult.hidden = false;
    supportResult.textContent = `Выбрано: ${formattedSupportValue()}. Безопасная оплата появится после подключения платёжной ссылки.`;
    supportWallet.hidden = false;
    supportWallet.dataset.currency = selectedSymbol;
    supportWallet.setAttribute('aria-label', `Открыть поддержку: выбрано ${formattedSupportValue()}`);
    supportWallet.classList.remove('is-ready');
    window.requestAnimationFrame(() => supportWallet.classList.add('is-ready'));
    showMoneyBurst();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && supportDialog.classList.contains('is-open')) closeSupportDialog();
  });

  updateSupportChoices();
}

const revealTargets = [
  ...document.querySelectorAll('.card, .notice, .news-card, .search-card, #rules details, .minecraft-intro, .minecraft-rules details, .history-card, .world-panel, .contact'),
];

const revealVisibleTargets = () => {
  revealTargets.forEach((target) => {
    const bounds = target.getBoundingClientRect();
    if (bounds.top < window.innerHeight * 0.93 && bounds.bottom > 0) {
      target.classList.add('is-revealed');
    }
  });
};

revealTargets.forEach((target, index) => {
  target.classList.add('reveal');
  target.style.setProperty('--reveal-delay', `${Math.min((index % 5) * 55, 220)}ms`);
});

window.addEventListener('scroll', revealVisibleTargets, { passive: true });
window.addEventListener('resize', revealVisibleTargets, { passive: true });
window.requestAnimationFrame(revealVisibleTargets);
window.setTimeout(revealVisibleTargets, 180);
