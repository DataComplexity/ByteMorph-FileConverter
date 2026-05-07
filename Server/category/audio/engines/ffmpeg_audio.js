const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const CODEC_MAP = {
  mp3: { codec: 'libmp3lame', format: 'mp3', bitrate: '192k' },
  wav: { codec: 'pcm_s16le', format: 'wav', bitrate: null },
  flac: { codec: 'flac', format: 'flac', bitrate: null },
  aac: { codec: 'aac', format: 'adts', bitrate: '192k' },
  ogg: { codec: 'libvorbis', format: 'ogg', bitrate: '192k' },
  m4a: { codec: 'aac', format: 'ipod', bitrate: '192k' },
  wma: { codec: 'wmav2', format: 'asf', bitrate: '192k' },
  aiff: { codec: 'pcm_s16be', format: 'aiff', bitrate: null },
};

module.exports = function convertAudio(inputPath, outputPath, targetFormat) {
  return new Promise((resolve, reject) => {
    const mapping = CODEC_MAP[targetFormat];
    if (!mapping) return reject(new Error(`No codec mapping for: ${targetFormat}`));

    let cmd = ffmpeg(inputPath)
      .noVideo()
      .audioCodec(mapping.codec)
      .toFormat(mapping.format);

    if (mapping.bitrate) {
      cmd = cmd.audioBitrate(mapping.bitrate);
    }

    cmd
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`FFmpeg audio error: ${err.message}`)))
      .save(outputPath);
  });
};
