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

function parseDate(str) {
  // Accepts '01-Jan-2025' and returns Date object
  const [day, monthStr, year] = str.split('-');
  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  return new Date(Number(year), months[monthStr], Number(day));
}

function getPrayerTimesForDate(targetDate) {
  const csv = fs.readFileSync(DATA_PATH, 'utf8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  let found = null;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const rowObj = {};
    headers.forEach((h, idx) => rowObj[h.trim()] = row[idx] ? row[idx].trim() : '');
    if (rowObj['Tarikh Miladi']) {
      const rowDate = parseDate(rowObj['Tarikh Miladi']);
      // Compare only the date part (YYYY-MM-DD)
      if (rowDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10)) {
        found = {
          date: rowObj['Tarikh Miladi'],
          imsak: rowObj['Imsak'],
          subuh: rowObj['Subuh'],
          syuruk: rowObj['Syuruk'],
          zohor: rowObj['Zohor'],
          asar: rowObj['Asar'],
          maghrib: rowObj['Maghrib'],
          isyak: rowObj['Isyak']
        };
        break;
      }
    }
  }
  if (found) {
    return found;
  } else {
    // fallback for dev: try 2025-01-01 if today is not found
    const fallback = '2025-01-01';
    const fallbackRow = lines.find(line => line.includes('01-Jan-2025'));
    if (fallbackRow) {
      const row = fallbackRow.split(',');
      const rowObj = {};
      headers.forEach((h, idx) => rowObj[h.trim()] = row[idx] ? row[idx].trim() : '');
      console.log(`Date ${targetDate.toISOString().slice(0, 10)} not found in dataset. Showing fallback for 2025-01-01.`);
      return {
        date: rowObj['Tarikh Miladi'],
        imsak: rowObj['Imsak'],
        subuh: rowObj['Subuh'],
        syuruk: rowObj['Syuruk'],
        zohor: rowObj['Zohor'],
        asar: rowObj['Asar'],
        maghrib: rowObj['Maghrib'],
        isyak: rowObj['Isyak']
      };
    } else {
      console.log(`Date ${targetDate.toISOString().slice(0, 10)} not found in dataset.`);
      return null;
    }
  }
}

module.exports = {
  loadData,
  getPrayerTimes,
  getPrayerTimesForDate,
};
