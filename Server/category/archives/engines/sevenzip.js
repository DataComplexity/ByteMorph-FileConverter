const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const SEVENZIP_CANDIDATES = [
  'C:\\Program Files\\7-Zip\\7z.exe',
  'C:\\Program Files (x86)\\7-Zip\\7z.exe',
  '7z'
];

function find7Zip() {
  for (const candidate of SEVENZIP_CANDIDATES) {
    if (candidate === '7z') return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return '7z';
}

const SEVENZIP = find7Zip();

const cleanupFiles = (paths) => {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (_) {}
    }
  }
};

async function createTarCompressed(sourceDir, outputPath, compression) {
  const tarPath = outputPath + '.intermediate.tar';
  try {
    await execFileAsync(SEVENZIP, [
      'a', '-ttar', tarPath, path.join(sourceDir, '*'), '-y'
    ], { timeout: 120000 });

    const compressType = { gzip: 'gzip', bzip2: 'bzip2', xz: 'xz' }[compression];
    await execFileAsync(SEVENZIP, [
      'a', `-t${compressType}`, outputPath, tarPath, '-y'
    ], { timeout: 120000 });
  } finally {
    cleanupFiles([tarPath]);
  }
}

module.exports = {
  extract: async (archivePath, extractDir) => {
    const args = ['x', archivePath, `-o${extractDir}`, '-y'];
    try {
      await execFileAsync(SEVENZIP, args, { timeout: 120000 });
    } catch (err) {
      throw new Error(`Extraction failed: ${err.stderr || err.message}`);
    }
  },
  
  create: async (sourceDir, outputPath, targetFormat) => {
    const args = ['a'];
    switch (targetFormat) {
      case 'zip': args.push('-tzip'); break;
      case '7z':  args.push('-t7z', '-mx=7'); break;
      case 'tar': args.push('-ttar'); break;
      case 'gz':  return await createTarCompressed(sourceDir, outputPath, 'gzip');
      case 'bz2': return await createTarCompressed(sourceDir, outputPath, 'bzip2');
      case 'xz':  return await createTarCompressed(sourceDir, outputPath, 'xz');
      case 'iso': args.push('-tudf'); break;
      default:    args.push(`-t${targetFormat}`);
    }
    args.push(outputPath, path.join(sourceDir, '*'), '-y');
    try {
      await execFileAsync(SEVENZIP, args, { timeout: 120000 });
    } catch (err) {
      throw new Error(`Archive creation failed: ${err.stderr || err.message}`);
    }
  }
};
