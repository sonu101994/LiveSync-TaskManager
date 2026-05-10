// ================= SOCKET =================
const socket = io("http://localhost:5000");

// ================= USER DATA =================
const userId = sessionStorage.getItem("userId");
const role = sessionStorage.getItem("role");
const username = sessionStorage.getItem("username");

// Protect page
if (!userId) {
  window.location.href = "index.html";
}

// ================= STATE =================
let selectedPriority = "medium";

// ================= INIT =================
setUserAvatar();
loadTasks();

// ================= REALTIME =================
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("tasksUpdated", () => {
  console.log("Realtime task update received");
  loadTasks();
});

// ================= AUTH =================
function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("role");

  window.location.href = "index.html";
}

// ================= PRIORITY =================
function selectPriority(value) {
  selectedPriority = value;
}

// ================= LOAD TASKS =================
async function loadTasks() {

  try {

    const tasks = await apiRequest(`/tasks`);

    document.getElementById("backlog").innerHTML = "";
    document.getElementById("todo").innerHTML = "";
    document.getElementById("inprogress").innerHTML = "";
    document.getElementById("completed").innerHTML = "";

    if (!tasks || tasks.length === 0) return;

    tasks.map((task) => {

      let columnId;

      if (task.status === "backlog") {
        columnId = "backlog";
      }
      else if (task.status === "pending") {
        columnId = "todo";
      }
      else if (task.status === "in-progress") {
        columnId = "inprogress";
      }
      else {
        columnId = "completed";
      }

      document
        .getElementById(columnId)
        .appendChild(createTaskCard(task));

    });

  } catch (error) {

    console.log(error);

  }
}

// ================= CREATE TASK =================
async function createTask() {

  const title = document.getElementById("taskInput").value.trim();
  const description = document.getElementById("descInput").value.trim();
  const dueDate = document.getElementById("dueDate").value;

  if (!title) {
    showToast("Title required ❌");
    return;
  }

  try {

    await apiRequest("/tasks", "POST", {
      title,
      description,
      priority: selectedPriority,
      dueDate,
    });

    document.getElementById("taskInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("dueDate").value = "";

    document.getElementById("prioritySelect").value = "medium";
    selectedPriority = "medium";

    showToast("Task added ✅");

  } catch (error) {

    showToast("Task creation failed ❌");
    console.log(error);

  }
}

// ================= TASK CARD =================
function createTaskCard(task) {

  const div = document.createElement("div");

  div.className = "task-card";
  div.dataset.id = task._id;

  const isOwner =
    String(task.createdBy?._id || task.createdBy) === String(userId);

  const nextStatus = getNextStatus(task.status);

  const nextTextMap = {
    pending: "To Do",
    "in-progress": "In Progress",
    completed: "Completed",
    backlog: "Backlog",
  };

  const nextText = nextTextMap[nextStatus] || "Backlog";

  // TITLE
  const titleEl = document.createElement("div");
  titleEl.className = "task-title";
  titleEl.textContent = task.title;

  // DESCRIPTION
  const descEl = document.createElement("div");
  descEl.className = "task-desc";
  descEl.textContent = task.description || "";

  // USERS
  const usersContainer = document.createElement("div");
  usersContainer.className = "task-users";

  // Creator
  if (task.createdBy) {

    const creator = document.createElement("div");

    creator.className = "user-badge creator-badge";

    creator.innerHTML =
      `<i class="bi bi-award-fill"></i> ${task.createdBy.username || "Creator"}`;

    usersContainer.appendChild(creator);
  }

  // Assigned users
  if (task.users && task.users.length > 0) {

    task.users.map((u) => {

      const userBadge = document.createElement("div");
      userBadge.className = "user-badge";

      const icon = document.createElement("i");
      icon.className = "bi bi-person-fill";

      const name = document.createElement("span");
      name.textContent = u.username || "User";

      userBadge.appendChild(icon);
      userBadge.appendChild(name);

      // Remove user
      if (isOwner || role === "admin") {

        const removeIcon = document.createElement("i");

        removeIcon.className =
          "bi bi-x-circle ms-1 text-danger";

        removeIcon.style.cursor = "pointer";

        removeIcon.addEventListener("click", () => {
          removeUser(task._id, u._id);
        });

        userBadge.appendChild(removeIcon);
      }

      usersContainer.appendChild(userBadge);

    });

  } else {

    const noUser = document.createElement("span");

    noUser.className = "no-user";
    noUser.textContent = "No users";

    usersContainer.appendChild(noUser);

  }

  // PRIORITY
  const footer1 = document.createElement("div");
  footer1.className = "task-footer";

  const priority = document.createElement("span");

  priority.className = `priority-${task.priority}`;
  priority.textContent = task.priority;

  footer1.appendChild(priority);

  // ACTIONS
  const footer2 = document.createElement("div");
  footer2.className = "task-footer";

  // Move
  const moveBtn = document.createElement("button");

  moveBtn.className = "move-btn-text";
  moveBtn.textContent = `Move to ${nextText} →`;

  moveBtn.addEventListener("click", () => {
    moveTask(task._id, task.status);
  });

  footer2.appendChild(moveBtn);

  // Owner/Admin actions
  if (isOwner || role === "admin") {

    // Edit
    const editBtn = document.createElement("button");

    editBtn.className = "icon-btn";
    editBtn.innerHTML = `<i class="bi bi-pencil"></i>`;

    editBtn.addEventListener("click", () => {
      editTask(task._id, task.title, task.description);
    });

    // Add user
    const addBtn = document.createElement("button");

    addBtn.className = "icon-btn";
    addBtn.innerHTML = `<i class="bi bi-person-plus"></i>`;

    addBtn.addEventListener("click", () => {
      addUser(task._id);
    });

    // Delete
    const deleteBtn = document.createElement("button");

    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.innerHTML = `<i class="bi bi-trash"></i>`;

    deleteBtn.addEventListener("click", () => {
      deleteTask(task._id);
    });

    footer2.appendChild(editBtn);
    footer2.appendChild(addBtn);
    footer2.appendChild(deleteBtn);
  }

  // APPEND
  div.appendChild(titleEl);
  div.appendChild(descEl);
  div.appendChild(usersContainer);
  div.appendChild(footer1);
  div.appendChild(footer2);

  return div;
}

// ================= STATUS FLOW =================
function getNextStatus(status) {

  if (status === "backlog") return "pending";

  if (status === "pending") return "in-progress";

  if (status === "in-progress") return "completed";

  return "backlog";
}

// ================= MOVE TASK =================
async function moveTask(id, currentStatus) {

  const nextStatus = getNextStatus(currentStatus);

  try {

    await apiRequest(`/tasks/${id}`, "PUT", {
      status: nextStatus,
    });

    showToast("Task moved ✅");

  } catch (error) {

    showToast("Task move failed ❌");
    console.log(error);

  }
}

// ================= DELETE TASK =================
async function deleteTask(id) {

  const confirmDelete = confirm("Delete?");

  if (!confirmDelete) return;

  try {

    await apiRequest(`/tasks/${id}`, "DELETE");

    showToast("Task deleted ✅");

  } catch (error) {

    showToast("Task delete failed ❌");
    console.log(error);

  }
}

// ================= ADD USER =================
async function addUser(taskId) {

  const email = prompt("Enter user email");

  if (!email) return;

  try {

    const res = await apiRequest(
      `/tasks/${taskId}/add-user`,
      "PUT",
      { email }
    );

    if (res.message === "Already added") {
      showToast("User already added ⚠️");
      return;
    }

    showToast("User added ✅");

  } catch (error) {

    if (error.message.includes("404")) {
      showToast("User does not exist ❌");
    }
    else if (error.message.includes("400")) {
      showToast("User already added ⚠️");
    }
    else {
      showToast("Failed to add user ❌");
    }

    console.log(error);

  }
}

// ================= EDIT TASK =================
async function editTask(id, oldTitle, oldDesc) {

  const title = prompt("Edit title", oldTitle);

  if (!title) return;

  const description = prompt(
    "Edit description",
    oldDesc || ""
  );

  try {

    await apiRequest(`/tasks/${id}`, "PUT", {
      title,
      description,
    });

    showToast("Task edited ✅");

  } catch (error) {

    showToast("Task edit failed ❌");
    console.log(error);

  }
}

// ================= REMOVE USER =================
async function removeUser(taskId, userIdToRemove) {

  const confirmRemove = confirm("Remove user?");

  if (!confirmRemove) return;

  try {

    await apiRequest(
      `/tasks/${taskId}/remove-user`,
      "PUT",
      {
        userId: userIdToRemove,
      }
    );

    showToast("User removed ✅");

  } catch (error) {

    if (error.message.includes("400")) {
      showToast("User not assigned ❌");
    }
    else {
      showToast("Failed to remove user ❌");
    }

    console.log(error);

  }
}

// ================= USER AVATAR =================
function setUserAvatar() {

  const avatar = document.getElementById("userAvatar");
  const nameBox = document.getElementById("userName");

  if (!avatar || !nameBox) return;

  const name =
    role === "admin"
      ? "Admin"
      : username && username !== "undefined"
      ? username
      : "User";

  nameBox.innerText = name;

  avatar.innerText = name[0].toUpperCase();
}

