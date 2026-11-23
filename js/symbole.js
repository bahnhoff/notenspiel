/*
 * Gezeichnete Symbole für Startseite und Menüs, im Stil der Tiere aus
 * js/tiere.js: warme Farben, flache Flächen, dunkelbraune runde Konturen.
 * Sie ersetzen die System-Emojis, die je nach Gerät anders aussehen.
 *
 *   Symbole.zeichne(id)       SVG als Text oder "" für eine unbekannte Kennung
 *   Symbole.setzeEin(wurzel)  füllt alle Elemente mit `data-symbol` (Knöpfe mit
 *                             der Klasse `knopf-symbol` in index.html)
 *
 * Kennungen: die Kennung des Spielmodus (klassisch, notenflug, klaviertasten,
 * note-setzen, noten-memory, hoer-spiel, notenreise, melodie)
 * die Menüknöpfe tiere, rekorde, einstellungen, ueben und lautsprecher für
 * „Nochmal hören“ im Hör-Spiel (dessen Bezugston-Knopf nutzt klaviertasten).
 * Bausteine aus Plan Version 3 (js/bausteine.js): zahnrad (Profilknopf),
 * rakete, pokal, orden, ton-an und ton-aus (Lautsprecher mit und ohne
 * Wellen), stern, note, herz, herz-leer und flamme (Pillen), pfote (Fußzeile).
 * Alle Symbole liegen in einem Feld von 48 × 48 und sind nur Schmuck
 * (aria-hidden), der Text daneben trägt die Bedeutung.
 */
(function (root) {
  "use strict";

  var BRAUN = "#3d2b1f";
  var UMRISS = 'stroke="' + BRAUN + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  var F = {
    orange: "#f08a3c",
    orangeDunkel: "#c8611f",
    creme: "#fff4e3",
    gelb: "#ffd43b",
    gold: "#f5b300",
    rot: "#ff6b6b",
    gruen: "#69db7c",
    blau: "#4dabf7",
    holz: "#b9773f",
    sand: "#e9c79a"
  };

  function r1(x) { return Math.round(x * 10) / 10; }
  function form(d, farbe) { return '<path d="' + d + '" fill="' + farbe + '" ' + UMRISS + "/>"; }
  function linie(d, breite, farbe) {
    return '<path d="' + d + '" fill="none" stroke="' + (farbe || BRAUN) + '" stroke-width="' + (breite || 2.2) +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function kreis(x, y, r, farbe, ohneUmriss) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + farbe + '"' + (ohneUmriss ? "" : " " + UMRISS) + "/>";
  }
  function oval(x, y, rx, ry, farbe, drehung, ohneUmriss) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '"' +
      (drehung ? ' transform="rotate(' + drehung + " " + x + " " + y + ')"' : "") +
      ' fill="' + farbe + '"' + (ohneUmriss ? "" : " " + UMRISS) + "/>";
  }
  function rechteck(x, y, b, h, r, farbe) {
    return '<rect x="' + x + '" y="' + y + '" width="' + b + '" height="' + h + '" rx="' + r + '" fill="' + farbe + '" ' + UMRISS + "/>";
  }

  /** Notenkopf (schräges Oval) mit Hals nach oben rechts. */
  function note(x, y, farbe, hals) {
    hals = hals === undefined ? 17 : hals;
    return (hals ? linie("M" + r1(x + 4.6) + " " + r1(y - 1) + " L" + r1(x + 4.6) + " " + r1(y - hals), 2.4) : "") +
      oval(x, y, 5.4, 4, farbe, -20);
  }

  /** Zahnrad: `zaehne` Zähne um (cx, cy). */
  function zahnrad(cx, cy, innen, aussen, zaehne) {
    var punkte = [];
    var schritt = Math.PI * 2 / zaehne;
    for (var i = 0; i < zaehne; i++) {
      var w = i * schritt - Math.PI / 2;
      [[-0.5, innen], [-0.3, aussen], [0.3, aussen], [0.5, innen]].forEach(function (p) {
        var a = w + p[0] * schritt;
        punkte.push(r1(cx + p[1] * Math.cos(a)) + " " + r1(cy + p[1] * Math.sin(a)));
      });
    }
    return "M" + punkte.join(" L") + " Z";
  }

  var ZEICHNUNGEN = {
    // Welche Note ist das? Zwei Achtelnoten mit Balken
    klassisch: function () {
      return linie("M18.6 33 L18.6 13 M36.6 29 L36.6 9", 2.6) +
        form("M18.6 11.5 L36.6 7.5 L36.6 13.5 L18.6 17.5 Z", BRAUN) +
        oval(14, 34, 6.4, 4.8, F.orange, -20) + oval(32, 30, 6.4, 4.8, F.orange, -20);
    },

    // Notenflug: kleine Rakete, schräg nach oben rechts
    notenflug: function () {
      return '<g transform="rotate(45 24 24)">' +
        form("M19 34 C16 38 16 42 18 45 C20 42 22 41 24 40 C26 41 28 42 30 45 C32 42 32 38 29 34 Z", F.gelb) +
        form("M17 26 L10 34 L17 33 Z", F.rot) + form("M31 26 L38 34 L31 33 Z", F.rot) +
        form("M24 4 C31 10 32 20 31 34 L17 34 C16 20 17 10 24 4 Z", F.creme) +
        form("M24 4 C28 7 30 10 30.6 13 L17.4 13 C18 10 20 7 24 4 Z", F.orange) +
        kreis(24, 22, 4.2, F.blau) +
        "</g>";
    },

    // Klaviertasten: Holzrahmen mit weißen und schwarzen Tasten
    klaviertasten: function () {
      // fünf weiße Tasten (C D E F G), schwarze nach C, D und F
      return rechteck(4, 9, 40, 31, 6, F.holz) +
        rechteck(8, 16, 32, 20, 2.5, "#ffffff") +
        linie("M14.4 16 L14.4 36 M20.8 16 L20.8 36 M27.2 16 L27.2 36 M33.6 16 L33.6 36", 1.6) +
        [14.4, 20.8, 33.6].map(function (x) {
          return '<rect x="' + r1(x - 2.4) + '" y="16" width="4.8" height="11" rx="1.2" fill="' + BRAUN + '"/>';
        }).join("");
    },

    // Note setzen: Bleistift setzt eine Note auf eine Linie
    "note-setzen": function () {
      return linie("M4 38 L28 38 M4 31 L28 31", 1.6, "#8a6a52") +
        oval(12, 34.5, 5.6, 4.2, F.orange, -20) +
        '<g transform="rotate(40 30 22)">' +
          form("M26 4 L34 4 L34 30 L26 30 Z", F.gelb) +
          form("M26 4 C26 1 34 1 34 4 Z", F.rot) +
          form("M26 30 L34 30 L30 40 Z", F.sand) +
          form("M28.6 36.5 L31.4 36.5 L30 40 Z", BRAUN) +
          linie("M30 7 L30 28", 1.4, F.gold) +
        "</g>";
    },

    // Noten-Memory: zwei Karten, die hintere verdeckt, die vordere mit Note
    "noten-memory": function () {
      return '<g transform="rotate(-12 17 24)">' + rechteck(5, 8, 22, 30, 4, F.orange) +
          kreis(16, 23, 5, F.orangeDunkel, true) + "</g>" +
        '<g transform="rotate(10 31 25)">' + rechteck(20, 10, 22, 30, 4, F.creme) +
          note(29, 31, F.orange, 13) + "</g>";
    },

    // Hör-Spiel: Lautsprecher mit Schallwellen
    "hoer-spiel": function () {
      return form("M6 19 L13 19 L23 10 L23 38 L13 29 L6 29 Z", F.orange) +
        linie("M29 18 C32 21 32 27 29 30", 2.6) +
        linie("M34 13 C40 19 40 29 34 35", 2.6) +
        linie("M39 8 C47 17 47 31 39 40", 2.6, F.orangeDunkel);
    },

    // Lautsprecher für den orangen Knopf „Nochmal hören“: helle Fläche, braune Wellen
    lautsprecher: function () {
      return form("M6 19 L13 19 L23 10 L23 38 L13 29 L6 29 Z", F.creme) +
        linie("M29 18 C32 21 32 27 29 30", 2.8) +
        linie("M34 13 C40 19 40 29 34 35", 2.8);
    },

    // Tägliche Notenreise: Kompass
    notenreise: function () {
      return kreis(24, 24, 19, F.sand) + kreis(24, 24, 14.5, F.creme) +
        form("M24 11 L28.4 24 L19.6 24 Z", F.rot) +
        form("M24 37 L28.4 24 L19.6 24 Z", "#ffffff") +
        kreis(24, 24, 2.6, BRAUN, true) +
        linie("M24 4.8 L24 7.6 M24 40.4 L24 43.2 M4.8 24 L7.6 24 M40.4 24 L43.2 24", 2);
    },

    // Spiel eine Melodie: Notenlinien mit drei steigenden Noten und einem Funkeln
    melodie: function () {
      return linie("M3 41 L45 41 M3 34 L45 34 M3 27 L45 27", 1.5, "#8a6a52") +
        note(10, 37.5, F.orange, 16) + note(23, 30.5, F.gelb, 16) + note(36, 23.5, F.rot, 16) +
        form("M15 4 L16.6 8.4 L21 10 L16.6 11.6 L15 16 L13.4 11.6 L9 10 L13.4 8.4 Z", F.gelb);
    },

    // Meine Tiere: Pfotenabdruck
    tiere: function () {
      return form("M24 24 C31 24 37 30 37 36 C37 41 32 42 28.5 41 C26.5 40.5 25.4 40 24 40 C22.6 40 21.5 40.5 19.5 41 C16 42 11 41 11 36 C11 30 17 24 24 24 Z", F.orange) +
        oval(9, 21, 4.4, 5.6, F.orange, -25) + oval(18.5, 12, 4.6, 6, F.orange, -8) +
        oval(29.5, 12, 4.6, 6, F.orange, 8) + oval(39, 21, 4.4, 5.6, F.orange, 25);
    },

    // Rekorde: Pokal
    rekorde: function () {
      return linie("M13 12 C4 12 5 25 16 25 M35 12 C44 12 43 25 32 25", 2.8) +
        form("M12 7 L36 7 L35 16 C34 25 29 29 24 29 C19 29 14 25 13 16 Z", F.gelb) +
        form("M20.5 29 L27.5 29 L28.5 35 L19.5 35 Z", F.gold) +
        rechteck(13, 35, 22, 7, 2.5, F.holz) +
        linie("M18 11 C17.6 15 18 19 20 22", 2, "#ffffff");
    },

    // Einstellungen: Zahnrad
    einstellungen: function () {
      return form(zahnrad(24, 24, 15, 20.5, 8), F.sand) + kreis(24, 24, 6.5, F.creme);
    },

    // Bausteine Version 3: Zahnrad für den Profilknopf, helle Fläche auf dunklem Grund
    zahnrad: function () {
      return form(zahnrad(24, 24, 14, 19.5, 8), F.creme) + kreis(24, 24, 6, F.orange);
    },

    // Rakete und Pokal unter eigenem Namen (Kopfkarten, Rekorde)
    rakete: function () { return ZEICHNUNGEN.notenflug(); },
    pokal: function () { return ZEICHNUNGEN.rekorde(); },

    // Orden: Band mit runder Medaille und Stern
    orden: function () {
      return form("M15 4 L22 4 L27 20 L20 22 Z", F.blau) + form("M33 4 L26 4 L21 20 L28 22 Z", F.rot) +
        kreis(24, 31, 12.5, F.gelb) + kreis(24, 31, 8.5, F.gold, true) +
        form("M24 25 L25.8 29 L30 29.4 L26.8 32.2 L27.8 36.4 L24 34.2 L20.2 36.4 L21.2 32.2 L18 29.4 L22.2 29 Z", F.creme);
    },

    // Ton an: Lautsprecher mit Wellen; Ton aus: Lautsprecher mit Kreuz
    "ton-an": function () {
      return form("M6 19 L13 19 L23 10 L23 38 L13 29 L6 29 Z", F.orange) +
        linie("M29 18 C32 21 32 27 29 30", 2.8) + linie("M34 13 C40 19 40 29 34 35", 2.8);
    },
    "ton-aus": function () {
      return form("M6 19 L13 19 L23 10 L23 38 L13 29 L6 29 Z", F.sand) +
        linie("M30 18 L42 30 M42 18 L30 30", 3);
    },

    // Stern für Pillen und Sterne-Zähler
    stern: function () {
      return form("M24 4 L29.6 16.6 L43 17.8 L32.8 26.8 L35.8 40 L24 33 L12.2 40 L15.2 26.8 L5 17.8 L18.4 16.6 Z", F.gelb);
    },

    // Achtelnote für die Noten-Pille
    note: function () {
      return linie("M27 34 L27 7 C30 12 37 13 38 20", 3.2) + oval(20.5, 35, 8, 6, F.orange, -20);
    },

    // Herz (volles Leben) und leeres Herz (graue Kontur)
    herz: function () {
      return form("M24 41 C14 33 6 26 6 17 C6 11 10.5 7 16 7 C19.6 7 22.4 9 24 12 C25.6 9 28.4 7 32 7 C37.5 7 42 11 42 17 C42 26 34 33 24 41 Z", F.rot);
    },
    "herz-leer": function () {
      return '<path d="M24 41 C14 33 6 26 6 17 C6 11 10.5 7 16 7 C19.6 7 22.4 9 24 12 C25.6 9 28.4 7 32 7 C37.5 7 42 11 42 17 C42 26 34 33 24 41 Z" fill="none" stroke="#a8998b" stroke-width="3" stroke-linejoin="round"/>';
    },

    // Flamme für die Combo-Pille
    flamme: function () {
      return form("M24 44 C14 44 9 37 9 30 C9 21 16 17 17 8 C22 12 25 17 24 23 C27 21 28.5 18 29 15 C35 20 39 25 39 31 C39 38 33 44 24 44 Z", F.orange) +
        form("M24 44 C19.5 44 17 40.5 17 37 C17 32 21 30 22 25 C26 28 31 32 31 37 C31 41 28 44 24 44 Z", F.gelb);
    },

    // Pfote für die Fußzeile
    pfote: function () { return ZEICHNUNGEN.tiere(); },

    // Fehler üben: Zielscheibe mit Pfeil
    ueben: function () {
      return kreis(21, 27, 17, F.rot) + kreis(21, 27, 11.5, F.creme) + kreis(21, 27, 5.5, F.rot) +
        linie("M21 27 L40 8", 2.8) +
        form("M38 3 L39 9 L45 10 L41 14 L35 13 L34 7 Z", F.orange);
    }
  };

  function zeichne(id) {
    var z = ZEICHNUNGEN[id];
    if (!z) return "";
    return '<svg class="symbol-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      z() + "</svg>";
  }

  function setzeEin(wurzel) {
    Array.prototype.forEach.call((wurzel || document).querySelectorAll("[data-symbol]"), function (el) {
      var svg = zeichne(el.dataset.symbol);
      if (svg) el.innerHTML = svg;
    });
  }

  root.Symbole = { zeichne: zeichne, setzeEin: setzeEin };
})(this);
