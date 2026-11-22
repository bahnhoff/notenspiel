/*
 * Notenmodell: erzeugt Noten mit deutschem Namen (Helmholtz), Lage im
 * Notensystem, Hinweis und Merktier aus Schlüssel und Bereich.
 * Läuft im Browser (window.Noten) und in Node (für die Tests).
 *
 * Stufe = Oktave × 7 + Buchstabe (C = 0 … H = 6), Oktave wie in der
 * wissenschaftlichen Schreibweise (c¹ = C4 = Stufe 28).
 * Angezeigt wird `name` mit hochgestellter Oktavziffer (c¹), Kennungen und
 * Spielstand nutzen die ASCII-Form (`violin-c1`, siehe `kennung`).
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

  var HOCH = ["\u2070", "\u00b9", "\u00b2", "\u00b3", "\u2074", "\u2075", "\u2076", "\u2077", "\u2078", "\u2079"];

  /** ASCII-Kennung einer Stufe für Notenkennungen und Spielstand: C, c, c1, c2 … */
  function kennung(stufe) {
    var oktave = Math.floor(stufe / 7);
    var b = BUCHSTABEN[((stufe % 7) + 7) % 7];
    if (oktave <= 2) return b.toUpperCase();
    if (oktave === 3) return b;
    return b + (oktave - 3);
  }

  /** Deutscher Name zum Anzeigen, Oktavziffer hochgestellt: C, c, c¹, c², c³ … */
  function name(stufe) {
    return kennung(stufe).replace(/\d/g, function (z) { return HOCH[Number(z)]; });
  }

  /** Stufe zu einem Namen ("c1" oder "c¹"), oder null bei unbekanntem Namen. */
  function stufe(notenname) {
    var text = String(notenname || "").replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, function (z) {
      return String(HOCH.indexOf(z));
    });
    var m = /^([a-hA-H])(\d?)$/.exec(text);
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
      id: schluessel + "-" + kennung(s),
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

  /** Alle Noten, die ein Schlüssel in den Einstellungen anbietet: vom tiefsten bis zum höchsten Bereich. */
  function verfuegbareNoten(konfiguration, schluessel) {
    var liste = bereichsListe(konfiguration, schluessel);
    if (!SCHLUESSEL[schluessel] || liste.length === 0) return [];
    var stufen = [];
    liste.forEach(function (b) { stufen.push(stufe(b.von), stufe(b.bis)); });
    return notenImBereich(konfiguration, schluessel, kennung(Math.min.apply(null, stufen)), kennung(Math.max.apply(null, stufen)));
  }

  /** Kennungen der Noten eines Bereichs, zum Beispiel ["violin-c1", …]. */
  function bereichsKennungen(konfiguration, schluessel, bereichId) {
    var b = bereichVon(konfiguration, schluessel, bereichId);
    return b ? notenImBereich(konfiguration, schluessel, b.von, b.bis).map(function (n) { return n.id; }) : [];
  }

  /**
   * Bringt Einstellungen in die aktuelle Form und übersetzt alte Einstellungen:
   *   { schluessel: ["violin", "bass"], noten: ["violin-c1", "bass-G", …], merktiere: true }
   * `noten` enthält die gewählten Noten beider Schlüssel. Abgefragt werden nur
   * die Noten der angekreuzten Schlüssel; die Auswahl des anderen bleibt erhalten.
   * Alte Form { schluessel: "violin" | "bass" | "beide", bereich: { violin, bass } }
   * wird in Notenlisten übersetzt. Fehlt etwas, gilt `standardEinstellungen`.
   */
  function einstellungen(konfiguration, roh) {
    var standard = konfiguration.standardEinstellungen || {};
    if (!roh || typeof roh !== "object") roh = standard;
    function schluesselAus(wert) {
      if (wert === "beide") return ["violin", "bass"];
      if (typeof wert === "string") wert = [wert];
      if (!Array.isArray(wert)) return [];
      return ["violin", "bass"].filter(function (s) { return wert.indexOf(s) !== -1; });
    }
    var sl = schluesselAus(roh.schluessel);
    if (sl.length === 0) sl = schluesselAus(standard.schluessel);
    if (sl.length === 0) sl = ["violin"];

    var noten;
    if (Array.isArray(roh.noten)) {
      var erlaubt = {};
      ["violin", "bass"].forEach(function (s) {
        verfuegbareNoten(konfiguration, s).forEach(function (n) { erlaubt[n.id] = true; });
      });
      noten = roh.noten.filter(function (id, i) { return erlaubt[id] === true && roh.noten.indexOf(id) === i; });
    } else {
      var bereich = roh.bereich && typeof roh.bereich === "object" ? roh.bereich : (standard.bereich || {});
      noten = [];
      ["violin", "bass"].forEach(function (s) { noten = noten.concat(bereichsKennungen(konfiguration, s, bereich[s])); });
    }
    var merktiere = typeof roh.merktiere === "boolean" ? roh.merktiere : standard.merktiere !== false;
    return { schluessel: sl, noten: noten, merktiere: merktiere };
  }

  /**
   * Alles, was ein Spielmodus für die aktuellen Einstellungen braucht:
   * - noten:     alle abgefragten Noten der angekreuzten Schlüssel, je Schlüssel tief nach hoch
   * - antworten: eindeutige Namen, tief nach hoch
   * - bereich:   [tiefste, höchste Position] für einen festen Ausschnitt
   */
  function fuerEinstellungen(konfiguration, roh) {
    var e = einstellungen(konfiguration, roh);
    var noten = [];
    e.schluessel.forEach(function (sl) {
      noten = noten.concat(verfuegbareNoten(konfiguration, sl).filter(function (n) { return e.noten.indexOf(n.id) !== -1; }));
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
    MINDEST_NOTEN: 3,
    kennung: kennung,
    name: name,
    stufe: stufe,
    position: position,
    hinweis: hinweis,
    notenImBereich: notenImBereich,
    bereichsListe: bereichsListe,
    bereichVon: bereichVon,
    verfuegbareNoten: verfuegbareNoten,
    bereichsKennungen: bereichsKennungen,
    einstellungen: einstellungen,
    fuerEinstellungen: fuerEinstellungen
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Noten = api;
})(typeof self !== "undefined" ? self : this);
