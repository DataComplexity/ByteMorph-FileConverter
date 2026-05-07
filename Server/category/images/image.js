const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import modular engine
const imageEngine = require('./engines/image_engine');

const router = express.Router();

const ALL_SUPPORTED = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'tiff', 'bmp',
  'svg', 'heic', 'ico', 'psd', 'eps', 'raw', 'dng', 'tga'
];

// Multer
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `bytemorph-img-${u}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// Helpers
const cleanupFiles = (paths) => {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (_) { }
    }
  }
};

const stripExt = (filename) => {
  const parts = filename.split('.');
  parts.pop();
  return parts.join('.');
};

const getInputExt = (filename) => filename.split('.').pop().toLowerCase();

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

  const tempFilesToClean = req.files ? req.files.map(f => f.path) : [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const targetFormat = (req.body.targetFormat || 'png').toLowerCase();

    if (!ALL_SUPPORTED.includes(targetFormat)) {
      return res.status(400).json({
        error: `Unsupported target image format: .${targetFormat}`,
        supported: ALL_SUPPORTED
      });
    }

    console.log(`[ByteMorph] Converting ${req.files.length} image(s) → .${targetFormat}`);

    const convertedFiles = [];

    for (const file of req.files) {
      const inputExt = getInputExt(file.originalname);
      const engine = imageEngine.pickEngine(inputExt);
      const engineLabel = engine === 'sharp' ? 'Sharp' : 'ImageMagick';

      console.log(`  Processing: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) via ${engineLabel}`);

      const newFileName = `${stripExt(file.originalname)}.${targetFormat}`;
      const outputPath = path.join(os.tmpdir(), `converted-${Date.now()}-${newFileName}`);
      tempFilesToClean.push(outputPath);

      try {
        await imageEngine.convert(file.path, outputPath, targetFormat, inputExt);

        convertedFiles.push({
          name: newFileName,
          path: outputPath
        });
      } catch (convErr) {
        console.error(`Failed: ${file.originalname} —`, convErr.message);
        throw new Error(`Failed to convert ${file.originalname}: ${convErr.message}`);
      }
    }

    console.log(`[ByteMorph] Done — ${convertedFiles.length} image(s) converted.`);

    // Clean up temp files after response ends
    res.on('finish', () => cleanupFiles(tempFilesToClean));
    res.on('error', () => cleanupFiles(tempFilesToClean));
    res.on('close', () => cleanupFiles(tempFilesToClean));

    // Single file → direct download
    if (convertedFiles.length === 1) {
      const outputFile = convertedFiles[0];
      return res.download(outputFile.path, outputFile.name, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download converted image.' });
        }
      });
    }

    // Multiple files → ZIP archive
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_images.zip"');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const f of convertedFiles) {
      archive.file(f.path, { name: f.name });
    }

    await archive.finalize();

  } catch (error) {
    cleanupFiles(tempFilesToClean);
    console.error('[ByteMorph] IMAGE SERVER ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Image conversion failed',
        details: error.message,
        tip: 'Ensure ImageMagick is installed — run: winget install ImageMagick.ImageMagick'
      });
    }
  }
});

module.exports = router;
