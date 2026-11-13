// Gera o .bat + pasta github e publica no repositorio (so envia o que mudou).
// Uso:  node fonte/publicar.js ["mensagem"]
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), crypto = require('crypto');
const REPO = 'rivatto/legenda-reels', BRANCH = 'main';
const dir = __dirname, ghDir = path.join(dir, '..', 'github');

const candidates = [path.join(process.env.LOCALAPPDATA || '', 'Programs', 'GitHubCLI', 'bin', 'gh.exe'), 'C:\\Program Files\\GitHub CLI\\gh.exe', 'gh'];
const GH = candidates.find(c => c === 'gh' || fs.existsSync(c));
function gh(args, opts) { return cp.execFileSync(GH, args, Object.assign({ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, opts || {})); }

try { gh(['auth', 'status']); } catch (e) { console.error('GitHub CLI sem login. Rode:  gh auth login'); process.exit(2); }

cp.execFileSync(process.execPath, [path.join(dir, 'build-bat.js')], { stdio: 'inherit' });
const ver = fs.readFileSync(path.join(ghDir, 'version.txt'), 'utf8').trim();
const msg = process.argv[2] || ('Legenda Reels v' + ver);

function blobSha(buf) { return crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex'); }
function remoteSha(name) {
  try { return gh(['api', 'repos/' + REPO + '/contents/' + name + '?ref=' + BRANCH, '--jq', '.sha']).trim(); } catch (e) { return null; }
}
// version.txt por ultimo: ninguem ve o numero novo antes de o script novo estar la
let sent = 0;
for (const name of ['LegendaReels.jsx', 'Instalar-LegendaReels.bat', 'version.txt']) {
  const buf = fs.readFileSync(path.join(ghDir, name)), sha = remoteSha(name);
  if (sha === blobSha(buf)) { console.log('igual, pulei: ' + name); continue; }
  const body = { message: msg, content: buf.toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const tmp = path.join(os.tmpdir(), 'lg_put_' + Date.now() + '.json');
  fs.writeFileSync(tmp, JSON.stringify(body));
  try { gh(['api', '-X', 'PUT', 'repos/' + REPO + '/contents/' + name, '--input', tmp, '--silent']); console.log('publicado:   ' + name); sent++; }
  finally { fs.unlinkSync(tmp); }
}
console.log(sent ? ('\nv' + ver + ' publicada em https://github.com/' + REPO) : '\nNada mudou; o GitHub ja esta na v' + ver + '.');
