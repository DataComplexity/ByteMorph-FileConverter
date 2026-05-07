const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

const LEVELS = {
  low:    { pdfPreset: 'printer' },
  medium: { pdfPreset: 'ebook'   },
  high:   { pdfPreset: 'screen'  },
};

// Ghostscript Path Detection
const getGSPath = () => {
  const candidates = [
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'gswin64c',
    'gs'
  ];
  for (const c of candidates) {
    if (c.includes('\\') && fs.existsSync(c)) return c;
    if (!c.includes('\\')) return c;
  }
  return 'gswin64c';
};

const GS_PATH = getGSPath();

module.exports = async function compressPDF(inputPath, outputPath, levelKey) {
  const preset = LEVELS[levelKey]?.pdfPreset || 'ebook';
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${preset}`,
    '-dNOPAUSE', '-dQUIET', '-dBATCH',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  try {
    await execFileAsync(GS_PATH, args, { timeout: 120000 });
  } catch (err) {
    throw new Error(`Ghostscript failed: ${err.message}`);
  }
};
