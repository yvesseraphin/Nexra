(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initProfile);

  function initProfile() {
    initAvatar();
    initCustomSelects();

    // Re-render avatar if user data updates (e.g. after photo upload)
    window.addEventListener('nexra:user-updated', initAvatar);
  }

  /* ── Avatar — black circle, first letter of first name ── */
  function initAvatar() {
    var state = window.NexraState;
    var user = state ? state.getCurrentUser() : null;

    var avatarEl      = document.getElementById('profile-avatar');
    var avatarImage   = document.getElementById('profile-avatar-image');
    var avatarFallback = document.getElementById('profile-avatar-fallback');

    if (!avatarEl) return;

    var avatarUrl = state ? state.getUserAvatarUrl(user) : '';

    if (avatarUrl) {
      // Has a photo — show it
      if (avatarImage) {
        avatarImage.src = avatarUrl;
        avatarImage.hidden = false;
      }
      if (avatarFallback) avatarFallback.textContent = '';
      avatarEl.classList.add('has-image');
    } else {
      // No photo — black circle with first letter of first name
      if (avatarImage) avatarImage.hidden = true;
      avatarEl.classList.remove('has-image');

      var letter = '';
      if (user && user.firstName && user.firstName.trim()) {
        letter = user.firstName.trim().charAt(0).toUpperCase();
      } else if (user && user.displayName && user.displayName.trim()) {
        letter = user.displayName.trim().charAt(0).toUpperCase();
      } else if (user && user.email) {
        letter = user.email.charAt(0).toUpperCase();
      }

      if (avatarFallback) avatarFallback.textContent = letter;
    }
  }

  /* ── Custom select dropdowns ──────────────────────────── */
  function initCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(function (wrapper) {
      var trigger = wrapper.querySelector('.custom-select-trigger');
      var menu = wrapper.querySelector('.custom-select-menu');
      var valueEl = wrapper.querySelector('.custom-select-value');
      var hiddenInput = wrapper.querySelector('input[type="hidden"]');
      var items = wrapper.querySelectorAll('.custom-select-item');
      var placeholder = valueEl ? valueEl.dataset.placeholder || 'Select' : 'Select';

      if (!trigger || !menu) return;

      // Toggle open/close on trigger click
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = wrapper.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));

        // Close all other open selects
        document.querySelectorAll('.custom-select.is-open').forEach(function (other) {
          if (other !== wrapper) {
            other.classList.remove('is-open');
            var otherTrigger = other.querySelector('.custom-select-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      });

      // Select an option
      items.forEach(function (item) {
        item.addEventListener('click', function () {
          var value = item.dataset.value;
          var label = item.querySelector('span') ? item.querySelector('span').textContent : value;

          // Update visible label
          if (valueEl) valueEl.textContent = label;

          // Update hidden input
          if (hiddenInput) hiddenInput.value = value;

          // Mark selected item
          items.forEach(function (i) { i.classList.remove('is-selected'); });
          item.classList.add('is-selected');

          // Mark wrapper as having a value (for color styling)
          wrapper.classList.add('has-value');

          // Close
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        });
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Keyboard: Escape closes
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
})();
