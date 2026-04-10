const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'calendar_data.json');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// 資料庫結構 (整合任務至 events 中)
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ events: [], restrictions: [], members: [] }, null, 2));
}

const getData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

app.get('/api/all', (req, res) => res.json(getData()));

app.post('/api/save_all', (req, res) => {
    try {
        saveData(req.body);
        res.json({ message: 'OK' });
    } catch (e) {
        res.status(500).json({ error: "儲存失敗" });
    }
});

app.listen(PORT, () => console.log(`系統執行中: http://localhost:${PORT}`));