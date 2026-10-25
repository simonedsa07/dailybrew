const fs = require('fs');

const appPath = 'src/App.tsx';
const cssPath = 'src/App.css';
let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

const sceneOld = 'className="big-cafe-scene room-editor-scene"';
const sceneNew = 'className={`big-cafe-scene room-editor-scene theme-${roomTheme}`} '.trim();
const controlsOld = '<div className="room-editor-controls">';

const themePicker = ` <div className="room-theme-picker">
                <label htmlFor="cafe-room-theme">Choose your café mood</label>
                <select
                  id="cafe-room-theme"
                  value={roomTheme}
                  onChange={(event) => setRoomTheme(event.target.value)}
                >
                  <option value="cozy-brown">☕ Cozy Brown</option>
                  <option value="sakura">🌸 Sakura Dreams</option>
                  <option value="midnight-cafe">🌙 Midnight Café</option>
                </select>
                <p className="small-note">Choose a look, then save your layout to keep it.</p>
              </div>

              <div className="room-editor-controls">`;

if (app.includes('id="cafe-room-theme"')) {
  throw new Error('Theme selector already exists. No files changed.');
}
if (app.split(sceneOld).length !== 2) {
  throw new Error('Expected exactly one café scene opening. No files changed.');
}
if (app.split(controlsOld).length !== 2) {
  throw new Error('Expected exactly one room editor controls opening. No files changed.');
}

const backupApp = appPath + '.before-themes';
const backupCss = cssPath + '.before-themes';

if (fs.existsSync(backupApp) || fs.existsSync(backupCss)) {
  throw new Error('Theme backup already exists. No files changed; rename the old backup first if you intend to retry.');
}

fs.copyFileSync(appPath, backupApp);
fs.copyFileSync(cssPath, backupCss);

app = app.replace(sceneOld, sceneNew);
app = app.replace(controlsOld, themePicker);

css += `

/* Café room themes */
.room-theme-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 12px;
  padding: 13px 15px;
  border: 1px solid #e8d5c1;
  border-radius: 12px;
  background: #fffaf3;
}

.room-theme-picker label {
  color: #72533d;
  font-size: 12px;
  font-weight: 700;
}

.room-theme-picker select {
  max-width: 100%;
  padding: 9px 12px;
  border: 1px solid #d9bda2;
  border-radius: 9px;
  background: #fff;
  color: #674a35;
  font: inherit;
  cursor: pointer;
}

.room-theme-picker .small-note {
  flex-basis: 100%;
  margin: 0;
}

.big-cafe-scene.theme-cozy-brown {
  background: #f4dfc6;
  border-color: #b9906c;
  box-shadow: inset 0 -15px #e5c39e;
}

.theme-cozy-brown .big-cafe-window {
  background: #f9edcf;
  border-color: #a47a58;
  box-shadow: inset 0 0 0 3px #dfbc91;
}

.theme-cozy-brown .big-cafe-window::before {
  background: #a47a58;
}

.theme-cozy-brown .big-cafe-counter {
  background: #bd8c62;
  border-color: #976744;
}

.theme-cozy-brown .big-cafe-floor {
  background: repeating-linear-gradient(90deg, #dcb993 0 55px, #e8c8a4 55px 110px);
  border-color: #c39a73;
}

.big-cafe-scene.theme-sakura {
  background: #f9e1ec;
  border-color: #d795b6;
  box-shadow: inset 0 -15px #edbed5;
}

.theme-sakura .big-cafe-window {
  background: #fff0f6;
  border-color: #d795b6;
  box-shadow: inset 0 0 0 3px #f1c6dc;
  color: #c47fa1;
}

.theme-sakura .big-cafe-window::before {
  background: #d795b6;
}

.theme-sakura .big-cafe-counter {
  background: #d99ab9;
  border-color: #bd789a;
}

.theme-sakura .big-cafe-floor {
  background: repeating-linear-gradient(90deg, #f0c8dc 0 55px, #f8dce9 55px 110px);
  border-color: #d99ab9;
}

.big-cafe-scene.theme-midnight-cafe {
  background: #34334f;
  border-color: #77709f;
  box-shadow: inset 0 -15px #292840;
}

.theme-midnight-cafe .big-cafe-window {
  background: #454260;
  border-color: #9186bb;
  box-shadow: inset 0 0 0 3px #625d85;
  color: #f3d9a5;
}

.theme-midnight-cafe .big-cafe-window::before {
  background: #9186bb;
}

.theme-midnight-cafe .big-cafe-counter {
  background: #686087;
  border-color: #494363;
}

.theme-midnight-cafe .big-cafe-floor {
  background: repeating-linear-gradient(90deg, #44415e 0 55px, #514b70 55px 110px);
  border-color: #77709f;
}

.theme-midnight-cafe .big-cafe-shelf {
  border-bottom-color: #9186bb;
}

.theme-midnight-cafe .room-placement {
  background: #f6e8c9;
  border-color: #9186bb;
  box-shadow: 0 3px 0 #625d85;
}

@media (max-width: 600px) {
  .room-theme-picker {
    align-items: stretch;
    flex-direction: column;
  }

  .room-theme-picker select {
    width: 100%;
  }
}
`;

fs.writeFileSync(appPath, app, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');

console.log('Café theme selector added.');
console.log('Backups: App.tsx.before-themes and App.css.before-themes');
