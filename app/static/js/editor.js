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
    selectedAssignment: null,

    // All available teachers (populated from backend)
    teachers: [],

    // All available subjects
    subjects: [],

    // All time slots
    timeSlots: [],

    // Days of the week
    days: [],

    // Stored JSON data - will hold the schedule JSON when OK is pressed
    storedJSON: null,

    // Teacher bookings already saved in other department/batch timetables
    teacherConflicts: {},

    selectedTeacherProfile: null,
};

/**
 * Initialize the editor on page load
 * Sets up event listeners and initializes data
 */
document.addEventListener("DOMContentLoaded", async function () {
    await initializeEditor();
    setupEventListeners();
    renderTeacherCards();
    setupAutoFitHandlers();
});

async function loadTeacherData() {
    const response = await fetch("/editor/api/teacher_data");
    const teacherData = await response.json();

    console.log(teacherData);

    return teacherData;
}

/**
 * Initialize editor state and fetch data from backend
 */
async function initializeEditor() {
    console.log("Initializing Schedulo editor...");

    scheduleState.teacherConflicts = teacherConflicts || {};
    scheduleState.days = initialEditorState.days || [];
    scheduleState.timeSlots = initialEditorState.timeSlots || [];
    scheduleState.teachers = cards.map((card) => ({
        assignmentId: card.assignment_id,
        id: card.teacher_id,
        name: card.teacher_name,
        subjectId: card.subject_id,
        subject: card.subject_name,
        department: card.department_name,
        batch: card.batch_name,
        assignmentCount: card.assignment_count,
        otherAssignments: card.other_assignments || [],
        workloadProfile: card.workload_profile || null,
    }));

    // Initialize empty schedule structure
    scheduleState.days.forEach((day) => {
        scheduleState.schedule[day] = {};
        scheduleState.timeSlots.forEach((slot) => {
            scheduleState.schedule[day][slot] = {
                assignmentId: null,
                teacherId: null,
                subjectId: null,
                subject: "",
                teacher: "",
                stream: "",
            };
        });
    });

    hydrateSavedSchedule();

    setupScheduleCells();
}

/**
 * Setup all event listeners for interactive elements
 */
function setupEventListeners() {
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

function setupScheduleCells() {
    const gridCells = Array.from(document.querySelectorAll(".table-area .box"));
    const headerCellCount = 11;
    const rowCellCount = 11;

    scheduleState.days.forEach((day, rowIndex) => {
        const rowStart = headerCellCount + rowIndex * rowCellCount;

        for (let colIndex = 1; colIndex < rowCellCount; colIndex += 1) {
            const cell = gridCells[rowStart + colIndex];
            if (!cell) continue;

            if (colIndex === 1) {
                cell.classList.add("stream-cell");
                cell.dataset.day = day;
                continue;
            }

            const timeSlot = scheduleState.timeSlots[colIndex - 2];
            cell.dataset.day = day;
            cell.dataset.timeSlot = timeSlot;

            if (cell.classList.contains("recess")) {
                cell.classList.add("locked-cell");
                continue;
            }

            cell.classList.add("schedule-cell");
            cell.addEventListener("click", () => assignSelectedTeacherToCell(cell));
            renderCellFromState(cell);
        }
    });

    scheduleState.days.forEach((day) => updateMergedTeacherBorders(day));
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

    // Store selected teacher and assignment details
    scheduleState.selectedTeacher = cardElement.dataset.teacherName;
    scheduleState.selectedAssignment = {
        assignmentId: Number(cardElement.dataset.assignmentId),
        teacherId: Number(cardElement.dataset.teacherId),
        teacher: cardElement.dataset.teacherName,
        subjectId: Number(cardElement.dataset.subjectId),
        subject: cardElement.dataset.subjectName,
    };
    scheduleState.selectedTeacherProfile = scheduleState.teachers.find(
        (teacher) => teacher.assignmentId === scheduleState.selectedAssignment.assignmentId
    )?.workloadProfile || null;

    console.log("Selected teacher:", scheduleState.selectedTeacher);
    renderTeacherProfile(scheduleState.selectedTeacherProfile);
    refreshTeacherProfile(scheduleState.selectedAssignment.teacherId);
}

async function assignSelectedTeacherToCell(cell) {
    if (!scheduleState.selectedAssignment) {
        alert("Please select a teacher first.");
        return;
    }

    const day = cell.dataset.day;
    const timeSlot = cell.dataset.timeSlot;

    if (!day || !timeSlot) return;

    const conflicts = await checkTeacherConflicts(
        scheduleState.selectedAssignment.teacherId,
        day,
        timeSlot
    );
    if (conflicts.length) {
        const conflictText = conflicts
            .map((item) => `${item.department} ${item.batch} (${item.subject})`)
            .join(", ");
        markConflictCell(cell);
        alert(`${scheduleState.selectedAssignment.teacher} is already booked at ${timeSlot} on ${day}: ${conflictText}`);
        return;
    }

    scheduleState.schedule[day][timeSlot] = {
        assignmentId: scheduleState.selectedAssignment.assignmentId,
        teacherId: scheduleState.selectedAssignment.teacherId,
        subjectId: scheduleState.selectedAssignment.subjectId,
        teacher: scheduleState.selectedAssignment.teacher,
        subject: scheduleState.selectedAssignment.subject,
        stream: scheduleState.schedule[day][timeSlot].stream || "",
    };

    renderAssignedCell(cell, scheduleState.schedule[day][timeSlot]);
    updateMergedTeacherBorders(day);
    updateSaveStatus("Unsaved changes");
}

function renderAssignedCell(cell, entry) {
    cell.classList.add("scheduled");
    cell.classList.remove("conflict-cell");

    const removeButton = document.createElement("button");
    removeButton.className = "remove-assignment";
    removeButton.type = "button";
    removeButton.title = "Remove assigned teacher";
    removeButton.textContent = "x";
    removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeTeacherFromCell(cell);
    });

    const subject = document.createElement("span");
    subject.className = "cell-subject";
    subject.textContent = entry.subject;

    const teacher = document.createElement("span");
    teacher.className = "cell-teacher";
    teacher.textContent = entry.teacher;

    const content = document.createElement("div");
    content.className = "cell-content";
    content.append(subject, teacher);

    cell.replaceChildren(removeButton, content);
}

function renderCellFromState(cell) {
    const day = cell.dataset.day;
    const timeSlot = cell.dataset.timeSlot;
    const entry = scheduleState.schedule[day]?.[timeSlot];

    if (entry?.assignmentId) {
        renderAssignedCell(cell, entry);
    }
}

function removeTeacherFromCell(cell) {
    const day = cell.dataset.day;
    const timeSlot = cell.dataset.timeSlot;

    if (!day || !timeSlot || cell.classList.contains("stream-cell")) return;

    scheduleState.schedule[day][timeSlot] = {
        assignmentId: null,
        teacherId: null,
        subjectId: null,
        subject: "",
        teacher: "",
        stream: scheduleState.schedule[day][timeSlot].stream || "",
    };

    cell.classList.remove("scheduled");
    cell.classList.remove("conflict-cell");
    cell.innerHTML = "";
    updateMergedTeacherBorders(day);
    updateSaveStatus("Unsaved changes");
}

function getTeacherConflicts(teacherId, day, timeSlot) {
    if (!teacherId) return [];
    return scheduleState.teacherConflicts[String(teacherId)]?.[`${day}|${timeSlot}`] || [];
}

async function checkTeacherConflicts(teacherId, day, timeSlot) {
    try {
        const response = await fetch("/editor/api/check_teacher_conflict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                teacherId,
                day,
                timeSlot,
                week: editorContext.week,
                deptId: editorContext.dept_id,
                batchId: editorContext.batch_id,
            }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Conflict check failed");

        if (result.profile) {
            scheduleState.selectedTeacherProfile = result.profile;
            renderTeacherProfile(result.profile);
        }
        return result.conflicts || [];
    } catch (error) {
        console.error(error);
        return getTeacherConflicts(teacherId, day, timeSlot);
    }
}

function markConflictCell(cell) {
    cell.classList.add("conflict-cell");
    setTimeout(() => cell.classList.remove("conflict-cell"), 1800);
}

function hydrateSavedSchedule() {
    Object.entries(savedSchedule || {}).forEach(([day, slots]) => {
        if (!scheduleState.schedule[day]) return;

        Object.entries(slots || {}).forEach(([slot, entry]) => {
            if (!scheduleState.schedule[day][slot]) return;
            scheduleState.schedule[day][slot] = {
                assignmentId: entry.assignmentId,
                teacherId: entry.teacherId,
                subjectId: entry.subjectId,
                subject: entry.subject || "",
                teacher: entry.teacher || "",
                stream: entry.stream || "",
            };
        });
    });
}

function updateMergedTeacherBorders(day) {
    let runStart = null;
    let runTeacherId = null;
    let runLength = 0;

    function finishRun() {
        if (runStart === null) return;

        const firstCell = getScheduleCell(day, scheduleState.timeSlots[runStart]);
        if (firstCell) {
            firstCell.style.setProperty("--merge-span", runLength);
        }

        runStart = null;
        runTeacherId = null;
        runLength = 0;
    }

    scheduleState.timeSlots.forEach((slot, index) => {
        const cell = getScheduleCell(day, slot);
        if (!cell) return;

        const entry = scheduleState.schedule[day][slot];
        const previousSlot = scheduleState.timeSlots[index - 1];
        const nextSlot = scheduleState.timeSlots[index + 1];
        const previousEntry = previousSlot ? scheduleState.schedule[day][previousSlot] : null;
        const nextEntry = nextSlot ? scheduleState.schedule[day][nextSlot] : null;
        const teacherId = entry.teacherId;

        cell.style.setProperty("--merge-span", 1);
        cell.classList.toggle(
            "merge-left",
            Boolean(teacherId && previousEntry && previousEntry.teacherId === teacherId)
        );
        cell.classList.toggle(
            "merge-right",
            Boolean(teacherId && nextEntry && nextEntry.teacherId === teacherId)
        );

        if (!teacherId) {
            finishRun();
            return;
        }

        if (teacherId !== runTeacherId) {
            finishRun();
            runStart = index;
            runTeacherId = teacherId;
            runLength = 1;
            return;
        }

        runLength += 1;
    });

    finishRun();
    fitMergedCellLabels(day);
}

function getScheduleCell(day, timeSlot) {
    return Array.from(document.querySelectorAll(".schedule-cell")).find(
        (cell) => cell.dataset.day === day && cell.dataset.timeSlot === timeSlot
    );
}

function fitMergedCellLabels(day) {
    scheduleState.timeSlots.forEach((slot) => {
        const cell = getScheduleCell(day, slot);
        if (!cell || cell.classList.contains("merge-left")) return;

        const content = cell.querySelector(".cell-content");
        if (!content) return;

        fitCellContent(content);
    });
}

function fitCellContent(content) {
    const subject = content.querySelector(".cell-subject");
    const teacher = content.querySelector(".cell-teacher");
    if (!subject || !teacher) return;

    subject.style.fontSize = "";
    teacher.style.fontSize = "";

    let subjectSize = parseFloat(getComputedStyle(subject).fontSize);
    let teacherSize = parseFloat(getComputedStyle(teacher).fontSize);
    const minSubjectSize = 10;
    const minTeacherSize = 9;

    while (
        (content.scrollWidth > content.clientWidth || content.scrollHeight > content.clientHeight) &&
        (subjectSize > minSubjectSize || teacherSize > minTeacherSize)
    ) {
        subjectSize = Math.max(minSubjectSize, subjectSize - 1);
        teacherSize = Math.max(minTeacherSize, teacherSize - 1);
        subject.style.fontSize = `${subjectSize}px`;
        teacher.style.fontSize = `${teacherSize}px`;
    }
}

function setupAutoFitHandlers() {
    let resizeTimer = null;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            scheduleState.days.forEach((day) => fitMergedCellLabels(day));
        }, 100);
    });
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

        const teacherName = document.createElement("span");
        teacherName.className = "card-teacher";
        teacherName.textContent = teacher.name;

        const subjectName = document.createElement("span");
        subjectName.className = "card-subject";
        subjectName.textContent = teacher.subject;

        const workload = document.createElement("span");
        workload.className = "card-workload";
        workload.textContent = `${teacher.assignmentCount} stream${teacher.assignmentCount === 1 ? "" : "s"}`;

        const context = document.createElement("span");
        context.className = "card-context";
        context.textContent = teacher.otherAssignments.length
            ? `Also: ${teacher.otherAssignments.slice(0, 2).join("; ")}`
            : `${teacher.department} / ${teacher.batch}`;

        card.dataset.assignmentId = teacher.assignmentId;
        card.dataset.teacherId = teacher.id;
        card.dataset.teacherName = teacher.name;
        card.dataset.subjectId = teacher.subjectId;
        card.dataset.subjectName = teacher.subject;
        card.append(teacherName, subjectName, workload, context);

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
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes(searchTerm.toLowerCase())) {
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
            collegeName: editorContext.college_name,
            deptId: editorContext.dept_id,
            batchId: editorContext.batch_id,
            departmentName: editorContext.department_name,
            batchName: editorContext.batch_name,
            week: editorContext.week,
        },
        schedule: scheduleState.schedule,
        teachers: scheduleState.teachers,
        days: scheduleState.days,
        timeSlots: scheduleState.timeSlots,
    };

    return scheduleJSON;
}

/**
 * Store schedule JSON in variable for backend use
 * This function is called when "OK" button is pressed
 * The JSON is stored in scheduleState.storedJSON and ready to be sent to backend
 */
async function storeScheduleJSON() {
    scheduleState.storedJSON = generateScheduleJSON();

    console.log("Schedule JSON stored in variable:", scheduleState.storedJSON);
    updateSaveStatus("Saving...");

    try {
        const response = await fetch("/editor/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(scheduleState.storedJSON),
        });
        const result = await response.json();

        if (!response.ok) {
            highlightServerConflicts(result.conflicts || []);
            throw new Error(result.message || "Timetable save failed");
        }

        updateSaveStatus(result.message || "Saved");
        if (scheduleState.selectedAssignment) {
            refreshTeacherProfile(scheduleState.selectedAssignment.teacherId);
        }
        alert(result.message || "Timetable is saved successfully.");
    } catch (error) {
        console.error(error);
        updateSaveStatus("Fix conflicts");
        alert(error.message || "Timetable save failed. Please try again.");
    }
}

function highlightServerConflicts(conflicts) {
    conflicts.forEach((conflict) => {
        const cell = getScheduleCell(conflict.day, conflict.timeSlot);
        if (cell) markConflictCell(cell);
    });
}

function updateSaveStatus(text) {
    const status = document.getElementById("save-status");
    if (status) status.textContent = text;
}

async function refreshTeacherProfile(teacherId) {
    if (!teacherId) return;

    const params = new URLSearchParams({
        week: editorContext.week || "",
        dept_id: editorContext.dept_id || "",
        batch_id: editorContext.batch_id || "",
    });

    try {
        const response = await fetch(`/editor/api/teacher/${teacherId}/profile?${params.toString()}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Profile load failed");

        scheduleState.selectedTeacherProfile = result.profile;
        renderTeacherProfile(result.profile);
    } catch (error) {
        console.error(error);
    }
}

function renderTeacherProfile(profile) {
    const panel = document.getElementById("teacher-profile");
    if (!panel) return;

    if (!profile) {
        panel.innerHTML = `
            <span>Teacher profile</span>
            <strong>Select a teacher</strong>
            <p>Workload and conflicts are checked from the saved database timetable.</p>
        `;
        return;
    }

    const dailyItems = Object.entries(profile.dailyLoad || {})
        .map(([day, slots]) => {
            const slotText = slots.map((slot) => `${slot.timeSlot} ${slot.department}/${slot.batch}`).join(", ");
            return `<li><b>${escapeHTML(day)}</b>: ${escapeHTML(slotText)}</li>`;
        })
        .join("");

    const assignmentText = (profile.assignments || [])
        .slice(0, 3)
        .map((assignment) => `${assignment.department}/${assignment.batch}/${assignment.subject}`)
        .join("; ");

    panel.innerHTML = `
        <span>Teacher profile</span>
        <strong>${escapeHTML(profile.teacherName || "Teacher")}</strong>
        <p>${profile.assignmentCount || 0} stream${profile.assignmentCount === 1 ? "" : "s"} assigned · ${profile.scheduledClassCount || 0} saved class${profile.scheduledClassCount === 1 ? "" : "es"} this week</p>
        <p>${escapeHTML(assignmentText || "No subject assignment found.")}</p>
        <ul>${dailyItems || "<li>No saved classes this week.</li>"}</ul>
    `;

    const loadStatus = document.getElementById("load-status");
    if (loadStatus) {
        loadStatus.textContent = `${profile.teacherName}: ${profile.scheduledClassCount || 0} saved classes`;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[character]));
}

/**
 * Export schedule to PDF (placeholder - requires backend processing)
 * Currently logs the data; actual PDF generation would need backend support
 */
function exportToPDF() {
    console.log("PDF export initiated");
    console.log("Current schedule:", scheduleState.schedule);

    const scheduleJSON = generateScheduleJSON();

    fetch("/editor/export_pdf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleJSON),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("PDF export failed");
            }
            return response.blob();
        })
        .then((blob) => {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = "schedulo-timetable.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
        })
        .catch((error) => {
            console.error(error);
            alert("PDF export failed. Please try again.");
        });
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
