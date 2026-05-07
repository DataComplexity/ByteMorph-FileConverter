const XLSX = require('xlsx');
const { parse: csvParse } = require('csv-parse/sync');
const { stringify: csvStringify } = require('csv-stringify/sync');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const yaml = require('js-yaml');
const toml = require('@iarna/toml');

const MIME_MAP = {
  csv:  'text/csv',
  tsv:  'text/tab-separated-values',
  json: 'application/json',
  xml:  'application/xml',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  yaml: 'text/yaml',
  yml:  'text/yaml',
  toml: 'application/toml',
};

const parsers = {
  csv: (b) => csvParse(b.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }),
  tsv: (b) => csvParse(b.toString('utf-8'), { columns: true, delimiter: '\t', skip_empty_lines: true, trim: true, relax_column_count: true }),
  json: (b) => {
    const p = JSON.parse(b.toString('utf-8'));
    if (Array.isArray(p)) return p;
    for (const k of ['data', 'items', 'rows', 'records', 'results']) if (Array.isArray(p[k])) return p[k];
    return [p];
  },
  xml: (b) => {
    const p = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' }).parse(b.toString('utf-8'));
    for (const k of Object.keys(p)) {
      if (typeof p[k] === 'object' && p[k] !== null) {
        for (const ik of Object.keys(p[k])) if (Array.isArray(p[k][ik])) return p[k][ik];
        return [p[k]];
      }
    }
    return [p];
  },
  xlsx: (b) => {
    const wb = XLSX.read(b, { type: 'buffer' });
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  },
  yaml: (b) => {
    const p = yaml.load(b.toString('utf-8'));
    if (Array.isArray(p)) return p;
    for (const k of ['data', 'items', 'rows', 'records', 'results']) if (Array.isArray(p[k])) return p[k];
    return [p];
  },
  toml: (b) => {
    const p = toml.parse(b.toString('utf-8'));
    for (const k of Object.keys(p)) if (Array.isArray(p[k])) return p[k];
    return [p];
  }
};

const serializers = {
  csv: (d) => Buffer.from(csvStringify(d, { header: true }), 'utf-8'),
  tsv: (d) => Buffer.from(csvStringify(d, { header: true, delimiter: '\t' }), 'utf-8'),
  json: (d) => Buffer.from(JSON.stringify(d, null, 2), 'utf-8'),
  xml: (d) => {
    const b = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: '  ' });
    return Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n' + b.build({ root: { row: d } }), 'utf-8');
  },
  xlsx: (d, ext) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d), 'Sheet1');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: ext === 'xls' ? 'xls' : 'xlsx' }));
  },
  yaml: (d) => Buffer.from(yaml.dump(d, { indent: 2 }), 'utf-8'),
  toml: (d) => Buffer.from(toml.stringify({ items: d }), 'utf-8'),
};

module.exports = {
  parse: (buffer, ext) => {
    const fn = parsers[ext === 'xls' ? 'xlsx' : (ext === 'yml' ? 'yaml' : ext)];
    if (!fn) throw new Error(`No parser for .${ext}`);
    return fn(buffer);
  },
  serialize: (data, ext) => {
    const fn = serializers[ext === 'xls' ? 'xlsx' : (ext === 'yml' ? 'yaml' : ext)];
    if (!fn) throw new Error(`No serializer for .${ext}`);
    return fn(data, ext);
  },
  getMime: (ext) => MIME_MAP[ext] || 'application/octet-stream'
};
