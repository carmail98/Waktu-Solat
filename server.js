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
  const zone = req.query.zone || 'WLY01';
  const today = new Date();
  // Compose the expected CSV filename for the zone
  const csvFile = `jadual_waktu_solat_JAKIM_${zone}_2025.csv`;
  const csvPath = path.join(__dirname, 'data', csvFile);

  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: `Zone data not found for ${zone}` });
  }

  try {
    const result = getPrayerTimesForDate(today, zone, csvFile);
    if (result) {
      // Debug log for server
      console.log("Sending data for zone", zone, ":", result);
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
    console.error('Server error:', e);
    res.status(500).json({ error: 'Ralat membaca fail CSV zon.' });
  }
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
