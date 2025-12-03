const userName = localStorage.getItem("currentUser");
const logOut = document.getElementById("logoutBtn");
const startNewQuizBtn = document.getElementById("startQuizBtn");
const continueQuizBtn = document.getElementById("continueQuizBtn");
const viewAnalyticsBtn = document.getElementById("viewAnalyticsBtn");
const fullAnalyticsBtn = document.getElementById("fullAnalyticsBtn");


if (!userName) {
  location.href = "../index.html";
} else {
  document.getElementById("usernameDisplay").textContent = userName;
}

logOut.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  location.href = "../index.html";
});

viewAnalyticsBtn.addEventListener("click", () => {
  location.href = "../Screens/analytics.html";
});
fullAnalyticsBtn.addEventListener("click", () => {
  location.href = "../Screens/analytics.html";
});

// ---------- KEYS ----------
const historyKey = `quizHistory_${userName}`;
const quizStateKey = `quizState_${userName}`;

let history = JSON.parse(localStorage.getItem(historyKey)) || [];
const savedState = JSON.parse(localStorage.getItem(quizStateKey));

// 🔥 Ensure all records have createdAt (fix legacy data)
history = history.map((q) => ({
  ...q,
  createdAt: q.createdAt || q.lastUpdated || Date.now(),
}));
localStorage.setItem(historyKey, JSON.stringify(history));

// ---------- STATS ----------
const completedQuizzes = history.filter((q) => q.completed).length;
const attemptedQuizzes = history.filter((q) => !q.completed).length;
const totalQuizSessions = completedQuizzes + attemptedQuizzes;

// ---------- WEEKLY QUIZ CHART ----------

// Get the chart canvas
const ctx = document.getElementById("weekChart");

// Load quiz history
const currentUser = localStorage.getItem("currentUser");

// Get today's date at midnight
const today = new Date();
today.setHours(0, 0, 0, 0);

// Create last 7 day labels
const last7Days = [...Array(7)].map((_, i) => {
  const day = new Date();
  day.setDate(today.getDate() - (6 - i));
  return day;
});

// Count quizzes per day
const attemptsPerDay = last7Days.map(day => {
  return history.filter(q => {
    if (!q.completed) return false;

    const quizDate = new Date(q.createdAt || q.lastUpdated);
    quizDate.setHours(0, 0, 0, 0);

    return (
      quizDate.getFullYear() === day.getFullYear() &&
      quizDate.getMonth() === day.getMonth() &&
      quizDate.getDate() === day.getDate()
    );
  }).length;
});

// Format labels as Mon, Tue, Wed...
const dayLabels = last7Days.map(d =>
  d.toLocaleDateString("en-US", { weekday: "short" })
);

// Draw chart with branded styling
new Chart(ctx, {
  type: "bar",
  data: {
    labels: dayLabels,
    datasets: [{
      label: "Quizzes Completed",
      data: attemptsPerDay,
      backgroundColor: "rgba(249, 115, 22, 0.8)",
      borderColor: "#f97316",
      borderWidth: 2,
      borderRadius: 8,
      hoverBackgroundColor: "#f97316"
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#f97316",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return context.parsed.y === 1 
              ? '1 quiz completed' 
              : context.parsed.y + ' quizzes completed';
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#64748b",
          font: { weight: 600 }
        },
        grid: {
          color: "rgba(226, 232, 240, 0.5)",
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: "#64748b",
          font: { weight: 600 }
        },
        grid: {
          display: false
        }
      }
    }
  }
});

// 🔥 SORTED completed quizzes (correct order)

const completedHistory = history
  .filter((q) => q.completed && q.totalQuestions > 0)
  .sort((a, b) => a.createdAt - b.createdAt);

// ---------- AVERAGE SCORE ----------
let averageScore = "--";

if (completedHistory.length > 0) {
  const totalPercentage = completedHistory.reduce(
    (sum, session) =>
      sum + Math.round((session.score / session.totalQuestions) * 100),
    0
  );
  averageScore = Math.round(totalPercentage / completedHistory.length) + "%";
}

// ---------- COMPLETION RATE ----------
let completionRate = "--";
if (totalQuizSessions > 0) {
  completionRate =
    Math.round((completedQuizzes / totalQuizSessions) * 100) + "%";
}

// ---------- IMPROVEMENT ----------
let improvement = "--";

if (completedHistory.length >= 2) {
  const first = Math.round(
    (completedHistory[0].score / completedHistory[0].totalQuestions) * 100
  );

  const last = Math.round(
    (completedHistory[completedHistory.length - 1].score /
      completedHistory[completedHistory.length - 1].totalQuestions) *
      100
  );

  let diff = last - first;

  if (!isNaN(diff)) {
    improvement = (diff > 0 ? "+" : "") + diff + "%";
  }
}

// ---------- UI UPDATE ----------
document.getElementById("totalAttempted").textContent = completedQuizzes;
document.getElementById("averageScore").textContent = averageScore;
document.getElementById("improvement").textContent = improvement;

document.getElementById("totalAttemptsDash").textContent = totalQuizSessions;
document.getElementById("averageScoreDash").textContent = averageScore;
document.getElementById("completionRateDash").textContent = completionRate;
document.getElementById("improvementDash").textContent = improvement;

// ---------- CONTINUE BUTTON ----------
if (!savedState || savedState.quizStatus !== "in-progress") {
  continueQuizBtn.disabled = true;
  continueQuizBtn.style.opacity = "0.5";
  continueQuizBtn.style.cursor = "not-allowed";
  continueQuizBtn.textContent = "No Quiz to Resume";
} else {
  continueQuizBtn.disabled = false;
  continueQuizBtn.style.opacity = "1";
  continueQuizBtn.style.cursor = "pointer";
  continueQuizBtn.textContent = "Continue Quiz";
}

// ---------- START NEW QUIZ ----------
startNewQuizBtn.addEventListener("click", () => {
  const quizId = "quiz_" + Date.now();

  localStorage.setItem("activeQuiz", quizId);
  localStorage.removeItem(quizStateKey);

  const totalQuestionsPlaceholder = 30;

  history.unshift({
    id: quizId,
    title: "General Quiz",
    score: 0,
    currentIndex: 0,
    completed: false,
    createdAt: Date.now(), // 🔥 FIXED
    lastUpdated: Date.now(),
    totalQuestions: totalQuestionsPlaceholder,
  });

  localStorage.setItem(historyKey, JSON.stringify(history));

  window.location.href = "../Screens/quiz.html";
});

// ---------- RECENT QUIZZES ----------
const recentBox = document.getElementById("recentQuizBox");
recentBox.innerHTML = "";

history
  .sort((a, b) => b.lastUpdated - a.lastUpdated)
  .slice(0, 5)
  .forEach((q) => {
    let div = document.createElement("div");
    div.className = "activity-item";
    div.innerHTML = `
      <div class="activity-info">
        <h4>${q.title}</h4>
        <p>${q.completed ? "Completed" : `Q${q.currentIndex + 1}`}</p>
      </div>
      <div class="activity-score">${
        q.completed && q.totalQuestions > 0
          ? Math.round((q.score / q.totalQuestions) * 100) + "%"
          : ""
      }</div>
    `;
    div.onclick = () => {
      localStorage.setItem("activeQuiz", q.id);
      window.location.href = "../Screens/quiz.html";
    };

    recentBox.appendChild(div);
  });

// Resume quiz
continueQuizBtn.addEventListener("click", () => {
  if (!continueQuizBtn.disabled && savedState && savedState.activeQuizId) {
    localStorage.setItem("activeQuiz", savedState.activeQuizId);
  }
  if (!continueQuizBtn.disabled) {
    window.location.href = "../Screens/quiz.html";
  }
});
