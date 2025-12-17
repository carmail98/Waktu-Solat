const express = require('express');
const path = require('path');
const { getPrayerTimesForDate } = require('./src/prayerTimes');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// API: /api/prayer-times?zone=WLY01 or ?zone=PGH_02
app.get('/api/prayer-times', (req, res) => {
  const zone = req.query.zone;
  if (!zone) {
    return res.status(400).json({ error: 'Zone is required' });
  }
  const csvFile = `jadual_waktu_solat_JAKIM_${zone}_2025.csv`;
  try {
    const result = getPrayerTimesForDate(path.join(__dirname, 'data', csvFile), new Date('2025-01-01'));
    if (!result) {
      return res.status(404).json({ error: 'Data tidak dijumpai untuk zon ini.' });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Ralat membaca fail CSV.' });
  }
});

// Fallback: serve index.html for all other GET requests (for SPA routing)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
