/**
 * NexraNotify — global notification bar
 *
 * Usage:
 *   NexraNotify.show('Message here', 'success');   // green icon, black bar
 *   NexraNotify.show('Something went wrong', 'error');
 *   NexraNotify.hide();
 *
 * The bar slides down from the very top of the page and auto-dismisses
 * after a few seconds.  A close button is always available.
 *
 * The module also exposes a simple hook for account-auth.js so the toast
 * system on auth pages can route through the same bar.
 */
(function () {
  'use strict';

  var _bar = null;
  var _dismissTimer = null;

  /* ---------------------------------------------------------------
     Build or retrieve the singleton bar element
  --------------------------------------------------------------- */
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

    // Close on button click
    var closeBtn = _bar.querySelector('.nexra-notify-bar__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hide);
    }

    // Insert as the very first child of <body>
    document.body.insertBefore(_bar, document.body.firstChild);
    return _bar;
  }

  /* ---------------------------------------------------------------
     show(message, tone)
     tone: 'success' | 'error'
  --------------------------------------------------------------- */
  function show(message, tone) {
    clearTimeout(_dismissTimer);

    var bar = ensureBar();
    var messageEl = bar.querySelector('.nexra-notify-bar__message');

    // Reset tone classes
    bar.classList.remove('is-error', 'is-success');

    var resolvedTone = tone === 'error' ? 'error' : 'success';
    bar.classList.add('is-' + resolvedTone);

    // Message (safe text assignment to avoid XSS)
    var messageEl = bar.querySelector('.nexra-notify-bar__message');
    if (messageEl) {
      messageEl.textContent = message || '';
    }

    // Update ARIA role for errors so screen readers interrupt
    bar.setAttribute('role', resolvedTone === 'error' ? 'alert' : 'status');

    // Make visible & push page content down
    bar.classList.add('is-visible');
    document.body.classList.add('has-notify-bar');

    // Auto-dismiss
    var delay = resolvedTone === 'error' ? 5000 : 3200;
    _dismissTimer = setTimeout(hide, delay);
  }

  /* ---------------------------------------------------------------
     hide()
  --------------------------------------------------------------- */
  function hide() {
    clearTimeout(_dismissTimer);
    if (!_bar) return;
    _bar.classList.remove('is-visible');
    document.body.classList.remove('has-notify-bar');
  }

  /* ---------------------------------------------------------------
     Public API
  --------------------------------------------------------------- */
  window.NexraNotify = {
    show: show,
    hide: hide,
  };
})();
