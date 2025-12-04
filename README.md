# 🎯 Adaptive Quiz Engine with Item Bank & Analytics

A dynamic quiz system that adjusts question difficulty based on user performance, stores history, and visualizes learning progress using analytics.

---

## 🚀 Core Features

### 🧠 Adaptive Quiz Mechanism
- Difficulty changes after every answer.
- Ability score updates based on correctness and previous difficulty.
- No fixed order — every user gets a unique adaptive learning path.

### 📚 Item Bank
- Questions stored with:
  - Difficulty level (Easy / Medium / Hard)
  - Topic tags
  - Correct answer + multiple choices

### 📊 Analytics Dashboard
Tracks and displays:
- Attempts in the last 7 days
- Difficulty progression curve
- Score improvement rate
- Accuracy over time

### 👤 User Progress
- Data stored locally per user
- Resume incomplete quizzes
- History preserved across sessions

---

## 🛠 Tech Stack

| Component | Technology |
|----------|------------|
| Frontend | HTML, CSS, JavaScript (ES6) |
| Data Storage | LocalStorage |
| Charts | Chart.js |
| Version Control | Git & GitHub |

---

## 📂 Folder Structure
<img width="327" height="704" alt="image" src="https://github.com/user-attachments/assets/ad98e9e4-675b-473a-922c-db4ab47b5d9b" />

---

## ⚙️ How It Works

1. User logs in.
2. System starts with a neutral ability level (0).
3. First question selected from medium difficulty.
4. After each answer:
   
If Correct → increase difficulty
If Wrong → decrease difficulty
Ability Score updates

5. Results are saved.
6. Analytics update automatically.

---

## 📈 Key Calculations

### ✔ Improvement Rate

((LatestScore - FirstScore)


### ✔ Last 7-Day Activity

- Filters stored timestamps
- Generates graph using Chart.js

---

## 🔮 Future Enhancements

- Firebase authentication & cloud storage
- Topic-wise mastery analytics
- Admin item-bank dashboard
- Leaderboards and gamification
- AI-based item generation

---

## 🔗 Deployment Link  
https://atharrva01.github.io/QuizSense/

---

## LightHouse Performance Check

<img width="1674" height="590" alt="image" src="https://github.com/user-attachments/assets/74f3c65b-3e7c-458f-a732-4e8651d81aee" />
<img width="1645" height="619" alt="image" src="https://github.com/user-attachments/assets/9da39fd7-68e7-4d93-b06e-c3e833d5128a" />



## 📄 License

This project is for academic and research purposes.



