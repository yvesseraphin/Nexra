(function () {
  'use strict';

  var state = window.NexraState;

  document.addEventListener('DOMContentLoaded', initProfile);

  function initProfile() {
    initTabSwitcher();
    initAvatar();
    initProfileForm();
    initLogout();
    initCustomSelects();
    renderCartPanel();
    renderOrdersPanel();
    renderPaymentsPanel();
    updateBadges();

    // Keep panels fresh if cart changes in another tab
    window.addEventListener('nexra:cart-updated', function () {
      renderCartPanel();
      updateBadges();
    });
    window.addEventListener('nexra:user-updated', function () {
      initAvatar();
      renderOrdersPanel();
      renderPaymentsPanel();
      updateBadges();
    });
  }

  /* ── Tab switcher ─────────────────────────────────────── */
  function initTabSwitcher() {
    var navLinks = document.querySelectorAll('.account-nav-link[data-account-tab]');
    var panels   = document.querySelectorAll('.account-panel[data-account-panel]');

    navLinks.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.accountTab;

        navLinks.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        panels.forEach(function (panel) {
          panel.hidden = panel.dataset.accountPanel !== target;
        });
      });
    });
  }

  /* ── Badges ───────────────────────────────────────────── */
  function updateBadges() {
    var cartCount    = state ? state.getCartCount() : 0;
    var orders       = state ? state.getOrders() : [];
    var payments     = state ? state.getPaymentMethods() : [];

    setText('account-cart-count',    cartCount);
    setText('account-order-count',   orders.length);
    setText('account-payment-count', payments.length);
  }

  /* ── Cart panel — same UI as /cart/ page ─────────────── */
  function renderCartPanel() {
    var container = document.getElementById('profile-cart');
    if (!container) return;

    var cart     = state ? state.getCart() : [];
    var count    = cart.reduce(function (s, i) { return s + (i.quantity || 0); }, 0);
    var subtotal = cart.reduce(function (s, i) { return s + (Number(i.priceValue) || 0) * (Number(i.quantity) || 0); }, 0);
    var shipping = subtotal > 0 ? 5000 : 0;
    var total    = subtotal + shipping;

    /* ── layout ── */
    var html = '<div class="pc-layout">';

    /* ── left: items ── */
    html += '<div class="pc-items-col">';

    if (!cart.length) {
      /* empty state — same circle + label as cart page */
      html += '<div class="cart-empty">' +
        '<div class="cart-empty-icon"><i class="bx bx-shopping-bag"></i></div>' +
        '<p class="cart-empty-label">Cart is Empty</p>' +
      '</div>';
    } else {
      /* item rows */
      html += '<div class="cart-items-list" id="pc-items-list">';
      cart.forEach(function (item) {
        var lineTotal = formatRWF((item.priceValue || 0) * (item.quantity || 1));
        html += '<div class="cart-item" data-item-id="' + esc(item.id) + '">' +
          '<img class="cart-item-img" src="' + esc(item.image || '') + '" alt="' + esc(item.title || '') + '">' +
          '<div class="cart-item-body">' +
            '<div class="cart-item-top">' +
              '<p class="cart-item-title">' + esc(item.title || 'Item') + '</p>' +
              '<button type="button" class="cart-item-remove pc-remove" data-id="' + esc(item.id) + '" aria-label="Remove">' +
                '<i class="bx bx-x"></i>' +
              '</button>' +
            '</div>' +
            '<div class="cart-item-meta">' +
              '<div class="cart-item-qty-row">' +
                '<button type="button" class="qty-btn pc-dec" data-id="' + esc(item.id) + '" aria-label="Decrease">−</button>' +
                '<span class="qty-value">' + (item.quantity || 1) + '</span>' +
                '<button type="button" class="qty-btn pc-inc" data-id="' + esc(item.id) + '" aria-label="Increase">+</button>' +
                '<span class="cart-item-unit-price">' + esc(item.price || formatRWF(item.priceValue || 0)) + '</span>' +
              '</div>' +
              '<span class="cart-item-line-total">' + lineTotal + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      });
      html += '</div>'; /* cart-items-list */

      /* total + checkout */
      html += '<div class="cart-actions">' +
        '<div class="cart-total-row">' +
          '<span>TOTAL</span>' +
          '<span class="cart-total-value">' + formatRWF(total) + '</span>' +
        '</div>' +
        '<button type="button" class="btn-checkout pc-checkout">Checkout</button>' +
      '</div>';
    }

    html += '</div>'; /* pc-items-col */

    /* ── right: summary card — same as cart page ── */
    html += '<aside class="pc-summary-col">' +
      '<div class="cart-summary-card">' +
        '<div class="summary-line"><span>Subtotal</span><span>' + formatRWF(subtotal) + '</span></div>' +
        '<div class="summary-line"><span>Discount</span><span>' + formatRWF(0) + '</span></div>' +
        '<div class="summary-line"><span>Shipping Costs</span><span>' + formatRWF(shipping) + '</span></div>' +
        '<div class="coupon-row">' +
          '<input type="text" class="coupon-input pc-coupon-input" placeholder="Coupon code">' +
          '<button type="button" class="btn-coupon pc-apply-coupon">Apply Coupon</button>' +
        '</div>' +
        '<div class="secure-payments">' +
          '<p class="secure-label">SECURE PAYMENTS PROVIDED BY</p>' +
          '<div class="payment-logos">' +
            '<svg width="38" height="24" viewBox="0 0 38 24" fill="none" aria-label="Mastercard"><rect width="38" height="24" rx="4" fill="#f5f5f5"/><circle cx="15" cy="12" r="7" fill="#EB001B"/><circle cx="23" cy="12" r="7" fill="#F79E1B"/><path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/></svg>' +
            '<svg width="38" height="24" viewBox="0 0 38 24" fill="none" aria-label="Visa"><rect width="38" height="24" rx="4" fill="#f5f5f5"/><text x="6" y="17" font-family="Arial" font-size="11" font-weight="bold" fill="#1A1F71">VISA</text></svg>' +
            '<div class="payment-logo-pill">MoMo</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</aside>';

    html += '</div>'; /* pc-layout */
    container.innerHTML = html;

    /* wire buttons */
    container.querySelectorAll('.pc-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state) state.removeFromCart(btn.dataset.id);
        renderCartPanel(); updateBadges();
      });
    });

    container.querySelectorAll('.pc-dec').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.dataset.id;
        var cart = state ? state.getCart() : [];
        var item = cart.find(function (i) { return i.id === id; });
        if (!item) return;
        if (item.quantity <= 1) state.removeFromCart(id);
        else state.updateCartQuantity(id, item.quantity - 1);
        renderCartPanel(); updateBadges();
      });
    });

    container.querySelectorAll('.pc-inc').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.dataset.id;
        var cart = state ? state.getCart() : [];
        var item = cart.find(function (i) { return i.id === id; });
        if (!item) return;
        state.updateCartQuantity(id, item.quantity + 1);
        renderCartPanel(); updateBadges();
      });
    });

    var applyBtn = container.querySelector('.pc-apply-coupon');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        var input = container.querySelector('.pc-coupon-input');
        var code  = input ? input.value.trim() : '';
        if (!code) return;
        if (window.NexraNotify) window.NexraNotify.show('Coupon "' + code + '" is not valid or has expired.', 'error');
      });
    }

    var checkoutBtn = container.querySelector('.pc-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        if (window.NexraNotify) window.NexraNotify.show('Checkout coming soon!', 'success');
      });
    }
  }

  /* ── Orders panel ─────────────────────────────────────── */
  function renderOrdersPanel() {
    var container = document.getElementById('profile-orders');
    if (!container) return;

    var orders = state ? state.getOrders() : [];

    if (!orders.length) {
      container.innerHTML = emptyPanel(
        'bx bx-package',
        'No orders yet',
        'Once you place an order, it will appear here with full details.'
      );
      return;
    }

    var html = '<div class="orders-list">';
    orders.forEach(function (order) {
      var date = order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }) : '';

      html += '<div class="order-card">' +
        '<div class="order-top">' +
          '<div>' +
            '<h3>' + esc(order.orderNumber || order.id || 'Order') + '</h3>' +
            '<p>' + date + '</p>' +
          '</div>' +
          '<span class="order-meta">' + esc(order.status || 'Confirmed') + '</span>' +
        '</div>';

      if (order.items && order.items.length) {
        html += '<div class="order-items">';
        order.items.forEach(function (item) {
          html += '<div class="order-item-row">' +
            '<span>' + esc(item.title || 'Item') + ' &times; ' + (item.quantity || 1) + '</span>' +
            '<span>' + formatRWF((item.priceValue || 0) * (item.quantity || 1)) + '</span>' +
          '</div>';
        });
        html += '</div>';
      }

      html += '<div class="order-total-row">' +
        '<span>Total</span>' +
        '<strong>' + formatRWF(order.total || 0) + '</strong>' +
      '</div>';

      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  /* ── Payments panel ───────────────────────────────────── */
  function renderPaymentsPanel() {
    var container = document.getElementById('profile-payments');
    if (!container) return;

    var methods = state ? state.getPaymentMethods() : [];

    if (!methods.length) {
      container.innerHTML = emptyPanel(
        'bx bx-credit-card',
        'No payment methods saved',
        'Payment methods you use at checkout will be saved here.'
      );
      return;
    }

    var html = '<div class="payment-methods-list">';
    methods.forEach(function (method) {
      html += '<div class="payment-method-card">' +
        '<div class="payment-method-copy">' +
          '<div class="payment-method-head">' +
            '<h3>' + esc(method.label || method.brand || 'Card') + '</h3>' +
            (method.isDefault ? '<span class="payment-pill">Default</span>' : '') +
          '</div>' +
          '<p>Expires ' + esc(method.expiryLabel || '') + ' &nbsp;&bull;&nbsp; ' + esc(method.holderName || '') + '</p>' +
        '</div>' +
        '<div class="payment-method-actions">' +
          (!method.isDefault
            ? '<button type="button" class="outline-pill payment-action-btn" data-action="default" data-id="' + esc(method.id) + '">Set default</button>'
            : '') +
          '<button type="button" class="outline-pill payment-action-btn" data-action="remove" data-id="' + esc(method.id) + '">Remove</button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.payment-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id  = btn.dataset.id;
        var act = btn.dataset.action;
        if (act === 'remove') state.removePaymentMethod(id);
        else if (act === 'default') state.setDefaultPaymentMethod(id);
        renderPaymentsPanel();
        updateBadges();
      });
    });
  }

  /* ── Profile form — load user data & save ─────────────── */
  function initProfileForm() {
    var user = state ? state.getCurrentUser() : null;
    if (!user) return;

    setVal('profile-first-name', user.firstName || '');
    setVal('profile-last-name',  user.lastName  || '');
    setVal('profile-email',      user.email     || '');
    setVal('profile-phone',      user.phone     || '');

    var nameEl   = document.getElementById('profile-name');
    var detailEl = document.getElementById('profile-detail');
    if (nameEl)   nameEl.textContent   = state.getUserDisplayName(user);
    if (detailEl) detailEl.textContent = user.email || user.phone || '';

    var form = document.getElementById('profile-details-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('profile-form-status');

      var payload = {
        firstName: getVal('profile-first-name'),
        lastName:  getVal('profile-last-name'),
        email:     getVal('profile-email'),
      };

      fetch('/api/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          if (status) { status.textContent = data.error; status.className = 'form-status is-error'; }
          return;
        }
        if (data.user && state) state.setCurrentUser(data.user);
        if (status) { status.textContent = data.message || 'Saved.'; status.className = 'form-status is-success'; }
        if (window.NexraNotify) window.NexraNotify.show(data.message || 'Profile details saved.', 'success');
      })
      .catch(function () {
        if (status) { status.textContent = 'Could not save. Try again.'; status.className = 'form-status is-error'; }
      });
    });
  }

  /* ── Logout ───────────────────────────────────────────── */
  function initLogout() {
    var btn = document.getElementById('logout-button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (state) state.clearSession();
      window.location.href = '/';
    });
  }

  /* ── Avatar ───────────────────────────────────────────── */
  function initAvatar() {
    var user       = state ? state.getCurrentUser() : null;
    var avatarEl   = document.getElementById('profile-avatar');
    var avatarImg  = document.getElementById('profile-avatar-image');
    var avatarFb   = document.getElementById('profile-avatar-fallback');

    if (!avatarEl) return;

    var avatarUrl = state ? state.getUserAvatarUrl(user) : '';

    if (avatarUrl) {
      if (avatarImg) { avatarImg.src = avatarUrl; avatarImg.hidden = false; }
      if (avatarFb)  avatarFb.textContent = '';
      avatarEl.classList.add('has-image');
    } else {
      if (avatarImg) avatarImg.hidden = true;
      avatarEl.classList.remove('has-image');
      var letter = '';
      if (user && user.firstName && user.firstName.trim())   letter = user.firstName.trim().charAt(0).toUpperCase();
      else if (user && user.displayName)                     letter = user.displayName.trim().charAt(0).toUpperCase();
      else if (user && user.email)                           letter = user.email.charAt(0).toUpperCase();
      if (avatarFb) avatarFb.textContent = letter;
    }
  }

  /* ── Custom select dropdowns ──────────────────────────── */
  function initCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(function (wrapper) {
      var trigger    = wrapper.querySelector('.custom-select-trigger');
      var menu       = wrapper.querySelector('.custom-select-menu');
      var valueEl    = wrapper.querySelector('.custom-select-value');
      var hiddenInput = wrapper.querySelector('input[type="hidden"]');
      var items      = wrapper.querySelectorAll('.custom-select-item');

      if (!trigger || !menu) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = wrapper.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
        document.querySelectorAll('.custom-select.is-open').forEach(function (other) {
          if (other !== wrapper) {
            other.classList.remove('is-open');
            var t = other.querySelector('.custom-select-trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
      });

      items.forEach(function (item) {
        item.addEventListener('click', function () {
          var value = item.dataset.value;
          var label = item.querySelector('span') ? item.querySelector('span').textContent : value;
          if (valueEl)     valueEl.textContent = label;
          if (hiddenInput) hiddenInput.value   = value;
          items.forEach(function (i) { i.classList.remove('is-selected'); });
          item.classList.add('is-selected');
          wrapper.classList.add('has-value');
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ── Helpers ──────────────────────────────────────────── */
  function emptyPanel(icon, heading, body) {
    return '<div class="empty-panel">' +
      '<i class="' + icon + '"></i>' +
      '<div><h3>' + heading + '</h3><p>' + body + '</p></div>' +
    '</div>';
  }

  function formatRWF(value) {
    return Math.round(Number(value) || 0).toLocaleString('en-US') + ' RWF';
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
})();
