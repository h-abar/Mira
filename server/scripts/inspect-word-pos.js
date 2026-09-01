const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '../..');
  const filePath = fs.readdirSync(root).find((f) => f.includes('دليل-استخدام') && f.endsWith('.docx') && f.startsWith('د'));
  const full = path.join(root, filePath);
  const zip = await JSZip.loadAsync(fs.readFileSync(full));
  const key = Object.keys(zip.files).find((k) => k.endsWith('document.xml'));
  let xml = await zip.file(key).async('string');
  const idx = xml.indexOf('نقطة البيع');
  console.log('file:', filePath, 'POS index', idx);
  console.log(xml.slice(idx - 100, idx + 2000));
})();
