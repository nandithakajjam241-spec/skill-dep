
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_PATH);

const videoUpdates = [
    { id: 15, url: 'https://www.youtube.com/embed/_uQrJ0TkZlc' }, // Python
    { id: 16, url: 'https://www.youtube.com/embed/A74TOX803D0' }, // Java
    { id: 17, url: 'https://www.youtube.com/embed/HXV3zeQKqGY' }, // DBMS
    { id: 18, url: 'https://www.youtube.com/embed/tyDKR4FG3Yw' }, // Discrete Math
    { id: 19, url: 'https://www.youtube.com/embed/KJgsSF0SqIQ' }, // C Language
    { id: 20, url: 'https://www.youtube.com/embed/8hly31xKli0' }, // Data Structures
    { id: 21, url: 'https://www.youtube.com/embed/26QPDBe-NB8' }  // Operating Systems
];

db.serialize(() => {
    const stmt = db.prepare("UPDATE courses SET video_url = ? WHERE id = ?");
    for (const update of videoUpdates) {
        stmt.run(update.url, update.id, (err) => {
            if (err) console.error(`Error updating course ${update.id}:`, err);
            else console.log(`✅ Updated course ${update.id} with video ${update.url}`);
        });
    }
    stmt.finalize(() => {
        console.log("All videos updated.");
        db.close();
    });
});
