var SUPABASE_URL = 'https://gsohsedhinkduipegapx.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzb2hzZWRoaW5rZHVpcGVnYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDAyMzAsImV4cCI6MjEwMjcxNjIzMH0.8B9BB-doAMStrhgg2iZK1RDkNGGVS2OoyjSSnjKztgw';

var _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var state = {
  tasks: [],
  reasonAction: null,
  draftType: "timed",
  draftScheduleMode: "date",
};

var elements = {
  timedList: document.getElementById("timed-list"),
  backgroundList: document.getElementById("background-list"),
  todoList: document.getElementById("todo-list"),
  doneList: document.getElementById("done-list"),
  openCreateButton: document.getElementById("open-create-button"),
  createOverlay: document.getElementById("create-overlay"),
  createForm: document.getElementById("create-form"),
  typeToggle: document.getElementById("type-toggle"),
  scheduleToggle: document.getElementById("schedule-toggle"),
  scheduleModeField: document.getElementById("schedule-mode-field"),
  deadlineField: document.getElementById("deadline-field"),
  planAmountField: document.getElementById("plan-amount-field"),
  planUnitField: document.getElementById("plan-unit-field"),
  detailsOverlay: document.getElementById("details-overlay"),
  detailsTitle: document.getElementById("details-title"),
  detailsMeta: document.getElementById("details-meta"),
  detailsSchedule: document.getElementById("details-schedule"),
  detailsDescription: document.getElementById("details-description"),
  detailsNotes: document.getElementById("details-notes"),
  detailsLastPause: document.getElementById("details-last-pause"),
  detailsCompletion: document.getElementById("details-completion"),
  detailsEvents: document.getElementById("details-events"),
  reasonOverlay: document.getElementById("reason-overlay"),
  reasonForm: document.getElementById("reason-form"),
  reasonTitle: document.getElementById("reason-title"),
  reasonLabel: document.getElementById("reason-label"),
  reasonInput: document.getElementById("reason-input"),
  reasonSubmit: document.getElementById("reason-submit"),
  authScreen: document.getElementById("auth-screen"),
  authUser: document.getElementById("auth-user"),
  authPass: document.getElementById("auth-pass"),
  authButton: document.getElementById("auth-button"),
  authError: document.getElementById("auth-error"),
  authUsername: document.getElementById("auth-username"),
  logoutButton: document.getElementById("logout-button"),
};

function uid() {
  return "tsk_" + Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

function startOfToday() {
  var date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(baseTime, days) {
  return baseTime + days * 24 * 60 * 60 * 1000;
}

async function loadUserTasks() {
  var userResult = await _supabase.auth.getUser();
  if (userResult.error) throw userResult.error;

  var result = await _supabase
    .from("tasks")
    .select("data")
    .eq("user_id", userResult.data.user.id)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? result.data.data : [];
}

async function saveUserTasks(tasks) {
  var userResult = await _supabase.auth.getUser();
  if (userResult.error) throw userResult.error;

  var userId = userResult.data.user.id;
  var existingResult = await _supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingResult.error) throw existingResult.error;

  var result;
  if (existingResult.data) {
    result = await _supabase
      .from("tasks")
      .update({ data: tasks, updated_at: new Date().toISOString() })
      .eq("id", existingResult.data.id);
  } else {
    result = await _supabase
      .from("tasks")
      .insert({ user_id: userId, data: tasks });
  }

  if (result.error) throw result.error;
}

function eventLabel(type) {
  if (type === "created") return "Создана";
  if (type === "started") return "Запуск";
  if (type === "paused") return "Пауза";
  if (type === "resumed") return "Продолжение";
  return "Завершение";
}

function statusLabel(status) {
  if (status === "active") return "В работе";
  if (status === "paused") return "На паузе";
  if (status === "done") return "Завершена";
  return "Не начата";
}

function typeLabel(type) {
  return type === "timed" ? "Со сроком" : "Фоновая";
}

function unitLabel(unit) {
  if (unit === "minutes") return "минут";
  if (unit === "hours") return "часов";
  if (unit === "days") return "дней";
  if (unit === "weeks") return "недель";
  if (unit === "months") return "месяцев";
  return "лет";
}

function durationToMs(amount, unit) {
  if (!amount || !unit) return 0;
  if (unit === "minutes") return amount * 60 * 1000;
  if (unit === "hours") return amount * 60 * 60 * 1000;
  if (unit === "days") return amount * 24 * 60 * 60 * 1000;
  if (unit === "weeks") return amount * 7 * 24 * 60 * 60 * 1000;
  if (unit === "months") return amount * 30 * 24 * 60 * 60 * 1000;
  return amount * 365 * 24 * 60 * 60 * 1000;
}

function endOfDate(dateString) {
  if (!dateString) return null;
  var date = new Date(dateString + "T23:59:59");
  return date.getTime();
}

function formatTime(time) {
  if (!time) return "еще нет";
  var date = new Date(time);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(dateString) {
  if (!dateString) return "нет";
  var date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("ru-RU");
}

function formatDuration(ms) {
  var safe = Math.max(0, Math.floor(ms / 1000));
  var hours = Math.floor(safe / 3600);
  var minutes = Math.floor((safe % 3600) / 60);
  var seconds = safe % 60;
  return [hours, minutes, seconds]
    .map(function (part) {
      return String(part).padStart(2, "0");
    })
    .join(":");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deriveTask(task, currentTime) {
  var activeDurationMs = 0;
  var pausedDurationMs = 0;
  var currentStart = null;
  var currentPause = null;
  var firstStartedAt = null;
  var lastPauseReason = null;
  var completionReason = null;

  for (var i = 0; i < task.history.length; i += 1) {
    var event = task.history[i];
    if (event.type === "started" || event.type === "resumed") {
      if (firstStartedAt === null && event.type === "started") {
        firstStartedAt = event.at;
      }
      if (currentPause !== null) {
        pausedDurationMs += event.at - currentPause;
        currentPause = null;
      }
      currentStart = event.at;
    }

    if (event.type === "paused") {
      lastPauseReason = event.reason || null;
      if (currentStart !== null) {
        activeDurationMs += event.at - currentStart;
        currentStart = null;
      }
      currentPause = event.at;
    }

    if (event.type === "completed") {
      completionReason = event.reason || null;
      if (currentStart !== null) {
        activeDurationMs += event.at - currentStart;
        currentStart = null;
      }
      if (currentPause !== null) {
        pausedDurationMs += event.at - currentPause;
        currentPause = null;
      }
    }
  }

  if (task.status === "active" && currentStart !== null) {
    activeDurationMs += currentTime - currentStart;
  }

  if (task.status === "paused" && currentPause !== null) {
    pausedDurationMs += currentTime - currentPause;
  }

  var elapsedMs = firstStartedAt ? currentTime - firstStartedAt : 0;
  var consumedMs = activeDurationMs + pausedDurationMs;
  var progressRatio = 0;
  var isOverdue = false;
  var workWidth = 0;
  var pauseWidth = 0;
  var restWidth = 100;
  var workClass = "seg-work-green";

  if (task.type === "timed" && task.scheduleMode === "plan") {
    var plannedMs = durationToMs(task.plannedAmount, task.plannedUnit);
    if (plannedMs > 0) {
      progressRatio = consumedMs / plannedMs;
      isOverdue = consumedMs > plannedMs;
      workWidth = clamp((activeDurationMs / plannedMs) * 100, 0, 100);
      pauseWidth = clamp((pausedDurationMs / plannedMs) * 100, 0, 100 - workWidth);
      restWidth = clamp(100 - workWidth - pauseWidth, 0, 100);
    }
  }

  if (task.type === "timed" && task.scheduleMode === "date") {
    var deadlineMs = endOfDate(task.deadlineDate);
    var baseline = firstStartedAt || task.createdAt;
    var totalMs = deadlineMs ? Math.max(deadlineMs - baseline, 1) : 1;
    progressRatio = consumedMs / totalMs;
    isOverdue = deadlineMs ? currentTime > deadlineMs : false;
    workWidth = clamp((activeDurationMs / totalMs) * 100, 0, 100);
    pauseWidth = clamp((pausedDurationMs / totalMs) * 100, 0, 100 - workWidth);
    restWidth = clamp(100 - workWidth - pauseWidth, 0, 100);
  }

  if (task.type === "background") {
    var totalActivity = activeDurationMs + pausedDurationMs;
    if (totalActivity > 0) {
      workWidth = clamp((activeDurationMs / totalActivity) * 100, 0, 100);
      pauseWidth = clamp((pausedDurationMs / totalActivity) * 100, 0, 100 - workWidth);
      restWidth = clamp(100 - workWidth - pauseWidth, 0, 100);
    }
  }

  var consumedRatio = clamp(progressRatio, 0, 1);
  if (task.type === "timed") {
    if (consumedRatio >= 0.85) {
      workClass = "seg-work-red";
    } else if (consumedRatio >= 0.6) {
      workClass = "seg-work-yellow";
    }
  }

  return {
    firstStartedAt: firstStartedAt,
    activeDurationMs: activeDurationMs,
    pausedDurationMs: pausedDurationMs,
    elapsedMs: elapsedMs,
    progressRatio: progressRatio,
    isOverdue: isOverdue,
    lastPauseReason: lastPauseReason,
    completionReason: completionReason,
    workWidth: workWidth,
    pauseWidth: pauseWidth,
    restWidth: restWidth,
    workClass: task.type === "background" ? "seg-background" : workClass,
  };
}

function rowMeta(task, derived) {
  if (task.type === "background") {
    return [
      "Работа <strong>" + formatDuration(derived.activeDurationMs) + "</strong>",
      "Паузы <strong>" + formatDuration(derived.pausedDurationMs) + "</strong>",
      "Всего <strong>" + formatDuration(derived.activeDurationMs + derived.pausedDurationMs) + "</strong>",
      "Лента <strong>" + (task.status === "paused" ? "на паузе" : task.status === "active" ? "активна" : "пусто") + "</strong>",
      "Срок <strong>нет</strong>",
    ];
  }

  var firstLabel = task.scheduleMode === "plan"
    ? "План <strong>" + task.plannedAmount + unitShort(task.plannedUnit) + "</strong>"
    : "Срок <strong>" + formatDate(task.deadlineDate) + "</strong>";

  return [
    firstLabel,
    "Старт <strong>" + formatTime(derived.firstStartedAt) + "</strong>",
    "Прошло <strong>" + formatDuration(derived.elapsedMs) + "</strong>",
    "Прогресс <strong>" + formatProgress(derived.progressRatio) + "</strong>",
    "Просрочка <strong>" + formatOverdue(derived) + "</strong>",
  ];
}

function unitShort(unit) {
  if (unit === "minutes") return "м";
  if (unit === "hours") return "ч";
  if (unit === "days") return "д";
  if (unit === "weeks") return "н";
  if (unit === "months") return " мес";
  return " г";
}

function formatProgress(ratio) {
  return Math.round(clamp(ratio, 0, 1) * 100) + "%";
}

function formatOverdue(derived) {
  if (!derived.isOverdue) return "нет";
  return "да";
}

function badgeClass(status) {
  if (status === "active") return "badge badge-active";
  if (status === "paused") return "badge badge-paused";
  if (status === "done") return "badge badge-done";
  return "badge";
}

function createButton(label, action, kind) {
  var kindClass = kind ? " " + kind : "";
  return '<button class="button' + kindClass + '" data-action="' + action + '">' + label + "</button>";
}

function rowActions(task) {
  if (task.status === "todo") {
    return [
      createButton("Детали", "details", "button-quiet"),
      createButton("Старт", "start", "button-primary"),
      createButton("Удалить", "delete", "button-quiet"),
    ].join("");
  }

  if (task.status === "active") {
    return [
      createButton("Детали", "details", "button-quiet"),
      createButton("Пауза", "pause"),
      createButton("Завершить", "complete", "button-danger"),
    ].join("");
  }

  if (task.status === "paused") {
    return [
      createButton("Детали", "details", "button-quiet"),
      createButton("Продолжить", "resume", "button-primary"),
      createButton("Завершить", "complete", "button-danger"),
    ].join("");
  }

  return createButton("Детали", "details", "button-quiet");
}

function renderTaskRow(task) {
  var derived = deriveTask(task, now());
  var meta = rowMeta(task, derived)
    .map(function (item) {
      return "<span>" + item + "</span>";
    })
    .join("");

  var pauseSegment = derived.pauseWidth > 0 ? '<div class="seg-pause" style="width:' + derived.pauseWidth + '%"></div>' : "";
  var restSegment = derived.restWidth > 0 ? '<div class="seg-rest" style="width:' + derived.restWidth + '%"></div>' : "";

  return [
    '<div class="row" data-task-id="' + task.id + '">',
    '<div class="task"><div class="task-name">' + escapeHtml(task.title) + '</div><div class="badges"><span class="badge">' + typeLabel(task.type) + '</span><span class="' + badgeClass(task.status) + '">' + statusLabel(task.status) + '</span></div></div>',
    '<div class="meta">' + meta + "</div>",
    '<div class="track"><div class="bar"><div class="' + derived.workClass + '" style="width:' + derived.workWidth + '%"></div>' + pauseSegment + restSegment + "</div></div>",
    '<div class="actions">' + rowActions(task) + "</div>",
    "</div>",
  ].join("");
}

function renderList(listElement, tasks) {
  if (!tasks.length) {
    listElement.innerHTML = '<div class="empty">Пока пусто.</div>';
    return;
  }

  listElement.innerHTML = tasks.map(renderTaskRow).join("");
}

function render() {
  var timed = [];
  var background = [];
  var todo = [];
  var done = [];

  for (var i = 0; i < state.tasks.length; i += 1) {
    var task = state.tasks[i];
    if (task.status === "done") {
      done.push(task);
    } else if (task.status === "todo") {
      todo.push(task);
    } else if (task.type === "background") {
      background.push(task);
    } else {
      timed.push(task);
    }
  }

  renderList(elements.timedList, timed);
  renderList(elements.backgroundList, background);
  renderList(elements.todoList, todo);
  renderList(elements.doneList, done);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function findTask(taskId) {
  for (var i = 0; i < state.tasks.length; i += 1) {
    if (state.tasks[i].id === taskId) return state.tasks[i];
  }
  return null;
}

function openOverlay(overlay) {
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function closeOverlay(overlay) {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function openCreate() {
  openOverlay(elements.createOverlay);
}

function closeCreate() {
  closeOverlay(elements.createOverlay);
  elements.createForm.reset();
  state.draftType = "timed";
  state.draftScheduleMode = "date";
  syncCreateFormUI();
}

function openDetails(taskId) {
  var task = findTask(taskId);
  if (!task) return;
  var derived = deriveTask(task, now());
  elements.detailsTitle.textContent = "Детали задачи: " + task.title;
  elements.detailsMeta.textContent = typeLabel(task.type) + " | " + statusLabel(task.status);
  elements.detailsSchedule.textContent = task.type === "background"
    ? "Фоновая задача без срока"
    : task.scheduleMode === "plan"
      ? "План: " + task.plannedAmount + " " + unitLabel(task.plannedUnit)
      : "Срок: " + formatDate(task.deadlineDate);
  elements.detailsDescription.textContent = task.description || "Описание пока не заполнено.";
  elements.detailsNotes.textContent = task.notes || "Заметок пока нет.";
  elements.detailsLastPause.textContent = derived.lastPauseReason || "Паузы еще не было.";
  elements.detailsCompletion.textContent = derived.completionReason || "Задача еще не завершена.";
  elements.detailsEvents.innerHTML = task.history
    .map(function (event) {
      return [
        '<div class="event-row">',
        '<div class="event-time">' + formatDateTime(event.at) + "</div>",
        '<div class="event-type">' + eventLabel(event.type) + "</div>",
        '<div class="event-note">' + escapeHtml(event.reason || defaultEventNote(event.type)) + "</div>",
        "</div>",
      ].join("");
    })
    .join("");
  openOverlay(elements.detailsOverlay);
}

function formatDateTime(time) {
  return new Date(time).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function defaultEventNote(type) {
  if (type === "created") return "Задача создана.";
  if (type === "started") return "Задача запущена без комментария.";
  if (type === "resumed") return "Работа продолжена без комментария.";
  return "";
}

function closeDetails() {
  closeOverlay(elements.detailsOverlay);
}

function openReason(taskId, action) {
  state.reasonAction = { taskId: taskId, action: action };
  elements.reasonInput.value = "";
  elements.reasonTitle.textContent = action === "pause" ? "Причина паузы" : "Причина завершения";
  elements.reasonLabel.textContent = action === "pause" ? "Укажи причину паузы" : "Укажи причину завершения";
  elements.reasonSubmit.textContent = action === "pause" ? "Поставить на паузу" : "Завершить";
  openOverlay(elements.reasonOverlay);
  setTimeout(function () {
    elements.reasonInput.focus();
  }, 0);
}

function closeReason() {
  state.reasonAction = null;
  closeOverlay(elements.reasonOverlay);
}

async function updateTask(taskId, updater) {
  state.tasks = state.tasks.map(function (task) {
    if (task.id !== taskId) return task;
    return updater(task);
  });
  await saveUserTasks(state.tasks);
  render();
}

function appendEvent(task, type, reason) {
  return {
    id: task.id,
    title: task.title,
    type: task.type,
    status: nextStatus(type),
    scheduleMode: task.scheduleMode,
    deadlineDate: task.deadlineDate,
    plannedAmount: task.plannedAmount,
    plannedUnit: task.plannedUnit,
    description: task.description,
    notes: task.notes,
    createdAt: task.createdAt,
    history: task.history.concat({ type: type, at: now(), reason: reason || null }),
  };
}

function nextStatus(type) {
  if (type === "started" || type === "resumed") return "active";
  if (type === "paused") return "paused";
  if (type === "completed") return "done";
  return "todo";
}

async function handleAction(taskId, action) {
  var task = findTask(taskId);
  if (!task) return;

  if (action === "details") {
    openDetails(taskId);
    return;
  }

  if (action === "start") {
    await updateTask(taskId, function (current) {
      return appendEvent(current, "started", null);
    });
    return;
  }

  if (action === "resume") {
    await updateTask(taskId, function (current) {
      return appendEvent(current, "resumed", null);
    });
    return;
  }

  if (action === "pause" || action === "complete") {
    openReason(taskId, action);
    return;
  }

  if (action === "delete") {
    state.tasks = state.tasks.filter(function (current) {
      return current.id !== taskId;
    });
    await saveUserTasks(state.tasks);
    render();
  }
}

function syncCreateFormUI() {
  var timed = state.draftType === "timed";
  var mode = state.draftScheduleMode;
  updateToggle(elements.typeToggle, "data-task-type", state.draftType);
  updateToggle(elements.scheduleToggle, "data-schedule-mode", mode);
  elements.scheduleModeField.hidden = !timed;
  elements.deadlineField.hidden = !timed || mode !== "date";
  elements.planAmountField.hidden = !timed || mode !== "plan";
  elements.planUnitField.hidden = !timed || mode !== "plan";
}

function updateToggle(root, attribute, activeValue) {
  var buttons = root.querySelectorAll("[" + attribute + "]");
  for (var i = 0; i < buttons.length; i += 1) {
    var button = buttons[i];
    button.classList.toggle("active", button.getAttribute(attribute) === activeValue);
  }
}

function createTaskFromForm(formData) {
  var title = (formData.get("title") || "").trim();
  var description = (formData.get("description") || "").trim();
  var notes = (formData.get("notes") || "").trim();
  var task = {
    id: uid(),
    title: title,
    type: state.draftType,
    status: "todo",
    scheduleMode: state.draftType === "background" ? "none" : state.draftScheduleMode,
    deadlineDate: null,
    plannedAmount: null,
    plannedUnit: null,
    description: description,
    notes: notes,
    createdAt: now(),
    history: [{ type: "created", at: now(), reason: null }],
  };

  if (task.type === "timed" && task.scheduleMode === "date") {
    task.deadlineDate = String(formData.get("deadlineDate") || "").trim();
    if (!task.deadlineDate) {
      throw new Error("Выбери дату срока.");
    }
  }

  if (task.type === "timed" && task.scheduleMode === "plan") {
    task.plannedAmount = Number(formData.get("plannedAmount") || 0);
    task.plannedUnit = String(formData.get("plannedUnit") || "minutes");
    if (!task.plannedAmount || task.plannedAmount <= 0) {
      throw new Error("Укажи корректное количество для плана.");
    }
  }

  return task;
}

function showLoginError(msg) {
  elements.authError.textContent = msg || "Неверные логин или пароль";
  elements.authError.style.display = 'block';
}

function hideLoginError() {
  elements.authError.style.display = 'none';
}

async function logout() {
  await _supabase.auth.signOut();
  document.body.classList.remove('authenticated');
  state.tasks = [];
  elements.authUsername.textContent = '';
  elements.logoutButton.hidden = true;
  render();
}

async function tryLogin() {
  hideLoginError();
  var u = elements.authUser.value.trim().toLowerCase();
  var p = elements.authPass.value;
  if (!u || !p) { showLoginError('Введи логин и пароль'); return; }
  if (u !== 'user1' && u !== 'user2' && u !== 'user3') { showLoginError('Неверные логин или пароль'); return; }

  var email = u + '@track.app';
  var result = await _supabase.auth.signInWithPassword({ email: email, password: p });
  if (result.error) { showLoginError('Неверные логин или пароль'); return; }

  elements.authScreen.classList.add('hidden');
  document.body.classList.add('authenticated');
  elements.authUsername.textContent = u;
  elements.logoutButton.hidden = false;

  var tasksResult = await loadUserTasks();
  state.tasks = tasksResult;
  render();
}

async function checkSession() {
  var sessionResult = await _supabase.auth.getSession();
  var session = sessionResult.data.session;
  if (session) {
    var email = session.user.email || '';
    var username = email.replace('@track.app', '');
    elements.authScreen.classList.add('hidden');
    document.body.classList.add('authenticated');
    elements.authUsername.textContent = username;
    elements.logoutButton.hidden = false;

    var tasksResult = await loadUserTasks();
    state.tasks = tasksResult;
    render();
  }
}

function bindEvents() {
  elements.openCreateButton.addEventListener("click", openCreate);

  elements.authButton.addEventListener("click", tryLogin);
  elements.authPass.addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });
  elements.logoutButton.addEventListener("click", logout);

  document.body.addEventListener("click", function (event) {
    var typeButton = event.target.closest("[data-task-type]");
    if (typeButton) {
      state.draftType = typeButton.getAttribute("data-task-type");
      syncCreateFormUI();
      return;
    }

    var scheduleButton = event.target.closest("[data-schedule-mode]");
    if (scheduleButton) {
      state.draftScheduleMode = scheduleButton.getAttribute("data-schedule-mode");
      syncCreateFormUI();
      return;
    }

    var actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      var row = actionButton.closest("[data-task-id]");
      if (row) {
        handleAction(row.getAttribute("data-task-id"), actionButton.getAttribute("data-action"));
      }
      return;
    }

    if (event.target.matches("[data-close-create]")) {
      closeCreate();
      return;
    }

    if (event.target.matches("[data-close-details]")) {
      closeDetails();
      return;
    }

    if (event.target.matches("[data-close-reason]")) {
      closeReason();
      return;
    }

    if (event.target === elements.createOverlay) {
      closeCreate();
    }

    if (event.target === elements.detailsOverlay) {
      closeDetails();
    }

    if (event.target === elements.reasonOverlay) {
      closeReason();
    }
  });

  elements.createForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var formData = new FormData(elements.createForm);
    try {
      var task = createTaskFromForm(formData);
      state.tasks.unshift(task);
      await saveUserTasks(state.tasks);
      render();
      closeCreate();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.reasonForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!state.reasonAction) return;
    var reason = elements.reasonInput.value.trim();
    if (!reason) {
      alert("Укажи причину.");
      return;
    }
    var action = state.reasonAction.action === "pause" ? "paused" : "completed";
    await updateTask(state.reasonAction.taskId, function (task) {
      return appendEvent(task, action, reason);
    });
    closeReason();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeCreate();
      closeDetails();
      closeReason();
    }
  });
}

async function init() {
  syncCreateFormUI();
  bindEvents();
  await checkSession();
  setInterval(render, 1000);
}

init();
