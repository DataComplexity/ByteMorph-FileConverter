const sharp = require('sharp');

const LEVELS = {
  low: { imageQuality: 85 },
  medium: { imageQuality: 70 },
  high: { imageQuality: 50 },
};

module.exports = async function compressImage(inputPath, outputPath, ext, levelKey) {
  const quality = LEVELS[levelKey]?.imageQuality || 70;
  const fmt = ext === 'jpg' ? 'jpeg' : ext;

  let pipeline = sharp(inputPath);

  switch (fmt) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      // PNG is lossless — use pngquant-style reduction
      pipeline = pipeline.png({
        compressionLevel: levelKey === 'high' ? 9 : levelKey === 'medium' ? 7 : 5,
        palette: true,
        quality
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'gif':
      pipeline = pipeline.gif({ colours: levelKey === 'high' ? 64 : levelKey === 'medium' ? 128 : 200 });
      break;
    default:
      pipeline = pipeline.toFormat(fmt, { quality });
  }

  await pipeline.toFile(outputPath);
};
