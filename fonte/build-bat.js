// Gera tudo o que vai para o GitHub (pasta ../github) e o instalador de arquivo unico.
//   LegendaReels.jsx      -> script do After (painel antigo ScriptUI + logica das legendas)
//   cep/index.html        -> painel HTML (interface nova)
//   cep/host.jsx          -> o mesmo script, em modo "sem interface", usado pelo painel HTML
//   cep/manifest.xml      -> registro do painel HTML no After
//   Instalar-chavebaixa-reels.bat -> instala o painel HTML (sem administrador)
// Uso:  node fonte/build-bat.js
const fs = require('fs'), path = require('path');
const dir = __dirname, gh = path.join(dir, '..', 'github');
const script = fs.readFileSync(path.join(dir, 'LegendaReels.jsx'), 'utf8');
const ver = (/LG\.VERSION = "([^"]+)"/.exec(script) || [, '?'])[1];
if (/[^\x00-\x7E]/.test(script)) throw new Error('LegendaReels.jsx precisa ser ASCII puro');

// a imagem de fundo vai embutida no proprio index.html (um arquivo so para instalar e atualizar)
const bgFile = path.join(dir, 'cep', 'bg.webp');
const bgData = fs.existsSync(bgFile) ? 'data:image/webp;base64,' + fs.readFileSync(bgFile).toString('base64') : 'data:,';
const html = fs.readFileSync(path.join(dir, 'cep', 'index.html'), 'utf8').split('__VERSION__').join(ver).split('__BG_DATA__').join(bgData);
if (process.argv[2] === '--preview') { fs.writeFileSync(process.argv[3], html, 'utf8'); console.log('preview', html.length); process.exit(0); }
if (html.indexOf('chavebaixa-reels-panel v' + ver + ' ') < 0) throw new Error('marcador de versao ausente no index.html');
const host = '$.global.__LG_HEADLESS = true;\n' + script;
const manifest = fs.readFileSync(path.join(dir, 'cep', 'manifest.xml'), 'utf8');

const b64 = s => Buffer.from(s, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n').replace(/\r\n$/, '');
const ps = "$l=[IO.File]::ReadAllLines($env:SELF); function X($a,$b,$o){ $i=[Array]::IndexOf($l,$a); $j=[Array]::IndexOf($l,$b); if($i -lt 0 -or $j -lt $i){exit 3}; " +
           "[IO.File]::WriteAllBytes($o,[Convert]::FromBase64String(($l[($i+1)..($j-1)] -join ''))) }; " +
           "X '::#INDEX#' '::#HOST#' ($env:EXT+'\\index.html'); X '::#HOST#' '::#MANIFEST#' ($env:EXT+'\\host.jsx'); X '::#MANIFEST#' '::#END#' ($env:EXT+'\\CSXS\\manifest.xml')";
const head = [
  '@echo off',
  'setlocal',
  'title chavebaixa reels ' + ver + ' - instalar',
  'set "SELF=%~f0"',
  'set "EXT=%APPDATA%\\Adobe\\CEP\\extensions\\com.chavebaixa.reels"',
  'if not "%~1"=="" set "EXT=%~1"',
  'echo chavebaixa reels ' + ver,
  'echo.',
  '',
  'rem 1) copia o painel para a pasta de extensoes do After (pasta do usuario, sem administrador)',
  'if not exist "%EXT%\\CSXS" mkdir "%EXT%\\CSXS"',
  'powershell -NoProfile -ExecutionPolicy Bypass -Command "' + ps + '"',
  'if errorlevel 1 goto fail',
  'if not exist "%EXT%\\index.html" goto fail',
  'echo Painel gravado em %EXT%',
  '',
  'rem 2) paineis nao assinados pela Adobe so abrem com esta opcao ligada (so para o seu usuario)',
  'if "%~1"=="" for %%N in (8 9 10 11 12 13 14 15 16) do reg add "HKCU\\Software\\Adobe\\CSXS.%%N" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1',
  '',
  'echo.',
  'echo Pronto.',
  'echo   1. Feche o After Effects e abra de novo.',
  'echo   2. Abra em  Window ^> Extensions ^> chavebaixa reels',
  'echo.',
  'echo Depois disso o painel se atualiza sozinho.',
  'echo.',
  'pause',
  'exit /b 0',
  '',
  ':fail',
  'echo.',
  'echo Nao consegui extrair os arquivos. Baixe o .bat de novo e tente outra vez.',
  'pause',
  'exit /b 1',
  ''
].join('\r\n');
const bat = head + '::#INDEX#\r\n' + b64(html) + '\r\n::#HOST#\r\n' + b64(host) + '\r\n::#MANIFEST#\r\n' + b64(manifest) + '\r\n::#END#\r\n';
if (/[^\x00-\x7E]/.test(bat)) throw new Error('non-ASCII in bat');

const out = { 'LegendaReels.jsx': script, 'version.txt': ver + '\n', 'cep/index.html': html, 'cep/host.jsx': host, 'cep/manifest.xml': manifest, 'Instalar-chavebaixa-reels.bat': bat };
for (const name of Object.keys(out)) {
  const f = path.join(gh, name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, out[name], name.endsWith('.bat') ? 'latin1' : 'utf8');
}
fs.writeFileSync(path.join(dir, '..', 'Instalar-chavebaixa-reels.bat'), bat, 'latin1');
console.log('ok v' + ver + ' | bat ' + bat.length + ' bytes | html ' + html.length + ' | host ' + host.length);
