const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
const dbPath = path.resolve(__dirname, 'veritrust.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE,
        recipient_address TEXT,
        institution_address TEXT,
        credential_name TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

// Routes

// Save Credential Metadata
app.post('/api/credentials', (req, res) => {
    const { hash, recipient, institution, name, data } = req.body;

    if (!hash || !recipient || !institution) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT OR IGNORE INTO credentials (hash, recipient_address, institution_address, credential_name, data) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [hash, recipient, institution, name, JSON.stringify(data)], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Credential metadata saved', id: this.lastID });
    });
});

// Get Credential by Hash
app.get('/api/credentials/:hash', (req, res) => {
    const { hash } = req.params;
    const sql = `SELECT * FROM credentials WHERE hash = ?`;

    db.get(sql, [hash], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        res.json(row);
    });
});

// Get All Credentials for User
app.get('/api/user/:address', (req, res) => {
    const { address } = req.params;
    const sql = `SELECT * FROM credentials WHERE recipient_address = ?`;

    db.all(sql, [address], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get All Credentials issued by an Institution
app.get('/api/institution/:address', (req, res) => {
    const { address } = req.params;
    const sql = `SELECT hash, recipient_address, institution_address, credential_name, created_at FROM credentials WHERE institution_address = ?`;

    db.all(sql, [address], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
