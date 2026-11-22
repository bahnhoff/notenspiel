# Plan Version 2: Bassschlüssel, Einstellungen, Tiersammlung, Mini-Spiele

Stand: 2026-11-21. Alle Entscheidungen hat der Benutzer bestätigt.

## Rahmen (gilt unverändert)

- Statische Seite, klassische `<script>`-Dateien ohne ES-Module und ohne Build-Schritt, relative Pfade. `index.html` funktioniert auch per `file://`.
- Läuft auf GitHub Pages unter `https://bahnhoff.github.io/notenspiel/`. Keine externen Anfragen, keine persönlichen Daten.
- Oberfläche auf Deutsch, Touch zuerst (Handy hoch, Tablet hoch und quer), Schaltflächen mindestens 48 px, Tastaturbedienung, Rückmeldung nicht nur über Farbe.
- Spielstand im `localStorage` unter `welche-note-ist-das.spielstand.v1`. Alte Spielstände (Sterne, Rekorde, Tier `fuchs`/`hase`/`katze`) bleiben erhalten und werden migriert. Ohne Speicher bleibt das Spiel spielbar.
- Tests minimal: wenige `node --test`-Fälle für die Kernlogik, dazu ein kurzer Blick per Screenshot. Keine großen Playwright-Suiten im Repository.
- Commits nur lokal, ohne `Co-Authored-By` oder andere Zusatzzeilen. Kein Push.

## 1. Notennamen mit Oktave (deutsche Schreibweise)

- Mittleres C = `c1`, darüber `c2`, `c3`. Darunter kleine Oktave `c d e f g a h`, darunter große Oktave `C D E F G A H`.
- H statt B. Antwortschaltflächen zeigen den vollen Namen, zum Beispiel `c1`, `g`, `F`.
- Bei vielen Noten stehen die Schaltflächen in Reihen pro Oktave, tief unten links nach hoch rechts oder oben, gut lesbar und ohne horizontales Scrollen.

## 2. Bassschlüssel und Notensystem

- `js/notensystem.js` zeichnet zusätzlich einen gut erkennbaren Bassschlüssel (F-Schlüssel mit zwei Punkten um die vierte Linie von unten = `f`).
- Positionsschema bleibt: 0 = unterste Linie, Hilfslinien automatisch oben und unten.
- Violinschlüssel: unterste Linie = `e1`. Bassschlüssel: unterste Linie = `G`.
- Der sichtbare Ausschnitt richtet sich nach dem gewählten Bereich und springt innerhalb einer Runde nicht.

## 3. Noten erzeugen statt von Hand pflegen

- Die Noten entstehen aus Schlüssel und Bereich (Kennung zum Beispiel `violin-c1`, `bass-G`).
- Hinweise werden erzeugt: „Die Note liegt auf der zweiten Linie von unten.“, „… im ersten Zwischenraum …“, „… auf der ersten Hilfslinie unter dem System.“, „… knapp unter der untersten Linie.“, „… knapp über der obersten Linie.“ und so weiter.
- `js/noten-konfiguration.js` bleibt die Datei für Anpassungen: Bereichsvorgaben, Merktiere, Standard-Einstellungen. Kommentar auf Deutsch, README entsprechend anpassen.

## 4. Einstellungen (neue Ansicht „Einstellungen“ auf der Startseite)

- **Schlüssel:** Violinschlüssel, Bassschlüssel oder beide gemischt.
- **Tonumfang in Oktaven**, je Schlüssel:
  - Violin: „Erste Noten: c1 bis g1“ (Standard, bisheriger Übungssatz), „1 Oktave: c1 bis c2“, „2 Oktaven: c1 bis c3“.
  - Bass: „Erste Noten: c bis g“ (oder sinnvoller Einstieg rund um die Linien), „1 Oktave: c bis c1“, „2 Oktaven: C bis c1“.
- **Merktiere an oder aus.**
- Einstellungen werden gespeichert. Gemischte Schlüssel: Die Antwortschaltflächen enthalten die Vereinigung beider Bereiche.

## 5. Merktiere

- Nach Buchstabe, unabhängig von der Oktave: c Chamäleon (statt Zebra), d Delfin, e Elefant, f Frosch (f2 und höher: Fuchs), g Giraffe, a Affe, h Hase.
- Anzeige wie bisher erst nach der Antwort: „d1 wie Delfin“. Abschaltbar.
- Chamäleon neu zeichnen im bestehenden Stil von `js/tiere.js` (grün, Augen seitlich, eingerollter Schwanz, Kamm).

## 6. Tiersammlung „Meine Tiere“

- Rund 25 Sammeltiere im einheitlichen Stil, darunter seltene: Einhorn, Drache, Phönix. Beispiele für normale: Füchschen, Häschen, Kätzchen, Hündchen, Bärchen, Panda, Pinguin, Eule, Igel, Eichhörnchen, Schildkröte, Koala, Löwe, Tiger, Waschbär, Schäfchen, Schweinchen, Küken, Otter, Faultier, Maus, Kuh.
- Füchschen ist von Anfang an da. Alle 5 gesammelten Sterne kommt ein **zufälliges** noch nicht entdecktes Tier dazu. Seltene Tiere erst ab 50 gesammelten Sternen im Zufallstopf.
- Nicht entdeckte Tiere erscheinen als dunkler Schatten mit „???“. Entdeckte in Farbe mit Namen. Jedes entdeckte Tier ist als Begleiter wählbar.
- Anzeige: gesammelte Sterne und „Noch N Sterne bis zum nächsten Tier“. Neu entdecktes Tier auf dem Ergebnisbildschirm.
- Migration: Bestehende Sterne zählen. Alte Spielstände mit Häschen oder Kätzchen behalten diese, fehlende Entdeckungen bis `floor(sterne / 5)` werden zufällig ergänzt.

## 7. Spielmodi

Startseite: großer **Start** für das klassische Spiel bleibt. Darunter eine Auswahl der Mini-Spiele, „Meine Tiere“, „Meine Rekorde“ und „Einstellungen“. Alle Modi nutzen die Einstellungen (Schlüssel, Bereich) und vergeben Sterne in dieselbe Sammlung. Rekorde pro Modus, Top 5, gleiche Sortierung wie bisher. Jede Runde wird genau einmal verbucht. Zurück zur Startseite verwirft die Runde.

1. **Welche Note ist das?** (klassisch): Regeln wie bisher.
2. **Notenflug:** Eine Note gleitet von rechts nach links über das Notensystem. Das Kind muss den Namen antippen, bevor die Note den Schlüssel erreicht. Zu spät oder falsch kostet einen von drei Sternen und zeigt kurz die Lösung mit Hinweis. Level mit je 10 Noten, jedes Level etwa 15 % schneller, Start langsam (rund 8 Sekunden Flugzeit). Punkte: 10 × Level pro richtiger Note. Nach dem dritten Fehler Ende. Neue Sterne: 1 pro abgeschlossenem Level, höchstens 3 pro Spiel. `requestAnimationFrame`, Pause bei verstecktem Tab.
3. **Klaviertasten:** Note im Notensystem, darunter eine gezeichnete Klaviatur über den gewählten Bereich (weiße und schwarze Tasten, schwarze nur Dekoration). Das mittlere C ist markiert. Das Kind tippt die passende weiße Taste. 10 Aufgaben, Wertung wie im klassischen Spiel.
4. **Note setzen:** Der Name steht da, zum Beispiel „f1“. Das Kind tippt im Notensystem die richtige Linie oder den Zwischenraum an (große Trefferflächen, auch für Hilfslinien). 10 Aufgaben, Wertung wie im klassischen Spiel.
5. **Noten-Memory:** 6 Paare (Notenkarte und Namenskarte), Raster 3 × 4. Sterne nach Zügen: bis 9 Züge 3, bis 13 Züge 2, sonst 1. Punkte 10 pro Paar plus 10 pro Stern.

## 8. Namen in den Rekorden

- Mehrere Kinder spielen auf demselben Gerät und sollen sich gegenseitig mit Rekorden anspornen.
- Schafft ein Ergebnis die Top 5 eines Modus, fragt der Ergebnisbildschirm „Wer hat gespielt?“. Es gibt ein Textfeld (höchstens 20 Zeichen) und Schnellwahl-Knöpfe mit den zuletzt benutzten Namen. Der zuletzt gewählte Name ist vorausgewählt, damit ein Tipp genügt.
- Der Name lässt sich überspringen, dann steht „Ohne Namen“ im Rekord.
- „Meine Rekorde“ zeigt den Namen bei jedem Eintrag. Die Überschrift kann „Rekorde“ heißen.
- Namen liegen nur im `localStorage`. Keine Namen im Code, in Beispielen, Tests oder der README.
- Bestehende Rekorde ohne Namen bleiben erhalten und zeigen keinen Namen.
- Sterne und Tiersammlung bleiben gemeinsam für das Gerät, nicht pro Name.

## 9. Weitere Spiele (vom Benutzer gewählt am 2026-11-21)

6. **Höher oder tiefer:** Zwei Noten stehen nebeneinander im selben System. Das Kind tippt die höhere an, in manchen Runden ist die Frage „Welche ist tiefer?“. Gleich hohe Noten kommen nicht vor. 10 Aufgaben, Wertung wie im klassischen Spiel. Später im Spiel werden die Abstände kleiner, zum Beispiel erst Terzen und mehr, dann Sekunden.
7. **Hör-Spiel:** Das Spiel spielt einen Ton (Web Audio API, lokal erzeugter klavierähnlicher Ton, keine Audiodateien aus dem Internet). Das Kind wählt aus 3 gezeigten Noten die passende. Der Knopf „Nochmal hören“ ist immer da. Zum Einstieg spielt das Spiel einen Bezugston c1 vor. 10 Aufgaben, Wertung wie im klassischen Spiel. Ohne Ton (Gerät stumm) bleibt das Spiel bedienbar, mit einem Hinweis, den Ton einzuschalten.
8. **Tägliche Notenreise:** Pro Kalendertag eine kurze Mischung aus drei Mini-Runden à 5 Aufgaben aus verschiedenen Modi. Wer die Reise schafft, bekommt einen Extrastern. Eine Tagesserie zählt aufeinanderfolgende Tage („3 Tage in Folge“). Pro Tag gibt es den Extrastern höchstens einmal, auch bei mehreren Spielern auf dem Gerät. Die Startseite zeigt, ob die heutige Reise schon geschafft ist.

## 10. Neuer Name „Notenzoo“ (entschieden)

- Das Spiel heißt „Notenzoo“. Der Benutzer hat das am 2026-11-21 bestätigt, obwohl es ein gleichnamiges Lernspiel gibt.
- Repository und Adresse bleiben `bahnhoff/notenspiel` bzw. `https://bahnhoff.github.io/notenspiel/`, bis der Benutzer etwas anderes sagt.
- Umbenannt werden Titel, Startseite, `<title>`, Favicon-Beschreibung und README. Die Frage „Welche Note ist das?“ bleibt als Name des klassischen Modus.
- Der Speicherschlüssel bleibt unverändert, damit Spielstände erhalten bleiben.

## Aufteilung der Umsetzung

- **Schritt A (Grundlage):** Punkte 1 bis 6 und 8, Startseite mit Platz für die Modi, Rekorde pro Modus, Spielstand-Migration, eine gemeinsame Schnittstelle für Modi.
- **Schritt B (Modi):** Punkte 7.2 bis 7.5 auf Basis von Schritt A, je Modus eine eigene Datei unter `js/modi/`.
- **Schritt C (weitere Spiele):** Punkt 9 (Höher oder tiefer, Hör-Spiel, Tägliche Notenreise).
- **Schritt D (Name):** Punkt 10, zusammen mit Schritt B erledigen.

## 11. Rückmeldung vom 2026-11-22

1. **Mehrfachauswahl statt Entweder-oder:** In den Einstellungen gibt es keine Optionsfelder (Radio-Buttons) mehr. Die Schlüssel Violin und Bass sind Kästchen zum Ankreuzen, auch beide gleichzeitig, mindestens einer bleibt aktiv. Merktiere ist ein Schalter.
2. **Noten einzeln wählen:** Für jeden angekreuzten Schlüssel zeigt die Ansicht alle verfügbaren Noten als große Ankreuz-Knöpfe, nach Oktaven in Reihen. Dazu kommen Schnellwahl-Knöpfe: „Erste Noten“, „1 Oktave“, „2 Oktaven“, „Alle“ und „Keine“. Sie setzen nur Häkchen. Insgesamt müssen mindestens 3 Noten gewählt sein, sonst erscheint ein freundlicher Hinweis und die Spiele starten nicht. Alte Einstellungen werden in Notenlisten übersetzt.
3. **Korrekte Schreibweise:** Die Oktavziffer steht hochgestellt rechts neben dem Buchstaben: C, c, c¹, c², c³ (Unicode-Hochzahlen ¹ ² ³). Das gilt überall, wo ein Name erscheint: Antwortknöpfe, Merkhilfe („d¹ wie Delfin“), Beschriftung im Notensystem, Klaviatur, Memory, Note setzen, Hör-Spiel, Hinweise, Einstellungen und README. Die Kennungen (`violin-c1`) bleiben ASCII, damit Spielstände gültig bleiben.
