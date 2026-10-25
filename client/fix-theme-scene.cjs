const fs = require('fs');
const file = 'patch-cafe-themes.cjs';
let s = fs.readFileSync(file, 'utf8');

s = s.replace(
  /^const sceneNew = .*;$/m,
  'const sceneNew = \'className={`big-cafe-scene room-editor-scene theme-${roomTheme}`} \'.trim();'
);

fs.writeFileSync(file, s, 'utf8');
console.log('Scene replacement corrected.');
