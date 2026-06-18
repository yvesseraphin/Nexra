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
  const fullNameInput = form.querySelector('input[name="fullName"]');
  const identifierWrapper = identifierInput?.closest(".input-wrapper");
  const emailStatus = identifierWrapper?.querySelector("[data-email-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector("[data-submit-label]");
  const endpoint = (state?.buildApiUrl || buildApiUrl)(mode === "signup" ? "/api/auth/signup/" : "/api/auth/login/");
  const defaultLabel = submitLabel ? submitLabel.textContent.trim() : submitButton.textContent.trim();
  const loadingLabel = mode === "signup" ? "Creating account..." : "Signing in...";
  const successLabel = mode === "signup" ? "Account created. Redirecting..." : "Login successful. Redirecting...";
  form.addEventListener("submit", handleSubmit);
  identifierInput?.addEventListener("input", handleFieldEdit);
  passwordInput?.addEventListener("input", handleFieldEdit);
  updateIdentifierState();

  async function handleSubmit(event) {
    event.preventDefault();
    clearFeedback();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;
    const fullName = fullNameInput ? fullNameInput.value.trim() : "";

    if (!identifier || !password) {
      showFeedback("Enter your email or phone number and password.", true);
      return;
    }

    if (mode === "signup" && !fullName) {
      showFeedback("Please enter your full name.", true);
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
          fullName,
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
          const nextTarget = redirectTarget || state?.consumePostAuthRedirect?.() || "/";
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
        const nextTarget = redirectTarget ? `/accounts/login/?redirect=${encodeURIComponent(redirectTarget)}` : "/accounts/login/";
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

  // Uses NexraNotify to display the global top bar
  function showFeedback(message, isError) {
    clearFeedback();
    if (window.NexraNotify) {
      window.NexraNotify.show(message, isError ? "error" : "success");
    }
  }

  function clearFeedback() {
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = "";
      feedback.classList.remove("is-error", "is-success");
    }
    if (window.NexraNotify) {
      window.NexraNotify.hide();
    }
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

  function buildApiUrl(path) {
    const normalizedPath = String(path || "");
    const { protocol } = window.location;

    if (protocol === "file:") {
      return `http://localhost:8000${normalizedPath}`;
    }

    // Same origin — let Django handle it
    return normalizedPath;
  }
})();
