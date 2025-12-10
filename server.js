const express = require('express');
const path = require('path');
const { getPrayerTimesForDate } = require('./src/prayerTimes');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for today's prayer times
app.get('/api/prayer-times', (req, res) => {
  const today = new Date();
  const result = getPrayerTimesForDate(today);
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Tiada data untuk tarikh ini.' });
  }
});

// Serve index.html for all other GET requests (not starting with /api)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Waktu Solat server running at http://localhost:${PORT}`);
});
