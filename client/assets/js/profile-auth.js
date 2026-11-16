import { getCurrentUser, logOut } from "./session.js";

// No top-level await: Vite's default build target does not allow it.
getCurrentUser().then((user) => {
  if (!user) {
    // Signed out: log in, then come back here.
    window.location.replace(`/pages/auth/logIn_page.html?next=${encodeURIComponent("/pages/profile.html")}`);
  } else {
    document.querySelector("#profile-username").textContent = user.username;
    document.querySelector("#profile-email").textContent = user.email;
    document.querySelector("#profile-created").textContent = new Date(user.created_at).toLocaleDateString();

    document.querySelector("#logout-button").addEventListener("click", async () => {
      try {
        await logOut();
      } finally {
        window.location.assign("/pages/auth/logIn_page.html");
      }
    });
  }
});
