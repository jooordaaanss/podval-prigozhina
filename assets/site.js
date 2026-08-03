document.querySelectorAll('[data-copy-text]').forEach((button) => {
  const originalLabel = button.textContent;

  button.addEventListener('click', async () => {
    const text = button.dataset.copyText;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.append(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      button.textContent = 'Скопировано ✓';
      button.classList.add('copied');
    } catch {
      button.textContent = 'Не удалось скопировать';
    }

    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove('copied');
    }, 2200);
  });
});
