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
 * Noten mit Vorzeichen: cis dis fis gis ais (Kreuz) und des es ges as b
 * (B-Vorzeichen; „b“ ist das h mit B, H bleibt H). Große Oktave mit großem
 * Anfangsbuchstaben: Fis, Es, B. In den Einstellungen stehen sie je Oktave
 * in eigenen Zeilen „mit ♯“ und „mit ♭“ und sind zu Beginn nicht gewählt.
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
 *    - nameEnglisch  derselbe Text auf Englisch (fehlt er, gilt `name`)
 *    - von   tiefste Note, zum Beispiel "c1"
 *    - bis   höchste Note, zum Beispiel "g1"
 *    Im Violinschlüssel liegt e1 auf der untersten Linie, im Bassschlüssel G.
 *
 * 2. MERKTIERE
 *    Nach der Antwort erscheint ein Tier zum Buchstaben der Note, zum Beispiel
 *    „d¹ wie Delfin“. Die Oktave spielt keine Rolle. Mit `merktierAb` bekommt
 *    ein Buchstabe ab einer bestimmten Note ein anderes Tier (hohes F = Fuchs).
 *    Eine Vorzeichen-Note kann ein eigenes Tier haben (fis = Fisch), sonst
 *    gilt das Tier des Stammtons: „cis¹ – C wie Chamäleon, nur einen Halbton höher“.
 *    Auf Englisch gelten eigene Merktiere (`merktiereEnglisch`,
 *    `merktierAbEnglisch`), passend zu den englischen Namen: „D4 – D is for
 *    Dolphin“, „C♯4 – C is for Cat, just a half step higher“. Englisch heißt
 *    das h „B“ (B is for Bear). Die Schlüssel bleiben die deutschen Buchstaben.
 *    Verfügbare Merktiere: chamaeleon, delfin, elefant, frosch, fuchs,
 *    giraffe, affe, hase, fisch, katze, baer, alligator.
 *
 * 2a. MERKSPRÜCHE (Karte „Merkspruch“ im Notenflug)
 *    Je Schlüssel ein Spruch für die Linien und einer für die Zwischenräume,
 *    auf Deutsch (`de`) und Englisch (`en`). Buchstaben zwischen Sternchen
 *    erscheinen fett, zum Beispiel "*E*s *g*eht": Sie ergeben die Noten.
 *
 * 3. STANDARD-EINSTELLUNGEN
 *    Gelten beim ersten Start. Danach merkt sich das Spiel die Auswahl aus
 *    der Ansicht „Einstellungen“.
 *    - schluessel  angekreuzte Schlüssel: ["violin"], ["bass"] oder ["violin", "bass"]
 *    - bereich     Kennung des Bereichs je Schlüssel, dessen Noten zu Beginn
 *                  angekreuzt sind
 *    - merktiere   true (an) oder false (aus)
 *    - antwortmodus  "einfach" (Antwortknöpfe nur mit Buchstaben, jede Oktave
 *                  zählt) oder "genau" (Knöpfe mit Oktave, zum Beispiel c¹)
 *
 * Nach dem Speichern dieser Datei lädst du die Seite neu.
 */
window.NOTEN_KONFIGURATION = {
  bereiche: {
    violin: [
      { id: "erste", name: "Erste Noten", nameEnglisch: "First notes", von: "c1", bis: "g1" },
      { id: "oktave1", name: "1 Oktave", nameEnglisch: "1 octave", von: "c1", bis: "c2" },
      { id: "oktave2", name: "2 Oktaven", nameEnglisch: "2 octaves", von: "c1", bis: "c3" }
    ],
    bass: [
      { id: "erste", name: "Erste Noten", nameEnglisch: "First notes", von: "c", bis: "g" },
      { id: "oktave1", name: "1 Oktave", nameEnglisch: "1 octave", von: "c", bis: "c1" },
      { id: "oktave2", name: "2 Oktaven", nameEnglisch: "2 octaves", von: "C", bis: "c1" }
    ]
  },

  merktiere: {
    c: "chamaeleon",
    d: "delfin",
    e: "elefant",
    f: "frosch",
    g: "giraffe",
    a: "affe",
    h: "hase",
    fis: "fisch"
  },

  merktierAb: {
    f: { ab: "f2", tier: "fuchs" }
  },

  // Englische Merktiere: C Cat, D Dolphin, E Elephant, F Frog (ab F5 Fox),
  // G Giraffe, A Alligator, B Bear (deutsch h), F♯ Fish.
  merktiereEnglisch: {
    c: "katze",
    d: "delfin",
    e: "elefant",
    f: "frosch",
    g: "giraffe",
    a: "alligator",
    h: "baer",
    fis: "fisch"
  },

  merktierAbEnglisch: {
    f: { ab: "f2", tier: "fuchs" }
  },

  merksprueche: {
    violin: {
      linien: { de: "*E*s *g*eht *h*urtig *d*urch *F*leiß", en: "*E*very *G*ood *B*oy *D*oes *F*ine" },
      raeume: { de: "*F*ünf *A*ffen *c*hillen *e*infach", en: "*F*-*A*-*C*-*E* spells FACE" }
    },
    bass: {
      linien: { de: "*G*eh, *h*ol *d*och *f*rische *Ä*pfel", en: "*G*ood *B*oys *D*o *F*ine *A*lways" },
      raeume: { de: "*A*lle *C*lowns *e*ssen *g*ern", en: "*A*ll *C*ows *E*at *G*rass" }
    }
  },

  standardEinstellungen: {
    schluessel: ["violin"],
    bereich: { violin: "erste", bass: "erste" },
    merktiere: true,
    antwortmodus: "einfach"
  }
};
