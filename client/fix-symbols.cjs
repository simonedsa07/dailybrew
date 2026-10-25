const fs = require('fs');

const file = 'src/App.tsx';
const backup = 'src/App.tsx.before-symbol-fix';
let source = fs.readFileSync(file, 'utf8');

const replacements = [
  ['ðŸ’§', '💧'],
  ['ðŸ“š', '📚'],
  ['ðŸŒ±', '🌱'],
  ['ðŸŒ·', '🌷'],
  ['ðŸŒ¿', '🌿'],
  ['ðŸª´', '🪴'],
  ['ðŸª™', '🪙'],
  ['ðŸ«˜', '🫠'],
  ['ðŸšŒ', '🚗'],
  ['ðŸ·', '🐷'],
  ['ðŸ°', '🍰'],
  ['ðŸ¥°', '🥰'],
  ['ðŸ˜Š', '😊'],
  ['ðŸ˜Œ', '😌'],
  ['ðŸ¥±', '🥱'],
  ['ðŸŒ§ï¸', '🌧️'],
  ['â˜•', '☕'],
  ['â˜€', '☀'],
  ['â˜', '☁'],
  ['âŒ‚', '⌂'],
  ['â˜‘', '☑'],
  ['â—ˆ', '◈'],
  ['â–¤', '▤'],
  ['âš™', '⚙'],
  ['âœ¦', '✦'],
  ['âœ³', '✳'],
  ['âœ¿', '✿'],
  ['â™¡', '♡'],
  ['â–¥', '♥'],
  ['â–°', '▰'],
  ['âœ“', '✓'],
  ['â†—', '↗'],
  ['â‚¹', '₹'],
  ['âˆ’', '−'],
  ['ï¼‹', '+'],
  ['Ã—', '×'],
  ['cafÃ©', 'café'],
  ['Letâ€™s', 'Let’s'],
  ['Â·', '·'],
];

for (const [bad, good] of replacements) {
  source = source.split(bad).join(good);
}

fs.writeFileSync(file, source, 'utf8');
console.log('Symbol replacement pass completed.');
