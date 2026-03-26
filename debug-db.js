const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function checkCourses() {
    const db = await open({
        filename: path.join(__dirname, 'database.db'),
        driver: sqlite3.Database
    });

    const courses = await db.all('SELECT id, title, video_url FROM courses');
    console.log(JSON.stringify(courses, null, 2));
    await db.close();
}

checkCourses().catch(console.error);
