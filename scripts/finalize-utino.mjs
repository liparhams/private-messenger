import fs from 'node:fs';

// Release-safe finalizer. Source files are the authority; this script only normalizes legacy branding.
const roots=['app','public','.github','README.md','package.json','wrangler.jsonc'];
function normalizeFile(p){if(!fs.existsSync(p)||!fs.statSync(p).isFile())return;const s=fs.readFileSync(p,'utf8');const n=s.replaceAll('Utino Chat v1','UTINOCHATV1').replaceAll('Utino Chat','UTINOCHATV1');if(n!==s)fs.writeFileSync(p,n)}
function walk(dir){if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory())return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','.next','out'].includes(e.name))continue;const p=`${dir}/${e.name}`;if(e.isDirectory())walk(p);else if(/\.(js|jsx|ts|tsx|json|css|md|html|yml|yaml|jsonc)$/.test(e.name))normalizeFile(p)}}
for(const r of roots){if(r==='README.md'||r==='package.json'||r==='wrangler.jsonc')normalizeFile(r);else walk(r)}
