const express = require('express');
const multer = require('multer');
const archiver = require('archiver');

// Import our new decoupled engines
const libreEngine = require('./engines/libre');
const pandocEngine = require('./engines/pandoc');
const calibreEngine = require('./engines/calibre');
const pdfExtractEngine = require('./engines/pdfExtract');

const router = express.Router();

// Format Routing Maps
const LIBRE_FORMATS = ['pdf', 'docx', 'doc', 'odt', 'rtf', 'txt', 'html', 'htm', 'pages'];
const PANDOC_FORMATS = ['epub', 'md'];
const CALIBRE_FORMATS = ['mobi'];

const ALL_SUPPORTED = [...LIBRE_FORMATS, ...PANDOC_FORMATS, ...CALIBRE_FORMATS];

// Multer Middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 3 }
});
const uploadMiddleware = upload.array('files', 3);

// The Traffic Cop (Router Logic)
async function routeDocument(file, targetFormat) {
  const target = targetFormat.toLowerCase();
  const inputExt = file.originalname.split('.').pop().toLowerCase();

  // 1. Same Format Guard
  if (inputExt === target) {
    throw new Error(`Input and output formats are the same (.${target}). No conversion needed.`);
  }

  // 2. The PDF Extraction Edge Case
  // Natively, LibreOffice cannot extract text or format from PDFs. We use pdfExtract!
  if (inputExt === 'pdf') {
    if (target === 'txt' || target === 'md') {
      return await pdfExtractEngine(file.buffer, target);
    } else {
      throw new Error(`ByteMorph currently only supports converting PDFs into .txt or .md. PDF to .${target} requires unsupported complex AI engines.`);
    }
  }

  // 3. Calibre Formats (eBooks)
  if (CALIBRE_FORMATS.includes(target) || inputExt === 'mobi') {
    return await calibreEngine(file.buffer, target, inputExt);
  }

  // 4. Pandoc Formats (Markdown, EPUB)
  if (PANDOC_FORMATS.includes(target) || PANDOC_FORMATS.includes(inputExt)) {
    return await pandocEngine(file.buffer, target, inputExt);
  }

  // 5. Fallback Default: LibreOffice
  // If it's a Word doc, text file, HTML, or going TO PDF, LibreOffice is best.
  return await libreEngine(file.buffer, target, inputExt);
}

// Express Request Handler
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

    const targetFormat = (req.body.targetFormat || 'pdf').toLowerCase();

    if (!ALL_SUPPORTED.includes(targetFormat)) {
      return res.status(400).json({
        error: `Unsupported format: .${targetFormat}`,
        supported: ALL_SUPPORTED
      });
    }

    const convertedFiles = [];

    for (const file of req.files) {
      console.log(`[ByteMorph Traffic Cop] Routing: ${file.originalname} → .${targetFormat}`);

      try {
        const outputBuffer = await routeDocument(file, targetFormat);
        convertedFiles.push({
          name: `${file.originalname.split('.').slice(0, -1).join('.')}.${targetFormat}`,
          buffer: outputBuffer
        });
      } catch (convErr) {
        console.error(`[ByteMorph] Failed: ${file.originalname} —`, convErr.message);
        return res.status(500).json({
          error: `Conversion failed for "${file.originalname}"`,
          details: convErr.message
        });
      }
    }

    console.log(`[ByteMorph] Done — ${convertedFiles.length} file(s) converted`);

    if (convertedFiles.length === 1) {
      const file = convertedFiles[0];
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.send(file.buffer);
    }

    res.setHeader('Content-Disposition', 'attachment; filename="bytemorph_documents.zip"');
    res.setHeader('Content-Type', 'application/zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const file of convertedFiles) archive.append(file.buffer, { name: file.name });
    await archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
});

module.exports = router;