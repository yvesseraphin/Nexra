(function () {
  const state = window.NexraState;
  const params = new URLSearchParams(window.location.search);
  const requestedSlug = String(params.get("slug") || "").trim();
  const hero = document.getElementById("product-hero");
  const feedback = document.getElementById("product-feedback");
  const image = document.getElementById("product-image");
  const thumbs = document.getElementById("product-thumbs");
  const eyebrow = document.getElementById("product-eyebrow");
  const title = document.getElementById("product-title");
  const price = document.getElementById("product-price");
  const stockNote = document.getElementById("product-stock-note");
  const summary = document.getElementById("product-summary");
  const description = document.getElementById("product-description");
  const quantityOptions = document.getElementById("product-quantity-options");
  const selectedQuantity = document.getElementById("product-selected-quantity");
  const deliveryGrid = document.getElementById("product-delivery-grid");
  const addButton = document.getElementById("product-add-to-cart");
  let currentProduct = null;
  let currentQuantity = 1;

  if (
    !hero ||
    !feedback ||
    !image ||
    !thumbs ||
    !title ||
    !price ||
    !stockNote ||
    !summary ||
    !description ||
    !quantityOptions ||
    !selectedQuantity ||
    !deliveryGrid ||
    !addButton
  ) {
    return;
  }

  document.addEventListener("DOMContentLoaded", initProductPage);
  addButton.addEventListener("click", handleAddToCart);

  async function initProductPage() {
    const preview = state?.getProductPreview?.(requestedSlug) || null;
    const apiProduct = requestedSlug ? await fetchProductBySlug(requestedSlug) : null;
    currentProduct = mergeProductData(apiProduct, preview);

    if (!currentProduct) {
      renderMissingState();
      return;
    }

    renderProduct(currentProduct);
  }

  async function fetchProductBySlug(slug) {
    try {
      const response = await fetch(`/api/catalog/items/${encodeURIComponent(slug)}`, { cache: "no-store" });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function mergeProductData(apiProduct, preview) {
    if (apiProduct) {
      const fallbackDetails = state?.buildFallbackProductDetails?.(apiProduct) || {};
      return {
        ...fallbackDetails,
        ...apiProduct,
        highlights: apiProduct.highlights?.length ? apiProduct.highlights : fallbackDetails.highlights || [],
        specifications: apiProduct.specifications?.length ? apiProduct.specifications : fallbackDetails.specifications || [],
        fullDescription: apiProduct.fullDescription || fallbackDetails.fullDescription || "",
      };
    }

    if (!preview) {
      return null;
    }

    const fallbackDetails = state?.buildFallbackProductDetails?.(preview) || {};
    return {
      ...preview,
      ...fallbackDetails,
      highlights: preview.highlights?.length ? preview.highlights : fallbackDetails.highlights || [],
      specifications: preview.specifications?.length ? preview.specifications : fallbackDetails.specifications || [],
      fullDescription: preview.fullDescription || fallbackDetails.fullDescription || "",
    };
  }

  function renderProduct(product) {
    const displayPage = product.category || (product.page === "index" ? "" : formatLabel(product.page));
    const gallery = buildGallery(product);
    currentQuantity = 1;

    image.src = gallery.mainImage.src;
    image.alt = gallery.mainImage.alt;
    eyebrow.textContent = displayPage;
    eyebrow.hidden = !displayPage;
    title.textContent = product.title || "Untitled product";
    price.textContent = product.price || state?.formatCurrency?.(product.priceValue || 0) || "Price available on request";
    stockNote.textContent = buildStockMessage(product);
    summary.textContent = product.description || "A closer look at one of the featured products from Nexra.";
    description.textContent = product.fullDescription || product.description || "";
    selectedQuantity.textContent = String(currentQuantity);

    renderGallery(gallery);
    renderQuantityOptions();
    renderDeliveryInfo(product);

    hero.hidden = false;
  }

  function renderMissingState() {
    feedback.hidden = false;
    feedback.className = "product-feedback is-error";
    feedback.innerHTML = 'We could not find that product right now. <a href="/">Return to the store</a>.';
    title.textContent = "Product unavailable";
    price.textContent = "";
    summary.textContent = "";
    description.textContent = "";
    addButton.disabled = true;
    hero.hidden = false;
  }

  function renderGallery(gallery) {
    thumbs.innerHTML = gallery.thumbs
      .map((item, index) => {
        if (item.isPlaceholder) {
          return `
            <div class="product-thumb product-thumb-placeholder" aria-hidden="true">
              <i class="bx bx-plus"></i>
            </div>
          `;
        }

        return `
          <button type="button" class="product-thumb ${index === 0 ? "is-active" : ""}" data-gallery-index="${index}" aria-label="View product image ${index + 1}">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}">
          </button>
        `;
      })
      .join("");

    thumbs.querySelectorAll(".product-thumb").forEach((button) => {
      if (!button.dataset.galleryIndex) {
        return;
      }

      button.addEventListener("click", () => {
        const nextIndex = Number(button.dataset.galleryIndex) || 0;
        const nextImage = gallery.thumbs[nextIndex] || gallery.mainImage;

        if (nextImage.isPlaceholder) {
          return;
        }

        image.src = nextImage.src;
        image.alt = nextImage.alt;
        thumbs.querySelectorAll(".product-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
        button.classList.add("is-active");
      });
    });
  }

  function renderQuantityOptions() {
    const options = [1, 2, 3, 4];

    quantityOptions.innerHTML = options
      .map((quantity) => {
        return `
          <button
            type="button"
            class="product-option-btn ${quantity === currentQuantity ? "is-selected" : ""}"
            data-quantity="${quantity}"
            aria-pressed="${quantity === currentQuantity ? "true" : "false"}"
          >
            ${quantity}
          </button>
        `;
      })
      .join("");

    quantityOptions.querySelectorAll(".product-option-btn").forEach((button) => {
      button.addEventListener("click", () => {
        currentQuantity = Number(button.dataset.quantity) || 1;
        selectedQuantity.textContent = String(currentQuantity);
        quantityOptions.querySelectorAll(".product-option-btn").forEach((option) => {
          const isCurrent = option === button;
          option.classList.toggle("is-selected", isCurrent);
          option.setAttribute("aria-pressed", isCurrent ? "true" : "false");
        });
      });
    });
  }

  function renderDeliveryInfo(product) {
    const specificationItems = (product.specifications || []).slice(0, 2).map((item) => ({
      icon: "bx bx-check-circle",
      title: item.label,
      text: item.value,
    }));
    const items = [
      {
        icon: "bx bx-package",
        title: "Free shipping",
        text: "Delivered in 2-5 business days.",
      },
      {
        icon: "bx bx-rotate-left",
        title: "Easy returns",
        text: "Simple follow-up through your order history.",
      },
      ...specificationItems,
    ];

    deliveryGrid.innerHTML = items
      .map((item) => {
        return `
          <article class="product-delivery-item">
            <i class="${escapeHtml(item.icon)}" aria-hidden="true"></i>
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.text)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function buildGallery(product) {
    const baseImage = product.image || "/static/images/p7.png";
    const alt = product.alt || product.title || "Product image";
    const rawThumbs = Array.isArray(product.galleryImages)
      ? product.galleryImages
      : Array.isArray(product.images)
        ? product.images
        : [];
    const seenThumbSources = new Set();
    const galleryImages = rawThumbs
      .map((item) => {
        if (typeof item === "string") {
          return {
            src: item,
            alt,
            isPlaceholder: false,
          };
        }

        return {
          src: String(item?.src || item?.image || "").trim(),
          alt: String(item?.alt || alt).trim(),
          isPlaceholder: false,
        };
      })
      .filter((item) => {
        if (!item.src || item.src === baseImage || seenThumbSources.has(item.src)) {
          return false;
        }

        seenThumbSources.add(item.src);
        return true;
      })
      .slice(0, 3);

    while (galleryImages.length < 3) {
      galleryImages.push({
        src: "",
        alt: "",
        isPlaceholder: true,
      });
    }

    return {
      mainImage: {
        src: baseImage,
        alt,
        isPlaceholder: false,
      },
      thumbs: galleryImages,
    };
  }

  function buildStockMessage(product) {
    const label = product.category || formatLabel(product.page) || "Nexra";
    return `In stock`;
  }

  function handleAddToCart() {
    if (!currentProduct || !state?.addToCart) {
      return;
    }

    state.addToCart({
      id: currentProduct.id || currentProduct.slug || `${currentProduct.page || "store"}-${state.slugify(currentProduct.title || "item")}`,
      slug: currentProduct.slug || null,
      page: currentProduct.page || "store",
      title: currentProduct.title || "Selected item",
      description: currentProduct.description || "",
      price: currentProduct.price || state.formatCurrency(currentProduct.priceValue || 0),
      priceValue: Number(currentProduct.priceValue || state.parsePriceValue(currentProduct.price || 0)) || 0,
      image: currentProduct.image || "/static/images/p7.png",
      quantity: currentQuantity,
    });

    feedback.hidden = false;
    feedback.className = "product-feedback is-success";
    feedback.textContent = `${currentProduct.title} was added to your cart with quantity ${currentQuantity}.`;
  }

  function formatLabel(value) {
    return String(value || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
