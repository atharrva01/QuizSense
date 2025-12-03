const usernameInput = document.getElementById("username");
const submitBtn = document.getElementById("submit_btn");
const errorMessage = document.getElementById("errorMessage");

// Focus input on load
usernameInput.focus();

// Handle Enter key
usernameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
});

// Handle button click
submitBtn.addEventListener("click", handleSubmit);

function handleSubmit() {
  const username = usernameInput.value.trim();

  // Validation
  if (!username) {
    errorMessage.classList.add("show");
    usernameInput.focus();

    // Remove error after 3 seconds
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 3000);
    return;
  }

  // Hide error if shown
  errorMessage.classList.remove("show");

  // Save to localStorage
  localStorage.setItem("currentUser", username);

  // Add loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Loading...";

  // Redirect to home page
  setTimeout(() => {
    window.location.href = "../Screens/home.html";
  }, 500);
}

// Check if user is already logged in
const currentUser = localStorage.getItem("currentUser");
if (currentUser) {
  // Pre-fill the name
  usernameInput.value = currentUser;
}
