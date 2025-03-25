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

        contents.forEach(content => {
          content.classList.remove('active');
        });
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

    seatDiv.addEventListener('dragleave', (e) => {
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

// Init
window.addEventListener('DOMContentLoaded', () => {
  const state = new State();
  const notifications = new NotificationSystem();
  const tabManager = new TabManager(state);
  const seatingGenerator = new SeatingGenerator(state);
  const listManager = { updateUI: () => {}, updateListSelect: () => {} };
  const handlers = new EventHandlers(state, notifications, seatingGenerator, tabManager, listManager);

  if (state.loadFromStorage()) {
    document.getElementById('studentNames').value = state.students.join('\n');
    if (state.darkMode) document.body.classList.add('dark-mode');
    tabManager.setActiveTab(state.activeTab);
    seatingGenerator.render();
    notifications.success('Eerdere configuratie geladen');
  }
});
