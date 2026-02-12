function requireAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) window.location.href = "/login";
  return { token, user: JSON.parse(user) };
}

const session = requireAuth();
const room = localStorage.getItem("room");
if (!room) window.location.href = "/rooms";

$("#whoami").text(`@${session.user.username}`);
$("#roomBadge").text(`Room: ${room}`);
$("#roomName").text(room);

$("#logoutBtn").on("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("room");
  window.location.href = "/login";
});

$("#leaveRoomBtn").on("click", () => {
  socket.emit("leaveRoom");
  localStorage.removeItem("room");
  window.location.href = "/rooms";
});

// connect socket with token
const socket = io({
  auth: { token: session.token },
});

socket.on("connect_error", (err) => {
  alert("Socket auth failed. Please login again.");
  localStorage.clear();
  window.location.href = "/login";
});

// join room
socket.emit("joinRoom", { room });

// UI helpers
function fmtTime(d) {
  const dt = new Date(d);
  return dt.toLocaleString();
}

function appendGroup(msgObj) {
  const isMe = msgObj.from_user === session.user.username;
  const line = $(`
    <div class="msg ${isMe ? "me" : "other"}">
      <div class="meta">
        <strong>${msgObj.from_user}</strong>
        <span class="time">${fmtTime(msgObj.date_sent)}</span>
      </div>
      <div class="bubble">${$("<div>").text(msgObj.message).html()}</div>
    </div>
  `);
  $("#groupChatBox").append(line);
  $("#groupChatBox").scrollTop($("#groupChatBox")[0].scrollHeight);
}

function appendSystem(text) {
  const line = $(`<div class="system">${$("<div>").text(text).html()}</div>`);
  $("#groupChatBox").append(line);
  $("#groupChatBox").scrollTop($("#groupChatBox")[0].scrollHeight);
}

function appendPrivate(msgObj) {
  const isMe = msgObj.from_user === session.user.username;
  const withUser = isMe ? msgObj.to_user : msgObj.from_user;

  // show only messages for currently selected private user
  const selected = $("#privateUser").val();
  if (!selected || selected !== withUser) return;

  const line = $(`
    <div class="msg ${isMe ? "me" : "other"}">
      <div class="meta">
        <strong>${msgObj.from_user}</strong>
        <span class="time">${fmtTime(msgObj.date_sent)}</span>
      </div>
      <div class="bubble">${$("<div>").text(msgObj.message).html()}</div>
    </div>
  `);
  $("#privateChatBox").append(line);
  $("#privateChatBox").scrollTop($("#privateChatBox")[0].scrollHeight);
}

// receive room history
socket.on("roomHistory", (history) => {
  $("#groupChatBox").empty();
  history.forEach(appendGroup);
});

// receive group messages
socket.on("groupMessage", (doc) => appendGroup(doc));
socket.on("systemMsg", (p) => appendSystem(p.message));

// send group message
$("#groupForm").on("submit", (e) => {
  e.preventDefault();
  const message = $("#groupMsg").val().trim();
  if (!message) return;
  socket.emit("groupMessage", { room, message });
  $("#groupMsg").val("");
});

// ----- PRIVATE CHAT -----
async function loadUsers() {
  const res = await fetch("/api/users", {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) {
    alert("Session expired. Login again.");
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  const data = await res.json();
  const select = $("#privateUser");
  select.empty();

  // add placeholder
  select.append(`<option value="" selected disabled>Select a user</option>`);

  data.users
    .filter((u) => u.username !== session.user.username)
    .forEach((u) => {
      select.append(`<option value="${u.username}">${u.username}</option>`);
    });
}

let typingTimeout = null;

$("#privateMsg").on("input", () => {
  const to_user = $("#privateUser").val();
  if (!to_user) return;

  socket.emit("privateTyping", { to_user, isTyping: true });

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("privateTyping", { to_user, isTyping: false });
  }, 700);
});

socket.on("privateTyping", ({ from_user, isTyping }) => {
  const selected = $("#privateUser").val();
  if (!selected || selected !== from_user) return;

  $("#typingLine").text(isTyping ? `${from_user} is typing...` : "");
});

$("#privateUser").on("change", () => {
  $("#privateChatBox").empty();
  $("#typingLine").text("");
});

$("#privateForm").on("submit", (e) => {
  e.preventDefault();
  const to_user = $("#privateUser").val();
  const message = $("#privateMsg").val().trim();
  if (!to_user) return alert("Select a user first");
  if (!message) return;

  socket.emit("privateMessage", { to_user, message });
  $("#privateMsg").val("");
  socket.emit("privateTyping", { to_user, isTyping: false });
});

socket.on("privateMessage", (doc) => appendPrivate(doc));

loadUsers();
