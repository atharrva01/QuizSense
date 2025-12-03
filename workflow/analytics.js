// ---------------------- IMPORTS & USER CONTEXT ----------------------
const currentUser = localStorage.getItem("currentUser");
const historyKey = `quizHistory_${currentUser}`;

// Load user's history
let history = JSON.parse(localStorage.getItem(historyKey)) || [];

// ---------------------- EMPTY STATE ----------------------
if (!history.length) {
  document.querySelector(".container").innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <h3>No Analytics Data Yet</h3>
      <p>Take your first quiz to start tracking your performance</p>
      <a href="./home.html" class="empty-state-btn">Start a Quiz</a>
    </div>
  `;
} else {
  renderOverallStats();
  renderScoreProgress();
  renderTopicAnalytics();
  renderDifficultyAnalytics();
  renderQuizTable();
}

// ---------------------- OVERALL STATS ----------------------
function renderOverallStats() {
  const completed = history.filter((q) => q.completed);
  const totalQuizzes = history.length;
  const completedQuizzes = completed.length;

  const scores = completed.map((q) => (q.score / q.totalQuestions) * 100);
  const averageScore = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 0;

  const bestScore = scores.length ? Math.max(...scores).toFixed(1) : 0;

  const container = document.getElementById("overallStatsContainer");
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Quizzes</div>
      <div class="stat-value">${totalQuizzes}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Completed</div>
      <div class="stat-value">${completedQuizzes}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average Score</div>
      <div class="stat-value">${averageScore}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Best Score</div>
      <div class="stat-value">${bestScore}%</div>
    </div>
  `;
}

// ---------------------- SCORE PROGRESSION LINE CHART ----------------------
function renderScoreProgress() {
  const completed = history
    .filter((q) => q.completed)
    .sort((a, b) => a.lastUpdated - b.lastUpdated);

  if (!completed.length) return;

  const labels = completed.map((q) =>
    new Date(q.lastUpdated).toLocaleDateString()
  );
  const data = completed.map((q) =>
    ((q.score / q.totalQuestions) * 100).toFixed(1)
  );

  const ctx = document.getElementById("scoreChart");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Score (%)",
          data,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
    },
  });
}

// ---------------------- TOPIC ACCURACY BAR CHART ----------------------
function renderTopicAnalytics() {
  const topicStats = {};

  history.forEach((quiz) => {
    if (!quiz.attempts) return;
    quiz.attempts.forEach((a) => {
      if (!topicStats[a.topic]) topicStats[a.topic] = { total: 0, correct: 0 };
      topicStats[a.topic].total++;
      if (a.correct) topicStats[a.topic].correct++;
    });
  });

  const labels = Object.keys(topicStats);
  if (!labels.length) return;

  const data = labels.map((topic) =>
    ((topicStats[topic].correct / topicStats[topic].total) * 100).toFixed(1)
  );

  const ctx = document.getElementById("topicChart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Accuracy (%)",
          data,
          backgroundColor: "rgba(249,115,22,0.8)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
    },
  });
}

// ---------------------- DIFFICULTY PERFORMANCE ----------------------
function renderDifficultyAnalytics() {
  const difficultyStats = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };

  history.forEach((quiz) => {
    if (!quiz.attempts) return;
    quiz.attempts.forEach((a) => {
      difficultyStats[a.difficulty].total++;
      if (a.correct) difficultyStats[a.difficulty].correct++;
    });
  });

  const labels = ["EASY", "MEDIUM", "HARD"];
  const data = labels.map((d) => {
    const key = d.toLowerCase();
    return difficultyStats[key].total
      ? (
          (difficultyStats[key].correct / difficultyStats[key].total) *
          100
        ).toFixed(1)
      : 0;
  });

  const ctx = document.getElementById("difficultyChart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Accuracy (%)",
          data,
          backgroundColor: ["#22c55e", "#f97316", "#ef4444"],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
    },
  });
}

// ---------------------- TABLE: QUIZ HISTORY ----------------------
function renderQuizTable() {
  const tbody = document.querySelector("#quizTable tbody");
  const sorted = [...history].sort((a, b) => b.lastUpdated - a.lastUpdated);

  sorted.forEach((q, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${new Date(q.lastUpdated).toLocaleString()}</td>
      <td>${q.id}</td>
      <td><strong>${q.score}/${q.totalQuestions}</strong></td>
      <td>${((q.score / q.totalQuestions) * 100).toFixed(1)}%</td>
      <td><span class="status-badge ${
        q.completed ? "status-completed" : "status-progress"
      }">${q.completed ? "Completed" : "In Progress"}</span></td>
    `;

    tbody.appendChild(tr);
  });
}
