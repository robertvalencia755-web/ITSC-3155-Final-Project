
import {
  createIcons,
  Search,
  BookOpen,
  MessageSquare,
  Bookmark,
} from "lucide";

createIcons({
  icons: {
    Search,
    BookOpen,
    MessageSquare,
    Bookmark,
  },
});

const searchForm = document.querySelector(".search-bar");
const searchInput = document.querySelector("#course-search");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    searchInput.focus();
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/courses?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error("Unable to search courses");
    }

    const courses = await response.json();

    console.log("CourseLens search results:", courses);

const resultsSection = document.querySelector("#search-results");
const resultsHeading = document.querySelector("#results-heading");
const resultsCount = document.querySelector("#results-count");
const resultsList = document.querySelector("#results-list");

// Show the search results section
resultsSection.hidden = false;

// Update the heading
resultsHeading.textContent = `Search results for "${query}"`;

// Show how many courses were found
resultsCount.textContent = `${courses.length} course(s) found`;

// Clear any previous results
resultsList.replaceChildren();

// Create a card for each matching course
courses.forEach((course) => {
  
const card = document.createElement("a");
card.className = "result-card";
card.href = `/pages/course.html?id=${encodeURIComponent(course.course_id)}`;
card.setAttribute(
  "aria-label",
  `View details for ${course.course_code}: ${course.course_name}`
);

  const code = document.createElement("h3");
  code.textContent = course.course_code;

  const name = document.createElement("p");
  name.textContent = course.course_name;

  const rating = document.createElement("div");
  rating.className = "result-rating";

  const star = document.createElement("span");
  star.className = "star";
  star.textContent = "★";
  star.setAttribute("aria-hidden", "true");

  const ratingText = document.createElement("span");
  ratingText.textContent =
    course.avg_rating === null
      ? "No ratings yet"
      : `${Number(course.avg_rating).toFixed(1)} / 5`;

  rating.append(star, ratingText);
  card.append(code, name, rating);
  resultsList.appendChild(card);
});

// Display a message if no courses match
if (courses.length === 0) {
  resultsCount.textContent = "No courses found. Try another search.";
}
  } catch (error) {
    console.error("CourseLens search failed:", error);
    alert("Unable to search courses. Please try again.");
  }
});

