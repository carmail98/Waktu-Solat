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
    Jan: 0, Feb: 1, Mac: 2, Apr: 3, Mei: 4, Jun: 5,
    Julai: 6, Ogos: 7, Sep: 8, Okt: 9, Nov: 10, Dis: 11
  };
  return new Date(Number(year), months[monthStr], Number(day));
}

function parseCsvForDate(csvContent, targetDate) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const dateIndex = headers.findIndex(h => h.trim() === 'Tarikh Miladi');
  if (dateIndex === -1) throw new Error("CSV missing 'Tarikh Miladi' column");

  // Format date as DD-MMM-YYYY (e.g., 10-Dis-2025)
  function formatDate(d) {
    const months = ['Jan','Feb','Mac','Apr','Mei','Jun','Julai','Ogos','Sep','Okt','Nov','Dis'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  let todayStr = formatDate(targetDate);
  let row = lines.find(line => line.split(',')[dateIndex].trim() === todayStr);
  if (!row) {
    row = lines.find(line => line.split(',')[dateIndex].trim() === '01-Jan-2025');
  }
  if (!row) return null;

  const values = row.split(',');
  // Map CSV columns to prayer times
  return {
    imsak: values[headers.findIndex(h => h.trim().toLowerCase() === 'imsak')],
    subuh: values[headers.findIndex(h => h.trim().toLowerCase() === 'subuh')],
    syuruk: values[headers.findIndex(h => h.trim().toLowerCase() === 'syuruk')],
    zohor: values[headers.findIndex(h => h.trim().toLowerCase() === 'zohor')],
    asar: values[headers.findIndex(h => h.trim().toLowerCase() === 'asar')],
    maghrib: values[headers.findIndex(h => h.trim().toLowerCase() === 'maghrib')],
    isyak: values[headers.findIndex(h => h.trim().toLowerCase() === 'isyak')]
  };
}

function getPrayerTimesForDate(date, zone, csvFile) {
  const csvPath = path.join(__dirname, '../data', csvFile);
  if (!fs.existsSync(csvPath)) return null;
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  return parsePrayerTimesCsv(csvContent, date);
}

// Parse JAKIM CSV for prayer times
function parsePrayerTimesCsv(csvContent, targetDate) {
  const lines = csvContent.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  // Find date column index
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('miladi'));
  if (dateIdx === -1) return null;

  // Format date as DD-MMM-YYYY (e.g., 10-Dec-2025)
  function formatDate(d) {
    const months = ['Jan','Feb','Mac','Apr','Mei','Jun','Julai','Ogos','Sep','Okt','Nov','Dis','Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    // JAKIM uses 'Dis' for December, not 'Dec'
    let month = months[d.getMonth()];
    if (d.getMonth() === 11) month = 'Dis';
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  let dateStr = formatDate(targetDate);
  let row = lines.find(line => line.split(',')[dateIdx].trim() === dateStr);
  if (!row) {
    // fallback to Jan 1, 2025
    dateStr = '01-Jan-2025';
    row = lines.find(line.split(',')[dateIdx].trim() === dateStr);
  }
  if (!row) return null;

  const values = row.split(',').map(v => v.trim());
  // Map CSV columns to prayer times
  return {
    imsak: values[headers.findIndex(h => h.toLowerCase() === 'imsak')],
    subuh: values[headers.findIndex(h => h.toLowerCase() === 'subuh')],
    syuruk: values[headers.findIndex(h => h.toLowerCase() === 'syuruk')],
    zohor: values[headers.findIndex(h => h.toLowerCase() === 'zohor')],
    asar: values[headers.findIndex(h => h.toLowerCase() === 'asar')],
    maghrib: values[headers.findIndex(h => h.toLowerCase() === 'maghrib')],
    isyak: values[headers.findIndex(h => h.toLowerCase() === 'isyak')]
  };
}

function getPrayerTimes(zone, date) {
  const csvPath = path.join(__dirname, '../data', `${zone}.csv`);
  if (!fs.existsSync(csvPath)) return null;
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  return parsePrayerTimesCsv(csvContent, date);
}

module.exports = {
  loadData,
  getPrayerTimes,
  getPrayerTimesForDate,
};
