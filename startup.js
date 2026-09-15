(function () {
  function show(code) {
    if (document.getElementById('startup-error')) return;
    var panel = document.createElement('div');
    panel.id = 'startup-error';
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'position:fixed;z-index:10000;bottom:16px;left:16px;right:16px;padding:20px;background:#241e19;color:#f5e1c4;border:1px solid #b38c58;font:16px sans-serif';
    var text = document.createElement('p');
    text.textContent = 'Не удалось запустить игру. Код: ' + code + '. Повтори загрузку.';
    var button = document.createElement('button');
    button.textContent = 'Повторить';
    button.onclick = function () { location.reload(); };
    panel.appendChild(text); panel.appendChild(button);
    (document.body || document.documentElement).appendChild(panel);
  }
  window.obitelStartupFailure = show;
  window.addEventListener('error', function (event) {
    if (!window.__obitelGameReady && ((event.target && event.target.tagName === 'SCRIPT') || event.error)) show('SCRIPT_LOAD');
  }, true);
  setTimeout(function () { if (!window.__obitelGameReady) show('START_TIMEOUT'); }, 20000);
}());
