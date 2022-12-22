const MAX_MESSAGES_NUMBER = 3;
const NOTIFICATIONS_TYPES = {
    'info':    'notification--info',
    'success': 'notification--success',
    'error':   'notification--error',
};

const messages = [];

/**
 * Prepare and return notifications container element.
 * @returns {HTMLElement}
 */
function getContainer () {
    let container = document.querySelector('[data-notifications-container]');

    if (!container) {
        container = document.createElement('div');

        container.classList.add('notifications-container');
        container.setAttribute('data-notifications-container', '');

        document.body.append(container);
    }

    return container;
}

/**
 * Add message and show it.
 * If message is an array, every item is treated as a new line.
 * @param {string|array} message
 * @param {string} type
 * @param {number} duration
 */
function addMessage (message, type, duration) {
    const notification = document.createElement('div');
    const container = getContainer();

    notification.classList.add('notification', NOTIFICATIONS_TYPES[type]);

    const content = document.createElement('div');
    content.classList.add('notification__content');

    message = Array.isArray(message) ? message : [message];

    message.forEach((paragraph) => {
        const line = document.createElement('p');

        line.innerText = paragraph;

        content.append(line);
    });

    notification.append(content);

    if (messages.length >= MAX_MESSAGES_NUMBER) {
        removeOldestMessage();
    }

    messages.push(notification);
    container.prepend(notification);

    const messageRemoveTimeout = setTimeout(() => removeMessage(notification), duration);

    notification.addEventListener('click', () => {
        clearTimeout(messageRemoveTimeout);

        removeMessage(notification);
    }, { once: true });
}

/**
 * Remove message from the list and container.
 * @param {HTMLElement} message
 */
function removeMessage (message) {
    messages.splice(messages.indexOf(message), 1);

    message.classList.add('hide');
    setTimeout(() => message.remove(), 300); // 300ms for visibility animation to complete
}

/**
 * Remove the oldest message.
 */
function removeOldestMessage () {
    const message = messages.shift();

    message && removeMessage(message);
}

export function pushNotification ({ message, type = 'info', duration = 3000 }) {
    addMessage(message, type, duration);
}
