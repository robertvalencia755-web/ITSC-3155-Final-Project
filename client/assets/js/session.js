// Talks to the /api/auth routes. Every request sends credentials so the browser
// includes the httpOnly session cookie the server set at log-in.
export const API_URL = "http://localhost:3000/api";

async function send(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return body;
}

// The signed-in user, or null when nobody is signed in.
export async function getCurrentUser() {
  try {
    return await send("/auth/me");
  } catch {
    return null;
  }
}

// login is an email or a username.
export function logIn(login, password) {
  return send("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) });
}

export function signUp(email, username, password) {
  return send("/auth/signup", { method: "POST", body: JSON.stringify({ email, username, password }) });
}

export function logOut() {
  return send("/auth/logout", { method: "POST" });
}

// Where to go after signing in: ?next=/pages/... if it is a path on this site, else the profile.
export function nextPage() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/pages/profile.html";
}
