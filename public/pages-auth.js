// ═══════════════════════════════════════════════════════════
// PAGES - Home, Login, Register
// ═══════════════════════════════════════════════════════════

function renderHome() {
  // Add scroll listener for sticky nav
  setTimeout(() => {
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.landing-nav');
      if (nav) {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      }
    });
  }, 100);

  return `
  <div class="home-page">
    <nav class="landing-nav">
      <div class="nav-logo" onclick="navigate('home')">
        <img src="/logo.jpeg" alt="Skillzy Logo">
        <span>Skillzy</span>
      </div>
      <div class="nav-links">
        <span class="nav-item" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Features</span>
        <button class="btn btn-secondary btn-sm" onclick="navigate('login')">Sign In</button>
        <button class="btn btn-primary btn-sm" onclick="navigate('register')">Get Started</button>
      </div>
    </nav>

    <div class="hero">
      <div class="hero-visual">
        <div class="blob"></div>
        <div class="blob"></div>
      </div>
      <div class="hero-content animate-in">
        <div class="hero-badge">🚀 Transform Your Career Today</div>
        <h1>Master New Skills. <br>Earn Your Future.</h1>
        <p>Unlock your potential with our industry-led specialized training. Join 10,000+ students mastering the tech of tomorrow.</p>
        <div class="hero-buttons">
          <button class="btn btn-primary btn-lg" onclick="navigate('register')">Start Your Journey</button>
          <button class="btn btn-secondary btn-lg" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">Explore Features</button>
        </div>
      </div>
    </div>

    <div class="features" id="features">
      <div class="text-center mb-32">
        <h2 class="animate-up">Why Choose Skillzy?</h2>
        <p class="animate-up delay-1">Everything you need to advance your career in one premium platform</p>
      </div>
      <div class="features-grid">
        <div class="feature-card animate-up delay-1">
          <div class="feature-icon">📚</div>
          <h3>Expert-Led Courses</h3>
          <p>Learn from industry veterans like Pranay, Mahesh, and Malathi with structured, real-world curricula.</p>
        </div>
        <div class="feature-card animate-up delay-2">
          <div class="feature-icon">📜</div>
          <h3>Verified Certificates</h3>
          <p>Get recognized with industry-standard certificates that you can share with employers immediately.</p>
        </div>
        <div class="feature-card animate-up delay-3">
          <div class="feature-icon">📊</div>
          <h3>Smart Progress</h3>
          <p>Track your learning pace with our advanced analytics dashboard and never lose track of your goals.</p>
        </div>
        <div class="feature-card animate-up delay-4">
          <div class="feature-icon">🤖</div>
          <h3>AI Career Path</h3>
          <p>Let our AI analyze your skill gaps and recommend the perfect path to your dream job.</p>
        </div>
      </div>
    </div>

    <footer style="padding: 60px 20px; background: var(--bg-surface); border-top: 1px solid var(--border); text-align: center;">
      <div class="nav-logo" style="justify-content: center; margin-bottom: 24px;">
        <img src="/logo.jpeg" alt="Skillzy Logo">
        <span>Skillzy</span>
      </div>
      <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 32px;">The world's leading platform for skill development and professional certification.</p>
      <div style="display: flex; justify-content: center; gap: 24px; color: var(--text-muted); font-size: 0.9rem;">
        <span>© 2026 Skillzy Inc.</span>
        <a href="#" style="color: inherit;">Privacy Policy</a>
        <a href="#" style="color: inherit;">Terms of Service</a>
      </div>
    </footer>
  </div>`;
}

function renderLogin() {
  return `
  <div class="auth-page">
    <div class="auth-card animate-in">
      <div class="auth-logo"><img src="/logo.jpeg" alt="Skillzy Logo"></div>
      <h1>Welcome Back</h1>
      <p class="auth-subtitle">Sign in to continue your learning journey</p>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="login-email" class="form-input" placeholder="Enter your email" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Sign In</button>
      </form>
      <p class="auth-footer">Don't have an account? <a href="#" onclick="navigate('register')">Register here</a></p>
      <p class="auth-footer" style="margin-top:12px;font-size:.8rem;color:var(--text-muted)">
        Demo: admin@system.com | rajesh@system.com | ananya@student.com (pwd: password123)
      </p>
      <p class="auth-footer"><a href="#" onclick="navigate('home')">← Back to Home</a></p>
    </div>
  </div>`;
}

function renderRegister() {
  return `
  <div class="auth-page">
    <div class="auth-card animate-in">
      <div class="auth-logo"><img src="/logo.jpeg" alt="Skillzy Logo"></div>
      <h1>Create Account</h1>
      <p class="auth-subtitle">Join Skillzy and start learning today</p>
      <form id="register-form">
        <label class="form-label">Select Your Role</label>
        <div class="role-selector">
          <div class="role-btn active" data-role="student" onclick="selectRole(this)">👨‍🎓 Student</div>
          <div class="role-btn" data-role="trainer" onclick="selectRole(this)">👨‍🏫 Trainer</div>
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="reg-name" class="form-input" placeholder="Enter your name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="reg-email" class="form-input" placeholder="Enter your email" required>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" id="reg-phone" class="form-input" placeholder="Phone number">
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <input type="text" id="reg-dept" class="form-input" placeholder="Department">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="reg-password" class="form-input" placeholder="Create a password" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
      </form>
      <p class="auth-footer">Already have an account? <a href="#" onclick="navigate('login')">Sign in</a></p>
      <p class="auth-footer"><a href="#" onclick="navigate('home')">← Back to Home</a></p>
    </div>
  </div>`;
}

function selectRole(el) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
