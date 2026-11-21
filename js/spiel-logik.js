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

  var TIERE = [
    { id: "fuchs", name: "Füchschen", sterne: 0 },
    { id: "hase", name: "Häschen", sterne: 5 },
    { id: "katze", name: "Kätzchen", sterne: 10 }
  ];

  var ZAHLWORTE = { 3: "Drei", 6: "Sechs", 9: "Neun" };

  /* ---------- Konfiguration ---------- */

  function istGueltigeNote(n) {
    return n && typeof n.id === "string" && n.id &&
      typeof n.schluessel === "string" &&
      typeof n.position === "number" && isFinite(n.position) &&
      Math.round(n.position) === n.position &&
      typeof n.name === "string" && n.name &&
      typeof n.hinweis === "string";
  }

  /** Liefert die Noten des aktiven Übungssatzes in der konfigurierten Reihenfolge. */
  function aktiveNoten(konfiguration) {
    if (!konfiguration || !Array.isArray(konfiguration.noten)) return [];
    var nachId = {};
    konfiguration.noten.forEach(function (n) {
      if (istGueltigeNote(n) && !nachId[n.id]) nachId[n.id] = n;
    });
    var saetze = konfiguration.uebungssaetze || {};
    var satz = saetze[konfiguration.aktiverUebungssatz];
    if (!satz || !Array.isArray(satz.noten)) return [];
    var gesehen = {};
    var ergebnis = [];
    satz.noten.forEach(function (id) {
      if (nachId[id] && !gesehen[id]) {
        gesehen[id] = true;
        ergebnis.push(nachId[id]);
      }
    });
    return ergebnis;
  }

  function positionsSchluessel(note) {
    return note.schluessel + ":" + note.position;
  }

  /* ---------- Runde ---------- */

  function neueRunde(noten, optionen) {
    optionen = optionen || {};
    if (!noten || noten.length === 0) throw new Error("Der Übungssatz enthält keine Noten.");
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
   * Nimmt genau eine Antwort pro Aufgabe an. Weitere Antworten liefern null,
   * bis `weiter()` die nächste Aufgabe öffnet.
   */
  function antworte(runde, id) {
    if (runde.beendet || runde.gesperrt || !runde.aktuell) return null;
    runde.gesperrt = true;
    var note = runde.aktuell.note;
    var richtig = id === note.id;
    runde.verlauf.push({ note: note, antwort: id, richtig: richtig, wiederholung: runde.aktuell.wiederholung });

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
      antwort: id,
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

  /* ---------- Spielstand ---------- */

  function leererSpielstand() {
    return { version: 1, sterne: 0, tier: "fuchs", rekorde: [], schwierig: [], zaehler: 0 };
  }

  function istZahl(x) { return typeof x === "number" && isFinite(x) && x >= 0; }

  /** Übernimmt nur gültige Werte aus gespeicherten Daten. */
  function bereinigeSpielstand(roh) {
    var stand = leererSpielstand();
    if (!roh || typeof roh !== "object") return stand;
    if (istZahl(roh.sterne)) stand.sterne = Math.floor(roh.sterne);
    if (istZahl(roh.zaehler)) stand.zaehler = Math.floor(roh.zaehler);
    if (Array.isArray(roh.rekorde)) {
      stand.rekorde = roh.rekorde.filter(function (r) {
        return r && istZahl(r.gesamt) && istZahl(r.sterne) && istZahl(r.zeit);
      }).map(function (r) {
        return { gesamt: r.gesamt, sterne: r.sterne, zeit: r.zeit, nr: istZahl(r.nr) ? r.nr : 0 };
      });
      stand.rekorde = sortiereRekorde(stand.rekorde).slice(0, REGELN.maxRekorde);
    }
    if (Array.isArray(roh.schwierig)) {
      stand.schwierig = roh.schwierig.filter(function (id) { return typeof id === "string"; }).slice(0, 20);
    }
    if (typeof roh.tier === "string" && freigeschalteteTiere(stand.sterne).some(function (t) { return t.id === roh.tier; })) {
      stand.tier = roh.tier;
    }
    return stand;
  }

  function sortiereRekorde(rekorde) {
    return rekorde.slice().sort(function (a, b) {
      return (b.gesamt - a.gesamt) || (b.sterne - a.sterne) || (b.zeit - a.zeit) || ((b.nr || 0) - (a.nr || 0));
    });
  }

  function freigeschalteteTiere(sterne) {
    return TIERE.filter(function (t) { return sterne >= t.sterne; });
  }

  function naechstesTier(sterne) {
    for (var i = 0; i < TIERE.length; i++) {
      if (TIERE[i].sterne > sterne) return { tier: TIERE[i], fehlend: TIERE[i].sterne - sterne };
    }
    return null;
  }

  /**
   * Verbucht eine beendete Runde genau einmal im Spielstand.
   * Liefert den neuen Spielstand und neu freigeschaltete Tiere,
   * oder null, wenn die Runde schon verbucht oder nicht beendet ist.
   */
  function verbucheRunde(stand, runde, zeit) {
    if (!runde.beendet || runde.verbucht) return null;
    runde.verbucht = true;
    var e = ergebnis(runde);
    var neu = bereinigeSpielstand(stand);
    var vorher = freigeschalteteTiere(neu.sterne).map(function (t) { return t.id; });
    neu.sterne += e.neueSterne;
    neu.zaehler += 1;
    neu.rekorde = sortiereRekorde(neu.rekorde.concat([{ gesamt: e.gesamt, sterne: e.neueSterne, zeit: zeit, nr: neu.zaehler }]))
      .slice(0, REGELN.maxRekorde);
    // Schwierige Noten: in dieser Runde abgefragte Vorrang-Noten sind erledigt,
    // neue Überträge kommen hinzu.
    var gefragt = {};
    runde.verlauf.forEach(function (v) { gefragt[v.note.id] = true; });
    var schwierig = neu.schwierig.filter(function (id) { return !gefragt[id]; });
    e.uebertrag.forEach(function (id) { if (schwierig.indexOf(id) === -1) schwierig.push(id); });
    neu.schwierig = schwierig.slice(0, 20);
    var neueTiere = freigeschalteteTiere(neu.sterne).filter(function (t) { return vorher.indexOf(t.id) === -1; });
    return { stand: neu, ergebnis: e, neueTiere: neueTiere };
  }

  var api = {
    REGELN: REGELN,
    TIERE: TIERE,
    aktiveNoten: aktiveNoten,
    positionsSchluessel: positionsSchluessel,
    neueRunde: neueRunde,
    antworte: antworte,
    weiter: weiter,
    ergebnis: ergebnis,
    leererSpielstand: leererSpielstand,
    bereinigeSpielstand: bereinigeSpielstand,
    sortiereRekorde: sortiereRekorde,
    freigeschalteteTiere: freigeschalteteTiere,
    naechstesTier: naechstesTier,
    verbucheRunde: verbucheRunde
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SpielLogik = api;
})(typeof self !== "undefined" ? self : this);
