// server.js
import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { mkdirp } from 'mkdirp';


const PORT = 3249;
// const tileRoot = path.resolve('maps');        // tempat simpan cache
const tileRoot = path.resolve('maps_satelite');        // tempat simpan cache
const remoteTemplate = 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}@2x.jpg?key=6kvXS43xsUgDJVODlHuu';

const app = express();
app.use(morgan('tiny'));                       // log akses

// Serve viewer
app.use('/', express.static('public'));

// Route tile: /{z}/{x}/{y}.png
app.get('/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  const localPath = path.join(tileRoot, z, x, `${y}.png`);

  // Kalau sudah ada di cache ➜ kirim langsung
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  try {
    // Buat folder dulu (mkdir -p)
    await mkdirp(path.dirname(localPath));

    // Download dari OSM
    const url = remoteTemplate
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'LocalTileProxy/1.0 (+your_email@example.com)' }
    });

    // Simpan ke disk
    fs.writeFileSync(localPath, response.data);

    // Kirim ke klien
    res.set('Content-Type', 'image/png');
    return res.send(response.data);
  } catch (err) {
    console.error('[Tile error]', err.message);
    return res.status(502).send('Failed fetching remote tile');
  }
});

app.listen(PORT, () => {
  console.log(`Local tile‑server running → http://localhost:${PORT}/{z}/{x}/{y}.png`);
});
