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
    symbol.textContent = '67';
    element.append(symbol);
    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    element.style.fontSize = `${10 + Math.round(Math.random() * 9)}px`;
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

const backToTop = document.querySelector('#back-to-top');

if (backToTop) {
  const updateBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 650);
  };

  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const revealTargets = [
  ...document.querySelectorAll('.card, .notice, .news-card, .search-card, #rules details, .minecraft-intro, .minecraft-rules details, .history-card, .contact'),
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
