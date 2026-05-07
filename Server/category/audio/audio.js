const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Import modular engine
const convertAudio = require('./engines/ffmpeg_audio');

const router = express.Router();

const SUPPORTED_AUDIO = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'];

// Multer
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `bytemorph-audio-${u}-${file.originalname}`);
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

    const targetFormat = (req.body.targetFormat || 'mp3').toLowerCase();

    if (!SUPPORTED_AUDIO.includes(targetFormat)) {
      return res.status(400).json({
        error: `Unsupported target audio format: .${targetFormat}`,
        supported: SUPPORTED_AUDIO
      });
    }

    console.log(`[ByteMorph] Converting ${req.files.length} audio file(s) → .${targetFormat} via FFmpeg`);

    const convertedFiles = [];

    for (const file of req.files) {
      console.log(`  Processing Audio: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      const newFileName = `${stripExt(file.originalname)}.${targetFormat}`;
      const outputPath = path.join(os.tmpdir(), `converted-${Date.now()}-${newFileName}`);
      tempFilesToClean.push(outputPath);

      try {
        await convertAudio(file.path, outputPath, targetFormat);
        convertedFiles.push({
          name: newFileName,
          path: outputPath
        });
      } catch (convErr) {
        console.error(`  ❌ Failed: ${file.originalname} —`, convErr.message);
        throw new Error(`Failed to convert ${file.originalname}: ${convErr.message}`);
      }
    }

    console.log(`[ByteMorph] ✅ Done — ${convertedFiles.length} audio file(s) converted.`);

    // Clean up temp files after response ends
    res.on('finish', () => cleanupFiles(tempFilesToClean));
    res.on('error', () => cleanupFiles(tempFilesToClean));
    res.on('close', () => cleanupFiles(tempFilesToClean));

    // Single file → direct download
    if (convertedFiles.length === 1) {
      const outputFile = convertedFiles[0];
      return res.download(outputFile.path, outputFile.name, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download converted audio.' });
        }
      });
    }

    // Multiple files → ZIP archive
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_audio.zip"');
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
    console.error('[ByteMorph] AUDIO SERVER ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Audio conversion failed',
        details: error.message,
        tip: 'FFmpeg is bundled — if this fails, the input file format may be corrupted or unsupported.'
      });
    }
  }
});

module.exports = router;