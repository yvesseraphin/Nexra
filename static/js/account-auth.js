(function () {
  const form = document.querySelector(".login-form[data-auth-mode]");
  const state = window.NexraState;

  if (!form) {
    return;
  }

  const mode = form.dataset.authMode;
  const params = new URLSearchParams(window.location.search);
  const redirectTarget = params.get("redirect");
  const feedback = document.getElementById("auth-feedback");
  const identifierInput = form.querySelector('input[name="identifier"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const identifierWrapper = identifierInput?.closest(".input-wrapper");
  const emailStatus = identifierWrapper?.querySelector("[data-email-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector("[data-submit-label]");
  const endpoint = (state?.buildApiUrl || buildApiUrl)(mode === "signup" ? "/api/auth/signup" : "/api/auth/login");
  const defaultLabel = submitLabel ? submitLabel.textContent.trim() : submitButton.textContent.trim();
  const loadingLabel = mode === "signup" ? "Creating account..." : "Signing in...";
  const successLabel = mode === "signup" ? "Account created. Redirecting..." : "Login successful. Redirecting...";
  const toastHost = ensureToastHost();

  form.addEventListener("submit", handleSubmit);
  identifierInput?.addEventListener("input", handleFieldEdit);
  passwordInput?.addEventListener("input", handleFieldEdit);
  updateIdentifierState();

  async function handleSubmit(event) {
    event.preventDefault();
    clearFeedback();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
      showFeedback("Enter your email or phone number and password.", true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const payload = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }

      if (payload.token) {
        localStorage.setItem("nexra_token", payload.token);
        if (typeof state?.setCurrentUser === "function") {
          state.setCurrentUser(payload.user);
        } else {
          localStorage.setItem("nexra_user", JSON.stringify(payload.user));
        }
        state?.migrateGuestStateToUser(payload.user);
        showFeedback(payload.message || successLabel, false);

        window.setTimeout(() => {
          const nextTarget = redirectTarget || state?.consumePostAuthRedirect?.() || "index.html";
          window.location.href = nextTarget;
        }, 900);
        return;
      }

      localStorage.removeItem("nexra_token");
      if (typeof state?.setCurrentUser === "function") {
        state.setCurrentUser(null);
      } else {
        localStorage.removeItem("nexra_user");
      }
      showFeedback(payload.message || "Account created. Continue with login once the account is confirmed.", false);

      window.setTimeout(() => {
        const nextTarget = redirectTarget ? `login.html?redirect=${encodeURIComponent(redirectTarget)}` : "login.html";
        window.location.href = nextTarget;
      }, 1400);
    } catch (error) {
      showFeedback(error.message || "The server is unavailable right now.", true);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;

    if (submitLabel) {
      submitLabel.textContent = isLoading ? loadingLabel : defaultLabel;
    }
  }

  // Uses toast host to display messages nicely
  function showFeedback(message, isError) {
    clearFeedback();
    showToast(message, isError ? "error" : "success");
  }

  function clearFeedback() {
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = "";
      feedback.classList.remove("is-error", "is-success");
    }

    clearToasts();
  }

  function handleFieldEdit() {
    clearFeedback();
    updateIdentifierState();
  }

  function updateIdentifierState() {
    if (!identifierWrapper || !emailStatus || !identifierInput) {
      return;
    }

    const identifier = identifierInput.value.trim();
    const hasValidEmail = isValidEmail(identifier);

    identifierWrapper.classList.toggle("has-valid-email", hasValidEmail);
    emailStatus.hidden = !hasValidEmail;
  }

  // Regex validation
  function isValidEmail(value) {
    if (!value || /\s/.test(value)) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function readApiResponse(response) {
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      return response.json().catch(() => ({}));
    }

    const rawText = await response.text().catch(() => "");
    return {
      error: extractTextError(rawText),
      rawText,
    };
  }

  function getErrorMessage(payload, status) {
    if (payload?.error) {
      return payload.error;
    }

    if (status === 404) {
      return "Auth service was not found. Open the site on http://localhost:3000 or restart the backend server.";
    }

    if (status >= 500) {
      return "The server hit an error while processing your request.";
    }

    return "We could not complete your request.";
  }

  function extractTextError(rawText) {
    const text = String(rawText || "").replace(/\s+/g, " ").trim();

    if (!text) {
      return "";
    }

    if (/<[a-z][\s\S]*>/i.test(text)) {
      return "";
    }

    return text.slice(0, 220);
  }

  function showToast(message, tone) {
    if (!toastHost) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = `auth-toast is-${tone}`;
    toast.setAttribute("role", tone === "error" ? "alert" : "status");
    toast.innerHTML = `
      <span class="auth-toast-icon" aria-hidden="true">
        <i class="fas ${tone === "error" ? "fa-circle-exclamation" : "fa-check"}"></i>
      </span>
      <span class="auth-toast-message"></span>
      <button type="button" class="auth-toast-close" aria-label="Dismiss notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    const messageNode = toast.querySelector(".auth-toast-message");
    const closeButton = toast.querySelector(".auth-toast-close");

    if (messageNode) {
      messageNode.textContent = message;
    }

    const dismiss = () => {
      toast.classList.add("is-leaving");
      window.setTimeout(() => {
        toast.remove();
      }, 220);
    };

    closeButton?.addEventListener("click", dismiss);
    toastHost.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-visible");
    }, 10);

    window.setTimeout(dismiss, tone === "error" ? 4200 : 2600);
  }

  function ensureToastHost() {
    let host = document.querySelector("[data-auth-toast-host]");

    if (host) {
      return host;
    }

    host = document.createElement("div");
    host.className = "auth-toast-host";
    host.setAttribute("data-auth-toast-host", "true");
    document.body.appendChild(host);
    return host;
  }

  // Clears active toasts
  function clearToasts() {
    toastHost?.querySelectorAll(".auth-toast").forEach((toast) => {
      toast.remove();
    });
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
})();
