// ================= SOCKET =================
const socket = io(SOCKET_URL);

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
let confirmAction = null;
let editingTaskId = null;
let addingUserTaskId = null;

// ================= INIT =================
setUserAvatar();
setupModalActions();
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
  openConfirmModal(
    "logout",
    "are you sure you want to logout?",
    "Logout",
    () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("username");

      window.location.href = "index.html";
    }
  );
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

    if (tasks && tasks.length > 0) {
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
    }

    showEmptyColumns();

  } catch (error) {

    showToast(error.message || "Failed to load tasks ❌");
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

    showToast(error.message || "Task creation failed ❌");
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

  const isAdmin = role === "admin";
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

    const creatorIcon = document.createElement("i");
    creatorIcon.className = "bi bi-award-fill";

    const creatorName = document.createElement("span");
    creatorName.textContent = task.createdBy.username || "Creator";

    creator.appendChild(creatorIcon);
    creator.appendChild(creatorName);

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
      if (isOwner || isAdmin) {

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

  if (task.dueDate) {
    const dueDate = document.createElement("span");
    dueDate.className = "due-date";
    dueDate.textContent = new Date(task.dueDate).toLocaleDateString();
    footer1.appendChild(dueDate);
  }

  // ACTIONS
  const footer2 = document.createElement("div");
  footer2.className = "task-footer task-actions";

  // Move
  const moveBtn = document.createElement("button");

  moveBtn.className = "move-btn-text";
  moveBtn.textContent = `Move to ${nextText} →`;

  moveBtn.addEventListener("click", () => {
    moveTask(task._id, task.status);
  });

  footer2.appendChild(moveBtn);

  // Owner/Admin actions
  if (isOwner || isAdmin) {

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

    showToast(error.message || "Task move failed ❌");
    console.log(error);

  }
}

// ================= DELETE TASK =================
async function deleteTask(id) {

  openConfirmModal(
    "delete task",
    "are you sure you want to delete this task?",
    "Delete",
    async () => {
      try {

        await apiRequest(`/tasks/${id}`, "DELETE");

        showToast("Task deleted ✅");

      } catch (error) {

        showToast(error.message || "Task delete failed ❌");
        console.log(error);

      }
    }
  );
}

// ================= ADD USER =================
async function addUser(taskId) {

  addingUserTaskId = taskId;

  const emailInput = document.getElementById("addUserEmail");
  emailInput.value = "";

  const modal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("addUserModal")
  );

  modal.show();

  setTimeout(() => emailInput.focus(), 250);
}

// ================= EDIT TASK =================
async function editTask(id, oldTitle, oldDesc) {

  editingTaskId = id;

  document.getElementById("editTaskTitle").value = oldTitle || "";
  document.getElementById("editTaskDescription").value = oldDesc || "";

  const modal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("editTaskModal")
  );

  modal.show();
}

// ================= REMOVE USER =================
async function removeUser(taskId, userIdToRemove) {

  openConfirmModal(
    "remove user",
    "are you sure you want to remove this user from the task?",
    "Remove",
    async () => {
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

        showToast(error.message || "Failed to remove user ❌");
        console.log(error);

      }
    }
  );
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

// modal helpers
function setupModalActions() {

  const confirmBtn = document.getElementById("confirmActionBtn");
  const saveEditBtn = document.getElementById("saveEditTaskBtn");
  const saveAddUserBtn = document.getElementById("saveAddUserBtn");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const action = confirmAction;
      confirmAction = null;

      bootstrap.Modal.getOrCreateInstance(
        document.getElementById("confirmModal")
      ).hide();

      if (action) {
        await action();
      }
    });
  }

  if (saveEditBtn) {
    saveEditBtn.addEventListener("click", saveEditedTask);
  }

  if (saveAddUserBtn) {
    saveAddUserBtn.addEventListener("click", saveAssignedUser);
  }
}

function openConfirmModal(title, message, buttonText, action) {

  confirmAction = action;

  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = message;
  document.getElementById("confirmActionBtn").textContent = buttonText;

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("confirmModal")
  ).show();
}

async function saveEditedTask() {

  if (!editingTaskId) return;

  const title = document.getElementById("editTaskTitle").value.trim();
  const description = document.getElementById("editTaskDescription").value.trim();

  if (!title) {
    showToast("Title required ❌");
    return;
  }

  try {

    await apiRequest(`/tasks/${editingTaskId}`, "PUT", {
      title,
      description,
    });

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("editTaskModal")
    ).hide();

    editingTaskId = null;
    showToast("Task edited ✅");

  } catch (error) {

    showToast(error.message || "Task edit failed ❌");
    console.log(error);

  }
}

async function saveAssignedUser() {

  if (!addingUserTaskId) return;

  const email = document.getElementById("addUserEmail").value.trim();

  if (!email) {
    showToast("Email required ❌");
    return;
  }

  try {

    await apiRequest(
      `/tasks/${addingUserTaskId}/add-user`,
      "PUT",
      { email }
    );

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("addUserModal")
    ).hide();

    addingUserTaskId = null;
    showToast("User added ✅");

  } catch (error) {

    showToast(error.message || "Failed to add user ❌");
    console.log(error);

  }
}

function showEmptyColumns() {

  const columns = ["backlog", "todo", "inprogress", "completed"];

  columns.forEach((id) => {
    const column = document.getElementById(id);

    if (!column.querySelector(".task-card")) {
      const empty = document.createElement("div");
      empty.className = "empty-column";
      empty.textContent = "no tasks found";
      column.appendChild(empty);
    }
  });
}

