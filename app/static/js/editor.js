class TimetableEditor {
  constructor() {
    this.timetable = {};
    this.teachers = [];
    this.history = [];
    this.currentWeek = 1;
    this.selectedTeacher = null;
    this.colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#fa709a', '#fee140', '#4facfe', '#00f2fe'];
    this.colorMap = {};
    this.eventListenersAdded = false;
    this.init();
  }

  init() {
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.renderTimetable();
    this.renderTeachers();
  }

  // 1. SELECT & CLICK (Like Excel)
  setupSelectClick() {
    if (this.eventListenersAdded) return; // Prevent duplicate listeners

    // Teacher card selection
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => this.selectTeacher(e));
    });

    // Cell placement with hover delete button
    const boxes = document.querySelectorAll('.box:not(.th):not(.day):not(.recess)');
    boxes.forEach(box => {
      box.style.cursor = 'pointer';
      box.style.position = 'relative';
      box.addEventListener('click', (e) => this.placeTeacherInCell(e));
      box.addEventListener('mouseenter', (e) => this.showDeleteButton(e));
      box.addEventListener('mouseleave', (e) => this.hideDeleteButton(e));
      box.addEventListener('contextmenu', (e) => this.deleteTeacherFromCell(e)); // Right-click to delete
    });

    this.eventListenersAdded = true;
  }

  showDeleteButton(e) {
    const cell = e.target.closest('.box');
    if (!cell) return;

    const content = cell.textContent.trim();
    if (!content) return; // Don't show button if cell is empty

    // Remove existing button if any
    const existingBtn = cell.querySelector('.delete-btn');
    if (existingBtn) existingBtn.remove();

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '✕';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.width = '25px';
    deleteBtn.style.height = '25px';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.border = 'none';
    deleteBtn.style.backgroundColor = '#ff4757';
    deleteBtn.style.color = 'white';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.fontWeight = 'bold';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.zIndex = '100';
    deleteBtn.style.transition = 'all 0.2s ease';

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.clearCellContent(cell);
    });

    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.backgroundColor = '#ff3838';
      deleteBtn.style.transform = 'scale(1.1)';
    });

    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.backgroundColor = '#ff4757';
      deleteBtn.style.transform = 'scale(1)';
    });

    cell.appendChild(deleteBtn);
  }

  hideDeleteButton(e) {
    const cell = e.target.closest('.box');
    if (!cell) return;

    const deleteBtn = cell.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.remove();
    }
  }

  clearCellContent(cell) {
    const cellId = cell.getAttribute('data-id');
    const content = cell.textContent.trim();

    if (!content) return;

    this.timetable[cellId] = '';
    cell.textContent = '';
    cell.style.background = '';
    this.saveToLocalStorage();
    this.addHistory('Deleted ' + content + ' from cell');
    console.log('Cell cleared:', cellId);
  }

  selectTeacher(e) {
    e.stopPropagation();
    e.preventDefault();

    const card = e.target.closest('.card');
    if (!card) return;

    const teacherName = card.textContent.trim();

    // Deselect if clicking same teacher again
    if (this.selectedTeacher === teacherName) {
      this.selectedTeacher = null;
      card.classList.remove('teacher-selected');
      console.log('Teacher deselected');
      return;
    }

    // Deselect previous teacher
    const previousSelected = document.querySelector('.teacher-selected');
    if (previousSelected) {
      previousSelected.classList.remove('teacher-selected');
    }

    // Select new teacher
    this.selectedTeacher = teacherName;
    card.classList.add('teacher-selected');
    console.log('Selected teacher:', this.selectedTeacher);
  }

  placeTeacherInCell(e) {
    e.stopPropagation();
    e.preventDefault();

    const cell = e.target.closest('.box:not(.th):not(.day):not(.recess)');
    if (!cell) return;

    if (!this.selectedTeacher) {
      console.warn('No teacher selected');
      return;
    }

    const cellId = cell.getAttribute('data-id');

    if (cellId) {
      this.addTeacherToCell(cellId, this.selectedTeacher);
      this.saveToLocalStorage();
      this.addHistory('Added ' + this.selectedTeacher + ' to cell');
      console.log('Teacher placed in cell:', cellId);
    }
  }

  deleteTeacherFromCell(e) {
    e.stopPropagation();
    e.preventDefault();

    const cell = e.target.closest('.box:not(.th):not(.day):not(.recess)');
    if (!cell) return;

    const cellId = cell.getAttribute('data-id');
    const currentContent = cell.textContent.trim();

    if (!currentContent) {
      console.log('Cell is empty');
      return;
    }

    // Confirm deletion
    if (confirm(`Delete "${currentContent}" from this cell?`)) {
      this.timetable[cellId] = '';
      cell.textContent = '';
      cell.style.background = '';
      this.saveToLocalStorage();
      this.addHistory('Deleted ' + currentContent + ' from cell');
      console.log('Cell cleared:', cellId);
    }
  }

  // 2. SEARCH/FILTER
  setupSearch() {
    const searchBox = document.querySelector('.search');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search teachers...';
    input.classList.add('search-input');
    input.addEventListener('input', (e) => this.filterTeachers(e.target.value));
    searchBox.innerHTML = '';
    searchBox.appendChild(input);
  }

  filterTeachers(query) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const matches = card.textContent.toLowerCase().includes(query.toLowerCase());
      card.style.display = matches ? 'flex' : 'none';
    });
  }

  // 3. CLICK TO EDIT
  setupClickEdit() {
    const boxes = document.querySelectorAll('.box:not(.th):not(.day):not(.recess)');
    boxes.forEach(box => {
      box.addEventListener('click', (e) => this.editCell(e));
      box.classList.add('editable');
    });
  }

  editCell(e) {
    const cell = e.target;
    const cellId = cell.getAttribute('data-id');
    const currentContent = cell.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentContent;
    input.classList.add('cell-input');

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    input.addEventListener('blur', () => {
      const newContent = input.value;
      cell.innerHTML = newContent || '';
      if (cellId) {
        this.timetable[cellId] = newContent;
        this.saveToLocalStorage();
        this.addHistory('Edited cell');
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') input.blur();
    });
  }

  // 4. NAVIGATION (Weeks/Months)
  setupNavigation() {
    const prevBtn = document.querySelector('.btn-prev button');
    const nextBtn = document.querySelector('.btn-next button');
    const sheetInfo = document.querySelector('.sheet-info');

    if (prevBtn) prevBtn.addEventListener('click', () => this.previousWeek());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextWeek());

    this.updateWeekDisplay(sheetInfo);
  }

  previousWeek() {
    this.currentWeek = Math.max(1, this.currentWeek - 1);
    this.updateWeekDisplay(document.querySelector('.sheet-info'));
    this.saveToLocalStorage();
  }

  nextWeek() {
    this.currentWeek += 1;
    this.updateWeekDisplay(document.querySelector('.sheet-info'));
    this.saveToLocalStorage();
  }

  updateWeekDisplay(element) {
    if (element) {
      const startDate = new Date(2026, 4, 27 + (this.currentWeek - 1) * 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      element.innerHTML = `Week ${this.currentWeek}<br/>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  }

  // 5. SMOOTH ANIMATIONS
  animateAdd(element) {
    element.classList.add('animate-add');
    setTimeout(() => element.classList.remove('animate-add'), 300);
  }

  animateRemove(element) {
    element.classList.add('animate-remove');
    setTimeout(() => element.classList.remove('animate-remove'), 300);
  }

  // 6. LOCAL STORAGE
  saveToLocalStorage() {
    const data = {
      timetable: this.timetable,
      currentWeek: this.currentWeek,
      colorMap: this.colorMap
    };
    localStorage.setItem('timetableData', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const stored = localStorage.getItem('timetableData');
    if (stored) {
      const data = JSON.parse(stored);
      this.timetable = data.timetable || {};
      this.currentWeek = data.currentWeek || 1;
      this.colorMap = data.colorMap || {};
    }
  }

  // 7. PDF EXPORT
  setupPDFExport() {
    const downloadBtn = document.querySelector('.btn-download button');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.exportToPDF());
    }
  }

  exportToPDF() {
    const element = document.querySelector('.table-area');
    const opt = {
      margin: 10,
      filename: `timetable-week${this.currentWeek}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save();
    } else {
      alert('PDF export requires html2pdf library. Please include it in the HTML.');
      console.log('Add this to HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>');
    }
  }

  // 8. COLOR CODING
  assignColor(teacher) {
    if (!this.colorMap[teacher]) {
      const unusedColor = this.colors.find(color => !Object.values(this.colorMap).includes(color));
      this.colorMap[teacher] = unusedColor || this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    return this.colorMap[teacher];
  }

  applyColorToCell(cell, teacher) {
    const color = this.assignColor(teacher);
    cell.style.background = `linear-gradient(135deg, ${color} 0%, ${this.shadeColor(color, -20)} 100%)`;
  }

  shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  // 9. TOOLTIPS
  setupTooltips() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => this.showTooltip(e));
      card.addEventListener('mouseleave', (e) => this.hideTooltip(e));
    });
  }

  showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.textContent = `${e.target.textContent} - Click to select, then click a cell`;
    e.target.appendChild(tooltip);
  }

  hideTooltip(e) {
    const tooltip = e.target.querySelector('.tooltip');
    if (tooltip) tooltip.remove();
  }

  // 10. UNDO/REDO
  addHistory(action) {
    this.history.push({
      action: action,
      timetable: JSON.parse(JSON.stringify(this.timetable)),
      timestamp: new Date()
    });

    if (this.history.length > 20) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length > 1) {
      this.history.pop();
      const previous = this.history[this.history.length - 1];
      this.timetable = JSON.parse(JSON.stringify(previous.timetable));
      this.renderTimetable();
      this.saveToLocalStorage();
      console.log('Undo:', previous.action);
    }
  }

  // 11. KEYBOARD SHORTCUTS
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }

      if (e.key === 'Delete') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('editable')) {
          focused.textContent = '';
          const cellId = focused.getAttribute('data-id');
          if (cellId) {
            this.timetable[cellId] = '';
            this.saveToLocalStorage();
            this.addHistory('Deleted cell content');
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveToLocalStorage();
        console.log('Saved to local storage');
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this.exportToPDF();
      }
    });
  }

  // RENDER METHODS
  renderTimetable() {
    const tableArea = document.querySelector('.table-area');
    const boxes = tableArea.querySelectorAll('.box:not(.th):not(.day):not(.recess)');

    let cellIndex = 0;
    boxes.forEach(box => {
      const cellId = `cell-${cellIndex}`;
      box.setAttribute('data-id', cellId);
      box.textContent = this.timetable[cellId] || '';

      if (this.timetable[cellId]) {
        this.applyColorToCell(box, this.timetable[cellId]);
      }
      cellIndex++;
    });

    this.setupClickEdit();
    this.setupSelectClick();
  }

  renderTeachers() {
    const facultyArea = document.querySelector('.faculty-area');
    const cards = facultyArea.querySelectorAll('.card');

    cards.forEach((card, index) => {
      card.textContent = this.teachers[index] || card.textContent;
    });

    this.setupSelectClick();
    this.setupTooltips();
    this.setupSearch();
  }

  addTeacherToCell(cellId, teacher) {
    this.timetable[cellId] = teacher;
    const cell = document.querySelector(`[data-id="${cellId}"]`);
    if (cell) {
      cell.textContent = teacher;
      this.applyColorToCell(cell, teacher);
      this.animateAdd(cell);
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    this.setupNavigation();
    this.setupPDFExport();
    this.setupKeyboardShortcuts();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.timetableEditor = new TimetableEditor();
  console.log('Timetable Editor Initialized');
  console.log('Features: Select & Click | Search | Click Edit | Navigation | Animations | Local Storage | PDF Export | Color Coding | Tooltips | Undo/Redo | Keyboard Shortcuts');
  console.log('Right-click on cells to delete content');
});
