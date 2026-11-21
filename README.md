# Welche Note ist das?

Ein Browserspiel zum Üben von Noten im Violinschlüssel. Das Spiel zeigt eine Note im Notensystem, und das Kind tippt den passenden deutschen Notennamen an. Für richtige Antworten gibt es Punkte und Sterne, mit gesammelten Sternen kommen neue Tiere dazu.

Das Spiel ist eine statische Website aus HTML, CSS und JavaScript. Es braucht keinen Server, keinen Build-Schritt, keine Anmeldung und lädt nichts von fremden Diensten. Den Spielstand speichert der Browser lokal im `localStorage`.

## Lokal starten

Für einen schnellen Test öffnest du die Datei `index.html` direkt im Browser.

Wie auf GitHub Pages läuft das Spiel über einen kleinen lokalen Webserver:

```sh
python3 -m http.server 8000
```

Danach öffnest du `http://localhost:8000/` im Browser.

## Auf GitHub Pages veröffentlichen

1. Lade das Repository mit dem Branch `main` auf GitHub hoch.
2. Öffne im Repository **Settings → Pages**.
3. Wähle unter **Build and deployment** bei **Source** die Option **Deploy from a branch**.
4. Wähle den Branch **main** und den Ordner **/ (root)** und klicke auf **Save**.

Nach ein bis zwei Minuten ist das Spiel unter `https://<owner>.github.io/<repo>/` erreichbar. Alle Pfade sind relativ, deshalb funktioniert das Spiel auch in diesem Unterverzeichnis. Weitere Informationen findest du in der [Dokumentation zu GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Übungssatz ändern

Die Noten stehen in der Datei `js/noten-konfiguration.js`.

- Den aktiven Übungssatz wählst du mit `aktiverUebungssatz`. Voreingestellt ist `"violin-c4-g4"` mit C, D, E, F und G. Als zweiter Satz ist `"violin-c4-h4"` mit C bis H vorbereitet.
- Unter `uebungssaetze` legst du fest, welche Noten zu einem Satz gehören. Die Reihenfolge der Liste ist auch die Reihenfolge der Antwortschaltflächen.
- Unter `noten` steht jede Note mit Kennung (`id`), Schlüssel (`schluessel`), Position im Notensystem (`position`), deutschem Namen (`name`) und Hinweis (`hinweis`). Die Position zählt in Schritten von der untersten Linie aus: `0` ist die unterste Linie, `1` der erste Zwischenraum, `-1` direkt unter dem System und `-2` die erste Hilfslinie unten.

Ein Beispiel: Für einen Satz mit E, F und G trägst du einen neuen Eintrag unter `uebungssaetze` ein und setzt `aktiverUebungssatz` auf dessen Kennung.

```js
aktiverUebungssatz: "nur-e-f-g",
uebungssaetze: {
  "nur-e-f-g": { name: "E, F und G", noten: ["violin-E4", "violin-F4", "violin-G4"] },
  // …
}
```

Nach dem Speichern lädst du die Seite neu. Nimm pro Übungssatz jeden Notennamen nur einmal auf, sonst entstehen zwei gleich beschriftete Schaltflächen. In dieser Version zeichnet das Spiel nur den Violinschlüssel.

## Spielregeln

- Eine Runde hat 10 Aufgaben und beginnt mit 0 Punkten und 3 Sternen.
- Eine richtige Antwort bringt 10 Punkte. Bei einem Fehler erlischt ein Stern, und das Spiel zeigt die richtige Antwort mit einem Hinweis.
- Eine falsch beantwortete Note kommt nach zwei bis drei anderen Noten noch einmal. Fehlt dafür der Platz, kommt sie in der nächsten Runde früh dran.
- Nach 10 Aufgaben gibt es 10 Bonuspunkte pro verbliebenem Stern, und die Sterne kommen in die Sammlung.
- Der dritte Fehler beendet die Runde ohne Bonus und ohne neue Sterne. Die Punkte zählen für die Rekorde.
- Ab 5 gesammelten Sternen kommt das Häschen dazu, ab 10 das Kätzchen.

## Dateien

- `index.html`: die Seite mit allen Ansichten
- `css/style.css`: die Gestaltung
- `js/noten-konfiguration.js`: die Noten und Übungssätze
- `js/spiel-logik.js`: Regeln, Wertung, Wiederholungen, Rekorde und Tiere
- `js/notensystem.js`: das Notensystem mit Violinschlüssel
- `js/tiere.js`: die Tierzeichnungen
- `js/app.js`: die Bedienung und das Speichern
- `tests/spiel-logik.test.js`: automatische Tests der Spiellogik

Die Tests brauchen Node.js ab Version 18 und laufen mit `node --test tests/spiel-logik.test.js`. Für den Betrieb des Spiels sind sie nicht nötig.
