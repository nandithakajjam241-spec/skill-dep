const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');

const videoUpdates = [
    { id: 1, url: 'https://www.youtube.com/embed/qz0aGYrrlhU' }, // HTML Full Course
    { id: 2, url: 'https://www.youtube.com/embed/hdI2bqOjyQM' }, // JS Mastery
    { id: 3, url: 'https://www.youtube.com/embed/bMknfKXIFA8' }, // React Tutorial
    { id: 4, url: 'https://www.youtube.com/embed/r-uOLxNrNk8' }, // Data Analysis with Python
    { id: 5, url: 'https://www.youtube.com/embed/GwIo3gDZCVQ' }, // Machine Learning Basics
    { id: 6, url: 'https://www.youtube.com/embed/rfscVS0vtbw' }, // Python Basics
    { id: 7, url: 'https://www.youtube.com/embed/8yU5M0Lz480' }, // Python Advanced
    { id: 8, url: 'https://www.youtube.com/embed/Z3SYDTMP3ME' }, // AWS Essentials
    { id: 9, url: 'https://www.youtube.com/embed/X48VuDVv0do' }, // Docker & Kubernetes
    { id: 10, url: 'https://www.youtube.com/embed/3Kq1MIfTWCE' }, // Network Security
    { id: 11, url: 'https://www.youtube.com/embed/gvkqptnpcww' }, // React Native Development
    { id: 12, url: 'https://www.youtube.com/embed/WUvTyaaNkzM' }, // Calculus for AI
    { id: 13, url: 'https://www.youtube.com/embed/fNk_zzaMoSs' }, // Linear Algebra
    { id: 14, url: 'https://www.youtube.com/embed/rfscVS0vtbw', title: 'Python Programming' } // Fixing "Pyhton"
];

async function updateVideos() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('--- Updating Course Videos & Titles ---');
    for (const v of videoUpdates) {
        if (v.title) {
            await db.run('UPDATE courses SET video_url = ?, title = ? WHERE id = ?', [v.url, v.title, v.id]);
            console.log(`Updated course ${v.id} (Title & URL): ${v.title}`);
        } else {
            await db.run('UPDATE courses SET video_url = ? WHERE id = ?', [v.url, v.id]);
            console.log(`Updated course ${v.id} (URL Only)`);
        }
    }
    console.log('--- Done ---');
    await db.close();
}

updateVideos().catch(console.error);
