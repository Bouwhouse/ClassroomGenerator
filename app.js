    // State Management
    class State {
        constructor() {
            this.students = [];
            this.fixedSeats = new Map();
            this.layouts = {
                '232': [],
                '222': [],
                '33': []
            };
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
            if (data) {
                this.students = data.students || [];
                this.fixedSeats = new Map(data.fixedSeats || []);
                this.darkMode = data.darkMode || false;
                this.activeTab = data.activeTab || '222';
                this.layouts = data.layouts || { '232': [], '222': [], '33': [] };
                this.savedLists = new Map(data.savedLists || []);
                return true;
            }
            return false;
        }

        saveList(name) {
            if (!name) {
                throw new Error('Geef een naam op voor de lijst');
            }
            
            const listData = {
                students: this.students,
                fixedSeats: Array.from(this.fixedSeats.entries())
            };
            
            this.savedLists.set(name, listData);
            this.saveToStorage();
        }

        loadList(name) {
            const listData = this.savedLists.get(name);
            if (!listData) {
                throw new Error('Lijst niet gevonden');
            }
            
            this.students = listData.students;
            this.fixedSeats = new Map(listData.fixedSeats);
            // Reset layouts wanneer een nieuwe lijst wordt geladen
            this.layouts = { '232': [], '222': [], '33': [] };
            this.saveToStorage();
        }

        deleteList(name) {
            if (!this.savedLists.has(name)) {
                throw new Error('Lijst niet gevonden');
            }
            
            this.savedLists.delete(name);
            this.saveToStorage();
        }
    }

    // NotificationSystem class
    class NotificationSystem {
        constructor() {
            this.container = document.getElementById('notificationContainer');
        }

        show(message, type = 'success', duration = 3000) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;

            this.container.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
        }

        success(message) {
            this.show(message, 'success');
        }

        error(message) {
            this.show(message, 'error', 5000);
        }

        warning(message) {
            this.show(message, 'warning', 4000);
        }
    }
// ListManager class
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

            // Update select options
            this.updateListSelect();

            // Setup collapse functionality
            const listManagement = document.querySelector('.list-management');
            const header = document.querySelector('.list-management-header');
            header.addEventListener('click', () => {
                listManagement.classList.toggle('collapsed');
            });

            // Event listeners
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
                if (selectedList) {
                    if (confirm(`Weet je zeker dat je de lijst "${selectedList}" wilt verwijderen?`)) {
                        try {
                            this.state.deleteList(selectedList);
                            this.updateListSelect();
                            this.notifications.success(`Lijst "${selectedList}" verwijderd`);
                        } catch (error) {
                            this.notifications.error(error.message);
                        }
                    }
                }
            });

            saveListBtn.addEventListener('click', () => {
                const name = listNameInput.value.trim();
                if (name) {
                    try {
                        if (this.state.savedLists.has(name)) {
                            if (!confirm(`Er bestaat al een lijst met de naam "${name}". Wil je deze overschrijven?`)) {
                                return;
                            }
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
            
            // Clear existing options except the placeholder
            while (listSelect.options.length > 1) {
                listSelect.options.remove(1);
            }
            
            // Add saved lists as options
            Array.from(this.state.savedLists.keys())
                .sort()
                .forEach(name => {
                    const option = new Option(name, name);
                    listSelect.add(option);
                });
            
            // Restore selection if still available
            if (this.state.savedLists.has(currentValue)) {
                listSelect.value = currentValue;
            } else {
                listSelect.value = '';
                document.getElementById('loadListBtn').disabled = true;
                document.getElementById('deleteListBtn').disabled = true;
            }
        }

        updateUI() {
            // Update student names textarea
            document.getElementById('studentNames').value = this.state.students.join('\n');

            // Update fixed seats
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
                
                const inputs = clone.querySelectorAll('input');
                inputs.forEach(input => {
                    input.addEventListener('change', () => this.updateFixedSeats());
                });
                
                container.appendChild(clone);
            });
        }

        updateFixedSeats() {
            this.state.fixedSeats.clear();
            document.querySelectorAll('.fixed-seat-input').forEach(input => {
                const name = input.querySelector('.fixed-name').value.trim();
                const position = parseInt(input.querySelector('.fixed-position').value);
                if (name && position && position >= 1 && position <= 35) {
                    this.state.fixedSeats.set(name, position - 1);
                }
            });
            this.state.saveToStorage();
        }
    }
// SeatingGenerator class
    class SeatingGenerator {
        constructor(state) {
            this.state = state;
        }

        generateLayout(type) {
            // Als er al een layout bestaat voor dit type, gebruik die
            if (this.state.layouts[type] && this.state.layouts[type].length > 0) {
                return this.state.layouts[type];
            }

            // Anders, genereer een nieuwe layout
            const layouts = {
                '232': { maxSeats: 35, seatsPerRow: 7 },
                '222': { maxSeats: 32, seatsPerRow: 6 },
                '33': { maxSeats: 36, seatsPerRow: 6 }
            };

            const { maxSeats, seatsPerRow } = layouts[type];
            const seating = new Array(maxSeats).fill(null);

            // Eerst vaste plaatsen toewijzen
            this.state.fixedSeats.forEach((seatNumber, studentName) => {
                if (seatNumber < maxSeats) {
                    seating[seatNumber] = { name: studentName };
                }
            });

            // Overige studenten random toewijzen
            const remainingStudents = this.state.students.filter(
                student => !this.state.fixedSeats.has(student)
            );
            const shuffledStudents = remainingStudents.sort(() => Math.random() - 0.5);
            let studentIndex = 0;

            for (let i = 0; i < maxSeats && studentIndex < shuffledStudents.length; i++) {
                if (seating[i] === null) {
                    seating[i] = { name: shuffledStudents[studentIndex] };
                    studentIndex++;
                }
            }

            // Sla de layout op in state
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

            // Drag events toevoegen
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
            
            [seating[sourceIndex], seating[targetIndex]] = 
            [seating[targetIndex], seating[sourceIndex]];
            
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

        createRowGroup(seating, startIndex, groupSizes, layout) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'group-container';
            
            let currentIndex = startIndex;
            groupSizes.forEach(size => {
                const group = document.createElement('div');
                group.className = 'seat-group';
                for (let i = 0; i < size; i++) {
                    group.appendChild(this.createSeatElement(seating[currentIndex], currentIndex, layout));
                    currentIndex++;
                }
                rowDiv.appendChild(group);
            });
            
            return rowDiv;
        }

        render() {
            const layoutConfigs = {
                '232': { groupSizes: [2,3,2], rows: 5, seatsPerRow: 7 },
                '222': { groupSizes: [2,2,2], rows: 6, seatsPerRow: 6 },
                '33': { groupSizes: [3,3], rows: 6, seatsPerRow: 6 }
            };

            ['232', '222', '33'].forEach(layout => {
                const seating = this.generateLayout(layout);
                const plan = document.getElementById(`seatingPlan${layout}`);
                plan.innerHTML = '';

                // Voeg docentenbureau toe
                const teacherDesk = document.createElement('div');
                teacherDesk.className = 'teacher-desk';
                const teacherSeat = document.createElement('div');
                teacherSeat.className = 'teacher-seat';
                teacherSeat.textContent = 'Docent';
                teacherDesk.appendChild(teacherSeat);
                plan.appendChild(teacherDesk);

                const config = layoutConfigs[layout];
                for (let row = 0; row < config.rows; row++) {
                    const rowContainer = document.createElement('div');
                    rowContainer.className = 'row-container';
                    rowContainer.appendChild(
                        this.createRowGroup(seating, row * config.seatsPerRow, config.groupSizes, layout)
                    );
                    plan.appendChild(rowContainer);
                }
            });
        }
    }
// TabManager class
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

    // EventHandlers class
    class EventHandlers {
        constructor(state, notifications, seatingGenerator, tabManager) {
            this.state = state;
            this.notifications = notifications;
            this.seatingGenerator = seatingGenerator;
            this.tabManager = tabManager;
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Dark Mode Toggle
            document.getElementById('darkModeToggle').addEventListener('click', () => {
                this.toggleDarkMode();
            });

            // Generate Button
            document.getElementById('generateBtn').addEventListener('click', () => {
                this.generateSeating();
            });

            // Save Button
            document.getElementById('saveBtn').addEventListener('click', () => {
                this.saveState();
            });

            // Screenshot Button
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

                    // Convert to blob and download
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                        link.download = `klasopstelling-${timestamp}.png`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 'image/png', 1.0);

                    this.notifications.success('Plattegrond gedownload');
                } catch (error) {
                    this.notifications.error('Fout bij maken screenshot: ' + error.message);
                } finally {
                    button.disabled = false;
                }
            });

            // Add Fixed Seat Button
            document.getElementById('addFixedSeatBtn').addEventListener('click', () => {
                this.addFixedSeatInput();
            });

            // Student Names Input
            document.getElementById('studentNames').addEventListener('input', 
                this.debounce(() => this.updateStudents(), 500)
            );
        }

        toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            this.state.darkMode = document.body.classList.contains('dark-mode');
            this.state.saveToStorage();
        }

        updateStudents() {
            const studentNames = document.getElementById('studentNames')
                .value
                .split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            const duplicates = studentNames.filter(
                (item, index) => studentNames.indexOf(item) !== index
            );

            if (duplicates.length > 0) {
                this.notifications.error(`Dubbele namen gevonden: ${duplicates.join(', ')}`);
                return;
            }

            this.state.students = studentNames;
            this.state.saveToStorage();
        }

        addFixedSeatInput() {
            const container = document.getElementById('fixedSeatsContainer');
            const template = document.getElementById('fixedSeatTemplate');
            const clone = template.content.cloneNode(true);
            
            const removeBtn = clone.querySelector('.remove-fixed');
            removeBtn.addEventListener('click', (e) => {
                e.target.closest('.fixed-seat-input').remove();
                this.updateFixedSeats();
            });

            const inputs = clone.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', () => this.updateFixedSeats());
            });

            container.appendChild(clone);
        }

        updateFixedSeats() {
            this.state.fixedSeats.clear();
            document.querySelectorAll('.fixed-seat-input').forEach(input => {
                const name = input.querySelector('.fixed-name').value.trim();
                const position = parseInt(input.querySelector('.fixed-position').value);
                if (name && position && position >= 1 && position <= 35) {
                    this.state.fixedSeats.set(name, position - 1);
                }
            });
            this.state.saveToStorage();
        }

        generateSeating() {
            if (this.state.students.length === 0) {
                this.notifications.error('Voer eerst leerlingen in');
                return;
            }
            
            this.state.layouts = { '232': [], '222': [], '33': [] };
            this.seatingGenerator.render();
            this.notifications.success('Nieuwe opstelling gegenereerd');
        }

        saveState() {
            this.state.saveToStorage();
            this.notifications.success('Configuratie opgeslagen');
        }

        debounce(func, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
    }

    // Initialize Application
    document.addEventListener('DOMContentLoaded', () => {
        const state = new State();
        const notifications = new NotificationSystem();
        window.notifications = notifications; // Make notifications globally available
        const seatingGenerator = new SeatingGenerator(state);
        const tabManager = new TabManager(state);
        const listManager = new ListManager(state, notifications);
        const eventHandlers = new EventHandlers(state, notifications, seatingGenerator, tabManager);

        // Load saved state
        if (state.loadFromStorage()) {
            document.getElementById('studentNames').value = state.students.join('\n');

            if (state.darkMode) {
                document.body.classList.add('dark-mode');
            }

            state.fixedSeats.forEach((seatNumber, studentName) => {
                const container = document.getElementById('fixedSeatsContainer');
                const template = document.getElementById('fixedSeatTemplate');
                const clone = template.content.cloneNode(true);
                
                const nameInput = clone.querySelector('.fixed-name');
                const positionInput = clone.querySelector('.fixed-position');
                const removeBtn = clone.querySelector('.remove-fixed');
                
                nameInput.value = studentName;
                positionInput.value = seatNumber + 1;
                
                removeBtn.addEventListener('click', (e) => {
                    e.target.closest('.fixed-seat-input').remove();
                    eventHandlers.updateFixedSeats();
                });
                
                const inputs = clone.querySelectorAll('input');
                inputs.forEach(input => {
                    input.addEventListener('change', () => eventHandlers.updateFixedSeats());
                });
                
                container.appendChild(clone);
            });

            tabManager.setActiveTab(state.activeTab);

            if (state.students.length > 0) {
                seatingGenerator.render();
            }

            notifications.success('Eerdere configuratie geladen');
        }
    });