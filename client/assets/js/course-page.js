
const API_URL = "http://localhost:3000/api";

const courseId = new URLSearchParams(window.location.search).get("id");

const courseName = document.getElementById("course-name");
const courseCode = document.getElementById("course-code");
const courseDepartment = document.getElementById("course-department");
const professorList = document.getElementById("professor-list");
const reviewsList = document.getElementById("reviews-list");
const saveButton = document.getElementById("save-course");

// Display a message if the page was opened without a course ID.
if (!courseId || !/^\d+$/.test(courseId)) {
    showPageError("Invalid or missing course ID.");
} else {
    loadCoursePage();
}

function showPageError(message) {
    courseName.textContent = message;
    courseDepartment.textContent = "";
    courseCode.textContent = "";
    professorList.textContent = message;
    reviewsList.textContent = message;

    if (saveButton) {
        saveButton.disabled = true;
    }
}

// Fetch course information and reviews.
async function loadCoursePage() {
    try {
        const [courseResponse, reviewsResponse] = await Promise.all([
            fetch(`${API_URL}/courses/${courseId}`),
            fetch(`${API_URL}/courses/${courseId}/reviews`)
        ]);

        if (!courseResponse.ok) {
            throw new Error(
                courseResponse.status === 404
                    ? "Course not found."
                    : "Failed to load course information."
            );
        }

        if (!reviewsResponse.ok) {
            throw new Error("Failed to load course reviews.");
        }

        const course = await courseResponse.json();
        const reviews = await reviewsResponse.json();

        displayCourseInformation(course);
        displayProfessors(course.professors);
        displayReviews(reviews);

        document.title = `CourseLens - ${course.course_code}`;
    } catch (error) {
        console.error("Error loading course page:", error);

        courseName.textContent = "Unable to load course";
        courseDepartment.textContent = "";
        courseCode.textContent = "";
        professorList.textContent = error.message;
        reviewsList.textContent = error.message;
    }
}

// Display the course name, code, and department.
function displayCourseInformation(course) {
    courseName.textContent = course.course_name;
    courseCode.textContent = course.course_code;
    courseDepartment.textContent = course.department_name;
}

// Display the professors who teach this course.
function displayProfessors(professors) {
    professorList.replaceChildren();

    if (!professors || professors.length === 0) {
        professorList.textContent = "No professors are listed for this course.";
        return;
    }

    professors.forEach((professor) => {
        const professorElement = document.createElement("div");
        professorElement.className = "professor-info";

        const avatar = document.createElement("div");
        avatar.className = "professor-avatar";
        avatar.textContent = professor.name.charAt(0).toUpperCase();

        const information = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = professor.name;

        const description = document.createElement("p");
        description.textContent = "Course instructor";

        information.append(name, description);
        professorElement.append(avatar, information);

        professorList.appendChild(professorElement);
    });
}

// Display student reviews.
function displayReviews(reviews) {
    reviewsList.replaceChildren();

    if (!reviews || reviews.length === 0) {
        reviewsList.textContent = "There are no reviews for this course yet.";
        return;
    }

    reviews.forEach((review) => {
        const reviewElement = document.createElement("div");
        reviewElement.className = "review";

        const heading = document.createElement("h3");
        heading.textContent = review.username || "Anonymous student";

        const details = document.createElement("p");
        const rating = review.overall_rating == null
            ? "No rating"
            : `${review.overall_rating}/5`;

        const semester = review.semester || "Unknown semester";
        const professor = review.professor_name || "Unknown professor";

        details.textContent = `${rating} · ${semester} · ${professor}`;

        const reviewText = document.createElement("p");
        reviewText.textContent =
            review.review_text || "No written comment provided.";

        reviewElement.append(heading, details, reviewText);
        reviewsList.appendChild(reviewElement);
    });
}

// Save and unsave the currently displayed course.
if (saveButton && courseId && /^\d+$/.test(courseId)) {
    let savedCourses = [];

    try {
        const storedCourses = JSON.parse(
            localStorage.getItem("savedCourses") || "[]"
        );

        if (Array.isArray(storedCourses)) {
            savedCourses = storedCourses;
        }
    } catch {
        savedCourses = [];
    }

    function updateSaveButton() {
        const isSaved = savedCourses.includes(courseId);

        saveButton.textContent = isSaved ? "★ Saved" : "☆ Save Course";
        saveButton.classList.toggle("saved", isSaved);
        saveButton.setAttribute("aria-pressed", String(isSaved));
    }

    updateSaveButton();

    saveButton.addEventListener("click", () => {
        if (savedCourses.includes(courseId)) {
            savedCourses = savedCourses.filter((id) => id !== courseId);
        } else {
            savedCourses.push(courseId);
        }

        localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

        updateSaveButton();
    });
}
