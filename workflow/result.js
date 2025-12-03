// ----------------- GET USER + HISTORY DATA -----------------
const currentUser = localStorage.getItem("currentUser") || "demo_user";
const historyKey = `quizHistory_${currentUser}`;
const history = JSON.parse(localStorage.getItem(historyKey)) || [];

const activeQuiz = localStorage.getItem("activeQuiz");

// Find the finished quiz record
const quizData = history.find((q) => q.id === activeQuiz && q.completed);

if (!quizData) {
  alert("No quiz result found. Redirecting...");
  window.location.href = "../Screens/home.html";
}

// ----------------- EXTRACT VALUES -----------------
const score = quizData.score || 0;
const total = quizData.totalQuestions || 0;
const percentage = Math.round((score / total) * 100);
const attempts = quizData.attempts || [];

// ----------------- UPDATE UI -----------------
document.getElementById("scoreText").textContent = percentage + "%";
document.getElementById("correctAnswers").textContent = score;
document.getElementById("totalQuestions").textContent = total;

// ----------------- DYNAMIC MESSAGE -----------------
const messageBox = document.getElementById("messageBox");

let message = "";
let icon = "";

if (percentage >= 90) {
  icon = "🌟";
  message = "Outstanding! You're a quiz master!";
} else if (percentage >= 75) {
  icon = "🎉";
  message = "Excellent work! Keep practicing.";
} else if (percentage >= 60) {
  icon = "👍";
  message = "Good job! You're improving.";
} else if (percentage >= 40) {
  icon = "💪";
  message = "Keep going! Practice makes perfect.";
} else {
  icon = "📚";
  message = "Review topics and try again.";
}

messageBox.innerHTML = `<p>${icon} ${message}</p>`;

// ----------------- OPTIONAL: STORE STATS FOR HOME + ANALYTICS -----------------
const dailyKey = `dailyAttempts_${currentUser}`;
let dailyStats = JSON.parse(localStorage.getItem(dailyKey)) || [];

// Push new attempt record (date + quiz score)
dailyStats.push({
  date: new Date().toISOString().split("T")[0],
  score: percentage,
  quizId: activeQuiz,
});

localStorage.setItem(dailyKey, JSON.stringify(dailyStats));

// ----------------- BUTTONS -----------------
document.getElementById("homeBtn").addEventListener("click", () => {
  window.location.href = "../Screens/home.html";
});

document.getElementById("analyticsBtn").addEventListener("click", () => {
  window.location.href = "../Screens/analytics.html";
});
