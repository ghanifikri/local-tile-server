// download-tiles-java.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const tileRoot = path.resolve('maps');
const tpl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// GANTI rentang zoom di sini
const minZoom = 10;
const maxZoom = 14;

// --- batas Pulau Jawa ---
const minLat = -8.80;
const maxLat = -5.60;
const minLon = 105.00;
const maxLon = 114.50;
// ------------------------

function lon2tile(lon, z) { return Math.floor((lon + 180) / 360 * 2 ** z); }
function lat2tile(lat, z) {
  return Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z
  );
}

(async () => {
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(minLon, z);
    const xMax = lon2tile(maxLon, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    console.log(`Zoom ${z} → X ${xMin}-${xMax}, Y ${yMin}-${yMax}`);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const localPath = path.join(tileRoot, `${z}/${x}/${y}.png`);
        if (fs.existsSync(localPath)) continue;

        await mkdirp(path.dirname(localPath));
        const url = tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y);

        try {
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'LocalTileFetcher-Java/1.0 (+email)' }
          });
          fs.writeFileSync(localPath, res.data);
          process.stdout.write('.');
        } catch (err) {
          console.error(`\nGagal ${z}/${x}/${y}:`, err.message);
        }
      }
    }
    console.log(`\n✔️  Selesai zoom ${z}`);
  }
})();
