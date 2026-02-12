function showMsg(type, text) {
  $("#msg").removeClass("d-none alert-success alert-danger").addClass(`alert-${type}`).text(text);
}

$("#loginForm").on("submit", async function (e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(this).entries());

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg("danger", data.message || "Login failed");
      return;
    }

    // store session in localStorage (required by lab)
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showMsg("success", "Login successful. Redirecting...");
    setTimeout(() => (window.location.href = "/rooms"), 700);
  } catch (err) {
    showMsg("danger", err.message);
  }
});

$("#clearSession").on("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("localStorage cleared");
});

// If already logged in, go rooms
(function () {
  const token = localStorage.getItem("token");
  if (token) window.location.href = "/rooms";
})();
