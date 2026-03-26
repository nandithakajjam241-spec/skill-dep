// ═══════════════════════════════════════════════════════════
// APP LAYOUT + SIDEBAR + NAV
// ═══════════════════════════════════════════════════════════

function renderAppLayout() {
  const navItems = getNavItems();
  return `
  <div class="app-layout">
    <aside class="sidebar animate-in" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo"><img src="/logo.jpeg" alt="Skillzy Logo"></div>
        <div><div class="sidebar-title">Skillzy</div><div class="sidebar-role">${currentUser.role}</div></div>
      </div>
      <nav class="sidebar-nav">
        ${navItems.map(section => `
          <div class="nav-section">
            <div class="nav-section-title">${section.title}</div>
            ${section.items.map(item => `
              <button class="nav-link ${currentPage === item.page ? 'active' : ''}" onclick="navigate('${item.page}')">
                <span class="nav-icon">${item.icon}</span> ${item.label}
              </button>
            `).join('')}
          </div>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-link" onclick="logout()"><span class="nav-icon">🚪</span> Logout</button>
      </div>
    </aside>
    <div class="main-content animate-in">
      <div class="top-bar">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
          <div class="top-bar-title"><h2 id="page-title">Dashboard</h2><p id="page-subtitle">Welcome back</p></div>
        </div>
        <div class="top-bar-actions">
          <button class="btn-icon theme-toggle" onclick="toggleTheme()" title="Toggle Dark/Light Mode" id="theme-toggle-btn">☀️</button>
          <div class="notif-badge"><button class="btn-icon" onclick="navigate('notifications')">🔔</button><span class="count" id="notif-count" style="display:none">0</span></div>
          <div class="user-menu" onclick="navigate('profile')">
            <div class="user-avatar">${currentUser.name.charAt(0)}</div>
            <div class="user-info"><div class="user-name">${currentUser.name}</div><div class="user-role">${currentUser.role}</div></div>
          </div>
        </div>
      </div>
      <div class="page-content" id="page-content"><div class="spinner"></div></div>
    </div>
  </div>`;
}

function getNavItems() {
  if (currentUser.role === 'student') return [
    {
      title: 'Main', items: [
        { icon: '📊', label: 'Dashboard', page: 'dashboard' },
        { icon: '🔔', label: 'Notifications', page: 'notifications' },
      ]
    },
    {
      title: 'Learning', items: [
        { icon: '🎯', label: 'Browse Skills', page: 'skills' },
        { icon: '📚', label: 'My Courses', page: 'enrollments' },
        { icon: '📈', label: 'Progress', page: 'progress' },
        { icon: '📜', label: 'Certificates', page: 'certificates' },
        { icon: '🤖', label: 'AI Career Path', page: 'ai-analyzer' },
      ]
    },
    {
      title: 'Account', items: [
        { icon: '👤', label: 'Profile', page: 'profile' },
      ]
    },
  ];
  if (currentUser.role === 'trainer') return [
    {
      title: 'Main', items: [
        { icon: '📋', label: 'Dashboard', page: 'dashboard' },
        { icon: '🔔', label: 'Notifications', page: 'notifications' },
      ]
    },
    {
      title: 'Management', items: [
        { icon: '📝', label: 'My Courses', page: 'trainer-courses' },
      ]
    },
    {
      title: 'Account', items: [
        { icon: '👤', label: 'Profile', page: 'profile' },
      ]
    },
  ];
  return [
    {
      title: 'Main', items: [
        { icon: '⚙️', label: 'Dashboard', page: 'dashboard' },
      ]
    },
    {
      title: 'Management', items: [
        { icon: '🗂️', label: 'Manage Skills', page: 'admin-skills' },
        { icon: '👥', label: 'Manage Users', page: 'admin-users' },
        { icon: '📊', label: 'Reports', page: 'admin-reports' },
      ]
    },
    {
      title: 'Account', items: [
        { icon: '👤', label: 'Profile', page: 'profile' },
      ]
    },
  ];
}

async function loadPageContent() {
  const container = document.getElementById('page-content');
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');
  try {
    switch (currentPage) {
      case 'dashboard':
        if (currentUser.role === 'student') await renderStudentDashboard(container, titleEl, subEl);
        else if (currentUser.role === 'trainer') await renderTrainerDashboard(container, titleEl, subEl);
        else await renderAdminDashboard(container, titleEl, subEl);
        break;
      case 'skills': await renderSkillsPage(container, titleEl, subEl); break;
      case 'skill-detail': await renderSkillDetail(container, titleEl, subEl); break;
      case 'enrollments': await renderEnrollments(container, titleEl, subEl); break;
      case 'progress': await renderProgress(container, titleEl, subEl); break;
      case 'certificates': await renderCertificates(container, titleEl, subEl); break;
      case 'notifications': await renderNotifications(container, titleEl, subEl); break;
      case 'profile': await renderProfile(container, titleEl, subEl); break;
      case 'assessment': await renderAssessment(container, titleEl, subEl); break;
      case 'video-lesson': await renderVideoLesson(container, titleEl, subEl); break;
      case 'ai-analyzer': await renderAIAnalyzer(container, titleEl, subEl); break;
      case 'trainer-courses': await renderTrainerCourses(container, titleEl, subEl); break;
      case 'trainer-quiz': await renderTrainerQuizManager(container, titleEl, subEl); break;
      case 'course-students': await renderCourseStudents(container, titleEl, subEl); break;
      case 'admin-skills': await renderAdminSkills(container, titleEl, subEl); break;
      case 'admin-users': await renderAdminUsers(container, titleEl, subEl); break;
      case 'admin-reports': await renderAdminReports(container, titleEl, subEl); break;
      default: container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Page not found</h3></div>';
    }
  } catch (err) { container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`; }
  loadNotifCount();
}

async function loadNotifCount() {
  try {
    const notifs = await api('/notifications');
    const unread = notifs.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
  } catch (e) { }
}

function bindEvents() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const regForm = document.getElementById('register-form');
  if (regForm) regForm.addEventListener('submit', handleRegister);
}
