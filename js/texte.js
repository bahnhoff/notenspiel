/*
 * Alle sichtbaren Texte des Notenzoos auf Deutsch und Englisch (amerikanisch).
 * Läuft im Browser (window.Texte) und in Node (für die Tests).
 *
 * Ein Objekt je Sprache. Platzhalter stehen in geschweiften Klammern, zum
 * Beispiel "Aufgabe {nr} von {anzahl}". Einzahl und Mehrzahl stehen als
 * { eins, viele }; welche Form gilt, entscheidet der Wert `n`.
 * Listen (zum Beispiel Ordnungszahlen) holt `Texte.liste(schluessel)`.
 *
 * HTML-Elemente bekommen ein Attribut mit dem Textschlüssel:
 *   data-text="start.tiere"             setzt den Text des Elements
 *   data-text-aria-label="zurueck.aria"  setzt aria-label
 *   data-text-content="meta.beschreibung" setzt content (für <meta>)
 * `Texte.wendeAn(wurzel)` überträgt die Texte der aktuellen Sprache.
 *
 * Notennamen, Hinweise zur Lage und Merktiere setzt js/noten.js aus diesen
 * Texten zusammen. Kennungen und Antwortschlüssel bleiben sprachunabhängig.
 */
(function (root) {
  "use strict";

  var SPRACHEN = ["de", "en"];

  var TEXTE = {
    de: {
      "meta.titel": "Notenzoo",
      "meta.beschreibung": "Notenzoo: Spiele zum Erkennen von Noten im Violin- und Bassschlüssel.",
      "sprache.gruppe": "Sprache",

      /* Startseite */
      "start.ueben": "Noten üben",
      "start.uebenInfo": "{n} Aufgaben · {von} bis {bis}",
      "start.mehrSpiele": "Mehr Spiele",
      "start.anzahlSpiele": "{n} Spiele",
      "kachel.notenflug": "Schnell lesen",
      "kachel.klaviertasten": "Taste finden",
      "kachel.note-setzen": "Note hinsetzen",
      "kachel.noten-memory": "Paare finden",
      "kachel.hoer-spiel": "Genau hinhören",
      "kachel.melodie": "Lieder nachspielen",
      "start.tiere": "Meine Tiere",
      "start.rekorde": "Rekorde",
      "start.einstellungen": "Einstellungen",
      "start.keinSpeicher": "Dieser Browser kann den Spielstand nicht speichern. Du kannst trotzdem spielen.",
      "start.zuWenigEinfach": "Wähle in den Einstellungen Noten mit mindestens {n} verschiedenen Buchstaben aus, zum Beispiel C, D und E. Dann kann es losgehen.",
      "start.zuWenigGenau": "Wähle in den Einstellungen mindestens {n} verschiedene Noten aus, dann kann es losgehen.",
      "auswahl.keine": "keine Noten",
      "auswahl.bis": "{von} bis {bis}",
      "auswahl.viele": "{n} Noten von {von} bis {bis}",

      /* Spielnamen */
      "modus.klassisch": "Welche Note ist das?",
      "modus.notenflug": "Notenflug",
      "modus.klaviertasten": "Klaviertasten",
      "modus.note-setzen": "Note setzen",
      "modus.noten-memory": "Noten-Memory",
      "modus.hoer-spiel": "Hör-Spiel",
      "modus.notenreise": "Tägliche Notenreise",
      "modus.melodie": "Spiel eine Melodie",

      /* Gemeinsam in den Runden */
      "zurueck.aria": "Zurück zur Startseite",
      "zurueck.startseite": "Startseite",
      "zurueck.text": "Zurück",
      "runde.aufgabe": "Aufgabe {nr} von {anzahl}",
      "runde.weiter": "Weiter",
      "runde.antwortenAria": "Antworten",
      "runde.richtig": "{name}, richtig",
      "runde.falsch": "{name}, falsch",
      "runde.undDiese": "Und diese hier?",
      "punkte": { eins: "1 Punkt", viele: "{n} Punkte" },
      "sterne": { eins: "1 Stern", viele: "{n} Sterne" },
      "sterne.aria": "{n} von {gesamt} Sternen",
      "tage": { eins: "1 Tag", viele: "{n} Tage in Folge" },

      /* Rückmeldungen (js/spiel-logik.js) */
      "rueckmeldung.falsch": "Das ist {name}. {hinweis}",
      "rueckmeldung.serie": "{zahl} Richtige in Folge!",
      "rueckmeldung.lob": ["Genau, das ist {name}!", "Super, {name} stimmt!", "Richtig, das ist {name}!"],
      "zahlwort.3": "Drei",
      "zahlwort.6": "Sechs",
      "zahlwort.9": "Neun",

      /* Ende einer Runde (js/modi.js) */
      "ende.nochmal": "Versuchen wir’s noch mal?",
      "ende.profi": "Alles richtig. Du bist ein Notenprofi!",
      "ende.toll": "Toll gemacht!",
      "ende.geschafft": "Geschafft!",
      "ende.richtigVon": "{richtige} von {aufgaben} richtig",
      "ende.punkteDafuer": "Punkte dafür",
      "ende.bonus": "Bonus",

      /* Notennamen und Lage (js/noten.js) */
      "schluessel.violin": "Violinschlüssel",
      "schluessel.bass": "Bassschlüssel",
      "ordnung": ["ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten"],
      "lage.unterste": "auf der untersten Linie",
      "lage.oberste": "auf der obersten Linie",
      "lage.mittlere": "auf der mittleren Linie",
      "lage.linie": "auf der {ord} Linie von unten",
      "lage.zwischenraum": "im {ord} Zwischenraum von unten",
      "lage.knappUnter": "knapp unter der untersten Linie",
      "lage.knappUeber": "knapp über der obersten Linie",
      "lage.hilfsUnterAuf": "auf der {ord} Hilfslinie unter dem System",
      "lage.hilfsUnterUnter": "unter der {ord} Hilfslinie unter dem System",
      "lage.hilfsUeberAuf": "auf der {ord} Hilfslinie über dem System",
      "lage.hilfsUeberUeber": "über der {ord} Hilfslinie über dem System",
      "hinweis.satz": "Die Note liegt {lage}{vorzeichen}.",
      "hinweis.kreuz": " und hat ein Kreuz",
      "hinweis.b": " und hat ein B",
      "hinweis.mittleresC": " Das ist das mittlere C.",
      "hinweis.violin": " Um diese Linie kringelt sich der Violinschlüssel.",
      "hinweis.bass": " Diese Linie liegt zwischen den beiden Punkten des Bassschlüssels.",
      "system.mitNote": "{schluessel} mit der Note {name}",
      "system.mitEinerNote": "{schluessel} mit einer Note",

      /* Merktiere */
      "merkhilfe.text": "{name} wie {tier}",
      "merkhilfe.stamm": "{name} – {buchstabe} wie {tier}",
      "merkhilfe.hoeher": "nur einen Halbton höher",
      "merkhilfe.tiefer": "nur einen Halbton tiefer",
      "merktier.chamaeleon": "Chamäleon",
      "merktier.delfin": "Delfin",
      "merktier.elefant": "Elefant",
      "merktier.frosch": "Frosch",
      "merktier.fuchs": "Fuchs",
      "merktier.giraffe": "Giraffe",
      "merktier.affe": "Affe",
      "merktier.hase": "Hase",
      "merktier.fisch": "Fisch",
      "merktier.katze": "Katze",
      "merktier.baer": "Bär",
      "merktier.alligator": "Alligator",

      /* Sammeltiere */
      "tier.fuchs": "Füchschen",
      "tier.hase": "Häschen",
      "tier.katze": "Kätzchen",
      "tier.hund": "Hündchen",
      "tier.baer": "Bärchen",
      "tier.panda": "Panda",
      "tier.pinguin": "Pinguin",
      "tier.eule": "Eule",
      "tier.igel": "Igel",
      "tier.eichhoernchen": "Eichhörnchen",
      "tier.schildkroete": "Schildkröte",
      "tier.koala": "Koala",
      "tier.loewe": "Löwe",
      "tier.tiger": "Tiger",
      "tier.waschbaer": "Waschbär",
      "tier.schaf": "Schäfchen",
      "tier.schwein": "Schweinchen",
      "tier.kueken": "Küken",
      "tier.otter": "Otter",
      "tier.faultier": "Faultier",
      "tier.maus": "Maus",
      "tier.kuh": "Kuh",
      "tier.einhorn": "Einhorn",
      "tier.drache": "Drache",
      "tier.phoenix": "Phönix",

      /* Klassisch */
      "klassisch.start": "Schau genau hin. Welche Note ist das?",

      /* Notenflug */
      "flug.level": "Level {level} · Note {nr} von {anzahl}",
      "flug.start": "Tippe den Namen der Note, bevor sie den Schlüssel erreicht.",
      "flug.schnell": "Schnell, wie heißt diese Note?",
      "flug.zuSpaet": "✗ Zu spät. Das ist {name}. {hinweis}",
      "flug.falsch": "✗ Das ist {name}. {hinweis}",
      "flug.levelGeschafft": " Level {level} geschafft! Jetzt wird es schneller.",
      "flug.dritterFehler": " Das war der dritte Fehler.",
      "flug.levelEinblendung": "Level {level}!",
      "flug.ueberschrift": { eins: "1 Note richtig", viele: "{n} Noten richtig" },
      "flug.proNote": "Punkte pro Note",
      "flug.rechnung": "{noten} Noten × Level {level} = {punkte}",
      "tasten.tipp": "Tipp: Du kannst auch die Buchstaben auf der Tastatur drücken.",
      "flug.zumErgebnis": "Zum Ergebnis",
      "flug.wow": "Wow, du bist richtig schnell!",
      "flug.toll": "Toll geflogen!",
      "flug.erreicht": "Erreichtes Level",
      "flug.geschaffte": "Geschaffte Level",

      /* Klaviertasten */
      "klavier.frage": "Welche Taste ist das?",
      "klavier.aria": "Klaviatur",
      "klavier.start": "Welche Taste passt zu dieser Note?",
      "klavier.startWeiss": "Welche weiße Taste passt zu dieser Note?",
      "klavier.taste": "Taste {name}",
      "klavier.mitte": ", mittleres C",
      "klavier.schwarz": "Schwarze Taste {name}",

      /* Note setzen */
      "setzen.frage": "Setze die Note",
      "setzen.systemAria": "Notensystem: Tippe auf eine Linie oder einen Zwischenraum",
      "setzen.vorzeichenAria": "Vorzeichen",
      "setzen.ohne": "Ohne Vorzeichen",
      "setzen.kreuz": "Kreuz",
      "setzen.b": "B",
      "setzen.tiefer": "Note eine Stufe tiefer",
      "setzen.hoeher": "Note eine Stufe höher",
      "setzen.pruefen": "Prüfen",
      "setzen.nochKeine": "Noch keine Note gesetzt",
      "setzen.tippeEinfach": "Tippe ins Notensystem, wo ein {name} hingehört.",
      "setzen.tippeGenau": "Tippe ins Notensystem, wo {name} hingehört.",
      "setzen.vorzeichenWahl": " Wähle das Vorzeichen: ohne, Kreuz oder B.",
      "setzen.dannPruefen": " Dann tippe auf Prüfen.",
      "setzen.falsch": "✗ Du hast {gesetzt} gesetzt. So sieht {name} aus. {hinweis}",

      /* Noten-Memory */
      "memory.kartenAria": "Karten",
      "memory.zuege": { eins: "1 Zug", viele: "{n} Züge" },
      "memory.paare": "{gefunden} von {paare} Paaren",
      "memory.start": "Finde zu jeder Note den passenden Namen.",
      "memory.karte": "Karte {nr}",
      "memory.verdeckt": ", verdeckt",
      "memory.notenkarte": ", Notenkarte",
      "memory.name": ", Name {name}",
      "memory.gefunden": ", gefunden",
      "memory.paar": "✓ Paar gefunden: {name}.",
      "memory.keinPaar": "✗ Kein Paar. Merk dir die Karten.",
      "memory.alle": "Alle Paare gefunden!",
      "memory.ueberschrift": "{paare} Paare in {zuege} Zügen",
      "memory.gedaechtnis": "Was für ein Gedächtnis!",
      "memory.zeileZuege": "Züge",
      "memory.zeilePunkte": "Punkte für {n} Paare",
      "memory.wahlFrage": "Wie schwer soll es sein?",
      "memory.normal": "Normal",
      "memory.schwer": "Schwer",
      "memory.paareInfo": "{n} Paare",
      "memory.zuWenig": "Wähle in den Einstellungen mehr Noten.",
      "memory.zeileStufe": "Stufe",
      "variante.schwer": "Schwer",

      /* Hör-Spiel */
      "hoeren.frage": "Welche Note hörst du?",
      "hoeren.nochmal": "Nochmal hören",
      "hoeren.bezugAria": "Bezugston {name} hören",
      "hoeren.optionenAria": "Drei Noten zur Auswahl",
      "hoeren.einleitung": "Hör zu: Das ist {name}, das mittlere C. Gleich kommt dein Ton.",
      "hoeren.gehoert": "Welche Note hast du gehört?",
      "hoeren.passt": "Welche Note passt zum Ton?",
      "hoeren.keinTon": "🔇 Dieser Browser kann hier keinen Ton abspielen. Du kannst trotzdem raten und spielen.",
      "hoeren.stumm": "🔇 Kein Ton? Schalte den Ton am Gerät ein und tippe auf „Nochmal hören“.",
      "hoeren.note": "Note {nr}",
      "hoeren.noteName": "Note {nr}: {name}",
      "hoeren.richtig": "Richtig, das war {name}!",
      "hoeren.falsch": "✗ Das war {name}. Hör noch einmal hin.",
      "hoeren.weiter": "Und welcher Ton ist das?",

      /* Spiel eine Melodie */
      "melodie.frage": "Spiel die Melodie!",
      "melodie.nr": "Melodie {nr} von {anzahl}",
      "melodie.start": "Spiel die Noten der Reihe nach, von links nach rechts. Die orange Note ist dran.",
      "melodie.richtig": "✓ {name}. Und jetzt die nächste Note.",
      "melodie.falsch": "✗ Das war {getippt}. Schau noch einmal auf die orange Note.",
      "melodie.falschHinweis": "✗ Das war {getippt}. {hinweis}",
      "melodie.hoer": "Geschafft! Hör zu, so klingt deine Melodie.",
      "melodie.lied": "Das war „{lied}“.",
      "melodie.eigene": "Das war eine Melodie nur für dich.",
      "melodie.systemAria": "{schluessel} mit einer Melodie aus {n} Noten",
      "melodie.ueberschrift": { eins: "1 Melodie gespielt", viele: "{n} Melodien gespielt" },
      "melodie.zeileFehler": "Falsche Tasten",
      "melodie.zeilePunkte": "Punkte für {n} Melodien",
      "melodie.ohneFehler": "Keine einzige falsche Taste. Du bist ein Musikprofi!",
      "lied.haenschen": "Hänschen klein",
      "lied.entchen": "Alle meine Entchen",
      "lied.mary": "Mary Had a Little Lamb",
      "lied.twinkle": "Morgen kommt der Weihnachtsmann",
      "lied.ode": "Freude, schöner Götterfunken",
      "lied.jakob": "Bruder Jakob",

      /* Tägliche Notenreise */
      "reise.titel": "Notenreise",
      "reise.los": "Los geht’s!",
      "reise.heute": "Heute schon geschafft ✓",
      "reise.inFolge": " · {n} Tage in Folge",
      "reise.nurEinmal": ". Den Extrastern gibt es nur einmal am Tag, Punkte und Sterne zählen trotzdem.",
      "reise.serie": "Deine Serie: {serie}. ",
      "reise.extrastern": "Schaffst du alle drei Etappen, bekommst du heute einen Extrastern.",
      "reise.stand": "✓ {richtige} von {aufgaben}",
      "reise.dran": "Jetzt dran",
      "reise.offen": "Noch offen",
      "reise.weiterZur": "Weiter zur {n}. Etappe",
      "reise.einleitung": "Heute reisen wir durch {etappen} kleine Spiele mit je {aufgaben} Aufgaben.",
      "reise.etappeGeschafft": "Etappe {n} geschafft! Als Nächstes: {name}.",
      "reise.nichtGespielt": "Nicht gespielt",
      "reise.richtig": "{richtige} von {aufgaben} richtig",
      "reise.geschafft": "Reise geschafft!",
      "reise.bisMorgen": "Was für eine Notenreise! Bis morgen?",
      "reise.kachelHeute": "Heute geschafft ✓",
      "reise.kachelSerie": "{n} Tage in Folge · heute noch offen",
      "reise.kachelGestern": "Gestern geschafft · heute noch offen",
      "reise.kachelOffen": "Heute noch offen",
      "reise.karteInfo": "{etappen} Spiele à {aufgaben} Aufgaben",

      /* Ergebnis */
      "ergebnis.extrastern": "Extrastern für heute",
      "ergebnis.schonBekommen": "Heute schon bekommen",
      "ergebnis.serie": "Tagesserie",
      "ergebnis.gesamt": "Gesamtpunktzahl",
      "ergebnis.neueSterne": "Neue Sterne",
      "ergebnis.neuesTier": "Neues Tier: {name}!",
      "ergebnis.auswaehlen": "Du kannst es unter „Meine Tiere“ auswählen.",
      "ergebnis.naechstesTier": "{gesammelt} von {schritt} Sternen bis zum nächsten Tier",
      "ergebnis.geheim": "Nächstes Tier, noch geheim",
      "ergebnis.nochmal": "Noch eine Runde",
      "ergebnis.zurStartseite": "Zur Startseite",

      /* Fehler üben */
      "ueben.knopf": "Fehler üben",
      "ueben.titel": "Fehler üben",
      "ueben.aufgabe": "Übung {nr} von {anzahl}",
      "ueben.erkennen": "Welche Note ist das?",
      "ueben.klavier": "Finde die Note auf dem Klavier",
      "ueben.startErkennen": "Diese Note war knifflig. Welche ist das?",
      "ueben.startKlavier": "Jetzt finde {name} auf dem Klavier.",
      "ueben.startKlavierOhne": "Wo ist diese Note auf dem Klavier?",
      "ueben.falschDazu": " Wir üben sie gleich noch einmal.",
      "ueben.fertig": "Übung geschafft!",
      "ueben.ende": "Super, jetzt kennst du {namen}!",
      "ueben.und": " und ",
      "ueben.undLetzte": " und ",
      "rekordName.titel": "Wer hat gespielt?",
      "rekordName.speichern": "Rekord speichern",
      "rekordName.schnellwahl": "Zuletzt benutzte Namen",
      "rekordName.name": "Name",
      "rekordName.eintragen": "Eintragen",
      "rekordName.ohne": "Ohne Namen",
      "rekordName.neu": "Neuer Rekord: Platz {platz} bei „{modus}“.",
      "rekordName.fuer": "✓ Rekord für {name} gespeichert.",
      "rekordName.ohneGespeichert": "✓ Rekord ohne Namen gespeichert.",

      /* Meine Tiere */
      "tiere.gesammelt": "Gesammelte Sterne:",
      "tiere.noch": "Noch {sterne} bis zum nächsten Tier.",
      "tiere.alle": "Du hast alle Tiere entdeckt!",
      "tiere.entdeckt": " Entdeckt: {n} von {gesamt}.",
      "tiere.selten": "Selten",
      "tiere.seltenAb": "Selten, ab {n} Sternen",
      "tiere.begleiter": "✓ Begleiter",
      "tiere.auswaehlen": "Auswählen",
      "tiere.istBegleiter": "{name} ist dein Begleiter",
      "tiere.alsBegleiter": "{name} als Begleiter auswählen",
      "tiere.unentdeckt": "Noch nicht entdeckt",

      /* Rekorde */
      "rekorde.leer": "Noch keine Rekorde. Spiel eine Runde, dann steht dein Ergebnis hier.",
      "rekorde.datum": "de-DE",

      /* Einstellungen */
      "einst.oktaven": ["", "", "Große Oktave", "Kleine Oktave", "Eingestrichene Oktave", "Zweigestrichene Oktave", "Dreigestrichene Oktave"],
      "einst.noten.violin": "Noten im Violinschlüssel",
      "einst.noten.bass": "Noten im Bassschlüssel",
      "einst.schnellwahl": "Schnellwahl {schluessel}",
      "einst.alle": "Alle",
      "einst.keine": "Keine",
      "einst.mitKreuz": "{oktave} mit Kreuz",
      "einst.mitB": "{oktave} mit B",
      "einst.mit": "mit ",
      "einst.antworten": "Antworten",
      "einst.einfach": "Einfach",
      "einst.genau": "Genau",
      "einst.erklaerungGenau": "Genau: Buchstabe mit Oktave antippen, zum Beispiel {a} oder {b}.",
      "einst.erklaerungEinfach": "Einfach: nur Buchstaben antippen. Jedes C zählt, egal wie hoch.",
      "einst.schluessel": "Schlüssel",
      "einst.einSchluessel": "Ein Schlüssel bleibt immer angekreuzt.",
      "einst.merktiere": "Merktiere",
      "einst.merktiereText": "Merktier nach der Antwort, zum Beispiel „{beispiel}“",
      "einst.info": "Die Einstellungen gelten für alle Spiele und werden auf diesem Gerät gespeichert.",
      "einst.zuWenigEinfach": "Bei „Einfach“ zählen nur die Buchstaben: {c1} und {c2} sind beide ein C. Kreuze Noten mit mindestens {n} verschiedenen Buchstaben an (Fis oder Es zählen extra), sonst können die Spiele nicht starten.",
      "einst.zuWenigGenau": "Kreuze mindestens {n} verschiedene Noten an, sonst können die Spiele nicht starten.",
      "einst.gewaehlt": " Gewählt: {liste}."
    },

    en: {
      "meta.titel": "Note Zoo",
      "meta.beschreibung": "Note Zoo: games for learning to read notes in the treble and bass clef.",
      "sprache.gruppe": "Language",

      "start.ueben": "Practice notes",
      "start.uebenInfo": "{n} questions · {von} to {bis}",
      "start.mehrSpiele": "More games",
      "start.anzahlSpiele": "{n} games",
      "kachel.notenflug": "Read fast",
      "kachel.klaviertasten": "Find the key",
      "kachel.note-setzen": "Put the note in place",
      "kachel.noten-memory": "Match pairs",
      "kachel.hoer-spiel": "Listen closely",
      "kachel.melodie": "Play little songs",
      "start.tiere": "My Animals",
      "start.rekorde": "High Scores",
      "start.einstellungen": "Settings",
      "start.keinSpeicher": "This browser can’t save your progress. You can still play!",
      "start.zuWenigEinfach": "In Settings, pick notes with at least {n} different letters, like C, D, and E. Then you can start.",
      "start.zuWenigGenau": "In Settings, pick at least {n} different notes. Then you can start.",
      "auswahl.keine": "no notes",
      "auswahl.bis": "{von} to {bis}",
      "auswahl.viele": "{n} notes from {von} to {bis}",

      "modus.klassisch": "What Note Is This?",
      "modus.notenflug": "Note Flight",
      "modus.klaviertasten": "Piano Keys",
      "modus.note-setzen": "Place the Note",
      "modus.noten-memory": "Note Memory",
      "modus.hoer-spiel": "Listening Game",
      "modus.notenreise": "Daily Note Journey",
      "modus.melodie": "Play a Melody",

      "zurueck.aria": "Back to the start page",
      "zurueck.startseite": "Home",
      "zurueck.text": "Back",
      "runde.aufgabe": "Question {nr} of {anzahl}",
      "runde.weiter": "Next",
      "runde.antwortenAria": "Answers",
      "runde.richtig": "{name}, correct",
      "runde.falsch": "{name}, wrong",
      "runde.undDiese": "And what about this one?",
      "punkte": { eins: "1 point", viele: "{n} points" },
      "sterne": { eins: "1 star", viele: "{n} stars" },
      "sterne.aria": "{n} of {gesamt} stars",
      "tage": { eins: "1 day", viele: "{n} days in a row" },

      "rueckmeldung.falsch": "That’s {name}. {hinweis}",
      "rueckmeldung.serie": "{zahl} in a row!",
      "rueckmeldung.lob": ["Yes, that’s {name}!", "Super, {name} is right!", "Right, that’s {name}!"],
      "zahlwort.3": "Three",
      "zahlwort.6": "Six",
      "zahlwort.9": "Nine",

      "ende.nochmal": "Want to try again?",
      "ende.profi": "All correct. You’re a note pro!",
      "ende.toll": "Great job!",
      "ende.geschafft": "You did it!",
      "ende.richtigVon": "{richtige} out of {aufgaben} right",
      "ende.punkteDafuer": "Points earned",
      "ende.bonus": "Bonus",

      "schluessel.violin": "Treble clef",
      "schluessel.bass": "Bass clef",
      "ordnung": ["first", "second", "third", "fourth", "fifth", "sixth"],
      "lage.unterste": "on the bottom line",
      "lage.oberste": "on the top line",
      "lage.mittlere": "on the middle line",
      "lage.linie": "on the {ord} line from the bottom",
      "lage.zwischenraum": "in the {ord} space from the bottom",
      "lage.knappUnter": "just below the bottom line",
      "lage.knappUeber": "just above the top line",
      "lage.hilfsUnterAuf": "on the {ord} ledger line below the staff",
      "lage.hilfsUnterUnter": "below the {ord} ledger line below the staff",
      "lage.hilfsUeberAuf": "on the {ord} ledger line above the staff",
      "lage.hilfsUeberUeber": "above the {ord} ledger line above the staff",
      "hinweis.satz": "The note is {lage}{vorzeichen}.",
      "hinweis.kreuz": " and has a sharp",
      "hinweis.b": " and has a flat",
      "hinweis.mittleresC": " That’s middle C.",
      "hinweis.violin": " The treble clef curls around this line.",
      "hinweis.bass": " This line is between the two dots of the bass clef.",
      "system.mitNote": "{schluessel} with the note {name}",
      "system.mitEinerNote": "{schluessel} with a note",

      "merkhilfe.text": "{name} – {buchstabe} is for {tier}",
      "merkhilfe.stamm": "{name} – {buchstabe} is for {tier}",
      "merkhilfe.hoeher": "just a half step higher",
      "merkhilfe.tiefer": "just a half step lower",
      "merktier.chamaeleon": "Chameleon",
      "merktier.delfin": "Dolphin",
      "merktier.elefant": "Elephant",
      "merktier.frosch": "Frog",
      "merktier.fuchs": "Fox",
      "merktier.giraffe": "Giraffe",
      "merktier.affe": "Monkey",
      "merktier.hase": "Rabbit",
      "merktier.fisch": "Fish",
      "merktier.katze": "Cat",
      "merktier.baer": "Bear",
      "merktier.alligator": "Alligator",

      "tier.fuchs": "Little Fox",
      "tier.hase": "Bunny",
      "tier.katze": "Kitty",
      "tier.hund": "Puppy",
      "tier.baer": "Teddy Bear",
      "tier.panda": "Panda",
      "tier.pinguin": "Penguin",
      "tier.eule": "Owl",
      "tier.igel": "Hedgehog",
      "tier.eichhoernchen": "Squirrel",
      "tier.schildkroete": "Turtle",
      "tier.koala": "Koala",
      "tier.loewe": "Lion",
      "tier.tiger": "Tiger",
      "tier.waschbaer": "Raccoon",
      "tier.schaf": "Little Lamb",
      "tier.schwein": "Piglet",
      "tier.kueken": "Chick",
      "tier.otter": "Otter",
      "tier.faultier": "Sloth",
      "tier.maus": "Mouse",
      "tier.kuh": "Cow",
      "tier.einhorn": "Unicorn",
      "tier.drache": "Dragon",
      "tier.phoenix": "Phoenix",

      "klassisch.start": "Look closely. What note is this?",

      "flug.level": "Level {level} · Note {nr} of {anzahl}",
      "flug.start": "Tap the note’s name before it reaches the clef.",
      "flug.schnell": "Quick, what’s this note?",
      "flug.zuSpaet": "✗ Too late. That’s {name}. {hinweis}",
      "flug.falsch": "✗ That’s {name}. {hinweis}",
      "flug.levelGeschafft": " You finished level {level}! Now it gets faster.",
      "flug.dritterFehler": " That was the third mistake.",
      "flug.levelEinblendung": "Level {level}!",
      "flug.ueberschrift": { eins: "1 note right", viele: "{n} notes right" },
      "flug.proNote": "Points per note",
      "flug.rechnung": "{noten} notes × level {level} = {punkte}",
      "tasten.tipp": "Tip: You can also press the letter keys on your keyboard.",
      "flug.zumErgebnis": "See results",
      "flug.wow": "Wow, you’re really fast!",
      "flug.toll": "Great flying!",
      "flug.erreicht": "Level reached",
      "flug.geschaffte": "Levels finished",

      "klavier.frage": "Which key is it?",
      "klavier.aria": "Piano keyboard",
      "klavier.start": "Which key matches this note?",
      "klavier.startWeiss": "Which white key matches this note?",
      "klavier.taste": "Key {name}",
      "klavier.mitte": ", middle C",
      "klavier.schwarz": "Black key {name}",

      "setzen.frage": "Place the note",
      "setzen.systemAria": "Staff: tap a line or a space",
      "setzen.vorzeichenAria": "Sharp or flat",
      "setzen.ohne": "No sharp or flat",
      "setzen.kreuz": "Sharp",
      "setzen.b": "Flat",
      "setzen.tiefer": "Move the note down one step",
      "setzen.hoeher": "Move the note up one step",
      "setzen.pruefen": "Check",
      "setzen.nochKeine": "No note placed yet",
      "setzen.tippeEinfach": "Tap the staff where {name} goes.",
      "setzen.tippeGenau": "Tap the staff where {name} goes.",
      "setzen.vorzeichenWahl": " Pick no sign, sharp, or flat.",
      "setzen.dannPruefen": " Then tap Check.",
      "setzen.falsch": "✗ You placed {gesetzt}. This is what {name} looks like. {hinweis}",

      "memory.kartenAria": "Cards",
      "memory.zuege": { eins: "1 move", viele: "{n} moves" },
      "memory.paare": "{gefunden} of {paare} pairs",
      "memory.start": "Find the name that matches each note.",
      "memory.karte": "Card {nr}",
      "memory.verdeckt": ", face down",
      "memory.notenkarte": ", note card",
      "memory.name": ", name {name}",
      "memory.gefunden": ", found",
      "memory.paar": "✓ You found a pair: {name}.",
      "memory.keinPaar": "✗ Not a pair. Try to remember the cards.",
      "memory.alle": "You found all the pairs!",
      "memory.ueberschrift": "{paare} pairs in {zuege} moves",
      "memory.gedaechtnis": "What a great memory!",
      "memory.zeileZuege": "Moves",
      "memory.zeilePunkte": "Points for {n} pairs",
      "memory.wahlFrage": "How hard should it be?",
      "memory.normal": "Normal",
      "memory.schwer": "Hard",
      "memory.paareInfo": "{n} pairs",
      "memory.zuWenig": "Pick more notes in Settings.",
      "memory.zeileStufe": "Level",
      "variante.schwer": "Hard",

      "hoeren.frage": "Which note do you hear?",
      "hoeren.nochmal": "Play again",
      "hoeren.bezugAria": "Play {name}, middle C",
      "hoeren.optionenAria": "Three notes to choose from",
      "hoeren.einleitung": "Listen: this is {name}, middle C. Your note is coming next.",
      "hoeren.gehoert": "Which note did you hear?",
      "hoeren.passt": "Which note matches the sound?",
      "hoeren.keinTon": "🔇 This browser can’t play sound here. You can still guess and play.",
      "hoeren.stumm": "🔇 No sound? Turn on the sound on your device and tap “Play again.”",
      "hoeren.note": "Note {nr}",
      "hoeren.noteName": "Note {nr}: {name}",
      "hoeren.richtig": "Right, that was {name}!",
      "hoeren.falsch": "✗ That was {name}. Listen one more time.",
      "hoeren.weiter": "And what’s this note?",

      "melodie.frage": "Play the melody!",
      "melodie.nr": "Melody {nr} of {anzahl}",
      "melodie.start": "Play the notes in order, from left to right. The orange note is next.",
      "melodie.richtig": "✓ {name}. Now the next note.",
      "melodie.falsch": "✗ That was {getippt}. Look at the orange note again.",
      "melodie.falschHinweis": "✗ That was {getippt}. {hinweis}",
      "melodie.hoer": "You did it! Listen to your melody.",
      "melodie.lied": "That was “{lied}.”",
      "melodie.eigene": "That was a melody just for you.",
      "melodie.systemAria": "{schluessel} with a melody of {n} notes",
      "melodie.ueberschrift": { eins: "You played 1 melody", viele: "You played {n} melodies" },
      "melodie.zeileFehler": "Wrong keys",
      "melodie.zeilePunkte": "Points for {n} melodies",
      "melodie.ohneFehler": "Not a single wrong key. You’re a music pro!",
      "lied.haenschen": "Lightly Row",
      "lied.entchen": "All My Little Ducklings",
      "lied.mary": "Mary Had a Little Lamb",
      "lied.twinkle": "Twinkle, Twinkle, Little Star",
      "lied.ode": "Ode to Joy",
      "lied.jakob": "Are You Sleeping, Brother John",

      "reise.titel": "Note Journey",
      "reise.los": "Let’s go!",
      "reise.heute": "Done for today ✓",
      "reise.inFolge": " · {n} days in a row",
      "reise.nurEinmal": ". You get the bonus star only once a day, but points and stars still count.",
      "reise.serie": "Your streak: {serie}. ",
      "reise.extrastern": "Finish all three stages to get a bonus star today.",
      "reise.stand": "✓ {richtige} of {aufgaben}",
      "reise.dran": "Your turn",
      "reise.offen": "Coming up",
      "reise.weiterZur": "On to stage {n}",
      "reise.einleitung": "Today we’ll travel through {etappen} little games with {aufgaben} questions each.",
      "reise.etappeGeschafft": "Stage {n} done! Next up: {name}.",
      "reise.nichtGespielt": "Not played",
      "reise.richtig": "{richtige} of {aufgaben} correct",
      "reise.geschafft": "Journey complete!",
      "reise.bisMorgen": "What a note journey! See you tomorrow?",
      "reise.kachelHeute": "Done today ✓",
      "reise.kachelSerie": "{n} days in a row · not done today",
      "reise.kachelGestern": "Done yesterday · not done today",
      "reise.kachelOffen": "Not done today",
      "reise.karteInfo": "{etappen} games · {aufgaben} questions each",

      "ergebnis.extrastern": "Bonus star for today",
      "ergebnis.schonBekommen": "Already earned today",
      "ergebnis.serie": "Daily streak",
      "ergebnis.gesamt": "Total score",
      "ergebnis.neueSterne": "New stars",
      "ergebnis.neuesTier": "New animal: {name}!",
      "ergebnis.auswaehlen": "You can pick it in “My Animals.”",
      "ergebnis.naechstesTier": "{gesammelt} of {schritt} stars to your next animal",
      "ergebnis.geheim": "Next animal, still a secret",
      "ergebnis.nochmal": "Play again",
      "ergebnis.zurStartseite": "Back to start",

      /* Practice mistakes */
      "ueben.knopf": "Practice mistakes",
      "ueben.titel": "Practice",
      "ueben.aufgabe": "Practice {nr} of {anzahl}",
      "ueben.erkennen": "What note is this?",
      "ueben.klavier": "Find the note on the piano",
      "ueben.startErkennen": "This note was tricky. What note is it?",
      "ueben.startKlavier": "Now find {name} on the piano.",
      "ueben.startKlavierOhne": "Where is this note on the piano?",
      "ueben.falschDazu": " We’ll practice it again in a moment.",
      "ueben.fertig": "Practice done!",
      "ueben.ende": "Great, now you know {namen}!",
      "ueben.und": " and ",
      "ueben.undLetzte": ", and ",
      "rekordName.titel": "Who played?",
      "rekordName.speichern": "Save high score",
      "rekordName.schnellwahl": "Recent names",
      "rekordName.name": "Name",
      "rekordName.eintragen": "Save",
      "rekordName.ohne": "No name",
      "rekordName.neu": "New high score! You’re #{platz} in “{modus}”",
      "rekordName.fuer": "✓ High score saved for {name}.",
      "rekordName.ohneGespeichert": "✓ High score saved without a name.",

      "tiere.gesammelt": "Stars collected:",
      "tiere.noch": "{sterne} to go until the next animal.",
      "tiere.alle": "You found all the animals!",
      "tiere.entdeckt": " Found: {n} of {gesamt}.",
      "tiere.selten": "Rare",
      "tiere.seltenAb": "Rare, from {n} stars",
      "tiere.begleiter": "✓ Buddy",
      "tiere.auswaehlen": "Choose",
      "tiere.istBegleiter": "{name} is your buddy",
      "tiere.alsBegleiter": "Choose {name} as your buddy",
      "tiere.unentdeckt": "Not found yet",

      "rekorde.leer": "No high scores yet. Play a round, and your score will show up here.",
      "rekorde.datum": "en-US",

      "einst.oktaven": ["", "", "Octave 2", "Octave 3", "Octave 4 · middle C", "Octave 5", "Octave 6"],
      "einst.noten.violin": "Notes in the treble clef",
      "einst.noten.bass": "Notes in the bass clef",
      "einst.schnellwahl": "Quick pick {schluessel}",
      "einst.alle": "All",
      "einst.keine": "None",
      "einst.mitKreuz": "{oktave} with sharps",
      "einst.mitB": "{oktave} with flats",
      "einst.mit": "with ",
      "einst.antworten": "Answers",
      "einst.einfach": "Easy",
      "einst.genau": "Exact",
      "einst.erklaerungGenau": "Exact: tap the letter with its octave, like {a} or {b}.",
      "einst.erklaerungEinfach": "Easy: just tap the letter. Every C counts, high or low.",
      "einst.schluessel": "Clefs",
      "einst.einSchluessel": "At least one clef always stays checked.",
      "einst.merktiere": "Animal helpers",
      "einst.merktiereText": "Show an animal helper after each answer, like “{beispiel}”",
      "einst.info": "These settings work for all games and are saved on this device.",
      "einst.zuWenigEinfach": "In “Easy,” only the letters count: {c1} and {c2} are both C. Check notes with at least {n} different letters (F♯ or E♭ count as extra letters), or the games can’t start.",
      "einst.zuWenigGenau": "Check at least {n} different notes, or the games can’t start.",
      "einst.gewaehlt": " Selected: {liste}."
    }
  };

  var aktuelle = "de";

  function sprache() { return aktuelle; }

  /** Setzt die Sprache ("de" oder "en"). Unbekannte Werte ändern nichts. */
  function setzeSprache(s) {
    if (SPRACHEN.indexOf(s) !== -1) aktuelle = s;
    return aktuelle;
  }

  /** Sprache für den ersten Start: beginnt die Browsersprache mit „de“, Deutsch, sonst Englisch. */
  function browserSprache(kennung) {
    return /^de\b/i.test(String(kennung || "")) ? "de" : "en";
  }

  function roh(schluessel) {
    var wert = TEXTE[aktuelle][schluessel];
    return wert === undefined ? TEXTE.de[schluessel] : wert;
  }

  function fuelle(text, werte) {
    return String(text).replace(/\{(\w+)\}/g, function (ganz, name) {
      return werte && werte[name] !== undefined ? String(werte[name]) : ganz;
    });
  }

  /**
   * Text zu einem Schlüssel in der aktuellen Sprache, Platzhalter aus `werte`.
   * Bei { eins, viele } entscheidet werte.n. Unbekannte Schlüssel kommen
   * unverändert zurück, damit ein Tippfehler sichtbar bleibt.
   */
  function t(schluessel, werte) {
    var wert = roh(schluessel);
    if (wert === undefined) return schluessel;
    if (wert && typeof wert === "object" && !Array.isArray(wert)) {
      wert = werte && werte.n === 1 ? wert.eins : wert.viele;
    }
    return fuelle(wert, werte);
  }

  /** Liste zu einem Schlüssel, zum Beispiel die Ordnungszahlen. Platzhalter werden gefüllt. */
  function liste(schluessel, werte) {
    var wert = roh(schluessel);
    return Array.isArray(wert) ? wert.map(function (x) { return fuelle(x, werte); }) : [];
  }

  /** Überträgt die Texte auf alle Elemente mit data-text-Attributen unter `wurzel`. */
  function wendeAn(wurzel) {
    var doc = wurzel.ownerDocument || wurzel;
    Array.prototype.forEach.call(wurzel.querySelectorAll("[data-text]"), function (el) {
      el.textContent = t(el.getAttribute("data-text"));
    });
    Array.prototype.forEach.call(wurzel.querySelectorAll("[data-text-aria-label]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-text-aria-label")));
    });
    Array.prototype.forEach.call(wurzel.querySelectorAll("[data-text-content]"), function (el) {
      el.setAttribute("content", t(el.getAttribute("data-text-content")));
    });
    if (doc.documentElement) doc.documentElement.lang = aktuelle;
    doc.title = t("meta.titel");
  }

  var api = {
    SPRACHEN: SPRACHEN,
    sprache: sprache,
    setzeSprache: setzeSprache,
    browserSprache: browserSprache,
    t: t,
    liste: liste,
    wendeAn: wendeAn
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Texte = api;
})(typeof self !== "undefined" ? self : this);
