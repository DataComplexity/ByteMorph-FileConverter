const sharp = require('sharp');
const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execFileAsync = promisify(execFile);

// Formats handled natively by Sharp
const SHARP_OUTPUT_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'tiff'];
const MAGICK_FORMATS = ['svg', 'heic', 'ico', 'psd', 'eps', 'raw', 'dng', 'tga'];

const cleanupFiles = (paths) => {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (_) {}
    }
  }
};

async function convertWithSharp(inputPath, outputPath, targetFormat) {
  let pipeline = sharp(inputPath);
  const fmt = targetFormat === 'jpg' ? 'jpeg' : targetFormat;

  switch (fmt) {
    case 'jpeg': pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true }); break;
    case 'png':  pipeline = pipeline.png({ compressionLevel: 6 }); break;
    case 'webp': pipeline = pipeline.webp({ quality: 85 }); break;
    case 'gif':  pipeline = pipeline.gif(); break;
    case 'avif': pipeline = pipeline.avif({ quality: 65 }); break;
    case 'tiff': pipeline = pipeline.tiff({ compression: 'lzw' }); break;
    default:     pipeline = pipeline.toFormat(fmt);
  }
  await pipeline.toFile(outputPath);
}

async function convertWithMagick(inputPath, outputPath, inputExt) {
  const args = [];
  if (['svg', 'eps'].includes(inputExt)) args.push('-density', '300');
  if (inputExt === 'psd') args.push('-flatten');
  
  if (['psd', 'tiff', 'gif'].includes(inputExt)) {
    args.push(`${inputPath}[0]`);
  } else {
    args.push(inputPath);
  }

  args.push('-strip');
  args.push('-auto-orient');

  const outputExt = path.extname(outputPath).slice(1).toLowerCase();
  if (['jpg', 'jpeg', 'webp', 'avif'].includes(outputExt)) {
    args.push('-quality', '90');
  }

  args.push(outputPath);
  await execFileAsync('magick', args, { timeout: 60000 });
}

module.exports = {
  pickEngine: (inputExt) => (MAGICK_FORMATS.includes(inputExt) ? 'imagemagick' : 'sharp'),
  
  convert: async (inputPath, outputPath, targetFormat, inputExt) => {
    const isSharpInput = !MAGICK_FORMATS.includes(inputExt);

    if (isSharpInput) {
      await convertWithSharp(inputPath, outputPath, targetFormat);
    } else {
      const target = targetFormat === 'jpg' ? 'jpeg' : targetFormat;
      if (SHARP_OUTPUT_FORMATS.includes(target) || targetFormat === 'jpg') {
        const intermediatePath = outputPath + '.intermediate.png';
        try {
          await convertWithMagick(inputPath, intermediatePath, inputExt);
          await convertWithSharp(intermediatePath, outputPath, targetFormat);
        } finally {
          cleanupFiles([intermediatePath]);
        }
      } else {
        await convertWithMagick(inputPath, outputPath, inputExt);
      }
    }
  }
};
