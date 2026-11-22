/*
 * Eigene Tierzeichnungen im einheitlichen Stil: runder Kopf, kleiner Körper,
 * dunkle Umrisse, große Augen. Stimmung: "normal", "froh" oder "oje".
 *
 * Alle Tiere nutzen dieselbe Körper-Vorlage (siehe `zeichne`). Jede Art
 * beschreibt nur ihre Unterschiede.
 *
 * Sammeltiere: siehe SpielLogik.TIERE (fuchs, hase, katze, hund, baer, panda …)
 * Merktiere:   chamaeleon, delfin, elefant, frosch, fuchs, giraffe, affe, hase,
 *              fisch (für fis, kein Sammeltier); englisch zusätzlich katze,
 *              baer und alligator (A is for Alligator, kein Sammeltier)
 * Die Namen der Merktiere stehen in js/texte.js ("merktier.<art>").
 */
(function (root) {
  "use strict";

  var DUNKEL = "#2a1d14";
  var UMRISS = 'stroke="#3d2b1f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  var AUGEN = [[47, 52], [73, 52]];

  var REGENBOGEN = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"];

  /** Name eines Merktiers in der aktuellen Sprache („d¹ wie Delfin“, „D4 – D is for Dolphin“). */
  function name(art) { return root.Texte.t("merktier." + art); }

  function r1(x) { return Math.round(x * 10) / 10; }

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
  /** Spiegelt einen Teil an der senkrechten Mittelachse (für linke und rechte Seite). */
  function spiegel(teil) { return '<g transform="matrix(-1 0 0 1 120 0)">' + teil + "</g>"; }
  /** Zackenkranz (Stacheln), Winkel in Grad, 0 = rechts, 270 = oben. */
  function stacheln(cx, cy, innen, aussen, von, bis, anzahl, farbe) {
    var punkte = [];
    for (var i = 0; i <= anzahl * 2; i++) {
      var w = (von + (bis - von) * i / (anzahl * 2)) * Math.PI / 180;
      var r = i % 2 ? aussen : innen;
      punkte.push(r1(cx + r * Math.cos(w)) + " " + r1(cy + r * Math.sin(w)));
    }
    return form("M" + cx + " " + cy + " L" + punkte.join(" L") + " Z", farbe);
  }
  function schnabelMund(stimmung) { return stimmung === "oje" ? oval(60, 76, 2.5, 3, DUNKEL) : ""; }
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

    fisch: {
      farben: { fell: "#ff9f43", hell: "#fff0d9", innen: "#f76707" },
      // Schwanzflosse rechts hinter dem Körper, zwei Luftblasen
      hinten: function (f) {
        return form("M80 98 C90 92 100 82 112 78 C106 90 106 100 113 112 C100 110 90 106 80 104 Z", f.innen) +
          strich("M96 88 L104 85 M97 100 L105 103", "#ffc078", 2) +
          kreis(100, 26, 5, "#e2f3ff", true) + kreis(108, 13, 3, "#e2f3ff", true);
      },
      // Seitenflossen und Schuppenbögen auf dem Bauch
      koerper: function (f) {
        return oval(34, 96, 9, 5, f.innen, true, -35) + oval(86, 96, 9, 5, f.innen, true, 35) +
          strich("M52 98 Q56 102 60 98 Q64 102 68 98 M56 106 Q60 110 64 106", "#ffc078", 1.8);
      },
      // Rückenflosse mit Wellenkante
      vorKopf: function (f) {
        return form("M40 40 C40 26 48 16 58 12 C60 18 64 20 68 16 C70 22 74 24 80 22 C82 30 82 36 80 42 Z", f.innen);
      },
      kopf: function (f) {
        return strich("M36 46 Q60 36 84 46", "#ffc078", 3) + oval(60, 74, 15, 9, f.hell);
      },
      nase: function () { return ""; },
      mundY: 72,
      fuss: "#f76707"
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
    },

    chamaeleon: {
      farben: { fell: "#5cbf52", hell: "#d4f0a6", innen: "#3d8f36" },
      hinten: function (f) {
        var p = "M82 104 C102 106 112 94 108 82 C104 72 92 74 92 82 C92 88 100 88 100 83";
        return strich(p, "#3d2b1f", 10) + strich(p, f.fell, 5);
      },
      koerper: function (f) { return kreis(42, 91, 3, f.innen) + kreis(79, 90, 3.5, f.innen) + kreis(70, 103, 2.5, f.innen); },
      vorKopf: function (f) {
        return form("M36 42 L39 24 L47 30 L52 15 L59 26 L64 10 L70 25 L76 16 L80 30 L85 25 L84 42 Z", f.innen);
      },
      kopf: function (f) {
        return strich("M48 36 Q60 43 72 36", f.innen, 3) +
          kreis(30, 54, 12.5, f.fell, true) + kreis(90, 54, 12.5, f.fell, true) +
          kreis(30, 54, 8.5, f.hell) + kreis(90, 54, 8.5, f.hell);
      },
      augen: [[30, 54], [90, 54]],
      nase: function () { return kreis(56, 61, 1.5, DUNKEL) + kreis(64, 61, 1.5, DUNKEL); },
      mund: function (stimmung) {
        if (stimmung === "froh") return form("M43 68 Q60 86 77 68 Q60 75 43 68 Z", "#c2414f");
        if (stimmung === "oje") return oval(60, 73, 4, 4, DUNKEL);
        return strich("M43 69 Q60 80 77 69", DUNKEL, 2.5);
      }
    },

    alligator: {
      farben: { fell: "#4f9d4a", hell: "#cfe8a9", innen: "#2f6e2c" },
      // Langer Schwanz mit Zacken rechts hinter dem Körper
      hinten: function (f) {
        var p = "M80 102 C100 110 114 100 116 84";
        return strich(p, "#3d2b1f", 12) + strich(p, f.fell, 7) +
          form("M97 104 L102 95 L106 103 Z", f.innen) + form("M108 99 L115 91 L114 100 Z", f.innen);
      },
      koerper: function (f) { return strich("M50 93 L70 93 M49 100 L71 100 M51 107 L69 107", f.innen, 1.6); },
      // Augenhöcker oben auf dem Kopf
      vorKopf: function (f) { return kreis(43, 34, 11, f.fell, true) + kreis(77, 34, 11, f.fell, true); },
      // Breite, lange Schnauze und Rückenzacken auf der Stirn
      kopf: function (f) {
        return kreis(43, 34, 7.5, "#ffffff") + kreis(77, 34, 7.5, "#ffffff") +
          kreis(54, 44, 2.5, f.innen) + kreis(66, 44, 2.5, f.innen) + kreis(60, 49, 2.5, f.innen) +
          oval(60, 71, 27, 13, f.hell, true);
      },
      augen: [[43, 35], [77, 35]],
      nase: function () { return kreis(53, 64, 1.8, DUNKEL) + kreis(67, 64, 1.8, DUNKEL); },
      mund: function (stimmung) {
        var zaehne = form("M45 75.2 L47.5 79.5 L50 76 Z", "#ffffff") + form("M70 76 L72.5 79.5 L75 75.2 Z", "#ffffff");
        if (stimmung === "froh") return strich("M38 72 Q60 84 82 72", DUNKEL, 2.5) + zaehne;
        if (stimmung === "oje") return oval(60, 77, 4, 3.5, DUNKEL);
        return strich("M40 74 Q60 79 80 74", DUNKEL, 2.5) + zaehne;
      }
    },

    hund: {
      farben: { fell: "#d39a5f", hell: "#fbeedd", innen: "#8a5a32" },
      hinten: function (f) {
        var p = "M82 100 C96 98 102 88 100 76";
        return strich(p, "#3d2b1f", 9) + strich(p, f.fell, 4.5);
      },
      kopf: function (f) {
        return oval(74, 50, 10, 9.5, "#b97b43") + schnauze(f) +
          oval(29, 58, 10, 19, f.innen, true, 18) + oval(91, 58, 10, 19, f.innen, true, -18);
      },
      nase: function () { return oval(60, 63, 6, 4.3, DUNKEL); }
    },

    baer: {
      farben: { fell: "#a86f43", hell: "#ecc89f", innen: "#ecc89f" },
      hinten: function (f) { return kreis(86, 104, 6, f.fell, true); },
      vorKopf: function (f) {
        return kreis(33, 33, 11, f.fell, true) + kreis(87, 33, 11, f.fell, true) +
          kreis(33, 33, 6, f.innen) + kreis(87, 33, 6, f.innen);
      },
      kopf: schnauze,
      nase: function () { return oval(60, 64, 5.5, 4, DUNKEL); }
    },

    panda: {
      farben: { fell: "#fbfbf7", hell: "#fbfbf7", innen: "#2b2b2e" },
      fuss: "#2b2b2e",
      koerper: function (f) { return oval(37, 95, 7, 12, f.innen, true, 25) + oval(83, 95, 7, 12, f.innen, true, -25); },
      vorKopf: function (f) { return kreis(33, 33, 11, f.innen, true) + kreis(87, 33, 11, f.innen, true); },
      kopf: function (f) { return oval(45, 54, 9, 12, f.innen, false, 35) + oval(75, 54, 9, 12, f.innen, false, -35); },
      augenHell: true,
      nase: function (f) { return oval(60, 64, 5, 3.6, f.innen); }
    },

    pinguin: {
      farben: { fell: "#34405a", hell: "#ffffff", innen: "#f5a623" },
      fuss: "#f5a623",
      koerper: function (f) {
        return oval(60, 98, 19, 16, "#fff") + oval(33, 94, 6, 14, f.fell, true, 20) + oval(87, 94, 6, 14, f.fell, true, -20);
      },
      kopf: function () {
        return flaeche("M60 46 C52 36 34 40 34 56 C34 74 46 84 60 84 C74 84 86 74 86 56 C86 40 68 36 60 46 Z", "#fff");
      },
      nase: function (f) { return form("M53 63 L67 63 L60 71 Z", f.innen); },
      mund: schnabelMund
    },

    eule: {
      farben: { fell: "#a07657", hell: "#f3dfc4", innen: "#f2b134" },
      fuss: "#f2b134",
      koerper: function () {
        return oval(35, 96, 7, 14, "#8a6248", true, 15) + oval(85, 96, 7, 14, "#8a6248", true, -15) +
          strich("M52 93 L56 96 L60 93 L64 96 L68 93 M54 101 L58 104 L62 101 L66 104", "#c9a27e", 2);
      },
      vorKopf: function (f) { return form("M30 44 L27 16 L48 32 Z", f.fell) + form("M90 44 L93 16 L72 32 Z", f.fell); },
      kopf: function (f) {
        return kreis(46, 53, 12.5, f.hell) + kreis(74, 53, 12.5, f.hell) + strich("M50 38 L60 44 L70 38", "#7d573c", 2.5);
      },
      augen: [[46, 53], [74, 53]],
      nase: function (f) { return form("M55 62 L65 62 L60 71 Z", f.innen); },
      mund: schnabelMund
    },

    igel: {
      farben: { fell: "#e9c79c", hell: "#f8e6cc", innen: "#6e5039" },
      hinten: function (f) { return stacheln(60, 96, 22, 33, 130, 410, 14, f.innen); },
      vorKopf: function (f) { return stacheln(60, 58, 30, 45, 190, 350, 9, f.innen); },
      kopf: function (f) { return oval(60, 69, 15, 11, f.hell); },
      nase: function () { return kreis(60, 63, 4.5, DUNKEL); }
    },

    eichhoernchen: {
      farben: { fell: "#d8743a", hell: "#fbe2c6", innen: "#a64f22" },
      hinten: function (f) {
        return form("M76 110 C104 112 116 86 108 62 C102 44 84 40 80 52 C78 60 90 60 94 68 C100 82 94 96 74 98 Z", f.fell) +
          strich("M84 104 C100 98 106 82 100 66", "#f0a46c", 3);
      },
      vorKopf: function (f) {
        return form("M32 42 L33 14 L50 32 Z", f.fell) + form("M88 42 L87 14 L70 32 Z", f.fell) +
          strich("M33 15 L29 6 M33 15 L37 7 M87 15 L91 6 M87 15 L83 7", f.innen, 2.5);
      },
      kopf: function (f) { return oval(60, 70, 15, 11, f.hell); },
      nase: function () { return oval(60, 64, 3.6, 2.7, DUNKEL); }
    },

    schildkroete: {
      farben: { fell: "#86c96d", hell: "#e3f4d2", innen: "#a8743d" },
      koerper: function (f) {
        return form("M20 106 C18 80 40 68 60 68 C80 68 102 80 100 106 Z", f.innen) +
          kreis(30, 95, 5, "#c9945a") + kreis(90, 95, 5, "#c9945a") + kreis(60, 99, 6, "#c9945a") +
          kreis(44, 101, 4, "#c9945a") + kreis(76, 101, 4, "#c9945a") +
          oval(60, 106, 41, 4, "#e7c27a", true);
      },
      kopf: function () { return kreis(48, 38, 2.5, "#6bb153") + kreis(70, 36, 3, "#6bb153") + kreis(60, 33, 2, "#6bb153"); },
      nase: function () { return kreis(56, 62, 1.6, DUNKEL) + kreis(64, 62, 1.6, DUNKEL); }
    },

    koala: {
      farben: { fell: "#9ea6b0", hell: "#e9ecef", innen: "#f6d4da" },
      vorKopf: function (f) {
        return kreis(28, 40, 17, f.fell, true) + kreis(92, 40, 17, f.fell, true) +
          kreis(28, 41, 10, f.hell) + kreis(92, 41, 10, f.hell);
      },
      nase: function () { return oval(60, 63, 7, 9.5, "#3b3b45") + kreis(57.5, 59, 1.8, "#6b6b78"); },
      mundY: 77
    },

    loewe: {
      farben: { fell: "#f4bb4c", hell: "#fde9b8", innen: "#c9702a" },
      hinten: function (f) {
        return strich("M82 102 C98 102 104 92 104 82", "#3d2b1f", 3) + kreis(104, 79, 6, f.innen, true);
      },
      vorKopf: function (f) {
        var s = "";
        for (var i = 0; i < 12; i++) {
          var w = i * Math.PI / 6;
          s += kreis(r1(60 + 36 * Math.cos(w)), r1(58 + 31 * Math.sin(w)), 12, f.innen, true);
        }
        return s + kreis(38, 33, 8, f.fell, true) + kreis(82, 33, 8, f.fell, true);
      },
      kopf: schnauze,
      nase: function () { return form("M55 62 L65 62 L60 67 Z", "#6b3b25"); }
    },

    tiger: {
      farben: { fell: "#f59a3a", hell: "#fff3e2", innen: "#f4a9b8" },
      hinten: function (f) {
        var p = "M82 102 C104 102 108 86 100 74";
        return strich(p, "#3d2b1f", 9) + strich(p, f.fell, 4.5) + strich("M95 97 L99 101 M101 87 L106 89", DUNKEL, 2.5);
      },
      koerper: function () { return strich("M35 88 L43 92 M85 88 L77 92 M34 98 L42 100 M86 98 L78 100", DUNKEL, 3); },
      vorKopf: function (f) {
        return kreis(35, 34, 10, f.fell, true) + kreis(85, 34, 10, f.fell, true) + kreis(35, 34, 5, f.innen) + kreis(85, 34, 5, f.innen);
      },
      kopf: function (f) {
        return strich("M52 32 L54 40 M60 30 L60 41 M68 32 L66 40 M27 52 L36 55 M93 52 L84 55 M28 61 L36 61 M92 61 L84 61", DUNKEL, 3) + schnauze(f);
      },
      nase: function () { return oval(60, 64, 4.5, 3.2, "#e7788b"); },
      vorne: schnurrhaare
    },

    waschbaer: {
      farben: { fell: "#a3a3a8", hell: "#efefef", innen: "#3a3a3f" },
      hinten: function (f) {
        var p = "M80 104 C100 104 108 92 106 78";
        return strich(p, "#3d2b1f", 11) + strich(p, f.fell, 7) +
          '<path d="' + p + '" fill="none" stroke="' + f.innen + '" stroke-width="7" stroke-dasharray="5 5"/>';
      },
      vorKopf: function (f) {
        return form("M30 42 L32 15 L52 31 Z", f.fell) + form("M90 42 L88 15 L68 31 Z", f.fell) +
          flaeche("M35 35 L36 22 L46 31 Z", f.hell) + flaeche("M85 35 L84 22 L74 31 Z", f.hell);
      },
      kopf: function (f) {
        return flaeche("M28 60 C40 56 50 62 60 60 C70 62 80 56 92 60 C90 78 76 86 60 86 C44 86 30 78 28 60 Z", f.hell) +
          flaeche("M29 52 C34 42 50 43 60 49 C70 43 86 42 91 52 C89 62 74 63 60 56 C46 63 31 62 29 52 Z", f.innen) +
          strich("M60 31 L60 45", f.innen, 4);
      },
      augenHell: true,
      nase: function () { return oval(60, 64, 5, 3.6, DUNKEL); }
    },

    schaf: {
      farben: { fell: "#fdfbf7", hell: "#f2dcc4", innen: "#6b5a4e" },
      fuss: "#6b5a4e",
      hinten: function (f) {
        return [[36, 86], [47, 79], [73, 79], [84, 86], [88, 99], [32, 99], [40, 109], [80, 109]].map(function (p) {
          return kreis(p[0], p[1], 10, f.fell, true);
        }).join("");
      },
      vorKopf: function (f) { return oval(26, 56, 12, 6, f.hell, true, 20) + oval(94, 56, 12, 6, f.hell, true, -20); },
      kopf: function (f) {
        return oval(60, 63, 24, 21, f.hell) +
          kreis(47, 33, 9, f.fell, true) + kreis(73, 33, 9, f.fell, true) + kreis(60, 29, 10, f.fell, true);
      },
      nase: function () { return form("M56 63 L64 63 L60 67 Z", "#8a6a5a"); }
    },

    schwein: {
      farben: { fell: "#f7b6c2", hell: "#fcd6dd", innen: "#e98a9d" },
      hinten: function (f) {
        var p = "M84 100 C92 100 96 94 92 90 C88 86 84 92 90 94 C96 96 100 90 100 86";
        return strich(p, "#3d2b1f", 6) + strich(p, f.fell, 3);
      },
      vorKopf: function (f) {
        return form("M30 44 L28 16 L52 30 Z", f.fell) + form("M90 44 L92 16 L68 30 Z", f.fell) +
          flaeche("M34 36 L33 24 L45 31 Z", f.innen) + flaeche("M86 36 L87 24 L75 31 Z", f.innen);
      },
      nase: function (f) { return oval(60, 66, 11, 8, f.innen, true) + oval(56, 66, 2, 3.2, "#a8475b") + oval(64, 66, 2, 3.2, "#a8475b"); },
      mundY: 78
    },

    kueken: {
      farben: { fell: "#ffd93d", hell: "#fff2a8", innen: "#f59a23" },
      fuss: "#f59a23",
      koerper: function () { return oval(36, 94, 7, 12, "#f5c518", true, 25) + oval(84, 94, 7, 12, "#f5c518", true, -25); },
      kopf: function (f) { return form("M55 31 C50 22 54 15 60 21 C62 14 71 16 65 31 Z", f.fell); },
      nase: function (f) { return form("M54 63 L66 63 L60 70 Z", f.innen); },
      mund: schnabelMund
    },

    otter: {
      farben: { fell: "#8d6040", hell: "#ead2b2", innen: "#5e3c22" },
      hinten: function (f) {
        var p = "M82 106 C98 108 108 100 110 90";
        return strich(p, "#3d2b1f", 11) + strich(p, f.fell, 7);
      },
      koerper: function (f) {
        return oval(60, 97, 9, 6.5, "#9fb3c4", true) + kreis(50, 96, 4.5, f.fell, true) + kreis(70, 96, 4.5, f.fell, true);
      },
      vorKopf: function (f) { return kreis(32, 38, 7, f.fell, true) + kreis(88, 38, 7, f.fell, true); },
      kopf: function (f) { return oval(60, 70, 22, 15, f.hell); },
      nase: function () { return oval(60, 63, 6, 4.2, DUNKEL); },
      vorne: schnurrhaare
    },

    faultier: {
      farben: { fell: "#a98d70", hell: "#efe2cc", innen: "#5f4733" },
      koerper: function (f) {
        return oval(37, 94, 7, 13, f.fell, true, 30) + oval(83, 94, 7, 13, f.fell, true, -30) +
          strich("M31 103 L29 108 M35 105 L34 110 M89 103 L91 108 M85 105 L86 110", DUNKEL, 2);
      },
      kopf: function (f) {
        return oval(60, 60, 27, 23, f.hell) + oval(45, 56, 11, 6.5, f.innen, false, -20) + oval(75, 56, 11, 6.5, f.innen, false, 20) +
          strich("M52 31 L54 36 M60 29 L60 35 M68 31 L66 36", f.innen, 2);
      },
      augen: [[46, 55], [74, 55]],
      augenHell: true,
      nase: function () { return oval(60, 65, 5, 3.6, DUNKEL); },
      mundY: 72
    },

    maus: {
      farben: { fell: "#b8b3c6", hell: "#f3eff7", innen: "#f4a9b8" },
      hinten: function () { return strich("M82 106 C100 110 110 100 104 90 C100 84 108 80 112 84", "#e79aa8", 3); },
      vorKopf: function (f) {
        return kreis(29, 34, 17, f.fell, true) + kreis(91, 34, 17, f.fell, true) + kreis(29, 34, 10, f.innen) + kreis(91, 34, 10, f.innen);
      },
      kopf: function (f) { return oval(60, 70, 14, 10, f.hell); },
      nase: function () { return kreis(60, 64, 3.6, "#e7788b"); },
      vorne: schnurrhaare
    },

    kuh: {
      farben: { fell: "#ffffff", hell: "#f8c9d2", innen: "#3d3d40" },
      fuss: "#3d3d40",
      hinten: function (f) { return strich("M84 100 C94 100 98 94 100 86", "#3d2b1f", 3) + oval(101, 83, 3.5, 5.5, f.innen, false, 20); },
      koerper: function (f) { return oval(42, 90, 6, 5, f.innen) + oval(79, 97, 7, 5, f.innen); },
      vorKopf: function (f) {
        return form("M40 34 C34 30 32 22 36 15 C40 24 44 26 48 29 Z", "#f3e3b5") + form("M80 34 C86 30 88 22 84 15 C80 24 76 26 72 29 Z", "#f3e3b5") +
          oval(23, 46, 11, 6, f.fell, true, 25) + oval(97, 46, 11, 6, f.fell, true, -25);
      },
      kopf: function (f) { return oval(75, 42, 9, 7, f.innen, false, -20) + oval(60, 73, 20, 12, f.hell, true); },
      nase: function () { return oval(54, 71, 2.2, 3, "#a8475b") + oval(66, 71, 2.2, 3, "#a8475b"); },
      mundY: 78
    },

    einhorn: {
      farben: { fell: "#fffaff", hell: "#fbe7f3", innen: "#f6b6d2" },
      fuss: "#ffd43b",
      hinten: function () {
        var p = "M78 102 C98 106 110 94 106 78";
        var s = strich(p, "#3d2b1f", 25);
        REGENBOGEN.forEach(function (farbe, i) { s += strich(p, farbe, 20 - i * 3.4); });
        return s;
      },
      vorKopf: function (f) {
        var s = oval(80, 28, 6, 12, f.fell, true, 20) + oval(43, 27, 6, 12, f.fell, true, -20);
        [[66, 25], [52, 25], [40, 32], [31, 43], [26, 56], [27, 70]].forEach(function (p, i) {
          s += kreis(p[0], p[1], 10, REGENBOGEN[i], true);
        });
        return s;
      },
      kopf: function (f) {
        return form("M56 31 L62 3 L68 30 Z", "#ffd43b") + strich("M58 24 L66 21 M59 17 L65 15 M60 11 L64 9", "#d99a00", 2) +
          kreis(51, 34, 7, "#f783ac", true) + kreis(62, 32, 7, "#b197fc", true) + oval(60, 70, 18, 12, f.hell);
      },
      nase: nasenloecher
    },

    drache: {
      farben: { fell: "#7c6ee0", hell: "#ffe7a3", innen: "#ffb84d" },
      hinten: function (f) {
        var p = "M84 106 C98 112 108 110 112 102";
        var fluegel = "M40 90 C22 66 4 72 6 86 C12 84 16 90 14 96 C20 94 26 98 26 104 C32 100 36 98 40 98 Z";
        return strich(p, "#3d2b1f", 9) + strich(p, f.fell, 5) + form("M108 104 L118 96 L116 108 Z", f.innen) +
          form(fluegel, "#a99cf2") + spiegel(form(fluegel, "#a99cf2"));
      },
      koerper: function () { return strich("M50 94 L70 94 M50 101 L70 101 M52 108 L68 108", "#e2b94f", 2); },
      vorKopf: function () { return form("M40 36 L33 11 L51 30 Z", "#fff1c9") + form("M80 36 L87 11 L69 30 Z", "#fff1c9"); },
      kopf: function (f) { return form("M51 32 L55 22 L60 30 L65 22 L69 32 Z", f.innen) + oval(60, 70, 18, 12, "#a59bf0"); },
      nase: nasenloecher
    },

    phoenix: {
      farben: { fell: "#ff7043", hell: "#ffd166", innen: "#ffb703" },
      fuss: "#f4a300",
      hinten: function (f) {
        var flammen = form("M78 104 C100 112 116 98 116 82 C110 92 100 94 92 92 Z", "#e63946") +
          form("M80 98 C102 96 112 76 104 58 C100 74 92 80 82 84 Z", f.innen);
        return flammen + spiegel(flammen);
      },
      koerper: function () { return oval(35, 94, 7, 14, "#ffb703", true, 25) + oval(85, 94, 7, 14, "#ffb703", true, -25); },
      vorKopf: function (f) {
        var seite = form("M54 33 C44 27 41 17 43 10 C50 16 56 22 57 31 Z", "#e63946");
        return seite + spiegel(seite) + form("M60 31 C52 21 54 11 60 3 C66 11 68 21 60 31 Z", f.innen);
      },
      kopf: function (f) {
        return flaeche("M60 46 C52 38 36 42 36 56 C36 72 46 82 60 82 C74 82 84 72 84 56 C84 42 68 38 60 46 Z", f.hell);
      },
      nase: function () { return form("M54 62 L66 62 L60 70 Z", "#f4a300"); },
      mund: schnabelMund
    }
  };

  // hell = weißes Auge mit dunkler Pupille, für Tiere mit dunklen Augenflecken.
  function augen(positionen, stimmung, hell) {
    var farbe = hell ? "#fff" : DUNKEL;
    return positionen.map(function (p, i) {
      var x = p[0], y = p[1];
      if (stimmung === "froh") return strich("M" + (x - 6) + " " + (y + 2) + " Q" + x + " " + (y - 6) + " " + (x + 6) + " " + (y + 2), farbe, 3);
      var auge = hell
        ? oval(x, y, 5, 6, "#fff") + oval(x + 0.5, y + 0.8, 3.2, 3.8, DUNKEL) + kreis(x + 1.6, y - 1, 1.2, "#fff")
        : oval(x, y, 5, 6, DUNKEL) + kreis(x + 1.6, y - 2.2, 1.8, "#fff");
      if (stimmung === "oje") {
        var aussen = i === 0 ? x - 7 : x + 7;
        var innen = i === 0 ? x + 4 : x - 4;
        auge += strich("M" + aussen + " " + (y - 8) + " L" + innen + " " + (y - 12), farbe, 2.5);
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

  /**
   * Liefert das Tier als SVG-Text. `beschriftung` ist der Text für
   * Screenreader. Mit `schatten` erscheint das Tier als dunkle Silhouette
   * (noch nicht entdeckt).
   */
  function zeichne(art, stimmung, beschriftung, schatten) {
    var a = ARTEN[art] || ARTEN.fuchs;
    var f = a.farben;
    function teil(name) { return a[name] ? a[name](f) : ""; }
    return '<svg class="tier-svg' + (schatten ? " tier-silhouette" : "") + '" viewBox="0 0 120 120" role="img" aria-label="' + (beschriftung || "") + '" xmlns="http://www.w3.org/2000/svg">' +
      teil("hinten") +
      oval(60, 96, 27, 20, f.fell, true) +
      oval(60, 100, 15, 13, f.hell) +
      teil("koerper") +
      oval(47, 114, 8, 5, a.fuss || f.fell, true) +
      oval(73, 114, 8, 5, a.fuss || f.fell, true) +
      teil("vorKopf") +
      oval(60, 58, 34, 29, f.fell, true) +
      teil("kopf") +
      augen(a.augen || AUGEN, stimmung, a.augenHell) +
      oval(38, 64, 6, 3.5, "#f27c8c").replace("/>", ' opacity="0.45"/>') +
      oval(82, 64, 6, 3.5, "#f27c8c").replace("/>", ' opacity="0.45"/>') +
      teil("nase") +
      (a.mund ? a.mund(stimmung, f) : mund(stimmung, a.mundY || 69)) +
      teil("vorne") +
      "</svg>";
  }

  root.Tiere = { zeichne: zeichne, name: name, hat: function (art) { return !!ARTEN[art]; } };
})(this);
