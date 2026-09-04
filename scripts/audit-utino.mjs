import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "app/messenger/page.js",
  "app/messenger/ChatWorkspace.js",
  "app/messenger/ChatWorkspaceImpl.js",
  "app/login/page.js",
  "app/intro/page.js",
  "app/settings/page.js",
  "next.config.js",
  "wrangler.jsonc",
];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`missing:${file}`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }

const next = read("next.config.js");
if (!/output:\s*["']export["']/.test(next)) failures.push("next:output-export");
if (!/trailingSlash:\s*true/.test(next)) failures.push("next:trailing-slash");
if (!/unoptimized:\s*true/.test(next)) failures.push("next:image-unoptimized");

const wrangler = read("wrangler.jsonc");
if (!/\"directory\"\s*:\s*\"\.\/out\"/.test(wrangler)) failures.push("wrangler:assets-out");
if (!/single-page-application/.test(wrangler)) failures.push("wrangler:spa-fallback");
if (!/\"name\"\s*:\s*\"utinochat\"/.test(wrangler)) failures.push("wrangler:worker-name");

const messenger = read("app/messenger/ChatWorkspaceImpl.js");
for (const token of ["create_conversation","join_conversation","join_via_invite","get_or_create_direct_conversation","mark_messages_seen","edit_message","delete_message","chat-files","search_user_directory"])
  if (!messenger.includes(token)) failures.push(`messenger:${token}`);

const settings = read("app/settings/page.js");
for (const token of ["update_my_profile","get_my_profile","localStorage","utino chat"])
  if (!settings.includes(token)) failures.push(`settings:${token}`);

const login = read("app/login/page.js");
for (const token of ["public-register","get_registration_enabled","signInWithPassword","utino.chat"])
  if (!login.includes(token)) failures.push(`auth:${token}`);

const sourceFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".next","out",".git",".wrangler"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx|css|json|jsonc|mjs|sql|yml|yaml|md)$/.test(entry.name)) sourceFiles.push(full);
  }
}
walk(root);

const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'`]ey/i,
  /service_role\s*[:=]\s*["'`]ey/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(text))) failures.push(`secret-like-content:${path.relative(root, file)}`);
}

if (failures.length) {
  console.error("utino chat static audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`utino chat static audit passed (${sourceFiles.length} source files scanned).`);
