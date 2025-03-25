// main.js

class State {
  constructor() {
    this.students = [];
    this.fixedSeats = new Map();
    this.layouts = { '232': [], '222': [], '33': [] };
    this.darkMode = false;
    this.activeTab = '222';
    this.savedLists = new Map();
  }

  saveToStorage() {
    const data = {
      students: this.students,
      fixedSeats: Array.from(this.fixedSeats.entries()),
      darkMode: this.darkMode,
      activeTab: this.activeTab,
      layouts: this.layouts,
      savedLists: Array.from(this.savedLists.entries())
    };
    localStorage.setItem('classroomState', JSON.stringify(data));
  }

  loadFromStorage() {
    const data = JSON.parse(localStorage.getItem('classroomState'));
    if (!data) return false;
    this.students = data.students || [];
    this.fixedSeats = new Map(data.fixedSeats || []);
    this.darkMode = data.darkMode || false;
    this.activeTab = data.activeTab || '222';
    this.layouts = data.layouts || { '232': [], '222': [], '33': [] };
    this.savedLists = new Map(data.savedLists || []);
    return true;
  }

  saveList(name) {
    if (!name) throw new Error('Geef een naam op voor de lijst');
    this.savedLists.set(name, {
      students: this.students,
      fixedSeats: Array.from(this.fixedSeats.entries())
    });
    this.saveToStorage();
  }

  loadList(name) {
    const list = this.savedLists.get(name);
    if (!list) throw new Error('Lijst niet gevonden');
    this.students = list.students;
    this.fixedSeats = new Map(list.fixedSeats);
    this.layouts = { '232': [], '222': [], '33': [] };
    this.saveToStorage();
  }

  deleteList(name) {
    if (!this.savedLists.has(name)) throw new Error('Lijst niet gevonden');
    this.savedLists.delete(name);
    this.saveToStorage();
  }
}

class NotificationSystem {
  constructor() {
    this.container = document.getElementById('notificationContainer');
  }

  show(message, type = 'success', duration = 3000) {
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.textContent = message;
    this.container.appendChild(n);
    setTimeout(() => {
      n.style.opacity = '0';
      n.style.transform = 'translateX(100%)';
      setTimeout(() => n.remove(), 300);
    }, duration);
  }

  success(msg) { this.show(msg, 'success'); }
  error(msg) { this.show(msg, 'error', 5000); }
  warning(msg) { this.show(msg, 'warning', 4000); }
}

class TabManager {
  constructor(state) {
    this.state = state;
    this.setupTabs();
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        contents.forEach(content => content.classList.remove('active'));
        const contentId = tab.getAttribute('aria-controls');
        document.getElementById(contentId).classList.add('active');

        this.state.activeTab = tab.id.replace('tab', '');
        this.state.saveToStorage();
      });
    });
  }

  setActiveTab(tabId) {
    document.getElementById(`tab${tabId}`).click();
  }
}

class SeatingGenerator {
  constructor(state) {
    this.state = state;
  }

  generateLayout(type) {
    const layoutConfigs = {
      '232': { groupSizes: [2, 3, 2], rows: 5, seatsPerRow: 7 },
      '222': { groupSizes: [2, 2, 2], rows: 6, seatsPerRow: 6 },
      '33': { groupSizes: [3, 3], rows: 6, seatsPerRow: 6 }
    };

    const { rows, seatsPerRow } = layoutConfigs[type];
    const maxSeats = rows * seatsPerRow;
    const seating = new Array(maxSeats).fill(null);

    this.state.fixedSeats.forEach((seatNumber, studentName) => {
      if (seatNumber < maxSeats) seating[seatNumber] = { name: studentName };
    });

    const remaining = this.state.students.filter(s => !this.state.fixedSeats.has(s));
    const shuffled = remaining.sort(() => Math.random() - 0.5);

    let i = 0;
    for (let j = 0; j < seating.length && i < shuffled.length; j++) {
      if (!seating[j]) seating[j] = { name: shuffled[i++] };
    }

    this.state.layouts[type] = seating;
    return seating;
  }

  createSeatElement(seat, index, layout) {
    const seatDiv = document.createElement('div');
    seatDiv.className = 'seat';
    seatDiv.draggable = true;
    seatDiv.dataset.index = index;
    seatDiv.innerHTML = `
      <span class="seat-number">${index + 1}</span>
      <span>${seat ? seat.name : '---'}</span>
    `;

    seatDiv.addEventListener('dragstart', (e) => {
      e.target.classList.add('dragging');
      e.dataTransfer.setData('text/plain', index);
    });

    seatDiv.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
    });

    seatDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      seatDiv.classList.add('drag-over');
    });

    seatDiv.addEventListener('dragleave', () => {
      seatDiv.classList.remove('drag-over');
    });

    seatDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      seatDiv.classList.remove('drag-over');
      const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const targetIndex = parseInt(seatDiv.dataset.index);
      if (sourceIndex !== targetIndex) {
        this.swapSeats(sourceIndex, targetIndex, layout);
      }
    });

    return seatDiv;
  }

  swapSeats(sourceIndex, targetIndex, layout) {
    const seating = this.state.layouts[layout];
    if (!seating) return;
    [seating[sourceIndex], seating[targetIndex]] = [seating[targetIndex], seating[sourceIndex]];
    const sourceName = seating[sourceIndex]?.name;
    const targetName = seating[targetIndex]?.name;

    if (sourceName && this.state.fixedSeats.has(sourceName)) {
      this.state.fixedSeats.set(sourceName, targetIndex);
    }
    if (targetName && this.state.fixedSeats.has(targetName)) {
      this.state.fixedSeats.set(targetName, sourceIndex);
    }

    this.state.layouts[layout] = seating;
    this.render();
    this.state.saveToStorage();
  }

  render() {
    const layoutConfigs = {
      '232': { groupSizes: [2, 3, 2], rows: 5, seatsPerRow: 7 },
      '222': { groupSizes: [2, 2, 2], rows: 6, seatsPerRow: 6 },
      '33': { groupSizes: [3, 3], rows: 6, seatsPerRow: 6 }
    };

    ['232', '222', '33'].forEach(layout => {
      const seating = this.state.layouts[layout].length
        ? this.state.layouts[layout]
        : this.generateLayout(layout);

      const plan = document.getElementById(`seatingPlan${layout}`);
      plan.innerHTML = '';

      const teacherDesk = document.createElement('div');
      teacherDesk.className = 'teacher-desk';
      teacherDesk.innerHTML = '<div class="teacher-seat">Docent</div>';
      plan.appendChild(teacherDesk);

      const config = layoutConfigs[layout];
      for (let row = 0; row < config.rows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row-container';
        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-container';

        let seatIndex = row * config.seatsPerRow;
        for (const groupSize of config.groupSizes) {
          const group = document.createElement('div');
          group.className = 'seat-group';

          for (let i = 0; i < groupSize; i++) {
            group.appendChild(this.createSeatElement(seating[seatIndex], seatIndex, layout));
            seatIndex++;
          }

          groupContainer.appendChild(group);
        }

        rowDiv.appendChild(groupContainer);
        plan.appendChild(rowDiv);
      }
    });
  }
}

class ListManager {
  constructor(state, notifications) {
    this.state = state;
    this.notifications = notifications;
    this.setupListManagement();
  }

  setupListManagement() {
    const listSelect = document.getElementById('listSelect');
    const loadListBtn = document.getElementById('loadListBtn');
    const deleteListBtn = document.getElementById('deleteListBtn');
    const saveListBtn = document.getElementById('saveListBtn');
    const listNameInput = document.getElementById('listName');

    this.updateListSelect();

    document.querySelector('.list-management-header').addEventListener('click', () => {
      document.querySelector('.list-management').classList.toggle('collapsed');
    });

    listSelect.addEventListener('change', () => {
      const hasSelection = listSelect.value !== '';
      loadListBtn.disabled = !hasSelection;
      deleteListBtn.disabled = !hasSelection;
    });

    loadListBtn.addEventListener('click', () => {
      const selectedList = listSelect.value;
      if (selectedList) {
        try {
          this.state.loadList(selectedList);
          this.updateUI();
          this.notifications.success(`Lijst "${selectedList}" geladen`);
        } catch (error) {
          this.notifications.error(error.message);
        }
      }
    });

    deleteListBtn.addEventListener('click', () => {
      const selectedList = listSelect.value;
      if (selectedList && confirm(`Weet je zeker dat je de lijst "${selectedList}" wilt verwijderen?`)) {
        try {
          this.state.deleteList(selectedList);
          this.updateListSelect();
          this.notifications.success(`Lijst "${selectedList}" verwijderd`);
        } catch (error) {
          this.notifications.error(error.message);
        }
      }
    });

    saveListBtn.addEventListener('click', () => {
      const name = listNameInput.value.trim();
      if (name) {
        try {
          if (this.state.savedLists.has(name) &&
              !confirm(`Er bestaat al een lijst met de naam "${name}". Wil je deze overschrijven?`)) {
            return;
          }
          this.state.saveList(name);
          this.updateListSelect();
          listNameInput.value = '';
          this.notifications.success(`Lijst "${name}" opgeslagen`);
        } catch (error) {
          this.notifications.error(error.message);
        }
      } else {
        this.notifications.error('Geef een naam op voor de lijst');
      }
    });
  }

  updateListSelect() {
    const listSelect = document.getElementById('listSelect');
    const currentValue = listSelect.value;
    while (listSelect.options.length > 1) listSelect.options.remove(1);
    Array.from(this.state.savedLists.keys()).sort().forEach(name => {
      const option = new Option(name, name);
      listSelect.add(option);
    });
    listSelect.value = this.state.savedLists.has(currentValue) ? currentValue : '';
  }

  updateUI() {
    document.getElementById('studentNames').value = this.state.students.join('\n');
    const container = document.getElementById('fixedSeatsContainer');
    container.innerHTML = '';
    this.state.fixedSeats.forEach((seatNumber, studentName) => {
      const template = document.getElementById('fixedSeatTemplate');
      const clone = template.content.cloneNode(true);
      const nameInput = clone.querySelector('.fixed-name');
      const positionInput = clone.querySelector('.fixed-position');
      nameInput.value = studentName;
      positionInput.value = seatNumber + 1;
      const removeBtn = clone.querySelector('.remove-fixed');
      removeBtn.addEventListener('click', (e) => {
        e.target.closest('.fixed-seat-input').remove();
        this.updateFixedSeats();
      });
      clone.querySelectorAll('input').forEach(input =>
        input.addEventListener('change', () => this.updateFixedSeats()));
      container.appendChild(clone);
    });
  }

  updateFixedSeats() {
    this.state.fixedSeats.clear();
    document.querySelectorAll('.fixed-seat-input').forEach(input => {
      const name = input.querySelector('.fixed-name').value.trim();
      const pos = parseInt(input.querySelector('.fixed-position').value);
      if (name && pos >= 1 && pos <= 35) {
        this.state.fixedSeats.set(name, pos - 1);
      }
    });
    this.state.saveToStorage();
  }
}

class EventHandlers {
  constructor(state, notifications, seatingGenerator, tabManager, listManager) {
    this.state = state;
    this.notifications = notifications;
    this.seatingGenerator = seatingGenerator;
    this.tabManager = tabManager;
    this.listManager = listManager;
    this.setup();
  }

  setup() {
    document.getElementById('darkModeToggle').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      this.state.darkMode = document.body.classList.contains('dark-mode');
      this.state.saveToStorage();
    });

    document.getElementById('generateBtn').addEventListener('click', () => {
      if (this.state.students.length === 0) {
        this.notifications.error('Voer eerst leerlingen in');
        return;
      }
      this.state.layouts = { '232': [], '222': [], '33': [] };
      this.seatingGenerator.render();
      this.notifications.success('Nieuwe opstelling gegenereerd');
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.state.saveToStorage();
      this.notifications.success('Configuratie opgeslagen');
    });

    document.getElementById('screenshotBtn').addEventListener('click', async () => {
      const button = document.getElementById('screenshotBtn');
      button.disabled = true;
      try {
        const activeLayout = document.querySelector('.tab-content.active');
        const canvas = await html2canvas(activeLayout, {
          backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color'),
          scale: 3,
          logging: false,
          useCORS: true
        });
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          link.download = `klasopstelling-${timestamp}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
        this.notifications.success('Plattegrond gedownload');
      } catch (e) {
        this.notifications.error('Fout bij maken screenshot: ' + e.message);
      } finally {
        button.disabled = false;
      }
    });

    document.getElementById('addFixedSeatBtn').addEventListener('click', () => {
      this.addFixedSeatInput();
    });

    document.getElementById('studentNames').addEventListener('input', this.debounce(() => this.updateStudents(), 500));
  }

  updateStudents() {
    const input = document.getElementById('studentNames').value;
    const names = input.split('\n').map(n => n.trim()).filter(n => n);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    if (duplicates.length > 0) {
      this.notifications.error(`Dubbele namen gevonden: ${duplicates.join(', ')}`);
      return;
    }
    this.state.students = names;
    this.state.saveToStorage();
  }

  addFixedSeatInput() {
    const container = document.getElementById('fixedSeatsContainer');
    const template = document.getElementById('fixedSeatTemplate');
    const clone = template.content.cloneNode(true);
    clone.querySelector('.remove-fixed').addEventListener('click', (e) => {
      e.target.closest('.fixed-seat-input').remove();
      this.updateFixedSeats();
    });
    clone.querySelectorAll('input').forEach(input =>
      input.addEventListener('change', () => this.updateFixedSeats()));
    container.appendChild(clone);
  }

  updateFixedSeats() {
    this.state.fixedSeats.clear();
    document.querySelectorAll('.fixed-seat-input').forEach(input => {
      const name = input.querySelector('.fixed-name').value.trim();
      const pos = parseInt(input.querySelector('.fixed-position').value);
      if (name && pos >= 1 && pos <= 35) {
        this.state.fixedSeats.set(name, pos - 1);
      }
    });
    this.state.saveToStorage();
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const state = new State();
  const notifications = new NotificationSystem();
  const tabManager = new TabManager(state);
  const seatingGenerator = new SeatingGenerator(state);
  const listManager = new ListManager(state, notifications);
  new EventHandlers(state, notifications, seatingGenerator, tabManager, listManager);

  if (state.loadFromStorage()) {
    document.getElementById('studentNames').value = state.students.join('\n');
    if (state.darkMode) document.body.classList.add('dark-mode');
    listManager.updateUI();
    tabManager.setActiveTab(state.activeTab);
    if (state.students.length > 0) seatingGenerator.render();
    notifications.success('Eerdere configuratie geladen');
  }
});
