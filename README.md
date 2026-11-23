# Notenzoo

Ein Browserspiel zum Üben von Noten im Violin- und Bassschlüssel. Im Hauptspiel „Welche Note ist das?“ (auf der Startseite der große Knopf **Noten üben** mit Aufgabenzahl und Notenbereich, zum Beispiel „10 Aufgaben · C bis G“) zeigt das Spiel eine Note im Notensystem, und das Kind tippt den passenden deutschen Notennamen an, zum Beispiel c¹, g oder F. Dazu kommen acht Mini-Spiele. Für richtige Antworten gibt es Punkte und Sterne, mit gesammelten Sternen kommen neue Tiere dazu.

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

## Sprache: Deutsch und Englisch

Oben rechts auf der Startseite schaltet der Knopf **DE | EN** zwischen Deutsch und Englisch um. Der Wechsel übersetzt sofort alle Texte, ohne Neuladen. Den Knopf gibt es nur auf der Startseite, damit keine Runde mitten im Spiel die Sprache wechselt. Beim ersten Start gilt die Sprache des Browsers (beginnt sie mit „de“, Deutsch, sonst Englisch), danach die gemerkte Wahl. Die Sprache steht im Spielstand; ältere Spielstände bleiben gültig.

Auf Englisch heißt das Spiel **Note Zoo**. Die Notennamen folgen der amerikanischen, wissenschaftlichen Schreibweise: Großbuchstabe, Vorzeichen als ♯ oder ♭, Oktave als normale Ziffer. Das mittlere C ist C4, darunter C3 und C2, darüber C5. Deutsch H heißt englisch B, deutsch B heißt B♭; fis¹ ist F♯4, es² ist E♭5. Bei **Easy** (Einfach) heißen die Knöpfe zum Beispiel C, C♯, D, E♭ bis B.

Gespeicherte Notenauswahl, Rekorde und Wiederholungslisten nutzen sprachunabhängige Kennungen (`violin-c1`). Ein Sprachwechsel ändert daran nichts.

Alle sichtbaren Texte beider Sprachen stehen in `js/texte.js`. HTML-Elemente tragen den Textschlüssel im Attribut `data-text` (oder `data-text-aria-label`), JavaScript holt Texte mit `Texte.t("schluessel", { platzhalter })`.

## Einstellungen

Unter **Einstellungen** auf der Startseite wählst du:

- die Antworten mit zwei großen Knöpfen: **Einfach** (Standard) zeigt als Antwortknöpfe nur die Buchstaben C D E F G A H, die in der Notenauswahl vorkommen, und jede Oktave des richtigen Buchstabens zählt. Die Rückmeldung nennt danach den genauen Namen, zum Beispiel „Genau, das ist d²!“. **Genau** zeigt die Knöpfe mit Oktave (c¹, d² …). Bei „Klaviertasten“ zählt im einfachen Modus jede Taste mit dem richtigen Buchstaben, bei „Note setzen“ steht nur der Buchstabe da und jede passende Stelle zählt, beim „Noten-Memory“ zeigen die Namenskarten nur Buchstaben, jeder Buchstabe kommt höchstens einmal vor. Das „Hör-Spiel“ bleibt gleich. Ältere Spielstände starten mit **Einfach**.
- die Schlüssel: Kästchen für Violinschlüssel und Bassschlüssel, auch beide gleichzeitig. Ein Schlüssel bleibt immer angekreuzt.
- die Noten je Schlüssel: Jede Note ist ein großer Ankreuz-Knopf, eine Reihe pro Oktave. Die Schnellwahl-Knöpfe „Erste Noten“, „1 Oktave“, „2 Oktaven“, „Alle“ und „Keine“ setzen die Häkchen auf einmal; danach kannst du einzelne Noten an- oder abwählen, auch mit Lücken (zum Beispiel nur c¹, e¹ und g¹).
- Noten mit Vorzeichen: Unter den Stammtönen jeder Oktave stehen abgesetzte Zeilen „mit ♯“ (cis, dis, fis, gis, ais) und „mit ♭“ (des, es, ges, as, b). Deutsch heißt das h mit B-Vorzeichen „b“, H bleibt H; in der großen Oktave schreibt man Fis, Es, B. Zu Beginn ist keine Vorzeichen-Note gewählt. Die Schnellwahl setzt nur die Stammtöne, „Keine“ entfernt auch die Vorzeichen-Noten.
- mit einem Schalter, ob nach der Antwort ein Merktier erscheint

Es braucht mindestens 3 verschiedene Antworten, sonst zeigt das Spiel einen Hinweis, und die Spiele starten nicht: bei **Einfach** 3 verschiedene Buchstaben (c¹ und c² sind beide ein C, Fis oder Es zählen extra), bei **Genau** 3 verschiedene Noten. Die Einstellungen gelten für alle Spiele und bleiben auf dem Gerät gespeichert. Ältere Einstellungen mit Tonumfang werden automatisch in die passende Notenauswahl übersetzt. Bei beiden Schlüsseln enthalten die Antwortschaltflächen die Noten beider Schlüssel. Umfasst die Auswahl mehrere Oktaven, steht jede Oktave in einer eigenen Reihe: tiefe Noten unten, hohe oben.

Die Notennamen folgen der deutschen Schreibweise mit hochgestellter Oktavziffer: C D E F G A H (große Oktave), c d e f g a h (kleine Oktave), c¹ bis h¹ (c¹ ist das mittlere C), danach c² bis h² und c³. In `js/noten-konfiguration.js` und in den Notenkennungen (zum Beispiel `violin-c1`, `violin-fis1`, `bass-B`) steht die Ziffer als normale Ziffer.

Vorzeichen-Noten zeigt das Notensystem mit einem Kreuz oder B vor dem Notenkopf. Als Antwort zählt der Name, nicht der Klang: fis und ges sind verschiedene Antworten. Bei **Einfach** heißen die Knöpfe zum Beispiel C, D, Es, E, F, Fis, G. Nur bei „Klaviertasten“ (dieselbe schwarze Taste) und im „Hör-Spiel“ zählt der Klang; gleich klingende Noten kommen dort nicht zusammen vor.

## Bereiche und Merktiere anpassen

Alle Anpassungen stehen in der Datei `js/noten-konfiguration.js`. Die Noten selbst musst du nicht pflegen: Das Spiel erzeugt Name, Lage im Notensystem, Hinweis und Merktier aus Schlüssel und Bereich.

- Unter `bereiche` stehen die Tonumfänge je Schlüssel mit Kennung (`id`), Text auf dem Schnellwahl-Knopf (`name`, auf Englisch `nameEnglisch`) und tiefster und höchster Note (`von`, `bis`, zum Beispiel `"c1"`). Neue Einträge erscheinen automatisch als Schnellwahl. Zum Ankreuzen stehen alle Noten vom tiefsten bis zum höchsten Bereich des Schlüssels bereit.
- Unter `merktiere` steht das Tier zu jedem Buchstaben. Mit `merktierAb` bekommt ein Buchstabe ab einer bestimmten Note ein anderes Tier.
- Unter `standardEinstellungen` legst du fest, womit das Spiel beim ersten Start beginnt: angekreuzte Schlüssel, je Schlüssel der Bereich, dessen Noten angekreuzt sind, die Merktiere und der Antwortmodus (`"einfach"` oder `"genau"`).

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
- fis: Fisch. Andere Vorzeichen-Noten bekommen das Tier des Stammtons, zum Beispiel „cis¹ – C wie Chamäleon, nur einen Halbton höher“.

Auf Englisch gelten eigene Merktiere, passend zu den englischen Namen (`merktiereEnglisch` und `merktierAbEnglisch` in `js/noten-konfiguration.js`): C Cat, D Dolphin, E Elephant, F Frog (ab F5 Fox), G Giraffe, A Alligator, B Bear, F♯ Fish. Die Merkhilfe lautet dann zum Beispiel „D4 – D is for Dolphin“ oder „C♯4 – C is for Cat, just a half step higher“.

## Startseite

Ganz oben steht der Hauptknopf **Noten üben** für „Welche Note ist das?“ mit einer Zeile wie „10 Aufgaben · C bis G“; der Bereich kommt aus der Notenauswahl. Direkt darunter steht die **Tägliche Notenreise** als eigene Karte mit „3 Spiele à 5 Aufgaben“ und dem Stand (heute geschafft, Tage in Folge). Die übrigen Spiele folgen als Kacheln unter „Mehr Spiele“: Symbol im getönten Kästchen, Name und eine kurze Unterzeile (Texte `kachel.<Kennung>` in `js/texte.js`; auf schmalen Handys ausgeblendet). Alle Elemente stehen in einer gemeinsamen Spalte von höchstens 440 Pixel Breite. Die Gestaltung folgt dem Stitch-Entwurf „Main Screen (Faithful Redesign)“.

Schrift ist Nunito Sans (SIL Open Font License), lokal als `fonts/nunito-sans-latin.woff2`, damit die Seite keine fremden Server anfragt.

Auch alle übrigen Seiten folgen im Stil den Stitch-Entwürfen (Projekt „Modern Note Learning App“); Aufbau und Abläufe sind geblieben. Gemeinsame Bausteine in `css/style.css`:

- Kopfzeile der Spiele: Zurück-Knopf, darüber klein „AUFGABE 3 VON 10“ und die Überschrift, rechts Sterne in Gold und Punkte als Pille. Ab 700 Pixel steht alles in einer Reihe mit fester Mitte, auf dem Handy die Überschrift unter Zurück und Stand.
- Notensystem als weiße Karte mit weichem Schatten (`--schatten-weich`), Antworttasten mit fühlbarer Unterkante (`--schatten-taste`), Klaviatur in einer beigen Mulde, ab Tabletbreite in einer weißen Karte.
- Ergebnis und Ende von „Fehler üben“ als große weiße Karte, Werte als Kacheln, Gesamtpunktzahl golden.
- Notenflug mit hellem Himmel hinter dem System, Hör-Spiel mit Ziffernschild 1 bis 3 auf Geräten mit Tastatur, Rekorde mit dem Spielsymbol vor jeder Liste.

Spielkacheln, Notenreise und die Knöpfe **Meine Tiere**, **Rekorde**, **Einstellungen**, **Rekord speichern** und **Fehler üben** zeigen gezeichnete Symbole statt Emojis, im Stil der Tiere: warme Farben und dunkelbraune, runde Umrisse. So sehen sie auf jedem Gerät gleich aus. Die Zeichnungen stehen in `js/symbole.js`, je eine pro Kennung des Spiels oder Knopfs.

## Ergebnis

Die Überschrift nennt die Kernzahl der Runde, zum Beispiel „9 von 10 richtig“, beim Notenflug die richtigen Noten und beim Memory Paare und Züge. Darunter steht der Fortschritt zum nächsten Tier, etwa „2 von 5 Sternen bis zum nächsten Tier“, mit der grauen Silhouette des Tiers, das als Nächstes kommt. Schafft das Ergebnis die Top 5, erscheint der Knopf **Rekord speichern**, der die Namenseingabe öffnet.

## Meine Tiere

Das Füchschen ist von Anfang an da. Alle 5 gesammelten Sterne kommt ein zufälliges neues Tier dazu, insgesamt gibt es 25. Welches Tier als Nächstes kommt, steht schon vorher fest (seine Silhouette zeigt das Ergebnis). Die seltenen Tiere Einhorn, Drache und Phönix kommen erst ab 50 gesammelten Sternen in den Zufallstopf. Noch nicht entdeckte Tiere erscheinen als dunkle Silhouette. Jedes entdeckte Tier lässt sich als Begleiter auswählen.

## Rekorde und Namen

Das Spiel führt für jedes Spiel die fünf besten Ergebnisse. Schafft ein Ergebnis die Top 5, zeigt der Ergebnisbildschirm den Knopf **Rekord speichern**; er öffnet die Frage „Wer hat gespielt?“. Zuletzt benutzte Namen stehen als Schnellwahl bereit, der zuletzt gewählte ist vorausgewählt. Wer keinen Namen eintragen möchte, tippt auf „Ohne Namen“. Die Namen liegen nur im Browser des Geräts. Sterne und Tiere gehören allen Kindern auf dem Gerät gemeinsam.

## Spielregeln „Welche Note ist das?“

- Eine Runde hat 10 Aufgaben und beginnt mit 0 Punkten und 3 Sternen.
- Eine richtige Antwort bringt 10 Punkte. Bei einem Fehler erlischt ein Stern, und das Spiel zeigt die richtige Antwort mit einem Hinweis.
- Eine falsch beantwortete Note kommt nach zwei bis drei anderen Noten noch einmal. Fehlt dafür der Platz, kommt sie in der nächsten Runde früh dran.
- Nach 10 Aufgaben gibt es 10 Bonuspunkte pro verbliebenem Stern, und die Sterne kommen in die Sammlung.
- Die Runde geht immer bis zur zehnten Aufgabe, auch nach drei Fehlern. Die Sterne sinken pro Fehler bis auf 0; mit 0 Sternen gibt es keinen Bonus und keine neuen Sterne. Die Punkte zählen für die Rekorde. Das gilt genauso für Klaviertasten, Note setzen, das Hör-Spiel und die Etappen der Notenreise.
- Auf einem Gerät mit Tastatur lassen sich die Antworten auch mit den Buchstabentasten geben, wie beim Notenflug (siehe unten).
- Alle 5 gesammelten Sterne kommt ein neues Tier dazu.

## Mini-Spiele

Alle Mini-Spiele nutzen die Einstellungen (Schlüssel, Notenauswahl, Merktiere, Antworten), sammeln Sterne in dieselbe Sammlung und haben eigene Rekorde.

- **Notenflug:** Eine Note fliegt von rechts nach links über das Notensystem. Tippe ihren Namen, bevor sie den Schlüssel erreicht. Zu spät oder falsch kostet einen von drei Sternen, nach dem dritten Fehler ist das Spiel vorbei. Jedes Level hat 10 Noten und ist etwa 15 % schneller als das vorige; beim Wechsel erscheint kurz „Level 3!“. Eine richtige Note bringt Level × Anzahl der gewählten Noten als Punkte (C, D, E auf Level 1 = 3 Punkte, auf Level 3 = 9 Punkte), jedes geschaffte Level einen neuen Stern (höchstens 3). Nach einer richtigen Antwort leuchtet der Knopf kurz grün, und die nächste Note startet sofort; nur nach einem Fehler oder „zu spät“ hält das Spiel an und zeigt Lösung und Hinweis. Ältere Notenflug-Rekorde mit der früheren Wertung bleiben stehen.
  Tastatur: Bei **Einfach** antwortet der Buchstabe mit dem Stammton, Shift + Buchstabe mit der Note mit ♯ (Shift + F = Fis) oder, wenn es zum Buchstaben nur eine ♭-Note gibt, mit dieser (Shift + E = Es). Deutsch ist die Taste B die Note B (h mit ♭), H die Note H; englisch ist B die Note B und Shift + B die Note B♭. Bei **Genau** zählt ein Buchstabe sofort, wenn er unter den Antworten eindeutig ist; sonst wartet das Spiel bis zu 1 Sekunde auf die Oktavziffer: deutsch die Hochzahl (1 für c¹, 0 oder keine für c) oder derselbe Buchstabe noch einmal für die große Oktave (dd für D), englisch die Ziffer (4 für C4). Die Zeile unter den Knöpfen zeigt den getippten Anfang, zum Beispiel „d…“.
- **Klaviertasten:** Unter der Note liegt eine Klaviatur von der tiefsten bis zur höchsten gewählten Note (bei Lücken mit allen weißen Tasten dazwischen), mindestens aber 7 weiße Tasten. Das mittlere C ist markiert. Tippe die passende Taste. Alle Tasten, auch die schwarzen, spielen beim Drücken ihren Ton. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Note setzen:** Das Spiel nennt einen Notennamen, zum Beispiel `f1`. Tippe im Notensystem auf die passende Linie oder den Zwischenraum, verschiebe die Note bei Bedarf mit ▲ und ▼ und tippe auf **Prüfen**. Sind Vorzeichen-Noten gewählt, wählst du mit drei Knöpfen dazu ohne Vorzeichen, Kreuz oder B. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Noten-Memory:** Paare aus Notenkarte und Namenskarte liegen verdeckt. Decke zwei Karten auf und finde die Paare mit möglichst wenigen Zügen. Vor dem Spiel wählst du mit zwei großen Knöpfen die Stufe; die letzte Wahl ist beim nächsten Mal vorausgewählt.
  - **Normal:** 6 Paare im Raster 3 × 4. Bis 9 Züge gibt es 3 Sterne, bis 13 Züge 2, sonst 1. Punkte: 10 pro Paar plus 10 pro Stern (höchstens 90). Hat der Tonumfang weniger als 6 Noten, gibt es entsprechend weniger Paare.
  - **Schwer:** 10 Paare im Raster 4 × 5. Bis 16 Züge gibt es 3 Sterne, bis 22 Züge 2, sonst 1. Punkte: 15 pro Paar plus 20 pro Stern (höchstens 210). Braucht 10 verschiedene Namenskarten (im Modus Einfach 10 verschiedene Buchstaben oder Vorzeichen-Namen); sonst ist der Knopf ausgegraut, und ein Hinweis bittet, in den Einstellungen mehr Noten zu wählen.
  - Beide Stufen teilen sich eine Rekordliste; schwere Rekorde tragen das Schild „Schwer“.
- **Hör-Spiel:** Zum Einstieg erklingt c¹ als Bezugston, dann ein Ton, und du wählst aus drei gezeigten Noten die passende; „Nochmal hören“ spielt den Ton erneut. Der Ton entsteht im Browser, ohne Audiodateien. 10 Aufgaben, Wertung wie bei „Welche Note ist das?“.
- **Spiel eine Melodie:** Im Notensystem stehen 4 bis 7 Noten, darunter liegt die Klaviatur. Die orange hinterlegte Note ist dran; spiele die Noten der Reihe nach, jede Taste klingt. Eine falsche Taste leuchtet kurz rot, die Note bleibt markiert, und ab dem zweiten Fehler an derselben Note nennt der Fuchs die Lage. Nach der letzten Note erklingt die ganze Melodie, die Noten leuchten dabei nacheinander auf, danach steht der Name des Lieds da. Die Melodien sind Anfänge bekannter Kinderlieder (Hänschen klein, Alle meine Entchen, Mary Had a Little Lamb, Morgen kommt der Weihnachtsmann, Freude, schöner Götterfunken, Bruder Jakob), verschoben in die Notenauswahl; passt keins, spielt das Kind eine zufällige Folge aus kleinen Schritten. Für die Taste gilt der Antwortmodus wie bei „Klaviertasten“. 5 Melodien pro Runde; bis 2 falsche Tasten gibt es 3 Sterne, bis 5 falsche Tasten 2, sonst 1. Punkte: 10 pro Melodie plus 10 pro Stern.
- **Tägliche Notenreise:** Jeden Tag drei Etappen aus „Welche Note ist das?“, „Klaviertasten“, „Note setzen“ und „Spiel eine Melodie“; Auswahl und Reihenfolge wechseln täglich. Die ersten drei Spiele haben je 5 Aufgaben, die Melodie-Etappe hat 2 Melodien, und dort zählt jede Note, die beim ersten Versuch stimmt, als richtig. Jede Etappe wird bis zur letzten Aufgabe gespielt. Wer alle drei Etappen gespielt hat, hat die Reise geschafft und bekommt den Durchschnitt der Etappensterne und einmal pro Tag einen Extrastern; die Startseite zeigt, ob die Reise heute geschafft ist und wie viele Tage in Folge.

## Fehler üben

Nach einer Runde mit Fehlern in „Welche Note ist das?“, „Klaviertasten“, „Note setzen“ oder der Notenreise zeigt das Ergebnis den Knopf **Fehler üben**. Für jede verwechselte Note (höchstens 3, die häufigsten Fehler zuerst) gibt es zwei kurze Aufgaben: erst die Note im Notensystem erkennen, dann dieselbe Note auf dem Klavier finden. Es gibt keine Punkte, keine Sterne und keinen Rekord. Eine falsch beantwortete Aufgabe kommt am Ende noch einmal.

In allen Spielen bleiben Notensystem und Antworten nach der Antwort an ihrer Stelle; die Rückmeldung des Tiers steht darunter, und Linie oder Zwischenraum der Note sind hinterlegt.

Ältere Spielstände bleiben erhalten: Sterne und Rekorde zählen weiter, Häschen und Kätzchen bleiben, fehlende Tiere ergänzt das Spiel einmalig nach Sternzahl.

## Dateien

- `index.html`: die Seite mit allen Ansichten
- `js/texte.js`: alle sichtbaren Texte auf Deutsch und Englisch
- `css/style.css`: die Gestaltung
- `js/noten-konfiguration.js`: Bereiche, Merktiere und Standard-Einstellungen
- `js/noten.js`: erzeugt Noten, Namen, Positionen und Hinweise
- `js/spiel-logik.js`: Regeln, Wertung, Wiederholungen, Rekorde, Tiersammlung und Spielstand
- `js/notensystem.js`: das Notensystem mit Violin- und Bassschlüssel
- `js/tiere.js`: die Tierzeichnungen
- `js/symbole.js`: die gezeichneten Symbole für Spiele und Menüknöpfe
- `js/klang.js`: der Klavierton für Hör-Spiel, Klaviertasten und „Spiel eine Melodie“ (Web Audio API, keine Audiodateien)
- `js/klaviatur.js`: die Klaviatur für Klaviertasten, „Spiel eine Melodie“ und „Fehler üben“
- `js/modi.js`: die gemeinsame Schnittstelle für Spielmodi
- `js/modi/klassisch.js`: das Spiel „Welche Note ist das?“
- `js/modi/notenflug.js`, `js/modi/klaviertasten.js`, `js/modi/note-setzen.js`, `js/modi/noten-memory.js`, `js/modi/hoer-spiel.js`, `js/modi/melodie.js`, `js/modi/notenreise.js`: die Mini-Spiele
- `js/fehler-ueben.js`: die Übung „Fehler üben“ nach einer Runde
- `js/app.js`: Startseite, Ergebnis, Einstellungen, Tiere, Rekorde und Speichern
- `tests/spiel-logik.test.js`: automatische Tests der Spiellogik

Ein weiterer Spielmodus kommt als eigene Datei unter `js/modi/` dazu und meldet sich mit `Modi.registriere(…)` an. Die Beschreibung der Schnittstelle steht am Anfang von `js/modi.js`. Die Datei wird in `index.html` vor `js/app.js` eingebunden.

Die Tests brauchen Node.js ab Version 18 und laufen mit `node --test tests/spiel-logik.test.js`. Für den Betrieb des Spiels sind sie nicht nötig.
