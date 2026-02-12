$("#signupForm").on("submit", async function (e) {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(this).entries());

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    const msg = $("#msg");
    msg.removeClass("d-none alert-success alert-danger");

    if (!res.ok) {
      msg.addClass("alert-danger").text(data.message || "Signup failed");
      return;
    }

    msg.addClass("alert-success").text("Signup successful. Redirecting to login...");
    setTimeout(() => (window.location.href = "/login"), 900);
  } catch (err) {
    $("#msg").removeClass("d-none").addClass("alert alert-danger").text(err.message);
  }
});
