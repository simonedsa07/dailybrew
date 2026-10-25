const fs = require('fs');
const file = 'src/App.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(
  /\.sidebar\s*\{[^}]*\}/,
  `.sidebar {
  width: 244px;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  padding: 27px 16px 15px;
  background: #fffdf8;
  border-right: 1px solid var(--line);
  overflow-y: auto;
}`
);

css = css.replace(
  /\.sidebar-spacer\s*\{[^}]*\}/,
  `.sidebar-spacer {
  flex: 1 0 12px;
  min-height: 12px;
}`
);

css = css.replace(
  /\.sidebar-cafe\s*\{[^}]*\}/,
  `.sidebar-cafe {
  flex-shrink: 0;
  padding: 14px 13px;
  overflow: visible;
  border: 1px solid #ead9c6;
  border-radius: 13px;
  background: #f9efe1;
}`
);

fs.writeFileSync(file, css, 'utf8');
console.log('Sidebar layout fix applied.');
