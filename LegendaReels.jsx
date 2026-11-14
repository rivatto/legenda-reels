/*
  chavebaixa reels (LegendaReels.jsx)  -  legendas de letra de musica sincronizadas, no estilo do projeto EXTRAREEL.

  COMO USAR
    1. After Effects > Edit > Preferences > Scripting & Expressions >
       marque "Allow Scripts to Write Files and Access Network".
    2. File > Scripts > Run Script File...  e escolha este arquivo
       (ou copie para "Scripts/ScriptUI Panels" para virar painel em Window).
    3. Abra a comp do reel (1080x1920) e:
         a) clique "Importar JSON/SRT" com a transcricao exportada do ElevenLabs, OU
         b) selecione a camada da musica/video, cole sua API do ElevenLabs e clique "Transcrever (ElevenLabs)".
    4. (Opcional) cole a letra certa, uma frase por linha. O texto vem da letra,
       o tempo vem da transcricao.
         [punch] no inicio da linha forca um estilo naquela frase. Estilos:
         stack phrase punch wipe burn scramble stairs flash karaoke tracking blurin shake
    5. Clique "Gerar legendas".

  Compativel com After Effects 2020 (17.x) em diante. Arquivo so com ASCII de proposito.
*/
(function (thisObj) {

    var LG = {};
    LG.NAME = "chavebaixa reels";
    LG.VERSION = "2.3.0";
    // de onde o carregador baixa as atualizacoes (pasta "raw" do repositorio no GitHub, terminando em /)
    LG.UPDATE_URL = "https://raw.githubusercontent.com/rivatto/legenda-reels/main/";
    LG.PREFIX = "LG | ";
    LG.SETTINGS = "LegendaReels";

    // ---------------------------------------------------------------- config (valores lidos do EXTRAREEL)
    LG.CFG = {
        fontMain: "GenericG20FRClassicDEMO",
        fontsAlt: ["Gigi-Regular", "FearfulHouse", "Ghostphobia", "Gilhampton-Regular",
                   "GillSans-UltraBoldCondensed", "GillSansMT-BoldItalic", "Get-Show", "aAksiMosi"],
        color: [0.92157, 0.92157, 0.92157],
        refWidth: 1080,          // tamanhos abaixo sao em px para uma comp de 1080 de largura
        sizeStack: 150,          // 36pt x 425% no original
        sizePhrase: 190,         // 36pt x ~550%
        sizeBlock: 150,
        sizePunch: 330,
        leadingRatio: 0.86,      // entrelinha apertada (31/36)
        wrapPhrase: 14,          // caracteres por linha no estilo "phrase"
        wrapBlock: 16,
        posterizeFps: 12,
        zoomAmount: 1.06,        // 554% -> 589% no original
        wipeFrames: 15,
        scrambleFrames: 14,
        scrambleOffset: 24,
        burnSeconds: 1.0,
        typeFrames: 2,           // frames por letra no "punch" (M, MA, MAI, MAIN)
        flickerFrames: 4,
        maxHold: 0.6,            // quanto a frase fica depois da ultima palavra (s)
        gapNewPhrase: 0.45,      // pausa que quebra frase quando nao ha letra colada
        maxWordsAuto: 6
    };

    // id, nome, novo?, descricao (linhas), previa: linhas [texto, tamanho, brilho 0..1, deslocamento x], animacao da previa
    LG.STYLES = [
        { id: "stack",    name: "Pilha",    isNew: false, anim: "cum",  desc: ["Uma palavra por linha,", "acumulando no tempo", "da musica."],
          pv: [["Like", 15, 1, 0], ["how", 15, 1, 0], ["my", 15, 1, 0], ["cousin", 15, 1, 0]] },
        { id: "phrase",   name: "Frase",    isNew: false, anim: "cum",  desc: ["Frase centralizada que", "cresce palavra a palavra."],
          pv: [["Know that", 15, 1, 0], ["shit would", 15, 1, 0], ["have been", 15, 1, 0]] },
        { id: "punch",    name: "Punch",    isNew: false, anim: "type", desc: ["Palavra gigante digitada", "letra a letra, trocando", "de fonte."],
          pv: [["MAIN", 32, 1, 0]] },
        { id: "wipe",     name: "Wipe",     isNew: false, anim: "wipe", desc: ["Bloco inteiro revelado", "com Linear Wipe."],
          pv: [["Shots fired", 14, 1, 0], ["now it's a", 14, 1, 0], ["man gone", 14, 1, 0]] },
        { id: "burn",     name: "Burn",     isNew: false, anim: "burn", desc: ["Bloco surge queimando", "com CC Burn Film."],
          pv: [["My heart", 14, 1, 0], ["filled up", 14, 1, 0], ["with pain", 14, 1, 0]] },
        { id: "scramble", name: "Scramble", isNew: false, anim: "scr",  desc: ["Letras embaralhadas", "ate formar o texto."],
          pv: [["Everybody", 14, 1, 0], ["grieving", 14, 1, 0], ["want to go", 14, 1, 0]] },
        { id: "stairs",   name: "Escada",   isNew: true,  anim: "cum",  desc: ["Palavras em zigue-zague,", "acumulando."],
          pv: [["Like", 14, 1, -18], ["how", 14, 1, -4], ["my", 14, 1, 10], ["cousin", 14, 1, -4]] },
        { id: "flash",    name: "Flash",    isNew: true,  anim: "alt",  desc: ["Uma palavra por vez,", "alternando fonte", "e tamanho."],
          pv: [["we", 16, 1, 0], ["RIDE", 30, 1, 0]] },
        { id: "karaoke",  name: "Karaoke",  isNew: true,  anim: "kar",  desc: ["Frase inteira na tela;", "a palavra cantada", "acende."],
          pv: [["I lost", 14, 1, 0], ["my brother", 14, 1, 0], ["go home", 14, 1, 0]] },
        { id: "tracking", name: "Tracking", isNew: true,  anim: "alt",  desc: ["Letras espacadas", "que se juntam."],
          pv: [["S H O T S", 13, 1, 0], ["SHOTS", 19, 1, 0]] },
        { id: "blurin",   name: "Blur-in",  isNew: true,  anim: "fade", desc: ["Letras saem do", "desfoque uma a uma."],
          pv: [["Mommas", 15, 1, 0], ["crying", 15, 1, 0], ["at the", 15, 1, 0]] },
        { id: "shake",    name: "Tremor",   isNew: true,  anim: "shake", desc: ["Frase acumulando", "com tremor (wiggle)."],
          pv: [["GO", 20, 1, 0], ["HOME", 20, 1, 0]] }
    ];
    // estilos que entram na alternancia por padrao: os do EXTRAREEL
    LG.DEFAULT_ON = "stack,phrase,punch,wipe,burn,scramble";

    // fontes do texto. ps = nome PostScript (o que o After usa); ui = familia (para desenhar a previa no painel);
    // wf = largura em relacao a Arial Bold (so para centralizar a previa); file = como achar o arquivo no Windows
    LG.FONTS = [
        { id: "generic", name: "Generic G20",     ps: "GenericG20FRClassicDEMO", ui: "Generic G20 FR Classic DEMO", bold: false, wf: 0.9,  file: /generic.*g20|g20.*classic/i },
        { id: "arial",   name: "Arial",           ps: "Arial-BoldMT",            ui: "Arial",                       bold: true,  wf: 1 },
        { id: "times",   name: "Times New Roman", ps: "TimesNewRomanPSMT",       ui: "Times New Roman",             bold: false, wf: 0.84 },
        { id: "gotham",  name: "Gotham Black",    ps: "Gotham-Black",            ui: "Gotham Black",                bold: false, wf: 1.14, file: /gotham.*black/i }
    ];

    // ================================================================ logica pura (sem After Effects)
    LG.trim = function (s) { return String(s).replace(/^\s+|\s+$/g, ""); };

    LG.norm = function (s) {
        s = String(s).toLowerCase();
        s = s.replace(/[\u00e0-\u00e5]/g, "a").replace(/[\u00e8-\u00eb]/g, "e").replace(/[\u00ec-\u00ef]/g, "i")
             .replace(/[\u00f2-\u00f6]/g, "o").replace(/[\u00f9-\u00fc]/g, "u").replace(/\u00e7/g, "c").replace(/\u00f1/g, "n");
        return s.replace(/[^a-z0-9]/g, "");
    };

    LG.parseJSON = function (s) {
        var i = 0, n = s.length;
        function ws() { while (i < n) { var c = s.charCodeAt(i); if (c === 32 || c === 9 || c === 10 || c === 13 || c === 0xFEFF) { i++; } else { break; } } }
        function err(m) { throw new Error("JSON invalido (posicao " + i + "): " + m); }
        function str() {
            var r = ""; i++;
            while (i < n) {
                var c = s.charAt(i++);
                if (c === '"') { return r; }
                if (c === "\\") {
                    var e = s.charAt(i++);
                    if (e === "n") { r += "\n"; } else if (e === "t") { r += "\t"; } else if (e === "r") { r += "\r"; }
                    else if (e === "b") { r += "\b"; } else if (e === "f") { r += "\f"; }
                    else if (e === "u") { r += String.fromCharCode(parseInt(s.substr(i, 4), 16)); i += 4; }
                    else { r += e; }
                } else { r += c; }
            }
            err("texto sem fechar aspas");
        }
        function val() {
            ws();
            var c = s.charAt(i), d;
            if (c === "{") {
                i++; var o = {}; ws();
                if (s.charAt(i) === "}") { i++; return o; }
                while (true) {
                    ws(); if (s.charAt(i) !== '"') { err("esperava chave"); }
                    var k = str(); ws();
                    if (s.charAt(i++) !== ":") { err("esperava :"); }
                    o[k] = val(); ws();
                    d = s.charAt(i++);
                    if (d === "}") { return o; }
                    if (d !== ",") { err("esperava , ou }"); }
                }
            }
            if (c === "[") {
                i++; var a = []; ws();
                if (s.charAt(i) === "]") { i++; return a; }
                while (true) {
                    a.push(val()); ws();
                    d = s.charAt(i++);
                    if (d === "]") { return a; }
                    if (d !== ",") { err("esperava , ou ]"); }
                }
            }
            if (c === '"') { return str(); }
            if (s.substr(i, 4) === "true") { i += 4; return true; }
            if (s.substr(i, 5) === "false") { i += 5; return false; }
            if (s.substr(i, 4) === "null") { i += 4; return null; }
            var m = /^-?\d+(\.\d+)?([eE][+\-]?\d+)?/.exec(s.substr(i, 40));
            if (!m) { err("valor inesperado"); }
            i += m[0].length;
            return parseFloat(m[0]);
        }
        return val();
    };

    // aceita ElevenLabs Scribe ({words:[{text,start,end,type}]}) e formato Whisper ({segments:[{words:[{word,start,end}]}]})
    LG.wordsFromData = function (obj) {
        var arr = obj.words, out = [], i, j;
        if (!arr && obj.transcripts && obj.transcripts.length) { arr = obj.transcripts[0].words; }
        if (!arr && obj.segments) {
            arr = [];
            for (i = 0; i < obj.segments.length; i++) {
                var sw = obj.segments[i].words || [];
                for (j = 0; j < sw.length; j++) { arr.push(sw[j]); }
            }
        }
        if (!arr) { throw new Error("Nao achei a lista 'words' nesse JSON."); }
        for (i = 0; i < arr.length; i++) {
            var w = arr[i];
            if (w.type && w.type !== "word") { continue; }
            var t = LG.trim(w.text !== undefined ? w.text : (w.word || ""));
            if (!t || w.start === null || w.start === undefined) { continue; }
            var st = Number(w.start), en = (w.end === null || w.end === undefined) ? st + 0.2 : Number(w.end);
            out.push({ text: t, start: st, end: Math.max(en, st + 0.02) });
        }
        return out;
    };

    LG.parseSRT = function (text) {
        var blocks = String(text).replace(/\r/g, "").split(/\n\s*\n/), out = [], b;
        function tc(h, m, s, ms) { return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number((ms + "000").substr(0, 3)) / 1000; }
        for (b = 0; b < blocks.length; b++) {
            var m = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)[^\n]*\n([\s\S]*)/.exec(blocks[b]);
            if (!m) { continue; }
            var a = tc(m[1], m[2], m[3], m[4]), z = tc(m[5], m[6], m[7], m[8]);
            var ws = LG.trim(m[9].replace(/<[^>]+>/g, "").replace(/\n/g, " ")).split(/\s+/), k;
            if (!ws.length || ws[0] === "") { continue; }
            var step = (z - a) / ws.length;
            for (k = 0; k < ws.length; k++) {
                out.push({ text: ws[k], start: a + k * step, end: a + (k + 1) * step, brk: k === 0 });
            }
        }
        return out;
    };

    LG.parseLyrics = function (text) {
        var lines = String(text).replace(/\r\n?/g, "\n").split("\n"), out = [], i;
        for (i = 0; i < lines.length; i++) {
            var ln = LG.trim(lines[i]), style = null;
            var m = /^\[([A-Za-z]+)\]\s*/.exec(ln);
            if (m) { style = m[1].toLowerCase(); ln = ln.substr(m[0].length); }
            if (!ln) { continue; }
            out.push({ style: style, words: ln.split(/\s+/) });
        }
        return out;
    };

    LG.lev = function (a, b) {
        var m = a.length, n = b.length, i, j, prev = [], cur = [];
        for (j = 0; j <= n; j++) { prev[j] = j; }
        for (i = 1; i <= m; i++) {
            cur = [i];
            for (j = 1; j <= n; j++) {
                var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
            }
            prev = cur;
        }
        return prev[n];
    };

    // alinha as palavras da letra (certas) com as da transcricao (com tempo). Devolve, para cada
    // palavra da letra, o indice da palavra transcrita correspondente ou -1.
    LG.align = function (lyr, trn) {
        var m = lyr.length, n = trn.length, i, j, D = [], map = [];
        function sub(a, b) {
            if (a === b) { return 0; }
            if (!a || !b) { return 1.2; }
            if (a.length > 2 && b.length > 2 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) { return 0.4; }
            var d = LG.lev(a, b);
            if (d <= 1 && Math.max(a.length, b.length) > 3) { return 0.4; }
            if (d <= 2 && Math.max(a.length, b.length) > 6) { return 0.6; }
            return 1.2;
        }
        for (i = 0; i <= m; i++) { D[i] = [i]; }
        for (j = 1; j <= n; j++) { D[0][j] = j; }
        for (i = 1; i <= m; i++) {
            for (j = 1; j <= n; j++) {
                D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + sub(lyr[i - 1], trn[j - 1]));
            }
        }
        for (i = 0; i < m; i++) { map[i] = -1; }
        i = m; j = n;
        while (i > 0 && j > 0) {
            var s = sub(lyr[i - 1], trn[j - 1]);
            if (Math.abs(D[i][j] - (D[i - 1][j - 1] + s)) < 1e-9) { if (s < 1) { map[i - 1] = j - 1; } i--; j--; }
            else if (Math.abs(D[i][j] - (D[i - 1][j] + 1)) < 1e-9) { i--; }
            else { j--; }
        }
        return map;
    };

    // letra + transcricao -> frases com tempo
    LG.phrasesFromLyrics = function (lines, tWords) {
        var flat = [], i, j, k;
        for (i = 0; i < lines.length; i++) { for (j = 0; j < lines[i].words.length; j++) { flat.push({ text: lines[i].words[j], line: i }); } }
        var a = [], b = [];
        for (i = 0; i < flat.length; i++) { a.push(LG.norm(flat[i].text)); }
        for (i = 0; i < tWords.length; i++) { b.push(LG.norm(tWords[i].text)); }
        var map = LG.align(a, b), matched = 0;
        for (i = 0; i < flat.length; i++) {
            if (map[i] >= 0) { flat[i].start = tWords[map[i]].start; flat[i].end = tWords[map[i]].end; matched++; }
        }
        // preenche as que nao casaram interpolando entre as vizinhas
        i = 0;
        while (i < flat.length) {
            if (flat[i].start !== undefined) { i++; continue; }
            j = i; while (j < flat.length && flat[j].start === undefined) { j++; }
            var cnt = j - i;
            var t0 = i > 0 ? flat[i - 1].end : null, t1 = j < flat.length ? flat[j].start : null;
            // palavras transcritas que sobraram nesse mesmo trecho (ex.: o ElevenLabs ouviu "right" e a letra diz "RIDE")
            var jA = i > 0 ? map[i - 1] + 1 : 0, jB = j < flat.length ? map[j] - 1 : tWords.length - 1;
            if (i > 0 && map[i - 1] < 0) { jA = jB + 1; }
            if (jB >= jA && jB - jA + 1 === cnt) {
                for (k = 0; k < cnt; k++) { flat[i + k].start = tWords[jA + k].start; flat[i + k].end = tWords[jA + k].end; map[i + k] = jA + k; }
                i = j; continue;
            }
            if (jB >= jA) { t0 = tWords[jA].start; t1 = tWords[jB].end; }
            if (t0 === null && t1 === null) { t0 = 0; t1 = cnt * 0.3; }
            else if (t0 === null) { t0 = Math.max(0, t1 - cnt * 0.25); }
            else if (t1 === null) { t1 = t0 + cnt * 0.3; }
            if (t1 < t0) { t1 = t0; }
            var step = (t1 - t0) / cnt;
            for (k = 0; k < cnt; k++) { flat[i + k].start = t0 + k * step; flat[i + k].end = Math.max(t0 + (k + 1) * step, flat[i + k].start + 0.04); }
            i = j;
        }
        var phrases = [];
        for (i = 0; i < lines.length; i++) { phrases.push({ style: lines[i].style, words: [] }); }
        for (i = 0; i < flat.length; i++) { phrases[flat[i].line].words.push({ text: flat[i].text, start: flat[i].start, end: flat[i].end }); }
        return { phrases: phrases, matched: matched, total: flat.length };
    };

    // so transcricao -> frases (quebra por pausa, pontuacao ou tamanho)
    LG.autoPhrases = function (tWords, maxWords, gap) {
        var phrases = [], cur = null, i;
        for (i = 0; i < tWords.length; i++) {
            var w = tWords[i], prev = i > 0 ? tWords[i - 1] : null, brk = false;
            if (!cur) { brk = true; }
            else if (w.brk) { brk = true; }
            else if (w.start - prev.end > gap) { brk = true; }
            else if (cur.words.length >= maxWords) {
                // nao deixa uma palavra sozinha sobrando antes de uma pausa
                var lastBeforePause = (i + 1 >= tWords.length) || (tWords[i + 1].start - w.end > gap) || tWords[i + 1].brk;
                brk = !(lastBeforePause && cur.words.length === maxWords);
            }
            else if (/[.!?;:]$/.test(prev.text)) { brk = true; }
            if (brk) { cur = { style: null, words: [] }; phrases.push(cur); }
            cur.words.push({ text: w.text, start: w.start, end: w.end });
        }
        return phrases;
    };

    // so letra, sem tempo nenhum -> espalha igualmente em [t0, t1]
    LG.spreadLyrics = function (lines, t0, t1) {
        var total = 0, i, j, n = 0, phrases = [];
        for (i = 0; i < lines.length; i++) { total += lines[i].words.length; }
        var step = (t1 - t0) / Math.max(total, 1);
        for (i = 0; i < lines.length; i++) {
            var p = { style: lines[i].style, words: [] };
            for (j = 0; j < lines[i].words.length; j++) { p.words.push({ text: lines[i].words[j], start: t0 + n * step, end: t0 + (n + 1) * step }); n++; }
            phrases.push(p);
        }
        return phrases;
    };

    // quebra em linhas por numero de caracteres; devolve array de arrays de indices
    LG.wrapLines = function (texts, maxChars) {
        var lines = [], cur = [], len = 0, i;
        for (i = 0; i < texts.length; i++) {
            var l = texts[i].length;
            if (cur.length && len + 1 + l > maxChars) { lines.push(cur); cur = []; len = 0; }
            cur.push(i); len += (cur.length > 1 ? 1 : 0) + l;
        }
        if (cur.length) { lines.push(cur); }
        return lines;
    };

    // texto com as primeiras k palavras, respeitando as quebras de linha da frase completa
    LG.buildText = function (texts, lines, k, indentFn) {
        var out = [], i, j;
        for (i = 0; i < lines.length; i++) {
            var parts = [];
            for (j = 0; j < lines[i].length; j++) { if (lines[i][j] < k) { parts.push(texts[lines[i][j]]); } }
            if (!parts.length) { break; }
            out.push((indentFn ? indentFn(i) : "") + parts.join(" "));
        }
        return out.join("\r");
    };

    LG.rng = function (seed) {
        var s = seed || 1;
        return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    };

    if (typeof app === "undefined") { thisObj.LG = LG; return; }   // (permite testar a logica fora do AE)

    // ================================================================ After Effects
    var C = LG.CFG;
    LG.state = { words: null, source: "" };

    function snap(comp, t) { return Math.round(t / comp.frameDuration) * comp.frameDuration; }
    function px(comp, v) { return v * comp.width / C.refWidth; }
    function textDocProp(L) { return L.property("ADBE Text Properties").property("ADBE Text Document"); }
    function transform(L, mn) { return L.property("ADBE Transform Group").property(mn); }

    function styleDoc(d, o) {
        try { d.resetCharStyle(); } catch (e0) {}
        d.font = o.font || C.fontMain;
        d.fontSize = o.size;
        d.applyFill = true;
        d.fillColor = C.color;
        d.applyStroke = false;
        d.tracking = 0;
        d.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
        try { d.leading = o.size * C.leadingRatio; } catch (e1) {}   // so em versoes novas do AE
        return d;
    }

    function makeText(comp, text, o, tIn, tOut, name) {
        var L = comp.layers.addText(text);
        var p = textDocProp(L), d = p.value;
        d.text = text;
        p.setValue(styleDoc(d, o));
        L.inPoint = tIn;
        L.outPoint = Math.max(tOut, tIn + comp.frameDuration);
        L.name = LG.PREFIX + name;
        L.label = 9;
        return L;
    }

    // centraliza a ancora no bloco, posiciona e reduz a escala se nao couber na tela. Devolve a escala.
    function place(L, comp, t, o) {
        var r = L.sourceRectAtTime(t, false), W = comp.width, H = comp.height;
        var s = Math.min(1, (o.maxW || 0.86) * W / Math.max(r.width, 1), (o.maxH || 0.6) * H / Math.max(r.height, 1)) * 100;
        var ax = o.just === "L" ? r.left : r.left + r.width / 2;
        transform(L, "ADBE Anchor Point").setValue([ax, r.top + r.height / 2]);
        transform(L, "ADBE Position").setValue([W * (o.px === undefined ? 0.5 : o.px), H * (o.py === undefined ? 0.5 : o.py)]);
        transform(L, "ADBE Scale").setValue([s, s]);
        return s;
    }

    function setText(L, text) { var p = textDocProp(L), d = p.value; d.text = text; p.setValue(d); }

    function keyText(L, t, text, font, size) {
        var p = textDocProp(L), d = p.value;
        d.text = text;
        if (font) { d.font = font; }
        if (size) { d.fontSize = size; }
        p.setValueAtTime(t, d);
    }

    function addFx(L, mn) {
        var par = L.property("ADBE Effect Parade");
        if (!par.canAddProperty(mn)) { return null; }
        return par.addProperty(mn);
    }

    function linearKeys(prop, t0, v0, t1, v1) { prop.setValueAtTime(t0, v0); prop.setValueAtTime(t1, v1); }

    // acabamento comum: posterize, blur, sombra, zoom lento
    function finish(L, comp, tIn, tOut, scale, opt, idx) {
        var fx;
        if (opt.posterize) { fx = addFx(L, "ADBE Posterize Time"); if (fx) { fx.property("ADBE Posterize Time-0001").setValue(C.posterizeFps); } }
        if (opt.shadow) { fx = addFx(L, "ADBE Drop Shadow"); if (fx) { try { fx.property("ADBE Drop Shadow-0005").setValue(12); } catch (e0) {} } }
        if (opt.blur) {
            fx = addFx(L, "BCC6LensBlur");                      // Boris Continuum, igual ao original
            if (fx) { try { fx.property("BCC6LensBlur-9961714").setValue(1.5); } catch (e1) {} }
            else { fx = addFx(L, "ADBE Gaussian Blur 2"); if (fx) { fx.property("ADBE Gaussian Blur 2-0001").setValue(2.5); } }
        }
        if (opt.zoom && tOut - tIn > 0.3) {
            var a = scale, b = scale * C.zoomAmount;
            if (idx % 2 === 1) { var tmp = a; a = b; b = tmp; }
            linearKeys(transform(L, "ADBE Scale"), tIn, [a, a], tOut, [b, b]);
        }
    }

    // --- animadores de texto (sempre re-busca pelo caminho: referencias morrem a cada addProperty)
    function animators(L) { return L.property("ADBE Text Properties").property("ADBE Text Animators"); }
    function addAnimator(L, name) {
        var a = animators(L).addProperty("ADBE Text Animator");
        a.name = name;
        var idx = animators(L).numProperties;
        animators(L).property(idx).property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        return idx;
    }
    function addAnimProp(L, idx, mn) {
        animators(L).property(idx).property("ADBE Text Animator Properties").addProperty(mn);
        return animators(L).property(idx).property("ADBE Text Animator Properties").property(mn);
    }
    function selector(L, idx) { return animators(L).property(idx).property("ADBE Text Selectors").property(1); }

    function texts(ph) { var a = [], i; for (i = 0; i < ph.words.length; i++) { a.push(ph.words[i].text); } return a; }
    function label(ph) { var s = texts(ph).join(" "); return s.length > 40 ? s.substr(0, 40) + "..." : s; }

    // ---------------------------------------------------------------- estilos
    // cada estilo recebe (comp, ph, tIn, tOut, opt, idx); ph.words[i] = {text, t}
    var B = {};

    function cumulative(comp, ph, tIn, tOut, opt, idx, o, lines, indentFn, name) {
        var tx = texts(ph), i;
        var L = makeText(comp, LG.buildText(tx, lines, tx.length, indentFn), o, tIn, tOut, name + " | " + label(ph));
        var s = place(L, comp, tIn, o);
        for (i = 0; i < tx.length; i++) { keyText(L, Math.max(ph.words[i].t, tIn), LG.buildText(tx, lines, i + 1, indentFn)); }
        finish(L, comp, tIn, tOut, s, opt, idx);
        return L;
    }
    function oneWordPerLine(n) { var a = [], i; for (i = 0; i < n; i++) { a.push([i]); } return a; }

    B.stack = function (comp, ph, tIn, tOut, opt, idx) {
        var o = { size: px(comp, C.sizeStack), just: "C", maxW: 0.86, maxH: 0.66 };
        return cumulative(comp, ph, tIn, tOut, opt, idx, o, oneWordPerLine(ph.words.length), null, "stack");
    };
    B.stairs = function (comp, ph, tIn, tOut, opt, idx) {
        var o = { size: px(comp, C.sizeStack), just: "C", maxW: 0.86, maxH: 0.66 };
        var ind = function (i) { var k = i % 4, s = ""; if (k === 3) { k = 1; } while (k-- > 0) { s += "    "; } return s; };
        return cumulative(comp, ph, tIn, tOut, opt, idx, o, oneWordPerLine(ph.words.length), ind, "stairs");
    };
    B.phrase = function (comp, ph, tIn, tOut, opt, idx) {
        var o = { size: px(comp, C.sizePhrase), just: "C" };
        return cumulative(comp, ph, tIn, tOut, opt, idx, o, LG.wrapLines(texts(ph), C.wrapPhrase), null, "phrase");
    };
    B.shake = function (comp, ph, tIn, tOut, opt, idx) {
        var o = { size: px(comp, C.sizePhrase), just: "C" };
        var L = cumulative(comp, ph, tIn, tOut, opt, idx, o, LG.wrapLines(texts(ph), C.wrapPhrase), null, "shake");
        transform(L, "ADBE Position").expression = "posterizeTime(" + C.posterizeFps + ");\nwiggle(8, " + Math.round(px(comp, 14)) + ");";
        return L;
    };

    function longest(tx) { var b = tx[0], i; for (i = 1; i < tx.length; i++) { if (tx[i].length > b.length) { b = tx[i]; } } return b; }

    B.punch = function (comp, ph, tIn, tOut, opt, idx) {
        var tx = texts(ph), i, c, fd = comp.frameDuration;
        var o = { size: px(comp, C.sizePunch), just: "C", maxW: 0.9, maxH: 0.5 };
        var L = makeText(comp, longest(tx).toUpperCase(), o, tIn, tOut, "punch | " + label(ph));
        var s = place(L, comp, tIn, o), fi = 0;
        for (i = 0; i < tx.length; i++) {
            var w = tx[i].toUpperCase(), t0 = Math.max(ph.words[i].t, tIn);
            var tNext = i + 1 < tx.length ? ph.words[i + 1].t : tOut;
            var dt = Math.max(fd, Math.min(C.typeFrames * fd, (tNext - t0) * 0.5 / w.length));
            var t = t0;
            for (c = 1; c <= w.length; c++) { keyText(L, t, w.substr(0, c), C.fontMain); t += dt; }
            // segura a palavra trocando de fonte
            t += C.flickerFrames * fd;
            var n = 0;
            while (t < tNext - fd && n < 8) {
                keyText(L, t, w, C.fontsAlt[fi % C.fontsAlt.length]);
                fi++; n++; t += C.flickerFrames * fd * (1 + (n % 3));
            }
        }
        finish(L, comp, tIn, tOut, s, { posterize: false, shadow: opt.shadow, blur: opt.blur, zoom: opt.zoom }, idx);
        return L;
    };

    B.flash = function (comp, ph, tIn, tOut, opt, idx) {
        var tx = texts(ph), i, big = px(comp, C.sizePunch * 0.8);
        var o = { size: big, just: "C", maxW: 0.9, maxH: 0.5 };
        var L = makeText(comp, longest(tx), o, tIn, tOut, "flash | " + label(ph));
        var s = place(L, comp, tIn, o);
        for (i = 0; i < tx.length; i++) {
            var alt = (i + idx) % 2 === 1;
            keyText(L, Math.max(ph.words[i].t, tIn), alt ? tx[i].toLowerCase() : tx[i].toUpperCase(),
                    alt ? C.fontsAlt[(i + idx) % C.fontsAlt.length] : C.fontMain, alt ? big * 0.7 : big);
        }
        finish(L, comp, tIn, tOut, s, { posterize: false, shadow: opt.shadow, blur: opt.blur, zoom: false }, idx);
        return L;
    };

    function block(comp, ph, tIn, tOut, name) {
        var tx = texts(ph), o = { size: px(comp, C.sizeBlock), just: "C" };
        var L = makeText(comp, LG.buildText(tx, LG.wrapLines(tx, C.wrapBlock), tx.length, null), o, tIn, tOut, name + " | " + label(ph));
        return { L: L, s: place(L, comp, tIn, o) };
    }

    B.wipe = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "wipe");
        var fx = addFx(b.L, "ADBE Linear Wipe");
        if (fx) {
            var tEnd = Math.min(tIn + C.wipeFrames * comp.frameDuration, tOut);
            linearKeys(fx.property("ADBE Linear Wipe-0001"), tIn, 100, tEnd, 0);
            b.L.property("ADBE Effect Parade").property("ADBE Linear Wipe").property("ADBE Linear Wipe-0002").setValue(0);
        }
        finish(b.L, comp, tIn, tOut, b.s, opt, idx);
        return b.L;
    };
    B.burn = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "burn");
        var fx = addFx(b.L, "CC Burn Film");
        if (fx) { linearKeys(fx.property("CC Burn Film-0001"), tIn, 100, Math.min(tIn + C.burnSeconds, tOut), 0); }
        else { linearKeys(transform(b.L, "ADBE Opacity"), tIn, 0, Math.min(tIn + 0.4, tOut), 100); }
        finish(b.L, comp, tIn, tOut, b.s, { posterize: false, shadow: opt.shadow, blur: opt.blur, zoom: opt.zoom }, idx);
        return b.L;
    };
    B.scramble = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "scramble");
        var a = addAnimator(b.L, "Scramble");
        var p = addAnimProp(b.L, a, "ADBE Text Character Offset");
        linearKeys(p, tIn, C.scrambleOffset, Math.min(tIn + C.scrambleFrames * comp.frameDuration, tOut), 0);
        finish(b.L, comp, tIn, tOut, b.s, { posterize: true, shadow: opt.shadow, blur: opt.blur, zoom: opt.zoom }, idx);
        return b.L;
    };
    B.tracking = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "tracking");
        var a = addAnimator(b.L, "Tracking");
        var p = addAnimProp(b.L, a, "ADBE Text Tracking Amount");
        var tEnd = Math.min(tIn + 0.7, tOut);
        linearKeys(p, tIn, 70, tEnd, 0);
        try { p.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 33)]); } catch (e0) {}
        linearKeys(transform(b.L, "ADBE Opacity"), tIn, 0, Math.min(tIn + 6 * comp.frameDuration, tOut), 100);
        finish(b.L, comp, tIn, tOut, b.s, opt, idx);
        return b.L;
    };
    B.blurin = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "blurin");
        var a = addAnimator(b.L, "Blur-in");
        addAnimProp(b.L, a, "ADBE Text Opacity").setValue(0);
        addAnimProp(b.L, a, "ADBE Text Blur").setValue([px(comp, 40), px(comp, 40)]);
        var last = ph.words[ph.words.length - 1].t;
        var tEnd = Math.min(Math.max(last + 0.15, tIn + 0.4), tOut);
        linearKeys(selector(b.L, a).property("ADBE Text Percent Start"), tIn, 0, tEnd, 100);
        finish(b.L, comp, tIn, tOut, b.s, { posterize: false, shadow: opt.shadow, blur: opt.blur, zoom: opt.zoom }, idx);
        return b.L;
    };
    B.karaoke = function (comp, ph, tIn, tOut, opt, idx) {
        var b = block(comp, ph, tIn, tOut, "karaoke"), n = ph.words.length, i;
        var a = addAnimator(b.L, "Ainda nao cantado");
        addAnimProp(b.L, a, "ADBE Text Opacity").setValue(28);
        var adv = selector(b.L, a).property("ADBE Text Range Advanced");
        adv.property("ADBE Text Range Units").setValue(2);     // Index
        adv.property("ADBE Text Range Type2").setValue(3);     // Words
        selector(b.L, a).property("ADBE Text Index End").setValue(n);
        var st = selector(b.L, a).property("ADBE Text Index Start");
        for (i = 0; i < n; i++) { st.setValueAtTime(Math.max(ph.words[i].t, tIn), i + 1); }
        st = selector(b.L, a).property("ADBE Text Index Start");
        for (i = 1; i <= st.numKeys; i++) { st.setInterpolationTypeAtKey(i, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); }
        finish(b.L, comp, tIn, tOut, b.s, opt, idx);
        return b.L;
    };

    // ---------------------------------------------------------------- cortes e geracao
    function getCuts(comp) {
        var cuts = [], i;
        for (i = 1; i <= comp.numLayers; i++) {
            var L = comp.layer(i);
            if (L.name.indexOf(LG.PREFIX) === 0) { continue; }
            if (!(L instanceof AVLayer) || !L.hasVideo || L.adjustmentLayer || L.nullLayer) { continue; }
            cuts.push(L.inPoint); cuts.push(L.outPoint);
            // marcadores da camada (Scene Edit Detection > "Create markers at scene edits")
            try { var lm = L.property("ADBE Marker"), m; for (m = 1; m <= lm.numKeys; m++) { cuts.push(lm.keyTime(m)); } } catch (e1) {}
        }
        try { var mk = comp.markerProperty; for (i = 1; i <= mk.numKeys; i++) { cuts.push(mk.keyTime(i)); } } catch (e0) {}
        cuts.sort(function (a, b) { return a - b; });
        return cuts;
    }

    // sel = { mode: "cycle" | "random" | "single", single: id, list: [ids marcados] }
    function pickStyle(sel, ph, n, rnd) {
        var i, pool = [], hasPunch = false, hasPhrase = false;
        if (ph.style && B[ph.style]) { return ph.style; }
        if (sel.mode === "single" && B[sel.single]) { return sel.single; }
        for (i = 0; i < sel.list.length; i++) {
            if (!B[sel.list[i]]) { continue; }
            if (sel.list[i] === "punch") { hasPunch = true; } else { pool.push(sel.list[i]); }
            if (sel.list[i] === "phrase") { hasPhrase = true; }
        }
        var total = texts(ph).join("").length;
        var isShort = ph.words.length === 1 || (ph.words.length <= 2 && total <= 6);
        if (hasPunch && (isShort || !pool.length)) { return "punch"; }
        if (!pool.length) { return "phrase"; }
        var s = sel.mode === "random" ? pool[Math.floor(rnd() * pool.length)] : pool[n % pool.length];
        if ((s === "stack" || s === "stairs") && ph.words.length > 11 && hasPhrase) { s = "phrase"; }
        return s;
    }

    LG.generate = function (lyricsText, sel, opt, offset) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { say("Abra a comp do reel antes de gerar."); return; }
        if (opt && opt.font) { C.fontMain = opt.font; }
        // SRT colado direto na caixa: vira a fonte dos tempos (e do texto)
        if (/\d+:\d+:\d+[,.]\d+\s*-->/.test(lyricsText)) {
            var pasted = LG.parseSRT(lyricsText);
            if (pasted.length) { LG.state.words = pasted; LG.state.source = "SRT colado"; lyricsText = ""; }
        }
        var lines = LG.parseLyrics(lyricsText), words = LG.state.words, phrases, info = "";
        if (words && words.length && lines.length) {
            var r = LG.phrasesFromLyrics(lines, words);
            phrases = r.phrases;
            info = r.matched + " de " + r.total + " palavras da letra casaram com a transcricao.";
        } else if (words && words.length) {
            phrases = LG.autoPhrases(words, C.maxWordsAuto, C.gapNewPhrase);
            info = "Sem letra colada: usei o texto da transcricao.";
        } else if (lines.length) {
            phrases = LG.spreadLyrics(lines, comp.workAreaStart, comp.workAreaStart + comp.workAreaDuration);
            offset = 0;
            info = "Sem transcricao: espalhei a letra por igual na work area (ajuste na mao).";
        } else { say("Importe/transcreva o audio ou cole a letra primeiro."); return; }

        var cuts = getCuts(comp), rnd = LG.rng(phrases.length * 7 + 3), made = 0, fails = [], i, j, n = 0;
        var removed = 0;
        app.beginUndoGroup(LG.NAME);
        try {
            if (opt.replace) { removed = removeLayers(comp); }
            for (i = 0; i < phrases.length; i++) {
                var ph = phrases[i];
                if (!ph.words.length) { continue; }
                for (j = 0; j < ph.words.length; j++) { ph.words[j].t = snap(comp, ph.words[j].start + offset); }
                var tIn = ph.words[0].t, lastW = ph.words[ph.words.length - 1];
                var tOut = snap(comp, lastW.end + offset + C.maxHold);
                var k = i + 1;
                while (k < phrases.length && !phrases[k].words.length) { k++; }
                if (k < phrases.length) { tOut = Math.min(tOut, snap(comp, phrases[k].words[0].start + offset)); }
                for (j = 0; j < cuts.length; j++) {             // nao deixa a frase atravessar um corte depois da ultima palavra
                    if (cuts[j] > lastW.t + comp.frameDuration && cuts[j] < tOut) { tOut = snap(comp, cuts[j]); break; }
                }
                tOut = Math.min(tOut, comp.duration);
                if (tIn < 0 || tIn >= comp.duration || tOut - tIn < comp.frameDuration) { continue; }
                var st = pickStyle(sel, ph, n, rnd);
                try { B[st](comp, ph, tIn, tOut, opt, n); made++; }
                catch (e) { fails.push(label(ph) + "  (" + st + "): " + e.toString()); }
                n++;
            }
        } finally { app.endUndoGroup(); }
        var msg = made + " legendas criadas em \"" + comp.name + "\"" + (removed ? " (" + removed + " antigas substituidas)" : "") + ".\n" + info;
        if (fails.length) { msg += "\n\nFalharam " + fails.length + ":\n" + fails.slice(0, 6).join("\n"); }
        say(msg);
    };

    // apaga so as camadas que este script criou (nome comeca com "LG | ")
    function removeLayers(comp) {
        var i, n = 0;
        for (i = comp.numLayers; i >= 1; i--) {
            var L = comp.layer(i);
            if (L.name.indexOf(LG.PREFIX) === 0) { if (L.locked) { L.locked = false; } L.remove(); n++; }
        }
        return n;
    }

    LG.removeGenerated = function () {
        var comp = app.project.activeItem, n = 0;
        if (!(comp instanceof CompItem)) { return; }
        app.beginUndoGroup(LG.NAME + " - remover");
        n = removeLayers(comp);
        app.endUndoGroup();
        say(n + " camadas de legenda removidas (Ctrl+Z desfaz).");
    };

    // ---------------------------------------------------------------- arquivos / ElevenLabs
    function readFile(f) { f.encoding = "UTF-8"; if (!f.open("r")) { throw new Error("Nao consegui abrir " + f.fsName); } var s = f.read(); f.close(); return s; }

    LG.importFile = function () {
        var f = File.openDialog("Transcricao do ElevenLabs (JSON com words, ou SRT)");
        if (!f) { return null; }
        var s = readFile(f), words;
        if (/^\s*[\[{]/.test(s.replace(/^\ufeff/, ""))) { words = LG.wordsFromData(LG.parseJSON(s)); } else { words = LG.parseSRT(s); }
        if (!words.length) { throw new Error("Nenhuma palavra com tempo nesse arquivo."); }
        LG.state.words = words; LG.state.source = decodeURI(f.name);
        return words.length;
    };

    function canNetwork() {
        try { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") === 1; } catch (e) { return true; }
    }

    LG.transcribe = function (key, model) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem) || comp.selectedLayers.length !== 1) { throw new Error("Selecione 1 camada (a musica ou o video) na comp."); }
        var L = comp.selectedLayers[0];
        if (!(L instanceof AVLayer) || !(L.source instanceof FootageItem) || !L.source.file) { throw new Error("A camada selecionada precisa ser um arquivo de audio/video (nao pre-comp)."); }
        if (!/^[A-Za-z0-9_\-]{10,}$/.test(key)) { throw new Error("API do ElevenLabs vazia ou com caracteres invalidos."); }
        if (!/^[A-Za-z0-9_\-.]+$/.test(model)) { throw new Error("Nome de modelo invalido."); }
        if (!canNetwork()) { throw new Error("Ative em Preferences > Scripting & Expressions:\n\"Allow Scripts to Write Files and Access Network\"."); }
        var src = L.source.file, stamp = new Date().getTime();
        var out = new File(Folder.temp.fsName + "/lg_scribe_" + stamp + ".json");
        var url = "https://api.elevenlabs.io/v1/speech-to-text";
        if ($.os.indexOf("Windows") >= 0) {
            var bat = new File(Folder.temp.fsName + "/lg_scribe_" + stamp + ".bat");
            bat.encoding = "UTF-8"; bat.lineFeed = "Windows"; bat.open("w");
            bat.writeln("@echo off");
            bat.writeln("chcp 65001 >nul");
            bat.writeln('curl -s -X POST "' + url + '" -H "xi-api-key: ' + key + '" -F "model_id=' + model +
                        '" -F "timestamps_granularity=word" -F "tag_audio_events=false" -F "file=@\\"' +
                        src.fsName.replace(/%/g, "%%") + '\\"" -o "' + out.fsName + '"');
            bat.close();
            system.callSystem('cmd.exe /c "' + bat.fsName + '"');
            bat.remove();                                        // o .bat tinha a chave: apaga
        } else {
            var q = function (s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; };
            system.callSystem("curl -s -X POST " + q(url) + " -H " + q("xi-api-key: " + key) + " -F " + q("model_id=" + model) +
                              " -F timestamps_granularity=word -F tag_audio_events=false -F " + q("file=@\"" + src.fsName + "\"") + " -o " + q(out.fsName));
        }
        if (!out.exists) { throw new Error("O ElevenLabs nao respondeu (sem internet ou curl indisponivel)."); }
        var obj = LG.parseJSON(readFile(out));
        if (obj.detail) { out.remove(); throw new Error("ElevenLabs recusou: " + (obj.detail.message || obj.detail.status || obj.detail)); }
        var words = LG.wordsFromData(obj);
        if (!words.length) { throw new Error("A transcricao voltou sem palavras."); }
        // guarda uma copia ao lado do projeto para reaproveitar sem gastar creditos de novo
        try {
            if (app.project.file) { out.copy(app.project.file.parent.fsName + "/" + decodeURI(src.name) + ".scribe.json"); }
        } catch (e0) {}
        out.remove();
        LG.state.words = words; LG.state.source = decodeURI(src.name);
        return { count: words.length, offset: L.startTime, text: obj.text || "" };
    };

    // ---------------------------------------------------------------- atualizacao manual
    function newerVersion(a, b) {
        var x = String(a).split("."), y = String(b).split("."), i;
        for (i = 0; i < Math.max(x.length, y.length); i++) {
            var p = parseInt(x[i] || "0", 10), q = parseInt(y[i] || "0", 10);
            if (p !== q) { return p > q; }
        }
        return false;
    }
    function fetchUrl(url, dest) {
        if (dest.exists) { dest.remove(); }
        var curl = $.os.indexOf("Windows") >= 0 ? "curl.exe" : "curl";
        system.callSystem(curl + ' -s -L -f --connect-timeout 4 --max-time 15 -o "' + dest.fsName + '" "' + url + '"');
        return dest.exists && dest.length > 0;
    }
    // devolve um texto dizendo o que aconteceu
    LG.checkUpdate = function () {
        if (!LG.UPDATE_URL) { return "Esta copia nao tem endereco de atualizacao."; }
        var prefOn = false;
        try { prefOn = app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") === 1; } catch (e0) {}
        if (!prefOn) {
            return "O After esta bloqueando a internet para scripts, por isso o painel nao se atualiza.\n\n" +
                   "Marque em Edit > Preferences > Scripting & Expressions:\n\"Allow Scripts to Write Files and Access Network\"\n\nDepois feche e reabra o painel.";
        }
        var dirU = Folder.userData.fsName + "/LegendaReels", target = new File(dirU + "/LegendaReels.jsx");
        if (!target.exists) { return "Este painel nao foi instalado pelo .bat, entao nao tem como se atualizar sozinho.\nBaixe e rode o Instalar-chavebaixa-reels.bat do GitHub."; }
        var stamp = "?t=" + new Date().getTime(), vf = new File(dirU + "/_version.txt"), nf = new File(dirU + "/_novo.jsx");
        if (!fetchUrl(LG.UPDATE_URL + "version.txt" + stamp, vf)) { return "Nao consegui falar com o GitHub (sem internet, firewall ou curl ausente)."; }
        var remote = readFile(vf).replace(/\s+/g, ""); vf.remove();
        if (!/^\d+(\.\d+)*$/.test(remote)) { return "O GitHub respondeu algo estranho. Tente de novo em alguns minutos."; }
        if (!newerVersion(remote, LG.VERSION)) { return "Voce ja esta na versao mais nova (v" + LG.VERSION + ").\n\nSe acabei de publicar algo, o GitHub pode levar ate 5 minutos para liberar."; }
        if (!fetchUrl(LG.UPDATE_URL + "LegendaReels.jsx" + stamp, nf)) { return "Achei a v" + remote + ", mas o download falhou. Tente de novo."; }
        var txt = readFile(nf), m = /LG\.VERSION = "([0-9.]+)"/.exec(txt);
        if (!m || m[1] !== remote || txt.length < 20000 || txt.indexOf("__LG_HOST") < 0) {
            nf.remove();
            return "Achei a v" + remote + ", mas o arquivo ainda nao chegou inteiro no GitHub. Tente de novo em alguns minutos.";
        }
        target.copy(dirU + "/LegendaReels.anterior.jsx");
        nf.copy(target.fsName); nf.remove();
        return "v" + remote + " baixada (voce estava na v" + LG.VERSION + ").\n\nFeche este painel e abra de novo em Window para ver a versao nova.";
    };

    // ---------------------------------------------------------------- ponte com o painel HTML (CEP)
    // No painel HTML este arquivo roda "sem interface": o painel chama LG.api(comando, json) e recebe json.
    LG.msgs = [];
    function say(m) { if ($.global.__LG_HEADLESS) { LG.msgs.push(String(m)); } else { alert(m); } }

    LG.setTranscript = function (text, name) {
        var s = String(text), words;
        if (s.charCodeAt(0) === 0xFEFF) { s = s.substr(1); }
        if (/^\s*[\[{]/.test(s)) { words = LG.wordsFromData(LG.parseJSON(s)); } else { words = LG.parseSRT(s); }
        if (!words.length) { throw new Error("Nenhuma palavra com tempo nesse arquivo."); }
        LG.state.words = words; LG.state.source = name || "arquivo";
        return words.length;
    };

    LG.toJSON = function (v) {
        var t = typeof v, i, a = [], k;
        if (v === null || v === undefined) { return "null"; }
        if (t === "number") { return isFinite(v) ? String(v) : "null"; }
        if (t === "boolean") { return v ? "true" : "false"; }
        if (t === "string") {
            var out = '"', c, code;
            for (i = 0; i < v.length; i++) {
                c = v.charAt(i); code = v.charCodeAt(i);
                if (c === '"') { out += '\\"'; } else if (c === "\\") { out += "\\\\"; }
                else if (c === "\n") { out += "\\n"; } else if (c === "\r") { out += "\\r"; } else if (c === "\t") { out += "\\t"; }
                else if (code < 32 || code > 126) { out += "\\u" + ("0000" + code.toString(16)).slice(-4); }
                else { out += c; }
            }
            return out + '"';
        }
        if (v instanceof Array) { for (i = 0; i < v.length; i++) { a.push(LG.toJSON(v[i])); } return "[" + a.join(",") + "]"; }
        for (k in v) { if (v.hasOwnProperty(k)) { a.push(LG.toJSON(String(k)) + ":" + LG.toJSON(v[k])); } }
        return "{" + a.join(",") + "}";
    };

    LG.api = function (cmd, json) {
        var out = { ok: true }, a;
        LG.msgs = [];
        try {
            a = json ? LG.parseJSON(String(json)) : {};
            if (cmd === "ping") {
                out.version = LG.VERSION;
                out.comp = (app.project && app.project.activeItem instanceof CompItem) ? app.project.activeItem.name : "";
                out.words = LG.state.words ? LG.state.words.length : 0;
                out.source = LG.state.source;
            } else if (cmd === "transcript") {
                out.count = LG.setTranscript(a.text, a.name);
                out.source = LG.state.source;
            } else if (cmd === "generate") {
                LG.generate(a.text || "", a.sel, a.opt, Number(a.offset) || 0);
                out.words = LG.state.words ? LG.state.words.length : 0;
                out.source = LG.state.source;
            } else if (cmd === "remove") {
                LG.removeGenerated();
            } else if (cmd === "transcribe") {
                var r = LG.transcribe(LG.trim(a.key || ""), LG.trim(a.model || "scribe_v2"));
                out.count = r.count; out.offset = r.offset; out.text = r.text; out.source = LG.state.source;
            } else { throw new Error("Comando desconhecido: " + cmd); }
            out.msg = LG.msgs.join("\n");
        } catch (e) {
            out.ok = false;
            out.msg = String(e && e.message ? e.message : e);
        }
        return LG.toJSON(out);
    };

    // instala o painel HTML a partir do painel antigo (um clique; sem administrador)
    LG.CEP_ID = "com.chavebaixa.reels";
    LG.installCep = function () {
        if (!LG.UPDATE_URL) { return "Esta copia nao tem endereco de atualizacao."; }
        var prefOn = false;
        try { prefOn = app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") === 1; } catch (e0) {}
        if (!prefOn) {
            return "Antes, marque em Edit > Preferences > Scripting & Expressions:\n\"Allow Scripts to Write Files and Access Network\"\n\nDepois clique de novo.";
        }
        var base = Folder.userData.fsName + "/Adobe/CEP/extensions/" + LG.CEP_ID;
        var fd = new Folder(base + "/CSXS");
        if (!fd.exists && !fd.create()) { return "Nao consegui criar a pasta:\n" + fd.fsName; }
        var stamp = "?t=" + new Date().getTime();
        var items = [["cep/index.html", base + "/index.html", "chavebaixa-reels-panel"],
                     ["cep/host.jsx", base + "/host.jsx", "__LG_HEADLESS"],
                     ["cep/manifest.xml", base + "/CSXS/manifest.xml", LG.CEP_ID]], i;
        for (i = 0; i < items.length; i++) {
            var tmp = new File(items[i][1] + ".baixando"), dst = new File(items[i][1]);
            if (!fetchUrl(LG.UPDATE_URL + items[i][0] + stamp, tmp)) { return "Nao consegui baixar " + items[i][0] + " do GitHub.\nConfira a internet e tente de novo."; }
            if (readFile(tmp).indexOf(items[i][2]) < 0) { tmp.remove(); return "O arquivo " + items[i][0] + " veio incompleto. Tente de novo em alguns minutos."; }
            if (dst.exists) { dst.remove(); }
            tmp.copy(dst.fsName); tmp.remove();
        }
        // paineis nao assinados pela Adobe so abrem com esta opcao ligada (por usuario, sem administrador)
        var n;
        for (n = 8; n <= 16; n++) {
            if ($.os.indexOf("Windows") >= 0) { system.callSystem('reg add "HKCU\\Software\\Adobe\\CSXS.' + n + '" /v PlayerDebugMode /t REG_SZ /d 1 /f'); }
            else { system.callSystem("defaults write com.adobe.CSXS." + n + " PlayerDebugMode 1"); }
        }
        return "Painel novo instalado.\n\n1. Feche o After Effects e abra de novo.\n2. Abra em Window > Extensions > chavebaixa reels.\n\nEste painel antigo continua funcionando; pode fechar quando o novo abrir.";
    };

    // ---------------------------------------------------------------- interface
    var UI = {
        W: 330,
        bg:     [0.1, 0.1, 0.11, 1],
        card:   [0.16, 0.16, 0.175, 1],
        cardHi: [0.215, 0.215, 0.235, 1],
        line:   [0.28, 0.28, 0.31, 1],
        screen: [0.03, 0.03, 0.035, 1],
        acc:    [0.94, 0.17, 0.21, 1],
        accHi:  [1, 0.3, 0.33, 1],
        accLo:  [0.72, 0.1, 0.14, 1],
        txt:    [0.94, 0.94, 0.94, 1],
        dim:    [0.58, 0.58, 0.62, 1],
        white:  [1, 1, 1, 1],
        dotR:   [1, 0.37, 0.34, 1],
        dotY:   [1, 0.74, 0.18, 1],
        dotG:   [0.16, 0.79, 0.25, 1]
    };
    function uiBrush(g, c) { return g.newBrush(g.BrushType.SOLID_COLOR, c); }
    function uiPen(g, c, w) { return g.newPen(g.PenType.SOLID_COLOR, c, w || 1); }
    function uiFont(size, bold) {
        var f;
        try { f = ScriptUI.newFont("Arial", bold ? ScriptUI.FontStyle.BOLD : ScriptUI.FontStyle.REGULAR, size); }
        catch (e) { f = ScriptUI.newFont("dialog", ScriptUI.FontStyle.REGULAR, size); }
        return f;
    }
    function uiBold(f) { try { return String(f.style).toLowerCase().indexOf("bold") >= 0 || f.style === ScriptUI.FontStyle.BOLD; } catch (e) { return true; } }
    function uiRect(g, x, y, w, h, c) { g.newPath(); g.rectPath(x, y, w, h); g.fillPath(uiBrush(g, c)); }
    function uiDot(g, cx, cy, r, c) { g.newPath(); g.ellipsePath(cx - r, cy - r, r * 2, r * 2); g.fillPath(uiBrush(g, c)); }
    // retangulo de cantos arredondados (2 retangulos + 4 circulos)
    function uiRound(g, x, y, w, h, r, c) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        if (r < 1) { uiRect(g, x, y, w, h, c); return; }
        uiRect(g, x + r, y, w - 2 * r, h, c);
        uiRect(g, x, y + r, w, h - 2 * r, c);
        uiDot(g, x + r, y + r, r, c); uiDot(g, x + w - r, y + r, r, c);
        uiDot(g, x + r, y + h - r, r, c); uiDot(g, x + w - r, y + h - r, r, c);
    }
    function uiCard(g, x, y, w, h, r, fill, border) {
        if (border) { uiRound(g, x, y, w, h, r, border); uiRound(g, x + 1, y + 1, w - 2, h - 2, r - 1, fill); }
        else { uiRound(g, x, y, w, h, r, fill); }
    }
    // Largura do texto calculada aqui mesmo: o measureString do After ignora a fonte pedida
    // e devolvia larguras menores que o texto desenhado (titulo sobreposto, previa descentralizada).
    function uiWidth(s, size, bold) {
        var w = 0, i, ch;
        s = String(s);
        for (i = 0; i < s.length; i++) {
            ch = s.charAt(i);
            if (ch === " ") { w += 0.28; }
            else if ("iljI.,:;'!|".indexOf(ch) >= 0) { w += 0.3; }
            else if ("ftr-/()".indexOf(ch) >= 0) { w += 0.36; }
            else if ("mw".indexOf(ch) >= 0) { w += 0.86; }
            else if ("MW".indexOf(ch) >= 0) { w += 0.9; }
            else if (ch >= "A" && ch <= "Z") { w += 0.7; }
            else if (ch >= "0" && ch <= "9") { w += 0.56; }
            else { w += 0.58; }
        }
        return w * size * (bold ? 0.93 : 0.87);
    }
    function uiSize(g, s, f) {
        var size = (f && f.size) ? f.size : 12, bold = uiBold(f);
        return { w: uiWidth(s, size, bold), h: size * 1.18 };
    }
    function uiText(g, s, f, c, x, y) { g.drawString(s, uiPen(g, c, 1), x, y, f); }
    function uiTextC(g, s, f, c, cx, y) { uiText(g, s, f, c, cx - uiSize(g, s, f).w / 2, y); }
    function uiMix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1]; }
    function uiTri(g, cx, cy, dir, s, c) {       // dir: "l" "r" "d"
        g.newPath();
        if (dir === "d") { g.moveTo(cx - s, cy - s * 0.6); g.lineTo(cx + s, cy - s * 0.6); g.lineTo(cx, cy + s * 0.7); }
        else { var d = dir === "l" ? -1 : 1; g.moveTo(cx + d * s * 0.7, cy); g.lineTo(cx - d * s * 0.6, cy - s); g.lineTo(cx - d * s * 0.6, cy + s); }
        g.closePath(); g.fillPath(uiBrush(g, c));
    }
    // desenhinhos de fundo
    function uiDoodles(g, x, y, w, h, c, f) {
        var pts = [[0.62, 0.3, 3], [0.74, 0.72, 2], [0.86, 0.22, 2], [0.93, 0.62, 3], [0.55, 0.8, 2], [0.8, 0.45, 1.5]], i;
        for (i = 0; i < pts.length; i++) {
            var px0 = x + w * pts[i][0], py0 = y + h * pts[i][1] + ((f + i) % 4 < 2 ? 0 : 1), r = pts[i][2];
            if (i % 3 === 0) { uiRect(g, px0 - r, py0 - 0.5, r * 2, 1.5, c); uiRect(g, px0 - 0.5, py0 - r, 1.5, r * 2, c); }   // "+"
            else if (i % 3 === 1) { uiDot(g, px0, py0, r, c); }
            else { uiDot(g, px0, py0, r + 1, c); uiDot(g, px0, py0, r - 0.5, UI.card); }                                    // anel
        }
    }
    function uiRedraw(v) { try { v.notify("onDraw"); } catch (e) {} }

    // botao arredondado; kind: "primary" | "plain" | "prev" | "next"
    function uiButton(parent, label, kind, w, h) {
        var b = parent.add("button", undefined, label);
        b.preferredSize = [w, h || 28];
        b.onDraw = function (st) {
            try {
                var g = this.graphics, W = this.size[0], H = this.size[1];
                var over = st && st.mouseOver, down = st && st.leftButtonPressed, c, r = Math.min(H / 2, 12);
                uiRect(g, 0, 0, W, H, UI.bg);
                if (kind === "primary") {
                    c = down ? UI.accLo : (over ? UI.accHi : UI.acc);
                    uiRound(g, 0, 0, W, H, r, c);
                } else {
                    c = down ? UI.bg : (over ? UI.cardHi : UI.card);
                    uiCard(g, 0, 0, W, H, r, c, over ? UI.acc : UI.line);
                }
                if (kind === "prev" || kind === "next") { uiTri(g, W / 2, H / 2, kind === "prev" ? "l" : "r", 6, over ? UI.acc : UI.txt); }
                else {
                    var f = uiFont(12, true), m = uiSize(g, this.text, f);
                    uiText(g, this.text, f, kind === "primary" ? UI.white : UI.txt, (W - m.w) / 2, (H - m.h) / 2);
                }
            } catch (e) {}
        };
        return b;
    }

    function uiCustom(parent, w, h, draw) {
        var v;
        try { v = parent.add("customView"); } catch (e) { v = parent.add("group"); }
        v.preferredSize = [w, h]; v.minimumSize = [w, h];
        v.onDraw = function () { try { draw.call(this, this.graphics, this.size[0], this.size[1]); } catch (e) {} };
        return v;
    }
    function uiLabel(parent, text) {
        var s = parent.add("statictext", undefined, text);
        try { s.graphics.foregroundColor = uiPen(s.graphics, UI.dim, 1); } catch (e) {}
        return s;
    }
    function loadSetting(name, def) {
        try { if (app.settings.haveSetting(LG.SETTINGS, name)) { return app.settings.getSetting(LG.SETTINGS, name); } } catch (e) {}
        return def;
    }
    function saveSetting(name, val) { try { app.settings.saveSetting(LG.SETTINGS, name, String(val)); } catch (e) {} }

    // fonte do After desenhada no painel (se a familia nao existir, o Windows usa uma parecida)
    function uiFontOf(fo, size) {
        try { return ScriptUI.newFont(fo.ui, fo.bold ? ScriptUI.FontStyle.BOLD : ScriptUI.FontStyle.REGULAR, size); }
        catch (e) { return uiFont(size, true); }
    }
    // procura o arquivo da fonte nas pastas de fontes do Windows (so para avisar; nao bloqueia nada)
    var fontSeen = {};
    function fontOk(fo) {
        if (!fo.file) { return true; }
        if (fontSeen[fo.id] !== undefined) { return fontSeen[fo.id]; }
        var ok = true;
        try {
            if ($.os.indexOf("Windows") >= 0) {
                var dirs = [new Folder($.getenv("WINDIR") + "/Fonts"), new Folder($.getenv("LOCALAPPDATA") + "/Microsoft/Windows/Fonts")], d, i, files;
                ok = false;
                for (d = 0; d < dirs.length && !ok; d++) {
                    if (!dirs[d].exists) { continue; }
                    files = dirs[d].getFiles();
                    for (i = 0; i < files.length; i++) { if (fo.file.test(decodeURI(files[i].name))) { ok = true; break; } }
                }
            }
        } catch (e) { ok = true; }
        fontSeen[fo.id] = ok;
        return ok;
    }

    function scrambleText(s, seed) {
        var pool = "X#%&$@07K?", out = "", i;
        for (i = 0; i < s.length; i++) { out += s.charAt(i) === " " ? " " : pool.charAt((seed * 7 + i * 13) % pool.length); }
        return out;
    }

    function buildUI(host) {
        var win = (host instanceof Panel) ? host : new Window("palette", LG.NAME, undefined, { resizeable: true });
        win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 6; win.margins = 10;
        try { win.graphics.backgroundColor = uiBrush(win.graphics, UI.bg); } catch (e0) {}

        // area rolavel (conteudo) + barra de rolagem a direita + rodape fixo.
        // O layout automatico so calcula os tamanhos; quem posiciona esses tres blocos e a funcao fit(),
        // a partir do tamanho real do painel, para a barra nunca ficar fora da area visivel.
        var isPanel = (host instanceof Panel), real = null;
        try { if (isPanel && win.size && win.size.width > 60 && win.size.height > 60) { real = { w: win.size.width, h: win.size.height }; } } catch (eR) {}
        var holder = win.add("group");
        holder.orientation = "column"; holder.alignChildren = ["fill", "top"]; holder.margins = 0;
        var inner = holder.add("group");
        inner.orientation = "column"; inner.alignment = ["fill", "top"]; inner.alignChildren = ["fill", "top"]; inner.spacing = 6; inner.margins = 0;
        var sb = win.add("scrollbar", undefined, 0, 0, 100);
        sb.preferredSize = [UI.W + 16, 4];
        try { sb.stepdelta = 16; sb.jumpdelta = 90; } catch (eS) {}
        var lastScroll = 0;
        var foot = win.add("group");
        foot.orientation = "column"; foot.alignChildren = ["fill", "top"]; foot.spacing = 6; foot.margins = 0;
        function syncScroll() {
            try {
                var over = inner.size.height - holder.size.height;
                if (over > 2) {
                    sb.visible = true; sb.maxvalue = over;
                    if (sb.value > over) { sb.value = over; }
                } else { sb.value = 0; sb.visible = false; }
                inner.location = [0, -Math.round(sb.value)];
            } catch (e) {}
        }
        function fit() {
            try {
                if (!real) { real = { w: win.size.width, h: win.size.height }; }
                var m = 10, gap = 6, sbw = 12, W = real.w, H = real.h, fh = foot.size.height;
                var hh = Math.max(40, H - 2 * m - fh - gap), hw = Math.max(120, W - 2 * m - sbw - 4);
                holder.location = [m, m]; holder.size = [hw, hh];
                sb.location = [m + hw + 4, m]; sb.size = [sbw, hh];
                foot.location = [m, m + hh + gap]; foot.size = [Math.max(120, W - 2 * m), fh];
                // o conteudo acompanha a largura do painel
                try { inner.size = [hw, inner.size.height]; inner.layout.resize(); } catch (e1) {}
                try { foot.layout.resize(); } catch (e2) {}
            } catch (e) {}
            syncScroll();
        }
        sb.onChanging = sb.onChange = function () { lastScroll = new Date().getTime(); try { inner.location = [0, -Math.round(this.value)]; } catch (e) {} };

        var frame = 0, i;
        var cur = parseInt(loadSetting("cur", "0"), 10) || 0;
        if (cur < 0 || cur >= LG.STYLES.length) { cur = 0; }
        var fontIdx = parseInt(loadSetting("font", "0"), 10) || 0;
        if (fontIdx < 0 || fontIdx >= LG.FONTS.length) { fontIdx = 0; }
        var on = {}, saved = loadSetting("on", LG.DEFAULT_ON).split(",");
        for (i = 0; i < saved.length; i++) { on[saved[i]] = true; }
        function onList() { var a = [], k; for (k = 0; k < LG.STYLES.length; k++) { if (on[LG.STYLES[k].id]) { a.push(LG.STYLES[k].id); } } return a; }

        // ---- topo (estilo janela de Mac)
        var top = uiCustom(inner, UI.W, 52, function (g, W, H) {
            uiCard(g, 0, 0, W, H, 12, UI.card, UI.line);
            uiDoodles(g, 0, 0, W, H, UI.line, 0);
            uiDot(g, 16, 13, 4.5, UI.dotR); uiDot(g, 30, 13, 4.5, UI.dotY); uiDot(g, 44, 13, 4.5, UI.dotG);
            var f = uiFont(17, true), w1 = uiSize(g, "chavebaixa", f).w;
            uiText(g, "chavebaixa", f, UI.txt, 14, 23);
            uiText(g, "reels", f, UI.acc, 14 + w1 + 6, 23);
            var fv = uiFont(10, true), vs = "v" + LG.VERSION;
            uiText(g, vs, fv, UI.dim, W - uiSize(g, vs, fv).w - 12, 7);
            // mini equalizador (parado)
            var k, hs = [7, 13, 9, 15, 6];
            for (k = 0; k < 5; k++) { uiRound(g, W - 46 + k * 7, 44 - hs[k], 4, hs[k], 2, UI.acc); }
        });
        top.alignment = ["fill", "top"]; top.minimumSize = [140, 52];

        // ---- convite para o painel novo (HTML)
        var bNew = uiButton(inner, "INSTALAR O PAINEL NOVO  (liso, com rodinha do mouse)", "primary", UI.W, 30);
        bNew.alignment = ["fill", "top"];
        bNew.onClick = function () {
            try {
                if (!confirm("Instalar o painel novo do chavebaixa reels?\n\nEle baixa 3 arquivos do GitHub para a pasta de extensoes do After e liga a opcao de desenvolvedor de paineis (PlayerDebugMode) no seu usuario do Windows. Nao pede administrador.")) { return; }
                alert(LG.installCep());
            } catch (e) { alert(e.toString()); }
        };

        // ---- secoes recolhiveis
        var sections = [];
        function relayout() {
            try { win.layout.layout(true); } catch (e) {}
            // num painel preso quem manda no tamanho e o After: devolve o tamanho real depois do calculo
            if (isPanel && real) { try { win.size = [real.w, real.h]; } catch (e2) {} }
            else { try { real = { w: win.size.width, h: win.size.height }; } catch (e3) {} }
            fit();
        }
        function setOpen(sec, open, quiet) {
            sec.open = open;
            sec.body.visible = open;
            sec.body.maximumSize = open ? [10000, 10000] : [10000, 0];
            saveSetting("open" + sec.num, open ? "1" : "0");
            if (!quiet) { relayout(); uiRedraw(sec.head); }
        }
        function section(num, title, defOpen) {
            var sec = { num: num, open: true };
            sec.head = inner.add("button", undefined, title);
            sec.head.preferredSize = [UI.W, 26]; sec.head.alignment = ["fill", "top"];
            sec.head.onDraw = function (st) {
                try {
                    var g = this.graphics, W = this.size[0], H = this.size[1], over = st && st.mouseOver;
                    uiRect(g, 0, 0, W, H, UI.bg);
                    uiCard(g, 0, 0, W, H, 13, over ? UI.cardHi : UI.card, UI.line);
                    uiDot(g, 15, H / 2, 8, UI.acc);
                    uiTextC(g, String(num), uiFont(11, true), UI.white, 15, H / 2 - 7);
                    uiText(g, this.text, uiFont(12, true), UI.txt, 30, H / 2 - 7);
                    uiTri(g, W - 16, H / 2, sec.open ? "d" : "l", 5, sec.open ? UI.acc : UI.dim);
                } catch (e) {}
            };
            sec.body = inner.add("group");
            sec.body.orientation = "column"; sec.body.alignChildren = ["fill", "top"]; sec.body.spacing = 6; sec.body.margins = [4, 2, 4, 4];
            sec.head.onClick = function () { setOpen(sec, !sec.open); };
            sec.defOpen = loadSetting("open" + num, defOpen ? "1" : "0") === "1";
            sections.push(sec);
            return sec;
        }

        // ---- 1. tempo
        var s1 = section(1, "Tempo das palavras", true), b1 = s1.body;
        var g1 = b1.add("group"); g1.spacing = 8;
        var bImport = uiButton(g1, "Importar JSON / SRT", "plain", 156);
        var bScribe = uiButton(g1, "Transcrever (ElevenLabs)", "plain", 156);
        bImport.alignment = ["fill", "center"]; bScribe.alignment = ["fill", "center"];
        var g2 = b1.add("group"); g2.spacing = 6;
        uiLabel(g2, "API do ElevenLabs:");
        var eKey = g2.add("edittext", undefined, "", { noecho: true }); eKey.characters = 11;
        uiLabel(g2, "Modelo:");
        var eModel = g2.add("edittext", undefined, "scribe_v2"); eModel.characters = 7;
        var cKeep = b1.add("checkbox", undefined, "Lembrar a API neste computador");
        var sStatus = uiLabel(b1, "Nenhuma transcricao carregada."); sStatus.characters = 38;

        // ---- 2. texto
        var s2 = section(2, "SRT ou letra (uma frase por linha)", true), b2 = s2.body;
        var eLyr = b2.add("edittext", undefined, "", { multiline: true, scrolling: true });
        eLyr.preferredSize = [UI.W - 8, 90]; eLyr.alignment = ["fill", "top"];

        // ---- 3. estilo (carrossel animado)
        var s3 = section(3, "Estilo", true), b3 = s3.body;
        var gc = b3.add("group"); gc.spacing = 6; gc.alignChildren = ["left", "center"];
        var bPrev = uiButton(gc, "<", "prev", 28, 56);
        var pv = uiCustom(gc, UI.W - 76, 214, function (g, W, H) {
            var st = LG.STYLES[cur], k, n = st.pv.length, a = st.anim, D = 6;
            var cycle = (n + 1) * D + 16, T = frame % cycle;
            function ramp(t0, len) { return Math.max(0, Math.min(1, (T - t0) / len)); }
            uiCard(g, 0, 0, W, H, 14, UI.card, UI.line);
            uiDoodles(g, 0, 0, W, H, UI.line, 0);
            // "celular" 9:16
            var ph = H - 18, pw = Math.round(ph * 9 / 16), x0 = 10, y0 = 9, cx = x0 + pw / 2, sc = ph / 170, maxW = pw - 26;
            uiCard(g, x0, y0, pw, ph, 12, UI.screen, UI.line);
            uiRound(g, cx - 13, y0 + 6, 26, 5, 2.5, UI.line);
            // tamanho de cada linha, reduzido se nao couber na tela do celular
            var sizes = [], total = 0, FO = LG.FONTS[fontIdx];
            for (k = 0; k < n; k++) {
                var sz = st.pv[k][1] * sc, wd = uiWidth(st.pv[k][0], sz, true) * FO.wf + Math.abs(st.pv[k][3] * sc) * 2;
                if (wd > maxW) { sz = sz * maxW / wd; }
                sizes[k] = Math.max(8, Math.floor(sz));
                total += sizes[k] * 1.3;
            }
            var y = y0 + (ph - total) / 2;
            for (k = 0; k < n; k++) {
                var ln = st.pv[k], text = ln[0], al = 1, size = sizes[k], col = UI.txt, t0 = k * D;
                var dx = ln[3] * sc * (sizes[k] / (ln[1] * sc)), dy = 0, cursor = false;
                if (a === "cum" || a === "shake") {
                    var inn = ramp(t0, 3);
                    al = inn * (1 - (k < n - 1 ? 0.5 * ramp(t0 + D, 3) : 0));
                    dy = (1 - inn) * 6;
                } else if (a === "kar") { al = 0.26 + 0.74 * ramp(t0, 3); }
                else if (a === "type") { text = text.substr(0, Math.min(text.length, Math.floor(T / 3) + 1)); cursor = (T % 6) < 3; }
                else if (a === "alt") {
                    al = (Math.floor(T / 10) % 2) === (k % 2) ? 1 : 0;
                    size = Math.max(8, Math.round(size * (0.8 + 0.2 * Math.min(1, (T % 10) / 3))));
                } else if (a === "fade") { al = ramp(k * 5, 9); }
                else if (a === "burn") { al = ramp(k * 4, 10); col = uiMix(UI.acc, UI.txt, al); }
                else if (a === "scr") {
                    var solved = Math.floor(ramp(2 + k * 3, 14) * (text.length + 1));
                    if (solved < text.length) { text = text.substr(0, solved) + scrambleText(text, frame + k).substr(solved); al = 0.7; }
                }
                if (a === "shake") { dx += ((frame * 7 + k * 3) % 5) - 2; dy += ((frame * 5 + k) % 3) - 1; }
                if (al > 0.02 && text.length) {
                    var tw = uiWidth(text, size, true) * FO.wf;
                    uiText(g, text, uiFontOf(FO, size), uiMix(UI.screen, col, al), cx + dx - tw / 2, y + dy + (sizes[k] - size) / 2);
                    if (cursor) { uiRect(g, cx + dx + tw / 2 + 2, y + 2, 2, size, UI.acc); }
                }
                y += sizes[k] * 1.3;
            }
            if (a === "wipe") {
                var wt = ramp(2, 16), wx = x0 + 4 + (pw - 8) * wt;
                if (wt < 1) { uiRect(g, wx, y0 + 16, x0 + pw - 4 - wx, ph - 32, UI.screen); uiRect(g, wx, y0 + ph * 0.3, 2, ph * 0.4, UI.acc); }
            }
            // corta o que passar da tela do celular (a fonte real pode ser mais larga que a estimativa)
            uiRect(g, 1, y0 + 12, x0 - 1, ph - 24, UI.card);
            uiRect(g, x0 + pw, 15, W - (x0 + pw) - 2, H - 30, UI.card);
            uiDoodles(g, 0, 0, W, H, UI.line, 0);
            // coluna de texto
            var tx = x0 + pw + 14, ty = y0 + 3;
            if (st.isNew) { uiRound(g, tx, ty, 44, 16, 8, UI.acc); uiText(g, "NOVO", uiFont(10, true), UI.white, tx + 8, ty + 2); }
            else { uiCard(g, tx, ty, 76, 16, 8, UI.card, UI.line); uiText(g, "EXTRAREEL", uiFont(9, true), UI.dim, tx + 9, ty + 3); }
            ty += 22;
            uiText(g, st.name, uiFont(19, true), UI.txt, tx, ty); ty += 28;
            for (k = 0; k < st.desc.length; k++) { uiText(g, st.desc[k], uiFont(11, false), UI.dim, tx, ty); ty += 14; }
            var isOn = on[st.id];
            uiDot(g, tx + 4, H - 44, 4, isOn ? UI.acc : UI.line);
            uiText(g, isOn ? "Na alternancia" : "Fora da alternancia", uiFont(11, true), isOn ? UI.txt : UI.dim, tx + 13, H - 51);
            for (k = 0; k < LG.STYLES.length; k++) {
                if (k === cur) { uiRound(g, tx + k * 10 - 1, H - 22, 10, 6, 3, UI.acc); }
                else { uiDot(g, tx + k * 10 + 4, H - 19, 2.5, on[LG.STYLES[k].id] ? UI.txt : UI.line); }
            }
        });
        pv.alignment = ["fill", "center"]; pv.minimumSize = [150, 214];
        var bNext = uiButton(gc, ">", "next", 28, 56);

        // ---- fonte (setas trocam; a palavra de exemplo mostra como fica)
        var gf = b3.add("group"); gf.spacing = 6; gf.alignChildren = ["left", "center"];
        var bFPrev = uiButton(gf, "<", "prev", 28, 40);
        var fv = uiCustom(gf, UI.W - 76, 54, function (g, W, H) {
            var fo = LG.FONTS[fontIdx], ok = fontOk(fo);
            uiCard(g, 0, 0, W, H, 12, UI.card, UI.line);
            uiText(g, "FONTE " + (fontIdx + 1) + "/" + LG.FONTS.length + (fontIdx === 0 ? "  (padrao)" : ""), uiFont(9, true), UI.dim, 12, 7);
            uiText(g, fo.name, uiFont(13, true), UI.txt, 12, 20);
            if (!ok) { uiText(g, "nao achei instalada neste PC", uiFont(9, true), UI.acc, 12, 38); }
            var word = "chavebaixa", size = 21, w = uiWidth(word, size, true) * fo.wf;
            if (w > W - 150) { size = Math.floor(size * (W - 150) / w); w = uiWidth(word, size, true) * fo.wf; }
            uiText(g, word, uiFontOf(fo, size), ok ? UI.txt : UI.dim, W - 14 - w, (H - size * 1.2) / 2);
        });
        fv.alignment = ["fill", "center"]; fv.minimumSize = [150, 54];
        var bFNext = uiButton(gf, ">", "next", 28, 40);

        var cUse = b3.add("checkbox", undefined, "Usar este estilo na alternancia");
        var g3 = b3.add("group"); g3.spacing = 6;
        uiLabel(g3, "Modo:");
        var dMode = g3.add("dropdownlist", undefined, ["Alternar entre os marcados", "Aleatorio entre os marcados", "So o estilo mostrado acima"]);
        dMode.selection = parseInt(loadSetting("mode", "0"), 10) || 0;
        dMode.preferredSize = [230, 24];
        var g4 = b3.add("group"); g4.spacing = 10;
        var cPost = g4.add("checkbox", undefined, "12 fps"); cPost.value = true; g4.spacing = 6;
        var cBlur = g4.add("checkbox", undefined, "Lens blur"); cBlur.value = true;
        var cShadow = g4.add("checkbox", undefined, "Sombra"); cShadow.value = false;
        var cZoom = g4.add("checkbox", undefined, "Zoom lento"); cZoom.value = true;
        var g5 = b3.add("group"); g5.spacing = 6;
        uiLabel(g5, "Atraso do audio na comp (s):");
        var eOff = g5.add("edittext", undefined, "0"); eOff.characters = 7;

        // ---- atualizacao manual (o painel ja confere sozinho ao abrir; isto serve para forcar e para dizer o que houve)
        var bUpd = uiButton(inner, "Procurar atualizacao  (v" + LG.VERSION + ")", "plain", UI.W, 24);
        bUpd.alignment = ["fill", "top"];
        bUpd.onClick = function () { try { alert(LG.checkUpdate()); } catch (e) { alert(e.toString()); } };

        // ---- rodape (sempre visivel)
        var divider = uiCustom(foot, UI.W, 12, function (g, W, H) {
            uiRound(g, 0, 2, W, 8, 4, UI.line);
            uiRound(g, 1, 3, W - 2, 6, 3, [0, 0, 0, 1]);
            uiDot(g, W / 2 - 8, 6, 1.5, UI.dim); uiDot(g, W / 2, 6, 1.5, UI.dim); uiDot(g, W / 2 + 8, 6, 1.5, UI.dim);
        });
        divider.alignment = ["fill", "top"]; divider.minimumSize = [100, 12];
        var cReplace = foot.add("checkbox", undefined, "Substituir as legendas que ja gerei nesta comp");
        cReplace.value = true;
        var g6 = foot.add("group"); g6.spacing = 8;
        var bGo = uiButton(g6, "GERAR / ATUALIZAR", "primary", 196, 34);
        var bDel = uiButton(g6, "Remover geradas", "plain", 124, 34);
        bGo.alignment = ["fill", "center"];

        eKey.text = loadSetting("key", ""); cKeep.value = eKey.text !== "";
        eModel.text = loadSetting("model", "scribe_v2");

        function showStyle(n) {
            cur = (n + LG.STYLES.length) % LG.STYLES.length;
            cUse.value = on[LG.STYLES[cur].id] === true;
            saveSetting("cur", cur);
            frame = 0;
            uiRedraw(pv);
        }
        function showFont(n) {
            fontIdx = (n + LG.FONTS.length) % LG.FONTS.length;
            saveSetting("font", fontIdx);
            uiRedraw(fv); uiRedraw(pv);
        }
        bFPrev.onClick = function () { showFont(fontIdx - 1); };
        bFNext.onClick = function () { showFont(fontIdx + 1); };
        bPrev.onClick = function () { showStyle(cur - 1); };
        bNext.onClick = function () { showStyle(cur + 1); };
        cUse.onClick = function () {
            on[LG.STYLES[cur].id] = cUse.value;
            saveSetting("on", onList().join(","));
            uiRedraw(pv);
        };
        dMode.onChange = function () { if (dMode.selection) { saveSetting("mode", dMode.selection.index); } };
        cUse.value = on[LG.STYLES[cur].id] === true;

        bImport.onClick = function () {
            try { var n = LG.importFile(); if (n) { sStatus.text = n + " palavras de " + LG.state.source; } }
            catch (e) { alert(e.toString()); }
        };
        bScribe.onClick = function () {
            try {
                sStatus.text = "Enviando para o ElevenLabs... (o After fica parado ate voltar)";
                if (win.update) { win.update(); }
                var r = LG.transcribe(LG.trim(eKey.text), LG.trim(eModel.text));
                sStatus.text = r.count + " palavras de " + LG.state.source;
                eOff.text = String(Math.round(r.offset * 1000) / 1000);
                saveSetting("key", cKeep.value ? LG.trim(eKey.text) : "");
                saveSetting("model", LG.trim(eModel.text));
                if (!LG.trim(eLyr.text) && r.text && confirm("Colocar o texto transcrito na caixa para voce corrigir e quebrar em frases?")) { eLyr.text = r.text; }
            } catch (e) { sStatus.text = "Nao transcreveu. Veja o aviso."; alert(e.toString()); }
        };
        bGo.onClick = function () {
            var m = dMode.selection ? dMode.selection.index : 0;
            var sel = { mode: m === 0 ? "cycle" : (m === 1 ? "random" : "single"), single: LG.STYLES[cur].id, list: onList() };
            if (sel.mode !== "single" && !sel.list.length) { alert("Marque pelo menos um estilo em \"Usar este estilo na alternancia\"."); return; }
            var off = parseFloat(String(eOff.text).replace(",", ".")); if (isNaN(off)) { off = 0; }
            try {
                LG.generate(eLyr.text, sel, { posterize: cPost.value, blur: cBlur.value, shadow: cShadow.value, zoom: cZoom.value, replace: cReplace.value, font: LG.FONTS[fontIdx].ps }, off);
                if (LG.state.words) { sStatus.text = LG.state.words.length + " palavras de " + LG.state.source; }
            } catch (e) { alert(e.toString()); }
        };
        bDel.onClick = function () { try { LG.removeGenerated(); } catch (e) { alert(e.toString()); } };

        // ---- animacao da previa. Um unico timer global; some sozinho se o painel fechar.
        try { if ($.global.__LKR_TASK) { app.cancelTask($.global.__LKR_TASK); } } catch (e1) {}
        $.global.__LKR_TICK = function () {
            try {
                if (new Date().getTime() - lastScroll < 600) { return; }
                frame++;
                if (s3.open) { pv.notify("onDraw"); }
            } catch (e) { try { app.cancelTask($.global.__LKR_TASK); } catch (e2) {} }
        };
        try { $.global.__LKR_TASK = app.scheduleTask("$.global.__LKR_TICK()", 90, true); } catch (e3) {}
        win.onClose = function () { try { app.cancelTask($.global.__LKR_TASK); } catch (e) {} return true; };

        win.onResizing = win.onResize = function () {
            try { if (this.size.width > 60 && this.size.height > 60) { real = { w: this.size.width, h: this.size.height }; } } catch (e) {}
            fit();
        };
        for (i = 0; i < sections.length; i++) { if (!sections[i].defOpen) { setOpen(sections[i], false, true); } }
        relayout();
        if (win instanceof Window) { win.center(); win.show(); }
        return win;
    }

    if ($.global.__LG_HEADLESS) { $.global.LG = LG; return; }
    buildUI(thisObj);

// quando aberto pelo carregador (ScriptUI Panels), o painel do After vem em $.global.__LG_HOST
})((typeof $ !== "undefined" && $.global && $.global.__LG_HOST) ? $.global.__LG_HOST : this);
