// Selectors
const toDoInput = document.querySelector('.todo-input'); // Input field for the to-do task
const dueDateInput = document.querySelector('.due-date-input'); // Input field for the due date of the to-do task
const toDoBtn = document.querySelector('.todo-btn'); // Button to add a new to-do task
const toDoList = document.querySelector('.todo-list'); // Container for the list of to-do tasks
const sortOptions = document.querySelector('#sort-options'); // Dropdown for sorting tasks
const standardTheme = document.querySelector('.standard-theme'); // Button to switch to standard theme
const lightTheme = document.querySelector('.light-theme'); // Button to switch to light theme
const darkerTheme = document.querySelector('.darker-theme'); // Button to switch to darker theme
const modal = document.querySelector('#myModal'); // Modal for displaying additional task details
const modalContent = document.querySelector('.modal-content'); // Content within the modal
const closeBtns = document.querySelectorAll('.close'); // Buttons to close modals
const notesTextarea = document.querySelector('.modal-content textarea'); // Textarea for task notes
const settingsBtn = document.querySelector('#settings-btn'); // Button to open settings modal
const settingsModal = document.querySelector('#settingsModal'); // Modal for settings
const saveSettingsBtn = document.querySelector('#saveSettingsBtn'); // Button to save settings
const phoneNumberInput = document.querySelector('#phoneNumber'); // Input field for phone number in settings
const smsOptInCheckbox = document.querySelector('#smsOptIn'); // Checkbox to opt-in for SMS notifications
let activeNoteTask = null; // Currently active task for notes

// Event listeners for settings
settingsBtn.addEventListener('click', openSettingsModal);
saveSettingsBtn.addEventListener('click', saveSettings);
closeBtns.forEach(closeBtn => closeBtn.addEventListener('click', closeModal));
window.addEventListener('click', outsideClick);

// Event listeners for initial setup and UI interactions
document.addEventListener('DOMContentLoaded', () => {
    toDoBtn.addEventListener('click', addToDo);
    toDoList.addEventListener('click', handleItemClick);
    sortOptions.addEventListener('change', () => sortTasks(sortOptions.value));
    standardTheme.addEventListener('click', () => changeTheme('standard'));
    lightTheme.addEventListener('click', () => changeTheme('light'));
    darkerTheme.addEventListener('click', () => changeTheme('darker'));
    getTodos();
    document.addEventListener('click', closeDropdowns);
    loadSettings();
});

let savedTheme = localStorage.getItem('savedTheme') || 'standard'; // Load saved theme or default to standard
changeTheme(savedTheme); // Apply the saved theme

// Create a button element with given HTML and class
function createButton(innerHTML, className) {
    const button = document.createElement('button');
    button.innerHTML = innerHTML;
    button.className = className;
    return button;
}

// Validate input for non-empty, non-whitespace
function isInputValid(input) {
    return input && input.trim().length > 0;
}

// Get index of task in the todo list by its text
function getTaskIndex(todos, taskText) {
    return todos.findIndex(todo => todo.task === taskText);
}

// Add a new to-do task
function addToDo(event) {
    event.preventDefault();
    console.log("Add to-do button clicked");

    if (!isInputValid(toDoInput.value)) {
        alert("You must write something!");
        return;
    }

    const dueDateValue = dueDateInput.value;
    if (!dueDateValue) {
        alert("You must select a due date!");
        return;
    }

    const toDoDiv = createTaskElement(toDoInput.value, false, dueDateValue);
    saveToLocalStorage(toDoInput.value, false, dueDateValue);
    toDoList.appendChild(toDoDiv);
    toDoInput.value = '';
    dueDateInput.value = '';

    // Check if the user opted in for SMS notifications
    const smsOptIn = localStorage.getItem('smsOptIn') === 'true';
    if (smsOptIn) {
        const userPhoneNumber = localStorage.getItem('phoneNumber');
        if (userPhoneNumber) {
            const taskDueDate = new Date(dueDateValue);
            const currentDate = new Date();
            const timeDifference = taskDueDate.getTime() - currentDate.getTime();
            const messageBody = `Reminder: You have a task due today: ${toDoInput.value}`;

            // Schedule the SMS to be sent on the due date
            setTimeout(() => {
                sendSMSNotification(userPhoneNumber, messageBody);
            }, timeDifference);
        }
    }
}

// Handle item clicks (delete, check, notes, edit, subtask, etc.)
function handleItemClick(event) {
    const item = event.target;
    const parentDiv = item.closest('.todo');
    console.log('Clicked item:', item);

    if (!parentDiv) return;

    if (item.classList.contains('delete-btn')) {
        console.log("Delete button clicked");
        parentDiv.remove();
        removeFromLocalStorage(parentDiv);
    }

    if (item.classList.contains('check-btn')) {
        console.log("Check button clicked");
        parentDiv.classList.toggle('completed');
        updateTaskInLocalStorage(parentDiv);
    }

    if (item.classList.contains('notes-btn')) {
        console.log("Notes button clicked");
        const taskText = parentDiv.querySelector('.todo-item').innerText;
        activeNoteTask = parentDiv;

        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        const taskIndex = getTaskIndex(todos, taskText);
        const notes = taskIndex !== -1 && todos[taskIndex].notes ? todos[taskIndex].notes : '';

        notesTextarea.value = notes;
        openModal();
        closeDropdown(parentDiv);
    }

    if (item.classList.contains('edit-btn')) {
        console.log("Edit button clicked");
        editTask(parentDiv);
        closeDropdown(parentDiv);
    }

    if (item.classList.contains('edit-due-date-btn')) {
        console.log("Edit due date button clicked");
        editDueDate(parentDiv);
        closeDropdown(parentDiv);
    }

    if (item.classList.contains('add-subtask-btn')) {
        console.log("Add subtask button clicked");
        addSubTask(parentDiv);
        closeDropdown(parentDiv);
    }

    if (item.classList.contains('dropdown-btn')) {
        console.log("Dropdown button clicked");
        const dropdownMenu = item.nextElementSibling;
        updateDropdownPosition(item, dropdownMenu); // Update position
        dropdownMenu.classList.toggle('show');
        closeOtherDropdowns(dropdownMenu);
        event.stopPropagation(); // Prevent event from bubbling up to closeDropdowns
    }

    if (item.classList.contains('subtask-delete-btn')) {
        console.log("Subtask delete button clicked");
        const subtaskItem = item.closest('.subtask-item');
        const taskText = parentDiv.querySelector('.todo-item').innerText;
        removeSubTaskFromLocalStorage(taskText, subtaskItem.querySelector('.subtask-item-text').innerText);
        subtaskItem.remove();
    }

    if (item.classList.contains('subtask-check-btn')) {
        console.log("Subtask check button clicked");
        const subtaskItem = item.closest('.subtask-item');
        subtaskItem.classList.toggle('completed');
        const taskText = parentDiv.querySelector('.todo-item').innerText;
        updateSubTaskInLocalStorage(taskText, subtaskItem.querySelector('.subtask-item-text').innerText, subtaskItem.classList.contains('completed'));
    }
}

// Update the dropdown menu position
function updateDropdownPosition(button, dropdownMenu) {
    const buttonRect = button.getBoundingClientRect();
    dropdownMenu.style.top = `${buttonRect.bottom}px`;
    dropdownMenu.style.left = `${buttonRect.left}px`;
    dropdownMenu.style.transform = `translateY(${window.scrollY}px)`;
}

// Close dropdowns if click outside
function closeDropdowns(event) {
    if (!event.target.classList.contains('dropdown-btn')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
            }
        });
    }
}

// Close other dropdown menus except the current one
function closeOtherDropdowns(currentDropdown) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== currentDropdown && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    });
}

// Close a specific dropdown menu
function closeDropdown(taskDiv) {
    const dropdownMenu = taskDiv.querySelector('.dropdown-menu');
    if (dropdownMenu && dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
    }
}

// Save a new task to local storage
function saveToLocalStorage(taskText, completed = false, dueDate = null, notes = '') {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.push({ task: taskText, completed, dueDate, notes, subtasks: [] });
    localStorage.setItem('todos', JSON.stringify(todos));
    console.log('Saved to local storage:', todos);
}

// Update task completion status and notes in local storage
function updateTaskInLocalStorage(taskDiv) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskText = taskDiv.querySelector('.todo-item').innerText;
    const taskIndex = getTaskIndex(todos, taskText);

    if (taskIndex !== -1) {
        todos[taskIndex].completed = taskDiv.classList.contains('completed');
        const notesElem = taskDiv.querySelector('.notepad');
        todos[taskIndex].notes = notesElem ? notesElem.value : '';
        localStorage.setItem('todos', JSON.stringify(todos));
        console.log('Updated local storage:', todos);
    }
}

// Remove a task from local storage
function removeFromLocalStorage(todo) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskText = todo.querySelector('.todo-item').innerText;
    todos = todos.filter(t => t.task !== taskText);
    localStorage.setItem('todos', JSON.stringify(todos));
    console.log('Removed from local storage:', todos);
}

// Load tasks from local storage and render them
function getTodos() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    console.log('Loaded todos from local storage:', todos);
    renderTasks(todos);
}

// Render tasks on the UI based on sorting options
function renderTasks(todos) {
    toDoList.innerHTML = ''; // Clear the list before rendering

    const sortOption = sortOptions.value;
    const now = new Date();

    todos.forEach(todo => {
        const dueDate = new Date(todo.dueDate);
        let shouldDisplay = true;

        switch (sortOption) {
            case 'today':
                shouldDisplay = dueDate.toDateString() === now.toDateString();
                break;
            case '7days':
                shouldDisplay = (dueDate - now) / (1000 * 60 * 60 * 24) <= 7;
                break;
            case '30days':
                shouldDisplay = (dueDate - now) / (1000 * 60 * 60 * 24) <= 30;
                break;
            case 'all':
            default:
                shouldDisplay = true;
                break;
        }

        if (shouldDisplay) {
            const toDoDiv = createTaskElement(todo.task, todo.completed, todo.dueDate, todo.notes);
            toDoList.appendChild(toDoDiv);
            renderSubTasks(toDoDiv, todo.subtasks);
        }
    });
}

// Save notes to local storage for a specific task
function saveNotesToLocalStorage(taskText, notes) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const index = getTaskIndex(todos, taskText);
    if (index !== -1) {
        todos[index].notes = notes;
        localStorage.setItem('todos', JSON.stringify(todos));
        console.log('Saved notes to local storage:', todos);
    }
}

// Create and return a task element
function createTaskElement(taskText, completed, dueDate, notes = '') {
    const toDoDiv = document.createElement("div");
    toDoDiv.classList.add('todo', `${savedTheme}-todo`);
    toDoDiv.style.position = 'relative';
    if (completed) {
        toDoDiv.classList.add('completed');
    }

    const newToDo = document.createElement('li');
    newToDo.innerText = taskText;
    newToDo.classList.add('todo-item');
    toDoDiv.appendChild(newToDo);

    if (dueDate) {
        const dueDateElem = document.createElement('span');
        dueDateElem.classList.add('due-date');
        dueDateElem.innerText = `Due: ${dueDate}`;
        toDoDiv.appendChild(dueDateElem);
    }

    const checked = createButton('<i class="fas fa-check"></i>', `check-btn ${savedTheme}-button`);
    toDoDiv.appendChild(checked);

    const deleted = createButton('<i class="fas fa-trash"></i>', `delete-btn ${savedTheme}-button`);
    toDoDiv.appendChild(deleted);

    const dropdownButton = createButton('<i class="fas fa-ellipsis-v"></i>', `dropdown-btn ${savedTheme}-button`);
    toDoDiv.appendChild(dropdownButton);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.classList.add('dropdown-menu', `${savedTheme}-dropdown-menu`);

    const addSubTaskBtn = createButton('<i class="fas fa-plus"></i> Sub-task', `add-subtask-btn ${savedTheme}-button`);
    dropdownMenu.appendChild(addSubTaskBtn);

    const notesBtn = createButton('<i class="fas fa-pencil-alt"></i> Description', `notes-btn ${savedTheme}-button`);
    dropdownMenu.appendChild(notesBtn);

    const editBtn = createButton('<i class="fas fa-edit"></i> Edit Task Name', `edit-btn ${savedTheme}-button`);
    dropdownMenu.appendChild(editBtn);

    const editDueDateBtn = createButton('<i class="fas fa-calendar-alt"></i> Edit Due Date', `edit-due-date-btn ${savedTheme}-button`);
    dropdownMenu.appendChild(editDueDateBtn);

    toDoDiv.appendChild(dropdownMenu);

    return toDoDiv;
}

// Change the theme and apply to all relevant elements
function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');

    document.body.className = color;

    document.querySelector('input').className = `${color}-input`;
    document.querySelectorAll('.todo').forEach(todo => {
        todo.className = `todo ${color}-todo ${todo.classList.contains('completed') ? 'completed' : ''}`;
    });
    document.querySelectorAll('button').forEach(button => {
        if (button.classList.contains('check-btn')) {
            button.className = `check-btn ${color}-button`;
        } else if (button.classList.contains('delete-btn')) {
            button.className = `delete-btn ${color}-button`;
        } else if (button.classList.contains('notes-btn')) {
            button.className = `notes-btn ${color}-button`;
        } else if (button.classList.contains('edit-btn')) {
            button.className = `edit-btn ${color}-button`;
        } else if (button.classList.contains('edit-due-date-btn')) {
            button.className = `edit-due-date-btn ${color}-button`;
        } else if (button.classList.contains('add-subtask-btn')) {
            button.className = `add-subtask-btn ${color}-button`;
        } else if (button.classList.contains('dropdown-btn')) {
            button.className = `dropdown-btn ${color}-button`;
        }
    });
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.className = `dropdown-menu ${color}-dropdown-menu`;
    });
    document.querySelectorAll('.subtask-item').forEach(subtask => {
        subtask.className = `subtask-item ${color}-todo ${subtask.classList.contains('completed') ? 'completed' : ''}`;
    });
}

// Open the modal
function openModal() {
    modal.style.display = 'flex';
}

// Close the modal and save notes if applicable
function closeModal(event) {
    const modalToClose = event.target.closest('.modal');
    if (modalToClose) {
        modalToClose.style.display = 'none';
    }
    if (activeNoteTask && modalToClose === modal) {
        const notes = notesTextarea.value;
        saveNotesToLocalStorage(activeNoteTask.querySelector('.todo-item').innerText, notes);
        activeNoteTask = null;
    }
}

// Close modal if click outside of it
function outsideClick(event) {
    if (event.target === modal || event.target === settingsModal) {
        event.target.style.display = 'none';
    }
}

// Edit task name
function editTask(taskDiv) {
    const taskTextElem = taskDiv.querySelector('.todo-item');
    const currentText = taskTextElem.innerText;

    const newTaskText = prompt("Edit your task:", currentText);
    if (newTaskText === null || newTaskText.trim() === "") {
        return;
    }

    taskTextElem.innerText = newTaskText;
    updateTaskTextInLocalStorage(currentText, newTaskText);
}

// Update task name in local storage
function updateTaskTextInLocalStorage(oldText, newText) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskIndex = getTaskIndex(todos, oldText);

    if (taskIndex !== -1) {
        todos[taskIndex].task = newText;
        localStorage.setItem('todos', JSON.stringify(todos));
    }
}

// Edit due date of the task
function editDueDate(taskDiv) {
    const dueDateElem = taskDiv.querySelector('.due-date');
    const currentDueDate = dueDateElem.innerText.split(': ')[1];

    const newDueDate = prompt("Edit your due date:", currentDueDate);
    if (newDueDate === null || newDueDate.trim() === "") {
        return;
    }

    dueDateElem.innerText = `Due: ${newDueDate}`;
    updateDueDateInLocalStorage(taskDiv.querySelector('.todo-item').innerText, newDueDate);
}

// Update due date in local storage
function updateDueDateInLocalStorage(taskText, newDueDate) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskIndex = getTaskIndex(todos, taskText);

    if (taskIndex !== -1) {
        todos[taskIndex].dueDate = newDueDate;
        localStorage.setItem('todos', JSON.stringify(todos));
    }
}

// Add a subtask to a task
function addSubTask(taskDiv) {
    const subTaskText = prompt("Enter your sub-task:");
    if (subTaskText === null || subTaskText.trim() === "") {
        return;
    }

    const taskText = taskDiv.querySelector('.todo-item').innerText;
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskIndex = getTaskIndex(todos, taskText);

    if (taskIndex !== -1) {
        todos[taskIndex].subtasks.push({ text: subTaskText, completed: false });
        localStorage.setItem('todos', JSON.stringify(todos));
        renderSubTasks(taskDiv, todos[taskIndex].subtasks);
        const dropdownButton = taskDiv.querySelector('.dropdown-btn');
        const dropdownMenu = taskDiv.querySelector('.dropdown-menu');
        updateDropdownPosition(dropdownButton, dropdownMenu); // Recalculate position after adding subtask
    }
}

// Render subtasks within a task
function renderSubTasks(taskDiv, subtasks) {
    let subTaskContainer = taskDiv.querySelector('.subtask-container');
    if (!subTaskContainer) {
        subTaskContainer = document.createElement("div");
        subTaskContainer.classList.add('subtask-container');
        taskDiv.appendChild(subTaskContainer);
    } else {
        subTaskContainer.innerHTML = ''; // Clear existing subtasks
    }

    subtasks.forEach(subtask => {
        if (!subtask.text) return; // Skip if subtask text is undefined

        const subTaskDiv = document.createElement("div");
        subTaskDiv.classList.add('subtask-item', `${savedTheme}-todo`);
        if (subtask.completed) {
            subTaskDiv.classList.add('completed');
        }

        const subTaskTextElem = document.createElement('li');
        subTaskTextElem.innerText = subtask.text;
        subTaskTextElem.classList.add('subtask-item-text');
        subTaskDiv.appendChild(subTaskTextElem);

        const subTaskChecked = createButton('<i class="fas fa-check"></i>', `subtask-check-btn ${savedTheme}-button`);
        subTaskDiv.appendChild(subTaskChecked);

        const subTaskDeleted = createButton('<i class="fas fa-trash"></i>', `subtask-delete-btn ${savedTheme}-button`);
        subTaskDiv.appendChild(subTaskDeleted);

        subTaskContainer.appendChild(subTaskDiv);
    });
}

// Update subtask completion status in local storage
function updateSubTaskInLocalStorage(taskText, subTaskText, completed) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskIndex = getTaskIndex(todos, taskText);

    if (taskIndex !== -1) {
        const subtaskIndex = todos[taskIndex].subtasks.findIndex(subtask => subtask.text === subTaskText);
        if (subtaskIndex !== -1) {
            todos[taskIndex].subtasks[subtaskIndex].completed = completed;
            localStorage.setItem('todos', JSON.stringify(todos));
            console.log('Updated subtask in local storage:', todos);
        }
    }
}

// Remove subtask from local storage
function removeSubTaskFromLocalStorage(taskText, subTaskText) {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    const taskIndex = getTaskIndex(todos, taskText);

    if (taskIndex !== -1) {
        todos[taskIndex].subtasks = todos[taskIndex].subtasks.filter(subtask => subtask.text !== subTaskText);
        localStorage.setItem('todos', JSON.stringify(todos));
        console.log('Removed subtask from local storage:', todos);
    }
}

// Sort tasks based on selected option and re-render them
function sortTasks(sortOption) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    renderTasks(todos);
}

// Open settings modal
function openSettingsModal() {
    settingsModal.style.display = 'flex';
}

// Save settings (phone number and SMS opt-in) to local storage
function saveSettings() {
    const phoneNumber = phoneNumberInput.value;
    const smsOptIn = smsOptInCheckbox.checked;

    localStorage.setItem('phoneNumber', phoneNumber);
    localStorage.setItem('smsOptIn', smsOptIn);

    alert('Settings saved!');
    settingsModal.style.display = 'none';
}

// Load settings from local storage and apply them
function loadSettings() {
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    const smsOptIn = localStorage.getItem('smsOptIn') === 'true';

    phoneNumberInput.value = phoneNumber;
    smsOptInCheckbox.checked = smsOptIn;
}

// Send SMS notification using a server endpoint
function sendSMSNotification(toNumber, messageBody) {
    fetch('/send-sms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: toNumber,
            body: messageBody
        })
    })
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}
