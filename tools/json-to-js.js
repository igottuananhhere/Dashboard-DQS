// Regenerates JSON/mock-assets.js and JSON/mock-rules.js from the .json sources next to them.
// Run after editing mock-assets.json / mock-rules.json: `node tools/json-to-js.js`
// Do NOT hand-edit the generated .js files.
const fs = require('fs');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'JSON');

const FILES = [
  { src: 'mock-assets.json', out: 'mock-assets.js', varName: 'MOCK_ASSETS_DATA' },
  { src: 'mock-rules.json', out: 'mock-rules.js', varName: 'MOCK_RULES_DATA' },
];

for (const { src, out, varName } of FILES) {
  const srcPath = path.join(JSON_DIR, src);
  const outPath = path.join(JSON_DIR, out);
  const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const contents = `window.${varName} = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(outPath, contents, 'utf8');
  console.log(`${src} -> ${out}`);
}
