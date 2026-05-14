
    const API = "http://3.148.247.91:5000";
    const msg = document.getElementById("msg");
    const signupButton = document.getElementById("signupButton");
    const passwordField = document.getElementById("password");
    const signupValidation = document.getElementById("signupValidation");
    const passwordGuide = document.getElementById("passwordGuide");
    const avatarPicker = document.getElementById("avatarPicker");
    let selectedAvatarId = "avatar-01";
    const AVATAR_OPTIONS = [
      { id: "avatar-01", skin: "#f2c7a5", hair: "#2f1b12", shirt: "#1c7c7d", bg: "#fde68a" },
      { id: "avatar-02", skin: "#e8b894", hair: "#3b2f2f", shirt: "#2f5d8a", bg: "#bfdbfe" },
      { id: "avatar-03", skin: "#c98b62", hair: "#1f2937", shirt: "#b45309", bg: "#fed7aa" },
      { id: "avatar-04", skin: "#8d5524", hair: "#111827", shirt: "#7c3aed", bg: "#ddd6fe" },
      { id: "avatar-05", skin: "#f1c27d", hair: "#7c2d12", shirt: "#dc2626", bg: "#fecaca" },
      { id: "avatar-06", skin: "#ffdbac", hair: "#0f172a", shirt: "#0891b2", bg: "#bae6fd" },
      { id: "avatar-07", skin: "#d8a47f", hair: "#4c1d95", shirt: "#6d28d9", bg: "#e9d5ff" },
      { id: "avatar-08", skin: "#ad7d52", hair: "#14532d", shirt: "#16a34a", bg: "#bbf7d0" },
      { id: "avatar-09", skin: "#f3c9b1", hair: "#831843", shirt: "#ec4899", bg: "#fbcfe8" },
      { id: "avatar-10", skin: "#7f5539", hair: "#4338ca", shirt: "#2563eb", bg: "#c7d2fe" },
      { id: "avatar-11", skin: "#edc4a3", hair: "#854d0e", shirt: "#ca8a04", bg: "#fef08a" },
      { id: "avatar-12", skin: "#c68642", hair: "#166534", shirt: "#059669", bg: "#a7f3d0" },
      { id: "avatar-13", skin: "#6a422d", hair: "#7f1d1d", shirt: "#ef4444", bg: "#fecdd3" },
      { id: "avatar-14", skin: "#f0c8a0", hair: "#1e293b", shirt: "#334155", bg: "#e2e8f0" },
      { id: "avatar-15", skin: "#b97a56", hair: "#92400e", shirt: "#f97316", bg: "#fdba74" },
      { id: "avatar-16", skin: "#f5d0b5", hair: "#065f46", shirt: "#0f766e", bg: "#99f6e4" },
      { id: "avatar-17", skin: "#a47148", hair: "#312e81", shirt: "#4f46e5", bg: "#c4b5fd" },
      { id: "avatar-18", skin: "#ffdbac", hair: "#374151", shirt: "#111827", bg: "#d1d5db" },
      { id: "avatar-19", skin: "#8b5e3c", hair: "#365314", shirt: "#65a30d", bg: "#d9f99d" },
      { id: "avatar-20", skin: "#deb887", hair: "#be123c", shirt: "#e11d48", bg: "#fda4af" }
    ];

    function avatarMarkup(avatarId) {
      const avatar = AVATAR_OPTIONS.find(option => option.id === avatarId) || AVATAR_OPTIONS[0];
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
          <rect width="128" height="128" rx="28" fill="${avatar.bg}"/>
          <circle cx="64" cy="48" r="28" fill="${avatar.skin}"/>
          <path d="M32 38c6-18 18-28 32-28s26 8 32 28v12H32V38Z" fill="${avatar.hair}"/>
          <circle cx="53" cy="49" r="3.5" fill="#1f2937"/>
          <circle cx="75" cy="49" r="3.5" fill="#1f2937"/>
          <path d="M56 63c4 4 12 4 16 0" stroke="#7c3f2a" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M24 120c4-26 22-38 40-38s36 12 40 38H24Z" fill="${avatar.shirt}"/>
        </svg>
      `.trim();
    }

    function avatarDataUri(avatarId) {
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(avatarMarkup(avatarId))}`;
    }

    function renderAvatarPicker() {
      avatarPicker.innerHTML = AVATAR_OPTIONS.map(option => `
        <button class="avatar-choice ${option.id === selectedAvatarId ? "active" : ""}" type="button" onclick="selectAvatar('${option.id}')">
          <img src="${avatarDataUri(option.id)}" alt="${option.id}">
        </button>
      `).join("");
    }

    function selectAvatar(avatarId) {
      selectedAvatarId = avatarId;
      renderAvatarPicker();
    }

    function setMessage(text, isSuccess) {
      msg.textContent = text || "";
      msg.classList.toggle("success", Boolean(isSuccess));
    }

    function setValidationMessage(text) {
      signupValidation.innerHTML = text ? `<strong>Almost there:</strong> ${text}` : "";
      signupValidation.classList.toggle("active", Boolean(text));
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function updatePasswordGuide(value) {
      passwordGuide.classList.toggle("active", value.length > 0);
      const rules = {
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[^A-Za-z0-9]/.test(value)
      };

      document.querySelectorAll("#passwordGuide .password-rule").forEach(rule => {
        rule.classList.toggle("valid", Boolean(rules[rule.dataset.rule]));
      });

      return Object.values(rules).every(Boolean);
    }

    function togglePasswordVisibility(inputId, buttonId) {
      const input = document.getElementById(inputId);
      const button = document.getElementById(buttonId);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Hide" : "Show";
    }

    function handleSignup(event) {
      event.preventDefault();
      signup();
    }

    async function signup() {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const avatarId = selectedAvatarId;

      setValidationMessage("");

      if (!isValidEmail(email)) {
        setValidationMessage("Enter a valid email address.");
        return;
      }

      if (!updatePasswordGuide(password)) {
        setMessage("Please create a stronger password using uppercase, lowercase, numeric, and special characters.", false);
        return;
      }

      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, avatarId })
      });

      const data = await res.json();
      const success = data.message && (
        data.message.toLowerCase().includes("success") ||
        data.message.toLowerCase().includes("created")
      );
      setMessage(data.message || "We could not create your account. Please try again.", success);

      if (success) {
        setTimeout(() => {
          window.location.href = "login.html";
        }, 700);
      }
    }

    passwordField.addEventListener("input", event => {
      updatePasswordGuide(event.target.value);
    });

    renderAvatarPicker();
  
