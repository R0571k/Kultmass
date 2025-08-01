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

        const today = new Date();
        const result = rows.map(user => {
            let message = '';

            // Повідомлення про наближення дня народження
            if (user.birth) {
                const birthDate = new Date(user.birth);
                let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }
                const diffDays = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                if (diffDays === 3) message += 'Через 3 дні день народження! ';
                if (diffDays === 2) message += 'Через 2 дні день народження! ';
                if (diffDays === 1) message += 'Завтра день народження! ';
            }

            // Повідомлення про дату, яка відповідає кількості місяців від прибуття
            if (user.arrival) {
                const arrivalDate = new Date(user.arrival);
                // Визначаємо дату через N місяців після прибуття (N = кількість місяців)
                const monthsPassed = ((today.getFullYear() - arrivalDate.getFullYear()) * 12) + (today.getMonth() - arrivalDate.getMonth());
                if (monthsPassed > 0) {
                    let nextMonthDate = new Date(arrivalDate);
                    nextMonthDate.setMonth(arrivalDate.getMonth() + monthsPassed);
                    // Якщо вже пройшло, беремо наступний місяць
                    if (nextMonthDate < today) {
                        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                    }
                    const diffDaysMonth = Math.ceil((nextMonthDate - today) / (1000 * 60 * 60 * 24));
                    if (diffDaysMonth === 3) message += `Через 3 дні буде ${monthsPassed + 1}-й місяць з моменту прибуття! `;
                    if (diffDaysMonth === 2) message += `Через 2 дні буде ${monthsPassed + 1}-й місяць з моменту прибуття! `;
                    if (diffDaysMonth === 1) message += `Завтра буде ${monthsPassed + 1}-й місяць з моменту прибуття! `;
                }
            }

            return { ...user, message: message.trim() };
        });

        res.json(result);
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

// Очистити таблицю користувачів
app.post('/api/clear', (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM users', err => {
            if (err) return res.status(500).json({error: err.message});
            // Скидаємо AUTOINCREMENT лічильник
            db.run('DELETE FROM sqlite_sequence WHERE name="users"', err2 => {
                if (err2) return res.status(500).json({error: err2.message});
                res.json({success: true});
            });
        });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));