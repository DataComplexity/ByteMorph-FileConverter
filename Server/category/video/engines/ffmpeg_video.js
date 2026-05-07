const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

module.exports = function convertVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .outputOptions('-preset ultrafast')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg video error: ${err.message}`)))
      .run();
  });
};
