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

  /**
   * note:     { position, schluessel } oder null für ein leeres System
   * optionen: bereich      [tiefste, höchste Position] für einen festen Ausschnitt
   *           beschriftung Text neben der Note (zum Beispiel nach der Antwort)
   *           schluessel   "violin" oder "bass", sonst der Schlüssel der Note
   *           breite       Ende der Linien rechts (Standard 146), für schmale Systeme
   *           noteX        x-Mitte der Note (Standard 98)
   *           falsch       Position einer zusätzlichen, falsch gesetzten Note (mit ✗)
   *           falschX      x-Mitte dieser Note (Standard noteX − 24)
   *           klasse       zusätzliche CSS-Klasse für das SVG
 *           weitere      [{ position, x }]: weitere Noten im selben System,
 *                        je in <g class="note-weitere"> (Höher oder tiefer)
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

    // Fünf Linien
    for (i = 0; i < 5; i++) {
      y = yVon(i * 2);
      teile.push('<line x1="' + LINKS + '" x2="' + RECHTS + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.2"/>');
    }
    // Abschlussstriche links und rechts
    teile.push('<line x1="' + LINKS + '" x2="' + LINKS + '" y1="' + yVon(8) + '" y2="' + yVon(0) + '" stroke="currentColor" stroke-width="1.2"/>');

    var schluessel = optionen.schluessel || (note && note.schluessel) || "violin";
    teile.push(schluessel === "bass" ? BASSSCHLUESSEL : VIOLINSCHLUESSEL);

    if (typeof optionen.falsch === "number" && (!note || optionen.falsch !== note.position)) {
      var fy = yVon(optionen.falsch);
      var fx = optionen.falschX || NOTE_X - 24;
      teile.push('<g class="note-falsch">' + hilfslinien(optionen.falsch, fx) +
        '<ellipse cx="' + fx + '" cy="' + fy + '" rx="6.6" ry="4.6" transform="rotate(-20 ' + fx + " " + fy + ')" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 1.6"/>' +
        '<text x="' + (fx + 8) + '" y="' + (fy - 3) + '" font-size="11" font-weight="700" fill="currentColor">✗</text></g>');
    }

    // Viertelnote samt Hilfslinien an Position p und x-Mitte x
    function viertelnote(p, x) {
      var ny = yVon(p);
      var t = hilfslinien(p, x);
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
      teile.push('<g class="note-weitere">' + viertelnote(w.position, w.x) + "</g>");
    });

    if (note) {
      var p = note.position;
      var ny = yVon(p);
      teile.push('<g class="note-gruppe">');
      teile.push(viertelnote(p, NOTE_X));

      if (optionen.beschriftung) {
        teile.push('<text class="notenname" x="' + (NOTE_X + 22) + '" y="' + (ny + 5.5) + '" font-size="16" font-weight="700" fill="currentColor">' + optionen.beschriftung + "</text>");
      }
      teile.push("</g>");
    }

    // Fester Ausschnitt für den ganzen Übungssatz, damit das System beim
    // Notenwechsel nicht springt. `bereich` = [tiefste, höchste Position].
    var bereich = optionen.bereich || [-3, 11];
    var oben = Math.min(10, yVon(bereich[1]) - (bereich[1] < 4 ? 38 : 8));
    var unten = Math.max(94, yVon(bereich[0]) + (bereich[0] >= 4 ? 38 : 8));
    var breiteGesamt = Math.max(RECHTS + 4, optionen.beschriftung ? NOTE_X + 52 : 0);
    return '<svg class="notensystem-svg' + (optionen.klasse ? " " + optionen.klasse : "") + '" viewBox="0 ' + oben + " " + breiteGesamt + " " + (unten - oben) + '" role="img" aria-label="' +
      ((schluessel === "bass" ? "Bassschlüssel" : "Violinschlüssel") + (optionen.beschriftung ? " mit der Note " + optionen.beschriftung : (note ? " mit einer Note" : ""))) +
      '" xmlns="http://www.w3.org/2000/svg">' + teile.join("") + "</svg>";
  }

  /** Position (0 = unterste Linie) zu einer y-Koordinate, auf ganze Schritte gerundet. */
  function positionVon(y) {
    return Math.round((UNTERSTE_LINIE - y) / (ABSTAND / 2));
  }

  root.Notensystem = { zeichne: zeichne, yVon: yVon, positionVon: positionVon, NOTE_X: NOTE_X_STANDARD };
})(this);
