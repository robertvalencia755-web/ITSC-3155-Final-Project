import { getCurrentUser, logIn, nextPage, signUp } from "./session.js";

const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const form = loginForm ?? signupForm;
const errorBox = document.querySelector("#form-error");

// Same rules the server checks (server/src/Validation/authValidation.ts), so mistakes show
// up in the red box straight away instead of as the browser's small tooltip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function loginProblem(data) {
  if (!data.get("login").trim() || !data.get("password")) {
    return "Enter your email or username and your password.";
  }
  return null;
}

function signupProblem(data) {
  const email = data.get("email").trim();
  const username = data.get("username").trim();
  const password = data.get("password");

  if (!email || !username || !password) return "Fill in every field.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address, like you@example.com.";
  if (!USERNAME_PATTERN.test(username)) return "Username must be 3 to 30 letters, numbers or underscores.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== data.get("verify_password")) return "Passwords do not match.";
  return null;
}

// Already signed in: skip the form.
getCurrentUser().then((user) => {
  if (user) {
    window.location.replace(nextPage());
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const data = new FormData(form);
  const problem = loginForm ? loginProblem(data) : signupProblem(data);
  if (problem) {
    showError(problem);
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    if (loginForm) {
      await logIn(data.get("login").trim(), data.get("password"));
    } else {
      await signUp(data.get("email").trim(), data.get("username").trim(), data.get("password"));
    }
    window.location.assign(nextPage());
  } catch (error) {
    showError(
      error instanceof TypeError
        ? "Could not reach the server. Is the API running on port 3000?"
        : error.message
    );
  } finally {
    button.disabled = false;
  }
});
