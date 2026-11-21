/*
 * Modus „Tägliche Notenreise“: drei kurze Etappen mit je 5 Aufgaben aus
 * verschiedenen Spielen. Welche Spiele drankommen, hängt vom Kalendertag ab
 * und bleibt den ganzen Tag gleich. Infrage kommen alle Modi mit
 * `reise: true` (siehe js/modi.js).
 *
 * Die Etappen laufen im jeweiligen Modus selbst: Die Reise ruft dessen
 * starte() mit einer eigenen Umgebung auf (aufgaben = 5, beende() führt
 * zurück zur Reise). So gibt es keine Kopien der Modi.
 *
 * Eine Etappe ist geschafft, wenn sie ohne dritten Fehler endet. Wer alle
 * drei schafft, hat die Reise geschafft: Sterne = Durchschnitt der Etappen,
 * dazu der Extrastern höchstens einmal pro Kalendertag (vergibt die App,
 * siehe SpielLogik.verbucheErgebnis). Verpatzt das Kind eine Etappe, endet
 * die Reise ohne Sterne.
 * Nutzt die Ansicht #ansicht-reise aus index.html.
 */
(function () {
  "use strict";

  var L = window.SpielLogik;
  var H = window.Modi.hilfen;
  var ETAPPEN = 3;
  var AUFGABEN = 5;

  var umgebung = null;
  var etappen = [];      // Modi der heutigen Reise
  var ergebnisse = [];   // Ergebnisse der gespielten Etappen
  var teil = null;       // laufender Modus einer Etappe
  var teilNr = 0;
  var laufendeTeilNr = -1;

  function $(id) { return document.getElementById(id); }

  function aktiv() {
    return umgebung && umgebung.laeuft();
  }

  /* ---------- Tagesmischung ---------- */

  function streuwert(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  /** Zufallsfolge, die für denselben Tag immer gleich ist. */
  function tagesZufall(tag) {
    var x = streuwert(tag) || 1;
    return function () {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }

  function planeEtappen(tag) {
    var pool = window.Modi.liste().filter(function (m) { return m.reise && m.id !== "notenreise"; });
    return H.mische(pool, tagesZufall(tag)).slice(0, ETAPPEN);
  }

  /* ---------- Ablauf ---------- */

  function starte(u) {
    stoppe();
    umgebung = u;
    etappen = planeEtappen(L.lokalesDatum(Date.now()));
    ergebnisse = [];
    u.zeigeTier($("reise-tier"), "normal");
    zeigeUebersicht();
    u.zeigeAnsicht();
  }

  function stoppe() {
    laufendeTeilNr = -1;
    if (teil && teil.stoppe) teil.stoppe();
    teil = null;
  }

  function statusText() {
    var t = umgebung.tagesreise || { heute: false, serie: 0 };
    if (t.heute) {
      return "Heute schon geschafft ✓" + (t.serie > 1 ? " · " + t.serie + " Tage in Folge" : "") +
        ". Den Extrastern gibt es nur einmal am Tag, Punkte und Sterne zählen trotzdem.";
    }
    return (t.serie > 0 ? "Deine Serie: " + (t.serie === 1 ? "1 Tag" : t.serie + " Tage in Folge") + ". " : "") +
      "Schaffst du alle drei Etappen, bekommst du heute einen Extrastern.";
  }

  function zeigeUebersicht() {
    var n = ergebnisse.length;
    $("reise-status").textContent = statusText();
    var liste = $("reise-etappen");
    liste.innerHTML = "";
    etappen.forEach(function (modus, i) {
      var li = document.createElement("li");
      var e = ergebnisse[i];
      li.className = "reise-etappe" + (e ? " ist-geschafft" : i === n ? " ist-dran" : "");
      li.innerHTML = '<span class="reise-symbol" aria-hidden="true"></span>' +
        '<span class="reise-name"></span><span class="reise-stand"></span>';
      li.querySelector(".reise-symbol").textContent = modus.symbol || "🎵";
      li.querySelector(".reise-name").textContent = (i + 1) + ". " + modus.name;
      li.querySelector(".reise-stand").textContent = e
        ? "✓ " + e.richtige + " von " + e.aufgaben
        : i === n ? "Jetzt dran" : "Noch offen";
      liste.appendChild(li);
    });
    var los = $("reise-los");
    los.textContent = n === 0 ? "Los geht’s!" : "Weiter zur " + (n + 1) + ". Etappe";
    $("reise-text").textContent = n === 0
      ? "Heute reisen wir durch " + ETAPPEN + " kleine Spiele mit je " + AUFGABEN + " Aufgaben."
      : "Etappe " + n + " geschafft! Als Nächstes: " + etappen[n].name + ".";
    umgebung.zeigeTier($("reise-tier"), n === 0 ? "normal" : "froh");
  }

  function starteEtappe() {
    if (!aktiv() || teil || ergebnisse.length >= etappen.length) return;
    var modus = etappen[ergebnisse.length];
    var nr = ++teilNr;
    laufendeTeilNr = nr;
    teil = modus;
    // Eigene Umgebung für die Etappe: alles wie bei der Reise, aber 5 Aufgaben
    // und ein beende(), das zur Reise zurückführt.
    var u = {};
    Object.keys(umgebung).forEach(function (k) { u[k] = umgebung[k]; });
    u.aufgaben = AUFGABEN;
    u.zeigeAnsicht = function (name) { umgebung.zeigeAnsicht(name || modus.ansicht || modus.id); };
    u.laeuft = function () { return laufendeTeilNr === nr && umgebung.laeuft(); };
    u.beende = function (e) {
      if (laufendeTeilNr !== nr || !umgebung.laeuft()) return false;
      laufendeTeilNr = -1;
      teil = null;
      etappeFertig(modus, e || {});
      return true;
    };
    modus.starte(u);
  }

  function etappeFertig(modus, e) {
    ergebnisse.push({
      modus: modus,
      geschafft: !!e.geschafft,
      richtige: e.richtige || 0,
      aufgaben: e.aufgaben || AUFGABEN,
      gesamt: e.gesamt || 0,
      sterne: e.neueSterne || 0,
      schwierig: e.schwierig
    });
    if (!e.geschafft) beendeReise(false);
    else if (ergebnisse.length >= etappen.length) beendeReise(true);
    else {
      zeigeUebersicht();
      umgebung.zeigeAnsicht();
      $("reise-los").focus({ preventScroll: true });
    }
  }

  function beendeReise(geschafft) {
    var gesamt = 0, sterne = 0;
    var gefragt = [], neu = [];
    function merke(liste, ids) {
      (ids || []).forEach(function (id) { if (liste.indexOf(id) === -1) liste.push(id); });
    }
    var zeilen = etappen.map(function (modus, i) {
      var e = ergebnisse[i];
      if (!e) return [modus.name, "Nicht gespielt"];
      gesamt += e.gesamt;
      sterne += e.sterne;
      if (e.schwierig) { merke(gefragt, e.schwierig.gefragt); merke(neu, e.schwierig.neu); }
      return [modus.name, (e.geschafft ? "✓ " : "✗ ") + e.richtige + " von " + e.aufgaben + " richtig"];
    });
    umgebung.beende({
      gesamt: gesamt,
      neueSterne: geschafft ? Math.round(sterne / etappen.length) : 0,
      titel: geschafft ? "Reise geschafft!" : "Reise unterbrochen",
      spruch: geschafft ? "Was für eine Notenreise! Bis morgen?" : "Diese Etappe war knifflig. Versuchen wir’s noch mal?",
      stimmung: geschafft ? "froh" : "normal",
      zeilen: zeilen,
      schwierig: { gefragt: gefragt, neu: neu },
      tagesreise: geschafft
    });
  }

  $("reise-los").addEventListener("click", starteEtappe);

  window.Modi.registriere({
    id: "notenreise",
    name: "Tägliche Notenreise",
    symbol: "🧭",
    ansicht: "reise",
    starte: starte,
    stoppe: stoppe,
    kachelInfo: function (status) {
      var t = status.tagesreise;
      if (t.heute) return "Heute geschafft ✓" + (t.serie > 1 ? " · " + t.serie + " Tage in Folge" : "");
      if (t.serie > 1) return t.serie + " Tage in Folge · heute noch offen";
      if (t.serie === 1) return "Gestern geschafft · heute noch offen";
      return "Heute noch offen";
    }
  });
})();
