const fs = require('fs');
const file = 'src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

const oldLine = source.split(/\r?\n/).find(line =>
  line.includes('<div className="mini-cafe-art"')
);

if (!oldLine) {
  console.error('Could not find the mini-cafe-art section.');
  process.exit(1);
}

const lines = source.split(/\r?\n/);
const index = lines.findIndex(line =>
  line.includes('<span>') &&
  line.includes('</span>') &&
  line.includes('mini-cafe-art') === false &&
  lines.indexOf(line) > lines.findIndex(item => item.includes('mini-cafe-art'))
);

if (index === -1) {
  console.error('Could not locate the icon line safely. No changes made.');
  process.exit(1);
}

lines[index] = '            <span>{String.fromCodePoint(0x2601)}</span><span>{String.fromCodePoint(0x1FAB4)}</span><span>{String.fromCodePoint(0x2615)}</span>';

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Cafe art icon line updated.');
