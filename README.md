# Notenzoo

Ein Browserspiel zum Üben von Noten im Violin- und Bassschlüssel. Im Hauptspiel „Welche Note ist das?“ zeigt das Spiel eine Note im Notensystem, und das Kind tippt den passenden deutschen Notennamen an, zum Beispiel c¹, g oder F. Dazu kommen sieben Mini-Spiele. Für richtige Antworten gibt es Punkte und Sterne, mit gesammelten Sternen kommen neue Tiere dazu.

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

- die Schlüssel: Kästchen für Violinschlüssel und Bassschlüssel, auch beide gleichzeitig. Ein Schlüssel bleibt immer angekreuzt.
- die Noten je Schlüssel: Jede Note ist ein großer Ankreuz-Knopf, eine Reihe pro Oktave. Die Schnellwahl-Knöpfe „Erste Noten“, „1 Oktave“, „2 Oktaven“, „Alle“ und „Keine“ setzen die Häkchen auf einmal; danach kannst du einzelne Noten an- oder abwählen, auch mit Lücken (zum Beispiel nur c¹, e¹ und g¹).
- mit einem Schalter, ob nach der Antwort ein Merktier erscheint

Insgesamt müssen mindestens 3 verschiedene Noten angekreuzt sein, sonst zeigt das Spiel einen Hinweis, und die Spiele starten nicht. Die Einstellungen gelten für alle Spiele und bleiben auf dem Gerät gespeichert. Ältere Einstellungen mit Tonumfang werden automatisch in die passende Notenauswahl übersetzt. Bei beiden Schlüsseln enthalten die Antwortschaltflächen die Noten beider Schlüssel. Umfasst die Auswahl mehrere Oktaven, steht jede Oktave in einer eigenen Reihe: tiefe Noten unten, hohe oben.

Die Notennamen folgen der deutschen Schreibweise mit hochgestellter Oktavziffer: C D E F G A H (große Oktave), c d e f g a h (kleine Oktave), c¹ bis h¹ (c¹ ist das mittlere C), danach c² bis h² und c³. In `js/noten-konfiguration.js` und in den Notenkennungen (zum Beispiel `violin-c1`) steht die Ziffer als normale Ziffer.

## Bereiche und Merktiere anpassen

Alle Anpassungen stehen in der Datei `js/noten-konfiguration.js`. Die Noten selbst musst du nicht pflegen: Das Spiel erzeugt Name, Lage im Notensystem, Hinweis und Merktier aus Schlüssel und Bereich.

- Unter `bereiche` stehen die Tonumfänge je Schlüssel mit Kennung (`id`), Text auf dem Schnellwahl-Knopf (`name`) und tiefster und höchster Note (`von`, `bis`, zum Beispiel `"c1"`). Neue Einträge erscheinen automatisch als Schnellwahl. Zum Ankreuzen stehen alle Noten vom tiefsten bis zum höchsten Bereich des Schlüssels bereit.
- Unter `merktiere` steht das Tier zu jedem Buchstaben. Mit `merktierAb` bekommt ein Buchstabe ab einer bestimmten Note ein anderes Tier.
- Unter `standardEinstellungen` legst du fest, womit das Spiel beim ersten Start beginnt: angekreuzte Schlüssel, je Schlüssel der Bereich, dessen Noten angekreuzt sind, und die Merktiere.

Nach dem Speichern lädst du die Seite neu.

## Merktiere

Nach jeder Antwort zeigt das Spiel das Tier zum Buchstaben der Note, zum Beispiel „d¹ wie Delfin“. Vor der Antwort ist das Tier nicht zu sehen. In den Einstellungen lassen sich die Merktiere ausschalten.

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

Alle Mini-Spiele nutzen die Einstellungen (Schlüssel, Notenauswahl, Merktiere), sammeln Sterne in dieselbe Sammlung und haben eigene Rekorde.

- **Notenflug:** Eine Note fliegt von rechts nach links über das Notensystem. Tippe ihren Namen, bevor sie den Schlüssel erreicht. Zu spät oder falsch kostet einen von drei Sternen, nach dem dritten Fehler ist das Spiel vorbei. Jedes Level hat 10 Noten und ist etwa 15 % schneller als das vorige. Eine richtige Note bringt 10 Punkte mal Level, jedes geschaffte Level einen neuen Stern (höchstens 3).
- **Klaviertasten:** Unter der Note liegt eine Klaviatur von der tiefsten bis zur höchsten gewählten Note (bei Lücken mit allen weißen Tasten dazwischen), das mittlere C ist markiert. Tippe die passende weiße Taste. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Note setzen:** Das Spiel nennt einen Notennamen, zum Beispiel `f1`. Tippe im Notensystem auf die passende Linie oder den Zwischenraum, verschiebe die Note bei Bedarf mit ▲ und ▼ und tippe auf **Prüfen**. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Noten-Memory:** 6 Paare aus Notenkarte und Namenskarte liegen verdeckt. Decke zwei Karten auf und finde die Paare mit möglichst wenigen Zügen: bis 9 Züge gibt es 3 Sterne, bis 13 Züge 2, sonst 1. Hat der Tonumfang weniger als 6 Noten, gibt es entsprechend weniger Paare.
- **Höher oder tiefer:** Zwei Noten stehen nebeneinander im selben System. Tippe die höhere an, oder die tiefere, wenn die Frage „Welche Note ist tiefer?“ lautet; anfangs liegen die Noten weit auseinander, später nur einen Schritt. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Hör-Spiel:** Zum Einstieg erklingt c¹ als Bezugston, dann ein Ton, und du wählst aus drei gezeigten Noten die passende; „Nochmal hören“ spielt den Ton erneut. Der Ton entsteht im Browser, ohne Audiodateien. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Tägliche Notenreise:** Jeden Tag drei Etappen mit je 5 Aufgaben aus „Welche Note ist das?“, „Klaviertasten“, „Note setzen“ und „Höher oder tiefer“; die Auswahl wechselt täglich. Wer alle drei Etappen ohne drei Fehler in einer Etappe schafft, bekommt den Durchschnitt der Etappensterne und einmal pro Tag einen Extrastern; die Startseite zeigt, ob die Reise heute geschafft ist und wie viele Tage in Folge.

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
- `js/modi/notenflug.js`, `js/modi/klaviertasten.js`, `js/modi/note-setzen.js`, `js/modi/noten-memory.js`, `js/modi/hoeher-tiefer.js`, `js/modi/hoer-spiel.js`, `js/modi/notenreise.js`: die Mini-Spiele
- `js/app.js`: Startseite, Ergebnis, Einstellungen, Tiere, Rekorde und Speichern
- `tests/spiel-logik.test.js`: automatische Tests der Spiellogik

Ein weiterer Spielmodus kommt als eigene Datei unter `js/modi/` dazu und meldet sich mit `Modi.registriere(…)` an. Die Beschreibung der Schnittstelle steht am Anfang von `js/modi.js`. Die Datei wird in `index.html` vor `js/app.js` eingebunden.

Die Tests brauchen Node.js ab Version 18 und laufen mit `node --test tests/spiel-logik.test.js`. Für den Betrieb des Spiels sind sie nicht nötig.
