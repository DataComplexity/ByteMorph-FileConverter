const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');

// Import modular engine
const dataEngine = require('./engines/data_engine');

const router = express.Router();

const SUPPORTED_DATA = ['csv', 'json', 'xml', 'xlsx', 'xls', 'yaml', 'yml', 'toml', 'tsv'];

// Multer (memory storage — data files are small)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// Helpers
const stripExt = (filename) => {
  const parts = filename.split('.');
  parts.pop();
  return parts.join('.');
};

const getExt = (filename) => filename.split('.').pop().toLowerCase();

// Route
router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'A file exceeds the 50MB limit.' });
      if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 3 allowed.' });
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(500).json({ error: `Unknown error: ${err.message}` });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const targetFormat = (req.body.targetFormat || 'json').toLowerCase();

    if (!SUPPORTED_DATA.includes(targetFormat)) {
      return res.status(400).json({
        error: `Unsupported target data format: .${targetFormat}`,
        supported: SUPPORTED_DATA
      });
    }

    console.log(`[ByteMorph] Converting ${req.files.length} data file(s) → .${targetFormat}`);

    const convertedFiles = [];

    for (const file of req.files) {
      const inputExt = getExt(file.originalname);
      console.log(`  Processing: ${file.originalname} (.${inputExt} → .${targetFormat}) — ${(file.size / 1024).toFixed(1)} KB`);

      try {
        // Step 1: Parse input → Array<Object>
        const rows = dataEngine.parse(file.buffer, inputExt);
        console.log(`    Parsed ${rows.length} row(s) from .${inputExt}`);

        // Step 2: Serialize Array<Object> → target format buffer
        const outputBuffer = dataEngine.serialize(rows, targetFormat);

        convertedFiles.push({
          name: `${stripExt(file.originalname)}.${targetFormat}`,
          buffer: outputBuffer
        });
      } catch (convErr) {
        console.error(`  ❌ Failed: ${file.originalname} —`, convErr.message);
        return res.status(500).json({
          error: `Conversion failed for ${file.originalname}`,
          details: convErr.message
        });
      }
    }

    console.log(`[ByteMorph] ✅ Done — ${convertedFiles.length} data file(s) converted.`);

    // Single file → send directly
    if (convertedFiles.length === 1) {
      const file = convertedFiles[0];
      const mime = dataEngine.getMime(targetFormat);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', mime);
      return res.send(file.buffer);
    }

    // Multiple files → ZIP
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_data.zip"');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const file of convertedFiles) {
      archive.append(file.buffer, { name: file.name });
    }

    await archive.finalize();

  } catch (error) {
    console.error('[ByteMorph] DATA SERVER ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Data conversion failed', details: error.message });
    }
  }
});

module.exports = router;
