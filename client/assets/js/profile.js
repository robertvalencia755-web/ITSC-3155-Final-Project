const API_URL = "http://localhost:3000/api";
const DEFAULT_AVATAR = "/assets/images/DefaultProfile.jpeg";

const userId = new URLSearchParams(window.location.search).get("user_id") || localStorage.getItem("current_user_id") || "1";

const profileAvatarImg = document.querySelector("#profile-avatar-img");
const avatarContainer = document.querySelector("#avatar-container");
const profileUsername = document.querySelector("#profile-username");
const profileEmail = document.querySelector("#profile-email");
const profileCreated = document.querySelector("#profile-created");

const changeUsernameBtn = document.querySelector("#change-username-btn");
const changeEmailBtn = document.querySelector("#change-email-btn");

const editFieldModal = document.querySelector("#edit-field-modal");
const editFieldTitle = document.querySelector("#edit-field-title");
const editFieldLabel = document.querySelector("#edit-field-label");
const editFieldInput = document.querySelector("#edit-field-input");
const editFieldStatus = document.querySelector("#edit-field-status");
const editFieldCloseBtn = document.querySelector("#edit-field-close-btn");
const editFieldCancelBtn = document.querySelector("#edit-field-cancel-btn");
const editFieldSaveBtn = document.querySelector("#edit-field-save-btn");
const editFieldForm = document.querySelector("#edit-field-form");

const avatarModal = document.querySelector("#avatar-modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalCancelBtn = document.querySelector("#modal-cancel-btn");
const modalSaveBtn = document.querySelector("#modal-save-btn");
const avatarFileInput = document.querySelector("#avatar-file-input");
const uploadDropZone = document.querySelector("#upload-drop-zone");
const avatarPreviewImg = document.querySelector("#avatar-preview-img");
const uploadStatus = document.querySelector("#upload-status");

const savedCoursesGrid = document.querySelector("#saved-courses-grid");
const userReviewsList = document.querySelector("#user-reviews-list");

let pendingAvatarDataUrl = null;

// Fetch and populate profile information
async function loadUserProfile() {
    try {
        let response = await fetch(`${API_URL}/users/${userId}/account`);
        if (!response.ok) {
            response = await fetch(`${API_URL}/users/${userId}`);
        }
        if (!response.ok) {
            throw new Error(`Failed to load profile (status ${response.status})`);
        }

        const user = await response.json();

        if (profileUsername && user.username) {
            profileUsername.textContent = user.username;
        }

        if (profileEmail && user.email) {
            profileEmail.textContent = user.email;
        }

        if (profileCreated && user.created_at) {
            const date = new Date(user.created_at);
            profileCreated.textContent = date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        }

        const avatarSrc = user.profile_picture || DEFAULT_AVATAR;
        if (profileAvatarImg) {
            profileAvatarImg.src = avatarSrc;
            profileAvatarImg.onerror = () => {
                profileAvatarImg.src = DEFAULT_AVATAR;
            };
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

function openModal() {
    if (!avatarModal) return;
    pendingAvatarDataUrl = null;
    if (avatarPreviewImg && profileAvatarImg) {
        avatarPreviewImg.src = profileAvatarImg.src || DEFAULT_AVATAR;
    }
    if (modalSaveBtn) {
        modalSaveBtn.disabled = true;
        modalSaveBtn.textContent = "Save";
    }
    if (uploadStatus) {
        uploadStatus.textContent = "";
        uploadStatus.className = "upload-status";
    }
    if (avatarFileInput) {
        avatarFileInput.value = "";
    }
    avatarModal.classList.add("open");
}

function closeModal() {
    if (!avatarModal) return;
    avatarModal.classList.remove("open");
    pendingAvatarDataUrl = null;
    if (avatarFileInput) {
        avatarFileInput.value = "";
    }
}

function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showStatus("Please choose an image file (PNG, JPG, or WebP).", "error");
        return;
    }

    // Limit to 3MB
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showStatus("Image is too large. Please select a file under 3MB.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        pendingAvatarDataUrl = e.target.result;
        if (avatarPreviewImg) {
            avatarPreviewImg.src = pendingAvatarDataUrl;
        }
        if (modalSaveBtn) {
            modalSaveBtn.disabled = false;
        }
        showStatus("Image selected. Click 'Save' to update.", "info");
    };

    reader.onerror = () => {
        showStatus("Could not read the selected image file.", "error");
    };

    reader.readAsDataURL(file);
}

function showStatus(message, type) {
    if (!uploadStatus) return;
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type || ""}`;
}

async function saveAvatar() {
    if (!pendingAvatarDataUrl) return;

    try {
        if (modalSaveBtn) {
            modalSaveBtn.disabled = true;
            modalSaveBtn.textContent = "Saving...";
        }

        const response = await fetch(`${API_URL}/users/${userId}/avatar`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ profile_picture: pendingAvatarDataUrl }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to update profile picture.");
        }

        const updated = await response.json();

        if (profileAvatarImg) {
            profileAvatarImg.src = updated.profile_picture || pendingAvatarDataUrl;
        }

        showStatus("Profile picture updated successfully!", "success");

        setTimeout(() => {
            closeModal();
        }, 700);
    } catch (error) {
        console.error("Failed to save avatar:", error);
        showStatus(error.message, "error");
        if (modalSaveBtn) {
            modalSaveBtn.disabled = false;
            modalSaveBtn.textContent = "Save";
        }
    }
}

// Event Listeners
if (avatarContainer) {
    avatarContainer.addEventListener("click", openModal);
    avatarContainer.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openModal();
        }
    });
}

if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
}

if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", closeModal);
}

if (avatarModal) {
    avatarModal.addEventListener("click", (e) => {
        if (e.target === avatarModal) {
            closeModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && avatarModal?.classList.contains("open")) {
        closeModal();
    }
});

if (uploadDropZone && avatarFileInput) {
    uploadDropZone.addEventListener("click", () => {
        avatarFileInput.click();
    });

    uploadDropZone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            avatarFileInput.click();
        }
    });

    uploadDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadDropZone.classList.add("dragover");
    });

    uploadDropZone.addEventListener("dragleave", () => {
        uploadDropZone.classList.remove("dragover");
    });

    uploadDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadDropZone.classList.remove("dragover");
        if (e.dataTransfer?.files?.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    avatarFileInput.addEventListener("change", (e) => {
        if (e.target.files?.length) {
            handleFile(e.target.files[0]);
        }
    });
}

if (modalSaveBtn) {
    modalSaveBtn.addEventListener("click", saveAvatar);
}

// Edit Field (Username / Email) Modal Logic
let activeEditField = null; // 'username' | 'email'

function openEditFieldModal(field) {
    if (!editFieldModal) return;
    activeEditField = field;

    if (editFieldStatus) {
        editFieldStatus.textContent = "";
        editFieldStatus.className = "upload-status";
    }
    if (editFieldSaveBtn) {
        editFieldSaveBtn.disabled = false;
        editFieldSaveBtn.textContent = "Save";
    }

    if (field === "username") {
        if (editFieldTitle) editFieldTitle.textContent = "Change Username";
        if (editFieldLabel) editFieldLabel.textContent = "New Username";
        if (editFieldInput) {
            editFieldInput.type = "text";
            editFieldInput.value = profileUsername ? profileUsername.textContent.trim() : "";
            editFieldInput.placeholder = "Enter new username (3-50 chars)";
        }
    } else if (field === "email") {
        if (editFieldTitle) editFieldTitle.textContent = "Change Email";
        if (editFieldLabel) editFieldLabel.textContent = "New Email Address";
        if (editFieldInput) {
            editFieldInput.type = "email";
            editFieldInput.value = profileEmail ? profileEmail.textContent.trim() : "";
            editFieldInput.placeholder = "Enter new email address";
        }
    }

    editFieldModal.classList.add("open");
    setTimeout(() => {
        if (editFieldInput) {
            editFieldInput.focus();
            editFieldInput.select();
        }
    }, 60);
}

function closeEditFieldModal() {
    if (!editFieldModal) return;
    editFieldModal.classList.remove("open");
    activeEditField = null;
    if (editFieldInput) editFieldInput.value = "";
    if (editFieldStatus) {
        editFieldStatus.textContent = "";
        editFieldStatus.className = "upload-status";
    }
}

function showEditStatus(message, type) {
    if (!editFieldStatus) return;
    editFieldStatus.textContent = message;
    editFieldStatus.className = `upload-status ${type || ""}`;
}

async function handleEditFieldSubmit(e) {
    e.preventDefault();
    if (!activeEditField || !editFieldInput) return;

    const rawValue = editFieldInput.value.trim();
    if (!rawValue) {
        showEditStatus(`${activeEditField === "username" ? "Username" : "Email"} cannot be blank.`, "error");
        return;
    }

    const payload = {};
    if (activeEditField === "username") {
        if (rawValue.length < 3 || rawValue.length > 50) {
            showEditStatus("Username must be between 3 and 50 characters.", "error");
            return;
        }
        payload.username = rawValue;
    } else if (activeEditField === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawValue)) {
            showEditStatus("Please enter a valid email address.", "error");
            return;
        }
        payload.email = rawValue;
    }

    try {
        if (editFieldSaveBtn) {
            editFieldSaveBtn.disabled = true;
            editFieldSaveBtn.textContent = "Saving...";
        }

        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "Failed to update profile.");
        }

        if (payload.username && profileUsername) {
            profileUsername.textContent = data.username;
        }
        if (payload.email && profileEmail) {
            profileEmail.textContent = data.email;
        }

        showEditStatus(`${activeEditField === "username" ? "Username" : "Email"} updated successfully!`, "success");

        setTimeout(() => {
            closeEditFieldModal();
        }, 700);
    } catch (error) {
        console.error("Update failed:", error);
        showEditStatus(error.message, "error");
        if (editFieldSaveBtn) {
            editFieldSaveBtn.disabled = false;
            editFieldSaveBtn.textContent = "Save";
        }
    }
}

if (changeUsernameBtn) {
    changeUsernameBtn.addEventListener("click", () => openEditFieldModal("username"));
}

if (changeEmailBtn) {
    changeEmailBtn.addEventListener("click", () => openEditFieldModal("email"));
}

if (editFieldCloseBtn) {
    editFieldCloseBtn.addEventListener("click", closeEditFieldModal);
}

if (editFieldCancelBtn) {
    editFieldCancelBtn.addEventListener("click", closeEditFieldModal);
}

if (editFieldModal) {
    editFieldModal.addEventListener("click", (e) => {
        if (e.target === editFieldModal) {
            closeEditFieldModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editFieldModal?.classList.contains("open")) {
        closeEditFieldModal();
    }
});

if (editFieldForm) {
    editFieldForm.addEventListener("submit", handleEditFieldSubmit);
}

// Fetch and render saved courses
async function loadSavedCourses() {
    if (!savedCoursesGrid) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}/saved-courses`);
        if (!response.ok) {
            throw new Error(`Failed to load saved courses (status ${response.status})`);
        }

        const courses = await response.json();
        savedCoursesGrid.replaceChildren();

        if (courses.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "empty-section-message";
            emptyMsg.textContent = "No saved courses yet. Browse the catalogue to save courses for quick access.";
            savedCoursesGrid.appendChild(emptyMsg);
            return;
        }

        courses.forEach((course) => {
            const card = document.createElement("a");
            card.className = "course-card";
            card.href = `/pages/course.html?id=${encodeURIComponent(course.course_id)}`;

            const infoDiv = document.createElement("div");

            const dept = document.createElement("span");
            dept.className = "dept";
            dept.textContent = course.department_name;

            const name = document.createElement("h3");
            name.textContent = course.course_name;

            const code = document.createElement("p");
            code.className = "code";
            code.textContent = course.course_code;

            infoDiv.append(dept, name, code);

            const rating = document.createElement("div");
            rating.className = "rating-pill";
            rating.textContent =
                course.avg_rating === null
                    ? "No ratings yet"
                    : `${Number(course.avg_rating).toFixed(1)} / 5 ★`;

            card.append(infoDiv, rating);
            savedCoursesGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading saved courses:", error);
        savedCoursesGrid.replaceChildren();
        const errorMsg = document.createElement("p");
        errorMsg.className = "empty-section-message";
        errorMsg.textContent = "Unable to load saved courses at this time.";
        savedCoursesGrid.appendChild(errorMsg);
    }
}

// Fetch and render user's written reviews
async function loadUserReviews() {
    if (!userReviewsList) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}/reviews`);
        if (!response.ok) {
            throw new Error(`Failed to load reviews (status ${response.status})`);
        }

        const reviews = await response.json();
        userReviewsList.replaceChildren();

        if (reviews.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "empty-section-message";
            emptyMsg.textContent = "You have not written any reviews yet.";
            userReviewsList.appendChild(emptyMsg);
            return;
        }

        reviews.forEach((review) => {
            const reviewCard = document.createElement("div");
            reviewCard.className = "profile-review-card";

            const topRow = document.createElement("div");
            topRow.className = "review-top-row";

            const title = document.createElement("h3");
            title.textContent = `${review.course_code} - ${review.course_name}`;

            const badge = document.createElement("span");
            badge.className = "review-rating-badge";
            badge.textContent = `${review.overall_rating} / 5 ★`;

            topRow.append(title, badge);

            const meta = document.createElement("div");
            meta.className = "review-meta";
            meta.innerHTML = `<strong>Professor:</strong> ${review.professor_name || "N/A"} &bull; <strong>Semester:</strong> ${review.semester || "N/A"}`;

            const body = document.createElement("p");
            body.className = "review-body";
            body.textContent = review.review_text || "No review comments provided.";

            reviewCard.append(topRow, meta, body);
            userReviewsList.appendChild(reviewCard);
        });
    } catch (error) {
        console.error("Error loading user reviews:", error);
        userReviewsList.replaceChildren();
        const errorMsg = document.createElement("p");
        errorMsg.className = "empty-section-message";
        errorMsg.textContent = "Unable to load your reviews at this time.";
        userReviewsList.appendChild(errorMsg);
    }
}

// Initialize profile data
loadUserProfile();
loadSavedCourses();
loadUserReviews();
