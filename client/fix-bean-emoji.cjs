const fs = require('fs');
const file = 'src/App.tsx';
const backup = 'src/App.tsx.before-bean-emoji';
fs.copyFileSync(file, backup);

let source = fs.readFileSync(file, 'utf8');
source = source.replaceAll('0x1FABD', '0x1FAD8');
fs.writeFileSync(file, source, 'utf8');

console.log('Bean emoji fixed. Backup:', backup);
