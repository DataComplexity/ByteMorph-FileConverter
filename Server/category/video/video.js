const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Import modular engine
const convertVideo = require('./engines/ffmpeg_video');

const router = express.Router();

const SUPPORTED_VIDEO = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', '3gp', 'm4v', 'gif'];

// Multer
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `bytemorph-video-${u}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// Helpers
const cleanupFiles = (paths) => {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (e) { }
    }
  }
};

const stripExt = (filename) => {
  const parts = filename.split('.');
  parts.pop();
  return parts.join('.');
};

router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'A file exceeds the 50MB size limit.' });
      if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 3 allowed.' });
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(500).json({ error: `Unknown error: ${err.message}` });
    next();
  });
}, async (req, res) => {

  // Track all files created on disk during this request so we can wipe them at the end.
  const tempFilesToClean = req.files ? req.files.map(f => f.path) : [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const targetFormat = (req.body.targetFormat || 'mp4').toLowerCase();

    if (!SUPPORTED_VIDEO.includes(targetFormat)) {
      return res.status(400).json({
        error: `Unsupported target video format: .${targetFormat}`,
        supported: SUPPORTED_VIDEO
      });
    }

    console.log(`[ByteMorph] Converting ${req.files.length} video(s) → .${targetFormat} using FFmpeg Engine...`);

    const convertedFiles = [];

    for (const file of req.files) {
      console.log(`  Processing Video: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      const newFileName = `${stripExt(file.originalname)}.${targetFormat}`;
      const outputPath = path.join(os.tmpdir(), `converted-${Date.now()}-${newFileName}`);
      tempFilesToClean.push(outputPath);

      try {
        await convertVideo(file.path, outputPath);
        convertedFiles.push({
          name: newFileName,
          path: outputPath
        });
      } catch (convErr) {
        console.error(`  Failed Video Conversion: ${file.originalname}`, convErr.message);
        throw new Error(`Failed to convert ${file.originalname}: ${convErr.message}`);
      }
    }

    console.log(`[ByteMorph] Done — ${convertedFiles.length} video(s) converted.`);

    // Wait until response fully ends before cleaning up temp files from disk
    res.on('finish', () => cleanupFiles(tempFilesToClean));
    res.on('error', () => cleanupFiles(tempFilesToClean));
    res.on('close', () => cleanupFiles(tempFilesToClean));

    // Send single file
    if (convertedFiles.length === 1) {
      const outputFile = convertedFiles[0];
      return res.download(outputFile.path, outputFile.name, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download converted video.' });
        }
      });
    }

    // Zip multiple files together
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_videos.zip"');
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
    console.error('[ByteMorph] VIDEO SERVER ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
});

module.exports = router;
