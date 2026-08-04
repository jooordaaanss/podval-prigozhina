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

const applicationForm = document.querySelector('#application-form');
const applicationStatus = document.querySelector('#application-status');

if (applicationForm && applicationStatus) {
  applicationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const application = [
      '📝 ЗАЯВКА — ПОДВАЛ ПРИГОЖИНА',
      '',
      `Тип заявки: ${document.querySelector('#application-type').value}`,
      `Никнейм: ${document.querySelector('#application-name').value.trim()}`,
      `Страна / фракция: ${document.querySelector('#application-project').value.trim()}`,
      '',
      'Идея или опыт:',
      document.querySelector('#application-message').value.trim(),
    ].join('\n');

    applicationStatus.className = 'application-status';
    applicationStatus.textContent = 'Копируем анкету…';
    copyText(
      application,
      () => {
        applicationStatus.className = 'application-status success';
        applicationStatus.textContent = 'Анкета скопирована. Откройте Discord и отправьте её в 📝・заявки или руководству.';
      },
      () => {
        applicationStatus.className = 'application-status error';
        applicationStatus.textContent = 'Не удалось скопировать анкету. Попробуйте ещё раз или перепишите текст вручную.';
      },
    );
  });
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
  ...document.querySelectorAll('.card, .notice, .news-card, .search-card, .application-shell, #rules details, .minecraft-intro, .minecraft-rules details, .history-card, .contact'),
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
