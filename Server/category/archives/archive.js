const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import modular engine
const sevenZip = require('./engines/sevenzip');

const router = express.Router();

const SUPPORTED_INPUT = ['zip', 'tar', '7z', 'rar', 'gz', 'bz2', 'xz', 'iso'];
const SUPPORTED_OUTPUT = ['zip', 'tar', '7z', 'gz', 'bz2', 'xz', 'iso'];

// Multer (disk storage — 3 files, 50MB each)
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `bytemorph-archive-${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// Helpers
const stripExt = (filename) => {
  const parts = filename.split('.');
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join('.');
    if (['tar.gz', 'tar.bz2', 'tar.xz'].includes(lastTwo)) return parts.slice(0, -2).join('.');
  }
  parts.pop();
  return parts.join('.');
};

const getExt = (filename) => {
  const parts = filename.split('.');
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join('.');
    if (['tar.gz', 'tar.bz2', 'tar.xz'].includes(lastTwo)) return lastTwo;
  }
  return parts.pop().toLowerCase();
};

const cleanupDir = (dirPath) => { if (dirPath && fs.existsSync(dirPath)) try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch (_) { } };
const cleanupFiles = (paths) => { for (const p of paths) if (p && fs.existsSync(p)) try { fs.unlinkSync(p); } catch (_) { } };
const makeTempDir = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), `bytemorph-${prefix}-`));

// Output filename helper
function getOutputExtension(targetFormat) {
  return { zip: '.zip', tar: '.tar', '7z': '.7z', gz: '.tar.gz', bz2: '.tar.bz2', xz: '.tar.xz', iso: '.iso' }[targetFormat] || `.${targetFormat}`;
}

// Convert a single archive file
async function convertSingleArchive(file, targetFormat, tempTracking) {
  const baseName = stripExt(file.originalname);
  const outExt = getOutputExtension(targetFormat);
  const outName = `${baseName}${outExt}`;
  const outputPath = path.join(os.tmpdir(), `bytemorph-repack-${Date.now()}-${outName}`);
  tempTracking.push(outputPath);

  const extractDir = makeTempDir('extract');
  tempTracking.push('DIR:' + extractDir);

  console.log(`  [${file.originalname}] Extracting...`);
  await sevenZip.extract(file.path, extractDir);

  const items = fs.readdirSync(extractDir);
  if (items.length === 0) throw new Error(`Archive is empty: ${file.originalname}`);
  console.log(`  [${file.originalname}] Extracted ${items.length} item(s) → repackaging as .${targetFormat}`);

  await sevenZip.create(extractDir, outputPath, targetFormat);
  return { name: outName, path: outputPath };
}

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

  // tempTracking holds file paths AND 'DIR:...' strings for dirs
  const tempTracking = req.files ? req.files.map(f => f.path) : [];

  const cleanupAll = () => {
    for (const t of tempTracking) {
      if (t.startsWith('DIR:')) {
        cleanupDir(t.slice(4));
      } else {
        cleanupFiles([t]);
      }
    }
  };

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No archive files uploaded.' });
    }

    const targetFormat = (req.body.targetFormat || 'zip').toLowerCase();

    // Validate target format
    if (!SUPPORTED_OUTPUT.includes(targetFormat)) {
      if (targetFormat === 'rar') {
        return res.status(400).json({
          error: 'Cannot create .rar archives — RAR is a proprietary format.',
          tip: 'Use .7z instead — better compression, fully open-source.',
          supported: SUPPORTED_OUTPUT
        });
      }
      return res.status(400).json({
        error: `Unsupported target format: .${targetFormat}`,
        supported: SUPPORTED_OUTPUT
      });
    }

    console.log(`[ByteMorph] Converting ${req.files.length} archive(s) → .${targetFormat} via 7-Zip`);

    const convertedFiles = [];

    for (const file of req.files) {
      const inputExt = getExt(file.originalname);
      if (!SUPPORTED_INPUT.includes(inputExt)) {
        throw new Error(`Unsupported input archive format: .${inputExt} (${file.originalname})`);
      }
      console.log(`  Processing: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      const result = await convertSingleArchive(file, targetFormat, tempTracking);
      convertedFiles.push(result);
    }

    console.log(`[ByteMorph] ✅ Done — ${convertedFiles.length} archive(s) converted.`);

    // Cleanup after send
    res.on('finish', cleanupAll);
    res.on('error', cleanupAll);
    res.on('close', cleanupAll);

    // Single file → direct download
    if (convertedFiles.length === 1) {
      return res.download(convertedFiles[0].path, convertedFiles[0].name, (err) => {
        if (err && !res.headersSent) res.status(500).json({ error: 'Failed to download converted archive.' });
      });
    }

    // Multiple files → ZIP of archives
    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_archives.zip"');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const f of convertedFiles) archive.file(f.path, { name: f.name });

    await archive.finalize();

  } catch (error) {
    cleanupAll();
    console.error('[ByteMorph] ARCHIVE SERVER ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Archive conversion failed',
        details: error.message,
        tip: 'Ensure 7-Zip is installed: winget install 7zip.7zip'
      });
    }
  }
});

module.exports = router;
