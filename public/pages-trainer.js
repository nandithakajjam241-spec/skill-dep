// ═══════════════════════════════════════════════════════════
// TRAINER PAGES
// ═══════════════════════════════════════════════════════════

async function renderTrainerDashboard(c, t, s) {
  t.textContent = 'Trainer Dashboard'; s.textContent = 'Manage your courses and students';
  const d = await api('/trainer/dashboard');
  console.log('Trainer Dashboard Data:', d);
  const courses = d.courses || [];

  c.innerHTML = `
  <div class="stats-grid">
    <div class="stat-card animate-in delay-1"><div class="stat-icon purple">📝</div><div class="stat-value">${d.courseCount || 0}</div><div class="stat-label">Assigned Courses</div></div>
    <div class="stat-card animate-in delay-2"><div class="stat-icon blue">👥</div><div class="stat-value">${d.totalStudents || 0}</div><div class="stat-label">Total Students</div></div>
    <div class="stat-card animate-in delay-3"><div class="stat-icon green">✅</div><div class="stat-value">${d.completedStudents || 0}</div><div class="stat-label">Completions</div></div>
  </div>
  <div class="card animate-in">
    <div class="card-header"><h3 class="card-title">My Courses</h3></div>
    ${courses.length ? `<div class="table-wrapper"><table>
      <thead><tr><th>Course</th><th>Skill</th><th>Enrolled</th><th>Actions</th></tr></thead>
      <tbody>${courses.map(co => `<tr>
        <td><strong>${co.title}</strong></td>
        <td><span class="badge badge-info">${co.skill_name}</span></td>
        <td>${co.enrolled_count} students</td>
        <td><button class="btn btn-sm btn-primary" onclick="navigate('course-students', ${co.id})">View Students</button></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<p class="text-muted">No courses assigned yet.</p>'}
  </div>`;
}

async function renderTrainerCourses(c, t, s) {
  t.textContent = 'Course Management'; s.textContent = 'Add, update courses and manage students';
  const courses = await api('/trainer/courses');
  const skills = await api('/skills');
  c.innerHTML = `
  <div class="flex-between mb-20">
    <h3>${courses.length} Course(s)</h3>
    <button class="btn btn-primary" onclick="document.getElementById('add-course-modal').classList.add('active')">+ Add Course</button>
  </div>
  <div class="cards-grid">${courses.map(co => `
    <div class="course-card animate-in">
      <div class="flex-between mb-12"><span class="badge badge-info">${co.skill_name}</span><span style="font-size:.8rem;color:var(--text-muted)">${co.enrolled_count} enrolled</span></div>
      <h3>${co.title}</h3>
      <p style="color:var(--text-secondary);font-size:.85rem;margin:8px 0">${co.description || ''}</p>
      <div style="font-size:.85rem;color:var(--text-muted)">⏱️ ${co.duration}</div>
      <div class="card-actions">
        <button class="btn btn-sm btn-primary" onclick="navigate('course-students', ${co.id})">👥 Students</button>
        <button class="btn btn-sm btn-warning" onclick="navigate('trainer-quiz', ${co.id})">📝 Quiz</button>
        <button class="btn btn-sm btn-secondary" onclick="editTrainerCourse(${co.id}, '${co.title.replace(/'/g, "\\'")}', '${(co.description || '').replace(/'/g, "\\'")}', '${co.duration}')">✏️ Edit</button>
      </div>
    </div>
  `).join('')}</div>
  <div class="modal-overlay" id="add-course-modal">
    <div class="modal">
      <div class="modal-header"><h2>Add New Course</h2><button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</button></div>
      <form id="add-course-form">
        <div class="form-group"><label class="form-label">Skill</label><select class="form-select" id="ac-skill" required>${skills.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="ac-title" required></div>
        <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-input" id="ac-desc"></div>
        <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-input" id="ac-dur" placeholder="e.g. 4 weeks"></div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('active')">Cancel</button><button type="submit" class="btn btn-primary">Add Course</button></div>
      </form>
    </div>
  </div>`;
  document.getElementById('add-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/trainer/courses', { method: 'POST', body: { skill_id: parseInt(document.getElementById('ac-skill').value), title: document.getElementById('ac-title').value, description: document.getElementById('ac-desc').value, duration: document.getElementById('ac-dur').value } });
      toast('Course added!', 'success'); navigate('trainer-courses');
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function editTrainerCourse(id, title, desc, dur) {
  const newTitle = prompt('Course title:', title);
  if (!newTitle) return;
  const newDesc = prompt('Description:', desc);
  const newDur = prompt('Duration:', dur);
  try {
    await api(`/trainer/courses/${id}`, { method: 'PUT', body: { title: newTitle, description: newDesc || '', duration: newDur || '' } });
    toast('Course updated!', 'success'); navigate('trainer-courses');
  } catch (err) { toast(err.message, 'error'); }
}

async function renderCourseStudents(c, t, s) {
  const courseId = window._pageData;
  t.textContent = 'Course Students'; s.textContent = 'Manage student progress';
  const students = await api(`/trainer/courses/${courseId}/students`);
  c.innerHTML = `
  <button class="btn btn-secondary btn-sm mb-20" onclick="navigate('trainer-courses')">← Back to Courses</button>
  <div class="card animate-in">
    ${students.length ? `<div class="table-wrapper"><table>
      <thead><tr><th>Student</th><th>Email</th><th>Progress</th><th>Assignment</th><th>Exam</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${students.map(st => `<tr>
        <td><strong>${st.name}</strong></td>
        <td>${st.email}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:80px"><div class="fill" style="width:${st.progress}%"></div></div><span style="font-size:.8rem">${st.progress}%</span></div></td>
        <td><span class="badge ${st.assignment_status === 'Completed' ? 'badge-success' : st.assignment_status === 'Submitted' ? 'badge-warning' : 'badge-primary'}">${st.assignment_status}</span></td>
        <td>${st.exam_result || '—'}</td>
        <td><span class="badge ${st.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${st.status}</span></td>
        <td><button class="btn btn-sm btn-primary" onclick="updateStudentProgress(${st.id}, ${courseId}, ${st.progress}, '${st.assignment_status}', ${st.exam_result})">Update</button></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty-state"><p>No students enrolled yet.</p></div>'}
  </div>`;
}

async function updateStudentProgress(studentId, courseId, curProgress, curAssignment, curExam) {
  const progress = prompt('Progress (0-100):', curProgress);
  if (progress === null) return;
  const assignment = prompt('Assignment status (Pending/Submitted/Completed):', curAssignment);
  const exam = prompt('Exam result (0-100):', curExam || 0);
  const status = parseInt(progress) >= 100 && assignment === 'Completed' ? 'Completed' : 'In Progress';
  try {
    await api(`/trainer/enrollments/${studentId}/${courseId}`, { method: 'PUT', body: { progress: parseInt(progress), assignment_status: assignment, exam_result: parseInt(exam), status } });
    toast('Student progress updated!', 'success'); navigate('course-students', courseId);
  } catch (err) { toast(err.message, 'error'); }
}

async function renderTrainerQuizManager(c, t, s) {
  const courseId = window._pageData;
  t.textContent = 'Quiz Management'; s.textContent = 'Add and manage assessment questions for this course';
  const questions = await api(`/trainer/courses/${courseId}/questions`);

  c.innerHTML = `
    <button class="btn btn-secondary btn-sm mb-20" onclick="navigate('trainer-courses')">← Back to Courses</button>
    <div class="flex-between mb-20">
      <h3>${questions.length} Question(s)</h3>
      <div class="btn-group">
        <button class="btn btn-secondary" onclick="generateAIQuestions(${courseId})">✨ AI Generate</button>
        <button class="btn btn-primary" onclick="document.getElementById('add-question-modal').classList.add('active')">+ Add Question</button>
      </div>
    </div>
    
    <div id="ai-preview-container"></div>

    <div class="card animate-in">
      ${questions.length ? `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Question</th><th>Options</th><th>Correct</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${questions.map(q => `
                <tr>
                  <td><strong>${q.question}</strong></td>
                  <td style="font-size: 0.8rem; color: var(--text-muted)">
                    A: ${q.option_a}<br>B: ${q.option_b}<br>C: ${q.option_c}<br>D: ${q.option_d}
                  </td>
                  <td><span class="badge badge-success">${q.correct_option}</span></td>
                  <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${q.id}, ${courseId})">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><p>No questions added yet.</p></div>'}
    </div>

    <!-- Modals etc stays same -->

    <div class="modal-overlay" id="add-question-modal">
      <div class="modal" style="max-width: 600px">
        <div class="modal-header"><h2>Add Question</h2><button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active')">&times;</button></div>
        <form id="add-question-form">
          <div class="form-group"><label class="form-label">Question Text</label><input type="text" class="form-input" id="aq-text" required></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Option A</label><input type="text" class="form-input" id="aq-a" required></div>
            <div class="form-group"><label class="form-label">Option B</label><input type="text" class="form-input" id="aq-b" required></div>
            <div class="form-group"><label class="form-label">Option C</label><input type="text" class="form-input" id="aq-c" required></div>
            <div class="form-group"><label class="form-label">Option D</label><input type="text" class="form-input" id="aq-d" required></div>
          </div>
          <div class="form-group">
            <label class="form-label">Correct Option</label>
            <select class="form-select" id="aq-correct" required>
              <option value="A">Option A</option><option value="B">Option B</option>
              <option value="C">Option C</option><option value="D">Option D</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('active')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Question</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById('add-question-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      question: document.getElementById('aq-text').value,
      option_a: document.getElementById('aq-a').value,
      option_b: document.getElementById('aq-b').value,
      option_c: document.getElementById('aq-c').value,
      option_d: document.getElementById('aq-d').value,
      correct_option: document.getElementById('aq-correct').value
    };
    try {
      await api(`/trainer/courses/${courseId}/questions`, { method: 'POST', body });
      toast('Question added!', 'success');
      navigate('trainer-quiz', courseId);
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function deleteQuestion(id, courseId) {
  if (!confirm('Are you sure you want to delete this question?')) return;
  try {
    await api(`/trainer/questions/${id}`, { method: 'DELETE' });
    toast('Question deleted', 'info');
    navigate('trainer-quiz', courseId);
  } catch (err) { toast(err.message, 'error'); }
}

async function generateAIQuestions(courseId) {
  const container = document.getElementById('ai-preview-container');
  container.innerHTML = '<div class="card mb-20 animate-in" style="border: 2px dashed var(--primary); text-align: center; padding: 30px;"><div class="spinner"></div><p>AI is generating premium questions for your course...</p></div>';
  
  try {
    const data = await api('/ai/generate-questions', { method: 'POST', body: { courseId } });
    window._tempAIQuestions = data.questions;

    container.innerHTML = `
      <div class="card mb-20 animate-in border-glow" style="border: 2px solid var(--primary-glow)">
        <div class="flex-between mb-20">
          <div>
            <h3 style="color: var(--primary-light)">✨ AI Generated Questions</h3>
            <p class="text-muted">Topic: ${data.topic}</p>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('ai-preview-container').innerHTML=''">Discard</button>
            <button class="btn btn-primary btn-sm" onclick="saveGeneratedQuestions(${courseId})">Save All to Course</button>
          </div>
        </div>
        <div class="table-wrapper">
          <table style="background: rgba(99, 102, 241, 0.05)">
            <thead><tr><th>Question</th><th>Options</th><th>Correct</th></tr></thead>
            <tbody>
              ${data.questions.map(q => `
                <tr>
                  <td>${q.q}</td>
                  <td style="font-size: 0.8rem">A: ${q.a} | B: ${q.b} | C: ${q.c} | D: ${q.d}</td>
                  <td><span class="badge badge-success">${q.correct}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    toast('AI Questions Generated!', 'success');
  } catch (err) {
    container.innerHTML = '';
    toast(err.message, 'error');
  }
}

async function saveGeneratedQuestions(courseId) {
  if (!window._tempAIQuestions) return;
  try {
    for (const q of window._tempAIQuestions) {
      await api(`/trainer/courses/${courseId}/questions`, {
        method: 'POST',
        body: {
          question: q.q,
          option_a: q.a,
          option_b: q.b,
          option_c: q.c,
          option_d: q.d,
          correct_option: q.correct
        }
      });
    }
    toast(`Successfully added ${window._tempAIQuestions.length} questions!`, 'success');
    document.getElementById('ai-preview-container').innerHTML = '';
    navigate('trainer-quiz', courseId);
  } catch (err) {
    toast(err.message, 'error');
  }
}
