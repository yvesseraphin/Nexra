(function () {
  const page = document.body.dataset.page;

  if (!page) {
    return;
  }

  document.addEventListener("DOMContentLoaded", initStorefront);

  async function initStorefront() {
    try {
      const response = await fetch(`/api/pages/${page}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Failed to load page data for ${page}`);
      }

      const payload = await response.json();
      renderPage(payload.sections || {});
    } catch (error) {
      console.error("Unable to render dynamic storefront content.", error);
      showLoadError(page);
    }
  }

  function renderPage(sections) {
    const renderers = {
      accessories: renderAccessoriesPage,
      beauty: renderBeautyPage,
      fashion: renderFashionPage,
      food: renderFoodPage,
      index: renderIndexPage,
      kids: renderKidsPage,
      tech: renderTechPage,
    };

    const renderer = renderers[page];

    if (renderer) {
      renderer(sections);
      window.dispatchEvent(
        new CustomEvent("nexra:storefront-rendered", {
          detail: { page },
        })
      );
    }
  }

  function renderIndexPage(sections) {
    renderStandardProductGrid("index-deals-grid", sections.todayBestDeals?.items || [], true);
    renderStandardProductGrid("index-best-sellers-grid", sections.bestSellers?.items || [], true);
  }

  function renderTechPage(sections) {
    renderStandardProductGrid("tech-trending-grid", sections.trendingProducts?.items || [], false);
    renderStandardProductGrid("tech-best-sellers-grid", sections.bestSellers?.items || [], false);
  }

  function renderKidsPage(sections) {
    renderStandardProductGrid("kids-deals-grid", sections.todayBestDeals?.items || [], true);
    renderStandardProductGrid("kids-toys-grid", sections.toyHighlights?.items || [], true);
  }

  function renderBeautyPage(sections) {
    const trendingGrid = document.getElementById("beauty-trending-grid");
    const collectionsGrid = document.getElementById("beauty-collections-grid");

    if (trendingGrid) {
      trendingGrid.innerHTML = (sections.trendingProducts?.items || [])
        .map((item) => {
          return `
            <div class="product-card">
              <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.title)}" class="product-image">
              <div class="product-info">
                <h3 class="product-title">${escapeHtml(item.title)}</h3>
                <p class="product-description">${escapeHtml(item.description)}</p>
                <div class="product-footer">
                  <span class="product-price">${escapeHtml(item.price)}</span>
                  <button class="add-to-cart-btn">Add To Cart</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (collectionsGrid) {
      collectionsGrid.innerHTML = (sections.collections?.items || [])
        .map((item) => {
          return `
            <div class="collection-card">
              <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.title)}" class="collection-image">
              <div class="collection-info">
                <h3 class="collection-title">${escapeHtml(item.title)}</h3>
                <p class="collection-subtitle">${escapeHtml(item.description)}</p>
                <div class="product-footer">
                  <span class="product-price">${escapeHtml(item.price)}</span>
                  <button class="add-to-cart-btn">Add To Cart</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  function renderFoodPage(sections) {
    const popularGrid = document.getElementById("food-popular-grid");
    const dealsGrid = document.getElementById("food-deals-grid");

    if (popularGrid) {
      popularGrid.innerHTML = (sections.popularProducts?.items || [])
        .map((item) => {
          return `
            <div class="col-lg-4 col-md-6">
              <div class="product-card">
                <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.title)}" class="product-image">
                <div class="product-info">
                  <span class="product-category">${escapeHtml(item.category)}</span>
                  <h6 class="product-title">${escapeHtml(item.title)}</h6>
                  <div class="product-bottom">
                    <span class="product-price">${escapeHtml(item.price)}</span>
                    <button class="add-btn">
                      <i class="fas fa-shopping-cart"></i> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (dealsGrid) {
      dealsGrid.innerHTML = (sections.dealsOfDay?.items || [])
        .map((item) => {
          return `
            <div class="images-deals">
              <img src="${escapeAttribute(item.image)}" class="deals-day-image" alt="${escapeAttribute(item.alt || item.title)}">
              <div class="deals-day-text-content">
                <p>${escapeHtml(item.title)}</p>
                <span class="product-price">${escapeHtml(item.price)}</span>
                <button class="add-btn">
                  <i class="fas fa-shopping-cart"></i> Add
                </button>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  function renderFashionPage(sections) {
    const collectionsGrid = document.getElementById("fashion-collections-grid");
    const mostPopularGrid = document.getElementById("fashion-most-popular-grid");
    const justForYouGrid = document.getElementById("fashion-just-for-you-grid");

    if (collectionsGrid) {
      collectionsGrid.innerHTML = (sections.collections?.groups || [])
        .map((group) => {
          const items = (group.items || [])
            .map((item) => {
              return `
                <div class="collection-item">
                  <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || group.title)}">
                </div>
              `;
            })
            .join("");

          return `
            <div class="collection-box">
              <div class="collection-header">
                <h2 class="collection-title">${escapeHtml(group.title)}</h2>
                <a href="${escapeAttribute(group.href || "#")}" class="view-all-btn">&#8594;</a>
              </div>
              <div class="collection-items">
                ${items}
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (mostPopularGrid) {
      mostPopularGrid.innerHTML = (sections.mostPopular?.items || [])
        .map((item) => {
          return `
            <div class="product-card">
              <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || "Fashion item")}" class="product-image">
              <div class="product-info">
                <div class="product-meta">
                  <div class="product-price">
                    ${escapeHtml(item.price)}
                    <button class="favorite-btn">&#9825;</button>
                  </div>
                </div>
              </div>
              <span class="product-badge ${escapeAttribute(item.badgeClass || "")}">${escapeHtml(item.badgeLabel || "")}</span>
            </div>
          `;
        })
        .join("");
    }

    if (justForYouGrid) {
      justForYouGrid.innerHTML = (sections.justForYou?.items || [])
        .map((item) => {
          return `
            <div class="product-card">
              <div class="product-image-wrapper">
                <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || "Fashion item")}">
              </div>
              <div class="product-details">
                <p class="product-description">${escapeHtml(item.description)}</p>
                <p class="product-price">${escapeHtml(item.price)}</p>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  function renderAccessoriesPage(sections) {
    const monthlyDealsGrid = document.getElementById("accessories-monthly-deals-grid");
    const columnsGrid = document.getElementById("accessories-columns-grid");

    if (monthlyDealsGrid) {
      monthlyDealsGrid.innerHTML = (sections.monthlyDeals?.items || [])
        .map((item) => {
          return `
            <div class="col-lg-3 col-md-6">
              <div class="deal-card">
                <div class="deal-image-wrapper">
                  <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.title)}" class="deal-image">
                  <button class="add-to-cart-overlay">
                    <i class="bx bx-cart"></i> Add to cart
                  </button>
                </div>
                <div class="deal-info">
                  <h3 class="deal-title">${escapeHtml(item.title)}</h3>
                  <p class="deal-desc">${escapeHtml(item.description)}</p>
                  <p class="deal-price">${escapeHtml(item.price)}</p>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (columnsGrid) {
      columnsGrid.innerHTML = (sections.productColumns?.columns || [])
        .map((column) => {
          const items = (column.items || [])
            .map((item) => {
              return `
                <div class="product-grid-item">
                  <div class="product-grid-image">
                    <img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.alt || item.title)}">
                  </div>
                  <div class="product-grid-info">
                    <h4 class="product-grid-title">${escapeHtml(item.title)}</h4>
                    <p class="product-grid-price">${escapeHtml(item.price)}</p>
                  </div>
                </div>
              `;
            })
            .join("");

          return `
            <div class="col-lg-4 col-md-6">
              <h3 class="category-heading">${escapeHtml(column.title)}</h3>
              ${items}
            </div>
          `;
        })
        .join("");
    }
  }

  function renderStandardProductGrid(containerId, items, showDescription) {
    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    container.innerHTML = items
      .map((item) => {
        return `
          <div class="col-md-4">
            <div class="card product-card">
              <img src="${escapeAttribute(item.image)}" class="product-image" alt="${escapeAttribute(item.alt || item.title)}">
              <div class="card-body">
                <h5>${escapeHtml(item.title)}</h5>
                ${showDescription ? `<p class="product-description">${escapeHtml(item.description || "")}</p>` : ""}
                <p class="product-price">${escapeHtml(item.price)}</p>
                <button class="add-btn"><i class="fas fa-shopping-cart"></i> Add</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function showLoadError(currentPage) {
    const errorTargets = {
      accessories: ["accessories-monthly-deals-grid", "accessories-columns-grid"],
      beauty: ["beauty-trending-grid", "beauty-collections-grid"],
      fashion: ["fashion-collections-grid", "fashion-most-popular-grid", "fashion-just-for-you-grid"],
      food: ["food-popular-grid", "food-deals-grid"],
      index: ["index-deals-grid", "index-best-sellers-grid"],
      kids: ["kids-deals-grid", "kids-toys-grid"],
      tech: ["tech-trending-grid", "tech-best-sellers-grid"],
    };

    (errorTargets[currentPage] || []).forEach((targetId) => {
      const target = document.getElementById(targetId);
      if (target && !target.innerHTML.trim()) {
        target.innerHTML = `<p class="text-center w-100">Unable to load products right now.</p>`;
      }
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
