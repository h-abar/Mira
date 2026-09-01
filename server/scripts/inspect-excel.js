const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

(async () => {
  const filePath = path.resolve(__dirname, '../../باسوردات-النظام-Mira.xlsx');
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const wbKey = Object.keys(zip.files).find((k) => k.endsWith('workbook.xml'));
  const wb = await zip.file(wbKey).async('string');
  const names = [...wb.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
  console.log('Sheets:', names);

  for (let i = 1; i <= 4; i++) {
    const sheetKey = Object.keys(zip.files).find((k) => k.includes(`sheet${i}.xml`));
    if (!sheetKey) continue;
    const xml = await zip.file(sheetKey).async('string');
    const texts = [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
    console.log(`\n--- Sheet ${i} (${names[i - 1] || '?'}) ---`);
    texts.forEach((t, idx) => console.log(`${idx + 1}. ${t}`));
  }
})();
