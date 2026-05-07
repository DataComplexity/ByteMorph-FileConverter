const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


const COMMON_PATHS = {
  soffice: ['/usr/bin/soffice', 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'],
  pandoc: ['/usr/bin/pandoc', 'C:\\Program Files\\Pandoc\\pandoc.exe'],
  '7z': ['/usr/bin/7z', 'C:\\Program Files\\7-Zip\\7z.exe', 'C:\\Program Files (x86)\\7-Zip\\7z.exe'],
  magick: ['/usr/bin/magick', '/usr/bin/convert'],
  gs: [
    '/usr/bin/gs',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files (x86)\\gs\\gs10.03.1\\bin\\gswin64c.exe'
  ]
};

function checkSystemBinary(cmd) {
  // Special check for bundled ffmpeg
  if (cmd === 'ffmpeg') {
    try {
      require.resolve('@ffmpeg-installer/ffmpeg');
      return 'Bundled';
    } catch (e) { }
  }

  const isWin = process.platform === 'win32';
  const checkCmd = isWin ? `where ${cmd}` : `which ${cmd}`;

  try {
    execSync(checkCmd, { stdio: 'ignore' });
    return 'Found';
  } catch (e) {
    const paths = COMMON_PATHS[cmd] || [];
    for (const p of paths) {
      if (fs.existsSync(p)) return 'Found (Path)';
    }
    return 'Missing';
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Routes
// Modularized category scripts
const documentRoutes = require('./category/documents/document');
const videoRoutes = require('./category/video/video');
const imageRoutes = require('./category/images/image');
const audioRoutes = require('./category/audio/audio');
const dataRoutes = require('./category/data/data');
const archiveRoutes = require('./category/archives/archive');
const compressRoutes = require('./category/compress/compress');
const authRoutes = require('./category/authentication/auth');

// API Endpoints
app.use('/api/convert/document', documentRoutes);
app.use('/api/convert/video', videoRoutes);
app.use('/api/convert/image', imageRoutes);
app.use('/api/convert/audio', audioRoutes);
app.use('/api/convert/data', dataRoutes);
app.use('/api/convert/archive', archiveRoutes);
app.use('/api/compress', compressRoutes);
app.use('/api/auth', authRoutes);

// Serve Frontend Static Files
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}


// Start Server
app.listen(PORT, () => {
  const status = {
    libre: checkSystemBinary('soffice'),
    pandoc: checkSystemBinary('pandoc'),
    ffmpeg: checkSystemBinary('ffmpeg'),
    magick: checkSystemBinary('magick'),
    sevenZip: checkSystemBinary('7z'),
    gs: checkSystemBinary('gs')
  };

  console.log(`
===================================================
 ByteMorph Server is LIVE! 
 Running on http://localhost:${PORT}
───────────────────────────────────────────────────
 Documents  → LibreOffice (${status.libre}) | Pandoc (${status.pandoc})
 Images     → Sharp + ImageMagick (${status.magick})
 Video      → FFmpeg (${status.ffmpeg})
 Audio      → FFmpeg (${status.ffmpeg})
 Data       → xlsx, csv-parse, fast-xml-parser
 Archives   → 7-Zip CLI (${status.sevenZip})
 Compress   → Sharp + FFmpeg + GS (${status.gs})
===================================================
  `);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[FATAL ERROR] Port ${PORT} is already occupied by another process.`);
    console.error(`💡 Tip: Check if another instance of ByteMorph is running, or run: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  } else {
    console.error('\n[FATAL ERROR] Server failed to start:', err.message);
    process.exit(1);
  }
});
