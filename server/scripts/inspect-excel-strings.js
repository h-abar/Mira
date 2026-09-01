const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

(async () => {
  const filePath = path.resolve(__dirname, '../../باسوردات-النظام-Mira.xlsx');
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const ssKey = Object.keys(zip.files).find((k) => k.endsWith('sharedStrings.xml'));
  const ss = await zip.file(ssKey).async('string');
  const texts = [...ss.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
  console.log('sharedStrings count:', texts.length);
  texts.forEach((t, i) => console.log(`${i + 1}. ${t}`));
})();
