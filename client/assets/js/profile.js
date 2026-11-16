const API_URL = "http://localhost:3000/api";
const DEFAULT_AVATAR = "/assets/images/DefaultProfile.jpeg";

const userId = new URLSearchParams(window.location.search).get("user_id") || localStorage.getItem("current_user_id") || "1";

const profileAvatarImg = document.querySelector("#profile-avatar-img");
const avatarContainer = document.querySelector("#avatar-container");
const profileUsername = document.querySelector("#profile-username");
const profileCreated = document.querySelector("#profile-created");

const avatarModal = document.querySelector("#avatar-modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalCancelBtn = document.querySelector("#modal-cancel-btn");
const modalSaveBtn = document.querySelector("#modal-save-btn");
const avatarFileInput = document.querySelector("#avatar-file-input");
const uploadDropZone = document.querySelector("#upload-drop-zone");
const avatarPreviewImg = document.querySelector("#avatar-preview-img");
const uploadStatus = document.querySelector("#upload-status");

let pendingAvatarDataUrl = null;

// Fetch and populate profile information
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) {
            throw new Error(`Failed to load profile (status ${response.status})`);
        }

        const user = await response.json();

        if (profileUsername && user.username) {
            profileUsername.textContent = user.username;
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

loadUserProfile();
