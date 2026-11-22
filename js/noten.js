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
 *
 * Vorzeichen: 0 = Stammton, 1 = Kreuz (♯), -1 = B (♭). Die Stufe bleibt die
 * des Stammtons (fis¹ steht wie f¹), die Tonhöhe steht in `halbton`
 * (MIDI-Nummer, c¹ = 60). Namen deutsch: cis, dis, fis, gis, ais und des,
 * es, ges, as, b (h mit B-Vorzeichen); große Oktave mit großem Anfangs-
 * buchstaben (Fis, Es, B). Kennungen ASCII: `violin-fis1`, `bass-B`.
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

  var HALBTOENE = [0, 2, 4, 5, 7, 9, 11];

  // Angebotene Vorzeichen-Noten je Vorzeichen (Stammbuchstaben).
  var VORZEICHEN_ANGEBOT = { "1": ["c", "d", "f", "g", "a"], "-1": ["d", "e", "g", "a", "h"] };

  var HOCH = ["\u2070", "\u00b9", "\u00b2", "\u00b3", "\u2074", "\u2075", "\u2076", "\u2077", "\u2078", "\u2079"];

  /** Name ohne Oktave, klein: c, cis, des, es, as, b … */
  function grundname(buchstabe, vorzeichen) {
    if (vorzeichen > 0) return buchstabe + "is";
    if (vorzeichen < 0) {
      if (buchstabe === "h") return "b";
      return buchstabe + (buchstabe === "e" || buchstabe === "a" ? "s" : "es");
    }
    return buchstabe;
  }

  function gross(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  /** ASCII-Kennung für Notenkennungen und Spielstand: C, c, c1, c2, Fis, es2, B … */
  function kennung(stufe, vorzeichen) {
    var oktave = Math.floor(stufe / 7);
    var g = grundname(BUCHSTABEN[((stufe % 7) + 7) % 7], vorzeichen || 0);
    if (oktave <= 2) return gross(g);
    if (oktave === 3) return g;
    return g + (oktave - 3);
  }

  /** Deutscher Name zum Anzeigen, Oktavziffer hochgestellt: C, c, c¹, fis¹, es², B … */
  function name(stufe, vorzeichen) {
    return kennung(stufe, vorzeichen).replace(/\d/g, function (z) { return HOCH[Number(z)]; });
  }

  /**
   * Zerlegt einen Namen ("fis1", "fis¹", "B", "c") in { stufe, vorzeichen },
   * oder null bei unbekanntem Namen.
   */
  function zerlege(notenname) {
    var text = String(notenname || "").replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, function (z) {
      return String(HOCH.indexOf(z));
    });
    var m = /^([a-hA-H])(is|es|s)?(\d?)$/.exec(text);
    if (!m) return null;
    var klein = m[1].toLowerCase();
    var vorzeichen = 0;
    if (klein === "b") {
      if (m[2]) return null;
      klein = "h";
      vorzeichen = -1;
    } else if (m[2] === "is") {
      vorzeichen = 1;
    } else if (m[2] === "es") {
      if (klein === "e" || klein === "a" || klein === "h") return null;
      vorzeichen = -1;
    } else if (m[2] === "s") {
      if (klein !== "e" && klein !== "a") return null;
      vorzeichen = -1;
    }
    var b = BUCHSTABEN.indexOf(klein);
    var oktave;
    if (m[1] === m[1].toUpperCase()) {
      if (m[3]) return null;
      oktave = 2;
    } else {
      if (m[3] === "0") return null;
      oktave = m[3] ? 3 + Number(m[3]) : 3;
    }
    return { stufe: oktave * 7 + b, vorzeichen: vorzeichen };
  }

  /** Stufe zu einem Stammton-Namen ("c1" oder "c¹"), oder null bei unbekanntem Namen. */
  function stufe(notenname) {
    var z = zerlege(notenname);
    return z && z.vorzeichen === 0 ? z.stufe : null;
  }

  /** Tonhöhe als MIDI-Nummer (c¹ = 60). fis und ges klingen gleich. */
  function halbton(stufe, vorzeichen) {
    return (Math.floor(stufe / 7) + 1) * 12 + HALBTOENE[stufe % 7] + (vorzeichen || 0);
  }

  /**
   * Ton ohne Schlüssel: { name, grundname, buchstabe, vorzeichen, oktave, stufe, halbton }.
   * Reicht für Noten.antwortSchluessel, zum Beispiel für Klaviertasten.
   */
  function ton(stufe, vorzeichen) {
    vorzeichen = vorzeichen || 0;
    var b = BUCHSTABEN[stufe % 7];
    return {
      name: name(stufe, vorzeichen),
      grundname: grundname(b, vorzeichen),
      buchstabe: b,
      vorzeichen: vorzeichen,
      oktave: Math.floor(stufe / 7),
      stufe: stufe,
      halbton: halbton(stufe, vorzeichen)
    };
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

  function hinweis(schluessel, s, vorzeichen) {
    var p = position(schluessel, s);
    var text = "Die Note liegt " + lageText(p) +
      (vorzeichen > 0 ? " und hat ein Kreuz" : (vorzeichen < 0 ? " und hat ein B" : "")) + ".";
    if (s === 28 && !vorzeichen) text += " Das ist das mittlere C.";
    if (schluessel === "violin" && p === 2) text += " Um diese Linie kringelt sich der Violinschlüssel.";
    if (schluessel === "bass" && p === 6) text += " Diese Linie liegt zwischen den beiden Punkten des Bassschlüssels.";
    return text;
  }

  /** Merktier des Stammtons (mit `merktierAb`). */
  function stammTier(konfiguration, s) {
    var b = BUCHSTABEN[s % 7];
    var regel = (konfiguration.merktierAb || {})[b];
    if (regel && stufe(regel.ab) !== null && s >= stufe(regel.ab)) return regel.tier;
    return (konfiguration.merktiere || {})[b] || null;
  }

  /**
   * Note mit Schlüssel, Lage, Hinweis und Merktier. Vorzeichen-Noten bekommen ihr
   * eigenes Merktier (fis = Fisch), sonst das des Stammtons (`tierVomStamm`).
   */
  function erzeugeNote(konfiguration, schluessel, s, vorzeichen) {
    var n = ton(s, vorzeichen);
    var eigenes = n.vorzeichen ? (konfiguration.merktiere || {})[n.grundname] : null;
    n.id = schluessel + "-" + kennung(s, n.vorzeichen);
    n.schluessel = schluessel;
    n.position = position(schluessel, s);
    n.hinweis = hinweis(schluessel, s, n.vorzeichen);
    n.tier = eigenes || stammTier(konfiguration, s);
    n.tierVomStamm = !!n.vorzeichen && !eigenes && !!n.tier;
    return n;
  }

  /** Tief nach hoch, bei gleicher Tonhöhe Kreuz vor B (cis vor des). */
  function chromatisch(x, y) {
    return (x.halbton - y.halbton) || (y.vorzeichen - x.vorzeichen);
  }

  /**
   * Noten eines Bereichs, tief nach hoch. Mit `mitVorzeichen` kommen die
   * angebotenen Vorzeichen-Noten dazu, deren Tonhöhe im Bereich liegt.
   */
  function notenImBereich(konfiguration, schluessel, von, bis, mitVorzeichen) {
    var a = stufe(von), b = stufe(bis);
    if (!SCHLUESSEL[schluessel] || a === null || b === null) return [];
    var tief = Math.min(a, b), hoch = Math.max(a, b);
    var liste = [];
    for (var s = tief; s <= hoch; s++) {
      liste.push(erzeugeNote(konfiguration, schluessel, s, 0));
      if (!mitVorzeichen) continue;
      [1, -1].forEach(function (vz) {
        var h = halbton(s, vz);
        if (VORZEICHEN_ANGEBOT[vz].indexOf(BUCHSTABEN[s % 7]) !== -1 && h >= halbton(tief, 0) && h <= halbton(hoch, 0)) {
          liste.push(erzeugeNote(konfiguration, schluessel, s, vz));
        }
      });
    }
    return liste.sort(chromatisch);
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

  /**
   * Alle Noten, die ein Schlüssel in den Einstellungen anbietet: vom tiefsten
   * bis zum höchsten Bereich, Stammtöne und Vorzeichen-Noten, tief nach hoch.
   */
  function verfuegbareNoten(konfiguration, schluessel) {
    var liste = bereichsListe(konfiguration, schluessel);
    if (!SCHLUESSEL[schluessel] || liste.length === 0) return [];
    var stufen = [];
    liste.forEach(function (b) { stufen.push(stufe(b.von), stufe(b.bis)); });
    return notenImBereich(konfiguration, schluessel, kennung(Math.min.apply(null, stufen)), kennung(Math.max.apply(null, stufen)), true);
  }

  var ANTWORTMODI = ["einfach", "genau"];
  var MINDEST_NOTEN = 3;

  /**
   * Was als Antwort auf eine Note zählt. Einfach: nur der Name ohne Oktave mit
   * großem Anfangsbuchstaben ("D", "Fis", "Es", "B"), jede Oktave ist richtig.
   * Genau: der volle Name mit Oktave ("d²", "fis¹"). Es zählt der Name, nicht
   * die Tonhöhe: fis und ges sind verschiedene Antworten.
   */
  function antwortSchluessel(note, antwortmodus) {
    return antwortmodus === "genau" ? note.name : gross(grundname(note.buchstabe, note.vorzeichen || 0));
  }

  /**
   * Reicht eine Auswahl (aus fuerEinstellungen) zum Spielen? Es braucht
   * mindestens MINDEST_NOTEN verschiedene Antworten: im einfachen Modus
   * verschiedene Buchstaben (c¹ und c² sind beide „C“, „Fis“ zählt extra),
   * im genauen verschiedene genaue Namen.
   */
  function auswahlReicht(auswahl) {
    return auswahl.antworten.length >= MINDEST_NOTEN;
  }

  /** Kennungen der Noten eines Bereichs, zum Beispiel ["violin-c1", …]. */
  function bereichsKennungen(konfiguration, schluessel, bereichId) {
    var b = bereichVon(konfiguration, schluessel, bereichId);
    return b ? notenImBereich(konfiguration, schluessel, b.von, b.bis).map(function (n) { return n.id; }) : [];
  }

  /**
   * Bringt Einstellungen in die aktuelle Form und übersetzt alte Einstellungen:
   *   { schluessel: ["violin", "bass"], noten: ["violin-c1", "bass-G", …], merktiere: true,
   *     antwortmodus: "einfach" | "genau" }
   * `noten` enthält die gewählten Noten beider Schlüssel. Abgefragt werden nur
   * die Noten der angekreuzten Schlüssel; die Auswahl des anderen bleibt erhalten.
   * Alte Form { schluessel: "violin" | "bass" | "beide", bereich: { violin, bass } }
   * wird in Notenlisten übersetzt. Fehlt etwas, gilt `standardEinstellungen`.
   * Fehlt der Antwortmodus in gespeicherten Einstellungen, gilt „einfach“.
   */
  function einstellungen(konfiguration, roh) {
    var standard = konfiguration.standardEinstellungen || {};
    var ersterStart = !roh || typeof roh !== "object";
    if (ersterStart) roh = standard;
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
    // Gespeicherte Einstellungen ohne Antwortmodus (ältere Spielstände) bekommen „einfach“.
    var antwortmodus = ANTWORTMODI.indexOf(roh.antwortmodus) !== -1 ? roh.antwortmodus
      : (ersterStart && standard.antwortmodus === "genau" ? "genau" : "einfach");
    return { schluessel: sl, noten: noten, merktiere: merktiere, antwortmodus: antwortmodus };
  }

  /**
   * Alles, was ein Spielmodus für die aktuellen Einstellungen braucht:
   * - noten:        alle abgefragten Noten der angekreuzten Schlüssel, je Schlüssel tief nach hoch.
   *                  Jede Note hat `antwort` (siehe antwortSchluessel), damit vergleicht
   *                  SpielLogik.antworte die getippte Antwort.
   * - antworten:    die Antwortknöpfe. Genau: eindeutige Namen tief nach hoch.
   *                  Einfach: die vorkommenden Antworten ohne Oktave in chromatischer
   *                  Reihenfolge (C Cis D Es E F Fis G A B H), alle in einer Reihe.
   * - namen:        eindeutige genaue Namen, tief nach hoch, in beiden Modi
   * - antwortmodus: "einfach" oder "genau"
   * - bereich:      [tiefste, höchste Position] für einen festen Ausschnitt
   */
  function fuerEinstellungen(konfiguration, roh) {
    var e = einstellungen(konfiguration, roh);
    var noten = [];
    e.schluessel.forEach(function (sl) {
      noten = noten.concat(verfuegbareNoten(konfiguration, sl).filter(function (n) { return e.noten.indexOf(n.id) !== -1; }));
    });
    var gesehen = {};
    var namen = noten.slice().sort(chromatisch)
      .filter(function (n) { if (gesehen[n.name]) return false; gesehen[n.name] = true; return true; })
      .map(function (n) { return ton(n.stufe, n.vorzeichen); });
    noten.forEach(function (n) { n.antwort = antwortSchluessel(n, e.antwortmodus); });
    var antworten = namen;
    if (e.antwortmodus === "einfach") {
      var schon = {};
      antworten = namen.filter(function (n) {
        var k = antwortSchluessel(n, "einfach");
        if (schon[k]) return false;
        schon[k] = true;
        return true;
      }).map(function (n) {
        return { name: antwortSchluessel(n, "einfach"), stufe: null, oktave: null, buchstabe: n.buchstabe, vorzeichen: n.vorzeichen,
          reihe: HALBTOENE[BUCHSTABEN.indexOf(n.buchstabe)] + n.vorzeichen };
      }).sort(function (x, y) { return (x.reihe - y.reihe) || (y.vorzeichen - x.vorzeichen); });
    }
    var positionen = noten.map(function (n) { return n.position; });
    return {
      noten: noten,
      antworten: antworten,
      namen: namen,
      antwortmodus: e.antwortmodus,
      bereich: noten.length ? [Math.min.apply(null, positionen), Math.max.apply(null, positionen)] : [0, 8]
    };
  }

  var api = {
    BUCHSTABEN: BUCHSTABEN,
    SCHLUESSEL: SCHLUESSEL,
    MINDEST_NOTEN: MINDEST_NOTEN,
    kennung: kennung,
    name: name,
    stufe: stufe,
    zerlege: zerlege,
    halbton: halbton,
    ton: ton,
    note: erzeugeNote,
    position: position,
    hinweis: hinweis,
    notenImBereich: notenImBereich,
    bereichsListe: bereichsListe,
    bereichVon: bereichVon,
    verfuegbareNoten: verfuegbareNoten,
    bereichsKennungen: bereichsKennungen,
    ANTWORTMODI: ANTWORTMODI,
    antwortSchluessel: antwortSchluessel,
    auswahlReicht: auswahlReicht,
    einstellungen: einstellungen,
    fuerEinstellungen: fuerEinstellungen
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Noten = api;
})(typeof self !== "undefined" ? self : this);
