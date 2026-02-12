function requireAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/login";
    return null;
  }

  try {
    return { token, user: JSON.parse(user) };
  } catch (e) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }
}

const session = requireAuth();
if (!session) throw new Error("No session");

$("#whoami").text(`@${session.user.username}`);

let selectedRoom = null;

$("#logoutBtn").on("click", () => {
  localStorage.clear();
  window.location.href = "/login";
});

async function loadRooms() {
  const res = await fetch("/api/rooms");
  if (!res.ok) throw new Error("Rooms API failed: " + res.status);

  const data = await res.json();
  if (!data.rooms || !Array.isArray(data.rooms)) throw new Error("Rooms JSON invalid");

  const list = $("#roomsList");
  list.empty();

  data.rooms.forEach((room) => {
    const li = $(`
      <li class="list-group-item d-flex justify-content-between align-items-center room-item" style="cursor:pointer">
        <span>${room}</span>
        <span class="badge bg-secondary">join</span>
      </li>
    `);

    li.on("click", () => {
      selectedRoom = room;
      $("#selectedRoom").text(room);
      $("#joinBtn").prop("disabled", false);
      $(".room-item").removeClass("active");
      li.addClass("active");
    });

    list.append(li);
  });
}

$("#joinBtn").on("click", () => {
  if (!selectedRoom) return;
  localStorage.setItem("room", selectedRoom);
  window.location.href = "/chat";
});

loadRooms().catch((e) => {
  console.error(e);
  alert(e.message);
});