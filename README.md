# Notenzoo

Ein Browserspiel zum Üben von Noten im Violin- und Bassschlüssel. Im Hauptspiel „Welche Note ist das?“ zeigt das Spiel eine Note im Notensystem, und das Kind tippt den passenden deutschen Notennamen an, zum Beispiel `c1`, `g` oder `F`. Dazu kommen vier Mini-Spiele. Für richtige Antworten gibt es Punkte und Sterne, mit gesammelten Sternen kommen neue Tiere dazu.

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

## Einstellungen

Unter **Einstellungen** auf der Startseite wählst du:

- den Schlüssel: Violinschlüssel, Bassschlüssel oder beide gemischt
- den Tonumfang je Schlüssel, zum Beispiel „Erste Noten: c1 bis g1“, „1 Oktave: c1 bis c2“ oder „2 Oktaven: C bis c1“
- ob nach der Antwort ein Merktier erscheint

Die Einstellungen gelten für alle Spiele und bleiben auf dem Gerät gespeichert. Bei gemischten Schlüsseln enthalten die Antwortschaltflächen die Noten beider Bereiche. Umfasst die Auswahl mehrere Oktaven, steht jede Oktave in einer eigenen Reihe: tiefe Noten unten, hohe oben.

Die Notennamen folgen der deutschen Schreibweise: `C D E F G A H` (große Oktave), `c d e f g a h` (kleine Oktave), `c1` bis `h1` (c1 ist das mittlere C), danach `c2` und `c3`.

## Bereiche und Merktiere anpassen

Alle Anpassungen stehen in der Datei `js/noten-konfiguration.js`. Die Noten selbst musst du nicht pflegen: Das Spiel erzeugt Name, Lage im Notensystem, Hinweis und Merktier aus Schlüssel und Bereich.

- Unter `bereiche` stehen die Tonumfänge je Schlüssel mit Kennung (`id`), Anzeigetext (`name`) und tiefster und höchster Note (`von`, `bis`). Neue Einträge erscheinen automatisch in den Einstellungen.
- Unter `merktiere` steht das Tier zu jedem Buchstaben. Mit `merktierAb` bekommt ein Buchstabe ab einer bestimmten Note ein anderes Tier.
- Unter `standardEinstellungen` legst du fest, womit das Spiel beim ersten Start beginnt.

Nach dem Speichern lädst du die Seite neu.

## Merktiere

Nach jeder Antwort zeigt das Spiel das Tier zum Buchstaben der Note, zum Beispiel „d1 wie Delfin“. Vor der Antwort ist das Tier nicht zu sehen. In den Einstellungen lassen sich die Merktiere ausschalten.

- c: Chamäleon
- d: Delfin
- e: Elefant
- f: Frosch, ab f2 Fuchs
- g: Giraffe
- a: Affe
- h: Hase

## Meine Tiere

Das Füchschen ist von Anfang an da. Alle 5 gesammelten Sterne kommt ein zufälliges neues Tier dazu, insgesamt gibt es 25. Die seltenen Tiere Einhorn, Drache und Phönix kommen erst ab 50 gesammelten Sternen in den Zufallstopf. Noch nicht entdeckte Tiere erscheinen als dunkle Silhouette. Jedes entdeckte Tier lässt sich als Begleiter auswählen.

## Rekorde und Namen

Das Spiel führt für jedes Spiel die fünf besten Ergebnisse. Schafft ein Ergebnis die Top 5, fragt der Ergebnisbildschirm „Wer hat gespielt?“. Zuletzt benutzte Namen stehen als Schnellwahl bereit, der zuletzt gewählte ist vorausgewählt. Wer keinen Namen eintragen möchte, tippt auf „Ohne Namen“. Die Namen liegen nur im Browser des Geräts. Sterne und Tiere gehören allen Kindern auf dem Gerät gemeinsam.

## Spielregeln „Welche Note ist das?“

- Eine Runde hat 10 Aufgaben und beginnt mit 0 Punkten und 3 Sternen.
- Eine richtige Antwort bringt 10 Punkte. Bei einem Fehler erlischt ein Stern, und das Spiel zeigt die richtige Antwort mit einem Hinweis.
- Eine falsch beantwortete Note kommt nach zwei bis drei anderen Noten noch einmal. Fehlt dafür der Platz, kommt sie in der nächsten Runde früh dran.
- Nach 10 Aufgaben gibt es 10 Bonuspunkte pro verbliebenem Stern, und die Sterne kommen in die Sammlung.
- Der dritte Fehler beendet die Runde ohne Bonus und ohne neue Sterne. Die Punkte zählen für die Rekorde.
- Alle 5 gesammelten Sterne kommt ein neues Tier dazu.

## Mini-Spiele

Alle Mini-Spiele nutzen die Einstellungen (Schlüssel, Tonumfang, Merktiere), sammeln Sterne in dieselbe Sammlung und haben eigene Rekorde.

- **Notenflug:** Eine Note fliegt von rechts nach links über das Notensystem. Tippe ihren Namen, bevor sie den Schlüssel erreicht. Zu spät oder falsch kostet einen von drei Sternen, nach dem dritten Fehler ist das Spiel vorbei. Jedes Level hat 10 Noten und ist etwa 15 % schneller als das vorige. Eine richtige Note bringt 10 Punkte mal Level, jedes geschaffte Level einen neuen Stern (höchstens 3).
- **Klaviertasten:** Unter der Note liegt eine Klaviatur über den gewählten Tonumfang, das mittlere C ist markiert. Tippe die passende weiße Taste. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Note setzen:** Das Spiel nennt einen Notennamen, zum Beispiel `f1`. Tippe im Notensystem auf die passende Linie oder den Zwischenraum, verschiebe die Note bei Bedarf mit ▲ und ▼ und tippe auf **Prüfen**. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Noten-Memory:** 6 Paare aus Notenkarte und Namenskarte liegen verdeckt. Decke zwei Karten auf und finde die Paare mit möglichst wenigen Zügen: bis 9 Züge gibt es 3 Sterne, bis 13 Züge 2, sonst 1. Hat der Tonumfang weniger als 6 Noten, gibt es entsprechend weniger Paare.

Ältere Spielstände bleiben erhalten: Sterne und Rekorde zählen weiter, Häschen und Kätzchen bleiben, fehlende Tiere ergänzt das Spiel einmalig nach Sternzahl.

## Dateien

- `index.html`: die Seite mit allen Ansichten
- `css/style.css`: die Gestaltung
- `js/noten-konfiguration.js`: Bereiche, Merktiere und Standard-Einstellungen
- `js/noten.js`: erzeugt Noten, Namen, Positionen und Hinweise
- `js/spiel-logik.js`: Regeln, Wertung, Wiederholungen, Rekorde, Tiersammlung und Spielstand
- `js/notensystem.js`: das Notensystem mit Violin- und Bassschlüssel
- `js/tiere.js`: die Tierzeichnungen
- `js/modi.js`: die gemeinsame Schnittstelle für Spielmodi
- `js/modi/klassisch.js`: das Spiel „Welche Note ist das?“
- `js/modi/notenflug.js`, `js/modi/klaviertasten.js`, `js/modi/note-setzen.js`, `js/modi/noten-memory.js`: die Mini-Spiele
- `js/app.js`: Startseite, Ergebnis, Einstellungen, Tiere, Rekorde und Speichern
- `tests/spiel-logik.test.js`: automatische Tests der Spiellogik

Ein weiterer Spielmodus kommt als eigene Datei unter `js/modi/` dazu und meldet sich mit `Modi.registriere(…)` an. Die Beschreibung der Schnittstelle steht am Anfang von `js/modi.js`. Die Datei wird in `index.html` vor `js/app.js` eingebunden.

Die Tests brauchen Node.js ab Version 18 und laufen mit `node --test tests/spiel-logik.test.js`. Für den Betrieb des Spiels sind sie nicht nötig.
