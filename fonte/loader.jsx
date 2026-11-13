/*
  Carregador do Legenda Reels (fica em "Scripts/ScriptUI Panels").
  1. Confere no GitHub se existe versao mais nova e, se existir, baixa.
  2. Abre o script que mora em  %APPDATA%\LegendaReels\LegendaReels.jsx
  O endereco do GitHub vem da linha LG.UPDATE_URL do proprio script.
*/
(function (thisObj) {
    var dir = Folder.userData.fsName + "/LegendaReels";
    var f = new File(dir + "/LegendaReels.jsx");

    function read(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) { return ""; }
        var s = file.read(); file.close();
        return s;
    }
    function version(s) { var m = /LG\.VERSION = "([0-9.]+)"/.exec(s); return m ? m[1] : null; }
    function newer(a, b) {
        var x = String(a).split("."), y = String(b).split("."), i;
        for (i = 0; i < Math.max(x.length, y.length); i++) {
            var p = parseInt(x[i] || "0", 10), q = parseInt(y[i] || "0", 10);
            if (p !== q) { return p > q; }
        }
        return false;
    }
    function netAllowed() {
        try { return app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY") === 1; } catch (e) { return false; }
    }
    function fetch(url, dest) {
        if (dest.exists) { dest.remove(); }
        var curl = $.os.indexOf("Windows") >= 0 ? "curl.exe" : "curl";
        system.callSystem(curl + ' -s -L -f --connect-timeout 3 --max-time 10 -o "' + dest.fsName + '" "' + url + '"');
        return dest.exists && dest.length > 0;
    }

    function update() {
        if (!f.exists || !netAllowed()) { return; }
        var cur = read(f), m = /LG\.UPDATE_URL = "(https:\/\/[A-Za-z0-9.\/_\-]+\/)"/.exec(cur);
        if (!m) { return; }
        var stamp = "?t=" + new Date().getTime();
        var vf = new File(dir + "/_version.txt"), nf = new File(dir + "/_novo.jsx");
        if (!fetch(m[1] + "version.txt" + stamp, vf)) { return; }
        var remote = read(vf).replace(/\s+/g, ""); vf.remove();
        if (!/^\d+(\.\d+)*$/.test(remote) || !newer(remote, version(cur) || "0")) { return; }
        if (!fetch(m[1] + "LegendaReels.jsx" + stamp, nf)) { return; }
        var txt = read(nf);
        // so aceita se for mesmo o script, inteiro e na versao anunciada
        if (version(txt) === remote && txt.length > 20000 && txt.indexOf("LG.UPDATE_URL") > 0 && txt.indexOf("__LG_HOST") > 0) {
            f.copy(dir + "/LegendaReels.anterior.jsx");
            nf.copy(f.fsName);
        }
        nf.remove();
    }

    try { update(); } catch (e0) {}

    if (!f.exists) {
        alert("Legenda Reels: nao achei o script em\n" + f.fsName + "\n\nRode o Instalar-LegendaReels.bat de novo.");
        return;
    }
    $.global.__LG_HOST = thisObj;
    try { $.evalFile(f); }
    catch (e) { alert("Legenda Reels: erro ao abrir o script.\n" + e.toString() + (e.line ? "\nLinha " + e.line : "")); }
    $.global.__LG_HOST = null;
})(this);
