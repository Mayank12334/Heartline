const API = "http://3.148.247.91:5000";
    const ADMIN_EMAIL = "admin@gmail.com";
    const msg = document.getElementById("msg");
    const loginValidation = document.getElementById("loginValidation");

    function setMessage(text, isSuccess) {
      msg.textContent = text || "";
      msg.classList.toggle("success", Boolean(isSuccess));
    }

    function setValidationMessage(element, text) {
      element.innerHTML = text ? `<strong>Check this field:</strong> ${text}` : "";
      element.classList.toggle("active", Boolean(text));
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getDashboardPathForUser(user) {
      const userEmail = String(user?.email || "").toLowerCase();
      return userEmail === ADMIN_EMAIL ? "admin.html" : "user.html";
    }

    function togglePasswordVisibility(inputId, buttonId) {
      const input = document.getElementById(inputId);
      const button = document.getElementById(buttonId);
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Hide" : "Show";
    }

    function handleLogin(event) {
      event.preventDefault();
      login();
    }

    async function login() {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      setValidationMessage(loginValidation, "");
      setMessage("", false);

      if (!isValidEmail(email)) {
        setValidationMessage(loginValidation, "Enter a valid email address in the format name@example.com.");
        return;
      }

      try {
        const res = await fetch(`${API}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.token) {
          const nextUser = data.user || { email };
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("dashboardPath", getDashboardPathForUser(nextUser));
          if (getDashboardPathForUser(nextUser) === "admin.html") {
            localStorage.setItem("adminToken", data.token);
          } else {
            localStorage.removeItem("adminToken");
          }
          setMessage("Signed in successfully.", true);
          window.location.replace(getDashboardPathForUser(nextUser));
          return;
        }

        setMessage(data.message || "Unable to sign in. Please check your email and password and try again.", false);
      } catch (error) {
        setMessage("The server could not be reached. Please make sure your backend is running.", false);
      }
    }
