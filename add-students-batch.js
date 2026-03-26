const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_PATH);

const students = [
  { name: 'ritish', email: 'ritish123@gmail.com' },
  { name: 'uma maheshwar', email: 'uma123@gmail.com' },
  { name: 'sneha', email: 'sneha123@gmail.com' },
  { name: 'sahithi', email: 'sahithi123@gmail.com' },
  { name: 'sandeep', email: 'sandeep123@gmail.com' },
  { name: 'manohar', email: 'manohar123@gmail.com' },
  { name: 'mubeen', email: 'mubeen123@gmail.com' },
  { name: 'vasavi', email: 'vasavi123@gmail.com' },
  { name: 'vishnu', email: 'vishnu123@gmail.com' },
  { name: 'anil', email: 'anil123@gmail.com' },
  { name: 'sruthi', email: 'sruthi123@gmail.com' },
  { name: 'sai bhagavan', email: 'saibhagavan123@gmail.com' },
  { name: 'nanditha', email: 'nanditha123@gmail.com' },
  { name: 'jai krishna', email: 'jaikrishna123@gmail.com' },
  { name: 'pandey', email: 'pandey123@gmail.com' },
  { name: 'harsha', email: 'harsha123@gmail.com' },
  { name: 'pravalika', email: 'pravalika123@gmail.com' },
  { name: 'vivek', email: 'vivek123@gmail.com' },
  { name: 'manishkumar', email: 'manishkumar123@gmail.com' },
  { name: 'vishal', email: 'vishal123@gmail.com' },
  { name: 'sidharth', email: 'sidharth123@gmail.com' },
  { name: 'prisha', email: 'prisha123@gmail.com' },
  { name: 'gayathri', email: 'gayathri123@gmail.com' },
  { name: 'eshwar', email: 'eshwar123@gmail.com' },
  { name: 'gopichand', email: 'gopichand123@gmail.com' },
  { name: 'vishishta', email: 'vishishta123@gmail.com' },
  { name: 'manishgupta', email: 'manishgupta123@gmail.com' },
  { name: 'keerthana', email: 'keerthana123@gmail.com' },
  { name: 'charan', email: 'charan123@gmail.com' },
  { name: 'thanuja', email: 'thanuja123@gmail.com' }
];

const defaultPassword = 'password123';
const hash = bcrypt.hashSync(defaultPassword, 10);

db.serialize(() => {
  const stmt = db.prepare('INSERT INTO users (name, email, password, role, approved) VALUES (?, ?, ?, ?, ?)');
  
  students.forEach(student => {
    stmt.run(student.name, student.email, hash, 'student', 1, (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          console.log(`⚠️ Skip: ${student.email} already exists`);
        } else {
          console.error(`❌ Error adding ${student.email}:`, err.message);
        }
      } else {
        console.log(`✅ Added: ${student.name} (${student.email})`);
      }
    });
  });

  stmt.finalize(() => {
    console.log('\n✨ Batch insertion completed.');
    db.close();
  });
});
