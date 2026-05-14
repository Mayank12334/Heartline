const API = "http://3.148.247.91:5000";
    const msg = document.getElementById("msg");
    const forgotValidation = document.getElementById("forgotValidation");

    function setMessage(text, isSuccess) {
      msg.textContent = text || "";
      msg.classList.toggle("success", Boolean(isSuccess));
    }

    function setValidationMessage(text) {
      forgotValidation.innerHTML = text ? `<strong>Check this field:</strong> ${text}` : "";
      forgotValidation.classList.toggle("active", Boolean(text));
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function handleResetRequest(event) {
      event.preventDefault();
      sendResetLink();
    }

    async function sendResetLink() {
      const email = document.getElementById("email").value.trim();
      setValidationMessage("");

      if (!isValidEmail(email)) {
        setValidationMessage("Enter a valid email address before requesting a reset link.");
        return;
      }

      try {
        const res = await fetch(`${API}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        const success = data.message && data.message.toLowerCase().includes("sent");
        setMessage(data.message || "We could not send the reset link. Please try again.", success);
      } catch (error) {
        setMessage("Something went wrong while sending your request. Please try again.", false);
      }
    }

