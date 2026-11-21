/*
 * Zeichnet ein Notensystem mit Violinschlüssel und einer Viertelnote als SVG.
 * Alle Teile liegen in einem gemeinsamen Koordinatensystem und skalieren
 * deshalb gemeinsam.
 */
(function (root) {
  "use strict";

  var ABSTAND = 10;           // Linienabstand
  var UNTERSTE_LINIE = 72;    // y der untersten Linie
  var LINKS = 4;
  var RECHTS = 146;
  var NOTE_X = 98;

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

  function zeichne(note, optionen) {
    optionen = optionen || {};
    var teile = [];
    var i, y;

    // Fünf Linien
    for (i = 0; i < 5; i++) {
      y = yVon(i * 2);
      teile.push('<line x1="' + LINKS + '" x2="' + RECHTS + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.2"/>');
    }
    // Abschlussstriche links und rechts
    teile.push('<line x1="' + LINKS + '" x2="' + LINKS + '" y1="' + yVon(8) + '" y2="' + yVon(0) + '" stroke="currentColor" stroke-width="1.2"/>');

    teile.push(VIOLINSCHLUESSEL);

    if (note) {
      var p = note.position;
      var ny = yVon(p);
      // Hilfslinien unter und über dem System
      for (i = -2; i >= p; i -= 2) {
        y = yVon(i);
        teile.push('<line class="hilfslinie" x1="' + (NOTE_X - 13) + '" x2="' + (NOTE_X + 13) + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.4"/>');
      }
      for (i = 10; i <= p; i += 2) {
        y = yVon(i);
        teile.push('<line class="hilfslinie" x1="' + (NOTE_X - 13) + '" x2="' + (NOTE_X + 13) + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-width="1.4"/>');
      }
      // Notenhals: unterhalb der Mittellinie nach oben rechts, sonst nach unten links
      var halsLaenge = 35;
      if (p < 4) {
        teile.push('<line x1="' + (NOTE_X + 5.9) + '" x2="' + (NOTE_X + 5.9) + '" y1="' + (ny - 1) + '" y2="' + (ny - halsLaenge) + '" stroke="currentColor" stroke-width="1.5"/>');
      } else {
        teile.push('<line x1="' + (NOTE_X - 5.9) + '" x2="' + (NOTE_X - 5.9) + '" y1="' + (ny + 1) + '" y2="' + (ny + halsLaenge) + '" stroke="currentColor" stroke-width="1.5"/>');
      }
      // Notenkopf (schwarze Viertelnote)
      teile.push('<ellipse class="notenkopf" cx="' + NOTE_X + '" cy="' + ny + '" rx="6.6" ry="4.6" transform="rotate(-20 ' + NOTE_X + " " + ny + ')" fill="currentColor"/>');

      if (optionen.beschriftung) {
        teile.push('<text class="notenname" x="' + (NOTE_X + 22) + '" y="' + (ny + 5.5) + '" font-size="16" font-weight="700" fill="currentColor">' + optionen.beschriftung + "</text>");
      }
    }

    // Fester Ausschnitt für den ganzen Übungssatz, damit das System beim
    // Notenwechsel nicht springt. `bereich` = [tiefste, höchste Position].
    var bereich = optionen.bereich || [-3, 11];
    var oben = Math.min(10, yVon(bereich[1]) - (bereich[1] < 4 ? 38 : 8));
    var unten = Math.max(94, yVon(bereich[0]) + (bereich[0] >= 4 ? 38 : 8));
    return '<svg class="notensystem-svg" viewBox="0 ' + oben + " 150 " + (unten - oben) + '" role="img" aria-label="' +
      (optionen.beschriftung ? "Notensystem mit der Note " + optionen.beschriftung : "Notensystem mit einer Note") +
      '" xmlns="http://www.w3.org/2000/svg">' + teile.join("") + "</svg>";
  }

  root.Notensystem = { zeichne: zeichne, yVon: yVon };
})(this);
