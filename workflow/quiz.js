// js/quiz.js

import questions from "../data/questions.js";

let currentIndex = 0; // 0-based index of current question in the session
let currentQuestion = null;
let selectedAnswer = null;
let hasSubmitted = false;
let score = 0;
let selectedAnswers = [];
let quizFinished = false;


// Adaptive state
let ability = 0; // overall skill estimate (-2 to +2)
let askedQuestionIds = new Set(); // IDs of questions already asked
let topicStats = {}; // { [topic]: { total, correct } }

// Use full bank for now (you can change this to a smaller value if you want)
const MAX_QUESTIONS = questions.length;

// UI Elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const nextBtn = document.getElementById("nextBtn");
const questionCounter = document.getElementById("questionCounter");
const progressFill = document.getElementById("progressFill");
const feedbackBox = document.getElementById("feedbackBox");
const difficultyTag = document.getElementById("difficultyTag");
const exitBtn = document.getElementById("exitQuiz");

// ---------------------- LOCALSTORAGE KEYS ----------------------

const currentUser = localStorage.getItem("currentUser");
const activeQuiz = localStorage.getItem("activeQuiz");

const historyKey = `quizHistory_${currentUser}`;
const quizStateKey = `quizState_${currentUser}`;

const savedState = JSON.parse(localStorage.getItem(quizStateKey));

// ---------------------- ADAPTIVE HELPERS ----------------------

// Map ability → difficulty
function getDifficultyFromAbility(abilityValue) {
  if (abilityValue < -0.5) return "easy";
  if (abilityValue > 0.5) return "hard";
  return "medium";
}

// Find weakest topic (lowest accuracy)
function getWeakestTopic() {
  let weakestTopic = null;
  let weakestAccuracy = 1; // 1 = 100%

  for (const [topic, stats] of Object.entries(topicStats)) {
    if (stats.total === 0) continue;
    const accuracy = stats.correct / stats.total;
    if (accuracy < weakestAccuracy) {
      weakestAccuracy = accuracy;
      weakestTopic = topic;
    }
  }

  return weakestTopic;
}

// Update ability + topic stats after each answer
function updateStats(question, isCorrect) {
  const topic = question.topic;

  if (!topicStats[topic]) {
    topicStats[topic] = { total: 0, correct: 0 };
  }

  topicStats[topic].total++;
  if (isCorrect) topicStats[topic].correct++;

  const baseDelta =
    question.difficulty === "easy"
      ? 0.2
      : question.difficulty === "medium"
      ? 0.3
      : 0.4;

  if (isCorrect) {
    ability += baseDelta;
  } else {
    ability -= baseDelta;
  }

  // Clamp ability
  if (ability > 2) ability = 2;
  if (ability < -2) ability = -2;
}

// Pick next question based on ability + weakest topic
function getNextQuestion(allQuestions) {
  if (askedQuestionIds.size >= MAX_QUESTIONS) {
    return null; // reached session limit
  }

  const desiredDifficulty = getDifficultyFromAbility(ability);
  const weakestTopic = getWeakestTopic();

  // 1. desired difficulty + weakest topic (if any)
  let candidates = allQuestions.filter(
    (q) =>
      !askedQuestionIds.has(q.id) &&
      q.difficulty === desiredDifficulty &&
      (weakestTopic ? q.topic === weakestTopic : true)
  );

  // 2. relax: any topic, same difficulty
  if (candidates.length === 0) {
    candidates = allQuestions.filter(
      (q) => !askedQuestionIds.has(q.id) && q.difficulty === desiredDifficulty
    );
  }

  // 3. relax: any difficulty, weakest topic
  if (candidates.length === 0 && weakestTopic) {
    candidates = allQuestions.filter(
      (q) => !askedQuestionIds.has(q.id) && q.topic === weakestTopic
    );
  }

  // 4. last fallback: any remaining question
  if (candidates.length === 0) {
    candidates = allQuestions.filter((q) => !askedQuestionIds.has(q.id));
  }

  if (candidates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  const nextQuestion = candidates[randomIndex];
  askedQuestionIds.add(nextQuestion.id);
  return nextQuestion;
}

// Rebuild adaptive state from previous attempts (when resuming quiz)
function rebuildAdaptiveStateFromHistory() {
  ability = 0;
  askedQuestionIds = new Set();
  topicStats = {};

  selectedAnswers.forEach((entry) => {
    const q = questions.find((qq) => qq.id === entry.questionId);
    if (!q) return;

    askedQuestionIds.add(q.id);

    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { total: 0, correct: 0 };
    }

    topicStats[q.topic].total++;
    if (entry.correct) topicStats[q.topic].correct++;

    const baseDelta =
      q.difficulty === "easy" ? 0.2 : q.difficulty === "medium" ? 0.3 : 0.4;

    if (entry.correct) {
      ability += baseDelta;
    } else {
      ability -= baseDelta;
    }
  });

  if (ability > 2) ability = 2;
  if (ability < -2) ability = -2;
}

// ---------------------- LOAD SAVED PROGRESS (IF EXISTS) ----------------------

if (savedState && savedState.quizStatus === "in-progress" && activeQuiz) {
  if (savedState.activeQuizId !== activeQuiz) {
    console.warn("Mismatched activeQuiz ID in saved state. Starting fresh.");
    currentIndex = 0;
    score = 0;
    selectedAnswers = [];
  } else {
    score = savedState.score || 0;
    selectedAnswers = savedState.selectedAnswers || [];
    // Recompute currentIndex from how many questions have actually been answered
    currentIndex = selectedAnswers.length;
    rebuildAdaptiveStateFromHistory();
  }
}

// ---------------------- SAVE PROGRESS FUNCTION ----------------------

function saveProgress() {
  const quizState = {
    currentIndex,
    score,
    selectedAnswers,
    quizStatus: "in-progress",
    timestamp: Date.now(),
    activeQuizId: activeQuiz,
  };

  localStorage.setItem(quizStateKey, JSON.stringify(quizState));

  let history = JSON.parse(localStorage.getItem(historyKey)) || [];
  let quiz = history.find((q) => q.id === activeQuiz);

  if (quiz) {
    quiz.score = score;
    quiz.currentIndex = currentIndex;
    quiz.lastUpdated = Date.now();
    quiz.totalQuestions = MAX_QUESTIONS;

    // ❗ Only set completed status if not already completed
    if (!quiz.completed) {
      quiz.completed = false;
    }
  }


  localStorage.setItem(historyKey, JSON.stringify(history));
}

// ---------------------- EXIT / UNLOAD HANDLERS ----------------------

exitBtn.addEventListener("click", () => {
  saveProgress();
  window.location.href = "../Screens/home.html";
});

window.addEventListener("beforeunload", () => {
  if (!quizFinished) saveProgress();
});

// ---------------------- END QUIZ ----------------------

function endQuiz() {
  localStorage.removeItem(quizStateKey);

  let history = JSON.parse(localStorage.getItem(historyKey)) || [];
  let quiz = history.find((q) => q.id === activeQuiz);

  // If no existing record, create one
  if (!quiz) {
    quiz = {
      id: activeQuiz,
      createdAt: Date.now(),
    };
    history.push(quiz);
  }

  // ✅ Finalize quiz details
  quiz.completed = true;
  quizFinished = true;
  quiz.score = score;
  quiz.currentIndex = MAX_QUESTIONS;
  quiz.lastUpdated = Date.now();
  quiz.totalQuestions = MAX_QUESTIONS;

  // 🔥 THIS IS THE IMPORTANT LINE FOR ANALYTICS
  quiz.attempts = selectedAnswers; // full question-level analytics

  localStorage.setItem(historyKey, JSON.stringify(history));

  // still keep these for result page
  localStorage.setItem("quizScore", score);
  localStorage.setItem("totalQuestions", MAX_QUESTIONS);
  localStorage.setItem("quizAttempts", JSON.stringify(selectedAnswers));

  window.location.href = "./result.html";
}


// ---------------------- LOAD QUESTION FUNCTION ----------------------

function loadQuestion() {
  hasSubmitted = false;
  nextBtn.textContent = "Submit";
  nextBtn.disabled = true;
  selectedAnswer = null;

  feedbackBox.classList.add("hidden");
  feedbackBox.innerHTML = "";

  // If we don't yet have a currentQuestion (new quiz or resumed),
  // pick one adaptively.
  if (!currentQuestion) {
    currentQuestion = getNextQuestion(questions);
    if (!currentQuestion) {
      endQuiz();
      return;
    }
  }

  const q = currentQuestion;

  // Set question text
  questionText.textContent = q.question;

  // Set difficulty tag
  difficultyTag.textContent = `Difficulty: ${q.difficulty}`;
  difficultyTag.className = `difficulty-tag ${q.difficulty}`;

  // Progress UI
  questionCounter.textContent = `Question ${
    currentIndex + 1
  } / ${MAX_QUESTIONS}`;
  progressFill.style.width = `${((currentIndex + 1) / MAX_QUESTIONS) * 100}%`;

  // Render Options
  optionsContainer.innerHTML = "";
  q.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;

    btn.onclick = () => {
      if (hasSubmitted) return; // block changing answer after submit

      document
        .querySelectorAll(".option-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = option;
      nextBtn.disabled = false;
    };

    optionsContainer.appendChild(btn);
  });
}

// ---------------------- NEXT/SUBMIT BUTTON LOGIC ----------------------

nextBtn.addEventListener("click", () => {
  const q = currentQuestion;

  // First phase: Submit Answer
  if (!hasSubmitted) {
    if (!selectedAnswer) return; // no selection, ignore

    const isCorrect = selectedAnswer === q.answer;

    selectedAnswers.push({
      questionId: q.id,
      selected: selectedAnswer,
      correct: isCorrect,
      difficulty: q.difficulty,
      topic: q.topic,
      timestamp: Date.now(),
    });

    if (isCorrect) {
      score++;
      feedbackBox.className = "feedback correct";
      feedbackBox.innerHTML = `✔ Correct!<br><strong>${q.explanation}</strong>`;
    } else {
      feedbackBox.className = "feedback wrong";
      feedbackBox.innerHTML = `❌ Incorrect.<br>Correct answer: <strong>${q.answer}</strong><br><br>${q.explanation}`;
    }

    // Disable options after submitting
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.disabled = true;
      btn.classList.add("locked");
    });

    feedbackBox.classList.remove("hidden");
    nextBtn.textContent =
      currentIndex === MAX_QUESTIONS - 1 ? "Finish" : "Next →";
    hasSubmitted = true;

    // Update adaptive stats
    updateStats(q, isCorrect);

    saveProgress();
    return;
  }

  // Second phase: Move to next question
  currentIndex++;

  if (currentIndex < MAX_QUESTIONS) {
    currentQuestion = getNextQuestion(questions);

    if (!currentQuestion) {
      endQuiz();
      return;
    }

    saveProgress();
    loadQuestion();
  } else {
    endQuiz();
  }
});

// ---------------------- INITIALIZATION ----------------------

if (!activeQuiz) {
  console.error("No active quiz ID found. Redirecting to home.");
  window.location.href = "../Screens/home.html";
} else {
  // Start quiz: currentQuestion will be picked adaptively in loadQuestion()
  loadQuestion();
}
