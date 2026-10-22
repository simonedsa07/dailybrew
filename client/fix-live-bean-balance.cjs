const fs = require('fs');

const file = 'src/App.tsx';
const backup = 'src/App.tsx.before-live-bean-balance';
fs.copyFileSync(file, backup);

let source = fs.readFileSync(file, 'utf8');

source = source.replace(
  /<span className="bean-chip">🫠\s*<strong>120<\/strong> beans<\/span>/,
  '<span className="bean-chip">🫘 <strong>{beanBalance}</strong> beans</span>'
);

source = source.replace(
  /<div className="stat-number">120\s*<span>beans<\/span><\/div>/,
  '<div className="stat-number">{beanBalance} <span>beans</span></div>'
);

fs.writeFileSync(file, source, 'utf8');
console.log('Live bean balance applied. Backup:', backup);
