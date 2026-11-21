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
 *   c1 d1 … h1            eingestrichene Oktave (c1 = mittleres C)
 *   c2 … h2, c3           zwei- und dreigestrichene Oktave
 *
 * 1. BEREICHE
 *    Pro Schlüssel eine Liste von Tonumfängen, die in den Einstellungen zur
 *    Wahl stehen. Jeder Eintrag hat:
 *    - id    Kennung, wird im Spielstand gespeichert (nicht nachträglich ändern)
 *    - name  Text in den Einstellungen
 *    - von   tiefste Note, zum Beispiel "c1"
 *    - bis   höchste Note, zum Beispiel "g1"
 *    Im Violinschlüssel liegt e1 auf der untersten Linie, im Bassschlüssel G.
 *
 * 2. MERKTIERE
 *    Nach der Antwort erscheint ein Tier zum Buchstaben der Note, zum Beispiel
 *    „d1 wie Delfin“. Die Oktave spielt keine Rolle. Mit `merktierAb` bekommt
 *    ein Buchstabe ab einer bestimmten Note ein anderes Tier (hohes F = Fuchs).
 *    Verfügbare Merktiere: chamaeleon, delfin, elefant, frosch, fuchs,
 *    giraffe, affe, hase.
 *
 * 3. STANDARD-EINSTELLUNGEN
 *    Gelten beim ersten Start. Danach merkt sich das Spiel die Auswahl aus
 *    der Ansicht „Einstellungen“.
 *    - schluessel  "violin", "bass" oder "beide"
 *    - bereich     Kennung des Bereichs je Schlüssel
 *    - merktiere   true (an) oder false (aus)
 *
 * Nach dem Speichern dieser Datei lädst du die Seite neu.
 */
window.NOTEN_KONFIGURATION = {
  bereiche: {
    violin: [
      { id: "erste", name: "Erste Noten: c1 bis g1", von: "c1", bis: "g1" },
      { id: "oktave1", name: "1 Oktave: c1 bis c2", von: "c1", bis: "c2" },
      { id: "oktave2", name: "2 Oktaven: c1 bis c3", von: "c1", bis: "c3" }
    ],
    bass: [
      { id: "erste", name: "Erste Noten: c bis g", von: "c", bis: "g" },
      { id: "oktave1", name: "1 Oktave: c bis c1", von: "c", bis: "c1" },
      { id: "oktave2", name: "2 Oktaven: C bis c1", von: "C", bis: "c1" }
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
    schluessel: "violin",
    bereich: { violin: "erste", bass: "erste" },
    merktiere: true
  }
};
