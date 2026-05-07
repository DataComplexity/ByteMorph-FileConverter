const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, execSync } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Check once on module load
const CALIBRE_INSTALLED = (() => {
  const winPath = 'C:\\Program Files\\Calibre2';
  try {
    execSync('where ebook-convert', { stdio: 'ignore' });
    return true;
  } catch {
    if (fs.existsSync(path.join(winPath, 'ebook-convert.exe'))) {
      if (!process.env.PATH.includes(winPath)) {
        process.env.PATH = `${winPath};${process.env.PATH}`;
      }
      return true;
    }
    return false;
  }
})();

console.log(`[ByteMorph] Engine Load → Calibre    : ${CALIBRE_INSTALLED ? '✅' : '❌ NOT FOUND'}`);

module.exports = async function convertWithCalibre(buffer, targetExt, inputExt) {
  if (!CALIBRE_INSTALLED) {
    throw new Error('Calibre not found. Install it: winget install calibre.calibre');
  }

  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `bytemorph_calibre_${Date.now()}_${Math.random().toString(36).slice(2)}.${inputExt}`);
  const outputPath = path.join(tmpDir, `out_${Date.now()}.${targetExt}`);

  try {
    fs.writeFileSync(inputPath, buffer);

    await execFileAsync('ebook-convert', [inputPath, outputPath]);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Calibre failed to convert .${inputExt} to .${targetExt}.`);
    }

    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};
