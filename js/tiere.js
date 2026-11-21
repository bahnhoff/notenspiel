/*
 * Eigene Tierzeichnungen im einheitlichen Stil: runder Kopf, kleiner Körper,
 * dunkle Umrisse, große Augen. Stimmung: "normal", "froh" oder "oje".
 *
 * Begleittiere (Sammlung): fuchs, hase, katze
 * Notentiere (Merkhilfe):  zebra, delfin, elefant, frosch, fuchs, giraffe, affe, hase
 */
(function (root) {
  "use strict";

  var DUNKEL = "#2a1d14";
  var UMRISS = 'stroke="#3d2b1f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  var AUGEN = [[47, 52], [73, 52]];

  var NAMEN = {
    fuchs: "Fuchs", hase: "Hase", katze: "Katze", zebra: "Zebra", delfin: "Delfin",
    elefant: "Elefant", frosch: "Frosch", giraffe: "Giraffe", affe: "Affe"
  };

  function form(d, farbe) { return '<path d="' + d + '" fill="' + farbe + '" ' + UMRISS + "/>"; }
  function flaeche(d, farbe) { return '<path d="' + d + '" fill="' + farbe + '"/>'; }
  function strich(d, farbe, breite) {
    return '<path d="' + d + '" fill="none" stroke="' + farbe + '" stroke-width="' + breite + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function kreis(x, y, r, farbe, mitUmriss) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + farbe + '"' + (mitUmriss ? " " + UMRISS : "") + "/>";
  }
  function oval(x, y, rx, ry, farbe, mitUmriss, drehung) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '"' +
      (drehung ? ' transform="rotate(' + drehung + " " + x + " " + y + ')"' : "") +
      ' fill="' + farbe + '"' + (mitUmriss ? " " + UMRISS : "") + "/>";
  }
  function schnauze(f) { return oval(60, 70, 18, 12, f.hell); }
  function nasenloecher() { return oval(55, 66, 2, 2.6, DUNKEL) + oval(65, 66, 2, 2.6, DUNKEL); }
  function schnurrhaare() {
    return strich("M20 64 L36 66 M20 72 L36 70 M100 64 L84 66 M100 72 L84 70", "#3d2b1f", 1.6);
  }

  /*
   * Jede Art beschreibt nur, was sie von den anderen unterscheidet:
   * hinten (hinter dem Körper), koerper (auf dem Körper), vorKopf (hinter dem Kopf),
   * kopf (auf dem Kopf), nase, vorne (ganz vorn), augen, mund.
   */
  var ARTEN = {
    fuchs: {
      farben: { fell: "#f08a3c", hell: "#fff4e3", innen: "#7a3b17" },
      hinten: function (f) {
        return form("M80 100 C104 98 112 78 104 64 C100 80 92 88 78 90 Z", f.fell) +
          flaeche("M104 64 C107 70 107 76 105 80 C101 76 101 70 104 64 Z", f.hell);
      },
      vorKopf: function (f) {
        return form("M30 44 L32 8 L56 30 Z", f.fell) + form("M90 44 L88 8 L64 30 Z", f.fell) +
          flaeche("M35 34 L36 18 L48 30 Z", f.innen) + flaeche("M85 34 L84 18 L72 30 Z", f.innen);
      },
      kopf: function (f) {
        return flaeche("M28 56 C40 50 50 58 60 64 C70 58 80 50 92 56 C90 76 76 84 60 84 C44 84 30 76 28 56 Z", f.hell);
      },
      nase: function () { return oval(60, 64, 4.5, 3.2, DUNKEL); }
    },

    hase: {
      farben: { fell: "#d9d4ce", hell: "#ffffff", innen: "#f4a9b8" },
      hinten: function (f) { return kreis(86, 100, 8, f.hell, true); },
      vorKopf: function (f) {
        return oval(44, 20, 9, 24, f.fell, true, -10) + oval(76, 20, 9, 24, f.fell, true, 10) +
          oval(44, 22, 4, 16, f.innen, false, -10) + oval(76, 22, 4, 16, f.innen, false, 10);
      },
      kopf: schnauze,
      nase: function () { return oval(60, 64, 4.5, 3.2, "#e7788b"); },
      vorne: schnurrhaare
    },

    katze: {
      farben: { fell: "#9aa5b4", hell: "#f3f1ee", innen: "#f4a9b8" },
      hinten: function (f) {
        return strich("M82 102 C104 102 108 86 100 74", "#3d2b1f", 9) + strich("M82 102 C104 102 108 86 100 74", f.fell, 4.5);
      },
      vorKopf: function (f) {
        return form("M30 42 L30 14 L54 30 Z", f.fell) + form("M90 42 L90 14 L66 30 Z", f.fell) +
          flaeche("M34 34 L34 22 L46 30 Z", f.innen) + flaeche("M86 34 L86 22 L74 30 Z", f.innen);
      },
      kopf: function (f) {
        return schnauze(f) + strich("M54 30 L56 40 M60 28 L60 40 M66 30 L64 40", "#6f7a89", 2.5);
      },
      nase: function () { return oval(60, 64, 4.5, 3.2, "#e7788b"); },
      vorne: schnurrhaare
    },

    zebra: {
      farben: { fell: "#fbfaf7", hell: "#cfc9c2", innen: "#4a4a4a" },
      hinten: function () {
        return strich("M84 100 C96 100 100 92 102 84", "#3d2b1f", 3) + oval(103, 81, 4, 6, DUNKEL, false, 20);
      },
      koerper: function () {
        return strich("M38 88 L47 92 M82 88 L73 92 M35 99 L43 101 M85 99 L77 101", DUNKEL, 3.5);
      },
      vorKopf: function (f) {
        return form("M47 34 L46 14 L52 22 L56 10 L60 22 L64 10 L68 22 L74 14 L73 34 Z", DUNKEL) +
          oval(36, 30, 7, 14, f.fell, true, -30) + oval(84, 30, 7, 14, f.fell, true, 30) +
          oval(36, 31, 3, 8, f.innen, false, -30) + oval(84, 31, 3, 8, f.innen, false, 30);
      },
      kopf: function (f) {
        return strich("M46 32 Q49 38 45 43 M60 30 L60 41 M74 32 Q71 38 75 43 M27 52 L35 55 M93 52 L85 55 M28 62 L35 63 M92 62 L85 63", DUNKEL, 3.5) +
          schnauze(f);
      },
      nase: nasenloecher
    },

    delfin: {
      farben: { fell: "#5aa9e6", hell: "#e2f3ff", innen: "#3b82c4" },
      hinten: function (f) {
        return form("M80 104 C92 102 98 96 102 88 C102 96 106 102 114 106 C104 110 92 110 80 108 Z", f.fell);
      },
      vorKopf: function (f) {
        return form("M52 34 C56 16 68 8 80 12 C72 16 68 24 70 34 Z", f.fell);
      },
      kopf: function (f) {
        return oval(60, 72, 17, 10, f.hell) + kreis(60, 36, 2.2, f.innen);
      }
    },

    elefant: {
      farben: { fell: "#a9b3bf", hell: "#c9d0d8", innen: "#f4b6c2" },
      hinten: function () { return strich("M84 100 C94 100 98 94 100 88", "#3d2b1f", 3); },
      vorKopf: function (f) {
        return kreis(26, 54, 20, f.fell, true) + kreis(94, 54, 20, f.fell, true) +
          kreis(28, 55, 12, f.innen) + kreis(92, 55, 12, f.innen);
      },
      mundY: 76,
      vorne: function (f) {
        return form("M53 60 C53 74 52 82 46 88 C43 91 46 96 51 93 C61 87 67 76 67 60 Z", f.fell) +
          strich("M53 74 L60 75 M52 81 L58 83", "#7d8794", 1.6);
      },
      augen: [[44, 52], [76, 52]]
    },

    frosch: {
      farben: { fell: "#6cc04a", hell: "#dff5c4", innen: "#4f9a33" },
      vorKopf: function (f) { return kreis(42, 34, 13, f.fell, true) + kreis(78, 34, 13, f.fell, true); },
      kopf: function (f) { return kreis(42, 34, 8.5, "#ffffff") + kreis(78, 34, 8.5, "#ffffff") + oval(60, 76, 20, 8, f.hell); },
      nase: function () { return kreis(56, 58, 1.6, DUNKEL) + kreis(64, 58, 1.6, DUNKEL); },
      augen: [[42, 35], [78, 35]],
      mund: function (stimmung) {
        if (stimmung === "froh") return form("M40 66 Q60 86 80 66 Q60 74 40 66 Z", "#c2414f");
        if (stimmung === "oje") return oval(60, 70, 4, 4, DUNKEL);
        return strich("M40 66 Q60 80 80 66", DUNKEL, 2.5);
      }
    },

    giraffe: {
      farben: { fell: "#f5c242", hell: "#fbe7ad", innen: "#c47a2c" },
      hinten: function (f) {
        return strich("M84 100 C94 100 98 94 100 88", "#3d2b1f", 3) + oval(101, 85, 3.5, 5.5, f.innen, false, 20);
      },
      koerper: function (f) { return kreis(41, 92, 4.5, f.innen) + kreis(79, 94, 5, f.innen) + kreis(72, 84, 3, f.innen); },
      vorKopf: function (f) {
        return strich("M48 32 L45 12 M72 32 L75 12", "#3d2b1f", 5) + kreis(45, 11, 5, f.innen, true) + kreis(75, 11, 5, f.innen, true) +
          oval(26, 40, 11, 5.5, f.fell, true, -25) + oval(94, 40, 11, 5.5, f.fell, true, 25);
      },
      kopf: function (f) { return kreis(38, 40, 4, f.innen) + kreis(83, 42, 3.5, f.innen) + kreis(60, 34, 3, f.innen) + schnauze(f); },
      nase: nasenloecher
    },

    affe: {
      farben: { fell: "#9b6a43", hell: "#f2d2ae", innen: "#f2d2ae" },
      hinten: function (f) {
        return strich("M82 104 C104 104 108 82 96 78 C88 76 88 86 94 86", "#3d2b1f", 8) +
          strich("M82 104 C104 104 108 82 96 78 C88 76 88 86 94 86", f.fell, 3.5);
      },
      vorKopf: function (f) { return kreis(25, 56, 11, f.fell, true) + kreis(95, 56, 11, f.fell, true) + kreis(25, 56, 6, f.innen) + kreis(95, 56, 6, f.innen); },
      kopf: function (f) {
        return flaeche("M60 44 C52 34 34 36 34 54 C34 72 46 84 60 84 C74 84 86 72 86 54 C86 36 68 34 60 44 Z", f.hell);
      },
      nase: nasenloecher
    }
  };

  function augen(positionen, stimmung) {
    return positionen.map(function (p, i) {
      var x = p[0], y = p[1];
      if (stimmung === "froh") return strich("M" + (x - 6) + " " + (y + 2) + " Q" + x + " " + (y - 6) + " " + (x + 6) + " " + (y + 2), DUNKEL, 3);
      var auge = oval(x, y, 5, 6, DUNKEL) + kreis(x + 1.6, y - 2.2, 1.8, "#fff");
      if (stimmung === "oje") {
        var aussen = i === 0 ? x - 7 : x + 7;
        var innen = i === 0 ? x + 4 : x - 4;
        auge += strich("M" + aussen + " " + (y - 8) + " L" + innen + " " + (y - 12), DUNKEL, 2.5);
      }
      return auge;
    }).join("");
  }

  function mund(stimmung, y) {
    if (stimmung === "froh") {
      return '<path d="M53 ' + y + " Q60 " + (y + 10) + " 67 " + y + ' Z" fill="#c2414f" stroke="' + DUNKEL + '" stroke-width="2" stroke-linejoin="round"/>';
    }
    if (stimmung === "oje") return oval(60, y + 4, 3, 3.5, DUNKEL);
    return strich("M54 " + y + " Q57 " + (y + 3) + " 60 " + y + " Q63 " + (y + 3) + " 66 " + y, DUNKEL, 2);
  }

  function zeichne(art, stimmung, beschriftung) {
    var a = ARTEN[art] || ARTEN.fuchs;
    var f = a.farben;
    function teil(name) { return a[name] ? a[name](f) : ""; }
    return '<svg class="tier-svg" viewBox="0 0 120 120" role="img" aria-label="' + (beschriftung || "") + '" xmlns="http://www.w3.org/2000/svg">' +
      teil("hinten") +
      oval(60, 96, 27, 20, f.fell, true) +
      oval(60, 100, 15, 13, f.hell) +
      teil("koerper") +
      oval(47, 114, 8, 5, f.fell, true) +
      oval(73, 114, 8, 5, f.fell, true) +
      teil("vorKopf") +
      oval(60, 58, 34, 29, f.fell, true) +
      teil("kopf") +
      augen(a.augen || AUGEN, stimmung) +
      oval(38, 64, 6, 3.5, "#f27c8c").replace("/>", ' opacity="0.45"/>') +
      oval(82, 64, 6, 3.5, "#f27c8c").replace("/>", ' opacity="0.45"/>') +
      teil("nase") +
      (a.mund ? a.mund(stimmung) : mund(stimmung, a.mundY || 69)) +
      teil("vorne") +
      "</svg>";
  }

  root.Tiere = { zeichne: zeichne, NAMEN: NAMEN, hat: function (art) { return !!ARTEN[art]; } };
})(this);
