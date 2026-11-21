/*
 * Notenmodell: erzeugt Noten mit deutschem Namen (Helmholtz), Lage im
 * Notensystem, Hinweis und Merktier aus Schlüssel und Bereich.
 * Läuft im Browser (window.Noten) und in Node (für die Tests).
 *
 * Stufe = Oktave × 7 + Buchstabe (C = 0 … H = 6), Oktave wie in der
 * wissenschaftlichen Schreibweise (c1 = C4 = Stufe 28).
 * Position = Schritte von der untersten Linie (0 = unterste Linie).
 */
(function (root) {
  "use strict";

  var BUCHSTABEN = ["c", "d", "e", "f", "g", "a", "h"];

  // Stufe der untersten Linie je Schlüssel: Violin e1, Bass G.
  var SCHLUESSEL = {
    violin: { name: "Violinschlüssel", untersteLinie: 4 * 7 + 2 },
    bass: { name: "Bassschlüssel", untersteLinie: 2 * 7 + 4 }
  };

  var ORDNUNG = ["ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten"];

  /** Deutscher Name einer Stufe: C (große), c (kleine), c1, c2, c3 … */
  function name(stufe) {
    var oktave = Math.floor(stufe / 7);
    var b = BUCHSTABEN[((stufe % 7) + 7) % 7];
    if (oktave <= 2) return b.toUpperCase();
    if (oktave === 3) return b;
    return b + (oktave - 3);
  }

  /** Stufe zu einem Namen, oder null bei unbekanntem Namen. */
  function stufe(notenname) {
    var m = /^([a-hA-H])(\d?)$/.exec(String(notenname || ""));
    if (!m) return null;
    var b = BUCHSTABEN.indexOf(m[1].toLowerCase());
    if (b < 0) return null;
    var oktave;
    if (m[1] === m[1].toUpperCase()) {
      if (m[2]) return null;
      oktave = 2;
    } else {
      if (m[2] === "0") return null;
      oktave = m[2] ? 3 + Number(m[2]) : 3;
    }
    return oktave * 7 + b;
  }

  function position(schluessel, s) {
    return s - SCHLUESSEL[schluessel].untersteLinie;
  }

  /** Erzeugter Hinweis zur Lage der Note, zum Beispiel „Die Note liegt auf der zweiten Linie von unten.“ */
  function lageText(p) {
    if (p === 0) return "auf der untersten Linie";
    if (p === 8) return "auf der obersten Linie";
    if (p === 4) return "auf der mittleren Linie";
    if (p > 0 && p < 8 && p % 2 === 0) return "auf der " + ORDNUNG[p / 2] + " Linie von unten";
    if (p > 0 && p < 8) return "im " + ORDNUNG[(p - 1) / 2] + " Zwischenraum von unten";
    if (p === -1) return "knapp unter der untersten Linie";
    if (p === 9) return "knapp über der obersten Linie";
    if (p < 0) {
      if (p % 2 === 0) return "auf der " + ORDNUNG[-p / 2 - 1] + " Hilfslinie unter dem System";
      return "unter der " + ORDNUNG[(-p - 1) / 2 - 1] + " Hilfslinie unter dem System";
    }
    if (p % 2 === 0) return "auf der " + ORDNUNG[(p - 8) / 2 - 1] + " Hilfslinie über dem System";
    return "über der " + ORDNUNG[(p - 9) / 2 - 1] + " Hilfslinie über dem System";
  }

  function hinweis(schluessel, s) {
    var p = position(schluessel, s);
    var text = "Die Note liegt " + lageText(p) + ".";
    if (s === 28) text += " Das ist das mittlere C.";
    if (schluessel === "violin" && p === 2) text += " Um diese Linie kringelt sich der Violinschlüssel.";
    if (schluessel === "bass" && p === 6) text += " Diese Linie liegt zwischen den beiden Punkten des Bassschlüssels.";
    return text;
  }

  function merktier(konfiguration, s) {
    var b = BUCHSTABEN[s % 7];
    var regel = (konfiguration.merktierAb || {})[b];
    if (regel && stufe(regel.ab) !== null && s >= stufe(regel.ab)) return regel.tier;
    return (konfiguration.merktiere || {})[b] || null;
  }

  function erzeugeNote(konfiguration, schluessel, s) {
    return {
      id: schluessel + "-" + name(s),
      schluessel: schluessel,
      name: name(s),
      buchstabe: BUCHSTABEN[s % 7],
      oktave: Math.floor(s / 7),
      stufe: s,
      position: position(schluessel, s),
      hinweis: hinweis(schluessel, s),
      tier: merktier(konfiguration, s)
    };
  }

  /** Noten eines Bereichs, tief nach hoch. */
  function notenImBereich(konfiguration, schluessel, von, bis) {
    var a = stufe(von), b = stufe(bis);
    if (!SCHLUESSEL[schluessel] || a === null || b === null) return [];
    var liste = [];
    for (var s = Math.min(a, b); s <= Math.max(a, b); s++) liste.push(erzeugeNote(konfiguration, schluessel, s));
    return liste;
  }

  function bereichsListe(konfiguration, schluessel) {
    return ((konfiguration.bereiche || {})[schluessel] || []).filter(function (b) {
      return b && typeof b.id === "string" && stufe(b.von) !== null && stufe(b.bis) !== null;
    });
  }

  /** Bereichseintrag zu Kennung, sonst der erste des Schlüssels. */
  function bereichVon(konfiguration, schluessel, id) {
    var liste = bereichsListe(konfiguration, schluessel);
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return liste[0] || null;
  }

  function schluesselListe(einstellungen) {
    var s = einstellungen && einstellungen.schluessel;
    if (s === "bass") return ["bass"];
    if (s === "beide") return ["violin", "bass"];
    return ["violin"];
  }

  /**
   * Alles, was ein Spielmodus für die aktuellen Einstellungen braucht:
   * - noten:     alle abgefragten Noten (bei „beide“ aus beiden Schlüsseln)
   * - antworten: eindeutige Namen, tief nach hoch
   * - bereich:   [tiefste, höchste Position] für einen festen Ausschnitt
   */
  function fuerEinstellungen(konfiguration, einstellungen) {
    var noten = [];
    schluesselListe(einstellungen).forEach(function (sl) {
      var b = bereichVon(konfiguration, sl, ((einstellungen && einstellungen.bereich) || {})[sl]);
      if (b) noten = noten.concat(notenImBereich(konfiguration, sl, b.von, b.bis));
    });
    var gesehen = {};
    var antworten = noten.slice().sort(function (x, y) { return x.stufe - y.stufe; })
      .filter(function (n) { if (gesehen[n.name]) return false; gesehen[n.name] = true; return true; })
      .map(function (n) { return { name: n.name, stufe: n.stufe, oktave: n.oktave, buchstabe: n.buchstabe }; });
    var positionen = noten.map(function (n) { return n.position; });
    return {
      noten: noten,
      antworten: antworten,
      bereich: noten.length ? [Math.min.apply(null, positionen), Math.max.apply(null, positionen)] : [0, 8]
    };
  }

  var api = {
    BUCHSTABEN: BUCHSTABEN,
    SCHLUESSEL: SCHLUESSEL,
    name: name,
    stufe: stufe,
    position: position,
    hinweis: hinweis,
    notenImBereich: notenImBereich,
    bereichsListe: bereichsListe,
    bereichVon: bereichVon,
    fuerEinstellungen: fuerEinstellungen
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Noten = api;
})(typeof self !== "undefined" ? self : this);
