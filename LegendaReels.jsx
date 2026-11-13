/*
  LegendaReels.jsx  -  legendas de letra de musica sincronizadas, no estilo do projeto EXTRAREEL.

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
    LG.NAME = "Legenda Reels";
    LG.VERSION = "1.3.1";
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

    // id, nome, novo?, descricao (linhas), previa: linhas [texto, tamanho, brilho 0..1, deslocamento x], efeito da previa
    LG.STYLES = [
        { id: "stack",    name: "Pilha",    isNew: false, desc: ["Uma palavra por linha,", "acumulando no tempo", "da musica."],
          pv: [["Like", 15, 0.45, 0], ["how", 15, 0.45, 0], ["my", 15, 0.45, 0], ["cousin", 15, 1, 0]] },
        { id: "phrase",   name: "Frase",    isNew: false, desc: ["Frase centralizada que", "cresce palavra a palavra."],
          pv: [["Know that", 15, 0.5, 0], ["shit would", 15, 1, 0]] },
        { id: "punch",    name: "Punch",    isNew: false, desc: ["Palavra gigante digitada", "letra a letra, trocando", "de fonte."],
          pv: [["NO", 46, 1, 0]] },
        { id: "wipe",     name: "Wipe",     isNew: false, desc: ["Bloco inteiro revelado", "com Linear Wipe."], fx: "wipe",
          pv: [["Shots fired", 14, 1, 0], ["now it's a", 14, 1, 0], ["man gone", 14, 1, 0]] },
        { id: "burn",     name: "Burn",     isNew: false, desc: ["Bloco surge queimando", "com CC Burn Film."], fx: "burn",
          pv: [["My heart", 14, 1, 0], ["filled up", 14, 1, 0], ["with pain", 14, 1, 0]] },
        { id: "scramble", name: "Scramble", isNew: false, desc: ["Letras embaralhadas", "ate formar o texto."],
          pv: [["Ev3ry8ody", 14, 0.45, 0], ["gr!ev1ng", 14, 0.45, 0], ["want to go", 14, 1, 0]] },
        { id: "stairs",   name: "Escada",   isNew: true,  desc: ["Palavras em zigue-zague,", "acumulando."],
          pv: [["Like", 14, 0.5, -20], ["how", 14, 0.5, -4], ["my", 14, 0.5, 12], ["cousin", 14, 1, -4]] },
        { id: "flash",    name: "Flash",    isNew: true,  desc: ["Uma palavra por vez,", "alternando fonte", "e tamanho."],
          pv: [["we", 12, 0.3, 0], ["RIDE", 34, 1, 0]] },
        { id: "karaoke",  name: "Karaoke",  isNew: true,  desc: ["Frase inteira na tela;", "a palavra cantada", "acende."],
          pv: [["I lost", 14, 1, 0], ["my brother", 14, 0.3, 0]] },
        { id: "tracking", name: "Tracking", isNew: true,  desc: ["Letras espacadas", "que se juntam."],
          pv: [["S H O T S", 13, 0.4, 0], ["SHOTS", 19, 1, 0]] },
        { id: "blurin",   name: "Blur-in",  isNew: true,  desc: ["Letras saem do", "desfoque uma a uma."],
          pv: [["Mommas", 15, 1, 0], ["crying", 15, 0.55, 0], ["at the", 15, 0.2, 0]] },
        { id: "shake",    name: "Tremor",   isNew: true,  desc: ["Frase acumulando", "com tremor (wiggle)."], fx: "shake",
          pv: [["GO HOME", 18, 1, 0]] }
    ];
    // estilos que entram na alternancia por padrao: os do EXTRAREEL
    LG.DEFAULT_ON = "stack,phrase,punch,wipe,burn,scramble";

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
        if (!(comp instanceof CompItem)) { alert("Abra a comp do reel antes de gerar."); return; }
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
        } else { alert("Importe/transcreva o audio ou cole a letra primeiro."); return; }

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
        alert(msg);
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
        alert(n + " camadas de legenda removidas (Ctrl+Z desfaz).");
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

    // ---------------------------------------------------------------- interface
    var UI = {
        bg:     [0.105, 0.105, 0.115, 1],
        card:   [0.165, 0.165, 0.18, 1],
        cardHi: [0.215, 0.215, 0.235, 1],
        line:   [0.29, 0.29, 0.32, 1],
        screen: [0.035, 0.035, 0.04, 1],
        acc:    [0.96, 0.37, 0.2, 1],
        accHi:  [1, 0.47, 0.3, 1],
        accLo:  [0.78, 0.28, 0.14, 1],
        txt:    [0.93, 0.93, 0.93, 1],
        dim:    [0.58, 0.58, 0.62, 1],
        white:  [1, 1, 1, 1]
    };
    function uiBrush(g, c) { return g.newBrush(g.BrushType.SOLID_COLOR, c); }
    function uiPen(g, c, w) { return g.newPen(g.PenType.SOLID_COLOR, c, w || 1); }
    function uiFont(size, bold) {
        try { return ScriptUI.newFont("Arial", bold ? ScriptUI.FontStyle.BOLD : ScriptUI.FontStyle.REGULAR, size); }
        catch (e) { return ScriptUI.newFont("dialog", ScriptUI.FontStyle.REGULAR, size); }
    }
    function uiRect(g, x, y, w, h, c) { g.newPath(); g.rectPath(x, y, w, h); g.fillPath(uiBrush(g, c)); }
    function uiFrame(g, x, y, w, h, c) { g.newPath(); g.rectPath(x + 0.5, y + 0.5, w - 1, h - 1); g.strokePath(uiPen(g, c, 1)); }
    function uiSize(g, s, f) {
        var m = g.measureString(s, f);
        return { w: m.width !== undefined ? m.width : m[0], h: m.height !== undefined ? m.height : m[1] };
    }
    function uiText(g, s, f, c, x, y) { g.drawString(s, uiPen(g, c, 1), x, y, f); }
    function uiTextC(g, s, f, c, cx, y) { uiText(g, s, f, c, cx - uiSize(g, s, f).w / 2, y); }
    function uiMix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1]; }
    function uiRedraw(v) { try { v.notify("onDraw"); } catch (e) { try { v.hide(); v.show(); } catch (e2) {} } }

    // botao chapado; kind: "primary" | "plain" | "prev" | "next"
    function uiButton(parent, label, kind, w, h) {
        var b = parent.add("button", undefined, label);
        b.preferredSize = [w, h || 30];
        b.onDraw = function (st) {
            try {
                var g = this.graphics, W = this.size[0], H = this.size[1];
                var over = st && st.mouseOver, down = st && st.leftButtonPressed, c;
                if (kind === "primary") { c = down ? UI.accLo : (over ? UI.accHi : UI.acc); }
                else { c = down ? UI.bg : (over ? UI.cardHi : UI.card); }
                uiRect(g, 0, 0, W, H, c);
                if (kind !== "primary") { uiFrame(g, 0, 0, W, H, over ? UI.dim : UI.line); }
                if (kind === "prev" || kind === "next") {
                    var d = kind === "prev" ? -1 : 1, cx = W / 2, cy = H / 2;
                    g.newPath(); g.moveTo(cx + d * 5, cy); g.lineTo(cx - d * 4, cy - 8); g.lineTo(cx - d * 4, cy + 8); g.closePath();
                    g.fillPath(uiBrush(g, over ? UI.acc : UI.txt));
                } else {
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

    function uiHeader(parent, num, title) {
        var v = uiCustom(parent, 380, 22, function (g, W, H) {
            uiText(g, num, uiFont(12, true), UI.acc, 0, 2);
            uiText(g, title, uiFont(12, true), UI.txt, 18, 2);
            uiRect(g, 0, H - 1, W, 1, UI.line);
        });
        v.alignment = ["fill", "top"];
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

    function buildUI(host) {
        var win = (host instanceof Panel) ? host : new Window("palette", LG.NAME, undefined, { resizeable: true });
        win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 7; win.margins = 12;
        try { win.graphics.backgroundColor = uiBrush(win.graphics, UI.bg); } catch (e0) {}

        // estado do carrossel
        var cur = parseInt(loadSetting("cur", "0"), 10) || 0, i;
        if (cur < 0 || cur >= LG.STYLES.length) { cur = 0; }
        var on = {}, saved = loadSetting("on", LG.DEFAULT_ON).split(",");
        for (i = 0; i < saved.length; i++) { on[saved[i]] = true; }
        function onList() { var a = [], k; for (k = 0; k < LG.STYLES.length; k++) { if (on[LG.STYLES[k].id]) { a.push(LG.STYLES[k].id); } } return a; }

        // ---- topo
        var top = uiCustom(win, 380, 46, function (g, W, H) {
            uiRect(g, 0, 0, W, H, UI.card);
            uiRect(g, 0, 0, 4, H, UI.acc);
            var f = uiFont(17, true), w1 = uiSize(g, "LEGENDA ", f).w;
            uiText(g, "LEGENDA ", f, UI.txt, 16, 6);
            uiText(g, "REELS", f, UI.acc, 16 + w1, 6);
            uiText(g, "letra sincronizada no estilo EXTRAREEL", uiFont(10, false), UI.dim, 16, 28);
            var fv = uiFont(10, true), vs = "v" + LG.VERSION;
            uiText(g, vs, fv, UI.dim, W - uiSize(g, vs, fv).w - 10, 8);
        });
        top.alignment = ["fill", "top"];

        // ---- 1. tempo
        uiHeader(win, "1", "Tempo das palavras");
        var g1 = win.add("group"); g1.spacing = 8;
        var bImport = uiButton(g1, "Importar JSON / SRT", "plain", 186);
        var bScribe = uiButton(g1, "Transcrever (ElevenLabs)", "plain", 186);
        var g2 = win.add("group"); g2.spacing = 6;
        uiLabel(g2, "API do ElevenLabs:");
        var eKey = g2.add("edittext", undefined, "", { noecho: true }); eKey.characters = 16;
        uiLabel(g2, "Modelo:");
        var eModel = g2.add("edittext", undefined, "scribe_v2"); eModel.characters = 8;
        var cKeep = win.add("checkbox", undefined, "Lembrar a API neste computador");
        var sStatus = uiLabel(win, "Nenhuma transcricao carregada."); sStatus.characters = 46;

        // ---- 2. texto
        uiHeader(win, "2", "SRT ou letra (uma frase por linha)");
        var eLyr = win.add("edittext", undefined, "", { multiline: true, scrolling: true });
        eLyr.preferredSize = [380, 120]; eLyr.alignment = ["fill", "top"];

        // ---- 3. estilo (carrossel)
        uiHeader(win, "3", "Estilo");
        var gc = win.add("group"); gc.spacing = 6; gc.alignChildren = ["left", "center"];
        var bPrev = uiButton(gc, "<", "prev", 30, 64);
        var pv = uiCustom(gc, 308, 214, function (g, W, H) {
            var st = LG.STYLES[cur], k;
            uiRect(g, 0, 0, W, H, UI.card);
            uiFrame(g, 0, 0, W, H, UI.line);
            // "celular" 9:16 com a previa
            var ph = H - 20, pw = Math.round(ph * 9 / 16), x0 = 10, y0 = 10, cx = x0 + pw / 2;
            uiRect(g, x0, y0, pw, ph, UI.screen);
            var total = 0;
            for (k = 0; k < st.pv.length; k++) { total += st.pv[k][1] * 1.3; }
            var y = y0 + (ph - total) / 2;
            for (k = 0; k < st.pv.length; k++) {
                var ln = st.pv[k], f = uiFont(ln[1], true), c = uiMix(UI.screen, UI.txt, ln[2]);
                if (st.fx === "burn" && k === st.pv.length - 1) { c = UI.acc; }
                if (st.fx === "shake") {
                    uiTextC(g, ln[0], f, uiMix(UI.screen, UI.acc, 0.55), cx + ln[3] - 3, y - 2);
                    uiTextC(g, ln[0], f, uiMix(UI.screen, UI.txt, 0.35), cx + ln[3] + 3, y + 2);
                }
                uiTextC(g, ln[0], f, c, cx + ln[3], y);
                y += ln[1] * 1.3;
            }
            if (st.fx === "wipe") {
                uiRect(g, x0 + pw * 0.6, y0, pw * 0.4, ph, UI.screen);
                uiRect(g, x0 + pw * 0.6, y0 + ph * 0.3, 2, ph * 0.4, UI.acc);
            }
            if (st.fx === "burn") {
                uiRect(g, cx + 26, y - 30, 7, 7, UI.acc); uiRect(g, cx + 36, y - 20, 4, 4, UI.accHi);
                uiRect(g, cx - 40, y - 12, 5, 5, UI.accLo); uiRect(g, cx + 18, y - 8, 3, 3, UI.accHi);
            }
            uiFrame(g, x0, y0, pw, ph, UI.line);
            // coluna de texto
            var tx = x0 + pw + 16, ty = y0 + 2;
            if (st.isNew) {
                uiRect(g, tx, ty, 42, 16, UI.acc);
                uiText(g, "NOVO", uiFont(10, true), UI.white, tx + 7, ty + 2);
                ty += 24;
            } else {
                uiFrame(g, tx, ty, 74, 16, UI.line);
                uiText(g, "EXTRAREEL", uiFont(9, true), UI.dim, tx + 7, ty + 3);
                ty += 24;
            }
            uiText(g, st.name, uiFont(20, true), UI.txt, tx, ty); ty += 32;
            for (k = 0; k < st.desc.length; k++) { uiText(g, st.desc[k], uiFont(11, false), UI.dim, tx, ty); ty += 15; }
            var isOn = on[st.id];
            uiRect(g, tx, H - 58, 8, 8, isOn ? UI.acc : UI.line);
            uiText(g, isOn ? "Na alternancia" : "Fora da alternancia", uiFont(11, true), isOn ? UI.txt : UI.dim, tx + 14, H - 61);
            uiText(g, (cur + 1) + " / " + LG.STYLES.length, uiFont(10, false), UI.dim, tx, H - 38);
            for (k = 0; k < LG.STYLES.length; k++) {
                uiRect(g, tx + k * 11, H - 18, 8, k === cur ? 5 : 3, k === cur ? UI.acc : (on[LG.STYLES[k].id] ? UI.txt : UI.line));
            }
        });
        var bNext = uiButton(gc, ">", "next", 30, 64);

        var cUse = win.add("checkbox", undefined, "Usar este estilo na alternancia");
        var g3 = win.add("group"); g3.spacing = 6;
        uiLabel(g3, "Modo:");
        var dMode = g3.add("dropdownlist", undefined, ["Alternar entre os marcados", "Aleatorio entre os marcados", "So o estilo mostrado acima"]);
        dMode.selection = parseInt(loadSetting("mode", "0"), 10) || 0;
        dMode.preferredSize = [250, 24];

        var g4 = win.add("group"); g4.spacing = 12;
        var cPost = g4.add("checkbox", undefined, "12 fps"); cPost.value = true;
        var cBlur = g4.add("checkbox", undefined, "Lens blur"); cBlur.value = true;
        var cShadow = g4.add("checkbox", undefined, "Sombra"); cShadow.value = false;
        var cZoom = g4.add("checkbox", undefined, "Zoom lento"); cZoom.value = true;
        var g5 = win.add("group"); g5.spacing = 6;
        uiLabel(g5, "Atraso do audio na comp (s):");
        var eOff = g5.add("edittext", undefined, "0"); eOff.characters = 7;

        // ---- rodape
        var sep = uiCustom(win, 380, 1, function (g, W, H) { uiRect(g, 0, 0, W, 1, UI.line); });
        sep.alignment = ["fill", "top"];
        var cReplace = win.add("checkbox", undefined, "Substituir as legendas que ja gerei nesta comp");
        cReplace.value = true;
        var g6 = win.add("group"); g6.spacing = 8;
        var bGo = uiButton(g6, "GERAR / ATUALIZAR", "primary", 240, 36);
        var bDel = uiButton(g6, "Remover geradas", "plain", 132, 36);

        eKey.text = loadSetting("key", ""); cKeep.value = eKey.text !== "";
        eModel.text = loadSetting("model", "scribe_v2");

        function showStyle(n) {
            cur = (n + LG.STYLES.length) % LG.STYLES.length;
            cUse.value = on[LG.STYLES[cur].id] === true;
            saveSetting("cur", cur);
            uiRedraw(pv);
        }
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
            } catch (e) { sStatus.text = "Falhou."; alert(e.toString()); }
        };
        bGo.onClick = function () {
            var m = dMode.selection ? dMode.selection.index : 0;
            var sel = { mode: m === 0 ? "cycle" : (m === 1 ? "random" : "single"), single: LG.STYLES[cur].id, list: onList() };
            if (sel.mode !== "single" && !sel.list.length) { alert("Marque pelo menos um estilo em \"Usar este estilo na alternancia\"."); return; }
            var off = parseFloat(String(eOff.text).replace(",", ".")); if (isNaN(off)) { off = 0; }
            try {
                LG.generate(eLyr.text, sel, { posterize: cPost.value, blur: cBlur.value, shadow: cShadow.value, zoom: cZoom.value, replace: cReplace.value }, off);
                if (LG.state.words) { sStatus.text = LG.state.words.length + " palavras de " + LG.state.source; }
            } catch (e) { alert(e.toString()); }
        };
        bDel.onClick = function () { try { LG.removeGenerated(); } catch (e) { alert(e.toString()); } };

        win.onResizing = win.onResize = function () { this.layout.resize(); };
        win.layout.layout(true);
        if (win instanceof Window) { win.center(); win.show(); }
        return win;
    }

    buildUI(thisObj);

// quando aberto pelo carregador (ScriptUI Panels), o painel do After vem em $.global.__LG_HOST
})((typeof $ !== "undefined" && $.global && $.global.__LG_HOST) ? $.global.__LG_HOST : this);
