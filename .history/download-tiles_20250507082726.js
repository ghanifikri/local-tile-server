// download-tiles.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

const tileRoot = path.resolve('maps');
const tpl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const minZoom = 10;
const maxZoom = 14;
// Bounding box Jakarta kira‑kira
const minLat = -6.5, maxLat = -5.7;
const minLon = 106.5, maxLon = 107.1;

function lon2tile(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
function lat2tile(lat, z) {
  return Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z)
  );
}

(async () => {
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(minLon, z);
    const xMax = lon2tile(maxLon, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const localPath = path.join(tileRoot, `${z}/${x}/${y}.png`);
        if (fs.existsSync(localPath)) continue;

        await mkdirp(path.dirname(localPath));
        const url = tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y);
        try {
          const res = await axios.get(url, { responseType: 'arraybuffer',
            headers: { 'User-Agent': 'LocalTileFetcher/1.0 (+email)' } });
          fs.writeFileSync(localPath, res.data);
          process.stdout.write('.');
        } catch (e) {
          console.error(`\nFail ${z}/${x}/${y}`, e.message);
        }
      }
    }
    console.log(`\nFinished zoom ${z}`);
  }
})();
