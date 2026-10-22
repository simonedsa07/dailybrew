const fs = require('fs');

const patchPath = 'patch-cafe-themes.cjs';
let patch = fs.readFileSync(patchPath, 'utf8');
const lines = patch.split(/\r?\n/);

let foundOld = false;
let foundNew = false;

const updated = lines.map((line) => {
  if (line.startsWith('const sceneOld = ')) {
    foundOld = true;
    return 'const sceneOld = \'className="big-cafe-scene room-editor-scene"\';';
  }

  if (line.startsWith('const sceneNew = ')) {
    foundNew = true;
    return 'const sceneNew = \'className={`big-cafe-scene room-editor-scene theme-${roomTheme}`} \'.trim();';
  }

  return line;
});

if (!foundOld || !foundNew) {
  throw new Error('Could not locate both scene constants in the patch script. No patch applied.');
}

// Build the JSX className replacement as a literal string.
const corrected = updated.map((line) => {
  if (line.includes('const sceneNew =')) {
    return 'const sceneNew = \'className={`big-cafe-scene room-editor-scene theme-${roomTheme}`} \'.trim();';
  }
  return line;
}).join('\n');

// Verify the patch script contains the expected selector and controls.
if (!corrected.includes('className="big-cafe-scene room-editor-scene"')) {
  throw new Error('Corrected scene selector was not created.');
}

fs.writeFileSync(patchPath, corrected, 'utf8');
console.log('Patch script updated.');
