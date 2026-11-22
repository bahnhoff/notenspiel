/*
 * Zeichnet ein Notensystem mit Violin- oder Bassschlüssel und einer
 * Viertelnote als SVG.
 * Alle Teile liegen in einem gemeinsamen Koordinatensystem und skalieren
 * deshalb gemeinsam.
 */
(function (root) {
  "use strict";

  var ABSTAND = 10;           // Linienabstand
  var UNTERSTE_LINIE = 72;    // y der untersten Linie
  var LINKS = 4;
  var RECHTS_STANDARD = 146;
  var NOTE_X_STANDARD = 98;

  /** y-Koordinate für eine Position (0 = unterste Linie, 1 = erster Zwischenraum …). */
  function yVon(position) {
    return UNTERSTE_LINIE - position * (ABSTAND / 2);
  }

  // Violinschlüssel als Umriss. Der Kringel umschließt die zweite Linie von unten (G).
  var VIOLINSCHLUESSEL =
    '<g class="schluessel" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
      '<path stroke-width="3" d="M31 66 C26 67 22 63 25 59 C29 54 37 57 36 64 C35 72 23 74 18 67 C13 59 20 50 28 43 C35 36 38 26 34 18 C31 12 25 16 24 26 C23 40 30 70 32 84"/>' +
      '<path stroke-width="2.6" d="M32 84 C33 92 24 94 22 89"/>' +
    "</g>" +
    '<circle class="schluessel" cx="24.6" cy="88.6" r="3.4" fill="currentColor"/>';

  // Bassschlüssel (F-Schlüssel): dicker Punkt auf der vierten Linie von unten (f),
  // Bogen nach rechts oben und unten, zwei Punkte über und unter dieser Linie.
  var F_LINIE = UNTERSTE_LINIE - 6 * (ABSTAND / 2);
  var BASSSCHLUESSEL =
    '<g class="schluessel">' +
      '<circle cx="15" cy="' + F_LINIE + '" r="4.6" fill="currentColor"/>' +
      '<path fill="currentColor" d="M11.5 ' + (F_LINIE - 3) + ' C13 ' + (F_LINIE - 12) + ' 21 ' + (F_LINIE - 15) + ' 28 ' + (F_LINIE - 14) +
        ' C38 ' + (F_LINIE - 13) + ' 43 ' + (F_LINIE - 5) + ' 42 ' + (F_LINIE + 5) +
        ' C40 ' + (F_LINIE + 17) + ' 28 ' + (F_LINIE + 26) + ' 11 ' + (F_LINIE + 32) +
        ' L10.4 ' + (F_LINIE + 30.6) +
        ' C23 ' + (F_LINIE + 24) + ' 33.5 ' + (F_LINIE + 16) + ' 34 ' + (F_LINIE + 4) +
        ' C34.5 ' + (F_LINIE - 6) + ' 31 ' + (F_LINIE - 11.5) + ' 25 ' + (F_LINIE - 11.5) +
        ' C20 ' + (F_LINIE - 11.5) + ' 16 ' + (F_LINIE - 8) + ' 15 ' + (F_LINIE - 4.6) + ' Z"/>' +
      '<circle cx="49" cy="' + (F_LINIE - 5) + '" r="2.4" fill="currentColor"/>' +
      '<circle cx="49" cy="' + (F_LINIE + 5) + '" r="2.4" fill="currentColor"/>' +
    "</g>";

  function r2(x) { return Math.round(x * 100) / 100; }

  /**
   * Versetzungszeichen links vor einem Notenkopf mit x-Mitte x und Höhe y:
   * Kreuz (1) aus zwei Strichen und zwei schrägen Balken, B (-1) mit Bauch.
   * Abstand zum Kopf so, dass auch Hilfslinien frei bleiben.
   */
  var VORZEICHEN_ABSTAND = 20;
  function versetzungszeichen(vorzeichen, x, y) {
    var cx = x - VORZEICHEN_ABSTAND;
    if (vorzeichen > 0) {
      var balken = function (by) {
        return "M" + r2(cx - 5) + " " + r2(by + 2.5) + " L" + r2(cx + 5) + " " + r2(by - 0.1) +
          " L" + r2(cx + 5) + " " + r2(by - 2.7) + " L" + r2(cx - 5) + " " + r2(by - 0.1) + " Z";
      };
      return '<g class="vorzeichen vorzeichen-kreuz">' +
        '<path d="' + balken(y - 3.3) + " " + balken(y + 3.5) + '" fill="currentColor"/>' +
        '<path d="M' + r2(cx - 2.2) + " " + r2(y - 11) + " L" + r2(cx - 2.2) + " " + r2(y + 12.5) +
          " M" + r2(cx + 2.2) + " " + r2(y - 12.5) + " L" + r2(cx + 2.2) + " " + r2(y + 11) +
          '" stroke="currentColor" stroke-width="1.3" fill="none"/></g>';
    }
    if (vorzeichen < 0) {
      var sx = cx - 2.6;
      return '<g class="vorzeichen vorzeichen-b">' +
        '<path d="M' + r2(sx) + " " + r2(y - 15) + " L" + r2(sx) + " " + r2(y + 5) +
          '" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + r2(sx) + " " + r2(y + 5) + " C" + r2(sx + 4) + " " + r2(y + 2.6) + " " + r2(sx + 8.2) + " " + r2(y - 0.4) + " " + r2(sx + 7.2) + " " + r2(y - 3.2) +
          " C" + r2(sx + 6.2) + " " + r2(y - 5.8) + " " + r2(sx + 2.4) + " " + r2(y - 4.6) + " " + r2(sx) + " " + r2(y - 1.6) +
          " L" + r2(sx) + " " + r2(y + 0.6) +
          " C" + r2(sx + 1.8) + " " + r2(y - 2) + " " + r2(sx + 4.6) + " " + r2(y - 2.8) + " " + r2(sx + 4.8) + " " + r2(y - 1.2) +
          " C" + r2(sx + 5) + " " + r2(y + 0.6) + " " + r2(sx + 2.6) + " " + r2(y + 2.8) + " " + r2(sx) + " " + r2(y + 3.6) +
          ' Z" fill="currentColor"/></g>';
    }
    return "";
  }

  /** Auflösungszeichen ♮ (nur für Knöpfe, im System gibt es keine Auflösung). */
  function aufloesungszeichen(x, y) {
    var cx = x - VORZEICHEN_ABSTAND;
    var balken = function (by) {
      return "M" + r2(cx - 3) + " " + r2(by + 1.9) + " L" + r2(cx + 3) + " " + r2(by + 0.3) +
        " L" + r2(cx + 3) + " " + r2(by - 2.3) + " L" + r2(cx - 3) + " " + r2(by - 0.7) + " Z";
    };
    return '<path d="' + balken(y - 3.3) + " " + balken(y + 3.5) + '" fill="currentColor"/>' +
      '<path d="M' + r2(cx - 3) + " " + r2(y - 12) + " L" + r2(cx - 3) + " " + r2(y + 5.5) +
      " M" + r2(cx + 3) + " " + r2(y - 5.5) + " L" + r2(cx + 3) + " " + r2(y + 12) +
      '" stroke="currentColor" stroke-width="1.4" fill="none"/>';
  }

  /** Versetzungszeichen als eigenes kleines SVG für Knöpfe: 1 = ♯, -1 = ♭, 0 = ♮. */
  function symbol(vorzeichen) {
    var x = VORZEICHEN_ABSTAND + 10;
    return '<svg class="vorzeichen-symbol" viewBox="0 0 20 30" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      (vorzeichen ? versetzungszeichen(vorzeichen, x, vorzeichen < 0 ? 18 : 15) : aufloesungszeichen(x, 15)) + "</svg>";
  }

  /**
   * note:     { position, schluessel, vorzeichen } oder null für ein leeres System.
   *           vorzeichen 1 (♯) oder -1 (♭) zeichnet ein Versetzungszeichen vor den Kopf.
   * optionen: bereich      [tiefste, höchste Position] für einen festen Ausschnitt
   *           beschriftung Text neben der Note (zum Beispiel nach der Antwort)
   *           schluessel   "violin" oder "bass", sonst der Schlüssel der Note
   *           breite       Ende der Linien rechts (Standard 146), für schmale Systeme
   *           noteX        x-Mitte der Note (Standard 98)
   *           falsch       Position einer zusätzlichen, falsch gesetzten Note (mit ✗)
   *           falschVorzeichen  Vorzeichen dieser Note (0, 1 oder -1)
   *           falschX      x-Mitte dieser Note (Standard noteX − 24)
   *           klasse       zusätzliche CSS-Klasse für das SVG
   *           markiere     true: Linie oder Zwischenraum der Note dezent hinterlegen
   *                        (nach der Antwort, auch bei Hilfslinien)
   *           namensPlatz  Zeichenzahl, für die rechts immer Platz bleibt. So ist das
   *                        System mit und ohne Beschriftung gleich breit und gleich hoch.
 *           weitere      [{ position, x, vorzeichen, klasse, nr, marke }]: weitere Noten
 *                        im selben System, je in <g class="note-weitere"> (Spiel eine
 *                        Melodie). `klasse` kommt an die Gruppe dazu,
 *                        `nr` als data-nr, `marke: true` legt eine zunächst unsichtbare
 *                        Fläche <rect class="note-marke"> hinter die Note, die das CSS
 *                        einfärben kann (aktuelle Note der Melodie).
 *           beschreibung Text für Screenreader statt der Standardbeschreibung
   * Die Note samt Hilfslinien liegt in <g class="note-gruppe">, damit ein Modus
   * sie verschieben kann (Notenflug).
   */
  function zeichne(note, optionen) {
    optionen = optionen || {};
    var teile = [];
    var i, y;
    var RECHTS = optionen.breite || RECHTS_STANDARD;
    var NOTE_X = optionen.noteX || NOTE_X_STANDARD;

    // Hilfslinien unter und über dem System für eine Note an Position p und x-Mitte x
    function hilfslinien(p, x) {
      var t = "";
      for (var j = -2; j >= p; j -= 2) t += hilfslinie(yVon(j), x);
      for (j = 10; j <= p; j += 2) t += hilfslinie(yVon(j), x);
      return t;
    }
    function hilfslinie(hy, x) {
      return '<line class="hilfslinie" x1="' + (x - 13) + '" x2="' + (x + 13) + '" y1="' + hy + '" y2="' + hy + '" stroke="currentColor" stroke-width="1.4"/>';
    }

    // Hinterlegung der Lage hinter den Linien: im System über die ganze Breite,
    // außerhalb (Hilfslinien) nur rund um die Note, dann in der note-gruppe,
    // damit sie mitwandert, wenn ein Modus die Note verschiebt (Notenflug).
    var markierung = note && optionen.markiere ? lageMarkierung(note.position, NOTE_X, RECHTS) : "";
    var imSystem = note && note.position >= 0 && note.position <= 8;
    if (markierung && imSystem) teile.push(markierung);

    // Fünf Linien
    for (i = 0; i < 5; i++) {
      y = yVon(i * 2);
      teile.push('<line x1="' + LINKS + '" x2="' + RECHTS + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.2"/>');
    }
    // Abschlussstriche links und rechts
    teile.push('<line x1="' + LINKS + '" x2="' + LINKS + '" y1="' + yVon(8) + '" y2="' + yVon(0) + '" stroke="currentColor" stroke-width="1.2"/>');

    var schluessel = optionen.schluessel || (note && note.schluessel) || "violin";
    teile.push(schluessel === "bass" ? BASSSCHLUESSEL : VIOLINSCHLUESSEL);

    var falschVz = optionen.falschVorzeichen || 0;
    if (typeof optionen.falsch === "number" && (!note || optionen.falsch !== note.position || falschVz !== (note.vorzeichen || 0))) {
      var fy = yVon(optionen.falsch);
      var fx = optionen.falschX || NOTE_X - 24;
      teile.push('<g class="note-falsch">' + hilfslinien(optionen.falsch, fx) + versetzungszeichen(falschVz, fx, fy) +
        '<ellipse cx="' + fx + '" cy="' + fy + '" rx="6.6" ry="4.6" transform="rotate(-20 ' + fx + " " + fy + ')" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 1.6"/>' +
        '<text x="' + (fx + 8) + '" y="' + (fy - 3) + '" font-size="11" font-weight="700" fill="currentColor">✗</text></g>');
    }

    // Viertelnote samt Hilfslinien und Versetzungszeichen an Position p und x-Mitte x
    function viertelnote(p, x, vorzeichen) {
      var ny = yVon(p);
      var t = hilfslinien(p, x) + versetzungszeichen(vorzeichen, x, ny);
      // Notenhals: unterhalb der Mittellinie nach oben rechts, sonst nach unten links
      var halsLaenge = 35;
      if (p < 4) {
        t += '<line x1="' + (x + 5.9) + '" x2="' + (x + 5.9) + '" y1="' + (ny - 1) + '" y2="' + (ny - halsLaenge) + '" stroke="currentColor" stroke-width="1.5"/>';
      } else {
        t += '<line x1="' + (x - 5.9) + '" x2="' + (x - 5.9) + '" y1="' + (ny + 1) + '" y2="' + (ny + halsLaenge) + '" stroke="currentColor" stroke-width="1.5"/>';
      }
      // Notenkopf (schwarze Viertelnote)
      t += '<ellipse class="notenkopf" cx="' + x + '" cy="' + ny + '" rx="6.6" ry="4.6" transform="rotate(-20 ' + x + " " + ny + ')" fill="currentColor"/>';
      return t;
    }

    (optionen.weitere || []).forEach(function (w) {
      var marke = "";
      if (w.marke) {
        // Fläche über das ganze System samt Hals und Hilfslinien der Note
        var my = yVon(w.position);
        var y0 = Math.min(yVon(8) - 6, my - 40), y1 = Math.max(yVon(0) + 6, my + 40);
        var x0 = w.x - (w.vorzeichen ? 28 : 13);
        marke = '<rect class="note-marke" x="' + x0 + '" y="' + y0 + '" width="' + (w.x + 13 - x0) + '" height="' + (y1 - y0) + '" rx="6"/>';
      }
      teile.push('<g class="note-weitere' + (w.klasse ? " " + w.klasse : "") + '"' +
        (typeof w.nr === "number" ? ' data-nr="' + w.nr + '"' : "") + ">" + marke +
        viertelnote(w.position, w.x, w.vorzeichen) + "</g>");
    });

    if (note) {
      var p = note.position;
      var ny = yVon(p);
      teile.push('<g class="note-gruppe">');
      if (markierung && !imSystem) teile.push(markierung);
      teile.push(viertelnote(p, NOTE_X, note.vorzeichen));

      if (optionen.beschriftung) {
        teile.push('<text class="notenname" x="' + (NOTE_X + 22) + '" y="' + (ny + 5.5) + '" font-size="18" font-weight="700" fill="currentColor">' + optionen.beschriftung + "</text>");
      }
      teile.push("</g>");
    }

    // Fester Ausschnitt für den ganzen Übungssatz, damit das System beim
    // Notenwechsel nicht springt. `bereich` = [tiefste, höchste Position].
    var bereich = optionen.bereich || [-3, 11];
    var oben = Math.min(10, yVon(bereich[1]) - (bereich[1] < 4 ? 38 : 8));
    var unten = Math.max(94, yVon(bereich[0]) + (bereich[0] >= 4 ? 38 : 8));
    // Platz für den Namen rechts neben der Note, auch für längere wie „fis¹“
    function namensBreite(zeichen) { return zeichen ? NOTE_X + 30 + zeichen * 10 : 0; }
    var breiteGesamt = Math.max(RECHTS + 4, namensBreite(optionen.beschriftung ? String(optionen.beschriftung).length : 0),
      namensBreite(optionen.namensPlatz || 0));
    return '<svg class="notensystem-svg' + (optionen.klasse ? " " + optionen.klasse : "") + '" viewBox="0 ' + oben + " " + breiteGesamt + " " + (unten - oben) + '" role="img" aria-label="' +
      (optionen.beschreibung || systemText(schluessel, optionen.beschriftung, note)) +
      '" xmlns="http://www.w3.org/2000/svg">' + teile.join("") + "</svg>";
  }

  /**
   * Weiche Farbfläche für die Lage einer Note: auf einer Linie ein schmales Band
   * um die Linie, in einem Zwischenraum die Fläche zwischen den Linien.
   * Innerhalb der fünf Linien (Position 0 bis 8) über die ganze Breite, sonst
   * nur rund um die Note, damit klar ist, welche Hilfslinie gemeint ist.
   */
  function lageMarkierung(position, x, rechts) {
    var y = yVon(position);
    var aufLinie = position % 2 === 0;
    var hoehe = aufLinie ? 5 : ABSTAND - 2;
    var imSystem = position >= 0 && position <= 8;
    var x0 = imSystem ? LINKS : x - 24;
    var x1 = imSystem ? rechts : x + 24;
    return '<rect class="lage-markierung" x="' + x0 + '" y="' + r2(y - hoehe / 2) + '" width="' + (x1 - x0) +
      '" height="' + hoehe + '" rx="2.5"/>';
  }

  /** Beschreibung für Screenreader in der aktuellen Sprache, zum Beispiel „Violinschlüssel mit der Note c¹“. */
  function systemText(schluessel, beschriftung, note) {
    var T = root.Texte;
    var name = T.t(schluessel === "bass" ? "schluessel.bass" : "schluessel.violin");
    if (beschriftung) return T.t("system.mitNote", { schluessel: name, name: beschriftung });
    return note ? T.t("system.mitEinerNote", { schluessel: name }) : name;
  }

  /** Position (0 = unterste Linie) zu einer y-Koordinate, auf ganze Schritte gerundet. */
  function positionVon(y) {
    return Math.round((UNTERSTE_LINIE - y) / (ABSTAND / 2));
  }

  root.Notensystem = { zeichne: zeichne, positionVon: positionVon, NOTE_X: NOTE_X_STANDARD, symbol: symbol };
})(this);
