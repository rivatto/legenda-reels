// Gera o Instalar-LegendaReels.bat (arquivo unico, com o script e o carregador embutidos em base64).
// Uso:  node fonte/build-bat.js
const fs = require('fs'), path = require('path');
const dir = __dirname;
const script = fs.readFileSync(path.join(dir, 'LegendaReels.jsx'));
const loader = fs.readFileSync(path.join(dir, 'loader.jsx'));
const ver = (/LG\.VERSION = "([^"]+)"/.exec(script.toString('utf8')) || [, '?'])[1];
const b64 = b => b.toString('base64').replace(/(.{76})/g, '$1\r\n').replace(/\r\n$/, '');

const head = [
  '@echo off',
  'setlocal',
  'title Legenda Reels ' + ver + ' - instalar / atualizar',
  'set "SELF=%~f0"',
  'set "DEST=%APPDATA%\\LegendaReels"',
  'if not "%~1"=="" set "DEST=%~1"',
  'set "OUT_SCRIPT=%DEST%\\LegendaReels.jsx"',
  'set "OUT_LOADER=%DEST%\\loader.jsx"',
  'echo Legenda Reels ' + ver,
  'echo.',
  '',
  'rem 1) extrai o script e o carregador que estao embutidos no fim deste arquivo',
  'if not exist "%DEST%" mkdir "%DEST%"',
  'powershell -NoProfile -ExecutionPolicy Bypass -Command "$l=[IO.File]::ReadAllLines($env:SELF); $i=[Array]::IndexOf($l,\'::#SCRIPT#\'); $j=[Array]::IndexOf($l,\'::#LOADER#\'); if($i -lt 0 -or $j -lt $i){exit 3}; [IO.File]::WriteAllBytes($env:OUT_SCRIPT,[Convert]::FromBase64String(($l[($i+1)..($j-1)] -join \'\'))); [IO.File]::WriteAllBytes($env:OUT_LOADER,[Convert]::FromBase64String(($l[($j+1)..($l.Length-1)] -join \'\')))"',
  'if errorlevel 1 goto fail',
  'if not exist "%OUT_SCRIPT%" goto fail',
  'echo Script ' + ver + ' gravado em %DEST%',
  '',
  'rem 2) carregador em cada After Effects instalado (so copia se faltar ou estiver diferente)',
  'set NEED=0',
  'set FOUND=0',
  'for /d %%D in ("%ProgramFiles%\\Adobe\\Adobe After Effects*") do (',
  '  if exist "%%D\\Support Files\\Scripts\\ScriptUI Panels" (',
  '    set FOUND=1',
  '    fc /b "%OUT_LOADER%" "%%D\\Support Files\\Scripts\\ScriptUI Panels\\LegendaReels.jsx" >nul 2>&1 || set NEED=1',
  '  )',
  ')',
  'if "%FOUND%"=="0" echo Nao achei nenhum After Effects em %ProgramFiles%\\Adobe & goto done',
  'if "%NEED%"=="0" echo Painel ja estava instalado no After. & goto done',
  '',
  'net session >nul 2>&1',
  'if not errorlevel 1 goto admin',
  'echo Primeira instalacao: aceite o pedido de administrador para colocar o painel na pasta do After.',
  'powershell -NoProfile -Command "Start-Process -FilePath $env:SELF -ArgumentList (\'\\\"\' + $env:DEST + \'\\\"\') -Verb RunAs"',
  'exit /b 0',
  '',
  ':admin',
  'for /d %%D in ("%ProgramFiles%\\Adobe\\Adobe After Effects*") do (',
  '  if exist "%%D\\Support Files\\Scripts\\ScriptUI Panels" (',
  '    copy /Y "%OUT_LOADER%" "%%D\\Support Files\\Scripts\\ScriptUI Panels\\LegendaReels.jsx" >nul && echo Painel instalado em %%~nxD',
  '  )',
  ')',
  '',
  ':done',
  'echo.',
  'echo Pronto. No After: feche e reabra o painel em Window ^> LegendaReels.jsx',
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

const out = head + '::#SCRIPT#\r\n' + b64(script) + '\r\n::#LOADER#\r\n' + b64(loader) + '\r\n';
if (/[^\x00-\x7E]/.test(out)) throw new Error('non-ASCII in bat');
const dest = path.join(dir, '..', 'Instalar-LegendaReels.bat');
fs.writeFileSync(dest, out, 'latin1');
console.log('ok', dest, 'v' + ver, out.length + ' bytes');

// pasta "github": exatamente os arquivos que vao para o repositorio
const gh = path.join(dir, '..', 'github');
if (!fs.existsSync(gh)) fs.mkdirSync(gh);
fs.writeFileSync(path.join(gh, 'LegendaReels.jsx'), script);
fs.writeFileSync(path.join(gh, 'version.txt'), ver + '\n');
fs.writeFileSync(path.join(gh, 'Instalar-LegendaReels.bat'), out, 'latin1');
const url = (/LG\.UPDATE_URL = "([^"]*)"/.exec(script.toString('utf8')) || [, ''])[1];
console.log('github/ pronto. UPDATE_URL =', url || '(vazio: auto-atualizacao desligada)');
