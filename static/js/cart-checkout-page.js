/* ============================================================
   Checkout Page — Nexra
   Handles the multi-step checkout flow on /cart/checkout/
   Steps: 1 Shipping  →  2 Payment  →  3 Confirmation
   ============================================================ */
(function () {
  'use strict';

  var state = window.NexraState;

  var _shippingData = {};
  var _selectedPaymentId = null; // saved method id, or null = new card

  document.addEventListener('DOMContentLoaded', function () {
    /* redirect away if not logged in */
    if (state && !state.isAuthenticated()) {
      state.setPostAuthRedirect('/cart/checkout/');
      window.location.href = '/accounts/login/?redirect=%2Fcart%2Fcheckout%2F';
      return;
    }

    /* redirect away if cart is empty */
    var cart = state ? state.getCart() : [];
    if (!cart.length) {
      window.location.href = '/cart/';
      return;
    }

    renderSummary();
    renderSavedMethods();
    wireStep1();
    wireStep2();
    wireCardFormatting();
  });

  /* ── Render order summary sidebar ───────────────────── */
  function renderSummary() {
    var cart = state.getCart();
    var subtotal = cart.reduce(function (s, i) {
      return s + (Number(i.priceValue) || 0) * (Number(i.quantity) || 0);
    }, 0);
    var shipping = 5000;
    var total = subtotal + shipping;

    /* items */
    var itemsEl = document.getElementById('ck-summary-items');
    if (itemsEl) {
      var html = '';
      cart.forEach(function (item) {
        html += '<div class="ck-summary-item">' +
          '<img class="ck-summary-item-img" src="' + esc(item.image || '') + '" alt="' + esc(item.title || '') + '">' +
          '<div class="ck-summary-item-body">' +
            '<p class="ck-summary-item-title">' + esc(item.title || 'Item') + '</p>' +
            '<p class="ck-summary-item-qty">Qty: ' + (item.quantity || 1) + '</p>' +
          '</div>' +
          '<span class="ck-summary-item-price">' + fmt((item.priceValue || 0) * (item.quantity || 1)) + '</span>' +
        '</div>';
      });
      itemsEl.innerHTML = html;
    }

    setText('ck-sum-subtotal', fmt(subtotal));
    setText('ck-sum-shipping', fmt(shipping));
    setText('ck-sum-total', fmt(total));
  }

  /* ── Render saved payment methods (step 2) ──────────── */
  function renderSavedMethods() {
    var methods = state ? state.getPaymentMethods() : [];
    var section = document.getElementById('ck-saved-methods-section');
    var newCardLabel = document.getElementById('ck-new-card-label');
    if (!section) return;

    if (!methods.length) {
      section.innerHTML = '';
      if (newCardLabel) newCardLabel.textContent = 'Card details';
      return;
    }

    if (newCardLabel) newCardLabel.textContent = 'Or add a new card';

    var html = '<p class="ck-section-label">Saved cards</p><div class="ck-saved-list">';
    methods.forEach(function (m, idx) {
      var isChecked = idx === 0;
      if (_selectedPaymentId === m.id) isChecked = true;
      else if (_selectedPaymentId === null && idx === 0) isChecked = true;
      html += '<label class="ck-saved-item' + (isChecked ? ' is-selected' : '') + '">' +
        '<input type="radio" name="ck-saved-payment" value="' + esc(m.id) + '"' + (isChecked ? ' checked' : '') + '>' +
        esc(m.label || m.brand) + ' &nbsp;&bull;&bull;&bull;&bull;&nbsp;' + esc(m.last4) +
        (m.isDefault ? '&nbsp;<span style="color:#b0b0b0;font-size:0.78rem">(default)</span>' : '') +
      '</label>';
    });
    html += '</div>';
    html += '<div class="ck-divider">or add new card</div>';
    section.innerHTML = html;

    /* wire radio changes */
    section.querySelectorAll('input[name="ck-saved-payment"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        _selectedPaymentId = radio.value;
        section.querySelectorAll('.ck-saved-item').forEach(function (el) {
          el.classList.remove('is-selected');
        });
        radio.closest('.ck-saved-item').classList.add('is-selected');
      });
    });

    /* set default selection */
    if (_selectedPaymentId === null && methods.length) {
      _selectedPaymentId = methods[0].id;
    }
  }

  /* ── Wire step 1 form ───────────────────────────────── */
  function wireStep1() {
    var form = document.getElementById('ck-shipping-form');
    if (!form) return;

    /* pre-fill from state if user has data */
    var user = state ? state.getCurrentUser() : null;
    if (user) {
      setVal('ck-full-name', user.firstName ? (user.firstName + ' ' + (user.lastName || '')).trim() : '');
      setVal('ck-phone', user.phone || '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var fullName = getVal('ck-full-name');
      var phone    = getVal('ck-phone');
      var addr1    = getVal('ck-address1');
      var city     = getVal('ck-city');
      var country  = getVal('ck-country');

      var ok = true;
      if (!fullName) { showError('ck-full-name', 'Required'); ok = false; }
      if (!phone)    { showError('ck-phone', 'Required'); ok = false; }
      if (!addr1)    { showError('ck-address1', 'Required'); ok = false; }
      if (!city)     { showError('ck-city', 'Required'); ok = false; }
      if (!country)  { showError('ck-country', 'Required'); ok = false; }
      if (!ok) return;

      _shippingData = {
        fullName:    fullName,
        phone:       phone,
        addressLine1: addr1,
        addressLine2: getVal('ck-address2'),
        city:        city,
        stateRegion: getVal('ck-province'),
        country:     country,
        deliveryInstructions: getVal('ck-notes'),
      };

      goToStep(2);
    });
  }

  /* ── Wire step 2 form ───────────────────────────────── */
  function wireStep2() {
    var backBtn = document.getElementById('ck-back-btn');
    if (backBtn) backBtn.addEventListener('click', function () { goToStep(1); });

    /* autofill cardholder name with logged-in user's name */
    var user = state ? state.getCurrentUser() : null;
    if (user) {
      var holderEl = document.getElementById('ck-holder');
      if (holderEl && !holderEl.value) {
        var displayName = state.getUserDisplayName(user);
        holderEl.value = displayName !== 'Guest' ? displayName : '';
      }
    }

    var form = document.getElementById('ck-payment-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var methods = state ? state.getPaymentMethods() : [];
      var checkedRadio = document.querySelector('input[name="ck-saved-payment"]:checked');
      var paymentInput = null;
      var saveCard = false;

      if (checkedRadio && methods.length) {
        /* use saved card */
        paymentInput = { id: checkedRadio.value };
      } else {
        /* new card */
        var holder  = getVal('ck-holder');
        var cardNum = getVal('ck-card-num').replace(/\s/g, '');
        var expM    = getVal('ck-expiry-m');
        var expY    = getVal('ck-expiry-y');
        var cvv     = getVal('ck-cvv');
        var saveEl  = document.getElementById('ck-save-card');
        saveCard = saveEl ? saveEl.checked : false;

        var ok = true;
        if (!holder) { showError('ck-holder', 'Required'); ok = false; }

        if (cardNum.length < 13 || !luhnCheck(cardNum)) {
          showError('ck-card-num', 'Enter a valid card number'); ok = false;
        }

        var expMNum = Number(expM);
        if (!expM || expMNum < 1 || expMNum > 12) {
          showError('ck-expiry-m', 'Enter a valid month (1–12)'); ok = false;
        }

        if (!expY || expY.replace(/\D/g, '').length < 2) {
          showError('ck-expiry-y', 'Enter a valid year'); ok = false;
        }

        /* CVV: 3 digits for most cards, 4 for Amex */
        var brand = detectBrandFromNumber(cardNum);
        var cvvLen = brand === 'American Express' ? 4 : 3;
        if (!cvv || cvv.replace(/\D/g, '').length !== cvvLen) {
          showError('ck-cvv', 'Enter a valid CVV (' + cvvLen + ' digits)'); ok = false;
        }

        if (!ok) return;

        paymentInput = {
          holderName:  holder,
          cardNumber:  cardNum,
          expiryMonth: expM,
          expiryYear:  expY,
        };
      }

      var currentUser = state.getCurrentUser();
      var checkout = {
        contact: {
          fullName: _shippingData.fullName,
          phone:    _shippingData.phone,
          email:    currentUser ? (currentUser.email || '') : '',
        },
        shippingAddress: _shippingData,
        billingAddress:  _shippingData,
        paymentMethod:   paymentInput,
        paymentSummary:  paymentInput.last4 ? paymentInput : null,
        savePaymentMethod: saveCard,
        saveAddress: true,
        notes: _shippingData.deliveryInstructions || '',
      };

      /* Use API-backed order creation */
      var placeBtn = document.getElementById('ck-place-btn');
      if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Placing order…'; }

      state.createOrderFromCheckoutApi(checkout).then(function(order) {
        if (!order) {
          if (window.NexraNotify) window.NexraNotify.show('Could not place order. Please try again.', 'error');
          if (placeBtn) { placeBtn.disabled = false; placeBtn.innerHTML = 'Place order <i class="bx bx-check"></i>'; }
          return;
        }
        window.dispatchEvent(new CustomEvent('nexra:cart-updated'));
        window.dispatchEvent(new CustomEvent('nexra:user-updated'));
        goToStep(3, order);
      });
    });
  }

  /* ── Card number formatting + brand detection ────────── */
  function wireCardFormatting() {
    var cardInput  = document.getElementById('ck-card-num');
    var brandBadge = document.getElementById('ck-card-brand');
    if (!cardInput) return;

    cardInput.addEventListener('input', function () {
      var raw = cardInput.value.replace(/\D/g, '').slice(0, 16);
      cardInput.value = raw.replace(/(.{4})/g, '$1 ').trim();

      if (brandBadge) {
        var brand = detectBrandFromNumber(raw);
        if (brand && brand !== 'Card' && raw.length >= 4) {
          brandBadge.textContent = brand;
          brandBadge.classList.add('is-visible');
        } else {
          brandBadge.textContent = '';
          brandBadge.classList.remove('is-visible');
        }
      }
    });
  }

  /* ── Luhn algorithm ─────────────────────────────────── */
  function luhnCheck(num) {
    var digits = String(num).replace(/\D/g, '');
    if (!digits.length) return false;
    var sum = 0;
    var shouldDouble = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /* ── Detect card brand from number ──────────────────── */
  function detectBrandFromNumber(num) {
    var n = String(num || '').replace(/\D/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'American Express';
    if (/^6(011|5|4[4-9])/.test(n)) return 'Discover';
    return 'Card';
  }

  /* ── Step navigation ────────────────────────────────── */
  function goToStep(n, order) {
    /* hide all panels */
    document.querySelectorAll('.ck-panel').forEach(function (p) {
      p.classList.remove('is-active');
    });

    /* show target */
    var target = document.getElementById('ck-panel-' + n);
    if (target) target.classList.add('is-active');

    /* update step indicator */
    document.querySelectorAll('.ck-step-item').forEach(function (el) {
      var s = Number(el.dataset.step);
      el.classList.remove('is-active', 'is-done');
      if (s === n) el.classList.add('is-active');
      else if (s < n) el.classList.add('is-done');
    });

    /* update step lines */
    document.querySelectorAll('.ck-step-line').forEach(function (line, idx) {
      /* line 0 is between step 1 and 2, line 1 between 2 and 3 */
      if (idx + 1 < n) line.classList.add('is-done');
      else line.classList.remove('is-done');
    });

    /* scroll to top of form area */
    var formCol = document.querySelector('.checkout-form-col');
    if (formCol) formCol.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* hide summary on confirmation */
    var summaryCol = document.getElementById('ck-summary-col');
    if (n === 3) {
      if (summaryCol) summaryCol.style.display = 'none';
      if (order) {
        var numEl = document.getElementById('ck-order-num');
        if (numEl) numEl.textContent = order.orderNumber || order.id;
      }
    } else {
      if (summaryCol) summaryCol.style.display = '';
    }

    /* re-render saved methods when entering step 2 */
    if (n === 2) {
      renderSavedMethods();
      /* autofill cardholder name */
      var user = state ? state.getCurrentUser() : null;
      if (user) {
        var holderEl = document.getElementById('ck-holder');
        if (holderEl && !holderEl.value) {
          var displayName = state.getUserDisplayName(user);
          holderEl.value = displayName !== 'Guest' ? displayName : '';
        }
      }
      wireCardFormatting();
    }
  }

  /* ── Helpers ────────────────────────────────────────── */
  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showError(id, message) {
    var input = document.getElementById(id);
    if (input) input.classList.add('is-invalid');
    var errEl = document.getElementById(id + '-err');
    if (errEl) errEl.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll('.is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.ck-error').forEach(function (el) {
      el.textContent = '';
    });
  }

  function fmt(value) {
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
})();
