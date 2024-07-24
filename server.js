const express = require('express');
const bodyParser = require('body-parser');
const { evaluate, parse } = require('mathjs');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Initialize SQLite database (using a file-based database)
const db = new sqlite3.Database('calculator.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create history table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expression TEXT,
            result TEXT
        )`);
    }
});

app.get('/', (req, res) => {
     res.sendFile(__dirname + '/calculator.html');
});

app.post('/calculate', (req, res) => {
    try {
        const { expression } = req.body;

        // Sanitize and parse the expression
        const node = parse(expression);
        const result = node.evaluate();
        const resultString = result.toString();

        // Insert the calculation into the database
        db.run('INSERT INTO history (expression, result) VALUES (?, ?)', [expression, resultString], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ result: resultString });
        });
    } catch (error) {
        res.status(400).json({ error: 'Invalid expression' });
    }
});

app.get('/history', (req, res) => {
    db.all('SELECT expression, result FROM history ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ history: rows });
    });
});

app.get('/view-database', (req, res) => {
    db.all('SELECT * FROM history', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        let html = '<h1>Calculation History</h1><ul>';
        rows.forEach(row => {
            html += `<li>${row.expression} = ${row.result}</li>`;
        });
        html += '</ul>';
        res.send(html);
    });
});

// Endpoint to export history to a file
app.get('/export-history', (req, res) => {
    db.all('SELECT * FROM history', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const jsonData = JSON.stringify(rows, null, 2);
        fs.writeFile('history.json', jsonData, (err) => {
            if (err) {
                return res.status(500).json({ error: 'File write error' });
            }
            res.download('history.json');
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



// const express = require('express');
// const bodyParser = require('body-parser');
// const { evaluate, parse } = require('mathjs');
// const sqlite3 = require('sqlite3').verbose();
// const fs = require('fs'); // Import the fs module

// const app = express();
// const port = 3000;

// app.use(bodyParser.json());

// // Initialize SQLite database
// const db = new sqlite3.Database(':memory:'); // Using in-memory database for simplicity
// // Create history table
// db.serialize(() => {
//     db.run('CREATE TABLE history (id INTEGER PRIMARY KEY AUTOINCREMENT, expression TEXT, result TEXT)');
// });

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/calculator.html');
// });


// app.post('/calculate', (req, res) => {
//     try {
//         const { expression } = req.body;
//         // Sanitize and parse the expression
//         const node = parse(expression);
//         const result = node.evaluate();
//         const resultString = result.toString();

//         // Insert the calculation into the database
//         db.run('INSERT INTO history (expression, result) VALUES (?, ?)', [expression, resultString], function(err) {
//             if (err) {
//                 return res.status(500).json({ error: 'Database error' });
//             }

//             // Save the result to a file
//             fs.appendFile('results.txt', `Expression: ${expression}, Result: ${resultString}\n`, (err) => {
//                 if (err) {
//                     return res.status(500).json({ error: 'File write error' });
//                 }

//                 res.json({ result: resultString });
//             });
//         });
//     } catch (error) {
//         res.status(400).json({ error: 'Invalid expression' });
//     }
// });

// app.get('/history', (req, res) => {
//     db.all('SELECT expression, result FROM history ORDER BY id DESC', [], (err, rows) => {
//         if (err) {
//             return res.status(500).json({ error: 'Database error' });
//         }

//         // Format the history as a string
//         const historyString = rows.map(row => `Expression: ${row.expression}, Result: ${row.result}`).join('\n');

//         // Save the history to a file
//         fs.writeFile('history.txt', historyString, (err) => {
//             if (err) {
//                 return res.status(500).json({ error: 'File write error' });
//             }

//             res.json({ history: rows });
//         });
//     });
// });

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });
