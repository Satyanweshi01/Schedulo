class TimetableEditor {
  constructor() {
    this.timetable = {};
    this.teachers = [];
    this.history = [];
    this.currentWeek = 1;
    this.colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#fa709a', '#fee140', '#4facfe', '#00f2fe'];
    this.colorMap = {};
    this.init();
  }

  init() {
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.renderTimetable();
    this.renderTeachers();
  }

  // 1. DRAG & DROP
  setupDragDrop() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.draggable = true;
      card.addEventListener('dragstart', (e) => this.handleDragStart(e));
    });

    const boxes = document.querySelectorAll('.box:not(.th):not(.day)');
    boxes.forEach(box => {
      box.addEventListener('dragover', (e) => this.handleDragOver(e));
      box.addEventListener('drop', (e) => this.handleDrop(e));
      box.addEventListener('dragleave', () => box.classList.remove('drag-over'));
    });
  }

  handleDragStart(e) {
    const teacher = e.target.textContent;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('teacher', teacher);
    e.target.classList.add('dragging');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.target.classList.add('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    const teacher = e.dataTransfer.getData('teacher');
    const cellId = e.target.getAttribute('data-id');

    if (cellId && teacher) {
      this.addTeacherToCell(cellId, teacher);
      this.saveToLocalStorage();
      this.addHistory('Added ' + teacher + ' to cell');
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

    // Check if html2pdf is available
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
    tooltip.textContent = `${e.target.textContent} - Click to select or drag to cell`;
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
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }

      // Delete key to clear selected cell
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

      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveToLocalStorage();
        console.log('Saved to local storage');
      }

      // Ctrl+P to export PDF
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
    this.setupDragDrop();
  }

  renderTeachers() {
    // This will be replaced with data from backend
    // For now, showing placeholder teachers
    const facultyArea = document.querySelector('.faculty-area');
    const cards = facultyArea.querySelectorAll('.card');

    cards.forEach((card, index) => {
      card.textContent = this.teachers[index] || card.textContent;
    });

    this.setupDragDrop();
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
  console.log('Features: Drag & Drop | Search | Click Edit | Navigation | Animations | Local Storage | PDF Export | Color Coding | Tooltips | Undo/Redo | Keyboard Shortcuts');
});
