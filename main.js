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

// Nieuwe functie: layout genereren
function generateLayout(type, state) {
  const layouts = {
    '232': { maxSeats: 35 },
    '222': { maxSeats: 32 },
    '33': { maxSeats: 36 }
  };

  const { maxSeats } = layouts[type];
  const seating = new Array(maxSeats).fill(null);

  state.fixedSeats.forEach((seatNumber, studentName) => {
    if (seatNumber < maxSeats) seating[seatNumber] = { name: studentName };
  });

  const remaining = state.students.filter(s => !state.fixedSeats.has(s));
  const shuffled = remaining.sort(() => Math.random() - 0.5);

  let i = 0;
  for (let j = 0; j < seating.length && i < shuffled.length; j++) {
    if (!seating[j]) seating[j] = { name: shuffled[i++] };
  }

  return seating;
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
    const removeBtn = clone.querySelector('.remove-fixed');
    removeBtn.addEventListener('click', e => {
      e.target.closest('.fixed-seat-input').remove();
      this.updateFixedSeats();
    });
    clone.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => this.updateFixedSeats());
    });
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

// Init
window.addEventListener('DOMContentLoaded', () => {
  const state = new State();
  const notifications = new NotificationSystem();
  const tabManager = new TabManager(state);

  const seatingGenerator = {
    render: () => {
      const layout = state.activeTab;
      const plan = document.getElementById(`seatingPlan${layout}`);
      let layoutData = state.layouts[layout];

      if (layoutData.length === 0 && state.students.length > 0) {
        layoutData = generateLayout(layout, state);
        state.layouts[layout] = layoutData;
      }

      plan.innerHTML = '';
      layoutData.forEach((seat, i) => {
        const seatDiv = document.createElement('div');
        seatDiv.className = 'seat';
        seatDiv.innerHTML = `<span class="seat-number">${i + 1}</span><span>${seat?.name || '---'}</span>`;
        plan.appendChild(seatDiv);
      });
    }
  };

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
