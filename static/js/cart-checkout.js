/* ============================================================
   Checkout Modal — Nexra
   Handles the full checkout flow from cart to order confirmation.
   Steps: 1 Shipping  →  2 Payment  →  3 Confirmation
   Works on /cart/ page and the profile cart panel.
   ============================================================ */
(function () {
  'use strict';

  var state = window.NexraState;

  /* ── Public entry point — called by checkout buttons ─── */
  window.NexraCheckout = {
    open: openCheckout,
  };

  /* ── State ──────────────────────────────────────────── */
  var _overlay = null;
  var _currentStep = 1;
  var _shippingData = {};
  var _paymentData = {};
  var _selectedPaymentId = null; // id of a saved method, or null = new card

  /* ── Open ───────────────────────────────────────────── */
  function openCheckout() {
    if (!state) return;

    if (!state.isAuthenticated()) {
      state.setPostAuthRedirect('/cart/');
      window.location.href = '/accounts/login/?redirect=%2Fcart%2F';
      return;
    }

    var cart = state.getCart();
    if (!cart.length) {
      if (window.NexraNotify) window.NexraNotify.show('Your cart is empty.', 'error');
      return;
    }

    _currentStep = 1;
    _shippingData = {};
    _paymentData = {};
    _selectedPaymentId = null;

    renderOverlay();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (_overlay) _overlay.classList.add('is-open');
      });
    });
  }

  /* ── Close ──────────────────────────────────────────── */
  function closeCheckout() {
    if (!_overlay) return;
    _overlay.classList.remove('is-open');
    _overlay.addEventListener('transitionend', function onEnd() {
      _overlay.removeEventListener('transitionend', onEnd);
      if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    });
  }

  /* ── Render overlay + sheet ─────────────────────────── */
  function renderOverlay() {
    if (_overlay && _overlay.parentNode) _overlay.parentNode.removeChild(_overlay);

    _overlay = document.createElement('div');
    _overlay.className = 'co-overlay';
    _overlay.setAttribute('role', 'dialog');
    _overlay.setAttribute('aria-modal', 'true');
    _overlay.setAttribute('aria-label', 'Checkout');

    var sheet = document.createElement('div');
    sheet.className = 'co-sheet';
    sheet.innerHTML = buildSheetHTML();
    _overlay.appendChild(sheet);
    document.body.appendChild(_overlay);

    // Close on backdrop click
    _overlay.addEventListener('click', function (e) {
      if (e.target === _overlay) closeCheckout();
    });

    wireStep();
  }

  /* ── Build full sheet HTML ──────────────────────────── */
  function buildSheetHTML() {
    var cart     = state.getCart();
    var subtotal = cart.reduce(function (s, i) { return s + (Number(i.priceValue) || 0) * (Number(i.quantity) || 0); }, 0);
    var shipping = 5000;
    var total    = subtotal + shipping;

    var titles = ['', 'Shipping details', 'Payment', 'Order confirmed'];

    return '<div class="co-handle"></div>' +
      '<div class="co-header">' +
        '<h2 class="co-title" id="co-title">' + esc(titles[_currentStep]) + '</h2>' +
        '<button type="button" class="co-close" id="co-close-btn" aria-label="Close checkout">' +
          '<i class="bx bx-x"></i>' +
        '</button>' +
      '</div>' +
      buildStepDots() +

      /* ── Step 1: Shipping ── */
      '<div class="co-step' + (_currentStep === 1 ? ' is-active' : '') + '" id="co-step-1">' +
        buildShippingStep() +
        buildSummaryBox(subtotal, shipping, total) +
        '<div class="co-footer">' +
          '<button type="button" class="co-btn-primary" id="co-next-1">Continue to payment</button>' +
        '</div>' +
      '</div>' +

      /* ── Step 2: Payment ── */
      '<div class="co-step' + (_currentStep === 2 ? ' is-active' : '') + '" id="co-step-2">' +
        buildPaymentStep() +
        buildSummaryBox(subtotal, shipping, total) +
        '<div class="co-footer">' +
          '<button type="button" class="co-btn-secondary" id="co-back-2">Back</button>' +
          '<button type="button" class="co-btn-primary" id="co-place-order">Place order</button>' +
        '</div>' +
      '</div>' +

      /* ── Step 3: Confirmation ── */
      '<div class="co-step' + (_currentStep === 3 ? ' is-active' : '') + '" id="co-step-3">' +
        buildConfirmStep() +
      '</div>';
  }

  /* ── Step dots ──────────────────────────────────────── */
  function buildStepDots() {
    if (_currentStep === 3) return '';
    var html = '<div class="co-steps">';
    for (var i = 1; i <= 2; i++) {
      var cls = 'co-step-dot';
      if (i === _currentStep) cls += ' is-active';
      else if (i < _currentStep) cls += ' is-done';
      html += '<div class="' + cls + '"></div>';
    }
    html += '</div>';
    return html;
  }

  /* ── Shipping step ──────────────────────────────────── */
  function buildShippingStep() {
    var d = _shippingData;
    return '<p class="co-section-label">Delivery address</p>' +
      '<div class="co-grid">' +
        field('co-full-name', 'Full name', 'text', d.fullName || '', 'given-name') +
        field('co-phone', 'Phone number', 'tel', d.phone || '', 'tel') +
      '</div>' +
      '<div class="co-grid co-full" style="margin-top:1rem">' +
        field('co-address1', 'Address line 1', 'text', d.addressLine1 || '', 'address-line1') +
        field('co-address2', 'Address line 2 (optional)', 'text', d.addressLine2 || '', 'address-line2') +
        field('co-city', 'City / District', 'text', d.city || '', 'address-level2') +
      '</div>' +
      '<div class="co-grid" style="margin-top:1rem">' +
        field('co-province', 'Province', 'text', d.stateRegion || '', '') +
        field('co-country', 'Country', 'text', d.country || 'Rwanda', 'country') +
      '</div>';
  }

  /* ── Payment step ───────────────────────────────────── */
  function buildPaymentStep() {
    var methods = state.getPaymentMethods();
    var html = '';

    if (methods.length) {
      html += '<p class="co-section-label">Saved cards</p>';
      html += '<div class="co-saved-list">';
      methods.forEach(function (m, idx) {
        var checked = (idx === 0 && _selectedPaymentId === null) || _selectedPaymentId === m.id;
        html += '<label class="co-saved-item' + (checked ? ' is-selected' : '') + '">' +
          '<input type="radio" name="co-saved-payment" value="' + esc(m.id) + '"' + (checked ? ' checked' : '') + '>' +
          esc(m.label || m.brand) + ' &nbsp;&bull;&bull;&bull;&bull; ' + esc(m.last4) +
          (m.isDefault ? ' &nbsp;<span style="color:#b0b0b0;font-size:0.78rem">(default)</span>' : '') +
        '</label>';
      });
      html += '</div>';
      html += '<div class="co-divider">or add new card</div>';
    } else {
      html += '<p class="co-section-label">Card details</p>';
    }

    var p = _paymentData;
    html +=
      '<div id="co-new-card-form">' +
        '<div class="co-grid co-full">' +
          field('co-holder', 'Cardholder name', 'text', p.holderName || '', 'cc-name') +
        '</div>' +
        '<div class="co-card-row" style="margin-top:1rem">' +
          field('co-card-num', 'Card number', 'text', p.cardNumber || '', 'cc-number') +
          field('co-expiry-m', 'MM', 'text', p.expiryMonth || '', 'cc-exp-month') +
          field('co-expiry-y', 'YY', 'text', p.expiryYear || '', 'cc-exp-year') +
        '</div>' +
        '<label class="co-checkbox-row" style="margin-top:1rem">' +
          '<input type="checkbox" id="co-save-card"' + (_paymentData.save ? ' checked' : '') + '>' +
          'Save card for future purchases' +
        '</label>' +
      '</div>';

    return html;
  }

  /* ── Confirmation step ──────────────────────────────── */
  function buildConfirmStep() {
    return '<div class="co-confirm-icon"><i class="bx bx-check-circle"></i></div>' +
      '<h3 class="co-confirm-heading">Order placed!</h3>' +
      '<p class="co-confirm-sub">We\'ve received your order and it\'s being prepared.</p>' +
      '<p class="co-confirm-order-num" id="co-order-num"></p>' +
      '<div class="co-footer" style="justify-content:center">' +
        '<button type="button" class="co-btn-primary" id="co-done-btn" style="flex:none;min-width:180px">Done</button>' +
      '</div>';
  }

  /* ── Summary box ────────────────────────────────────── */
  function buildSummaryBox(subtotal, shipping, total) {
    return '<div class="co-summary-box">' +
      '<div class="co-summary-line"><span>Subtotal</span><span>' + fmt(subtotal) + '</span></div>' +
      '<div class="co-summary-line"><span>Shipping</span><span>' + fmt(shipping) + '</span></div>' +
      '<div class="co-summary-line is-total"><span>Total</span><span>' + fmt(total) + '</span></div>' +
    '</div>';
  }

  /* ── Wire buttons for current step ─────────────────── */
  function wireStep() {
    var sheet = _overlay ? _overlay.querySelector('.co-sheet') : null;
    if (!sheet) return;

    // Close
    var closeBtn = sheet.querySelector('#co-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCheckout);

    // Step 1 → 2
    var next1 = sheet.querySelector('#co-next-1');
    if (next1) next1.addEventListener('click', handleNext1);

    // Step 2 back
    var back2 = sheet.querySelector('#co-back-2');
    if (back2) back2.addEventListener('click', function () { goToStep(1); });

    // Step 2 → place order
    var placeBtn = sheet.querySelector('#co-place-order');
    if (placeBtn) placeBtn.addEventListener('click', handlePlaceOrder);

    // Step 3 done
    var doneBtn = sheet.querySelector('#co-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', handleDone);

    // Saved payment radio — toggle new card form
    sheet.querySelectorAll('input[name="co-saved-payment"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        _selectedPaymentId = radio.value;
        sheet.querySelectorAll('.co-saved-item').forEach(function (el) {
          el.classList.remove('is-selected');
        });
        radio.closest('.co-saved-item').classList.add('is-selected');
        var newCardForm = sheet.querySelector('#co-new-card-form');
        if (newCardForm) newCardForm.style.opacity = '0.4';
      });
    });
  }

  /* ── Step navigation ────────────────────────────────── */
  function goToStep(n) {
    _currentStep = n;
    var sheet = _overlay.querySelector('.co-sheet');
    sheet.innerHTML = buildSheetHTML();
    sheet.scrollTop = 0;
    wireStep();
  }

  /* ── Handle step 1 → 2 ──────────────────────────────── */
  function handleNext1() {
    var sheet = _overlay.querySelector('.co-sheet');
    clearErrors(sheet);

    var fullName   = val(sheet, '#co-full-name');
    var phone      = val(sheet, '#co-phone');
    var address1   = val(sheet, '#co-address1');
    var city       = val(sheet, '#co-city');
    var country    = val(sheet, '#co-country');

    var valid = true;
    if (!fullName)  { markError(sheet, '#co-full-name', 'Required'); valid = false; }
    if (!phone)     { markError(sheet, '#co-phone', 'Required'); valid = false; }
    if (!address1)  { markError(sheet, '#co-address1', 'Required'); valid = false; }
    if (!city)      { markError(sheet, '#co-city', 'Required'); valid = false; }
    if (!country)   { markError(sheet, '#co-country', 'Required'); valid = false; }

    if (!valid) return;

    _shippingData = {
      fullName:    fullName,
      phone:       phone,
      addressLine1: address1,
      addressLine2: val(sheet, '#co-address2'),
      city:        city,
      stateRegion: val(sheet, '#co-province'),
      country:     country,
    };

    goToStep(2);
  }

  /* ── Handle place order ─────────────────────────────── */
  function handlePlaceOrder() {
    var sheet = _overlay.querySelector('.co-sheet');
    clearErrors(sheet);

    var methods = state.getPaymentMethods();

    /* decide which payment to use */
    var checkedRadio = sheet.querySelector('input[name="co-saved-payment"]:checked');

    var paymentInput = null;
    var saveCard     = false;

    if (checkedRadio && methods.length) {
      /* user picked a saved card */
      paymentInput = { id: checkedRadio.value };
    } else {
      /* new card form */
      var holder  = val(sheet, '#co-holder');
      var cardNum = val(sheet, '#co-card-num');
      var expM    = val(sheet, '#co-expiry-m');
      var expY    = val(sheet, '#co-expiry-y');
      var saveEl  = sheet.querySelector('#co-save-card');
      saveCard = saveEl ? saveEl.checked : false;

      var valid = true;
      if (!holder)              { markError(sheet, '#co-holder', 'Required'); valid = false; }
      if (cardNum.replace(/\D/g,'').length < 13) { markError(sheet, '#co-card-num', 'Enter a valid card number'); valid = false; }
      if (!expM || expM.length > 2 || Number(expM) < 1 || Number(expM) > 12) { markError(sheet, '#co-expiry-m', 'MM'); valid = false; }
      if (!expY || expY.replace(/\D/g,'').length < 2) { markError(sheet, '#co-expiry-y', 'YY'); valid = false; }

      if (!valid) return;

      paymentInput = {
        holderName:  holder,
        cardNumber:  cardNum,
        expiryMonth: expM,
        expiryYear:  expY,
      };

      _paymentData = {
        holderName:  holder,
        cardNumber:  cardNum,
        expiryMonth: expM,
        expiryYear:  expY,
        save:        saveCard,
      };
    }

    /* build checkout object */
    var user = state.getCurrentUser();
    var checkout = {
      contact: {
        fullName: _shippingData.fullName,
        phone:    _shippingData.phone,
        email:    user ? user.email : '',
      },
      shippingAddress: _shippingData,
      billingAddress:  _shippingData,
      paymentMethod:   paymentInput,
      savePaymentMethod: saveCard,
    };

    var order = state.createOrderFromCheckout(checkout);

    if (!order) {
      if (window.NexraNotify) window.NexraNotify.show('Could not create order. Please try again.', 'error');
      return;
    }

    /* go to confirmation */
    _currentStep = 3;
    var sheetEl = _overlay.querySelector('.co-sheet');
    sheetEl.innerHTML = buildSheetHTML();
    sheetEl.scrollTop = 0;
    wireStep();

    /* fill in order number */
    var numEl = sheetEl.querySelector('#co-order-num');
    if (numEl) numEl.textContent = order.orderNumber || order.id;

    /* refresh cart UI on the page */
    window.dispatchEvent(new CustomEvent('nexra:cart-updated'));
    window.dispatchEvent(new CustomEvent('nexra:user-updated'));
  }

  /* ── Done button ────────────────────────────────────── */
  function handleDone() {
    closeCheckout();
    /* if on cart page, nothing special needed — cart is already re-rendered */
    /* if on profile, the panels updated via event above */
  }

  /* ── Helpers ────────────────────────────────────────── */
  function field(id, label, type, value, autocomplete) {
    return '<div class="co-field">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<input type="' + type + '" id="' + id + '" value="' + esc(value) + '"' +
        (autocomplete ? ' autocomplete="' + autocomplete + '"' : '') + '>' +
      '<p class="co-field-error" id="' + id + '-err" hidden></p>' +
    '</div>';
  }

  function val(sheet, selector) {
    var el = sheet.querySelector(selector);
    return el ? el.value.trim() : '';
  }

  function markError(sheet, selector, message) {
    var el = sheet.querySelector(selector);
    if (el) el.classList.add('is-invalid');
    var errEl = sheet.querySelector(selector + '-err');
    if (errEl) { errEl.textContent = message; errEl.hidden = false; }
  }

  function clearErrors(sheet) {
    sheet.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    sheet.querySelectorAll('.co-field-error').forEach(function (el) { el.hidden = true; });
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
