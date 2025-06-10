// download-tiles-banten-sat-fast.js
import axios from 'axios';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import pLimit from 'p-limit';
import path from 'path';

const MT_KEY = 'dbkWyf7uTioCvIkGilV0';
const tileRoot = path.resolve('maps_satelite');
const tpl = `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key=${MT_KEY}`;

const minZoom = 12;
const maxZoom = 15;

const minLat = -7.80, maxLat = -5.85;
const minLon = 105.15, maxLon = 106.90;

/* ---------- helper ---------- */
function lon2tile(lon, z) { return Math.floor((lon + 180) / 360 * 2 ** z); }
function lat2tile(lat, z) {
  return Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z
  );
}
/* ---------------------------- */

/* 🌟  Kunci percepatan: atur concurrency */
const CONCURRENCY = 8;          // ← ubah sesuai kecepatan & batas API
const limit = pLimit(CONCURRENCY);

async function fetchTile(z, x, y) {
  const localPath = path.join(tileRoot, `${z}/${x}/${y}.jpg`);
  if (fs.existsSync(localPath)) return;      // skip cache

  await mkdirp(path.dirname(localPath));
  const url = tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y);

  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'BantenTileFetcher/1.0 (+email)' }
  });
  fs.writeFileSync(localPath, res.data);
  process.stdout.write('.');
}

(async () => {
  console.log('🚀  Mulai (concurrency', CONCURRENCY + ')');

  const tasks = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(minLon, z), xMax = lon2tile(maxLon, z);
    const yMin = lat2tile(maxLat, z), yMax = lat2tile(minLat, z);

    console.log(`\n• Zoom ${z}  (x ${xMin}-${xMax}, y ${yMin}-${yMax})`);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        // Bungkus tiap task dengan limit() -> bentuk queue paralel
        tasks.push(limit(() => fetchTile(z, x, y)));
      }
    }
  }

  // Jalankan semua task, tapi max CONCURRENCY sekaligus
  await Promise.allSettled(tasks);
  console.log('\n🎉  Selesai semua tile Banten (fast mode).');
})();
