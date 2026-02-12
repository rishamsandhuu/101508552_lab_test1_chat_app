function requireAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) window.location.href = "/login";
  return { token, user: JSON.parse(user) };
}

const session = requireAuth();
$("#whoami").text(`@${session.user.username}`);

let selectedRoom = null;

$("#logoutBtn").on("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("room");
  window.location.href = "/login";
});

async function loadRooms() {
  const res = await fetch("/api/rooms");
  const data = await res.json();

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

loadRooms();
