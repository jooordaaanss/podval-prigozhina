document.querySelectorAll('[data-copy-text]').forEach((button) => {
  const originalLabel = button.textContent;
  const resetLabel = () => {
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove('copied');
    }, 2200);
  };

  const showCopied = () => {
    button.textContent = 'Скопировано ✓';
    button.classList.add('copied');
    resetLabel();
  };

  const failed = () => {
    button.textContent = 'Не удалось скопировать';
    resetLabel();
  };

  button.addEventListener('click', () => {
    const text = button.dataset.copyText;

    try {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.append(helper);
      helper.select();
      const wasCopied = document.execCommand('copy');
      helper.remove();

      if (wasCopied) {
        showCopied();
        return;
      }

      if (navigator.clipboard?.writeText) {
        button.textContent = 'Копируем…';
        navigator.clipboard.writeText(text).then(showCopied).catch(failed);
        return;
      }

      failed();
    } catch {
      failed();
    }
  });
});
