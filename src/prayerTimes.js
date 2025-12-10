const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_PATH = path.resolve(__dirname, '..', 'data', 'jadual_waktu_solat_JAKIM.csv');

let cache = null;

// Load and parse CSV into an array of objects { date: 'YYYY-MM-DD', fajr: 'HH:mm', ... }
function loadData() {
  return new Promise((resolve, reject) => {
    if (cache) return resolve(cache);
    const results = [];
    fs.createReadStream(DATA_PATH)
      .pipe(csv())
      .on('data', (data) => {
        // normalize keys and trim values
        const entry = {
          date: (data.date || '').trim(),
          fajr: (data.fajr || '').trim(),
          sunrise: (data.sunrise || '').trim(),
          zuhur: (data.zuhur || '').trim(),
          asr: (data.asr || '').trim(),
          maghrib: (data.maghrib || '').trim(),
          isha: (data.isha || '').trim(),
        };
        results.push(entry);
      })
      .on('end', () => {
        cache = results;
        resolve(results);
      })
      .on('error', (err) => reject(err));
  });
}

// getPrayerTimes accepts a Date object or an ISO date string (YYYY-MM-DD)
async function getPrayerTimes(dateInput) {
  const data = await loadData();
  let targetDate;
  if (!dateInput) {
    const d = new Date();
    targetDate = d.toISOString().slice(0, 10);
  } else if (dateInput instanceof Date) {
    targetDate = dateInput.toISOString().slice(0, 10);
  } else if (typeof dateInput === 'string') {
    // accept YYYY-MM-DD
    targetDate = dateInput;
  } else {
    throw new Error('Invalid date input. Provide a Date or YYYY-MM-DD string.');
  }

  const found = data.find((r) => r.date === targetDate);
  return found || null;
}

module.exports = {
  loadData,
  getPrayerTimes,
};
