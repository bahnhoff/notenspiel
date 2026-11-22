/*
 * Anpassungen für den Notenzoo
 * ============================
 *
 * Die Noten selbst musst du nicht von Hand pflegen. Das Spiel erzeugt sie aus
 * Schlüssel und Bereich: Name, Lage im Notensystem, Hinweis und Merktier.
 *
 * Notennamen (deutsch, Helmholtz):
 *   C D E F G A H         große Oktave
 *   c d e f g a h         kleine Oktave
 *   c¹ d¹ … h¹            eingestrichene Oktave (c¹ = mittleres C)
 *   c² … h², c³           zwei- und dreigestrichene Oktave
 * Das Spiel zeigt die Oktavziffer hochgestellt (c¹). In dieser Datei
 * schreibst du sie als normale Ziffer: "c1", "c2", "c3".
 *
 * 1. BEREICHE
 *    Pro Schlüssel eine Liste von Tonumfängen. In den Einstellungen wählt
 *    man die Noten einzeln; die Bereiche erscheinen dort als Schnellwahl-
 *    Knöpfe, die die passenden Häkchen setzen. Zur Auswahl stehen alle Noten
 *    vom tiefsten bis zum höchsten Bereich des Schlüssels. Jeder Eintrag hat:
 *    - id    Kennung (für die Standard-Einstellungen und alte Spielstände)
 *    - name  Text auf dem Schnellwahl-Knopf
 *    - von   tiefste Note, zum Beispiel "c1"
 *    - bis   höchste Note, zum Beispiel "g1"
 *    Im Violinschlüssel liegt e1 auf der untersten Linie, im Bassschlüssel G.
 *
 * 2. MERKTIERE
 *    Nach der Antwort erscheint ein Tier zum Buchstaben der Note, zum Beispiel
 *    „d¹ wie Delfin“. Die Oktave spielt keine Rolle. Mit `merktierAb` bekommt
 *    ein Buchstabe ab einer bestimmten Note ein anderes Tier (hohes F = Fuchs).
 *    Verfügbare Merktiere: chamaeleon, delfin, elefant, frosch, fuchs,
 *    giraffe, affe, hase.
 *
 * 3. STANDARD-EINSTELLUNGEN
 *    Gelten beim ersten Start. Danach merkt sich das Spiel die Auswahl aus
 *    der Ansicht „Einstellungen“.
 *    - schluessel  angekreuzte Schlüssel: ["violin"], ["bass"] oder ["violin", "bass"]
 *    - bereich     Kennung des Bereichs je Schlüssel, dessen Noten zu Beginn
 *                  angekreuzt sind
 *    - merktiere   true (an) oder false (aus)
 *
 * Nach dem Speichern dieser Datei lädst du die Seite neu.
 */
window.NOTEN_KONFIGURATION = {
  bereiche: {
    violin: [
      { id: "erste", name: "Erste Noten", von: "c1", bis: "g1" },
      { id: "oktave1", name: "1 Oktave", von: "c1", bis: "c2" },
      { id: "oktave2", name: "2 Oktaven", von: "c1", bis: "c3" }
    ],
    bass: [
      { id: "erste", name: "Erste Noten", von: "c", bis: "g" },
      { id: "oktave1", name: "1 Oktave", von: "c", bis: "c1" },
      { id: "oktave2", name: "2 Oktaven", von: "C", bis: "c1" }
    ]
  },

  merktiere: {
    c: "chamaeleon",
    d: "delfin",
    e: "elefant",
    f: "frosch",
    g: "giraffe",
    a: "affe",
    h: "hase"
  },

  merktierAb: {
    f: { ab: "f2", tier: "fuchs" }
  },

  standardEinstellungen: {
    schluessel: ["violin"],
    bereich: { violin: "erste", bass: "erste" },
    merktiere: true
  }
};
