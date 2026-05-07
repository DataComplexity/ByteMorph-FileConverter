const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, execSync } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Check once on module load
const PANDOC_INSTALLED = (() => {
  try {
    execSync('where pandoc', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

console.log(`[ByteMorph] Engine Load → Pandoc     : ${PANDOC_INSTALLED ? 'FOUND' : 'NOT FOUND'}`);

module.exports = async function convertWithPandoc(buffer, targetExt, inputExt) {
  if (!PANDOC_INSTALLED) {
    throw new Error('Pandoc not found. Install it: winget install jgm.pandoc');
  }

  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `bytemorph_pandoc_${Date.now()}_${Math.random().toString(36).slice(2)}.${inputExt}`);
  const outputPath = path.join(tmpDir, `out_${Date.now()}.${targetExt}`);

  try {
    fs.writeFileSync(inputPath, buffer);

    const args = [inputPath, '-o', outputPath];
    await execFileAsync('pandoc', args);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Pandoc failed to convert .${inputExt} to .${targetExt}.`);
    }

    return fs.readFileSync(outputPath);
  } finally {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
};
