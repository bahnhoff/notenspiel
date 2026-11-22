/*
 * Spiellogik ohne Bezug zur Oberfläche: Rundenablauf, Wertung,
 * Wiederholung schwieriger Noten, Rekorde und Tiere.
 * Läuft im Browser (window.SpielLogik) und in Node (für die Tests).
 */
(function (root) {
  "use strict";

  var Texte = typeof module !== "undefined" && module.exports ? require("./texte.js") : root.Texte;

  var REGELN = {
    aufgabenProRunde: 10,
    startSterne: 3,
    punkteProRichtig: 10,
    bonusProStern: 10,
    maxRekorde: 5
  };

  /*
   * Sammeltiere für „Meine Tiere“. Füchschen ist von Anfang an da.
   * Alle 5 gesammelten Sterne kommt ein zufälliges neues Tier dazu,
   * seltene Tiere erst ab 50 gesammelten Sternen.
   * `name` liefert den Namen in der aktuellen Sprache (js/texte.js, "tier.<id>").
   */
  var TIERE = [
    { id: "fuchs" },
    { id: "hase" },
    { id: "katze" },
    { id: "hund" },
    { id: "baer" },
    { id: "panda" },
    { id: "pinguin" },
    { id: "eule" },
    { id: "igel" },
    { id: "eichhoernchen" },
    { id: "schildkroete" },
    { id: "koala" },
    { id: "loewe" },
    { id: "tiger" },
    { id: "waschbaer" },
    { id: "schaf" },
    { id: "schwein" },
    { id: "kueken" },
    { id: "otter" },
    { id: "faultier" },
    { id: "maus" },
    { id: "kuh" },
    { id: "einhorn", selten: true },
    { id: "drache", selten: true },
    { id: "phoenix", selten: true }
  ];
  TIERE.forEach(function (tier) {
    Object.defineProperty(tier, "name", { enumerable: true, get: function () { return Texte.t("tier." + tier.id); } });
  });
  var STERNE_PRO_TIER = 5;
  var SELTEN_AB_STERNEN = 50;
  var MAX_NAMEN = 6;
  var NAME_LAENGE = 20;


  function positionsSchluessel(note) {
    return note.schluessel + ":" + note.position;
  }

  /* ---------- Runde ---------- */

  /**
   * Neue Runde nach den klassischen Regeln. `optionen`:
   *   vorrang  Notenkennungen, die früh drankommen sollen
   *   aufgaben Zahl der Aufgaben (Standard REGELN.aufgabenProRunde),
   *            zum Beispiel 5 für eine Etappe der Notenreise
   *   zufall   Zufallsquelle für Tests
   */
  function neueRunde(noten, optionen) {
    optionen = optionen || {};
    if (!noten || noten.length === 0) throw new Error("Der gewählte Bereich enthält keine Noten.");
    var ids = {};
    noten.forEach(function (n) { ids[n.id] = n; });
    var vorrang = [];
    (optionen.vorrang || []).forEach(function (id) {
      if (ids[id] && vorrang.indexOf(id) === -1) vorrang.push(id);
    });
    var runde = {
      noten: noten,
      nachId: ids,
      zufall: optionen.zufall || Math.random,
      anzahl: optionen.aufgaben >= 1 ? Math.floor(optionen.aufgaben) : REGELN.aufgabenProRunde,
      aufgabe: 0,              // Index der aktuellen Aufgabe, 0 bis anzahl − 1
      punkte: 0,
      sterne: REGELN.startSterne,
      richtige: 0,
      fehler: 0,
      serie: 0,
      wiederholungen: [],      // { id, faelligAb }
      vorrang: vorrang,        // schwierige Noten aus früheren Runden
      uebertrag: [],           // für die nächste Runde
      verlauf: [],
      aktuell: null,
      gesperrt: false,
      letzteAntwort: null,
      beendet: false,
      vorzeitig: false,        // bleibt false: Runden laufen immer bis zur letzten Aufgabe
      verbucht: false
    };
    runde.aktuell = waehleNote(runde);
    return runde;
  }

  function zufallsElement(liste, zufall) {
    return liste[Math.floor(zufall() * liste.length) % liste.length];
  }

  function waehleNote(runde) {
    var i = runde.aufgabe;
    var vorher = runde.verlauf.length ? runde.verlauf[runde.verlauf.length - 1].note : null;
    function nichtWieVorher(n) {
      return !vorher || positionsSchluessel(n) !== positionsSchluessel(vorher);
    }
    var k, note;

    // 1. Fällige Wiederholung einer falsch beantworteten Note.
    for (k = 0; k < runde.wiederholungen.length; k++) {
      if (runde.wiederholungen[k].faelligAb <= i) {
        note = runde.nachId[runde.wiederholungen[k].id];
        if (nichtWieVorher(note)) {
          runde.wiederholungen.splice(k, 1);
          return { note: note, wiederholung: true };
        }
      }
    }

    // 2. Schwierige Note aus einer früheren Runde (ab der zweiten Aufgabe).
    if (i >= 1) {
      for (k = 0; k < runde.vorrang.length; k++) {
        note = runde.nachId[runde.vorrang[k]];
        if (nichtWieVorher(note)) {
          runde.vorrang.splice(k, 1);
          return { note: note, wiederholung: true };
        }
      }
    }

    // 3. Zufällige Note, nicht dieselbe Position wie zuvor und möglichst
    //    keine Note, deren Wiederholung noch aussteht.
    var ausstehend = {};
    runde.wiederholungen.forEach(function (w) { ausstehend[w.id] = true; });
    runde.vorrang.forEach(function (id) { ausstehend[id] = true; });
    var kandidaten = runde.noten.filter(function (n) { return nichtWieVorher(n) && !ausstehend[n.id]; });
    if (kandidaten.length === 0) kandidaten = runde.noten.filter(nichtWieVorher);
    if (kandidaten.length === 0) kandidaten = runde.noten.slice();
    return { note: zufallsElement(kandidaten, runde.zufall), wiederholung: false };
  }

  function planeWiederholung(runde, id) {
    var letzte = runde.anzahl - 1;
    var abstand = runde.zufall() < 0.5 ? 2 : 3;        // zwei bis drei andere Noten
    var faellig = runde.aufgabe + abstand + 1;
    if (faellig > letzte) faellig = runde.aufgabe + 3; // mindestens zwei andere Noten
    if (faellig > letzte) {
      merkeUebertrag(runde, id);
    } else {
      runde.wiederholungen.push({ id: id, faelligAb: faellig });
    }
  }

  function merkeUebertrag(runde, id) {
    if (runde.uebertrag.indexOf(id) === -1) runde.uebertrag.push(id);
  }

  /** Rückmeldung in der aktuellen Sprache mit dem angezeigten Namen der Note (note.anzeige). */
  function rueckmeldung(richtig, note, serie, zufall) {
    var name = note.anzeige || note.name;
    if (!richtig) {
      return Texte.t("rueckmeldung.falsch", { name: name, hinweis: note.hinweis });
    }
    if (serie > 0 && serie % 3 === 0) {
      var zahl = Texte.t("zahlwort." + serie);
      return Texte.t("rueckmeldung.serie", { zahl: zahl === "zahlwort." + serie ? String(serie) : zahl });
    }
    return zufallsElement(Texte.liste("rueckmeldung.lob", { name: name }), zufall || Math.random);
  }

  /**
   * Passt die getippte Antwort zur Note? Zählt der Antwortschlüssel der Note
   * (`note.antwort`, im einfachen Modus der Buchstabe "C" oder "Fis", im
   * genauen der Name "c¹" oder "fis¹", siehe Noten.antwortSchluessel). Der
   * genaue Name zählt immer. Es zählt der Name, nicht die Tonhöhe.
   */
  function istRichtig(note, antwort) {
    return antwort === note.name || (note.antwort !== undefined && antwort === note.antwort);
  }

  /**
   * Nimmt genau eine Antwort pro Aufgabe an. `name` ist die getippte
   * Antwort (siehe istRichtig). Weitere Antworten liefern null, bis `weiter()` die nächste Aufgabe öffnet.
   */
  function antworte(runde, name) {
    if (runde.beendet || runde.gesperrt || !runde.aktuell) return null;
    runde.gesperrt = true;
    var note = runde.aktuell.note;
    var richtig = istRichtig(note, name);
    runde.verlauf.push({ note: note, antwort: name, richtig: richtig, wiederholung: runde.aktuell.wiederholung });

    if (richtig) {
      runde.punkte += REGELN.punkteProRichtig;
      runde.richtige += 1;
      runde.serie += 1;
    } else {
      runde.serie = 0;
      runde.fehler += 1;
      runde.sterne = Math.max(0, runde.sterne - 1);
      planeWiederholung(runde, note.id);
    }

    // Kein vorzeitiges Ende: Es werden immer alle Aufgaben gespielt, die Sterne sinken bis 0.
    var rundeVorbei = runde.aufgabe >= runde.anzahl - 1;
    runde.letzteAntwort = {
      richtig: richtig,
      note: note,
      antwort: name,
      serie: runde.serie,
      nachricht: rueckmeldung(richtig, note, runde.serie, runde.zufall),
      rundeVorbei: rundeVorbei,
      sterne: runde.sterne,
      punkte: runde.punkte
    };
    return runde.letzteAntwort;
  }

  /** Öffnet die nächste Aufgabe oder beendet die Runde. */
  function weiter(runde) {
    if (runde.beendet || !runde.gesperrt) return null;
    if (runde.letzteAntwort && runde.letzteAntwort.rundeVorbei) {
      runde.beendet = true;
      runde.wiederholungen.forEach(function (w) { merkeUebertrag(runde, w.id); });
      runde.vorrang.forEach(function (id) { merkeUebertrag(runde, id); });
      runde.wiederholungen = [];
      runde.vorrang = [];
      runde.aktuell = null;
      return { beendet: true, ergebnis: ergebnis(runde) };
    }
    runde.aufgabe += 1;
    runde.aktuell = waehleNote(runde);
    runde.gesperrt = false;
    runde.letzteAntwort = null;
    return { beendet: false, aktuell: runde.aktuell };
  }

  function ergebnis(runde) {
    var bonus = runde.vorzeitig ? 0 : runde.sterne * REGELN.bonusProStern;
    return {
      richtige: runde.richtige,
      beantwortet: runde.verlauf.length,
      punkte: runde.punkte,
      bonus: bonus,
      gesamt: runde.punkte + bonus,
      neueSterne: runde.vorzeitig ? 0 : runde.sterne,
      verbleibendeSterne: runde.sterne,
      vorzeitig: runde.vorzeitig,
      uebertrag: runde.uebertrag.slice()
    };
  }

  /**
   * Ergebnis der klassischen Runde im gemeinsamen Format für alle Modi
   * (siehe js/modi.js). Liefert null, solange die Runde läuft.
   */
  function klassischesErgebnis(runde) {
    if (!runde.beendet) return null;
    var e = ergebnis(runde);
    var gefragt = [];
    runde.verlauf.forEach(function (v) { if (gefragt.indexOf(v.note.id) === -1) gefragt.push(v.note.id); });
    return {
      gesamt: e.gesamt,
      neueSterne: e.neueSterne,
      vorzeitig: e.vorzeitig,
      richtige: e.richtige,
      punkte: e.punkte,
      bonus: e.bonus,
      verbleibendeSterne: e.verbleibendeSterne,
      aufgaben: runde.anzahl,
      schwierig: { gefragt: gefragt, neu: e.uebertrag }
    };
  }

  /* ---------- Fehler üben ---------- */

  var UEBUNG = {
    maxNoten: 3,           // höchstens 3 verschiedene Noten
    arten: ["erkennen", "klavier"]  // je Note: im System erkennen, dann auf der Klaviatur finden
  };

  /**
   * Noten für „Fehler üben“ aus einem Rundenverlauf ({ note, richtig }, siehe
   * antworte): nur falsch beantwortete, je Kennung einmal, die häufigsten
   * Fehler zuerst, bei Gleichstand die zuerst verwechselte. Höchstens 3.
   */
  function uebungsNoten(verlauf) {
    var zaehler = {}, reihenfolge = [];
    (verlauf || []).forEach(function (v) {
      if (!v || v.richtig || !v.note) return;
      var id = v.note.id;
      if (!zaehler[id]) { zaehler[id] = { note: v.note, fehler: 0, erste: reihenfolge.length }; reihenfolge.push(id); }
      zaehler[id].fehler += 1;
    });
    return reihenfolge.map(function (id) { return zaehler[id]; })
      .sort(function (a, b) { return b.fehler - a.fehler || a.erste - b.erste; })
      .slice(0, UEBUNG.maxNoten)
      .map(function (z) { return z.note; });
  }

  /**
   * Neue Übung: für jede Note zwei Aufgaben (erkennen, dann Klaviatur).
   * Ohne Punkte, Sterne und vorzeitiges Ende.
   */
  function neueUebung(noten) {
    var aufgaben = [];
    noten.forEach(function (note) {
      UEBUNG.arten.forEach(function (art) { aufgaben.push({ note: note, art: art, wiederholung: false }); });
    });
    return { aufgaben: aufgaben, nr: 0, gesperrt: false, beendet: aufgaben.length === 0 };
  }

  /** Aktuelle Aufgabe der Übung oder null. */
  function uebungsAufgabe(uebung) {
    return uebung.beendet ? null : uebung.aufgaben[uebung.nr];
  }

  /**
   * Wertet eine Antwort der Übung aus. Falsch beantwortete Aufgaben kommen am
   * Ende noch einmal (jede höchstens einmal, damit die Übung kurz bleibt).
   * Liefert true/false oder null, wenn die Aufgabe schon beantwortet ist.
   */
  function uebungsAntwort(uebung, richtig) {
    var a = uebungsAufgabe(uebung);
    if (!a || uebung.gesperrt) return null;
    uebung.gesperrt = true;
    if (!richtig && !a.wiederholung) uebung.aufgaben.push({ note: a.note, art: a.art, wiederholung: true });
    return !!richtig;
  }

  /** Nächste Aufgabe der Übung; { beendet } oder null bei doppeltem Aufruf. */
  function uebungWeiter(uebung) {
    if (uebung.beendet || !uebung.gesperrt) return null;
    uebung.nr += 1;
    uebung.gesperrt = false;
    uebung.beendet = uebung.nr >= uebung.aufgaben.length;
    return { beendet: uebung.beendet };
  }

  /* ---------- Notenflug ---------- */

  var NOTENFLUG = {
    notenProLevel: 10,
    startFlugzeit: 8000,   // Millisekunden im ersten Level
    tempoFaktor: 1.15,     // jedes Level etwa 15 % schneller
    leben: 3,
    maxSterne: 3
  };

  /** Flugzeit einer Note in Millisekunden für ein Level (ab 1). */
  function flugzeit(level) {
    return NOTENFLUG.startFlugzeit / Math.pow(NOTENFLUG.tempoFaktor, Math.max(1, level) - 1);
  }

  /**
   * Neuer Notenflug. `notenAnzahl` = Zahl der gewählten Noten, sie bestimmt
   * mit dem Level die Punkte (siehe flugPunkteProNote).
   */
  function neuerFlug(notenAnzahl) {
    return { level: 1, imLevel: 0, punkte: 0, richtige: 0, fehler: 0, levelGeschafft: 0, beendet: false,
      notenAnzahl: notenAnzahl >= 1 ? Math.floor(notenAnzahl) : 1 };
  }

  /**
   * Punkte pro richtiger Note nach Schwierigkeit: Level × Anzahl der gewählten
   * Noten. C, D, E auf Level 1 = 3 Punkte, auf Level 3 = 9 Punkte.
   */
  function flugPunkteProNote(flug, level) {
    return (level || flug.level) * flug.notenAnzahl;
  }

  /**
   * Verbucht eine Note im Notenflug: richtig, falsch oder zu spät (richtig = false).
   * Liefert { levelGeschafft, beendet } oder null, wenn das Spiel schon vorbei ist.
   */
  function flugAntwort(flug, richtig) {
    if (flug.beendet) return null;
    if (richtig) {
      flug.punkte += flugPunkteProNote(flug);
      flug.richtige += 1;
    } else {
      flug.fehler += 1;
    }
    flug.imLevel += 1;
    if (flug.fehler >= NOTENFLUG.leben) {
      flug.beendet = true;
      return { levelGeschafft: false, beendet: true };
    }
    if (flug.imLevel >= NOTENFLUG.notenProLevel) {
      flug.levelGeschafft += 1;
      flug.level += 1;
      flug.imLevel = 0;
      return { levelGeschafft: true, beendet: false };
    }
    return { levelGeschafft: false, beendet: false };
  }

  /** Neue Sterne: 1 pro abgeschlossenem Level, höchstens 3. */
  function flugSterne(flug) {
    return Math.min(NOTENFLUG.maxSterne, flug.levelGeschafft);
  }

  /* ---------- Noten-Memory ---------- */

  /**
   * Zwei Stufen: Normal (6 Paare, Raster 3 × 4) und Schwer (10 Paare, Raster 4 × 5).
   * sterne3/sterne2: so viele Züge über der Paarzahl gibt es noch 3 bzw. 2 Sterne.
   */
  var MEMORY = {
    normal: { paare: 6, punkteProPaar: 10, punkteProStern: 10, sterne3: 3, sterne2: 7 },
    schwer: { paare: 10, punkteProPaar: 15, punkteProStern: 20, sterne3: 6, sterne2: 12 }
  };

  function memoryStufe(stufe) { return MEMORY[stufe] || MEMORY.normal; }

  /**
   * Sterne nach Zügen. Normal mit 6 Paaren: bis 9 Züge 3, bis 13 Züge 2, sonst 1.
   * Schwer mit 10 Paaren: bis 16 Züge 3, bis 22 Züge 2, sonst 1.
   * Bei weniger Paaren (kleiner Tonumfang) verschieben sich die Grenzen mit.
   */
  function memorySterne(zuege, paare, stufe) {
    var s = memoryStufe(stufe);
    paare = paare || s.paare;
    if (zuege <= paare + s.sterne3) return 3;
    if (zuege <= paare + s.sterne2) return 2;
    return 1;
  }

  /** Normal 10 pro Paar plus 10 pro Stern (höchstens 90), Schwer 15 plus 20 (höchstens 210). */
  function memoryPunkte(paare, sterne, stufe) {
    var s = memoryStufe(stufe);
    return paare * s.punkteProPaar + sterne * s.punkteProStern;
  }

  /* ---------- Spiel eine Melodie ---------- */

  var MELODIE = { melodienProRunde: 5, melodienProEtappe: 2, minLaenge: 4, maxLaenge: 7, punkteProMelodie: 10, punkteProStern: 10 };

  /*
   * Anfänge bekannter, gemeinfreier Kinderlieder in Dur. `toene` sind Halbtöne
   * über dem Grundton, `dauern` Schläge (1 = Viertel). Die Namen stehen in
   * js/texte.js unter "lied.<id>".
   */
  var LIEDER = [
    { id: "haenschen", toene: [7, 4, 4, 5, 2, 2, 0], dauern: [1, 1, 2, 1, 1, 2, 2] },
    { id: "entchen", toene: [0, 2, 4, 5, 7, 7], dauern: [1, 1, 1, 1, 2, 2] },
    { id: "mary", toene: [4, 2, 0, 2, 4, 4, 4], dauern: [1, 1, 1, 1, 1, 1, 2] },
    { id: "twinkle", toene: [0, 0, 7, 7, 9, 9, 7], dauern: [1, 1, 1, 1, 1, 1, 2] },
    { id: "ode", toene: [4, 4, 5, 7, 7, 5, 4], dauern: [1, 1, 1, 1, 1, 1, 2] },
    { id: "jakob", toene: [0, 2, 4, 0, 0, 2, 4], dauern: [1, 1, 1, 1, 1, 1, 2] }
  ];

  /**
   * Noten eines Schlüssels nach Tonhöhe: { halbton → Note }. Gibt es zu einer
   * Tonhöhe zwei Namen (fis und ges), gilt der Stammton, sonst der erste.
   */
  function notenNachTonhoehe(noten) {
    var karte = {};
    noten.forEach(function (n) {
      var schon = karte[n.halbton];
      if (!schon || (schon.vorzeichen && !n.vorzeichen)) karte[n.halbton] = n;
    });
    return karte;
  }

  function nachSchluessel(noten) {
    var gruppen = {};
    noten.forEach(function (n) { (gruppen[n.schluessel] = gruppen[n.schluessel] || []).push(n); });
    return gruppen;
  }

  /**
   * Alle Lieder, die sich so verschieben lassen, dass jeder Ton in der
   * Notenauswahl eines Schlüssels liegt: [{ lied, noten, dauern }].
   */
  function passendeLieder(noten) {
    var treffer = [];
    var gruppen = nachSchluessel(noten);
    Object.keys(gruppen).forEach(function (sl) {
      var karte = notenNachTonhoehe(gruppen[sl]);
      var hoehen = Object.keys(karte).map(Number);
      if (!hoehen.length) return;
      var tief = Math.min.apply(null, hoehen), hoch = Math.max.apply(null, hoehen);
      LIEDER.forEach(function (lied) {
        for (var grund = tief; grund <= hoch; grund++) {
          var folge = lied.toene.map(function (t) { return karte[grund + t]; });
          if (folge.every(Boolean)) treffer.push({ lied: lied.id, noten: folge, dauern: lied.dauern.slice() });
        }
      });
    });
    return treffer;
  }

  /**
   * Zufällige, singbare Folge aus kleinen Schritten (höchstens zwei Töne der
   * Auswahl weit) in einem Schlüssel, 4 bis 7 Noten.
   */
  function zufallsMelodie(noten, zufall) {
    var gruppen = nachSchluessel(noten);
    var listen = Object.keys(gruppen).map(function (sl) {
      var karte = notenNachTonhoehe(gruppen[sl]);
      return Object.keys(karte).map(Number).sort(function (a, b) { return a - b; }).map(function (h) { return karte[h]; });
    });
    var gute = listen.filter(function (l) { return l.length >= 3; });
    if (!gute.length) gute = listen.sort(function (a, b) { return b.length - a.length; }).slice(0, 1);
    var liste = zufallsElement(gute, zufall);
    var laenge = MELODIE.minLaenge + Math.floor(zufall() * (MELODIE.maxLaenge - MELODIE.minLaenge + 1));
    var schritte = [-2, -1, -1, 1, 1, 2];
    var i = Math.floor(zufall() * liste.length);
    var folge = [liste[i]];
    while (folge.length < laenge) {
      if (liste.length > 1) {
        var s = zufallsElement(schritte, zufall);
        if (i + s < 0 || i + s >= liste.length) s = -s;
        i = Math.max(0, Math.min(liste.length - 1, i + s));
      }
      folge.push(liste[i]);
    }
    var dauern = folge.map(function () { return 1; });
    dauern[dauern.length - 1] = 2;
    return { lied: null, noten: folge, dauern: dauern };
  }

  /**
   * Melodien für eine Runde: zuerst verschiedene passende Lieder (in zufälliger
   * Lage), fehlende Plätze füllen zufällige Folgen aus kleinen Schritten.
   * Jede Melodie: { lied (Kennung oder null), noten, dauern }.
   * `anzahl` ist ohne Angabe MELODIE.melodienProRunde.
   */
  function neueMelodien(noten, zufall, anzahl) {
    zufall = zufall || Math.random;
    anzahl = anzahl || MELODIE.melodienProRunde;
    var nachLied = {};
    passendeLieder(noten).forEach(function (m) { (nachLied[m.lied] = nachLied[m.lied] || []).push(m); });
    var lieder = Object.keys(nachLied).map(function (id) { return zufallsElement(nachLied[id], zufall); });
    // mischen (Fisher-Yates)
    for (var i = lieder.length - 1; i > 0; i--) {
      var j = Math.floor(zufall() * (i + 1));
      var t = lieder[i]; lieder[i] = lieder[j]; lieder[j] = t;
    }
    var melodien = lieder.slice(0, anzahl);
    while (melodien.length < anzahl) melodien.push(zufallsMelodie(noten, zufall));
    return melodien;
  }

  /** Sterne nach Fehlern der ganzen Runde: 0–2 Fehler 3 Sterne, bis 5 Fehler 2, sonst 1. */
  function melodieSterne(fehler) {
    if (fehler <= 2) return 3;
    if (fehler <= 5) return 2;
    return 1;
  }

  function melodiePunkte(melodien, sterne) {
    return melodien * MELODIE.punkteProMelodie + sterne * MELODIE.punkteProStern;
  }

  /* ---------- Spielstand ---------- */

  function leererSpielstand() {
    return {
      version: 2,
      sterne: 0,
      tier: "fuchs",
      entdeckt: ["fuchs"],
      rekorde: {},
      schwierig: [],
      zaehler: 0,
      namen: [],
      einstellungen: null,
      sprache: null,                 // "de" oder "en"; null = beim Laden nach der Browsersprache wählen
      naechstes: null,               // Kennung des nächsten Tiers (Silhouette im Ergebnis), null = noch nicht gewählt
      memoryStufe: "normal",         // zuletzt gewählte Stufe im Noten-Memory: "normal" oder "schwer"
      reise: { tag: "", serie: 0 }   // Tägliche Notenreise: letzter geschaffter Tag, Tagesserie
    };
  }

  function istZahl(x) { return typeof x === "number" && isFinite(x) && x >= 0; }

  /** Kürzt und säubert einen eingegebenen Namen. Leer bedeutet „Ohne Namen“. */
  function bereinigeName(name) {
    if (typeof name !== "string") return "";
    return name.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_LAENGE).trim();
  }

  function bereinigeRekorde(liste) {
    if (!Array.isArray(liste)) return [];
    var ergebnis = liste.filter(function (r) {
      return r && istZahl(r.gesamt) && istZahl(r.sterne) && istZahl(r.zeit);
    }).map(function (r) {
      var e = { gesamt: r.gesamt, sterne: r.sterne, zeit: r.zeit, nr: istZahl(r.nr) ? r.nr : 0 };
      // Alte Rekorde haben kein Feld `name` und zeigen keinen Namen.
      if (typeof r.name === "string") e.name = bereinigeName(r.name);
      // Variante des Spiels, zum Beispiel Noten-Memory „Schwer“ (fehlt bei allen anderen).
      if (r.variante === "schwer") e.variante = r.variante;
      return e;
    });
    return sortiereRekorde(ergebnis).slice(0, REGELN.maxRekorde);
  }

  // Alte Notenkennungen wie "violin-C4" → "violin-c1".
  function neueNotenId(id) {
    var m = /^(violin|bass)-([A-H])(\d)$/.exec(id);
    if (!m) return id;
    var oktave = Number(m[3]);
    var b = m[2].toLowerCase();
    if (oktave <= 2) return m[1] + "-" + m[2];
    return m[1] + "-" + b + (oktave === 3 ? "" : oktave - 3);
  }

  /**
   * Übernimmt nur Felder mit gültigem Typ. Neue Form: schluessel als Liste,
   * noten als Liste von Notenkennungen. Alte Form (schluessel als Text,
   * bereich je Schlüssel) bleibt erhalten; Noten.einstellungen übersetzt sie
   * mit den Bereichen aus js/noten-konfiguration.js in Notenlisten.
   */
  function bereinigeEinstellungen(roh) {
    if (!roh || typeof roh !== "object") return null;
    var e = {};
    if (Array.isArray(roh.schluessel)) {
      e.schluessel = roh.schluessel.filter(function (s) { return s === "violin" || s === "bass"; });
    } else if (["violin", "bass", "beide"].indexOf(roh.schluessel) !== -1) {
      e.schluessel = roh.schluessel;
    }
    if (Array.isArray(roh.noten)) {
      e.noten = roh.noten.filter(function (id) {
        return typeof id === "string" && /^(violin|bass)-[a-hA-H](?:is|es|s)?\d?$/.test(id);
      }).slice(0, 100);
    } else if (roh.bereich && typeof roh.bereich === "object") {
      e.bereich = {};
      if (typeof roh.bereich.violin === "string") e.bereich.violin = roh.bereich.violin;
      if (typeof roh.bereich.bass === "string") e.bereich.bass = roh.bereich.bass;
    }
    if (typeof roh.merktiere === "boolean") e.merktiere = roh.merktiere;
    if (roh.antwortmodus === "einfach" || roh.antwortmodus === "genau") e.antwortmodus = roh.antwortmodus;
    return e;
  }

  function tierVon(id) {
    for (var i = 0; i < TIERE.length; i++) if (TIERE[i].id === id) return TIERE[i];
    return null;
  }

  /** So viele Tiere stehen bei dieser Sternzahl zu: Füchschen plus eins je 5 Sterne. */
  function sollTiere(sterne) {
    return 1 + Math.floor(sterne / STERNE_PRO_TIER);
  }

  /** Noch nicht entdeckte Tiere, die bei dieser Sternzahl kommen dürfen. */
  function tierTopf(stand) {
    return TIERE.filter(function (t) {
      return stand.entdeckt.indexOf(t.id) === -1 && (!t.selten || stand.sterne >= SELTEN_AB_STERNEN);
    });
  }

  /**
   * Ergänzt noch nicht entdeckte Tiere, bis die Anzahl zur Sternzahl passt.
   * Seltene Tiere kommen erst ab 50 Sternen in den Topf. Als Nächstes kommt
   * das vorgemerkte Tier `stand.naechstes` (seine Silhouette zeigt das
   * Ergebnis), danach wird zufällig ein neues vorgemerkt.
   * Liefert die neu entdeckten Tiere.
   */
  function ergaenzeTiere(stand, zufall) {
    zufall = zufall || Math.random;
    var neu = [];
    var topf;
    while (stand.entdeckt.length < sollTiere(stand.sterne)) {
      topf = tierTopf(stand);
      if (topf.length === 0) break;
      var tier = topf.indexOf(tierVon(stand.naechstes)) !== -1 ? tierVon(stand.naechstes)
        : topf[Math.floor(zufall() * topf.length) % topf.length];
      stand.entdeckt.push(tier.id);
      stand.naechstes = null;
      neu.push(tier);
    }
    topf = tierTopf(stand);
    if (topf.indexOf(tierVon(stand.naechstes)) === -1) {
      stand.naechstes = topf.length ? topf[Math.floor(zufall() * topf.length) % topf.length].id : null;
    }
    return neu;
  }

  /**
   * Weg zum nächsten Tier oder null, wenn alle entdeckt sind:
   * { fehlend, gesammelt, schritt, id } – gesammelt von schritt Sternen
   * (zum Beispiel 2 von 5), id = vorgemerktes Tier oder null.
   */
  function naechstesTier(stand) {
    if (stand.entdeckt.length >= TIERE.length) return null;
    var schwelle = stand.entdeckt.length * STERNE_PRO_TIER;
    var fehlend = Math.max(1, schwelle - stand.sterne);
    return {
      fehlend: fehlend,
      gesammelt: Math.max(0, STERNE_PRO_TIER - fehlend),
      schritt: STERNE_PRO_TIER,
      id: tierVon(stand.naechstes) ? stand.naechstes : null
    };
  }

  /**
   * Übernimmt nur gültige Werte aus gespeicherten Daten und migriert alte
   * Spielstände (Version 1): Rekorde gehören dann zum klassischen Modus,
   * Häschen und Kätzchen bleiben, fehlende Tiere werden zufällig ergänzt.
   */
  function bereinigeSpielstand(roh, zufall) {
    var stand = leererSpielstand();
    if (!roh || typeof roh !== "object") return stand;
    if (istZahl(roh.sterne)) stand.sterne = Math.floor(roh.sterne);
    if (istZahl(roh.zaehler)) stand.zaehler = Math.floor(roh.zaehler);

    if (Array.isArray(roh.rekorde)) {
      stand.rekorde.klassisch = bereinigeRekorde(roh.rekorde);
    } else if (roh.rekorde && typeof roh.rekorde === "object") {
      Object.keys(roh.rekorde).forEach(function (modus) {
        if (/^[a-z0-9-]{1,30}$/.test(modus)) {
          var liste = bereinigeRekorde(roh.rekorde[modus]);
          if (liste.length) stand.rekorde[modus] = liste;
        }
      });
    }

    if (Array.isArray(roh.schwierig)) {
      stand.schwierig = roh.schwierig.filter(function (id) { return typeof id === "string"; })
        .map(neueNotenId).slice(0, 20);
    }

    if (Array.isArray(roh.entdeckt)) {
      roh.entdeckt.forEach(function (id) {
        if (tierVon(id) && stand.entdeckt.indexOf(id) === -1) stand.entdeckt.push(id);
      });
    } else {
      // Version 1: Häschen ab 5, Kätzchen ab 10 Sternen.
      if (stand.sterne >= 5) stand.entdeckt.push("hase");
      if (stand.sterne >= 10) stand.entdeckt.push("katze");
    }
    // Vorgemerktes nächstes Tier (fehlt in älteren Spielständen, ergaenzeTiere wählt dann eins).
    if (typeof roh.naechstes === "string" && tierVon(roh.naechstes) && stand.entdeckt.indexOf(roh.naechstes) === -1) {
      stand.naechstes = roh.naechstes;
    }
    ergaenzeTiere(stand, zufall);

    if (typeof roh.tier === "string" && stand.entdeckt.indexOf(roh.tier) !== -1) stand.tier = roh.tier;

    if (Array.isArray(roh.namen)) {
      roh.namen.forEach(function (n) {
        n = bereinigeName(n);
        if (n && stand.namen.indexOf(n) === -1 && stand.namen.length < MAX_NAMEN) stand.namen.push(n);
      });
    }
    stand.einstellungen = bereinigeEinstellungen(roh.einstellungen);
    // Ältere Spielstände haben keine Sprache; die App wählt sie dann nach der Browsersprache.
    if (roh.sprache === "de" || roh.sprache === "en") stand.sprache = roh.sprache;
    // Ältere Spielstände haben keine Memory-Stufe und beginnen mit „normal“.
    if (roh.memoryStufe === "schwer") stand.memoryStufe = "schwer";
    // Ältere Spielstände haben kein Feld `reise` und beginnen ohne Tagesserie.
    if (roh.reise && typeof roh.reise.tag === "string" && /^\d{4}-\d{2}-\d{2}$/.test(roh.reise.tag) && istZahl(roh.reise.serie)) {
      stand.reise = { tag: roh.reise.tag, serie: Math.floor(roh.reise.serie) };
    }
    return stand;
  }

  function sortiereRekorde(rekorde) {
    return rekorde.slice().sort(function (a, b) {
      return (b.gesamt - a.gesamt) || (b.sterne - a.sterne) || (b.zeit - a.zeit) || ((b.nr || 0) - (a.nr || 0));
    });
  }

  /* ---------- Tägliche Notenreise ---------- */

  function zweistellig(n) { return (n < 10 ? "0" : "") + n; }

  /** Lokales Kalenderdatum als "JJJJ-MM-TT". */
  function lokalesDatum(zeit) {
    var d = new Date(zeit);
    return d.getFullYear() + "-" + zweistellig(d.getMonth() + 1) + "-" + zweistellig(d.getDate());
  }

  function vortag(tag) {
    var t = tag.split("-").map(Number);
    return lokalesDatum(new Date(t[0], t[1] - 1, t[2] - 1, 12).getTime());
  }

  /** { heute: schon geschafft?, serie: Tage in Folge, die noch zählen } */
  function tagesreiseStatus(stand, zeit) {
    var heute = lokalesDatum(zeit);
    var r = (stand && stand.reise) || { tag: "", serie: 0 };
    if (r.tag === heute) return { heute: true, serie: r.serie };
    if (r.tag && r.tag === vortag(heute)) return { heute: false, serie: r.serie };
    return { heute: false, serie: 0 };
  }

  /**
   * Verbucht eine geschaffte Reise: Extrastern höchstens einmal pro
   * Kalendertag, Serie +1 nach dem Vortag, sonst neu bei 1. Ändert `stand`.
   */
  function verbucheTagesreise(stand, zeit) {
    var heute = lokalesDatum(zeit);
    var r = stand.reise || { tag: "", serie: 0 };
    if (r.tag === heute) return { extrastern: false, serie: r.serie };
    var serie = r.tag && r.tag === vortag(heute) ? r.serie + 1 : 1;
    stand.reise = { tag: heute, serie: serie };
    stand.sterne += 1;
    return { extrastern: true, serie: serie };
  }

  /**
   * Verbucht das Ergebnis eines beliebigen Modus im Spielstand:
   * Sterne in die gemeinsame Sammlung, Rekord in die Liste des Modus,
   * neue Tiere, schwierige Noten. Ändert `stand` nicht, sondern liefert
   * { stand, neueTiere, rekord, tagesreise } mit rekord = { modus, nr, platz }
   * oder null. Bei e.tagesreise = true kommt der Extrastern der Notenreise
   * dazu (höchstens einmal pro Tag), tagesreise = { extrastern, serie }.
   */
  function verbucheErgebnis(stand, modus, e, zeit, zufall) {
    var neu = bereinigeSpielstand(stand, zufall);
    var neueSterne = istZahl(e.neueSterne) ? Math.floor(e.neueSterne) : 0;
    neu.sterne += neueSterne;
    neu.zaehler += 1;
    var eintrag = {
      gesamt: istZahl(e.gesamt) ? e.gesamt : 0,
      sterne: istZahl(e.rekordSterne) ? e.rekordSterne : neueSterne,
      zeit: zeit,
      nr: neu.zaehler,
      name: ""
    };
    if (e.variante === "schwer") eintrag.variante = e.variante;
    var liste = sortiereRekorde((neu.rekorde[modus] || []).concat([eintrag]));
    var platz = liste.indexOf(eintrag);
    neu.rekorde[modus] = liste.slice(0, REGELN.maxRekorde);

    if (e.schwierig) {
      var gefragt = {};
      (e.schwierig.gefragt || []).forEach(function (id) { gefragt[id] = true; });
      var schwierig = neu.schwierig.filter(function (id) { return !gefragt[id]; });
      (e.schwierig.neu || []).forEach(function (id) { if (schwierig.indexOf(id) === -1) schwierig.push(id); });
      neu.schwierig = schwierig.slice(0, 20);
    }

    var tagesreise = e.tagesreise ? verbucheTagesreise(neu, zeit) : null;
    var neueTiere = ergaenzeTiere(neu, zufall);
    return {
      stand: neu,
      neueTiere: neueTiere,
      tagesreise: tagesreise,
      rekord: platz < REGELN.maxRekorde ? { modus: modus, nr: eintrag.nr, platz: platz } : null
    };
  }

  /** Trägt einen Namen in einen Rekord ein und merkt ihn als zuletzt benutzt. */
  function setzeRekordName(stand, modus, nr, name) {
    name = bereinigeName(name);
    (stand.rekorde[modus] || []).forEach(function (r) { if (r.nr === nr) r.name = name; });
    if (name) {
      stand.namen = [name].concat(stand.namen.filter(function (n) { return n !== name; })).slice(0, MAX_NAMEN);
    }
    return name;
  }

  var api = {
    REGELN: REGELN,
    TIERE: TIERE,
    STERNE_PRO_TIER: STERNE_PRO_TIER,
    SELTEN_AB_STERNEN: SELTEN_AB_STERNEN,
    NAME_LAENGE: NAME_LAENGE,
    positionsSchluessel: positionsSchluessel,
    neueRunde: neueRunde,
    istRichtig: istRichtig,
    antworte: antworte,
    weiter: weiter,
    ergebnis: ergebnis,
    klassischesErgebnis: klassischesErgebnis,
    UEBUNG: UEBUNG,
    uebungsNoten: uebungsNoten,
    neueUebung: neueUebung,
    uebungsAufgabe: uebungsAufgabe,
    uebungsAntwort: uebungsAntwort,
    uebungWeiter: uebungWeiter,
    NOTENFLUG: NOTENFLUG,
    flugzeit: flugzeit,
    neuerFlug: neuerFlug,
    flugAntwort: flugAntwort,
    flugPunkteProNote: flugPunkteProNote,
    flugSterne: flugSterne,
    MEMORY: MEMORY,
    memoryStufe: memoryStufe,
    memorySterne: memorySterne,
    memoryPunkte: memoryPunkte,
    MELODIE: MELODIE,
    LIEDER: LIEDER,
    neueMelodien: neueMelodien,
    melodieSterne: melodieSterne,
    melodiePunkte: melodiePunkte,
    leererSpielstand: leererSpielstand,
    bereinigeSpielstand: bereinigeSpielstand,
    bereinigeEinstellungen: bereinigeEinstellungen,
    bereinigeName: bereinigeName,
    sortiereRekorde: sortiereRekorde,
    tierVon: tierVon,
    ergaenzeTiere: ergaenzeTiere,
    naechstesTier: naechstesTier,
    verbucheErgebnis: verbucheErgebnis,
    lokalesDatum: lokalesDatum,
    tagesreiseStatus: tagesreiseStatus,
    setzeRekordName: setzeRekordName
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SpielLogik = api;
})(typeof self !== "undefined" ? self : this);
