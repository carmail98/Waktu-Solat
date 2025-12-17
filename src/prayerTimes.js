const fs = require('fs');
const path = require('path');

// Reads a CSV file, finds the row for the given date, and returns prayer times or null
function getPrayerTimesForDate(csvPath, dateObj) {
  if (!fs.existsSync(csvPath)) return null;
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('miladi'));
  if (dateIdx === -1) return null;

  // Format date as DD-MMM-YYYY (e.g., 01-Jan-2025, 02-Feb-2025)
  function formatDate(d) {
    const months = ['Jan','Feb','Mac','Apr','Mei','Jun','Julai','Ogos','Sep','Okt','Nov','Dis'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  const dateStr = formatDate(dateObj);
  const row = lines.find(line => line.split(',')[dateIdx].trim() === dateStr);
  if (!row) return null;
  const values = row.split(',').map(v => v.trim());
  // Return all 6 prayers (no imsak)
  return {
    subuh: values[headers.findIndex(h => h.toLowerCase() === 'subuh')],
    syuruk: values[headers.findIndex(h => h.toLowerCase() === 'syuruk')],
    zohor: values[headers.findIndex(h => h.toLowerCase() === 'zohor')],
    asar: values[headers.findIndex(h => h.toLowerCase() === 'asar')],
    maghrib: values[headers.findIndex(h => h.toLowerCase() === 'maghrib')],
    isyak: values[headers.findIndex(h => h.toLowerCase() === 'isyak')]
  };
}

module.exports = { getPrayerTimesForDate };
