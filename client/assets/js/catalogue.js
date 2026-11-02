
const API_URL = "http://localhost:3000/api";

const searchForm = document.querySelector("#catalogue-search-form");
const searchInput = document.querySelector("#course-search");
const departmentFilter = document.querySelector("#department-filter");
const professorFilter = document.querySelector("#professor-filter");
const resultsList = document.querySelector("#results-list");
const resultsCount = document.querySelector("#results-count");

// Load department and professor options
async function loadFilters() {
    try {
        const [departmentsResponse, professorsResponse] = await Promise.all([
            fetch(`${API_URL}/departments`),
            fetch(`${API_URL}/professors`)
        ]);

        if (!departmentsResponse.ok || !professorsResponse.ok) {
            throw new Error("Unable to load filters");
        }

        const departments = await departmentsResponse.json();
        const professors = await professorsResponse.json();

        departments.forEach((department) => {
            const option = document.createElement("option");
            option.value = department.department_id;
            option.textContent = department.department_name;
            departmentFilter.appendChild(option);
        });

        professors.forEach((professor) => {
            const option = document.createElement("option");
            option.value = professor.professor_id;
            option.textContent = professor.name;
            professorFilter.appendChild(option);
        });

    } catch (error) {
        console.error("Failed to load filters:", error);
    }
}

// Fetch courses using the selected search criteria
async function searchCourses() {
    const params = new URLSearchParams();

    const query = searchInput.value.trim();
    const departmentId = departmentFilter.value;
    const professorId = professorFilter.value;

    if (query) {
        params.append("q", query);
    }

    if (departmentId) {
        params.append("department_id", departmentId);
    }

    if (professorId) {
        params.append("professor_id", professorId);
    }

    resultsCount.textContent = "Loading courses...";
    resultsList.replaceChildren();

    try {
        const response = await fetch(
            `${API_URL}/courses?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Unable to fetch courses");
        }

        const courses = await response.json();

        displayCourses(courses);

    } catch (error) {
        console.error("Course search failed:", error);

        resultsCount.textContent = "Unable to load courses.";

        const message = document.createElement("p");
        message.className = "results-message";
        message.textContent = "Please try again later.";

        resultsList.appendChild(message);
    }
}

// Display the matching courses
function displayCourses(courses) {
    resultsList.replaceChildren();

    resultsCount.textContent =
        `${courses.length} course(s) found`;

    if (courses.length === 0) {
        const message = document.createElement("p");
        message.className = "results-message";
        message.textContent = "No courses found. Try different search criteria.";

        resultsList.appendChild(message);
        return;
    }

    courses.forEach((course) => {
        const card = document.createElement("a");
        card.className = "course-card";
        card.href = `/pages/course.html?id=${encodeURIComponent(course.course_id)}`;

        const department = document.createElement("span");
        department.className = "dept";
        department.textContent = course.department_name;

        const name = document.createElement("h3");
        name.textContent = course.course_name;

        const code = document.createElement("p");
        code.className = "code";
        code.textContent = course.course_code;

        const rating = document.createElement("div");
        rating.className = "rating-pill";

        rating.textContent =
            course.avg_rating === null
                ? "No ratings yet"
                : `${Number(course.avg_rating).toFixed(1)} / 5 ★`;

        card.append(department, name, code, rating);
        resultsList.appendChild(card);
    });
}

// Handle search form submission
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchCourses();
});

// Handle clearing the filters
searchForm.addEventListener("reset", () => {
    setTimeout(() => {
        searchCourses();
    }, 0);
});

// Load filters and all courses when the page opens
loadFilters();
searchCourses();
