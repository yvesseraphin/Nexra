(function () {
  const TOKEN_KEY = "nexra_token";
  const USER_KEY = "nexra_user";
  const REDIRECT_KEY = "nexra_post_auth_redirect";
  const PRODUCT_PREVIEW_KEY = "nexra_product_preview";
  const CART_PREFIX = "nexra_cart_";
  const ORDER_PREFIX = "nexra_orders_";
  const PAYMENT_PREFIX = "nexra_payments_";
  const GUEST_KEY = "guest";
  const ADD_TO_CART_SELECTOR = ".add-btn, .add-to-cart, .add-to-cart-btn, .add-to-cart-overlay";
  const PRODUCT_IMAGE_SELECTOR = [
    ".product-card img",
    ".deal-card img",
    ".collection-card img",
    ".product-grid-item img",
    ".images-deals img",
    ".collection-item img",
    ".hero-section > img",
    ".image-box img",
    ".watch-main-img img",
    ".recent-image-wrapper img",
  ].join(", ");

  document.addEventListener("DOMContentLoaded", initNexraState);
  window.addEventListener("nexra:storefront-rendered", enhanceProductMedia);

  function initNexraState() {
    bindAddToCartButtons();
    bindProductDetailLinks();
    injectProductInteractionStyles();
    enhanceProductMedia();
  }

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getCurrentUser() {
    return safeParse(localStorage.getItem(USER_KEY), null);
  }

  function emitUserUpdate(user = getCurrentUser()) {
    window.dispatchEvent(
      new CustomEvent("nexra:user-updated", {
        detail: { user },
      })
    );
  }

  function setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      emitUserUpdate(null);
      return null;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitUserUpdate(user);
    return user;
  }

  function getCurrentToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  function buildApiUrl(path) {
    const normalizedPath = String(path || "");
    const { protocol, hostname, port } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (protocol === "file:") {
      return `http://localhost:3000${normalizedPath}`;
    }

    if (isLocalHost && port && port !== "3000") {
      return `http://localhost:3000${normalizedPath}`;
    }

    return normalizedPath;
  }

  function isAuthenticated() {
    return Boolean(getCurrentToken() && getCurrentUser());
  }

  function normalizePath(rawPath) {
    const fallback = "index.html";
    const value = String(rawPath || "").trim();

    if (!value) {
      return fallback;
    }

    if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
      return fallback;
    }

    if (value === "/") {
      return fallback;
    }

    const cleaned = value.replace(/^\//, "");
    return cleaned || fallback;
  }

  function getCurrentPath() {
    const path = normalizePath(window.location.pathname.split("/").pop());
    return `${path}${window.location.search || ""}${window.location.hash || ""}`;
  }

  function setPostAuthRedirect(target) {
    localStorage.setItem(REDIRECT_KEY, normalizePath(target || getCurrentPath()));
  }

  function consumePostAuthRedirect() {
    const nextTarget = normalizePath(localStorage.getItem(REDIRECT_KEY));
    localStorage.removeItem(REDIRECT_KEY);
    return nextTarget;
  }

  function getUserStorageKey(user = getCurrentUser()) {
    return user?.id || GUEST_KEY;
  }

  function getCartStorageKey(user = getCurrentUser()) {
    return `${CART_PREFIX}${getUserStorageKey(user)}`;
  }

  // Use Django standard urls in Django templates
  function getCartRedirectUrl() {
    // In reference it was 'cart.html'. Here, the cart url can be mapped to /cart/ or similar.
    return "/cart/";
  }

  function getOrderStorageKey(user = getCurrentUser()) {
    return `${ORDER_PREFIX}${getUserStorageKey(user)}`;
  }

  function getPaymentStorageKey(user = getCurrentUser()) {
    return `${PAYMENT_PREFIX}${getUserStorageKey(user)}`;
  }

  function getCart(user = getCurrentUser()) {
    return safeParse(localStorage.getItem(getCartStorageKey(user)), []);
  }

  function saveCart(items, user = getCurrentUser()) {
    localStorage.setItem(getCartStorageKey(user), JSON.stringify(items));
    emitCartUpdate(user);
    return items;
  }

  // Redirect to product detail page in Django
  function handleProductDetailClick(event) {
    const image = event.target.closest("img");

    if (!image || event.target.closest(ADD_TO_CART_SELECTOR)) {
      return;
    }

    const root = image.closest(
      ".deal-card, .product-card, .collection-card, .product-grid-item, .images-deals, .collection-item, .watch-main-img, .recent-products-section, .hero-section, .card"
    );

    if (!root) {
      return;
    }

    const product = extractProductFromRoot(root);

    if (!product?.title) {
      return;
    }

    event.preventDefault();
    saveProductPreview(product);
    // In Django we route to /store/product/?slug=
    window.location.href = `/store/product/?slug=${encodeURIComponent(product.slug)}`;
  }

  function getOrders(user = getCurrentUser()) {
    return safeParse(localStorage.getItem(getOrderStorageKey(user)), []);
  }

  function saveOrders(orders, user = getCurrentUser()) {
    localStorage.setItem(getOrderStorageKey(user), JSON.stringify(orders));
    window.dispatchEvent(
      new CustomEvent("nexra:orders-updated", {
        detail: { orders, user },
      })
    );
    return orders;
  }

  function getPaymentMethods(user = getCurrentUser()) {
    return safeParse(localStorage.getItem(getPaymentStorageKey(user)), []);
  }

  // Copying remainder from reference nexra-state.js
  function savePaymentMethods(methods, user = getCurrentUser()) {
    localStorage.setItem(getPaymentStorageKey(user), JSON.stringify(methods));
    emitPaymentUpdate(user);
    return methods;
  }

  function getCartCount(user = getCurrentUser()) {
    return getCart(user).reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function parsePriceValue(priceText) {
    const digits = String(priceText || "").replace(/[^\d.]/g, "");
    const parsed = Number.parseFloat(digits);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    return `${Math.round(Number(value) || 0).toLocaleString("en-US")} RWF`;
  }

  function detectCardBrand(cardNumber) {
    const normalized = String(cardNumber || "").replace(/\D/g, "");

    if (/^4\d{12}(\d{3})?(\d{3})?$/.test(normalized)) {
      return "Visa";
    }

    if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(normalized)) {
      return "Mastercard";
    }

    if (/^3[47]\d{13}$/.test(normalized)) {
      return "American Express";
    }

    if (/^6(?:011|5\d{2}|4[4-9]\d)\d{12,15}$/.test(normalized)) {
      return "Discover";
    }

    return "Card";
  }

  function formatExpiryMonth(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 2);

    if (!digits) {
      return "";
    }

    return digits.padStart(2, "0");
  }

  function normalizeExpiryYear(value) {
    const digits = String(value || "").replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    if (digits.length === 2) {
      return `20${digits}`;
    }

    return digits.slice(0, 4);
  }

  function formatExpiryLabel(month, year) {
    const normalizedMonth = formatExpiryMonth(month);
    const normalizedYear = normalizeExpiryYear(year);

    if (!normalizedMonth || !normalizedYear) {
      return "";
    }

    return `${normalizedMonth}/${normalizedYear.slice(-2)}`;
  }

  function buildMaskedPaymentMethod(details = {}) {
    const holderName = String(details.holderName || "").trim();
    const cardNumber = String(details.cardNumber || details.last4 || "").replace(/\D/g, "");
    const last4 = cardNumber.slice(-4);
    const expiryMonth = formatExpiryMonth(details.expiryMonth || "");
    const expiryYear = normalizeExpiryYear(details.expiryYear || "");

    if (!holderName || !last4 || !expiryMonth || !expiryYear) {
      return null;
    }

    const cardBrand = String(details.brand || detectCardBrand(cardNumber)).trim() || "Card";
    const methodType = String(details.type || "card").trim() || "card";

    return {
      id: String(details.id || `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      type: methodType,
      brand: cardBrand,
      last4,
      expiryMonth,
      expiryYear,
      expiryLabel: formatExpiryLabel(expiryMonth, expiryYear),
      holderName,
      billingEmail: String(details.billingEmail || details.email || "").trim().toLowerCase(),
      billingPhone: String(details.billingPhone || details.phone || "").trim(),
      label: `${cardBrand} ending in ${last4}`,
      isDefault: Boolean(details.isDefault),
      createdAt: details.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function setDefaultPaymentMethod(paymentMethodId, user = getCurrentUser()) {
    const nextMethods = getPaymentMethods(user).map((method) => ({
      ...method,
      isDefault: method.id === paymentMethodId,
      updatedAt: new Date().toISOString(),
    }));

    savePaymentMethods(nextMethods, user);
    return nextMethods.find((method) => method.id === paymentMethodId) || null;
  }

  function savePaymentMethod(paymentMethodInput, user = getCurrentUser()) {
    const paymentMethod = buildMaskedPaymentMethod(paymentMethodInput);

    if (!paymentMethod) {
      return null;
    }

    const methods = getPaymentMethods(user);
    const existingIndex = methods.findIndex((method) => {
      return (
        method.brand === paymentMethod.brand &&
        method.last4 === paymentMethod.last4 &&
        method.expiryMonth === paymentMethod.expiryMonth &&
        method.expiryYear === paymentMethod.expiryYear &&
        String(method.holderName || "").trim().toLowerCase() === paymentMethod.holderName.toLowerCase()
      );
    });

    let nextMethods = [...methods];
    let persistedMethodId = paymentMethod.id;

    if (existingIndex >= 0) {
      nextMethods[existingIndex] = {
        ...nextMethods[existingIndex],
        ...paymentMethod,
        id: nextMethods[existingIndex].id,
        isDefault: paymentMethod.isDefault || nextMethods[existingIndex].isDefault,
      };
      persistedMethodId = nextMethods[existingIndex].id;
    } else {
      nextMethods.unshift({
        ...paymentMethod,
        isDefault: paymentMethod.isDefault || !methods.length,
      });
    }

    if (!nextMethods.some((method) => method.isDefault) && nextMethods.length) {
      nextMethods[0].isDefault = true;
    }

    if (paymentMethod.isDefault) {
      nextMethods = nextMethods.map((method) => ({
        ...method,
        isDefault:
          method.id === persistedMethodId ||
          (existingIndex >= 0 && method.id === nextMethods[existingIndex].id),
      }));
    }

    savePaymentMethods(nextMethods, user);
    return nextMethods.find((method) => method.id === persistedMethodId) || null;
  }

  function removePaymentMethod(paymentMethodId, user = getCurrentUser()) {
    const nextMethods = getPaymentMethods(user).filter((method) => method.id !== paymentMethodId);

    if (nextMethods.length && !nextMethods.some((method) => method.isDefault)) {
      nextMethods[0] = {
        ...nextMethods[0],
        isDefault: true,
        updatedAt: new Date().toISOString(),
      };
    }

    savePaymentMethods(nextMethods, user);
    return nextMethods;
  }

  function getDefaultPaymentMethod(user = getCurrentUser()) {
    const methods = getPaymentMethods(user);
    return methods.find((method) => method.isDefault) || methods[0] || null;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item";
  }

  function getTextFrom(root, selectors) {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const text = element?.textContent?.trim();

      if (text) {
        return text;
      }
    }

    return "";
  }

  function getImageFrom(root) {
    const image = root.querySelector("img");
    return image?.getAttribute("src") || "";
  }

  function getProductRoot(button) {
    return (
      button.closest(".deal-card") ||
      button.closest(".product-card") ||
      button.closest(".collection-card") ||
      button.closest(".product-grid-item") ||
      button.closest(".images-deals") ||
      button.closest(".collection-item") ||
      button.closest(".watch-main-img") ||
      button.closest(".recent-products-section") ||
      button.closest(".hero-section") ||
      button.closest(".card") ||
      button.closest("section") ||
      document.body
    );
  }

  function extractProductFromRoot(root) {
    const page = document.body.dataset.page || "store";
    const title =
      getTextFrom(root, [
        "#watch-title",
        ".deal-title",
        ".product-grid-title",
        ".collection-title",
        ".product-title",
        ".brand-tag",
        ".main-heading",
        ".category-heading",
        ".product-info h6",
        ".card-body h5",
        ".deals-day-text-content p",
        "h4",
        "h3",
        "h2",
      ]) ||
      root.querySelector("img")?.getAttribute("alt") ||
      "Selected item";

    const description = getTextFrom(root, [
      "#watch-desc",
      ".deal-desc",
      ".collection-subtitle",
      ".product-description",
      ".product-category",
      ".product-info p",
      ".main-heading",
      ".card-body .product-description",
    ]);

    const price =
      getTextFrom(root, [
        ".deal-price",
        ".product-grid-price",
        ".product-price",
        ".product-info .product-price",
        ".deals-day-text-content .product-price",
        ".card-body .product-price",
      ]) || "Price available on request";

    const product = {
      id: `${page}-${slugify(title)}`,
      slug: `${page}-${slugify(title)}`,
      page,
      title,
      description,
      price,
      priceValue: parsePriceValue(price),
      image: getImageFrom(root),
      quantity: 1,
    };

    return {
      ...product,
      ...buildFallbackProductDetails(product),
    };
  }

  function extractProductFromButton(button) {
    const root = getProductRoot(button);
    return extractProductFromRoot(root);
  }

  function buildFallbackProductDetails(product) {
    const pageName = getDisplayLabel(product.page);
    const pageTones = {
      accessories: "refined styling, clean finishing details, and easy pairing with both day and evening looks",
      beauty: "consistent routine use, shelf appeal, and a polished self-care experience",
      fashion: "confident styling, wearable comfort, and a look that stays expressive without feeling overdone",
      food: "fresh appeal, dependable quality, and satisfying everyday use",
      kids: "comfort, playful energy, and practical daily durability",
      tech: "modern performance, useful reliability, and a cleaner setup experience",
      index: "balanced design, visual appeal, and everyday practicality",
      store: "a polished look, practical value, and a more intentional everyday feel",
    };

    const fullDescription = product.description
      ? `${product.title} builds on ${product.description.toLowerCase()} with a more complete, elevated feel. Chosen for the ${pageName} collection, it focuses on ${pageTones[product.page] || pageTones.store}. This makes ${product.title} a strong option when you want something that looks thoughtful, feels easy to use, and stands out for more than just the first impression.`
      : `${product.title} is one of our more distinctive picks from the ${pageName} page. It focuses on ${pageTones[product.page] || pageTones.store}, giving you a product that feels clear in purpose, easy to appreciate, and strong enough to carry its own presence in your collection.`;

    return {
      fullDescription,
      highlights: [
        {
          title: "Why it stands out",
          description: product.description
            ? `${product.title} starts with ${product.description.toLowerCase()} and extends that into a more polished overall feel.`
            : `${product.title} is made to feel immediately clear, attractive, and easy to enjoy in everyday use.`,
        },
        {
          title: "Best for",
          description: `This product works especially well when you want ${pageTones[product.page] || pageTones.store}.`,
        },
        {
          title: "Storefront fit",
          description: `${product.title} belongs naturally in the ${pageName} lineup, where it helps round out the page with something distinctive and easy to remember.`,
        },
      ],
      specifications: [
        { label: "Page", value: pageName },
        { label: "Price", value: product.price || "Available on request" },
        { label: "Availability", value: "Ready to order" },
      ],
    };
  }

  function getDisplayLabel(value) {
    return String(value || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Store";
  }

  function addToCart(product, quantity = 1, user = getCurrentUser()) {
    if (!product?.id) {
      return null;
    }

    const cart = getCart(user);
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        ...product,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    saveCart(cart, user);
    return existingItem || cart[cart.length - 1];
  }

  function updateCartQuantity(productId, quantity, user = getCurrentUser()) {
    const cart = getCart(user)
      .map((item) => {
        if (item.id !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, Number(quantity) || 1),
        };
      });

    saveCart(cart, user);
    return cart;
  }

  function removeFromCart(productId, user = getCurrentUser()) {
    const cart = getCart(user).filter((item) => item.id !== productId);
    saveCart(cart, user);
    return cart;
  }

  function clearCart(user = getCurrentUser()) {
    saveCart([], user);
  }

  function normalizeCheckoutContact(contact = {}, user = getCurrentUser()) {
    const displayName = getUserDisplayName(user);
    const fullName = String(contact.fullName || displayName || "").trim();

    return {
      fullName,
      email: String(contact.email || user?.email || "").trim().toLowerCase(),
      phone: String(contact.phone || user?.phone || user?.identifier || "").trim(),
    };
  }

  function normalizeCheckoutAddress(address = {}, fallbackName = "") {
    return {
      fullName: String(address.fullName || fallbackName || "").trim(),
      addressLine1: String(address.addressLine1 || "").trim(),
      addressLine2: String(address.addressLine2 || "").trim(),
      city: String(address.city || "").trim(),
      stateRegion: String(address.stateRegion || "").trim(),
      postalCode: String(address.postalCode || "").trim(),
      country: String(address.country || "Rwanda").trim(),
      deliveryInstructions: String(address.deliveryInstructions || "").trim(),
    };
  }

  function createOrderFromCheckout(checkout = {}, user = getCurrentUser()) {
    const cart = getCart(user);

    if (!cart.length) {
      return null;
    }

    const total = cart.reduce((sum, item) => sum + (Number(item.priceValue) || 0) * Number(item.quantity || 0), 0);
    const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const contact = normalizeCheckoutContact(checkout.contact || {}, user);
    const shippingAddress = normalizeCheckoutAddress(checkout.shippingAddress || {}, contact.fullName);
    const billingAddress = normalizeCheckoutAddress(checkout.billingAddress || shippingAddress, contact.fullName);
    const selectedSavedMethod =
      checkout.paymentMethod?.id != null
        ? getPaymentMethods(user).find((method) => method.id === checkout.paymentMethod.id) || null
        : null;
    let paymentMethodSummary = selectedSavedMethod || buildMaskedPaymentMethod(checkout.paymentMethod || {});

    if (checkout.savePaymentMethod && paymentMethodSummary && !selectedSavedMethod) {
      paymentMethodSummary =
        savePaymentMethod(
          {
            ...paymentMethodSummary,
            isDefault: Boolean(checkout.setDefaultPaymentMethod),
          },
          user
        ) || paymentMethodSummary;
    } else if (checkout.setDefaultPaymentMethod && selectedSavedMethod) {
      paymentMethodSummary = setDefaultPaymentMethod(selectedSavedMethod.id, user) || selectedSavedMethod;
    }

    const createdAt = new Date().toISOString();
    const order = {
      id: `order-${Date.now()}`,
      orderNumber: `NXR-${String(Date.now()).slice(-8)}`,
      createdAt,
      placedAt: createdAt,
      subtotal: total,
      total,
      totalLabel: formatCurrency(total),
      totalItems,
      items: cart.map((item) => ({ ...item })),
      status: "Confirmed",
      paymentStatus: paymentMethodSummary ? "Payment details received" : "Pending payment method",
      fulfillmentStatus: "Preparing dispatch",
      contact,
      shippingAddress,
      billingAddress,
      paymentSummary: paymentMethodSummary
        ? {
            id: paymentMethodSummary.id,
            type: paymentMethodSummary.type,
            brand: paymentMethodSummary.brand,
            last4: paymentMethodSummary.last4,
            expiryLabel: paymentMethodSummary.expiryLabel,
            holderName: paymentMethodSummary.holderName,
            label: paymentMethodSummary.label,
          }
        : null,
      notes: String(checkout.notes || "").trim(),
      checkoutMode: "guided",
    };

    const nextOrders = [order, ...getOrders(user)];
    saveOrders(nextOrders, user);
    clearCart(user);
    return order;
  }

  function createOrderFromCart(user = getCurrentUser()) {
    return createOrderFromCheckout({}, user);
  }

  function mergeCartItems(existingItems, incomingItems) {
    const merged = [...existingItems];

    incomingItems.forEach((incomingItem) => {
      const existingItem = merged.find((item) => item.id === incomingItem.id);

      if (existingItem) {
        existingItem.quantity += Number(incomingItem.quantity || 0);
        existingItem.priceValue = Number(existingItem.priceValue || 0) || Number(incomingItem.priceValue || 0);
      } else {
        merged.push({ ...incomingItem });
      }
    });

    return merged;
  }

  function migrateGuestStateToUser(user) {
    if (!user?.id) {
      return;
    }

    const guestCart = getCart({ id: GUEST_KEY });
    const guestOrders = getOrders({ id: GUEST_KEY });

    if (guestCart.length) {
      const mergedCart = mergeCartItems(getCart(user), guestCart);
      saveCart(mergedCart, user);
      localStorage.removeItem(getCartStorageKey({ id: GUEST_KEY }));
    }

    if (guestOrders.length) {
      const nextOrders = [...guestOrders, ...getOrders(user)];
      saveOrders(nextOrders, user);
      localStorage.removeItem(getOrderStorageKey({ id: GUEST_KEY }));
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
  }

  function getUserDisplayName(user = getCurrentUser()) {
    if (!user) {
      return "Guest";
    }

    if (user.displayName) {
      return user.displayName;
    }

    if (user.fullName) {
      return user.fullName;
    }

    const fullName = [user.firstName, user.lastName]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");

    if (fullName) {
      return fullName;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    if (user.phone) {
      return user.phone;
    }

    return user.identifier || "User";
  }

  function getUserAvatarUrl(user = getCurrentUser()) {
    return String(user?.avatarUrl || user?.avatarDataUrl || "").trim() || null;
  }

  function getUserInitials(user = getCurrentUser()) {
    const name = getUserDisplayName(user).replace(/[^a-zA-Z0-9 ]/g, " ").trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (!parts.length) {
      return "NX";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  function emitCartUpdate(user = getCurrentUser()) {
    window.dispatchEvent(
      new CustomEvent("nexra:cart-updated", {
        detail: {
          cart: getCart(user),
          count: getCartCount(user),
          user,
        },
      })
    );
  }

  function emitPaymentUpdate(user = getCurrentUser()) {
    window.dispatchEvent(
      new CustomEvent("nexra:payments-updated", {
        detail: {
          paymentMethods: getPaymentMethods(user),
          user,
        },
      })
    );
  }

  function flashAddButton(button) {
    if (!button || button.dataset.nexraAdded === "true") {
      return;
    }

    const originalMarkup = button.innerHTML;
    button.dataset.nexraAdded = "true";
    button.innerHTML = '<i class="bx bx-check"></i> Added';

    window.setTimeout(() => {
      button.innerHTML = originalMarkup;
      button.dataset.nexraAdded = "false";
    }, 1200);
  }

  function handleAddToCartClick(event) {
    const button = event.target.closest(ADD_TO_CART_SELECTOR);

    if (!button) {
      return;
    }

    const product = extractProductFromButton(button);

    if (!product) {
      return;
    }

    event.preventDefault();
    addToCart(product);
    flashAddButton(button);
  }

  function bindAddToCartButtons() {
    if (document.body.dataset.nexraCartBound === "true") {
      return;
    }

    document.body.dataset.nexraCartBound = "true";
    document.addEventListener("click", handleAddToCartClick);
  }

  function bindProductDetailLinks() {
    if (document.body.dataset.nexraProductLinksBound === "true") {
      return;
    }

    document.body.dataset.nexraProductLinksBound = "true";
    document.addEventListener("click", handleProductDetailClick);
  }

  function saveProductPreview(product) {
    sessionStorage.setItem(PRODUCT_PREVIEW_KEY, JSON.stringify(product));
  }

  function getProductPreview(slug = "") {
    const preview = safeParse(sessionStorage.getItem(PRODUCT_PREVIEW_KEY), null);

    if (!preview) {
      return null;
    }

    if (!slug || preview.slug === slug) {
      return preview;
    }

    return null;
  }

  function enhanceProductMedia() {
    document.querySelectorAll(PRODUCT_IMAGE_SELECTOR).forEach((image) => {
      image.classList.add("nexra-product-clickable");
      image.setAttribute("data-product-detail-trigger", "true");
      image.setAttribute("title", "View product details");
    });
  }

  function injectProductInteractionStyles() {
    if (document.getElementById("nexra-product-interaction-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "nexra-product-interaction-styles";
    style.textContent = `
      .nexra-product-clickable {
        cursor: pointer;
        transition: transform 0.35s ease, filter 0.35s ease, box-shadow 0.35s ease;
      }

      .nexra-product-clickable:hover {
        transform: scale(1.035);
        filter: brightness(0.96);
      }
    `;

    document.head.appendChild(style);
  }

  function ensureAuthenticated(redirectTarget = getCurrentPath()) {
    if (isAuthenticated()) {
      return true;
    }

    setPostAuthRedirect(redirectTarget);
    // Redirect to login page in Django
    window.location.href = `/accounts/login/?redirect=${encodeURIComponent(normalizePath(redirectTarget))}`;
    return false;
  }

  window.NexraState = {
    TOKEN_KEY,
    USER_KEY,
    REDIRECT_KEY,
    PRODUCT_PREVIEW_KEY,
    buildApiUrl,
    getCurrentUser,
    getCurrentToken,
    isAuthenticated,
    getCurrentPath,
    setPostAuthRedirect,
    consumePostAuthRedirect,
    getCart,
    getCartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getOrders,
    getPaymentMethods,
    getDefaultPaymentMethod,
    savePaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    createOrderFromCheckout,
    createOrderFromCart,
    migrateGuestStateToUser,
    setCurrentUser,
    clearSession,
    ensureAuthenticated,
    getUserDisplayName,
    getUserAvatarUrl,
    getUserInitials,
    getProductPreview,
    buildFallbackProductDetails,
    saveProductPreview,
    slugify,
    formatCurrency,
    parsePriceValue,
    emitCartUpdate,
    emitPaymentUpdate,
    detectCardBrand,
    buildMaskedPaymentMethod,
  };
})();
