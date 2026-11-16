const saveButton = document.getElementById('save-course');

if (saveButton) {
    const courseId = 'ITSC-1212';

    let savedCourses = JSON.parse(
        localStorage.getItem('savedCourses') || '[]'
    );

    function updateSaveButton() {
        const isSaved = savedCourses.includes(courseId);

        saveButton.textContent = isSaved ? '★ Saved' : '☆ Save Course';
        saveButton.classList.toggle('saved', isSaved);
        saveButton.setAttribute('aria-pressed', isSaved);
    }

    updateSaveButton();

    saveButton.addEventListener('click', () => {
        if (savedCourses.includes(courseId)) {
            savedCourses = savedCourses.filter(id => id !== courseId);
        } else {
            savedCourses.push(courseId);
        }

        localStorage.setItem('savedCourses', JSON.stringify(savedCourses));

        updateSaveButton();
    });
}
