// ═══════════════════════════════════════════════════════════
// SKILL DEVELOPMENT & CERTIFICATION SYSTEM - Core Module
// ═══════════════════════════════════════════════════════════

const API = '/api';
let currentUser = null;
let currentPage = 'home';

// ── API Helper ────────────────────────────────────────────
async function api(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    const res = await fetch(API + endpoint, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── Toast Notifications ──────────────────────────────────
function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Router ───────────────────────────────────────────────
function navigate(page, data = null) {
    currentPage = page;
    window._pageData = data;
    render();
}

function render() {
    const app = document.getElementById('app');
    if (!currentUser) {
        switch (currentPage) {
            case 'login': app.innerHTML = renderLogin(); break;
            case 'register': app.innerHTML = renderRegister(); break;
            case 'verify': app.innerHTML = renderVerifyPage(); break;
            default: app.innerHTML = renderHome(); break;
        }
    } else {
        if (currentPage === 'verify') {
            app.innerHTML = renderVerifyPage();
        } else {
            app.innerHTML = renderAppLayout();
            loadPageContent();
        }
    }
    bindEvents();
}

// ── Auth Functions ───────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await api('/auth/login', { method: 'POST', body: { email, password } });
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        toast('Welcome back, ' + currentUser.name + '!', 'success');
        navigate('dashboard');
    } catch (err) { toast(err.message, 'error'); }
}

async function handleRegister(e) {
    e.preventDefault();
    try {
        const body = {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            department: document.getElementById('reg-dept').value,
            password: document.getElementById('reg-password').value,
            role: document.querySelector('.role-btn.active')?.dataset.role || 'student'
        };
        await api('/auth/register', { method: 'POST', body });
        toast('Registration successful! Please login.', 'success');
        navigate('login');
    } catch (err) { toast(err.message, 'error'); }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    navigate('home');
    toast('Logged out successfully', 'info');
}

// ── Init ─────────────────────────────────────────────────
async function init() {
    // Check for direct verification URL (e.g. /verify?code=CERT-123 or from backend redirect /verify)
    const urlParams = new URLSearchParams(window.location.search);
    const verifyCode = urlParams.get('code');
    const isVerifyPath = window.location.pathname.startsWith('/verify');

    if (isVerifyPath || verifyCode) {
        navigate('verify', verifyCode);
        return;
    }

    const token = localStorage.getItem('token');
    if (token) {
        try {
            currentUser = await api('/profile');
            navigate('dashboard');
        } catch (e) {
            localStorage.removeItem('token');
            navigate('home');
        }
    } else {
        navigate('home');
    }
}

// ── Theme Management ──────────────────────────────────────
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    toast(`Switched to ${newTheme} mode`, 'info');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark as per "premium" feel
    applyTheme(savedTheme);
}

async function updateNotificationCount() {
    if (!currentUser) return;
    try {
        const notifs = await api('/notifications');
        const unreadCount = notifs.filter(n => !n.is_read).length;
        const badge = document.getElementById('notif-count');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    } catch (e) { console.error('Failed to update notifications', e); }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    initTheme();
    setInterval(updateNotificationCount, 10000); // Poll every 10s
});
