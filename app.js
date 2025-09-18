// State Management
    class State {
        constructor() {
            this.students = [];
            this.fixedSeats = new Map();
            this.separatedPairs = [];
            this.layouts = {
                '232': [],
                '222': [],
                '33': [],
                'custom': []
            };
            this.customLayoutConfig = {
                rows: 5,
                groupSizes: [2, 3, 2]
            };
            this.darkMode = false;
            this.activeTab = '222';
            this.savedLists = new Map();
            this.colorTheme = 'blue'; // Default color theme
        }

        saveToStorage() {
            const data = {
                students: this.students,
                fixedSeats: Array.from(this.fixedSeats.entries()),
                separatedPairs: this.separatedPairs,
                darkMode: this.darkMode,
                activeTab: this.activeTab,
                layouts: this.layouts,
                savedLists: Array.from(this.savedLists.entries()),
                colorTheme: this.colorTheme,
                customLayoutConfig: this.customLayoutConfig
            };
            localStorage.setItem('classroomState', JSON.stringify(data));
        }

        loadFromStorage() {
            const data = JSON.parse(localStorage.getItem('classroomState'));
            if (data) {
                this.students = data.students || [];
                this.fixedSeats = new Map(data.fixedSeats || []);
                this.separatedPairs = data.separatedPairs || [];
                this.darkMode = data.darkMode || false;
                this.activeTab = data.activeTab || '222';
                this.layouts = data.layouts || { '232': [], '222': [], '33': [], 'custom': [] };
                this.savedLists = new Map(data.savedLists || []);
                this.colorTheme = data.colorTheme || 'blue';
                this.customLayoutConfig = data.customLayoutConfig || { rows: 5, groupSizes: [2, 3, 2] };
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
                fixedSeats: Array.from(this.fixedSeats.entries()),
                separatedPairs: this.separatedPairs
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
            this.separatedPairs = listData.separatedPairs || [];
            // Reset layouts wanneer een nieuwe lijst wordt geladen
            this.layouts = { '232': [], '222': [], '33': [], 'custom': [] };
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
            const fixedContainer = document.getElementById('fixedSeatsContainer');
            fixedContainer.innerHTML = '';
            this.state.fixedSeats.forEach((seatNumber, studentName) => {
                this.addFixedSeatInput(studentName, seatNumber + 1);
            });

            // Update separated pairs
            const separatedContainer = document.getElementById('separatedPairsContainer');
            separatedContainer.innerHTML = '';
            this.state.separatedPairs.forEach(pair => {
                this.addSeparatedPairInput(pair[0], pair[1]);
            });
        }
    }

// SeatingGenerator class
    class SeatingGenerator {
        constructor(state, notifications) {
            this.state = state;
            this.notifications = notifications;
            this.layoutConfigs = {};
        }

        _getLayoutConfigs() {
            const customConfig = this.state.customLayoutConfig;
            this.layoutConfigs = {
                '232': { groupSizes: [2,3,2], rows: 5, seatsPerRow: 7 },
                '222': { groupSizes: [2,2,2], rows: 6, seatsPerRow: 6 },
                '33': { groupSizes: [3,3], rows: 6, seatsPerRow: 6 },
                'custom': {
                    groupSizes: customConfig.groupSizes || [],
                    rows: customConfig.rows || 0,
                    seatsPerRow: (customConfig.groupSizes || []).reduce((a, b) => a + b, 0)
                }
            };
            return this.layoutConfigs;
        }

        // Fisher-Yates shuffle implementation
        shuffle(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }
        
        getNeighbors(index, layoutType) {
            const config = this.layoutConfigs[layoutType];
            if (!config) return [];
            
            const { seatsPerRow, groupSizes } = config;
            const maxSeats = config.rows * seatsPerRow;
            const neighbors = [];

            const col = index % seatsPerRow;

            // Directe buren (boven, onder)
            const top = index - seatsPerRow;
            const bottom = index + seatsPerRow;

            if (top >= 0) neighbors.push(top);
            if (bottom < maxSeats) neighbors.push(bottom);
            
            // Links, Rechts, en Diagonaal (binnen dezelfde visuele groep)
            let currentPosInRow = 0;
            for (const size of groupSizes) {
                const startOfGroup = currentPosInRow;
                const endOfGroup = currentPosInRow + size - 1;
                
                if (col >= startOfGroup && col <= endOfGroup) {
                    const isNotFirstColOfGroup = col > startOfGroup;
                    const isNotLastColOfGroup = col < endOfGroup;

                    // Links & Rechts
                    if (isNotFirstColOfGroup) neighbors.push(index - 1);
                    if (isNotLastColOfGroup) neighbors.push(index + 1);

                    // Diagonale buren
                    if (top >= 0) {
                        if (isNotFirstColOfGroup) neighbors.push(top - 1); // Schuin linksboven
                        if (isNotLastColOfGroup) neighbors.push(top + 1);  // Schuin rechtsboven
                    }
                    if (bottom < maxSeats) {
                        if (isNotFirstColOfGroup) neighbors.push(bottom - 1); // Schuin linksonder
                        if (isNotLastColOfGroup) neighbors.push(bottom + 1);  // Schuin rechtsonder
                    }
                    break;
                }
                currentPosInRow += size;
            }
            return neighbors;
        }


        generateLayout(type) {
            if (this.state.layouts[type] && this.state.layouts[type].length > 0) {
                return this.state.layouts[type];
            }

            const MAX_ATTEMPTS = 500;
            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                let seating = this._attemptPlacement(type);
                let violations = this._findViolations(seating, type);

                if (violations.length === 0) {
                    this.state.layouts[type] = seating;
                    return seating;
                }

                // Probeer de schendingen op te lossen door te ruilen
                for (const violation of violations) {
                    seating = this._fixViolation(violation, seating);
                }
                
                // Controleer opnieuw na de fix-pogingen
                if (this._findViolations(seating, type).length === 0) {
                     this.state.layouts[type] = seating;
                    return seating;
                }
            }

            this.notifications.warning(`Kon geen opstelling vinden voor ${type} zonder schendingen. Resultaat kan onvolledig zijn.`);
            const finalSeating = this._attemptPlacement(type); // Geef de laatste poging terug
            this.state.layouts[type] = finalSeating;
            return finalSeating;
        }

        _attemptPlacement(type) {
            const config = this.layoutConfigs[type];
            const maxSeats = config.rows * config.seatsPerRow;
            const seating = new Array(maxSeats).fill(null);

            this.state.fixedSeats.forEach((seatNumber, studentName) => {
                if (seatNumber < maxSeats) {
                    seating[seatNumber] = { name: studentName };
                }
            });

            const remainingStudents = this.state.students.filter(
                student => !this.state.fixedSeats.has(student)
            );
            const shuffledStudents = this.shuffle(remainingStudents);
            let studentIndex = 0;

            for (let i = 0; i < maxSeats && studentIndex < shuffledStudents.length; i++) {
                if (seating[i] === null) {
                    seating[i] = { name: shuffledStudents[studentIndex] };
                    studentIndex++;
                }
            }
            return seating;
        }

        _findViolations(seating, type) {
            const violations = [];
            const studentMap = new Map();
            seating.forEach((seat, index) => {
                if (seat) studentMap.set(seat.name, index);
            });

            if (studentMap.size === 0) return [];
            
            for (const pair of this.state.separatedPairs) {
                const [name1, name2] = pair;
                if (studentMap.has(name1) && studentMap.has(name2)) {
                    const index1 = studentMap.get(name1);
                    const index2 = studentMap.get(name2);
                    const neighbors1 = this.getNeighbors(index1, type);

                    if (neighbors1.includes(index2)) {
                        violations.push({ pair, indices: [index1, index2] });
                    }
                }
            }
            return violations;
        }
        
        _fixViolation(violation, seating) {
            const [indexToSwap] = violation.indices;
            const movableStudentsIndices = [];
            seating.forEach((seat, index) => {
                if (seat && !this.state.fixedSeats.has(seat.name)) {
                    movableStudentsIndices.push(index);
                }
            });
            
            const randomIndexToSwapWith = movableStudentsIndices[Math.floor(Math.random() * movableStudentsIndices.length)];

            if (randomIndexToSwapWith !== undefined) {
                [seating[indexToSwap], seating[randomIndexToSwapWith]] = [seating[randomIndexToSwapWith], seating[indexToSwap]];
            }
            
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
                    if (currentIndex < seating.length) {
                        group.appendChild(this.createSeatElement(seating[currentIndex], currentIndex, layout));
                    }
                    currentIndex++;
                }
                rowDiv.appendChild(group);
            });
            
            return rowDiv;
        }

        render() {
            const layoutConfigs = this._getLayoutConfigs();

            Object.keys(layoutConfigs).forEach(layout => {
                const seating = this.generateLayout(layout);
                const plan = document.getElementById(`seatingPlan${layout}`);
                if (!plan) return;
                
                plan.innerHTML = '';

                // Add wide-layout class if necessary
                const config = layoutConfigs[layout];
                if (layout === 'custom') {
                    if (config.seatsPerRow > 8) { // Threshold for wide layout
                        plan.classList.add('wide-layout');
                    } else {
                        plan.classList.remove('wide-layout');
                    }
                }

                // Voeg docentenbureau toe
                const teacherDesk = document.createElement('div');
                teacherDesk.className = 'teacher-desk';
                const teacherSeat = document.createElement('div');
                teacherSeat.className = 'teacher-seat';
                teacherSeat.textContent = 'Docent';
                teacherDesk.appendChild(teacherSeat);
                plan.appendChild(teacherDesk);

                if (config.seatsPerRow === 0) return;

                for (let row = 0; row < config.rows; row++) {
                    const rowContainer = document.createElement('div');
                    rowContainer.className = 'row-container';
                    const startIndex = row * config.seatsPerRow;
                    if (startIndex < seating.length) {
                        rowContainer.appendChild(
                            this.createRowGroup(seating, startIndex, config.groupSizes, layout)
                        );
                        plan.appendChild(rowContainer);
                    }
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
            const tabButton = document.getElementById(`tab${tabId}`);
            if (tabButton) {
                tabButton.click();
            } else {
                // Fallback to the first tab if the saved one doesn't exist
                document.querySelector('.tab-button').click();
            }
        }
    }

    // EventHandlers class
    class EventHandlers {
        constructor(state, notifications, seatingGenerator, tabManager, listManager) {
            this.state = state;
            this.notifications = notifications;
            this.seatingGenerator = seatingGenerator;
            this.tabManager = tabManager;
            this.listManager = listManager;
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
                    const activeLayout = document.querySelector('.tab-content.active .seating-plan');
                    if (!activeLayout) {
                        this.notifications.error('Geen actieve plattegrond gevonden.');
                        return;
                    }
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
            
             // Add Separated Pair Button
            document.getElementById('addSeparatedPairBtn').addEventListener('click', () => {
                this.addSeparatedPairInput();
            });

            // Student Names Input
            document.getElementById('studentNames').addEventListener('input', 
                this.debounce(() => this.updateStudents(), 500)
            );

            // Color theme change handler
            const colorButtons = document.querySelectorAll('.color-button');
            colorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const theme = button.dataset.theme;
                    this.state.colorTheme = theme;
                    document.documentElement.setAttribute('data-theme', theme);
                    
                    // Update active state of buttons
                    colorButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    this.state.saveToStorage();
                    this.notifications.success(`Thema kleur gewijzigd naar ${theme}`);
                });
            });

            // Custom layout controls
            document.getElementById('applyCustomLayoutBtn').addEventListener('click', () => {
                this.applyCustomLayout();
            });

            // Initialize color theme
            const activeButton = document.querySelector(`.color-button[data-theme="${this.state.colorTheme}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            document.documentElement.setAttribute('data-theme', this.state.colorTheme);
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

        addFixedSeatInput(name = '', position = '') {
            const container = document.getElementById('fixedSeatsContainer');
            const template = document.getElementById('fixedSeatTemplate');
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.fixed-name').value = name;
            clone.querySelector('.fixed-position').value = position;

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
                if (name && position && position >= 1 && position <= 40) {
                    this.state.fixedSeats.set(name, position - 1);
                }
            });
            this.state.saveToStorage();
        }
        
        addSeparatedPairInput(name1 = '', name2 = '') {
            const container = document.getElementById('separatedPairsContainer');
            const template = document.getElementById('separatedPairTemplate');
            const clone = template.content.cloneNode(true);

            clone.querySelector('.separated-name1').value = name1;
            clone.querySelector('.separated-name2').value = name2;
            
            const removeBtn = clone.querySelector('.remove-separated-pair');
            removeBtn.addEventListener('click', (e) => {
                e.target.closest('.separated-pair-input').remove();
                this.updateSeparatedPairs();
            });

            const inputs = clone.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('change', () => this.updateSeparatedPairs());
            });

            container.appendChild(clone);
        }
        
        updateSeparatedPairs() {
            this.state.separatedPairs = [];
            document.querySelectorAll('.separated-pair-input').forEach(input => {
                const name1 = input.querySelector('.separated-name1').value.trim();
                const name2 = input.querySelector('.separated-name2').value.trim();
                if (name1 && name2) {
                    this.state.separatedPairs.push([name1, name2]);
                }
            });
            this.state.saveToStorage();
        }


        generateSeating() {
            if (this.state.students.length === 0) {
                this.notifications.error('Voer eerst leerlingen in');
                return;
            }
            
            this.state.layouts = { '232': [], '222': [], '33': [], 'custom': [] };
            this.seatingGenerator.render();
            this.notifications.success('Nieuwe opstelling gegenereerd');
        }

        applyCustomLayout() {
            const rows = parseInt(document.getElementById('customRows').value);
            const groupSizesStr = document.getElementById('customGroupSizes').value;
            const groupSizes = groupSizesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

            if (!rows || rows <= 0 || groupSizes.length === 0) {
                this.notifications.error('Ongeldige invoer voor custom layout.');
                return;
            }

            this.state.customLayoutConfig = { rows, groupSizes };
            this.state.layouts.custom = []; // Reset the layout
            this.seatingGenerator.render();
            this.notifications.success('Custom layout toegepast');
            this.state.saveToStorage();
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
        const seatingGenerator = new SeatingGenerator(state, notifications);
        const tabManager = new TabManager(state);
        const listManager = new ListManager(state, notifications);
        const eventHandlers = new EventHandlers(state, notifications, seatingGenerator, tabManager, listManager);
        listManager.updateUI = eventHandlers.addFixedSeatInput.bind(eventHandlers);
        listManager.updateUI = eventHandlers.addSeparatedPairInput.bind(eventHandlers);
        listManager.updateUI = function() {
             document.getElementById('studentNames').value = state.students.join('\n');

            const fixedContainer = document.getElementById('fixedSeatsContainer');
            fixedContainer.innerHTML = '';
            state.fixedSeats.forEach((seatNumber, studentName) => {
                eventHandlers.addFixedSeatInput(studentName, seatNumber + 1);
            });

            const separatedContainer = document.getElementById('separatedPairsContainer');
            separatedContainer.innerHTML = '';
            state.separatedPairs.forEach(pair => {
                eventHandlers.addSeparatedPairInput(pair[0], pair[1]);
            });
        };

        // Load saved state
        if (state.loadFromStorage()) {
            document.getElementById('studentNames').value = state.students.join('\n');
            document.getElementById('customRows').value = state.customLayoutConfig.rows;
            document.getElementById('customGroupSizes').value = state.customLayoutConfig.groupSizes.join(',');

            if (state.darkMode) {
                document.body.classList.add('dark-mode');
            }
            
            listManager.updateUI();

            tabManager.setActiveTab(state.activeTab);

            // Render layouts if there's data for them
            if (Object.values(state.layouts).some(l => l && l.length > 0)) {
                 seatingGenerator.render();
            }

            notifications.success('Eerdere configuratie geladen');
        }
    });
