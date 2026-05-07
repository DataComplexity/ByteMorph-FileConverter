export const FORMATS = {
  Documents: {
    color: '#A78BFA',
    formats: ['PDF', 'DOCX', 'DOC', 'ODT', 'RTF', 'TXT', 'EPUB', 'MD', 'HTML', 'PAGES']
  },
  Images: {
    color: '#22D3EE',
    formats: ['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'SVG', 'HEIC', 'ICO', 'AVIF', 'PSD', 'EPS', 'RAW', 'DNG', 'TGA']
  },
  Video: {
    color: '#F472B6',
    formats: ['MP4', 'MKV', 'AVI', 'MOV', 'WEBM', 'FLV', 'WMV', '3GP', 'M4V', 'GIF']
  },
  Audio: {
    color: '#34D399',
    formats: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA', 'AIFF']
  },
  Data: {
    color: '#FBBF24',
    formats: ['CSV', 'JSON', 'XML', 'XLSX', 'XLS', 'YAML', 'YML', 'TOML', 'TSV']
  },
  Archives: {
    color: '#60A5FA',
    formats: ['ZIP', 'TAR', '7Z', 'RAR', 'GZ', 'BZ2', 'XZ', 'ISO']
  },
  Compress: {
    color: '#FB923C',
    formats: ['JPG', 'PNG', 'WEBP', 'GIF', 'PDF', 'MP4', 'MKV', 'MOV', 'MP3', 'WAV', 'DOCX', 'PPTX', 'XLSX', 'ZIP', 'RAR', '7Z', 'TAR']
  },
};


export const detectCategory = (filename) => {
  const ext = filename.split('.').pop().toUpperCase();
  for (const [cat, data] of Object.entries(FORMATS)) {
    if (data.formats.includes(ext)) return { category: cat, format: ext };
  }
  return { category: 'Documents', format: ext };
};

export const BG = '#05080F';

export const PILL_TAGS = [
  { f: 'PDF', c: '#A78BFA', pos: { top: '18%', left: '7%' }, dur: '6.5s', delay: '0s' },
  { f: 'MP4', c: '#F472B6', pos: { top: '22%', right: '7%' }, dur: '7.2s', delay: '1.2s' },
  { f: 'PNG', c: '#22D3EE', pos: { bottom: '28%', left: '9%' }, dur: '8s', delay: '2s' },
  { f: 'JSON', c: '#FBBF24', pos: { bottom: '22%', right: '8%' }, dur: '5.8s', delay: '0.7s' },
  { f: 'MP3', c: '#34D399', pos: { top: '44%', left: '4%' }, dur: '9s', delay: '1.5s' },
  { f: 'ZIP', c: '#60A5FA', pos: { top: '38%', right: '4%' }, dur: '7s', delay: '0.3s' },
];
export const stripExt = (filename) => {
  if (!filename) return 'file';
  const parts = filename.split('.');
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join('.').toLowerCase();
    if (['tar.gz', 'tar.bz2', 'tar.xz'].includes(lastTwo)) {
      return parts.slice(0, -2).join('.');
    }
  }
  parts.pop();
  return parts.join('.');
};
