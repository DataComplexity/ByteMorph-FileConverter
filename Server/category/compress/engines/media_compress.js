const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const LEVELS = {
  low:    { videoCRF: 23, audioBitrate: '192k' },
  medium: { videoCRF: 28, audioBitrate: '128k' },
  high:   { videoCRF: 35, audioBitrate: '96k'  },
};

const compressMedia = {
  video: (inputPath, outputPath, ext, levelKey) => {
    return new Promise((resolve, reject) => {
      const crf = LEVELS[levelKey]?.videoCRF || 28;
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          `-crf ${crf}`,
          '-preset fast',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`FFmpeg video error: ${err.message}`)))
        .run();
    });
  },

  audio: (inputPath, outputPath, levelKey) => {
    return new Promise((resolve, reject) => {
      const bitrate = LEVELS[levelKey]?.audioBitrate || '128k';
      ffmpeg(inputPath)
        .noVideo()
        .audioBitrate(bitrate)
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`FFmpeg audio error: ${err.message}`)))
        .run();
    });
  }
};

module.exports = compressMedia;
