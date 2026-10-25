const fs = require('fs');
const file = 'src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

source = source.replace(
  /<div className="big-cafe-window">[\s\S]*?<\/div>/,
  '<div className="big-cafe-window">{String.fromCodePoint(0x2601)}<span>✦</span><i>✿</i></div>'
);

source = source.replace(
  /<div className="big-cafe-shelf">[\s\S]*?<\/div>/,
  '<div className="big-cafe-shelf">📚　🪴　📚</div>'
);

source = source.replace(
  /<div className="big-cafe-counter">[\s\S]*?<\/div>/,
  '<div className="big-cafe-counter">🌿　▰ ☕ ▰　🪴</div>'
);

source = source.replace(
  /name: 'Warm lamp',\s*price: 45/,
  "name: 'Warm lamp', price: 45"
);

source = source.replace(
  /icon: 'ðŸ’¡'/,
  "icon: String.fromCodePoint(0x1F4A1)"
);

source = source.replace(
  /icon: 'ðŸª‘'/,
  "icon: String.fromCodePoint(0x1FA91)"
);

fs.writeFileSync(file, source, 'utf8');
console.log('Cafe artwork replacements applied.');
