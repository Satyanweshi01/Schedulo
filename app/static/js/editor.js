/**
 * Schedulo Editor - Main JavaScript Controller
 * Handles schedule management, data persistence, and JSON export
 */

// Global state object to manage all schedule data
const scheduleState = {
    // Grid structure: { day: { timeSlot: { subject, teacher } } }
    schedule: {},

    // Currently selected teacher
    selectedTeacher: null,

    // Current week range for display
    currentWeek: {
        start: new Date(),
        end: new Date()
    },

    // All available teachers (populated from backend)
    teachers: [],

    // All available subjects
    subjects: [],

    // All time slots
    timeSlots: [
        '10:00-10:50',
        '10:50-11:40',
        '11:40-12:30',
        '12:30-1:20',
        '1:20-2:00',
        '2:00-2:50',
        '2:50-3:40',
        '3:40-4:30',
        '4:30-5:20'
    ],

    // Days of the week
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};

/**
 * Initialize the editor on page load
 * Sets up event listeners and initializes data
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    setupEventListeners();
    loadScheduleFromLocalStorage();
    renderTeacherCards();
});

/**
 * Initialize editor state and fetch data from backend
 */
function initializeEditor() {
    console.log('Initializing Schedulo editor...');

    // TODO: Fetch teachers and subjects from backend API
    // For now using mock data - replace with actual API call
    scheduleState.teachers = [
        { id: 1, name: 'Dr. Smith' },
        { id: 2, name: 'Prof. Johnson' },
        { id: 3, name: 'Ms. Williams' },
        { id: 4, name: 'Mr. Brown' },
        { id: 5, name: 'Dr. Davis' }
    ];

    // Initialize empty schedule structure
    scheduleState.days.forEach(day => {
        scheduleState.schedule[day] = {};
        scheduleState.timeSlots.forEach(slot => {
            scheduleState.schedule[day][slot] = {
                subject: '',
                teacher: '',
                stream: ''
            };
        });
    });

    updateWeekDisplay();
}

/**
 * Setup all event listeners for interactive elements
 */
function setupEventListeners() {
    // Grid cell click handler - allows editing schedule entries
    document.querySelectorAll('.box:not(.th):not(.day):not(.recess)').forEach(box => {
        box.addEventListener('click', function(e) {
            const cellData = getCellDataFromElement(this);
            if (cellData) {
                openCellEditor(cellData, this);
            }
        });
    });

    // Teacher card selection
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            selectTeacher(this);
        });
    });

    // Navigation buttons
    const prevBtn = document.querySelector('.btn-prev button');
    const nextBtn = document.querySelector('.btn-next button');

    if (prevBtn) prevBtn.addEventListener('click', navigatePreviousWeek);
    if (nextBtn) nextBtn.addEventListener('click', navigateNextWeek);

    // PDF download button
    const downloadBtn = document.querySelector('.btn-download button');
    if (downloadBtn) downloadBtn.addEventListener('click', exportToPDF);

    // Search functionality
    const searchInput = document.querySelector('.search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterTeachers(e.target.value);
        });
    }
}

/**
 * Extract position data from a grid cell element
 * @param {Element} element - The cell element clicked
 * @returns {Object} Object with day, timeSlot, and element reference
 */
function getCellDataFromElement(element) {
    // Count position in grid to determine day and time slot
    const allBoxes = Array.from(document.querySelectorAll('.box'));
    const cellIndex = allBoxes.indexOf(element);

    if (cellIndex < 11) return null; // Header row

    // Formula: each day has 11 columns (day + stream + 9 time slots)
    const adjustedIndex = cellIndex - 11;
    const dayIndex = Math.floor(adjustedIndex / 11);
    const colIndex = adjustedIndex % 11;

    // Columns: 0=day, 1=stream, 2-10=time slots
    if (colIndex < 2) return null; // Day/stream columns

    const day = scheduleState.days[dayIndex];
    const timeSlot = scheduleState.timeSlots[colIndex - 2];

    return { day, timeSlot, element };
}

/**
 * Open editor modal for a specific schedule cell
 * @param {Object} cellData - Contains day and timeSlot
 * @param {Element} cellElement - The cell HTML element
 */
function openCellEditor(cellData, cellElement) {
    const { day, timeSlot } = cellData;

    // Create modal content dynamically
    const subjectInput = prompt('Enter subject name:',
        scheduleState.schedule[day][timeSlot].subject || '');

    if (subjectInput !== null) {
        // Update schedule data
        scheduleState.schedule[day][timeSlot] = {
            subject: subjectInput,
            teacher: scheduleState.selectedTeacher || '',
            stream: 'CSE' // TODO: Make this dynamic based on selection
        };

        // Update cell display
        cellElement.textContent = subjectInput;
        cellElement.classList.add('scheduled');

        // Save to local storage
        saveScheduleToLocalStorage();

        // Update JSON export in real-time
        console.log('Schedule updated:', scheduleState.schedule);
    }
}

/**
 * Select a teacher card and highlight it
 * @param {Element} cardElement - The teacher card element
 */
function selectTeacher(cardElement) {
    // Remove previous selection
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });

    // Highlight selected card
    cardElement.classList.add('selected');

    // Store selected teacher name
    scheduleState.selectedTeacher = cardElement.textContent.trim();

    console.log('Selected teacher:', scheduleState.selectedTeacher);
}

/**
 * Navigate to previous week
 */
function navigatePreviousWeek() {
    const week = 7; // Days in a week
    scheduleState.currentWeek.start.setDate(
        scheduleState.currentWeek.start.getDate() - week
    );
    scheduleState.currentWeek.end.setDate(
        scheduleState.currentWeek.end.getDate() - week
    );
    updateWeekDisplay();
}

/**
 * Navigate to next week
 */
function navigateNextWeek() {
    const week = 7;
    scheduleState.currentWeek.start.setDate(
        scheduleState.currentWeek.start.getDate() + week
    );
    scheduleState.currentWeek.end.setDate(
        scheduleState.currentWeek.end.getDate() + week
    );
    updateWeekDisplay();
}

/**
 * Update the week display in the control panel
 */
function updateWeekDisplay() {
    const start = formatDate(scheduleState.currentWeek.start);
    const end = new Date(scheduleState.currentWeek.start);
    end.setDate(end.getDate() + 4); // Friday
    const endFormatted = formatDate(end);

    const dateDisplay = `${start} - ${endFormatted}`;

    document.querySelectorAll('.sheet-info').forEach(info => {
        if (info.textContent.includes('Current') === false) {
            info.textContent = dateDisplay;
        }
    });
}

/**
 * Format date to DD MMM YYYY format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Render teacher cards in the faculty panel
 */
function renderTeacherCards() {
    const facultyArea = document.querySelector('.faculty-area');

    // Keep search box and clear cards
    const searchBox = facultyArea.querySelector('.search');
    const cards = facultyArea.querySelectorAll('.card');
    cards.forEach(card => card.remove());

    // Add teacher cards
    scheduleState.teachers.forEach(teacher => {
        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = teacher.name;
        card.dataset.teacherId = teacher.id;

        card.addEventListener('click', function() {
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
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const teacherName = card.textContent.toLowerCase();
        if (teacherName.includes(searchTerm.toLowerCase())) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Save schedule to browser's local storage
 */
function saveScheduleToLocalStorage() {
    const scheduleData = {
        schedule: scheduleState.schedule,
        lastUpdated: new Date().toISOString()
    };

    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
    console.log('Schedule saved to local storage');
}

/**
 * Load schedule from browser's local storage
 */
function loadScheduleFromLocalStorage() {
    const saved = localStorage.getItem('scheduleData');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            scheduleState.schedule = data.schedule;
            console.log('Schedule loaded from local storage:', data.lastUpdated);
        } catch (error) {
            console.error('Error loading schedule from storage:', error);
        }
    }
}

/**
 * Generate JSON export of the current schedule
 * Format: {
 *   metadata: { exportDate, week },
 *   schedule: {
 *     Monday: { timeSlot: { subject, teacher, stream } },
 *     ...
 *   }
 * }
 * @returns {Object} Complete schedule data in JSON format
 */
function generateScheduleJSON() {
    const scheduleJSON = {
        metadata: {
            exportDate: new Date().toISOString(),
            weekStart: formatDate(scheduleState.currentWeek.start),
            weekEnd: (() => {
                const end = new Date(scheduleState.currentWeek.start);
                end.setDate(end.getDate() + 4);
                return formatDate(end);
            })(),
            institution: 'Your Institution Name' // TODO: Make configurable
        },
        schedule: scheduleState.schedule,
        teachers: scheduleState.teachers,
        metadata_info: {
            description: 'Class schedule data exported from Schedulo',
            version: '1.0',
            format: 'JSON'
        }
    };

    return scheduleJSON;
}

/**
 * Download schedule as JSON file
 */
function downloadScheduleJSON() {
    const scheduleJSON = generateScheduleJSON();
    const jsonString = JSON.stringify(scheduleJSON, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `schedule_${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Schedule exported as JSON:', scheduleJSON);
}

/**
 * Export schedule to PDF (placeholder - requires backend processing)
 * Currently logs the data; actual PDF generation would need backend support
 */
function exportToPDF() {
    console.log('PDF export initiated');
    console.log('Current schedule:', scheduleState.schedule);

    // TODO: Implement PDF export via backend API
    alert('PDF export feature will be available soon. Schedule data has been logged to console.');

    // For now, also export JSON
    downloadScheduleJSON();
}

/**
 * Clear all schedule data (for testing/reset)
 */
function clearSchedule() {
    if (confirm('Are you sure you want to clear the entire schedule?')) {
        scheduleState.schedule = {};
        scheduleState.days.forEach(day => {
            scheduleState.schedule[day] = {};
            scheduleState.timeSlots.forEach(slot => {
                scheduleState.schedule[day][slot] = {
                    subject: '',
                    teacher: '',
                    stream: ''
                };
            });
        });

        document.querySelectorAll('.box.scheduled').forEach(box => {
            box.textContent = '';
            box.classList.remove('scheduled');
        });

        saveScheduleToLocalStorage();
        console.log('Schedule cleared');
    }
}

// Expose JSON export to window for easy access from console
window.exportScheduleJSON = generateScheduleJSON;
window.downloadScheduleJSON = downloadScheduleJSON;
window.clearSchedule = clearSchedule;
