/*
 * Spiellogik ohne Bezug zur Oberfläche: Rundenablauf, Wertung,
 * Wiederholung schwieriger Noten, Rekorde und Tiere.
 * Läuft im Browser (window.SpielLogik) und in Node (für die Tests).
 */
(function (root) {
  "use strict";

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
   */
  var TIERE = [
    { id: "fuchs", name: "Füchschen" },
    { id: "hase", name: "Häschen" },
    { id: "katze", name: "Kätzchen" },
    { id: "hund", name: "Hündchen" },
    { id: "baer", name: "Bärchen" },
    { id: "panda", name: "Panda" },
    { id: "pinguin", name: "Pinguin" },
    { id: "eule", name: "Eule" },
    { id: "igel", name: "Igel" },
    { id: "eichhoernchen", name: "Eichhörnchen" },
    { id: "schildkroete", name: "Schildkröte" },
    { id: "koala", name: "Koala" },
    { id: "loewe", name: "Löwe" },
    { id: "tiger", name: "Tiger" },
    { id: "waschbaer", name: "Waschbär" },
    { id: "schaf", name: "Schäfchen" },
    { id: "schwein", name: "Schweinchen" },
    { id: "kueken", name: "Küken" },
    { id: "otter", name: "Otter" },
    { id: "faultier", name: "Faultier" },
    { id: "maus", name: "Maus" },
    { id: "kuh", name: "Kuh" },
    { id: "einhorn", name: "Einhorn", selten: true },
    { id: "drache", name: "Drache", selten: true },
    { id: "phoenix", name: "Phönix", selten: true }
  ];
  var STERNE_PRO_TIER = 5;
  var SELTEN_AB_STERNEN = 50;
  var MAX_NAMEN = 6;
  var NAME_LAENGE = 20;

  var ZAHLWORTE = { 3: "Drei", 6: "Sechs", 9: "Neun" };

  function positionsSchluessel(note) {
    return note.schluessel + ":" + note.position;
  }

  /* ---------- Runde ---------- */

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
      aufgabe: 0,              // Index der aktuellen Aufgabe, 0 bis 9
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
      vorzeitig: false,
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
    var letzte = REGELN.aufgabenProRunde - 1;
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

  function rueckmeldung(richtig, note, serie, zufall) {
    if (!richtig) {
      return "Das ist " + note.name + ". " + note.hinweis;
    }
    if (serie > 0 && serie % 3 === 0) {
      return (ZAHLWORTE[serie] || String(serie)) + " Richtige in Folge!";
    }
    var lob = [
      "Genau, das ist " + note.name + "!",
      "Super, " + note.name + " stimmt!",
      "Richtig, das ist " + note.name + "!"
    ];
    return zufallsElement(lob, zufall || Math.random);
  }

  /**
   * Nimmt genau eine Antwort pro Aufgabe an. `name` ist der getippte
   * Notenname, zum Beispiel "c1". Weitere Antworten liefern null,
   * bis `weiter()` die nächste Aufgabe öffnet.
   */
  function antworte(runde, name) {
    if (runde.beendet || runde.gesperrt || !runde.aktuell) return null;
    runde.gesperrt = true;
    var note = runde.aktuell.note;
    var richtig = name === note.name;
    runde.verlauf.push({ note: note, antwort: name, richtig: richtig, wiederholung: runde.aktuell.wiederholung });

    if (richtig) {
      runde.punkte += REGELN.punkteProRichtig;
      runde.richtige += 1;
      runde.serie += 1;
    } else {
      runde.serie = 0;
      runde.fehler += 1;
      runde.sterne = Math.max(0, runde.sterne - 1);
      if (runde.fehler >= REGELN.startSterne) merkeUebertrag(runde, note.id);
      else planeWiederholung(runde, note.id);
    }

    var rundeVorbei = runde.fehler >= REGELN.startSterne || runde.aufgabe >= REGELN.aufgabenProRunde - 1;
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
      runde.vorzeitig = runde.fehler >= REGELN.startSterne;
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
      schwierig: { gefragt: gefragt, neu: e.uebertrag }
    };
  }

  /* ---------- Spielstand ---------- */

  function standardEinstellungen() {
    return { schluessel: "violin", bereich: { violin: "erste", bass: "erste" }, merktiere: true };
  }

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
      einstellungen: null
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

  function bereinigeEinstellungen(roh) {
    if (!roh || typeof roh !== "object") return null;
    var e = standardEinstellungen();
    if (["violin", "bass", "beide"].indexOf(roh.schluessel) !== -1) e.schluessel = roh.schluessel;
    if (roh.bereich && typeof roh.bereich === "object") {
      if (typeof roh.bereich.violin === "string") e.bereich.violin = roh.bereich.violin;
      if (typeof roh.bereich.bass === "string") e.bereich.bass = roh.bereich.bass;
    }
    if (typeof roh.merktiere === "boolean") e.merktiere = roh.merktiere;
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

  /**
   * Ergänzt zufällig noch nicht entdeckte Tiere, bis die Anzahl zur
   * Sternzahl passt. Seltene Tiere kommen erst ab 50 Sternen in den Topf.
   * Liefert die neu entdeckten Tiere.
   */
  function ergaenzeTiere(stand, zufall) {
    zufall = zufall || Math.random;
    var neu = [];
    while (stand.entdeckt.length < sollTiere(stand.sterne)) {
      var topf = TIERE.filter(function (t) {
        return stand.entdeckt.indexOf(t.id) === -1 && (!t.selten || stand.sterne >= SELTEN_AB_STERNEN);
      });
      if (topf.length === 0) break;
      var tier = topf[Math.floor(zufall() * topf.length) % topf.length];
      stand.entdeckt.push(tier.id);
      neu.push(tier);
    }
    return neu;
  }

  /** Sterne bis zum nächsten Tier, oder null, wenn alle entdeckt sind. */
  function naechstesTier(stand) {
    if (stand.entdeckt.length >= TIERE.length) return null;
    var schwelle = stand.entdeckt.length * STERNE_PRO_TIER;
    return { fehlend: Math.max(1, schwelle - stand.sterne) };
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
    ergaenzeTiere(stand, zufall);

    if (typeof roh.tier === "string" && stand.entdeckt.indexOf(roh.tier) !== -1) stand.tier = roh.tier;

    if (Array.isArray(roh.namen)) {
      roh.namen.forEach(function (n) {
        n = bereinigeName(n);
        if (n && stand.namen.indexOf(n) === -1 && stand.namen.length < MAX_NAMEN) stand.namen.push(n);
      });
    }
    stand.einstellungen = bereinigeEinstellungen(roh.einstellungen);
    return stand;
  }

  function sortiereRekorde(rekorde) {
    return rekorde.slice().sort(function (a, b) {
      return (b.gesamt - a.gesamt) || (b.sterne - a.sterne) || (b.zeit - a.zeit) || ((b.nr || 0) - (a.nr || 0));
    });
  }

  /**
   * Verbucht das Ergebnis eines beliebigen Modus im Spielstand:
   * Sterne in die gemeinsame Sammlung, Rekord in die Liste des Modus,
   * neue Tiere, schwierige Noten. Ändert `stand` nicht, sondern liefert
   * { stand, neueTiere, rekord } mit rekord = { modus, nr, platz } oder null.
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

    var neueTiere = ergaenzeTiere(neu, zufall);
    return {
      stand: neu,
      neueTiere: neueTiere,
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
    antworte: antworte,
    weiter: weiter,
    ergebnis: ergebnis,
    klassischesErgebnis: klassischesErgebnis,
    leererSpielstand: leererSpielstand,
    bereinigeSpielstand: bereinigeSpielstand,
    bereinigeEinstellungen: bereinigeEinstellungen,
    bereinigeName: bereinigeName,
    sortiereRekorde: sortiereRekorde,
    tierVon: tierVon,
    ergaenzeTiere: ergaenzeTiere,
    naechstesTier: naechstesTier,
    verbucheErgebnis: verbucheErgebnis,
    setzeRekordName: setzeRekordName
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SpielLogik = api;
})(typeof self !== "undefined" ? self : this);
