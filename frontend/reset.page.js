const API = "http://13.58.3.140:5000";
    const token = new URLSearchParams(window.location.search).get("token");
    const msg = document.getElementById("msg");

    function setMessage(text, isSuccess) {
      msg.textContent = text || "";
      msg.classList.toggle("success", Boolean(isSuccess));
    }

    if (!token) {
      setMessage("This reset link is missing or invalid. Please request a new password reset email.", false);
    }

    function handlePasswordReset(event) {
      event.preventDefault();
      resetPassword();
    }

    async function resetPassword() {
      if (!token) {
        setMessage("This reset link is missing or invalid. Please request a new password reset email.", false);
        return;
      }

      const newPassword = document.getElementById("password").value;

      const res = await fetch(`${API}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      const success = data.message && data.message.toLowerCase().includes("successful");
      setMessage(data.message || "We could not reset your password. Please try again.", success);

      if (success) {
        window.location.replace("login.html");
      }
    }

