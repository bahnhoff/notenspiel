# Plan Version 3: Aufbau der Stitch-Entwürfe übernehmen

Stand: 2026-11-23. Entwurf zur Prüfung durch den Benutzer, noch nicht umgesetzt.

## Auftrag und Grundsatz

Bisher hat der Notenzoo von den Stitch-Entwürfen nur Farben und Formen übernommen. Ab jetzt übernimmt jede Seite auch den Aufbau ihres Entwurfs. Der Benutzer hat entschieden:

- Was der Entwurf zeigt, wird übernommen.
- Fehlt der App die Funktion hinter einem Element, wird die Funktion nachgebaut.
- Ergibt ein Element in dieser App keinen Sinn oder schadet es dem Lernen, steht es unten unter „Rückfragen an den Benutzer“ mit einer Standardlösung, die bis zur Antwort gilt.

Unverändert gelten die Regeln aus `docs/plan-v2.md`: statische Seite ohne Build-Schritt, läuft per `file://`, keine externen Anfragen, Touch zuerst, Schaltflächen mindestens 48 px, Tastaturbedienung, Rückmeldung nicht nur über Farbe, Note und Antworten verschieben sich bei der Rückmeldung nicht, zwei Sprachen über `js/texte.js`, wenige Tests in `tests/spiel-logik.test.js`, Commits nur lokal und ohne Zusatzzeilen.

Weitere feste Grenzen für diesen Plan:

- Der Begleiter ist der Fuchs beziehungsweise das in „Meine Tiere“ gewählte Tier. Der Hase „Barnaby“ aus den Entwürfen kommt nicht vor. Wo der Entwurf „Barnaby says“ schreibt, steht der Name des Begleiters, zum Beispiel „Füchschen sagt:“ und „Little Fox says:“.
- Alle Texte gibt es auf Deutsch und Englisch, nie gemischt. Das deutsche „Übung geschafft!“ im englischen Memory-Siegerfenster ist ein Fehler im Entwurf.
- Notennamen folgen weiter der Spracheinstellung: deutsch c¹, h, fis¹; englisch C4, B3, F♯4. Wo der Entwurf „C4“ schreibt, steht auf Deutsch „c¹“.
- Emojis aus den Entwürfen (🚀, 🎉, 🐶, 🏆, 🔄) werden zu gezeichneten Symbolen in `js/symbole.js`, wie bei der Startseite.
- Stitch hat nur Desktop-Entwürfe. Das Handy-Layout (360 px) leitet dieser Plan je Seite selbst ab.

## Quellen

Stitch-Projekt „Modern Note Learning App“, Kennung 10469707150727188199. Bilder der Entwürfe liegen unter `/tmp/notenzoo-stitch/neu/`.

- Startseite: d40020cb28ad477e8b191d78b0118550
- Welche Note ist das?: 3ca3c182669b4c42aaf4b1081500a725
- Klaviertasten: 1f5292244e434b2b862eb6a3d9a0e078
- Notenflug: bc760dc5a312493e99c4099da0a7f331
- Hör-Spiel: 5cead1707802447d8af28e8f169a2543
- Melodie: 5fc8119e96db4beca5d0d74a33c0a469
- Note setzen: 3fbfea704f2f47ed90f3b861a8909c17 (gewählte Fassung)
- Noten-Memory: f655bf9c2c2943a3888a5477f7f46125
- Memory-Siegerfenster: 0f065ae1001949f8aaef4eab3f1762c5
- Meine Tiere: 5b984940c5ed41ad9d438ceff00aa18f
- Rekorde: c250c7f14b9541ff9ec3b70472307f25
- Einstellungen: 425b4c8f252941dba4eddbe78a140ad9

Die Entwürfe sind untereinander nicht einheitlich: Das volle obere Menü zeigen nur Notenflug, Hör-Spiel, Melodie und Rekorde. Welche Note ist das?, Klaviertasten, Note setzen und Memory haben nur einen Spielkopf. Meine Tiere und Einstellungen haben eine schlichte Kopfzeile. Der Plan vereinheitlicht das über gemeinsame Bausteine, siehe Rückfrage zum oberen Menü.

---

## Gemeinsame Bausteine

Diese Bausteine kommen auf mehreren Seiten vor. Sie werden einmal gebaut und überall gleich benutzt.

### Oberes Menü

Entwurf (Notenflug, Hör-Spiel, Melodie, Rekorde): feste Leiste oben. Links ein runder Zurück-Knopf und die Reiter „Zoo Map“, „Lessons“, „Safari“, in der Mitte ein Fortschrittsbalken, rechts eine Sterne-Pille „12“, eine Noten-Pille „350“ und ein runder Profilknopf.

Neu in `index.html` als ein einziges Element `#oberes-menue` außerhalb der Ansichten, das `js/app.js` je Ansicht ein- oder ausblendet. Es bleibt beim Scrollen oben stehen.

Zuordnung der Teile:

- Runder Knopf links: Im Entwurf führt er nach „Home“. Er zeigt den Kopf des Begleiters und führt zur Startseite. In Spielansichten entfällt er, weil die Kopfkarte schon „← Zoo“ hat und zwei Zurück-Knöpfe Kinder verwirren.
- Reiter „Zoo Map“: Reiter „Zoo“ (englisch „Zoo“), führt zur Startseite. Begründung: Im Entwurf ist „Zoo Map“ auf Spielseiten aktiv, und die Kopfkarte führt mit „Zoo“ zurück. „Zoo“ ist also die Übersicht der Spiele.
- Reiter „Lessons“: Reiter „Notenreise“ (englisch „Journey“), öffnet die Tägliche Notenreise (`#ansicht-reise`). Sie ist das einzige geführte, tägliche Übungsprogramm der App.
- Reiter „Safari“: Reiter „Meine Tiere“ (englisch „My Animals“), öffnet `#ansicht-tiere`. Auf einer Safari besucht man Tiere.
- Fortschrittsbalken: Fortschritt zum nächsten Sammeltier, also gesammelte Sterne seit dem letzten Tier geteilt durch 5. Sind alle Tiere entdeckt, ist der Balken voll. Beschriftung für Screenreader: „Noch 2 Sterne bis zum nächsten Tier“ und „2 stars to go until the next animal“ (vorhandene Texte `tiere.noch`). Quelle: `naechstesTier` in `js/spiel-logik.js`.
- Sterne-Pille: alle gesammelten Sterne (`stand.sterne`). Tippen öffnet Meine Tiere. Text für Screenreader: „18 Sterne gesammelt“ und „18 stars collected“.
- Noten-Pille: neu, Zahl aller richtig gelesenen Noten, siehe „Neuer Zähler: gelesene Noten“. Text für Screenreader: „350 Noten richtig gelesen“ und „350 notes read correctly“.
- Profilknopf: öffnet die Einstellungen und zeigt ein Zahnrad-Symbol im Stil von `js/symbole.js`. Aria-Text „Einstellungen“ und „Settings“. Siehe Rückfrage zum Profil.

Aktiver Reiter: Startseite und Spiele markieren „Zoo“, Notenreise markiert „Notenreise“, Meine Tiere markiert „Meine Tiere“. Rekorde und Einstellungen markieren keinen Reiter.

Verhalten während einer Runde: Ein Tipp auf einen Reiter, eine Pille oder den Profilknopf verwirft die laufende Runde wie heute „← Startseite“. Damit kein Kind eine Runde versehentlich verliert, fragt ein kleines Fenster „Runde beenden?“ mit „Ja, beenden“ und „Weiterspielen“ (englisch „End this round?“, „Yes, end it“, „Keep playing“). Der Notenflug pausiert, solange das Fenster offen ist. Siehe Rückfrage zum Menü in Spielen.

Handy (360 px): Wie im Entwurf verschwinden die Reiter. Die Leiste zeigt in einer Zeile von 56 px Höhe: Fortschrittsbalken (dehnt sich), Sterne-Pille, Noten-Pille, Profilknopf (je 44 px Tippfläche). Die Reiter-Ziele bleiben auf dem Handy über die untere Reihe der Startseite und die Pillen erreichbar. Auf der Startseite erscheint das Menü nicht, siehe Startseite.

### Kopfkarte

Entwurf (Notenflug, ähnlich Welche Note ist das?, Klaviertasten, Note setzen, Memory): weiße, runde Karte. Links Zurück-Pille mit Pfeil und „Zoo“, daneben Titel und kleine Unterzeile, rechts eine Reihe Pillen.

Vorhanden: `header.runde-kopf` in jeder Spielansicht mit `.knopf-zurueck`, `.runde-titel` (Aufgabennummer und Überschrift) und `.runde-status` (Sterne und Punkte).

Änderungen:

- Die Kopfzeile wird zur Karte mit Hintergrund und Schatten wie im Entwurf.
- Zurück-Pille: Text „Zoo“ statt „Startseite“ (englisch „Zoo“). Aria-Text bleibt „Zurück zur Startseite“.
- Titelblock: Überschrift mit kleinem Spielsymbol aus `js/symbole.js` dahinter, Unterzeile darunter. Welche Note ist das?, Klaviertasten, Hör-Spiel und Note setzen behalten die Reihenfolge „Aufgabe 1 von 10“ über der Überschrift, weil ihre Entwürfe es so zeigen. Notenflug und Melodie zeigen die Unterzeile unter der Überschrift.
- Pillenreihe: je Spiel unterschiedlich (Sterne, Punkte, Combo, Herzen, Züge, Paare). Alle Pillen haben dieselbe Form, damit die Kopfkarten einheitlich wirken.

Handy: Die Karte hat zwei Zeilen. Oben Zurück-Knopf (nur Pfeil, 48 px) und rechts die Pillenreihe, darunter Unterzeile und Überschrift mittig. So ist es heute schon, nur mit Kartenhintergrund.

### Fortschrittsbalken

Ein Baustein für drei Zwecke, schmal (12 px), runder Rand, gefüllter Teil in Grün oder Himmelblau:

- im oberen Menü: Fortschritt zum nächsten Tier;
- im Notenflug unter der Kopfkarte: verbleibende Flugzeit der aktuellen Note;
- in Meine Tiere und im Ergebnisfenster: Fortschritt zum nächsten Tier.

Jeder Balken hat `role="progressbar"` mit Wert und Text für Screenreader.

### Sprechblase des Begleiters

Vorhanden: `.tier-zeile` mit `.tier-klein` und `.sprechblase` in allen Spielen. Die Entwürfe zeigen sie an unterschiedlichen Stellen: unten in der Bühne (Notenflug), oben rechts (Klaviertasten, Melodie), in der Steuerzeile (Hör-Spiel), rechte Spalte (Welche Note ist das?, Note setzen), unten (Memory).

Der Baustein bekommt zwei Größen:

- „Zeile“: runder Tierkopf (32 px) und ein einzeiliger Text, für die Bühne im Notenflug und die Steuerzeile im Hör-Spiel. Text mit Namen: „Füchschen sagt: Schau genau hin! Welche Note ist das?“ und „Little Fox says: Look closely! Which note is that?“.
- „Karte“: wie heute mit ganzem Tier, Merkhilfe, Hinweis und „Weiter“.

Die Regel „Note und Antworten bleiben an ihrer Stelle“ gilt weiter. Wo der Entwurf die Sprechblase über der Bühne zeigt (Klaviertasten, Melodie), steht dort nur die kurze Aufgabe. Die Rückmeldung nach einer Antwort mit Merkhilfe und „Weiter“ erscheint weiter unter den Antworten oder der Klaviatur.

### Pillen für Zähler

Einheitliche Pille mit Symbol und Zahl, 36 px hoch, auf dem Handy 32 px. Benutzt für: Sterne der Runde, Punkte, Combo, Herzen, Züge, Paare, globale Sterne, gelesene Noten.

### Fußzeile

Entwurf (Startseite, Notenflug, Hör-Spiel, Melodie, Rekorde, Note setzen mit eigenem Text): schmale Leiste am Seitenende mit Pfotensymbol, Name und einer kurzen Zeile.

Neu als `#fusszeile` unter allen Ansichten außer Notenflug während des Flugs (dort lenkt Scrollen ab):

- Deutsch: „Notenzoo · Mit Liebe gemacht für kleine Notenleser · Version 3“
- Englisch: „Note Zoo · Made with love for young music readers · Version 3“

Kein Copyright-Hinweis, weil der Entwurfstext „© 2024 Note Zoo“ ein erfundener Platzhalter ist. Die Versionsnummer steht in einer Konstante in `js/app.js`.

### Ton an oder aus

Entwurf: Startseite mit Lautsprecher-Knopf „Toggle Sound Effects“, Notenflug mit „Audio Ready“.

Neu, gespeichert als `stand.ton` (Standard `true`). `js/klang.js` bekommt eine Funktion zum Stummschalten, alle Töne laufen über sie. Der Knopf zeigt einen Lautsprecher mit oder ohne Wellen.

- Aria-Text: „Töne ausschalten“ oder „Töne einschalten“, englisch „Turn sound off“ oder „Turn sound on“.
- Kurzer Text im Notenflug: „Ton an“ oder „Ton aus“, englisch „Sound on“ oder „Sound off“.
- Im Hör-Spiel ist der Ton nötig. Ist er aus, zeigt das Spiel den vorhandenen Hinweis und zusätzlich den Knopf „Ton einschalten“ („Turn sound on“).

### Buchstabentasten mit Farbe und Silbe

Entwurf (Notenflug): sieben große Tasten, jeder Buchstabe in einer eigenen Farbe, darunter die Solfège-Silbe (Do, Re, Mi, Fa, Sol, La, Ti).

Neu für die Antworttasten aller Spiele im Antwortmodus „Einfach“:

- Feste Farbe je Stammton als CSS-Variable, zum Beispiel C dunkelorange, D orange, E goldbraun, F grün, G orange auf hellem Gold, A himmelblau, H oder B dunkelgrün. Die Farbe trägt keine Bedeutung allein, der Buchstabe bleibt die Information.
- Silbe darunter: deutsch „Do Re Mi Fa So La Ti“, englisch „Do Re Mi Fa Sol La Ti“. Vorzeichen-Tasten (Fis, Es) zeigen keine Silbe.
- Im Antwortmodus „Genau“ zeigen die Tasten den vollen Namen mit Oktave, ebenfalls mit der Farbe des Stammtons, ohne Silbe.

Siehe Rückfrage zu den Solfège-Silben.

### Ergebnisfenster

Entwurf: nur das Memory-Siegerfenster. Es liegt als Fenster über dem abgedunkelten Spielfeld.

Neu: Die Ansicht `#ansicht-ergebnis` wird für alle Spiele zu diesem Fenster. Der Aufbau ist bei allen gleich, nur die vier Werte-Kärtchen wechseln. Einzelheiten unter „Noten-Memory: Siegerfenster“. Siehe Rückfrage zum Ergebnisfenster für alle Spiele.

### Neuer Zähler: gelesene Noten

Die Noten-Pille im Menü braucht eine Zahl, die es heute nicht gibt.

- Bedeutung: Zahl aller Noten, die das Kind in gewerteten Runden richtig gelesen hat. Das ist eine Zahl, die nur wächst und dem Kind zeigt, wie viel es schon geübt hat. Punkte wären ungeeignet, weil der Notenflug viel mehr Punkte gibt als andere Spiele.
- Gezählt wird beim Verbuchen einer Runde (`verbucheErgebnis`) das Feld `richtige` des Ergebnisses:
  - Welche Note ist das?, Klaviertasten, Note setzen, Hör-Spiel, Etappen der Notenreise: richtige Antworten.
  - Notenflug: richtig gefangene Noten.
  - Noten-Memory: gefundene Paare.
  - Melodie: Noten, die beim ersten Versuch stimmten.
  - Fehler üben zählt nicht, weil es nicht verbucht wird.
- Speicher: `stand.notenGesamt`, Standard 0. Alte Spielstände starten bei 0.

---

## Startseite

Entwurf „Main Screen (Faithful Redesign)“. Der Aufbau ist schon fast übernommen.

Aufbau von oben nach unten:

- Kopfmenü links mit Tierkopf und „Note Zoo“: vorhanden als `#start-tier` und `#titel-start`. Im Entwurf klein in der Ecke, in der App groß mittig. Es bleibt groß mittig, weil der Entwurf darunter zusätzlich den großen Begleiter und Titel zeigt; die kleine Ecke wäre doppelt. Neu ist nur, dass links oben ein kleiner Schriftzug „Notenzoo“ mit Pfotensymbol steht, damit die Zeile wie im Entwurf ausgewogen ist.
- Lautsprecher-Knopf rechts oben: neu, siehe „Ton an oder aus“.
- Sprachumschalter „DE | EN“: vorhanden, `#sprach-umschalter`.
- Großer Begleiter und Titel „Notenzoo“: vorhanden.
- Haupttaste „Noten üben“ mit Unterzeile „10 Aufgaben · C bis H“: vorhanden, `#knopf-start`, `#start-unterzeile`.
- Zeile mit den Bereichen je Schlüssel: vorhanden, `#start-auswahl`.
- Karte „Tägliche Notenreise“ mit Kompass, drei Zeilen und Pfeil: vorhanden in `#start-karten`.
- „Weitere Spiele“ mit Abzeichen „6 verfügbar“: vorhanden, `#titel-modi`, `#start-modi-anzahl`.
- Raster mit sechs Spielkarten (Symbol, Titel, Unterzeile): vorhanden, `#start-modi`.
- Fußzeile: neu, siehe gemeinsamer Baustein. Die Entwurfszeile „Made with love for music learners · Note Zoo v2.4“ wird zur gemeinsamen Fußzeile.
- Untere Reihe „Meine Tiere / Rekorde / Einstellungen“: fehlt im Entwurf, bleibt aber nach der Entscheidung des Benutzers vom 2026-11-23.
- Oberes Menü: Der Entwurf der Startseite hat keins. Die Startseite bekommt keins, die globalen Zähler stehen nicht auf der Startseite. Begründung: Die Startseite ist im Entwurf bewusst ruhig, und die untere Reihe deckt die Ziele ab.

Handy: wie heute, Spielkarten einspaltig, Lautsprecher und Sprachumschalter teilen sich die obere rechte Ecke (je 44 px hoch), Fußzeile zweizeilig und klein.

## Welche Note ist das?

Entwurf 3ca3c182669b4c42aaf4b1081500a725. Der Aufbau ist weitgehend vorhanden.

- Spielkopf mit „← Home“, „Aufgabe 1 von 10“, Titel, drei Sterne und „0 Punkte“: vorhanden (`header.runde-kopf`, `#aufgabe-nr`, `#titel-runde`, `#sterne-anzeige`, `#punkte-anzeige`). Wird zur Kopfkarte.
- Zwei Spalten im Verhältnis 7 zu 5: vorhanden (`.runde-inhalt` mit `.runde-noten` und `.runde-antworten`). Verhältnis auf 7 zu 5 anpassen.
- Bühne als große weiße Karte mit Notensystem: vorhanden, `#notensystem`.
- Buchstabentasten im Raster mit 6 Spalten: vorhanden, `#antworten`. Neu sind Farbe und Silbe, siehe gemeinsamer Baustein. Raster wie im Entwurf mit 6 Spalten ab Tablet-Breite, siebte Taste in der zweiten Reihe links.
- Tipp zu den Buchstabentasten: vorhanden, `#runde-tasten`.
- Begleiter klein mit Sprechblase: vorhanden, `.tier-zeile`.
- Oberes Menü: im Entwurf nicht vorhanden, nach der Rückfrage zum oberen Menü standardmäßig vorhanden.

Handy: wie heute. Notensystem oben, Tasten in Reihen mit höchstens 5 Tasten (7 Buchstaben = 4 + 3), Begleiter darunter.

## Notenflug

Entwurf bc760dc5a312493e99c4099da0a7f331. Diese Seite braucht die meisten neuen Funktionen.

### Aufbau und Zuordnung

- Oberes Menü: neu, gemeinsamer Baustein.
- Kopfkarte:
  - Zurück-Pille „Zoo“: vorhanden als `.knopf-zurueck` in `#ansicht-notenflug`.
  - Titel „Notenflug“ mit Raketensymbol: vorhanden `#titel-notenflug`, Symbol neu in `js/symbole.js` (kein Emoji).
  - Unterzeile „Welle 1 · Tempo: Gemütlich“: ersetzt `#flug-level`, neu ist die Tempostufe.
  - Pille „Combo x3“: neu.
  - Pille „240 Punkte“: vorhanden `#flug-punkte`.
  - Drei Herzen: ersetzen die drei Sterne in `#flug-sterne`, die heute schon die Leben zählen.
- Balken für die Flugzeit unter der Kopfkarte: neu.
- Bühne (Himmel mit Wolken und Notensystem): vorhanden `#flug-notensystem`. Neu sind:
  - Schild oben links „Ziellinie: 2. Linie (G4)“: neu, mit geänderter Bedeutung, siehe unten und Rückfrage.
  - Schild oben rechts „Violinschlüssel-Bahn“: neu.
  - Rakete mit Begleiter links vor dem Schlüssel: neu.
  - Schild „P1“ an der Rakete: Rückfrage.
  - Leuchtende Note mit Schild „Fang mich!“: Note vorhanden, Leuchten und Schild neu.
  - Sprechblase unten in der Bühne: Baustein „Sprechblase“ in der Größe „Zeile“, ersetzt im Flug `#flug-text`.
  - Einblendung „Welle 3!“: vorhanden als `#flug-level-einblendung`, Text von „Level“ auf „Welle“ ändern.
- Hinweiszeile über den Tasten „Tippe die Note oder drücke C bis H“ und rechts „Ton an“: Hinweis vorhanden als `#flug-tasten`, Tonanzeige neu.
- Sieben große Buchstabentasten mit Silben: vorhanden `#flug-antworten`, Farbe und Silbe neu.
- Karte „Klavier-Lotse“ mit Klaviatur und Tonumfang: neu.
- Karte „Merkspruch“ mit Merkspruch, Tempo und Pause: neu.
- Rückmeldung nach Fehler (Merkhilfe, Hinweis, „Weiter“): vorhanden (`#flug-merkhilfe`, `#flug-weiter`), neuer Platz siehe unten.

### Regeln der neuen Elemente

Welle statt Level

- Nur der Name ändert sich: „Welle 1“ und „Wave 1“. Die Logik in `neuerFlug` und `flugAntwort` bleibt (10 Noten je Welle, jede Welle etwa 15 % schneller).

Tempostufe in der Unterzeile

- Zeigt, wie schnell die aktuelle Welle ist, damit das Kind den steigenden Schwierigkeitsgrad sieht.
- Welle 1 und 2: „Gemütlich“ und „Cruise“. Welle 3 und 4: „Flott“ und „Zippy“. Welle 5 und 6: „Schnell“ und „Fast“. Ab Welle 7: „Rasant“ und „Turbo“.
- Neue Funktion `flugTempoStufe(level)` in `js/spiel-logik.js`, liefert einen Textschlüssel.

Combo

- Combo zählt die richtigen Antworten in Folge. Sie startet bei x1 und steigt mit jeder richtigen Antwort um 1, bis höchstens x5. Ein Fehler oder „zu spät“ setzt sie auf x1 zurück.
- Wirkung auf Punkte: Punkte für eine richtige Note = Grundpunkte × Combo-Stufe. Grundpunkte sind wie bisher Welle × Anzahl der gewählten Noten (`flugPunkteProNote`), danach wirkt die Tempo-Einstellung (siehe unten). Die Combo-Stufe ist die Stufe nach dieser Antwort: Die erste richtige Note zählt x1, die zweite in Folge x2.
- Begründung: Der Entwurf rechnet genauso (Punkte × Combo, zurück auf 1 bei Fehler). Die Obergrenze x5 verhindert, dass eine lange Serie die Rekorde sprengt, und bleibt für Kinder überschaubar.
- Die Pille zeigt immer „Combo x1“ bis „Combo x5“, damit die Kopfkarte nicht springt. Beim Erhöhen hüpft die Pille kurz. Bei x5 bekommt sie eine goldene Kante.
- Speicher: Feld `combo` im Flug-Objekt, nicht im Spielstand.
- Text: „Combo x3“ in beiden Sprachen. Für Screenreader „3 richtig in Folge“ und „3 in a row“.

Herzen

- Drei Herzen wie die drei Leben, die es heute schon gibt (`NOTENFLUG.leben = 3`).
- Ein Fehler oder „zu spät“ leert ein Herz von rechts. Das leere Herz bleibt als graue Kontur sichtbar.
- Bei 0 Herzen endet der Flug wie heute, danach erscheint das Ergebnisfenster.
- Herzen füllen sich im selben Flug nicht wieder auf, das bleibt wie heute und hält die Regeln einfach.
- Für Screenreader: „Noch 2 Herzen“ und „2 hearts left“.

Balken für die Flugzeit

- Zeigt, wie viel Zeit die aktuelle Note noch hat. Er ist zu Beginn voll und leert sich gleichmäßig, bis die Note den Schlüssel erreicht.
- Er steht still bei Pause, bei verstecktem Tab und während der Rückmeldung nach einem Fehler.
- Unter 25 % Restzeit wechselt die Farbe von Himmelblau zu Orange. Damit gibt es einen zweiten Hinweis neben der Position der Note.

Schild „Ziellinie“ in der Bühne

- Der Entwurf zeigt „Target Line: 2nd Line (G4)“, also die Lage und den Namen der fliegenden Note. Das verrät die Antwort. Siehe Rückfrage.
- Standard bis zur Antwort: Während des Flugs zeigt das Schild den Fortschritt in der Welle, „Note 3 von 10“ und „Note 3 of 10“. Nach einem Fehler oder „zu spät“ zeigt es die Lage der Note, zum Beispiel „Ziellinie: 2. Linie (g¹)“ und „Target line: 2nd line (G4)“, und das Notensystem hebt die Linie hervor wie heute.

Schild „Violinschlüssel-Bahn“

- Zeigt den Schlüssel der aktuellen Note: „Violinschlüssel-Bahn“ oder „Bassschlüssel-Bahn“, englisch „Treble clef runway“ oder „Bass clef runway“.
- Nützlich, wenn in den Einstellungen beide Schlüssel gewählt sind und die Schlüssel wechseln.

Rakete mit Begleiter

- Links vor dem Schlüssel steht eine kleine Rakete. Im Fenster sitzt der Kopf des gewählten Begleiters (Füchschen oder anderes Tier aus `js/tiere.js`), keine Hasenohren.
- Die Rakete markiert die Ziellinie des Flugs: Erreicht die Note die Rakete, ist es „zu spät“. Heute ist die Grenze der Schlüssel, die Rakete steht direkt davor, an der Flugzeit ändert sich nichts.
- Richtige Antwort: Die Rakete macht einen kurzen Satz nach vorn, die Note verschwindet mit einem Funkeln (300 ms, ohne Halt, Regel aus Abschnitt 18 von Plan Version 2).
- Fehler: Die Rakete wackelt kurz.
- Bei „Bewegung reduzieren“ (`prefers-reduced-motion`) entfallen Satz und Wackeln.

Leuchtende Note mit „Fang mich!“

- Die fliegende Note bleibt ein echter Notenkopf im Notensystem, damit das Kind die Lage liest. Der Entwurf zeigt eine runde Plakette mit Notensymbol, die die Lage verdecken würde. Neu ist nur ein weicher, gelber Schein hinter dem Notenkopf.
- Das Schild „Fang mich!“ („Catch me!“) steht unter dem System auf Höhe der Note und fliegt mit. Es steht nie im System, damit es keine Hilfslinien verdeckt. Es zeigt sich nur in Welle 1, danach kennt das Kind das Spiel.

Sprechblase in der Bühne

- Einzeilig, unten links in der Bühne.
- Beim Start: „Füchschen sagt: Tippe den Namen, bevor die Note die Rakete erreicht!“ und „Little Fox says: Tap the name before the note reaches the rocket!“.
- Während des Flugs nach einer richtigen Antwort wechselnd kurze Lobsätze aus den vorhandenen Rückmeldungen (`rueckmeldung`), ohne Halt.
- Die lange Rückmeldung nach einem Fehler steht nicht in der Bühne, sondern unter den Tasten (siehe unten), damit die Bühne ihre Höhe behält.

Hinweiszeile und „Ton an“

- Links: auf Geräten mit Tastatur „Tippe die Note oder drücke C bis H“ und „Tap a note or press keys C–B“. Auf Touch-Geräten ohne Tastatur „Tippe den Namen der Note“ und „Tap the note name“. Der getippte Anfang im Modus „Genau“ („d…“) erscheint wie heute in derselben Zeile.
- Rechts: „Ton an“ oder „Ton aus“ mit Lautsprecher, tippbar, schaltet den gemeinsamen Ton um.

Buchstabentasten mit Ton

- Neu: Jede Antworttaste spielt beim Drücken ihren Ton, wenn der Ton an ist. Im Modus „Genau“ ist das die gewählte Note. Im Modus „Einfach“ ist es der Buchstabe in der Oktave der fliegenden Note, damit die Antwort richtig klingt, wenn sie richtig ist.
- Nach einer richtigen Antwort leuchtet die Taste grün, nach einer falschen rot mit Kreuz, die richtige Taste bekommt einen Rahmen. Das ist heute schon so.

Karte „Klavier-Lotse“

- Kopf: Klaviersymbol, „Klavier-Lotse“ und „Piano navigator“, rechts der Tonumfang aus den Einstellungen, zum Beispiel „Violinschlüssel: c¹ bis h¹“ und „Treble range: C4–B4“ (vorhandene Funktion für den Bereichstext).
- Darunter die Klaviatur aus `js/klaviatur.js` über den gewählten Bereich, mindestens 7 weiße Tasten (Regel aus Abschnitt 17 von Plan Version 2). Weiße Tasten sind mit dem Buchstaben beschriftet.
- Eine weiße Taste antwortet wie die passende Buchstabentaste. Für die Antwort zählt der Name der Taste: im Modus „Einfach“ der Buchstabe, im Modus „Genau“ der Name mit Oktave.
- Schwarze Tasten antworten nur, wenn Noten mit Vorzeichen gewählt sind. Sonst klingen sie nur und kosten kein Herz. Begründung: Ein versehentlicher Tipp auf eine schwarze Taste soll im schnellen Spiel kein Leben kosten.
- Nach einem Fehler leuchtet die richtige Taste auf, damit das Kind die Lage auf dem Klavier sieht.
- Die Karte lässt sich zuklappen. Kopfknopf „Klaviatur zeigen“ und „Klaviatur verbergen“, englisch „Show keyboard“ und „Hide keyboard“. Der Zustand wird als `stand.flugKlaviatur` gespeichert. Standard: aufgeklappt ab 768 px Breite, zugeklappt auf dem Handy.

Karte „Merkspruch“

- Links Glühbirne, Überschrift „Merkspruch Violinschlüssel“ oder „Merkspruch Bassschlüssel“, englisch „Treble clef rhyme“ oder „Bass clef rhyme“, je nach Schlüssel der aktuellen Note.
- Darunter der Merkspruch. Die Anfangsbuchstaben sind fett und ergeben die Noten. Ein Tipp auf den Spruch wechselt zwischen Linien und Zwischenräumen. Er wechselt nicht von selbst mit der Note, weil das die Lage verraten würde.
- Sprüche (Vorschlag, Benutzer kann sie ändern, sie stehen in `js/noten-konfiguration.js` neben den Merktieren):
  - Violinschlüssel, Linien e g h d f: „Linien: Es geht hurtig durch Fleiß“ und „Lines: Every Good Boy Does Fine“.
  - Violinschlüssel, Zwischenräume f a c e: „Zwischenräume: Fünf Affen chillen einfach“ und „Spaces: F-A-C-E spells FACE“.
  - Bassschlüssel, Linien G H D F A: „Linien: Geh, hol doch frische Äpfel“ und „Lines: Good Boys Do Fine Always“.
  - Bassschlüssel, Zwischenräume A C E G: „Zwischenräume: Alle Clowns essen gern“ und „Spaces: All Cows Eat Grass“.
- Rechts zwei Knöpfe: Tempo und Pause.

Tempo

- Der Knopf zeigt „1,0x“ (englisch „1.0x“) und schaltet bei jedem Tipp weiter: 0,5x, 0,75x, 1,0x, 1,25x, dann wieder 0,5x.
- Wirkung: Flugzeit der Note = Flugzeit der Welle geteilt durch den Tempofaktor. 0,5x heißt also doppelt so viel Zeit.
- Wirkung auf Punkte: Grundpunkte × Combo × Tempofaktor, gerundet, mindestens 1. Begründung: Langsamer spielen hilft beim Lernen, darf aber keine leichten Rekorde bringen. Schneller spielen lohnt sich ein wenig.
- Eine Änderung gilt ab der nächsten Note.
- Das Ergebnis zeigt die Rechnung kurz, zum Beispiel „3 Noten × Welle 2 × Tempo 0,75 = 5 Punkte pro Note, dazu die Combo“.
- Speicher: `stand.flugTempo`, Standard 1, erlaubt nur die vier Werte.
- Aria-Text: „Tempo 1,0-fach, tippen zum Ändern“ und „Speed 1.0x, tap to change“.

Pause

- Der Knopf „Pause“ (englisch „Pause“) hält Note, Flugzeit-Balken und Zeit an. Über der Bühne liegt dann eine halbdurchsichtige Fläche mit „Pause“ und dem großen Knopf „Weiterfliegen“ (englisch „Keep flying“). Die Note ist während der Pause verdeckt, damit die Pause nicht zum Nachdenken ohne Zeitdruck dient.
- Der Pause-Knopf wird währenddessen zu „Weiter“ (englisch „Resume“).
- Leertaste oder Escape schalten die Pause um. Die vorhandene automatische Pause bei verstecktem Tab (`visibilitychange` in `js/modi/notenflug.js`) zeigt dieselbe Fläche.
- Pausen kosten nichts und zählen nicht.

Rückmeldung nach einem Fehler

- Wie heute hält das Spiel an und zeigt Lösung, Hinweis, Merkhilfe und „Weiter“ (`#flug-merkhilfe`, `#flug-text`, `#flug-weiter`).
- Neuer Platz: als Karte direkt unter den Buchstabentasten, an der Stelle des Klavier-Lotsen, der so lange nach unten rückt. Die Bühne und die Tasten bleiben an ihrer Stelle.

### Handy (360 px)

Von oben nach unten:

1. Oberes Menü ohne Reiter (56 px).
2. Kopfkarte zweizeilig: Zurück-Pfeil, rechts Herzen und eine Pause-Taste mit Symbol (48 px). Darunter Titel mit Unterzeile, darunter Combo und Punkte als Pillen. Auf dem Handy wandert die Pause also in die Kopfkarte, damit sie ohne Scrollen erreichbar ist.
3. Balken für die Flugzeit.
4. Bühne, 200 px hoch, Schilder oben in einer Zeile klein (Schlüssel-Schild nur als Schlüsselsymbol), Sprechblase unten einzeilig mit Auslassungspunkten.
5. Hinweiszeile.
6. Buchstabentasten: höchstens 5 je Reihe, 7 Buchstaben = 4 + 3, Tasten mindestens 56 px hoch. Sieben Spalten wie im Entwurf wären bei 360 px nur 41 px breit und damit zu klein.
7. Rückmeldung nach Fehler (nur bei Bedarf).
8. Klavier-Lotse zugeklappt.
9. Merkspruch mit Tempo-Knopf.

Bühne bis Tasten passen bei 740 px Höhe ohne Scrollen auf den Bildschirm.

## Klaviertasten

Entwurf 1f5292244e434b2b862eb6a3d9a0e078.

- Spielkopf mit „← Home“, „Aufgabe 1 von 10“, drei Sternen und Punkten: vorhanden (`#klavier-aufgabe`, `#titel-klavier`, `#klavier-sterne`, `#klavier-punkte`). Wird zur Kopfkarte.
- Titel „Welche Taste ist es?“ statt „Klaviertasten“ (englisch „Which key is it?“): Änderung, wie im Entwurf steht die Frage als Überschrift. Das Spielsymbol hinter der Überschrift zeigt weiter, in welchem Spiel das Kind ist.
- Begleiter mit Sprechblase oben rechts, halb über der Bühnenkarte: vorhanden (`#klavier-tier`, `#klavier-text`), neuer Platz. Er zeigt nur die kurze Aufgabe „Welche Taste passt zu dieser Note?“ und „Which key matches this note?“. Die Rückmeldung nach der Antwort bleibt unter der Klaviatur.
- Bühne mit Notensystem: vorhanden, `#klavier-notensystem`.
- Klaviatur als zweite Karte in derselben Breite: vorhanden, `#klaviatur`. Änderungen:
  - Wie im Entwurf zeigt die Klaviatur zwei weiße Tasten unter der tiefsten gewählten Note zusätzlich (im Entwurf g bis h¹ für c¹). Die Tasten sind tippbar, klingen und zählen als falsch, wie die schon vorhandenen Zusatztasten oberhalb.
  - Die Tasten sind wie im Entwurf unbeschriftet. Das mittlere C trägt seine vorhandene Markierung.
  - Hervorgehobene Zieltaste mit Schild „C4“: Der Entwurf markiert die richtige Taste vor der Antwort, das verrät die Lösung. Standard: Die Taste leuchtet mit Namensschild erst nach der Antwort auf, bei richtiger und falscher Antwort. Das ist eine Deutung des Entwurfs, kein Weglassen.
- Oberes Menü: nach Rückfrage, standardmäßig vorhanden.

Handy: Kopfkarte zweizeilig, Begleiter mit Sprechblase als Zeile über der Bühne (das Überlappen klappt bei 360 px nicht), Bühne, Klaviatur in voller Breite. Bei mehr als 10 weißen Tasten scrollt die Klaviatur waagerecht und springt zur gefragten Oktave, wie heute.

## Hör-Spiel

Entwurf 5cead1707802447d8af28e8f169a2543.

### Aufbau und Zuordnung

- Oberes Menü: neu, gemeinsamer Baustein.
- Kopfkarte: Der Entwurf zeigt keine Kopfkarte, sondern mittig die Pille „Aufgabe 1 von 10“ und darunter die Frage. Vorhanden: `#hoeren-aufgabe`, `#titel-hoeren`, `#hoeren-sterne`, `#hoeren-punkte`. Sterne und Punkte fehlen im Entwurf. Standard: Die Kopfkarte bleibt wie in den anderen Spielen, mit Zurück-Pille, Sternen und Punkten, damit die Wertung sichtbar ist. Die Frage „Welche Note hörst du?“ („Which note do you hear?“) ist die Überschrift.
- Rückmeldungs-Banner oben mit Titel, Untertitel und „Nächste Note →“: neu.
- Steuerzeile:
  - Große Taste „Nochmal hören“: vorhanden `#hoeren-nochmal`, wird groß und pillenförmig mit kleiner Wellen-Animation beim Abspielen.
  - Kästchen „PITCH C4“: entspricht dem vorhandenen Bezugston-Knopf `#hoeren-bezug` mit `#hoeren-bezug-name`. Neu gestaltet als Kästchen mit Klaviersymbol, oben klein „Bezugston“ („Reference“), darunter „c¹“ („C4“). Tippen spielt c¹.
  - Begleiter mit Sprechblase: vorhanden `#hoeren-tier`, als „Zeile“ rechts in der Steuerzeile.
- Drei Antwortkarten nebeneinander: vorhanden `#hoeren-optionen`. Neu je Karte:
  - Ziffernkreis oben links „1“, „2“, „3“. Der Entwurf schreibt „A“, „B“, „C“. Das verwechseln Kinder mit Notennamen, deshalb Ziffern. Tasten 1, 2 und 3 wählen die Karte.
  - Tipp-Symbol oben rechts.
  - Mini-Notensystem in der Mitte: vorhanden.
  - Beschriftung unten: „Violinschlüssel (h¹)“ und „Treble staff (B4)“ oder „Bassschlüssel (f)“ und „Bass staff (F3)“. Siehe Rückfrage, ob der Name schon vor der Antwort dastehen darf. Standard bis zur Antwort: vor der Antwort nur der Schlüssel, nach der Antwort der volle Text mit Namen.
- Karte „Spielzeug-Klavier“: neu.
- Hinweis bei stummem Gerät: vorhanden `#hoeren-hinweis`, dazu neu der Knopf „Ton einschalten“.
- Fußzeile: neu, gemeinsamer Baustein.

### Regeln der neuen Elemente

Rückmeldungs-Banner

- Erscheint nach jeder Antwort. Damit nichts verrutscht, liegt es über dem Kopfbereich (über der Kopfkarte), statt Platz einzufügen. Notensystem, Steuerzeile und Karten bleiben an ihrer Stelle.
- Richtig: Titel „Super Ohr! Das war c¹!“ und „Super ear! That was C4!“. Untertitel ist der vorhandene Lage-Hinweis, zum Beispiel „Die Note liegt auf der ersten Hilfslinie unter dem System.“ Dazu ein kurzer Akkord als Lob, wenn der Ton an ist.
- Falsch: Titel „Fast! Hör noch einmal genau hin.“ und „Not quite! Listen closely.“ Untertitel: „Das war c¹. Es klingt tiefer als h¹.“ und „That was C4. It sounds lower than B4.“ (Vergleich mit der gewählten Karte über die Tonhöhe.) Die richtige Karte bekommt eine grüne Kante, die gewählte eine rote mit Kreuz.
- Knopf „Nächste Note →“ und „Next note →“ ersetzt `#hoeren-weiter` und spielt den nächsten Ton gleich ab.
- Die Merkhilfe des Begleiters bleibt in der Sprechblase.

Spielzeug-Klavier

- Kopf: „Spielzeug-Klavier“ und „Toy piano“, rechts „Tippe Tasten zum Anhören!“ und „Tap keys to hear them!“.
- Klaviatur aus `js/klaviatur.js` über den gewählten Bereich, mindestens eine Oktave, weiße Tasten beschriftet.
- Die Tasten klingen nur, sie antworten nicht und zählen nichts. Das Kind kann den gehörten Ton vergleichen. Das ist im Hör-Spiel erlaubt, weil es Hören übt.

### Handy (360 px)

Menü, Kopfkarte, Banner überlagert die Kopfkarte, Steuerzeile in zwei Reihen (oben „Nochmal hören“ über die volle Breite, darunter Bezugston und Begleiter-Zeile), die drei Karten untereinander mit Notensystem links und Beschriftung rechts (je etwa 96 px hoch), Spielzeug-Klavier, Fußzeile.

## Melodie

Entwurf 5fc8119e96db4beca5d0d74a33c0a469.

### Aufbau und Zuordnung

- Oberes Menü: neu.
- Kopfbereich zweispaltig: links das Etikett „Melodie 1 von 5“ mit Notensymbol (vorhanden `#melodie-aufgabe`) und die Überschrift „Spiel die Melodie!“ (vorhanden `#titel-melodie`, englisch „Play the melody!“), rechts Sprechblase mit Begleiter (vorhanden `#melodie-tier`, `#melodie-text`). Sterne und Punkte (`#melodie-sterne`, `#melodie-punkte`) fehlen im Entwurf. Standard: Sie stehen als Pillen unter der Überschrift, damit die Wertung sichtbar bleibt.
- Sprechblase: „Spiel die Noten der Reihe nach, von links nach rechts. Die orange Note ist dran!“ und „Play the notes in order, from left to right. The orange note is next!“.
- Notenkarte mit hervorgehobener Säule um die aktuelle Note: vorhanden (`#melodie-notensystem`, Rahmen der aktuellen Note aus Commit f6b3dd7). Neu ist die orange Farbe der aktuellen Note und Grün für gespielte Noten.
- Zeile unter dem System „Note 1 von 6: mittleres C (c¹)“: neu, aber ohne Namen, siehe Rückfrage. Standard: „Note 1 von 6“ und „Note 1 of 6“. Nach dem richtigen Ton erscheint kurz der Name, zum Beispiel „c¹ – richtig!“.
- Klavierkarte: vorhanden `#melodie-klaviatur`. Neu ist der Kopf mit Klaviersymbol, „Spiel die passende Taste“ („Play the matching key“) statt „Tippe die markierte Taste“, und rechts die Pille „Oktave: c¹ bis h¹“ beziehungsweise „Range: C4–B4“. Die Zieltaste ist nicht markiert, siehe „Tipp“.
- Aktionszeile:
  - „Melodie anhören“ (englisch „Hear melody“): neu als dauerhafter Knopf. Heute gibt es `#melodie-nochmal` erst am Ende.
  - „Tipp“ (englisch „Hint“): neu.
  - „Neu starten“ (englisch „Restart“): neu.
- Fußzeile: neu.

### Regeln der neuen Elemente

Melodie anhören

- Spielt die ganze Melodie im Abstand von 400 ms, die Noten leuchten dabei nacheinander, wie am Ende einer Melodie heute schon.
- Kostet nichts. Das Kind hört die Melodie, findet die Tasten aber selbst.
- Während des Abspielens sind die Tasten gesperrt.

Tipp

- Die Zieltaste leuchtet 1,5 Sekunden mit Namensschild und spielt ihren Ton.
- Ein Tipp zählt für die Sterne wie ein Fehler (Sterne aus `melodieSterne`: 0 bis 2 Fehler 3 Sterne, bis 5 Fehler 2, sonst 1). Die Note zählt danach nicht mehr als „beim ersten Versuch richtig“. Begründung: Ohne Preis könnte ein Kind jede Note über den Tipp lösen und trotzdem drei Sterne bekommen.
- Die Sprechblase sagt vorher, was der Tipp kostet: „Ein Tipp zählt wie ein kleiner Fehler.“ und „A hint counts as a small mistake.“ (nur beim ersten Tipp der Runde).

Neu starten

- Setzt die aktuelle Melodie auf die erste Note zurück. Bereits gemachte Fehler bleiben gezählt, damit Neustarten nicht zum Löschen von Fehlern taugt.
- Kein Bestätigungsfenster, weil nichts verloren geht außer dem Fortschritt in dieser Melodie.

Speicher: Fehler und Tipps im Rundenobjekt des Melodie-Spiels, nicht im Spielstand. Neue Logikfunktion `melodieTipp(runde)` in `js/spiel-logik.js` oder Erweiterung des vorhandenen Melodie-Zustands.

### Handy (360 px)

Menü, Etikett und Überschrift, Pillen, Sprechblase als Zeile, Notenkarte (waagerecht im Ausschnitt, aktuelle Note bleibt sichtbar wie heute), Zeile „Note 1 von 6“, Klavierkarte, Aktionszeile mit drei gleich breiten Knöpfen (Symbol und kurzes Wort, je mindestens 48 px hoch), Fußzeile.

## Note setzen

Entwurf 3fbfea704f2f47ed90f3b861a8909c17 (gewählte Fassung, Bestätigung des Benutzers steht noch aus).

- Kopfkarte mit „Home“, „Aufgabe 1 von 10“, „Setze die Note“ und einem Kästchen mit dem Zielnamen, drei Sterne, „0 Punkte“: vorhanden (`#setzen-aufgabe`, `#titel-setzen`, `#setzen-name`, `#setzen-sterne`, `#setzen-punkte`). Das Kästchen mit dem Namen bekommt die Form aus dem Entwurf.
- Zweispaltig im Verhältnis 8 zu 4: Notenkarte links, Bedienung rechts. Heute stehen die Teile untereinander, das wird ab Tablet-Breite zweispaltig.
- Notenkarte mit tippbaren Linien und Zwischenräumen, Notenkopf mit kleinem Namensschild daneben: Notensystem vorhanden, Namensschild am Notenkopf neu. Es zeigt den gesuchten Namen, nicht den Namen der aktuellen Position, damit es nichts verrät.
- Rechte Spalte oben: Tasten ▼ „Tiefer“, ▲ „Höher“ und die breite Taste „Prüfen“: vorhanden (`#setzen-tiefer`, `#setzen-hoeher`, `#setzen-pruefen`), in einer Zeile wie im Entwurf. Die Vorzeichen-Knöpfe (`#setzen-vorzeichen`) stehen darunter.
- Rechte Spalte darunter: Begleiter mit Sprechblase „Tippe ins Notensystem, wo d hingehört. Dann tippe auf Prüfen.“ und „Tap the staff where D goes. Then tap Check.“: vorhanden (`#setzen-tier`, `#setzen-text`).
- Tastatur: Pfeiltasten und Enter: vorhanden (`js/modi/note-setzen.js`).
- Fußzeile „Lesson 1: Treble Staff Fundamentals · Note D“: Die gemeinsame Fußzeile ersetzt sie. Statt „Lektion 1“ steht in der Statuszeile über der Fußzeile der Schlüssel und der Name, zum Beispiel „Violinschlüssel · Note d“ und „Treble clef · Note D“. Die App hat keine Lektionen, siehe Rückfrage zu Lektionen.

Handy: Kopfkarte, Notenkarte in voller Breite, darunter die Zeile ▼ ▲ Prüfen (je 56 px, Prüfen dehnt sich), Vorzeichen-Knöpfe, Begleiter mit Sprechblase. Wie heute.

## Noten-Memory

Entwurf f655bf9c2c2943a3888a5477f7f46125.

- Kopfkarte dreispaltig: „← Home“, Überschrift „Noten-Memory“, rechts „6 Züge“ und „1 von 6 Paaren“ mit grünem Punkt: vorhanden (`#titel-memory`, `#memory-status`, `#memory-zuege`, `#memory-paare`), wird zur Kopfkarte mit Pillen.
- Stufenwahl Normal oder Schwer: vorhanden (`#memory-wahl`), fehlt im Entwurf, bleibt, weil sie eine Regel des Spiels ist.
- Raster 4 Spalten × 3 Reihen ab Tablet-Breite, Schwer 5 × 4: vorhanden (`#memory-karten`), Reihenaufteilung prüfen.
- Rückseite mit Streifen und Notensymbol: vorhanden.
- Neu je Karte:
  - Abzeichen „✓ Gefunden“ und „✓ Matched“ oben rechts auf gefundenen Paaren.
  - Abzeichen „Aufgedeckt“ und „Flipped“ auf den gerade aufgedeckten Karten.
  - Unterschrift unter dem Inhalt: Notenkarte „Violinschlüssel“ oder „Bassschlüssel“ („Treble clef“, „Bass clef“), Namenskarte „Notenname“ („Note name“). Nach dem Finden eines Paares tragen beide Karten den Namen, zum Beispiel „Note e¹“ und „Note E4“.
- Hilfeleiste unten mit Begleiter und breiter Sprechblase: vorhanden (`#memory-tier`, `#memory-text`). Text nach einem Paar: „Super, du hast c¹ gefunden!“ und „Great job! You found C4!“.
- Siegerfenster: neu, siehe nächster Abschnitt.

Handy: Kopfkarte zweizeilig (Titel oben, Pillen darunter), Raster 3 Spalten bei Normal (4 Reihen), 4 Spalten bei Schwer (5 Reihen), die Reihenregeln aus Commit bfc6e2c bleiben. Die Abzeichen werden zu einem Häkchen ohne Text, damit sie die kleinen Karten nicht füllen. Die Unterschriften entfallen auf dem Handy.

## Noten-Memory: Siegerfenster (gemeinsames Ergebnisfenster)

Entwurf 0f065ae1001949f8aaef4eab3f1762c5. Ersetzt den Aufbau von `#ansicht-ergebnis`.

### Aufbau und Zuordnung

- Fenster über dem abgedunkelten, unscharfen Spielfeld: neu. Die Spielansicht bleibt dahinter sichtbar, `#ansicht-ergebnis` wird zu einem Dialog (`<dialog>` oder `role="dialog"` mit Fokusfalle). Escape schließt nicht, weil es keine sinnvolle Ansicht dahinter gibt; die Knöpfe unten führen weiter.
- Sternabzeichen oben über dem Rand: neu, gezeichnet.
- Etikett „Runde geschafft!“ und „Round complete!“: ersetzt `#titel-ergebnis`. Bei vorzeitigem Ende im Notenflug: „Flug beendet!“ und „Flight over!“.
- Unterzeile „Memory-Meister!“ und „Memory master!“: siehe Rückfrage zu Abzeichen. Standard: ein Satz je Spiel bei drei Sternen, ohne Sammlung von Abzeichen, sonst der vorhandene Spruch `#ergebnis-spruch`.
- Drei Sternkästchen, das mittlere größer: ersetzt die heutige Sternanzeige. Volle Sterne für die neuen Sterne der Runde, leere Konturen für die übrigen.
- Pille „★★★ 3 Sterne verdient!“ und „3 stars earned!“: neu, Einzahl „1 Stern verdient!“ und „1 star earned!“.
- Begleiter-Karte mit Tier und Spruch, zum Beispiel „Füchschen sagt: Hurra! Du hast alle 6 Paare in nur 14 Zügen gefunden!“ und „Little Fox says: Hooray! You matched all 6 pairs in just 14 moves!“: vorhanden als `#ergebnis-tier` und `#ergebnis-spruch`, neu angeordnet. Kein Partyhut, weil `js/tiere.js` keine Hüte zeichnet; der Begleiter hüpft einmal.
- Raster 2 × 2 mit Werte-Kärtchen: neu, je Spiel:
  - Noten-Memory: „Zeit 0:48“, „Züge 14“, „Paare 6 von 6“, „Punkte +150“.
  - Welche Note ist das?, Klaviertasten, Note setzen, Hör-Spiel: „Richtig 9 von 10“, „Fehler 1“, „Zeit 1:12“, „Punkte +120“.
  - Notenflug: „Wellen 2“, „Gefangen 23“, „Beste Combo x5“, „Punkte +480“.
  - Melodie: „Melodien 5“, „Fehler 2“, „Tipps 1“, „Punkte +80“.
  - Notenreise: „Etappen 3 von 3“, „Richtig 13 von 15“, „Tage in Folge 4“, „Extrastern ja“.
  - Englisch: „Time“, „Moves“, „Pairs“, „Points“, „Correct“, „Mistakes“, „Waves“, „Caught“, „Best combo“, „Melodies“, „Hints“, „Stages“, „Day streak“, „Bonus star“.
- Fortschrittskarte: „Sterne gesamt: 21“ mit Abzeichen „+3 neu“, rechts das nächste Tier, darunter Fortschrittsbalken und „Noch 1 Stern bis zum nächsten Tier!“: vorhanden als `#tier-fortschritt` mit Silhouette, neu angeordnet. Der Entwurf nennt das nächste Tier mit Namen („Next: Puppy“), siehe Rückfrage. Standard: Silhouette mit „???“ wie heute.
- Neues Tier entdeckt: vorhanden `#neues-tier`, steht im Fenster über der Fortschrittskarte, wenn ein Tier dazukommt.
- Rekord: vorhanden (`#rekord-zeile`, `#knopf-rekord-speichern`, `#rekord-name`). Steht im Fenster unter den Werte-Kärtchen, wenn das Ergebnis in die Top 5 kommt. Der Entwurf zeigt das nicht, es bleibt aber nötig, weil sonst keine Namen in die Rekorde kommen.
- Haupttaste „Nochmal spielen“ (englisch „Play again“) mit Pfeilkreis-Symbol: vorhanden `#knopf-nochmal`.
- „Fehler üben“: vorhanden `#knopf-ueben`, erscheint als zweite große Taste unter „Nochmal spielen“, wenn es Fehler gab.
- Zwei Tasten nebeneinander „Zoo“ und „Rekorde“ (englisch „Zoo“ und „Scores“): „Zoo“ ist `#knopf-ergebnis-start`, „Rekorde“ neu, öffnet die Rekorde mit dem Abschnitt dieses Spiels im Blick.

### Regeln der neuen Elemente

Zeit

- Die Spielzeit läuft vom ersten Zug beziehungsweise der ersten Aufgabe bis zum Ende. Pausen und versteckter Tab zählen nicht.
- Die Zeit ist nur eine Anzeige. Sie ändert weder Sterne noch Punkte, damit kein Druck entsteht.
- Format „0:48“ und „1:12“. Neue kleine Hilfsfunktion `formatiereDauer(ms)` in `js/spiel-logik.js` mit Test.

Werte im Ergebnisobjekt

- Das gemeinsame Ergebnisformat (`klassischesErgebnis` und die Gegenstücke der Modi) bekommt die Felder `dauer`, `fehler`, `besteCombo`, `tipps`, soweit das Spiel sie kennt. Nicht gesetzte Felder zeigt das Fenster nicht, dann rückt ein anderes Kärtchen nach.

### Handy (360 px)

Das Fenster füllt die Breite mit 12 px Rand und scrollt in sich. Reihenfolge: Etikett, Überschrift, Sterne, Pille, Begleiter-Karte, neues Tier (falls vorhanden), Werte-Kärtchen 2 × 2, Rekord, Fortschrittskarte, Nochmal spielen, Fehler üben, Zoo und Rekorde nebeneinander. „Nochmal spielen“ ist ohne Scrollen sichtbar, wenn kein neues Tier dazukam; mit neuem Tier scrollt das Fenster zu Beginn nicht, damit das Kind das Tier zuerst sieht.

## Fehler üben und Tägliche Notenreise

Für beide gibt es keinen Entwurf. Sie übernehmen die gemeinsamen Bausteine:

- Fehler üben (`#ansicht-ueben`): Kopfkarte mit „Zoo“, Unterzeile „Übung 2 von 6“ (vorhanden `#ueben-aufgabe`), keine Sterne und Punkte, Antworttasten mit Farbe und Silbe, Klaviatur als Karte wie bei Klaviertasten. Das Ende (`#ueben-ende`) bekommt das Ergebnisfenster mit nur zwei Werte-Kärtchen („Geübte Noten 3“, „Aufgaben 6“) und ohne Sterne, weil Fehler üben keine Sterne gibt.
- Tägliche Notenreise (`#ansicht-reise`): oberes Menü mit aktivem Reiter „Notenreise“, Kopfkarte mit „Zoo“, Titel und Unterzeile „4 Tage in Folge“ (vorhanden `#reise-status`), Etappen als Karten mit Spielsymbol (vorhanden `#reise-etappen`), Begleiter mit Sprechblase, Taste „Los geht's“ (`#reise-los`). Die Etappen nutzen die Spielansichten mit ihrem neuen Aufbau.

## Meine Tiere

Entwurf 5b984940c5ed41ad9d438ceff00aa18f. Der Aufbau ist weitgehend vorhanden.

- Kopfzeile mit „Zurück“ und Titel mittig: vorhanden (`header.seiten-kopf`, `#titel-tiere`). Der Entwurf zeigt kein oberes Menü. Nach der Rückfrage zum oberen Menü standardmäßig mit Menü und aktivem Reiter „Meine Tiere“.
- „Gesammelte Sterne: 18“: vorhanden `#tiere-sterne`.
- „Noch 2 Sterne bis zum nächsten Tier. Entdeckt: 4 von 25.“: vorhanden `#tiere-naechstes` (Texte `tiere.noch`, `tiere.entdeckt`).
- Schmaler Balken zum nächsten Tier: neu, gemeinsamer Baustein.
- Raster mit 2 bis 5 Spalten je nach Breite: vorhanden `#tier-liste`, Spaltenzahl angleichen (360 px: 2, 600 px: 3, 900 px: 4, ab 1200 px: 5).
- Entdeckte Karte mit Tier, Name und Knopf „Auswählen“: vorhanden (`tiere.auswaehlen`).
- Aktive Karte mit Rand und „✓ Begleiter“: vorhanden (`tiere.begleiter`).
- Unentdeckte Karte mit Silhouette und „???“, ohne Knopf: vorhanden.
- Seltene Tiere mit Funkelstern: vorhanden, fehlt im Entwurf, bleibt.

Handy: zwei Spalten, Knopf „Auswählen“ über die volle Kartenbreite, mindestens 48 px hoch.

## Rekorde

Entwurf c250c7f14b9541ff9ec3b70472307f25.

### Aufbau und Zuordnung

- Oberes Menü: neu.
- Titelzeile mit „Zurück“, Titel „Rekorde“ (englisch „High scores“) und Pille „Ruhmeshalle“ mit Pokal (englisch „Hall of fame“): Zurück und Titel vorhanden (`#titel-rekorde`), Pille neu, nur Schmuck ohne Funktion.
- Kopfkarte (Banner) mit Orden, „Bestenliste“ und „Übe jeden Tag, sammle goldene Sterne und komm ganz nach oben!“, englisch „Leaderboard“ und „Practice every day, earn golden stars, and reach the top!“, rechts drei Schmucksterne: neu, nur Anzeige. „Safari“ aus dem Entwurfstitel entfällt, weil „Safari“ im Menü schon „Meine Tiere“ bedeutet.
- Abschnitt je Spiel mit Spielsymbol vor der Überschrift: vorhanden (`#rekorde-inhalt`, Commit f319c91).
- Etikett „Zuletzt gespielt“ (englisch „Last played“) rechts neben der Überschrift des zuletzt gespielten Spiels: neu, siehe unten. Der Entwurf schreibt „Active Game“; da auf der Rekordseite kein Spiel läuft, ist „Zuletzt gespielt“ die passende Bedeutung.
- Liste mit bis zu 5 Karten: Platznummer groß, Punkte, Name darunter (kursiv „Ohne Namen“ nur, wenn der Name übersprungen wurde), rechts Sterne und Datum: vorhanden. Die Nummer von Platz 1 bekommt die Gold-Farbe.
- Leere Karte mit Text und Knopf zum Spielen: Text vorhanden, Knopf neu, siehe unten.
- Zweispaltiges Raster für kleinere Abschnitte (Memory, Note setzen): Der Entwurf zeigt dort nur Platzhaltertexte ohne Liste („Drag notes onto the musical staff“). Die App zeigt für alle Spiele die Rekordliste. Übernommen wird das zweispaltige Raster: ab 900 px stehen die Abschnitte ab dem dritten Spiel in zwei Spalten. Die Platzhaltertexte entfallen, weil sie für Spiele mit Rekorden keine Information tragen und „Drag“ falsch ist (Note setzen tippt, es zieht nicht).
- Große Taste unten „Spiele „Welche Note ist das?““: neu, startet das klassische Spiel. Englisch „Play “What Note Is This?”“.
- Fußzeile: neu.

### Regeln der neuen Elemente

Zuletzt gespielt

- Speicher: `stand.letzterModus`, Kennung des zuletzt verbuchten Modus, gesetzt in `verbucheErgebnis`. Standard leer, dann zeigt kein Abschnitt das Etikett.
- Der Abschnitt des zuletzt gespielten Spiels steht ganz oben, die übrigen in der festen Reihenfolge der Startseite. Begründung: Nach einer Runde springt das Kind über „Rekorde“ im Ergebnisfenster hierher und will seinen Eintrag sehen.

Knopf in der leeren Karte

- Text je Spiel: „Notenflug starten“ („Start Note Flight“), „Klaviertasten spielen“ („Play Piano Keys“), allgemein „{Spiel} spielen“ und „Play {game}“.
- Startet das Spiel direkt mit den aktuellen Einstellungen. Reichen die Noten nicht (weniger als 3), zeigt er den vorhandenen Hinweis zu den Einstellungen.

### Handy (360 px)

Menü, Titelzeile (Pille „Ruhmeshalle“ nur als Pokalsymbol), Banner ohne Schmucksterne, Abschnitte einspaltig, in den leeren Karten Text und Knopf untereinander, große Taste unten über die volle Breite, Fußzeile.

## Einstellungen

Entwurf 425b4c8f252941dba4eddbe78a140ad9.

### Aufbau und Zuordnung

- Kopfzeile mit „Zurück“, Titel und rechts „Zurücksetzen“ mit Kreispfeil: Zurück und Titel vorhanden (`#titel-einstellungen`), „Zurücksetzen“ neu. Die Kopfzeile bleibt beim Scrollen oben.
- Hinweiskarte mit Begleiter, „Übungsauswahl“ und „Wähle aus, welche Noten in deinen Notenzoo-Spielen vorkommen. Tippe Noten an, um sie hinzuzufügen oder zu entfernen.“, englisch „Practice picker“ und „Pick which notes appear in your Note Zoo games. Tap notes to add or remove them.“: neu als Karte. Der vorhandene Satz `einst.info` („Die Einstellungen gelten für alle Spiele …“) wandert als zweite Zeile in diese Karte. Der Begleiter ist das gewählte Tier statt des Hasen.
- Gruppenkasten „Antworten“ mit zwei großen Feldern „Einfach · C D E …“ und „Genau · c¹ d² …“ und Erklärtext: vorhanden (`einst.antworten`, `einst.einfach`, `einst.genau`, `einst.erklaerungEinfach`). Neu ist die zweite Zeile mit Beispielen in jedem Feld.
- Gruppenkasten „Schlüssel“ mit zwei Zeilen: Kästchen, Name, Schlüsselsymbol rechts: vorhanden (`einst.schluessel`), Schlüsselsymbol rechts neu.
- Merktiere-Schalter: vorhanden, fehlt im Entwurf, bleibt als eigener Gruppenkasten „Merktiere“ zwischen „Schlüssel“ und den Noten.
- Gruppenkasten „Noten im Violinschlüssel“ mit Schnellwahl „Erste Noten c¹–g¹“, „1 Oktave c¹–c²“, „2 Oktaven c¹–c³“, „Alle“, „Keine“: vorhanden (`einst.noten.violin`, `einst.schnellwahl`). Neu ist die zweite Zeile mit dem Bereich auf jedem Schnellwahl-Knopf.
- Oktavblöcke mit Überschrift und Linie, Stammtöne in 7 Spalten mit Häkchen, darunter unterlegte Zeilen „mit ♯“ und „mit ♭“, jedes Vorzeichen unter seinem Stammton mit Lücken bei e/h beziehungsweise c/f: vorhanden (Commit 27677f5). Prüfen, dass die Lücken wie im Entwurf gesetzt sind.
- Gruppenkasten „Noten im Bassschlüssel“: vorhanden, gleicher Aufbau. Die App zeigt die Oktaven aufsteigend wie der Entwurf beim Bassschlüssel. Beim Violinschlüssel zeigt der Entwurf ebenfalls aufsteigend (4, 5, 6), das passt.
- Feste Leiste unten mit rundem Zähler „12“, „12 Noten gewählt“, „Bereit für den Notenzoo!“ und Taste „Speichern und spielen →“: neu.

### Regeln der neuen Elemente

Zurücksetzen

- Setzt Schlüssel, Notenauswahl, Antwortmodus und Merktiere auf die Standard-Einstellungen aus `js/noten-konfiguration.js` zurück (vorhanden über `bereinigeEinstellungen` mit leerer Eingabe). Sterne, Tiere, Rekorde, Sprache, Ton und Tempo bleiben.
- Vorher fragt ein kleines Fenster: „Alle Einstellungen zurücksetzen?“ mit „Zurücksetzen“ und „Abbrechen“, englisch „Reset all settings?“, „Reset“, „Cancel“.
- Aria-Text des Knopfs: „Einstellungen auf Standard zurücksetzen“ und „Reset settings to default“.

Feste Leiste unten

- Der Zähler zeigt die Zahl der gewählten Noten über alle angekreuzten Schlüssel. Im Modus „Einfach“ zusätzlich die Zahl der verschiedenen Buchstaben, wenn sie kleiner ist: „12 Noten gewählt, 7 Buchstaben“ und „12 notes selected, 7 letters“.
- Zweite Zeile: genug Noten „Bereit für den Notenzoo!“ und „Ready to play Note Zoo!“. Zu wenig Noten: der vorhandene Hinweis in Kurzform „Wähle mindestens 3 Noten.“ und „Pick at least 3 notes.“, der Zähler wird orange, die Taste ist ausgegraut. Der ausführliche Hinweis (`einst.zuWenigEinfach`, `einst.zuWenigGenau`) bleibt im Formular.
- Taste „Speichern und spielen“ („Save & play“): Die Einstellungen speichern sich wie heute sofort bei jeder Änderung. Die Taste startet „Welche Note ist das?“ mit den neuen Einstellungen. Begründung: Nach dem Einstellen will das Kind die Noten ausprobieren; das klassische Spiel ist der Hauptmodus.

### Handy (360 px)

Kopfzeile (Zurücksetzen nur als Symbol, 44 px), Hinweiskarte, „Antworten“ mit den zwei Feldern untereinander, Schlüssel, Merktiere, Schnellwahl im Raster mit 2 Spalten, Oktavblöcke mit 7 Spalten (Knöpfe etwa 42 px breit und 48 px hoch, Vorzeichen-Knöpfe 40 px hoch). Feste Leiste unten 72 px hoch, darüber genug Abstand, damit die letzte Oktave nicht verdeckt wird. Die Leiste berücksichtigt den unteren sicheren Bereich (`env(safe-area-inset-bottom)`).

---

## Rückfragen an den Benutzer

Bis zur Antwort gilt jeweils die genannte Standardlösung.

- **Oberes Menü auf allen Seiten oder nur dort, wo der Entwurf es zeigt?** Die Entwürfe sind uneinheitlich: Notenflug, Hör-Spiel, Melodie und Rekorde zeigen das Menü, Welche Note ist das?, Klaviertasten, Note setzen, Memory, Meine Tiere und Einstellungen nicht. Wörtlich übernommen hätten Spiele unterschiedliche Kopfbereiche. Standard: Menü auf allen Seiten außer der Startseite und dem Ergebnisfenster.
- **Menü während einer laufenden Runde.** Ein Tipp auf einen Reiter würde die Runde verwerfen. Standard: Rückfrage „Runde beenden?“. Alternative: Reiter in Spielen ausblenden und nur Fortschritt und Zähler zeigen.
- **Profilknopf.** Die App hat kein Spielerprofil, Namen gibt es nur bei Rekorden. Standard: Der Knopf öffnet die Einstellungen und zeigt ein Zahnrad. Alternative wäre ein neues Spielerprofil („Wer spielt gerade?“) mit eigenen Sternen und Tieren je Kind; das widerspricht der Regel aus Plan Version 2, dass Sterne und Tiere für das Gerät gemeinsam sind.
- **Schild „Ziellinie: 2. Linie (G4)“ im Notenflug.** Es verrät Lage und Namen der fliegenden Note, das Spiel wäre ohne Lesen lösbar. Standard: Während des Flugs zeigt das Schild „Note 3 von 10“, die Lage erst nach einem Fehler.
- **Schild „P1“ an der Rakete.** Es gibt keinen zweiten Spieler. Standard: weglassen. Alternative: Anfangsbuchstabe des zuletzt gewählten Spielernamens.
- **Solfège-Silben (Do, Re, Mi) unter den Buchstaben.** Im deutschsprachigen Unterricht sind feste Silben für C, D, E unüblich, und „Ti“ für H kann verwirren. Standard: Silben anzeigen wie im Entwurf. Alternative: nur englisch anzeigen oder in den Einstellungen abschaltbar machen.
- **Combo als Punkte-Faktor und alte Notenflug-Rekorde.** Mit Combo bis x5 und Tempo steigen die Punkte deutlich, alte Notenflug-Rekorde sind dann leicht zu schlagen. Standard: alte Rekorde stehen lassen. Alternative: Notenflug-Rekorde einmalig zurücksetzen.
- **Namen auf den Antwortkarten im Hör-Spiel.** Der Entwurf zeigt „Treble Staff (C4)“ schon vor der Antwort. Dann muss das Kind die Noten nicht mehr lesen, nur noch hören und den Namen zuordnen. Standard: vor der Antwort nur der Schlüssel, danach der Name.
- **„Note 1 von 6: mittleres C (c¹)“ und markierte Zieltaste im Melodie-Spiel.** Beides verrät, welche Taste zu drücken ist. Standard: Zeile ohne Namen, Zieltaste nur über den Knopf „Tipp“, der wie ein Fehler zählt.
- **Name des nächsten Tiers im Ergebnisfenster („Next: Puppy“).** Heute bleibt das nächste Tier eine Überraschung (Silhouette, „???“), das ist Teil des Sammelreizes. Standard: Silhouette ohne Namen.
- **„Memory Master Badge Earned!“** Die App hat keine Abzeichen-Sammlung. Standard: nur ein Lob-Satz bei drei Sternen, keine Sammlung. Alternative: neue Abzeichen-Sammlung in „Meine Tiere“, das wäre ein eigenes größeres Paket.
- **Ergebnisfenster für alle Spiele.** Stitch zeigt das Fenster nur für Memory. Standard: alle Spiele nutzen es, damit das Ergebnis überall gleich aussieht.
- **„Lessons“ und „Lesson 1: Treble Staff Fundamentals“.** Die App hat keine Lektionen. Standard: Reiter „Lessons“ führt zur Täglichen Notenreise, die Fußzeile von Note setzen zeigt Schlüssel und Notennamen. Eine Lektionsreihe mit festen Stufen wäre eine neue, größere Funktion.
- **Startseite ohne oberes Menü.** Der Entwurf der Startseite zeigt keins, deshalb fehlen dort Sterne und Noten-Zähler. Standard: kein Menü auf der Startseite. Alternative: Menü auch dort, dann könnte die untere Reihe „Meine Tiere / Rekorde / Einstellungen“ entfallen.

---

## Reihenfolge der Umsetzung

Jedes Paket ist ein lokaler Commit ohne Zusatzzeilen. Nach jedem Paket: `node --test`, Bildschirmfotos mit `node /tmp/notenspiel-e2e/seite.js <seite> <name>` in 360 und 1024 px, Deutsch und Englisch kurz ansehen.

1. **Neue Logik mit Tests** (`js/spiel-logik.js`, `tests/spiel-logik.test.js`):
   - Spielstand: Felder `ton`, `flugTempo`, `flugKlaviatur`, `notenGesamt`, `letzterModus` mit Standardwerten und Bereinigung alter Spielstände.
   - `verbucheErgebnis` zählt `notenGesamt` hoch und setzt `letzterModus`.
   - Notenflug: Combo im Flug-Objekt (`flugAntwort` erhöht und setzt zurück, höchstens 5), Punkte mit Combo und Tempo, `flugzeit` mit Tempofaktor, `flugTempoStufe`.
   - Melodie: Tipp zählt als Fehler, Neustart behält Fehler.
   - `formatiereDauer`.
   - Tests, wenige und gezielt: Combo-Punkte mit Rücksetzen nach Fehler, Tempo-Punkte mit Rundung und Mindestwert 1, `notenGesamt` und `letzterModus` nach einer Runde, Migration eines alten Spielstands ohne die neuen Felder, `formatiereDauer`.
2. **Gemeinsame Bausteine, Teil Menü und Ton:** oberes Menü mit Zuordnung, Fortschrittsbalken, Zähler-Pillen, Rückfrage „Runde beenden?“, Ton an oder aus in `js/klang.js`, Fußzeile, Texte in `js/texte.js`, Symbole (Zahnrad, Rakete, Pokal, Orden, Lautsprecher) in `js/symbole.js`.
3. **Gemeinsame Bausteine, Teil Spielseiten:** Kopfkarte für alle Spielansichten, Sprechblase in zwei Größen, Buchstabentasten mit Farbe und Silbe.
4. **Startseite:** Lautsprecher, Schriftzug oben links, Fußzeile.
5. **Welche Note ist das?:** Spalten 7 zu 5, Tastenraster mit 6 Spalten, Menü.
6. **Notenflug, Teil Spiel:** Herzen, Combo, Unterzeile mit Welle und Tempostufe, Flugzeit-Balken, Bühne mit Schildern, Rakete, „Fang mich!“, Sprechblase in der Bühne, Tasten mit Ton, Hinweiszeile.
7. **Notenflug, Teil Karten:** Klavier-Lotse, Merkspruch mit Sprüchen in `js/noten-konfiguration.js`, Tempo, Pause mit Fläche, neuer Platz der Rückmeldung, Handy-Layout.
8. **Klaviertasten:** Titel als Frage, Begleiter oben rechts, Zusatztasten unten, Zieltaste nach der Antwort.
9. **Hör-Spiel:** Banner, Steuerzeile mit Bezugston-Kästchen, Karten mit Ziffern und Beschriftung, Spielzeug-Klavier.
10. **Melodie:** Kopfbereich, Zeile „Note 1 von 6“, Klavierkopf, Aktionszeile mit Melodie anhören, Tipp und Neu starten.
11. **Note setzen:** zweispaltig, Namensschild am Notenkopf, Statuszeile.
12. **Noten-Memory:** Abzeichen, Unterschriften, Kopfkarte mit Pillen.
13. **Ergebnisfenster:** Dialog über dem Spielfeld, Werte-Kärtchen je Spiel, Zeitmessung in den Modi, Rekord-Knopf, Fortschrittskarte. Gilt danach für alle Spiele.
14. **Fehler üben und Tägliche Notenreise:** gemeinsame Bausteine übernehmen.
15. **Meine Tiere:** Balken, Spaltenzahl.
16. **Rekorde:** Banner, Pille, „Zuletzt gespielt“, Knöpfe in leeren Karten, zweispaltiges Raster, große Taste.
17. **Einstellungen:** Zurücksetzen mit Rückfrage, Hinweiskarte, zweite Zeilen in Feldern und Schnellwahl, Schlüsselsymbole, feste Leiste unten.
18. **README:** Abschnitt zur Gestaltung und zu den neuen Regeln (Combo, Herzen, Tempo, Pause, Tipp in der Melodie, gelesene Noten) auf Deutsch und Englisch.

## Entscheidung vom 2026-11-23

Der Benutzer will den Aufbau aller Seiten übernehmen und fehlende Funktionen nachbauen. Die Rückfragen oben werden nicht einzeln gestellt: Es gelten die Standardlösungen. Sie stehen im Abschlussbericht, der Benutzer kann sie danach ändern.

## Umsetzung: Stand und Abweichungen

### Paket 1: Neue Logik (`js/spiel-logik.js`)

- Spielstand: `ton` (Standard `true`), `flugTempo` (1), `flugKlaviatur` (`null` heißt „nach Bildschirmbreite“, erst ein Tipp speichert `true` oder `false`), `notenGesamt` (0), `letzterModus` (`""`).
- `verbucheErgebnis` zählt `e.richtige` zu `notenGesamt` und setzt `letzterModus`. Notenflug und Noten-Memory geben `richtige` jetzt mit (gefangene Noten, gefundene Paare).
- Notenflug: `neuerFlug(anzahl, tempo)`; das Flug-Objekt hat `tempo`, `combo` (1 bis 5, für die Pille), `serie` und `besteCombo`. `flugAntwort` liefert zusätzlich `punkte` (Punkte dieser Note) und `combo`. Weitere Funktionen: `flugzeit(level, tempo)`, `flugTrefferPunkte`, `flugTempo` (prüft den Wert), `naechstesFlugTempo`, `flugTempoStufe` (liefert `flug.stufe.gemuetlich` und so weiter, Texte sind schon da). Die Combo zählt ab sofort im Notenflug, das Tempo bleibt bis Paket 7 bei 1.
- Melodie: Wertungsobjekt `neueMelodieRunde()` mit `melodieTaste`, `melodieTipp`, `melodieNeustart`, `melodieNaechste`, `melodieFehlerHier`. `js/modi/melodie.js` nutzt es schon. Abweichung: Richtige Noten beim ersten Versuch zählen erst am Ende einer Melodie, damit „Neu starten“ nichts doppelt zählt; eine Note mit Fehler oder Tipp zählt auch nach einem Neustart nicht als „beim ersten Versuch“.
- `formatiereDauer(ms)`.

### Paket 2: Bausteine Menü und Ton (`js/bausteine.js`)

Alle Bausteine stehen in `js/bausteine.js` als `window.Bausteine`, die Gebrauchsanweisung steht im Kopfkommentar der Datei. Kurz:

- Oberes Menü `#oberes-menue` und Fußzeile `#fusszeile` stehen fest in `index.html`. `js/app.js` ruft in `zeigeAnsicht` `Bausteine.menue.zeige(name)` auf; das blendet Menü und Fußzeile je Ansicht ein und setzt den aktiven Reiter. Neue Seiten brauchen dafür nichts zu tun. Eigene feste Leisten unter dem Menü (zum Beispiel die Kopfzeile der Einstellungen) nutzen `top: var(--menue-hoehe)`.
- `Bausteine.fortschritt({ wert, max, text, farbe })` und `setzeFortschritt` für Balken (Notenflug, Meine Tiere, Ergebnis).
- `Bausteine.pille({ symbol, text, art, aria, knopf })` und `setzePille` für alle Zähler-Pillen.
- `Bausteine.frage({ titel, text, ja, nein }, beiJa, beiNein)` für Rückfragen (auch „Einstellungen zurücksetzen?“).
- `Bausteine.tonKnopf({ mitText })` für Lautsprecher-Knöpfe (Startseite ohne Text, Notenflug mit „Ton an“). Der Zustand liegt in `Klang.an()` und wird als `stand.ton` gespeichert.
- Neue Modus-Funktion `pausiere(an)` (js/modi.js): Der Notenflug hält damit während der Rückfrage an. Paket 7 kann die Pause-Taste darauf aufbauen.
- Symbole neu in `js/symbole.js`: zahnrad, rakete, pokal, orden, ton-an, ton-aus, stern, note, herz, herz-leer, flamme, pfote. `Tiere.kopf(art)` zeichnet nur den Kopf eines Tiers.

Abweichungen und Ergänzungen:

- Unter 800 px Breite entfallen Reiter und Zoo-Knopf (der Plan nennt nur 360 px), weil die Reiter auf schmalen Tablets nicht in eine Zeile passen.
- Die Noten-Pille ist kein Knopf, weil der Plan ihr kein Ziel gibt.
- Die Fußzeile erscheint schon jetzt auf allen Seiten außer dem Notenflug, auch auf der Startseite; Paket 4 muss sie dort nicht mehr einbauen. Die Fußzeile steht auch bei kurzen Seiten am unteren Rand.
- „Runde beenden?“ hat eine zweite Zeile „Die Punkte dieser Runde werden nicht gezählt.“ (englisch „The points from this round won’t count.“). „Weiterspielen“ ist die Haupttaste mit dem Fokus, Escape zählt als „Weiterspielen“. In der Übersicht der Notenreise fragt das Menü erst, wenn eine Etappe geschafft ist. „Fehler üben“ fragt ebenfalls.
- Im Hör-Spiel erscheint bei ausgeschaltetem Ton schon jetzt der Hinweis mit dem Knopf „Ton einschalten“, damit das Spiel nicht stumm bleibt.
