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
            'custom': [],
            'freeform': []
        };
        this.customLayoutConfig = {
            rows: 5,
            groupSizes: [2, 3, 2]
        };
        this.activeTab = '222';
        this.savedLists = new Map();
        this.freeformGroups = [];
    }

    saveToStorage() {
        const data = {
            students: this.students,
            fixedSeats: Array.from(this.fixedSeats.entries()),
            separatedPairs: this.separatedPairs,
            activeTab: this.activeTab,
            layouts: this.layouts,
            savedLists: Array.from(this.savedLists.entries()),
            customLayoutConfig: this.customLayoutConfig,
            freeformGroups: this.freeformGroups
        };
        localStorage.setItem('classroomState', JSON.stringify(data));
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('classroomState');
            if (!stored) {
                return false;
            }
            const data = JSON.parse(stored);
            if (data) {
                this.students = data.students || [];
                this.fixedSeats = new Map(data.fixedSeats || []);
                this.separatedPairs = data.separatedPairs || [];
                this.activeTab = data.activeTab || '222';
                this.layouts = data.layouts || { '232': [], '222': [], '33': [], 'custom': [], 'freeform': [] };
                if (!this.layouts.freeform) this.layouts.freeform = [];
                if (Array.isArray(data.savedLists)) {
                    this.savedLists = new Map(data.savedLists);
                } else {
                    this.savedLists = new Map();
                }
                this.customLayoutConfig = data.customLayoutConfig || { rows: 5, groupSizes: [2, 3, 2] };
                this.freeformGroups = (data.freeformGroups || []).map(g => {
                    // Migrate old format (seats) to new (rows/cols)
                    if (g.rows === undefined || g.cols === undefined) {
                        const seats = g.seats || 2;
                        return { id: g.id, x: g.x || 20, y: g.y || 20, rows: seats, cols: 1 };
                    }
                    return g;
                });
                return true;
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            // Clear corrupted data
            localStorage.removeItem('classroomState');
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
        this.layouts = { '232': [], '222': [], '33': [], 'custom': [], 'freeform': [] };
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
        this.undoStack = [];
        this.freeformZoom = 1.0;
    }

    updateUndoButton() {
        const btn = document.getElementById('undoBtn');
        if (btn) btn.disabled = this.undoStack.length === 0;
    }

    undo() {
        if (this.undoStack.length === 0) return;
        this.state.layouts = this.undoStack.pop();
        this.render(this.state.activeTab);
        this.state.saveToStorage();
        this.updateUndoButton();
    }

    _getLayoutConfigs() {
        const customConfig = this.state.customLayoutConfig;
        this.layoutConfigs = {
            '232': { groupSizes: [2, 3, 2], rows: 5, seatsPerRow: 7 },
            '222': { groupSizes: [2, 2, 2], rows: 6, seatsPerRow: 6 },
            '33': { groupSizes: [3, 3], rows: 6, seatsPerRow: 6 },
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

        if (this.undoStack.length >= 20) this.undoStack.shift();
        this.undoStack.push(JSON.parse(JSON.stringify(this.state.layouts)));
        this.updateUndoButton();

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

    _getFreeformGroupOffset(groupIndex) {
        let offset = 0;
        for (let i = 0; i < groupIndex; i++) {
            const g = this.state.freeformGroups[i];
            offset += g.rows * g.cols;
        }
        return offset;
    }

    generateFreeformAssignment() {
        const groups = this.state.freeformGroups;
        if (groups.length === 0) return [];

        const totalSeats = groups.reduce((sum, g) => sum + g.rows * g.cols, 0);
        const seating = new Array(totalSeats).fill(null);

        this.state.fixedSeats.forEach((seatNumber, studentName) => {
            if (seatNumber < totalSeats) {
                seating[seatNumber] = { name: studentName };
            }
        });

        const shuffled = this.shuffle(
            this.state.students.filter(s => !this.state.fixedSeats.has(s))
        );
        let i = 0;
        for (let j = 0; j < seating.length && i < shuffled.length; j++) {
            if (seating[j] === null) seating[j] = { name: shuffled[i++] };
        }
        return seating;
    }

    renderFreeform() {
        const canvas = document.getElementById('freeformCanvas');
        if (!canvas) return;
        canvas.innerHTML = '';

        // Zoomable stage inside the canvas
        const stage = document.createElement('div');
        stage.id = 'freeformStage';
        stage.className = 'freeform-stage';
        stage.style.zoom = this.freeformZoom;
        canvas.appendChild(stage);

        const groups = this.state.freeformGroups;
        if (groups.length === 0) {
            const hint = document.createElement('div');
            hint.className = 'freeform-empty-hint';
            hint.textContent = 'Voeg een tafel toe om te beginnen.';
            stage.appendChild(hint);
            return;
        }

        if (!this.state.layouts.freeform || this.state.layouts.freeform.length === 0) {
            this.state.layouts.freeform = this.generateFreeformAssignment();
        }
        const seating = this.state.layouts.freeform;

        groups.forEach((group, groupIndex) => {
            const offset = this._getFreeformGroupOffset(groupIndex);
            const groupEl = document.createElement('div');
            groupEl.className = 'freeform-group';
            groupEl.style.left = group.x + 'px';
            groupEl.style.top = group.y + 'px';
            groupEl.dataset.groupId = group.id;
            // Width based on column count so the header fits
            const colMinWidths = [0, 160, 280, 370];
            groupEl.style.minWidth = (colMinWidths[group.cols] || 160) + 'px';

            const header = document.createElement('div');
            header.className = 'freeform-group-header';
            header.innerHTML = `
                <span class="drag-handle" title="Sleep tafel">⠿</span>
                <span class="group-label">Tafel ${groupIndex + 1}</span>
                <div class="group-controls">
                    <select class="group-shape-select" title="Tafelvorm">
                        <optgroup label="Horizontaal">
                            <option value="1x2">1×2</option>
                            <option value="1x3">1×3</option>
                            <option value="1x4">1×4</option>
                            <option value="1x5">1×5</option>
                            <option value="1x6">1×6</option>
                        </optgroup>
                        <optgroup label="Verticaal">
                            <option value="2x1">2×1</option>
                            <option value="3x1">3×1</option>
                            <option value="4x1">4×1</option>
                            <option value="5x1">5×1</option>
                            <option value="6x1">6×1</option>
                        </optgroup>
                        <optgroup label="Raster">
                            <option value="2x2">2×2</option>
                            <option value="2x3">2×3</option>
                            <option value="3x2">3×2</option>
                        </optgroup>
                    </select>
                    <button class="group-seats-btn remove-group" title="Verwijder tafel">✕</button>
                </div>
            `;
            header.querySelector('.group-shape-select').value = `${group.rows}x${group.cols}`;
            header.querySelector('.group-shape-select').addEventListener('change', (e) => {
                e.stopPropagation();
                const [newRows, newCols] = e.target.value.split('x').map(Number);
                group.rows = newRows;
                group.cols = newCols;
                this.state.layouts.freeform = [];
                this.state.saveToStorage();
                this.renderFreeform();
            });
            header.querySelector('.remove-group').addEventListener('click', (e) => {
                e.stopPropagation();
                this.state.freeformGroups.splice(groupIndex, 1);
                this.state.layouts.freeform = [];
                this.state.saveToStorage();
                this.renderFreeform();
            });

            const totalSeats = group.rows * group.cols;
            const seatsEl = document.createElement('div');
            seatsEl.className = 'freeform-group-seats';
            seatsEl.style.gridTemplateColumns = `repeat(${group.cols}, 1fr)`;
            for (let i = 0; i < totalSeats; i++) {
                const flatIndex = offset + i;
                seatsEl.appendChild(this.createSeatElement(seating[flatIndex] || null, flatIndex, 'freeform'));
            }

            groupEl.appendChild(header);
            groupEl.appendChild(seatsEl);
            stage.appendChild(groupEl);
            this._wireGroupDrag(groupEl, group);
        });
    }

    _wireGroupDrag(groupEl, group) {
        const handle = groupEl.querySelector('.drag-handle');
        let startX, startY, startLeft, startTop;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = group.x;
            startTop = group.y;
            groupEl.classList.add('dragging-group');

            const onMove = (e) => {
                const zoom = this.freeformZoom;
                group.x = Math.max(0, startLeft + (e.clientX - startX) / zoom);
                group.y = Math.max(0, startTop + (e.clientY - startY) / zoom);
                groupEl.style.left = group.x + 'px';
                groupEl.style.top = group.y + 'px';
            };

            const onUp = () => {
                groupEl.classList.remove('dragging-group');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                this.state.saveToStorage();
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    render(layoutType = null) {
        const layoutConfigs = this._getLayoutConfigs();
        const typesToRender = layoutType ? [layoutType] : [this.state.activeTab];

        typesToRender.forEach(layout => {
            if (layout === 'freeform') {
                this.renderFreeform();
                return;
            }
            if (!layoutConfigs[layout]) return;
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
    constructor(state, onTabChange = null) {
        this.state = state;
        this.onTabChange = onTabChange;
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
                if (this.onTabChange) this.onTabChange(this.state.activeTab);
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

const DEMO_NAMES = [
    // Nederlands
    'Emma de Vries', 'Lotte Janssen', 'Daan van den Berg', 'Sanne Bakker',
    'Bram Visser', 'Sophie Meijer', 'Tom de Boer', 'Noor Peters',
    'Lars Smit', 'Julia van Dijk', 'Finn Hendriksen', 'Maud Willems',
    // Marokkaans-Nederlands
    'Mohammed El Amrani', 'Fatima Benali', 'Youssef Chakir', 'Nadia Bouazza',
    'Rachid El Azzouzi', 'Samira El Idrissi', 'Hamza Belhaj', 'Zineb Lahlou',
    // Turks-Nederlands
    'Mehmet Yilmaz', 'Ayse Demir', 'Mustafa Kaya', 'Zeynep Celik',
    'Ali Sahin', 'Merve Ozturk', 'Can Arslan', 'Elif Bulut',
    // Surinaams-Nederlands
    'Priya Ramdjan', 'Rishi Baldew', 'Shanaya Nannan', 'Jairzinho Martina',
    // Indonesisch-Nederlands
    'Dewi Santoso', 'Sari Kusuma', 'Indra Wijaya',
    // Antilliaans-Nederlands
    'Roshelly Cijntje', 'Charline Winklaar',
];

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
        // Easter egg: 5 clicks on the logo loads a demo class list
        let logoClickCount = 0;
        let logoClickTimer = null;
        document.querySelector('.logo').addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1500);
            if (logoClickCount >= 5) {
                logoClickCount = 0;
                this.loadDemoNames();
            }
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

            let activeLayout;
            let freeformCanvas = null;
            let freeformStage = null;
            let prevStyle = null;

            if (this.state.activeTab === 'freeform') {
                freeformCanvas = document.getElementById('freeformCanvas');
                freeformStage = document.getElementById('freeformStage');

                if (!freeformStage || this.state.freeformGroups.length === 0) {
                    this.notifications.error('Voeg eerst tafels toe.');
                    button.disabled = false;
                    return;
                }

                // Reset zoom to 1.0 so the download is always full-size
                prevStyle = {
                    overflow: freeformCanvas.style.overflow,
                    height: freeformCanvas.style.height,
                    minWidth: freeformCanvas.style.minWidth,
                    stageZoom: freeformStage.style.zoom
                };
                freeformStage.style.zoom = 1;

                // Measure full extents at zoom=1
                const groupEls = freeformStage.querySelectorAll('.freeform-group');
                let maxBottom = 100, maxRight = 100;
                groupEls.forEach(el => {
                    maxBottom = Math.max(maxBottom, el.offsetTop + el.offsetHeight + 20);
                    maxRight = Math.max(maxRight, el.offsetLeft + el.offsetWidth + 20);
                });
                freeformCanvas.style.overflow = 'visible';
                freeformCanvas.style.height = maxBottom + 'px';
                freeformCanvas.style.minWidth = maxRight + 'px';
                activeLayout = freeformCanvas;
            } else {
                activeLayout = document.querySelector('.tab-content.active .seating-plan');
            }

            if (!activeLayout) {
                this.notifications.error('Geen actieve plattegrond gevonden.');
                button.disabled = false;
                return;
            }

            try {
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
                if (freeformCanvas && prevStyle) {
                    freeformCanvas.style.overflow = prevStyle.overflow;
                    freeformCanvas.style.height = prevStyle.height;
                    freeformCanvas.style.minWidth = prevStyle.minWidth;
                }
                if (freeformStage && prevStyle) {
                    freeformStage.style.zoom = prevStyle.stageZoom;
                }
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

        // Custom layout controls
        document.getElementById('applyCustomLayoutBtn').addEventListener('click', () => {
            this.applyCustomLayout();
        });

        // Undo button
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.seatingGenerator.undo();
        });

        // Ctrl+Z / Cmd+Z keyboard shortcut for undo
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                const tag = document.activeElement.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                e.preventDefault();
                this.seatingGenerator.undo();
            }
            if (e.key === 'Escape') {
                document.getElementById('helpOverlay').classList.remove('visible');
            }
        });

        // Help overlay
        const helpOverlay = document.getElementById('helpOverlay');
        document.getElementById('helpBtn').addEventListener('click', () => {
            helpOverlay.classList.add('visible');
        });
        document.getElementById('helpCloseBtn').addEventListener('click', () => {
            helpOverlay.classList.remove('visible');
        });
        helpOverlay.addEventListener('click', (e) => {
            if (e.target === helpOverlay) helpOverlay.classList.remove('visible');
        });

        // Freeform: add group button
        document.getElementById('addFreeformGroupBtn').addEventListener('click', () => {
            const n = this.state.freeformGroups.length;
            this.state.freeformGroups.push({
                id: Date.now(),
                x: 20 + (n % 4) * 180,
                y: 20 + Math.floor(n / 4) * 160,
                rows: 1,
                cols: 2
            });
            this.state.layouts.freeform = [];
            this.state.saveToStorage();
            this.seatingGenerator.render('freeform');
        });

        // Freeform: zoom controls
        const updateZoomLabel = () => {
            document.getElementById('freeformZoomLevel').textContent =
                Math.round(this.seatingGenerator.freeformZoom * 100) + '%';
        };
        document.getElementById('freeformZoomOut').addEventListener('click', () => {
            this.seatingGenerator.freeformZoom = Math.max(0.3,
                Math.round((this.seatingGenerator.freeformZoom - 0.1) * 10) / 10);
            const stage = document.getElementById('freeformStage');
            if (stage) stage.style.zoom = this.seatingGenerator.freeformZoom;
            updateZoomLabel();
        });
        document.getElementById('freeformZoomIn').addEventListener('click', () => {
            this.seatingGenerator.freeformZoom = Math.min(1.5,
                Math.round((this.seatingGenerator.freeformZoom + 0.1) * 10) / 10);
            const stage = document.getElementById('freeformStage');
            if (stage) stage.style.zoom = this.seatingGenerator.freeformZoom;
            updateZoomLabel();
        });
        document.getElementById('freeformZoomReset').addEventListener('click', () => {
            this.seatingGenerator.freeformZoom = 1.0;
            const stage = document.getElementById('freeformStage');
            if (stage) stage.style.zoom = 1.0;
            updateZoomLabel();
        });

        // Freeform: redistribute students button
        document.getElementById('generateFreeformBtn').addEventListener('click', () => {
            if (this.state.freeformGroups.length === 0) {
                this.notifications.error('Voeg eerst tafels toe');
                return;
            }
            this.state.layouts.freeform = [];
            this.state.saveToStorage();
            this.seatingGenerator.render('freeform');
            this.notifications.success('Leerlingen herverdeeld');
        });
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
            if (name && position && position >= 1) {
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

        this.state.layouts = { '232': [], '222': [], '33': [], 'custom': [], 'freeform': [] };
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

    loadDemoNames() {
        const shuffled = [...DEMO_NAMES].sort(() => Math.random() - 0.5);
        const names = shuffled.slice(0, 28);
        document.getElementById('studentNames').value = names.join('\n');
        this.state.students = names;
        this.state.layouts = { '232': [], '222': [], '33': [], 'custom': [], 'freeform': [] };
        this.state.saveToStorage();
        this.notifications.success('Testlijst geladen');
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
    const tabManager = new TabManager(state, (activeTab) => {
        if (activeTab === 'freeform') {
            seatingGenerator.render('freeform');
        } else if (state.layouts[activeTab] && state.layouts[activeTab].length > 0) {
            seatingGenerator.render(activeTab);
        }
    });
    const listManager = new ListManager(state, notifications);
    const eventHandlers = new EventHandlers(state, notifications, seatingGenerator, tabManager, listManager);
    listManager.updateUI = function () {
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
    state.loadFromStorage(); // Always try to load, even if no previous state exists

    // Update list select dropdown with loaded saved lists
    listManager.updateListSelect();

    if (state.students.length > 0 || state.savedLists.size > 0 || state.freeformGroups.length > 0) {
        document.getElementById('studentNames').value = state.students.join('\n');
        document.getElementById('customRows').value = state.customLayoutConfig.rows;
        document.getElementById('customGroupSizes').value = state.customLayoutConfig.groupSizes.join(',');

        listManager.updateUI();

        tabManager.setActiveTab(state.activeTab);

        // Render layouts if there's data for them
        if (Object.values(state.layouts).some(l => l && l.length > 0)) {
            seatingGenerator.render();
        }

        notifications.success('Eerdere configuratie geladen');
    }
});
