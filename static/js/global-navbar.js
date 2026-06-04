function buildSharedNavbar() {
  return `
    <nav class="navbar shared-navbar" data-shared-navbar>
      <div class="navbar-shell">
        <a class="navbar-brand" href="/">
          <img src="/static/images/Gemini_Generated_Image_6s41iq6s41iq6s41-removebg-preview 1.png" alt="Nexra Logo">
          <span class="brand-name">Nexra</span>
        </a>
        <button class="navbar-toggler" type="button" aria-expanded="false" aria-label="Toggle navigation" data-navbar-toggle>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="navbar-menu" data-navbar-menu>
          <ul class="navbar-nav navbar-center-nav">
            <li class="nav-item">
              <a class="nav-link nav-home-link" href="/">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link nav-cart-link" href="/cart/">Cart</a>
            </li>
            <li class="nav-item dropdown">
              <button class="nav-link dropdown-toggle" type="button" aria-expanded="false" data-dropdown-toggle>
                Categories
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="/store/food/" data-page-link="food">Food</a></li>
                <li><a class="dropdown-item" href="/store/tech/" data-page-link="tech">Tech</a></li>
                <li><a class="dropdown-item" href="/store/fashion/" data-page-link="fashion">Fashion</a></li>
                <li><a class="dropdown-item" href="/store/beauty/" data-page-link="beauty">Beauty</a></li>
                <li><a class="dropdown-item" href="/store/kids/" data-page-link="kids">Kids</a></li>
                <li><a class="dropdown-item" href="/store/accessories/" data-page-link="accessories">Accessories</a></li>
              </ul>
            </li>
          </ul>
          <ul class="navbar-nav navbar-actions">
            <li class="nav-item nav-action">
              <a href="/accounts/login/" class="btn-login">Login</a>
            </li>
            <li class="nav-item nav-action">
              <a href="/accounts/signup/" class="btn-get-started">Get started</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const desktopBreakpoint = 991;
  const page = document.body?.dataset?.page || "";
  const pagesNeedingInjection = new Set(["fashion", "beauty", "cart", "profile", "product"]);
  const state = window.NexraState;
  const categoryIcons = {
    food: "bx bx-bowl-hot",
    tech: "bx bx-laptop",
    fashion: "bx bx-t-shirt",
    beauty: "bx bx-spa",
    kids: "bx bx-joystick",
    accessories: "bx bx-shopping-bag",
  };

  if (!document.querySelector(".shared-navbar") && pagesNeedingInjection.has(page)) {
    const legacyHeader = document.querySelector("body > header");
    legacyHeader?.remove();
    document.body.insertAdjacentHTML("afterbegin", buildSharedNavbar());
  }

  if (document.querySelector(".shared-navbar")) {
    document.body.classList.add("has-shared-navbar");
  }

  document.querySelectorAll(".shared-navbar").forEach((navbar) => {
    const toggler = navbar.querySelector("[data-navbar-toggle]");
    const dropdownItem = navbar.querySelector(".nav-item.dropdown");
    const dropdownToggle = navbar.querySelector("[data-dropdown-toggle]");
    const homeLink = navbar.querySelector(".nav-home-link");
    const currentCategoryLink = navbar.querySelector(`[data-page-link="${page}"]`);

    ensureBrand(navbar);
    enhanceDropdown(navbar, categoryIcons);
    syncCartLink(navbar, page, state);
    syncAuthActions(navbar, page, state);

    const closeDropdown = () => {
      if (!dropdownItem || !dropdownToggle) {
        return;
      }

      dropdownItem.classList.remove("is-open");
      dropdownToggle.setAttribute("aria-expanded", "false");
    };

    const closeMenu = () => {
      navbar.classList.remove("is-open");
      if (toggler) {
        toggler.setAttribute("aria-expanded", "false");
      }
    };

    const closeAll = () => {
      closeDropdown();
      closeMenu();
    };

    if (page === "index" && homeLink) {
      homeLink.classList.add("is-current");
      homeLink.setAttribute("aria-current", "page");
    }

    if (currentCategoryLink) {
      currentCategoryLink.classList.add("is-current");
      currentCategoryLink.setAttribute("aria-current", "page");
      dropdownToggle?.classList.add("is-current");
    }

    toggler?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = navbar.classList.toggle("is-open");
      toggler.setAttribute("aria-expanded", String(isOpen));

      if (!isOpen) {
        closeDropdown();
      }
    });

    dropdownToggle?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = dropdownItem?.classList.toggle("is-open");
      dropdownToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });

    navbar.querySelectorAll(".dropdown-item").forEach((link) => {
      link.addEventListener("click", () => {
        closeDropdown();
        if (window.innerWidth <= desktopBreakpoint) {
          closeMenu();
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!navbar.contains(event.target)) {
        closeAll();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > desktopBreakpoint) {
        closeMenu();
      }
    });
  });

  window.addEventListener("nexra:cart-updated", () => {
    document.querySelectorAll(".shared-navbar").forEach((navbar) => {
      syncCartLink(navbar, page, state);
    });
  });

  window.addEventListener("nexra:user-updated", () => {
    document.querySelectorAll(".shared-navbar").forEach((navbar) => {
      syncAuthActions(navbar, page, state);
    });
  });
});

function ensureBrand(navbar) {
  const brand = navbar.querySelector(".navbar-brand");

  if (!brand || brand.querySelector(".brand-name")) {
    return;
  }

  brand.insertAdjacentHTML("beforeend", '<span class="brand-name">Nexra</span>');
}

function enhanceDropdown(navbar, categoryIcons) {
  const dropdownToggle = navbar.querySelector("[data-dropdown-toggle]");

  if (dropdownToggle && !dropdownToggle.querySelector(".dropdown-caret")) {
    dropdownToggle.insertAdjacentHTML(
      "beforeend",
      '<i class="bx bx-chevron-down dropdown-caret" aria-hidden="true"></i>'
    );
  }

  navbar.querySelectorAll(".dropdown-item[data-page-link]").forEach((link) => {
    const category = link.dataset.pageLink;
    const label = link.textContent.trim();

    if (link.querySelector(".dropdown-page-icon")) {
      return;
    }

    link.textContent = "";
    link.insertAdjacentHTML(
      "beforeend",
      `<i class="${categoryIcons[category] || "bx bx-grid-alt"} dropdown-page-icon" aria-hidden="true"></i><span class="dropdown-item-label">${label}</span>`
    );
  });
}

function syncCartLink(navbar, page, state) {
  const cartLink = navbar.querySelector(".nav-cart-link") || findNavLink(navbar, "Cart");

  if (!cartLink) {
    return;
  }

  cartLink.classList.add("nav-cart-link");
  cartLink.href = "/cart/";
  cartLink.textContent = "Cart";
  cartLink.classList.toggle("is-current", page === "cart");
  cartLink.toggleAttribute("aria-current", page === "cart");

  const count = state?.getCartCount?.() || 0;
  const existingBadge = cartLink.querySelector(".nav-count");

  if (existingBadge) {
    existingBadge.remove();
  }

  if (count > 0) {
    cartLink.insertAdjacentHTML("beforeend", `<span class="nav-count">${count}</span>`);
  }
}

function syncAuthActions(navbar, page, state) {
  const user = state?.getCurrentUser?.() || null;
  const navList = navbar.querySelector(".navbar-actions") || navbar.querySelector(".navbar-nav");
  const contactItem = navbar.querySelector(".nav-contact-item") || findNavItem(navbar, "Contact");
  const loginItem = navbar.querySelector(".btn-login")?.closest(".nav-item");
  const signupItem = navbar.querySelector(".btn-get-started")?.closest(".nav-item");
  const existingProfileItem = navbar.querySelector(".nav-profile");
  const currentPath = state?.getCurrentPath?.() || "/";

  if (user) {
    contactItem?.remove();
    loginItem?.remove();
    signupItem?.remove();

    if (!existingProfileItem && navList) {
      navList.insertAdjacentHTML(
        "beforeend",
        `
          <li class="nav-item nav-profile">
            <a href="/accounts/profile/" class="profile-link" aria-label="Open your profile">
              <span class="profile-avatar"></span>
            </a>
          </li>
        `
      );
    }

    const profileLink = navbar.querySelector(".profile-link");
    const profileAvatar = navbar.querySelector(".profile-avatar");

    if (profileLink && profileAvatar) {
      const avatarUrl = state?.getUserAvatarUrl?.(user) || "";

      profileAvatar.textContent = "";
      profileAvatar.classList.toggle("has-image", Boolean(avatarUrl));

      if (avatarUrl) {
        const image = document.createElement("img");
        image.src = avatarUrl;
        image.alt = "";
        image.loading = "lazy";
        profileAvatar.appendChild(image);
      } else {
        profileAvatar.textContent = state?.getUserInitials?.(user) || "NX";
      }

      profileLink.classList.toggle("is-current", page === "profile");
      profileLink.toggleAttribute("aria-current", page === "profile");
      profileLink.title = state?.getUserDisplayName?.(user) || "Profile";
    }

    return;
  }

  existingProfileItem?.remove();

  const loginLink = navbar.querySelector(".btn-login");
  const signupLink = navbar.querySelector(".btn-get-started");

  if (loginLink) {
    loginLink.href = `/accounts/login/?redirect=${encodeURIComponent(currentPath)}`;
  }

  if (signupLink) {
    signupLink.href = `/accounts/signup/?redirect=${encodeURIComponent(currentPath)}`;
  }
}

function findNavItem(navbar, label) {
  return Array.from(navbar.querySelectorAll(".nav-item")).find((item) => {
    const text = item.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    return text === label.toLowerCase();
  });
}

function findNavLink(navbar, label) {
  return Array.from(navbar.querySelectorAll(".nav-link")).find((link) => {
    const text = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    return text.startsWith(label.toLowerCase());
  });
}
