// ═══════════════════════════════════════════════════════════
// STUDENT PAGES
// ═══════════════════════════════════════════════════════════

async function renderStudentDashboard(c, t, s) {
  t.textContent = 'Student Dashboard'; s.textContent = 'Your learning overview';
  const d = await api('/student/dashboard');
  console.log('Dashboard Data:', d);

  const recentEnrollments = d.recentEnrollments || [];
  const recentCertificates = d.recentCertificates || [];
  const skillStats = d.skillStats || [];

  c.innerHTML = `
  <div class="stats-grid">
    <div class="stat-card animate-in delay-1"><div class="stat-icon purple">📚</div><div class="stat-value">${d.totalEnrolled || 0}</div><div class="stat-label">Enrolled Courses</div></div>
    <div class="stat-card animate-in delay-2"><div class="stat-icon green">✅</div><div class="stat-value">${d.completed || 0}</div><div class="stat-label">Completed</div></div>
    <div class="stat-card animate-in delay-3"><div class="stat-icon orange">📜</div><div class="stat-value">${d.certCount || 0}</div><div class="stat-label">Certificates</div></div>
    <div class="stat-card animate-in delay-4"><div class="stat-icon blue">🔄</div><div class="stat-value">${d.inProgress || 0}</div><div class="stat-label">In Progress</div></div>
  </div>
  
  <div class="grid-2 mt-20">
    <div class="card animate-in">
        <h3 class="card-title mb-12">Skill Analytics</h3>
        <canvas id="skillsChart" style="max-height:250px"></canvas>
    </div>
    <div class="card animate-in delay-1">
        <div class="card-header"><h3 class="card-title">Recent Enrollments</h3><button class="btn btn-sm btn-secondary" onclick="navigate('enrollments')">View All</button></div>
        ${recentEnrollments.length ? `
        <div class="table-wrapper"><table>
          <thead><tr><th>Course</th><th>Progress</th><th>Action</th></tr></thead>
          <tbody>${recentEnrollments.map(e => `<tr>
            <td>${e.course_title}</td>
            <td><div class="progress-bar" style="width:80px"><div class="fill" style="width:${e.progress}%"></div></div></td>
            <td>${e.progress === 100 && e.status !== 'Completed' ? `<button class="btn btn-xs btn-primary" onclick="navigate('assessment', ${e.course_id})">Take Test</button>` : `<span class="badge badge-info">${e.status}</span>`}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : '<div class="empty-state"><p>No enrollments yet.</p></div>'}
    </div>
  </div>
  
  <div class="card mt-20 animate-in delay-2">
    <div class="card-header"><h3 class="card-title">🏆 Recent Certificates</h3><button class="btn btn-sm btn-primary" onclick="navigate('certificates')">View All</button></div>
    ${recentCertificates.length ? `
    <div class="table-wrapper"><table>
      <thead><tr><th>Course</th><th>Skill</th><th>Code</th><th>Issued</th><th>Action</th></tr></thead>
      <tbody>${recentCertificates.map(cert => `<tr>
        <td><strong>${cert.course_title}</strong></td>
        <td><span class="badge badge-info">${cert.skill_name}</span></td>
        <td><code>${cert.certificate_code}</code></td>
        <td>${new Date(cert.issued_at).toLocaleDateString()}</td>
        <td><div class="btn-group">
            <button class="btn btn-xs btn-primary" onclick="viewCert(${cert.id})">👁️ View</button>
            <button class="btn btn-xs btn-secondary" onclick="downloadCert(${cert.id}, '${cert.certificate_code}')">📥 Download</button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty-state"><p>Finish courses to earn certificates!</p></div>'}
  </div>`;

  // Init Skill Chart
  if (skillStats.length) {
    const ctx = document.getElementById('skillsChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: skillStats.map(s => s.name),
        datasets: [{
          label: 'Skill Proficiency',
          data: skillStats.map(s => s.count * 20), // Scaling for better visualization
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6366f1'
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#94a3b8', font: { size: 12, weight: '600' } },
            ticks: { display: false, stepSize: 20 },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

async function renderSkillsPage(c, t, s) {
  t.textContent = 'Browse Skills'; s.textContent = 'Explore available skill paths';
  const skills = await api('/skills');
  c.innerHTML = `<div class="cards-grid">${skills.map(sk => `
    <div class="skill-card animate-in" onclick="navigate('skill-detail', ${sk.id})" style="cursor:pointer">
      <div class="flex-between mb-12">
        <span class="badge badge-${sk.level === 'Beginner' ? 'success' : sk.level === 'Intermediate' ? 'warning' : 'danger'}">${sk.level}</span>
        <span style="font-size:.8rem;color:var(--text-muted)">${sk.course_count} courses</span>
      </div>
      <h3 style="margin-bottom:8px">${sk.name}</h3>
      <p style="color:var(--text-secondary);font-size:.9rem;margin-bottom:12px">${sk.description}</p>
      <div style="font-size:.85rem;color:var(--text-muted)">⏱️ ${sk.duration}</div>
    </div>
  `).join('')}</div>`;
}

async function renderSkillDetail(c, t, s) {
  const id = window._pageData;
  const skill = await api(`/skills/${id}`);
  t.textContent = skill.name; s.textContent = skill.description;
  const enrollments = currentUser.role === 'student' ? await api('/enrollments') : [];
  const enrolledIds = enrollments.map(e => e.course_id);
  c.innerHTML = `
  <button class="btn btn-secondary btn-sm mb-20" onclick="navigate('skills')">← Back to Skills</button>
  <div class="flex-between mb-20">
    <div><span class="badge badge-${skill.level === 'Beginner' ? 'success' : skill.level === 'Intermediate' ? 'warning' : 'danger'}">${skill.level}</span>
    <span style="margin-left:12px;color:var(--text-muted);font-size:.9rem">⏱️ ${skill.duration}</span></div>
  </div>
  <h3 class="mb-20">Courses under this Skill</h3>
  <div class="cards-grid">${skill.courses.map(course => `
    <div class="course-card animate-in">
      <h3>${course.title}</h3>
      <p style="color:var(--text-secondary);font-size:.9rem;margin:8px 0">${course.description}</p>
      <div class="card-meta">
        <span class="meta-item">👨‍🏫 ${course.trainer_name || 'TBD'}</span>
        <span class="meta-item">⏱️ ${course.duration}</span>
      </div>
      <div class="card-actions">
        ${currentUser.role === 'student' ? (enrolledIds.includes(course.id)
      ? '<button class="btn btn-sm btn-secondary" disabled>✓ Enrolled</button>'
      : `<button class="btn btn-sm btn-primary" onclick="enrollCourse(${course.id})">Enroll Now</button>`)
      : ''}
      </div>
    </div>
  `).join('')}</div>`;
}

async function enrollCourse(courseId) {
  try {
    await api('/enrollments', { method: 'POST', body: { course_id: courseId } });
    toast('Enrolled successfully! Redirecting to lesson...', 'success');
    setTimeout(() => navigate('video-lesson', courseId), 1000);
  } catch (err) { toast(err.message, 'error'); }
}

async function renderEnrollments(c, t, s) {
  t.textContent = 'My Courses'; s.textContent = 'Your enrolled courses';
  const enrollments = await api('/enrollments');
  c.innerHTML = enrollments.length ? `<div class="cards-grid">${enrollments.map(e => `
    <div class="course-card animate-in" style="cursor:pointer">
      <div class="flex-between mb-12">
        <span class="badge badge-info">${e.skill_name}</span>
        <span class="badge ${e.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${e.status}</span>
      </div>
      <h3>${e.course_title}</h3>
      <p style="color:var(--text-secondary);font-size:.85rem;margin:8px 0">${e.course_description}</p>
      <div class="card-meta"><span class="meta-item">👨‍🏫 ${e.trainer_name || 'TBD'}</span></div>
      <div style="margin-top:12px">
        <div class="flex-between" style="margin-bottom:4px"><span style="font-size:.8rem;color:var(--text-muted)">Progress</span><span style="font-size:.8rem;font-weight:600">${e.progress}%</span></div>
        <div class="progress-bar"><div class="fill" style="width:${e.progress}%"></div></div>
      </div>
      <div class="card-actions mt-12">
        <button class="btn btn-sm btn-secondary" onclick="navigate('video-lesson', ${e.course_id})">📺 Learn</button>
        <button class="btn btn-sm btn-primary" onclick="navigate('assessment', ${e.course_id})">📝 Quiz</button>
      </div>
    </div>
  `).join('')}</div>` : '<div class="empty-state"><div class="icon">📚</div><h3>No courses yet</h3><p>Browse skills and enroll in courses to start learning!</p><button class="btn btn-primary" onclick="navigate(\'skills\')">Browse Skills</button></div>';
}

async function renderProgress(c, t, s) {
  t.textContent = 'Progress Tracking'; s.textContent = 'Detailed view of your learning progress';
  const enrollments = await api('/enrollments');
  c.innerHTML = `<div class="card animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Course</th><th>Skill</th><th>Progress</th><th>Assignment</th><th>Exam Score</th><th>Status</th></tr></thead>
      <tbody>${enrollments.map(e => `<tr>
        <td><a href="#" class="course-link" onclick="navigate('video-lesson', ${e.course_id})">${e.course_title}</a></td>
        <td><span class="badge badge-info">${e.skill_name}</span></td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:100px"><div class="fill" style="width:${e.progress}%"></div></div><span style="font-size:.8rem">${e.progress}%</span></div></td>
        <td><span class="badge ${e.assignment_status === 'Completed' ? 'badge-success' : e.assignment_status === 'Submitted' ? 'badge-warning' : 'badge-primary'}">${e.assignment_status}</span></td>
        <td>${e.exam_result ? e.exam_result + '%' : '—'}</td>
        <td><span class="badge ${e.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${e.status}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

async function renderCertificates(c, t, s) {
  t.textContent = 'My Certificates'; s.textContent = 'Your earned certificates';
  const certs = await api('/certificates');
  c.innerHTML = certs.length ? `<div class="cards-grid">${certs.map(cert => {
    const expired = new Date(cert.expiry_at) < new Date();
    return `<div class="cert-card animate-in">
      <div class="cert-icon">🏆</div>
      <h3>${cert.course_title}</h3>
      <p style="color:var(--text-secondary);font-size:.85rem;margin:4px 0">${cert.skill_name}</p>
      <p style="font-size:.8rem;color:var(--text-muted);margin-top:8px">Code: <strong>${cert.certificate_code}</strong></p>
      <p style="font-size:.8rem;color:var(--text-muted)">Issued: ${new Date(cert.issued_at).toLocaleDateString()}</p>
      <div class="cert-status"><span class="badge ${expired ? 'badge-danger' : 'badge-success'}">${expired ? 'Expired' : 'Valid until ' + new Date(cert.expiry_at).toLocaleDateString()}</span></div>
      <div style="margin-top:16px; display:flex; gap:8px">
        <button class="btn btn-sm btn-primary" onclick="viewCert(${cert.id})">👁️ View Certificate</button>
        <button class="btn btn-sm btn-secondary" onclick="downloadCert(${cert.id}, '${cert.certificate_code}')">📥 Download</button>
      </div>
    </div>`}).join('')}</div>` : '<div class="empty-state"><div class="icon">📜</div><h3>No certificates yet</h3><p>Complete courses to earn certificates!</p></div>';
}

async function viewCert(certId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/certificates/${certId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load certificate');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) { toast(err.message, 'error'); }
}

async function downloadCert(certId, code) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/certificates/${certId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${code}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Certificate downloaded!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

async function renderNotifications(c, t, s) {
  t.textContent = 'Notifications'; s.textContent = 'Stay updated on your activities';
  const notifs = await api('/notifications');
  c.innerHTML = `<div class="card animate-in"><div class="notif-panel">
    ${notifs.length ? notifs.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="markRead(${n.id})">
        <div class="notif-dot ${n.is_read ? 'read' : ''}"></div>
        <div><div class="notif-text">${n.message}</div><div class="notif-time">${new Date(n.created_at).toLocaleString()}</div></div>
      </div>
    `).join('') : '<div class="empty-state"><div class="icon">🔔</div><h3>No notifications</h3></div>'}
  </div></div>`;
}

async function markRead(id) {
  try { await api(`/notifications/${id}/read`, { method: 'PUT' }); navigate('notifications'); } catch (e) { }
}

async function renderProfile(c, t, s) {
  t.textContent = 'My Profile'; s.textContent = 'Manage your account';
  const profile = await api('/profile');
  c.innerHTML = `
  <div class="grid-2">
    <div class="card animate-in">
      <h3 class="mb-20">Profile Information</h3>
      <form id="profile-form">
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="prof-name" value="${profile.name}"></div>
        <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" value="${profile.email}" disabled></div>
        <div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-input" id="prof-phone" value="${profile.phone || ''}"></div>
        <div class="form-group"><label class="form-label">Department</label><input type="text" class="form-input" id="prof-dept" value="${profile.department || ''}"></div>
        <button type="submit" class="btn btn-primary">Update Profile</button>
      </form>
    </div>
    <div class="card animate-in delay-1">
      <h3 class="mb-20">Change Password</h3>
      <form id="password-form">
        <div class="form-group"><label class="form-label">Current Password</label><input type="password" class="form-input" id="cur-pass" required></div>
        <div class="form-group"><label class="form-label">New Password</label><input type="password" class="form-input" id="new-pass" required></div>
        <button type="submit" class="btn btn-warning">Change Password</button>
      </form>
    </div>
  </div>`;
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/profile', { method: 'PUT', body: { name: document.getElementById('prof-name').value, phone: document.getElementById('prof-phone').value, department: document.getElementById('prof-dept').value } });
      toast('Profile updated!', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/profile/password', { method: 'PUT', body: { currentPassword: document.getElementById('cur-pass').value, newPassword: document.getElementById('new-pass').value } });
      toast('Password changed!', 'success'); e.target.reset();
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── ASSESSMENTS ──────────────────────────────────────────
async function renderAssessment(c, t, s) {
  const courseId = window._pageData;
  t.textContent = 'Course Assessment'; s.textContent = 'Pass with 60% or higher to earn your certificate';
  const questions = await api(`/assessments/${courseId}`);
  if (!questions.length) { c.innerHTML = '<div class="empty-state"><h3>No assessment available</h3><p>Please contact your trainer.</p></div>'; return; }
  c.innerHTML = `
  <div class="card animate-in">
    <div id="quiz-container">
      ${questions.map((q, i) => `
        <div class="quiz-question ${i === 0 ? 'active' : ''}" id="q-${i}" style="display:${i === 0 ? 'block' : 'none'}">
          <div class="mb-20"><span class="badge badge-purple mb-12">Question ${i + 1} of ${questions.length}</span><h2 style="font-size:1.4rem; line-height:1.4">${q.question}</h2></div>
          <div class="quiz-options">
            ${['A', 'B', 'C', 'D'].map(opt => q['option_' + opt.toLowerCase()] ? `
              <div class="quiz-option" onclick="selectOption(${i}, ${q.id}, '${opt}')" id="opt-${q.id}-${opt}">
                <span class="opt-letter">${opt}</span><span class="opt-text">${q['option_' + opt.toLowerCase()]}</span>
              </div>
            ` : '').join('')}
          </div>
          <div class="flex-between mt-30">
            <button class="btn btn-secondary" onclick="prevQuestion(${i})" ${i === 0 ? 'disabled' : ''}>Previous</button>
            <button class="btn btn-primary" id="next-btn-${i}" onclick="${i === questions.length - 1 ? 'submitQuiz()' : `nextQuestion(${i})`}" disabled>${i === questions.length - 1 ? 'Finish & Submit' : 'Next Question'}</button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
  window._quizAnswers = {};
}

function selectOption(qIdx, qId, opt) {
  const options = document.querySelectorAll('[id^="opt-' + qId + '-"]');
  options.forEach(o => o.classList.remove('selected'));
  document.getElementById('opt-' + qId + '-' + opt).classList.add('selected');
  window._quizAnswers[qId] = opt;
  document.getElementById('next-btn-' + qIdx).disabled = false;
}
function nextQuestion(i) { document.getElementById('q-' + i).style.display = 'none'; document.getElementById('q-' + (i + 1)).style.display = 'block'; }
function prevQuestion(i) { document.getElementById('q-' + i).style.display = 'none'; document.getElementById('q-' + (i - 1)).style.display = 'block'; }
async function submitQuiz() {
  const courseId = window._pageData;
  try {
    const res = await api('/assessments/' + courseId + '/submit', { method: 'POST', body: { answers: window._quizAnswers } });
    const app = document.getElementById('app');
    const content = app.querySelector('.page-content');

    let resultsHtml = `
      <div class="results-summary animate-in" style="text-align:center; padding:40px 20px; border-bottom:1px solid var(--border); margin-bottom:30px">
          <div style="font-size:4rem; margin-bottom:15px">${res.percent >= 60 ? '🎉' : '❌'}</div>
          <h1 style="font-size:2.2rem; margin-bottom:8px">${res.percent >= 60 ? 'Passed!' : 'Try Again'}</h1>
          <p style="font-size:1.1rem; color:var(--text-secondary); margin-bottom:24px">You scored <strong>${res.percent}%</strong>. ${res.message}</p>
          <button class="btn btn-primary" onclick="navigate('${res.success ? 'certificates' : 'dashboard'}')">${res.success ? 'Go to My Certificates' : 'Back to Dashboard'}</button>
      </div>

      <div class="results-details animate-in delay-1">
          <h3 class="mb-20">Review Your Answers</h3>
          ${res.results.map((q, idx) => `
              <div class="card mb-16" style="border-left: 4px solid ${q.isCorrect ? 'var(--success)' : 'var(--danger)'}; background: rgba(255,255,255,0.02)">
                  <div class="flex-between mb-12">
                      <span class="badge ${q.isCorrect ? 'badge-success' : 'badge-danger'}">Question ${idx + 1}: ${q.isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                  <h4 class="mb-12" style="font-size:1.1rem; line-height:1.4">${q.question}</h4>
                  <div style="font-size:0.95rem; display:grid; gap:8px">
                      <div style="color:${q.isCorrect ? 'var(--success)' : 'var(--danger)'}">
                          <strong>Your Answer:</strong> ${q.options[q.studentAnswer.toLowerCase()] || q.studentAnswer}
                      </div>
                      ${!q.isCorrect ? `
                          <div style="color:var(--success)">
                              <strong>Correct Answer:</strong> ${q.options[q.correctOption.toLowerCase()] || q.correctOption}
                          </div>
                      ` : ''}
                  </div>
              </div>
          `).join('')}
      </div>
    `;

    content.innerHTML = resultsHtml;
    toast(res.message, res.success ? 'success' : 'warning');
  } catch (err) { toast(err.message, 'error'); }
}
// ── AI ANALYZER ───────────────────────────────────────────
async function renderAIAnalyzer(c, t, s) {
  t.textContent = 'AI Skill Gap Analyzer'; s.textContent = 'AI-driven career path recommendations';
  c.innerHTML = `
  <div class="card animate-in">
    <div class="mb-32 text-center">
        <div style="font-size:3rem; margin-bottom:12px">🤖</div>
        <h2 class="mb-12">Identify Your Career Gaps</h2>
        <p class="text-muted">Select your target role and let our AI analyze your current profile to recommend the best learning path.</p>
    </div>
    <div style="max-width:500px; margin:0 auto">
        <div class="form-group">
            <label class="form-label">Target Career Role</label>
            <select id="target-role" class="form-select">
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Specialist">Frontend Specialist</option>
                <option value="Backend Architect">Backend Architect</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="Cloud Architect">Cloud Architect</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Mobile Developer">Mobile Developer</option>
            </select>
        </div>
        <button class="btn btn-primary w-100" onclick="analyzeGap()">Analyze Skill Gap</button>
    </div>
    <div id="analyzer-result" class="mt-30"></div>
  </div>`;
}

async function analyzeGap() {
  const role = document.getElementById('target-role').value;
  const resDiv = document.getElementById('analyzer-result');
  resDiv.innerHTML = '<div class="flex-center" style="padding:40px"><div class="spinner"></div></div>';
  try {
    const data = await api('/ai/skill-gap', { method: 'POST', body: { targetRole: role } });
    let html = `
      <div class="ai-result-card animate-in glass">
        <div class="flex-between mb-24">
          <div>
            <h3 class="role-title">${data.role}</h3>
            <p class="text-muted">Personalized Career Alignment</p>
          </div>
          <div class="match-score-container">
            <div class="match-score">${data.matchPercentage}%</div>
            <div class="score-label">MATCH</div>
          </div>
        </div>
        
        <div class="progress-bar mb-32" style="height:10px">
          <div class="fill" style="width:${data.matchPercentage}%; background: linear-gradient(90deg, var(--primary), var(--accent))"></div>
        </div>
        
        <div class="grid-2 gap-24">
          <div class="skill-section">
            <h4 class="section-title success"><span class="icon">✅</span> Acquired Expertise</h4>
            <div class="skill-tags">
              ${data.matches.map(s => `<span class="tag match">${s}</span>`).join('') || '<p class="text-muted">No matching skills yet</p>'}
            </div>
          </div>
          <div class="skill-section">
            <h4 class="section-title warning"><span class="icon">🎯</span> Growth Opportunities</h4>
            <div class="skill-tags">
              ${data.missing.map(s => `<span class="tag missing">${s}</span>`).join('') || '<p class="text-success">You are fully prepared!</p>'}
            </div>
          </div>
        </div>`;

    if (data.recommendations.length) {
      html += `
        <div class="roadmap-section mt-40 pt-32">
          <h4 class="mb-20">🚀 Your Learning Roadmap</h4>
          <div class="roadmap-grid">
            ${data.recommendations.map(c => `
              <div class="roadmap-item glass">
                <div class="item-info">
                  <h5>${c.title}</h5>
                  <p>${c.skill_name}</p>
                </div>
                <button class="btn btn-xs btn-primary" onclick="enrollCourse(${c.id})">Enroll</button>
              </div>
            `).join('')}
          </div>
        </div>`;
    }
    html += '</div>';
    resDiv.innerHTML = html;
  } catch (err) { toast(err.message, 'error'); }
}

// ── VIDEO LESSONS ──────────────────────────────────────────
async function renderVideoLesson(c, t, s) {
  const courseId = Number(window._pageData);
  const enrollments = await api('/enrollments');
  const enrollment = enrollments.find(e => Number(e.course_id) === courseId);

  if (!enrollment) {
    c.innerHTML = `
    <div class="empty-state">
      <div class="icon">🔍</div>
      <h3>Course Session Not Found</h3>
      <p>Please ensure you are enrolled in this course before attempting to view the lesson.</p>
      <button class="btn btn-primary mt-20" onclick="navigate('skills')">Browse Skills</button>
    </div>`;
    return;
  }

  const courses = await api('/courses');
  const courseDetails = courses.find(c => Number(c.id) === courseId);

  t.textContent = enrollment.course_title;
  s.textContent = 'Watch the full video to earn your certificate';

  c.innerHTML = `
    <button class="btn btn-secondary btn-sm mb-20" onclick="navigate('enrollments')">← Back to My Courses</button>
    <div class="card animate-in">
        <div class="video-container mb-30" style="background:#000; aspect-ratio:16/9; border-radius:12px; position:relative; overflow:hidden">
            ${courseDetails && courseDetails.video_url ?
      `<iframe width="100%" height="100%" src="${courseDetails.video_url}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border-radius:12px"></iframe>` :
      `<div style="display:flex; align-items:center; justify-content:center; height:100%; text-align:center; background:rgba(255,255,255,0.05)">
                <div>
                    <div style="font-size:4rem; color:var(--danger); margin-bottom:20px">⚠️</div>
                    <h2 style="color:#fff">Video Unavailable</h2>
                    <p style="color:#888; max-width: 300px; margin: 0 auto;">We're sorry, the video for this lesson is currently not available. Please contact support.</p>
                </div>
              </div>`
    }
            <div class="video-overlay" style="position:absolute; bottom:0; left:0; right:0; padding:20px; background:linear-gradient(transparent, rgba(0,0,0,0.8)); pointer-events: none;">
                <div class="progress-bar"><div class="fill" id="video-progress" style="width:0%"></div></div>
            </div>
        </div>
        
        <div class="flex-between">
            <div>
                <h3>Watch Progress</h3>
                <p class="text-muted">You must watch for at least 1 minute to qualify for a certificate.</p>
            </div>
            <div style="text-align:right">
                <div id="timer-display" style="font-size:2rem; font-weight:800; color:var(--primary)">01:00</div>
                <div style="font-size:.7rem; color:var(--text-muted)">REMAINING TIME</div>
            </div>
        </div>
        
        <div class="mt-30 pt-20" style="border-top:1px solid var(--border)">
            <button id="cert-btn" class="btn btn-primary btn-lg w-100" disabled onclick="completeVideo(${courseId})">
                Generate Certificate (Locked)
            </button>
        </div>
    </div>`;

  // Timer Logic
  let timeLeft = 60;
  const timerDisplay = document.getElementById('timer-display');
  const progressBar = document.getElementById('video-progress');
  const certBtn = document.getElementById('cert-btn');

  const interval = setInterval(() => {
    timeLeft--;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const progress = ((60 - timeLeft) / 60) * 100;
    progressBar.style.width = progress + '%';

    if (timeLeft <= 0) {
      clearInterval(interval);
      timerDisplay.textContent = "00:00";
      timerDisplay.style.color = "var(--success)";
      certBtn.disabled = false;
      certBtn.textContent = "Generate Certificate Now";
      toast("You can now generate your certificate!", "success");
    }
  }, 1000);

  // Stop timer if user navigates away
  const originalNavigate = window.navigate;
  window.navigate = function (...args) {
    clearInterval(interval);
    window.navigate = originalNavigate;
    originalNavigate.apply(this, args);
  };
}

async function completeVideo(courseId) {
  try {
    const res = await api(`/courses/${courseId}/video-complete`, { method: 'POST' });
    toast(res.message, 'success');
    navigate('certificates');
  } catch (err) {
    toast(err.message, 'error');
  }
}
