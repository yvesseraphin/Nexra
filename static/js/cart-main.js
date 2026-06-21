(function () {
  'use strict';

  var state = window.NexraState;

  document.addEventListener('DOMContentLoaded', function () {
    renderCart();

    // Re-render whenever cart changes from any tab
    window.addEventListener('nexra:cart-updated', renderCart);

    // Coupon button (UI only for now)
    var btnCoupon = document.getElementById('btn-coupon');
    if (btnCoupon) {
      btnCoupon.addEventListener('click', applyCoupon);
    }

    // Checkout button
    var btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
      btnCheckout.addEventListener('click', handleCheckout);
    }
  });

  /* ── Render ──────────────────────────────────────────── */
  function renderCart() {
    var cart = state ? state.getCart() : [];
    var countBadge   = document.getElementById('cart-count-badge');
    var emptyEl      = document.getElementById('cart-empty');
    var listEl       = document.getElementById('cart-items-list');
    var actionsEl    = document.getElementById('cart-actions');
    var subtotalEl   = document.getElementById('summary-subtotal');
    var shippingEl   = document.getElementById('summary-shipping');
    var totalValEl   = document.getElementById('cart-total-value');

    var count = cart.reduce(function (s, i) { return s + (i.quantity || 0); }, 0);
    var subtotal = cart.reduce(function (s, i) {
      return s + (Number(i.priceValue) || 0) * (Number(i.quantity) || 0);
    }, 0);
    var shipping = subtotal > 0 ? 5000 : 0;
    var total = subtotal + shipping;

    // Badge
    if (countBadge) countBadge.textContent = '(' + count + ')';

    // Summary panel
    if (subtotalEl) subtotalEl.textContent = formatRWF(subtotal);
    var discountEl = document.getElementById('summary-discount');
    if (discountEl) discountEl.textContent = formatRWF(0);
    if (shippingEl) shippingEl.textContent = formatRWF(shipping);
    if (totalValEl) totalValEl.textContent = formatRWF(total);

    if (cart.length === 0) {
      show(emptyEl);
      hide(listEl);
      hide(actionsEl);
      return;
    }

    hide(emptyEl);
    show(listEl);
    show(actionsEl);

    // Build item rows
    if (listEl) {
      listEl.innerHTML = '';
      cart.forEach(function (item) {
        listEl.appendChild(buildItemRow(item));
      });
    }
  }

  /* ── Build one item row from template ──────────────── */
  function buildItemRow(item) {
    var tpl = document.getElementById('cart-item-tpl');
    var clone = tpl.content.cloneNode(true);
    var row = clone.querySelector('.cart-item');

    row.dataset.itemId = item.id;

    var img = row.querySelector('.cart-item-img');
    if (img) {
      img.src = item.image || '';
      img.alt = item.title || '';
    }

    var title = row.querySelector('.cart-item-title');
    if (title) title.textContent = item.title || 'Item';

    var qty = row.querySelector('.qty-value');
    if (qty) qty.textContent = item.quantity;

    var unitPrice = row.querySelector('.cart-item-unit-price');
    if (unitPrice) unitPrice.textContent = formatRWF(item.priceValue || 0);

    var lineTotal = row.querySelector('.cart-item-line-total');
    if (lineTotal) {
      lineTotal.textContent = formatRWF((item.priceValue || 0) * (item.quantity || 1));
    }

    // Remove
    var removeBtn = row.querySelector('.cart-item-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        if (state) state.removeFromCart(item.id);
      });
    }

    // Decrease qty
    var decBtn = row.querySelector('.qty-dec');
    if (decBtn) {
      decBtn.addEventListener('click', function () {
        var current = Number(qty ? qty.textContent : 1);
        if (current <= 1) {
          if (state) state.removeFromCart(item.id);
        } else {
          if (state) state.updateCartQuantity(item.id, current - 1);
        }
      });
    }

    // Increase qty
    var incBtn = row.querySelector('.qty-inc');
    if (incBtn) {
      incBtn.addEventListener('click', function () {
        var current = Number(qty ? qty.textContent : 1);
        if (state) state.updateCartQuantity(item.id, current + 1);
      });
    }

    return clone;
  }

  /* ── Coupon ─────────────────────────────────────────── */
  function applyCoupon() {
    var input = document.getElementById('coupon-input');
    var code = input ? input.value.trim() : '';
    if (!code) return;

    var cart = state ? state.getCart() : [];
    var subtotal = cart.reduce(function (s, i) {
      return s + (Number(i.priceValue) || 0) * (Number(i.quantity) || 0);
    }, 0);

    fetch('/cart/api/coupon/apply/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken(),
      },
      body: JSON.stringify({ code: code, subtotal: subtotal }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          if (window.NexraNotify) window.NexraNotify.show(data.error, 'error');
          return;
        }
        var coupon = data.coupon;
        var discountEl = document.getElementById('summary-discount');
        var shippingEl = document.getElementById('summary-shipping');
        var totalValEl = document.getElementById('cart-total-value');
        var discount = coupon.discountAmount || 0;
        var shipping = subtotal > 0 ? 5000 : 0;
        var total = Math.max(0, subtotal + shipping - discount);
        if (discountEl) discountEl.textContent = formatRWF(discount);
        if (shippingEl) shippingEl.textContent = formatRWF(shipping);
        if (totalValEl) totalValEl.textContent = formatRWF(total);
        if (window.NexraNotify) window.NexraNotify.show('Coupon applied! You saved ' + formatRWF(discount) + '.', 'success');
      })
      .catch(function () {
        if (window.NexraNotify) window.NexraNotify.show('Could not apply coupon. Please try again.', 'error');
      });
  }

  function getCsrfToken() {
    var cookie = document.cookie.split(';').find(function (c) { return c.trim().startsWith('csrftoken='); });
    return cookie ? cookie.trim().split('=')[1] : '';
  }

  /* ── Checkout ───────────────────────────────────────── */
  function handleCheckout() {
    if (!state) return;
    if (!state.isAuthenticated()) {
      state.setPostAuthRedirect('/cart/checkout/');
      window.location.href = '/accounts/login/?redirect=%2Fcart%2Fcheckout%2F';
      return;
    }
    var cart = state.getCart();
    if (!cart.length) return;
    window.location.href = '/cart/checkout/';
  }

  /* ── Helpers ────────────────────────────────────────── */
  function formatRWF(value) {
    var n = Math.round(Number(value) || 0);
    return n.toLocaleString('en-US') + ' RWF';
  }

  function show(el) {
    if (el) el.hidden = false;
  }

  function hide(el) {
    if (el) el.hidden = true;
  }
})();
