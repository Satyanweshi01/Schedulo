/**
 * Schedulo Editor - Main JavaScript Controller
 * Handles schedule management and JSON storage for backend processing
 */

// Global state object to manage all schedule data
const scheduleState = {
    // Grid structure: { day: { timeSlot: { subject, teacher } } }
    schedule: {},

    // Currently selected teacher
    selectedTeacher: null,

    // All available teachers (populated from backend)
    teachers: [],

    // All available subjects
    subjects: [],

    // All time slots
    timeSlots: [
        "10:00-10:50",
        "10:50-11:40",
        "11:40-12:30",
        "12:30-1:20",
        "1:20-2:00",
        "2:00-2:50",
        "2:50-3:40",
        "3:40-4:30",
        "4:30-5:20",
    ],

    // Days of the week
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],

    // Stored JSON data - will hold the schedule JSON when OK is pressed
    storedJSON: null,
};

/**
 * Initialize the editor on page load
 * Sets up event listeners and initializes data
 */
document.addEventListener("DOMContentLoaded", async function () {
    await initializeEditor();
    setupEventListeners();
    renderTeacherCards();
});

async function loadTeacherData() {
    const response = await fetch("/editor/api/teacher_data");
    teacherData = await response.json();

    console.log(teacherData);

    return teacherData;
}

/**
 * Initialize editor state and fetch data from backend
 */
async function initializeEditor() {
    console.log("Initializing Schedulo editor...");

    // scheduleState.teachers = cards.map((card) => ({
    //     id: card.teacher_id,
    //     name: card.teacher_name,
    // }));

    let teacherData = await loadTeacherData();

    scheduleState.teachers = [];

    for (let i = 0; i < teacherData.length; i++) {
        const card = teacherData[i];
        scheduleState.teachers.push({
            id: card.teacher_id,
            name: card.teacher_name,
        });
    }

    // Initialize empty schedule structure
    scheduleState.days.forEach((day) => {
        scheduleState.schedule[day] = {};
        scheduleState.timeSlots.forEach((slot) => {
            scheduleState.schedule[day][slot] = {
                subject: "",
                teacher: "",
                stream: "",
            };
        });
    });
}

/**
 * Setup all event listeners for interactive elements
 */
function setupEventListeners() {
    // Teacher card selection
    document.querySelectorAll(".card").forEach((card) => {
        card.addEventListener("click", function () {
            selectTeacher(this);
        });
    });

    // OK button - stores JSON in variable for backend use
    const okBtn = document.querySelector(".btn-ok button");
    if (okBtn) okBtn.addEventListener("click", storeScheduleJSON);

    // PDF download button
    const downloadBtn = document.querySelector(".btn-download button");
    if (downloadBtn) downloadBtn.addEventListener("click", exportToPDF);

    // Search functionality
    const searchInput = document.querySelector(".search");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            filterTeachers(e.target.value);
        });
    }
}

/**
 * Select a teacher card and highlight it
 * @param {Element} cardElement - The teacher card element
 */
function selectTeacher(cardElement) {
    // Remove previous selection
    document.querySelectorAll(".card").forEach((card) => {
        card.classList.remove("selected");
    });

    // Highlight selected card
    cardElement.classList.add("selected");

    // Store selected teacher name
    scheduleState.selectedTeacher = cardElement.textContent.trim();

    console.log("Selected teacher:", scheduleState.selectedTeacher);
}

/**
 * Render teacher cards in the faculty panel
 */
function renderTeacherCards() {
    const facultyArea = document.querySelector(".faculty-area");

    // Keep search box and clear cards
    const searchBox = facultyArea.querySelector(".search");
    const cards = facultyArea.querySelectorAll(".card");
    cards.forEach((card) => card.remove());

    // Add teacher cards
    scheduleState.teachers.forEach((teacher) => {
        const card = document.createElement("div");
        card.className = "card";
        card.textContent = teacher.name;
        card.dataset.teacherId = teacher.id;

        card.addEventListener("click", function () {
            selectTeacher(this);
        });

        facultyArea.appendChild(card);
    });
}

/**
 * Filter teacher cards based on search input
 * @param {string} searchTerm - Search query
 */
function filterTeachers(searchTerm) {
    const cards = document.querySelectorAll(".card");

    cards.forEach((card) => {
        const teacherName = card.textContent.toLowerCase();
        if (teacherName.includes(searchTerm.toLowerCase())) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

/**
 * Generate JSON structure of the current schedule
 * Format: {
 *   metadata: { creationDate, institution },
 *   schedule: {
 *     Monday: { timeSlot: { subject, teacher, stream } },
 *     ...
 *   },
 *   teachers: [{ id, name }, ...]
 * }
 * @returns {Object} Complete schedule data in JSON format
 */
function generateScheduleJSON() {
    const scheduleJSON = {
        metadata: {
            creationDate: new Date().toISOString(),
            institution: "Your Institution Name",
        },
        schedule: scheduleState.schedule,
        teachers: scheduleState.teachers,
    };

    return scheduleJSON;
}

/**
 * Store schedule JSON in variable for backend use
 * This function is called when "OK" button is pressed
 * The JSON is stored in scheduleState.storedJSON and ready to be sent to backend
 */
function storeScheduleJSON() {
    scheduleState.storedJSON = generateScheduleJSON();

    console.log("Schedule JSON stored in variable:", scheduleState.storedJSON);
    alert("Timetable is saved in the database successfully");
}

/**
 * Export schedule to PDF (placeholder - requires backend processing)
 * Currently logs the data; actual PDF generation would need backend support
 */
function exportToPDF() {
    console.log("PDF export initiated");
    console.log("Current schedule:", scheduleState.schedule);

    // TODO: Implement PDF export via backend API
    alert("PDF export feature will be available soon.");
}

/**
 * Get the stored JSON data - used by backend to retrieve schedule data
 * @returns {Object|null} The stored schedule JSON or null if not yet stored
 */
function getStoredJSON() {
    return scheduleState.storedJSON;
}

/**
 * Submit stored JSON to backend API
 * TODO: Implement actual backend API call
 */
function submitScheduleToBackend() {
    if (!scheduleState.storedJSON) {
        alert("Please click OK button first to prepare the schedule data.");
        return;
    }

    // TODO: Replace with actual backend API endpoint
    console.log("Submitting to backend:", scheduleState.storedJSON);
    alert("Schedule submitted to backend (implementation pending)");
}

// Expose functions to window for backend access and debugging
window.getStoredJSON = getStoredJSON;
window.generateScheduleJSON = generateScheduleJSON;
window.storeScheduleJSON = storeScheduleJSON;
window.submitScheduleToBackend = submitScheduleToBackend;
