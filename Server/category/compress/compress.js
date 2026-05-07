const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Import modular engines
const imageEngine = require('./engines/image_compress');
const mediaEngine = require('./engines/media_compress');
const pdfEngine = require('./engines/pdf_compress');
const zipEngine = require('./engines/zip_compress');

const router = express.Router();

const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const VIDEO_FORMATS = ['mp4', 'mkv', 'mov'];
const AUDIO_FORMATS = ['mp3', 'wav'];
const PDF_FORMATS = ['pdf'];
const DOC_FORMATS = ['docx', 'pptx', 'xlsx'];
const ARCHIVE_FORMATS = ['zip', 'rar', '7z', 'tar'];

const ALL_SUPPORTED = [
  ...IMAGE_FORMATS, ...VIDEO_FORMATS, ...AUDIO_FORMATS,
  ...PDF_FORMATS, ...DOC_FORMATS, ...ARCHIVE_FORMATS
];

// Multer (disk storage)
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `bytemorph-compress-${u}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// Helpers
const cleanupFiles = (paths) => {
  for (const p of paths) if (p && fs.existsSync(p)) try { fs.unlinkSync(p); } catch (_) { }
};
const stripExt = (filename) => filename.split('.').slice(0, -1).join('.');
const getExt = (filename) => filename.split('.').pop().toLowerCase();

// Master Compressor (Traffic Cop)
async function compressFile(inputPath, outputPath, ext, level) {
  if (IMAGE_FORMATS.includes(ext)) return await imageEngine(inputPath, outputPath, ext, level);
  if (VIDEO_FORMATS.includes(ext)) return await mediaEngine.video(inputPath, outputPath, ext, level);
  if (AUDIO_FORMATS.includes(ext)) return await mediaEngine.audio(inputPath, outputPath, level);
  if (PDF_FORMATS.includes(ext)) return await pdfEngine(inputPath, outputPath, level);
  if (DOC_FORMATS.includes(ext)) return await zipEngine.office(inputPath, outputPath, level);
  if (ARCHIVE_FORMATS.includes(ext)) return await zipEngine.archive(inputPath, outputPath, ext, level);

  throw new Error(`No compression engine for .${ext} files`);
}

// Route
router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'A file exceeds the 50MB limit.' });
      if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 3 allowed.' });
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
    next();
  });
}, async (req, res) => {

  const tempFilesToClean = req.files ? req.files.map(f => f.path) : [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const level = ['low', 'medium', 'high'].includes(req.body.level) ? req.body.level : 'medium';
    console.log(`[ByteMorph] Compressing ${req.files.length} file(s) at level: ${level.toUpperCase()}`);

    const compressedFiles = [];

    for (const file of req.files) {
      const ext = getExt(file.originalname);

      if (!ALL_SUPPORTED.includes(ext)) {
        return res.status(400).json({ error: `Unsupported format for compression: .${ext}`, supported: ALL_SUPPORTED });
      }

      const newFileName = `${stripExt(file.originalname)}_compressed.${ext}`;
      const outputPath = path.join(os.tmpdir(), `bytemorph-out-${Date.now()}-${newFileName}`);
      tempFilesToClean.push(outputPath);

      try {
        await compressFile(file.path, outputPath, ext, level);
        compressedFiles.push({ name: newFileName, path: outputPath });
      } catch (compErr) {
        console.error(`Failed: ${file.originalname} —`, compErr.message);
        throw new Error(`Compression failed for ${file.originalname}: ${compErr.message}`);
      }
    }

    // Cleanup hooks
    res.on('finish', () => cleanupFiles(tempFilesToClean));
    res.on('error', () => cleanupFiles(tempFilesToClean));
    res.on('close', () => cleanupFiles(tempFilesToClean));

    // Single file
    if (compressedFiles.length === 1) {
      return res.download(compressedFiles[0].path, compressedFiles[0].name);
    }

    // Multiple → ZIP
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_compressed.zip"');
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const f of compressedFiles) archive.file(f.path, { name: f.name });
    await archive.finalize();

  } catch (error) {
    cleanupFiles(tempFilesToClean);
    console.error('[ByteMorph] COMPRESS SERVER ERROR:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Compression failed', details: error.message });
  }
});

module.exports = router;
