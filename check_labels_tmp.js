const fs = require('fs');
const src = fs.readFileSync('client/src/pages/SettingsPage.tsx', 'utf8');
const start = src.indexOf('const L = {');
const end = src.indexOf('\n  };', start);
const block = src.slice(start, end);

function keysOf(name) {
  const m = block.indexOf(`${name}: {`);
  const e = block.indexOf('\n  },', m);
  const seg = block.slice(m, e);
  const keys = [...seg.matchAll(/^\s{4}([A-Za-z0-9_]+):/gm)].map((x) => x[1]);
  return keys;
}
const ar = keysOf('ar');
const en = keysOf('en');
const onlyAr = ar.filter((k) => !en.includes(k));
const onlyEn = en.filter((k) => !ar.includes(k));
console.log('ar count:', ar.length, '| en count:', en.length);
console.log('ONLY IN AR:', JSON.stringify(onlyAr));
console.log('ONLY IN EN:', JSON.stringify(onlyEn));
// duplicates
const dupAr = ar.filter((k, i) => ar.indexOf(k) !== i);
const dupEn = en.filter((k, i) => en.indexOf(k) !== i);
console.log('DUP AR:', JSON.stringify(dupAr), 'DUP EN:', JSON.stringify(dupEn));
