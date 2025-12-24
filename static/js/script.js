/**
 * Family Calendar - Frontend JavaScript
 * ======================================
 * Handles calendar rendering, event management, and API communication
 */

// ===================
// State Management
// ===================

// Application state
const state = {
    currentUser: null,          // Currently logged-in user
    users: [],                  // All family members
    events: [],                 // Events for current month
    allEvents: [],              // All events (for localStorage)
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),  // 0-indexed
    selectedDate: null,         // Date selected for new event
    savedTitles: [],            // Saved titles for current user (suggestions)
};

// localStorage keys
const STORAGE_KEYS = {
    EVENTS: 'family_calendar_events',
    CURRENT_USER: 'family_calendar_current_user',
};

// Month names for display
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// ===================
// localStorage Functions
// ===================

/**
 * Save all events to localStorage
 */
function saveEventsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(state.allEvents));
    } catch (error) {
        console.error('Failed to save events to localStorage:', error);
    }
}

/**
 * Load all events from localStorage
 * @returns {Array} - Array of events or empty array
 */
function loadEventsFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load events from localStorage:', error);
        return [];
    }
}

/**
 * Save current user to localStorage
 */
function saveCurrentUserToStorage() {
    try {
        if (state.currentUser) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
    } catch (error) {
        console.error('Failed to save current user to localStorage:', error);
    }
}

/**
 * Load current user from localStorage
 * @returns {object|null} - User object or null
 */
function loadCurrentUserFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load current user from localStorage:', error);
        return null;
    }
}

/**
 * Get next available event ID for localStorage events
 * @returns {number} - Next ID
 */
function getNextEventId() {
    if (state.allEvents.length === 0) return 1;
    const maxId = Math.max(...state.allEvents.map(e => e.id || 0));
    return maxId + 1;
}

/**
 * Filter events for a specific month from allEvents
 * @param {number} year - Year
 * @param {number} month - Month (0-indexed)
 * @returns {Array} - Filtered events
 */
function filterEventsForMonth(year, month) {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    let endDate;
    if (month === 11) {
        endDate = `${year + 1}-01-01`;
    } else {
        endDate = `${year}-${String(month + 2).padStart(2, '0')}-01`;
    }

    return state.allEvents.filter(event =>
        event.date >= startDate && event.date < endDate
    ).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.start_time || '').localeCompare(b.start_time || '');
    });
}

// ===================
// DOM Elements
// ===================

const elements = {
    // Login section
    loginSection: document.getElementById('login-section'),
    userInfo: document.getElementById('user-info'),
    userSelect: document.getElementById('user-select'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userNameDisplay: document.getElementById('user-name-display'),

    // Calendar
    calendarGrid: document.getElementById('calendar-grid'),
    currentMonthYear: document.getElementById('current-month-year'),
    prevMonthBtn: document.getElementById('prev-month'),
    nextMonthBtn: document.getElementById('next-month'),

    // Legend
    legend: document.getElementById('legend'),

    // Add event button
    addEventBtn: document.getElementById('add-event-btn'),

    // Event modal
    eventModal: document.getElementById('event-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModal: document.getElementById('close-modal'),
    eventForm: document.getElementById('event-form'),
    eventId: document.getElementById('event-id'),
    eventTitle: document.getElementById('event-title'),
    eventDate: document.getElementById('event-date'),
    eventStartTime: document.getElementById('event-start-time'),
    eventEndTime: document.getElementById('event-end-time'),
    titleSuggestions: document.getElementById('title-suggestions'),
    deleteEventBtn: document.getElementById('delete-event-btn'),
    cancelBtn: document.getElementById('cancel-btn'),

    // Day events modal
    dayEventsModal: document.getElementById('day-events-modal'),
    dayEventsTitle: document.getElementById('day-events-title'),
    dayEventsList: document.getElementById('day-events-list'),
    closeDayModal: document.getElementById('close-day-modal'),
    addEventDayBtn: document.getElementById('add-event-day-btn'),
};

// ===================
// API Functions
// ===================

/**
 * Make an API request
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Response data
 */
async function api(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

/**
 * Get all family members
 */
async function fetchUsers() {
    state.users = await api('/api/users');
    return state.users;
}

/**
 * Get current logged-in user
 */
async function fetchCurrentUser() {
    const data = await api('/api/current-user');
    state.currentUser = data.user;
    return state.currentUser;
}

/**
 * Log in as a user
 */
async function login(userId) {
    const data = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
    });
    state.currentUser = data.user;
    return data.user;
}

/**
 * Log out
 */
async function logout() {
    await api('/api/logout', { method: 'POST' });
    state.currentUser = null;
}

/**
 * Get events for a specific month (from localStorage)
 */
async function fetchEvents(year, month) {
    // Filter events for the requested month from allEvents
    state.events = filterEventsForMonth(year, month);
    return state.events;
}

/**
 * Create a new event (saves to localStorage)
 */
async function createEvent(eventData) {
    // Find the user info for the event
    const user = state.users.find(u => u.id === eventData.user_id);

    // Create new event with generated ID
    const newEvent = {
        id: getNextEventId(),
        title: eventData.title,
        date: eventData.date,
        start_time: eventData.start_time || null,
        end_time: eventData.end_time || null,
        user_id: eventData.user_id,
        user_name: user ? user.name : 'Unknown',
        user_color: user ? user.color : '#888888',
        created_at: new Date().toISOString(),
    };

    // Add to allEvents and save to localStorage
    state.allEvents.push(newEvent);
    saveEventsToStorage();

    return newEvent;
}

/**
 * Update an event
 */
async function updateEvent(eventId, eventData) {
    return await api(`/api/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
    });
}

/**
 * Delete an event
 */
async function deleteEvent(eventId) {
    return await api(`/api/events/${eventId}`, {
        method: 'DELETE',
    });
}

/**
 * Fetch saved titles for the current user (for suggestions)
 */
async function fetchSavedTitles() {
    try {
        const data = await api('/api/saved-titles');
        state.savedTitles = data.titles || [];
        return state.savedTitles;
    } catch (error) {
        state.savedTitles = [];
        return [];
    }
}

// ===================
// UI Rendering
// ===================

/**
 * Update the login/user display based on state
 */
function renderUserSection() {
    if (state.currentUser) {
        // Show logged-in state
        elements.loginSection.classList.add('hidden');
        elements.userInfo.classList.remove('hidden');
        elements.addEventBtn.classList.remove('hidden');

        // Set user name with color indicator
        elements.userNameDisplay.textContent = state.currentUser.name;
        elements.userNameDisplay.style.borderLeft = `4px solid ${state.currentUser.color}`;
    } else {
        // Show login state
        elements.loginSection.classList.remove('hidden');
        elements.userInfo.classList.add('hidden');
        elements.addEventBtn.classList.add('hidden');
    }
}

/**
 * Populate the user select dropdown
 */
function renderUserSelect() {
    // Login dropdown
    elements.userSelect.innerHTML = '<option value="">Select Family Member</option>';
    state.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        elements.userSelect.appendChild(option);
    });
}

/**
 * Render the family member legend
 */
function renderLegend() {
    elements.legend.innerHTML = '';
    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-color" style="background-color: ${user.color}"></span>
            <span>${user.name}</span>
        `;
        elements.legend.appendChild(item);
    });
}

/**
 * Render title suggestions for the event form
 */
function renderTitleSuggestions() {
    elements.titleSuggestions.innerHTML = '';

    if (state.savedTitles.length === 0) {
        elements.titleSuggestions.classList.add('hidden');
        return;
    }

    // Create suggestion chips
    state.savedTitles.forEach(title => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'suggestion-chip';
        chip.innerHTML = `${escapeHtml(title)} <span class="chip-label">前回使用済み</span>`;
        chip.addEventListener('click', () => {
            elements.eventTitle.value = title;
            elements.titleSuggestions.classList.add('hidden');
        });
        elements.titleSuggestions.appendChild(chip);
    });

    elements.titleSuggestions.classList.remove('hidden');
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of the month (0 = Sunday)
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Format a date as YYYY-MM-DD
 */
function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Format time for display (12-hour format)
 */
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Check if a date is today
 */
function isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day;
}

/**
 * Get events for a specific date
 */
function getEventsForDate(dateStr) {
    return state.events.filter(event => event.date === dateStr);
}

/**
 * Render the calendar grid
 */
function renderCalendar() {
    // Update month/year display
    elements.currentMonthYear.textContent =
        `${MONTH_NAMES[state.currentMonth]} ${state.currentYear}`;

    // Clear grid
    elements.calendarGrid.innerHTML = '';

    const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
    const firstDay = getFirstDayOfMonth(state.currentYear, state.currentMonth);

    // Previous month days
    const prevMonth = state.currentMonth === 0 ? 11 : state.currentMonth - 1;
    const prevYear = state.currentMonth === 0 ? state.currentYear - 1 : state.currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(prevYear, prevMonth, day, true);
        elements.calendarGrid.appendChild(dayEl);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createDayElement(state.currentYear, state.currentMonth, day, false);
        elements.calendarGrid.appendChild(dayEl);
    }

    // Add next month's leading days
    const totalCells = elements.calendarGrid.children.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const nextMonth = state.currentMonth === 11 ? 0 : state.currentMonth + 1;
    const nextYear = state.currentMonth === 11 ? state.currentYear + 1 : state.currentYear;

    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(nextYear, nextMonth, day, true);
        elements.calendarGrid.appendChild(dayEl);
    }
}

/**
 * Create a day element for the calendar
 */
function createDayElement(year, month, day, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }

    if (isToday(year, month, day)) {
        dayEl.classList.add('today');
    }

    const dateStr = formatDate(year, month, day);
    dayEl.dataset.date = dateStr;

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);

    // Events for this day
    const dayEvents = getEventsForDate(dateStr);
    if (dayEvents.length > 0) {
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';

        // Show up to 3 events, then "more"
        const maxDisplay = 3;
        dayEvents.slice(0, maxDisplay).forEach(event => {
            const pill = document.createElement('div');
            pill.className = 'event-pill';
            pill.style.backgroundColor = event.user_color;
            // Format: "7:30 PM – 10:00 PM バイト" or "7:30 PM バイト" or just title
            let displayText = '';
            if (event.start_time && event.end_time) {
                displayText = `${formatTime(event.start_time)} – ${formatTime(event.end_time)} ${event.title}`;
            } else if (event.start_time) {
                displayText = `${formatTime(event.start_time)} ${event.title}`;
            } else {
                displayText = event.title;
            }
            pill.textContent = displayText;
            pill.title = `${event.title} (${event.user_name})`;
            eventsContainer.appendChild(pill);
        });

        if (dayEvents.length > maxDisplay) {
            const more = document.createElement('div');
            more.className = 'more-events';
            more.textContent = `+${dayEvents.length - maxDisplay} more`;
            eventsContainer.appendChild(more);
        }

        dayEl.appendChild(eventsContainer);
    }

    // Click handler to show events or add new event
    dayEl.addEventListener('click', () => handleDayClick(dateStr, dayEvents));

    return dayEl;
}

/**
 * Handle clicking on a day
 */
function handleDayClick(dateStr, events) {
    state.selectedDate = dateStr;

    if (events.length > 0) {
        // Show day events modal
        showDayEventsModal(dateStr, events);
    } else if (state.currentUser) {
        // Open add event modal directly
        openEventModal(null, dateStr);
    } else {
        alert('Please log in to add events.');
    }
}

/**
 * Show modal with events for a specific day
 */
function showDayEventsModal(dateStr, events) {
    const date = new Date(dateStr + 'T00:00:00');
    elements.dayEventsTitle.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    elements.dayEventsList.innerHTML = '';

    if (events.length === 0) {
        elements.dayEventsList.innerHTML = '<p class="no-events">No events this day</p>';
    } else {
        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            // Format time display: "7:30 PM – 10:00 PM" or "7:30 PM"
            let timeDisplay = '';
            if (event.start_time && event.end_time) {
                timeDisplay = `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`;
            } else if (event.start_time) {
                timeDisplay = formatTime(event.start_time);
            }
            // Check if current user can edit this event
            const canEdit = state.currentUser && state.currentUser.id === event.user_id;
            item.innerHTML = `
                <div class="event-color-bar" style="background-color: ${event.user_color}"></div>
                <div class="event-details">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-meta">
                        ${timeDisplay ? timeDisplay + ' • ' : ''}${escapeHtml(event.user_name)}
                    </div>
                </div>
            `;
            // Only allow editing own events
            if (canEdit) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    closeDayEventsModal();
                    openEventModal(event);
                });
            } else {
                item.style.cursor = 'default';
            }
            elements.dayEventsList.appendChild(item);
        });
    }

    // Show/hide add button based on login state
    if (state.currentUser) {
        elements.addEventDayBtn.classList.remove('hidden');
    } else {
        elements.addEventDayBtn.classList.add('hidden');
    }

    elements.dayEventsModal.classList.remove('hidden');
}

/**
 * Close day events modal
 */
function closeDayEventsModal() {
    elements.dayEventsModal.classList.add('hidden');
}

/**
 * Open event modal for adding or editing
 */
async function openEventModal(event = null, date = null) {
    if (!state.currentUser) {
        alert('Please log in to add or edit events.');
        return;
    }

    // Reset form
    elements.eventForm.reset();
    elements.eventId.value = '';

    if (event) {
        // Edit mode
        elements.modalTitle.textContent = 'Edit Event';
        elements.eventId.value = event.id;
        elements.eventTitle.value = event.title;
        elements.eventDate.value = event.date;
        elements.eventStartTime.value = event.start_time || '';
        elements.eventEndTime.value = event.end_time || '';
        elements.deleteEventBtn.classList.remove('hidden');
        // Hide suggestions in edit mode
        elements.titleSuggestions.classList.add('hidden');
    } else {
        // Add mode
        elements.modalTitle.textContent = 'Add Event';
        elements.eventDate.value = date || formatDate(
            state.currentYear,
            state.currentMonth,
            new Date().getDate()
        );
        elements.deleteEventBtn.classList.add('hidden');
        // Fetch and show title suggestions
        await fetchSavedTitles();
        renderTitleSuggestions();
    }

    elements.eventModal.classList.remove('hidden');
    elements.eventTitle.focus();
}

/**
 * Close event modal
 */
function closeEventModal() {
    elements.eventModal.classList.add('hidden');
}

/**
 * Handle event form submission
 */
async function handleEventSubmit(e) {
    e.preventDefault();

    const eventData = {
        title: elements.eventTitle.value.trim(),
        date: elements.eventDate.value,
        start_time: elements.eventStartTime.value || null,
        end_time: elements.eventEndTime.value || null,
        user_id: state.currentUser.id,  // Always use logged-in user
    };

    try {
        const eventId = elements.eventId.value;

        if (eventId) {
            // Update existing event
            await updateEvent(eventId, eventData);
        } else {
            // Create new event
            await createEvent(eventData);
        }

        // Refresh calendar
        await fetchEvents(state.currentYear, state.currentMonth);
        renderCalendar();
        closeEventModal();
    } catch (error) {
        alert('Error saving event: ' + error.message);
    }
}

/**
 * Handle event deletion
 */
async function handleEventDelete() {
    const eventId = elements.eventId.value;
    if (!eventId) return;

    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        await deleteEvent(eventId);
        await fetchEvents(state.currentYear, state.currentMonth);
        renderCalendar();
        closeEventModal();
    } catch (error) {
        alert('Error deleting event: ' + error.message);
    }
}

/**
 * Navigate to previous month
 */
function goToPrevMonth() {
    if (state.currentMonth === 0) {
        state.currentMonth = 11;
        state.currentYear--;
    } else {
        state.currentMonth--;
    }
    refreshCalendar();
}

/**
 * Navigate to next month
 */
function goToNextMonth() {
    if (state.currentMonth === 11) {
        state.currentMonth = 0;
        state.currentYear++;
    } else {
        state.currentMonth++;
    }
    refreshCalendar();
}

/**
 * Refresh calendar with new events
 */
async function refreshCalendar() {
    await fetchEvents(state.currentYear, state.currentMonth);
    renderCalendar();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================
// Event Listeners
// ===================

function setupEventListeners() {
    // Login button
    elements.loginBtn.addEventListener('click', async () => {
        const userId = elements.userSelect.value;
        if (!userId) {
            alert('Please select a family member');
            return;
        }

        try {
            await login(parseInt(userId));
            renderUserSection();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    // Logout button
    elements.logoutBtn.addEventListener('click', async () => {
        await logout();
        state.savedTitles = [];  // Clear saved titles on logout
        renderUserSection();
    });

    // Month navigation
    elements.prevMonthBtn.addEventListener('click', goToPrevMonth);
    elements.nextMonthBtn.addEventListener('click', goToNextMonth);

    // Add event button (floating)
    elements.addEventBtn.addEventListener('click', () => {
        openEventModal(null, formatDate(
            state.currentYear,
            state.currentMonth,
            new Date().getDate()
        ));
    });

    // Event modal
    elements.closeModal.addEventListener('click', closeEventModal);
    elements.cancelBtn.addEventListener('click', closeEventModal);
    elements.eventForm.addEventListener('submit', handleEventSubmit);
    elements.deleteEventBtn.addEventListener('click', handleEventDelete);

    // Day events modal
    elements.closeDayModal.addEventListener('click', closeDayEventsModal);
    elements.addEventDayBtn.addEventListener('click', () => {
        closeDayEventsModal();
        openEventModal(null, state.selectedDate);
    });

    // Close modals on outside click
    elements.eventModal.addEventListener('click', (e) => {
        if (e.target === elements.eventModal) {
            closeEventModal();
        }
    });

    elements.dayEventsModal.addEventListener('click', (e) => {
        if (e.target === elements.dayEventsModal) {
            closeDayEventsModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEventModal();
            closeDayEventsModal();
        }
    });
}

// ===================
// Initialization
// ===================

async function init() {
    try {
        // Fetch initial data
        await fetchUsers();
        await fetchCurrentUser();

        // Render UI
        renderUserSelect();
        renderLegend();
        renderUserSection();

        // Fetch events and render calendar
        await fetchEvents(state.currentYear, state.currentMonth);
        renderCalendar();

        // Setup event listeners
        setupEventListeners();

        console.log('Family Calendar initialized successfully');
    } catch (error) {
        console.error('Failed to initialize:', error);
        alert('Failed to load the calendar. Please refresh the page.');
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
