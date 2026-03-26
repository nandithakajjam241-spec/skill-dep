const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'skill-dev-cert-secret-key-2024';
const DB_PATH = path.join(__dirname, 'database.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// Helper: run SQL and return results as array of objects
async function all(sql, params = []) {
  return await db.all(sql, params);
}

async function get(sql, params = []) {
  return await db.get(sql, params);
}

async function run(sql, params = []) {
  const result = await db.run(sql, params);
  return { lastInsertRowid: result.lastID, changes: result.changes };
}

async function sendNotification(userId, message) {
  await run('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, message]);
}

async function initDatabase() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.run("PRAGMA foreign_keys = ON");

  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    phone TEXT, department TEXT, password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','trainer','student')),
    approved INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
    level TEXT CHECK(level IN ('Beginner','Intermediate','Advanced','Expert')),
    duration TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, skill_id INTEGER NOT NULL, title TEXT NOT NULL,
    description TEXT, trainer_id INTEGER, duration TEXT, video_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, course_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0, assignment_status TEXT DEFAULT 'Pending',
    exam_result INTEGER DEFAULT 0, status TEXT DEFAULT 'In Progress',
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME,
    UNIQUE(student_id, course_id)
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, course_id INTEGER NOT NULL,
    certificate_code TEXT UNIQUE NOT NULL, issued_at DATETIME DEFAULT CURRENT_TIMESTAMP, expiry_at DATETIME
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // New Tables for Assessments
  await db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, question TEXT NOT NULL,
    option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT, correct_option TEXT
  )`);

  await seedData();
}

async function seedData() {
  const c = await get('SELECT COUNT(*) as c FROM users');
  if (c && c.c > 0) return;
  const hash = bcrypt.hashSync('password123', 10);

  await run(`INSERT INTO users (name,email,phone,department,password,role,approved) VALUES (?,?,?,?,?,?,?)`, ['Admin User', 'admin@system.com', '9000000001', 'Administration', hash, 'admin', 1]);
  const trainerData = [['Rajesh Kumar', 'rajesh@system.com', '9000000002', 'Computer Science'], ['Priya Sharma', 'priya@system.com', '9000000003', 'Data Science'], ['Amit Patel', 'amit@system.com', '9000000004', 'Web Development']];
  for (const t of trainerData) await run(`INSERT INTO users (name,email,phone,department,password,role,approved) VALUES (?,?,?,?,?,?,?)`, [...t, hash, 'trainer', 1]);

  const studentData = [['Ananya Singh', 'ananya@student.com', '9100000001', 'Computer Science', 1], ['Rahul Verma', 'rahul@student.com', '9100000002', 'Information Technology', 1], ['Sneha Reddy', 'sneha@student.com', '9100000003', 'Electronics', 1], ['Karan Gupta', 'karan@student.com', '9100000004', 'Mechanical', 1], ['Divya Nair', 'divya@student.com', '9100000005', 'Data Science', 1], ['Arjun Das', 'arjun@student.com', '9100000006', 'Computer Science', 0]];
  for (const s of studentData) await run(`INSERT INTO users (name,email,phone,department,password,role,approved) VALUES (?,?,?,?,?,?,?)`, [s[0], s[1], s[2], s[3], hash, 'student', s[4]]);

  const skillData = [['Web Development', 'Full-stack development path', 'Beginner', '12 weeks'], ['Data Science', 'Data analysis and ML', 'Intermediate', '16 weeks'], ['Python Programming', 'Python from basics to expert', 'Beginner', '8 weeks'], ['Cloud Computing', 'Cloud services and architecture', 'Advanced', '10 weeks'], ['Cybersecurity', 'Security and hacking', 'Intermediate', '14 weeks'], ['Mobile App Development', 'Cross-platform apps', 'Intermediate', '12 weeks'], ['Mathematics', 'Essential math for engineers', 'Intermediate', '12 weeks']];
  for (const s of skillData) await run(`INSERT INTO skills (name,description,level,duration) VALUES (?,?,?,?)`, s);

  const courseData = [
    [1, 'HTML & CSS Fundamentals', 'Build websites', 2, '3 weeks', 'https://www.youtube.com/embed/qz0aGYrrlhU'],
    [1, 'JavaScript Mastery', 'JS ES6+ Mastery', 2, '4 weeks', 'https://www.youtube.com/embed/hdI2bqOjyQM'],
    [1, 'React.js Development', 'Modern SPAs', 3, '5 weeks', 'https://www.youtube.com/embed/bMknfKXIFA8'],
    [2, 'Data Analysis with Python', 'Pandas & NumPy', 3, '4 weeks', 'https://www.youtube.com/embed/r-uOLxNrNk8'],
    [2, 'Machine Learning Basics', 'ML fundamentals', 3, '6 weeks', 'https://www.youtube.com/embed/GwIo3gDZCVQ'],
    [3, 'Python Basics', 'Python core', 2, '3 weeks', 'https://www.youtube.com/embed/rfscVS0vtbw'],
    [3, 'Python Advanced', 'Advanced patterns', 4, '5 weeks', 'https://www.youtube.com/embed/8yU5M0Lz480'],
    [4, 'AWS Essentials', 'AWS core', 4, '5 weeks', 'https://www.youtube.com/embed/Z3SYDTMP3ME'],
    [4, 'Docker & Kubernetes', 'Containerization', 4, '5 weeks', 'https://www.youtube.com/embed/X48VuDVv0do'],
    [5, 'Network Security', 'Infosec basics', 2, '7 weeks', 'https://www.youtube.com/embed/3Kq1MIfTWCE'],
    [6, 'React Native Development', 'Hybrid mobile', 3, '6 weeks', 'https://www.youtube.com/embed/gvkqptnpcww'],
    [7, 'Calculus for AI', 'Derivatives & Integrals', 3, '4 weeks', 'https://www.youtube.com/embed/WUvTyaaNkzM'],
    [7, 'Linear Algebra', 'Matrices & Vectors', 3, '4 weeks', 'https://www.youtube.com/embed/fNk_zzaMoSs']
  ];
  for (const c of courseData) await run(`INSERT INTO courses (skill_id,title,description,trainer_id,duration,video_url) VALUES (?,?,?,?,?,?)`, c);

  const qData = [
    [1, "What does HTML stand for?", "Hyper Text Markup Language", "High Tech Multi Language", "Home Tool Markup Language", "Hyperlink Text Mark Language", "A"],
    [1, "Which CSS property is used to change text color?", "font-colorText", "fgcolor", "color", "text-color", "C"],
    [2, "Which company developed React?", "Google", "Facebook", "Microsoft", "Twitter", "B"],
    [2, "What is a React component?", "A piece of UI", "A database table", "A server route", "A style rule", "A"]
  ];
  for (const q of qData) await run(`INSERT INTO questions (course_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)`, q);

  const enrollData = [[5, 1, 100, 'Completed', 92, 'Completed', '2025-12-01'], [5, 2, 75, 'Submitted', 0, 'In Progress', null], [5, 6, 100, 'Completed', 88, 'Completed', '2025-11-15'], [6, 1, 60, 'Submitted', 0, 'In Progress', null], [6, 4, 40, 'Pending', 0, 'In Progress', null], [7, 3, 90, 'Submitted', 85, 'In Progress', null], [7, 5, 20, 'Pending', 0, 'In Progress', null], [8, 8, 50, 'Pending', 0, 'In Progress', null], [9, 9, 100, 'Completed', 95, 'Completed', '2025-10-20'], [9, 2, 30, 'Pending', 0, 'In Progress', null]];
  for (const e of enrollData) await run(`INSERT INTO enrollments (student_id,course_id,progress,assignment_status,exam_result,status,completed_at) VALUES (?,?,?,?,?,?,?)`, e);

  const certData = [[5, 1, 'CERT-WD-001', '2025-12-01', '2027-12-01'], [5, 6, 'CERT-PY-001', '2025-11-15', '2027-11-15'], [9, 9, 'CERT-CS-001', '2025-10-20', '2027-10-20']];
  for (const c of certData) await run(`INSERT INTO certificates (student_id,course_id,certificate_code,issued_at,expiry_at) VALUES (?,?,?,?,?)`, c);

  const notifData = [[5, 'Welcome! Browse skills to start.'], [5, 'Completed HTML & CSS. Certificate ready.'], [5, 'JS progress 75%.'], [6, 'Welcome! Explore today.'], [7, 'Almost done with React!'], [9, 'Congrats on completing Security!']];
  for (const n of notifData) await run(`INSERT INTO notifications (user_id,message) VALUES (?,?)`, n);

  console.log('✅ Database seeded');
}

// Auth middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
}
function authorize(...roles) { return (req, res, next) => { if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' }); next(); }; }

// ── AUTH ──
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, department, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
    const hash = bcrypt.hashSync(password, 10);
    const result = await run(`INSERT INTO users (name,email,phone,department,password,role,approved) VALUES (?,?,?,?,?,?,?)`, [name, email, phone || '', department || '', hash, role, role === 'student' ? 1 : 0]);
    await sendNotification(result.lastInsertRowid, 'Welcome to Skillzy! Explore our courses to start your journey.');
    res.json({ message: 'Registration successful', userId: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.approved) return res.status(403).json({ error: 'Account pending approval' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } });
});

// ── VERIFICATION (PUBLIC) ──
app.get('/api/verify/:code', async (req, res) => {
  const cert = await get(`
    SELECT cert.*, u.name as student_name, c.title as course_title, s.name as skill_name, s.level as skill_level, e.exam_result, e.completed_at
    FROM certificates cert
    JOIN users u ON cert.student_id = u.id
    JOIN courses c ON cert.course_id = c.id
    JOIN skills s ON c.skill_id = s.id
    JOIN enrollments e ON cert.student_id = e.student_id AND cert.course_id = e.course_id
    WHERE cert.certificate_code = ?
  `, [req.params.code]);
  if (!cert) return res.status(404).json({ error: 'Invalid certificate code' });
  res.json(cert);
});

// ── PROFILE ──
app.get('/api/profile', authenticate, async (req, res) => { res.json(await get('SELECT id,name,email,phone,department,role,created_at FROM users WHERE id=?', [req.user.id])); });
app.put('/api/profile', authenticate, async (req, res) => { const { name, phone, department } = req.body; await run('UPDATE users SET name=?,phone=?,department=? WHERE id=?', [name, phone, department, req.user.id]); res.json({ message: 'Profile updated' }); });
app.put('/api/profile/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await get('SELECT password FROM users WHERE id=?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ error: 'Current password is incorrect' });
  await run('UPDATE users SET password=? WHERE id=?', [bcrypt.hashSync(newPassword, 10), req.user.id]); res.json({ message: 'Password changed' });
});

// ── NOTIFICATIONS ──
app.get('/api/notifications', authenticate, async (req, res) => { res.json(await all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC', [req.user.id])); });
app.put('/api/notifications/:id/read', authenticate, async (req, res) => { await run('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]); res.json({ message: 'Read' }); });

// ── SKILLS ──
app.get('/api/skills', authenticate, async (req, res) => { res.json(await all('SELECT s.*, (SELECT COUNT(*) FROM courses WHERE skill_id=s.id) as course_count FROM skills s ORDER BY s.name')); });
app.get('/api/skills/:id', authenticate, async (req, res) => {
  const skill = await get('SELECT * FROM skills WHERE id=?', [req.params.id]);
  if (!skill) return res.status(404).json({ error: 'Not found' });
  const courses = await all('SELECT c.*, u.name as trainer_name FROM courses c LEFT JOIN users u ON c.trainer_id=u.id WHERE c.skill_id=?', [req.params.id]);
  res.json({ ...skill, courses });
});
app.post('/api/skills', authenticate, authorize('admin'), async (req, res) => { const { name, description, level, duration } = req.body; const r = await run('INSERT INTO skills (name,description,level,duration) VALUES (?,?,?,?)', [name, description, level, duration]); res.json({ message: 'Skill added', id: r.lastInsertRowid }); });
app.put('/api/skills/:id', authenticate, authorize('admin'), async (req, res) => { const { name, description, level, duration } = req.body; await run('UPDATE skills SET name=?,description=?,level=?,duration=? WHERE id=?', [name, description, level, duration, req.params.id]); res.json({ message: 'Skill updated' }); });
app.delete('/api/skills/:id', authenticate, authorize('admin'), async (req, res) => { await run('DELETE FROM skills WHERE id=?', [req.params.id]); res.json({ message: 'Skill deleted' }); });

// ── ASSESSMENTS ──
app.get('/api/assessments/:courseId', authenticate, async (req, res) => {
  const qs = await all('SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE course_id=?', [req.params.courseId]);
  res.json(qs);
});

app.post('/api/assessments/:courseId/submit', authenticate, async (req, res) => {
  const { answers } = req.body;
  const qs = await all('SELECT id, question, option_a, option_b, option_c, option_d, correct_option FROM questions WHERE course_id=?', [req.params.courseId]);

  let score = 0;
  const results = qs.map(q => {
    const studentAnswer = answers[q.id];
    const isCorrect = studentAnswer === q.correct_option;
    if (isCorrect) score++;
    return {
      id: q.id,
      question: q.question,
      options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
      studentAnswer,
      correctOption: q.correct_option,
      isCorrect
    };
  });

  const percent = Math.round((score / qs.length) * 100);

  if (percent >= 60) {
    await run("UPDATE enrollments SET exam_result=?, status='Completed', progress=100, completed_at=datetime('now') WHERE student_id=? AND course_id=?", [percent, req.user.id, req.params.courseId]);
    const existingCert = await get('SELECT id FROM certificates WHERE student_id=? AND course_id=?', [req.user.id, req.params.courseId]);
    if (!existingCert) {
      const code = 'CERT-' + Date.now().toString(36).toUpperCase();
      await run("INSERT INTO certificates (student_id, course_id, certificate_code, expiry_at) VALUES (?,?,?,datetime('now','+2 years'))", [req.user.id, req.params.courseId, code]);
      await sendNotification(req.user.id, `🎉 Awesome! You passed the assessment with ${percent}%. Your certificate is now available: ${code}`);
    }
    res.json({ success: true, percent, results, message: "Passed! Certificate updated." });
  } else {
    await run("UPDATE enrollments SET exam_result=? WHERE student_id=? AND course_id=?", [percent, req.user.id, req.params.courseId]);
    res.json({ success: false, percent, results, message: "Score below 60%. Please try again." });
  }
});

// ── COURSES ──
app.get('/api/courses', authenticate, async (req, res) => { res.json(await all('SELECT c.*, s.name as skill_name, u.name as trainer_name FROM courses c JOIN skills s ON c.skill_id=s.id LEFT JOIN users u ON c.trainer_id=u.id ORDER BY c.title')); });
app.get('/api/trainer/courses', authenticate, authorize('trainer'), async (req, res) => { res.json(await all('SELECT c.*, s.name as skill_name, (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) as enrolled_count FROM courses c JOIN skills s ON c.skill_id=s.id WHERE c.trainer_id=?', [req.user.id])); });
app.post('/api/trainer/courses', authenticate, authorize('trainer'), async (req, res) => { const { skill_id, title, description, duration } = req.body; const r = await run('INSERT INTO courses (skill_id,title,description,trainer_id,duration) VALUES (?,?,?,?,?)', [skill_id, title, description, req.user.id, duration]); res.json({ message: 'Course added', id: r.lastInsertRowid }); });
app.put('/api/trainer/courses/:id', authenticate, authorize('trainer'), async (req, res) => { const { title, description, duration } = req.body; await run('UPDATE courses SET title=?,description=?,duration=? WHERE id=? AND trainer_id=?', [title, description, duration, req.params.id, req.user.id]); res.json({ message: 'Course updated' }); });
app.get('/api/trainer/courses/:id/students', authenticate, authorize('trainer'), async (req, res) => { res.json(await all('SELECT u.id,u.name,u.email,u.department,e.progress,e.assignment_status,e.exam_result,e.status,e.enrolled_at FROM enrollments e JOIN users u ON e.student_id=u.id WHERE e.course_id=?', [req.params.id])); });

// ── QUIZ MANAGEMENT (TRAINER) ──
app.get('/api/trainer/courses/:courseId/questions', authenticate, authorize('trainer'), async (req, res) => {
  const course = await get('SELECT trainer_id FROM courses WHERE id=?', [req.params.courseId]);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (course.trainer_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  res.json(await all('SELECT * FROM questions WHERE course_id=?', [req.params.courseId]));
});

app.post('/api/trainer/courses/:courseId/questions', authenticate, authorize('trainer'), async (req, res) => {
  const course = await get('SELECT trainer_id FROM courses WHERE id=?', [req.params.courseId]);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (course.trainer_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  const { question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  const r = await run('INSERT INTO questions (course_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)', [req.params.courseId, question, option_a, option_b, option_c, option_d, correct_option]);
  res.json({ message: 'Question added', id: r.lastInsertRowid });
});

app.put('/api/trainer/questions/:id', authenticate, authorize('trainer'), async (req, res) => {
  const q = await get('SELECT c.trainer_id FROM questions q JOIN courses c ON q.course_id = c.id WHERE q.id=?', [req.params.id]);
  if (!q || q.trainer_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  const { question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  await run('UPDATE questions SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_option=? WHERE id=?', [question, option_a, option_b, option_c, option_d, correct_option, req.params.id]);
  res.json({ message: 'Question updated' });
});

app.delete('/api/trainer/questions/:id', authenticate, authorize('trainer'), async (req, res) => {
  const q = await get('SELECT c.trainer_id FROM questions q JOIN courses c ON q.course_id = c.id WHERE q.id=?', [req.params.id]);
  if (!q || q.trainer_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  await run('DELETE FROM questions WHERE id=?', [req.params.id]);
  res.json({ message: 'Question deleted' });
});

app.put('/api/trainer/enrollments/:studentId/:courseId', authenticate, authorize('trainer'), async (req, res) => {
  const { progress, assignment_status, exam_result, status } = req.body;
  const parts = [], params = [];
  if (progress !== undefined) { parts.push('progress=?'); params.push(progress); }
  if (assignment_status) { parts.push('assignment_status=?'); params.push(assignment_status); }
  if (exam_result !== undefined) { parts.push('exam_result=?'); params.push(exam_result); }
  if (status) { parts.push('status=?'); params.push(status); }
  if (status === 'Completed') parts.push("completed_at=datetime('now')");
  params.push(req.params.studentId, req.params.courseId);
  await run(`UPDATE enrollments SET ${parts.join(',')} WHERE student_id=? AND course_id=?`, params);
  res.json({ message: 'Updated' });
});

// ── ENROLLMENTS ──
app.post('/api/enrollments', authenticate, authorize('student'), async (req, res) => {
  try {
    await run('INSERT INTO enrollments (student_id,course_id) VALUES (?,?)', [req.user.id, req.body.course_id]);
    await sendNotification(req.user.id, 'Successfully enrolled! Happy learning! 🚀');
    res.json({ message: 'Enrolled' });
  } catch (e) { if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already enrolled' }); res.status(500).json({ error: e.message }); }
});

app.post('/api/courses/:id/video-complete', authenticate, authorize('student'), async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.user.id;

  const enrollment = await get('SELECT * FROM enrollments WHERE student_id=? AND course_id=?', [studentId, courseId]);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  if (enrollment.status === 'Completed') return res.json({ message: 'Course already completed' });

  await run("UPDATE enrollments SET status='Completed', progress=100, completed_at=datetime('now') WHERE student_id=? AND course_id=?", [studentId, courseId]);

  // Check if certificate already exists
  const existingCert = await get('SELECT id FROM certificates WHERE student_id=? AND course_id=?', [studentId, courseId]);
  if (!existingCert) {
    const code = 'CERT-VID-' + Date.now().toString(36).toUpperCase();
    await run("INSERT INTO certificates (student_id, course_id, certificate_code, expiry_at) VALUES (?,?,?,datetime('now','+2 years'))", [studentId, courseId, code]);
    await sendNotification(studentId, `🎓 Congratulations! You've finished all lessons for this course. Your certificate ${code} is ready!`);
  }

  res.json({ success: true, message: "Course completed! Certificate available.", code: existingCert ? 'ALREADY_EXISTS' : undefined });
});

app.get('/api/enrollments', authenticate, authorize('student'), async (req, res) => { res.json(await all('SELECT e.*, c.title as course_title, c.description as course_description, s.name as skill_name, u.name as trainer_name FROM enrollments e JOIN courses c ON e.course_id=c.id JOIN skills s ON c.skill_id=s.id LEFT JOIN users u ON c.trainer_id=u.id WHERE e.student_id=? ORDER BY e.enrolled_at DESC', [req.user.id])); });

// ── CERTIFICATES ──
app.get('/api/certificates', authenticate, authorize('student'), async (req, res) => { res.json(await all('SELECT cert.*, c.title as course_title, s.name as skill_name FROM certificates cert JOIN courses c ON cert.course_id=c.id JOIN skills s ON c.skill_id=s.id WHERE cert.student_id=? ORDER BY cert.issued_at DESC', [req.user.id])); });
app.get('/api/certificates/:id/download', authenticate, async (req, res) => {
  const cert = await get(`
    SELECT cert.*, c.title as course_title, s.name as skill_name, u.name as student_name, e.exam_result, e.completed_at
    FROM certificates cert
    JOIN courses c ON cert.course_id = c.id
    JOIN skills s ON c.skill_id = s.id
    JOIN users u ON cert.student_id = u.id
    JOIN enrollments e ON cert.student_id = e.student_id AND cert.course_id = e.course_id
    WHERE cert.id = ?
  `, [req.params.id]);
  if (!cert) return res.status(404).json({ error: 'Not found' });

  const verifyUrl = `${req.protocol}://${req.get('host')}/verify?code=${cert.certificate_code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=certificate-${cert.certificate_code}.pdf`);
  doc.pipe(res);

  // --- Background & Decorative Borders ---
  // Premium Gradient-like Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

  // Decorative geometric shapes (Modern/Premium look)
  doc.save();
  doc.fillColor('#6366f1').opacity(0.05);
  doc.circle(0, 0, 200).fill();
  doc.circle(doc.page.width, doc.page.height, 150).fill();
  doc.restore();

  // Outer Deep Blue Border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#0f172a');

  // Inner Subtle Accent Border
  doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(1).stroke('#6366f1');

  // Decorative corners
  const drawCorner = (x, y, rotation) => {
    doc.save().translate(x, y).rotate(rotation);
    doc.lineWidth(2).strokeColor('#d4af37');
    doc.moveTo(0, 0).lineTo(40, 0).stroke();
    doc.moveTo(0, 0).lineTo(0, 40).stroke();
    doc.restore();
  };
  drawCorner(30, 30, 0); drawCorner(doc.page.width - 30, 30, 90);
  drawCorner(doc.page.width - 30, doc.page.height - 30, 180); drawCorner(30, doc.page.height - 30, 270);

  // --- Header Section ---
  doc.moveDown(4);
  doc.fontSize(48).font('Helvetica-Bold').fillColor('#1a2a4b').text('CERTIFICATE', { align: 'center', characterSpacing: 4 });
  doc.fontSize(16).font('Helvetica').fillColor('#b8860b').text('OF PROFESSIONAL ACHIEVEMENT', { align: 'center', characterSpacing: 6 });

  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica-Oblique').fillColor('#4a5568').text('This prestigious award is presented to', { align: 'center' });

  // --- Recipient Name ---
  doc.moveDown(0.8);
  doc.fontSize(42).font('Helvetica-Bold').fillColor('#1a2a4b').text(cert.student_name, { align: 'center' });

  // Decorative line under name
  const nameWidth = doc.widthOfString(cert.student_name);
  doc.moveTo(doc.page.width / 2 - nameWidth / 2 - 20, doc.y + 5)
    .lineTo(doc.page.width / 2 + nameWidth / 2 + 20, doc.y + 5)
    .lineWidth(1).stroke('#d4af37');

  // --- Course Details ---
  doc.moveDown(1.5);
  doc.fontSize(14).font('Helvetica').fillColor('#4a5568').text('for successfully completing the comprehensive certification in', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#1a2a4b').text(`"${cert.course_title}"`, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#b8860b').text(`Mastery Level: ${cert.skill_name}`, { align: 'center' });

  // --- Footer / Signatures ---
  const footerY = 460;

  // Gold Seal (Vector-style)
  const sealX = doc.page.width / 2;
  const sealY = footerY - 10;
  doc.save();
  doc.circle(sealX, sealY, 45).lineWidth(2).strokeColor('#d4af37').stroke();
  doc.circle(sealX, sealY, 40).dash(2, { space: 2 }).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#d4af37').text('OFFICIAL', sealX - 25, sealY - 15);
  doc.fontSize(12).text('SEAL', sealX - 16, sealY);
  doc.fontSize(8).text('CERTIFIED', sealX - 22, sealY + 15);
  doc.restore();

  // Signature Left (Course Trainer)
  doc.save();
  doc.font('Times-Italic').fontSize(22).fillColor('#1a2a4b').text('Sarah Jenkins', 100, footerY + 15, { width: 150, align: 'center' });
  doc.moveTo(100, footerY + 40).lineTo(250, footerY + 40).lineWidth(1).stroke('#1a2a4b');
  doc.fontSize(11).font('Helvetica-Bold').text('Dr. Sarah Jenkins', 100, footerY + 45, { width: 150, align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Lead Course Instructor', 100, footerY + 58, { width: 150, align: 'center' });
  doc.restore();

  // Signature Right (Academic Director)
  doc.save();
  doc.font('Times-Italic').fontSize(22).fillColor('#1a2a4b').text('Michael Ross', doc.page.width - 250, footerY + 15, { width: 150, align: 'center' });
  doc.moveTo(doc.page.width - 250, footerY + 40).lineTo(doc.page.width - 100, footerY + 40).lineWidth(1).stroke('#1a2a4b');
  doc.fontSize(11).font('Helvetica-Bold').text('Prof. Michael Ross', doc.page.width - 250, footerY + 45, { width: 150, align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Academic Director', doc.page.width - 250, footerY + 58, { width: 150, align: 'center' });
  doc.restore();


  // Meta info (QR Section)
  const metaX = doc.page.width - 140;
  const metaY = 40;
  doc.image(qrDataUrl, metaX, metaY, { width: 80 });
  doc.fontSize(7).fillColor('#64748b').text(`Verify ID: ${cert.certificate_code}`, metaX, metaY + 85, { width: 80, align: 'center' });

  // Date Section
  doc.fontSize(10).fillColor('#1a2a4b').font('Helvetica-Bold').text(`ISSUED: ${new Date(cert.issued_at).toLocaleDateString()}`, 100, 40);
  doc.text(`EXPIRES: ${new Date(cert.expiry_at).toLocaleDateString()}`, 100, 55);
  doc.text(`COMPLETED: ${cert.completed_at ? new Date(cert.completed_at).toLocaleDateString() : 'N/A'}`, 100, 70);

  doc.end();
});

// ── DASHBOARDS ──
app.get('/api/student/dashboard', authenticate, authorize('student'), async (req, res) => {
  const id = req.user.id;
  const enrollments = await all('SELECT e.*, c.title as course_title, s.name as skill_name FROM enrollments e JOIN courses c ON e.course_id=c.id JOIN skills s ON c.skill_id=s.id WHERE e.student_id=?', [id]);
  res.json({
    totalEnrolled: enrollments.length,
    completed: enrollments.filter(e => e.status === 'Completed').length,
    certCount: (await get('SELECT COUNT(*) as c FROM certificates WHERE student_id=?', [id])).c,
    inProgress: enrollments.filter(e => e.status === 'In Progress').length,
    recentEnrollments: enrollments.slice(0, 5),
    recentCertificates: await all('SELECT cert.*, c.title as course_title, s.name as skill_name FROM certificates cert JOIN courses c ON cert.course_id=c.id JOIN skills s ON c.skill_id=s.id WHERE cert.student_id=? ORDER BY cert.issued_at DESC LIMIT 3', [id]),
    unreadNotifs: (await get('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0', [id])).c,
    skillStats: await all('SELECT s.name, COUNT(*) as count FROM enrollments e JOIN courses c ON e.course_id=c.id JOIN skills s ON c.skill_id=s.id WHERE e.student_id=? GROUP BY s.name', [id])
  });
});

app.get('/api/trainer/dashboard', authenticate, authorize('trainer'), async (req, res) => {
  const id = req.user.id;
  res.json({
    courseCount: (await get('SELECT COUNT(*) as c FROM courses WHERE trainer_id=?', [id])).c,
    totalStudents: (await get('SELECT COUNT(DISTINCT e.student_id) as c FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE c.trainer_id=?', [id])).c,
    completedStudents: (await get("SELECT COUNT(*) as c FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE c.trainer_id=? AND e.status='Completed'", [id])).c,
    courses: await all('SELECT c.*, s.name as skill_name, (SELECT COUNT(*) FROM enrollments WHERE course_id=c.id) as enrolled_count FROM courses c JOIN skills s ON c.skill_id=s.id WHERE c.trainer_id=?', [id])
  });
});

app.get('/api/admin/dashboard', authenticate, authorize('admin'), async (req, res) => {
  res.json({
    totalStudents: (await get("SELECT COUNT(DISTINCT id) as c FROM users WHERE role='student'")).c,
    totalTrainers: (await get("SELECT COUNT(DISTINCT id) as c FROM users WHERE role='trainer'")).c,
    totalSkills: (await get('SELECT COUNT(DISTINCT id) as c FROM skills')).c,
    totalCourses: (await get('SELECT COUNT(DISTINCT id) as c FROM courses')).c,
    totalCertificates: (await get('SELECT COUNT(DISTINCT id) as c FROM certificates')).c,
    totalEnrollments: (await get('SELECT COUNT(DISTINCT student_id || "-" || course_id) as c FROM enrollments')).c,
    pendingApprovals: (await get("SELECT COUNT(DISTINCT id) as c FROM users WHERE approved=0")).c,
    recentCertificates: await all('SELECT cert.*, u.name as student_name, c.title as course_title FROM certificates cert JOIN users u ON cert.student_id=u.id JOIN courses c ON cert.course_id=c.id ORDER BY cert.issued_at DESC LIMIT 5'),
    growthData: await all("SELECT strftime('%Y-%m', enrolled_at) as month, COUNT(DISTINCT student_id || '-' || course_id) as count FROM enrollments GROUP BY month ORDER BY month DESC LIMIT 6")
  });
});

// ── ADMIN ──
app.get('/api/admin/users', authenticate, authorize('admin'), async (req, res) => {
  const role = req.query.role;
  res.json(role ? await all('SELECT id,name,email,phone,department,role,approved,created_at FROM users WHERE role=? ORDER BY name', [role]) : await all('SELECT id,name,email,phone,department,role,approved,created_at FROM users ORDER BY role,name'));
});
app.put('/api/admin/users/:id/approve', authenticate, authorize('admin'), async (req, res) => { await run('UPDATE users SET approved=1 WHERE id=?', [req.params.id]); await run('INSERT INTO notifications (user_id,message) VALUES (?,?)', [req.params.id, 'Your account has been approved!']); res.json({ message: 'Approved' }); });
app.delete('/api/admin/users/:id', authenticate, authorize('admin'), async (req, res) => { await run("DELETE FROM users WHERE id=? AND role!='admin'", [req.params.id]); res.json({ message: 'Deleted' }); });

// ── REPORTS ──
app.get('/api/admin/reports/students', authenticate, authorize('admin'), async (req, res) => { res.json(await all("SELECT u.name,u.email,u.department, COUNT(DISTINCT e.id) as total_courses, SUM(CASE WHEN e.status='Completed' THEN 1 ELSE 0 END) as completed_courses, ROUND(AVG(e.progress),1) as avg_progress, ROUND(AVG(CASE WHEN e.exam_result>0 THEN e.exam_result END),1) as avg_exam_score FROM users u LEFT JOIN enrollments e ON u.id=e.student_id WHERE u.role='student' AND u.approved=1 GROUP BY u.id ORDER BY u.name")); });
app.get('/api/admin/reports/certifications', authenticate, authorize('admin'), async (req, res) => { res.json(await all('SELECT u.name as student_name, c.title as course_title, s.name as skill_name, cert.certificate_code, MIN(cert.issued_at) as issued_at, cert.expiry_at FROM certificates cert JOIN users u ON cert.student_id=u.id JOIN courses c ON cert.course_id=c.id JOIN skills s ON c.skill_id=s.id GROUP BY u.id, c.id ORDER BY issued_at DESC')); });
app.get('/api/admin/reports/skills', authenticate, authorize('admin'), async (req, res) => { res.json(await all("SELECT s.name as skill_name, s.level, COUNT(DISTINCT c.id) as total_courses, COUNT(DISTINCT e.student_id) as total_students, SUM(CASE WHEN e.status='Completed' THEN 1 ELSE 0 END) as completions, ROUND(AVG(e.progress),1) as avg_progress FROM skills s LEFT JOIN courses c ON s.id=c.skill_id LEFT JOIN enrollments e ON c.id=e.course_id GROUP BY s.id ORDER BY s.name")); });

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// Start
initDatabase().then(() => {
  // AI Skill Gap Analyzer API
  app.post('/api/ai/skill-gap', authenticate, async (req, res) => {
    const { targetRole } = req.body;
    const userSkills = await all(`
    SELECT DISTINCT s.name, s.level 
    FROM certificates cert 
    JOIN courses c ON cert.course_id = c.id 
    JOIN skills s ON c.skill_id = s.id 
    WHERE cert.student_id = ?`, [req.user.id]);

    const roleRequirements = {
      'Full Stack Developer': ['Web Development', 'Python Programming', 'Data Science'],
      'Frontend Specialist': ['Web Development'],
      'Backend Architect': ['Web Development', 'Cloud Computing', 'Python Programming'],
      'Data Scientist': ['Data Science', 'Python Programming'],
      'AI/ML Engineer': ['Data Science', 'Python Programming', 'Mathematics'],
      'Cloud Architect': ['Cloud Computing', 'Web Development'],
      'Security Analyst': ['Cybersecurity', 'Python Programming'],
      'Mobile Developer': ['Mobile App Development', 'Web Development']
    };

    const requirements = roleRequirements[targetRole] || [];
    const matches = [];
    const missing = [];

    requirements.forEach(reqName => {
      const found = userSkills.find(s => s.name.toLowerCase() === reqName.toLowerCase());
      if (found) matches.push(reqName);
      else missing.push(reqName);
    });

    // Recommend courses for missing skills
    let recommendations = [];
    if (missing.length > 0) {
      const placeholders = missing.map(() => '?').join(',');
      recommendations = await all(`
      SELECT c.*, s.name as skill_name 
      FROM courses c 
      JOIN skills s ON c.skill_id = s.id 
      WHERE s.name IN (${placeholders})`, missing);
    }

    res.json({
      role: targetRole,
      matchPercentage: requirements.length ? Math.round((matches.length / requirements.length) * 100) : 0,
      matches,
      missing,
      recommendations
    });
  });

  // Helper to generate questions based on topic
  function generateAIQuestions(topic) {
    const questionPool = {
      'Python': [
        { q: "What is the correct file extension for Python files?", a: ".py", b: ".pyt", c: ".pt", d: ".python", correct: "A" },
        { q: "Which keyword is used to define a function in Python?", a: "func", b: "define", c: "def", d: "function", correct: "C" },
        { q: "How do you start a comment in Python?", a: "//", b: "/*", c: "--", d: "#", correct: "D" },
        { q: "Which of these is a mutable data type in Python?", a: "List", b: "Tuple", c: "String", d: "Integer", correct: "A" },
        { q: "What is the output of 2**3 in Python?", a: "5", b: "6", c: "8", d: "9", correct: "C" }
      ],
      'Web Development': [
        { q: "What does CSS stand for?", a: "Creative Style Sheets", b: "Cascading Style Sheets", c: "Computer Style Sheets", d: "Colorful Style Sheets", correct: "B" },
        { q: "Which HTML tag is used to define an internal style sheet?", a: "<css>", b: "<script>", c: "<style>", d: "<design>", correct: "C" },
        { q: "Which property is used to change the background color?", a: "color", b: "bgcolor", c: "background-color", d: "surface-color", correct: "C" },
        { q: "How do you select an element with id 'demo' in CSS?", a: ".demo", b: "#demo", c: "demo", d: "*demo", correct: "B" },
        { q: "Which HTML attribute is used to define inline styles?", a: "class", b: "styles", c: "font", d: "style", correct: "D" }
      ],
      'JavaScript': [
        { q: "Inside which HTML element do we put the JavaScript?", a: "<js>", b: "<scripting>", c: "<script>", d: "<javascript>", correct: "C" },
        { q: "How do you write 'Hello World' in an alert box?", a: "msg('Hello World')", b: "alertBox('Hello World')", c: "msgBox('Hello World')", d: "alert('Hello World')", correct: "D" },
        { q: "How do you create a function in JavaScript?", a: "function:myFunction()", b: "function = myFunction()", c: "function myFunction()", d: "def myFunction()", correct: "C" },
        { q: "How do you call a function named 'myFunction'?", a: "call myFunction()", b: "myFunction()", c: "call function myFunction()", d: "execute myFunction()", correct: "B" },
        { q: "How to write an IF statement in JavaScript?", a: "if i = 5 then", b: "if (i == 5)", c: "if i == 5 then", d: "if i = 5", correct: "B" }
      ]
    };

    const keys = Object.keys(questionPool);
    const match = keys.find(k => topic.toLowerCase().includes(k.toLowerCase()));
    
    let selectedSet = match ? questionPool[match] : [
      { q: "What does URL stand for?", a: "Universal Resource Locator", b: "Uniform Resource Locator", c: "Unit Resource Link", d: "Universal Resource Link", correct: "B" },
      { q: "Which of these is an Operating System?", a: "HTTP", b: "SQL", c: "Linux", d: "FTP", correct: "C" },
      { q: "What is the main purpose of a database?", a: "Style data", b: "Store and manage data", c: "Secure a network", d: "Compile code", correct: "B" },
      { q: "What does UI stand for?", a: "User Interface", b: "User Intelligence", c: "Unit Interaction", d: "Universal Interface", correct: "A" },
      { q: "Which protocol is used for secure web browsing?", a: "HTTP", b: "FTP", c: "HTTPS", d: "SMTP", correct: "C" }
    ];

    return selectedSet.map((q, i) => ({
      id: `gen-${Date.now()}-${i}`,
      ...q
    }));
  }

  // AI Quiz Question Generator API
  app.post('/api/ai/generate-questions', authenticate, authorize('trainer'), async (req, res) => {
    const { courseId, topic } = req.body;
    const course = await get('SELECT title FROM courses WHERE id = ?', [courseId]);
    const activeTopic = topic || course?.title || 'General Technology';
    const questions = generateAIQuestions(activeTopic);
    res.json({ topic: activeTopic, questions });
  });

  // AI Bulk Quiz Generator API
  app.post('/api/ai/generate-all-quizzes', authenticate, authorize('admin'), async (req, res) => {
    try {
      const allCourses = await all('SELECT id, title FROM courses');
      let createdCount = 0;
      let skippedCount = 0;

      for (const course of allCourses) {
        const qCount = await get('SELECT COUNT(*) as count FROM questions WHERE course_id = ?', [course.id]);
        if (qCount.count === 0) {
          const generated = generateAIQuestions(course.title);
          for (const q of generated) {
            await run('INSERT INTO questions (course_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?,?,?,?,?,?,?)', 
              [course.id, q.q, q.a, q.b, q.c, q.d, q.correct]);
          }
          createdCount++;
        } else {
          skippedCount++;
        }
      }
      res.json({ message: `Bulk generation complete. Quizzes created for ${createdCount} courses. ${skippedCount} courses already had quizzes.`, createdCount, skippedCount });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}).catch(err => { console.error('Failed to initialize database:', err); process.exit(1); });
