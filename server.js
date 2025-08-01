const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const db = new sqlite3.Database('./users.db');

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Ініціалізація таблиці
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    arrival TEXT,
    birth TEXT
)`);

// Отримати всіх користувачів
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// Додати користувача
app.post('/api/users', (req, res) => {
    const { name, arrival, birth } = req.body;
    db.run('INSERT INTO users (name, arrival, birth) VALUES (?, ?, ?)', [name, arrival, birth], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID, name, arrival, birth });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));