// Polyfill required browser APIs that Node v20 doesn't have natively
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
  };
}
if (typeof global.Path2D === 'undefined') { global.Path2D = class Path2D { }; }
if (typeof global.ImageData === 'undefined') { global.ImageData = class ImageData { }; }

const pdfParse = require('pdf-parse');

console.log(`[ByteMorph] Engine Load → PDF-Parse: DONE`);

module.exports = async function convertFromPDF(buffer, targetExt) {
  if (targetExt === 'txt' || targetExt === 'md') {
    // pdf-parse elegantly rips the text out of the PDF Buffer
    const data = await pdfParse(buffer);
    return Buffer.from(data.text, 'utf-8');
  }

  // If a user tries to convert PDF to DOCX or something else
  throw new Error(`PDF to .${targetExt} is currently unsupported in ByteMorph. Native extraction supports .txt and .md formats only.`);
};
