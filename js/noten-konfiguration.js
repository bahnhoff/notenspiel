/*
 * Notenkonfiguration für „Welche Note ist das?“
 * =============================================
 *
 * Hier legst du fest, welche Noten im Spiel abgefragt werden.
 *
 * 1. AKTIVER ÜBUNGSSATZ
 *    Trage bei `aktiverUebungssatz` die Kennung eines Übungssatzes aus
 *    `uebungssaetze` ein. Nur dessen Noten erscheinen im Spiel, und die
 *    Antwortschaltflächen stehen in der dort angegebenen Reihenfolge.
 *
 * 2. ÜBUNGSSÄTZE
 *    Ein Übungssatz besteht aus einem Namen und einer Liste von Notenkennungen.
 *    Du kannst bestehende Sätze ändern oder neue hinzufügen.
 *
 * 3. NOTEN
 *    Jede Note hat:
 *    - id         eindeutige Kennung, zum Beispiel "violin-D4"
 *                 (Schlüssel + Notenname + Oktave, damit gleichnamige Noten in
 *                 anderen Schlüsseln oder Oktaven unterscheidbar bleiben)
 *    - schluessel "violin" (Violinschlüssel; andere Schlüssel sind noch nicht
 *                 umgesetzt)
 *    - position   Lage im Notensystem in Schritten von der untersten Linie aus:
 *                  0 = auf der untersten Linie
 *                  1 = im ersten Zwischenraum von unten
 *                  2 = auf der zweiten Linie von unten   … bis 8 = oberste Linie
 *                 -1 = direkt unter der untersten Linie
 *                 -2 = auf der ersten Hilfslinie unter dem System
 *                 Gerade Zahlen liegen auf einer Linie, ungerade in einem
 *                 Zwischenraum. Hilfslinien zeichnet das Spiel automatisch.
 *    - name       deutscher Notenname auf der Antwortschaltfläche
 *                 (C, D, E, F, G, A, H)
 *    - hinweis    kurzer Satz, der nach einer falschen Antwort erscheint
 *
 * Hinweis: Zwei Noten mit demselben Namen (zum Beispiel C4 und C5) in einem
 * Übungssatz ergeben zwei gleich beschriftete Schaltflächen. Nimm deshalb pro
 * Übungssatz jeden Notennamen nur einmal auf.
 *
 * Nach dem Speichern dieser Datei lädst du die Seite neu.
 */
window.NOTEN_KONFIGURATION = {
  aktiverUebungssatz: "violin-c4-g4",

  uebungssaetze: {
    "violin-c4-g4": {
      name: "Violinschlüssel: C bis G",
      noten: ["violin-C4", "violin-D4", "violin-E4", "violin-F4", "violin-G4"]
    },
    "violin-c4-h4": {
      name: "Violinschlüssel: C bis H",
      noten: [
        "violin-C4", "violin-D4", "violin-E4", "violin-F4",
        "violin-G4", "violin-A4", "violin-H4"
      ]
    }
  },

  noten: [
    {
      id: "violin-C4",
      schluessel: "violin",
      position: -2,
      name: "C",
      hinweis: "Die Note sitzt auf der Hilfslinie unter dem Notensystem."
    },
    {
      id: "violin-D4",
      schluessel: "violin",
      position: -1,
      name: "D",
      hinweis: "Die Note liegt knapp unter der untersten Linie."
    },
    {
      id: "violin-E4",
      schluessel: "violin",
      position: 0,
      name: "E",
      hinweis: "Die Note liegt auf der untersten Linie."
    },
    {
      id: "violin-F4",
      schluessel: "violin",
      position: 1,
      name: "F",
      hinweis: "Die Note liegt im ersten Zwischenraum von unten."
    },
    {
      id: "violin-G4",
      schluessel: "violin",
      position: 2,
      name: "G",
      hinweis: "Die Note liegt auf der zweiten Linie von unten. Um diese Linie kringelt sich der Violinschlüssel."
    },
    {
      id: "violin-A4",
      schluessel: "violin",
      position: 3,
      name: "A",
      hinweis: "Die Note liegt im zweiten Zwischenraum von unten."
    },
    {
      id: "violin-H4",
      schluessel: "violin",
      position: 4,
      name: "H",
      hinweis: "Die Note liegt genau auf der mittleren Linie."
    },
    {
      id: "violin-C5",
      schluessel: "violin",
      position: 5,
      name: "C",
      hinweis: "Die Note liegt im dritten Zwischenraum von unten. Das ist das hohe C."
    }
  ]
};
