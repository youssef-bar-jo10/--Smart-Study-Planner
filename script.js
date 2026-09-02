"use strict";

/* =========================================================
   STUDYFLOW
   SCRIPT.JS
========================================================= */

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "studyflow_data_v1";

const defaultData = {
  subjects: [],
  exams: [],
  sessions: [],
  studyMinutes: 0,
  completedSessions: 0,
  studyDays: {},
  theme: "light"
};

let data = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      studyDays: parsed.studyDays || {}
    };

  } catch (error) {
    console.error(error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

/* =========================================================
   DOM
========================================================= */

const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");

const pageTitle = document.getElementById("pageTitle");
const todayText = document.getElementById("todayText");

const modalOverlay =
  document.getElementById("modalOverlay");

const modalContent =
  document.getElementById("modalContent");

const modalClose =
  document.getElementById("modalClose");

const toast =
  document.getElementById("toast");

const toastMessage =
  document.getElementById("toastMessage");

/* =========================================================
   HELPERS
========================================================= */

function uid(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "short"
  });
}

function todayISO() {
  const d = new Date();

  const year = d.getFullYear();

  const month =
    String(d.getMonth() + 1).padStart(2, "0");

  const day =
    String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysUntil(dateString) {
  const today =
    new Date(todayISO() + "T00:00:00");

  const target =
    new Date(dateString + "T00:00:00");

  return Math.ceil(
    (target - today) /
    (1000 * 60 * 60 * 24)
  );
}

function showToast(message, icon = "✓") {
  document.getElementById("toastIcon").textContent =
    icon;

  toastMessage.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================================================
   DATE
========================================================= */

function updateDate() {

  const now = new Date();

  const text =
    now.toLocaleDateString("ar-SA", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

  todayText.textContent =
    `اليوم ${text} ✨`;
}

updateDate();

/* =========================================================
   NAVIGATION
========================================================= */

const pageNames = {
  dashboard: "لوحة التحكم",
  subjects: "المواد الدراسية",
  exams: "الاختبارات",
  schedule: "جدول المذاكرة",
  timer: "المؤقت"
};

function showPage(pageName) {

  document.querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });

  const page =
    document.getElementById(pageName + "Page");

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-item[data-page]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );
    });

  pageTitle.textContent =
    pageNames[pageName] || "StudyFlow";

  sidebar.classList.remove("open");

  if (pageName === "dashboard") {
    renderDashboard();
  }

  if (pageName === "subjects") {
    renderSubjects();
  }

  if (pageName === "exams") {
    renderExams();
  }

  if (pageName === "schedule") {
    renderSchedule();
  }

  if (pageName === "timer") {
    updateTimerStats();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll(".nav-item[data-page]")
  .forEach(button => {

    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });

  });

document.querySelectorAll("[data-page-link]")
  .forEach(button => {

    button.addEventListener("click", () => {
      showPage(button.dataset.pageLink);
    });

  });

mobileMenu.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  document.body.classList.toggle(
    "dark",
    data.theme === "dark"
  );

  const button =
    document.getElementById("themeBtn");

  if (button) {

    button.innerHTML =
      data.theme === "dark"
        ? "<span>☀️</span><span>الوضع النهاري</span>"
        : "<span>🌙</span><span>الوضع الليلي</span>";
  }
}

document
  .getElementById("themeBtn")
  .addEventListener("click", () => {

    data.theme =
      data.theme === "dark"
        ? "light"
        : "dark";

    saveData();

    applyTheme();

  });

applyTheme();

/* =========================================================
   MODAL
========================================================= */

function openModal(html) {

  modalContent.innerHTML = html;

  modalOverlay.classList.add("show");

  document.body.style.overflow = "hidden";
}

function closeModal() {

  modalOverlay.classList.remove("show");

  document.body.style.overflow = "";
}

modalClose.addEventListener(
  "click",
  closeModal
);

modalOverlay.addEventListener(
  "click",
  event => {

    if (event.target === modalOverlay) {
      closeModal();
    }

  }
);

/* =========================================================
   SUBJECT MODAL
========================================================= */

function openSubjectModal(subject = null) {

  const isEdit = Boolean(subject);

  openModal(`
    <h2>${isEdit ? "تعديل المادة" : "إضافة مادة جديدة"}</h2>

    <p class="modal-description">
      ${isEdit
        ? "حدّث بيانات المادة."
        : "أدخل بيانات المادة التي تريد مذاكرتها."}
    </p>

    <form id="subjectForm">

      <div class="form-group">
        <label>اسم المادة</label>

        <input
          id="subjectName"
          type="text"
          placeholder="مثال: الرياضيات"
          value="${escapeHTML(subject?.name || "")}"
          required
        >
      </div>

      <div class="form-group">
        <label>الأولوية</label>

        <select id="subjectPriority">

          <option value="low"
            ${subject?.priority === "low" ? "selected" : ""}>
            منخفضة
          </option>

          <option value="medium"
            ${!subject || subject.priority === "medium" ? "selected" : ""}>
            متوسطة
          </option>

          <option value="high"
            ${subject?.priority === "high" ? "selected" : ""}>
            عالية
          </option>

        </select>
      </div>

      <div class="form-group">
        <label>نسبة الإنجاز</label>

        <input
          id="subjectProgress"
          type="number"
          min="0"
          max="100"
          value="${subject?.progress ?? 0}"
          required
        >
      </div>

      <div class="form-group">
        <label>لون المادة</label>

        <input
          id="subjectColor"
          type="color"
          value="${subject?.color || "#6c63ff"}"
          style="padding:5px;"
        >
      </div>

      <div class="form-actions">

        <button
          type="button"
          class="secondary-btn"
          id="cancelModal">
          إلغاء
        </button>

        <button
          type="submit"
          class="primary-btn">
          ${isEdit ? "حفظ التعديلات" : "إضافة المادة"}
        </button>

      </div>

    </form>
  `);

  document
    .getElementById("cancelModal")
    .addEventListener("click", closeModal);

  document
    .getElementById("subjectForm")
    .addEventListener("submit", event => {

      event.preventDefault();

      const name =
        document.getElementById("subjectName")
          .value.trim();

      const priority =
        document.getElementById("subjectPriority")
          .value;

      const progress =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              document.getElementById(
                "subjectProgress"
              ).value
            )
          )
        );

      const color =
        document.getElementById("subjectColor")
          .value;

      if (!name) return;

      if (isEdit) {

        subject.name = name;
        subject.priority = priority;
        subject.progress = progress;
        subject.color = color;

        showToast(
          "تم تعديل المادة بنجاح",
          "✓"
        );

      } else {

        data.subjects.push({
          id: uid("subject"),
          name,
          priority,
          progress,
          color,
          createdAt: Date.now()
        });

        showToast(
          "تمت إضافة المادة 📚",
          "✓"
        );
      }

      saveData();

      closeModal();

      renderSubjects();

      renderDashboard();

    });
}

/* =========================================================
   SUBJECTS RENDER
========================================================= */

function priorityText(priority) {

  return {
    low: "أولوية منخفضة",
    medium: "أولوية متوسطة",
    high: "أولوية عالية"
  }[priority] || "متوسطة";
}

function renderSubjects() {

  const container =
    document.getElementById("subjectsGrid");

  if (!data.subjects.length) {

    container.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">📚</div>
        <p>لم تضف أي مواد بعد.</p>
        <br>
        <button class="primary-btn" id="emptyAddSubject">
          ＋ إضافة أول مادة
        </button>
      </div>
    `;

    document
      .getElementById("emptyAddSubject")
      .addEventListener(
        "click",
        () => openSubjectModal()
      );

    return;
  }

  container.innerHTML =
    data.subjects.map(subject => {

      return `
        <article
          class="subject-card"
          style="--subject-color:${escapeHTML(subject.color)}"
        >

          <div class="subject-head">

            <div class="subject-icon">
              📖
            </div>

            <div class="card-actions">

              <button
                class="small-action edit-subject"
                data-id="${subject.id}">
                ✏️
              </button>

              <button
                class="small-action delete-subject"
                data-id="${subject.id}">
                🗑️
              </button>

            </div>

          </div>

          <h3>
            ${escapeHTML(subject.name)}
          </h3>

          <p class="meta">
            ${priorityText(subject.priority)}
          </p>

          <div class="progress-top">
            <span>الإنجاز</span>
            <span>${subject.progress}%</span>
          </div>

          <div class="subject-progress">
            <span style="width:${subject.progress}%"></span>
          </div>

        </article>
      `;

    }).join("");

  document
    .querySelectorAll(".edit-subject")
    .forEach(button => {

      button.addEventListener("click", () => {

        const subject =
          data.subjects.find(
            s => s.id === button.dataset.id
          );

        if (subject) {
          openSubjectModal(subject);
        }

      });

    });

  document
    .querySelectorAll(".delete-subject")
    .forEach(button => {

      button.addEventListener("click", () => {

        if (
          !confirm(
            "هل أنت متأكد من حذف هذه المادة؟"
          )
        ) return;

        data.subjects =
          data.subjects.filter(
            s => s.id !== button.dataset.id
          );

        data.exams =
          data.exams.filter(
            e => e.subjectId !== button.dataset.id
          );

        saveData();

        renderSubjects();
        renderDashboard();

        showToast(
          "تم حذف المادة",
          "🗑️"
        );

      });

    });
}

document
  .getElementById("addSubjectBtn")
  .addEventListener(
    "click",
    () => openSubjectModal()
  );

/* =========================================================
   EXAM MODAL
========================================================= */

function openExamModal(exam = null) {

  if (!data.subjects.length) {

    showToast(
      "أضف مادة أولاً قبل إضافة الاختبار",
      "⚠️"
    );

    showPage("subjects");

    return;
  }

  const isEdit = Boolean(exam);

  openModal(`
    <h2>${isEdit ? "تعديل الاختبار" : "إضافة اختبار"}</h2>

    <p class="modal-description">
      حدد المادة وموعد الاختبار.
    </p>

    <form id="examForm">

      <div class="form-group">

        <label>اسم الاختبار</label>

        <input
          id="examName"
          type="text"
          placeholder="مثال: اختبار الرياضيات النهائي"
          value="${escapeHTML(exam?.name || "")}"
          required
        >

      </div>

      <div class="form-group">

        <label>المادة</label>

        <select id="examSubject" required>

          ${data.subjects.map(subject => `
            <option
              value="${subject.id}"
              ${exam?.subjectId === subject.id ? "selected" : ""}
            >
              ${escapeHTML(subject.name)}
            </option>
          `).join("")}

        </select>

      </div>

      <div class="form-group">

        <label>تاريخ الاختبار</label>

        <input
          id="examDate"
          type="date"
          min="${todayISO()}"
          value="${exam?.date || todayISO()}"
          required
        >

      </div>

      <div class="form-group">

        <label>الوقت</label>

        <input
          id="examTime"
          type="time"
          value="${exam?.time || "09:00"}"
          required
        >

      </div>

      <div class="form-actions">

        <button
          type="button"
          class="secondary-btn"
          id="cancelModal">
          إلغاء
        </button>

        <button
          type="submit"
          class="primary-btn">
          ${isEdit ? "حفظ" : "إضافة الاختبار"}
        </button>

      </div>

    </form>
  `);

  document
    .getElementById("cancelModal")
    .addEventListener(
      "click",
      closeModal
    );

  document
    .getElementById("examForm")
    .addEventListener("submit", event => {

      event.preventDefault();

      const examData = {

        name:
          document.getElementById("examName")
            .value.trim(),

        subjectId:
          document.getElementById("examSubject")
            .value,

        date:
          document.getElementById("examDate")
            .value,

        time:
          document.getElementById("examTime")
            .value
      };

      if (isEdit) {

        Object.assign(exam, examData);

        showToast(
          "تم تعديل الاختبار",
          "✓"
        );

      } else {

        data.exams.push({
          id: uid("exam"),
          ...examData
        });

        showToast(
          "تمت إضافة الاختبار 📝",
          "✓"
        );
      }

      saveData();

      closeModal();

      renderExams();
      renderDashboard();

    });
}

document
  .getElementById("addExamBtn")
  .addEventListener(
    "click",
    () => openExamModal()
  );

/* =========================================================
   EXAMS RENDER
========================================================= */

function getSubject(id) {

  return data.subjects.find(
    subject => subject.id === id
  );
}

function renderExams() {

  const container =
    document.getElementById("examsGrid");

  if (!data.exams.length) {

    container.innerHTML = `
      <div class="empty" style="grid-column:1/-1">

        <div class="empty-icon">📝</div>

        <p>
          لم تضف أي اختبارات حتى الآن.
        </p>

        <br>

        <button
          class="primary-btn"
          id="emptyAddExam">
          ＋ إضافة اختبار
        </button>

      </div>
    `;

    document
      .getElementById("emptyAddExam")
      .addEventListener(
        "click",
        () => openExamModal()
      );

    return;
  }

  const sorted =
    [...data.exams].sort(
      (a,b) =>
        new Date(a.date) -
        new Date(b.date)
    );

  container.innerHTML =
    sorted.map(exam => {

      const subject =
        getSubject(exam.subjectId);

      const days =
        daysUntil(exam.date);

      let countdown;

      if (days < 0) {
        countdown = "انتهى الاختبار";
      } else if (days === 0) {
        countdown = "الاختبار اليوم 🔥";
      } else if (days === 1) {
        countdown = "غداً";
      } else {
        countdown = `بعد ${days} يوم`;
      }

      return `
        <article class="exam-card">

          <div class="exam-card-top">

            <div
              class="color-dot"
              style="background:${subject?.color || "#6c63ff"}">
            </div>

            <div class="exam-date-box">

              <strong>
                ${new Date(
                  exam.date + "T00:00:00"
                ).getDate()}
              </strong>

              <span>
                ${new Date(
                  exam.date + "T00:00:00"
                ).toLocaleDateString(
                  "ar-SA",
                  {month:"short"}
                )}
              </span>

            </div>

          </div>

          <h3>
            ${escapeHTML(exam.name)}
          </h3>

          <p>
            ${escapeHTML(
              subject?.name || "مادة محذوفة"
            )}
            • ${escapeHTML(exam.time)}
          </p>

          <div class="exam-countdown">

            <strong>
              ${countdown}
            </strong>

            <div class="card-actions">

              <button
                class="small-action edit-exam"
                data-id="${exam.id}">
                ✏️
              </button>

              <button
                class="small-action delete-exam"
                data-id="${exam.id}">
                🗑️
              </button>

            </div>

          </div>

        </article>
      `;

    }).join("");

  document
    .querySelectorAll(".edit-exam")
    .forEach(button => {

      button.addEventListener("click", () => {

        const exam =
          data.exams.find(
            e => e.id === button.dataset.id
          );

        if (exam) openExamModal(exam);

      });

    });

  document
    .querySelectorAll(".delete-exam")
    .forEach(button => {

      button.addEventListener("click", () => {

        if (
          !confirm(
            "هل تريد حذف هذا الاختبار؟"
          )
        ) return;

        data.exams =
          data.exams.filter(
            e => e.id !== button.dataset.id
          );

        saveData();

        renderExams();
        renderDashboard();

        showToast(
          "تم حذف الاختبار",
          "🗑️"
        );

      });

    });
}

/* =========================================================
   AUTOMATIC SCHEDULE
========================================================= */

function generateSchedule() {

  if (!data.subjects.length) {

    showToast(
      "أضف مواد أولاً",
      "⚠️"
    );

    showPage("subjects");

    return;
  }

  if (!data.exams.length) {

    showToast(
      "أضف اختباراً واحداً على الأقل",
      "⚠️"
    );

    showPage("exams");

    return;
  }

  /*
    الخوارزمية:
    - الاختبار الأقرب = أولوية أعلى
    - المادة ذات الأولوية العالية = نقاط إضافية
    - نسبة الإنجاز المنخفضة = نقاط إضافية
  */

  const now = new Date();

  const candidates = [];

  data.subjects.forEach(subject => {

    const subjectExams =
      data.exams.filter(
        exam =>
          exam.subjectId === subject.id &&
          daysUntil(exam.date) >= 0
      );

    let nearestExam = null;

    if (subjectExams.length) {

      nearestExam =
        subjectExams.sort(
          (a,b) =>
            new Date(a.date) -
            new Date(b.date)
        )[0];

    }

    const days =
      nearestExam
        ? Math.max(
            1,
            daysUntil(nearestExam.date)
          )
        : 30;

    let score = 0;

    score +=
      subject.priority === "high"
        ? 40
        : subject.priority === "medium"
        ? 20
        : 5;

    score +=
      Math.max(
        0,
        100 - subject.progress
      ) * .35;

    score +=
      Math.max(
        0,
        30 - days
      ) * 1.5;

    candidates.push({
      subject,
      score,
      exam: nearestExam
    });

  });

  candidates.sort(
    (a,b) => b.score - a.score
  );

  /*
    نولّد جلسات الأيام القادمة
    بحد أقصى جلستين يومياً.
  */

  const newSessions = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {

    const date = new Date();

    date.setDate(
      date.getDate() + dayOffset
    );

    /*
      لا نضع جلسات في الماضي.
    */

    const dateString =
      date.toISOString().slice(0,10);

    for (let slot = 0; slot < 2; slot++) {

      if (!candidates.length) continue;

      const candidate =
        candidates[
          (dayOffset * 2 + slot) %
          candidates.length
        ];

      const hour =
        slot === 0
          ? 17
          : 20;

      /*
        إذا كان هناك اختبار قريب جداً
        نزيد فرصة المادة.
      */

      newSessions.push({

        id: uid("session"),

        subjectId:
          candidate.subject.id,

        date: dateString,

        time:
          `${String(hour).padStart(2,"0")}:00`,

        duration: 50,

        completed: false

      });

    }

  }

  /*
    نحذف الجلسات المستقبلية القديمة
    ونحتفظ بالمكتملة.
  */

  data.sessions =
    data.sessions.filter(
      session =>
        session.completed ||
        session.date < todayISO()
    );

  data.sessions.push(
    ...newSessions
  );

  saveData();

  renderSchedule();

  showToast(
    "تم إنشاء جدول مذاكرة ذكي 🤖",
    "✨"
  );
}

document
  .getElementById("generateScheduleBtn")
  .addEventListener(
    "click",
    generateSchedule
  );

/* =========================================================
   SCHEDULE RENDER
========================================================= */

function renderSchedule() {

  const container =
    document.getElementById("scheduleList");

  const today =
    todayISO();

  const sessions =
    data.sessions
      .filter(
        session =>
          session.date >= today
      )
      .sort((a,b) => {

        const dateA =
          `${a.date} ${a.time}`;

        const dateB =
          `${b.date} ${b.time}`;

        return (
          new Date(dateA) -
          new Date(dateB)
        );

      });

  const todaySessions =
    sessions.filter(
      session =>
        session.date === today
    );

  document.getElementById(
    "scheduleCount"
  ).textContent =
    todaySessions.length;

  document.getElementById(
    "plannedHours"
  ).textContent =
    (
      todaySessions.reduce(
        (total, session) =>
          total + Number(session.duration || 0),
        0
      ) / 60
    ).toFixed(1);

  document.getElementById(
    "completedSessions"
  ).textContent =
    data.completedSessions;

  if (!sessions.length) {

    container.innerHTML = `
      <div class="empty">

        <div class="empty-icon">📅</div>

        <p>
          لا يوجد جدول حالياً.
        </p>

        <br>

        <button
          class="primary-btn"
          id="emptyGenerate">
          🤖 إنشاء جدول تلقائي
        </button>

      </div>
    `;

    document
      .getElementById("emptyGenerate")
      .addEventListener(
        "click",
        generateSchedule
      );

    return;
  }

  container.innerHTML =
    sessions.map(session => {

      const subject =
        getSubject(session.subjectId);

      const date =
        new Date(
          session.date + "T00:00:00"
        );

      const isToday =
        session.date === today;

      return `
        <div
          class="schedule-item
          ${session.completed ? "completed" : ""}"
        >

          <div class="schedule-time">

            ${isToday
              ? "اليوم"
              : date.toLocaleDateString(
                  "ar-SA",
                  {
                    weekday:"short",
                    day:"numeric",
                    month:"short"
                  }
                )
            }

            <br>

            ${escapeHTML(session.time)}

          </div>

          <div class="schedule-content">

            <strong class="schedule-title">
              ${escapeHTML(
                subject?.name ||
                "مادة محذوفة"
              )}
            </strong>

            <span>
              جلسة مذاكرة •
              ${session.duration} دقيقة
            </span>

          </div>

          <button
            class="complete-btn"
            data-session-id="${session.id}"
            title="تحديد كمكتملة">

            ${session.completed ? "✓" : "○"}

          </button>

        </div>
      `;

    }).join("");

  document
    .querySelectorAll(".complete-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const session =
          data.sessions.find(
            s =>
              s.id ===
              button.dataset.sessionId
          );

        if (!session) return;

        if (!session.completed) {

          session.completed = true;

          data.completedSessions++;

          addStudyDay(
            session.date
          );

          data.studyMinutes +=
            Number(session.duration || 0);

          showToast(
            "أحسنت! تم إكمال الجلسة 🔥",
            "✓"
          );

        } else {

          session.completed = false;

          data.completedSessions =
            Math.max(
              0,
              data.completedSessions - 1
            );

          data.studyMinutes =
            Math.max(
              0,
              data.studyMinutes -
              Number(session.duration || 0)
            );

        }

        saveData();

        renderSchedule();
        renderDashboard();
        updateTimerStats();

      });

    });
}

/* =========================================================
   STUDY DAYS / STREAK
========================================================= */

function addStudyDay(date) {

  data.studyDays[date] = true;
}

function calculateStreak() {

  let streak = 0;

  const date = new Date();

  /*
    نتحقق من اليوم.
  */

  for (;;) {

    const iso =
      date.toISOString().slice(0,10);

    if (!data.studyDays[iso]) {
      break;
    }

    streak++;

    date.setDate(
      date.getDate() - 1
    );
  }

  return streak;
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  document.getElementById(
    "statSubjects"
  ).textContent =
    data.subjects.length;

  document.getElementById(
    "statExams"
  ).textContent =
    data.exams.length;

  document.getElementById(
    "statHours"
  ).textContent =
    (data.studyMinutes / 60).toFixed(1);

  document.getElementById(
    "statStreak"
  ).textContent =
    calculateStreak();

  renderUpcomingExams();

  renderTodaySessions();

  renderSubjectsProgress();

}

/* =========================================================
   UPCOMING EXAMS
========================================================= */

function renderUpcomingExams() {

  const container =
    document.getElementById(
      "upcomingExams"
    );

  const exams =
    [...data.exams]
      .filter(
        exam =>
          daysUntil(exam.date) >= 0
      )
      .sort(
        (a,b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(0,4);

  if (!exams.length) {

    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎉</div>
        <p>لا توجد اختبارات قادمة.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    exams.map(exam => {

      const subject =
        getSubject(exam.subjectId);

      const days =
        daysUntil(exam.date);

      return `
        <div class="exam-row">

          <span
            class="color-dot"
            style="background:${subject?.color || "#6c63ff"}">
          </span>

          <div class="exam-row-main">

            <strong>
              ${escapeHTML(exam.name)}
            </strong>

            <span>
              ${escapeHTML(
                subject?.name || ""
              )}
              • ${formatShortDate(exam.date)}
            </span>

          </div>

          <span class="days-left">
            ${days === 0
              ? "اليوم"
              : `بعد ${days} يوم`}
          </span>

        </div>
      `;

    }).join("");
}

/* =========================================================
   TODAY SESSIONS
========================================================= */

function renderTodaySessions() {

  const container =
    document.getElementById(
      "todaySessions"
    );

  const sessions =
    data.sessions
      .filter(
        session =>
          session.date === todayISO()
      )
      .sort(
        (a,b) =>
          a.time.localeCompare(b.time)
      )
      .slice(0,5);

  if (!sessions.length) {

    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">☕</div>
        <p>
          لا توجد جلسات اليوم.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    sessions.map(session => {

      const subject =
        getSubject(session.subjectId);

      return `
        <div class="session-row">

          <span
            class="color-dot"
            style="background:${subject?.color || "#6c63ff"}">
          </span>

          <div class="session-row-main">

            <strong>
              ${escapeHTML(
                subject?.name || "مادة"
              )}
            </strong>

            <span>
              ${escapeHTML(session.time)}
              • ${session.duration} دقيقة
            </span>

          </div>

          <span>
            ${session.completed ? "✅" : "⏳"}
          </span>

        </div>
      `;

    }).join("");
}

/* =========================================================
   SUBJECT PROGRESS
========================================================= */

function renderSubjectsProgress() {

  const container =
    document.getElementById(
      "subjectsProgress"
    );

  if (!data.subjects.length) {

    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📚</div>
        <p>أضف مواد لعرض تقدمك.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    data.subjects.map(subject => {

      return `
        <div class="progress-item">

          <div class="progress-top">

            <span>
              ${escapeHTML(subject.name)}
            </span>

            <span>
              ${subject.progress}%
            </span>

          </div>

          <div class="progress-bar">

            <span
              style="width:${subject.progress}%">
            </span>

          </div>

        </div>
      `;

    }).join("");
}

/* =========================================================
   TIMER
========================================================= */

let timerSeconds = 25 * 60;
let timerTotalSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;

let currentTimerMode = "study";

const timerDisplay =
  document.getElementById(
    "timerDisplay"
  );

const timerStart =
  document.getElementById(
    "timerStart"
  );

const timerProgress =
  document.getElementById(
    "timerProgress"
  );

const timerMode =
  document.getElementById(
    "timerMode"
  );

function updateTimerDisplay() {

  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;

  timerDisplay.textContent =
    `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

  const circumference = 596;

  const progress =
    timerSeconds /
    timerTotalSeconds;

  timerProgress.style.strokeDashoffset =
    circumference * (1 - progress);
}

function setTimer(minutes, mode = "study") {

  stopTimer();

  currentTimerMode = mode;

  timerSeconds =
    minutes * 60;

  timerTotalSeconds =
    minutes * 60;

  timerMode.textContent =
    mode === "study"
      ? "وقت المذاكرة"
      : "وقت الاستراحة";

  updateTimerDisplay();

}

function startTimer() {

  if (timerRunning) {

    stopTimer();

    return;
  }

  timerRunning = true;

  timerStart.textContent = "Ⅱ";

  timerInterval =
    setInterval(() => {

      timerSeconds--;

      updateTimerDisplay();

      if (timerSeconds <= 0) {

        stopTimer();

        timerFinished();

      }

    }, 1000);

}

function stopTimer() {

  timerRunning = false;

  timerStart.textContent = "▶";

  clearInterval(timerInterval);

  timerInterval = null;
}

function timerFinished() {

  if (currentTimerMode === "study") {

    const minutes =
      Math.round(
        timerTotalSeconds / 60
      );

    data.studyMinutes += minutes;

    addStudyDay(todayISO());

    data.completedSessions++;

    saveData();

    showToast(
      "أحسنت! أكملت جلسة مذاكرة 🔥",
      "🎉"
    );

    renderDashboard();

    updateTimerStats();

    setTimer(5, "break");

  } else {

    showToast(
      "انتهت الاستراحة! وقت العودة للمذاكرة 💪",
      "⏰"
    );

    setTimer(25, "study");

  }

}

timerStart.addEventListener(
  "click",
  startTimer
);

document
  .getElementById("timerReset")
  .addEventListener(
    "click",
    () => {

      setTimer(
        Math.round(
          timerTotalSeconds / 60
        ),
        currentTimerMode
      );

    }
  );

document
  .getElementById("timerSkip")
  .addEventListener(
    "click",
    () => {

      if (
        currentTimerMode === "study"
      ) {

        setTimer(5, "break");

      } else {

        setTimer(25, "study");

      }

    }
  );

document
  .querySelectorAll(".timer-mode")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".timer-mode")
          .forEach(btn =>
            btn.classList.remove("active")
          );

        button.classList.add("active");

        setTimer(
          Number(button.dataset.minutes),
          button.dataset.mode
        );

      }
    );

  });

/* =========================================================
   TIMER STATS
========================================================= */

function updateTimerStats() {

  const hours =
    Math.floor(
      data.studyMinutes / 60
    );

  const minutes =
    data.studyMinutes % 60;

  document.getElementById(
    "todayStudyTime"
  ).textContent =
    hours > 0
      ? `${hours} ساعة ${minutes} دقيقة`
      : `${minutes} دقيقة`;

  document.getElementById(
    "todayCompleted"
  ).textContent =
    data.completedSessions;

  const percentage =
    Math.min(
      100,
      (data.studyMinutes / 120) * 100
    );

  document.getElementById(
    "dailyGoalBar"
  ).style.width =
    percentage + "%";
}

/* =========================================================
   QUICK ADD
========================================================= */

document
  .getElementById("quickAddBtn")
  .addEventListener(
    "click",
    () => {

      openModal(`
        <h2>إضافة سريعة ⚡</h2>

        <p class="modal-description">
          اختر ما تريد إضافته.
        </p>

        <div style="
          display:grid;
          gap:10px;
        ">

          <button
            class="primary-btn"
            id="quickSubject">
            📚 إضافة مادة
          </button>

          <button
            class="primary-btn"
            id="quickExam">
            📝 إضافة اختبار
          </button>

          <button
            class="primary-btn"
            id="quickSchedule">
            🤖 إنشاء جدول تلقائي
          </button>

        </div>
      `);

      document
        .getElementById("quickSubject")
        .addEventListener(
          "click",
          () => openSubjectModal()
        );

      document
        .getElementById("quickExam")
        .addEventListener(
          "click",
          () => openExamModal()
        );

      document
        .getElementById("quickSchedule")
        .addEventListener(
          "click",
          () => {

            closeModal();

            showPage("schedule");

            setTimeout(
              generateSchedule,
              300
            );

          }
        );

    }
  );

/* =========================================================
   RESET
========================================================= */

document
  .getElementById("resetDataBtn")
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "⚠️ سيتم حذف المواد والاختبارات والجدول والإحصائيات بالكامل.\n\nهل أنت متأكد؟"
        );

      if (!confirmed) return;

      localStorage.removeItem(
        STORAGE_KEY
      );

      data =
        structuredClone(defaultData);

      saveData();

      renderDashboard();
      renderSubjects();
      renderExams();
      renderSchedule();
      updateTimerStats();

      showToast(
        "تم مسح جميع البيانات",
        "🗑️"
      );

    }
  );

/* =========================================================
   INITIAL RENDER
========================================================= */

function initializeApp() {

  renderDashboard();

  renderSubjects();

  renderExams();

  renderSchedule();

  updateTimerStats();

  updateTimerDisplay();

}

initializeApp();

/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    /*
      Space = تشغيل / إيقاف المؤقت
      فقط عندما تكون صفحة المؤقت مفتوحة.
    */

    if (
      event.code === "Space" &&
      document
        .getElementById("timerPage")
        .classList.contains("active") &&
      !["INPUT", "TEXTAREA"].includes(
        document.activeElement.tagName
      )
    ) {

      event.preventDefault();

      startTimer();

    }

    if (event.key === "Escape") {
      closeModal();
    }

  }
);

/* =========================================================
   PREVENT OLD TIMER DATA AFTER REFRESH
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    clearInterval(timerInterval);
  }
);