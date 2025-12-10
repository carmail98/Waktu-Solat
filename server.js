const express = require('express');
const path = require('path');
const { getPrayerTimesForDate } = require('./src/prayerTimes');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for today's prayer times, with optional zone
app.get('/api/prayer-times', (req, res) => {
  const today = new Date();
  // Get zone from query param, default to WLY01
  const zone = req.query.zone || 'WLY01';
  // Map zone to CSV file (e.g., jadual_waktu_solat_JAKIM_WLY_01_2025.csv)
  const csvFile = `jadual_waktu_solat_JAKIM_${zone}_2025.csv`;
  try {
    const result = getPrayerTimesForDate(today, zone, csvFile);
    if (result) {
      res.json({
        imsak: result.imsak,
        subuh: result.subuh,
        syuruk: result.syuruk,
        zohor: result.zohor,
        asar: result.asar,
        maghrib: result.maghrib,
        isyak: result.isyak
      });
    } else {
      res.status(404).json({ error: 'Tiada data untuk tarikh ini.' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Ralat membaca fail CSV zon.' });
  }
});

// Serve index.html for all other GET requests (not starting with /api)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Waktu Solat server running at http://localhost:${PORT}`);
});
