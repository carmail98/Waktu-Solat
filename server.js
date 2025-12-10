const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPrayerTimesForDate } = require('./src/prayerTimes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get prayer times for a zone
app.get('/api/prayer-times', (req, res) => {
  const zone = req.query.zone;
  if (!zone) {
    return res.status(400).json({ error: 'Zone is required' });
  }
  let date = new Date();
  // For testing, fallback to Jan 1, 2025 if not found
  const prayerTimes = require('./src/prayerTimes').getPrayerTimes(zone, date);
  if (!prayerTimes) {
    return res.status(404).json({ error: 'Zone not found or no data for date' });
  }
  res.json(prayerTimes);
});

// Serve index.html for all other GET requests (not starting with /api)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler (catches unhandled errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});
