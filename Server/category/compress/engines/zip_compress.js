const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const archiver = require('archiver');

const execFileAsync = promisify(execFile);

// 7-Zip Path Detection
const get7zPath = () => {
  const candidates = ['C:\\Program Files\\7-Zip\\7z.exe', '7z'];
  for (const c of candidates) {
    if (c.includes('\\') && fs.existsSync(c)) return c;
    if (!c.includes('\\')) return c;
  }
  return '7z';
};
const SEVENZIP = get7zPath();

const cleanupDir = (dir) => {
  if (dir && fs.existsSync(dir)) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
};

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bytemorph-zip-comp-'));

const zipCompress = {
  office: async (inputPath, outputPath, levelKey) => {
    const extractDir = makeTempDir();
    try {
      await execFileAsync(SEVENZIP, ['x', inputPath, `-o${extractDir}`, '-y'], { timeout: 60000 });
      const compLevel = levelKey === 'low' ? 5 : levelKey === 'medium' ? 7 : 9;
      
      await new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: compLevel } });
        const output = fs.createWriteStream(outputPath);
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(extractDir, false);
        archive.finalize();
      });
    } finally {
      cleanupDir(extractDir);
    }
  },

  archive: async (inputPath, outputPath, ext, levelKey) => {
    const extractDir = makeTempDir();
    const compressionArg = levelKey === 'low' ? '-mx=3' : levelKey === 'medium' ? '-mx=7' : '-mx=9';
    try {
      await execFileAsync(SEVENZIP, ['x', inputPath, `-o${extractDir}`, '-y'], { timeout: 120000 });
      const outputExt = ['zip', 'tar'].includes(ext) ? ext : '7z';
      const typeFlag = outputExt === 'zip' ? '-tzip' : outputExt === 'tar' ? '-ttar' : '-t7z';

      await execFileAsync(SEVENZIP, [
        'a', typeFlag, compressionArg,
        outputPath,
        path.join(extractDir, '*'),
        '-y'
      ], { timeout: 120000 });
    } finally {
      cleanupDir(extractDir);
    }
  }
};

module.exports = zipCompress;
