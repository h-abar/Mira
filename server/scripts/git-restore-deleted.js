const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
process.chdir(root);

function gitOut(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function cleanPath(file) {
  return file.replace(/^"+|"+$/g, '').replace(/\\(\d{3})/g, (_, oct) =>
    String.fromCharCode(parseInt(oct, 8)),
  );
}

const deletedRaw = execFileSync('git', ['ls-files', '-d', '-z']);
const deleted = deletedRaw
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

for (const file of deleted) {
  console.log('Restoring via git show:', file);
  const content = execFileSync('git', ['show', `HEAD:${file}`]);
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

const onDisk = fs.readdirSync(root);
const typoManual = onDisk.find((f) => f.startsWith('d') && f.includes('Mira.docx'));
const arabicManual = onDisk.find((f) => f.startsWith('د') && f.includes('Mira.docx'));

if (typoManual && arabicManual) {
  fs.copyFileSync(path.join(root, typoManual), path.join(root, arabicManual));
  console.log('Synced manual content to Arabic file');
} else if (typoManual && !arabicManual) {
  const target = 'دليل-استخدام-نظام-ميرa-Mira.docx'.replace('ميرa', 'ميرا');
  // use git tracked name
  const tracked = gitOut(['ls-files'])
    .split(/\r?\n/)
    .map(cleanPath)
    .find((f) => f.startsWith('د') && f.includes('Mira.docx'));
  if (tracked) {
    fs.copyFileSync(path.join(root, typoManual), path.join(root, tracked));
    console.log('Created', tracked);
  }
}

console.log('Done restore.');
