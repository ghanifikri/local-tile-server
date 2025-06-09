// download-tiles-banten-sat.js
// ----------------------------------------------
// Unduh tile satelit MapTiler (retina 2×) untuk Provinsi Banten
// ----------------------------------------------
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';

// 🔑  KUNCI API MapTiler
const MT_KEY = '6kvXS43xsUgDJVODlHuu';

// Folder cache
const tileRoot = path.resolve('maps_satelite');

// Template URL MapTiler
const tpl =
  `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key=${MT_KEY}`;

// Zoom yang mau disimpan (12–15 sudah tajam untuk provinsi)
const minZoom = 12;
const maxZoom = 15;

// ----------------------------------------------
// Batas Provinsi Banten (kasar + sedikit margin)
const minLat = -7.80;
const maxLat = -5.85;
const minLon = 105.15;
const maxLon = 106.90;
// ----------------------------------------------

function lon2tile(lon, z) {
  return Math.floor((lon + 180) / 360 * 2 ** z);
}
function lat2tile(lat, z) {
  return Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z
  );
}

(async () => {
  console.log(`📥  Mulai download tile satelit MapTiler ‑ Banten`);
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(minLon, z);
    const xMax = lon2tile(maxLon, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    console.log(`  • Zoom ${z}  (x ${xMin}-${xMax}, y ${yMin}-${yMax})`);

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const localPath = path.join(tileRoot, `${z}/${x}/${y}.jpg`);
        if (fs.existsSync(localPath)) continue;          // skip kalau sudah ada

        await mkdirp(path.dirname(localPath));
        const url = tpl.replace('{z}', z)
                       .replace('{x}', x)
                       .replace('{y}', y);

        try {
          const res = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'BantenTileFetcher/1.0 (+email)' }
          });
          fs.writeFileSync(localPath, res.data);
          process.stdout.write('.');
        } catch (err) {
          console.error(`\n❌  Gagal ${z}/${x}/${y}:`, err.message);
        }
      }
    }
    console.log(`  ✔ Zoom ${z} selesai`);
  }
  console.log('🎉  Semua tile Banten selesai diunduh.\n');
})();
