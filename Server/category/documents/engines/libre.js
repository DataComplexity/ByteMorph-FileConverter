const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, execSync } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const checkBinary = require('../../../utils/binaryCheck');

// Check once on module load
const LIBRE_INSTALLED = checkBinary('soffice', [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
]);


console.log(`[ByteMorph] Engine Load → LibreOffice: ${LIBRE_INSTALLED ? '✅' : '❌ NOT FOUND'}`);

module.exports = async function convertWithLibre(buffer, targetExt, inputExt) {
  if (!LIBRE_INSTALLED) {
    throw new Error('LibreOffice not found. Install it: winget install TheDocumentFoundation.LibreOffice');
  }

  // Workaround for some Temp files
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `bytemorph_libre_${Date.now()}_${Math.random().toString(36).slice(2)}.${inputExt}`);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(tmpDir, `${baseName}.${targetExt}`);

  try {
    fs.writeFileSync(inputPath, buffer);

    const sofficeCmd = fs.existsSync('C:\\Program Files\\LibreOffice\\program\\soffice.exe')
      ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
      : 'soffice';

    await execFileAsync(sofficeCmd, [
      '--headless',
      '--convert-to', targetExt,
      '--outdir', tmpDir,
      inputPath
    ]);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`LibreOffice failed. Is it possible to convert .${inputExt} to .${targetExt}? Ensure the formats are compatible.`);
    }

    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};
