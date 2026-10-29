"use strict";

let dashboard = null;
let notifications = [];
let records = [];

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(title, message) {
  $("toastTitle").textContent = title;
  $("toastMessage").textContent = message;
  bootstrap.Toast.getOrCreateInstance($("saveToast")).show();
}

function showDatasetNotification(notification) {
  if (!notification) {
    showToast("Уведомление", "Действие выполнено.");
    return;
  }

  const titles = {
    success: "Успешно",
    warning: "Внимание",
    info: "Информация",
    danger: "Ошибка"
  };

  showToast(titles[notification.type] || "Уведомление", notification.text);
}

function statusBadgeClass(status) {
  if (status === "Готово") return "text-bg-success";
  if (status === "В работе") return "text-bg-warning";
  if (status === "Новая") return "text-bg-info";
  return "text-bg-secondary";
}

function renderMetrics() {
  $("metricCards").innerHTML = dashboard.metrics.map((metric) => `
    <article class="col-12 col-md-6 col-xl-3">
      <div class="metric-card">
        <div class="metric-accent"></div>
        <p class="text-secondary mb-2">${escapeHtml(metric.title)}</p>
        <strong class="metric-value">${escapeHtml(metric.value)}</strong>
      </div>
    </article>
  `).join("");
}

function renderRows() {
  $("recordCount").textContent = `${records.length} записей`;

  if (records.length === 0) {
    $("activityRows").innerHTML = '<tr><td colspan="3" class="text-secondary">Записей пока нет.</td></tr>';
    return;
  }

  $("activityRows").innerHTML = records.map((record) => {
    const status = record.status || "Не указан";
    return `
      <tr>
        <td>${escapeHtml(record.id)}</td>
        <td class="fw-semibold">${escapeHtml(record.action)}</td>
        <td><span class="badge ${statusBadgeClass(status)}">${escapeHtml(status)}</span></td>
      </tr>
    `;
  }).join("");
}

function renderStatusSummary() {
  const counts = {};
  records.forEach((record) => {
    const status = record.status || "Не указан";
    counts[status] = (counts[status] || 0) + 1;
  });

  const statusNames = Object.keys(counts);
  $("taskItems").innerHTML = statusNames.length
    ? statusNames.map((status) => `
        <div class="d-flex align-items-center justify-content-between gap-3">
          <span>${escapeHtml(status)}</span>
          <span class="badge ${statusBadgeClass(status)}">${counts[status]}</span>
        </div>
      `).join("")
    : '<p class="small text-secondary mb-0">Нет данных для сводки.</p>';

  const completed = records.filter((record) => record.status === "Готово").length;
  const percent = records.length ? Math.round(completed * 100 / records.length) : 0;
  $("taskProgress").style.width = percent + "%";
  $("taskProgress").parentElement.setAttribute("aria-valuenow", percent);
  $("taskPercent").textContent = `${completed} из ${records.length}`;
}

async function loadData() {
  const responses = await Promise.all([
    fetch("dataset/dashboard.json"),
    fetch("dataset/notifications.json")
  ]);

  if (responses.some((response) => !response.ok)) {
    throw new Error("Не удалось загрузить файлы dataset.");
  }

  const loadedDashboard = await responses[0].json();
  const loadedNotifications = await responses[1].json();

  if (!Array.isArray(loadedDashboard.metrics) || loadedDashboard.metrics.length < 4) {
    throw new Error("В dashboard.json должно быть не менее четырёх показателей.");
  }
  if (!Array.isArray(loadedDashboard.rows)) {
    throw new Error("В dashboard.json отсутствует массив rows.");
  }
  if (!Array.isArray(loadedNotifications)) {
    throw new Error("В notifications.json ожидался массив уведомлений.");
  }

  dashboard = loadedDashboard;
  notifications = loadedNotifications;
  records = [...dashboard.rows];

  renderMetrics();
  renderRows();
  renderStatusSummary();
  $("dataStatus").textContent = "Данные загружены";
}

function validateField(input) {
  const valueIsLongEnough = input.id !== "recordTitle" || input.value.trim().length >= 3;
  const valid = input.checkValidity() && valueIsLongEnough;
  input.classList.toggle("is-invalid", !valid);
  input.classList.toggle("is-valid", valid);
  return valid;
}

$("recordForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const fields = [$("recordTitle"), $("recordEmail"), $("recordStatus")];
  if (!fields.map(validateField).every(Boolean)) return;

  records.unshift({
    id: "new-" + Date.now(),
    action: $("recordTitle").value.trim(),
    status: $("recordStatus").value
  });

  renderRows();
  renderStatusSummary();
  bootstrap.Modal.getOrCreateInstance($("newRecordModal")).hide();

  $("recordForm").reset();
  fields.forEach((field) => field.classList.remove("is-valid", "is-invalid"));

  const successNotification = notifications.find((item) => item.type === "success");
  showDatasetNotification(successNotification);
});

["recordTitle", "recordEmail", "recordStatus"].forEach((id) => {
  const field = $(id);
  field.addEventListener("input", () => {
    if (field.classList.contains("is-invalid") || field.classList.contains("is-valid")) {
      validateField(field);
    }
  });
  field.addEventListener("change", () => {
    if (field.classList.contains("is-invalid") || field.classList.contains("is-valid")) {
      validateField(field);
    }
  });
});

$("notificationButton").addEventListener("click", () => {
  const warningNotification = notifications.find((item) => item.type === "warning");
  showDatasetNotification(warningNotification || notifications[0]);
});

$("refreshButton").addEventListener("click", async () => {
  try {
    await loadData();
    showToast("Обновлено", "Данные повторно загружены из JSON.");
  } catch (error) {
    showToast("Ошибка", error.message);
    console.error(error);
  }
});

loadData().catch((error) => {
  $("dataStatus").textContent = "Ошибка данных";
  $("metricCards").innerHTML = `
    <div class="col-12">
      <div class="alert alert-warning mb-0">${escapeHtml(error.message)} Запустите страницу через локальный сервер, как указано в README.</div>
    </div>`;
  $("activityRows").innerHTML = '<tr><td colspan="3">Ошибка загрузки данных.</td></tr>';
  $("taskItems").innerHTML = '<p class="text-secondary small mb-0">Сводка недоступна.</p>';
  console.error(error);
});
