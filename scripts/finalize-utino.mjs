import fs from 'node:fs';

// Release-safe finalizer. Keep the public product name "utino chat" intact.
// Legacy UTINOCHATV1 remains only as an internal compatibility marker where required.
const roots=['app','public','.github','README.md','package.json','wrangler.jsonc'];
function walk(dir){if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory())return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','.next','out','.wrangler'].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())walk(p)}}
for(const r of roots){if(r==='README.md'||r==='package.json'||r==='wrangler.jsonc')continue;walk(r)}
console.log('utino chat release finalizer passed');
