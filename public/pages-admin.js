// ═══════════════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════════════

async function renderAdminDashboard(c, t, s) {
  t.textContent = 'Admin Intelligence'; s.textContent = 'System-wide analytics and control';
  try {
    const d = await api('/admin/dashboard');
    console.log('Admin Dashboard Data:', d);

    // Defensive data handling
    const recentCertificates = d.recentCertificates || [];
    const growthData = d.growthData || [];

    c.innerHTML = `
    <div class="stats-grid animate-in">
        <div class="stat-card animate-in delay-2"><div class="stat-icon blue">👥</div><div class="stat-value">${d.totalStudents || 0}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-card animate-in delay-2"><div class="stat-value">${d.totalTrainers || 0}</div><div class="stat-label">Total Trainers</div></div>
        <div class="stat-card animate-in delay-1"><div class="stat-icon purple">📝</div><div class="stat-value">${d.courseCount || 0}</div><div class="stat-label">Assigned Courses</div></div>
        <div class="stat-card animate-in delay-3"><div class="stat-value">${d.totalCertificates || 0}</div><div class="stat-label">Certificates Issued</div></div>
        <div class="stat-card animate-in delay-4"><div class="stat-value">${d.totalEnrollments || 0}</div><div class="stat-label">Total Enrollments</div></div>
        <div class="stat-card animate-in delay-4"><div class="stat-value">${d.pendingApprovals || 0}</div><div class="stat-label" style="color:var(--warning)">Pending Approvals</div></div>
    </div>
    
    <div class="grid-2 mt-20">
        <div class="card animate-in">
            <h3 class="card-title mb-12">Enrollment Growth</h3>
            <canvas id="growthChart" style="max-height:250px"></canvas>
        </div>
        <div class="card animate-in">
            <h3 class="card-title mb-12">System Quick Actions</h3>
            <div class="btn-group-vertical">
                <button class="btn btn-primary" onclick="navigate('admin-users', 'student')">Approve Students</button>
                <button class="btn btn-secondary" onclick="navigate('admin-skills')">Manage Skill Paths</button>
                <button class="btn btn-accent" onclick="navigate('report-performance')">View Certification Report</button>
                <button class="btn btn-purple" onclick="generateAllQuizzes()">✨ Generate All Quizzes</button>
            </div>
        </div>
    </div>
    
    <div class="card mt-20 animate-in delay-2">
        <div class="card-header"><h3 class="card-title">📜 Recently Issued Certificates</h3><button class="btn btn-sm btn-accent" onclick="navigate('report-performance')">View Reports</button></div>
        ${recentCertificates.length ? `
        <div class="table-wrapper"><table>
        <thead><tr><th>Student</th><th>Course</th><th>Issued</th><th>Code</th></tr></thead>
        <tbody>${recentCertificates.map(cert => `<tr>
            <td><strong>${cert.student_name || 'Unknown'}</strong></td>
            <td>${cert.course_title || 'Unknown Course'}</td>
            <td>${cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}</td>
            <td><code>${cert.certificate_code || 'N/A'}</code></td>
        </tr>`).join('')}</tbody>
        </table></div>` : '<div class="empty-state"><p>No certificates issued yet.</p></div>'}
    </div>`;

    if (growthData.length) {
      const ctx = document.getElementById('growthChart').getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: growthData.map(g => g.month).reverse(),
          datasets: [{
            label: 'New Enrollments',
            data: growthData.map(g => g.count).reverse(),
            borderColor: '#0ea5e9',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f8fafc',
              bodyColor: '#f8fafc',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 10,
              displayColors: false
            }
          }
        }
      });
    }
  } catch (err) {
    c.innerHTML = `<div class="empty-state"><h3>⚠️ Error Loading Dashboard</h3><p>${err.message}</p><button class="btn btn-primary mt-20" onclick="render()">Retry</button></div>`;
  }
}

async function renderAdminSkills(c, t, s) {
  t.textContent = 'Skill Management'; s.textContent = 'Add, edit, or delete skills';
  const skills = await api('/skills');
  c.innerHTML = `
  <div class="flex-between mb-20">
    <h3>${skills.length} Skills</h3>
    <button class="btn btn-primary" onclick="document.getElementById('add-skill-modal').classList.add('active')">+ Add Skill</button>
  </div>
  <div class="card animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Name</th><th>Level</th><th>Duration</th><th>Courses</th><th>Actions</th></tr></thead>
      <tbody>${skills.map(sk => `<tr>
        <td><strong>${sk.name}</strong><br><span style="font-size:.8rem;color:var(--text-muted)">${sk.description || ''}</span></td>
        <td><span class="badge badge-${sk.level === 'Beginner' ? 'success' : sk.level === 'Intermediate' ? 'warning' : 'danger'}">${sk.level}</span></td>
        <td>${sk.duration}</td>
        <td>${sk.course_count}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="editSkill(${sk.id},'${sk.name.replace(/'/g, "\\'")}','${(sk.description || '').replace(/'/g, "\\'")}','${sk.level}','${sk.duration}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSkill(${sk.id},'${sk.name.replace(/'/g, "\\'")}')">🗑️</button>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>
  <div class="modal-overlay" id="add-skill-modal">
    <div class="modal">
      <div class="modal-header"><h2>Add New Skill</h2><button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</button></div>
      <form id="add-skill-form">
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="as-name" required></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-input" id="as-desc"></div>
        <div class="form-group"><label class="form-label">Level</label><select class="form-select" id="as-level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
        <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-input" id="as-dur" placeholder="e.g. 8 weeks"></div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('active')">Cancel</button><button type="submit" class="btn btn-primary">Add Skill</button></div>
      </form>
    </div>
  </div>`;
  document.getElementById('add-skill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/skills', { method: 'POST', body: { name: document.getElementById('as-name').value, description: document.getElementById('as-desc').value, level: document.getElementById('as-level').value, duration: document.getElementById('as-dur').value } });
      toast('Skill added!', 'success'); navigate('admin-skills');
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function editSkill(id, name, desc, level, dur) {
  const newName = prompt('Skill name:', name);
  if (!newName) return;
  const newDesc = prompt('Description:', desc);
  const newLevel = prompt('Level (Beginner/Intermediate/Advanced):', level);
  const newDur = prompt('Duration:', dur);
  try {
    await api(`/skills/${id}`, { method: 'PUT', body: { name: newName, description: newDesc || '', level: newLevel || level, duration: newDur || dur } });
    toast('Skill updated!', 'success'); navigate('admin-skills');
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteSkill(id, name) {
  if (!confirm(`Delete skill "${name}"? This may affect related courses.`)) return;
  try { await api(`/skills/${id}`, { method: 'DELETE' }); toast('Skill deleted!', 'success'); navigate('admin-skills'); } catch (err) { toast(err.message, 'error'); }
}

async function renderAdminUsers(c, t, s) {
  t.textContent = 'User Management'; s.textContent = 'View, approve, or remove users';
  const users = await api('/admin/users');
  const students = users.filter(u => u.role === 'student');
  const trainers = users.filter(u => u.role === 'trainer');
  c.innerHTML = `
  <h3 class="mb-12">👨‍🎓 Students (${students.length})</h3>
  <div class="card mb-32 animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${students.map(u => `<tr>
        <td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.department || '—'}</td>
        <td><span class="badge ${u.approved ? 'badge-success' : 'badge-warning'}">${u.approved ? 'Active' : 'Pending'}</span></td>
        <td style="display:flex;gap:6px">
          ${!u.approved ? `<button class="btn btn-sm btn-success" onclick="approveUser(${u.id})">✓ Approve</button>` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id},'${u.name.replace(/'/g, "\\'")}')">🗑️</button>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>
  <h3 class="mb-12">👨‍🏫 Trainers (${trainers.length})</h3>
  <div class="card animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${trainers.map(u => `<tr>
        <td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.department || '—'}</td>
        <td><span class="badge ${u.approved ? 'badge-success' : 'badge-warning'}">${u.approved ? 'Active' : 'Pending'}</span></td>
        <td style="display:flex;gap:6px">
          ${!u.approved ? `<button class="btn btn-sm btn-success" onclick="approveUser(${u.id})">✓ Approve</button>` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id},'${u.name.replace(/'/g, "\\'")}')">🗑️</button>
        </td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

async function approveUser(id) {
  try { await api(`/admin/users/${id}/approve`, { method: 'PUT' }); toast('User approved!', 'success'); navigate('admin-users'); } catch (err) { toast(err.message, 'error'); }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"?`)) return;
  try { await api(`/admin/users/${id}`, { method: 'DELETE' }); toast('User deleted!', 'success'); navigate('admin-users'); } catch (err) { toast(err.message, 'error'); }
}

async function renderAdminReports(c, t, s) {
  t.textContent = 'Reports'; s.textContent = 'Student performance & certification reports';
  const [studentReport, certReport, skillReport] = await Promise.all([
    api('/admin/reports/students'), api('/admin/reports/certifications'), api('/admin/reports/skills')
  ]);
  c.innerHTML = `
  <div class="flex-between mb-20"><h3>📊 Student Performance Report</h3></div>
  <div class="card mb-32 animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Student</th><th>Email</th><th>Department</th><th>Courses</th><th>Completed</th><th>Avg Progress</th><th>Avg Exam</th></tr></thead>
      <tbody>${studentReport.map(r => `<tr>
        <td><strong>${r.name}</strong></td><td>${r.email}</td><td>${r.department || '—'}</td>
        <td>${r.total_courses}</td><td>${r.completed_courses}</td>
        <td>${r.avg_progress || 0}%</td><td>${r.avg_exam_score || '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>
  <div class="flex-between mb-20"><h3>📜 Certification Report</h3></div>
  <div class="card mb-32 animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Student</th><th>Course</th><th>Skill</th><th>Code</th><th>Issued</th><th>Expires</th></tr></thead>
      <tbody>${certReport.map(r => `<tr>
        <td>${r.student_name}</td><td>${r.course_title}</td><td><span class="badge badge-info">${r.skill_name}</span></td>
        <td><code>${r.certificate_code}</code></td>
        <td>${new Date(r.issued_at).toLocaleDateString()}</td>
        <td>${new Date(r.expiry_at).toLocaleDateString()}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>
  <div class="flex-between mb-20"><h3>🎯 Skill Completion Report</h3></div>
  <div class="card animate-in">
    <div class="table-wrapper"><table>
      <thead><tr><th>Skill</th><th>Level</th><th>Courses</th><th>Students</th><th>Completions</th><th>Avg Progress</th></tr></thead>
      <tbody>${skillReport.map(r => `<tr>
        <td><strong>${r.skill_name}</strong></td>
        <td><span class="badge badge-${r.level === 'Beginner' ? 'success' : r.level === 'Intermediate' ? 'warning' : 'danger'}">${r.level}</span></td>
        <td>${r.total_courses}</td><td>${r.total_students}</td>
        <td>${r.completions}</td><td>${r.avg_progress || 0}%</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

async function generateAllQuizzes() {
  if (!confirm('Are you sure you want to generate quizzes for all courses that do not have one?')) return;
  try {
    toast('Generating quizzes for all courses...', 'info');
    const res = await api('/ai/generate-all-quizzes', { method: 'POST' });
    toast(res.message, 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}
