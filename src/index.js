const { getPrayerTimes } = require('./prayerTimes');

async function main() {
  try {
    const times = await getPrayerTimes(); // today's date by default
    if (!times) {
      console.log('No prayer times found for today in the CSV.');
      return;
    }
    console.log('Prayer times for', times.date);
    console.log('Fajr:', times.fajr);
    console.log('Sunrise:', times.sunrise);
    console.log('Zuhur:', times.zuhur);
    console.log('Asr:', times.asr);
    console.log('Maghrib:', times.maghrib);
    console.log('Isha:', times.isha);
  } catch (err) {
    console.error('Error loading prayer times:', err.message);
    process.exit(1);
  }
}

main();
