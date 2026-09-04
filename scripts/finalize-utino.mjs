import fs from 'node:fs';
import path from 'node:path';

// Release finalizer: normalize legacy internal branding before production build.
// Public product identity is always "utino chat".
const roots = ['app', 'public', '.github', 'README.md', 'package.json', 'wrangler.jsonc'];
const textExt = /\.(js|jsx|ts|tsx|css|json|jsonc|mjs|sql|yml|yaml|md)$/;
const skip = new Set(['.git', 'node_modules', '.next', 'out', '.wrangler']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else if (textExt.test(entry.name)) files.push(file);
  }
  return files;
}

for (const root of roots) {
  const files = fs.existsSync(root) && fs.statSync(root).isDirectory() ? walk(root) : [root];
  for (const file of files) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(/UTINOCHATV1/g, 'utino chat').replace(/UtinoChatV1/g, 'utino chat');
    if (after !== before) fs.writeFileSync(file, after);
  }
}

console.log('utino chat release finalizer passed');
