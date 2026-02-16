// Views
const homeView = document.getElementById('homeView');
const inboxView = document.getElementById('inboxView');
const sendView = document.getElementById('sendView');
const successView = document.getElementById('successView');

// Home View Elements
const usernameInput = document.getElementById('usernameInput');
const createBtn = document.getElementById('createBtn');

// Inbox View Elements
const currentUsernameEl = document.getElementById('currentUsername');
const shareLinkEl = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const copyBtnText = document.getElementById('copyBtnText');
const shareBtn = document.getElementById('shareBtn');
const logoutBtn = document.getElementById('logoutBtn');
const messagesContainer = document.getElementById('messagesContainer');
const unreadBadge = document.getElementById('unreadBadge');

// Send View Elements
const targetUsernameEl = document.getElementById('targetUsername');
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const sendBtn = document.getElementById('sendBtn');

// State
let currentUser = null;
let targetUser = null;
let messages = [];

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

function initApp() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('u');
    
    if (user) {
        // Send message mode
        targetUser = user;
        showView('send');
        targetUsernameEl.textContent = '@' + user;
    } else {
        // Check if user is logged in
        const savedUser = localStorage.getItem('lowkey_user');
        if (savedUser) {
            currentUser = savedUser;
            loadMessages();
            showView('inbox');
            updateInboxView();
        } else {
            showView('home');
        }
    }
}

function setupEventListeners() {
    // Home View
    createBtn.addEventListener('click', createProfile);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createProfile();
    });
    usernameInput.addEventListener('input', updateCreateButton);

    // Inbox View
    logoutBtn.addEventListener('click', logout);
    copyBtn.addEventListener('click', copyLink);
    shareBtn.addEventListener('click', shareLink);

    // Send View
    messageInput.addEventListener('input', updateCharCount);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('input', updateSendButton);
}

function showView(view) {
    homeView.classList.add('hidden');
    inboxView.classList.add('hidden');
    sendView.classList.add('hidden');
    successView.classList.add('hidden');

    if (view === 'home') {
        homeView.classList.remove('hidden');
    } else if (view === 'inbox') {
        inboxView.classList.remove('hidden');
    } else if (view === 'send') {
        sendView.classList.remove('hidden');
    } else if (view === 'success') {
        successView.classList.remove('hidden');
    }
}

// Home View Functions
function createProfile() {
    const username = usernameInput.value.trim();
    if (!username) return;

    // Clean username
    currentUser = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Save to localStorage
    localStorage.setItem('lowkey_user', currentUser);
    
    // Initialize user data
    const userData = {
        username: currentUser,
        created: Date.now()
    };
    localStorage.setItem(`lowkey_user_${currentUser}`, JSON.stringify(userData));
    
    // Show inbox
    messages = [];
    showView('inbox');
    updateInboxView();
}

function updateCreateButton() {
    createBtn.disabled = !usernameInput.value.trim();
}

// Inbox View Functions
function updateInboxView() {
    currentUsernameEl.textContent = '@' + currentUser;
    
    const link = window.location.origin + window.location.pathname + '?u=' + currentUser;
    shareLinkEl.textContent = link;
    
    renderMessages();
    updateUnreadBadge();
}

function loadMessages() {
    const savedMessages = localStorage.getItem(`lowkey_messages_${currentUser}`);
    if (savedMessages) {
        messages = JSON.parse(savedMessages);
    } else {
        messages = [];
    }
}

function saveMessages() {
    localStorage.setItem(`lowkey_messages_${currentUser}`, JSON.stringify(messages));
}

function renderMessages() {
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <p class="empty-text">no messages yet</p>
                <p class="empty-subtext">share your link to start receiving!</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message-card ${!msg.read ? 'unread' : ''}" onclick="markAsRead('${msg.id}')">
            <div class="message-content">
                <div class="message-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </div>
                <div class="message-body">
                    <p class="message-text">${escapeHtml(msg.text)}</p>
                    <div class="message-meta">
                        <span class="message-time">${formatTime(msg.timestamp)}</span>
                        ${!msg.read ? '<span class="new-badge">new</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function markAsRead(msgId) {
    const message = messages.find(m => m.id === msgId);
    if (message && !message.read) {
        message.read = true;
        saveMessages();
        renderMessages();
        updateUnreadBadge();
    }
}

function updateUnreadBadge() {
    const unreadCount = messages.filter(m => !m.read).length;
    if (unreadCount > 0) {
        unreadBadge.textContent = `${unreadCount} new`;
        unreadBadge.classList.remove('hidden');
    } else {
        unreadBadge.classList.add('hidden');
    }
}

function copyLink() {
    const link = window.location.origin + window.location.pathname + '?u=' + currentUser;
    navigator.clipboard.writeText(link).then(() => {
        const originalIcon = copyBtn.querySelector('svg').outerHTML;
        copyBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            copied!
        `;
        
        setTimeout(() => {
            copyBtn.innerHTML = `
                ${originalIcon}
                <span>copy</span>
            `;
        }, 2000);
    });
}

async function shareLink() {
    const link = window.location.origin + window.location.pathname + '?u=' + currentUser;
    const text = `send me anonymous messages! 👀\n${link}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ text });
        } catch (e) {
            copyLink();
        }
    } else {
        copyLink();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('lowkey_user');
        currentUser = null;
        messages = [];
        showView('home');
        usernameInput.value = '';
    }
}

// Send View Functions
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count}/300`;
    updateSendButton();
}

function updateSendButton() {
    sendBtn.disabled = !messageInput.value.trim();
}

function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText || !targetUser) return;

    const newMessage = {
        id: Date.now().toString(),
        text: messageText,
        timestamp: Date.now(),
        read: false
    };

    // Get existing messages for target user
    const existingMessages = localStorage.getItem(`lowkey_messages_${targetUser}`);
    let targetMessages = existingMessages ? JSON.parse(existingMessages) : [];
    
    // Add new message to the beginning
    targetMessages.unshift(newMessage);
    
    // Save messages
    localStorage.setItem(`lowkey_messages_${targetUser}`, JSON.stringify(targetMessages));
    
    // Show success
    messageInput.value = '';
    showView('success');
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
    }, 2000);
}

// Utility Functions
function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
