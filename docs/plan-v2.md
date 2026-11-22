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

## 12. Antwortmodus „Einfach“ und „Genau“ (2026-11-22)

- Neue Einstellung „Antworten“ mit zwei Stufen als großer Umschalter (kein kleines Optionsfeld):
  - **Einfach:** Die Antwortknöpfe zeigen nur die Buchstaben C, D, E, F, G, A, H (Großbuchstaben, nur die Buchstaben, die in der Notenauswahl vorkommen, in dieser Reihenfolge). Jede Oktave des richtigen Buchstabens zählt als richtig. Rückmeldung, Merkhilfe und Beschriftung im Notensystem nennen danach den genauen Namen, zum Beispiel „Genau, das ist d²!“ oder „d² wie Delfin“.
  - **Genau:** wie bisher, Knöpfe mit Oktave (c¹, d² …).
- Standard und Migration bestehender Spielstände: **Einfach**.
- Auswirkung je Modus:
  - Welche Note ist das?, Notenflug: Antwortknöpfe wie oben.
  - Klaviertasten: Im einfachen Modus zählt jede Taste mit dem richtigen Buchstaben.
  - Note setzen: Im einfachen Modus steht nur der Buchstabe als Aufgabe, und jede passende Position im Bereich zählt. Danach wird der genaue Name gezeigt.
  - Noten-Memory: Im einfachen Modus zeigen Namenskarten nur den Buchstaben. Pro Spiel kommt jeder Buchstabe höchstens einmal vor, damit Paare eindeutig sind.
  - Höher oder tiefer, Hör-Spiel: unverändert.
- Wiederholung falsch beantworteter Noten bleibt pro Note (Kennung), nicht pro Buchstabe.

## 13. Noten mit Vorzeichen (2026-11-22)

- Die Notenauswahl bietet zusätzlich Noten mit Vorzeichen an, deutsch benannt:
  - Kreuz: cis, dis, fis, gis, ais
  - B: des, es, ges, as, b (deutsch „b“ = B mit B-Vorzeichen; H bleibt H)
  - Mit Oktave wie gewohnt: fis¹, es², B (große Oktave, deutsch „B“).
- In den Einstellungen stehen die Vorzeichen-Noten je Oktave als eigene, zuklappbare oder deutlich abgesetzte Zeile „mit ♯“ und „mit ♭“ unter den Stammtönen. Voreingestellt ist keine Vorzeichen-Note ausgewählt. Bestehende Spielstände bekommen keine dazu.
- Darstellung im Notensystem: Ein gut erkennbares Versetzungszeichen (♯ oder ♭) steht links vor dem Notenkopf auf derselben Höhe, gezeichnet als SVG-Pfad im Stil des Systems, keine Schrift. Keine Tonart-Vorzeichnung.
- Antworten:
  - Genau: Knöpfe wie „fis¹“ oder „es²“.
  - Einfach: Buchstabenknöpfe in chromatischer Reihenfolge, zum Beispiel C, D, E, F, Fis, G, A, H. Bei Vorzeichen-Noten mit großem Anfangsbuchstaben, also „Fis“, „Es“ und „B“.
  - Enharmonik: fis und ges sind verschiedene Antworten (Name zählt, nicht Tonhöhe), außer in den Modi, in denen nur die Taste oder der Klang zählt.
- Merktiere: fis wie Fisch (neues Tier im Stil von `js/tiere.js`). Für andere Vorzeichen-Noten gibt es das Merktier des Stammtons, zum Beispiel „cis¹ – C wie Chamäleon, nur einen Halbton höher“, oder eine kurze, kindgerechte Formulierung.
- Hinweise nach falscher Antwort nennen das Vorzeichen: „Das ist fis¹. Die Note liegt im ersten Zwischenraum und hat ein Kreuz.“
- Auswirkung je Modus:
  - Klaviertasten: Die schwarzen Tasten werden für gewählte Vorzeichen-Noten tippbar, Trefferfläche ausreichend groß. Für die Taste zählt die Tonhöhe, fis und ges sind also dieselbe Taste.
  - Note setzen: Bei Vorzeichen-Noten gibt es zusätzlich Knöpfe ♮, ♯ und ♭ zum Setzen des Vorzeichens.
  - Hör-Spiel: keine zwei gleich klingenden Karten (fis und ges) gleichzeitig.
  - Höher oder tiefer: Vergleich nach Tonhöhe, gleich klingende Paare kommen nicht vor.
  - Noten-Memory, Notenflug, Welche Note ist das?: über den zentralen Antwortvergleich.

## 14. Sprache Deutsch und Englisch (2026-11-22)

Ziel: Ein amerikanisches Kind kann den Notenzoo komplett auf Englisch spielen. Der Benutzer hat entschieden: amerikanische Notennamen und eigene englische Merktiere.

- **Umschalter:** Kleiner Knopf oben rechts in der Ecke der Startseite, zum Beispiel „DE | EN“ mit hervorgehobener aktiver Sprache, gut tippbar (mindestens 44 px hoch). Nur auf der Startseite, damit keine Runde mitten im Spiel die Sprache wechselt. Ein Wechsel übersetzt sofort alle Texte, ohne Neuladen.
- **Standard:** Beim ersten Start nach der Browsersprache (`navigator.language` beginnt mit „de“ → Deutsch, sonst Englisch). Danach gilt die gemerkte Wahl. Gespeichert im Spielstand, Spielstände bleiben gültig. `<html lang>` und `<title>` wechseln mit.
- **Texte:** Alle sichtbaren Texte und `aria-label` beider Sprachen stehen in einer neuen Datei `js/texte.js` (ein Objekt je Sprache, Platzhalter für Zahlen und Namen, Einzahl und Mehrzahl, zum Beispiel „1 Punkt“ und „1 point“). HTML-Elemente bekommen ein Attribut mit dem Textschlüssel, JavaScript holt Texte über eine kleine Funktion. Keine Bibliothek.
- **Notennamen auf Englisch (amerikanisch, wissenschaftliche Schreibweise):** Großbuchstabe, Vorzeichen als ♯ oder ♭, Oktave als normale Ziffer. c¹ = C4, c = C3, C = C2, c² = C5. Deutsch H = B, deutsch B = B♭, fis¹ = F♯4, es² = E♭5.
  - Einfach-Modus: Knöpfe C, C♯, D, E♭, … B in chromatischer Reihenfolge.
  - Kennungen (`violin-c1`), gespeicherte Auswahl, Rekorde und Wiederholungslisten bleiben sprachunabhängig. Der Antwortvergleich darf nicht an angezeigten Namen hängen, die sich mit der Sprache ändern.
- **Merktiere auf Englisch:** C Cat (Katze), D Dolphin, E Elephant, tiefes F Frog, hohes F (ab F5) Fox, G Giraffe, A Alligator (neue Zeichnung im Stil von `js/tiere.js`), B Bear (Bär), F♯ Fish. Formulierung: „D4 – D is for Dolphin“, bei Vorzeichen ohne eigenes Tier „C♯4 – C is for Cat, just a half step higher“. Die Zuordnung steht in `js/noten-konfiguration.js` neben der deutschen.
- **Übersetzt wird alles Sichtbare:** Spielnamen (Notenzoo = Note Zoo, Notenflug = Note Flight, Klaviertasten = Piano Keys, Note setzen = Place the Note, Noten-Memory = Note Memory, Höher oder tiefer = Higher or Lower, Hör-Spiel = Listening Game, Tägliche Notenreise = Daily Note Journey), Einstellungen und Schnellwahl, Hinweise zur Lage („on the second line“, „in the first space“, „sharp“, „flat“), Rückmeldungen, Sammeltiere (Little Fox, Bunny, Kitty …), Rekorde, Datumsangaben, Hinweis zum Ton im Hör-Spiel, README-Abschnitt.
- **Bleibt gleich:** Spielernamen, Punkte, Sterne, Spielregeln.
- **Nicht Ziel:** weitere Sprachen, britische Begriffe, Übersetzung der Code-Kommentare.
- **Tests:** ein zusätzlicher Logiktest für die englischen Namen (C4, B3, B♭3, F♯4, C2). Kurz im Browser mit Screenshot prüfen, keine große Testsuite.

## 15. Klaviertasten mit Ton (2026-11-22)

- Jede Taste spielt beim Drücken ihren Klavierton (gemeinsamer Ton aus `js/klang.js`, auch vom Hör-Spiel genutzt).
- Alle schwarzen Tasten sind tippbar und klingen, nicht nur die gewählten Vorzeichen-Noten (ersetzt „schwarze nur Dekoration“ aus Abschnitt 7). Ohne gewählte Vorzeichen-Noten zählt eine schwarze Taste als falsche Antwort, der Hinweis „Welche weiße Taste …“ bleibt.

## 16. Rückmeldung vom 2026-11-22: ruhige Spielfläche und „Fehler üben“

Umfang der ersten Überarbeitung, wie in der Rückmeldung empfohlen. Die übrigen Vorschläge stehen unten als spätere Kandidaten.

### Note und Antworten bleiben an ihrer Stelle

- Problem: Die Sprechblase des Fuchses steht über den Antwortknöpfen. Bei einem Fehler wächst sie, „Weiter“ erscheint, und die Knöpfe rutschen nach unten (bei 340 px Breite rund 200 px).
- Neue Reihenfolge: Kopfzeile mit Fortschritt, Note im Notensystem, Antworten, darunter die Rückmeldung (Fuchs, Merkhilfe, kurzer Hinweis, „Weiter“).
- Zwischen Aufgabe und Rückmeldung verschieben sich Notensystem und Antworten um keinen Pixel. Wächst die Rückmeldung, wächst nur der Bereich darunter. Bei Bedarf scrollt die Seite so, dass „Weiter“ sichtbar ist, ohne die Antworten aus dem Bild zu schieben, wenn es sich vermeiden lässt.
- Im Notensystem wird nach der Antwort die Linie oder der Zwischenraum der Note dezent hervorgehoben (zum Beispiel weiche, halbtransparente Farbfläche hinter der Linie oder im Zwischenraum, auch für Hilfslinien). So sieht das Kind beim Lesen der Erklärung, wo die Note liegt.
- Gilt für alle Modi mit diesem Aufbau (Welche Note ist das?, Klaviertasten, Note setzen, Höher oder tiefer, Hör-Spiel, Etappen der Notenreise). Beim Notenflug bleibt die Spielfläche ebenfalls ruhig. Querformat-Layout auf Tablets mitprüfen.

### „Fehler üben“

- Nach einer Runde mit mindestens einem Fehler zeigt das Ergebnis einen deutlichen Knopf „Fehler üben“ (englisch „Practice mistakes“). Gilt für die Modi mit klassischer Wertung (Welche Note ist das?, Klaviertasten, Note setzen) und für die Notenreise. Grundlage sind die falsch beantworteten Noten der Runde (`runde.verlauf`).
- Ablauf: Für jede verwechselte Note (höchstens 3 verschiedene, die häufigsten Fehler zuerst) zwei kurze Aufgaben: erst die Note im Notensystem erkennen (Antwortknöpfe wie im klassischen Spiel), danach dieselbe Note auf der Klaviatur finden. Also höchstens 6 Aufgaben. Antwortmodus Einfach/Genau gilt wie eingestellt.
- Kein Druck: keine Sterne zu verlieren, keine Punkte, kein Rekord, kein vorzeitiges Ende. Bei einer falschen Antwort zeigt das Spiel die Lösung mit Hinweis, und die Aufgabe kommt am Ende der Übung noch einmal.
- Abschluss: freundliche Meldung („Super, jetzt kennst du f¹ und a¹!“) und Knöpfe „Noch eine Runde“ und „Startseite“. Keine neuen Sterne, damit sich die Übung nicht als Sternquelle ausnutzen lässt.
- Die Übung nutzt die vorhandenen Bausteine (Antwortknöpfe und Klaviatur) und hält sich an die Regel oben: Note und Antworten bleiben an ihrer Stelle.

### Spätere Kandidaten (noch nicht umsetzen)

- Startseite mit zwei klaren Einstiegen: Hauptknopf „Noten üben · 10 Aufgaben · C bis G“ und eine eigene Karte „Tägliche Notenreise · 3 Spiele à 5 Aufgaben“.
- Gezeichnete Symbole im Stil des Fuchses statt System-Emojis auf den Spielkacheln.
- Ergebnis stärker: „9 von 10 richtig“ als Überschrift, darunter Fortschritt zum nächsten Tier mit Silhouette, Namenseingabe erst über „Rekord speichern“.
- Hauptmodus immer bis zur zehnten Aufgabe spielen, schwierige Noten später erneut zeigen (Notenflug behält die Fehlergrenze).
- „Spiel eine Melodie“: vier bis sieben Noten nachspielen, am Ende erklingt die Melodie.

## 17. Klaviatur mit mindestens 7 weißen Tasten (2026-11-22)

- Die Klaviatur (Klaviertasten und Fehler üben) zeigt immer mindestens 7 weiße Tasten, also eine ganze Oktave. Fehlende Tasten kommen oberhalb der höchsten gewählten Note dazu, aus c¹ bis g¹ wird c¹ bis h¹. Die zusätzlichen Tasten sind tippbar, klingen und zählen als falsche Antwort, weil nicht nach ihnen gefragt wird.

## 18. Notenflug: Tastatur, Punkte nach Schwierigkeit, kein Halt nach richtig (2026-11-22)

1. **Buchstabentasten immer nutzbar** (schneller, auf hohen Levels wichtig):
   - Einfach: Der Buchstabe beantwortet mit dem Stammton (D = „D“), egal wie viele Oktaven gewählt sind. Shift + Buchstabe = Note mit ♯ (Shift + F = Fis). Gibt es zum Buchstaben nur eine ♭-Note in der Auswahl (zum Beispiel Es), gilt Shift + Buchstabe für sie. Deutsch: Taste B = B (♭), H = H; Englisch: B = B, Shift + B = B♭, wenn kein B♯ gewählt ist (es gibt kein B♯).
   - Genau: Ist der Buchstabe unter den Antworten eindeutig, zählt er sofort. Sonst wartet das Spiel bis zu 1 Sekunde auf eine Oktavziffer (deutsch die Hochzahl, also 1 für c¹, 0 oder keine für c; englisch die Ziffer, also 4 für C4). Eine kleine Anzeige zeigt den getippten Anfang („d…“).
   - Kurzer Hinweis unter den Knöpfen auf Geräten mit Tastatur: „Tipp: Du kannst auch die Buchstaben auf der Tastatur drücken.“
   - Dieselbe Tastenlogik als gemeinsamer Helfer auch im klassischen Spiel nutzen.
2. **Punkte nach Schwierigkeit:** Punkte pro richtiger Note = Level × Anzahl der gewählten Noten. Beispiel: C, D, E auf Level 1 = 3 Punkte, auf Level 3 = 9 Punkte. Zwei Schlüssel mit Vorzeichen ergeben entsprechend viel mehr. Kein zusätzlicher Faktor für Einfach/Genau. Das Ergebnis zeigt die Rechnung kurz („3 Noten × Level 2 = 6 Punkte pro Note“). Alte Notenflug-Rekorde bleiben stehen.
3. **Kein Halt nach richtiger Antwort:** Nach einer richtigen Antwort leuchtet der Knopf kurz grün, Punkte zählen hoch, und die nächste Note startet sofort (höchstens 150 ms). Kein Merktier, keine Sprechblase, kein Halt. Nur nach einem Fehler oder „zu spät“ hält das Spiel an und zeigt Lösung, Hinweis und „Weiter“ wie bisher. Beim Levelwechsel eine kurze Einblendung „Level 3!“ (etwa 1 Sekunde), ohne Knopf.

## 19. Spätere Kandidaten jetzt umsetzen (2026-11-22, Wunsch des Benutzers)

1. **Startseite mit zwei klaren Einstiegen:** Hauptknopf „Noten üben“ mit Zeile „10 Aufgaben · C bis G“ (Bereich aus der Auswahl). Direkt darunter eine eigene, deutlich gestaltete Karte „Tägliche Notenreise · 3 Spiele à 5 Aufgaben“ mit Status (geschafft heute, Tage in Folge). Die übrigen Spiele bleiben als Kacheln darunter.
2. **Gezeichnete Symbole statt Emojis:** Alle Emojis auf der Startseite (Spielkacheln, Meine Tiere, Rekorde, Einstellungen, Fehler üben) werden durch einfache SVG-Zeichnungen im Stil des Fuchses ersetzt: warme Farben, dunkelbraune runde Konturen wie in `js/tiere.js`. Eine neue Datei `js/symbole.js`.
3. **Ergebnis stärker:** Überschrift „9 von 10 richtig“ (oder bei Spielen ohne Aufgabenzahl die Kernzahl). Darunter der Fortschritt zum nächsten Tier: „2 von 5 Sternen“ mit grauer Silhouette des nächsten Tiers. Die Namenseingabe öffnet sich erst über den Knopf „Rekord speichern“, nicht als großer Block.
4. **Runden zu Ende spielen:** In allen Spielen mit klassischer Wertung (Welche Note ist das?, Klaviertasten, Note setzen, Höher oder tiefer, Hör-Spiel, Etappen der Notenreise) endet die Runde nicht mehr nach drei Fehlern. Es werden immer alle Aufgaben gespielt. Falsch beantwortete Noten kommen nach ein paar anderen Aufgaben erneut (vorhandene Wiederholung). Die Sterne sinken weiter pro Fehler bis auf 0 und bestimmen die neuen Sterne wie bisher. Die Notenreise gilt als geschafft, wenn alle drei Etappen gespielt sind. Der Notenflug behält seine drei Leben.
5. **„Spiel eine Melodie“:** neuer Modus. Im Notensystem stehen 4 bis 7 Noten aus der Auswahl (kurze, singbare Folgen aus kleinen Schritten, zum Beispiel aus einer Liste bekannter Kinderlied-Anfänge, die in den Bereich passen, sonst zufällig mit kleinen Schritten). Darunter die Klaviatur aus `js/klaviatur.js`. Die aktuelle Note ist markiert, das Kind spielt sie der Reihe nach; jede Taste klingt. Falsche Taste: kurz rot, die Note bleibt markiert, kein Abbruch. Nach der letzten Note erklingt die ganze Melodie, die Noten leuchten dabei nacheinander. 5 Melodien pro Runde. Sterne nach Fehlern (0–2 Fehler 3 Sterne, bis 5 Fehler 2, sonst 1), Punkte 10 pro Melodie plus 10 pro Stern, Rekorde wie andere Modi. Symbol im neuen Stil.

## 20. „Höher oder tiefer“ entfällt (2026-11-22, Entscheidung des Benutzers)

- Das Spiel ergibt so keinen Sinn, weil man im Notensystem sofort sieht, welche Note höher ist. Es wird vollständig entfernt: Modusdatei, Ansicht in `index.html`, Texte, Symbol, CSS, Etappe der Notenreise, README.
- Gespeicherte Rekorde dieses Modus bleiben im Spielstand liegen, werden aber nicht mehr angezeigt. Spielstände bleiben gültig.
- Die Notenreise wählt ihre Etappen nur noch aus Welche Note ist das?, Klaviertasten und Note setzen (und dem Melodie-Spiel, falls es als Etappe taugt).
