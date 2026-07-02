const STORAGE_KEY = "dailyPlannerTasks";

const taskDate = document.querySelector("#taskDate");
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const listTitle = document.querySelector("#listTitle");
const todayButton = document.querySelector("#todayButton");
const dateStrip = document.querySelector("#dateStrip");
const tabs = document.querySelectorAll(".tab");
const totalCount = document.querySelector("#totalCount");
const pendingCount = document.querySelector("#pendingCount");
const completedCount = document.querySelector("#completedCount");

let tasksByDate = loadTasks();
let activeFilter = "all";

function getToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now - timezoneOffset).toISOString().slice(0, 10);
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
}

function getTasksForSelectedDate() {
  return tasksByDate[taskDate.value] || [];
}

function setTasksForSelectedDate(tasks) {
  if (tasks.length === 0) {
    delete tasksByDate[taskDate.value];
  } else {
    tasksByDate[taskDate.value] = tasks;
  }

  saveTasks();
}

function formatDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getVisibleTasks(tasks) {
  if (activeFilter === "pending") {
    return tasks.filter((task) => !task.completed);
  }

  if (activeFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function renderDateStrip() {
  const dates = Object.keys(tasksByDate).sort((first, second) => second.localeCompare(first));

  dateStrip.innerHTML = "";

  if (!dates.includes(taskDate.value)) {
    dates.unshift(taskDate.value);
  }

  dates.forEach((date) => {
    const tasks = tasksByDate[date] || [];
    const pending = tasks.filter((task) => !task.completed).length;
    const chip = document.createElement("button");
    chip.className = `date-chip${date === taskDate.value ? " active" : ""}`;
    chip.type = "button";
    chip.innerHTML = `
      <strong>${formatDate(date).split(",")[0]}</strong>
      <span>${tasks.length} total, ${pending} pending</span>
    `;
    chip.addEventListener("click", () => {
      taskDate.value = date;
      render();
    });

    dateStrip.append(chip);
  });
}

function render() {
  const tasks = getTasksForSelectedDate();
  const visibleTasks = getVisibleTasks(tasks);
  const completed = tasks.filter((task) => task.completed).length;

  totalCount.textContent = tasks.length;
  pendingCount.textContent = tasks.length - completed;
  completedCount.textContent = completed;
  listTitle.textContent = `Tasks for ${formatDate(taskDate.value)}`;

  taskList.innerHTML = "";
  emptyState.classList.toggle("visible", visibleTasks.length === 0);
  renderDateStrip();

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as completed`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  });
}

function addTask(text) {
  const tasks = getTasksForSelectedDate();
  tasks.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  setTasksForSelectedDate(tasks);
  render();
}

function toggleTask(taskId) {
  const tasks = getTasksForSelectedDate().map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return { ...task, completed: !task.completed };
  });

  setTasksForSelectedDate(tasks);
  render();
}

function deleteTask(taskId) {
  const tasks = getTasksForSelectedDate().filter((task) => task.id !== taskId);
  setTasksForSelectedDate(tasks);
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    return;
  }

  addTask(text);
  taskInput.value = "";
  taskInput.focus();
});

taskDate.addEventListener("change", render);

todayButton.addEventListener("click", () => {
  taskDate.value = getToday();
  render();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    render();
  });
});

taskDate.value = getToday();
render();
