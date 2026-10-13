













(function () {
  'use strict';

  var _bar = null;
  var _dismissTimer = null;




  function ensureBar() {
    if (_bar) return _bar;

    _bar = document.createElement('div');
    _bar.className = 'nexra-notify-bar';
    _bar.setAttribute('role', 'status');
    _bar.setAttribute('aria-live', 'polite');
    _bar.setAttribute('aria-atomic', 'true');
    _bar.innerHTML =
      '<div class="nexra-notify-bar__body">' +
        '<span class="nexra-notify-bar__message"></span>' +
      '</div>' +
      '<button type="button" class="nexra-notify-bar__close" aria-label="Dismiss notification">' +
        '<i class="fas fa-times"></i>' +
      '</button>';


    var closeBtn = _bar.querySelector('.nexra-notify-bar__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hide);
    }


    document.body.insertBefore(_bar, document.body.firstChild);
    return _bar;
  }





  function show(message, tone) {
    clearTimeout(_dismissTimer);

    var bar = ensureBar();
    var messageEl = bar.querySelector('.nexra-notify-bar__message');


    bar.classList.remove('is-error', 'is-success');

    var resolvedTone = tone === 'error' ? 'error' : 'success';
    bar.classList.add('is-' + resolvedTone);


    var messageEl = bar.querySelector('.nexra-notify-bar__message');
    if (messageEl) {
      messageEl.textContent = message || '';
    }


    bar.setAttribute('role', resolvedTone === 'error' ? 'alert' : 'status');


    bar.classList.add('is-visible');
    document.body.classList.add('has-notify-bar');


    var delay = resolvedTone === 'error' ? 5000 : 3200;
    _dismissTimer = setTimeout(hide, delay);
  }




  function hide() {
    clearTimeout(_dismissTimer);
    if (!_bar) return;
    _bar.classList.remove('is-visible');
    document.body.classList.remove('has-notify-bar');
  }




  window.NexraNotify = {
    show: show,
    hide: hide,
  };
})();
